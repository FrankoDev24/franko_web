import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input, Radio, Divider, message, Modal } from 'antd';
import { validateCart, checkOutOrder, updateOrderDelivery, saveCheckoutDetails, saveAddressDetails, FRIENDLY_PRICE_UPDATE_MSG } from '../Redux/Slice/orderSlice';
import { validateAccount, debitCustomer, checkTransactionStatus, resetPaymentState } from '../Redux/Slice/paymentSlice';
import { clearCart, getCartById } from '../Redux/Slice/cartSlice';
import CheckoutForm from '../Component/CheckoutForm';
import AuthModal from '../Component/AuthModal';
import locations from '../Component/Locations';
import { ShoppingBagIcon, LockClosedIcon, UserIcon, ExclamationTriangleIcon, PhoneIcon, ShieldCheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid, XCircleIcon as XCircleSolid } from '@heroicons/react/24/solid';
import frankoLogo from '../assets/frankoIcon.png';
import mtnLogo from '../assets/momo.png';
import vodafoneLogo from '../assets/voda.png';
import airteltigoLogo from '../assets/AT.png';
import { paymentOutcome, generateOrderCode, buildOrderDetails, completedOrderRoute, assertOrderDetails, assertOrderAccepted, readJSON, removeDraft } from '../utils/checkoutFlow.mjs';

