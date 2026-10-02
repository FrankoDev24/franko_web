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
  if (text === 'successfully processed transaction' && (code === '' || code === '01' || code === '1')) return 'success';
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
