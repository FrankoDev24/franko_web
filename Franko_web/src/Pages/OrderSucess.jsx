import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { checkOutOrder, updateOrderDelivery } from "../Redux/Slice/orderSlice";
import { clearCart } from "../Redux/Slice/cartSlice";
import { message } from "antd";
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";

// ─── Animated check icon ──────────────────────────────────────────────────────
const AnimatedCheck = () => (
  <svg viewBox="0 0 52 52" className="w-full h-full" fill="none">
    <style>{`
      .check-circle {
        stroke-dasharray: 166;
        stroke-dashoffset: 166;
        animation: stroke-circle 0.5s cubic-bezier(0.65, 0, 0.45, 1) 0.1s forwards;
      }
      .check-mark {
        stroke-dasharray: 48;
        stroke-dashoffset: 48;
        animation: stroke-check 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.55s forwards;
      }
      @keyframes stroke-circle {
        to { stroke-dashoffset: 0; }
      }
      @keyframes stroke-check {
        to { stroke-dashoffset: 0; }
      }
    `}</style>
    <circle className="check-circle" cx="26" cy="26" r="25" stroke="#059669" strokeWidth="2" fill="none" />
    <path className="check-mark" d="M14.5 26.5l8 8 15-16" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// ─── Floating particle ────────────────────────────────────────────────────────
const Particle = ({ style }) => (
  <div className="absolute rounded-full pointer-events-none" style={style} />
);

// ─── Step row ─────────────────────────────────────────────────────────────────
const StepRow = ({ icon, label, delay }) => (
  <div
    className="flex items-center gap-3 opacity-0"
    style={{ animation: `fadeSlideUp 0.4s ease forwards ${delay}` }}
  >
    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
      <span className="text-green-600 text-sm">{icon}</span>
    </div>
    <p className="text-sm text-gray-600 font-medium">{label}</p>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const OrderSuccessPage = () => {
  const dispatch = useDispatch();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { width, height } = useWindowSize();

  const [showConfetti, setShowConfetti] = useState(true);
  const [orderTime] = useState(() =>
    new Date().toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (window.gtag) {
      window.gtag("event", "page_view", {
        page_location: window.location.href,
        page_title: "Order Success Page",
      });
    }

    const handleOrderCompletion = async () => {
      try {
        const checkoutDetails = localStorage.getItem("checkoutDetails");
        const addressDetails = localStorage.getItem("orderAddressDetails");

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
          recipientName:
            addressDetails.recipientName ||
            `Guest ${Math.floor(1000 + Math.random() * 9000)}`,
          recipientContactNumber:
            addressDetails.recipientContactNumber || "0000000000",
          orderNote: addressDetails.orderNote || "N/A",
          geoLocation: addressDetails.geoLocation,
        };

        await dispatch(checkOutOrder(checkoutPayload)).unwrap();
        await dispatch(updateOrderDelivery(addressPayload)).unwrap();
        dispatch(clearCart());
        localStorage.removeItem("checkoutDetails");
        localStorage.removeItem("orderAddressDetails");
        message.success("Your order has been confirmed!");
        setTimeout(() => setShowConfetti(false), 5000);
      } catch {
        message.error("Failed to process your order. Please try again.");
      }
    };

    handleOrderCompletion();
  }, [dispatch, orderId]);

  // ── Particles ────────────────────────────────────────────────────────────────
  const particles = [
    { width: 8, height: 8, backgroundColor: "#6EE7B7", top: "12%", left: "8%",  opacity: 0.5, animation: "float1 6s ease-in-out infinite" },
    { width: 5, height: 5, backgroundColor: "#FCD34D", top: "20%", right: "10%", opacity: 0.6, animation: "float2 8s ease-in-out infinite" },
    { width: 10,height: 10,backgroundColor: "#A7F3D0", bottom: "25%", left: "6%", opacity: 0.4, animation: "float1 7s ease-in-out infinite 1s" },
    { width: 6, height: 6, backgroundColor: "#059669", top: "55%", right: "7%", opacity: 0.35, animation: "float2 5s ease-in-out infinite 0.5s" },
    { width: 4, height: 4, backgroundColor: "#FCA5A5", top: "75%", left: "14%",  opacity: 0.45, animation: "float1 9s ease-in-out infinite 2s" },
    { width: 7, height: 7, backgroundColor: "#BAF3D4", bottom: "15%", right: "12%", opacity: 0.5, animation: "float2 6s ease-in-out infinite 1.5s" },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.6); }
          70%  { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%       { transform: translateY(-18px) rotate(15deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%       { transform: translateY(14px) rotate(-12deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #047857 0%, #10b981 40%, #6ee7b7 60%, #047857 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .card-enter {
          animation: fadeSlideUp 0.5s ease forwards;
        }
        .icon-pop {
          animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
        }
        .btn-hover {
          transition: all 0.2s ease;
        }
        .btn-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(5,150,105,0.3);
        }
      `}</style>

      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={220}
          recycle={false}
          colors={["#059669", "#10b981", "#6ee7b7", "#fcd34d", "#fca5a5", "#a7f3d0"]}
        />
      )}

      <div className="min-h-screen bg-[#F4FAF7] flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-100 rounded-full filter blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-100 rounded-full filter blur-3xl opacity-30 pointer-events-none" />

        {/* Floating particles */}
        {particles.map((p, i) => (
          <Particle key={i} style={{ ...p, position: "absolute" }} />
        ))}

        {/* ── Main card ── */}
        <div className="relative w-full max-w-lg card-enter">
          <div className="bg-white rounded-3xl overflow-hidden"
            style={{ boxShadow: "0 24px 64px rgba(5,90,50,0.12), 0 4px 16px rgba(5,90,50,0.06)" }}>

            {/* Green top band */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 h-2" />

            <div className="px-8 pt-1 pb-1 sm:px-10">

              {/* ── Check icon ── */}
              <div className="flex justify-center mb-6">
                <div className="icon-pop relative">
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-full bg-green-100 scale-125 opacity-60 blur-md" />
                  <div className="relative w-20 h-20">
                    <AnimatedCheck />
                  </div>
                </div>
              </div>

              {/* ── Heading ── */}
              <div className="text-center mb-7"
                style={{ animation: "fadeSlideUp 0.4s ease forwards 0.3s", opacity: 0 }}>
                <p className="text-xs font-bold text-green-500 uppercase tracking-[0.2em] mb-2">
                  Order Confirmed
                </p>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight shimmer-text mb-3">
                  Payment Received!
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
                  Thank you for shopping with Franko Trading. Your order is confirmed and will be processed shortly.
                </p>
              </div>

              {/* ── Order ref card ── */}
              <div
                className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl px-5 py-4 mb-6"
                style={{ animation: "fadeSlideUp 0.4s ease forwards 0.45s", opacity: 0 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">
                      Order Reference
                    </p>
                    <p className="font-black text-gray-900 text-lg font-mono tracking-wide">
                      {orderId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Placed
                    </p>
                    <p className="text-sm font-semibold text-gray-600">{orderTime}</p>
                  </div>
                </div>
              </div>

              {/* ── What's next steps ── */}
              <div
                className="mb-7"
                style={{ animation: "fadeSlideUp 0.4s ease forwards 0.55s", opacity: 0 }}
              >
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  What happens next
                </p>
                <div className="space-y-3">
                  <StepRow icon="✉️" label="You will receive a call from our order fulfillment team shortly" delay="0.65s" />
                  <StepRow icon="📦" label="Our team will prepare and pack your order" delay="0.75s" />
                  <StepRow icon="🚚" label="Your order will be dispatched for delivery" delay="0.85s" />
                  <StepRow icon="🎉" label="Enjoy your purchase from Franko Trading!" delay="0.95s" />
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="border-t border-dashed border-gray-100 mb-6" style={{ animation: "fadeSlideUp 0.4s ease forwards 0.9s", opacity: 0 }} />

              {/* ── CTA buttons ── */}
              <div
                className="flex flex-col sm:flex-row gap-3"
                style={{ animation: "fadeSlideUp 0.4s ease forwards 1s", opacity: 0 }}
              >
                <button
                  onClick={() => navigate("/order-history")}
                  className="btn-hover flex-1 py-3.5 px-5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2"
                  style={{ boxShadow: "0 4px 16px rgba(5,150,105,0.3)" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  View My Orders
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="btn-hover flex-1 py-3.5 px-5 border-2 border-green-200 text-green-700 font-bold text-sm rounded-xl hover:bg-green-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Back to Home
                </button>
              </div>

              {/* ── Footer note ── */}
              <p
                className="text-center text-xs text-gray-400 mt-5"
                style={{ animation: "fadeSlideUp 0.4s ease forwards 1.1s", opacity: 0 }}
              >
                Need help?{" "}
                <span className="text-green-600 font-semibold cursor-pointer hover:underline">
                  Contact support
                </span>
              </p>
            </div>

            {/* Green bottom band */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 h-1 opacity-30" />
          </div>

          {/* Subtle card glow */}
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-green-400/10 to-transparent pointer-events-none" />
        </div>
      </div>
    </>
  );
};

export default OrderSuccessPage;