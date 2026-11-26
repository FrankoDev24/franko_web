import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input, Radio, Divider, message, Modal } from 'antd';
import { validateCart, checkOutOrder, updateOrderDelivery, saveCheckoutDetails, saveAddressDetails, FRIENDLY_PRICE_UPDATE_MSG } from '../Redux/Slice/orderSlice';
import { validateAccount, debitCustomer, checkTransactionStatus, resetPaymentState, sendMoMoOtp, verifyMoMoOtp, resetOtpState } from '../Redux/Slice/paymentSlice';
import { clearCart, getCartById } from '../Redux/Slice/cartSlice';
import CheckoutForm from '../Component/CheckoutForm';
import AuthModal from '../Component/AuthModal';
import locations from '../Component/Locations';
import {
  ShoppingBagIcon, LockClosedIcon, UserIcon, ExclamationTriangleIcon,
  PhoneIcon, ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import frankoLogo from '../assets/frankoIcon.png';
import mtnLogo from '../assets/momo.png';
import vodafoneLogo from '../assets/voda.png';
import airteltigoLogo from '../assets/AT.png';
import {
  paymentOutcome, generateOrderCode, buildOrderDetails,
  assertOrderDetails, completedOrderRoute, assertOrderAccepted,
  readJSON, removeDraft, detectMoMoNetwork, toGhanaMsisdn,
  readVerifiedMoMoNumbers, isMoMoNumberVerified, markMoMoNumberVerified,
  isValidVerificationCode,
} from '../utils/checkoutFlow.mjs';

const price = item => Number(item?.unitPrice ?? item?.UnitPrice ?? item?.price ?? item?.Price ?? 0);
const qty = item => Number(item?.quantity ?? item?.Quantity ?? 1);
const customerId = c => c?.customerAccountNumber ?? c?.CustomerAccountNumber ?? c?.customerId;
const customerNameOf = c => `${c?.firstName || ''} ${c?.lastName || ''}`.trim();
/* A "guest" value is never a real recipient name or a real address. */
const isGuestValue = v => !v || /^\s*guest\b/i.test(String(v)) || /^\s*n\/?a\s*$/i.test(String(v));
const NETWORKS = { mtn: 'MTN', vodafone: 'VODAFONE', airteltigo: 'AIRTELTIGO' };

/* ── Auto-recheck: 2 minutes of inactivity inside the approval modal ── */
const AUTO_RECHECK_MS = 120000;
const AUTO_RECHECK_RETRY_MS = 30000; // retry if the status check itself fails (network)
const fmtClock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/* A MoMo prompt pushed the instant the OTP is verified often never reaches
   the customer's phone, so wait before sending it. */
const POST_OTP_PROMPT_DELAY_MS = 4000;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const checkoutStyles = `
:root{--co-green:#14532d;--co-green-mid:#166534;--co-green-600:#16a34a;--co-green-light:#dcfce7;--co-green-lighter:#f0fdf4;--co-dark:#1a1a1a;--co-mid:#555;--co-light:#888;--co-border:#e0e0e0;--co-bg:#f7f7f7;--co-red:#dc2626;--co-radius:6px;--co-radius-xl:14px}
.co-root,.co-root *{box-sizing:border-box;font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased}.co-root{min-height:100vh;background:#fff;color:var(--co-dark)}
.co-tel{--co-green:#BB1420;--co-green-mid:#A80F1B;--co-green-600:#BB1420;--co-green-lighter:#FDF0F0;--co-green-light:#F6E3E5}.co-tel .co-page-header{background:#BB1420;color:white;padding:18px;border-radius:8px}.co-tel .co-page-count{color:#ffeaea}.co-tel .co-page-header-accent{background:#FFD400}
.co-container{max-width:1780px;margin:0 auto;padding:24px 16px 100px}@media(min-width:1024px){.co-container{padding:32px 40px}}
.co-page-header{display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--co-border)}.co-page-header-accent{width:4px;height:28px;border-radius:2px;background:var(--co-green)}.co-page-title{font-size:24px;font-weight:800;letter-spacing:-.02em;margin:0}.co-page-count{font-size:13px;color:var(--co-light);margin:4px 0 0}.co-page-header-line{display:none;flex:1;height:1px;background:var(--co-border)}@media(min-width:768px){.co-page-header-line{display:block}}
.co-layout{display:flex;flex-direction:column;gap:20px}@media(min-width:1024px){.co-layout{flex-direction:row;gap:24px}}.co-sidebar{flex-shrink:0}@media(min-width:1024px){.co-sidebar{width:420px}}.co-main{flex:1;min-width:0}
.co-card{background:#fff;border:1px solid var(--co-border);border-radius:var(--co-radius);overflow:hidden}.co-card-header{padding:16px 20px;border-bottom:1px solid #f0f0f0}.co-card-title{font-size:16px;font-weight:800;margin:0}.co-card-body{padding:16px 20px}.co-section-accent{display:flex;gap:4px;margin-top:8px}.co-section-accent-bar{height:2px;width:32px;background:var(--co-green-600)}.co-section-accent-line{height:2px;flex:1;background:#f0f0f0}
.co-auth-banner,.co-warning-banner,.co-lock-banner,.co-agent-banner{display:flex;gap:12px;padding:12px 14px;border-radius:10px;margin-bottom:16px}.co-auth-banner{background:#f0fdf4;border:1px solid #bbf7d0}.co-lock-banner{background:var(--co-green-lighter);border:1.5px solid var(--co-green-light);align-items:flex-start}.co-lock-banner p{font-size:12px;font-weight:600;color:var(--co-green);margin:0;line-height:1.5}.co-lock-banner strong{font-weight:900}
.co-agent-banner{background:#eff6ff;border:1.5px solid #bfdbfe;align-items:flex-start}.co-agent-banner p{font-size:12px;font-weight:600;color:#1e40af;margin:0;line-height:1.5}.co-agent-banner strong{font-weight:900}
.co-auth-banner-icon{width:36px;height:36px;border-radius:8px;background:#fff;border:1px solid #bbf7d0;display:grid;place-items:center;flex-shrink:0}.co-auth-banner-copy{flex:1}.co-auth-banner-title{font-size:13px;font-weight:800;color:var(--co-green);margin:0 0 3px}.co-auth-banner-desc{font-size:12px;color:#166534;margin:0;line-height:1.45}.co-auth-banner-btn{margin-top:8px;border:0;background:var(--co-green);color:#fff;border-radius:var(--co-radius);padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer}
.co-toggle-wrap{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--co-bg);border:1px solid var(--co-border);border-radius:10px;cursor:pointer;margin-bottom:16px}.co-toggle-left{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--co-mid)}.co-toggle-track{width:40px;height:22px;border-radius:11px;padding:2px;transition:background .2s;flex-shrink:0}.co-toggle-track-off{background:#d1d5db}.co-toggle-track-on{background:var(--co-green-600)}.co-toggle-knob{width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0002;transition:transform .2s}.co-toggle-knob-on{transform:translateX(18px)}.co-warning-banner{background:#fffbeb;border:1px solid #fde68a;align-items:flex-start}.co-warning-banner p{font-size:12px;font-weight:600;color:#92400e;margin:0;line-height:1.5}
.co-items-list{max-height:380px;overflow-y:auto;padding-right:4px}.co-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #f5f5f5}.co-item:last-child{border-bottom:0}.co-item-left{display:flex;gap:12px;flex:1;min-width:0}.co-item-img,.co-item-img-placeholder{width:56px;height:56px;border-radius:var(--co-radius);object-fit:cover;border:1px solid #f0f0f0;flex-shrink:0}.co-item-img-placeholder{display:flex;align-items:center;justify-content:center;background:var(--co-bg);font-size:10px;color:var(--co-light)}.co-item-info{flex:1;min-width:0}.co-item-name{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0 0 2px}.co-item-unit{font-size:12px;color:var(--co-light);margin:0}.co-item-qty{display:inline-flex;margin-top:4px;padding:2px 8px;border-radius:100px;background:var(--co-green-lighter);font-size:11px;font-weight:700;color:var(--co-green)}.co-item-price{font-size:14px;font-weight:900;flex-shrink:0}
.co-totals{padding-top:16px;border-top:1px solid var(--co-border)}.co-total-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0;font-size:14px}.co-total-row-label{color:var(--co-mid)}.co-total-row-value{font-weight:700}.co-total-row-free{font-weight:700;color:var(--co-green-600)}.co-total-row-warning{font-weight:600;color:#d97706}.co-service-charge{display:flex;justify-content:space-between;padding:8px 12px;background:#eff6ff;border-radius:var(--co-radius);margin:8px 0}.co-service-charge span{font-size:13px;font-weight:600;color:#1e40af}.co-grand-total{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:linear-gradient(135deg,#fef2f2,#fff7ed);border-radius:var(--co-radius);margin-top:8px;border:1px solid #fecaca}.co-grand-total-label,.co-grand-total-value{font-weight:900;color:var(--co-red)}.co-grand-total-value{font-size:18px}.co-charge-note{font-size:11px;color:var(--co-light);text-align:center;font-style:italic;margin-top:6px}
.co-payment-section{margin-top:20px}.co-payment-title{font-size:14px;font-weight:800;margin:0 0 12px}.co-payment-options{display:flex;flex-direction:column;gap:8px}.co-payment-option{display:flex;align-items:center;gap:12px;padding:12px 16px;border:2px solid var(--co-border);border-radius:10px;cursor:pointer;background:#fff}.co-payment-option-active{border-color:var(--co-green-600)!important;background:var(--co-green-lighter)!important}.co-payment-option-text{font-size:14px;font-weight:600;color:var(--co-mid)}
.co-momo-box{margin-top:12px;padding:14px 16px;border:1.5px solid var(--co-green-light);background:var(--co-green-lighter);border-radius:10px;display:flex;flex-direction:column;gap:10px}.co-momo-box-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.co-momo-box-label{font-size:13px;font-weight:800;color:var(--co-dark)}.co-momo-badges{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.co-badge-verified{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;background:#dcfce7;color:#166534;padding:3px 9px;border-radius:100px;border:1px solid #86efac}.co-badge-unverified{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;background:#fef3c7;color:#92400e;padding:3px 9px;border-radius:100px;border:1px solid #fcd34d}.co-badge-net{font-size:11px;font-weight:700;background:#fff;color:var(--co-green);padding:3px 9px;border-radius:100px;border:1px solid var(--co-green-light)}.co-momo-input-row{display:flex;gap:8px;align-items:center}.co-momo-hint{font-size:12px;color:var(--co-mid);margin:0;line-height:1.45}.co-momo-hint-err{font-size:12px;color:var(--co-red);font-weight:600;margin:0}.co-otp-input{text-align:center;font-size:24px!important;font-weight:800!important;letter-spacing:.35em;padding:10px 12px!important}.co-otp-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px}.co-otp-link{background:none;border:0;color:var(--co-green);font-size:12px;font-weight:700;cursor:pointer;padding:4px 0}.co-otp-link:disabled{color:#9ca3af;cursor:not-allowed}
.co-btn-primary,.co-btn-danger,.co-btn-secondary{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:10px;font-weight:700;cursor:pointer;transition:.15s;font-family:inherit}.co-btn-primary{padding:14px;background:var(--co-green);color:#fff;border:0;font-size:15px}.co-btn-primary:hover{background:var(--co-green-mid)}.co-btn-primary:disabled{background:#d1d5db;cursor:not-allowed}.co-btn-danger{padding:12px;background:#fff;color:var(--co-red);border:1px solid #fecaca;font-size:14px}.co-btn-danger:hover{background:#fef2f2}.co-btn-secondary{padding:9px 12px;background:#fff;color:var(--co-dark);border:1px solid var(--co-border);font-size:12px}.co-btn-secondary:hover{background:var(--co-bg)}.co-sticky-bottom{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid var(--co-border);padding:12px 16px;z-index:40;box-shadow:0 -2px 12px #0001;display:block}@media(min-width:1024px){.co-sticky-bottom{display:none}}.co-desktop-btn{display:none;margin-top:20px}@media(min-width:1024px){.co-desktop-btn{display:block}}
.co-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 24px;min-height:400px}.co-empty-icon{width:72px;height:72px;border-radius:50%;background:var(--co-bg);display:grid;place-items:center;margin-bottom:16px;border:1px solid var(--co-border)}.co-empty-title{font-size:22px;font-weight:800;margin-bottom:8px}.co-empty-desc{font-size:14px;color:var(--co-light);margin-bottom:24px}
.co-loading-overlay{position:fixed;inset:0;background:#0008;backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:10000}.co-loading-card{background:#fff;border-radius:var(--co-radius-xl);padding:32px;display:flex;flex-direction:column;align-items:center;gap:16px;box-shadow:0 20px 60px #0003}.co-spinner{width:40px;height:40px;border:4px solid var(--co-green-light);border-top-color:var(--co-green-600);border-radius:50%;animation:co-spin .8s linear infinite}@keyframes co-spin{to{transform:rotate(360deg)}}.co-loading-text{font-size:15px;font-weight:700;color:var(--co-mid)}
.pm-modal-wrap{display:flex;flex-direction:column;max-height:calc(100vh - 32px)}.pm-header-compact{background:linear-gradient(135deg,#0d3d20,#14532d 50%,#166534);padding:16px 20px;display:flex;align-items:center;justify-content:space-between}.co-tel .pm-header-compact{background:linear-gradient(135deg,#8f0c16,#BB1420 55%,#A80F1B)}.pm-header-left{display:flex;align-items:center;gap:10px}.pm-logo-small{height:28px;object-fit:contain;filter:brightness(0) invert(1)}.pm-company-small{font-size:10px;font-weight:700;color:#ffffff80;text-transform:uppercase;margin:0}.pm-ref-small{font-size:10px;color:#ffffff99;margin:3px 0 0}.pm-header-right{text-align:right}.pm-amount-label-small{font-size:9px;font-weight:700;color:#ffffff80;text-transform:uppercase;margin:0}.pm-amount-value-small{font-size:24px;font-weight:900;color:#fff;margin:0}.pm-body{padding:16px;display:flex;flex-direction:column;gap:12px;background:#fff;overflow-y:auto}.pm-field{border:1.5px solid #e5e7eb;border-radius:10px;overflow:hidden}.pm-field-header{display:flex;align-items:center;gap:8px;padding:9px 12px;background:#f9fafb;border-bottom:1px solid #f0f0f0}.pm-field-step-num{width:20px;height:20px;background:var(--co-green);color:#fff;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:900}.pm-field-label{font-size:12px;font-weight:800}.pm-field-body{padding:12px}.pm-account-status{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:8px;font-size:12px;font-weight:700}.pm-account-checking{background:#fffbeb;border:1px solid #fde68a;color:#d97706}.pm-account-valid{background:#f0fdf4;border:1.5px solid #86efac;color:#166534}.pm-account-invalid{background:#fef2f2;border:1.5px solid #fecaca;color:#b91c1c}.pm-networks{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.pm-network-tile{display:flex;flex-direction:column;align-items:center;text-align:center;padding:10px 6px;border:2px solid #e5e7eb;border-radius:8px;background:#fff;min-height:56px;cursor:pointer;transition:.15s;font-family:inherit;width:100%}.pm-network-tile:hover{border-color:#9ca3af}.pm-network-tile:disabled{cursor:not-allowed}.pm-network-logo{width:36px;height:36px;object-fit:contain;border-radius:6px}.pm-network-name{font-size:13px;font-weight:800;margin:0;color:var(--co-dark)}.pm-network-sub{font-size:10px;color:var(--co-light);margin:2px 0 0}.pm-security{display:flex;align-items:center;justify-content:center;gap:5px;font-size:10px;font-weight:600;color:#6b7280;padding:7px;background:#f9fafb;border-radius:6px}
.pm-pending-anim{position:relative;width:78px;height:78px}.pm-pending-ring-outer,.pm-pending-ring-spin{position:absolute;inset:0;border-radius:50%}.pm-pending-ring-outer{border:3px solid #dcfce7}.pm-pending-ring-spin{border:3px solid transparent;border-top-color:var(--co-green-600);animation:co-spin 1s linear infinite}.pm-pending-ring-inner{position:absolute;inset:9px;border:2px solid #f0fdf4;border-radius:50%;display:grid;place-items:center;background:#dcfce7}.co-guide-steps-wrap{background:#fff;border:1px solid #f0f0f0;border-radius:var(--co-radius);overflow:hidden}.co-guide-steps-header{padding:10px 14px;border-bottom:1px solid #f5f5f5}.co-guide-steps-body{padding:14px;max-height:280px;overflow:auto}.co-guide-step{display:flex;gap:12px;align-items:flex-start;margin-bottom:10px}.co-guide-step-num{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:11px;font-weight:900;flex-shrink:0}.co-guide-step-text{font-size:13px;color:var(--co-mid);margin:3px 0 0;line-height:1.4}

/* Auto-recheck countdown strip (Approve-payment modal) */
.co-autocheck{display:flex;align-items:center;justify-content:center;gap:8px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:9px 12px;font-size:12px;font-weight:600;color:#92400e;line-height:1.45}
.co-autocheck-dot{width:8px;height:8px;border-radius:50%;background:#f59e0b;flex-shrink:0;animation:co-pulse 1.4s ease-in-out infinite}
.co-autocheck-checking{display:inline-flex;align-items:center;gap:7px;color:var(--co-green);font-weight:700}
.co-autocheck-spinner{width:14px;height:14px;border:2px solid var(--co-green-light);border-top-color:var(--co-green-600);border-radius:50%;animation:co-spin .7s linear infinite;flex-shrink:0}
@keyframes co-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.8)}}
@media (prefers-reduced-motion:reduce){.co-autocheck-dot,.co-autocheck-spinner{animation:none!important}}
`;

export default function CheckoutShared({ telecel = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const cartState = useSelector(s => s.cart || {});
  const customerState = useSelector(s => s.customer ?? s.customerReducer ?? s.customers ?? {});
  const customer = customerState.currentCustomer ?? customerState.customer ?? customerState.customerDetails ?? customerState.data ?? customerState.user ?? customerState.profile ?? customerState;
  const loggedIn = Boolean(customerId(customer));
  const stored = readJSON('checkoutDetails', {});
  const savedCustomer = readJSON('customer', {});

  // ═════════════════════════════════════════════════════════════════
  // ACCOUNT TYPE — resolved BEFORE any state initializer so the very
  // first render already knows whether this is an agent session.
  // ═════════════════════════════════════════════════════════════════
  const accountType = String(customer?.accountType ?? savedCustomer?.accountType ?? '').toLowerCase();
  const isAgent = accountType === 'agent';

  // ── Registered account defaults (customers only) ─────────────────
  const accountPhone = customer?.contactNumber || customer?.ContactNumber || customer?.phone || customer?.telephone || customer?.phoneNumber || savedCustomer?.contactNumber || savedCustomer?.ContactNumber || savedCustomer?.phone || '';
  const accountName = customerNameOf(customer) || customerNameOf(savedCustomer);

  const [items, setItems] = useState(() => telecel
    ? (location.state?.items?.length ? location.state.items : readJSON('telCheckoutCart', {})?.items || cartState.cart || [])
    : (cartState.cart?.length ? cartState.cart : readJSON('cart', []) || []));

  // ═════════════════════════════════════════════════════════════════
  // AGENT RULE: agents always order for a walk-in customer, so we NEVER
  // pre-fill recipient/phone/address with the agent's own details.
  // CUSTOMER RULE: registered name/phone + last-used address pre-fill.
  // ═════════════════════════════════════════════════════════════════
  const [recipient, setRecipient] = useState(() => {
    if (isAgent) return '';
    const v = stored.recipientName || accountName || '';
    return isGuestValue(v) ? '' : v;
  });
  const [phone, setPhone] = useState(() => {
    if (isAgent) return '';
    return stored.recipientContactNumber || accountPhone || '';
  });
  const [different, setDifferent] = useState(() => {
    if (isAgent) return false;
    const raw = readJSON('checkoutDifferentRecipient', false);
    return raw === true || raw === 'true';
  });
  const [note, setNote] = useState(stored.orderNote || '');

  const initialDelivery = useMemo(() => {
    if (isAgent || !loggedIn) return { address: '', fee: 0, feeDisplay: '' };
    const savedDel = readJSON('deliveryInfo', {}) || {};
    const candidate = readJSON('orderAddressDetails', {})?.address || savedDel.address || customer?.address || savedCustomer?.address || '';
    if (isGuestValue(candidate)) return { address: '', fee: 0, feeDisplay: '' };
    return {
      address: String(candidate),
      fee: Number(savedDel.fee) || 0,
      feeDisplay: savedDel.feeDisplay || '',
      isManual: Boolean(savedDel.isManual),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAgent, loggedIn]);
  const [delivery, setDelivery] = useState(initialDelivery);
  const defaultDeliveryAddressRef = useRef(initialDelivery.address);

  useEffect(() => {
    if (isAgent || !loggedIn) return;
    const fallback = customer?.address || savedCustomer?.address || delivery.address;
    if (!defaultDeliveryAddressRef.current && fallback && !isGuestValue(fallback)) {
      defaultDeliveryAddressRef.current = fallback;
    }
  }, [isAgent, loggedIn, customer, savedCustomer, delivery.address]);

  const [method, setMethod] = useState(telecel ? 'Mobile Money' : '');
  const [stage, setStage] = useState('form'); // form | payment | otp | pending | review | posting | support
  const [busy, setBusy] = useState(false);
  const [auth, setAuth] = useState(false);
  const [error, setError] = useState('');

  // Payment modal state
  const [momoNumber, setMomoNumber] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState(telecel ? 'vodafone' : '');
  const [manualNetworkOverride, setManualNetworkOverride] = useState(false);
  const [validatingAccount, setValidatingAccount] = useState(false);
  const [accountValidated, setAccountValidated] = useState(false);
  const [accountValidationError, setAccountValidationError] = useState('');
  const [subscriberName, setSubscriberName] = useState('');
  const [validationTick, setValidationTick] = useState(0);
  const validationReqIdRef = useRef(0);

  // Verified MoMo numbers + stateless OTP state
  const [verifiedMoMoMap, setVerifiedMoMoMap] = useState(() => readVerifiedMoMoNumbers());
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const [otpTargetNumber, setOtpTargetNumber] = useState('');
  const [promptCountdown, setPromptCountdown] = useState(0); // secs until the post-OTP prompt is sent
  const otpTokensByMsisdnRef = useRef({});

  // Auto-recheck (2-min inactivity) state
  const [autoCheckIn, setAutoCheckIn] = useState(null); // seconds remaining, null when inactive
  const [autoChecking, setAutoChecking] = useState(false);

  const active = useRef(false);
  const finished = useRef(false);
  const submitting = useRef(false);
  const requestActive = useRef(false);
  const pollTimer = useRef(null);
  const pollDeadline = useRef(null);
  const autoCheckTimer = useRef(null);
  const currentRef = useRef(null);

  // Refs mirrored every render so timers never read stale state.
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const stageRef = useRef(stage);
  stageRef.current = stage;

  const cartId = String(cartState.cartId || readJSON('cartId', '') || '').replace(/^"|"$/g, '');
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + price(item) * qty(item), 0), [items]);
  const shipping = Number(delivery?.fee) || 0;
  const serviceCharge = Math.min(20, (subtotal + shipping) * .01);
  const amount = subtotal + shipping + (method === 'Mobile Money' ? serviceCharge : 0);

  const detectedNetworkInfo = useMemo(() => (isAgent ? null : detectMoMoNetwork(momoNumber)), [isAgent, momoNumber]);
  const normalizedMomoMsisdn = useMemo(() => (isAgent ? '' : toGhanaMsisdn(momoNumber)), [isAgent, momoNumber]);
  const isMomoVerified = useMemo(
    () => Boolean(normalizedMomoMsisdn && verifiedMoMoMap[normalizedMomoMsisdn]?.verified),
    [normalizedMomoMsisdn, verifiedMoMoMap]
  );
  const network = selectedNetwork || (telecel ? 'vodafone' : detectedNetworkInfo?.network || '');

  const handleMomoNumberChange = (val) => {
    setMomoNumber(val);
    setAccountValidated(false);
    setAccountValidationError('');
    setSubscriberName('');
    setOtpError('');
    const autoNet = detectMoMoNetwork(val);
    if (telecel) {
      setSelectedNetwork('vodafone');
      setManualNetworkOverride(false);
    } else if (autoNet?.network) {
      setSelectedNetwork(autoNet.network);
      setManualNetworkOverride(false);
    } else if (!manualNetworkOverride) {
      setSelectedNetwork(telecel ? 'vodafone' : '');
    }
  };

  const handleSelectNetwork = (netValue) => {
    if (busy || otpBusy) return;
    setSelectedNetwork(netValue);
    setManualNetworkOverride(true);
    setAccountValidated(false);
    setAccountValidationError('');
    setSubscriberName('');
  };

  const retryAccountValidation = () => setValidationTick(t => t + 1);

  // Auto-validate MoMo number & fetch subscriber name inside the payment modal
  useEffect(() => {
    if (stage !== 'payment') return;
    const cleanMsisdn = toGhanaMsisdn(momoNumber);
    const service = NETWORKS[network];
    if (!cleanMsisdn || !service || (telecel && detectMoMoNetwork(momoNumber)?.network !== 'vodafone')) {
      validationReqIdRef.current += 1;
      setValidatingAccount(false);
      setAccountValidated(false);
      setSubscriberName('');
      setAccountValidationError(telecel && cleanMsisdn ? 'Telecel checkout accepts Telecel numbers only.' : '');
      return;
    }
    const reqId = ++validationReqIdRef.current;
    setValidatingAccount(true);
    setAccountValidated(false);
    setSubscriberName('');
    setAccountValidationError('');
    const timer = setTimeout(async () => {
      try {
        const valResult = await dispatch(validateAccount({ msisdn: cleanMsisdn, network: service })).unwrap();
        if (!active.current || validationReqIdRef.current !== reqId) return;
        const isValidCode = String(valResult?.responseCode ?? '') === '01';
        const returnedName = valResult?.name || valResult?.subscriberName || valResult?.accountName || '';
        if (isValidCode) {
          setSubscriberName(returnedName);
          setAccountValidated(true);
          setAccountValidationError('');
        } else {
          setSubscriberName('');
          setAccountValidated(false);
          setAccountValidationError(
            valResult?.responseMessage || 'Could not verify this Mobile Money number on the selected network. Check the number or switch network.'
          );
        }
      } catch (e) {
        if (!active.current || validationReqIdRef.current !== reqId) return;
        setSubscriberName('');
        setAccountValidated(false);
        setAccountValidationError(
          typeof e === 'string' ? e : e?.message || 'Unable to validate this Mobile Money number right now. Please check the number/network and retry.'
        );
      } finally {
        if (active.current && validationReqIdRef.current === reqId) setValidatingAccount(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [stage, momoNumber, network, validationTick, dispatch, telecel]);

  useEffect(() => {
    if (otpResendTimer <= 0) return;
    const t = setTimeout(() => setOtpResendTimer(s => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [otpResendTimer]);

  useEffect(() => {
    if (promptCountdown <= 0) return;
    const t = setTimeout(() => setPromptCountdown(s => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [promptCountdown]);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      clearTimeout(pollTimer.current);
      clearTimeout(autoCheckTimer.current);
      dispatch(resetPaymentState());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!telecel && cartState.cart?.length && !finished.current) setItems(cartState.cart);
  }, [cartState.cart, telecel]);

  useEffect(() => {
    if (cartId && !items.length) dispatch(getCartById(cartId));
  }, [cartId, dispatch, items.length]);

  // ── Late sign-in hydration — CUSTOMERS ONLY ──────────────────────
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current || !loggedIn || isAgent) return;
    let filled = false;
    if (!recipient && accountName && !different) { setRecipient(accountName); filled = true; }
    if (!phone && accountPhone) { setPhone(accountPhone); filled = true; }
    if (!delivery.address && defaultDeliveryAddressRef.current) {
      setDelivery(prev => ({ ...prev, address: defaultDeliveryAddressRef.current }));
      filled = true;
    }
    if (filled) hydratedRef.current = true;
  }, [loggedIn, isAgent, different, recipient, phone, delivery.address, accountName, accountPhone]);

  // ── Agent safety net ─────────────────────────────────────────────
  const agentResetRef = useRef(false);
  useEffect(() => {
    if (!isAgent || agentResetRef.current) return;
    agentResetRef.current = true;
    if (different) {
      setDifferent(false);
      try { localStorage.setItem('checkoutDifferentRecipient', 'false'); } catch { /* best effort */ }
    }
    if (recipient && (recipient === accountName || isGuestValue(recipient))) setRecipient('');
    if (phone && phone === accountPhone) setPhone('');
    if (momoNumber) setMomoNumber('');
    if (delivery.address && delivery.address === defaultDeliveryAddressRef.current) {
      setDelivery({ address: '', fee: 0, feeDisplay: '' });
    }
    defaultDeliveryAddressRef.current = '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAgent]);

  // Never let a "Guest" placeholder survive into the order.
  useEffect(() => {
    if (isGuestValue(recipient) && recipient) setRecipient('');
  }, [recipient]);

  const toggleRecipient = () => {
    if (busy || stage !== 'form' || isAgent) return;
    const next = !different;
    setError('');
    setDifferent(next);
    try { localStorage.setItem('checkoutDifferentRecipient', String(next)); } catch { /* best effort */ }
    if (next) {
      setRecipient('');
      setPhone('');
    } else {
      setRecipient(accountName);
      setPhone(accountPhone);
    }
  };

  const cancel = (reason = 'Payment was cancelled.') => {
    if (finished.current) return;
    finished.current = true;
    clearTimeout(pollTimer.current);
    clearTimeout(autoCheckTimer.current);
    setAutoCheckIn(null);
    navigate('/order-cancelled', { replace: true, state: { reason, orderId: currentRef.current?.orderId } });
    removeDraft();
  };

  const cleanSuccess = (current, paid) => {
    const destination = completedOrderRoute({
      orderId: current.orderId,
      paid,
      paymentMode: current.checkout.PaymentMode,
      accountType: current.checkout.customerAccountType,
      telecel,
    });
    const savedCust = readJSON('customer') || (customerId(customer) ? customer : null);
    navigate(destination, {
      replace: true,
      state: {
        placed: true,
        orderId: current.orderId,
        paymentMode: current.checkout.PaymentMode,
        paymentConfirmed: paid,
        totalAmount: current.checkout.totalAmount,
      },
    });
    dispatch(clearCart());
    try {
      ['cart', 'cartId', ...(telecel ? ['telCheckoutCart', 'selectedCart'] : [])]
        .forEach(k => localStorage.removeItem(k));
      if (isAgent) ['deliveryInfo', 'recentDeliveryAddresses'].forEach(k => localStorage.removeItem(k));
      if (savedCust) localStorage.setItem('customer', JSON.stringify(savedCust));
      if (!isAgent) {
        localStorage.setItem('checkoutDetails', JSON.stringify(current.checkout));
        localStorage.setItem('orderAddressDetails', JSON.stringify(current.address));
      }
    } catch { /* storage is best effort */ }
  };

  const postOrder = async (current, paid) => {
    if (finished.current || current.posting) return;
    current.posting = true;
    current.paid = paid;
    setStage('posting');
    try {
      assertOrderDetails(current.checkout, current.address);
      const result = await dispatch(checkOutOrder({ cartId: current.checkout.Cartid, ...current.checkout })).unwrap();
      assertOrderAccepted(result);
      current.created = true;
      const addressResult = await dispatch(updateOrderDelivery(current.address)).unwrap();
      assertOrderAccepted(addressResult);
      if (!active.current || finished.current) return;
      finished.current = true;
      cleanSuccess(current, paid);
    } catch (e) {
      if (!active.current) return;
      setError(`${paid ? 'Payment succeeded, but your order needs assistance.' : 'Order could not be placed.'} Reference: ${current.orderId}. ${e?.message || e || ''}`);
      setStage('support');
      message.error('Please contact support with your reference. Do not pay again.');
    }
  };

  const poll = current => {
    if (finished.current || !active.current) return;
    pollTimer.current = setTimeout(async () => {
      if (requestActive.current || finished.current || !active.current) return;
      requestActive.current = true;
      try {
        const response = await dispatch(checkTransactionStatus({ refNo: current.orderId })).unwrap();
        if (finished.current || !active.current) return;
        const result = paymentOutcome(response);
        if (result === 'success') { await postOrder(current, true); return; }
        if (result === 'failed') { cancel(response?.responseMessage || 'Payment declined.'); return; }
      } catch { /* transient network errors do not cancel */ }
      finally { requestActive.current = false; }
      if (Date.now() < pollDeadline.current) poll(current);
      else setStage('review');
    }, 4000);
  };

  /* Manual "I've Approved" check — never auto-cancels on its own. */
  const checkAgain = async () => {
    const current = currentRef.current;
    if (!current || busy || finished.current) return;
    setBusy(true);
    try {
      const response = await dispatch(checkTransactionStatus({ refNo: current.orderId })).unwrap();
      const result = paymentOutcome(response);
      if (result === 'success') await postOrder(current, true);
      else if (result === 'failed') cancel(response?.responseMessage || 'Payment declined.');
      else setError('Still waiting for payment confirmation. Please approve on your phone and check again.');
    } catch {
      setError('Cannot check payment right now. Please try again; do not pay twice.');
    } finally {
      if (active.current && !finished.current) setBusy(false);
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // AUTO-RECHECK — fires after 2 minutes of inactivity inside the
  // "Approve Your MoMo Payment" modal (review stage).
  //
  //   responseCode "01" / success  → place the order
  //   anything else (pending/failed) → auto-cancel the order
  //
  // If the status CHECK itself fails (network), we do NOT cancel — the
  // payment may still be on its way — we surface a note and retry in 30s.
  // ═════════════════════════════════════════════════════════════════
  const autoArmRef = useRef(() => {});
  const autoRecheckRef = useRef(() => {});

  const autoRecheck = async () => {
    const current = currentRef.current;
    if (!current || finished.current || !active.current) return;
    if (busyRef.current) {
      autoArmRef.current(15000); // a manual check is in flight — try again shortly
      return;
    }
    setAutoChecking(true);
    try {
      const response = await dispatch(checkTransactionStatus({ refNo: current.orderId })).unwrap();
      if (finished.current || !active.current) return;
      const result = paymentOutcome(response);
      if (result === 'success') {
        await postOrder(current, true);
        return;
      }
      // Not a successful transaction → auto-cancel.
      cancel(
        result === 'failed'
          ? (response?.responseMessage || 'Payment declined.')
          : 'Payment was not approved within 2 minutes, so the order was cancelled automatically.'
      );
    } catch {
      if (!active.current || finished.current) return;
      setError('Auto-check could not reach the payment server. Tap "I\'ve Approved — Confirm Payment" to retry.');
      autoArmRef.current(AUTO_RECHECK_RETRY_MS);
    } finally {
      if (active.current) setAutoChecking(false);
    }
  };
  autoRecheckRef.current = autoRecheck;

  useEffect(() => {
    if (stage !== 'review') {
      autoArmRef.current = () => {};
      setAutoCheckIn(null);
      return undefined;
    }

    let deadline = Date.now() + AUTO_RECHECK_MS;
    setAutoCheckIn(Math.ceil(AUTO_RECHECK_MS / 1000));

    const fire = () => autoRecheckRef.current?.();
    const arm = (ms = AUTO_RECHECK_MS) => {
      clearTimeout(autoCheckTimer.current);
      deadline = Date.now() + ms;
      autoCheckTimer.current = setTimeout(fire, ms);
    };
    autoArmRef.current = arm;
    arm();

    // Visible countdown, driven by the same deadline the timer uses.
    const tick = setInterval(() => {
      setAutoCheckIn(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 1000);

    // Any interaction counts as activity and resets the 2-minute window.
    const onActivity = () => arm();
    window.addEventListener('pointerdown', onActivity);
    window.addEventListener('keydown', onActivity);

    return () => {
      clearTimeout(autoCheckTimer.current);
      clearInterval(tick);
      window.removeEventListener('pointerdown', onActivity);
      window.removeEventListener('keydown', onActivity);
      autoArmRef.current = () => {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // ═════════════════════════════════════════════════════════════════
  // STEP B: SEND TRANSFLOW PAYMENT PROMPT
  // ═════════════════════════════════════════════════════════════════
  const sendMoMoPrompt = async (cleanMsisdn, selectedService) => {
    const current = currentRef.current;
    if (!current || finished.current) return;
    setBusy(true);
    setError('');
    current.checkout = {
      ...current.checkout,
      PaymentAccountNumber: cleanMsisdn,
      paymentService: selectedService,
    };
    dispatch(saveCheckoutDetails(current.checkout));
    const narration = items.map(i => i.productName || i.ProductName || 'Item').join(', ').slice(0, 120);
    message.loading({
      content: `Sending MoMo prompt to ${subscriberName || momoNumber}…`,
      key: 'momo-init',
      duration: 3,
    });
    try {
      const debitRes = await dispatch(debitCustomer({
        refNo: current.orderId,
        msisdn: cleanMsisdn,
        amount,
        network: selectedService,
        narration,
      })).unwrap();
      if (!active.current || finished.current) return;
      const outcome = paymentOutcome(debitRes);
      if (outcome === 'success') {
        await postOrder(current, true);
      } else if (outcome === 'failed') {
        cancel(debitRes?.responseMessage || 'Payment declined.');
      } else {
        setStage('pending');
        pollDeadline.current = Date.now() + 65000;
        poll(current);
      }
    } catch (e) {
      if (!active.current) return;
      const errMsg = e?.message || String(e || 'Could not initiate Mobile Money payment prompt.');
      setError(errMsg);
      setAccountValidationError(errMsg);
      setStage('payment');
      message.error(errMsg);
    } finally {
      if (active.current && !finished.current) setBusy(false);
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // MOMO SMS OTP VERIFICATION HANDLERS (Stateless otpToken supported)
  // ═════════════════════════════════════════════════════════════════
  const requestMoMoOtp = async () => {
    const cleanMsisdn = toGhanaMsisdn(momoNumber);
    const service = NETWORKS[network];
    if (!cleanMsisdn || !service) {
      setAccountValidationError('Please enter a valid Ghana Mobile Money number and select a network.');
      return false;
    }
    setOtpBusy(true);
    setOtpError('');
    try {
      const res = await dispatch(sendMoMoOtp({ msisdn: cleanMsisdn })).unwrap();
      if (!active.current) return false;
      if (res?.otpToken) {
        const prevList = otpTokensByMsisdnRef.current[cleanMsisdn] || [];
        otpTokensByMsisdnRef.current[cleanMsisdn] = [res.otpToken, ...prevList].slice(0, 3);
      }
      setOtpTargetNumber(String(momoNumber).trim());
      setOtpCode('');
      setOtpResendTimer(Number(res?.resendCooldownSeconds) || 45);
      setStage('otp');
      message.success(`Verification OTP sent via SMS to ${String(momoNumber).trim()}.`);
      return true;
    } catch (e) {
      if (!active.current) return false;
      const retryAfter = Number(e?.retryAfterSeconds) || 0;
      const errMsg = e?.message || String(e || 'Could not send OTP right now. Please try again.');
      if (retryAfter > 0) {
        setOtpResendTimer(retryAfter);
        setOtpTargetNumber(String(momoNumber).trim());
        setStage('otp');
        setOtpError(errMsg);
      } else {
        setAccountValidationError(errMsg);
        setOtpError(errMsg);
        message.error(errMsg);
      }
      return false;
    } finally {
      if (active.current) setOtpBusy(false);
    }
  };

  const handlePayNow = async () => {
    if (busy || otpBusy || validatingAccount || finished.current) return;
    const cleanMsisdn = toGhanaMsisdn(momoNumber);
    const service = NETWORKS[network];
    if (!cleanMsisdn || !service || !accountValidated || (telecel && detectMoMoNetwork(momoNumber)?.network !== 'vodafone')) {
      setAccountValidationError('Enter a valid Mobile Money number, select the network, and wait for account validation.');
      return;
    }
    if (isMoMoNumberVerified(momoNumber)) {
      await sendMoMoPrompt(cleanMsisdn, service);
      return;
    }
    await requestMoMoOtp();
  };

  const confirmMoMoOtp = async () => {
    if (otpBusy || busy) return;
    const trimmedCode = String(otpCode || '').trim();
    if (!isValidVerificationCode(trimmedCode)) {
      setOtpError('Enter the 6-digit verification code sent to your phone.');
      return;
    }
    const cleanMsisdn = toGhanaMsisdn(momoNumber);
    const service = NETWORKS[network];
    if (!cleanMsisdn || !service) {
      setOtpError('Invalid Mobile Money number or network. Please go back and check.');
      return;
    }
    const tokens = otpTokensByMsisdnRef.current[cleanMsisdn] || [];
    const latestToken = tokens[0] || undefined;
    setOtpBusy(true);
    setOtpError('');
    try {
      const res = await dispatch(
        verifyMoMoOtp({
          msisdn: cleanMsisdn,
          code: trimmedCode,
          otpToken: latestToken,
          otpTokens: tokens,
        })
      ).unwrap();
      if (!active.current) return;
      if (!res?.verified) {
        setOtpError(res?.message || 'Verification failed. Please check the code and try again.');
        return;
      }
      const updatedMap = markMoMoNumberVerified(momoNumber, {
        verifiedAt: res.verifiedAt || Date.now(),
        network: service,
      });
      setVerifiedMoMoMap(updatedMap);
      delete otpTokensByMsisdnRef.current[cleanMsisdn];
      setOtpCode('');
      setOtpError('');
      dispatch(resetOtpState());
      message.success('OTP verified! Your payment prompt will be sent in a few seconds…');

      // Wait before pushing the debit prompt so it actually reaches the phone.
      // otpBusy stays true throughout, so the modal can't be closed or resubmitted.
      setPromptCountdown(Math.ceil(POST_OTP_PROMPT_DELAY_MS / 1000));
      await sleep(POST_OTP_PROMPT_DELAY_MS);
      if (!active.current || finished.current) return; // customer left during the wait
      setPromptCountdown(0);

      await sendMoMoPrompt(cleanMsisdn, service);
    } catch (e) {
      if (!active.current) return;
      setOtpError(e?.message || String(e || 'Invalid or expired verification code.'));
    } finally {
      if (active.current) {
        setOtpBusy(false);
        setPromptCountdown(0);
      }
    }
  };

  const cancelOtpModal = () => {
    if (otpBusy || busy) return;
    setOtpCode('');
    setOtpError('');
    setStage('payment');
  };

  // ═════════════════════════════════════════════════════════════════
  // STEP A: PLACE ORDER -> VALIDATE CART -> OPEN PAYMENT MODAL (MoMo)
  // ═════════════════════════════════════════════════════════════════
  const begin = async override => {
    if (submitting.current || finished.current) return;
    const c = override && customerId(override) ? override : customer;
    if (!customerId(c)) { setAuth(true); return; }
    const name = String(recipient || '').trim();
    const contact = String(phone || '').trim();
    const addressText = String(delivery?.address || '').trim();
    if (!items.length || !cartId || !name || isGuestValue(name) || !contact || !addressText || isGuestValue(addressText) || !method) {
      setError(isAgent
        ? "Enter your customer's name, contact number, delivery address and select a payment method."
        : 'Check your cart, recipient name, contact number, delivery address and payment method.');
      return;
    }
    const isCustomerMoMo = !(!telecel && String(c.accountType || '').toLowerCase() === 'agent') && method === 'Mobile Money';
    submitting.current = true;
    setBusy(true);
    setError('');
    const orderId = generateOrderCode(telecel);
    const { checkout, delivery: address } = buildOrderDetails({
      cartId, customerId: customerId(c), orderId, paymentMode: method,
      contact, accountType: c.accountType, subtotal: amount,
      recipientName: name, recipientContactNumber: contact,
      orderNote: note, orderDate: new Date().toISOString(),
      address: addressText, paymentService: telecel ? NETWORKS.vodafone : 'N/A',
    });
    const current = { orderId, checkout, address, posting: false, created: false, paid: false };
    currentRef.current = current;
    dispatch(saveCheckoutDetails(checkout));
    dispatch(saveAddressDetails(address));
    try {
      await dispatch(validateCart({
        cartId,
        customerid: customerId(c),
        orderDate: checkout.orderDate,
        paymentMode: method,
        paymentService: checkout.paymentService,
        paymentAccountNumber: contact,
        customerAccountType: checkout.customerAccountType,
        items: items.map(i => ({ productId: String(i.productId ?? i.productID ?? i.ProductId ?? i.id ?? ''), price: price(i), quantity: qty(i) })),
      })).unwrap();
      if (!active.current) return;
      if (!isCustomerMoMo) {
        await postOrder(current, false);
        return;
      }
      setVerifiedMoMoMap(readVerifiedMoMoNumbers());
      setAccountValidated(false);
      setAccountValidationError('');
      setSubscriberName('');
      setOtpCode('');
      setOtpError('');
      setStage('payment');
    } catch (e) {
      if (e?.isPriceUpdate) {
        dispatch(clearCart());
        setItems([]);
        setError(FRIENDLY_PRICE_UPDATE_MSG);
      } else {
        setError(e?.message || String(e || 'Could not process order.'));
      }
      setStage('form');
    } finally {
      submitting.current = false;
      if (active.current && !finished.current) setBusy(false);
    }
  };

  const handleAuthSuccess = c => {
    setAuth(false);
    const signedInAsAgent = String(c?.accountType || '').toLowerCase() === 'agent';
    if (customerId(c) && !signedInAsAgent) {
      const newName = customerNameOf(c);
      const newPhone = c.contactNumber || c.ContactNumber || '';
      if (!recipient && newName) setRecipient(newName);
      if (!phone && newPhone) setPhone(newPhone);
    }
    message.info('Signed in. Review the order and proceed.');
  };

  const flow = {
    items, customer, loggedIn, different, toggleRecipient, recipient, setRecipient,
    phone, setPhone, note, setNote, delivery, setDelivery, method, setMethod,
    subtotal, shipping, serviceCharge, amount, error, stage, setStage, busy,
    begin, number: momoNumber, setMomoNumber: handleMomoNumberChange,
    network, handleSelectNetwork, manualNetworkOverride,
    validatingAccount, accountValidated, accountValidationError, retryAccountValidation,
    normalizedMomoMsisdn, isMomoVerified, detectedNetworkInfo, subscriberName,
    handlePayNow,
    otpCode, setOtpCode, otpError, otpBusy, otpResendTimer, otpTargetNumber, promptCountdown,
    requestMoMoOtp, confirmMoMoOtp, cancelOtpModal,
    checkAgain, cancel, auth, setAuth, handleAuthSuccess, currentRef,
    autoCheckIn, autoChecking,
    isAgent, telecel,
  };

  return <CheckoutView flow={flow} />;
}

const netTiles = [
  { value: 'mtn', logo: mtnLogo, name: 'MTN MoMo', sub: 'Dial *170#', bg: '#fffbeb', border: '#fbbf24', color: '#d97706' },
  { value: 'vodafone', logo: vodafoneLogo, name: 'Telecel Cash', sub: 'Dial *110#', bg: '#fff1f2', border: '#fda4af', color: '#e11d48' },
  { value: 'airteltigo', logo: airteltigoLogo, name: 'AT Money', sub: 'Dial *110#', bg: '#eff6ff', border: '#93c5fd', color: '#2563eb' },
];

const money = n => `GH₵${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const unit = i => Number(i.unitPrice ?? i.UnitPrice ?? i.price ?? i.Price ?? 0);
const quantity = i => Number(i.quantity ?? i.Quantity ?? 1);
const productImage = i => i.imagePath && `https://testing.frankotrading.com/Media/Products_Images/${String(i.imagePath).split('\\').pop()}`;

function CheckoutView({ flow }) {
  const navigate = useNavigate();
  const [missing, setMissing] = useState(false);
  const {
    items, customer, loggedIn, different, toggleRecipient, recipient, setRecipient,
    phone, setPhone, note, setNote, delivery, setDelivery, method, setMethod,
    subtotal, shipping, serviceCharge, amount, error, stage, setStage, busy, begin,
    number, setMomoNumber, network, handleSelectNetwork,
    validatingAccount, accountValidated, accountValidationError, retryAccountValidation,
    normalizedMomoMsisdn, isMomoVerified, subscriberName,
    handlePayNow,
    otpCode, setOtpCode, otpError, otpBusy, otpResendTimer, otpTargetNumber, promptCountdown,
    requestMoMoOtp, confirmMoMoOtp, cancelOtpModal, checkAgain, cancel,
    auth, setAuth, handleAuthSuccess, currentRef,
    autoCheckIn, autoChecking,
    isAgent, telecel,
  } = flow;

  const freeDelivery = Number(delivery.fee) === 0 && String(delivery.feeDisplay || '').toLowerCase().includes('free');
  const naDelivery = Number(delivery.fee) === 0 && (!delivery.feeDisplay || String(delivery.feeDisplay).toLowerCase() === 'n/a');
  const displayTotal = subtotal + shipping + (method === 'Mobile Money' ? serviceCharge : 0);
  const paymentLabel = loggedIn ? 'Place Order' : 'Register & Place Order';
  const orderId = currentRef.current?.orderId;
  const postingPaid = currentRef.current?.paid === true;
  const currentNetwork = netTiles.find(n => n.value === network);

  const approval = {
    mtn: ['Dial *170# on your MTN phone', 'Select My Wallet, then My Approvals', 'Enter your MoMo PIN to load pending requests', 'Select the Franko Trading transaction', 'Approve the payment'],
    vodafone: ['Dial *110# on your Telecel / Vodafone phone', 'Open pending approvals', 'Enter your PIN and select the Franko Trading transaction', 'Approve the payment'],
    airteltigo: ['Dial *110# on your AT phone', 'Open pending approvals', 'Enter your PIN and select the Franko Trading transaction', 'Approve the payment'],
  };

  const checkout = () => {
    if (loggedIn && (!delivery.address?.trim() || !method || !recipient?.trim() || !phone?.trim())) {
      setMissing(true);
      return;
    }
    begin();
  };

  return (
    <>
      <style>{checkoutStyles}</style>
      <div className={`co-root ${telecel ? 'co-tel' : ''}`}>
        {busy && (
          <div className="co-loading-overlay">
            <div className="co-loading-card">
              <div className="co-spinner" role="status" aria-label="Processing your order" />
              <div className="co-loading-text">Processing your order…</div>
            </div>
          </div>
        )}

        <div className="co-container">
          <div className="co-page-header">
            <div className="co-page-header-accent" />
            <div>
              <h1 className="co-page-title">{telecel ? 'Checkout' : isAgent ? 'Agent Checkout' : 'Checkout'}</h1>
              <p className="co-page-count">{items.length} item{items.length === 1 ? '' : 's'} in cart</p>
            </div>
            <div className="co-page-header-line" />
          </div>

          {error && (
            <div className="co-warning-banner" role="alert">
              <ExclamationTriangleIcon style={{ width: 18, height: 18, color: '#d97706' }} />
              <p>{error}</p>
            </div>
          )}

          {!items.length ? (
            <div className="co-empty">
              <div className="co-empty-icon"><ShoppingBagIcon style={{ width: 36, height: 36, color: '#888' }} /></div>
              <div className="co-empty-title">Your cart is empty</div>
              <div className="co-empty-desc">Add items to your cart to proceed with checkout.</div>
              <button className="co-btn-primary" style={{ maxWidth: 280 }} onClick={() => navigate('/')}>Continue Shopping</button>
            </div>
          ) : (
            <div className="co-layout">
              {/* SIDEBAR: RECIPIENT & DELIVERY */}
              <div className="co-sidebar">
                <div className="co-card">
                  <div className="co-card-header">
                    <h3 className="co-card-title">{isAgent ? "Customer's Delivery Details" : 'Delivery Details'}</h3>
                    <div className="co-section-accent"><div className="co-section-accent-bar" /><div className="co-section-accent-line" /></div>
                  </div>
                  <div className="co-card-body">
                    {!loggedIn && (
                      <div className="co-auth-banner">
                        <div className="co-auth-banner-icon"><LockClosedIcon style={{ width: 18, height: 18, color: '#14532d' }} /></div>
                        <div className="co-auth-banner-copy">
                          <p className="co-auth-banner-title">Register to place this order</p>
                          <p className="co-auth-banner-desc">No customer account is signed in. You’ll be asked to register or sign in before the order can be placed.</p>
                          <button className="co-auth-banner-btn" onClick={() => setAuth(true)}>Register now</button>
                        </div>
                      </div>
                    )}

                    {!isAgent && (
                      <>
                        <div
                          className="co-toggle-wrap"
                          role="switch"
                          aria-checked={different}
                          tabIndex={0}
                          onClick={toggleRecipient}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRecipient(); } }}
                        >
                          <div className="co-toggle-left">
                            <UserIcon style={{ width: 16, height: 16, color: '#888' }} />
                            <span>Someone else is receiving this order?</span>
                          </div>
                          <div className={`co-toggle-track ${different ? 'co-toggle-track-on' : 'co-toggle-track-off'}`}>
                            <div className={`co-toggle-knob ${different ? 'co-toggle-knob-on' : ''}`} />
                          </div>
                        </div>
                        {different && (
                          <div className="co-warning-banner">
                            <ExclamationTriangleIcon style={{ width: 16, height: 16, color: '#d97706', flexShrink: 0 }} />
                            <p>Enter the recipient’s name and contact number below.</p>
                          </div>
                        )}
                      </>
                    )}

                    <CheckoutForm
                      customerName={recipient}
                      setCustomerName={setRecipient}
                      customerNumber={phone}
                      setCustomerNumber={setPhone}
                      phoneLocked={false}
                      deliveryInfo={delivery}
                      setDeliveryInfo={setDelivery}
                      orderNote={note}
                      setOrderNote={setNote}
                      locations={locations}
                      customerAccountType={customer?.accountType}
                      isAuthenticated={loggedIn}
                      customerAccountId={customer ? customerId(customer) : null}
                    />
                  </div>
                </div>
              </div>

              {/* MAIN: ORDER SUMMARY & PAYMENT METHOD */}
              <div className="co-main">
                <div className="co-card">
                  <div className="co-card-header">
                    <h3 className="co-card-title">Order Summary</h3>
                    <div className="co-section-accent"><div className="co-section-accent-bar" /><div className="co-section-accent-line" /></div>
                  </div>
                  <div className="co-card-body">
                    <div className="co-items-list">
                      {items.map((item, index) => (
                        <div key={item.productId || item.id || index} className="co-item">
                          <div className="co-item-left">
                            <div>
                              {productImage(item) ? (
                                <img src={productImage(item)} alt="Product" className="co-item-img" onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
                              ) : null}
                              <div className="co-item-img-placeholder" style={productImage(item) ? { display: 'none' } : {}}>No Image</div>
                            </div>
                            <div className="co-item-info">
                              <p className="co-item-name">{item.productName || item.ProductName || 'Product'}</p>
                              <p className="co-item-unit">Unit: {money(unit(item))}</p>
                              <span className="co-item-qty">Qty {quantity(item)}</span>
                            </div>
                          </div>
                          <span className="co-item-price">{money(unit(item) * quantity(item))}</span>
                        </div>
                      ))}
                    </div>

                    <div className="co-totals">
                      <div className="co-total-row">
                        <span className="co-total-row-label">Subtotal</span>
                        <span className="co-total-row-value">{money(subtotal)}</span>
                      </div>
                      <div className="co-total-row">
                        <span className="co-total-row-label">Shipping Fee</span>
                        {freeDelivery ? <span className="co-total-row-free">FREE DELIVERY</span>
                          : naDelivery ? <span className="co-total-row-warning">{isAgent ? 'Agent delivery' : 'Delivery charges apply'}</span>
                          : shipping > 0 ? <span className="co-total-row-value">{money(shipping)}</span>
                          : <span className="co-total-row-warning">Select location</span>}
                      </div>
                      {method === 'Mobile Money' && (
                        <div className="co-service-charge">
                          <span>{subtotal + shipping > 2000 ? 'MoMo Service Charge:' : 'MoMo Service Charge (1%):'}</span>
                          <span>{money(serviceCharge)}</span>
                        </div>
                      )}
                      <div className="co-grand-total">
                        <span className="co-grand-total-label">Total Amount</span>
                        <span className="co-grand-total-value">{money(displayTotal)}</span>
                      </div>
                    </div>

                    <Divider style={{ margin: '20px 0' }} />

                    <div className="co-payment-section">
                      <p className="co-payment-title">Payment Method</p>
                      <Radio.Group value={method} onChange={e => setMethod(e.target.value)} style={{ width: '100%' }}>
                        <div className="co-payment-options">
                          {!telecel && (isAgent || freeDelivery || (shipping > 0 && !naDelivery)) && (
                            <label className={`co-payment-option ${method === 'Cash on Delivery' ? 'co-payment-option-active' : ''}`}>
                              <Radio value="Cash on Delivery" />
                              <span className="co-payment-option-text">Cash on Delivery</span>
                            </label>
                          )}
                          {!isAgent && (
                            <label className={`co-payment-option ${method === 'Mobile Money' ? 'co-payment-option-active' : ''}`}>
                              <Radio value="Mobile Money" />
                              <span className="co-payment-option-text">{telecel ? 'Telecel Cash' : 'Mobile Money (MTN, Telecel, AT)'}</span>
                            </label>
                          )}
                          {!telecel && isAgent && ['Pick Up', 'Paid Already'].map(m => (
                            <label className={`co-payment-option ${method === m ? 'co-payment-option-active' : ''}`} key={m}>
                              <Radio value={m} />
                              <span className="co-payment-option-text">{m}</span>
                            </label>
                          ))}
                        </div>
                      </Radio.Group>
                    </div>

                    <div className="co-desktop-btn">
                      <button className="co-btn-primary" onClick={checkout} disabled={busy || stage !== 'form'}>
                        <ShoppingBagIcon style={{ width: 20, height: 20 }} />
                        {paymentLabel}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {!!items.length && (
          <div className="co-sticky-bottom">
            <button className="co-btn-primary" onClick={checkout} disabled={busy || stage !== 'form'}>
              <ShoppingBagIcon style={{ width: 20, height: 20 }} />
              {paymentLabel}
            </button>
          </div>
        )}

        <Modal open={missing} centered onCancel={() => setMissing(false)} title="Complete Required Fields" footer={<button className="co-btn-primary" onClick={() => setMissing(false)}>Got It</button>}>
          {isAgent
            ? "Please provide your customer's name, contact number, delivery address and a payment method."
            : 'Please provide the recipient name, contact number, delivery address and payment method.'}
        </Modal>

        {/* ── MOBILE MONEY PAYMENT MODAL ── */}
        <Modal
          open={stage === 'payment'}
          centered
          width={470}
          footer={null}
          onCancel={() => { if (!busy && !otpBusy) setStage('form'); }}
          closable={!busy && !otpBusy}
          maskClosable={!busy && !otpBusy}
          styles={{ body: { padding: 0 }, content: { borderRadius: 16, overflow: 'hidden' } }}
        >
          <div className="pm-modal-wrap">
            <div className="pm-header-compact">
              <div className="pm-header-left">
                <img src={frankoLogo} alt="Franko" className="pm-logo-small" />
                <div>
                  <p className="pm-company-small">Franko Trading</p>
                  <p className="pm-ref-small">{orderId}</p>
                </div>
              </div>
              <div className="pm-header-right">
                <p className="pm-amount-value-small">{money(amount)}</p>
              </div>
            </div>
            <div className="pm-body">
              <div className="pm-field">
                <div className="pm-field-header" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="pm-field-step-num">1</span>
                    <span className="pm-field-label">Enter Mobile Money Number</span>
                  </div>
            
                </div>
                <div className="pm-field-body">
                  <Input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    autoFocus
                    value={number}
                    onChange={e => setMomoNumber(e.target.value)}
                    placeholder={telecel ? 'Enter Telecel Cash number' : 'Enter MoMo number'}
                    prefix={<PhoneIcon style={{ width: 16, height: 16, color: '#14532d' }} />}
                    size="large"
                    disabled={busy || otpBusy}
                    style={{ fontWeight: 700, color: '#111827' }}
                  />
                  {String(number || '').trim() && !normalizedMomoMsisdn && (
                    <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 5 }}>
                      Enter a valid 10-digit Ghana Mobile Money number (MTN, Telecel, or AT).
                    </div>
                  )}
                </div>
              </div>

              <div className="pm-field">
                <div className="pm-field-header">
                  <span className="pm-field-step-num">2</span>
                  <span className="pm-field-label">Select Network Provider</span>
                </div>
                <div className="pm-field-body">
                  <div className="pm-networks">
                    {netTiles.filter(n => !telecel || n.value === 'vodafone').map(n => {
                      const isSelected = network === n.value;
                      return (
                        <button
                          type="button"
                          key={n.value}
                          className="pm-network-tile"
                          onClick={() => handleSelectNetwork(n.value)}
                          disabled={busy || otpBusy}
                          aria-pressed={isSelected}
                          style={{
                            background: isSelected ? n.bg : '#fafafa',
                            borderColor: isSelected ? n.border : '#e5e7eb',
                            opacity: isSelected ? 1 : 0.72,
                          }}
                        >
                          <img src={n.logo} alt={n.name} className="pm-network-logo" />
                          <div>
                            <p className="pm-network-name">{n.name}</p>
                            <p className="pm-network-sub">{isSelected ? 'Selected' : n.sub}</p>
                          </div>
                          {isSelected && <CheckCircleSolid style={{ width: 18, height: 18, color: n.color, marginTop: 2 }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {validatingAccount ? (
                <div className="pm-account-status pm-account-checking">
                  <div className="co-spinner" style={{ width: 16, height: 16, borderWidth: 2, flexShrink: 0 }} />
                  <div>Validating number &amp; account name with {currentNetwork?.name || 'network'}…</div>
                </div>
              ) : accountValidated ? (
                <div className="pm-account-status pm-account-valid">
                  <CheckCircleSolid style={{ width: 18, height: 18, color: '#16a34a', flexShrink: 0 }} />
                  <div style={{ fontSize: 12, fontWeight: 800 }}>
                    {subscriberName || 'Mobile Money Account Verified'}
                  </div>
                </div>
              ) : accountValidationError ? (
                <div className="pm-account-status pm-account-invalid" style={{ justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <ExclamationTriangleIcon style={{ width: 17, height: 17, flexShrink: 0, marginTop: 1 }} />
                    <span>{accountValidationError}</span>
                  </div>
                  {normalizedMomoMsisdn && network && (
                    <button
                      type="button"
                      className="co-otp-link"
                      style={{ color: '#b91c1c', whiteSpace: 'nowrap' }}
                      onClick={retryAccountValidation}
                      disabled={validatingAccount || busy || otpBusy}
                    >
                      Retry
                    </button>
                  )}
                </div>
              ) : null}

              <button
                type="button"
                className="co-btn-primary"
                onClick={handlePayNow}
                disabled={!accountValidated || validatingAccount || busy || otpBusy}
              >
                <ShieldCheckIcon style={{ width: 18, height: 18 }} />
                {otpBusy ? 'Sending OTP…' : busy ? 'Sending Payment Prompt…' : `Pay Now · ${money(amount)}`}
              </button>
              <div className="pm-security">
                <ShieldCheckIcon style={{ width: 12, height: 12 }} />
                Secured by GhIPSS · Transflow
              </div>
            </div>
          </div>
        </Modal>

        {/* ── MOBILE MONEY SMS OTP VERIFICATION MODAL ── */}
        <Modal
          open={stage === 'otp'}
          centered
          width={440}
          footer={null}
          onCancel={cancelOtpModal}
          closable={!otpBusy && !busy}
          maskClosable={!otpBusy && !busy}
          styles={{ body: { padding: 0 }, content: { borderRadius: 16, overflow: 'hidden' } }}
        >
          <div className="pm-modal-wrap">
            <div className="pm-header-compact">
              <div className="pm-header-left">
                <img src={frankoLogo} alt="Franko" className="pm-logo-small" />
                <div>
                  <p className="pm-company-small">Franko Trading</p>
                  <p className="pm-ref-small">Mobile Money OTP Verification</p>
                </div>
              </div>
              <div className="pm-header-right">
                <p className="pm-amount-value-small" style={{ fontSize: 18 }}>{money(amount)}</p>
              </div>
            </div>
            <div className="pm-body">
              <div style={{ textAlign: 'center', padding: '4px 0' }}>
                <p style={{ fontSize: 14, color: '#374151', margin: '0 0 8px', lineHeight: 1.5 }}>
                  Enter the 6-digit OTP sent via SMS to verify your MoMo number:
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 14px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <PhoneIcon style={{ width: 16, height: 16, color: '#14532d' }} />
                  <strong style={{ fontSize: 15, color: '#14532d' }}>{otpTargetNumber || number}</strong>
                  {currentNetwork && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '2px 8px', borderRadius: 100 }}>
                      {currentNetwork.name}
                    </span>
                  )}
                </div>
                {subscriberName && (
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#166534', margin: '6px 0 0' }}>
                    Account: {subscriberName}
                  </p>
                )}
              </div>

              {otpError && (
                <div className="co-warning-banner" role="alert" style={{ marginBottom: 0 }}>
                  <ExclamationTriangleIcon style={{ width: 16, height: 16, color: '#d97706', flexShrink: 0 }} />
                  <p>{otpError}</p>
                </div>
              )}

              {promptCountdown > 0 && (
                <div className="pm-account-status pm-account-valid" role="status">
                  <CheckCircleSolid style={{ width: 18, height: 18, color: '#16a34a', flexShrink: 0 }} />
                  <span>OTP verified. Sending your payment prompt in {promptCountdown}s…</span>
                </div>
              )}

              <div>
                <Input
                  className="co-otp-input"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onPressEnter={confirmMoMoOtp}
                  placeholder="000000"
                  disabled={otpBusy || busy}
                />
                <div style={{ fontSize: 11, color: '#6b7280', textAlign: 'center', marginTop: 6 }}>
                  Once verified, your payment prompt will be sent within a few seconds.
                </div>
              </div>

              <button
                type="button"
                className="co-btn-primary"
                onClick={confirmMoMoOtp}
                disabled={otpBusy || busy || otpCode.length !== 6}
              >
                <ShieldCheckIcon style={{ width: 18, height: 18 }} />
                {promptCountdown > 0 ? 'Preparing Payment Prompt…' : busy ? 'Sending Payment Prompt…' : otpBusy ? 'Verifying OTP…' : 'Verify OTP & Send Payment Prompt'}
              </button>

              <div className="co-otp-actions">
                <button
                  type="button"
                  className="co-otp-link"
                  onClick={requestMoMoOtp}
                  disabled={otpBusy || busy || otpResendTimer > 0}
                >
                  {otpResendTimer > 0 ? `Resend OTP in ${otpResendTimer}s` : 'Resend OTP'}
                </button>
                <button
                  type="button"
                  className="co-otp-link"
                  style={{ color: '#6b7280' }}
                  onClick={cancelOtpModal}
                  disabled={otpBusy || busy}
                >
                  Back to Payment Details
                </button>
              </div>

              <div className="pm-security">
                <ShieldCheckIcon style={{ width: 12, height: 12 }} />
                Code valid for 15 minutes · Never share your OTP with anyone
              </div>
            </div>
          </div>
        </Modal>

        {/* ── AWAITING PROMPT APPROVAL / REVIEW / POSTING / SUPPORT ── */}
        <Modal open={['pending', 'posting', 'review', 'support'].includes(stage)} centered width={520} footer={null} closable={false} maskClosable={false} styles={{ content: { background: '#f0fdf4', borderRadius: 20 } }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center' }}>
            {stage === 'posting' ? (
              <>
                <CheckCircleSolid style={{ width: 50, height: 50, color: '#16a34a', margin: 'auto' }} />
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#14532d' }}>{postingPaid ? 'Payment Confirmed!' : 'Order Placed!'}</h3>
                <p style={{ color: '#4b5563', margin: 0 }}>{postingPaid ? 'Creating your order and redirecting to confirmation…' : 'Finalizing your order and redirecting…'}</p>
              </>
            ) : stage === 'support' ? (
              <>
                <ExclamationTriangleIcon style={{ width: 50, height: 50, color: '#d97706', margin: 'auto' }} />
                <h3>Order needs assistance</h3>
                <p>{error}</p>
              </>
            ) : (
              <>
                <div className="pm-pending-anim" style={{ margin: 'auto' }}>
                  <div className="pm-pending-ring-outer" />
                  <div className="pm-pending-ring-spin" />
                  <div className="pm-pending-ring-inner"><PhoneIcon style={{ width: 28, height: 28, color: '#16a34a' }} /></div>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{stage === 'review' ? 'Approve Your MoMo Payment' : 'Check Your Phone'}</h3>
                <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>
                  We have sent an authorization prompt to <strong>{number}</strong> ({currentNetwork?.name || 'Mobile Money'}).
                </p>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                  Reference: <strong>{orderId}</strong> · Amount: <strong>{money(amount)}</strong>
                </p>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534', fontWeight: 600 }}>
                  Enter your MoMo PIN on your phone to complete payment. We will confirm your order automatically as soon as you approve.
                </div>

                {stage === 'review' && (
                  <>
                    {/* Auto-recheck countdown: after 2 min of inactivity we
                        re-check the status; if it isn't successful the order
                        is cancelled automatically. */}
                    <div className="co-autocheck" role="status" aria-live="polite">
                      {autoChecking ? (
                        <span className="co-autocheck-checking">
                          <span className="co-autocheck-spinner" aria-hidden="true" />
                          Checking payment status…
                        </span>
                      ) : (
                        <>
                          <span className="co-autocheck-dot" aria-hidden="true" />
                          <span>
                            We’ll re-check automatically in <strong>{autoCheckIn != null ? fmtClock(autoCheckIn) : '2:00'}</strong>.
                            
                          </span>
                        </>
                      )}
                    </div>

                    <div className="co-guide-steps-wrap">
                      <div className="co-guide-steps-header"><strong>Step-by-step approval</strong></div>
                      <div className="co-guide-steps-body" style={{ textAlign: 'left' }}>
                        {(approval[network] || []).map((step, i) => (
                          <div className="co-guide-step" key={step}>
                            <span className="co-guide-step-num" style={{ background: '#16a34a' }}>{i + 1}</span>
                            <p className="co-guide-step-text">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button className="co-btn-primary" onClick={() => checkAgain()} disabled={busy || autoChecking}>
                      I've Approved — Confirm Payment
                    </button>
                    <button className="co-btn-danger" onClick={() => cancel('Customer cancelled before confirmation')} disabled={busy || autoChecking}>
                      Cancel Order
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </Modal>

        <AuthModal
          open={auth}
          onClose={() => setAuth(false)}
          onSuccess={handleAuthSuccess}
          currentCustomer={customer}
          initialMode="signup"
          autoLoginAfterSignup
          notice="Create an account or sign in before placing your order."
        />
      </div>
    </>
  );
}
