// src/pages/Checkout.jsx
import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
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
import { clearCart } from "../Redux/Slice/cartSlice";
import { message, Card, Typography, Radio, Divider, Modal, Input, Select } from "antd";
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
} from "@heroicons/react/24/outline";

// Import logos from assets folder
import frankoLogo from "../assets/frankoIcon.png";
import mtnLogo from "../assets/momo.png";
import vodafoneLogo from "../assets/voda.jpeg";
import airteltigoLogo from "../assets/AT.png";

const { Text, Title } = Typography;
const { Option } = Select;

// ==================== CONSTANTS ====================

const SERVICE_CHARGE_RATE = 0.01; // 1%
const SERVICE_CHARGE_CAP = 20.0;  // Fixed ₵20.00 cap for amounts above ₵2,000

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format amount with commas for thousands
 */
const formatCurrency = (amount, decimals = 2) => {
  const num = parseFloat(amount) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format amount with Ghanaian Cedi symbol and commas
 */
const formatGHS = (amount) => {
  return `₵${formatCurrency(amount, 2)}`;
};

// ==================== MAIN COMPONENT ====================

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pollingRef = useRef(null);
  const countdownRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [timeoutCountdown, setTimeoutCountdown] = useState(25);

  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: "",
    fee: 0,
    feeDisplay: "",
  });

  const [isValidationModalVisible, setIsValidationModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [pendingCheckoutDetails, setPendingCheckoutDetails] = useState(null);
  const [pendingAddressDetails, setPendingAddressDetails] = useState(null);

  const [momoNumber, setMomoNumber] = useState("233");
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [payButtonLoading, setPayButtonLoading] = useState(false);

  // ==================== STORAGE HELPERS ====================

  const safeGet = (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      return v == null ? fallback : v;
    } catch {
      return fallback;
    }
  };

  const getCartItems = () => {
    const stored = safeGet("cart", []);
    return Array.isArray(stored) ? stored : [];
  };

  const [cartItems, setCartItems] = useState(getCartItems);

  const getCartId = () =>
    localStorage.getItem("cartId") || `cart_${Date.now()}`;

  const customerData = safeGet("customer", null);

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

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (customerData) {
      setCustomerName(
        `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim()
      );
      setCustomerNumber(
        customerData.contactNumber || customerData.ContactNumber || ""
      );
    }

    try {
      const storedInfo = safeGet("deliveryInfo", {});
      const addr = storedInfo?.address || customerData?.address || "";
      const fee = storedInfo?.fee ?? 0;
      const feeDisplay = storedInfo?.feeDisplay || storedInfo?.feeText || "";
      setDeliveryInfo({ address: addr, fee, feeDisplay });
      setDeliveryFee(Number(fee) || 0);
    } catch {}
  }, []);

  useEffect(() => {
    if (
      deliveryInfo?.fee !== undefined &&
      !Number.isNaN(Number(deliveryInfo.fee))
    ) {
      setDeliveryFee(Number(deliveryInfo.fee));
    }
  }, [deliveryInfo]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "cart") {
        setCartItems(getCartItems());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    const intervalId = setInterval(() => {
      setCartItems(getCartItems());
    }, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // ==================== MOMO NUMBER HANDLERS ====================

  const handleMomoNumberChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^0-9]/g, "");

    if (value.startsWith("0")) {
      value = "233" + value.slice(1);
    }

    if (!value.startsWith("233")) {
      value = "233";
    }

    if (value.length > 12) {
      value = value.slice(0, 12);
    }

    setMomoNumber(value);
  };

  const isValidMomoNumber = () => {
    return /^233[1-9]\d{8}$/.test(momoNumber);
  };

  const startsWithZeroAfter233 = () => {
    return momoNumber.length > 3 && momoNumber[3] === "0";
  };

  // ==================== CALCULATION FUNCTIONS ====================

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const itemTotal = item.total || item.price * (item.quantity || 1) || 0;
      return total + itemTotal;
    }, 0);
  };

  const calculateTotalAmount = () => {
    return calculateSubtotal() + deliveryFee;
  };

  /**
   * Service charge logic (DISPLAY ONLY — backend handles the actual charge):
   * - Amount ≤ ₵2,000 → 1% of the total
   * - Amount > ₵2,000 → fixed flat ₵20.00 (capped, no further increase)
   */
  const calculateServiceCharge = () => {
    const baseAmount = calculateTotalAmount();
    if (baseAmount > 2000) {
      return SERVICE_CHARGE_CAP; // flat ₵20.00
    }
    return baseAmount * SERVICE_CHARGE_RATE; // 1%
  };

  /**
   * Display-only total (amount + service charge) — shown to user so they
   * know what the MoMo prompt will look like. NOT sent to backend.
   */
  const calculateDisplayTotalWithCharge = () => {
    return calculateTotalAmount() + calculateServiceCharge();
  };

  // ==================== ORDER GENERATION ====================

  const generateOrderId = () => {
    const prefix = "ORD";
    const timestamp = new Date().getTime() % 10000;
    const randomNum = Math.floor(Math.random() * 1000);
    return `${prefix}-${timestamp}-${randomNum}`;
  };

  // ==================== API CALLS WITH RETRY ====================

  const dispatchOrderCheckoutWithRetry = async (orderId, checkoutDetails, maxRetries = 3) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const checkoutPayload = {
          cartId: getCartId(),
          ...checkoutDetails,
        };
        const result = await dispatch(checkOutOrder(checkoutPayload)).unwrap();
        return result;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
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
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
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

  const startPolling = (orderId, checkoutDetails, addressDetails) => {
    let elapsed = 0;
    setTimeoutCountdown(25);

    countdownRef.current = setInterval(() => {
      setTimeoutCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    pollingRef.current = setInterval(async () => {
      elapsed += 1000;

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
            message.success("Payment and order processed successfully!");

            setTimeout(() => {
              setIsPaymentModalVisible(false);
              navigate(`/order-success/${orderId}`);
            }, 1500);
          } catch (e) {
            message.error(
              "Payment succeeded, but we could not process your order. Please contact support."
            );
          }
        }
      } catch {}

      if (elapsed >= 25000) {
        clearInterval(pollingRef.current);
        clearInterval(countdownRef.current);
        setPaymentStatus("failed");

        setTimeout(() => {
          setIsPaymentModalVisible(false);
          localStorage.removeItem("checkoutDetails");
          localStorage.removeItem("orderAddressDetails");
          message.error("Payment was cancelled or failed.");
          navigate("/order-cancelled");
        }, 2000);
      }
    }, 1000);
  };

  // ==================== PAYMENT HANDLERS ====================

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const validateRequiredFields = () => {
    const errors = [];
    if (!customerName?.trim()) {
      errors.push({ field: "name", message: "Recipient name is required" });
    }
    if (!customerNumber?.trim()) {
      errors.push({ field: "phone", message: "Recipient contact number is required" });
    }
    if (!selectedAddress?.trim()) {
      errors.push({ field: "address", message: "Delivery address is required" });
    }
    if (!paymentMethod) {
      errors.push({ field: "payment", message: "Payment method is required" });
    }
    return errors;
  };

  const getSafeCustomerDetails = () => {
    let name = customerName?.trim();
    let number = customerNumber?.trim();

    if (!name && customerData) {
      name = `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim();
    }
    if (!number && customerData) {
      number = customerData.contactNumber || customerData.ContactNumber || "";
    }
    if (!name) {
      name = `Guest ${Math.floor(1000 + Math.random() * 9000)}`;
    }
    if (!number) {
      number = "0000000000";
    }

    return { name, number };
  };

  const handleCheckout = async () => {
    const { name: safeName, number: safeNumber } = getSafeCustomerDetails();
    setCustomerName(safeName);
    setCustomerNumber(safeNumber);

    const validationErrors = validateRequiredFields();
    if (validationErrors.length > 0) {
      setIsValidationModalVisible(true);
      return;
    }

    const orderId = generateOrderId();
    setCurrentOrderId(orderId);
    const orderDate = new Date().toISOString();
    // Send only the base total (without service charge) to backend
    const totalAmount = calculateTotalAmount();
    const cartId = getCartId();

    const checkoutDetails = {
      Cartid: cartId,
      customerId,
      orderCode: orderId,
      PaymentMode: paymentMethod,
      PaymentAccountNumber: safeNumber || "0000000000",
      customerAccountType,
      paymentService: "Mtn",
      totalAmount, // ← base amount only, NO service charge
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
        localStorage.setItem("checkoutDetails", JSON.stringify(checkoutDetails));
        localStorage.setItem("orderAddressDetails", JSON.stringify(addressDetails));
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

    try {
      setPayButtonLoading(true);
      setPaymentStatus("pending");

      // Send only the base amount to debitCustomer — backend adds service charge itself
      await dispatch(
        debitCustomer({
          refNo: currentOrderId,
          msisdn: momoNumber,
          amount: calculateTotalAmount(), // ← base amount only, NOT including service charge
          network: selectedNetwork,
          narration: "franko",
        })
      ).unwrap();

      startPolling(currentOrderId, pendingCheckoutDetails, pendingAddressDetails);
    } catch (error) {
      setPaymentStatus("failed");

      setTimeout(() => {
        setIsPaymentModalVisible(false);
        message.error("Payment initiation failed.");
        navigate("/order-cancelled");
      }, 2000);
    } finally {
      setPayButtonLoading(false);
    }
  };

  // ==================== RENDER HELPERS ====================

  const renderImage = (imagePath) => {
    if (!imagePath) {
      return (
        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-gray-400 text-xs">No Image</span>
        </div>
      );
    }
    const backendBaseURL = "https://ct002.frankotrading.com:444";
    const imageUrl = `${backendBaseURL}/Media/Products_Images/${imagePath
      .split("\\")
      .pop()}`;
    return (
      <img
        src={imageUrl}
        alt="Product"
        className="w-16 h-16 object-cover rounded-lg"
        onError={(e) => {
          e.target.style.display = "none";
          if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
        }}
      />
    );
  };

  // Helper to build service charge label text
  const getServiceChargeLabel = () => {
    const baseAmount = calculateTotalAmount();
    if (baseAmount > 2000) {
      return "Momo Service Charge :";
    }
    return "Momo Service Charge (1%):";
  };

  // ==================== EMPTY CART RENDER ====================

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="p-4 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="flex items-center justify-center mb-4">
          <ShoppingBagIcon className="w-12 h-12 text-gray-400 mr-3" />
          <h2 className="text-2xl font-bold text-gray-700">Your cart is empty</h2>
        </div>
        <p className="text-gray-500 mb-6">
          Add some items to your cart to proceed with checkout.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate("/")}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================

  return (
    <div className="p-4 mx-auto">
      {loading && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="animate-spin h-10 w-10 border-4 border-t-4 border-gray-300 rounded-full"></div>
        </div>
      )}

      <div className="flex items-center mb-2 w-full">
        <h2 className="text-md md:text-xl font-bold text-gray-700 flex items-center gap-2">
          <ShoppingBagIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
          Checkout ({cartItems.length} items)
        </h2>
        <div className="flex-grow border-t border-gray-300 mx-4"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BILLING INFORMATION SECTION */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Billing Information</h2>
              <div className="relative mt-1">
                <div className="absolute w-24 h-1 bg-red-300 rounded"></div>
                <div className="border-b border-gray-300"></div>
              </div>
            </div>
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
            />
          </Card>
        </div>

        {/* ORDER SUMMARY SECTION */}
        <div className="lg:col-span-2">
          <Card bordered={false} className="rounded-xl shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Order Summary</h2>
              <div className="relative mt-1">
                <div className="absolute w-24 h-1 bg-red-300 rounded"></div>
                <div className="border-b border-gray-300"></div>
              </div>
            </div>

            {/* CART ITEMS LIST */}
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {cartItems.map((item, index) => (
                <div
                  key={item.productId || index}
                  className="flex justify-between items-start py-4 gap-4"
                >
                  <div className="flex gap-4 flex-1">
                    <div className="w-16 h-16 flex-shrink-0 relative">
                      {renderImage(item.imagePath)}
                      <div className="w-16 h-16 bg-gray-200 rounded-lg items-center justify-center hidden">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    </div>
                    <div className="text-sm flex-1">
                      <p className="font-medium text-gray-800 mb-1">
                        {item.productName || "Product Name"}
                      </p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity || 1}</p>
                      <p className="text-xs text-gray-500">{formatGHS(item.price || 0)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-md font-semibold text-gray-800">
                      {formatGHS(item.total || item.price * (item.quantity || 1) || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* SUBTOTAL */}
            <div className="flex justify-between items-center pt-4 border-t text-md font-medium text-gray-900">
              <span>Subtotal</span>
              <span>{formatGHS(calculateSubtotal())}</span>
            </div>

            {/* CHARGES BREAKDOWN */}
            <div className="mt-4 space-y-2 text-sm">
              {/* Shipping Fee */}
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

              {/* Service Charge for Mobile Money (display only) */}
              {paymentMethod === "Mobile Money" && (
                <div className="flex justify-between items-center bg-blue-50 p-2 rounded-lg">
                  <Text className="text-gray-700 font-medium">{getServiceChargeLabel()}</Text>
                  <Text className="text-gray-700 font-medium">{formatGHS(calculateServiceCharge())}</Text>
                </div>
              )}

              {/* TOTAL AMOUNT */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-300 bg-gradient-to-r from-red-50 to-orange-50 p-3 rounded-lg">
                <Text className="text-red-600 font-bold text-lg">Total Amount:</Text>
                <Text className="text-red-600 font-bold text-lg">
                  {paymentMethod === "Mobile Money" 
                    ? formatGHS(calculateDisplayTotalWithCharge())
                    : formatGHS(calculateTotalAmount())
                  }
                </Text>
              </div>

              {/* Informational note for Mobile Money */}
              {paymentMethod === "Mobile Money" && (
                <p className="text-xs text-gray-500 italic text-center mt-1">
                  * Service charge is applied by your mobile money provider. You will be prompted to pay {formatGHS(calculateDisplayTotalWithCharge())} on your phone.
                </p>
              )}
            </div>

            <Divider className="my-6" />

            {/* PAYMENT METHOD SELECTION */}
            <div>
              <Text strong className="text-sm block mb-3">Payment Method</Text>
              <Radio.Group
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
                className="flex flex-col gap-3"
              >
                {(isAgent || isFreeDelivery || (deliveryFee > 0 && !isNADelivery)) && (
                  <Radio value="Cash on Delivery" className="text-sm">Cash on Delivery</Radio>
                )}
                {!isAgent && (
                  <Radio value="Mobile Money" className="text-sm">Mobile Money</Radio>
                )}
                {isAgent && (
                  <>
                    <Radio value="Pick Up" className="text-sm">Pick Up</Radio>
                    <Radio value="Paid Already" className="text-sm">Paid Already</Radio>
                  </>
                )}
              </Radio.Group>
            </div>

            {/* CHECKOUT BUTTON */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className={`relative w-full text-white font-semibold text-base py-4 rounded-xl 
                  transition-all duration-500 ease-in-out transform overflow-hidden
                  shadow-lg focus:outline-none focus:ring-4 focus:ring-opacity-50
                  ${
                    loading
                      ? "bg-gray-400 cursor-wait"
                      : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-[1.02] hover:shadow-xl focus:ring-green-300 active:scale-[0.98]"
                  }`}
              >
                {loading && (
                  <div className="absolute inset-0 bg-gray-500 bg-opacity-20 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white animate-pulse opacity-20"></div>
                  </div>
                )}
                <div className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      <span>Processing Order...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBagIcon className="w-5 h-5" />
                      <span>Place Order</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* VALIDATION ERROR MODAL */}
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
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Got It
          </button>,
        ]}
      >
        <div className="space-y-3 mt-4">
          <p className="text-gray-600 mb-4">
            Please fill in the following required fields to place your order:
          </p>
          {validateRequiredFields().map((error, index) => {
            const getIcon = (field) => {
              switch (field) {
                case "name": return <UserIcon className="w-4 h-4 text-red-500" />;
                case "phone": return <PhoneIcon className="w-4 h-4 text-red-500" />;
                case "address": return <MapPinIcon className="w-4 h-4 text-red-500" />;
                case "payment": return <CreditCardIcon className="w-4 h-4 text-red-500" />;
                default: return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
              }
            };

            const getFieldName = (field) => {
              switch (field) {
                case "name": return "Recipient Name";
                case "phone": return "Contact Number";
                case "address": return "Delivery Address";
                case "payment": return "Payment Method";
                default: return "Required Field";
              }
            };

            return (
              <div key={index} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg border border-red-200">
                {getIcon(error.field)}
                <span className="text-sm font-medium text-red-700">{getFieldName(error.field)}</span>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* PAYMENT MODAL (for Mobile Money) */}
      {!isAgent && (
        <Modal
          open={isPaymentModalVisible}
          onCancel={() => {
            if (paymentStatus === "input") {
              clearInterval(countdownRef.current);
              setIsPaymentModalVisible(false);
              setPaymentStatus("idle");
            }
          }}
          footer={null}
          closable={paymentStatus === "input"}
          centered
          width={480}
        >
          <div className="py-2 space-y-5">
            {/* HEADER */}
            <div className="text-center mb-1">
              <img 
                src={frankoLogo} 
                alt="Franko Trading" 
                className="h-12 mx-auto mb-2"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <p className="text-md text-gray-600 font-black">Franko Trading Limited</p>
            </div>

            {/* AMOUNT DISPLAY — shows total WITH service charge so user knows what to expect */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-2 rounded-xl text-center border border-green-200">
              <p className="text-gray-600 text-sm font-medium">You will be prompted to pay</p>
              <p className="text-xl font-bold text-green-700 mt-1">
                {formatGHS(calculateDisplayTotalWithCharge())}
              </p>
              {calculateServiceCharge() > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  (Includes {formatGHS(calculateServiceCharge())} service fee
                  {calculateTotalAmount() > 2000 ? " " : " "})
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">Order Ref: {currentOrderId}</p>
            </div>

            {/* INPUT STAGE */}
            {paymentStatus === "input" && (
              <>
                {/* STEP 1: PHONE NUMBER */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-sm font-bold text-gray-800 block mb-2 flex items-center gap-2">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
                    Enter Your Mobile Money Number
                  </label>
                  <Input
                    placeholder="233XXXXXXXXX"
                    value={momoNumber}
                    onChange={handleMomoNumberChange}
                    prefix={<PhoneIcon className="w-4 h-4 text-gray-400" />}
                    size="large"
                    maxLength={12}
                    className="rounded-lg font-semibold text-lg"
                    style={{ fontSize: '18px' }}
                  />
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-600">
                      Enter the phone number registered for Mobile Money
                    </p>

                    {startsWithZeroAfter233() && (
                      <p className="text-xs text-red-500 font-medium animate-pulse">
                        ⚠️ Do not begin the number with 0 after 233
                      </p>
                    )}

                    {momoNumber.length === 12 &&
                      !isValidMomoNumber() &&
                      !startsWithZeroAfter233() && (
                        <p className="text-xs text-red-500 font-medium animate-pulse">
                          ⚠️ Please enter a valid 9-digit number after 233
                        </p>
                    )}

                    {isValidMomoNumber() && (
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <CheckCircleIcon className="w-4 h-4" />
                        Valid mobile money number
                      </p>
                    )}
                  </div>
                </div>

                {/* STEP 2: NETWORK SELECTION */}
                <div className="bg-gray-50 p-2 rounded-lg">
                  <label className="text-sm font-bold text-gray-800 block mb-2 flex items-center gap-2">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
                    Select your Mobile Money Network
                  </label>
                  
                  <Radio.Group 
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value)}
                    className="w-full"
                  >
                    <div className="space-y-3">
                      {/* MTN */}
                      <label 
                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                          selectedNetwork === "mtn"
                            ? "border-yellow-500 bg-yellow-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <Radio value="mtn" />
                        <div className="flex items-center gap-3 ml-3 flex-1">
                          <img 
                            src={mtnLogo} 
                            alt="MTN" 
                            className="h-10 w-10 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-10 h-10 rounded-full bg-yellow-400 items-center justify-center hidden">
                            <span className="text-xs font-bold">MTN</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">MTN</p>
                            <p className="text-xs text-gray-500">MTN Mobile Money</p>
                          </div>
                        </div>
                        {selectedNetwork === "mtn" && (
                          <CheckCircleIcon className="w-5 h-5 text-yellow-600" />
                        )}
                      </label>

                      {/* VODAFONE */}
                      <label 
                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                          selectedNetwork === "vodafone"
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <Radio value="vodafone" />
                        <div className="flex items-center gap-3 ml-3 flex-1">
                          <img 
                            src={vodafoneLogo} 
                            alt="Vodafone" 
                            className="h-10 w-10 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-10 h-10 rounded-full bg-red-500 items-center justify-center hidden">
                            <span className="text-xs font-bold text-white">VOD</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">Vodafone</p>
                            <p className="text-xs text-gray-500">Vodafone Cash</p>
                          </div>
                        </div>
                        {selectedNetwork === "vodafone" && (
                          <CheckCircleIcon className="w-5 h-5 text-red-600" />
                        )}
                      </label>

                      {/* AIRTELTIGO */}
                      <label 
                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                          selectedNetwork === "airteltigo"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <Radio value="airteltigo" />
                        <div className="flex items-center gap-3 ml-3 flex-1">
                          <img 
                            src={airteltigoLogo} 
                            alt="AirtelTigo" 
                            className="h-10 w-10 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center hidden">
                            <span className="text-xs font-bold text-white">AT</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">AirtelTigo</p>
                            <p className="text-xs text-gray-500">AirtelTigo Money</p>
                          </div>
                        </div>
                        {selectedNetwork === "airteltigo" && (
                          <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                        )}
                      </label>
                    </div>
                  </Radio.Group>
                </div>

                {/* PAY BUTTON — displays total with charge, but sends base amount */}
                <button
                  onClick={handlePayNow}
                  disabled={!isValidMomoNumber() || !selectedNetwork || payButtonLoading}
                  className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all duration-300 ${
                    !isValidMomoNumber() || !selectedNetwork || payButtonLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:shadow-lg active:scale-[0.98]"
                  }`}
                >
                  {payButtonLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Sending payment request...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <CreditCardIcon className="w-6 h-6" />
                      Pay {formatGHS(calculateDisplayTotalWithCharge())}
                    </span>
                  )}
                </button>

                {/* INSTRUCTIONS */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-800 mb-2">📱 What happens next?</p>
                  <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                    <li>You will receive a payment prompt on your phone</li>
                
                    <li>Enter your Mobile Money PIN to approve</li>
                    <li>Wait for confirmation (usually takes 10-25 seconds)</li>
                    <li>Your order will be processed immediately after payment</li>
                  </ol>
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    💡 Tip: Keep your phone nearby to approve the payment
                  </p>
                </div>
              </>
            )}

            {/* PENDING STAGE */}
            {paymentStatus === "pending" && (
              <div className="text-center space-y-4 py-6">
                <div className="relative flex items-center justify-center">
                  <div className="animate-spin h-20 w-20 border-4 border-green-500 border-t-transparent rounded-full"></div>
                  <PhoneIcon className="absolute w-8 h-8 text-green-600 animate-pulse" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg">Payment Request Sent!</p>
                  <p className="text-gray-600 mt-2">
                    📱 Check your phone now
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    A payment prompt has been sent to
                  </p>
                  <div className="bg-gray-100 rounded-lg p-3 mt-3 space-y-1">
                    <p className="text-sm font-semibold text-gray-700">
                      {momoNumber}
                    </p>
                    <p className="text-xs text-gray-600">
                      Network: {selectedNetwork?.toUpperCase()}
                    </p>
                    <p className="text-sm font-bold text-green-700 mt-2">
                      Amount: {formatGHS(calculateDisplayTotalWithCharge())}
                    </p>
                    <p className="text-xs text-gray-500">
                      (includes {formatGHS(calculateServiceCharge())} service fee)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SUCCESS STAGE */}
            {paymentStatus === "success" && (
              <div className="text-center space-y-4 py-6">
                <div className="text-green-500 text-7xl animate-bounce">✅</div>
                <p className="font-bold text-green-600 text-2xl">Payment Successful!</p>
                <p className="text-gray-600">Your order is being processed...</p>
              </div>
            )}

            {/* FAILED STAGE */}
            {paymentStatus === "failed" && (
              <div className="text-center space-y-4 py-6">
                <div className="text-red-500 text-7xl">❌</div>
                <p className="font-bold text-red-600 text-2xl">Payment Failed</p>
                <p className="text-gray-600">The transaction was not completed</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Checkout;