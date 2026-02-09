// src/pages/Checkout.jsx
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  checkOutOrder,
  updateOrderDelivery,
} from "../Redux/Slice/orderSlice";
import { clearCart } from "../Redux/Slice/cartSlice";
import { message, Card, Typography, Radio, Divider,Modal  } from "antd";
import CheckoutForm from "../Component/CheckoutForm";
import locations from "../Component/Locations";
import {
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

const { Text, Title } = Typography;

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);

  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: "",
    fee: 0,
    feeDisplay: "",
  });

  const [isValidationModalVisible, setIsValidationModalVisible] =
    useState(false);

  // --- Encrypted localStorage helpers ---
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

  // ---- Initialize from customer + deliveryInfo once ----
  useEffect(() => {
    if (customerData) {
      setCustomerName(
        `${customerData.firstName || ""} ${
          customerData.lastName || ""
        }`.trim()
      );
      setCustomerNumber(
        customerData.contactNumber || customerData.ContactNumber || ""
      );
    }

    try {
      const storedInfo = safeGet("deliveryInfo", {});
      const addr =
        storedInfo?.address || customerData?.address || "";
      const fee = storedInfo?.fee ?? 0;
      const feeDisplay =
        storedInfo?.feeDisplay || storedInfo?.feeText || "";
      setDeliveryInfo({ address: addr, fee, feeDisplay });
      setDeliveryFee(Number(fee) || 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (
      deliveryInfo?.fee !== undefined &&
      !Number.isNaN(Number(deliveryInfo.fee))
    ) {
      setDeliveryFee(Number(deliveryInfo.fee));
    }
  }, [deliveryInfo]);

  // Monitor cart changes once
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

  // --- Shared helpers ---

  const calculateTotalAmount = () => {
    const subtotal = cartItems.reduce((total, item) => {
      const itemTotal =
        item.total || item.price * (item.quantity || 1) || 0;
      return total + itemTotal;
    }, 0);
    return subtotal + deliveryFee;
  };

  const generateOrderId = () => {
    const prefix = "ORD";
    const timestamp = new Date().getTime() % 10000;
    const randomNum = Math.floor(Math.random() * 1000);
    return `${prefix}-${timestamp}-${randomNum}`;
  };

  const dispatchOrderCheckoutWithRetry = async (
    orderId,
    checkoutDetails,
    maxRetries = 3
  ) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const checkoutPayload = {
          cartId: getCartId(),
          ...checkoutDetails,
        };
        const result = await dispatch(
          checkOutOrder(checkoutPayload)
        ).unwrap();
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
      `Checkout failed after ${maxRetries} attempts: ${
        lastError?.message || "Unknown error"
      }`
    );
  };

  const dispatchOrderAddressWithRetry = async (
    orderId,
    addressDetails,
    maxRetries = 3
  ) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await dispatch(
          updateOrderDelivery(addressDetails)
        ).unwrap();

        // Clear cart when address updated successfully
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
      `Address update failed after ${maxRetries} attempts: ${
        lastError?.message || "Unknown error"
      }`
    );
  };

  const processDirectCheckout = async (
    orderId,
    checkoutDetails,
    addressDetails
  ) => {
    await dispatchOrderCheckoutWithRetry(orderId, checkoutDetails);
    await dispatchOrderAddressWithRetry(orderId, addressDetails);
  };

  // --- Validation & main checkout ---

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const validateRequiredFields = () => {
    const errors = [];
    if (!customerName?.trim()) {
      errors.push({ field: "name", message: "Recipient name is required" });
    }
    if (!customerNumber?.trim()) {
      errors.push({
        field: "phone",
        message: "Recipient contact number is required",
      });
    }
    if (!selectedAddress?.trim()) {
      errors.push({
        field: "address",
        message: "Delivery address is required",
      });
    }
    if (!paymentMethod) {
      errors.push({
        field: "payment",
        message: "Payment method is required",
      });
    }
    return errors;
  };

  const getSafeCustomerDetails = () => {
    let name = customerName?.trim();
    let number = customerNumber?.trim();

    if (!name && customerData) {
      name = `${customerData.firstName || ""} ${
        customerData.lastName || ""
      }`.trim();
    }
    if (!number && customerData) {
      number =
        customerData.contactNumber || customerData.ContactNumber || "";
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
    const { name: safeName, number: safeNumber } =
      getSafeCustomerDetails();
    setCustomerName(safeName);
    setCustomerNumber(safeNumber);

    const validationErrors = validateRequiredFields();
    if (validationErrors.length > 0) {
      setIsValidationModalVisible(true);
      return;
    }

    const orderId = generateOrderId();
    const orderDate = new Date().toISOString();
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
      await processDirectCheckout(orderId, checkoutDetails, addressDetails);
      message.success("Your order has been placed successfully!");
      navigate("/order-received");
    } catch (error) {
      console.error("Checkout error:", error);
      message.error(
        error.message || "An error occurred during checkout."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderImage = (imagePath) => {
    if (!imagePath) {
      return (
        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-gray-400 text-xs">No Image</span>
        </div>
      );
    }
    const backendBaseURL = "https://fte002n1.salesmate.app";
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
          e.target.nextSibling.style.display = "flex";
        }}
      />
    );
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="p-4 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="flex items-center justify-center mb-4">
          <ShoppingBagIcon className="w-12 h-12 text-gray-400 mr-3" />
          <h2 className="text-2xl font-bold text-gray-700">
            Your cart is empty
          </h2>
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

  return (
    <div className="p-4 mx-auto">
      {loading && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="animate-spin h-10 w-10 border-4 border-t-4 border-gray-300 rounded-full"></div>
        </div>
      )}

      <div className="flex items-center mb-6 w-full">
        <h2 className="text-md md:text-xl font-bold text-gray-700 flex items-center gap-2">
          <ShoppingBagIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
          Checkout ({cartItems.length} items)
        </h2>
        <div className="flex-grow border-t border-gray-300 mx-4"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Billing Info */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Billing Information
              </h2>
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

        {/* Summary & Payment */}
        <div className="lg:col-span-2">
          <Card bordered={false} className="rounded-xl shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Order Summary
              </h2>
              <div className="relative mt-1">
                <div className="absolute w-24 h-1 bg-red-300 rounded"></div>
                <div className="border-b border-gray-300"></div>
              </div>
            </div>

            {/* Cart items */}
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
                        <span className="text-gray-400 text-xs">
                          No Image
                        </span>
                      </div>
                    </div>
                    <div className="text-sm flex-1">
                      <p className="font-medium text-gray-800 mb-1">
                        {item.productName || "Product Name"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity || 1}
                      </p>
                      <p className="text-xs text-gray-500">
                        ₵{(item.price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-md font-semibold text-gray-800">
                      ₵
                      {(
                        item.total ||
                        item.price * (item.quantity || 1) ||
                        0
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal & Total */}
            <div className="flex justify-between items-center pt-4 border-t text-md font-medium text-gray-900">
              <span>Subtotal</span>
              <span>
                ₵
                {cartItems
                  .reduce(
                    (acc, item) =>
                      acc +
                      (item.total ||
                        item.price * (item.quantity || 1) ||
                        0),
                    0
                  )
                  .toFixed(2)}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <Text>Shipping Fee:</Text>
                {isFreeDelivery ? (
                  <Text className="text-green-600 font-semibold">
                    FREE DELIVERY
                  </Text>
                ) : isNADelivery ? (
                  <Text type="warning" className="text-amber-600">
                    {isAgent
                      ? "Agent delivery"
                      : "Delivery charges apply"}
                  </Text>
                ) : deliveryFee > 0 ? (
                  <Text strong>₵{deliveryFee.toFixed(2)}</Text>
                ) : (
                  <Text type="warning" className="text-amber-600">
                    Select location for delivery fee
                  </Text>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <Text className="text-red-500 font-bold text-lg">
                  Total Amount:
                </Text>
                <Text className="text-red-500 font-bold text-lg">
                  ₵{calculateTotalAmount().toFixed(2)}
                </Text>
              </div>
            </div>

            <Divider className="my-6" />

            {/* Payment method */}
            <div>
              <Text strong className="text-sm block mb-3">
                Payment Method
              </Text>
              <Radio.Group
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
                className="flex flex-col gap-3"
              >
                {/* Non-agents: Cash on Delivery ONLY */}
                {!isAgent && (
                  <Radio value="Cash on Delivery" className="text-sm">
                    Cash on Delivery
                  </Radio>
                )}

                {/* Agents get their own options */}
                {isAgent && (
                  <>
                    <Radio value="Cash on Delivery" className="text-sm">
                      Cash on Delivery
                    </Radio>
                    <Radio value="Pick Up" className="text-sm">
                      Pick Up
                    </Radio>
                    <Radio value="Paid Already" className="text-sm">
                      Paid Already
                    </Radio>
                  </>
                )}
              </Radio.Group>
            </div>

            {/* Place order */}
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

      {/* Validation Modal */}
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
            Please fill in the following required fields to place your
            order:
          </p>
          {validateRequiredFields().map((error, index) => {
            const getIcon = (field) => {
              switch (field) {
                case "name":
                  return (
                    <UserIcon className="w-4 h-4 text-red-500" />
                  );
                case "phone":
                  return (
                    <PhoneIcon className="w-4 h-4 text-red-500" />
                  );
                case "address":
                  return (
                    <MapPinIcon className="w-4 h-4 text-red-500" />
                  );
                case "payment":
                  return (
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                  );
                default:
                  return (
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                  );
              }
            };

            const getFieldName = (field) => {
              switch (field) {
                case "name":
                  return "Recipient Name";
                case "phone":
                  return "Contact Number";
                case "address":
                  return "Delivery Address";
                case "payment":
                  return "Payment Method";
                default:
                  return "Required Field";
              }
            };

            return (
              <div
                key={index}
                className="flex items-center gap-3 p-2 bg-red-50 rounded-lg border border-red-200"
              >
                {getIcon(error.field)}
                <span className="text-sm font-medium text-red-700">
                  {getFieldName(error.field)}
                </span>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default Checkout;