const price = item => Number(item?.unitPrice ?? item?.UnitPrice ?? item?.price ?? item?.Price ?? 0);
const qty = item => Number(item?.quantity ?? item?.Quantity ?? 1);
const customerId = c => c?.customerAccountNumber ?? c?.CustomerAccountNumber ?? c?.customerId;
const customerNameOf = c => `${c?.firstName || ''} ${c?.lastName || ''}`.trim();
const telValid = n => /^0(20|50)\d{7}$/.test(n);
const mobileValid = n => /^233[1-9]\d{8}$/.test(n);
const msisdn = n => String(n).replace(/^0/, '233').replace(/^2330/, '233');
const NETWORKS = { mtn: 'MTN', vodafone: 'VODAFONE', airteltigo: 'AIRTELTIGO' };
const checkoutStyles = `
:root{--co-green:#14532d;--co-green-mid:#166534;--co-green-600:#16a34a;--co-green-light:#dcfce7;--co-green-lighter:#f0fdf4;--co-dark:#1a1a1a;--co-mid:#555;--co-light:#888;--co-border:#e0e0e0;--co-bg:#f7f7f7;--co-red:#dc2626;--co-radius:6px;--co-radius-xl:14px}
.co-root,.co-root *{box-sizing:border-box;font-family:'Plus Jakarta Sans',sans-serif;-webkit-font-smoothing:antialiased}.co-root{min-height:100vh;background:#fff;color:var(--co-dark)}
.co-tel{--co-green:#BB1420;--co-green-mid:#A80F1B;--co-green-lighter:#FDF0F0;--co-green-light:#F6E3E5}.co-tel .co-page-header{background:#BB1420;color:white;padding:18px;border-radius:8px}.co-tel .co-page-count{color:#ffeaea}.co-tel .co-page-header-accent{background:#FFD400}
.co-container{max-width:1780px;margin:0 auto;padding:24px 16px 100px}@media(min-width:1024px){.co-container{padding:32px 40px}}
.co-page-header{display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--co-border)}.co-page-header-accent{width:4px;height:28px;border-radius:2px;background:var(--co-green)}.co-page-title{font-size:24px;font-weight:800;letter-spacing:-.02em;margin:0}.co-page-count{font-size:13px;color:var(--co-light);margin:4px 0 0}.co-page-header-line{display:none;flex:1;height:1px;background:var(--co-border)}@media(min-width:768px){.co-page-header-line{display:block}}
.co-layout{display:flex;flex-direction:column;gap:20px}@media(min-width:1024px){.co-layout{flex-direction:row;gap:24px}}.co-sidebar{flex-shrink:0}@media(min-width:1024px){.co-sidebar{width:380px}}.co-main{flex:1;min-width:0}
.co-card{background:#fff;border:1px solid var(--co-border);border-radius:var(--co-radius);overflow:hidden}.co-card-header{padding:16px 20px;border-bottom:1px solid #f0f0f0}.co-card-title{font-size:16px;font-weight:800;margin:0}.co-card-body{padding:16px 20px}.co-section-accent{display:flex;gap:4px;margin-top:8px}.co-section-accent-bar{height:2px;width:32px;background:var(--co-green-600)}.co-section-accent-line{height:2px;flex:1;background:#f0f0f0}
.co-auth-banner,.co-warning-banner{display:flex;gap:12px;padding:12px 14px;border-radius:var(--co-radius);margin-bottom:16px}.co-auth-banner{background:#f0fdf4;border:1px solid #bbf7d0}.co-auth-banner-icon{width:36px;height:36px;border-radius:8px;background:#fff;border:1px solid #bbf7d0;display:grid;place-items:center;flex-shrink:0}.co-auth-banner-copy{flex:1}.co-auth-banner-title{font-size:13px;font-weight:800;color:var(--co-green);margin:0 0 3px}.co-auth-banner-desc{font-size:12px;color:#166534;margin:0;line-height:1.45}.co-auth-banner-btn{margin-top:8px;border:0;background:var(--co-green);color:#fff;border-radius:var(--co-radius);padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer}
.co-toggle-wrap{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--co-bg);border:1px solid var(--co-border);border-radius:var(--co-radius);cursor:pointer;margin-bottom:16px}.co-toggle-left{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:var(--co-mid)}.co-toggle-track{width:40px;height:22px;border-radius:11px;padding:2px;transition:background .2s}.co-toggle-track-off{background:#d1d5db}.co-toggle-track-on{background:var(--co-green-600)}.co-toggle-knob{width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0002;transition:transform .2s}.co-toggle-knob-on{transform:translateX(18px)}.co-warning-banner{background:#fffbeb;border:1px solid #fde68a;align-items:flex-start}.co-warning-banner p{font-size:12px;font-weight:600;color:#92400e;margin:0;line-height:1.5}
.co-items-list{max-height:380px;overflow-y:auto;padding-right:4px}.co-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #f5f5f5}.co-item:last-child{border-bottom:0}.co-item-left{display:flex;gap:12px;flex:1;min-width:0}.co-item-img,.co-item-img-placeholder{width:56px;height:56px;border-radius:var(--co-radius);object-fit:cover;border:1px solid #f0f0f0;flex-shrink:0}.co-item-img-placeholder{display:flex;align-items:center;justify-content:center;background:var(--co-bg);font-size:10px;color:var(--co-light)}.co-item-info{flex:1;min-width:0}.co-item-name{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0 0 2px}.co-item-unit{font-size:12px;color:var(--co-light);margin:0}.co-item-qty{display:inline-flex;margin-top:4px;padding:2px 8px;border-radius:100px;background:var(--co-green-lighter);font-size:11px;font-weight:700;color:var(--co-green)}.co-item-price{font-size:14px;font-weight:900;flex-shrink:0}
.co-totals{padding-top:16px;border-top:1px solid var(--co-border)}.co-total-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0;font-size:14px}.co-total-row-label{color:var(--co-mid)}.co-total-row-value{font-weight:700}.co-total-row-free{font-weight:700;color:var(--co-green-600)}.co-total-row-warning{font-weight:600;color:#d97706}.co-service-charge{display:flex;justify-content:space-between;padding:8px 12px;background:#eff6ff;border-radius:var(--co-radius);margin:8px 0}.co-service-charge span{font-size:13px;font-weight:600;color:#1e40af}.co-grand-total{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:linear-gradient(135deg,#fef2f2,#fff7ed);border-radius:var(--co-radius);margin-top:8px;border:1px solid #fecaca}.co-grand-total-label,.co-grand-total-value{font-weight:900;color:var(--co-red)}.co-grand-total-value{font-size:18px}.co-charge-note{font-size:11px;color:var(--co-light);text-align:center;font-style:italic;margin-top:6px}
.co-payment-section{margin-top:20px}.co-payment-title{font-size:14px;font-weight:800;margin:0 0 12px}.co-payment-options{display:flex;flex-direction:column;gap:8px}.co-payment-option{display:flex;align-items:center;gap:12px;padding:12px 16px;border:2px solid var(--co-border);border-radius:var(--co-radius);cursor:pointer;background:#fff}.co-payment-option-active{border-color:var(--co-green-600)!important;background:var(--co-green-lighter)!important}.co-payment-option-text{font-size:14px;font-weight:600;color:var(--co-mid)}
.co-btn-primary,.co-btn-danger,.co-btn-secondary{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:var(--co-radius);font-weight:700;cursor:pointer;transition:.15s;font-family:inherit}.co-btn-primary{padding:14px;background:var(--co-green);color:#fff;border:0;font-size:15px}.co-btn-primary:hover{background:var(--co-green-mid)}.co-btn-primary:disabled{background:#d1d5db;cursor:not-allowed}.co-btn-danger{padding:12px;background:#fff;color:var(--co-red);border:1px solid #fecaca;font-size:14px}.co-btn-danger:hover{background:#fef2f2}.co-btn-secondary{padding:9px 12px;background:#fff;color:var(--co-dark);border:1px solid var(--co-border);font-size:12px}.co-btn-secondary:hover{background:var(--co-bg)}.co-sticky-bottom{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid var(--co-border);padding:12px 16px;z-index:40;box-shadow:0 -2px 12px #0001;display:block}@media(min-width:1024px){.co-sticky-bottom{display:none}}.co-desktop-btn{display:none;margin-top:20px}@media(min-width:1024px){.co-desktop-btn{display:block}}
.co-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 24px;min-height:400px}.co-empty-icon{width:72px;height:72px;border-radius:50%;background:var(--co-bg);display:grid;place-items:center;margin-bottom:16px;border:1px solid var(--co-border)}.co-empty-title{font-size:22px;font-weight:800;margin-bottom:8px}.co-empty-desc{font-size:14px;color:var(--co-light);margin-bottom:24px}
.co-loading-overlay{position:fixed;inset:0;background:#0008;backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:10000}.co-loading-card{background:#fff;border-radius:var(--co-radius-xl);padding:32px;display:flex;flex-direction:column;align-items:center;gap:16px;box-shadow:0 20px 60px #0003}.co-spinner{width:40px;height:40px;border:4px solid var(--co-green-light);border-top-color:var(--co-green-600);border-radius:50%;animation:co-spin .8s linear infinite}@keyframes co-spin{to{transform:rotate(360deg)}}.co-loading-text{font-size:15px;font-weight:700;color:var(--co-mid)}
.pm-modal-wrap{display:flex;flex-direction:column;max-height:calc(100vh - 32px)}.pm-header-compact{background:linear-gradient(135deg,#0d3d20,#14532d 50%,#166534);padding:16px 20px;display:flex;align-items:center;justify-content:space-between}.co-tel .pm-header-compact{background:linear-gradient(135deg,#8f0c16,#BB1420 55%,#A80F1B)}.pm-header-left{display:flex;align-items:center;gap:10px}.pm-logo-small{height:28px;object-fit:contain;filter:brightness(0) invert(1)}.pm-company-small{font-size:10px;font-weight:700;color:#ffffff80;text-transform:uppercase;margin:0}.pm-ref-small{font-size:10px;color:#ffffff99;margin:3px 0 0}.pm-header-right{text-align:right}.pm-amount-label-small{font-size:9px;font-weight:700;color:#ffffff80;text-transform:uppercase;margin:0}.pm-amount-value-small{font-size:24px;font-weight:900;color:#fff;margin:0}.pm-body{padding:16px;display:flex;flex-direction:column;gap:12px;background:#fff;overflow-y:auto}.pm-field{border:1.5px solid #e5e7eb;border-radius:10px;overflow:hidden}.pm-field-header{display:flex;align-items:center;gap:8px;padding:9px 12px;background:#f9fafb;border-bottom:1px solid #f0f0f0}.pm-field-step-num{width:20px;height:20px;background:var(--co-green);color:#fff;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:900}.pm-field-label{font-size:12px;font-weight:800}.pm-field-body{padding:12px}.pm-validation{font-size:11px;font-weight:600;margin-top:6px;display:flex;align-items:center;gap:4px;color:#d97706}.pm-account-status{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;font-size:12px;font-weight:600}.pm-account-valid{background:#f0fdf4;border:1px solid #86efac;color:#14532d}.pm-account-invalid{background:#fef2f2;border:1px solid #fca5a5;color:var(--co-red)}.pm-account-checking{background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280}.pm-account-icon{width:20px;height:20px;flex-shrink:0}.pm-networks{display:flex;flex-direction:column;gap:6px}.pm-network-tile{display:flex;align-items:center;gap:10px;padding:10px 12px;border:2px solid #e5e7eb;border-radius:10px;cursor:pointer;background:#fff;min-height:56px}.pm-network-logo{width:36px;height:36px;object-fit:contain;border-radius:6px}.pm-network-info{flex:1}.pm-network-name{font-size:13px;font-weight:800;margin:0}.pm-network-sub{font-size:10px;color:var(--co-light);margin:2px 0 0}.pm-pay-btn{width:100%;padding:14px;background:linear-gradient(135deg,#14532d,#166534);color:#fff;border:0;border-radius:10px;font-size:15px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;min-height:50px}.co-tel .pm-pay-btn{background:linear-gradient(135deg,#8f0c16,#BB1420)}.pm-pay-btn:disabled{background:#9ca3af;cursor:not-allowed}.pm-security{display:flex;align-items:center;justify-content:center;gap:5px;font-size:10px;font-weight:600;color:#6b7280;padding:7px;background:#f9fafb;border-radius:6px}.pm-info-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 12px}.pm-info-title{font-size:11px;font-weight:800;color:var(--co-green);margin:0 0 6px}.pm-info-list{font-size:11px;color:#16a34a;margin:0;padding-left:18px;display:grid;gap:4px}
.pm-pending-anim{position:relative;width:78px;height:78px}.pm-pending-ring-outer,.pm-pending-ring-spin{position:absolute;inset:0;border-radius:50%}.pm-pending-ring-outer{border:3px solid #dcfce7}.pm-pending-ring-spin{border:3px solid transparent;border-top-color:var(--co-green-600);animation:co-spin 1s linear infinite}.pm-pending-ring-inner{position:absolute;inset:9px;border:2px solid #f0fdf4;border-radius:50%;display:grid;place-items:center;background:#dcfce7}.co-guide-steps-wrap{background:#fff;border:1px solid #f0f0f0;border-radius:var(--co-radius);overflow:hidden}.co-guide-steps-header{padding:10px 14px;border-bottom:1px solid #f5f5f5}.co-guide-steps-body{padding:14px;max-height:280px;overflow:auto}.co-guide-step{display:flex;gap:12px;align-items:flex-start;margin-bottom:10px}.co-guide-step-num{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:11px;font-weight:900;flex-shrink:0}.co-guide-step-text{font-size:13px;color:var(--co-mid);margin:3px 0 0;line-height:1.4}
`;
export default function CheckoutShared({ telecel = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const cartState = useSelector(s => s.cart || {});
  const customerState = useSelector(s => s.customer ?? s.customerReducer ?? s.customers ?? {});
  const account = useSelector(s => s.payment || {});
  const customer = customerState.currentCustomer ?? customerState.customer ?? customerState.customerDetails ?? customerState.data ?? customerState.user ?? customerState.profile ?? customerState;
  const loggedIn = Boolean(customerId(customer));
  const stored = readJSON('checkoutDetails', {});
  const [items, setItems] = useState(() => telecel ? (location.state?.items?.length ? location.state.items : readJSON('telCheckoutCart', {})?.items || cartState.cart || []) : (cartState.cart?.length ? cartState.cart : readJSON('cart', []) || []));
  const [recipient, setRecipient] = useState(stored.recipientName || '');
  const [phone, setPhone] = useState(stored.recipientContactNumber || '');
  const [different, setDifferent] = useState(false);
  const [note, setNote] = useState(stored.orderNote || '');
  const [delivery, setDelivery] = useState(() => ({ address: readJSON('orderAddressDetails', {})?.address || '', fee: 0, feeDisplay: '' }));
  const [method, setMethod] = useState(telecel ? 'Mobile Money' : '');
  const [number, setNumber] = useState('');
  const [network, setNetwork] = useState(telecel ? 'vodafone' : '');
  const [validatedFor, setValidatedFor] = useState('');
  const [stage, setStage] = useState('form'); // form, payment, pending, review, posting, support
  const [busy, setBusy] = useState(false);
  const [auth, setAuth] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);
  const active = useRef(false);
  const finished = useRef(false);
  const submitting = useRef(false);
  const requestActive = useRef(false);
  const pollTimer = useRef(null);
  const pollDeadline = useRef(null);
  const currentRef = useRef(null);
  const cartId = String(cartState.cartId || readJSON('cartId', '') || '').replace(/^"|"$/g, '');
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + price(item) * qty(item), 0), [items]);
  const shipping = Number(delivery?.fee) || 0;
  const serviceCharge = Math.min(20, (subtotal + shipping) * .01);
  // Existing gateway contract debits goods value; other charges are displayed separately.
  const amount = subtotal;
  const validNumber = telecel ? telValid(number) : mobileValid(msisdn(number));
  const validatedAccount = validatedFor === `${msisdn(number)}:${network}` && String(account.validateAccountData?.responseCode ?? '') === '01';

  useEffect(() => { active.current = true; return () => { active.current = false; clearTimeout(pollTimer.current); dispatch(resetPaymentState()); }; }, [dispatch]);
  useEffect(() => { if (!telecel && cartState.cart?.length && !finished.current) setItems(cartState.cart); }, [cartState.cart, telecel]);
  useEffect(() => { if (cartId && !items.length) dispatch(getCartById(cartId)); }, [cartId, dispatch, items.length]);
  useEffect(() => { if (loggedIn && !different) { setRecipient(customerNameOf(customer)); setPhone(customer.contactNumber || customer.ContactNumber || ''); } }, [loggedIn, customer, different]);
  useEffect(() => {
    setValidatedFor('');
    if (stage !== 'payment' || !validNumber || !network) return;
    dispatch(resetPaymentState());
    let cancelled = false;
    const key = `${msisdn(number)}:${network}`;
    const t = setTimeout(() => {
      dispatch(validateAccount({ msisdn: msisdn(number), network: NETWORKS[network] })).unwrap()
        .then(result => { if (!cancelled && String(result?.responseCode ?? '') === '01') setValidatedFor(key); })
        .catch(() => {});
    }, 450);
    return () => { cancelled = true; clearTimeout(t); };
  }, [stage, number, network, validNumber, dispatch]);

  const cancel = (reason = 'Payment was cancelled.') => {
    if (finished.current) return;
    finished.current = true;
    clearTimeout(pollTimer.current);
    removeDraft();
    navigate('/order-cancelled', { replace: true, state: { reason, orderId: currentRef.current?.orderId } });
  };
  const cleanSuccess = (current, paid) => {
    const destination = completedOrderRoute({
      orderId: current.orderId,
      paid,
      paymentMode: current.checkout.PaymentMode,
      accountType: current.checkout.customerAccountType,
      telecel,
    });
    // Clear only cart data. Preserve the signed-in customer AND the checkout /
    // delivery details after success (the cart reducer may touch storage).
    const savedCustomer = readJSON('customer') || (customerId(customer) ? customer : null);
    dispatch(clearCart());
    try {
      ['cart','cartId', ...(telecel ? ['telCheckoutCart','selectedCart'] : [])]
        .forEach(k => localStorage.removeItem(k));
      if (savedCustomer) localStorage.setItem('customer', JSON.stringify(savedCustomer));
      localStorage.setItem('checkoutDetails', JSON.stringify(current.checkout));
      localStorage.setItem('orderAddressDetails', JSON.stringify(current.address));
    } catch { /* storage is best effort; Redux drafts remain available */ }
    navigate(destination, { replace: true, state: {
      placed: true, orderId: current.orderId,
      paymentMode: current.checkout.PaymentMode,
      paymentConfirmed: paid,
    } });
  };
  const postOrder = async (current, paid) => {
    if (finished.current || current.posting) return;
    current.posting = true;
    setStage('posting');
    try {
      // Both COD and confirmed MoMo send the SAME complete checkout details.
      // Delivery details are posted immediately after successful order creation.
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
      // A paid transaction must NEVER be described as cancelled if posting failed.
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
      } catch { /* transient network errors are not cancellation */ }
      finally { requestActive.current = false; }
      if (Date.now() < pollDeadline.current) poll(current);
      else setStage('review'); // unresolved is not a failed payment
    }, 5000);
  };
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
    } catch { setError('Cannot check payment right now. Please try again; do not pay twice.'); }
    finally { if (active.current) setBusy(false); }
  };
  const begin = async override => {
    if (submitting.current || finished.current) return;
    const c = override && customerId(override) ? override : customer;
    if (!customerId(c)) { setAuth(true); return; }
    const name = (different ? recipient : customerNameOf(c)).trim();
    const contact = (different ? phone : c.contactNumber || c.ContactNumber || '').trim();
    if (!items.length || !cartId || !name || /^guest\b/i.test(name) || !contact || !delivery?.address?.trim() || !method) {
      setError('Check your cart, recipient name, phone, delivery address and payment method.'); return;
    }
    submitting.current = true;
    setBusy(true); setError('');
    const orderId = generateOrderCode(telecel);
    const { checkout, delivery: address } = buildOrderDetails({
      cartId, customerId: customerId(c), orderId, paymentMode: method,
      contact, accountType: c.accountType, subtotal,
      recipientName: name, recipientContactNumber: contact,
      orderNote: note, orderDate: new Date().toISOString(),
      address: delivery.address, paymentService: telecel ? NETWORKS.vodafone : 'N/A',
    });
    const current = { orderId, checkout, address, posting: false, created: false };
    currentRef.current = current;
    // Save both original payloads before ValidateCart, as in Checkout.jsx.
    dispatch(saveCheckoutDetails(checkout));
    dispatch(saveAddressDetails(address));
    try {
      await dispatch(validateCart({ cartId, customerid: customerId(c), orderDate: checkout.orderDate, paymentMode: method, paymentService: checkout.paymentService, paymentAccountNumber: contact, customerAccountType: checkout.customerAccountType, items: items.map(i => ({ productId: String(i.productId ?? i.productID ?? i.ProductId ?? i.id ?? ''), price: price(i), quantity: qty(i) })) })).unwrap();
      if (!active.current) return;
      // Checkout.jsx's direct flow: agents and offline methods place the order
      // after cart validation; only non-agent MoMo waits for PSP confirmation.
      if ((!telecel && String(c.accountType || '').toLowerCase() === 'agent') || method !== 'Mobile Money') {
        await postOrder(current, false);
      } else setStage('payment');
    } catch (e) {
      if (e?.isPriceUpdate) {
        dispatch(clearCart()); setItems([]); setError(FRIENDLY_PRICE_UPDATE_MSG);
      } else setError(e?.message || String(e || 'Could not validate cart.'));
    } finally { submitting.current = false; if (active.current) setBusy(false); }
  };
  const pay = async () => {
    if (submitting.current || !validNumber || !validatedAccount || !network || !currentRef.current) return;
    submitting.current = true;
    setBusy(true); setError('');
    const current = currentRef.current;
    current.checkout = { ...current.checkout, PaymentAccountNumber: msisdn(number), paymentService: NETWORKS[network] };
    dispatch(saveCheckoutDetails(current.checkout));
    try {
      await dispatch(validateCart({ cartId: current.checkout.Cartid, customerid: current.checkout.customerId, orderDate: current.checkout.orderDate, paymentMode: 'Mobile Money', paymentService: current.checkout.paymentService, paymentAccountNumber: current.checkout.PaymentAccountNumber, customerAccountType: current.checkout.customerAccountType, items: items.map(i => ({ productId: String(i.productId ?? i.productID ?? i.ProductId ?? i.id ?? ''), price: price(i), quantity: qty(i) })) })).unwrap();
      setStage('pending');
      const response = await dispatch(debitCustomer({ refNo: current.orderId, msisdn: msisdn(number), amount, network: NETWORKS[network], narration: items.map(i => i.productName || i.ProductName || 'Item').join(', ').slice(0,120) })).unwrap();
      if (!active.current || finished.current) return;
      const result = paymentOutcome(response);
      if (result === 'success') await postOrder(current, true); // immediate: no polling delay
      else if (result === 'failed') cancel(response?.responseMessage || 'Payment declined.');
      else { pollDeadline.current = Date.now() + 60000; poll(current); }
    } catch (e) {
      if (e?.isPriceUpdate) { dispatch(clearCart()); setItems([]); setStage('form'); setError(FRIENDLY_PRICE_UPDATE_MSG); }
      else {
        // If DebitCustomer timed out, payment may have gone through. Never re-debit blindly.
        setStage('review'); setError(`Payment outcome is unknown. Check your payment status; do not pay again. Reference: ${current.orderId}`);
      }
    } finally { submitting.current = false; if (active.current) setBusy(false); }
  };
  const flow = { items, customer, loggedIn, different, setDifferent, recipient, setRecipient, phone, setPhone, note, setNote, delivery, setDelivery, method, setMethod, subtotal, shipping, serviceCharge, amount, error, stage, setStage, busy, begin, number, setNumber, network, setNetwork, validatedAccount, validNumber, account, pay, checkAgain, cancel, auth, setAuth, currentRef, isAgent: String(customer?.accountType || '').toLowerCase() === 'agent', telecel };
  return <CheckoutView flow={flow} />;
}

