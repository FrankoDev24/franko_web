// src/pages/Checkout.jsx
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  checkOutOrder,
  updateOrderDelivery,
  saveCheckoutDetails,
  saveAddressDetails,
} from "../Redux/Slice/orderSlice";
import {
  debitCustomer,
  checkTransactionStatus,
} from "../Redux/Slice/paymentSlice";
import { clearCart, getCartById } from "../Redux/Slice/cartSlice";
import { message, Typography, Radio, Divider, Modal, Input } from "antd";
import CheckoutForm from "../Component/CheckoutForm";
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
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon as CheckCircleSolid,
  XCircleIcon as XCircleSolid,
} from "@heroicons/react/24/solid";

import frankoLogo from "../assets/frankoIcon.png";
import mtnLogo from "../assets/momo.png";
import vodafoneLogo from "../assets/voda.jpeg";
import airteltigoLogo from "../assets/AT.png";

const { Text } = Typography;

// ==================== CONSTANTS ====================
const SERVICE_CHARGE_RATE = 0.01;
const SERVICE_CHARGE_CAP = 20.0;
const INITIAL_DELAY_MS = 10000;
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_DURATION_MS = 60000;

// ==================== NETWORK STEPS CONFIG ====================
const NETWORK_STEPS = {
  mtn: {
    label: "MTN Mobile Money",
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FCD34D",
    logo: mtnLogo,
    ussd: "*170#",
    steps: [
      { num: 1, text: "Dial *170# on your MTN phone" },
      { num: 2, text: "Select 6 — My Wallet (or 10 on some versions)" },
      { num: 3, text: "Select 3 — My Approvals" },
      { num: 4, text: "Enter your MoMo PIN to load pending list" },
      { num: 5, text: "Select the Franko Trading transaction" },
      { num: 6, text: "Select 1 (YES) to approve" },
    ],
    tip: "Or open the MTN MoMo app → Approvals → approve the pending request.",
  },
  vodafone: {
    label: "Vodafone Cash",
    color: "#E11D48",
    bg: "#FFF1F2",
    border: "#FECDD3",
    logo: vodafoneLogo,
    ussd: "*110#",
    steps: [
      { num: 1, text: "Dial *110# on your Vodafone phone" },
      { num: 2, text: "Select 4 — Make Payments" },
      { num: 3, text: "Select 8 — My Approvals" },
      { num: 4, text: "Enter your MoMo PIN to load pending list" },
      { num: 5, text: "Select the Franko Trading transaction" },
      { num: 6, text: "Select 1 (YES) to approve" },
    ],
    tip: "Or open the Vodafone Cash app → Pending Transactions → approve.",
  },
  airteltigo: {
    label: "AirtelTigo Money",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    logo: airteltigoLogo,
    ussd: "*110#",
    steps: [
      { num: 1, text: "Dial *110# on your AirtelTigo phone" },
      { num: 2, text: "Select Pending Approvals or Wallet (option 8 or 6)" },
      { num: 3, text: "Enter your 4-digit PIN to view pending transactions" },
      { num: 4, text: "Select the Franko Trading transaction" },
      { num: 5, text: "Choose Approve to confirm the payment" },
    ],
    tip: "Or open the AirtelTigo Money app → Pending Approvals → confirm.",
  },
};

// ==================== UTILITY FUNCTIONS ====================
const formatCurrency = (amount, decimals = 2) => {
  const num = parseFloat(amount) || 0;
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};
const formatGHS = (amount) => `₵${formatCurrency(amount, 2)}`;
const getItemUnitPrice = (item) =>
  parseFloat(item.unitPrice) || parseFloat(item.price) || 0;
const getItemQuantity = (item) => parseInt(item.quantity, 10) || 1;
const getItemLineTotal = (item) => getItemUnitPrice(item) * getItemQuantity(item);
const buildCartNarration = (items, maxLen = 120) => {
  if (!items || items.length === 0) return "Franko Trading Purchase";
  const parts = items.map((item) => {
    const name = (item.productName || item.ProductName || "Item").trim();
    const qty = getItemQuantity(item);
    return qty > 1 ? `${name} (x${qty})` : name;
  });
  let narration = parts.join(", ");
  if (narration.length > maxLen) narration = narration.substring(0, maxLen - 3) + "...";
  return narration;
};

// ==================== ACTION DIALOG ====================
/**
 * A focused confirm/retry popup shown in two scenarios:
 *   mode = "cancel"        → user clicked "Cancel Order"
 *   mode = "not_confirmed" → "I've Approved" was clicked but verification failed
 */
