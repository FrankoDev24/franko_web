// src/pages/TelCheckout.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { message, Modal, Input } from "antd";
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
import CheckoutForm from "../Component/CheckoutForm";
import AuthModal from "../Component/AuthModal";
import locations from "../Component/Locations";

import { clearCart, getCartById } from "../Redux/Slice/cartSlice";
import useCustomer, {
  persistCustomer,
  getCustomerId,
  getCustomerName,
} from "../hooks/useCustomer";

/* The standard cart page for this flow (same component the cart button routes to) */
const TEL_CART_ROUTE = "/tel-cart";

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

/* Telecel White.png is the WHITE version of the logo, so it is only ever placed
   on a coloured (Telecel red) surface — on plain white it would be invisible. */
import telecelWhite from "../assets/Telecel White.png";

/* Shown next to every "Telecel Cash" label (payment tile + network tile).
   Point this at a dedicated "Telecel Cash" lockup when you have one, e.g.
     import telecelCashLogo from "../assets/Telecel Cash.png";
   every usage below picks it up automatically. */
const telecelCashLogo = telecelWhite;

/* ============================================================================
   /tel-checkout — the Speed Shopping checkout.

   Behaviour is modelled on src/pages/Checkout.jsx:
     orderSlice   : validateCart → (payment confirmed) → checkOutOrder +
                    updateOrderDelivery, with saveCheckoutDetails /
                    saveAddressDetails persisted before dispatch
     paymentSlice : validateAccount → debitCustomer → checkTransactionStatus
                    polling, manual confirm, and the same price-change guard

   Differences, all deliberate:
     1. PAYMENT: Mobile Money ONLY. Cash on Delivery / Pick Up / Paid Already
        are never rendered on this page.
     2. Telecel Cash ONLY — numbers must start 020 or 050 (see
        isTelecelCashNumber). No MTN / AirtelTigo tiles.
     3. Order / payment reference ids start with "TEL-".
     4. Cart is the Tel cart (ids starting "Tel"). It is the normal cartSlice
        (clearCart / getCartById) — only the id carries the TEL prefix.
     5. Telecel branding: the white Telecel lockup on the red header, and
        "Telecel Cash" + logo wherever the payment method is displayed.
   ========================================================================== */

/* ------------------------------ config ------------------------------ */

const TEL_ORDER_PREFIX = "TEL";

/**
 * ⚠️ Network code sent to paymentSlice for Telecel Cash.
 * Your map in Checkout.jsx used "VODAFONE" (Telecel Ghana took over Vodafone
 * Ghana). If the payment service still expects the legacy code, change it here
 * and nowhere else.
 */
const TELECEL_NETWORK_CODE = "VODAFONE";
const TELECEL_USSD = "*110#";
const TELECEL_PREFIXES = ["020", "050"];
const TELECEL_LABEL = "Telecel Cash";

const SERVICE_CHARGE_RATE = 0.01;
const SERVICE_CHARGE_CAP = 20;

/**
 * ⚠️ What gets debited.
 *   "subtotal"     → debits the goods value only — IDENTICAL to Checkout.jsx,
 *                    which displays a charge-inclusive total but calls
 *                    debitCustomer({ amount: calculateSubtotal() }).
 *   "order-total"  → debits subtotal + delivery + MoMo service charge, i.e.
 *                    exactly the number shown on screen.
 * Both the modal and the approval guide display whatever this returns, so the
 * customer is never shown one amount and charged another. Confirm which one
 * your finance/reconciliation expects before switching.
 */
const PAYMENT_AMOUNT_MODE = "subtotal";

const INITIAL_DELAY_MS = 10000;
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_DURATION_MS = 60000;
const AUTO_CHECK_DELAY_MS = 120000;
const CHECKOUT_FAIL_REDIRECT_SECONDS = 5;

const TEL_SUCCESS_ROUTE = (orderId) => `/order-success/${orderId}`;
const TEL_CANCELLED_ROUTE = "/order-cancelled";

/* ------------------------------ helpers ------------------------------ */

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
  if (!items?.length) return "Speed Shopping Purchase";
  const narration = items
    .map((item) => {
      const name = String(item.productName || item.ProductName || "Item").trim();
      const quantity = getItemQuantity(item);
      return quantity > 1 ? `${name} (x${quantity})` : name;
    })
    .join(", ");
  return narration.length > maxLen ? `${narration.substring(0, maxLen - 3)}...` : narration;
};

/** TEL-<short time>-<random> — every Speed Shopping order id starts with TEL-. */
const generateTelOrderId = () =>
  `${TEL_ORDER_PREFIX}-${Date.now() % 100000}-${Math.floor(Math.random() * 9000) + 1000}`;

/* ---- Telecel Cash number handling (local 0XXXXXXXXX in, 233… out) ---- */

const normalizeTelecelInput = (raw) => {
  let value = String(raw || "").replace(/\D/g, "");
  if (value.startsWith("233")) value = `0${value.slice(3)}`;
  return value.replace(/^00*/, "0").slice(0, 10);
};

const isTelecelCashNumber = (value) =>
  /^0(20|50)\d{7}$/.test(String(value || ""));

const toMsisdn = (localNumber) =>
  isTelecelCashNumber(localNumber) ? `233${localNumber.slice(1)}` : "";

const getTelecelValidationStatus = (value) => {
  const number = String(value || "");
  if (!number) {
    return { type: "info", message: `Enter your ${TELECEL_LABEL} number` };
  }
  if (number.length >= 3 && !TELECEL_PREFIXES.some((p) => number.startsWith(p))) {
    return {
      type: "error",
      message: `Only ${TELECEL_LABEL} is accepted here `,
    };
  }
  if (number.length < 10) {
    const remaining = 10 - number.length;
    return {
      type: "warning",
      message: `Enter ${remaining} more digit${remaining === 1 ? "" : "s"}`,
    };
  }
  return isTelecelCashNumber(number)
    ? { type: "success", message: null }
    : { type: "error", message: `Invalid ${TELECEL_LABEL} number` };
};

/* ---- ValidateAccount response handling ----
   The gateway answers HTTP 200 even when the lookup itself failed, so the BODY
   decides — never the status code. These helpers dig the code / account name /
   message out of whatever envelope it arrives in ({data:…}, {payload:…}, arrays,
   JSON-string bodies) and tolerate the field-name casing. */

/** Codes that mean "the lookup worked". Add "0" / "00" here if your PSP uses them. */
const ACCOUNT_VALID_CODES = ["01"];
const VALIDATION_CODE_KEYS = ["responseCode", "ResponseCode", "responsecode", "Response_Code", "code", "Code", "statusCode", "StatusCode"];
const VALIDATION_NAME_KEYS = ["name", "Name", "accountName", "AccountName", "accountHolderName", "AccountHolderName", "registeredName", "customerName", "CustomerName"];
const VALIDATION_MESSAGE_KEYS = ["responseMessage", "ResponseMessage", "responsemessage", "message", "Message", "description", "Description", "statusMessage", "error"];

const pickFirstField = (source, keys) => {
  if (!source || typeof source !== "object") return undefined;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return undefined;
};

/** Walks into nested / stringified envelopes until something carries a code. */
const unwrapValidationResponse = (raw) => {
  let value = raw;
  for (let depth = 0; depth < 6; depth += 1) {
    if (typeof value === "string") {
      const parsed = parseResponseValue(value);
      if (parsed === value) break;
      value = parsed;
      continue;
    }
    if (Array.isArray(value)) {
      if (!value.length) break;
      value = value[0];
      continue;
    }
    if (!value || typeof value !== "object") break;
    if (pickFirstField(value, VALIDATION_CODE_KEYS) !== undefined) break;
    const nested = ["payload", "Payload", "data", "Data", "response", "Response", "result", "Result", "body", "Body"]
      .map((key) => value[key])
      .find((entry) => entry !== undefined && entry !== null);
    if (nested === undefined) break;
    value = nested;
  }
  return value;
};

const normalizeAccountValidation = (raw) => {
  const unwrapped = unwrapValidationResponse(raw);
  if (typeof unwrapped === "string") {
    return { raw, code: "", name: null, message: unwrapped.trim() };
  }
  return {
    raw,
    code: String(pickFirstField(unwrapped, VALIDATION_CODE_KEYS) ?? "").trim(),
    name: pickFirstField(unwrapped, VALIDATION_NAME_KEYS) ?? null,
    message: String(pickFirstField(unwrapped, VALIDATION_MESSAGE_KEYS) ?? "").trim(),
  };
};

/** `normalized` is optional — pass it when you already have it. */
const isAccountValid = (response, normalized) => {
  if (normalized) return ACCOUNT_VALID_CODES.includes(normalized.code);
  return ACCOUNT_VALID_CODES.includes(normalizeAccountValidation(response).code);
};

/* ---- price-update detection, copied from Checkout.jsx ---- */

/* paymentSlice's success shape — same predicate as Checkout.jsx */
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

const isPriceUpdateValidationError = (error) => {
  const payload = error?.payload ?? error;
  return payload?.isCartValidationFailure === true && payload?.isPriceUpdate === true;
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
    parsed.flag ?? parsed.Flag ?? parsed.response?.flag ?? parsed.data?.flag ?? ""
  )
    .trim()
    .toLowerCase();
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

/* ---- hand-off read (sidebar / tel-cart page → this page) ---- */

const readHandoff = () => {
  try {
    const raw = localStorage.getItem("telCheckoutCart");
    if (!raw) return null;
    const parsed = safeJsonParse(raw, null);
    return parsed && Array.isArray(parsed.items) ? parsed : null;
  } catch {
    return null;
  }
};

const resolveHandoffItems = () => {
  const stored = readHandoff();
  return stored?.items || [];
};

/* ------------------------------ dialogs ------------------------------ */

