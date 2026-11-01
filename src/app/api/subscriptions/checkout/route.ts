import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SAAS_PLANS } from '@/config/plans';
import { getLocale, getMessages } from '@/i18n/server';
import { commonMessages } from '@/i18n/messages/common';
import { checkoutMessages } from '@/i18n/messages/subscription';
import {
  authenticatePaymob,
  createPaymobOrder,
  generatePaymentKey,
  initiateWalletPayment,
  buildCardIframeUrl,
  encodeMerchantOrderId,
  paymobConfig,
} from '@/lib/paymob';
import { errorText } from '@/lib/errors';

// ==============================================================================
// POST /api/subscriptions/checkout
// Egyptian Payment Gateway Integration (Paymob Accept)
// Flow:
// 1. Authenticate with Paymob (/auth/tokens)
// 2. Register Order with Paymob (/ecommerce/orders)
// 3. Request Payment Key (/acceptance/payment_keys)
// 4. If Mobile Wallet (Vodafone Cash): Initiate wallet pay (/acceptance/payments/pay)
//    If Card: Return Paymob iframe checkout link
// ==============================================================================

export async function POST(req: NextRequest) {
  const locale = getLocale();
  const t = getMessages(checkoutMessages);
  const brand = getMessages(commonMessages).brand;

  try {
    const session = await getSession();

    if (!session || (session.role !== 'CENTER' && session.role !== 'TEACHER')) {
      return NextResponse.json(
        {
          success: false,
          error: t.unauthorized,
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      planId,
      paymentMethod = 'CARD', // 'CARD' | 'VODAFONE_CASH'
      billingInterval = 'MONTHLY', // 'MONTHLY' | 'YEARLY'
      walletPhone,
    } = body;

    if (!planId) {
      return NextResponse.json(
        { success: false, error: t.planRequired },
        { status: 400 }
      );
    }

    // 1. Validate plan against SaaS pricing catalog
    const planConfig = SAAS_PLANS[planId];
    if (!planConfig) {
      return NextResponse.json(
        { success: false, error: t.planNotFound(planId) },
        { status: 400 }
      );
    }

    if (planConfig.targetRole !== session.role) {
      return NextResponse.json(
        {
          success: false,
          error: t.roleMismatch(t.roles[planConfig.targetRole], t.roleNames[session.role]),
        },
        { status: 403 }
      );
    }

    // 2. Fetch authenticated User profile
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: t.userNotFound },
        { status: 404 }
      );
    }

    // 3. Fetch Center or Teacher profile entity
    let entityId = '';
    let entityName = '';

    if (session.role === 'CENTER') {
      const center = await prisma.center.findUnique({
        where: { ownerId: session.userId },
        select: { id: true, name: true },
      });
      if (!center) {
        return NextResponse.json(
          { success: false, error: t.centerNotFound },
          { status: 404 }
        );
      }
      entityId = center.id;
      entityName = center.name;
    } else {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      });
      if (!teacher) {
        return NextResponse.json(
          { success: false, error: t.teacherNotFound },
          { status: 404 }
        );
      }
      entityId = teacher.id;
      entityName = user.name;
    }

    // 4. Calculate amount in Egyptian Cents (1 EGP = 100 Cents)
    const amountCents = Math.round(planConfig.priceEGP * 100);

    // 5. Encode domain metadata into merchant_order_id
    const merchantOrderId = encodeMerchantOrderId(
      session.role,
      entityId,
      planId,
      billingInterval as 'MONTHLY' | 'YEARLY'
    );

    // =========================================================================
    // PAYMOB 3-STEP INTEGRATION FLOW
    // =========================================================================

    // Step 1: Authentication Request
    const authToken = await authenticatePaymob();

    // Step 2: Order Registration API
    const orderId = await createPaymobOrder(authToken, {
      amountCents,
      currency: 'EGP',
      merchantOrderId,
      items: [
        {
          name: t.itemName(planConfig.name[locale], brand),
          amount_cents: amountCents,
          description: t.itemDescription(billingInterval === 'YEARLY' ? 'YEARLY' : 'MONTHLY', brand, entityName),
          quantity: 1,
        },
      ],
    });

    // Step 3: Payment Key Request
    const isWallet = paymentMethod === 'VODAFONE_CASH' || paymentMethod === 'WALLET';
    const integrationId = isWallet
      ? paymobConfig.walletIntegrationId || paymobConfig.cardIntegrationId
      : paymobConfig.cardIntegrationId;

    const nameParts = (user.name || 'Linktich User').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Subscriber';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Linktich';

    const targetPhone = isWallet && walletPhone ? walletPhone : user.phone || '+201000000000';

    const paymentKey = await generatePaymentKey({
      authToken,
      amountCents,
      orderId,
      integrationId,
      currency: 'EGP',
      billingData: {
        first_name: firstName,
        last_name: lastName,
        email: user.email,
        phone_number: targetPhone,
        apartment: 'NA',
        floor: 'NA',
        street: 'NA',
        building: 'NA',
        shipping_method: 'PKG',
        postal_code: 'NA',
        city: 'Cairo',
        country: 'EGP',
        state: 'Cairo',
      },
    });

    // =========================================================================
    // DELIVERY: CARD (IFRAME) vs MOBILE WALLET (VODAFONE CASH)
    // =========================================================================

    if (isWallet) {
      // Step 4 for Mobile Wallets: Paymob Wallet Payment API
      const walletRes = await initiateWalletPayment({
        paymentKey,
        walletPhoneNumber: targetPhone,
      });

      return NextResponse.json({
        success: true,
        paymentType: 'REDIRECT',
        paymentMethod: 'VODAFONE_CASH',
        redirectUrl: walletRes.redirect_url || walletRes.iframe_redirection_url,
        orderId,
        paymentKey,
        transactionId: walletRes.transaction_id,
        amountEGP: planConfig.priceEGP,
        planId,
        billingInterval,
        merchantOrderId,
        message: t.walletCreated,
      });
    }

    // Default: Credit/Debit Card via Paymob hosted iframe
    const iframeUrl = buildCardIframeUrl(paymentKey);

    return NextResponse.json({
      success: true,
      paymentType: 'IFRAME',
      paymentMethod: 'CARD',
      iframeUrl,
      orderId,
      paymentKey,
      amountEGP: planConfig.priceEGP,
      planId,
      billingInterval,
      merchantOrderId,
      message: t.cardReady,
    });
  } catch (error: any) {
    console.error('[Paymob Checkout API Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: errorText(error, 'paymentFailed'),
      },
      { status: 400 }
    );
  }
}
