import crypto from 'crypto';

// ==============================================================================
// Linktich - Egyptian Payment Gateway Integration (Paymob Accept)
// Implements the standard Paymob 3-step payment flow:
// 1. Authentication Request (/api/auth/tokens)
// 2. Order Registration API (/api/ecommerce/orders)
// 3. Payment Key Request (/api/acceptance/payment_keys)
// + Step 4 for Mobile Wallets (/api/acceptance/payments/pay)
// + HMAC SHA512 Verification for secure callbacks & webhooks
// ==============================================================================

export interface PaymobConfig {
  baseUrl: string;
  apiKey: string;
  cardIntegrationId: string;
  walletIntegrationId: string;
  iframeId: string;
  hmacSecret: string;
}

export const paymobConfig: PaymobConfig = {
  baseUrl: process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com/api',
  apiKey: process.env.PAYMOB_API_KEY || '',
  cardIntegrationId: process.env.PAYMOB_CARD_INTEGRATION_ID || process.env.PAYMOB_INTEGRATION_ID || '',
  walletIntegrationId: process.env.PAYMOB_WALLET_INTEGRATION_ID || '',
  iframeId: process.env.PAYMOB_IFRAME_ID || '',
  hmacSecret: process.env.PAYMOB_HMAC_SECRET || '',
};

export interface PaymobBillingData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  apartment?: string;
  floor?: string;
  street?: string;
  building?: string;
  shipping_method?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  state?: string;
}

export interface PaymobOrderParams {
  amountCents: number;
  currency?: string;
  merchantOrderId: string;
  items?: Array<{
    name: string;
    amount_cents: number;
    description?: string;
    quantity: number;
  }>;
}

export interface PaymobPaymentKeyParams {
  authToken: string;
  amountCents: number;
  orderId: number | string;
  billingData: PaymobBillingData;
  integrationId: string | number;
  currency?: string;
  expirationSeconds?: number;
}

export interface PaymobWalletResponse {
  success: boolean;
  redirect_url?: string;
  iframe_redirection_url?: string;
  pending?: boolean;
  transaction_id?: number | string;
  raw?: any;
}

export interface DecodedMerchantOrder {
  prefix: string;
  entityType: 'CENTER' | 'TEACHER';
  entityId: string;
  planId: string;
  interval: 'MONTHLY' | 'YEARLY';
  timestamp: number;
}

/**
 * Checks whether live Paymob credentials have been configured
 */
export function isPaymobConfigured(): boolean {
  return Boolean(
    paymobConfig.apiKey &&
      paymobConfig.apiKey.length > 10 &&
      !paymobConfig.apiKey.includes('your_') &&
      !paymobConfig.apiKey.includes('here')
  );
}

/**
 * Step 1: Paymob Authentication Request
 * Generates an authentication token valid for 1 hour
 * POST /api/auth/tokens
 */