const PaymentActionDialog = ({ open, mode, verifying, onRetry, onCancel, onClose }) => {
  if (!open) return null;
  const isCancel = mode === "cancel";
  return (
    <div className="telco-dialog-overlay">
      <div className="telco-dialog-backdrop" onClick={() => !verifying && onClose()} />
      <div className="telco-dialog-card">
        <div className={`telco-dialog-bar ${isCancel ? "telco-dialog-bar-cancel" : "telco-dialog-bar-warning"}`} />
        <div className="telco-dialog-body">
          <div className={`telco-dialog-icon ${isCancel ? "telco-dialog-icon-cancel" : "telco-dialog-icon-warning"}`}>
            {isCancel ? (
              <XCircleSolid style={{ width: 32, height: 32, color: "#ef4444" }} />
            ) : (
              <ExclamationTriangleIcon style={{ width: 32, height: 32, color: "#f59e0b" }} />
            )}
          </div>
          <div className="telco-dialog-title">
            {isCancel ? "Cancel this order?" : "Payment not confirmed yet"}
          </div>
          <div className="telco-dialog-desc">
            {isCancel
              ? "Are you sure you want to cancel the order?"
              : "Approve the Telecel Cash request on your phone, then check again."}
          </div>
          <div className="telco-dialog-actions">
            <button onClick={onRetry} disabled={verifying} className="telco-btn telco-btn-primary">
              {verifying ? (
                "Verifying…"
              ) : (
                <>
                  <ArrowUturnLeftIcon style={{ width: 16, height: 16 }} /> I've Approved — Try Again
                </>
              )}
            </button>
            <button onClick={onCancel} disabled={verifying} className="telco-btn telco-btn-danger">
              <XCircleIcon style={{ width: 16, height: 16 }} /> Yes, Cancel Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckoutFailedDialog = ({ open, displayMessage, countdown, onGoHome }) => {
  if (!open) return null;
  return (
    <div className="telco-dialog-overlay" style={{ zIndex: 10003 }}>
      <div className="telco-dialog-backdrop" />
      <div className="telco-dialog-card" style={{ maxWidth: 440 }}>
        <div className="telco-failed-bar" style={{ height: 4 }} />
        <div className="telco-dialog-body" style={{ textAlign: "center" }}>
          <div className="telco-dialog-icon telco-dialog-icon-warning">
            <ArrowPathIcon style={{ width: 32, height: 32, color: "#d97706" }} />
          </div>
          <div className="telco-dialog-title">Price Update Detected</div>
          <div className="telco-dialog-desc" style={{ marginBottom: 12, color: "#1a1a1a", fontWeight: 600 }}>
            {displayMessage || FRIENDLY_PRICE_UPDATE_MSG}
          </div>
          <div className="telco-failed-countdown">
            <ArrowPathIcon style={{ width: 14, height: 14 }} /> Redirecting to home in {countdown}s…
          </div>
          <button onClick={onGoHome} className="telco-btn telco-btn-outline">
            Start shopping
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================== PAGE ============================== */

const TelCheckout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  /* refs (same timer/flag set as Checkout.jsx) */
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

  /* ---- data: the standard cart slice, exactly like Cart.jsx / Checkout.jsx ---- */
  const { cart: reduxCart, cartId: reduxCartId } = useSelector((state) => state.cart);
  const { validating: accountValidating, validateAccountData, error: paymentError } = useSelector(
    (state) => state.payment
  );
  const { customer: sessionCustomer, isLoggedIn } = useCustomer();
  const customerReady = isLoggedIn;

  /* paymentError is read through a ref: it used to sit in the validation
     effect's deps, so one failed lookup re-ran the effect and re-dispatched
     ValidateAccount. Declared here, after the selector that produces it. */
  const paymentErrorRef = useRef(paymentError);
  paymentErrorRef.current = paymentError;

  /* ---- cart id: redux → localStorage, same resolution as Checkout.jsx ---- */
  const getCartId = useCallback(
    () => String(reduxCartId || localStorage.getItem("cartId") || "").trim(),
    [reduxCartId]
  );

  /* ---- cart items: redirect state → "selectedCart" storage → redux cart ---- */
  const [cartItems, setCartItems] = useState(() => {
    const fromState = Array.isArray(location.state?.items) ? location.state.items : null;
    if (fromState?.length) return fromState;
    const stored = resolveHandoffItems();
    if (stored.length) return stored;
    return reduxCart || [];
  });

  useEffect(() => {
    if (cartItems.length === 0 && reduxCart?.length) setCartItems(reduxCart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduxCart?.length]);

  /* Only ask the API when we have nothing to check out — the hand-off wins. */
  useEffect(() => {
    const id = getCartId();
    if (id && cartItems.length === 0) dispatch(getCartById(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, getCartId]);

  /* ---- form state (mirrors Checkout.jsx) ---- */
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Processing your order…");
  const [orderNote, setOrderNote] = useState(() => readStoredObject("checkoutDetails").orderNote || "");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryInfo, setDeliveryInfo] = useState(() => {
    const savedAddress = readStoredObject("orderAddressDetails");
    return { address: savedAddress.address || "", fee: 0, feeDisplay: "" };
  });
  const [isDifferentRecipient, setIsDifferentRecipient] = useState(() => {
    try {
      return localStorage.getItem("checkoutDifferentRecipient") === "true";
    } catch {
      return false;
    }
  });
  const [customerName, setCustomerName] = useState(
    () => readStoredObject("checkoutDetails").recipientName || ""
  );
  const [customerNumber, setCustomerNumber] = useState(
    () => readStoredObject("checkoutDetails").recipientContactNumber || ""
  );

  /* ---- auth ---- */
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  /* ---- payment ---- */
  const [paymentStatus, setPaymentStatus] = useState("idle"); // idle|input|pending|success|failed|awaiting_manual
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
  const [telecelNumber, setTelecelNumber] = useState("");
  const [isValidationDebouncing, setIsValidationDebouncing] = useState(false);
  const [isServiceUnavailable, setIsServiceUnavailable] = useState(false);
  const [retryValidationLoading, setRetryValidationLoading] = useState(false);
  const [actionDialog, setActionDialog] = useState({ open: false, mode: "cancel" });
  const [isValidationModalVisible, setIsValidationModalVisible] = useState(false);
  const [checkoutFailedModal, setCheckoutFailedModal] = useState({
    open: false,
    displayMessage: "",
    rawMessage: "",
    countdown: CHECKOUT_FAIL_REDIRECT_SECONDS,
  });

  /* Shown in the header; also the id posted to the order/payment APIs. */
  // Always "Tel-…": cartSlice mints the id and re-mints any legacy uuid.
  const activeCartId = getCartId();

  const customerAccountType = sessionCustomer?.accountType;
  const isAgent = String(customerAccountType || "").toLowerCase() === "agent";
  const isFreeDelivery =
    deliveryInfo?.fee === 0 &&
    String(deliveryInfo?.feeDisplay || "").toLowerCase().includes("free");
  const isNADelivery =
    deliveryInfo?.fee === 0 &&
    (!deliveryInfo?.feeDisplay ||
      ["N/A", ""].includes(deliveryInfo.feeDisplay) ||
      String(deliveryInfo.feeDisplay).toLowerCase() === "n/a");
  const selectedAddress = deliveryInfo?.address || "";

  /* ------------------------------ totals ------------------------------ */

  const calculateSubtotal = useCallback(
    () => cartItems.reduce((sum, item) => sum + getItemLineTotal(item), 0),
    [cartItems]
  );
  const calculateTotalAmount = useCallback(
    () => calculateSubtotal() + deliveryFee,
    [calculateSubtotal, deliveryFee]
  );
  const calculateServiceCharge = useCallback(() => {
    const base = calculateTotalAmount();
    return base > 2000 ? SERVICE_CHARGE_CAP : base * SERVICE_CHARGE_RATE;
  }, [calculateTotalAmount]);
  const calculateDisplayTotalWithCharge = useCallback(
    () => calculateTotalAmount() + calculateServiceCharge(),
    [calculateTotalAmount, calculateServiceCharge]
  );
  const getServiceChargeLabel = () =>
    calculateTotalAmount() > 2000 ? "MoMo Service Charge:" : "MoMo Service Charge (1%):";

  /** The single number shown AND debited (see PAYMENT_AMOUNT_MODE). */
  const getPayableAmount = useCallback(
    () =>
      PAYMENT_AMOUNT_MODE === "order-total"
        ? calculateDisplayTotalWithCharge()
        : calculateSubtotal(),
    [calculateDisplayTotalWithCharge, calculateSubtotal]
  );

  /* ------------------------------ timers ------------------------------ */

  const clearAllTimers = useCallback(() => {
    [pollRef, countdownRef, initialDelayRef, autoCheckRef, autoCountdownRef, validationTimeoutRef].forEach(
      (ref) => {
        if (ref.current) {
          clearTimeout(ref.current);
          clearInterval(ref.current);
        }
        ref.current = null;
      }
    );
  }, []);

  const clearFailedTimers = useCallback(() => {
    if (failedRedirectRef.current) clearTimeout(failedRedirectRef.current);
    if (failedCountdownRef.current) clearInterval(failedCountdownRef.current);
    failedRedirectRef.current = null;
    failedCountdownRef.current = null;
  }, []);

  const clearPaymentTimers = useCallback(() => {
    [pollRef, countdownRef, initialDelayRef, autoCheckRef, autoCountdownRef].forEach((ref) => {
      if (ref.current) {
        clearTimeout(ref.current);
        clearInterval(ref.current);
      }
      ref.current = null;
    });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(
    () => () => {
      clearAllTimers();
      clearFailedTimers();
      dispatch(resetPaymentState());
    },
    [dispatch, clearAllTimers, clearFailedTimers]
  );

  /* Keep recipient fields in sync when a customer signs in (same as Checkout). */
  const previousRecipientModeRef = useRef(isDifferentRecipient);

  useEffect(() => {
    const previous = previousRecipientModeRef.current;
    if (isDifferentRecipient && !previous) {
      // Clear account defaults only when the user switches to a new recipient.
      setCustomerName("");
      setCustomerNumber("");
    } else if (!isDifferentRecipient && previous && sessionCustomer) {
      setCustomerName(getCustomerName(sessionCustomer));
      setCustomerNumber(sessionCustomer.contactNumber || "");
    }
    previousRecipientModeRef.current = isDifferentRecipient;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDifferentRecipient]);

  /* A sign-in that happens while on the page (or on return from AuthModal)
     should pre-fill the billing identity, exactly like Checkout.jsx does. */
  useEffect(() => {
    if (!sessionCustomer || isDifferentRecipient) return;
    setCustomerName((current) => current || getCustomerName(sessionCustomer));
    setCustomerNumber((current) => current || sessionCustomer.contactNumber || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionCustomer]);

  useEffect(() => {
    if (deliveryInfo?.fee !== undefined && !Number.isNaN(Number(deliveryInfo.fee))) {
      setDeliveryFee(Number(deliveryInfo.fee));
    }
  }, [deliveryInfo]);

  /* --------------------- Telecel account validation --------------------- */

  /* The response as the UI understands it: code + holder name + message, dug
     out of whatever shape the API used (see normalizeAccountValidation). */
  const accountValidation = useMemo(
    () => normalizeAccountValidation(validateAccountData),
    [validateAccountData]
  );

  const accountStatus = useMemo(() => {
    if (isServiceUnavailable) return "service_unavailable";
    if (retryValidationLoading || isValidationDebouncing || accountValidating) return "checking";
    if (validateAccountData) return isAccountValid(validateAccountData, accountValidation) ? "valid" : "invalid";
    return "idle";
  }, [isServiceUnavailable, retryValidationLoading, isValidationDebouncing, accountValidating, validateAccountData, accountValidation]);
  const accountHolderName = accountValidation.name;
  const accountValidationCode = accountValidation.code;
  const accountValidationMessage = accountValidation.message || paymentError || "";

  /* Dev-only diagnostic: the raw ValidateAccount body, so an unexplained
     "general failure" (HTTP 200 + a generic message) can be read off the
     console instead of the Network tab. Safe to delete. */
  useEffect(() => {
    if (validateAccountData && import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.info("[TelCheckout] ValidateAccount response:", validateAccountData);
    }
  }, [validateAccountData]);

  const msisdn = toMsisdn(telecelNumber);

  const handleRetryValidation = useCallback(async () => {
    if (!isTelecelCashNumber(telecelNumber)) return;
    setRetryValidationLoading(true);
    setIsServiceUnavailable(false);
    dispatch(resetValidateAccountData());
    try {
      await dispatch(
        validateAccount({ msisdn: toMsisdn(telecelNumber), network: TELECEL_NETWORK_CODE })
      ).unwrap();
    } catch (error) {
      if (String(error).includes("503") || error?.message?.includes("503")) setIsServiceUnavailable(true);
    } finally {
      setRetryValidationLoading(false);
    }
  }, [dispatch, telecelNumber]);

  useEffect(() => {
    if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);

    if (isTelecelCashNumber(telecelNumber)) {
      if (retryValidationLoading) return undefined;
      setIsValidationDebouncing(true);
      if (
        String(paymentErrorRef.current || "").includes("503") ||
        String(paymentErrorRef.current || "").includes("Service Unavailable")
      ) {
        setIsServiceUnavailable(true);
        setIsValidationDebouncing(false);
        return undefined;
      }
      dispatch(resetValidateAccountData());
      validationTimeoutRef.current = setTimeout(() => {
        setIsValidationDebouncing(false);
        dispatch(
          validateAccount({ msisdn: toMsisdn(telecelNumber), network: TELECEL_NETWORK_CODE })
        )
          .unwrap()
          .catch((error) => {
            if (String(error).includes("503") || error?.message?.includes("503")) {
              setIsServiceUnavailable(true);
            }
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
  }, [telecelNumber, dispatch, retryValidationLoading]);

  /* ------------------------------ order core ------------------------------ */

  const clearCartAndStorage = useCallback(() => {
    // cartSlice.clearCart() — same as Checkout.jsx. It also removes the
    // "cart"/"cartId" keys, so the next visit mints a fresh Tel id.
    dispatch(clearCart());
    try {
      localStorage.removeItem("selectedCart");
      localStorage.removeItem("cart");
      localStorage.removeItem("cartId");
    } catch {
      /* best-effort */
    }
  }, [dispatch]);

  const buildCartValidationPayload = useCallback(
    ({ checkoutDetails, paymentAccountNumber, paymentService }) => ({
      cartId: String(checkoutDetails?.Cartid ?? getCartId() ?? ""),
      customerid: String(
        checkoutDetails?.customerId ?? getCustomerId(sessionCustomer) ?? ""
      ),
      orderDate: checkoutDetails?.orderDate ?? new Date().toISOString(),
      paymentMode: "Mobile Money", // COD is never offered on the Tel flow
      paymentService: String(paymentService ?? TELECEL_NETWORK_CODE),
      paymentAccountNumber: String(paymentAccountNumber ?? ""),
      customerAccountType: String(checkoutDetails?.customerAccountType ?? ""),
      items: cartItems.map((item) => ({
        productId: String(
          item.productId ?? item.productID ?? item.ProductId ?? item.ProductID ?? item.id ?? ""
        ),
        price: getItemUnitPrice(item),
        quantity: getItemQuantity(item),
      })),
    }),
    [cartItems, getCartId, sessionCustomer]
  );

  const openPriceUpdateModal = useCallback(
    (error) => {
      clearFailedTimers();
      clearAllTimers();
      paymentResolvedRef.current = true;
      dispatch(resetPaymentState());
      setIsPaymentModalVisible(false);
      setIsApprovalGuideVisible(false);
      setPaymentStatus("idle");

      const rawMessage = getErrorMessage(error, "");
      if (sessionCustomer) persistCustomer(sessionCustomer);

      try {
        // The Tel cart is invalidated by the price change — clear only the cart.
        clearCartAndStorage();
      } catch {
        /* continue showing the modal */
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
        setCheckoutFailedModal({
          open: false,
          displayMessage: "",
          rawMessage: "",
          countdown: CHECKOUT_FAIL_REDIRECT_SECONDS,
        });
        navigate("/");
      }, CHECKOUT_FAIL_REDIRECT_SECONDS * 1000);
    },
    [clearAllTimers, clearFailedTimers, clearCartAndStorage, dispatch, navigate, sessionCustomer]
  );

  const closePriceUpdateModal = useCallback(() => {
    clearFailedTimers();
    if (sessionCustomer) persistCustomer(sessionCustomer);
    clearCartAndStorage();
    setCartItems([]);
    setCheckoutFailedModal({
      open: false,
      displayMessage: "",
      rawMessage: "",
      countdown: CHECKOUT_FAIL_REDIRECT_SECONDS,
    });
    navigate("/");
  }, [clearFailedTimers, clearCartAndStorage, navigate, sessionCustomer]);

  const validateCurrentCart = useCallback(
    async (payload) => {
      try {
        const validationResponse = await dispatch(validateCart(payload)).unwrap();
        // A code-0 / PriceChange response may never continue to payment or posting.
        if (isValidateCartPriceChange(validationResponse)) {
          openPriceUpdateModal(normalizePriceUpdateError(validationResponse));
          return false;
        }
        return true;
      } catch (error) {
        if (isValidateCartPriceChange(error)) {
          openPriceUpdateModal(normalizePriceUpdateError(error));
          return false;
        }
        if (error?.isAuthError || error?.authExpired) return false;
        throw error;
      }
    },
    [dispatch, openPriceUpdateModal]
  );

  const dispatchOrderCheckoutWithRetry = useCallback(
    async (checkoutDetails, maxRetries = 1) => {
      let lastError;
      for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
          // checkOutOrder is order creation only — never used to validate price.
          return await dispatch(
            checkOutOrder({ cartId: getCartId(), ...checkoutDetails })
          ).unwrap();
        } catch (error) {
          if (error?.isAuthError || error?.authExpired) throw error;
          lastError = error;
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
          }
        }
      }
      throw new Error(getErrorMessage(lastError, "Could not create the order. Please try again."));
    },
    [dispatch, getCartId]
  );

  const dispatchOrderAddressWithRetry = useCallback(
    async (addressDetails, maxRetries = 2) => {
      let lastError;
      for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
          return await dispatch(updateOrderDelivery(addressDetails)).unwrap();
        } catch (error) {
          if (error?.isAuthError || error?.authExpired) throw error;
          lastError = error;
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
          }
        }
      }
      throw new Error(getErrorMessage(lastError, "Could not save the delivery details."));
    },
    [dispatch]
  );

  /* Order is created ONLY after Telecel Cash payment is confirmed (same as Checkout). */
  const processMoMoPostPayment = useCallback(
    async (checkoutDetails, addressDetails) => {
      const orderResponse = await dispatchOrderCheckoutWithRetry(checkoutDetails);
      const addressResponse = await dispatchOrderAddressWithRetry(addressDetails);
      return { orderResponse, addressResponse };
    },
    [dispatchOrderCheckoutWithRetry, dispatchOrderAddressWithRetry]
  );

  const handlePaymentSuccessFlow = useCallback(
    async (orderId, checkoutDetails, addressDetails) => {
      if (paymentResolvedRef.current) return;
      paymentResolvedRef.current = true;
      setPaymentStatus("success");
      setIsApprovalGuideVisible(false);
      clearPaymentTimers();
      setLoadingText("Finalizing your order…");
      setLoading(true);

      try {
        await processMoMoPostPayment(checkoutDetails, addressDetails);
        clearCartAndStorage();
        try {
          localStorage.removeItem("checkoutDetails");
          localStorage.removeItem("orderAddressDetails");
          localStorage.removeItem("checkoutDifferentRecipient");
        } catch {
          /* best-effort */
        }
        message.success("Payment confirmed! Your Speed Shopping order has been placed.");
        setTimeout(() => {
          setIsPaymentModalVisible(false);
          setLoading(false);
          navigate(TEL_SUCCESS_ROUTE(orderId));
        }, 1000);
      } catch (error) {
        setLoading(false);
        if (error?.isAuthError || error?.authExpired) return;
        message.error(
          `Payment was confirmed, but order processing needs support. Please quote order ${orderId}.`
        );
        // The money moved — keep it visible rather than pretending nothing happened.
        setTimeout(() => {
          setIsPaymentModalVisible(false);
          navigate(TEL_SUCCESS_ROUTE(orderId));
        }, 1200);
      }
    },
    [clearPaymentTimers, clearCartAndStorage, navigate, processMoMoPostPayment]
  );

  const startPolling = useCallback(
    (orderId, checkoutDetails, addressDetails) => {
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
            /* keep polling until the approval window ends */
          }
          if (count >= maxPolls) {
            clearPaymentTimers();
            setPaymentStatus("awaiting_manual");
            setIsApprovalGuideVisible(true);
          }
        }, POLL_INTERVAL_MS);
      }, INITIAL_DELAY_MS);
    },
    [dispatch, clearPaymentTimers, handlePaymentSuccessFlow]
  );

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
          message.warning(`Approve the ${TELECEL_LABEL} request on your phone, then check again.`);
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
  }, [
    isApprovalGuideVisible,
    currentOrderId,
    dispatch,
    handlePaymentSuccessFlow,
    pendingCheckoutDetails,
    pendingAddressDetails,
  ]);

  /* ------------------------------ validation ------------------------------ */

  const validateRequiredFields = (nameOverride, numberOverride) => {
    const name = (nameOverride ?? customerName) || "";
    const number = (numberOverride ?? customerNumber) || "";
    const errors = [];
    if (!name.trim()) errors.push({ field: "name", message: "Recipient name is required" });
    if (!number.trim()) errors.push({ field: "phone", message: "Recipient contact number is required" });
    if (!selectedAddress.trim()) errors.push({ field: "address", message: "Delivery address is required" });
    // Payment is fixed to Mobile Money (Telecel Cash) — nothing to validate here.
    return errors;
  };

  const getSafeCustomerDetails = (source) => {
    let name = customerName?.trim();
    let number = customerNumber?.trim();
    const accountName = `${source?.firstName || ""} ${source?.lastName || ""}`.trim();
    if ((!name || /^guest\b/i.test(name)) && accountName) name = accountName;
    if (!name && source) name = accountName;
    if (!number && source) number = source.contactNumber || source.ContactNumber || "";
    return { name, number: number || "0000000000" };
  };

  /* ------------------------------ auth ------------------------------ */

  const openAuthForCheckout = useCallback((resume) => {
    resumeCheckoutRef.current = resume;
    setIsAuthModalOpen(true);
  }, []);

  const handleAuthClose = () => {
    resumeCheckoutRef.current = false;
    setIsAuthModalOpen(false);
  };

  const handleAuthSuccess = (authedCustomer) => {
    setIsAuthModalOpen(false);
    const resolved = authedCustomer && typeof authedCustomer === "object" ? authedCustomer : sessionCustomer;
    if (resolved) persistCustomer(resolved);

    const resume = resumeCheckoutRef.current;
    resumeCheckoutRef.current = false;
    if (resume && resolved) {
      setTimeout(() => handleCheckoutRef.current?.(resolved), 0);
    }
  };

  /* ------------------------------ checkout ------------------------------ */

  const handleCheckout = async (customerOverride) => {
    const activeCustomer = customerOverride && typeof customerOverride === "object" ? customerOverride : sessionCustomer;

    if (!activeCustomer) {
      openAuthForCheckout(true);
      return;
    }

    const customerId = getCustomerId(activeCustomer);
    const accountType = activeCustomer.accountType;
    const { name, number } = getSafeCustomerDetails(activeCustomer);

    setCustomerName(name);
    setCustomerNumber(number);
    persistCustomer(activeCustomer);

    const normalizedName = name.toLowerCase().trim();
    if (normalizedName === "guest" || normalizedName === "guest user" || normalizedName.startsWith("guest ")) {
      message.warning("Please enter your real full name before placing an order.");
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

    const orderId = generateTelOrderId(); // TEL-…
    setCurrentOrderId(orderId);

    const orderDate = new Date().toISOString();
    const checkoutDetails = {
      Cartid: getCartId(),
      customerId,
      orderCode: orderId,
      PaymentMode: "Mobile Money", // Mobile Money only — no Cash on Delivery
      PaymentAccountNumber: number,
      customerAccountType: accountType,
      paymentService: TELECEL_NETWORK_CODE,
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

    // Persist before validation/dispatch: a failed validation can clear cart
    // state, but must never clear the customer's checkout details.
    dispatch(saveCheckoutDetails(checkoutDetails));
    dispatch(saveAddressDetails(addressDetails));
    try {
      const checkoutString = safeJsonStringify(checkoutDetails);
      const addressString = safeJsonStringify(addressDetails);
      if (checkoutString) localStorage.setItem("checkoutDetails", checkoutString);
      if (addressString) localStorage.setItem("orderAddressDetails", addressString);
    } catch {
      /* Redux still holds the details */
    }

    setLoading(true);
    try {
      // Validate prices before opening the payment modal (and again at Pay Now).
      setLoadingText("");
      const validated = await validateCurrentCart(
        buildCartValidationPayload({
          checkoutDetails,
          paymentAccountNumber: number,
          paymentService: TELECEL_NETWORK_CODE,
        })
      );
      if (!validated) return;

      setPendingCheckoutDetails(checkoutDetails);
      setPendingAddressDetails(addressDetails);
      dispatch(resetPaymentState());
      paymentResolvedRef.current = false;
      autoCheckFiredRef.current = false;
      setTelecelNumber("");
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

  /* ------------------------------ payment ------------------------------ */

  const handlePayNow = async () => {
    if (!isTelecelCashNumber(telecelNumber)) {
      message.error(`Enter a valid ${TELECEL_LABEL} number (020… or 050…)`);
      return;
    }
    if (accountStatus !== "valid") {
      message.error("Please wait for account validation or check your details");
      return;
    }

    const localNumber = telecelNumber;
    const paymentMsisdn = toMsisdn(localNumber);
    const amount = getPayableAmount();
    const narration = buildCartNarration(cartItems);

    const checkoutForPayment = {
      ...pendingCheckoutDetails,
      PaymentMode: "Mobile Money",
      PaymentAccountNumber: paymentMsisdn,
      paymentService: TELECEL_NETWORK_CODE,
    };

    try {
      setPayButtonLoading(true);
      setDebitErrorMessage("");
      paymentResolvedRef.current = false;
      autoCheckFiredRef.current = false;
      dispatch(resetTransactionStatus());

      // Re-validate immediately before the debit so a price change stops payment.
      const validated = await validateCurrentCart(
        buildCartValidationPayload({
          checkoutDetails: checkoutForPayment,
          paymentAccountNumber: paymentMsisdn,
          paymentService: TELECEL_NETWORK_CODE,
        })
      );
      if (!validated) return;

      setPendingCheckoutDetails(checkoutForPayment);
      const checkoutString = safeJsonStringify(checkoutForPayment);
      if (checkoutString) localStorage.setItem("checkoutDetails", checkoutString);
      dispatch(saveCheckoutDetails(checkoutForPayment));
      setPaymentStatus("pending");

      const debitResponse = await dispatch(
        debitCustomer({
          refNo: currentOrderId, // TEL-…
          msisdn: paymentMsisdn,
          amount,
          network: TELECEL_NETWORK_CODE,
          narration,
        })
      ).unwrap();

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
      /* best effort */
    }
    navigate(TEL_CANCELLED_ROUTE);
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
    // The entered number is kept so a retry doesn't force a re-type.
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

  /* ------------------------------ render bits ------------------------------ */

  const renderImage = (imagePath) => {
    if (!imagePath) return <div className="telco-item-img-placeholder">No Image</div>;
    const imageUrl = `https://testing.frankotrading.com/Media/Products_Images/${String(imagePath)
      .split("\\")
      .pop()}`;
    return (
      <img
        src={imageUrl}
        alt="Product"
        className="telco-item-img"
        onError={(event) => {
          event.currentTarget.style.display = "none";
          if (event.currentTarget.nextSibling) event.currentTarget.nextSibling.style.display = "flex";
        }}
      />
    );
  };

  const renderAccountValidationStatus = () => {
    if (accountStatus === "idle") return null;
    if (accountStatus === "service_unavailable") {
      return (
        <div className="telpm-account-status telpm-account-invalid">
          <ExclamationTriangleIcon className="telpm-account-icon" />
          <div style={{ flex: 1 }}>
            <strong>Service Busy (503)</strong>
            <div style={{ fontSize: 11, marginTop: 2 }}>Unable to validate. Please try again.</div>
            <button
              onClick={handleRetryValidation}
              disabled={retryValidationLoading}
              className="telco-btn telco-btn-outline telco-btn-sm"
              style={{ marginTop: 6 }}
            >
              {retryValidationLoading ? "Retrying…" : "Retry"}
            </button>
          </div>
        </div>
      );
    }
    if (accountStatus === "checking") {
      return (
        <div className="telpm-account-status telpm-account-checking">
          <div className="telco-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
          Validating Telecel Cash account…
        </div>
      );
    }
    if (accountStatus === "valid") {
      return (
        <div className="telpm-account-status telpm-account-valid">
          <CheckCircleSolid className="telpm-account-icon" />
          <div>
            <strong>Telecel Cash account valid</strong>
            {accountHolderName && <div style={{ fontSize: 11 }}>{accountHolderName}</div>}
          </div>
        </div>
      );
    }
    return (
      <div className="telpm-account-status telpm-account-invalid">
        <XCircleSolid className="telpm-account-icon" />
        <div style={{ flex: 1 }}>
          <strong>Account check failed</strong>
          <div style={{ fontSize: 11, marginTop: 2 }}>
            {accountValidationMessage || `Check the number — only ${TELECEL_LABEL} is accepted.`}
          </div>
          {/* Exactly what was sent and what came back. An API that answers 200
              with a rejection body is diagnosable right here, no DevTools. */}
          <div className="telpm-account-debug">
            {accountValidationCode ? (
              <>
                code <strong>{accountValidationCode}</strong> ·{" "}
              </>
            ) : null}
            sent <strong>{msisdn || telecelNumber || "—"}</strong> · network{" "}
            <strong>{TELECEL_NETWORK_CODE}</strong>
          </div>
          <button
            onClick={handleRetryValidation}
            disabled={retryValidationLoading}
            className="telco-btn telco-btn-outline telco-btn-sm"
            style={{ marginTop: 6 }}
          >
            {retryValidationLoading ? "Retrying…" : "Retry"}
          </button>
        </div>
      </div>
    );
  };

  const renderNumberValidation = () => {
    const status = getTelecelValidationStatus(telecelNumber);
    if (status.type === "warning") {
      return (
        <span className="telpm-validation telpm-validation-warning">
          <ExclamationTriangleIcon style={{ width: 12, height: 12 }} /> {status.message}
        </span>
      );
    }
    if (status.type === "error") {
      return (
        <span className="telpm-validation telpm-validation-error">
          <XCircleIcon style={{ width: 12, height: 12 }} /> {status.message}
        </span>
      );
    }
    if (status.type === "info") {
      return <span className="telpm-validation telpm-validation-info">{status.message}</span>;
    }
    return (
      <span className="telpm-validation telpm-validation-ok">
        <CheckCircleIcon style={{ width: 12, height: 12 }} /> {TELECEL_LABEL} number
      </span>
    );
  };

  const formatAutoCheckTime = (seconds) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  const canProceedWithPayment = () => isTelecelCashNumber(telecelNumber) && accountStatus === "valid";
  const placeOrderLabel = customerReady ? "Place Order" : "Register & Place Order";

  /* ------------------------------ empty ------------------------------ */

  if (!cartItems.length) {
    return (
      <>
        <style>{telCheckoutStyles}</style>
        <div className="telco-root">
          <TelHeader />
          <div className="telco-container">
            <div className="telco-empty">
              <div className="telco-empty-icon">
                <ShoppingBagIcon style={{ width: 36, height: 36, color: "var(--telco-light)" }} />
              </div>
              <div className="telco-empty-title">Nothing to check out</div>
              <div className="telco-empty-desc">
                Your Tel cart is empty — add a Speed Shopping deal first.
              </div>
              <button onClick={() => navigate(TEL_CART_ROUTE)} className="telco-btn telco-btn-primary">
                Back to cart
              </button>
            </div>
          </div>
        </div>
        <CheckoutFailedDialog
          open={checkoutFailedModal.open}
          displayMessage={checkoutFailedModal.displayMessage}
          countdown={checkoutFailedModal.countdown}
          onGoHome={closePriceUpdateModal}
        />
      </>
    );
  }

  /* ------------------------------ main ------------------------------ */

  return (
    <>
      <Helmet>
        <title>Speed Shopping Checkout | Franko Trading</title>
      </Helmet>
      <style>{telCheckoutStyles}</style>

      <div className="telco-root">
        {loading && (
          <div className="telco-loading-overlay">
            <div className="telco-loading-card">
              <div className="telco-spinner" role="status" aria-label="Loading" />
              {loadingText ? <div className="telco-loading-text">{loadingText}</div> : null}
            </div>
          </div>
        )}

        <TelHeader />

        <div className="telco-container">
          <div className="telco-page-header">
            <div className="telco-page-accent" />
            <div>
              <h1 className="telco-page-title">Speed Shopping Checkout</h1>
              <p className="telco-page-count">
                {cartItems.length} item{cartItems.length === 1 ? "" : "s"} · order id starts with{" "}
                <strong>{TEL_ORDER_PREFIX}-</strong>
                {activeCartId ? ` · cart ${activeCartId}` : ""}
              </p>
            </div>
          </div>

          <div className="telco-layout">
            {/* ---------------- billing ---------------- */}
            <div className="telco-sidebar">
              <div className="telco-card">
                <div className="telco-card-header">
                  <h3 className="telco-card-title">Billing Information</h3>
                  <div className="telco-section-accent">
                    <div className="telco-section-accent-bar" />
                    <div className="telco-section-accent-line" />
                  </div>
                </div>
                <div className="telco-card-body">
                  {!customerReady && (
                    <div className="telco-auth-banner">
                      <div className="telco-auth-banner-icon">
                        <LockClosedIcon style={{ width: 18, height: 18, color: "#BB1420" }} />
                      </div>
                      <div className="telco-auth-banner-copy">
                        <p className="telco-auth-banner-title">Register to place this order</p>
                        <p className="telco-auth-banner-desc">
                          No customer account is signed in. You'll be asked to register or sign in
                          before the order can be placed.
                        </p>
                        <button
                          type="button"
                          className="telco-auth-banner-btn"
                          onClick={() => openAuthForCheckout(false)}
                        >
                          Register now
                        </button>
                      </div>
                    </div>
                  )}

                  <div
                    className="telco-toggle-wrap"
                    onClick={() => setIsDifferentRecipient((value) => !value)}
                  >
                    <div className="telco-toggle-left">
                      <UserIcon style={{ width: 16, height: 16, color: "var(--telco-light)" }} />
                      <span>Different recipient?</span>
                    </div>
                    <div className={`telco-toggle-track ${isDifferentRecipient ? "on" : "off"}`}>
                      <div className={`telco-toggle-knob ${isDifferentRecipient ? "on" : ""}`} />
                    </div>
                  </div>

                  {isDifferentRecipient && (
                    <div className="telco-warning-banner">
                      <ExclamationTriangleIcon
                        style={{ width: 16, height: 16, color: "#d97706", flexShrink: 0 }}
                      />
                      <p>Enter the recipient's name and contact number below.</p>
                    </div>
                  )}

                  <CheckoutForm
                    customerName={customerName}
                    setCustomerName={setCustomerName}
                    customerNumber={customerNumber}
                    setCustomerNumber={setCustomerNumber}
                    deliveryInfo={deliveryInfo}
                    setDeliveryInfo={setDeliveryInfo}
                    orderNote={orderNote}
                    setOrderNote={setOrderNote}
                    locations={locations}
                    customerAccountType={customerAccountType}
                    firstName={sessionCustomer?.firstName || "Guest"}
                    isDifferentRecipient={isDifferentRecipient}
                    readOnlyRecipient={!isDifferentRecipient}
                  />
                </div>
              </div>
            </div>

            {/* ---------------- summary ---------------- */}
            <div className="telco-main">
              <div className="telco-card">
                <div className="telco-card-header">
                  <h3 className="telco-card-title">Order Summary</h3>
                  <div className="telco-section-accent">
                    <div className="telco-section-accent-bar" />
                    <div className="telco-section-accent-line" />
                  </div>
                </div>
                <div className="telco-card-body">
                  <div className="telco-items-list">
                    {cartItems.map((item, index) => {
                      const unitPrice = getItemUnitPrice(item);
                      const quantity = getItemQuantity(item);
                      return (
                        <div key={item.productId || item.id || index} className="telco-item">
                          <div className="telco-item-left">
                            <div style={{ position: "relative" }}>
                              {renderImage(item.imagePath || item.productImage)}
                              <div className="telco-item-img-placeholder" style={{ display: "none" }}>
                                No Image
                              </div>
                            </div>
                            <div className="telco-item-info">
                              <p className="telco-item-name">
                                {item.productName || item.ProductName || "Product"}
                              </p>
                              <p className="telco-item-unit">Unit: {formatGHS(unitPrice)}</p>
                              <span className="telco-item-qty">Qty {quantity}</span>
                              {item.cartItemId && (
                                <p className="telco-item-lineid">{item.cartItemId}</p>
                              )}
                            </div>
                          </div>
                          <span className="telco-item-price">{formatGHS(unitPrice * quantity)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="telco-totals">
                    <div className="telco-total-row">
                      <span className="telco-total-row-label">Subtotal</span>
                      <span className="telco-total-row-value">{formatGHS(calculateSubtotal())}</span>
                    </div>
                    <div className="telco-total-row">
                      <span className="telco-total-row-label">Shipping Fee</span>
                      {isFreeDelivery ? (
                        <span className="telco-total-row-free">FREE DELIVERY</span>
                      ) : isNADelivery ? (
                        <span className="telco-total-row-warning">
                          {isAgent ? "Agent delivery" : "Delivery charges apply"}
                        </span>
                      ) : deliveryFee > 0 ? (
                        <span className="telco-total-row-value">{formatGHS(deliveryFee)}</span>
                      ) : (
                        <span className="telco-total-row-warning">Select location</span>
                      )}
                    </div>

                    <div className="telco-service-charge">
                      <span>{getServiceChargeLabel()}</span>
                      <span>{formatGHS(calculateServiceCharge())}</span>
                    </div>

                    <div className="telco-grand-total">
                      <span className="telco-grand-total-label">
                        {PAYMENT_AMOUNT_MODE === "order-total" ? "Total to Pay" : "Goods Total"}
                      </span>
                      <span className="telco-grand-total-value">
                        {formatGHS(getPayableAmount())}
                      </span>
                    </div>
                    <p className="telco-charge-note">
                      {PAYMENT_AMOUNT_MODE === "order-total"
                        ? "* Service charge is applied by your mobile money provider."
                        : "* Charged on the goods value. Delivery and provider charges are settled separately."}{" "}
                      Displayed total: {formatGHS(calculateDisplayTotalWithCharge())}
                    </p>
                  </div>

                  {/* ---------------- payment method ----------------
                      Mobile Money ONLY. Cash on Delivery / Pick Up / Paid Already
                      are deliberately never rendered for Speed Shopping. */}
                  <div className="telco-payment-section">
                    <p className="telco-payment-title">Payment Method</p>
                    <div className="telco-payment-option telco-payment-option-active">
                      <span className="telco-payment-logo-chip">
                        <img
                          src={telecelCashLogo}
                          alt={TELECEL_LABEL}
                          className="telco-payment-logo"
                        />
                      </span>
                      <div className="telco-payment-option-text">
                        <strong>{TELECEL_LABEL}</strong>
                        
                      </div>
                      <span className="telco-payment-check">
                        <CheckCircleSolid style={{ width: 18, height: 18 }} />
                      </span>
                    </div>
                    {!isFreeDelivery && !isNADelivery && deliveryFee === 0 && (
                      <p className="telco-payment-hint">
                        Select your delivery location above to continue.
                      </p>
                    )}
                  </div>

                  <div className="telco-desktop-btn">
                    <button
                      onClick={() => handleCheckout()}
                      disabled={loading}
                      className="telco-btn telco-btn-primary telco-btn-block"
                    >
                      {loading ? (
                        <>
                          <div
                            className="telco-spinner"
                            style={{ width: 20, height: 20, borderWidth: 3 }}
                          />{" "}
                          {loadingText}
                        </>
                      ) : (
                        <>
                          <ShoppingBagIcon style={{ width: 20, height: 20 }} /> {placeOrderLabel}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* sticky mobile CTA */}
        <div className="telco-sticky-bottom">
          <div className="telco-sticky-inner">
            <div className="telco-sticky-total">
              <span>Pay with {TELECEL_LABEL}</span>
              <strong>{formatGHS(getPayableAmount())}</strong>
            </div>
            <button
              onClick={() => handleCheckout()}
              disabled={loading}
              className="telco-btn telco-btn-primary"
            >
              {loading ? loadingText : placeOrderLabel}
            </button>
          </div>
        </div>

        {/* ---------------- missing fields ---------------- */}
        <Modal
          title={
            <div className="telco-modal-title">
              <ExclamationTriangleIcon style={{ width: 18, height: 18 }} /> Complete Required Fields
            </div>
          }
          open={isValidationModalVisible}
          onCancel={() => setIsValidationModalVisible(false)}
          centered
          footer={[
            <button
              key="ok"
              onClick={() => setIsValidationModalVisible(false)}
              className="telco-btn telco-btn-primary"
              style={{ maxWidth: 140, margin: "0 auto" }}
            >
              Got It
            </button>,
          ]}
        >
          <div className="telco-missing-list">
            {validateRequiredFields().map((error) => {
              const icons = { name: UserIcon, phone: PhoneIcon, address: MapPinIcon, payment: CreditCardIcon };
              const labels = { name: "Recipient Name", phone: "Contact Number", address: "Delivery Address" };
              const Icon = icons[error.field] || ExclamationTriangleIcon;
              return (
                <div key={error.field} className="telco-missing-row">
                  <Icon style={{ width: 16, height: 16, color: "#ef4444" }} />
                  <span>{labels[error.field]}</span>
                </div>
              );
            })}
          </div>
        </Modal>

        {/* ---------------- Telecel Cash payment modal ---------------- */}
        <Modal
          open={isPaymentModalVisible}
          onCancel={handleClosePaymentModal}
          footer={null}
          closable={paymentStatus === "input" || paymentStatus === "failed"}
          maskClosable={paymentStatus === "input" || paymentStatus === "failed"}
          centered
          width={440}
          styles={{ body: { padding: 0 }, content: { borderRadius: 16, overflow: "hidden" } }}
        >
          <div className="telpm-wrap">
            <div className="telpm-header">
              <div className="telpm-header-left">
                <img src={telecelWhite} alt="Telecel" className="telpm-logo" />
                <div>
                  <p className="telpm-company">{TELECEL_LABEL}</p>
                  <p className="telpm-ref">{currentOrderId}</p>
                </div>
              </div>
              <div className="telpm-header-right">
                <p className="telpm-amount-label">Pay</p>
                <p className="telpm-amount-value">{formatGHS(getPayableAmount())}</p>
              </div>
            </div>

            <div className="telpm-body">
              {paymentStatus === "input" && (
                <>
                  <div className="telpm-field">
                    <div className="telpm-field-header">
                      <span className="telpm-field-step">1</span>
                      <span className="telpm-field-label">{TELECEL_LABEL} Number</span>
                    </div>
                    <div className="telpm-field-body">
                      <Input
                        placeholder="e.g. 0501234567"
                        value={telecelNumber}
                        onChange={(event) => {
                          setTelecelNumber(normalizeTelecelInput(event.target.value));
                          setIsServiceUnavailable(false);
                        }}
                        prefix={<PhoneIcon style={{ width: 16, height: 16, color: "#888" }} />}
                        size="large"
                        maxLength={10}
                        inputMode="numeric"
                        style={{ fontSize: 16, fontWeight: 700, borderRadius: 8 }}
                      />
                      <div className="telpm-validation-wrap">{renderNumberValidation()}</div>
                      {msisdn && (
                        <p className="telpm-msisdn">
                          Will be charged as <strong>{msisdn}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="telpm-field">
                    <div className="telpm-field-header">
                      <span className="telpm-field-step">2</span>
                      <span className="telpm-field-label">Network</span>
                    </div>
                    <div className="telpm-field-body">
                      <div className="telpm-network-tile">
                        <span className="telpm-network-mark">
                          <img
                            src={telecelCashLogo}
                            alt={TELECEL_LABEL}
                            className="telpm-network-logo"
                          />
                        </span>
                        <div className="telpm-network-info">
                          <p className="telpm-network-name">{TELECEL_LABEL}</p>
                          <p className="telpm-network-sub">
                            Approve via {TELECEL_USSD} · other networks are not accepted
                          </p>
                        </div>
                        <CheckCircleSolid style={{ width: 22, height: 22, color: "#BB1420" }} />
                      </div>
                    </div>
                  </div>

                  {renderAccountValidationStatus()}

                  <button
                    onClick={handlePayNow}
                    disabled={!canProceedWithPayment() || payButtonLoading}
                    className="telpm-pay-btn"
                  >
                    {payButtonLoading ? (
                      <div
                        className="telco-spinner"
                        style={{
                          width: 18,
                          height: 18,
                          borderWidth: 2,
                          borderTopColor: "#fff",
                          borderColor: "#ffffff55",
                        }}
                      />
                    ) : (
                      <>
                        <LockClosedIcon style={{ width: 16, height: 16 }} /> Pay{" "}
                        {formatGHS(getPayableAmount())}
                      </>
                    )}
                  </button>

                  <div className="telpm-security">
                    <ShieldCheckIcon style={{ width: 12, height: 12 }} /> Secured by GhIPSS
                  </div>

                  <div className="telpm-info-box">
                    <p className="telpm-info-title">
                      <CheckCircleIcon style={{ width: 12, height: 12 }} /> What happens next?
                    </p>
                    <ol className="telpm-info-list">
                      <li>We validate current product prices before payment</li>
                      <li>You'll receive a {TELECEL_LABEL} prompt on your phone</li>
                      <li>Approve it and we confirm your order automatically</li>
                    </ol>
                  </div>
                </>
              )}

              {paymentStatus === "pending" && (
                <div className="telpm-pending-wrap">
                  <div className="telpm-pending-anim">
                    <div className="telpm-pending-ring-outer" />
                    <div className="telpm-pending-ring-spin" />
                    <div className="telpm-pending-ring-inner">
                      <PhoneIcon style={{ width: 26, height: 26, color: "#BB1420" }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p className="telpm-pending-title">Awaiting Approval</p>
                    <p className="telpm-pending-desc">Check your phone for the Telecel Cash prompt</p>
                  </div>
                  <div className="telpm-pending-details">
                    <div className="telpm-pending-row">
                      <span className="telpm-pending-row-label">Number</span>
                      <span className="telpm-pending-row-value">{msisdn}</span>
                    </div>
                    <div className="telpm-pending-row">
                      <span className="telpm-pending-row-label">Network</span>
                      <span className="telpm-pending-row-value">{TELECEL_LABEL}</span>
                    </div>
                    <div className="telpm-pending-row">
                      <span className="telpm-pending-row-label">Amount</span>
                      <span className="telpm-pending-row-amount">{formatGHS(getPayableAmount())}</span>
                    </div>
                  </div>
                  <div className="telco-failed-countdown" style={{ width: "100%" }}>
                    Checking payment… {timeoutCountdown}s
                  </div>
                </div>
              )}

              {paymentStatus === "success" && (
                <div style={{ textAlign: "center", padding: "24px 8px" }}>
                  <div className="telco-dialog-icon" style={{ background: "#dcfce7", border: "2px solid #86efac" }}>
                    <CheckCircleSolid style={{ width: 40, height: 40, color: "#16a34a" }} />
                  </div>
                  <p className="telco-dialog-title" style={{ color: "var(--telco-red)" }}>
                    Payment Confirmed!
                  </p>
                  <p className="telco-dialog-desc">Creating your order and redirecting…</p>
                  <div className="telco-spinner" style={{ width: 22, height: 22, margin: "0 auto" }} />
                </div>
              )}

              {paymentStatus === "failed" && (
                <div style={{ textAlign: "center", padding: 20 }}>
                  <div className="telco-dialog-icon telco-dialog-icon-cancel">
                    <XCircleSolid style={{ width: 36, height: 36, color: "#ef4444" }} />
                  </div>
                  <p className="telco-dialog-title" style={{ color: "#ef4444" }}>
                    Payment Failed
                  </p>
                  <p className="telco-dialog-desc">
                    {debitErrorMessage || "Unable to initiate payment. Please try again."}
                  </p>
                  <button onClick={resetToPaymentInput} className="telco-btn telco-btn-primary">
                    Try Again
                  </button>
                  <button
                    onClick={performCancelOrder}
                    className="telco-btn telco-btn-danger"
                    style={{ marginTop: 8 }}
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          </div>
        </Modal>

        {/* ---------------- Telecel Cash approval guide ---------------- */}
        <Modal
          open={isApprovalGuideVisible}
          onCancel={undefined}
          footer={null}
          closable={false}
          maskClosable={false}
          centered
          width={520}
          styles={{ body: { padding: "16px 20px 100px" } }}
        >
          <div className="telpm-guide">
            <div className="telpm-guide-header">
              <div className="telpm-guide-logo-wrap">
                <img src={telecelWhite} alt="Telecel" className="telpm-guide-logo" />
              </div>
              <div style={{ flex: 1 }}>
                <div className="telpm-guide-badge">Payment Pending</div>
                <h3 className="telpm-guide-title">Approve Your Telecel Cash Payment</h3>
                <p className="telpm-guide-subtitle">
                  Approve the pending request on your phone to complete your order.
                </p>
              </div>
            </div>

            <div className="telpm-guide-info-row">
              <div>
                <p className="telpm-guide-info-label">Amount Due</p>
                <p className="telpm-guide-info-value">{formatGHS(getPayableAmount())}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p className="telpm-guide-info-label">Number</p>
                <p className="telpm-guide-info-value">{msisdn}</p>
              </div>
            </div>

            <div className="telpm-guide-ussd-row">
              <div>
                <p className="telpm-guide-info-label">Quick Dial</p>
                <p className="telpm-guide-info-value telpm-ussd">{TELECEL_USSD}</p>
              </div>
            </div>

            <div className="telpm-guide-steps-wrap">
              <div className="telpm-guide-steps-header">
                <p className="telpm-guide-steps-title">Step-by-step approval</p>
                <span>4 steps</span>
              </div>
              <div className="telpm-guide-steps-body">
                {[
                  `Dial ${TELECEL_USSD} on your Telecel phone`,
                  "Open pending approvals",
                  "Enter your PIN and select the Franko Trading transaction",
                  "Approve the payment",
                ].map((step, index, all) => (
                  <div key={step} className="telpm-guide-step">
                    <span
                      className="telpm-guide-step-num"
                      style={{
                        background: index === all.length - 1 ? "#BB1420" : "#FDF0F0",
                        color: index === all.length - 1 ? "#fff" : "#BB1420",
                      }}
                    >
                      {index + 1}
                    </span>
                    <p className="telpm-guide-step-text">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="telpm-guide-tip">
              💡 You can also approve the request in the Telecel Cash app.
            </div>

            {autoCheckCountdown > 0 && (
              <div className="telco-failed-countdown">
                Auto-checking in {formatAutoCheckTime(autoCheckCountdown)}
              </div>
            )}

            <div className="telpm-guide-desktop-actions">
              <button onClick={handleManualConfirm} disabled={manualVerifying} className="telco-btn telco-btn-primary">
                {manualVerifying ? "Verifying payment…" : "I've Approved — Confirm Payment"}
              </button>
              <button
                onClick={() => setActionDialog({ open: true, mode: "cancel" })}
                disabled={manualVerifying}
                className="telco-btn telco-btn-danger"
              >
                Cancel Order
              </button>
            </div>

            <div className="telpm-guide-sticky">
              <button onClick={handleManualConfirm} disabled={manualVerifying} className="telco-btn telco-btn-primary">
                {manualVerifying ? "Verifying…" : "I've Approved — Confirm"}
              </button>
              <button
                onClick={() => setActionDialog({ open: true, mode: "cancel" })}
                disabled={manualVerifying}
                className="telco-btn telco-btn-danger"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </Modal>

        <PaymentActionDialog
          open={actionDialog.open}
          mode={actionDialog.mode}
          verifying={manualVerifying}
          onRetry={handleDialogRetry}
          onCancel={performCancelOrder}
          onClose={() => !manualVerifying && setActionDialog((previous) => ({ ...previous, open: false }))}
        />

        <CheckoutFailedDialog
          open={checkoutFailedModal.open}
          displayMessage={checkoutFailedModal.displayMessage}
          countdown={checkoutFailedModal.countdown}
          onGoHome={closePriceUpdateModal}
        />

        {/* the existing AuthModal — signup mode, no guest, auto-login on signup */}
        <AuthModal
          open={isAuthModalOpen}
          onClose={handleAuthClose}
          onSuccess={handleAuthSuccess}
          currentCustomer={sessionCustomer}
          initialMode="signup"
          allowGuest={false}
          autoLoginAfterSignup
          notice="Create an account or sign in to complete your Speed Shopping order."
        />

      </div>
    </>
  );
};

/* ============================== HEADER ==============================
   The Telecel logo asset is the WHITE lockup, so it sits on the Telecel red
   bar — never on a white surface. */

const TelHeader = () => (
  <header className="telco-header">
    <div className="telco-header-inner">
      <img src={telecelWhite} alt="Telecel" className="telco-header-logo" />
      <span className="telco-header-divider" aria-hidden="true" />
      <div className="telco-header-copy">
        <h2 className="telco-header-title">Speed Shopping</h2>
        <p className="telco-header-sub">Pay with Telecel Cash</p>
      </div>
    </div>
  </header>
);

/* ============================== STYLES ============================== */

const telCheckoutStyles = `
  .telco-root {
    /* Brand = Telecel red. --telco-green-600 stays green: it is only used for
       semantic success ticks, never for branding. */
    --telco-green:#BB1420; --telco-green-mid:#A80F1B; --telco-green-600:#16a34a;
    --telco-green-light:#F6E3E5; --telco-red:#BB1420; --telco-red-deep:#A80F1B;
    --telco-gold:#FFD400;
    --telco-dark:#1f2622; --telco-mid:#555; --telco-light:#8a928e;
    --telco-border:#e3ded9; --telco-bg:#f7f5f3;
    min-height:100vh; background:var(--telco-bg); color:var(--telco-dark);
    font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;
    -webkit-font-smoothing:antialiased;
  }
  .telco-root * { box-sizing:border-box; }

  /* header */
  .telco-header { background:linear-gradient(90deg,#A80F1B 0%,#BB1420 50%,#A80F1B 100%); }
  .telco-header-inner {
    max-width:1780px; margin:0 auto; padding:12px 16px;
    display:flex; align-items:center; gap:14px;
  }
  @media(min-width:1024px){ .telco-header-inner{ padding:14px 40px; } }
  .telco-header-logo { height:44px; width:auto; object-fit:contain; flex-shrink:0; }
  .telco-header-divider { width:1px; height:34px; background:rgba(255,255,255,.28); }
  .telco-header-copy { min-width:0; }
  .telco-header-title {
    margin:0; font-size:17px; font-weight:800; letter-spacing:-.02em; color:#FFD400;
  }
  .telco-header-sub { margin:2px 0 0; font-size:12px; color:rgba(255,255,255,.9); }

  .telco-container { max-width:1780px; margin:0 auto; padding:24px 16px 120px; }
  @media(min-width:1024px){ .telco-container{ padding:32px 40px 60px; } }

  .telco-page-header { display:flex; align-items:center; gap:16px; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid var(--telco-border); }
  .telco-page-accent { width:4px; height:28px; border-radius:2px; background:var(--telco-red); flex-shrink:0; }
  .telco-page-title { font-size:24px; font-weight:800; letter-spacing:-.02em; margin:0; }
  .telco-page-count { font-size:13px; color:var(--telco-light); margin:4px 0 0; word-break:break-word; }

  .telco-layout { display:flex; flex-direction:column; gap:20px; }
  @media(min-width:1024px){ .telco-layout{ flex-direction:row; gap:24px; } }
  .telco-sidebar { flex-shrink:0; }
  @media(min-width:1024px){ .telco-sidebar{ width:380px; } }
  .telco-main { flex:1; min-width:0; }

  .telco-card { background:#fff; border:1px solid var(--telco-border); border-radius:8px; overflow:hidden; }
  .telco-card-header { padding:16px 20px; border-bottom:1px solid #f0f0f0; }
  .telco-card-title { font-size:16px; font-weight:800; margin:0; }
  .telco-card-body { padding:16px 20px; }
  .telco-section-accent { display:flex; gap:4px; margin-top:8px; }
  .telco-section-accent-bar { height:2px; width:32px; background:var(--telco-red); }
  .telco-section-accent-line { height:2px; flex:1; background:#f0f0f0; }

  .telco-auth-banner { display:flex; gap:12px; padding:12px 14px; border-radius:8px; margin-bottom:16px; background:#fef2f2; border:1px solid #fecaca; }
  .telco-auth-banner-icon { width:36px; height:36px; border-radius:8px; background:#fff; border:1px solid #fecaca; display:grid; place-items:center; flex-shrink:0; }
  .telco-auth-banner-copy { flex:1; }
  .telco-auth-banner-title { font-size:13px; font-weight:800; color:#991b1b; margin:0 0 3px; }
  .telco-auth-banner-desc { font-size:12px; color:#b91c1c; margin:0; line-height:1.45; }
  .telco-auth-banner-btn { margin-top:8px; border:0; background:var(--telco-red); color:#fff; border-radius:6px; padding:8px 12px; font-size:12px; font-weight:700; cursor:pointer; }

  .telco-toggle-wrap { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:var(--telco-bg); border:1px solid var(--telco-border); border-radius:8px; cursor:pointer; margin-bottom:16px; }
  .telco-toggle-left { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:600; color:var(--telco-mid); }
  .telco-toggle-track { width:40px; height:22px; border-radius:11px; padding:2px; transition:background .2s; }
  .telco-toggle-track.off { background:#d1d5db; }
  .telco-toggle-track.on { background:var(--telco-red); }
  .telco-toggle-knob { width:18px; height:18px; border-radius:50%; background:#fff; box-shadow:0 1px 3px #0002; transition:transform .2s; }
  .telco-toggle-knob.on { transform:translateX(18px); }

  .telco-warning-banner { display:flex; gap:12px; padding:12px 14px; border-radius:8px; margin-bottom:16px; background:#fffbeb; border:1px solid #fde68a; align-items:flex-start; }
  .telco-warning-banner p { font-size:12px; font-weight:600; color:#92400e; margin:0; line-height:1.5; }

  .telco-items-list { max-height:380px; overflow-y:auto; padding-right:4px; }
  .telco-item { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 0; border-bottom:1px solid #f5f5f5; }
  .telco-item:last-child { border-bottom:0; }
  .telco-item-left { display:flex; gap:12px; flex:1; min-width:0; }
  .telco-item-img,.telco-item-img-placeholder { width:56px; height:56px; border-radius:6px; object-fit:contain; border:1px solid #f0f0f0; flex-shrink:0; background:var(--telco-bg); }
  .telco-item-img-placeholder { display:flex; align-items:center; justify-content:center; font-size:10px; color:var(--telco-light); }
  .telco-item-info { flex:1; min-width:0; }
  .telco-item-name { font-size:14px; font-weight:700; margin:0 0 2px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .telco-item-unit { font-size:12px; color:var(--telco-light); margin:0; }
  .telco-item-qty { display:inline-flex; margin-top:4px; padding:2px 8px; border-radius:100px; background:#FDF0F0; font-size:11px; font-weight:700; color:var(--telco-red); }
  .telco-item-lineid { margin:4px 0 0; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:9.5px; color:#bdbdbd; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .telco-item-price { font-size:14px; font-weight:900; flex-shrink:0; }

  .telco-totals { padding-top:16px; border-top:1px solid var(--telco-border); }
  .telco-total-row { display:flex; align-items:center; justify-content:space-between; padding:6px 0; font-size:14px; }
  .telco-total-row-label { color:var(--telco-mid); }
  .telco-total-row-value { font-weight:700; }
  .telco-total-row-free { font-weight:700; color:var(--telco-green-600); }
  .telco-total-row-warning { font-weight:600; color:#d97706; }
  .telco-service-charge { display:flex; justify-content:space-between; padding:8px 12px; background:#eff6ff; border-radius:6px; margin:8px 0; }
  .telco-service-charge span { font-size:13px; font-weight:600; color:#1e40af; }
  .telco-grand-total { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:linear-gradient(135deg,#fef2f2,#fff7ed); border-radius:6px; margin-top:8px; border:1px solid #fecaca; }
  .telco-grand-total-label { font-weight:900; color:var(--telco-red); }
  .telco-grand-total-value { font-size:18px; font-weight:900; color:var(--telco-red); }
  .telco-charge-note { font-size:11px; color:var(--telco-light); text-align:center; font-style:italic; margin-top:6px; }

  .telco-payment-section { margin-top:20px; }
  .telco-payment-title { font-size:14px; font-weight:800; margin:0 0 12px; }
  .telco-payment-option { display:flex; align-items:center; gap:12px; padding:12px 16px; border:2px solid var(--telco-border); border-radius:8px; background:#fff; }
  .telco-payment-option-active { border-color:var(--telco-red); background:#fef2f2; }
  .telco-payment-check { color:var(--telco-red); display:flex; margin-left:auto; }
  .telco-payment-logo-chip { width:44px; height:44px; border-radius:10px; background:var(--telco-red); display:grid; place-items:center; flex-shrink:0; }
  .telco-payment-logo { width:34px; height:auto; object-fit:contain; }
  .telco-payment-option-text { display:flex; flex-direction:column; gap:2px; flex:1; min-width:0; }
  .telco-payment-option-text strong { font-size:14px; font-weight:800; color:var(--telco-dark); }
  .telco-payment-option-text span { font-size:11.5px; color:var(--telco-mid); }
  .telco-payment-hint { margin:8px 0 0; font-size:11.5px; color:#d97706; font-weight:600; }

  /* buttons */
  .telco-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; border-radius:6px; font-weight:700; cursor:pointer; transition:.15s; font-family:inherit; border:2px solid transparent; }
  .telco-btn-primary { padding:14px; background:var(--telco-green); color:#fff; border-color:var(--telco-green); font-size:15px; }
  .telco-btn-primary:hover:not(:disabled) { background:var(--telco-green-mid); border-color:var(--telco-green-mid); }
  .telco-btn-danger { padding:12px; background:#fff; color:#dc2626; border-color:#fecaca; font-size:14px; }
  .telco-btn-danger:hover:not(:disabled) { background:#fef2f2; }
  .telco-btn-outline { padding:9px 12px; background:#fff; color:var(--telco-dark); border-color:var(--telco-border); font-size:12px; }
  .telco-btn-outline:hover:not(:disabled) { background:var(--telco-bg); }
  .telco-btn-sm { padding:6px 10px; font-size:11px; }
  .telco-btn-block { width:100%; }
  .telco-btn:disabled { background:#d1d5db; border-color:#d1d5db; color:#fff; cursor:not-allowed; }
  .telco-btn-danger:disabled, .telco-btn-outline:disabled { background:#f3f4f6; color:#9ca3af; border-color:#e5e7eb; }
  .telco-desktop-btn { display:none; margin-top:20px; }
  @media(min-width:1024px){ .telco-desktop-btn{ display:block; } }

  .telco-sticky-bottom { position:fixed; bottom:0; left:0; right:0; background:#fff; border-top:1px solid var(--telco-border); z-index:40; box-shadow:0 -2px 12px #0001; }
  @media(min-width:1024px){ .telco-sticky-bottom{ display:none; } }
  .telco-sticky-inner { padding:12px 16px; display:flex; flex-direction:column; gap:10px; }
  .telco-sticky-total { display:flex; align-items:center; justify-content:space-between; font-size:13px; color:var(--telco-mid); }
  .telco-sticky-total strong { font-size:17px; font-weight:900; color:var(--telco-red); }

  .telco-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:60px 24px; min-height:400px; }
  .telco-empty-icon { width:72px; height:72px; border-radius:50%; background:#fff; display:grid; place-items:center; margin-bottom:16px; border:1px solid var(--telco-border); }
  .telco-empty-title { font-size:22px; font-weight:800; margin-bottom:8px; }
  .telco-empty-desc { font-size:14px; color:var(--telco-light); margin-bottom:24px; }

  /* overlays */
  .telco-loading-overlay { position:fixed; inset:0; background:#0008; backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:10000; }
  .telco-loading-card { background:#fff; border-radius:14px; padding:32px; display:flex; flex-direction:column; align-items:center; gap:16px; box-shadow:0 20px 60px #0003; }
  .telco-spinner { width:40px; height:40px; border:4px solid var(--telco-green-light); border-top-color:var(--telco-green-600); border-radius:50%; animation:telco-spin .8s linear infinite; }
  @keyframes telco-spin { to { transform:rotate(360deg); } }
  .telco-loading-text { font-size:15px; font-weight:700; color:var(--telco-mid); }

  .telco-modal-title { display:flex; align-items:center; gap:8px; color:#dc2626; font-weight:800; }
  .telco-missing-list { display:flex; flex-direction:column; gap:8px; margin-top:12px; }
  .telco-missing-row { display:flex; align-items:center; gap:10px; padding:8px 12px; background:#fef2f2; border:1px solid #fecaca; border-radius:6px; font-size:13px; font-weight:700; color:#991b1b; }

  /* payment modal */
  .telpm-wrap { display:flex; flex-direction:column; max-height:calc(100vh - 32px); }
  .telpm-header { background:linear-gradient(135deg,#8f0c16,#BB1420 55%,#A80F1B); padding:16px 20px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .telpm-header-left { display:flex; align-items:center; gap:10px; min-width:0; }
  .telpm-logo { height:26px; width:auto; object-fit:contain; flex-shrink:0; }
  .telpm-company { font-size:10px; font-weight:800; color:rgba(255,255,255,.85); text-transform:uppercase; margin:0; letter-spacing:.06em; }
  .telpm-ref { font-size:10px; color:rgba(255,255,255,.7); margin:3px 0 0; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
  .telpm-header-right { text-align:right; flex-shrink:0; }
  .telpm-amount-label { font-size:9px; font-weight:700; color:rgba(255,255,255,.8); text-transform:uppercase; margin:0; }
  .telpm-amount-value { font-size:24px; font-weight:900; color:#fff; margin:0; }

  .telpm-body { padding:16px; display:flex; flex-direction:column; gap:12px; background:#fff; overflow-y:auto; }
  .telpm-field { border:1.5px solid #e5e7eb; border-radius:10px; overflow:hidden; }
  .telpm-field-header { display:flex; align-items:center; gap:8px; padding:9px 12px; background:#f9fafb; border-bottom:1px solid #f0f0f0; }
  .telpm-field-step { width:20px; height:20px; background:var(--telco-red); color:#fff; border-radius:50%; display:grid; place-items:center; font-size:10px; font-weight:900; }
  .telpm-field-label { font-size:12px; font-weight:800; }
  .telpm-field-body { padding:12px; }
  .telpm-validation-wrap { margin-top:6px; }
  .telpm-validation { font-size:11px; font-weight:600; display:inline-flex; align-items:center; gap:4px; }
  .telpm-validation-info { color:#6b7280; }
  .telpm-validation-error { color:#dc2626; }
  .telpm-validation-ok { color:var(--telco-green-600); }
  .telpm-validation-warning { color:#d97706; }
  .telpm-msisdn { margin:8px 0 0; font-size:11px; color:var(--telco-mid); }
  .telpm-msisdn strong { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }

  .telpm-network-tile { display:flex; align-items:center; gap:10px; padding:10px 12px; border:2px solid #fecaca; border-radius:10px; background:#fef2f2; min-height:56px; }
  .telpm-network-mark { width:36px; height:36px; border-radius:8px; background:var(--telco-red); color:#fff; display:grid; place-items:center; font-size:13px; font-weight:900; flex-shrink:0; }
  .telpm-network-logo { width:26px; height:auto; object-fit:contain; }
  .telpm-network-info { flex:1; min-width:0; }
  .telpm-network-name { font-size:13px; font-weight:800; margin:0; }
  .telpm-network-sub { font-size:10px; color:var(--telco-mid); margin:2px 0 0; }

  .telpm-account-status { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; font-size:12px; font-weight:600; }
  .telpm-account-valid { background:#f0fdf4; border:1px solid #86efac; color:#14532d; }
  .telpm-account-invalid { background:#fef2f2; border:1px solid #fca5a5; color:#dc2626; }
  .telpm-account-checking { background:#f9fafb; border:1px solid #e5e7eb; color:#6b7280; }
  .telpm-account-icon { width:20px; height:20px; flex-shrink:0; }
  .telpm-account-debug { margin-top:4px; font-size:10px; line-height:1.5; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; color:#b91c1c; opacity:.9; word-break:break-word; }

  .telpm-pay-btn { width:100%; padding:14px; background:linear-gradient(135deg,#8f0c16,#BB1420); color:#fff; border:0; border-radius:10px; font-size:15px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; min-height:50px; font-family:inherit; }
  .telpm-pay-btn:disabled { background:#9ca3af; cursor:not-allowed; }
  .telpm-security { display:flex; align-items:center; justify-content:center; gap:5px; font-size:10px; font-weight:600; color:#6b7280; padding:7px; background:#f9fafb; border-radius:6px; }
  .telpm-info-box { background:#FDF0F0; border:1px solid #F0DCDC; border-radius:8px; padding:10px 12px; }
  .telpm-info-title { font-size:11px; font-weight:800; color:#7A0B13; margin:0 0 6px; display:flex; align-items:center; gap:5px; }
  .telpm-info-list { font-size:11px; color:#BB1420; margin:0; padding-left:18px; display:grid; gap:4px; }

  .telpm-pending-wrap { padding:12px 0 20px; display:flex; flex-direction:column; align-items:center; gap:16px; }
  .telpm-pending-anim { position:relative; width:78px; height:78px; }
  .telpm-pending-ring-outer,.telpm-pending-ring-spin { position:absolute; inset:0; border-radius:50%; }
  .telpm-pending-ring-outer { border:3px solid #fee2e2; }
  .telpm-pending-ring-spin { border:3px solid transparent; border-top-color:var(--telco-red); animation:telco-spin 1s linear infinite; }
  .telpm-pending-ring-inner { position:absolute; inset:9px; border:2px solid #fef2f2; border-radius:50%; display:grid; place-items:center; background:#fee2e2; }
  .telpm-pending-title { font-size:18px; font-weight:900; margin:0 0 4px; text-align:center; }
  .telpm-pending-desc { font-size:12px; color:var(--telco-light); margin:0; text-align:center; }
  .telpm-pending-details { width:100%; background:#f9fafb; border:1px solid #f0f0f0; border-radius:8px; overflow:hidden; }
  .telpm-pending-row { display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border-bottom:1px solid #f5f5f5; font-size:12px; }
  .telpm-pending-row:last-child { border-bottom:0; }
  .telpm-pending-row-label { color:var(--telco-light); }
  .telpm-pending-row-value { font-weight:700; }
  .telpm-pending-row-amount { font-weight:900; color:var(--telco-red); font-size:14px; }

  /* approval guide */
  .telpm-guide { display:flex; flex-direction:column; gap:16px; }
  .telpm-guide-header { display:flex; align-items:flex-start; gap:12px; }
  .telpm-guide-logo-wrap { width:56px; height:56px; border-radius:12px; display:grid; place-items:center; flex-shrink:0; background:var(--telco-red); }
  .telpm-guide-logo { width:40px; height:auto; object-fit:contain; }
  .telpm-guide-badge { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; padding:3px 10px; border-radius:100px; border:1px solid #fecaca; background:#fef2f2; color:var(--telco-red); margin-bottom:4px; }
  .telpm-guide-title { font-size:18px; font-weight:900; margin:0; }
  .telpm-guide-subtitle { font-size:13px; color:var(--telco-light); margin:3px 0 0; }
  .telpm-guide-info-row,.telpm-guide-ussd-row { display:flex; align-items:center; justify-content:space-between; border-radius:6px; border:1px solid #fecaca; background:#fef2f2; padding:10px 14px; }
  .telpm-guide-info-label { font-size:10px; font-weight:700; color:var(--telco-light); text-transform:uppercase; margin:0 0 2px; }
  .telpm-guide-info-value { font-weight:900; margin:0; color:var(--telco-red); }
  .telpm-ussd { font-size:20px; }
  .telpm-guide-steps-wrap { background:#fff; border:1px solid #f0f0f0; border-radius:6px; overflow:hidden; }
  .telpm-guide-steps-header { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid #f5f5f5; font-size:12px; color:var(--telco-light); }
  .telpm-guide-steps-title { font-size:13px; font-weight:800; margin:0; color:var(--telco-dark); }
  .telpm-guide-steps-body { padding:14px; max-height:280px; overflow:auto; }
  .telpm-guide-step { display:flex; gap:12px; align-items:flex-start; margin-bottom:10px; }
  .telpm-guide-step:last-child { margin-bottom:0; }
  .telpm-guide-step-num { width:24px; height:24px; border-radius:50%; display:grid; place-items:center; color:#fff; font-size:11px; font-weight:900; flex-shrink:0; }
  .telpm-guide-step-text { font-size:13px; color:var(--telco-mid); margin:3px 0 0; line-height:1.4; }
  .telpm-guide-tip { display:flex; gap:10px; background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:10px 14px; font-size:12px; font-weight:600; color:#92400e; }
  .telpm-guide-desktop-actions { display:none; flex-direction:column; gap:8px; }
  .telpm-guide-sticky { display:flex; flex-direction:column; gap:8px; }
  @media(min-width:1024px){
    .telpm-guide-desktop-actions { display:flex; }
    .telpm-guide-sticky { display:none; }
  }

  /* dialogs */
  .telco-dialog-overlay { position:fixed; inset:0; z-index:10001; display:flex; align-items:center; justify-content:center; padding:16px; }
  .telco-dialog-backdrop { position:absolute; inset:0; background:#0008; backdrop-filter:blur(4px); }
  .telco-dialog-card { position:relative; background:#fff; border-radius:14px; width:100%; max-width:400px; overflow:hidden; box-shadow:0 20px 60px #0003; }
  .telco-dialog-bar { height:4px; width:100%; }
  .telco-dialog-bar-cancel { background:linear-gradient(90deg,#f87171,#ef4444); }
  .telco-dialog-bar-warning,.telco-failed-bar { background:linear-gradient(90deg,#fbbf24,#f59e0b); }
  .telco-dialog-body { padding:24px; }
  .telco-dialog-icon { width:56px; height:56px; border-radius:50%; display:grid; place-items:center; margin:0 auto 16px; }
  .telco-dialog-icon-cancel { background:#fef2f2; }
  .telco-dialog-icon-warning { background:#fffbeb; }
  .telco-dialog-title { font-size:18px; font-weight:900; text-align:center; margin-bottom:6px; }
  .telco-dialog-desc { font-size:13px; color:var(--telco-light); text-align:center; line-height:1.5; margin-bottom:20px; }
  .telco-dialog-actions { display:flex; flex-direction:column; gap:8px; }
  .telco-failed-countdown { display:flex; align-items:center; justify-content:center; gap:6px; font-size:12px; font-weight:700; color:#92400e; background:#fef3c7; border:1px solid #fde68a; border-radius:8px; padding:8px 12px; margin-bottom:16px; }

  @media (prefers-reduced-motion: reduce) {
    .telco-root * { animation:none !important; transition:none !important; }
  }
`;

export default TelCheckout;
