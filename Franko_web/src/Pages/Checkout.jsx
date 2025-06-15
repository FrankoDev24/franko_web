import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  checkOutOrder,
  updateOrderDelivery,
  saveCheckoutDetails,
  saveAddressDetails,
} from "../Redux/Slice/orderSlice";
import { clearCart } from "../Redux/Slice/cartSlice";
import { message, Card, Typography, Radio, Divider } from "antd";
import CheckoutForm from "../Component/CheckoutForm";
import locations from "../Component/Locations";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";

const { Title, Text } = Typography;

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



  // ✅ FIXED: Simplified cart item logic with debugging
  const getCartItems = () => {
    try {
      const selectedCartRaw = localStorage.getItem("selectedCart");
      const regularCartRaw = localStorage.getItem("cart");
      

      
      const selectedCart = selectedCartRaw ? JSON.parse(selectedCartRaw) : null;
      const regularCart = regularCartRaw ? JSON.parse(regularCartRaw) : null;
      
 
      
      // Check if selectedCart exists and has items
      if (selectedCart && Array.isArray(selectedCart) && selectedCart.length > 0) {
     
        return selectedCart;
      }
      
      // Fallback to regular cart
      if (regularCart && Array.isArray(regularCart) && regularCart.length > 0) {

        return regularCart;
      }
     
      return [];
    } catch (error) {
    
      return [];
    }
  };

  const [cartItems, setCartItems] = useState(() => {
    const items = getCartItems();

    return items;
  });

  const cartId = localStorage.getItem("cartId") || `cart_${Date.now()}`;
  const customerData = (() => {
    try {
      const data = localStorage.getItem("customer");
      return data ? JSON.parse(data) : null;
    } catch (error) {
   
      return null;
    }
  })();
  
  const [customerName, setCustomerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const customerId = customerData?.customerAccountNumber;
  const customerAccountType = customerData?.accountType;
  const selectedAddress = deliveryInfo?.address;

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

  useEffect(() => {
    if (deliveryInfo?.fee !== undefined && !isNaN(Number(deliveryInfo.fee))) {
      setDeliveryFee(Number(deliveryInfo.fee));
    }
  }, [deliveryInfo]);

  // 🔍 DEBUG: Monitor cart changes
  useEffect(() => {
    const interval = setInterval(() => {
      const newItems = getCartItems();
      if (JSON.stringify(newItems) !== JSON.stringify(cartItems)) {
 
        setCartItems(newItems);
      }
    }, 2000);

    return () => clearInterval(interval);
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

    const response = await fetch("https://payproxyapi.hubtel.com/items/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${encodedCredentials}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (result.status === "Success") return result.data.checkoutUrl;
    throw new Error(result.message || "Payment initiation failed.");
  };

  const handleCheckout = async () => {

    
    if (cartItems.length === 0) {
    
      message.warning("Your cart is empty. Please add items before checkout.");
      return;
    }

    if (!paymentMethod) {
  
      return message.warning("Please select a payment method.");
    }
    
    if (!selectedAddress) {

      return message.warning("Please select an address.");
    }

    const orderId = generateOrderId();
    const orderDate = new Date().toISOString();
    const totalAmount = calculateTotalAmount();


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

        storeCheckoutDetailsInLocalStorage(checkoutDetails, addressDetails);
        dispatch(saveCheckoutDetails(checkoutDetails));
        dispatch(saveAddressDetails(addressDetails));
        const paymentUrl = await initiatePayment(totalAmount, cartItems, orderId);
        if (paymentUrl) {
          console.log("Redirecting to payment URL:", paymentUrl);
          window.location.href = paymentUrl;
        }
      } else {
      
        await dispatch(checkOutOrder({ cartId, ...checkoutDetails })).unwrap();
        await dispatch(updateOrderDelivery(addressDetails)).unwrap();
        dispatch(clearCart());
        
        localStorage.removeItem("cart");
        localStorage.removeItem("cartId");
        localStorage.removeItem("selectedCart");
        
        message.success("Order placed successfully!");
        navigate("/order-received");
      }
    } catch (error) {
  
      message.error("An error occurred during checkout.");
    } finally {
      setLoading(false);
    }
  };

  const renderImage = (imagePath) => {
    if (!imagePath) return <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>;
    
    const backendBaseURL = "https://smfteapi.salesmate.app";
    const imageUrl = `${backendBaseURL}/Media/Products_Images/${imagePath.split("\\").pop()}`;
    return <img src={imageUrl} alt="Product" className="w-16 h-16 object-cover rounded-lg" />;
  };

  // Show empty state if no items
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="flex items-center justify-center mb-4">
          <ShoppingBagIcon className="w-8 h-8 text-gray-400 mr-2" />
          <h2 className="text-xl font-bold text-gray-700">Your cart is empty</h2>
        </div>
        <p className="text-gray-500 mb-4">Add some items to your cart before checkout.</p>
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <p className="text-sm">Cart items: {JSON.stringify(cartItems)}</p>
          <p className="text-sm">LocalStorage cart: {localStorage.getItem("cart")}</p>
          <p className="text-sm">LocalStorage selectedCart: {localStorage.getItem("selectedCart")}</p>
        </div>
        <button 
          onClick={() => navigate("/shop")}
          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center mb-6 w-full">
        <h2 className="text-md md:text-xl font-bold text-gray-700 flex items-center gap-2">
          <ShoppingBagIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
          Checkout ({cartItems.length} items)
        </h2>
        <div className="flex-grow border-t border-gray-300 mx-4"></div>
      </div>

      {/* 🔍 DEBUG: Show cart data */}
    

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
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

          <div className="md:col-span-2">
            <Card bordered={false} className="rounded-xl shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Order Summary</h2>
                <div className="relative mt-1">
                  <div className="absolute w-24 h-1 bg-red-300 rounded"></div>
                  <div className="border-b border-gray-300"></div>
                </div>
              </div>
              
              {/* Cart Items */}
              <div className="divide-y divide-gray-200">
                {cartItems.map((item, index) => (
                  <div key={item.productId || index} className="flex justify-between items-start py-4 gap-4">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 flex-shrink-0">
                        {renderImage(item.imagePath)}
                      </div>
                      <div className="text-sm">
                        <p className="font-sm text-gray-600">{item.productName}</p>
                        <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
                        <p className="text-xs text-gray-400 mt-1"> ₵{item.price}.00</p>
                      </div>
                    </div>
                    <div className="text-right text-md font-semibold text-gray-800">
                      ₵{(item.total || (item.price * item.quantity))?.toFixed(2)}
                    </div>
                  </div>
                ))}

                {/* Subtotal Section */}
                <div className="flex justify-between items-center pt-4 text-md font-medium text-gray-900">
                  <span>Subtotal</span>
                  <span>
                    ₵{cartItems.reduce((acc, item) => acc + (item.total || (item.price * item.quantity) || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Summary Section */}
              <div className="border-t mt-6 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <Text>Shipping Fee:</Text>
                  {deliveryFee === 0 ? (
                    <Text type="warning">Delivery charges apply</Text>
                  ) : (
                    <Text strong>₵{deliveryFee}.00</Text>
                  )}
                </div>

                <div className="flex justify-between text-base font-semibold mt-1">
                  <Text className="text-red-400 font-bold text-md md:text-lg">Total Amount:</Text>
                  <Text className="text-red-400 font-bold text-md md:text-lg">
                    ₵{calculateTotalAmount().toFixed(2)}
                  </Text>
                </div>
              </div>
              
              <Divider/>

              {/* Payment Method */}
              <div className="mt-6">
                <Text strong className="text-sm block mb-2">Payment Method</Text>
                <Radio.Group
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="flex flex-col gap-3"
                >
                  {(deliveryFee !== 0 || customerAccountType === "agent") && (
                    <Radio value="Cash on Delivery">Cash on Delivery</Radio>
                  )}
                  <Radio value="Mobile Money">Mobile Money</Radio>
                  <Radio value="Credit Card">Credit Card</Radio>

                  {customerAccountType === "agent" && (
                    <>
                      <Radio value="Pick Up">Pick Up</Radio>
                      <Radio value="Paid Already">Paid Already</Radio>
                    </>
                  )}
                </Radio.Group>
              </div>
              
              {/* Place Order Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className={`mt-6 w-full text-white font-semibold text-base py-3 backdrop-blur-md transition-all duration-300 ease-in-out transform ${
                  loading
                    ? 'bg-green-300 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 hover:scale-[1.02] hover:shadow-xl'
                } shadow-md focus:outline-none focus:ring-4 focus:ring-green-300`}
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
                    Processing...
                  </span>
                ) : (
                  "Place Order"
                )}
              </button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;