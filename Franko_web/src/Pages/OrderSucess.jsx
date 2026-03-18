import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { checkOutOrder, updateOrderDelivery } from "../Redux/Slice/orderSlice";
import { clearCart } from "../Redux/Slice/cartSlice";
import { message } from "antd";
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";
import {
  ClipboardList,
  Home,
  HelpCircle,
  Package,
  Truck,
  PartyPopper,
  PhoneCall,
} from "lucide-react";

const AnimatedCheck = () => (
  <svg viewBox="0 0 52 52" style={{ width: "100%", height: "100%" }} fill="none">
    <style>{`
      .or-check-circle {
        stroke-dasharray: 166;
        stroke-dashoffset: 166;
        animation: or-stroke-circle 0.5s cubic-bezier(0.65, 0, 0.45, 1) 0.1s forwards;
      }
      .or-check-mark {
        stroke-dasharray: 48;
        stroke-dashoffset: 48;
        animation: or-stroke-check 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.55s forwards;
      }
      @keyframes or-stroke-circle { to { stroke-dashoffset: 0; } }
      @keyframes or-stroke-check { to { stroke-dashoffset: 0; } }
    `}</style>
    <circle className="or-check-circle" cx="26" cy="26" r="25" stroke="#16a34a" strokeWidth="2" fill="none" />
    <path className="or-check-mark" d="M14.5 26.5l8 8 15-16" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const OrderReceivedPage = () => {
  const dispatch = useDispatch();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { width, height } = useWindowSize();

  const [showConfetti, setShowConfetti] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
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
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  useEffect(() => {
    if (window.gtag) {
      window.gtag("event", "page_view", {
        page_location: window.location.href,
        page_title: "Order Received Page",
      });
    }

    const handleOrderCompletion = async () => {
      try {
        const checkoutDetails = localStorage.getItem("checkoutDetails");
        const addressDetails = localStorage.getItem("orderAddressDetails");

        if (!checkoutDetails || !addressDetails) return;
        if (checkoutDetails.orderCode !== orderId) return;

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

  const steps = [
    {
      icon: PhoneCall,
      label: "You will receive a call from our order fulfillment team shortly",
    },
    {
      icon: Package,
      label: "Our team will prepare and pack your order",
    },
    {
      icon: Truck,
      label: "Your order will be dispatched for delivery",
    },
    {
      icon: PartyPopper,
      label: "Enjoy your purchase from Franko Trading!",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700;800;900&display=swap');

        :root {
          --or-font: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --or-green: #14532d;
          --or-green-mid: #166534;
          --or-green-600: #16a34a;
          --or-green-accent: #22c55e;
          --or-green-light: #dcfce7;
          --or-green-lighter: #f0fdf4;
          --or-dark: #1a1a1a;
          --or-mid: #555;
          --or-light: #888;
          --or-border: #e0e0e0;
          --or-bg: #f7f7f7;
          --or-radius: 4px;
        }

        .or-root, .or-root * {
          font-family: var(--or-font) !important;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          box-sizing: border-box;
        }

        .or-root {
          min-height: 100vh;
          background: #fff;
          display: flex;
          flex-direction: column;
        }

        .or-container {
          max-width: 560px;
          margin: 0 auto;
          padding: 32px 16px;
          width: 100%;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        @media (min-width: 768px) {
          .or-container { padding: 48px 24px; }
        }

        .or-page-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--or-border);
        }

        .or-page-header-accent {
          width: 4px; height: 28px; border-radius: 2px;
          background: var(--or-green-600); flex-shrink: 0;
        }

        .or-page-title {
          font-size: 22px; font-weight: 800; color: var(--or-dark);
          letter-spacing: -0.02em; margin: 0; line-height: 1.2;
        }
        @media (min-width: 768px) { .or-page-title { font-size: 26px; } }

        .or-page-count {
          font-size: 13px; font-weight: 500; color: var(--or-light); margin-top: 2px;
        }

        .or-page-header-line {
          flex: 1; height: 1px; background: var(--or-border); display: none;
        }
        @media (min-width: 768px) { .or-page-header-line { display: block; } }

        .or-card {
          background: #fff;
          border: 1px solid var(--or-border);
          border-radius: var(--or-radius);
          overflow: hidden;
          opacity: 0;
          transform: translateY(12px);
          transition: all 0.5s ease;
        }
        .or-card-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .or-banner {
          background: var(--or-green);
          padding: 32px 24px;
          text-align: center;
        }

        .or-banner-icon-wrap {
          width: 72px; height: 72px;
          margin: 0 auto 16px;
          position: relative;
        }

        .or-banner-icon-glow {
          position: absolute; inset: -8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%; filter: blur(8px);
        }

        .or-banner-icon-inner {
          position: relative;
          width: 72px; height: 72px;
          background: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .or-banner-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          border-radius: 100px;
          padding: 4px 14px;
          margin-bottom: 12px;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .or-banner-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--or-green-accent);
          animation: or-pulse 2s ease-in-out infinite;
        }
        @keyframes or-pulse {
          0%, 100% { opacity: 0.4; } 50% { opacity: 1; }
        }

        .or-banner-title {
          font-size: 26px; font-weight: 900; color: #fff;
          letter-spacing: -0.02em; margin: 0 0 6px;
        }
        @media (min-width: 768px) { .or-banner-title { font-size: 30px; } }

        .or-banner-desc {
          font-size: 14px; font-weight: 500;
          color: rgba(255, 255, 255, 0.75);
          margin: 0; max-width: 360px;
          line-height: 1.5;
          display: inline-block;
        }

        .or-body { padding: 24px; }

        .or-ref-card {
          background: var(--or-green-lighter);
          border: 1px solid #bbf7d0;
          border-radius: var(--or-radius);
          padding: 16px 20px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .or-ref-label {
          font-size: 10px; font-weight: 700;
          color: var(--or-green-mid);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 4px;
        }

        .or-ref-value {
          font-size: 18px; font-weight: 900;
          color: var(--or-green);
          font-family: 'SF Mono', 'Fira Code', monospace, var(--or-font);
          letter-spacing: 0.02em;
        }

        .or-ref-time {
          font-size: 13px; font-weight: 600;
          color: var(--or-mid);
        }

        .or-steps-section { margin-bottom: 24px; }

        .or-steps-title {
          font-size: 11px; font-weight: 700;
          color: var(--or-light);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 14px;
        }

        .or-steps-list {
          display: flex; flex-direction: column; gap: 0;
        }

        .or-step {
          display: flex; gap: 12px;
        }

        .or-step-col {
          display: flex; flex-direction: column;
          align-items: center;
        }

        .or-step-icon-wrap {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--or-green-light);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--or-green-600);
        }

        .or-step-line {
          width: 2px; flex: 1;
          min-height: 12px; margin: 4px 0;
          border-radius: 1px;
          background: #d1fae5;
        }

        .or-step-text {
          font-size: 14px; font-weight: 500;
          color: var(--or-mid);
          padding-top: 5px;
          padding-bottom: 16px;
          line-height: 1.5;
        }

        .or-step-text-last {
          font-weight: 700;
          color: var(--or-green-600);
          padding-bottom: 0;
        }

        .or-actions {
          display: flex; flex-direction: column; gap: 10px;
          margin-bottom: 20px;
        }
        @media (min-width: 640px) {
          .or-actions { flex-direction: row; }
        }

        .or-btn {
          flex: 1; padding: 14px 20px;
          border: none; border-radius: var(--or-radius);
          font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.15s;
          font-family: var(--or-font);
          display: flex; align-items: center;
          justify-content: center; gap: 8px;
        }
        .or-btn:active { transform: scale(0.98); }

        .or-btn-primary {
          background: var(--or-green);
          color: #fff;
        }
        .or-btn-primary:hover {
          background: var(--or-green-mid);
          box-shadow: 0 4px 16px rgba(20, 83, 45, 0.2);
          transform: translateY(-1px);
        }

        .or-btn-secondary {
          background: #fff;
          color: var(--or-mid);
          border: 1px solid var(--or-border);
        }
        .or-btn-secondary:hover {
          border-color: var(--or-green-accent);
          color: var(--or-green);
          background: var(--or-green-lighter);
          transform: translateY(-1px);
        }

        .or-divider {
          height: 1px;
          background: var(--or-border);
          margin-bottom: 20px;
        }

        .or-support { text-align: center; }

        .or-support-link {
          display: inline-flex;
          align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600;
          color: var(--or-light);
          text-decoration: none;
          cursor: pointer;
          border: none; background: none;
          padding: 0; font-family: var(--or-font);
          transition: color 0.15s;
        }
        .or-support-link:hover { color: var(--or-green-600); }

        .or-support-text {
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .or-note {
          margin-top: 24px;
          padding: 16px;
          background: var(--or-bg);
          border: 1px solid var(--or-border);
          border-radius: var(--or-radius);
          text-align: center;
          opacity: 0;
          transform: translateY(12px);
          transition: all 0.5s ease 0.2s;
        }
        .or-note-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .or-note-text {
          font-size: 12px; font-weight: 500;
          color: var(--or-light);
          line-height: 1.6; margin: 0;
        }

        .or-note-text strong {
          font-weight: 700;
          color: var(--or-green-600);
        }
      `}</style>

      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={200}
          recycle={false}
          colors={[
            "#14532d",
            "#16a34a",
            "#22c55e",
            "#dcfce7",
            "#fcd34d",
            "#fca5a5",
          ]}
        />
      )}

      <div className="or-root">
        <div className="or-container">
          {/* Page Header */}
          <div className="or-page-header">
            <div className="or-page-header-accent" />
            <div>
              <h1 className="or-page-title">Order Received</h1>
              <p className="or-page-count">Your order has been placed successfully</p>
            </div>
            <div className="or-page-header-line" />
          </div>

          {/* Main Card */}
          <div className={`or-card ${isVisible ? "or-card-visible" : ""}`}>
            {/* Success Banner */}
            <div className="or-banner">
              <div className="or-banner-icon-wrap">
                <div className="or-banner-icon-glow" />
                <div className="or-banner-icon-inner">
                  <div style={{ width: 44, height: 44 }}>
                    <AnimatedCheck />
                  </div>
                </div>
              </div>

              <div className="or-banner-badge">
                <span className="or-banner-badge-dot" />
                Order Confirmed
              </div>

              <h2 className="or-banner-title">Payment Received!</h2>
              <p className="or-banner-desc">
                Thank you for shopping with Franko Trading. Your order is confirmed
                and will be processed shortly.
              </p>
            </div>

            {/* Body */}
            <div className="or-body">
              {/* Order Reference */}
              <div className="or-ref-card">
                <div>
                  <p className="or-ref-label">Order Reference</p>
                  <p className="or-ref-value">{orderId}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="or-ref-label">Placed</p>
                  <p className="or-ref-time">{orderTime}</p>
                </div>
              </div>

              {/* What Happens Next */}
              <div className="or-steps-section">
                <p className="or-steps-title">What happens next</p>
                <div className="or-steps-list">
                  {steps.map((step, idx) => {
                    const isLast = idx === steps.length - 1;
                    const Icon = step.icon;
                    return (
                      <div key={idx} className="or-step">
                        <div className="or-step-col">
                          <div className="or-step-icon-wrap">
                            <Icon style={{ width: 16, height: 16 }} />
                          </div>
                          {!isLast && <div className="or-step-line" />}
                        </div>
                        <p
                          className={`or-step-text ${
                            isLast ? "or-step-text-last" : ""
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="or-actions">
                <button
                  onClick={() => navigate("/order-history")}
                  className="or-btn or-btn-primary"
                >
                  <ClipboardList style={{ width: 18, height: 18 }} />
                  View My Orders
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="or-btn or-btn-secondary"
                >
                  <Home style={{ width: 18, height: 18 }} />
                  Back to Home
                </button>
              </div>

              {/* Divider */}
              <div className="or-divider" />

              {/* Support */}
              <div className="or-support">
                <button
                  onClick={() => navigate("/contact")}
                  className="or-support-link"
                >
                  <HelpCircle style={{ width: 15, height: 15 }} />
                  <span className="or-support-text">
                    Need help? Contact Support
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Note */}
          <div
            className={`or-note ${isVisible ? "or-note-visible" : ""}`}
          >
            <p className="or-note-text">
              <strong>Your order has been received.</strong> Our team will
              contact you shortly to confirm your order details and delivery
              schedule. Save your order reference
              <strong> {orderId}</strong> for tracking.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderReceivedPage;