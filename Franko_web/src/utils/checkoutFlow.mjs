// Gateway status is determined by the BODY, not HTTP 200 or responseCode alone.
export function paymentOutcome(raw) {
  let value = raw;
  for (let i = 0; i < 5; i += 1) {
    if (typeof value === 'string') {
      try { value = JSON.parse(value); continue; } catch { return 'pending'; }
    }
    if (Array.isArray(value)) { value = value[0]; continue; }
    if (!value || typeof value !== 'object') return 'pending';
    if ('responseMessage' in value || 'ResponseMessage' in value || 'responseCode' in value || 'ResponseCode' in value) break;
    value = value.payload ?? value.data ?? value.response ?? value.result;
  }
  if (!value || typeof value !== 'object') return 'pending';
  const text = String(value.responseMessage ?? value.ResponseMessage ?? '').trim().toLowerCase();
  const code = String(value.responseCode ?? value.ResponseCode ?? '').trim();
  if (text === 'target_authorization_error') return 'failed';
  if (text.replace(/\.$/, '') === 'successfully processed transaction' && code === '01') return 'success';
  // A gateway can send a provisional responseCode (including 0/02) while
  // processing the prompt. Only an explicit terminal *message* may cancel.
  if (/fail(?:ed|ure)?|declin(?:ed|e)?|reject(?:ed)?|cancel(?:led|ed)?|revers(?:ed|al)?|unsuccessful|insufficient funds|expired/.test(text)) return 'failed';
  if (/process(?:ing)?|pending|await|initiated|prompt|approval|in progress|queued/.test(text)) return 'pending';
  return 'pending';
}

// Keep Checkout's existing ORD-<time % 10000>-<random % 1000> format.
// Telecel uses exactly the same suffixes with a TEL prefix.
export function generateOrderCode(telecel = false, now = Date.now(), random = Math.random()) {
  return `${telecel ? 'TEL' : 'ORD'}-${now % 10000}-${Math.floor(random * 1000)}`;
}

// Preserve the CheckOutDbCart / OrderDeliveryUpdate payload shape from Checkout.jsx.
export function buildOrderDetails({ cartId, customerId, orderId, paymentMode, contact, accountType, subtotal, recipientName, recipientContactNumber, orderNote, orderDate, address, paymentService = 'N/A' }) {
  const checkout = {
    Cartid: cartId, customerId, orderCode: orderId,
    PaymentMode: paymentMode, PaymentAccountNumber: contact,
    customerAccountType: accountType, paymentService,
    totalAmount: subtotal, recipientName, recipientContactNumber,
    orderNote: orderNote || 'N/A', orderDate,
  };
  const delivery = {
    orderCode: orderId, OrderCode: orderId, address,
    Customerid: customerId, recipientName, recipientContactNumber,
    orderNote: orderNote || 'N/A', geoLocation: 'N/A',
  };
  return { checkout, delivery };
}

export function assertOrderDetails(checkout, delivery) {
  if (!checkout?.Cartid || !checkout?.customerId || !checkout?.orderCode ||
      !checkout?.PaymentMode || !checkout?.PaymentAccountNumber ||
      !checkout?.recipientName || !checkout?.recipientContactNumber ||
      !Number.isFinite(Number(checkout?.totalAmount)) ||
      !checkout?.orderDate || !delivery?.address ||
      String(delivery?.OrderCode) !== String(checkout.orderCode) ||
      String(delivery?.Customerid) !== String(checkout.customerId)) {
    throw new Error('Order details are incomplete; the order was not dispatched.');
  }
  return true;
}

// Only a confirmed online payment can use the payment-success page.
// All offline methods and standard agent orders use the received page.
export function completedOrderRoute({ orderId, paid, paymentMode, accountType, telecel = false }) {
  // Never infer that an order has been paid merely because CheckOutDbCart
  // succeeded: COD and agent orders also return a successful order response.
  const mobileMoney = String(paymentMode ?? '').trim().toLowerCase() === 'mobile money';
  const agent = !telecel && String(accountType ?? '').trim().toLowerCase() === 'agent';
  return paid === true && mobileMoney && !agent
    ? `/order-success/${encodeURIComponent(orderId)}`
    : '/order-received';
}

export function assertOrderAccepted(raw) {
  let value = raw;
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { throw new Error('Invalid order response'); } }
  if (Array.isArray(value)) value = value[0];
  if (!value || typeof value !== 'object') throw new Error('Empty order response');
  const code = String(value.responseCode ?? value.ResponseCode ?? '').trim();
  const text = String(value.responseMessage ?? value.ResponseMessage ?? value.message ?? '').toLowerCase();
  if (value.status === false || value.success === false || (code && !['1','01'].includes(code)) || /fail|reject|cancel|error/.test(text)) {
    throw new Error(value.responseMessage || value.message || 'Order was not accepted');
  }
  return value;
}

/** Validates whether a payment verification code is a valid 6-digit numeric string */
export function isValidVerificationCode(code) {
  if (typeof code !== 'string') return false;
  return /^\d{6}$/.test(code.trim());
}

/** Checks whether a verification session has expired */
export function isVerificationExpired(createdAt, expiryMs = 10 * 60 * 1000, now = Date.now()) {
  return now - Number(createdAt || 0) > expiryMs;
}

// ═══════════════════════════════════════════════════════════════════
// GHANA MOMO PREFIX DETECTION & VALIDATION
// ═══════════════════════════════════════════════════════════════════
export const MTN_PREFIXES = ['024', '025', '053', '054', '055', '059'];
export const TELECEL_PREFIXES = ['020', '050'];
export const AIRTELTIGO_PREFIXES = ['026', '027', '056', '057'];

export function normalizeGhanaNumber(phone) {
  let clean = String(phone || '').replace(/\D/g, '');
  if (clean.startsWith('2330') && clean.length === 13) clean = '0' + clean.slice(4);
  else if (clean.startsWith('233') && clean.length === 12) clean = '0' + clean.slice(3);
  else if (clean.length === 9) clean = '0' + clean;
  return clean;
}

export function detectMoMoNetwork(phone) {
  const clean = normalizeGhanaNumber(phone);
  if (clean.length !== 10 || !clean.startsWith('0')) return null;
  const prefix = clean.slice(0, 3);
  if (MTN_PREFIXES.includes(prefix)) {
    return { network: 'mtn', service: 'MTN', name: 'MTN MoMo', prefix };
  }
  if (TELECEL_PREFIXES.includes(prefix)) {
    return { network: 'vodafone', service: 'VODAFONE', name: 'Telecel Cash', prefix };
  }
  if (AIRTELTIGO_PREFIXES.includes(prefix)) {
    return { network: 'airteltigo', service: 'AIRTELTIGO', name: 'AT Money', prefix };
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// VERIFIED MOMO NUMBERS (LOCAL STORAGE PERSISTENCE)
// ═══════════════════════════════════════════════════════════════════
export const VERIFIED_MOMO_STORAGE_KEY = 'verifiedMoMoNumbers';

/**
 * Normalize a valid Ghana MoMo phone number to canonical 12-digit 233XXXXXXXXX form.
 * Returns "" if the number is not a valid Ghana MoMo number.
 */
export function toGhanaMsisdn(phone) {
  const detected = detectMoMoNetwork(phone);
  if (!detected) return '';
  const local = normalizeGhanaNumber(phone);
  return `233${local.slice(1)}`;
}

const resolveStorage = (storage) => {
  if (storage) return storage;
  try { return globalThis?.localStorage ?? null; } catch { return null; }
};

export function readVerifiedMoMoNumbers(storage = null) {
  const store = resolveStorage(storage);
  if (!store) return {};
  try {
    const raw = store.getItem(VERIFIED_MOMO_STORAGE_KEY);
    if (!raw) return {};
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) {
      const normalized = {};
      for (const entry of parsed) {
        const key = toGhanaMsisdn(typeof entry === 'string' ? entry : entry?.msisdn);
        if (key) normalized[key] = { verified: true, msisdn: key, verifiedAt: Number(entry?.verifiedAt) || 0 };
      }
      return normalized;
    }
    if (!parsed || typeof parsed !== 'object') return {};
    const normalized = {};
    for (const [k, v] of Object.entries(parsed)) {
      const key = toGhanaMsisdn(k) || toGhanaMsisdn(v?.msisdn);
      if (key && (v === true || v?.verified === true)) {
        normalized[key] = typeof v === 'object' && v !== null
          ? { ...v, verified: true, msisdn: key }
          : { verified: true, msisdn: key, verifiedAt: 0 };
      }
    }
    return normalized;
  } catch {
    return {};
  }
}

export function isMoMoNumberVerified(phone, storage = null) {
  const key = toGhanaMsisdn(phone);
  if (!key) return false;
  const map = readVerifiedMoMoNumbers(storage);
  return Boolean(map[key]?.verified);
}

export function markMoMoNumberVerified(phone, metadata = {}, storage = null) {
  const key = toGhanaMsisdn(phone);
  if (!key) return readVerifiedMoMoNumbers(storage);
  const store = resolveStorage(storage);
  const current = readVerifiedMoMoNumbers(store);
  const next = {
    ...current,
    [key]: {
      ...metadata,
      verified: true,
      msisdn: key,
      verifiedAt: Number(metadata?.verifiedAt) || Date.now(),
    },
  };
  try {
    store?.setItem(VERIFIED_MOMO_STORAGE_KEY, JSON.stringify(next));
  } catch { /* best effort */ }
  return next;
}

export function clearVerifiedMoMoNumber(phone, storage = null) {
  const key = toGhanaMsisdn(phone);
  const store = resolveStorage(storage);
  const current = readVerifiedMoMoNumbers(store);
  if (!key || !current[key]) return current;
  const next = { ...current };
  delete next[key];
  try {
    store?.setItem(VERIFIED_MOMO_STORAGE_KEY, JSON.stringify(next));
  } catch { /* best effort */ }
  return next;
}

export const readJSON = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    if (typeof raw !== 'string') return raw ?? fallback;
    try { return JSON.parse(raw); } catch { return raw; }
  } catch { return fallback; }
};
export const removeDraft = () => {
  try { ['checkoutDetails','orderAddressDetails','checkoutDifferentRecipient'].forEach(k => localStorage.removeItem(k)); } catch { /* best effort */ }
};
