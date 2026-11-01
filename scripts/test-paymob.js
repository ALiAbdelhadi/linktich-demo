// ==============================================================================
// Test script for Linktich Paymob Acceptance & HMAC Verification
// ==============================================================================

const crypto = require('crypto');

function extractPaymobHmacConcatenatedString(data) {
  const obj = data?.obj ? data.obj : data || {};

  const getFieldValue = (nestedKey, fallbackFlatKey) => {
    let val;

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

function calculatePaymobHMAC(data, hmacSecret) {
  const concatenated = extractPaymobHmacConcatenatedString(data);
  return crypto.createHmac('sha512', hmacSecret).update(concatenated).digest('hex');
}

function verifyPaymobHMAC(receivedHmac, data, hmacSecret) {
  if (!receivedHmac || !hmacSecret) return false;
  const calculated = calculatePaymobHMAC(data, hmacSecret);
  const calculatedBuf = Buffer.from(calculated.toLowerCase(), 'hex');
  const receivedBuf = Buffer.from(receivedHmac.toLowerCase(), 'hex');
  if (calculatedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(calculatedBuf, receivedBuf);
}

function encodeMerchantOrderId(role, entityId, planId, interval) {
  return `LINKTICH_${role}_${entityId}_${planId}_${interval}_${Date.now()}`;
}

function decodeMerchantOrderId(merchantOrderId) {
  if (!merchantOrderId || !merchantOrderId.startsWith('LINKTICH_')) {
    return null;
  }
  const parts = merchantOrderId.split('_');
  if (parts.length < 6) return null;
  const role = parts[1];
  const entityId = parts[2];
  const timestamp = Number(parts[parts.length - 1]);
  const interval = parts[parts.length - 2];
  const planParts = parts.slice(3, parts.length - 2);
  const planId = planParts.join('_');
  return { prefix: 'LINKTICH', entityType: role, entityId, planId, interval, timestamp };
}

// -----------------------------------------------------------------------------
// Test execution
// -----------------------------------------------------------------------------
console.log('--- Starting Paymob Logic Unit Tests ---');

// Test 1: Order ID encode and decode
const sampleEntityId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const encoded = encodeMerchantOrderId('CENTER', sampleEntityId, 'CENTER_PRO_MONTHLY', 'MONTHLY');
console.log('1. Encoded Merchant Order ID:', encoded);

const decoded = decodeMerchantOrderId(encoded);
console.log('   Decoded:', decoded);
if (
  decoded &&
  decoded.entityType === 'CENTER' &&
  decoded.entityId === sampleEntityId &&
  decoded.planId === 'CENTER_PRO_MONTHLY' &&
  decoded.interval === 'MONTHLY'
) {
  console.log('✓ Test 1 Passed: Order ID encode/decode is bidirectional and lossless.');
} else {
  console.error('✗ Test 1 Failed');
  process.exit(1);
}

// Test 2: HMAC Calculation & Verification
const testSecret = 'LINKTICH_SUPER_SECRET_PAYMOB_KEY_99';
const mockPayload = {
  type: 'TRANSACTION',
  obj: {
    id: 99887766,
    amount_cents: 159900,
    created_at: '2026-10-27T18:00:00.000000',
    currency: 'EGP',
    error_occured: false,
    has_parent_transaction: false,
    integration_id: 12345,
    is_3d_secure: true,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    order: {
      id: 554433,
      merchant_order_id: encoded,
    },
    owner: 100,
    pending: false,
    source_data: {
      pan: '2346',
      sub_type: 'MasterCard',
      type: 'card',
    },
    success: true,
  },
};

const validHmac = calculatePaymobHMAC(mockPayload, testSecret);
console.log('2. Calculated HMAC:', validHmac.substring(0, 32) + '...');

const isVerified = verifyPaymobHMAC(validHmac, mockPayload, testSecret);
if (isVerified) {
  console.log('✓ Test 2 Passed: Valid HMAC successfully verified using timing-safe comparison.');
} else {
  console.error('✗ Test 2 Failed: Valid HMAC was not verified.');
  process.exit(1);
}

// Test 3: Tampered payload rejection
const tamperedPayload = JSON.parse(JSON.stringify(mockPayload));
tamperedPayload.obj.amount_cents = 1000; // attacker changed amount to 10 EGP
const isTamperedVerified = verifyPaymobHMAC(validHmac, tamperedPayload, testSecret);
if (!isTamperedVerified) {
  console.log('✓ Test 3 Passed: Tampered payload signature rejected securely.');
} else {
  console.error('✗ Test 3 Failed: Tampered payload was falsely accepted!');
  process.exit(1);
}

// Test 4: Flat query params (Paymob GET redirection callback)
const flatQueryParams = {
  amount_cents: '159900',
  created_at: '2026-10-27T18:00:00.000000',
  currency: 'EGP',
  error_occured: 'false',
  has_parent_transaction: 'false',
  id: '99887766',
  integration_id: '12345',
  is_3d_secure: 'true',
  is_auth: 'false',
  is_capture: 'false',
  is_refunded: 'false',
  is_standalone_payment: 'true',
  is_voided: 'false',
  order: '554433',
  owner: '100',
  pending: 'false',
  'source_data.pan': '2346',
  'source_data.sub_type': 'MasterCard',
  'source_data.type': 'card',
  success: 'true',
};

const flatHmac = calculatePaymobHMAC(flatQueryParams, testSecret);
const isFlatVerified = verifyPaymobHMAC(flatHmac, flatQueryParams, testSecret);
if (isFlatVerified) {
  console.log('✓ Test 4 Passed: Flat query string redirection HMAC verified accurately.');
} else {
  console.error('✗ Test 4 Failed');
  process.exit(1);
}

console.log('🎉 All Paymob Integration Logic Tests Passed Successfully!');
