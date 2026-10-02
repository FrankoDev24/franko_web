// src/pages/Checkout.jsx
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  validateCart,
  checkOutOrder,
  updateOrderDelivery,
  saveCheckoutDetails,
  saveAddressDetails,
  FRIENDLY_PRICE_UPDATE_MSG,
} from "../Redux/Slice/orderSlice";
import {
  debitCustomer,
  checkTransactionStatus,
  validateAccount,
  resetPaymentState,
  resetValidateAccountData,
  resetTransactionStatus,
} from "../Redux/Slice/paymentSlice";
import { clearCart, getCartById } from "../Redux/Slice/cartSlice";
import { getCustomerById } from "../Redux/Slice/customerSlice";
import { message, Radio, Divider, Modal, Input } from "antd";
import CheckoutForm from "../Component/CheckoutForm";
import AuthModal from "../Component/AuthModal";
import locations from "../Component/Locations";
import {
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  CreditCardIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ShieldCheckIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon as CheckCircleSolid,
  XCircleIcon as XCircleSolid,
} from "@heroicons/react/24/solid";
import frankoLogo from "../assets/frankoIcon.png";
import mtnLogo from "../assets/momo.png";
import vodafoneLogo from "../assets/voda.png";
import airteltigoLogo from "../assets/AT.png";

const SERVICE_CHARGE_RATE = 0.01;
const SERVICE_CHARGE_CAP = 20;
const INITIAL_DELAY_MS = 10000;
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_DURATION_MS = 60000;
const AUTO_CHECK_DELAY_MS = 120000;
const CHECKOUT_FAIL_REDIRECT_SECONDS = 5;

const NETWORK_API_MAP = {
  mtn: "MTN",
  vodafone: "VODAFONE",
  airteltigo: "AIRTELTIGO",
};

const NETWORK_STEPS = {
  mtn: {
    label: "MTN Mobile Money",
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FCD34D",
    logo: mtnLogo,
    ussd: "*170#",
    steps: [
      "Dial *170# on your MTN phone",
      "Select My Wallet, then My Approvals",
      "Enter your MoMo PIN to load pending requests",
      "Select the Franko Trading transaction",
      "Approve the payment",
    ],
    tip: "You can also approve the request in the MTN MoMo app.",
  },
  vodafone: {
    label: "Vodafone Cash",
    color: "#E11D48",
    bg: "#FFF1F2",
    border: "#FECDD3",
    logo: vodafoneLogo,
    ussd: "*110#",
    steps: [
      "Dial *110# on your Vodafone phone",
      "Open pending approvals",
      "Enter your PIN and select the Franko Trading transaction",
      "Approve the payment",
    ],
    tip: "You can also approve the request in the Vodafone Cash app.",
  },
  airteltigo: {
    label: "AirtelTigo Money",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    logo: airteltigoLogo,
    ussd: "*110#",
    steps: [
      "Dial *110# on your AirtelTigo phone",
      "Open pending approvals",
      "Enter your PIN and select the Franko Trading transaction",
      "Approve the payment",
    ],
    tip: "You can also approve the request in the AirtelTigo Money app.",
  },
};

const CUSTOMER_STATE_KEYS = [
  "currentCustomer",
  "customer",
  "customerDetails",
  "customerData",
  "data",
  "user",
  "profile",
];

const isPaymentSuccess = (response) => {
  if (!response) return false;
  const code = String(response.responseCode ?? "").trim();
  const msg = String(response.responseMessage ?? "").toLowerCase().trim();
  return (
    code === "01" &&
    msg.includes("successfully") &&
    msg.includes("processed") &&
    msg.includes("transaction")
  );
};

const isAccountValid = (response) =>
  String(response?.responseCode ?? "").trim() === "01";

// A price-update modal is shown only for ValidateCart's explicit rejection.
// CheckOutDbCart failures are order failures, never price-update signals.
const isPriceUpdateValidationError = (error) => {
  const payload = error?.payload ?? error;
  return (
    payload?.isCartValidationFailure === true &&
    payload?.isPriceUpdate === true
  );
};

const parseResponseValue = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const getValidationResponseMeta = (value, depth = 0) => {
  if (depth > 5 || value == null) return { code: "", flag: "" };
  const parsed = parseResponseValue(value);
  if (Array.isArray(parsed)) {
    for (const entry of parsed) {
      const meta = getValidationResponseMeta(entry, depth + 1);
      if (meta.code || meta.flag) return meta;
    }
    return { code: "", flag: "" };
  }
  if (typeof parsed !== "object") return { code: "", flag: "" };

  const code = String(
    parsed.responseCode ??
      parsed.ResponseCode ??
      parsed.response?.responseCode ??
      parsed.data?.responseCode ??
      parsed.code ??
      ""
  ).trim();
  const flag = String(
    parsed.flag ??
      parsed.Flag ??
      parsed.response?.flag ??
      parsed.data?.flag ??
      ""
  ).trim().toLowerCase();
  if (code || flag) return { code, flag };

  for (const nested of [parsed.payload, parsed.raw, parsed.data, parsed.response, parsed.result]) {
    const meta = getValidationResponseMeta(nested, depth + 1);
    if (meta.code || meta.flag) return meta;
  }
  return { code: "", flag: "" };
};

const isValidateCartPriceChange = (errorOrResponse) => {
  const payload = errorOrResponse?.payload ?? errorOrResponse;
  if (isPriceUpdateValidationError(payload)) return true;
  const { code, flag } = getValidationResponseMeta(payload);
  return code === "0" || flag === "pricechange";
};

const normalizePriceUpdateError = (value) => ({
  message: FRIENDLY_PRICE_UPDATE_MSG,
  responseCode: getValidationResponseMeta(value).code || "0",
  flag: "PriceChange",
  raw: value?.raw ?? value?.payload ?? value,
  isCartValidationFailure: true,
  isPriceUpdate: true,
});

const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  const payload = error?.payload ?? error;
  return (
    payload?.message ??
    payload?.responseMessage ??
    (typeof payload === "string" ? payload : null) ??
    error?.message ??
    fallback
  );
};

const sanitizeMsisdn = (value) => {
  if (!value) return value;
  return value.startsWith("2330") ? `233${value.slice(4)}` : value;
};

const isValidMsisdn = (value) =>
  (value?.length === 12 && /^233[1-9]\d{8}$/.test(value)) ||
  (value?.length === 13 && /^2330[1-9]\d{8}$/.test(value));

const getMsisdnValidationStatus = (value) => {
  const number = String(value || "");
  if (number.length <= 3) return { type: "info", message: "Enter your phone number" };
  const expectedLength = number[3] === "0" ? 13 : 12;
  const remaining = expectedLength - number.length;
  if (remaining > 0) {
    return {
      type: "warning",
      message: `Enter ${remaining} more digit${remaining === 1 ? "" : "s"}`,
    };
  }
  return isValidMsisdn(number)
    ? { type: "success", message: null }
    : { type: "error", message: "Invalid phone number" };
};

const formatCurrency = (amount, decimals = 2) => {
  const num = Number.parseFloat(amount) || 0;
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};
const formatGHS = (amount) => `GH₵${formatCurrency(amount, 2)}`;
const getItemUnitPrice = (item) =>
  Number.parseFloat(item?.unitPrice ?? item?.UnitPrice) ||
  Number.parseFloat(item?.price ?? item?.Price) ||
  0;
const getItemQuantity = (item) =>
  Number.parseInt(item?.quantity ?? item?.Quantity, 10) || 1;
const getItemLineTotal = (item) => getItemUnitPrice(item) * getItemQuantity(item);

const buildCartNarration = (items, maxLen = 120) => {
  if (!items?.length) return "Franko Trading Purchase";
  const narration = items
    .map((item) => {
      const name = String(item.productName || item.ProductName || "Item").trim();
      const quantity = getItemQuantity(item);
      return quantity > 1 ? `${name} (x${quantity})` : name;
    })
    .join(", ");
  return narration.length > maxLen
    ? `${narration.substring(0, maxLen - 3)}...`
    : narration;
};

const safeJsonParse = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};
const safeJsonStringify = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};

const readStoredObject = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? safeJsonParse(raw, {}) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const isCustomerRecord = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const id = String(
    value.customerAccountNumber || value.CustomerAccountNumber || value.customerId || ""
  ).trim();
  const phone = String(value.contactNumber || value.ContactNumber || "").trim();
  const name = `${value.firstName || ""} ${value.lastName || ""}`.trim();
  return Boolean(id || phone || name);
};

const hasCustomerDetails = (customer) => {
  if (!isCustomerRecord(customer)) return false;
  if (
    (customer.isAuthenticated === false || customer.loginStatus === false) &&
    !customer.accessToken
  ) return false;
  if (customer.isGuest === true) return false;
  return Boolean(
    customer.customerAccountNumber ||
      customer.CustomerAccountNumber ||
      customer.contactNumber ||
      customer.ContactNumber
  );
};

