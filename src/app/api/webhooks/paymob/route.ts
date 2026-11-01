import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymobHMAC, decodeMerchantOrderId } from '@/lib/paymob';
import { SubscriptionService } from '@/services/subscriptionService';
import { SubscriptionPlan } from '@prisma/client';

// ==============================================================================
// Linktich - Paymob Transaction Callback & Webhook Endpoint
// Route: /api/webhooks/paymob
// Handles:
// 1. POST: Server-to-server transaction webhook from Paymob Accept
// 2. GET:  Browser transaction redirection callback from Paymob hosted page
// Security: Verifies SHA512 HMAC signature using PAYMOB_HMAC_SECRET
// Idempotency: Atomically activates Center/Teacher subscription and updates expiration
// ==============================================================================

/**
 * Common transaction processor for both POST webhook and GET callback
 */
async function processTransaction(data: any, queryHmac?: string | null) {
  const obj = data.obj ? data.obj : data;

  // 1. Resolve received HMAC
  const receivedHmac =
    queryHmac ||
    data.hmac ||
    obj?.hmac ||
    null;

  // 2. Verify HMAC Signature
  const isValidHmac = verifyPaymobHMAC(receivedHmac || '', data);
  if (!isValidHmac) {
    console.error('[Paymob Webhook] Invalid HMAC signature detected:', {
      receivedHmac,
      transactionId: obj?.id,
    });
    return {
      status: 401,
      response: { success: false, error: 'Invalid HMAC signature. Security verification failed.' },
    };
  }

  // 3. Inspect Transaction Success & Validity
  const isSuccess =
    (obj.success === true || obj.success === 'true') &&
    (obj.is_voided === false || obj.is_voided === 'false') &&
    (obj.is_refunded === false || obj.is_refunded === 'false') &&
    (obj.pending === false || obj.pending === 'false') &&
    (obj.error_occured === false || obj.error_occured === 'false');

  if (!isSuccess) {
    console.warn(`[Paymob Webhook] Transaction #${obj.id} was not successful or is pending.`, {
      success: obj.success,
      pending: obj.pending,
      is_voided: obj.is_voided,
      is_refunded: obj.is_refunded,
      error_occured: obj.error_occured,
    });
    return {
      status: 200,
      response: {
        success: false,
        message: 'Transaction received but not completed/successful. No status change applied.',
        transactionId: obj.id,
      },
    };
  }

  // 4. Extract Merchant Order ID to identify Entity and Plan
  const merchantOrderId =
    obj.order?.merchant_order_id ||
    obj.merchant_order_id ||
    data.merchant_order_id ||
    '';

  const decoded = decodeMerchantOrderId(merchantOrderId);

  if (!decoded) {
    console.error(`[Paymob Webhook] Could not decode merchant_order_id: "${merchantOrderId}"`);
    return {
      status: 400,
      response: {
        success: false,
        error: `Unrecognized merchant_order_id format: ${merchantOrderId}`,
      },
    };
  }

  const { entityType, entityId, planId, interval } = decoded;

  console.log(`[Paymob Webhook] Processing successful payment for ${entityType} ID: ${entityId}, Plan: ${planId}, Interval: ${interval}`);

  // 5. Atomically activate / extend SaaS subscription
  const activationResult = await SubscriptionService.activateSubscription({
    entityType,
    entityId,
    planId: planId as SubscriptionPlan,
    billingInterval: interval,
    transactionId: String(obj.id),
    gateway: 'PAYMOB',
  });

  console.log('[Paymob Webhook] Subscription successfully activated:', activationResult);

  return {
    status: 200,
    response: {
      success: true,
      message: 'Paymob payment verified and subscription activated successfully.',
      data: activationResult,
    },
    entityType,
  };
}

/**
 * POST /api/webhooks/paymob
 * Server-to-server transaction webhook payload from Paymob
 */
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queryHmac = url.searchParams.get('hmac');
    const payload = await req.json();

    const result = await processTransaction(payload, queryHmac);
    return NextResponse.json(result.response, { status: result.status });
  } catch (error: any) {
    console.error('[Paymob Webhook POST Exception]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal webhook processing error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/paymob
 * Browser redirection callback from Paymob hosted payment page / mobile wallet
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((val, key) => {
      queryParams[key] = val;
    });

    const queryHmac = queryParams.hmac || null;

    // Process transaction if success query param is present
    const result = await processTransaction(queryParams, queryHmac);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin || 'http://localhost:3000';

    if (result.status === 200 && result.response.success) {
      const dashboardPath =
        result.entityType === 'CENTER' ? '/center-dashboard' : '/teacher-dashboard';
      const redirectTarget = `${baseUrl}${dashboardPath}?payment=success&tx=${queryParams.id || ''}`;
      return NextResponse.redirect(redirectTarget);
    } else {
      const redirectTarget = `${baseUrl}/renew-subscription?payment=failed&reason=${encodeURIComponent(
        result.response.error || 'Payment failed or signature invalid'
      )}`;
      return NextResponse.redirect(redirectTarget);
    }
  } catch (error: any) {
    console.error('[Paymob Webhook GET Exception]:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/renew-subscription?payment=error`);
  }
}
