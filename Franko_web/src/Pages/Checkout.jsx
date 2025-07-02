import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  checkOutOrder,
  updateOrderDelivery,
  saveCheckoutDetails,
  saveAddressDetails,
} from "../Redux/Slice/orderSlice";
import { clearCart } from "../Redux/Slice/cartSlice";
import { message, Card, Typography, Radio, Divider, Modal, Checkbox, Alert } from "antd";
import CheckoutForm from "../Component/CheckoutForm";
import locations from "../Component/Locations";
import { ShoppingBagIcon, ExclamationTriangleIcon, CreditCardIcon, MapPinIcon } from "@heroicons/react/24/outline";

const { Text } = Typography;

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryInfo, setDeliveryInfo] = useState(() => {
    const saved = localStorage.getItem("deliveryInfo");
    return saved ? JSON.parse(saved) : { address: "", fee: null };
  });

  // Validation states
  const [showValidationAlerts, setShowValidationAlerts] = useState(false);

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  // Get cart items from localStorage
  const getCartItems = () => {
    try {
      const cartData = localStorage.getItem("cart");
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error("Error parsing cart data:", error);
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
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error parsing customer data:", error);
      return null;
    }
  })();
  
  const [customerName, setCustomerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const customerId = customerData?.customerAccountNumber;
  const customerAccountType = customerData?.accountType;
  const selectedAddress = deliveryInfo?.address;

  // Initialize customer data
  useEffect(() => {
    if (customerData) {
      setCustomerName(`${customerData.firstName || ""} ${customerData.lastName || ""}`.trim());
      setCustomerNumber(customerData.contactNumber || customerData.ContactNumber || "");

      const storedInfo = JSON.parse(localStorage.getItem("deliveryInfo") || "{}");
      const address = storedInfo?.address || customerData.address || "";
      const fee = storedInfo?.fee || 0;
      setDeliveryInfo({ address, fee });
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

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes within the same tab
    const interval = setInterval(() => {
      const newItems = getCartItems();
      if (JSON.stringify(newItems) !== JSON.stringify(cartItems)) {
        setCartItems(newItems);
      }
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [cartItems]);
  
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
    localStorage.setItem("checkoutDetails", JSON.stringify(checkoutDetails));
    localStorage.setItem("orderAddressDetails", JSON.stringify(addressDetails));
  };

  const initiatePayment = async (totalAmount, cartItems, orderId) => {
    const username = "RMWBWl0";
    const password = "3c42a596cd044fed81b492e74da4ae30";
    const encodedCredentials = btoa(`${username}:${password}`);

    const payload = {
      totalAmount,
      description: `Payment for ${cartItems.map((item) => item.productName).join(", ")}`,
      callbackUrl: "https://eon1b314mokendl.m.pipedream.net/",
      returnUrl: `https://frankotrading.com/order-success/${orderId}`,
      merchantAccountNumber: "2020892",
      cancellationUrl: "https://frankotrading.com/order-cancelled",
      clientReference: orderId,
    };

    try {
      const response = await fetch("https://payproxyapi.hubtel.com/items/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${encodedCredentials}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.status === "Success") {
        return result.data.checkoutUrl;
      }
      throw new Error(result.message || "Payment initiation failed.");
    } catch (error) {
      console.error("Payment initiation error:", error);
      throw error;
    }
  };

  // Handle payment method selection
  const handlePaymentMethodChange = (e) => {
    const selectedMethod = e.target.value;
    
    if (selectedMethod === "Mobile Money" || selectedMethod === "Credit Card") {
      setSelectedPaymentMethod(selectedMethod);
      setShowPaymentModal(true);
      setConfirmationChecked(false);
    } else {
      setPaymentMethod(selectedMethod);
    }

    // Hide validation alerts when user makes selection
    if (showValidationAlerts) {
      setShowValidationAlerts(false);
    }
  };

  // Handle payment modal confirmation
  const handlePaymentModalConfirm = () => {
    if (!confirmationChecked) {
      message.warning("Please confirm that you understand the payment process.");
      return;
    }
    
    setPaymentMethod(selectedPaymentMethod);
    setShowPaymentModal(false);
    setConfirmationChecked(false);
  };

  // Handle payment modal cancel
  const handlePaymentModalCancel = () => {
    setShowPaymentModal(false);
    setSelectedPaymentMethod(null);
    setConfirmationChecked(false);
  };

  const handleCheckout = async () => {
    // Validation
    if (cartItems.length === 0) {
      message.warning("Your cart is empty. Please add items before checkout.");
      return;
    }
    const missingPayment = !paymentMethod;
    const missingAddress = !selectedAddress;

    if (missingPayment || missingAddress) {
      setShowValidationAlerts(true);
      
      if (missingPayment && missingAddress) {
        message.error("Please select a payment method and delivery address to continue.");
      } else if (missingPayment) {
        message.error("Please select a payment method to continue.");
      } else {
        message.error("Please select a delivery address to continue.");
      }
      
      // Scroll to top to show validation alerts
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      PaymentAccountNumber: customerNumber,
      customerAccountType,
      paymentService: "Mtn",
      totalAmount,
      recipientName: customerName,
      recipientContactNumber: customerNumber,
      orderNote: orderNote || "N/A",
      orderDate,
    };

    const addressDetails = {
      orderCode: orderId,
      address: selectedAddress,
      Customerid: customerId,
      recipientName: customerName,
      recipientContactNumber: customerNumber,
      orderNote: orderNote || "N/A",
      geoLocation: "N/A",
    };

    try {
      setLoading(true);
      
      if (["Mobile Money", "Credit Card"].includes(paymentMethod)) {
        // Store details for payment callback
        storeCheckoutDetailsInLocalStorage(checkoutDetails, addressDetails);
        dispatch(saveCheckoutDetails(checkoutDetails));
        dispatch(saveAddressDetails(addressDetails));
        
        const paymentUrl = await initiatePayment(totalAmount, cartItems, orderId);
        if (paymentUrl) {

          window.location.href = paymentUrl;
        }
      } else {
 
        
        const checkoutResult = await dispatch(checkOutOrder({ 
          cartId, 
          ...checkoutDetails 
        })).unwrap();
        
        
        const addressResult = await dispatch(updateOrderDelivery(addressDetails)).unwrap();
        console.log("Address update result:", addressResult);
        
        // Clear cart after successful order
        dispatch(clearCart());
        localStorage.removeItem("cart");
        localStorage.removeItem("cartId");
        
        message.success("Order placed successfully!");
        navigate("/order-received");
      }
    } catch (error) {
    
      message.error(`An error occurred during checkout: ${error.message || 'Unknown error'}`);
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
    
    const backendBaseURL = "https://smfteapi.salesmate.app";
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

  // Check if form is ready for submission
  const isFormValid = paymentMethod && selectedAddress;
  const hasValidationErrors = !paymentMethod || !selectedAddress;

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
            onClick={() => navigate("/shop")}
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
      <div className="flex items-center mb-6 w-full">
        <h2 className="text-md md:text-xl font-bold text-gray-700 flex items-center gap-2">
          <ShoppingBagIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
          Checkout ({cartItems.length} items)
        </h2>
        <div className="flex-grow border-t border-gray-300 mx-4"></div>
      </div>

      {/* Validation Alerts */}
      {showValidationAlerts && hasValidationErrors && (
        <div className="mb-6 space-y-3">
          {!paymentMethod && (
            <Alert
              message="Payment Method Required"
              description="Please select a payment method to continue with your order."
              type="error"
              icon={<CreditCardIcon className="w-4 h-4" />}
              showIcon
              className="border-red-300"
            />
          )}
          {!selectedAddress && (
            <Alert
              message="Delivery Address Required"
              description="Please select a delivery address to continue with your order."
              type="error"
              icon={<MapPinIcon className="w-4 h-4" />}
              showIcon
              className="border-red-300"
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Details Form */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Recipient Details</h2>
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
                      <p className="text-xs text-gray-500">₵{(item.price || 0).toFixed(2)}
                      </p>
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
                {deliveryFee === 0 ? (
                  <Text type="warning" className="text-amber-600">Delivery charges apply</Text>
                ) : (
                  <Text strong>₵{deliveryFee.toFixed(2)}</Text>
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
            <div className={`transition-all duration-300 ${!paymentMethod && showValidationAlerts ? 'ring-2 ring-red-200 bg-red-50 p-4 rounded-lg' : ''}`}>
              <Text strong className="text-sm block mb-3">
                Payment Method
                {!paymentMethod && showValidationAlerts && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Text>
              <Radio.Group
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
                className="flex flex-col gap-3"
              >
                {(deliveryFee !== 0 || customerAccountType === "agent") && (
                  <Radio value="Cash on Delivery" className="text-sm">
                    Cash on Delivery
                  </Radio>
                )}
                <Radio value="Mobile Money" className="text-sm">
                  Mobile Money
                </Radio>
                <Radio value="Credit Card" className="text-sm">
                  Credit Card
                </Radio>

                {customerAccountType === "agent" && (
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
            
            {/* Enhanced Place Order Button */}
            <div className="mt-6 space-y-3">
              {/* Status indicator when form is incomplete */}
              {!isFormValid && !loading && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-700">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Complete required fields to place order
                    </span>
                  </div>
                  <ul className="text-xs text-amber-600 mt-1 ml-6 space-y-1">
                    {!paymentMethod && <li>• Select payment method</li>}
                    {!selectedAddress && <li>• Select delivery address</li>}
                  </ul>
                </div>
              )}

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
                    : isFormValid
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-[1.02] hover:shadow-xl focus:ring-green-300 active:scale-[0.98]'
                      : 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
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
                      <span>
                        {isFormValid ? 'Place Order' : 'Complete Required Fields'}
                      </span>

                    </>
                  )}
                </div>

                {/* Success ripple effect */}
                {!loading && isFormValid && (
                  <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white-skew-x-12 animate-pulse opacity-10"></div>
                  </div>
                )}
              </button>

              {/* Security badge */}
              {isFormValid && (
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Secure checkout protected by SSL encryption</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Payment Information Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-6 h-6 text-orange-500" />
            <span className="text-lg font-semibold">Payment Information</span>
          </div>
        }
        open={showPaymentModal}
        onCancel={handlePaymentModalCancel}
        footer={[
          <button
            key="cancel"
            onClick={handlePaymentModalCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mr-2"
          >
            Cancel
          </button>,
          <button
            key="continue"
            onClick={handlePaymentModalConfirm}
            disabled={!confirmationChecked}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              confirmationChecked
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
           Agree
          </button>
        ]}
        width={500}
        centered
      >
        <div className="py-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-orange-800 mb-2">Important Payment Instructions</h3>
            <div className="text-sm text-orange-700 space-y-2">
              <p>
                <strong>Step 1:</strong> You will be redirected to the {selectedPaymentMethod} payment gateway.
              </p>
              <p>
                <strong>Step 2:</strong> Complete your payment on the secure payment page.
              </p>
              <p>
                <strong>Step 3:</strong> After successful payment,Click the "Continue" button to complete your order placement.
              </p>
             
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-red-800 mb-2">⚠️ Important Notice</h4>
            <p className="text-sm text-red-700">
              Your order will NOT be processed until you click the "Continue" button after payment. 
              Please do not close the browser window or navigate away without clicking "Continue" button after payment.
            </p>
          </div>

          <div className="flex items-start gap-2 mt-4">
            <Checkbox
              checked={confirmationChecked}
              onChange={(e) => setConfirmationChecked(e.target.checked)}
              className="mt-1"
            />
            <label className="text-sm text-gray-700 cursor-pointer" onClick={() => setConfirmationChecked(!confirmationChecked)}>
              I understand the payment process and will click "Continue" after completing the payment to ensure my order is placed successfully.
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Checkout;