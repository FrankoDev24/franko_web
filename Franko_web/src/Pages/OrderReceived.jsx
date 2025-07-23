
import React, { useEffect, useState } from "react";
import { CheckCircleOutlined, HomeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";

const OrderReceived = () => {
  const navigate = useNavigate();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

useEffect(() => {
  // Push GTM event
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "order_received",
    pageType: "OrderConfirmation",
    timestamp: new Date().toISOString()
  });

  const timeout = setTimeout(() => {
    navigate("/");
  }, 8000);

  const handleResize = () => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
  };

  window.addEventListener("resize", handleResize);

  return () => {
    clearTimeout(timeout);
    window.removeEventListener("resize", handleResize);
  };
}, [navigate]);

  

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 relative">
      <Confetti width={dimensions.width} height={dimensions.height} recycle={false} numberOfPieces={900} />

      <div className="bg-white shadow-xl rounded-3xl w-full max-w-md p-8 text-center space-y-6 transition-all duration-300 z-10">
        <div className="flex justify-center">
          <CheckCircleOutlined className="text-green-500 text-7xl animate-bounce" />
        </div>

        <div>
          <h2 className="text-3xl font-bold text-gray-800">Order Received!</h2>
          <p className="text-base text-gray-600 mt-2">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
         
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
         

          <button
            onClick={() => navigate("/")}
            className="bg-white border border-green-500 text-green-600 hover:bg-green-50 px-5 py-3 rounded-xl w-full transition duration-200 flex items-center justify-center gap-2 shadow-md"
          >
            <HomeOutlined />
            Continue Shopping
          </button>
        </div>

        <p className="text-xs text-gray-400 pt-2">Redirecting to the home page in a few seconds...</p>
      </div>
    </div>
  );
};

export default OrderReceived;

