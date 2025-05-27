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
import { message, Button, Card, Typography, Radio } from "antd";
import { CreditCardOutlined } from "@ant-design/icons";
import CheckoutForm from "../Component/CheckoutForm";
import locations from "../Component/Locations";

const { Title, Text } = Typography;

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  
  const [orderNote, setOrderNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0); // ✅ FIXED: Add deliveryFee state
  const [deliveryInfo, setDeliveryInfo] = useState(() => {
    const saved = localStorage.getItem("deliveryInfo");
    return saved ? JSON.parse(saved) : { address: "", fee: null };
  });
  const [customerName, setCustomerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  
  useEffect(() => {
    const customerData = JSON.parse(localStorage.getItem("customer"));
    if (customerData) {
      setCustomerName(`${customerData.firstName || ""} ${customerData.lastName || ""}`.trim());
      setCustomerNumber(customerData.contactNumber || "");
    }
  }, []); // <- only run once
  


  const cartId = localStorage.getItem("cartId");
  const customerData = JSON.parse(localStorage.getItem("customer"));
  const selectedCart = JSON.parse(localStorage.getItem("selectedCart"));
  const cartItems = selectedCart?.length > 0 ? selectedCart : JSON.parse(localStorage.getItem("cart")) || [];
  const customerId = customerData?.customerAccountNumber;
  const customerAccountType = customerData?.accountType;
  const selectedAddress = deliveryInfo?.address;

  useEffect(() => {
    if (deliveryInfo?.fee !== undefined && !isNaN(Number(deliveryInfo.fee))) {
      setDeliveryFee(Number(deliveryInfo.fee));
    }
  }, [deliveryInfo]);
  
  
  
  useEffect(() => {
    if (customerData) {
      const name = `${customerData?.firstName || ""} ${customerData?.lastName || ""}`.trim();
      setCustomerName(name);
      setCustomerNumber(customerData?.contactNumber || customerData?.ContactNumber || "");
  
      // Only update delivery address if not already set
      if (!deliveryInfo.address) {
        const address = customerData?.address || "";
        const updatedDeliveryInfo = { address, fee: 0 };
        localStorage.setItem("deliveryInfo", JSON.stringify(updatedDeliveryInfo));
        setDeliveryInfo(updatedDeliveryInfo);
      }
    }
  }, [customerData, deliveryInfo.address]);
  
  const calculateTotalAmount = () =>
    cartItems.reduce((total, item) => total + (item.total || 0), 0) + deliveryFee;

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
    if (!paymentMethod) return message.warning("Please select a payment method.");
    if (!selectedAddress) return message.warning("Please select an address.");

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
        if (paymentUrl) window.location.href = paymentUrl;
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
      console.error(error);
      message.error("An error occurred during checkout.");
    } finally {
      setLoading(false);
    }
  };

  const renderImage = (imagePath) => {
    const backendBaseURL = "https://smfteapi.salesmate.app";
    const imageUrl = `${backendBaseURL}/Media/Products_Images/${imagePath.split("\\").pop()}`;
    return <img src={imageUrl} alt="Product" className="w-16 h-16 object-cover rounded-lg" />;
  };

  return (
    <div className="p-4">
      <Title level={3} className="mb-4">Checkout</Title>
      <div className="bg-white shadow-md rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card title={<Text strong className="text-base">Customer Details</Text>} bordered={false}>
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
            <Card title={<Text strong className="text-base">Order Summary</Text>} bordered={false}>
              {cartItems.map((item) => (
                <div key={item.productId} className="flex justify-between items-center border-b py-3 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="mr-4">{renderImage(item.imagePath)}</div>
                    <div>
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <Text className="text-sm font-semibold">₵{item.total?.toFixed(2)}</Text>
                </div>
              ))}

              <div className="my-4">
                <Text strong>Payment Method</Text>
                <Radio.Group
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  value={paymentMethod}
                  className="flex flex-col mt-2 gap-2"
                >
                  {deliveryFee !== 0 && (
                    <Radio value="Cash on Delivery">Cash on Delivery</Radio>
                  )}
                  <Radio value="Mobile Money">Mobile Money</Radio>
                  <Radio value="Credit Card">
                    <CreditCardOutlined className="mr-1 text-blue-600" />
                    Credit Card
                  </Radio>
                </Radio.Group>
              </div>

              <div className="flex justify-between text-sm mb-1">
                <Text>Shipping Fee:</Text>
                {deliveryFee === 0 ? (
                  <Text type="warning">Delivery charges apply</Text>
                ) : (
                  <Text strong>₵{deliveryFee}</Text>
                )}
              </div>

              <div className="flex justify-between mt-2 text-base font-semibold">
                <Text>Total Amount:</Text>
                <Text className="text-green-600">
                  ₵{calculateTotalAmount().toFixed(2)}
                </Text>
              </div>

              <Button
                type="primary"
                size="large"
                block
                className="mt-4 bg-green-400 hover:bg-green-700"
                onClick={handleCheckout}
                loading={loading}
              >
                {loading ? "Processing..." : "Place Order"}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