export async function authenticatePaymob(): Promise<string> {
  if (!isPaymobConfigured()) {
    console.warn('[Paymob] Using simulated auth token (Paymob credentials not fully set)');
    return `SIMULATED_AUTH_TOKEN_${Date.now()}`;
  }

  const response = await fetch(`${paymobConfig.baseUrl}/auth/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: paymobConfig.apiKey }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Paymob Authentication failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (!data.token) {
    throw new Error('Paymob Authentication response did not return a valid auth token');
  }

  return data.token as string;
}

/**
 * Step 2: Paymob Order Registration API
 * Registers an order with the amount in Egyptian Cents (EGP * 100)
 * POST /api/ecommerce/orders
 */
export async function createPaymobOrder(
  authToken: string,
  params: PaymobOrderParams
): Promise<number> {
  const { amountCents, currency = 'EGP', merchantOrderId, items = [] } = params;

  if (!isPaymobConfigured()) {
    const simulatedOrderId = Math.floor(100000 + Math.random() * 900000);
    console.warn(`[Paymob] Using simulated Order ID: ${simulatedOrderId}`);
    return simulatedOrderId;
  }

  const payload = {
    auth_token: authToken,
    delivery_needed: 'false',
    amount_cents: amountCents,
    currency,
    merchant_order_id: merchantOrderId,
    items,
  };

  const response = await fetch(`${paymobConfig.baseUrl}/ecommerce/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Paymob Order Registration failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (!data.id) {
    throw new Error('Paymob Order Registration did not return a valid order id');
  }

  return Number(data.id);
}

/**
 * Step 3: Paymob Payment Key Request
 * Generates payment token for the selected payment integration (Card or Wallet)
 * POST /api/acceptance/payment_keys
 */
export async function generatePaymentKey(params: PaymobPaymentKeyParams): Promise<string> {
  const {
    authToken,
    amountCents,
    orderId,
    billingData,
    integrationId,
    currency = 'EGP',
    expirationSeconds = 3600,
  } = params;

  if (!isPaymobConfigured()) {
    const simulatedPaymentKey = `SIMULATED_PK_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.warn(`[Paymob] Using simulated Payment Key: ${simulatedPaymentKey}`);
    return simulatedPaymentKey;
  }

  const sanitizedBillingData: PaymobBillingData = {
    first_name: billingData.first_name || 'Linktich',
    last_name: billingData.last_name || 'Subscriber',
    email: billingData.email || 'billing@linktich.eg',
    phone_number: billingData.phone_number || '+201000000000',
    apartment: billingData.apartment || 'NA',
    floor: billingData.floor || 'NA',
    street: billingData.street || 'NA',
    building: billingData.building || 'NA',
    shipping_method: billingData.shipping_method || 'PKG',
    postal_code: billingData.postal_code || 'NA',
    city: billingData.city || 'Cairo',
    country: billingData.country || 'EGP',
    state: billingData.state || 'Cairo',
  };

  const payload = {
    auth_token: authToken,
    amount_cents: amountCents,
    expiration: expirationSeconds,
    order_id: String(orderId),
    billing_data: sanitizedBillingData,
    currency,
    integration_id: Number(integrationId) || integrationId,
    lock_order_when_paid: 'true',
  };

  const response = await fetch(`${paymobConfig.baseUrl}/acceptance/payment_keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Paymob Payment Key Request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (!data.token) {
    throw new Error('Paymob Payment Key response did not return a valid payment token');
  }

  return data.token as string;
}

/**
 * Step 4 (Mobile Wallets): Paymob Mobile Wallet Payment Request
 * Initiates Vodafone Cash / Orange / Etisalat / WE Pay wallet transaction
 * POST /api/acceptance/payments/pay
 */
export async function initiateWalletPayment(params: {
  paymentKey: string;
  walletPhoneNumber: string;
}): Promise<PaymobWalletResponse> {
  const { paymentKey, walletPhoneNumber } = params;

  // Clean Egyptian mobile phone number (remove spaces, ensure e.g. 010xxxxxxxx or +2010xxxxxxxx)
  const cleanedPhone = walletPhoneNumber.replace(/\s+/g, '').replace(/-/g, '');

  if (!isPaymobConfigured()) {
    console.warn(`[Paymob] Simulating Mobile Wallet redirect for phone: ${cleanedPhone}`);
    return {
      success: true,
      redirect_url: `https://accept.paymob.com/api/acceptance/post_pay?simulated=true&phone=${encodeURIComponent(
        cleanedPhone
      )}`,
      pending: true,
      transaction_id: Math.floor(1000000 + Math.random() * 9000000),
    };
  }

  const payload = {
    source: {
      identifier: cleanedPhone,
      subtype: 'WALLET',
    },
    payment_token: paymentKey,
  };

  const response = await fetch(`${paymobConfig.baseUrl}/acceptance/payments/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Paymob Wallet Payment failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const redirectUrl =
    data.redirect_url || data.iframe_redirection_url || data.redirection_url || null;

  return {
    success: Boolean(redirectUrl || data.pending || data.id),
    redirect_url: redirectUrl,
    iframe_redirection_url: data.iframe_redirection_url,
    pending: data.pending,
    transaction_id: data.id,
    raw: data,
  };
}

/**
 * Build standard Paymob hosted card iframe URL
 */
export function buildCardIframeUrl(paymentKey: string, iframeId?: string | number): string {
  const activeIframeId = iframeId || paymobConfig.iframeId;
  return `https://accept.paymob.com/api/acceptance/iframes/${activeIframeId}?payment_token=${paymentKey}`;
}

/**
 * Extracts and concatenates transaction fields in the strict alphabetical order required by Paymob:
 * 1. amount_cents
 * 2. created_at
 * 3. currency
 * 4. error_occured
 * 5. has_parent_transaction
 * 6. id
 * 7. integration_id
 * 8. is_3d_secure
 * 9. is_auth
 * 10. is_capture
 * 11. is_refunded
 * 12. is_standalone_payment
 * 13. is_voided
 * 14. order.id (or order in flat query)
 * 15. owner
 * 16. pending
 * 17. source_data.pan
 * 18. source_data.sub_type
 * 19. source_data.type
 * 20. success
 */
export function extractPaymobHmacConcatenatedString(data: any): string {
  // Support either direct transaction object or webhook payload wrapper { type, obj: { ... } }
  const obj = data?.obj ? data.obj : data || {};

  const getFieldValue = (nestedKey: string, fallbackFlatKey?: string): string => {
    let val: any;

    if (nestedKey.includes('.')) {
      const parts = nestedKey.split('.');
      let current = obj;
      for (const p of parts) {
        current = current?.[p];
      }
      val = current;
    } else {
      val = obj?.[nestedKey];
    }

    if ((val === undefined || val === null) && fallbackFlatKey) {
      val = obj?.[fallbackFlatKey];
    }

    if (typeof val === 'boolean') {
      return val ? 'true' : 'false';
    }

    if (val === null || val === undefined) {
      return '';
    }

    return String(val);
  };

  const fields = [
    getFieldValue('amount_cents'),
    getFieldValue('created_at'),
    getFieldValue('currency'),
    getFieldValue('error_occured'),
    getFieldValue('has_parent_transaction'),
    getFieldValue('id'),
    getFieldValue('integration_id'),
    getFieldValue('is_3d_secure'),
    getFieldValue('is_auth'),
    getFieldValue('is_capture'),
    getFieldValue('is_refunded'),
    getFieldValue('is_standalone_payment'),
    getFieldValue('is_voided'),
    getFieldValue('order.id', 'order'),
    getFieldValue('owner'),
    getFieldValue('pending'),
    getFieldValue('source_data.pan'),
    getFieldValue('source_data.sub_type'),
    getFieldValue('source_data.type'),
    getFieldValue('success'),
  ];

  return fields.join('');
}

/**
 * Calculates SHA512 HMAC hash for Paymob transaction object
 */
export function calculatePaymobHMAC(data: any, hmacSecret?: string): string {
  const secret = hmacSecret || paymobConfig.hmacSecret;
  if (!secret) {
    throw new Error('PAYMOB_HMAC_SECRET is missing. Cannot calculate signature.');
  }

  const concatenated = extractPaymobHmacConcatenatedString(data);
  return crypto.createHmac('sha512', secret).update(concatenated).digest('hex');
}

/**
 * Verifies Paymob SHA512 HMAC signature using constant-time comparison
 */
export function verifyPaymobHMAC(receivedHmac: string, data: any, hmacSecret?: string): boolean {
  if (!receivedHmac) return false;

  const secret = hmacSecret || paymobConfig.hmacSecret;
  if (!secret) {
    // If HMAC secret is not configured in local environment and bypass flag is set
    if (process.env.NODE_ENV !== 'production' && !paymobConfig.apiKey) {
      console.warn('[Paymob HMAC] HMAC secret empty in non-production environment; bypassing for tests');
      return true;
    }
    return false;
  }

  try {
    const calculated = calculatePaymobHMAC(data, secret);
    const calculatedBuf = Buffer.from(calculated.toLowerCase(), 'hex');
    const receivedBuf = Buffer.from(receivedHmac.toLowerCase(), 'hex');

    if (calculatedBuf.length !== receivedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(calculatedBuf, receivedBuf);
  } catch (err) {
    console.error('[Paymob HMAC] Error verifying HMAC:', err);
    return false;
  }
}

/**
 * Encodes order context into Paymob merchant_order_id
 * Format: LINKTICH_{ROLE}_{ENTITY_ID}_{PLAN_ID}_{INTERVAL}_{TIMESTAMP}
 */
export function encodeMerchantOrderId(
  role: 'CENTER' | 'TEACHER',
  entityId: string,
  planId: string,
  interval: 'MONTHLY' | 'YEARLY'
): string {
  return `LINKTICH_${role}_${entityId}_${planId}_${interval}_${Date.now()}`;
}

/**
 * Decodes merchant_order_id back into its constituent parts
 */
export function decodeMerchantOrderId(merchantOrderId: string): DecodedMerchantOrder | null {
  if (!merchantOrderId || !merchantOrderId.startsWith('LINKTICH_')) {
    return null;
  }

  const parts = merchantOrderId.split('_');
  // Format: LINKTICH, ROLE, ENTITY_ID, ...PLAN_PARTS..., INTERVAL, TIMESTAMP
  if (parts.length < 6) {
    return null;
  }

  const role = parts[1] as 'CENTER' | 'TEACHER';
  const entityId = parts[2];
  const timestamp = Number(parts[parts.length - 1]);
  const interval = parts[parts.length - 2] as 'MONTHLY' | 'YEARLY';
  const planParts = parts.slice(3, parts.length - 2);
  const planId = planParts.join('_');

  return {
    prefix: 'LINKTICH',
    entityType: role,
    entityId,
    planId,
    interval,
    timestamp,
  };
}