const PaymentActionDialog = ({ open, mode, verifying, onRetry, onCancel, onClose }) => {
  if (!open) return null;
  const isCancel = mode === "cancel";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={() => !verifying && onClose()}
      />

      {/* Card */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        style={{ animation: "dialogPop 0.2s ease-out" }}
      >
        {/* Top colour bar */}
        <div
          className={`h-1.5 w-full ${
            isCancel
              ? "bg-gradient-to-r from-red-400 to-red-500"
              : "bg-gradient-to-r from-amber-400 to-orange-400"
          }`}
        />

        <div className="p-6 space-y-5">
          {/* Icon + copy */}
          <div className="flex flex-col items-center text-center gap-3">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isCancel ? "bg-red-50" : "bg-amber-50"
              }`}
            >
              {isCancel ? (
                <XCircleSolid className="w-9 h-9 text-red-500" />
              ) : (
                <ExclamationTriangleIcon className="w-9 h-9 text-amber-500" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">
                {isCancel ? "Cancel this order?" : "Payment not confirmed yet"}
              </h3>
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                {isCancel
                  ? "Your payment has not been charged. Are you sure you want to cancel?"
                  : "We couldn't verify your payment. Please approve via your MoMo app or USSD, then try again."}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Buttons */}
          <div className="space-y-2.5">
            {/* Keep trying / retry */}
            <button
              onClick={onRetry}
              disabled={verifying}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm bg-green-600 hover:bg-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-wait"
              style={{ boxShadow: "0 3px 14px rgba(5,150,105,0.30)" }}
            >
              {verifying ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Verifying…
                </>
              ) : (
                <>
                  <ArrowUturnLeftIcon className="w-4 h-4" />
                  {isCancel ? "Keep Trying" : "I've Approved — Try Again"}
                </>
              )}
            </button>

            {/* Confirm cancel */}
            <button
              onClick={onCancel}
              disabled={verifying}
              className="w-full py-3 rounded-xl font-semibold text-red-500 text-sm border border-red-100 bg-red-50 hover:bg-red-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <XCircleIcon className="w-4 h-4" />
              Yes, Cancel Order
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dialogPop {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }
      `}</style>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pollingRef = useRef(null);
  const countdownRef = useRef(null);
  const initialDelayRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [timeoutCountdown, setTimeoutCountdown] = useState(60);

  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryInfo, setDeliveryInfo] = useState({ address: "", fee: 0, feeDisplay: "" });

  const [isValidationModalVisible, setIsValidationModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isGuestWarningVisible, setIsGuestWarningVisible] = useState(false);
  const [isApprovalGuideVisible, setIsApprovalGuideVisible] = useState(false);

  // Action dialog: { open, mode: "cancel" | "not_confirmed" }
  const [actionDialog, setActionDialog] = useState({ open: false, mode: "cancel" });

  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [pendingCheckoutDetails, setPendingCheckoutDetails] = useState(null);
  const [pendingAddressDetails, setPendingAddressDetails] = useState(null);

  const [momoNumber, setMomoNumber] = useState("233");
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [payButtonLoading, setPayButtonLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const { cart: reduxCart, cartId: reduxCartId } = useSelector((state) => state.cart);

  const getCartItemsFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem("cart");
      if (!stored) return [];
      return Array.isArray(stored) ? stored : [];
    } catch { return []; }
  };
  const resolveCartItems = () => {
    if (Array.isArray(reduxCart) && reduxCart.length > 0) return reduxCart;
    return getCartItemsFromLocalStorage();
  };
  const [cartItems, setCartItems] = useState(resolveCartItems);
  const getCartId = () => reduxCartId || localStorage.getItem("cartId") || `cart_${Date.now()}`;

  const [customerData, setCustomerData] = useState(null);
  const [isDifferentRecipient, setIsDifferentRecipient] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");

  const customerId = customerData?.customerAccountNumber;
  const customerAccountType = customerData?.accountType;
  const selectedAddress = deliveryInfo?.address || "";
  const isAgent = customerAccountType === "agent";
  const isFreeDelivery =
    deliveryInfo?.fee === 0 &&
    typeof deliveryInfo?.feeDisplay === "string" &&
    deliveryInfo.feeDisplay.toLowerCase().includes("free");
  const isNADelivery =
    deliveryInfo?.fee === 0 &&
    (!deliveryInfo?.feeDisplay ||
      deliveryInfo?.feeDisplay === "N/A" ||
      deliveryInfo?.feeDisplay === "" ||
      (typeof deliveryInfo?.feeDisplay === "string" &&
        deliveryInfo.feeDisplay.toLowerCase() === "n/a"));

  const netCfg = selectedNetwork ? NETWORK_STEPS[selectedNetwork] : null;

  // ==================== CLEANUP ====================
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (initialDelayRef.current) clearTimeout(initialDelayRef.current);
    };
  }, []);

  // ==================== DATA INIT ====================
  useEffect(() => {
    try {
      const customerObj = localStorage.getItem("customer");
      if (customerObj && typeof customerObj === "object") {
        setCustomerData(customerObj);
        setCustomerName(`${customerObj.firstName || ""} ${customerObj.lastName || ""}`.trim());
        setCustomerNumber(customerObj.contactNumber || customerObj.ContactNumber || "");
      }
    } catch {}
    try {
      const storedInfo = localStorage.getItem("deliveryInfo") || {};
      setDeliveryInfo({
        address: storedInfo?.address || "",
        fee: storedInfo?.fee ?? 0,
        feeDisplay: storedInfo?.feeDisplay || "",
      });
      setDeliveryFee(Number(storedInfo?.fee) || 0);
    } catch {}
  }, []);

  useEffect(() => {
    const activeCartId = reduxCartId || localStorage.getItem("cartId");
    if (activeCartId) dispatch(getCartById(activeCartId));
  }, []);

  useEffect(() => {
    if (isDifferentRecipient) {
      setCustomerName("");
      setCustomerNumber("");
    } else if (customerData) {
      setCustomerName(`${customerData.firstName || ""} ${customerData.lastName || ""}`.trim());
      setCustomerNumber(customerData.contactNumber || customerData.ContactNumber || "");
    }
  }, [isDifferentRecipient]);

  useEffect(() => {
    if (deliveryInfo?.fee !== undefined && !Number.isNaN(Number(deliveryInfo.fee)))
      setDeliveryFee(Number(deliveryInfo.fee));
  }, [deliveryInfo]);

  useEffect(() => {
    if (Array.isArray(reduxCart) && reduxCart.length > 0) setCartItems(reduxCart);
    else {
      const f = getCartItemsFromLocalStorage();
      if (f.length > 0) setCartItems(f);
    }
  }, [reduxCart]);

  // ==================== MOMO NUMBER ====================
  const handleMomoNumberChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, "");
    if (value.startsWith("0")) value = "233" + value.slice(1);
    if (!value.startsWith("233")) value = "233";
    if (value.length > 12) value = value.slice(0, 12);
    setMomoNumber(value);
  };
  const isValidMomoNumber = () => /^233[1-9]\d{8}$/.test(momoNumber);
  const startsWithZeroAfter233 = () => momoNumber.length > 3 && momoNumber[3] === "0";

  // ==================== CALCULATIONS ====================
  const calculateSubtotal = () =>
    cartItems.reduce((sum, item) => sum + getItemLineTotal(item), 0);
  const calculateTotalAmount = () => calculateSubtotal() + deliveryFee;
  const calculateServiceCharge = () => {
    const base = calculateTotalAmount();
    return base > 2000 ? SERVICE_CHARGE_CAP : base * SERVICE_CHARGE_RATE;
  };
  const calculateDisplayTotalWithCharge = () =>
    calculateTotalAmount() + calculateServiceCharge();
  const generateOrderId = () =>
    `ORD-${new Date().getTime() % 10000}-${Math.floor(Math.random() * 1000)}`;

  // ==================== RETRY HELPERS ====================
  const dispatchOrderCheckoutWithRetry = async (orderId, checkoutDetails, maxRetries = 3) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await dispatch(
          checkOutOrder({ cartId: getCartId(), ...checkoutDetails })
        ).unwrap();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries)
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
    throw new Error(
      `Checkout failed after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`
    );
  };
  const dispatchOrderAddressWithRetry = async (orderId, addressDetails, maxRetries = 3) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await dispatch(updateOrderDelivery(addressDetails)).unwrap();
        dispatch(clearCart());
        localStorage.removeItem("cart");
        localStorage.removeItem("cartId");
        return result;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries)
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
    throw new Error(
      `Address update failed after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`
    );
  };
  const processDirectCheckout = async (orderId, checkoutDetails, addressDetails) => {
    await dispatchOrderCheckoutWithRetry(orderId, checkoutDetails);
    await dispatchOrderAddressWithRetry(orderId, addressDetails);
  };

  // ==================== POLLING ====================
  const startPolling = (orderId, checkoutDetails, addressDetails) => {
    setTimeoutCountdown(60);
    countdownRef.current = setInterval(() => {
      setTimeoutCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    initialDelayRef.current = setTimeout(() => {
      let pollCount = 0;
      const maxPolls = MAX_POLL_DURATION_MS / POLL_INTERVAL_MS;

      pollingRef.current = setInterval(async () => {
        pollCount++;
        try {
          const response = await dispatch(
            checkTransactionStatus({ refNo: orderId })
          ).unwrap();
          if (response?.responseMessage === "Successfully Processed Transaction") {
            clearInterval(pollingRef.current);
            clearInterval(countdownRef.current);
            setPaymentStatus("success");
            try {
              await processDirectCheckout(orderId, checkoutDetails, addressDetails);
              localStorage.removeItem("checkoutDetails");
              localStorage.removeItem("orderAddressDetails");
              message.success("Payment confirmed! Processing your order...");
              setTimeout(() => {
                setIsPaymentModalVisible(false);
                navigate(`/order-success/${orderId}`);
              }, 1200);
            } catch {
              message.error(
                "Payment succeeded, but order processing failed. Contact support."
              );
            }
            return;
          }
        } catch {}

        if (pollCount >= maxPolls) {
          clearInterval(pollingRef.current);
          clearInterval(countdownRef.current);
          setPaymentStatus("awaiting_manual");
          setIsApprovalGuideVisible(true);
        }
      }, POLL_INTERVAL_MS);
    }, INITIAL_DELAY_MS);
  };

  // ==================== CANCEL (performs cleanup) ====================
  const performCancelOrder = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (initialDelayRef.current) clearTimeout(initialDelayRef.current);
    setActionDialog({ open: false, mode: "cancel" });
    setIsApprovalGuideVisible(false);
    setIsPaymentModalVisible(false);
    setPaymentStatus("idle");
    localStorage.removeItem("checkoutDetails");
    localStorage.removeItem("orderAddressDetails");
    navigate("/order-cancelled");
  };

  // ==================== MANUAL CONFIRM ====================
  const handleManualConfirm = async () => {
    if (!currentOrderId) return;
    try {
      setVerifyingPayment(true);
      const response = await dispatch(
        checkTransactionStatus({ refNo: currentOrderId })
      ).unwrap();

      if (response?.responseMessage === "Successfully Processed Transaction") {
        // Success path
        setActionDialog({ open: false, mode: "cancel" });
        setPaymentStatus("success");
        setIsApprovalGuideVisible(false);
        try {
          await processDirectCheckout(
            currentOrderId,
            pendingCheckoutDetails,
            pendingAddressDetails
          );
          localStorage.removeItem("checkoutDetails");
          localStorage.removeItem("orderAddressDetails");
          message.success("Payment confirmed! Your order is being processed...");
          setTimeout(() => {
            setIsPaymentModalVisible(false);
            navigate(`/order-success/${currentOrderId}`);
          }, 1200);
        } catch {
          message.error(
            "Payment confirmed but order processing failed. Please contact support."
          );
        }
      } else {
        // Not confirmed — show the not_confirmed dialog
        setActionDialog({ open: true, mode: "not_confirmed" });
      }
    } catch {
      setActionDialog({ open: true, mode: "not_confirmed" });
    } finally {
      setVerifyingPayment(false);
    }
  };

  // ── "Cancel Order" button on approval guide → open cancel dialog ──
  const handleCancelFromGuide = () => {
    setActionDialog({ open: true, mode: "cancel" });
  };

  // ── Dialog: primary action (Keep Trying / Try Again) ──
  const handleDialogRetry = () => {
    setActionDialog({ open: false, mode: "cancel" });
    if (actionDialog.mode === "not_confirmed") {
      // Re-attempt verification immediately
      handleManualConfirm();
    }
    // For "cancel" mode: just close → user stays on guide
  };

  // ── Dialog: destructive action (Yes, Cancel) ──
  const handleDialogCancel = () => performCancelOrder();

  // ==================== VALIDATION ====================
  const validateRequiredFields = () => {
    const errors = [];
    if (!customerName?.trim())
      errors.push({ field: "name", message: "Recipient name is required" });
    if (!customerNumber?.trim())
      errors.push({ field: "phone", message: "Recipient contact number is required" });
    if (!selectedAddress?.trim())
      errors.push({ field: "address", message: "Delivery address is required" });
    if (!paymentMethod)
      errors.push({ field: "payment", message: "Payment method is required" });
    return errors;
  };
  const getSafeCustomerDetails = () => {
    let name = customerName?.trim();
    let number = customerNumber?.trim();
    if (!name && customerData)
      name = `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim();
    if (!number && customerData)
      number = customerData.contactNumber || customerData.ContactNumber || "";
    if (!number) number = "0000000000";
    return { name, number };
  };

  // ==================== PAYMENT HANDLERS ====================
  const handlePaymentMethodChange = (e) => setPaymentMethod(e.target.value);

  const handleCheckout = async () => {
    const { name: safeName, number: safeNumber } = getSafeCustomerDetails();
    setCustomerName(safeName);
    setCustomerNumber(safeNumber);

    const nameLower = safeName.toLowerCase().trim();
    if (
      nameLower === "guest" ||
      nameLower === "guest user" ||
      nameLower.startsWith("guest ")
    ) {
      setIsGuestWarningVisible(true);
      return;
    }
    const validationErrors = validateRequiredFields();
    if (validationErrors.length > 0) {
      setIsValidationModalVisible(true);
      return;
    }

    const orderId = generateOrderId();
    setCurrentOrderId(orderId);
    const orderDate = new Date().toISOString();
    const totalAmount = calculateSubtotal();
    const cartId = getCartId();

    const checkoutDetails = {
      Cartid: cartId,
      customerId,
      orderCode: orderId,
      PaymentMode: paymentMethod,
      PaymentAccountNumber: safeNumber || "0000000000",
      customerAccountType,
      paymentService: "Mtn",
      totalAmount,
      recipientName: safeName,
      recipientContactNumber: safeNumber,
      orderNote: orderNote || "N/A",
      orderDate,
    };
    const addressDetails = {
      orderCode: orderId,
      address: selectedAddress,
      Customerid: customerId,
      recipientName: safeName,
      recipientContactNumber: safeNumber,
      orderNote: orderNote || "N/A",
      geoLocation: "N/A",
    };

    try {
      setLoading(true);
      if (isAgent || !["Mobile Money"].includes(paymentMethod)) {
        await processDirectCheckout(orderId, checkoutDetails, addressDetails);
        message.success("Your order has been placed successfully!");
        navigate("/order-received");
      } else {
        localStorage.setItem("checkoutDetails", checkoutDetails);
        localStorage.setItem("orderAddressDetails", addressDetails);
        dispatch(saveCheckoutDetails(checkoutDetails));
        dispatch(saveAddressDetails(addressDetails));
        setPendingCheckoutDetails(checkoutDetails);
        setPendingAddressDetails(addressDetails);
        setMomoNumber("233");
        setSelectedNetwork(null);
        setPaymentStatus("input");
        setIsPaymentModalVisible(true);
      }
    } catch (error) {
      message.error(error.message || "An error occurred during checkout.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!isValidMomoNumber()) {
      message.error("Please enter a valid 9-digit number after 233");
      return;
    }
    if (!selectedNetwork) {
      message.error("Please select your network provider");
      return;
    }
    const paymentAmount = calculateSubtotal();
    const narration = buildCartNarration(cartItems);
    try {
      setPayButtonLoading(true);
      setPaymentStatus("pending");
      await dispatch(
        debitCustomer({
          refNo: currentOrderId,
          msisdn: momoNumber,
          amount: paymentAmount,
          network: selectedNetwork,
          narration,
        })
      ).unwrap();
      startPolling(currentOrderId, pendingCheckoutDetails, pendingAddressDetails);
    } catch (error) {
      setPaymentStatus("failed");
      localStorage.removeItem("checkoutDetails");
      localStorage.removeItem("orderAddressDetails");
      message.error("Payment initiation failed. Redirecting...");
      setTimeout(() => {
        setIsPaymentModalVisible(false);
        navigate("/order-cancelled");
      }, 2000);
    } finally {
      setPayButtonLoading(false);
    }
  };

  // ==================== RENDER HELPERS ====================
  const renderImage = (imagePath) => {
    if (!imagePath)
      return (
        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
          <span className="text-gray-400 text-xs">No Image</span>
        </div>
      );
    const imageUrl = `https://ct002.frankotrading.com:444/Media/Products_Images/${imagePath
      .split("\\")
      .pop()}`;
    return (
      <img
        src={imageUrl}
        alt="Product"
        className="w-16 h-16 object-cover rounded-xl border border-gray-100"
        onError={(e) => {
          e.target.style.display = "none";
          if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
        }}
      />
    );
  };

  const getServiceChargeLabel = () =>
    calculateTotalAmount() > 2000
      ? "Momo Service Charge :"
      : "Momo Service Charge (1%):";

  // ==================== EMPTY CART ====================
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <ShoppingBagIcon className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add items to your cart to proceed with checkout.</p>
        <button
          onClick={() => navigate("/")}
          className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition-colors font-semibold shadow-md"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <div className="p-4 mx-auto pb-24 lg:pb-4">
      {loading && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full" />
            <p className="text-gray-600 font-semibold">Processing your order…</p>
          </div>
        </div>
      )}

      {/* Page Title */}
      <div className="flex items-center mb-6 gap-3">
        <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
          <ShoppingBagIcon className="w-5 h-5 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          Checkout{" "}
          <span className="text-gray-400 font-normal text-base">
            ({cartItems.length} items)
          </span>
        </h2>
        <div className="flex-grow border-t border-gray-200 ml-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ══════ BILLING INFO ══════ */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="mb-5">
              <h3 className="text-base font-bold text-gray-800">Billing Information</h3>
              <div className="mt-2 flex gap-1">
                <div className="h-0.5 w-8 bg-green-500 rounded-full" />
                <div className="h-0.5 flex-1 bg-gray-100 rounded-full" />
              </div>
            </div>

            <div
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 cursor-pointer select-none hover:border-green-200 transition-colors"
              onClick={() => setIsDifferentRecipient((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Different recipient?
                </span>
              </div>
              <div
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  isDifferentRecipient ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    isDifferentRecipient ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </div>
            </div>

            {isDifferentRecipient && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-700 font-medium">
                  Enter the recipient's name and contact number below.
                </p>
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
              firstName={customerData?.firstName || "Guest"}
              isDifferentRecipient={isDifferentRecipient}
              readOnlyRecipient={!isDifferentRecipient}
            />
          </div>
        </div>

        {/* ══════ ORDER SUMMARY ══════ */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="mb-5">
              <h3 className="text-base font-bold text-gray-800">Order Summary</h3>
              <div className="mt-2 flex gap-1">
                <div className="h-0.5 w-8 bg-green-500 rounded-full" />
                <div className="h-0.5 flex-1 bg-gray-100 rounded-full" />
              </div>
            </div>

            {/* Cart Items */}
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto pr-1">
              {cartItems.map((item, index) => {
                const unitPrice = getItemUnitPrice(item);
                const qty = getItemQuantity(item);
                const lineTotal = unitPrice * qty;
                return (
                  <div
                    key={item.productId || index}
                    className="flex justify-between items-center py-3 gap-4"
                  >
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 relative">
                        {renderImage(item.imagePath)}
                        <div className="w-16 h-16 bg-gray-100 rounded-xl items-center justify-center hidden">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">
                          {item.productName || "Product"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Unit: {formatGHS(unitPrice)}
                        </p>
                        <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-green-700 bg-green-50 rounded-full px-2.5 py-0.5">
                          Qty {qty}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-800 flex-shrink-0">
                      {formatGHS(lineTotal)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="flex justify-between items-center pt-4 border-t text-md font-medium text-gray-900">
              <span>Subtotal</span>
              <span>{formatGHS(calculateSubtotal())}</span>
            </div>

            {/* CHARGES */}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <Text>Shipping Fee:</Text>
                {isFreeDelivery ? (
                  <Text className="text-green-600 font-semibold">FREE DELIVERY</Text>
                ) : isNADelivery ? (
                  <Text type="warning" className="text-amber-600">
                    {isAgent ? "Agent delivery" : "Delivery charges apply"}
                  </Text>
                ) : deliveryFee > 0 ? (
                  <Text strong>{formatGHS(deliveryFee)}</Text>
                ) : (
                  <Text type="warning" className="text-amber-600">
                    Select location for delivery fee
                  </Text>
                )}
              </div>

              {paymentMethod === "Mobile Money" && (
                <div className="flex justify-between items-center bg-blue-50 p-2 rounded-lg">
                  <Text className="text-gray-700 font-medium">
                    {getServiceChargeLabel()}
                  </Text>
                  <Text className="text-gray-700 font-medium">
                    {formatGHS(calculateServiceCharge())}
                  </Text>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-gray-300 bg-gradient-to-r from-red-50 to-orange-50 p-3 rounded-lg">
                <Text className="text-red-600 font-bold text-lg">Total Amount:</Text>
                <Text className="text-red-600 font-bold text-lg">
                  {paymentMethod === "Mobile Money"
                    ? formatGHS(calculateDisplayTotalWithCharge())
                    : formatGHS(calculateTotalAmount())}
                </Text>
              </div>

              {paymentMethod === "Mobile Money" && (
                <p className="text-xs text-gray-500 italic text-center mt-1">
                  * Service charge is applied by your mobile money provider.
                </p>
              )}
            </div>

            <Divider className="my-6" />

            {/* Payment Method */}
            <div>
              <p className="text-sm font-bold text-gray-700 mb-3">Payment Method</p>
              <Radio.Group
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
                className="flex flex-col gap-2"
              >
                {(isAgent || isFreeDelivery || (deliveryFee > 0 && !isNADelivery)) && (
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === "Cash on Delivery"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Radio value="Cash on Delivery" />
                    <span className="text-sm font-medium text-gray-700">
                      Cash on Delivery
                    </span>
                  </label>
                )}
                {!isAgent && (
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === "Mobile Money"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Radio value="Mobile Money" />
                    <span className="text-sm font-medium text-gray-700">
                      Mobile Money
                    </span>
                  </label>
                )}
                {isAgent && (
                  <>
                    <label
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === "Pick Up"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Radio value="Pick Up" />
                      <span className="text-sm font-medium text-gray-700">Pick Up</span>
                    </label>
                    <label
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === "Paid Already"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Radio value="Paid Already" />
                      <span className="text-sm font-medium text-gray-700">
                        Paid Already
                      </span>
                    </label>
                  </>
                )}
              </Radio.Group>
            </div>

            {/* Place Order - Hidden on mobile, shown on desktop */}
            <div className="mt-6 hidden lg:block">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className={`w-full text-white font-bold text-base py-4 rounded-xl transition-all duration-300 shadow-lg ${
                  loading
                    ? "bg-gray-400 cursor-wait"
                    : "bg-green-600 hover:bg-green-700 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Processing Order...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <ShoppingBagIcon className="w-5 h-5" />
                    Place Order
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Place Order Button for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-40">
        <button
          type="button"
          onClick={handleCheckout}
          disabled={loading}
          className={`w-full text-white font-bold text-base py-4 rounded-xl transition-all duration-300 shadow-lg ${
            loading
              ? "bg-gray-400 cursor-wait"
              : "bg-green-600 hover:bg-green-700 active:scale-[0.98]"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Processing Order...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ShoppingBagIcon className="w-5 h-5" />
              Place Order
            </span>
          )}
        </button>
      </div>

      {/* Rest of the modals remain the same... */}
      {/* ══════ GUEST WARNING MODAL ══════ */}
      <Modal
        open={isGuestWarningVisible}
        onCancel={() => setIsGuestWarningVisible(false)}
        centered
        footer={null}
        width={400}
      >
        <div className="flex flex-col items-center text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Real name required</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Please enter your actual full name before placing an order.
              <br />
              <span className="text-amber-600 font-medium">
                Guest accounts must provide a real name.
              </span>
            </p>
          </div>
          <button
            onClick={() => setIsGuestWarningVisible(false)}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors"
          >
            OK, I'll update my name
          </button>
        </div>
      </Modal>

      {/* ══════ VALIDATION MODAL ══════ */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-red-600">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span>Complete Required Fields</span>
          </div>
        }
        open={isValidationModalVisible}
        onCancel={() => setIsValidationModalVisible(false)}
        centered
        footer={[
          <button
            key="ok"
            onClick={() => setIsValidationModalVisible(false)}
            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Got It
          </button>,
        ]}
      >
        <div className="space-y-2.5 mt-4">
          <p className="text-gray-500 text-sm mb-3">
            Please fill in the following required fields:
          </p>
          {validateRequiredFields().map((error, index) => {
            const icons = {
              name: UserIcon,
              phone: PhoneIcon,
              address: MapPinIcon,
              payment: CreditCardIcon,
            };
            const labels = {
              name: "Recipient Name",
              phone: "Contact Number",
              address: "Delivery Address",
              payment: "Payment Method",
            };
            const Icon = icons[error.field] || ExclamationTriangleIcon;
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-2.5 bg-red-50 rounded-xl border border-red-100"
              >
                <Icon className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-sm font-medium text-red-700">
                  {labels[error.field] || "Required Field"}
                </span>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* ══════ PAYMENT MODAL ══════ */}
      {!isAgent && (
        <Modal
          open={isPaymentModalVisible}
          onCancel={() => {
            if (paymentStatus === "input") {
              if (initialDelayRef.current) clearTimeout(initialDelayRef.current);
              if (pollingRef.current) clearInterval(pollingRef.current);
              if (countdownRef.current) clearInterval(countdownRef.current);
              setIsPaymentModalVisible(false);
              setPaymentStatus("idle");
            }
          }}
          footer={null}
          closable={paymentStatus === "input"}
          centered
          width={500}
          styles={{ body: { padding: "20px 24px" } }}
        >
          <div className="space-y-5">
            {/* Header */}
            <div className="text-center">
              <img
                src={frankoLogo}
                alt="Franko Trading"
                className="h-10 mx-auto mb-2 object-contain"
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <p className="text-sm font-bold text-gray-700 tracking-tight">
                Franko Trading Limited
              </p>
            </div>

            {/* Amount card */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-4 text-center text-white shadow-lg shadow-green-200">
              <p className="text-xs font-semibold text-green-200 uppercase tracking-wider mb-1">
                You will be charged
              </p>
              <p className="text-3xl font-black">
                {formatGHS(calculateDisplayTotalWithCharge())}
              </p>
              <p className="text-xs text-green-200 mt-1.5">Ref: {currentOrderId}</p>
            </div>

            {/* INPUT */}
            {paymentStatus === "input" && (
              <>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-black">
                        1
                      </span>
                      Mobile Money Number
                    </label>
                    <Input
                      placeholder="233XXXXXXXXX"
                      value={momoNumber}
                      onChange={handleMomoNumberChange}
                      prefix={<PhoneIcon className="w-4 h-4 text-gray-400" />}
                      size="large"
                      maxLength={12}
                      className="rounded-xl font-bold text-lg"
                      style={{ fontSize: "18px" }}
                    />
                    <div className="mt-2 min-h-[20px]">
                      {startsWithZeroAfter233() && (
                        <p className="text-xs text-red-500 font-medium">
                          Do not begin the number with 0 after 233
                        </p>
                      )}
                      {momoNumber.length === 12 &&
                        !isValidMomoNumber() &&
                        !startsWithZeroAfter233() && (
                          <p className="text-xs text-red-500 font-medium">
                            Please enter a valid 9-digit number after 233
                          </p>
                        )}
                      {isValidMomoNumber() && (
                        <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                          <CheckCircleIcon className="w-3.5 h-3.5" /> Valid number
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-black">
                        2
                      </span>
                      Select Network
                    </label>
                    <Radio.Group
                      value={selectedNetwork}
                      onChange={(e) => setSelectedNetwork(e.target.value)}
                      className="w-full"
                    >
                      <div className="space-y-2">
                        {[
                          {
                            value: "mtn",
                            logo: mtnLogo,
                            name: "MTN",
                            sub: "Mobile Money",
                            selectedBg: "bg-yellow-50 border-yellow-400",
                            check: "text-yellow-600",
                          },
                          {
                            value: "vodafone",
                            logo: vodafoneLogo,
                            name: "Vodafone",
                            sub: "Vodafone Cash",
                            selectedBg: "bg-red-50 border-red-400",
                            check: "text-red-500",
                          },
                          {
                            value: "airteltigo",
                            logo: airteltigoLogo,
                            name: "AirtelTigo",
                            sub: "AirtelTigo Money",
                            selectedBg: "bg-blue-50 border-blue-400",
                            check: "text-blue-500",
                          },
                        ].map((net) => (
                          <label
                            key={net.value}
                            className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm ${
                              selectedNetwork === net.value
                                ? net.selectedBg
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <Radio value={net.value} />
                            <div className="flex items-center gap-3 ml-3 flex-1">
                              <img
                                src={net.logo}
                                alt={net.name}
                                className="h-9 w-9 object-contain rounded-lg"
                                onError={(e) => { e.target.style.display = "none"; }}
                              />
                              <div>
                                <p className="text-sm font-bold text-gray-800">{net.name}</p>
                                <p className="text-xs text-gray-400">{net.sub}</p>
                              </div>
                            </div>
                            {selectedNetwork === net.value && (
                              <CheckCircleSolid className={`w-5 h-5 ${net.check}`} />
                            )}
                          </label>
                        ))}
                      </div>
                    </Radio.Group>
                  </div>
                </div>

                <button
                  onClick={handlePayNow}
                  disabled={!isValidMomoNumber() || !selectedNetwork || payButtonLoading}
                  className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all duration-300 shadow-md ${
                    !isValidMomoNumber() || !selectedNetwork || payButtonLoading
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 hover:shadow-lg active:scale-[0.98]"
                  }`}
                >
                  {payButtonLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Sending request…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <CreditCardIcon className="w-5 h-5" />
                      Pay {formatGHS(calculateDisplayTotalWithCharge())}
                    </span>
                  )}
                </button>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                  <p className="text-xs font-bold text-blue-800 mb-1.5">What happens next?</p>
                  <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
                    <li>You'll receive a payment prompt on your phone</li>
                    <li>Enter your MoMo PIN to approve the payment</li>
                    <li>We check for confirmation every 5 seconds</li>
                    <li>Your order processes immediately after payment</li>
                  </ol>
                </div>
              </>
            )}

            {/* PENDING */}
            {paymentStatus === "pending" && (
              <div className="text-center space-y-4 py-4">
                <div className="relative flex items-center justify-center mx-auto w-24 h-24">
                  <div className="absolute inset-0 border-4 border-green-100 rounded-full" />
                  <div className="absolute inset-0 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                  <PhoneIcon className="w-8 h-8 text-green-600 animate-pulse" />
                </div>
                <div>
                  <p className="font-black text-gray-800 text-lg">Awaiting Approval</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Approve the payment prompt on your phone
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-left space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Number</span>
                    <span className="font-bold text-gray-800">{momoNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Network</span>
                    <span className="font-bold text-gray-800">
                      {selectedNetwork?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-black text-green-700">
                      {formatGHS(calculateDisplayTotalWithCharge())}
                    </span>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-semibold text-green-700">
                      Checking for payment…
                    </p>
                    <p className="text-xs font-black text-green-800">{timeoutCountdown}s</p>
                  </div>
                  <div className="w-full bg-green-100 rounded-full h-1.5">
                    <div
                      className="bg-green-600 h-1.5 rounded-full transition-all duration-1000"
                      style={{ width: `${(timeoutCountdown / 60) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUCCESS */}
            {paymentStatus === "success" && (
              <div className="text-center space-y-4 py-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircleSolid className="w-12 h-12 text-green-500" />
                </div>
                <p className="font-black text-green-700 text-2xl">Payment Confirmed!</p>
                <p className="text-gray-500 text-sm">Processing your order now…</p>
                <div className="animate-pulse flex justify-center">
                  <div className="h-1 w-32 bg-green-300 rounded-full" />
                </div>
              </div>
            )}

            {/* FAILED */}
            {paymentStatus === "failed" && (
              <div className="text-center space-y-4 py-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <XCircleIcon className="w-12 h-12 text-red-500" />
                </div>
                <p className="font-black text-red-600 text-2xl">Payment Failed</p>
                <p className="text-gray-500 text-sm">Redirecting you…</p>
                <div className="animate-spin h-6 w-6 border-4 border-red-400 border-t-transparent rounded-full mx-auto" />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ══════ APPROVAL GUIDE MODAL ══════ */}
      <Modal
        open={isApprovalGuideVisible}
        onCancel={undefined}
        footer={null}
        closable={false}
        centered
        width={520}
        styles={{ body: { padding: "24px" } }}
      >
        {netCfg && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border-2"
                style={{ backgroundColor: netCfg.bg, borderColor: netCfg.border }}
              >
                <img
                  src={netCfg.logo}
                  alt={netCfg.label}
                  className="w-8 h-8 object-contain"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border"
                    style={{
                      backgroundColor: netCfg.bg,
                      borderColor: netCfg.border,
                      color: netCfg.color,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: netCfg.color }}
                    />
                    Payment Pending
                  </span>
                </div>
                <h3 className="text-lg font-black text-gray-900 leading-tight">
                  Approve Your Payment
                </h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  We haven't received confirmation yet. Please approve manually.
                </p>
              </div>
            </div>

            {/* Amount + number */}
            <div
              className="rounded-xl border px-4 py-3 flex items-center justify-between"
              style={{ backgroundColor: netCfg.bg, borderColor: netCfg.border }}
            >
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                  Amount Due
                </p>
                <p className="text-xl font-black" style={{ color: netCfg.color }}>
                  {formatGHS(calculateDisplayTotalWithCharge())}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                  Number
                </p>
                <p className="text-sm font-bold text-gray-800">{momoNumber}</p>
              </div>
            </div>

            {/* USSD */}
            <div
              className="flex items-center gap-3 rounded-xl border px-4 py-3"
              style={{ backgroundColor: netCfg.bg, borderColor: netCfg.border }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${netCfg.color}20` }}
              >
                <PhoneIcon className="w-4 h-4" style={{ color: netCfg.color }} />
              </div>
              <div className="flex-1">
                <p
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: netCfg.color }}
                >
                  Quick Dial
                </p>
                <p
                  className="text-xl font-black font-mono"
                  style={{ color: netCfg.color }}
                >
                  {netCfg.ussd}
                </p>
              </div>
              <ArrowPathIcon className="w-4 h-4 text-gray-400" />
            </div>

            {/* Steps */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-800">Step-by-step approval</p>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: netCfg.bg,
                    borderColor: netCfg.border,
                    color: netCfg.color,
                  }}
                >
                  {netCfg.steps.length} steps
                </span>
              </div>
              <div className="p-4 space-y-0">
                {netCfg.steps.map((step, idx) => {
                  const isLast = idx === netCfg.steps.length - 1;
                  return (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-black"
                          style={{ backgroundColor: isLast ? netCfg.color : "#059669" }}
                        >
                          {step.num}
                        </div>
                        {!isLast && (
                          <div className="w-0.5 flex-1 min-h-[16px] my-1 rounded-full bg-gray-200" />
                        )}
                      </div>
                      <div className={`flex-1 pb-3 ${isLast ? "pb-0" : ""}`}>
                        <p
                          className={`text-sm leading-snug pt-0.5 ${
                            isLast ? "font-bold" : "font-medium text-gray-700"
                          }`}
                          style={isLast ? { color: netCfg.color } : {}}
                        >
                          {step.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tip */}
            <div className="flex gap-3 bg-amber-50 border border-amber-100 rounded-xl p-3.5">
              <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-amber-600 text-sm">💡</span>
              </div>
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                {netCfg.tip}
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Confirm */}
              <button
                onClick={handleManualConfirm}
                disabled={verifyingPayment}
                className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg ${
                  verifyingPayment
                    ? "bg-gray-400 cursor-wait"
                    : "bg-green-600 hover:bg-green-700 hover:shadow-xl active:scale-[0.98]"
                }`}
                style={
                  verifyingPayment ? {} : { boxShadow: "0 4px 20px rgba(5,150,105,0.35)" }
                }
              >
                {verifyingPayment ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Verifying Payment…
                  </>
                ) : (
                  <>
                    <CheckCircleSolid className="w-5 h-5" />
                    I've Approved — Confirm Payment
                  </>
                )}
              </button>

              {/* Cancel — now opens the action dialog */}
              <button
                onClick={handleCancelFromGuide}
                disabled={verifyingPayment}
                className="w-full py-3 rounded-xl font-semibold text-red-500 text-sm border border-red-100 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <XCircleIcon className="w-4 h-4" />
                Cancel Order
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════════════
          ACTION CONFIRMATION DIALOG
          • mode = "cancel"        → shown when "Cancel Order" is clicked
          • mode = "not_confirmed" → shown when "I've Approved" verification fails
      ══════════════════════════════════════════════════════════ */}
      <PaymentActionDialog
        open={actionDialog.open}
        mode={actionDialog.mode}
        verifying={verifyingPayment}
        onRetry={handleDialogRetry}
        onCancel={handleDialogCancel}
        onClose={() => !verifyingPayment && setActionDialog((d) => ({ ...d, open: false }))}
      />
    </div>
  );
};

export default Checkout;