const readCustomerFromStorage = () => {
  try {
    const value = localStorage.getItem("customer");
    const parsed = typeof value === "string" ? safeJsonParse(value, null) : value;
    return isCustomerRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const pickCustomerFromState = (state) => {
  if (!state || typeof state !== "object") return null;
  for (const key of CUSTOMER_STATE_KEYS) {
    if (hasCustomerDetails(state[key])) return state[key];
  }
  return hasCustomerDetails(state) ? state : null;
};

const resolveCustomer = (state, localCustomer) =>
  pickCustomerFromState(state) ||
  (hasCustomerDetails(localCustomer) ? localCustomer : null) ||
  (hasCustomerDetails(readCustomerFromStorage()) ? readCustomerFromStorage() : null);

const customerDisplayName = (customer) =>
  `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim();
const customerPhone = (customer) =>
  customer?.contactNumber || customer?.ContactNumber || "";
const persistCustomer = (customer) => {
  try {
    const value = safeJsonStringify(customer);
    if (value) localStorage.setItem("customer", value);
  } catch {
    // Browser storage is best-effort.
  }
};

const checkoutStyles = `
  :root { --co-green:#14532d; --co-green-mid:#166534; --co-green-600:#16a34a; --co-green-light:#dcfce7; --co-green-lighter:#f0fdf4; --co-dark:#1a1a1a; --co-mid:#555; --co-light:#888; --co-border:#e0e0e0; --co-bg:#f7f7f7; --co-red:#dc2626; --co-radius:6px; --co-radius-lg:10px; --co-radius-xl:14px; }
  .co-root,.co-root * { box-sizing:border-box; font-family:'Plus Jakarta Sans',sans-serif; -webkit-font-smoothing:antialiased; }
  .co-root { min-height:100vh;background:#fff;color:var(--co-dark); }
  .co-container { max-width:1780px;margin:0 auto;padding:24px 16px 100px; }
  @media(min-width:1024px){.co-container{padding:32px 40px;}}
  .co-page-header{display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--co-border);}
  .co-page-header-accent{width:4px;height:28px;border-radius:2px;background:var(--co-green);}
  .co-page-title{font-size:24px;font-weight:800;letter-spacing:-.02em;margin:0;}
  .co-page-count{font-size:13px;color:var(--co-light);margin:4px 0 0;}
  .co-page-header-line{display:none;flex:1;height:1px;background:var(--co-border);}
  @media(min-width:768px){.co-page-header-line{display:block;}}
  .co-layout{display:flex;flex-direction:column;gap:20px;}
  @media(min-width:1024px){.co-layout{flex-direction:row;gap:24px;}}
  .co-sidebar{flex-shrink:0;}
  @media(min-width:1024px){.co-sidebar{width:380px;}}
  .co-main{flex:1;min-width:0;}
  .co-card{background:#fff;border:1px solid var(--co-border);border-radius:var(--co-radius);overflow:hidden;}
  .co-card-header{padding:16px 20px;border-bottom:1px solid #f0f0f0;}
  .co-card-title{font-size:16px;font-weight:800;margin:0;}
  .co-card-body{padding:16px 20px;}
  .co-section-accent{display:flex;gap:4px;margin-top:8px;}
  .co-section-accent-bar{height:2px;width:32px;background:var(--co-green-600);}
  .co-section-accent-line{height:2px;flex:1;background:#f0f0f0;}
  .co-auth-banner,.co-warning-banner{display:flex;gap:12px;padding:12px 14px;border-radius:var(--co-radius);margin-bottom:16px;}
  .co-auth-banner{background:#f0fdf4;border:1px solid #bbf7d0;}
  .co-auth-banner-icon{width:36px;height:36px;border-radius:8px;background:#fff;border:1px solid #bbf7d0;display:grid;place-items:center;flex-shrink:0;}
  .co-auth-banner-copy{flex:1;}
  .co-auth-banner-title{font-size:13px;font-weight:800;color:var(--co-green);margin:0 0 3px;}
  .co-auth-banner-desc{font-size:12px;color:#166534;margin:0;line-height:1.45;}
  .co-auth-banner-btn{margin-top:8px;border:0;background:var(--co-green);color:#fff;border-radius:var(--co-radius);padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer;}
  .co-toggle-wrap{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--co-bg);border:1px solid var(--co-border);border-radius:var(--co-radius);cursor:pointer;margin-bottom:16px;}
  .co-toggle-left{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:var(--co-mid);}
  .co-toggle-track{width:40px;height:22px;border-radius:11px;padding:2px;transition:background .2s;}
  .co-toggle-track-off{background:#d1d5db;}.co-toggle-track-on{background:var(--co-green-600);}
  .co-toggle-knob{width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0002;transition:transform .2s;}
  .co-toggle-knob-on{transform:translateX(18px);}
  .co-warning-banner{background:#fffbeb;border:1px solid #fde68a;align-items:flex-start;}
  .co-warning-banner p{font-size:12px;font-weight:600;color:#92400e;margin:0;line-height:1.5;}
  .co-items-list{max-height:380px;overflow-y:auto;padding-right:4px;}
  .co-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #f5f5f5;}
  .co-item:last-child{border-bottom:0;}.co-item-left{display:flex;gap:12px;flex:1;min-width:0;}
  .co-item-img,.co-item-img-placeholder{width:56px;height:56px;border-radius:var(--co-radius);object-fit:cover;border:1px solid #f0f0f0;flex-shrink:0;}
  .co-item-img-placeholder{display:flex;align-items:center;justify-content:center;background:var(--co-bg);font-size:10px;color:var(--co-light);}
  .co-item-info{flex:1;min-width:0;}.co-item-name{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0 0 2px;}
  .co-item-unit{font-size:12px;color:var(--co-light);margin:0;}.co-item-qty{display:inline-flex;margin-top:4px;padding:2px 8px;border-radius:100px;background:var(--co-green-lighter);font-size:11px;font-weight:700;color:var(--co-green);}
  .co-item-price{font-size:14px;font-weight:900;flex-shrink:0;}.co-totals{padding-top:16px;border-top:1px solid var(--co-border);}
  .co-total-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0;font-size:14px;}.co-total-row-label{color:var(--co-mid);}.co-total-row-value{font-weight:700;}.co-total-row-free{font-weight:700;color:var(--co-green-600);}.co-total-row-warning{font-weight:600;color:#d97706;}
  .co-service-charge{display:flex;justify-content:space-between;padding:8px 12px;background:#eff6ff;border-radius:var(--co-radius);margin:8px 0;}.co-service-charge span{font-size:13px;font-weight:600;color:#1e40af;}
  .co-grand-total{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:linear-gradient(135deg,#fef2f2,#fff7ed);border-radius:var(--co-radius);margin-top:8px;border:1px solid #fecaca;}
  .co-grand-total-label,.co-grand-total-value{font-weight:900;color:var(--co-red);}.co-grand-total-value{font-size:18px;}.co-charge-note{font-size:11px;color:var(--co-light);text-align:center;font-style:italic;margin-top:6px;}
  .co-payment-section{margin-top:20px;}.co-payment-title{font-size:14px;font-weight:800;margin:0 0 12px;}.co-payment-options{display:flex;flex-direction:column;gap:8px;}.co-payment-option{display:flex;align-items:center;gap:12px;padding:12px 16px;border:2px solid var(--co-border);border-radius:var(--co-radius);cursor:pointer;background:#fff;}.co-payment-option-active{border-color:var(--co-green-600)!important;background:var(--co-green-lighter)!important;}.co-payment-option-text{font-size:14px;font-weight:600;color:var(--co-mid);}
  .co-btn-primary,.co-btn-danger,.co-btn-secondary{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:var(--co-radius);font-weight:700;cursor:pointer;transition:.15s;font-family:inherit;}
  .co-btn-primary{padding:14px;background:var(--co-green);color:#fff;border:0;font-size:15px;}.co-btn-primary:hover{background:var(--co-green-mid);}.co-btn-primary:disabled{background:#d1d5db;cursor:not-allowed;}
  .co-btn-danger{padding:12px;background:#fff;color:var(--co-red);border:1px solid #fecaca;font-size:14px;}.co-btn-danger:hover{background:#fef2f2;}
  .co-btn-secondary{padding:9px 12px;background:#fff;color:var(--co-dark);border:1px solid var(--co-border);font-size:12px;}.co-btn-secondary:hover{background:var(--co-bg);}
  .co-sticky-bottom{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid var(--co-border);padding:12px 16px;z-index:40;box-shadow:0 -2px 12px #0001;display:block;}
  @media(min-width:1024px){.co-sticky-bottom{display:none;}}.co-desktop-btn{display:none;margin-top:20px;}@media(min-width:1024px){.co-desktop-btn{display:block;}}
  .co-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 24px;min-height:400px;}.co-empty-icon{width:72px;height:72px;border-radius:50%;background:var(--co-bg);display:grid;place-items:center;margin-bottom:16px;border:1px solid var(--co-border);}.co-empty-title{font-size:22px;font-weight:800;margin-bottom:8px;}.co-empty-desc{font-size:14px;color:var(--co-light);margin-bottom:24px;}
  .co-loading-overlay{position:fixed;inset:0;background:#0008;backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:10000;}.co-loading-card{background:#fff;border-radius:var(--co-radius-xl);padding:32px;display:flex;flex-direction:column;align-items:center;gap:16px;box-shadow:0 20px 60px #0003;}.co-spinner{width:40px;height:40px;border:4px solid var(--co-green-light);border-top-color:var(--co-green-600);border-radius:50%;animation:co-spin .8s linear infinite;}@keyframes co-spin{to{transform:rotate(360deg);}}.co-loading-text{font-size:15px;font-weight:700;color:var(--co-mid);}
  .co-modal .ant-modal{max-width:calc(100vw - 32px)!important;margin:16px!important;}.pm-modal-wrap{display:flex;flex-direction:column;max-height:calc(100vh - 32px);}.pm-header-compact{background:linear-gradient(135deg,#0d3d20,#14532d 50%,#166534);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;}.pm-header-left{display:flex;align-items:center;gap:10px;}.pm-logo-small{height:28px;object-fit:contain;filter:brightness(0) invert(1);}.pm-company-small{font-size:10px;font-weight:700;color:#ffffff80;text-transform:uppercase;margin:0;}.pm-ref-small{font-size:10px;color:#ffffff99;margin:3px 0 0;}.pm-header-right{text-align:right;}.pm-amount-label-small{font-size:9px;font-weight:700;color:#ffffff80;text-transform:uppercase;margin:0;}.pm-amount-value-small{font-size:24px;font-weight:900;color:#fff;margin:0;}
  .pm-body{padding:16px;display:flex;flex-direction:column;gap:12px;background:#fff;overflow-y:auto;}.pm-field{border:1.5px solid #e5e7eb;border-radius:10px;overflow:hidden;}.pm-field-header{display:flex;align-items:center;gap:8px;padding:9px 12px;background:#f9fafb;border-bottom:1px solid #f0f0f0;}.pm-field-step-num{width:20px;height:20px;background:var(--co-green);color:#fff;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:900;}.pm-field-label{font-size:12px;font-weight:800;}.pm-field-body{padding:12px;}.pm-validation{font-size:11px;font-weight:600;margin-top:6px;display:flex;align-items:center;gap:4px;}.pm-validation-error{color:var(--co-red);}.pm-validation-ok{color:var(--co-green-600);}.pm-validation-warning{color:#d97706;}
  .pm-account-status{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;font-size:12px;font-weight:600;}.pm-account-valid{background:#f0fdf4;border:1px solid #86efac;color:var(--co-green);}.pm-account-invalid{background:#fef2f2;border:1px solid #fca5a5;color:var(--co-red);}.pm-account-checking{background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280;}.pm-account-icon{width:20px;height:20px;flex-shrink:0;}.pm-networks{display:flex;flex-direction:column;gap:6px;}.pm-network-tile{display:flex;align-items:center;gap:10px;padding:10px 12px;border:2px solid #e5e7eb;border-radius:10px;cursor:pointer;background:#fff;min-height:56px;}.pm-network-logo{width:36px;height:36px;object-fit:contain;border-radius:6px;}.pm-network-info{flex:1;}.pm-network-name{font-size:13px;font-weight:800;margin:0;}.pm-network-sub{font-size:10px;color:var(--co-light);margin:2px 0 0;}.pm-pay-btn{width:100%;padding:14px;background:linear-gradient(135deg,#14532d,#166534);color:#fff;border:0;border-radius:10px;font-size:15px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;min-height:50px;}.pm-pay-btn:disabled{background:#9ca3af;cursor:not-allowed;}.pm-security{display:flex;align-items:center;justify-content:center;gap:5px;font-size:10px;font-weight:600;color:#6b7280;padding:7px;background:#f9fafb;border-radius:6px;}.pm-info-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 12px;}.pm-info-title{font-size:11px;font-weight:800;color:var(--co-green);margin:0 0 6px;}.pm-info-list{font-size:11px;color:#16a34a;margin:0;padding-left:18px;display:grid;gap:4px;}
  .pm-pending-wrap{padding:12px 0 20px;display:flex;flex-direction:column;align-items:center;gap:16px;}.pm-pending-anim{position:relative;width:78px;height:78px;}.pm-pending-ring-outer,.pm-pending-ring-spin{position:absolute;inset:0;border-radius:50%;}.pm-pending-ring-outer{border:3px solid #dcfce7;}.pm-pending-ring-spin{border:3px solid transparent;border-top-color:var(--co-green-600);animation:co-spin 1s linear infinite;}.pm-pending-ring-inner{position:absolute;inset:9px;border:2px solid #f0fdf4;border-radius:50%;display:grid;place-items:center;background:#dcfce7;}.pm-pending-title{font-size:18px;font-weight:900;margin:0 0 4px;}.pm-pending-desc{font-size:12px;color:var(--co-light);margin:0;text-align:center;}.pm-pending-details{width:100%;background:#f9fafb;border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;}.pm-pending-row{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid #f5f5f5;font-size:12px;}.pm-pending-row:last-child{border-bottom:0;}.pm-pending-row-label{color:var(--co-light);}.pm-pending-row-value{font-weight:700;}.pm-pending-row-amount{font-weight:900;color:var(--co-green);font-size:14px;}
  .co-dialog-overlay{position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;padding:16px;}.co-dialog-backdrop{position:absolute;inset:0;background:#0008;backdrop-filter:blur(4px);}.co-dialog-card{position:relative;background:#fff;border-radius:var(--co-radius-xl);width:100%;max-width:400px;overflow:hidden;box-shadow:0 20px 60px #0003;}.co-dialog-bar{height:4px;width:100%;}.co-dialog-bar-cancel{background:linear-gradient(90deg,#f87171,#ef4444);}.co-dialog-bar-warning,.co-failed-bar{background:linear-gradient(90deg,#fbbf24,#f59e0b);}.co-dialog-body{padding:24px;}.co-dialog-icon{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;margin:0 auto 16px;}.co-dialog-icon-cancel{background:#fef2f2;}.co-dialog-icon-warning{background:#fffbeb;}.co-dialog-title{font-size:18px;font-weight:900;text-align:center;margin-bottom:6px;}.co-dialog-desc{font-size:13px;color:var(--co-light);text-align:center;line-height:1.5;margin-bottom:20px;}.co-dialog-actions{display:flex;flex-direction:column;gap:8px;}.co-failed-countdown{display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:700;color:#92400e;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:8px 12px;margin-bottom:16px;}
  .co-guide-header{display:flex;align-items:flex-start;gap:12px;}.co-guide-logo-wrap{width:44px;height:44px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;border:2px solid;}.co-guide-logo{width:30px;height:30px;object-fit:contain;}.co-guide-badge{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;border:1px solid;margin-bottom:4px;}.co-guide-title{font-size:18px;font-weight:900;margin:0;}.co-guide-subtitle{font-size:13px;color:var(--co-light);margin:3px 0 0;}.co-guide-info-row,.co-guide-ussd-row{display:flex;align-items:center;justify-content:space-between;border-radius:var(--co-radius);border:1px solid;padding:10px 14px;}.co-guide-info-label{font-size:10px;font-weight:700;color:var(--co-light);text-transform:uppercase;margin:0 0 2px;}.co-guide-info-value{font-weight:900;margin:0;}.co-guide-steps-wrap{background:#fff;border:1px solid #f0f0f0;border-radius:var(--co-radius);overflow:hidden;}.co-guide-steps-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #f5f5f5;}.co-guide-steps-title{font-size:13px;font-weight:800;margin:0;}.co-guide-steps-body{padding:14px;max-height:280px;overflow:auto;}.co-guide-step{display:flex;gap:12px;align-items:flex-start;margin-bottom:10px;}.co-guide-step-num{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:11px;font-weight:900;flex-shrink:0;}.co-guide-step-text{font-size:13px;color:var(--co-mid);margin:3px 0 0;line-height:1.4;}.co-guide-tip{display:flex;gap:10px;background:#fffbeb;border:1px solid #fde68a;border-radius:var(--co-radius);padding:10px 14px;font-size:12px;font-weight:600;color:#92400e;}.co-guide-sticky{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid var(--co-border);padding:12px 16px;z-index:10002;display:flex;flex-direction:column;gap:8px;}.co-guide-desktop-actions{display:none;flex-direction:column;gap:8px;}@media(min-width:1024px){.co-guide-sticky{display:none;}.co-guide-desktop-actions{display:flex;}}
`;

const PaymentActionDialog = ({ open, mode, verifying, onRetry, onCancel, onClose }) => {
  if (!open) return null;
  const isCancel = mode === "cancel";
  return (
    <div className="co-dialog-overlay">
      <div className="co-dialog-backdrop" onClick={() => !verifying && onClose()} />
      <div className="co-dialog-card">
        <div className={`co-dialog-bar ${isCancel ? "co-dialog-bar-cancel" : "co-dialog-bar-warning"}`} />
        <div className="co-dialog-body">
          <div className={`co-dialog-icon ${isCancel ? "co-dialog-icon-cancel" : "co-dialog-icon-warning"}`}>
            {isCancel ? <XCircleSolid style={{ width: 32, height: 32, color: "#ef4444" }} /> : <ExclamationTriangleIcon style={{ width: 32, height: 32, color: "#f59e0b" }} />}
          </div>
          <div className="co-dialog-title">{isCancel ? "Cancel this order?" : "Payment not confirmed yet"}</div>
          <div className="co-dialog-desc">{isCancel ? "Are you sure you want to cancel the order?" : "Approve the pending request on your phone, then check again."}</div>
          <div className="co-dialog-actions">
            <button onClick={onRetry} disabled={verifying} className="co-btn-primary">
              {verifying ? "Verifying…" : <><ArrowUturnLeftIcon style={{ width: 16, height: 16 }} /> I've Approved — Try Again</>}
            </button>
            <button onClick={onCancel} disabled={verifying} className="co-btn-danger"><XCircleIcon style={{ width: 16, height: 16 }} /> Yes, Cancel Order</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckoutFailedDialog = ({ open, displayMessage, countdown, onGoHome }) => {
  if (!open) return null;
  return (
    <div className="co-dialog-overlay" style={{ zIndex: 10003 }}>
      <div className="co-dialog-backdrop" />
      <div className="co-dialog-card" style={{ maxWidth: 440 }}>
        <div className="co-failed-bar" style={{ height: 4 }} />
        <div className="co-dialog-body" style={{ textAlign: "center" }}>
          <div className="co-dialog-icon co-dialog-icon-warning"><ArrowPathIcon style={{ width: 32, height: 32, color: "#d97706" }} /></div>
          <div className="co-dialog-title">Price Update Detected</div>
          <div className="co-dialog-desc" style={{ marginBottom: 12, color: "#1a1a1a", fontWeight: 600 }}>{displayMessage || FRIENDLY_PRICE_UPDATE_MSG}</div>
          <div className="co-failed-countdown"><ArrowPathIcon style={{ width: 14, height: 14 }} /> Redirecting to home in {countdown}s…</div>
          <button onClick={onGoHome} className="co-btn-secondary">Start shopping</button>
        </div>
      </div>
    </div>
  );
};

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pollRef = useRef(null);
  const countdownRef = useRef(null);
  const initialDelayRef = useRef(null);
  const autoCheckRef = useRef(null);
  const autoCountdownRef = useRef(null);
  const validationTimeoutRef = useRef(null);
  const failedRedirectRef = useRef(null);
  const failedCountdownRef = useRef(null);
  const paymentResolvedRef = useRef(false);
  const autoCheckFiredRef = useRef(false);
  const resumeCheckoutRef = useRef(false);
  const handleCheckoutRef = useRef(null);

  const { cart: reduxCart, cartId: reduxCartId } = useSelector((state) => state.cart);
  const customerState = useSelector((state) => state.customer ?? state.customerReducer ?? state.customers ?? null);
  const { validating: accountValidating, validateAccountData, error: paymentError } = useSelector((state) => state.payment);

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Processing your order…");
  const [orderNote, setOrderNote] = useState(() => readStoredObject("checkoutDetails").orderNote || "");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryInfo, setDeliveryInfo] = useState(() => {
    const savedAddress = readStoredObject("orderAddressDetails");
    return { address: savedAddress.address || "", fee: 0, feeDisplay: "" };
  });
  const [customerData, setCustomerData] = useState(null);
  const [isDifferentRecipient, setIsDifferentRecipient] = useState(() => {
    try {
      return localStorage.getItem("checkoutDifferentRecipient") === "true";
    } catch {
      return false;
    }
  });
  const [customerName, setCustomerName] = useState(() =>
    readStoredObject("checkoutDetails").recipientName || ""
  );
  const [customerNumber, setCustomerNumber] = useState(() =>
    readStoredObject("checkoutDetails").recipientContactNumber || ""
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isValidationModalVisible, setIsValidationModalVisible] = useState(false);
  const [isGuestWarningVisible, setIsGuestWarningVisible] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isApprovalGuideVisible, setIsApprovalGuideVisible] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [pendingCheckoutDetails, setPendingCheckoutDetails] = useState(null);
  const [pendingAddressDetails, setPendingAddressDetails] = useState(null);
  const [payButtonLoading, setPayButtonLoading] = useState(false);
  const [manualVerifying, setManualVerifying] = useState(false);
  const [timeoutCountdown, setTimeoutCountdown] = useState(60);
  const [autoCheckCountdown, setAutoCheckCountdown] = useState(0);
  const [debitErrorMessage, setDebitErrorMessage] = useState("");
  const [momoNumber, setMomoNumber] = useState("233");
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [isValidationDebouncing, setIsValidationDebouncing] = useState(false);
  const [isServiceUnavailable, setIsServiceUnavailable] = useState(false);
  const [retryValidationLoading, setRetryValidationLoading] = useState(false);
  const [actionDialog, setActionDialog] = useState({ open: false, mode: "cancel" });
  const [checkoutFailedModal, setCheckoutFailedModal] = useState({
    open: false,
    displayMessage: "",
    rawMessage: "",
    countdown: CHECKOUT_FAIL_REDIRECT_SECONDS,
  });
  const previousRecipientModeRef = useRef(isDifferentRecipient);

  const getLocalCart = useCallback(() => {
    try {
      const raw = localStorage.getItem("cart");
      const parsed = typeof raw === "string" ? safeJsonParse(raw, []) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);
  const resolveCartItems = useCallback(
    () => (Array.isArray(reduxCart) && reduxCart.length ? reduxCart : getLocalCart()),
    [reduxCart, getLocalCart]
  );
  const [cartItems, setCartItems] = useState(resolveCartItems);
  const getCartId = useCallback(() => {
    try {
      return String(reduxCartId || localStorage.getItem("cartId") || "").trim();
    } catch {
      return String(reduxCartId || "").trim();
    }
  }, [reduxCartId]);

  const sessionCustomer = useMemo(
    () => resolveCustomer(customerState, customerData),
    [customerState, customerData]
  );
  const customerReady = hasCustomerDetails(sessionCustomer);
  const customerAccountType = sessionCustomer?.accountType;
  const selectedAddress = deliveryInfo?.address || "";
  const isAgent = String(customerAccountType || "").toLowerCase() === "agent";
  const isFreeDelivery = deliveryInfo?.fee === 0 && String(deliveryInfo?.feeDisplay || "").toLowerCase().includes("free");
  const isNADelivery = deliveryInfo?.fee === 0 && (!deliveryInfo?.feeDisplay || ["N/A", ""].includes(deliveryInfo.feeDisplay) || String(deliveryInfo.feeDisplay).toLowerCase() === "n/a");
  const netCfg = selectedNetwork ? NETWORK_STEPS[selectedNetwork] : null;

  const accountStatus = useMemo(() => {
    if (isServiceUnavailable) return "service_unavailable";
    if (retryValidationLoading || isValidationDebouncing || accountValidating) return "checking";
    if (validateAccountData) return isAccountValid(validateAccountData) ? "valid" : "invalid";
    return "idle";
  }, [isServiceUnavailable, retryValidationLoading, isValidationDebouncing, accountValidating, validateAccountData]);
  const accountHolderName = validateAccountData?.name || null;
  const accountValidationMessage = validateAccountData?.responseMessage || paymentError || "";

  const clearAllTimers = useCallback(() => {
    [pollRef, countdownRef, initialDelayRef, autoCheckRef, autoCountdownRef, validationTimeoutRef].forEach((ref) => {
      if (ref.current) {
        clearTimeout(ref.current);
        clearInterval(ref.current);
      }
      ref.current = null;
    });
  }, []);
  const clearFailedTimers = useCallback(() => {
    if (failedRedirectRef.current) clearTimeout(failedRedirectRef.current);
    if (failedCountdownRef.current) clearInterval(failedCountdownRef.current);
    failedRedirectRef.current = null;
    failedCountdownRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimers();
      clearFailedTimers();
      dispatch(resetPaymentState());
    };
  }, [dispatch, clearAllTimers, clearFailedTimers]);

  const applyCustomerToForm = useCallback((customer) => {
    if (!hasCustomerDetails(customer)) return;
    setCustomerData(customer);
    persistCustomer(customer);
    if (!isDifferentRecipient) {
      setCustomerName(customerDisplayName(customer));
      setCustomerNumber(customerPhone(customer));
    }
  }, [isDifferentRecipient]);

  const openPriceUpdateModal = useCallback((error) => {
    clearFailedTimers();
    clearAllTimers();
    paymentResolvedRef.current = true;
    dispatch(resetPaymentState());
    setIsPaymentModalVisible(false);
    setIsApprovalGuideVisible(false);
    setPaymentStatus("idle");
    const rawMessage = getErrorMessage(error, "");
    const customerToKeep = sessionCustomer || customerData || readCustomerFromStorage();
    const checkoutDraft = readStoredObject("checkoutDetails");
    const addressDraft = readStoredObject("orderAddressDetails");
    let recipientModeDraft = null;
    try {
      recipientModeDraft = localStorage.getItem("checkoutDifferentRecipient");
    } catch {
      // The current React state still retains recipient mode.
    }
    if (customerToKeep) persistCustomer(customerToKeep);
    try {
      dispatch(clearCart());
      localStorage.removeItem("cart");
      localStorage.removeItem("cartId");
      // Clear only cart state. Restore customer and checkout drafts in case the
      // cart reducer performs broader browser-storage cleanup.
      if (Object.keys(checkoutDraft).length) localStorage.setItem("checkoutDetails", JSON.stringify(checkoutDraft));
      if (Object.keys(addressDraft).length) localStorage.setItem("orderAddressDetails", JSON.stringify(addressDraft));
      if (recipientModeDraft !== null) localStorage.setItem("checkoutDifferentRecipient", recipientModeDraft);
      if (customerToKeep) persistCustomer(customerToKeep);
    } catch {
      // Continue showing the modal even if cart cleanup fails.
    }
    setCartItems([]);
    setCheckoutFailedModal({
      open: true,
      displayMessage: FRIENDLY_PRICE_UPDATE_MSG,
      rawMessage,
      countdown: CHECKOUT_FAIL_REDIRECT_SECONDS,
    });
    let remaining = CHECKOUT_FAIL_REDIRECT_SECONDS;
    failedCountdownRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(failedCountdownRef.current);
        failedCountdownRef.current = null;
      } else {
        setCheckoutFailedModal((previous) => ({ ...previous, countdown: remaining }));
      }
    }, 1000);
    failedRedirectRef.current = setTimeout(() => {
      clearFailedTimers();
      setCheckoutFailedModal({ open: false, displayMessage: "", rawMessage: "", countdown: CHECKOUT_FAIL_REDIRECT_SECONDS });
      navigate("/");
    }, CHECKOUT_FAIL_REDIRECT_SECONDS * 1000);
  }, [clearAllTimers, clearFailedTimers, dispatch, navigate, sessionCustomer, customerData]);

  const closePriceUpdateModal = useCallback(() => {
    clearFailedTimers();
    const customerToKeep = sessionCustomer || customerData || readCustomerFromStorage();
    const checkoutDraft = readStoredObject("checkoutDetails");
    const addressDraft = readStoredObject("orderAddressDetails");
    let recipientModeDraft = null;
    try {
      recipientModeDraft = localStorage.getItem("checkoutDifferentRecipient");
    } catch {
      // Continue with the in-memory customer state.
    }
    if (customerToKeep) persistCustomer(customerToKeep);
    try {
      dispatch(clearCart());
      localStorage.removeItem("cart");
      localStorage.removeItem("cartId");
      if (Object.keys(checkoutDraft).length) localStorage.setItem("checkoutDetails", JSON.stringify(checkoutDraft));
      if (Object.keys(addressDraft).length) localStorage.setItem("orderAddressDetails", JSON.stringify(addressDraft));
      if (recipientModeDraft !== null) localStorage.setItem("checkoutDifferentRecipient", recipientModeDraft);
      if (customerToKeep) persistCustomer(customerToKeep);
    } catch {
      // Cart cleanup is best-effort; preserve customer data where possible.
    }
    setCartItems([]);
    setCheckoutFailedModal({ open: false, displayMessage: "", rawMessage: "", countdown: CHECKOUT_FAIL_REDIRECT_SECONDS });
    navigate("/");
  }, [clearFailedTimers, dispatch, navigate, sessionCustomer, customerData]);

  useEffect(() => {
    try {
      localStorage.setItem("checkoutDifferentRecipient", String(isDifferentRecipient));
    } catch {
      // Keep the current recipient setting in React state if storage is unavailable.
    }
  }, [isDifferentRecipient]);

  useEffect(() => {
    const activeCustomer = resolveCustomer(customerState, null);
    if (activeCustomer) applyCustomerToForm(activeCustomer);
  }, [customerState, applyCustomerToForm]);

  useEffect(() => {
    const id = getCartId();
    if (id) dispatch(getCartById(id));
  }, [dispatch, getCartId]);

  useEffect(() => {
    const wasDifferentRecipient = previousRecipientModeRef.current;
    if (isDifferentRecipient && !wasDifferentRecipient) {
      // Clear account defaults only when the user switches to a new recipient.
      setCustomerName("");
      setCustomerNumber("");
    } else if (!isDifferentRecipient && wasDifferentRecipient && sessionCustomer) {
      setCustomerName(customerDisplayName(sessionCustomer));
      setCustomerNumber(customerPhone(sessionCustomer));
    }
    previousRecipientModeRef.current = isDifferentRecipient;
  }, [isDifferentRecipient, sessionCustomer]);

  useEffect(() => {
    if (deliveryInfo?.fee !== undefined && !Number.isNaN(Number(deliveryInfo.fee))) {
      setDeliveryFee(Number(deliveryInfo.fee));
    }
  }, [deliveryInfo]);

  useEffect(() => {
    if (Array.isArray(reduxCart) && reduxCart.length) setCartItems(reduxCart);
    else {
      const localItems = getLocalCart();
      if (localItems.length) setCartItems(localItems);
    }
  }, [reduxCart, getLocalCart]);

  const handleRetryValidation = useCallback(async () => {
    if (!isValidMsisdn(momoNumber) || !selectedNetwork) return;
    setRetryValidationLoading(true);
    setIsServiceUnavailable(false);
    dispatch(resetValidateAccountData());
    try {
      await dispatch(validateAccount({ msisdn: sanitizeMsisdn(momoNumber), network: NETWORK_API_MAP[selectedNetwork] })).unwrap();
    } catch (error) {
      if (String(error).includes("503") || error?.message?.includes("503")) setIsServiceUnavailable(true);
    } finally {
      setRetryValidationLoading(false);
    }
  }, [momoNumber, selectedNetwork, dispatch]);

  useEffect(() => {
    if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
    if (isValidMsisdn(momoNumber) && selectedNetwork) {
      if (retryValidationLoading) return undefined;
      setIsValidationDebouncing(true);
      if (String(paymentError || "").includes("503") || String(paymentError || "").includes("Service Unavailable")) {
        setIsServiceUnavailable(true);
        setIsValidationDebouncing(false);
        return undefined;
      }
      dispatch(resetValidateAccountData());
      validationTimeoutRef.current = setTimeout(() => {
        setIsValidationDebouncing(false);
        dispatch(validateAccount({ msisdn: sanitizeMsisdn(momoNumber), network: NETWORK_API_MAP[selectedNetwork] }))
          .unwrap()
          .catch((error) => {
            if (String(error).includes("503") || error?.message?.includes("503")) setIsServiceUnavailable(true);
          });
      }, 500);
    } else {
      setIsValidationDebouncing(false);
      dispatch(resetValidateAccountData());
      setIsServiceUnavailable(false);
    }
    return () => {
      if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
    };
  }, [momoNumber, selectedNetwork, dispatch, paymentError, retryValidationLoading]);

  const clearCartAndStorage = useCallback(() => {
    dispatch(clearCart());
    try {
      localStorage.removeItem("cart");
      localStorage.removeItem("cartId");
    } catch {
      // Best-effort cleanup.
    }
  }, [dispatch]);

  const calculateSubtotal = useCallback(() => cartItems.reduce((sum, item) => sum + getItemLineTotal(item), 0), [cartItems]);
  const calculateTotalAmount = useCallback(() => calculateSubtotal() + deliveryFee, [calculateSubtotal, deliveryFee]);
  const calculateServiceCharge = useCallback(() => {
    const base = calculateTotalAmount();
    return base > 2000 ? SERVICE_CHARGE_CAP : base * SERVICE_CHARGE_RATE;
  }, [calculateTotalAmount]);
  const calculateDisplayTotalWithCharge = useCallback(() => calculateTotalAmount() + calculateServiceCharge(), [calculateTotalAmount, calculateServiceCharge]);
  const getServiceChargeLabel = () => calculateTotalAmount() > 2000 ? "MoMo Service Charge:" : "MoMo Service Charge (1%):";
  const generateOrderId = () => `ORD-${Date.now() % 10000}-${Math.floor(Math.random() * 1000)}`;

  const buildCartValidationPayload = useCallback(({
    checkoutDetails,
    paymentAccountNumber,
    paymentService,
  }) => ({
    cartId: String(checkoutDetails?.Cartid ?? getCartId()),
    customerid: String(checkoutDetails?.customerId ?? sessionCustomer?.customerAccountNumber ?? sessionCustomer?.CustomerAccountNumber ?? ""),
    orderDate: checkoutDetails?.orderDate ?? new Date().toISOString(),
    paymentMode: String(checkoutDetails?.PaymentMode ?? paymentMethod ?? ""),
    paymentService: String(paymentService ?? checkoutDetails?.paymentService ?? "N/A"),
    paymentAccountNumber: String(paymentAccountNumber ?? checkoutDetails?.PaymentAccountNumber ?? ""),
    customerAccountType: String(checkoutDetails?.customerAccountType ?? ""),
    items: cartItems.map((item) => ({
      productId: String(item.productId ?? item.productID ?? item.ProductId ?? item.ProductID ?? item.id ?? ""),
      price: getItemUnitPrice(item),
      quantity: getItemQuantity(item),
    })),
  }), [cartItems, getCartId, sessionCustomer, paymentMethod]);

  const validateCurrentCart = useCallback(async (payload) => {
    try {
      const validationResponse = await dispatch(validateCart(payload)).unwrap();
      // A code-0/PriceChange response is never allowed to continue to payment or order posting.
      if (isValidateCartPriceChange(validationResponse)) {
        openPriceUpdateModal(normalizePriceUpdateError(validationResponse));
        return false;
      }
      return true;
    } catch (error) {
      // CheckOutDbCart is not handled here; this path only wraps ValidateCart.
      if (isValidateCartPriceChange(error)) {
        openPriceUpdateModal(normalizePriceUpdateError(error));
        return false;
      }
      if (error?.isAuthError || error?.authExpired) return false;
      throw error;
    }
  }, [dispatch, openPriceUpdateModal]);

  const dispatchOrderCheckoutWithRetry = useCallback(async (checkoutDetails, maxRetries = 1) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        // CheckOutDbCart is order creation only; it is never used to validate price.
        return await dispatch(checkOutOrder({ cartId: getCartId(), ...checkoutDetails })).unwrap();
      } catch (error) {
        if (error?.isAuthError || error?.authExpired) throw error;
        lastError = error;
        if (attempt < maxRetries) await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
      }
    }
    throw new Error(getErrorMessage(lastError, "Could not create the order. Please try again."));
  }, [dispatch, getCartId]);

  const dispatchOrderAddressWithRetry = useCallback(async (addressDetails, maxRetries = 2) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        return await dispatch(updateOrderDelivery(addressDetails)).unwrap();
      } catch (error) {
        if (error?.isAuthError || error?.authExpired) throw error;
        lastError = error;
        if (attempt < maxRetries) await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
      }
    }
    throw new Error(getErrorMessage(lastError, "Could not save the delivery details."));
  }, [dispatch]);

  const processDirectCheckout = useCallback(async (checkoutDetails, addressDetails) => {
    const orderResponse = await dispatchOrderCheckoutWithRetry(checkoutDetails);
    const addressResponse = await dispatchOrderAddressWithRetry(addressDetails);
    return { orderResponse, addressResponse };
  }, [dispatchOrderCheckoutWithRetry, dispatchOrderAddressWithRetry]);

  const processMoMoPostPayment = useCallback(async (checkoutDetails, addressDetails) => {
    // This is called only after confirmed payment. No order is pre-created.
    return processDirectCheckout(checkoutDetails, addressDetails);
  }, [processDirectCheckout]);

  const clearPaymentTimers = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (initialDelayRef.current) clearTimeout(initialDelayRef.current);
    if (autoCheckRef.current) clearTimeout(autoCheckRef.current);
    if (autoCountdownRef.current) clearInterval(autoCountdownRef.current);
    pollRef.current = null;
    countdownRef.current = null;
    initialDelayRef.current = null;
    autoCheckRef.current = null;
    autoCountdownRef.current = null;
  }, []);

  const handlePaymentSuccessFlow = useCallback(async (orderId, checkoutDetails, addressDetails) => {
    if (paymentResolvedRef.current) return;
    paymentResolvedRef.current = true;
    setPaymentStatus("success");
    setIsApprovalGuideVisible(false);
    clearPaymentTimers();
    setLoadingText("Finalizing your order…");
    setLoading(true);
    try {
      // Payment has been confirmed before this point. Create the order now.
      await processMoMoPostPayment(checkoutDetails, addressDetails);
      clearCartAndStorage();
      try {
        localStorage.removeItem("checkoutDetails");
        localStorage.removeItem("orderAddressDetails");
        localStorage.removeItem("checkoutDifferentRecipient");
      } catch {
        // Best-effort cleanup.
      }
      message.success("Payment confirmed! Your order has been placed.");
      setTimeout(() => {
        setIsPaymentModalVisible(false);
        setLoading(false);
        navigate(`/order-success/${orderId}`);
      }, 1000);
    } catch (error) {
      setLoading(false);
      if (error?.isAuthError || error?.authExpired) return;
      message.error(`Payment was confirmed, but order processing needs support. Please quote order ${orderId}.`);
      // Preserve the paid transaction and send the customer to the order status page.
      setTimeout(() => {
        setIsPaymentModalVisible(false);
        navigate(`/order-success/${orderId}`);
      }, 1200);
    }
  }, [clearPaymentTimers, clearCartAndStorage, navigate, processMoMoPostPayment]);

  const startPolling = useCallback((orderId, checkoutDetails, addressDetails) => {
    setTimeoutCountdown(60);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setTimeoutCountdown((previous) => Math.max(0, previous - 1));
    }, 1000);
    initialDelayRef.current = setTimeout(() => {
      let count = 0;
      const maxPolls = MAX_POLL_DURATION_MS / POLL_INTERVAL_MS;
      pollRef.current = setInterval(async () => {
        if (paymentResolvedRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          return;
        }
        count += 1;
        try {
          const response = await dispatch(checkTransactionStatus({ refNo: orderId })).unwrap();
          if (isPaymentSuccess(response)) {
            clearPaymentTimers();
            await handlePaymentSuccessFlow(orderId, checkoutDetails, addressDetails);
            return;
          }
        } catch {
          // Poll again until the approval window ends.
        }
        if (count >= maxPolls) {
          clearPaymentTimers();
          setPaymentStatus("awaiting_manual");
          setIsApprovalGuideVisible(true);
        }
      }, POLL_INTERVAL_MS);
    }, INITIAL_DELAY_MS);
  }, [dispatch, clearPaymentTimers, handlePaymentSuccessFlow]);

  useEffect(() => {
    if (!isApprovalGuideVisible || !currentOrderId) return undefined;
    autoCheckFiredRef.current = false;
    setAutoCheckCountdown(AUTO_CHECK_DELAY_MS / 1000);
    autoCountdownRef.current = setInterval(() => {
      setAutoCheckCountdown((previous) => {
        if (previous <= 1) {
          clearInterval(autoCountdownRef.current);
          autoCountdownRef.current = null;
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    autoCheckRef.current = setTimeout(async () => {
      if (autoCheckFiredRef.current || paymentResolvedRef.current) return;
      autoCheckFiredRef.current = true;
      try {
        dispatch(resetTransactionStatus());
        const response = await dispatch(checkTransactionStatus({ refNo: currentOrderId })).unwrap();
        if (isPaymentSuccess(response)) {
          await handlePaymentSuccessFlow(currentOrderId, pendingCheckoutDetails, pendingAddressDetails);
        } else {
          message.warning("Payment is not confirmed yet. Approve it on your phone and check again.");
        }
      } catch {
        message.warning("Could not verify payment automatically. Please check again.");
      }
    }, AUTO_CHECK_DELAY_MS);
    return () => {
      if (autoCountdownRef.current) clearInterval(autoCountdownRef.current);
      if (autoCheckRef.current) clearTimeout(autoCheckRef.current);
      autoCountdownRef.current = null;
      autoCheckRef.current = null;
    };
  }, [isApprovalGuideVisible, currentOrderId, dispatch, handlePaymentSuccessFlow, pendingCheckoutDetails, pendingAddressDetails]);

  const validateRequiredFields = (nameOverride, numberOverride) => {
    const name = (nameOverride ?? customerName) || "";
    const number = (numberOverride ?? customerNumber) || "";
    const errors = [];
    if (!name.trim()) errors.push({ field: "name", message: "Recipient name is required" });
    if (!number.trim()) errors.push({ field: "phone", message: "Recipient contact number is required" });
    if (!selectedAddress.trim()) errors.push({ field: "address", message: "Delivery address is required" });
    if (!paymentMethod) errors.push({ field: "payment", message: "Payment method is required" });
    return errors;
  };

  const getSafeCustomerDetails = (source) => {
    let name = customerName?.trim();
    let number = customerNumber?.trim();
    const accountName = customerDisplayName(source);
    if ((!name || /^guest\b/i.test(name)) && accountName) name = accountName;
    if (!name && source) name = accountName;
    if (!number && source) number = customerPhone(source);
    return { name, number: number || "0000000000" };
  };

  const enrichCustomer = useCallback(async (customer) => {
    if (!hasCustomerDetails(customer)) return customer;
    const hasId = customer.customerAccountNumber || customer.CustomerAccountNumber;
    const phone = customerPhone(customer);
    const token = customer.accessToken;
    if (hasId || !phone || !token) return customer;
    try {
      const profile = await dispatch(getCustomerById({ contactNumber: phone, accessToken: token })).unwrap();
      if (!profile || typeof profile !== "object") return customer;
      return {
        ...profile,
        ...customer,
        customerAccountNumber: profile.customerAccountNumber || profile.CustomerAccountNumber || customer.customerAccountNumber,
        firstName: customer.firstName || profile.firstName,
        lastName: customer.lastName || profile.lastName,
        contactNumber: phone,
        accessToken: token,
        refreshToken: customer.refreshToken || profile.refreshToken,
        accountType: customer.accountType || profile.accountType,
        isAuthenticated: true,
        loginStatus: true,
      };
    } catch {
      return customer;
    }
  }, [dispatch]);

  const openAuthForCheckout = useCallback((resume) => {
    resumeCheckoutRef.current = resume;
    setIsAuthModalOpen(true);
  }, []);

  const handleCheckout = async (customerOverride) => {
    const explicitCustomer = hasCustomerDetails(customerOverride) ? customerOverride : null;
    const activeCustomer = explicitCustomer || resolveCustomer(customerState, customerData);
    if (!hasCustomerDetails(activeCustomer)) {
      openAuthForCheckout(true);
      return;
    }

    const customerId = activeCustomer.customerAccountNumber || activeCustomer.CustomerAccountNumber;
    const accountType = activeCustomer.accountType;
    const isCustomerAgent = String(accountType || "").toLowerCase() === "agent";
    const { name, number } = getSafeCustomerDetails(activeCustomer);
    setCustomerData(activeCustomer);
    setCustomerName(name);
    setCustomerNumber(number);
    persistCustomer(activeCustomer);

    const normalizedName = name.toLowerCase().trim();
    if (normalizedName === "guest" || normalizedName === "guest user" || normalizedName.startsWith("guest ")) {
      setIsGuestWarningVisible(true);
      return;
    }
    if (validateRequiredFields(name, number).length) {
      setIsValidationModalVisible(true);
      return;
    }

    if (!cartItems.length) {
      message.error("Your cart is empty.");
      return;
    }

    const orderId = generateOrderId();
    setCurrentOrderId(orderId);
    const orderDate = new Date().toISOString();
    const cartId = getCartId();
    const checkoutDetails = {
      Cartid: cartId,
      customerId,
      orderCode: orderId,
      PaymentMode: paymentMethod,
      PaymentAccountNumber: number,
      customerAccountType: accountType,
      paymentService: "N/A",
      totalAmount: calculateSubtotal(),
      recipientName: name,
      recipientContactNumber: number,
      orderNote: orderNote || "N/A",
      orderDate,
    };
    const addressDetails = {
      orderCode: orderId,
      OrderCode: orderId,
      address: selectedAddress,
      Customerid: customerId,
      recipientName: name,
      recipientContactNumber: number,
      orderNote: orderNote || "N/A",
      geoLocation: "N/A",
    };

    // Persist the customer's checkout details before validation or order dispatch.
    // Validation/order failures may clear cart state, but must not clear customer data.
    dispatch(saveCheckoutDetails(checkoutDetails));
    dispatch(saveAddressDetails(addressDetails));
    try {
      const checkoutString = safeJsonStringify(checkoutDetails);
      const addressString = safeJsonStringify(addressDetails);
      if (checkoutString) localStorage.setItem("checkoutDetails", checkoutString);
      if (addressString) localStorage.setItem("orderAddressDetails", addressString);
    } catch {
      // Redux state still retains the details if browser storage is unavailable.
    }

    setLoading(true);
    try {
      if (isCustomerAgent || paymentMethod !== "Mobile Money") {
        // COD / pickup / already-paid: validate current prices, then post order.
        setLoadingText("");
        const validated = await validateCurrentCart(buildCartValidationPayload({
          checkoutDetails,
          paymentAccountNumber: number,
          paymentService: "N/A",
        }));
        if (!validated) return;

        setLoadingText("Processing your order…");
        await processDirectCheckout(checkoutDetails, addressDetails);
        clearCartAndStorage();
        try {
          localStorage.removeItem("checkoutDetails");
          localStorage.removeItem("orderAddressDetails");
          localStorage.removeItem("checkoutDifferentRecipient");
        } catch {
          // Best effort.
        }
        message.success("Your order has been placed successfully!");
        navigate("/order-received");
        return;
      }

      // MoMo: validate before opening the payment modal. Validate again at Pay Now
      // so the price is still current immediately before the debit request.
      setLoadingText("");
      const momoCartValidated = await validateCurrentCart(buildCartValidationPayload({
        checkoutDetails,
        paymentAccountNumber: number,
        paymentService: "N/A",
      }));
      if (!momoCartValidated) return;

      setPendingCheckoutDetails(checkoutDetails);
      setPendingAddressDetails(addressDetails);
      const checkoutString = safeJsonStringify(checkoutDetails);
      const addressString = safeJsonStringify(addressDetails);
      if (checkoutString) localStorage.setItem("checkoutDetails", checkoutString);
      if (addressString) localStorage.setItem("orderAddressDetails", addressString);
      dispatch(saveCheckoutDetails(checkoutDetails));
      dispatch(saveAddressDetails(addressDetails));
      dispatch(resetPaymentState());
      paymentResolvedRef.current = false;
      autoCheckFiredRef.current = false;
      setMomoNumber("233");
      setSelectedNetwork(null);
      setDebitErrorMessage("");
      setIsServiceUnavailable(false);
      setPaymentStatus("input");
      setIsPaymentModalVisible(true);
    } catch (error) {
      if (isPriceUpdateValidationError(error)) {
        openPriceUpdateModal(error);
        return;
      }
      if (error?.isAuthError || error?.authExpired) return;
      message.error(getErrorMessage(error, "An error occurred during checkout. Please try again."));
    } finally {
      setLoading(false);
      setLoadingText("Processing your order…");
    }
  };
  handleCheckoutRef.current = handleCheckout;

  const handleAuthClose = () => {
    resumeCheckoutRef.current = false;
    setIsAuthModalOpen(false);
  };
  const handleAuthSuccess = async (authedCustomer) => {
    setIsAuthModalOpen(false);
    let resolved = hasCustomerDetails(authedCustomer) ? authedCustomer : resolveCustomer(customerState, customerData);
    resolved = await enrichCustomer(resolved);
    if (!hasCustomerDetails(resolved)) resolved = readCustomerFromStorage();
    if (hasCustomerDetails(resolved)) applyCustomerToForm(resolved);
    const resume = resumeCheckoutRef.current;
    resumeCheckoutRef.current = false;
    if (resume && hasCustomerDetails(resolved)) {
      setTimeout(() => handleCheckoutRef.current?.(resolved), 0);
    }
  };

  
  const handlePayNow = async () => {
    if (!isValidMsisdn(momoNumber)) {
      message.error("Please enter a valid mobile money number");
      return;
    }
    if (!selectedNetwork) {
      message.error("Please select your network provider");
      return;
    }
    if (accountStatus !== "valid") {
      message.error("Please wait for account validation or check your details");
      return;
    }

    const paymentAmount = calculateSubtotal();
    const narration = buildCartNarration(cartItems);
    const sanitizedNumber = sanitizeMsisdn(momoNumber);
    const networkForApi = NETWORK_API_MAP[selectedNetwork];
    const checkoutForPayment = {
      ...pendingCheckoutDetails,
      PaymentMode: "Mobile Money",
      PaymentAccountNumber: sanitizedNumber,
      paymentService: networkForApi,
    };

    try {
      setPayButtonLoading(true);
      setDebitErrorMessage("");
      paymentResolvedRef.current = false;
      autoCheckFiredRef.current = false;
      dispatch(resetTransactionStatus());

      // ValidateCart runs before the debit request, so changed prices stop payment.
      const validated = await validateCurrentCart(buildCartValidationPayload({
        checkoutDetails: checkoutForPayment,
        paymentAccountNumber: sanitizedNumber,
        paymentService: networkForApi,
      }));
      if (!validated) return;

      setPendingCheckoutDetails(checkoutForPayment);
      const checkoutString = safeJsonStringify(checkoutForPayment);
      if (checkoutString) localStorage.setItem("checkoutDetails", checkoutString);
      dispatch(saveCheckoutDetails(checkoutForPayment));
      setPaymentStatus("pending");

      const debitResponse = await dispatch(debitCustomer({
        refNo: currentOrderId,
        msisdn: sanitizedNumber,
        amount: paymentAmount,
        network: networkForApi,
        narration,
      })).unwrap();

      if (isPaymentSuccess(debitResponse)) {
        await handlePaymentSuccessFlow(currentOrderId, checkoutForPayment, pendingAddressDetails);
      } else {
        startPolling(currentOrderId, checkoutForPayment, pendingAddressDetails);
      }
    } catch (error) {
      if (isPriceUpdateValidationError(error)) {
        openPriceUpdateModal(error);
        return;
      }
      if (error?.isAuthError || error?.authExpired) return;
      setDebitErrorMessage(getErrorMessage(error, "Payment request failed. Please try again."));
      setPaymentStatus("failed");
    } finally {
      setPayButtonLoading(false);
    }
  };

  const handleManualConfirm = async () => {
    if (!currentOrderId || paymentResolvedRef.current) return;
    try {
      setManualVerifying(true);
      dispatch(resetTransactionStatus());
      const response = await dispatch(checkTransactionStatus({ refNo: currentOrderId })).unwrap();
      if (isPaymentSuccess(response)) {
        setActionDialog({ open: false, mode: "cancel" });
        await handlePaymentSuccessFlow(currentOrderId, pendingCheckoutDetails, pendingAddressDetails);
      } else {
        setActionDialog({ open: true, mode: "not_confirmed" });
      }
    } catch {
      setActionDialog({ open: true, mode: "not_confirmed" });
    } finally {
      setManualVerifying(false);
    }
  };

  const performCancelOrder = () => {
    clearAllTimers();
    paymentResolvedRef.current = false;
    autoCheckFiredRef.current = false;
    setActionDialog({ open: false, mode: "cancel" });
    setIsApprovalGuideVisible(false);
    setIsPaymentModalVisible(false);
    setPaymentStatus("idle");
    setDebitErrorMessage("");
    dispatch(resetPaymentState());
    try {
      localStorage.removeItem("checkoutDetails");
      localStorage.removeItem("orderAddressDetails");
      localStorage.removeItem("checkoutDifferentRecipient");
    } catch {
      // Best effort.
    }
    navigate("/order-cancelled");
  };
  const handleDialogRetry = () => {
    setActionDialog({ open: false, mode: "cancel" });
    if (actionDialog.mode === "not_confirmed") handleManualConfirm();
  };
  const resetToPaymentInput = () => {
    clearAllTimers();
    paymentResolvedRef.current = false;
    autoCheckFiredRef.current = false;
    dispatch(resetPaymentState());
    setPaymentStatus("input");
    setDebitErrorMessage("");
    setMomoNumber("233");
    setSelectedNetwork(null);
    setIsApprovalGuideVisible(false);
    setIsServiceUnavailable(false);
    setTimeoutCountdown(60);
    setAutoCheckCountdown(0);
  };

  const handleClosePaymentModal = useCallback(() => {
    if (paymentStatus === "input" || paymentStatus === "failed") {
      clearAllTimers();
      dispatch(resetPaymentState());
      paymentResolvedRef.current = false;
      autoCheckFiredRef.current = false;
      setIsPaymentModalVisible(false);
      setPaymentStatus("idle");
      setDebitErrorMessage("");
    }
  }, [paymentStatus, clearAllTimers, dispatch]);

  const renderImage = (imagePath) => {
    if (!imagePath) return <div className="co-item-img-placeholder">No Image</div>;
    const imageUrl = `https://testing.frankotrading.com/Media/Products_Images/${String(imagePath).split("\\").pop()}`;
    return <img src={imageUrl} alt="Product" className="co-item-img" onError={(event) => {
      event.currentTarget.style.display = "none";
      if (event.currentTarget.nextSibling) event.currentTarget.nextSibling.style.display = "flex";
    }} />;
  };

  const renderAccountValidationStatus = () => {
    if (accountStatus === "idle") return null;
    if (accountStatus === "service_unavailable") {
      return <div className="pm-account-status pm-account-invalid"><ExclamationTriangleIcon className="pm-account-icon" /><div style={{ flex: 1 }}><strong>Service Busy (503)</strong><div style={{ fontSize: 11, marginTop: 2 }}>Unable to validate. Please try again.</div><button onClick={handleRetryValidation} disabled={retryValidationLoading} className="co-btn-secondary" style={{ marginTop: 6 }}>{retryValidationLoading ? "Retrying…" : "Retry"}</button></div></div>;
    }
    if (accountStatus === "checking") return <div className="pm-account-status pm-account-checking"><div className="co-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Validating account…</div>;
    if (accountStatus === "valid") return <div className="pm-account-status pm-account-valid"><CheckCircleSolid className="pm-account-icon" /><div><strong>Account Valid</strong>{accountHolderName && <div style={{ fontSize: 11 }}>{accountHolderName}</div>}</div></div>;
    return <div className="pm-account-status pm-account-invalid"><XCircleSolid className="pm-account-icon" /><div><strong>Invalid Details</strong><div style={{ fontSize: 11 }}>{accountValidationMessage || "Please check your number and network."}</div></div></div>;
  };

  const renderNumberValidation = () => {
    const status = getMsisdnValidationStatus(momoNumber);
    if (status.type === "warning") return <span className="pm-validation pm-validation-warning"><ExclamationTriangleIcon style={{ width: 12, height: 12 }} /> {status.message}</span>;
    if (status.type === "error") return <span className="pm-validation pm-validation-error"><XCircleIcon style={{ width: 12, height: 12 }} /> {status.message}</span>;
    if (status.type === "success" && !selectedNetwork) return <span className="pm-validation pm-validation-ok"><CheckCircleIcon style={{ width: 12, height: 12 }} /> Select your network below</span>;
    return null;
  };

  const formatAutoCheckTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const canProceedWithPayment = () => isValidMsisdn(momoNumber) && selectedNetwork && accountStatus === "valid";
  const placeOrderLabel = customerReady ? "Place Order" : "Register & Place Order";

  if (!cartItems.length) {
    return (
      <>
        <style>{checkoutStyles}</style>
        <div className="co-root"><div className="co-container"><div className="co-empty"><div className="co-empty-icon"><ShoppingBagIcon style={{ width: 36, height: 36, color: "var(--co-light)" }} /></div><div className="co-empty-title">Your cart is empty</div><div className="co-empty-desc">Add items to your cart to proceed with checkout.</div><button onClick={() => navigate("/")} className="co-btn-primary" style={{ maxWidth: 280 }}>Continue Shopping</button></div></div></div>
        <CheckoutFailedDialog open={checkoutFailedModal.open} displayMessage={checkoutFailedModal.displayMessage} countdown={checkoutFailedModal.countdown} onGoHome={closePriceUpdateModal} />
      </>
    );
  }

  return (
    <>
      <style>{checkoutStyles}</style>
      <div className="co-root">
        {loading && <div className="co-loading-overlay"><div className="co-loading-card"><div className="co-spinner" role="status" aria-label="Loading" />{loadingText ? <div className="co-loading-text">{loadingText}</div> : null}</div></div>}
        <div className="co-container">
          <div className="co-page-header"><div className="co-page-header-accent" /><div><h1 className="co-page-title">Checkout</h1><p className="co-page-count">{cartItems.length} item{cartItems.length === 1 ? "" : "s"} in cart</p></div><div className="co-page-header-line" /></div>
          <div className="co-layout">
            <div className="co-sidebar"><div className="co-card"><div className="co-card-header"><h3 className="co-card-title">Billing Information</h3><div className="co-section-accent"><div className="co-section-accent-bar" /><div className="co-section-accent-line" /></div></div><div className="co-card-body">
              {!customerReady && <div className="co-auth-banner"><div className="co-auth-banner-icon"><LockClosedIcon style={{ width: 18, height: 18, color: "#14532d" }} /></div><div className="co-auth-banner-copy"><p className="co-auth-banner-title">Register to place this order</p><p className="co-auth-banner-desc">No customer account is signed in. You’ll be asked to register or sign in before the order can be placed.</p><button type="button" className="co-auth-banner-btn" onClick={() => openAuthForCheckout(false)}>Register now</button></div></div>}
              <div className="co-toggle-wrap" onClick={() => setIsDifferentRecipient((value) => !value)}><div className="co-toggle-left"><UserIcon style={{ width: 16, height: 16, color: "var(--co-light)" }} /><span>Different recipient?</span></div><div className={`co-toggle-track ${isDifferentRecipient ? "co-toggle-track-on" : "co-toggle-track-off"}`}><div className={`co-toggle-knob ${isDifferentRecipient ? "co-toggle-knob-on" : ""}`} /></div></div>
              {isDifferentRecipient && <div className="co-warning-banner"><ExclamationTriangleIcon style={{ width: 16, height: 16, color: "#d97706", flexShrink: 0 }} /><p>Enter the recipient's name and contact number below.</p></div>}
              <CheckoutForm customerName={customerName} setCustomerName={setCustomerName} customerNumber={customerNumber} setCustomerNumber={setCustomerNumber} deliveryInfo={deliveryInfo} setDeliveryInfo={setDeliveryInfo} orderNote={orderNote} setOrderNote={setOrderNote} locations={locations} customerAccountType={customerAccountType} firstName={sessionCustomer?.firstName || "Guest"} isDifferentRecipient={isDifferentRecipient} readOnlyRecipient={!isDifferentRecipient} />
            </div></div></div>
            <div className="co-main"><div className="co-card"><div className="co-card-header"><h3 className="co-card-title">Order Summary</h3><div className="co-section-accent"><div className="co-section-accent-bar" /><div className="co-section-accent-line" /></div></div><div className="co-card-body">
              <div className="co-items-list">{cartItems.map((item, index) => { const unitPrice = getItemUnitPrice(item); const quantity = getItemQuantity(item); return <div key={item.productId || item.id || index} className="co-item"><div className="co-item-left"><div style={{ position: "relative" }}>{renderImage(item.imagePath)}<div className="co-item-img-placeholder" style={{ display: "none" }}>No Image</div></div><div className="co-item-info"><p className="co-item-name">{item.productName || item.ProductName || "Product"}</p><p className="co-item-unit">Unit: {formatGHS(unitPrice)}</p><span className="co-item-qty">Qty {quantity}</span></div></div><span className="co-item-price">{formatGHS(unitPrice * quantity)}</span></div>; })}</div>
              <div className="co-totals"><div className="co-total-row"><span className="co-total-row-label">Subtotal</span><span className="co-total-row-value">{formatGHS(calculateSubtotal())}</span></div><div className="co-total-row"><span className="co-total-row-label">Shipping Fee</span>{isFreeDelivery ? <span className="co-total-row-free">FREE DELIVERY</span> : isNADelivery ? <span className="co-total-row-warning">{isAgent ? "Agent delivery" : "Delivery charges apply"}</span> : deliveryFee > 0 ? <span className="co-total-row-value">{formatGHS(deliveryFee)}</span> : <span className="co-total-row-warning">Select location</span>}</div>{paymentMethod === "Mobile Money" && <div className="co-service-charge"><span>{getServiceChargeLabel()}</span><span>{formatGHS(calculateServiceCharge())}</span></div>}<div className="co-grand-total"><span className="co-grand-total-label">Total Amount</span><span className="co-grand-total-value">{paymentMethod === "Mobile Money" ? formatGHS(calculateDisplayTotalWithCharge()) : formatGHS(calculateTotalAmount())}</span></div>{paymentMethod === "Mobile Money" && <p className="co-charge-note">* Service charge is applied by your mobile money provider.</p>}</div>
              <Divider style={{ margin: "20px 0" }} />
              <div className="co-payment-section"><p className="co-payment-title">Payment Method</p><Radio.Group value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} style={{ width: "100%" }}><div className="co-payment-options">{(isAgent || isFreeDelivery || (deliveryFee > 0 && !isNADelivery)) && <label className={`co-payment-option ${paymentMethod === "Cash on Delivery" ? "co-payment-option-active" : ""}`}><Radio value="Cash on Delivery" /><span className="co-payment-option-text">Cash on Delivery</span></label>}{!isAgent && <label className={`co-payment-option ${paymentMethod === "Mobile Money" ? "co-payment-option-active" : ""}`}><Radio value="Mobile Money" /><span className="co-payment-option-text">Mobile Money</span></label>}{isAgent && <><label className={`co-payment-option ${paymentMethod === "Pick Up" ? "co-payment-option-active" : ""}`}><Radio value="Pick Up" /><span className="co-payment-option-text">Pick Up</span></label><label className={`co-payment-option ${paymentMethod === "Paid Already" ? "co-payment-option-active" : ""}`}><Radio value="Paid Already" /><span className="co-payment-option-text">Paid Already</span></label></>}</div></Radio.Group></div>
              <div className="co-desktop-btn"><button onClick={() => handleCheckout()} disabled={loading} className="co-btn-primary">{loading ? <><div className="co-spinner" style={{ width: 20, height: 20, borderWidth: 3 }} /> {loadingText}</> : <><ShoppingBagIcon style={{ width: 20, height: 20 }} /> {placeOrderLabel}</>}</button></div>
            </div></div></div>
          </div>
        </div>
        <div className="co-sticky-bottom"><button onClick={() => handleCheckout()} disabled={loading} className="co-btn-primary">{loading ? <><div className="co-spinner" style={{ width: 20, height: 20, borderWidth: 3 }} /> {loadingText}</> : <><ShoppingBagIcon style={{ width: 20, height: 20 }} /> {placeOrderLabel}</>}</button></div>

        <Modal open={isGuestWarningVisible} onCancel={() => setIsGuestWarningVisible(false)} centered footer={null} width={400} className="co-modal"><div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "16px 0", gap: 16 }}><div className="co-dialog-icon co-dialog-icon-warning"><ExclamationTriangleIcon style={{ width: 28, height: 28, color: "#f59e0b" }} /></div><div><div className="co-dialog-title">Real name required</div><div className="co-dialog-desc">Please enter your actual full name before placing an order.</div></div><button onClick={() => setIsGuestWarningVisible(false)} className="co-btn-primary" style={{ maxWidth: 280 }}>OK, I'll update my name</button></div></Modal>

        <Modal title={<div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--co-red)", fontWeight: 800 }}><ExclamationTriangleIcon style={{ width: 18, height: 18 }} /> Complete Required Fields</div>} open={isValidationModalVisible} onCancel={() => setIsValidationModalVisible(false)} centered className="co-modal" footer={[<button key="ok" onClick={() => setIsValidationModalVisible(false)} className="co-btn-primary" style={{ maxWidth: 140, margin: "0 auto" }}>Got It</button>]}><div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}><p style={{ fontSize: 13, color: "var(--co-light)" }}>Please fill in the following:</p>{validateRequiredFields().map((error) => { const icons = { name: UserIcon, phone: PhoneIcon, address: MapPinIcon, payment: CreditCardIcon }; const labels = { name: "Recipient Name", phone: "Contact Number", address: "Delivery Address", payment: "Payment Method" }; const Icon = icons[error.field] || ExclamationTriangleIcon; return <div key={error.field} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--co-radius)" }}><Icon style={{ width: 16, height: 16, color: "#ef4444" }} /><span style={{ fontSize: 13, fontWeight: 700, color: "#991b1b" }}>{labels[error.field]}</span></div>; })}</div></Modal>

        {!isAgent && <Modal open={isPaymentModalVisible} onCancel={handleClosePaymentModal} footer={null} closable={paymentStatus === "input" || paymentStatus === "failed"} maskClosable={paymentStatus === "input" || paymentStatus === "failed"} centered width={440} styles={{ body: { padding: 0 }, content: { borderRadius: 16, overflow: "hidden" } }} className="co-modal"><div className="pm-modal-wrap"><div className="pm-header-compact"><div className="pm-header-left"><img src={frankoLogo} alt="Franko" className="pm-logo-small" /><div><p className="pm-company-small">Franko Trading</p><p className="pm-ref-small">{currentOrderId}</p></div></div><div className="pm-header-right"><p className="pm-amount-label-small">Pay</p><p className="pm-amount-value-small">{formatGHS(calculateDisplayTotalWithCharge())}</p></div></div><div className="pm-body">
          {paymentStatus === "input" && <><div className="pm-field"><div className="pm-field-header"><span className="pm-field-step-num">1</span><span className="pm-field-label">Mobile Money Number</span></div><div className="pm-field-body"><Input placeholder="233XXXXXXXXX" value={momoNumber} onChange={(event) => { let value = event.target.value.replace(/[^0-9]/g, ""); if (value.startsWith("0")) value = `233${value.slice(1)}`; if (!value.startsWith("233")) value = "233"; setMomoNumber(value.slice(0, 13)); setIsServiceUnavailable(false); }} prefix={<PhoneIcon style={{ width: 16, height: 16, color: "#888" }} />} size="large" maxLength={13} style={{ fontSize: 16, fontWeight: 700, borderRadius: 8 }} /><div className="pm-validation">{renderNumberValidation()}</div></div></div>
          <div className="pm-field"><div className="pm-field-header"><span className="pm-field-step-num">2</span><span className="pm-field-label">Network Provider</span></div><div className="pm-field-body"><Radio.Group value={selectedNetwork} onChange={(event) => { setSelectedNetwork(event.target.value); setIsServiceUnavailable(false); }} style={{ width: "100%" }}><div className="pm-networks">{[{ value: "mtn", logo: mtnLogo, name: "MTN MoMo", sub: "*170#", bg: "#fffbeb", border: "#fbbf24", color: "#d97706" }, { value: "vodafone", logo: vodafoneLogo, name: "Vodafone Cash", sub: "*110#", bg: "#fff1f2", border: "#fda4af", color: "#e11d48" }, { value: "airteltigo", logo: airteltigoLogo, name: "AirtelTigo", sub: "*110#", bg: "#eff6ff", border: "#93c5fd", color: "#2563eb" }].map((network) => <label key={network.value} className="pm-network-tile" style={selectedNetwork === network.value ? { background: network.bg, borderColor: network.border } : {}}><Radio value={network.value} style={{ display: "none" }} /><img src={network.logo} alt={network.name} className="pm-network-logo" /><div className="pm-network-info"><p className="pm-network-name">{network.name}</p><p className="pm-network-sub">{network.sub}</p></div>{selectedNetwork === network.value && <CheckCircleSolid style={{ width: 22, height: 22, color: network.color }} />}</label>)}</div></Radio.Group></div></div>
          {renderAccountValidationStatus()}<button onClick={handlePayNow} disabled={!canProceedWithPayment() || payButtonLoading} className="pm-pay-btn">{payButtonLoading ? <div className="co-spinner" role="status" aria-label="Loading" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: "#fff", borderColor: "#ffffff55" }} /> : <><LockClosedIcon style={{ width: 16, height: 16 }} /> Pay {formatGHS(calculateDisplayTotalWithCharge())}</>}</button><div className="pm-security"><ShieldCheckIcon style={{ width: 12, height: 12 }} /> Secured by GhIPSS</div><div className="pm-info-box"><p className="pm-info-title"><CheckCircleIcon style={{ width: 12, height: 12 }} /> What happens next?</p><ol className="pm-info-list"><li>We validate current product prices before payment</li><li>You'll receive a payment prompt on your phone</li><li>Approve the request and we confirm it automatically</li></ol></div></>}
          {paymentStatus === "pending" && <div className="pm-pending-wrap"><div className="pm-pending-anim"><div className="pm-pending-ring-outer" /><div className="pm-pending-ring-spin" /><div className="pm-pending-ring-inner"><PhoneIcon style={{ width: 26, height: 26, color: "var(--co-green-600)" }} /></div></div><div style={{ textAlign: "center" }}><p className="pm-pending-title">Awaiting Approval</p><p className="pm-pending-desc">Check your phone for the payment prompt</p></div><div className="pm-pending-details"><div className="pm-pending-row"><span className="pm-pending-row-label">Number</span><span className="pm-pending-row-value">{sanitizeMsisdn(momoNumber)}</span></div><div className="pm-pending-row"><span className="pm-pending-row-label">Network</span><span className="pm-pending-row-value">{NETWORK_API_MAP[selectedNetwork]}</span></div><div className="pm-pending-row"><span className="pm-pending-row-label">Amount</span><span className="pm-pending-row-amount">{formatGHS(calculateDisplayTotalWithCharge())}</span></div></div><div className="co-failed-countdown" style={{ width: "100%" }}>Checking payment… {timeoutCountdown}s</div></div>}
          {paymentStatus === "success" && <div style={{ textAlign: "center", padding: "24px 8px" }}><div className="co-dialog-icon" style={{ background: "#dcfce7", border: "2px solid #86efac" }}><CheckCircleSolid style={{ width: 40, height: 40, color: "#16a34a" }} /></div><p className="co-dialog-title" style={{ color: "var(--co-green)" }}>Payment Confirmed!</p><p className="co-dialog-desc">Creating your order and redirecting…</p><div className="co-spinner" style={{ width: 22, height: 22, margin: "0 auto" }} /></div>}
          {paymentStatus === "failed" && <div style={{ textAlign: "center", padding: 20 }}><div className="co-dialog-icon co-dialog-icon-cancel"><XCircleSolid style={{ width: 36, height: 36, color: "var(--co-red)" }} /></div><p className="co-dialog-title" style={{ color: "var(--co-red)" }}>Payment Failed</p><p className="co-dialog-desc">{debitErrorMessage || "Unable to initiate payment. Please try again."}</p><button onClick={resetToPaymentInput} className="co-btn-primary">Try Again</button><button onClick={performCancelOrder} className="co-btn-danger" style={{ marginTop: 8 }}>Cancel Order</button></div>}
        </div></div></Modal>}

        <Modal open={isApprovalGuideVisible} onCancel={undefined} footer={null} closable={false} maskClosable={false} centered width={520} styles={{ body: { padding: "16px 20px 100px" } }} className="co-modal">{netCfg && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}><div className="co-guide-header"><div className="co-guide-logo-wrap" style={{ background: netCfg.bg, borderColor: netCfg.border }}><img src={netCfg.logo} alt={netCfg.label} className="co-guide-logo" /></div><div style={{ flex: 1 }}><div className="co-guide-badge" style={{ background: netCfg.bg, borderColor: netCfg.border, color: netCfg.color }}>Payment Pending</div><h3 className="co-guide-title">Approve Your Payment</h3><p className="co-guide-subtitle">Approve the pending request on your phone.</p></div></div><div className="co-guide-info-row" style={{ background: netCfg.bg, borderColor: netCfg.border }}><div><p className="co-guide-info-label">Amount Due</p><p className="co-guide-info-value" style={{ color: netCfg.color, fontSize: 20 }}>{formatGHS(calculateDisplayTotalWithCharge())}</p></div><div style={{ textAlign: "right" }}><p className="co-guide-info-label">Number</p><p className="co-guide-info-value">{sanitizeMsisdn(momoNumber)}</p></div></div><div className="co-guide-ussd-row" style={{ background: netCfg.bg, borderColor: netCfg.border }}><div><p className="co-guide-info-label">Quick Dial</p><p className="co-guide-info-value" style={{ color: netCfg.color, fontSize: 20 }}>{netCfg.ussd}</p></div></div><div className="co-guide-steps-wrap"><div className="co-guide-steps-header"><p className="co-guide-steps-title">Step-by-step approval</p><span>{netCfg.steps.length} steps</span></div><div className="co-guide-steps-body">{netCfg.steps.map((step, index) => <div key={step} className="co-guide-step"><span className="co-guide-step-num" style={{ background: index === netCfg.steps.length - 1 ? netCfg.color : "#059669" }}>{index + 1}</span><p className="co-guide-step-text">{step}</p></div>)}</div></div><div className="co-guide-tip">💡 {netCfg.tip}</div>{autoCheckCountdown > 0 && <div className="co-failed-countdown">Auto-checking in {formatAutoCheckTime(autoCheckCountdown)}</div>}<div className="co-guide-desktop-actions"><button onClick={handleManualConfirm} disabled={manualVerifying} className="co-btn-primary">{manualVerifying ? "Verifying payment…" : "I've Approved — Confirm Payment"}</button><button onClick={() => setActionDialog({ open: true, mode: "cancel" })} disabled={manualVerifying} className="co-btn-danger">Cancel Order</button></div><div className="co-guide-sticky"><button onClick={handleManualConfirm} disabled={manualVerifying} className="co-btn-primary">{manualVerifying ? "Verifying…" : "I've Approved — Confirm"}</button><button onClick={() => setActionDialog({ open: true, mode: "cancel" })} disabled={manualVerifying} className="co-btn-danger">Cancel Order</button></div></div>}</Modal>

        <PaymentActionDialog open={actionDialog.open} mode={actionDialog.mode} verifying={manualVerifying} onRetry={handleDialogRetry} onCancel={performCancelOrder} onClose={() => !manualVerifying && setActionDialog((previous) => ({ ...previous, open: false }))} />
        <CheckoutFailedDialog open={checkoutFailedModal.open} displayMessage={checkoutFailedModal.displayMessage} countdown={checkoutFailedModal.countdown} onGoHome={closePriceUpdateModal} />
        <AuthModal open={isAuthModalOpen} onClose={handleAuthClose} onSuccess={handleAuthSuccess} currentCustomer={sessionCustomer} initialMode="signup" allowGuest={false} autoLoginAfterSignup notice="Create an account or sign in before placing your order." />
      </div>
    </>
  );
};

export default Checkout;
