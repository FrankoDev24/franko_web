import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  checkOutOrder,
  updateOrderDelivery,
  saveCheckoutDetails,
  saveAddressDetails,
} from "../Redux/Slice/orderSlice";
import { getHubtelCallbackById } from "../Redux/Slice/paymentSlice";
import { clearCart } from "../Redux/Slice/cartSlice";
import { message, Card, Typography, Radio, Divider, Modal, Alert } from "antd";
import CheckoutForm from "../Component/CheckoutForm";
import locations from "../Component/Locations";
import { ShoppingBagIcon, ExclamationTriangleIcon, CreditCardIcon, MapPinIcon, UserIcon, PhoneIcon, XMarkIcon } from "@heroicons/react/24/outline";


const { Text, Title } = Typography;

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);

  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryInfo, setDeliveryInfo] = useState(() => {
    const saved = localStorage.getItem("deliveryInfo");
    return saved ? (saved) : { address: "", fee: null };
  });

  // Validation modal states
  const [isValidationModalVisible, setIsValidationModalVisible] = useState(false);

  // Electronics alert modal
  const [isElectronicsAlertVisible, setIsElectronicsAlertVisible] = useState(false);
  
  // Payment iframe modal states
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  // Get cart items from localStorage
const getCartItems = () => {
  try {
    let cartData = localStorage.getItem("cart");

    // Handle legacy (unencrypted or plain stringified) values
    if (typeof cartData === "string") {
      try {
        cartData = (cartData);
      } catch {
        // If it's not valid JSON, just leave it as is
      }
    }

    return Array.isArray(cartData) ? cartData : [];
  } catch (error) {
   
    return [];
  }
};


  const [cartItems, setCartItems] = useState(getCartItems());

  // Get cart ID
  const getCartId = () => {
    return localStorage.getItem("cartId") || `cart_${Date.now()}`;
  };

  // Get customer data
  const customerData = (() => {
    try {
      const data = localStorage.getItem("customer");
      return data ? (data) : null;
    } catch (error) {
    
      return null;
    }
  })();
  
  const [customerName, setCustomerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const customerId = customerData?.customerAccountNumber;
  const customerAccountType = customerData?.accountType;
  const selectedAddress = deliveryInfo?.address;

  // Check if user is an agent
  const isAgent = customerAccountType === "agent";

  // Check if delivery is free (case-insensitive check for "free")
  const isFreeDelivery = deliveryInfo?.fee === 0 && 
    (typeof deliveryInfo?.feeDisplay === 'string' && 
     deliveryInfo.feeDisplay.toLowerCase().includes('free'));

  // Also update the isNADelivery check
  const isNADelivery = deliveryInfo?.fee === 0 && 
    (!deliveryInfo?.feeDisplay || 
     deliveryInfo?.feeDisplay === 'N/A' || 
     deliveryInfo?.feeDisplay === '' ||
     (typeof deliveryInfo?.feeDisplay === 'string' && 
      deliveryInfo.feeDisplay.toLowerCase() === 'n/a'));

  // Update delivery info initialization
  useEffect(() => {
    if (customerData) {
      setCustomerName(`${customerData.firstName || ""} ${customerData.lastName || ""}`.trim());
      setCustomerNumber(customerData.contactNumber || customerData.ContactNumber || "");

      const storedInfo = (localStorage.getItem("deliveryInfo") || "{}");
      const address = storedInfo?.address || customerData.address || "";
      const fee = storedInfo?.fee || 0;
      const feeDisplay = storedInfo?.feeDisplay || storedInfo?.feeText || "";
      setDeliveryInfo({ address, fee, feeDisplay });
      setDeliveryFee(Number(fee));
    }
  }, []);

  // Update delivery fee when deliveryInfo changes
  useEffect(() => {
    if (deliveryInfo?.fee !== undefined && !isNaN(Number(deliveryInfo.fee))) {
      setDeliveryFee(Number(deliveryInfo.fee));
    }
  }, [deliveryInfo]);



  // Monitor cart changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newItems = getCartItems();
      setCartItems(newItems);
    };

    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(() => {
      const newItems = getCartItems();
      if ((newItems) !== (cartItems)) {
        setCartItems(newItems);
      }
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [cartItems]);

  // Enhanced Hubtel payment status check with iframe communication
  useEffect(() => {
    if (isAgent || !currentOrderId) return;

    let intervalId;
    
    // Listen for messages from the iframe
    const handleIframeMessage = (event) => {
      // Ensure we're listening to the right origin (Hubtel payment gateway)
      if (!event.origin.includes('hubtel.com') && !event.origin.includes('payproxyapi.hubtel.com')) {
        return;
      }

      const { type, data } = event.data || {};
      
      if (type === 'PAYMENT_SUCCESS') {
        clearInterval(intervalId);
        setIsPaymentModalVisible(false);
        setPaymentUrl(null);
        localStorage.removeItem("pendingOrderId");
        message.success("Payment completed successfully!");
        navigate(`/order-success/${currentOrderId}`);
      } else if (type === 'PAYMENT_CANCELLED' || type === 'PAYMENT_FAILED') {
        clearInterval(intervalId);
        setIsPaymentModalVisible(false);
        setPaymentUrl(null);
        localStorage.removeItem("pendingOrderId");
        message.error("Payment was cancelled or failed. Please try again.");
      }
    };

    const checkHubtelStatus = async () => {
      if (!currentOrderId) return;

      try {
        const action = await dispatch(getHubtelCallbackById(currentOrderId));
        const response = action?.payload;

        if (response?.responseCode === "0000") {
          clearInterval(intervalId);
          setIsPaymentModalVisible(false);
          setPaymentUrl(null);
          localStorage.removeItem("pendingOrderId");
          message.success("Payment completed successfully!");
          navigate(`/order-success/${currentOrderId}`);
        } else if (response?.responseCode === "2001") {
          clearInterval(intervalId);
          setIsPaymentModalVisible(false);
          setPaymentUrl(null);
          localStorage.removeItem("pendingOrderId");
          message.error("Payment was cancelled.");
          navigate("/order-cancelled");
        }
      } catch (error) {

      }
    };

    if (["Mobile Money", "Credit Card"].includes(paymentMethod) && isPaymentModalVisible) {
      // Add iframe message listener
      window.addEventListener('message', handleIframeMessage);
      
      // Start polling for payment status
      intervalId = setInterval(checkHubtelStatus, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('message', handleIframeMessage);
    };
  }, [paymentMethod, dispatch, navigate, isAgent, currentOrderId, isPaymentModalVisible]);
  
  const calculateTotalAmount = () => {
    const subtotal = cartItems.reduce((total, item) => {
      const itemTotal = item.total || (item.price * item.quantity) || 0;
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

const storeCheckoutDetailsInLocalStorage = (checkoutDetails, addressDetails) => {
  try {
    localStorage.setItem("checkoutDetails", checkoutDetails);
    localStorage.setItem("orderAddressDetails", addressDetails);
    
  } catch (error) {

  }
};

 const initiatePayment = async (totalAmount, cartItems, orderId) => {
  const username = "RMWBWl0";
  const password = "3c42a596cd044fed81b492e74da4ae30";
  const encodedCredentials = btoa(`${username}:${password}`);

  const payload = {
    totalAmount,
    description: `Payment for ${cartItems.map((item) => item.productName).join(", ")}`,
    callbackUrl: "https://smfteapi.salesmate.app/PaymentSystem/PostHubtelCallBack",
    returnUrl: `https://www.frankotrading.com/payment-success/${orderId}`,
    cancellationUrl: "https://www.frankotrading.com/order-cancelled",
    merchantAccountNumber: "2020892",
    clientReference: orderId,
  };

  try {
    const response = await fetch("https://payproxyapi.hubtel.com/items/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encodedCredentials}`,
      },
      body: JSON.stringify(payload), // ✅ FIXED: must stringify payload
    });

    // Check if response has body
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP Error: ${response.status} - ${text}`);
    }

    // Try to parse JSON safely
    const text = await response.text();
    if (!text) throw new Error("Empty response from Hubtel API");
    
    const result = JSON.parse(text);

    if (result.status === "Success") {
      localStorage.setItem("pendingOrderId", orderId);
      return result.data.checkoutUrl;
    } else {
      throw new Error(`Hubtel Error: ${result.message || "Unknown error"}`);
    }
  } catch (error) {

    throw error;
  }
};


  // ENHANCED: More robust direct checkout processing with better error handling and retry mechanism
  const processDirectCheckout = async (orderId, checkoutDetails, addressDetails) => {

    
    try {

      await dispatchOrderCheckoutWithRetry(orderId, checkoutDetails);
   
      await dispatchOrderAddressWithRetry(orderId, addressDetails);

      
    } catch (error) {

      throw new Error(`Checkout failed: ${error.message}`);
    }
  };

  // ENHANCED: Checkout order dispatch with retry mechanism and better error handling
  const dispatchOrderCheckoutWithRetry = async (orderId, checkoutDetails, maxRetries = 3) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
     
        const checkoutPayload = {
          cartId: getCartId(),
          ...checkoutDetails,
        };

     
        
        const result = await dispatch(checkOutOrder(checkoutPayload)).unwrap();
 
        
        // If we get here, the dispatch was successful
        return result;
        
      } catch (error) {
        
        lastError = error;
        
        // If it's the last attempt, don't wait
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // If we get here, all attempts failed
    throw new Error(`Checkout failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  };

  // ENHANCED: Address dispatch with retry mechanism and better error handling
  const dispatchOrderAddressWithRetry = async (orderId, addressDetails, maxRetries = 3) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        
        const result = await dispatch(updateOrderDelivery(addressDetails)).unwrap();
  
        
        // If successful, clear cart and local storage
        dispatch(clearCart());
        localStorage.removeItem("cart");
        localStorage.removeItem("cartId");
       
        
        return result;
        
      } catch (error) {
 
        lastError = error;
        
        // If it's the last attempt, don't wait
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // If we get here, all attempts failed
    throw new Error(`Address update failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  };

  // Handle payment method selection
  const handlePaymentMethodChange = (e) => {
    const selectedMethod = e.target.value;
    setPaymentMethod(selectedMethod);
  };

  // Validation function to check required fields
  const validateRequiredFields = () => {
    const errors = [];
    
    if (!customerName?.trim()) {
      errors.push({ field: 'name', message: 'Recipient name is required' });
    }
    
    if (!customerNumber?.trim()) {
      errors.push({ field: 'phone', message: 'Recipient contact number is required' });
    }
    
    if (!selectedAddress?.trim()) {
      errors.push({ field: 'address', message: 'Delivery address is required' });
    }
    
    if (!paymentMethod) {
      errors.push({ field: 'payment', message: 'Payment method is required' });
    }
    
    return errors;
  };
  // ✅ Safe getter to guarantee fullname & contact number
const getSafeCustomerDetails = () => {
  let name = customerName?.trim();
  let number = customerNumber?.trim();

  // fallback from customerData
  if (!name && customerData) {
    name = `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim();
  }
  if (!number && customerData) {
    number = customerData.contactNumber || customerData.ContactNumber || "";
  }

  // last fallback → guest
  if (!name) {
    name = `Guest ${Math.floor(1000 + Math.random() * 9000)}`;
  }
  if (!number) {
    number = "0000000000"; // or force input before checkout
  }

  return { name, number };
};

  
  // ENHANCED: Main checkout handler with better error handling and logging
const handleCheckout = async () => {


  // ✅ Always fetch guaranteed name & number
  const { name: safeName, number: safeNumber } = getSafeCustomerDetails();

  // overwrite state so UI also updates
  setCustomerName(safeName);
  setCustomerNumber(safeNumber);

  // Validate required fields
  const validationErrors = validateRequiredFields();
  if (validationErrors.length > 0) {
   
    setIsValidationModalVisible(true);
    return;
  }

  const orderId = generateOrderId();
  setCurrentOrderId(orderId);
  const orderDate = new Date().toISOString();
  const totalAmount = calculateTotalAmount();
  const cartId = getCartId();

  // ✅ Use safe values in payloads
  const checkoutDetails = {
    Cartid: cartId,
    customerId,
    orderCode: orderId,
    PaymentMode: paymentMethod,
    PaymentAccountNumber: safeNumber || "0000000000",
    customerAccountType,
    paymentService: "Mtn",
    totalAmount,
    recipientName: safeName || `Guest ${Math.floor(1000 + Math.random() * 9000)}`,
    recipientContactNumber: safeNumber || "0000000000", 
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
      
      // For agents or non-Hubtel payment methods, process direct checkout
      if (isAgent || !["Mobile Money", "Credit Card"].includes(paymentMethod)) {
   
        
        await processDirectCheckout(orderId, checkoutDetails, addressDetails);
   
        message.success("Your order has been placed successfully!");
        navigate("/order-received");
        
      } else {
     
        
        // Store details for later processing after payment
        storeCheckoutDetailsInLocalStorage(checkoutDetails, addressDetails);
        dispatch(saveCheckoutDetails(checkoutDetails));
        dispatch(saveAddressDetails(addressDetails));
        
        setPaymentLoading(true);
        const paymentUrl = await initiatePayment(totalAmount, cartItems, orderId);
        if (paymentUrl) {
         
          setPaymentUrl(paymentUrl);
          setIsPaymentModalVisible(true);
        }
        setPaymentLoading(false);
      }
      
    } catch (error) {
   
      
      // Show specific error message if available
      const errorMessage = error.message || "An error occurred during checkout.";
      message.error(errorMessage);
      

      
    } finally {
      setLoading(false);
   
    }
  };

  const renderImage = (imagePath) => {
    if (!imagePath) {
      return <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-400 text-xs">No Image</span>
      </div>;
    }
    
    const backendBaseURL = "https://fte002n1.salesmate.app";
    const imageUrl = `${backendBaseURL}/Media/Products_Images/${imagePath.split("\\").pop()}`;
    
    return (
      <img 
        src={imageUrl} 
        alt="Product" 
        className="w-16 h-16 object-cover rounded-lg"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  };

  // Show empty state if no items
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="p-4 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="flex items-center justify-center mb-4">
          <ShoppingBagIcon className="w-12 h-12 text-gray-400 mr-3" />
          <h2 className="text-2xl font-bold text-gray-700">Your cart is empty</h2>
        </div>
        <p className="text-gray-500 mb-6">Add some items to your cart to proceed with checkout.</p>
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
      {/* Loading overlay */}
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
        {/* Customer Details Form */}
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

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <Card bordered={false} className="rounded-xl shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Order Summary</h2>
              <div className="relative mt-1">
                <div className="absolute w-24 h-1 bg-red-300 rounded"></div>
                <div className="border-b border-gray-300"></div>
              </div>
            </div>
            
            {/* Cart Items List */}
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {cartItems.map((item, index) => (
                <div key={item.productId || index} className="flex justify-between items-start py-4 gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className="w-16 h-16 flex-shrink-0 relative">
                      {renderImage(item.imagePath)}
                      <div className="w-16 h-16 bg-gray-200 rounded-lg items-center justify-center hidden">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    </div>
                    <div className="text-sm flex-1">
                      <p className="font-medium text-gray-800 mb-1">{item.productName || 'Product Name'}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity || 1}</p>
                      <p className="text-xs text-gray-500">₵{(item.price || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-md font-semibold text-gray-800">
                      ₵{(item.total || (item.price * item.quantity) || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal */}
            <div className="flex justify-between items-center pt-4 border-t text-md font-medium text-gray-900">
              <span>Subtotal</span>
              <span>
                ₵{cartItems.reduce((acc, item) => acc + (item.total || (item.price * item.quantity) || 0), 0).toFixed(2)}
              </span>
            </div>

            {/* Summary Section */}
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
                  <Text strong>₵{deliveryFee.toFixed(2)}</Text>
                ) : (
                  <Text type="warning" className="text-amber-600">
                    Select location for delivery fee
                  </Text>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <Text className="text-red-500 font-bold text-lg">Total Amount:</Text>
                <Text className="text-red-500 font-bold text-lg">
                  ₵{calculateTotalAmount().toFixed(2)}
                </Text>
              </div>
            </div>
            
            <Divider className="my-6"/>

            {/* Payment Method Selection */}
            <div>
              <Text strong className="text-sm block mb-3">
                Payment Method
              </Text>
              <Radio.Group
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
                className="flex flex-col gap-3"
              >
                {/* Cash on Delivery - Available for:
                    - Agents (always)
                    - Non-agents with free delivery
                    - Non-agents with paid delivery (not N/A)
                */}
                {(isAgent || isFreeDelivery || (deliveryFee > 0 && !isNADelivery)) && (
                  <Radio value="Cash on Delivery" className="text-sm">
                    Cash on Delivery
                  </Radio>
                )}
                
                {/* Mobile Money and Credit Card - ONLY for non-agents */}
                {!isAgent && (
                  <>
                    <Radio value="Mobile Money" className="text-sm">
                      Mobile Money
                    </Radio>
                    <Radio value="Credit Card" className="text-sm">
                      Credit Card
                    </Radio>
                  </>
                )}

                {/* Agent-specific payment methods */}
                {isAgent && (
                  <>
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
            
            {/* Place Order Button - Always enabled */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className={`
                  relative w-full text-white font-semibold text-base py-4 rounded-xl 
                  transition-all duration-500 ease-in-out transform overflow-hidden
                  shadow-lg focus:outline-none focus:ring-4 focus:ring-opacity-50
                  ${loading 
                    ? 'bg-gray-400 cursor-wait' 
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-[1.02] hover:shadow-xl focus:ring-green-300 active:scale-[0.98]'
                  }
                `}
              >
                {/* Loading overlay */}
                {loading && (
                  <div className="absolute inset-0 bg-gray-500 bg-opacity-20 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white animate-pulse opacity-20"></div>
                  </div>
                )}

                {/* Button content */}
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
          <p className="text-gray-600 mb-4">Please fill in the following required fields to place your order:</p>
          {validateRequiredFields().map((error, index) => {
            const getIcon = (field) => {
              switch (field) {
                case 'name': return <UserIcon className="w-4 h-4 text-red-500" />;
                case 'phone': return <PhoneIcon className="w-4 h-4 text-red-500" />;
                case 'address': return <MapPinIcon className="w-4 h-4 text-red-500" />;
                case 'payment': return <CreditCardIcon className="w-4 h-4 text-red-500" />;
                default: return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
              }
            };

            const getFieldName = (field) => {
              switch (field) {
                case 'name': return 'Recipient Name';
                case 'phone': return 'Contact Number';
                case 'address': return 'Delivery Address';
                case 'payment': return 'Payment Method';
                default: return 'Required Field';
              }
            };

            return (
              <div key={index} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg border border-red-200">
                {getIcon(error.field)}
                <span className="text-sm font-medium text-red-700">
                  {getFieldName(error.field)}
                </span>
              </div>
            );
          })}
        </div>
      </Modal>


      {/* Payment Iframe Modal */}
      {/* Payment Modal - ONLY for non-agents */}
      {!isAgent && (
        <Modal
          open={isPaymentModalVisible}
          onCancel={() => setIsPaymentModalVisible(false)}
          footer={null}
          closable
          centered
          width={600}
        >
          {paymentUrl ? (
            <iframe
              src={paymentUrl}
              title="Hubtel Payment"
              width="100%"
              height="700px"
              frameBorder="0"
            />
          ) : (
            <p>Loading payment interface...</p>
          )}
        </Modal>
      )}
    </div>
  );
};

export default Checkout;
