import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { checkOutOrder, updateOrderDelivery } from "../Redux/Slice/orderSlice";
import { clearCart } from "../Redux/Slice/cartSlice";
import { message } from "antd";
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";

const OrderSuccessPage = () => {
  const dispatch = useDispatch();
  const { orderId } = useParams(); 
  const navigate = useNavigate();
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);
    useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    // GTM page view tracking
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_location: window.location.href,
        page_title: 'Order Success Page'
      });
    }

    const handleOrderCompletion = async () => {
      try {
        const checkoutDetails = (localStorage.getItem("checkoutDetails"));
        const addressDetails = (localStorage.getItem("orderAddressDetails"));

        if (!checkoutDetails || !addressDetails) {
          message.warning("Order details are missing.");
          return;
        }

        if (checkoutDetails.orderCode !== orderId) {
          message.warning("Order details do not match.");
          return;
        }

        const checkoutPayload = {
          Cartid: localStorage.getItem("cartId"),
          customerId: checkoutDetails.customerId,
          orderCode: checkoutDetails.orderCode,
          address: checkoutDetails.address || "N/A",
          PaymentMode: checkoutDetails.PaymentMode,
          PaymentAccountNumber: checkoutDetails.PaymentAccountNumber || "0000000000",
          customerAccountType: "Customer" || checkoutDetails.customerAccountType,
          paymentService: "Mtn",
          totalAmount: checkoutDetails.totalAmount,
        };

        const addressPayload = {
          Customerid: addressDetails.Customerid,
          orderCode: addressDetails.orderCode,
          address: addressDetails.address,
          recipientName: addressDetails.recipientName || `Guest ${Math.floor(1000 + Math.random() * 9000)}`,
          recipientContactNumber: addressDetails.recipientContactNumber || "0000000000",
          orderNote: addressDetails.orderNote || "N/A",
          geoLocation: addressDetails.geoLocation,
        };

        await dispatch(checkOutOrder(checkoutPayload)).unwrap();
        await dispatch(updateOrderDelivery(addressPayload)).unwrap();

        dispatch(clearCart());
        localStorage.removeItem("checkoutDetails");
        localStorage.removeItem("orderAddressDetails");

        message.success("Your order has been confirmed!");
        setTimeout(() => setShowConfetti(false), 5000); // Stop confetti after 5 seconds
      } catch  {
        message.error("Failed to process your order. Please try again.");
      }
    };

    handleOrderCompletion();
  }, [dispatch, orderId]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-red-50 to-green-100 flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {showConfetti && <Confetti width={width} height={height} />}
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 sm:p-10 text-center transition-all duration-300 ease-in-out">
        <h1 className="text-4xl font-extrabold text-green-600 mb-3">Payment Received !</h1>
        <p className="text-lg text-gray-700 mb-6">
          Thank you for your purchase. We have received your order and will begin processing it shortly.
        </p>

        <div className="bg-gray-100 p-4 rounded-md shadow-inner text-left mb-6">
          <p className="text-gray-800 font-medium">
            <span className="text-green-600 font-bold">Order ID:</span> {orderId}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/order-history")}
            className="w-full sm:w-auto py-3 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            View My Orders
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full sm:w-auto py-3 px-6 border-2 border-green-600 text-green-600 font-semibold rounded-lg hover:bg-green-50 transition focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