const netTiles = [
  { value:'mtn', logo:mtnLogo, name:'MTN MoMo', sub:'*170#', bg:'#fffbeb', border:'#fbbf24', color:'#d97706' },
  { value:'vodafone', logo:vodafoneLogo, name:'Vodafone Cash', sub:'*110#', bg:'#fff1f2', border:'#fda4af', color:'#e11d48' },
  { value:'airteltigo', logo:airteltigoLogo, name:'AirtelTigo', sub:'*110#', bg:'#eff6ff', border:'#93c5fd', color:'#2563eb' },
];
const money = n => `GH₵${(Number(n)||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const unit = i => Number(i.unitPrice ?? i.UnitPrice ?? i.price ?? i.Price ?? 0);
const quantity = i => Number(i.quantity ?? i.Quantity ?? 1);
const productImage = i => i.imagePath && `https://testing.frankotrading.com/Media/Products_Images/${String(i.imagePath).split('\\').pop()}`;

/** The original Checkout JSX presentation; logic is supplied by the shared checkout controller. */
function CheckoutView({ flow }) {
  const navigate = useNavigate();
  const [missing, setMissing] = useState(false);
  const {
    items, customer, loggedIn, different, setDifferent, recipient, setRecipient,
    phone, setPhone, note, setNote, delivery, setDelivery, method, setMethod,
    subtotal, shipping, serviceCharge, amount, error, stage, busy, begin,
    number, setNumber, network, setNetwork, validatedAccount, validNumber, account,
    pay, checkAgain, cancel, auth, setAuth, currentRef, isAgent, telecel,
  } = flow;
  const freeDelivery = Number(delivery.fee) === 0 && String(delivery.feeDisplay || '').toLowerCase().includes('free');
  const naDelivery = Number(delivery.fee) === 0 && (!delivery.feeDisplay || String(delivery.feeDisplay).toLowerCase() === 'n/a');
  const displayTotal = subtotal + shipping + (method === 'Mobile Money' ? serviceCharge : 0);
  const paymentLabel = loggedIn ? 'Place Order' : 'Register & Place Order';
  const orderId = currentRef.current?.orderId;
  const currentNetwork = netTiles.find(n => n.value === network);
  const approval = {
    mtn:['Dial *170# on your MTN phone','Select My Wallet, then My Approvals','Enter your MoMo PIN to load pending requests','Select the Franko Trading transaction','Approve the payment'],
    vodafone:['Dial *110# on your Vodafone phone','Open pending approvals','Enter your PIN and select the Franko Trading transaction','Approve the payment'],
    airteltigo:['Dial *110# on your AirtelTigo phone','Open pending approvals','Enter your PIN and select the Franko Trading transaction','Approve the payment'],
  };
  const checkout = () => {
    if (loggedIn && (!delivery.address?.trim() || !method || !recipient?.trim() || !phone?.trim())) setMissing(true);
    begin();
  };
  return <><style>{checkoutStyles}</style><div className={`co-root ${telecel ? 'co-tel' : ''}`}>
    {busy && <div className="co-loading-overlay"><div className="co-loading-card"><div className="co-spinner" role="status" aria-label="Loading"/><div className="co-loading-text">Processing your order…</div></div></div>}
    <div className="co-container">
      <div className="co-page-header"><div className="co-page-header-accent"/><div><h1 className="co-page-title">{telecel ? "Speed Shopping Checkout" : "Checkout"}</h1><p className="co-page-count">{items.length} item{items.length === 1 ? '' : 's'} in cart</p></div><div className="co-page-header-line"/></div>
      {error && <div className="co-warning-banner" role="alert"><ExclamationTriangleIcon style={{width:18,height:18,color:'#d97706'}}/><p>{error}</p></div>}
      {!items.length ? <div className="co-empty"><div className="co-empty-icon"><ShoppingBagIcon style={{width:36,height:36,color:'#888'}}/></div><div className="co-empty-title">Your cart is empty</div><div className="co-empty-desc">Add items to your cart to proceed with checkout.</div><button className="co-btn-primary" style={{maxWidth:280}} onClick={() => navigate('/')}>Continue Shopping</button></div> : <div className="co-layout">
        <div className="co-sidebar"><div className="co-card"><div className="co-card-header"><h3 className="co-card-title">Billing Information</h3><div className="co-section-accent"><div className="co-section-accent-bar"/><div className="co-section-accent-line"/></div></div><div className="co-card-body">
          {!loggedIn && <div className="co-auth-banner"><div className="co-auth-banner-icon"><LockClosedIcon style={{width:18,height:18,color:'#14532d'}}/></div><div className="co-auth-banner-copy"><p className="co-auth-banner-title">Register to place this order</p><p className="co-auth-banner-desc">No customer account is signed in. You’ll be asked to register or sign in before the order can be placed.</p><button className="co-auth-banner-btn" onClick={() => setAuth(true)}>Register now</button></div></div>}
          <div className="co-toggle-wrap" role="switch" aria-checked={different} tabIndex={0} onClick={() => setDifferent(!different)} onKeyDown={e => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDifferent(!different); } }}><div className="co-toggle-left"><UserIcon style={{width:16,height:16,color:'#888'}}/><span>Different recipient?</span></div><div className={`co-toggle-track ${different ? 'co-toggle-track-on':'co-toggle-track-off'}`}><div className={`co-toggle-knob ${different ? 'co-toggle-knob-on':''}`}/></div></div>
          {different && <div className="co-warning-banner"><ExclamationTriangleIcon style={{width:16,height:16,color:'#d97706'}}/><p>Enter the recipient's name and contact number below.</p></div>}
          <CheckoutForm customerName={recipient} setCustomerName={setRecipient} customerNumber={phone} setCustomerNumber={setPhone} deliveryInfo={delivery} setDeliveryInfo={setDelivery} orderNote={note} setOrderNote={setNote} locations={locations} customerAccountType={customer?.accountType} firstName={customer?.firstName || 'Guest'} isDifferentRecipient={different} readOnlyRecipient={!different}/>
        </div></div></div>
        <div className="co-main"><div className="co-card"><div className="co-card-header"><h3 className="co-card-title">Order Summary</h3><div className="co-section-accent"><div className="co-section-accent-bar"/><div className="co-section-accent-line"/></div></div><div className="co-card-body">
          <div className="co-items-list">{items.map((item,index) => <div key={item.productId || item.id || index} className="co-item"><div className="co-item-left"><div>{productImage(item) ? <img src={productImage(item)} alt="Product" className="co-item-img" onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='flex'; }}/>:null}<div className="co-item-img-placeholder" style={productImage(item) ? {display:'none'}:{}}>No Image</div></div><div className="co-item-info"><p className="co-item-name">{item.productName || item.ProductName || 'Product'}</p><p className="co-item-unit">Unit: {money(unit(item))}</p><span className="co-item-qty">Qty {quantity(item)}</span></div></div><span className="co-item-price">{money(unit(item)*quantity(item))}</span></div>)}</div>
          <div className="co-totals"><div className="co-total-row"><span className="co-total-row-label">Subtotal</span><span className="co-total-row-value">{money(subtotal)}</span></div><div className="co-total-row"><span className="co-total-row-label">Shipping Fee</span>{freeDelivery ? <span className="co-total-row-free">FREE DELIVERY</span> : naDelivery ? <span className="co-total-row-warning">{isAgent ? 'Agent delivery' : 'Delivery charges apply'}</span> : shipping > 0 ? <span className="co-total-row-value">{money(shipping)}</span> : <span className="co-total-row-warning">Select location</span>}</div>{method === 'Mobile Money' && <div className="co-service-charge"><span>{subtotal + shipping > 2000 ? 'MoMo Service Charge:' : 'MoMo Service Charge (1%):'}</span><span>{money(serviceCharge)}</span></div>}<div className="co-grand-total"><span className="co-grand-total-label">Total Amount</span><span className="co-grand-total-value">{money(displayTotal)}</span></div>{method === 'Mobile Money' && <p className="co-charge-note">* You pay {money(amount)} for goods now; shipping and provider charges shown above are separate.</p>}</div>
          <Divider style={{margin:'20px 0'}}/><div className="co-payment-section"><p className="co-payment-title">Payment Method</p><Radio.Group value={method} onChange={e => setMethod(e.target.value)} style={{width:'100%'}}><div className="co-payment-options">{!telecel && (isAgent || freeDelivery || (shipping>0 && !naDelivery)) && <label className={`co-payment-option ${method==='Cash on Delivery'?'co-payment-option-active':''}`}><Radio value="Cash on Delivery"/><span className="co-payment-option-text">Cash on Delivery</span></label>}{!isAgent && <label className={`co-payment-option ${method==='Mobile Money'?'co-payment-option-active':''}`}><Radio value="Mobile Money"/><span className="co-payment-option-text">{telecel ? "Telecel Cash" : "Mobile Money"}</span></label>}{!telecel && isAgent && ['Pick Up','Paid Already'].map(m => <label className={`co-payment-option ${method===m?'co-payment-option-active':''}`} key={m}><Radio value={m}/><span className="co-payment-option-text">{m}</span></label>)}</div></Radio.Group></div>
          <div className="co-desktop-btn"><button className="co-btn-primary" onClick={checkout} disabled={busy || stage !== 'form'}><ShoppingBagIcon style={{width:20,height:20}}/>{paymentLabel}</button></div>
        </div></div></div>
      </div>}
    </div>
    {!!items.length && <div className="co-sticky-bottom"><button className="co-btn-primary" onClick={checkout} disabled={busy || stage !== 'form'}><ShoppingBagIcon style={{width:20,height:20}}/>{paymentLabel}</button></div>}
    <Modal open={missing} centered onCancel={() => setMissing(false)} title="Complete Required Fields" footer={<button className="co-btn-primary" onClick={() => setMissing(false)}>Got It</button>}>Please provide your recipient name, contact number, delivery address and payment method.</Modal>
    <Modal open={stage === 'payment'} centered width={440} footer={null} onCancel={() => flow.setStage('form')} closable={!busy} maskClosable={!busy} styles={{body:{padding:0},content:{borderRadius:16,overflow:'hidden'}}}><div className="pm-modal-wrap"><div className="pm-header-compact"><div className="pm-header-left"><img src={frankoLogo} alt="Franko" className="pm-logo-small"/><div><p className="pm-company-small">Franko Trading</p><p className="pm-ref-small">{orderId}</p></div></div><div className="pm-header-right"><p className="pm-amount-label-small">Charged now</p><p className="pm-amount-value-small">{money(amount)}</p></div></div><div className="pm-body"><div className="pm-field"><div className="pm-field-header"><span className="pm-field-step-num">1</span><span className="pm-field-label">Mobile Money Number</span></div><div className="pm-field-body"><Input placeholder={telecel ? "0501234567" : "233XXXXXXXXX"} value={number || (telecel ? "" : "233")} onChange={e => {let value=e.target.value.replace(/\D/g,'');if(telecel){if(value.startsWith('233'))value=`0${value.slice(3)}`;setNumber(value.slice(0,10));}else{if(value.startsWith('0'))value=`233${value.slice(1)}`;if(!value.startsWith('233'))value='233';setNumber(value.slice(0,13));}}} prefix={<PhoneIcon style={{width:16,height:16,color:'#888'}}/>} size="large" maxLength={13}/><div className="pm-validation">{!validNumber ? 'Enter your mobile money number' : !network ? 'Select your network below' : ''}</div></div></div>
      <div className="pm-field"><div className="pm-field-header"><span className="pm-field-step-num">2</span><span className="pm-field-label">{telecel ? "Telecel Cash" : "Network Provider"}</span></div><div className="pm-field-body"><Radio.Group value={network} onChange={e => setNetwork(e.target.value)} style={{width:'100%'}}><div className="pm-networks">{(telecel ? netTiles.filter(n => n.value === 'vodafone') : netTiles).map(n => <label className="pm-network-tile" key={n.value} style={network===n.value ? {background:n.bg,borderColor:n.border}:{}}><Radio value={n.value} style={{display:'none'}}/><img src={n.logo} alt={n.name} className="pm-network-logo"/><div className="pm-network-info"><p className="pm-network-name">{n.name}</p><p className="pm-network-sub">{n.sub}</p></div>{network===n.value && <CheckCircleSolid style={{width:22,height:22,color:n.color}}/>}</label>)}</div></Radio.Group></div></div>
      {validNumber && network && <div className={`pm-account-status ${validatedAccount?'pm-account-valid':account.validating?'pm-account-checking':'pm-account-invalid'}`}>{validatedAccount ? <CheckCircleSolid className="pm-account-icon"/> : account.validating ? <div className="co-spinner" style={{width:16,height:16,borderWidth:2}}/> : <XCircleSolid className="pm-account-icon"/>}<div>{validatedAccount ? `Account Valid${account.validateAccountData?.name ? ` · ${account.validateAccountData.name}`:''}` : account.validating ? 'Validating account…' : account.validateAccountData?.responseMessage || account.error || 'Checking account…'}</div></div>}
      <button className="pm-pay-btn" onClick={pay} disabled={busy || !validNumber || !validatedAccount}><LockClosedIcon style={{width:16,height:16}}/>Pay {money(amount)}</button><div className="pm-security"><ShieldCheckIcon style={{width:12,height:12}}/>Secured by GhIPSS</div><div className="pm-info-box"><p className="pm-info-title"><CheckCircleIcon style={{width:12,height:12}}/> What happens next?</p><ol className="pm-info-list"><li>We validate current product prices before payment</li><li>You'll receive a payment prompt on your phone</li><li>Approve the request and we confirm it automatically</li></ol></div></div></div></Modal>
    <Modal open={['pending','posting','review','support'].includes(stage)} centered width={520} footer={null} closable={false} maskClosable={false}><div style={{display:'flex',flexDirection:'column',gap:14,textAlign:'center'}}>{stage==='posting' ? <><CheckCircleSolid style={{width:45,height:45,color:'#16a34a',margin:'auto'}}/><h3>Payment Confirmed!</h3><p>Creating your order and redirecting…</p></> : stage==='support' ? <><ExclamationTriangleIcon style={{width:45,height:45,color:'#d97706',margin:'auto'}}/><h3>Order needs assistance</h3><p>{error}</p></> : <><div className="pm-pending-anim" style={{margin:'auto'}}><div className="pm-pending-ring-outer"/><div className="pm-pending-ring-spin"/><div className="pm-pending-ring-inner"><PhoneIcon style={{width:26,height:26,color:'#16a34a'}}/></div></div><h3>{stage==='review'?'Approve Your Payment':'Awaiting Approval'}</h3><p>Check your phone for the payment prompt</p><p>Reference: {orderId} · Number: {number} · Amount: {money(amount)}</p>{stage==='review' && <><div className="co-guide-steps-wrap"><div className="co-guide-steps-header"><strong>Step-by-step approval</strong></div><div className="co-guide-steps-body" style={{textAlign:'left'}}>{(approval[network] || []).map((step,i) => <div className="co-guide-step" key={step}><span className="co-guide-step-num" style={{background:'#16a34a'}}>{i+1}</span><p className="co-guide-step-text">{step}</p></div>)}</div></div><button className="co-btn-primary" onClick={checkAgain} disabled={busy}>I've Approved — Confirm Payment</button><button className="co-btn-danger" onClick={() => cancel('Customer cancelled before confirmation')} disabled={busy}>Cancel Order</button></>}</>}</div></Modal>
    <AuthModal open={auth} onClose={() => setAuth(false)} onSuccess={c => {setAuth(false);begin(c);}} currentCustomer={customer} initialMode="signup" allowGuest={false} autoLoginAfterSignup notice="Create an account or sign in before placing your order."/>
  </div></>;
}
