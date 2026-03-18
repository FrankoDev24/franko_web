import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import {
  CheckCircle,
  Home,
  ClipboardList,
  HelpCircle,
  ShoppingBag,
  Clock,
} from "lucide-react";

const OrderReceived = () => {
  const navigate = useNavigate();
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "order_received",
      pageType: "OrderConfirmation",
      timestamp: new Date().toISOString(),
    });

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(countdownInterval);
      window.removeEventListener("resize", handleResize);
    };
  }, [navigate]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700;800;900&display=swap');

        :root {
          --ov-font: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --ov-green: #14532d;
          --ov-green-mid: #166534;
          --ov-green-600: #16a34a;
          --ov-green-accent: #22c55e;
          --ov-green-light: #dcfce7;
          --ov-green-lighter: #f0fdf4;
          --ov-dark: #1a1a1a;
          --ov-mid: #555;
          --ov-light: #888;
          --ov-border: #e0e0e0;
          --ov-bg: #f7f7f7;
          --ov-radius: 4px;
        }

        .ov-root, .ov-root * {
          font-family: var(--ov-font) !important;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          box-sizing: border-box;
        }

        .ov-root {
          min-height: 100vh;
          background: #fff;
          display: flex;
          flex-direction: column;
        }

        .ov-container {
          max-width: 520px;
          margin: 0 auto;
          padding: 32px 16px;
          width: 100%;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        @media (min-width: 768px) {
          .ov-container { padding: 48px 24px; }
        }

        /* ==================== HEADER ==================== */

        .ov-page-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--ov-border);
        }

        .ov-page-header-accent {
          width: 4px; height: 28px; border-radius: 2px;
          background: var(--ov-green-600); flex-shrink: 0;
        }

        .ov-page-title {
          font-size: 22px; font-weight: 800; color: var(--ov-dark);
          letter-spacing: -0.02em; margin: 0; line-height: 1.2;
        }
        @media (min-width: 768px) { .ov-page-title { font-size: 26px; } }

        .ov-page-count {
          font-size: 13px; font-weight: 500; color: var(--ov-light); margin-top: 2px;
        }

        .ov-page-header-line {
          flex: 1; height: 1px; background: var(--ov-border); display: none;
        }
        @media (min-width: 768px) { .ov-page-header-line { display: block; } }

        /* ==================== CARD ==================== */

        .ov-card {
          background: #fff;
          border: 1px solid var(--ov-border);
          border-radius: var(--ov-radius);
          overflow: hidden;
          opacity: 0;
          transform: translateY(12px);
          transition: all 0.5s ease;
        }
        .ov-card-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ==================== BANNER ==================== */

        .ov-banner {
          background: var(--ov-green);
          padding: 32px 24px;
          text-align: center;
        }

        .ov-banner-icon-wrap {
          width: 72px; height: 72px;
          margin: 0 auto 16px;
          position: relative;
        }

        .ov-banner-icon-glow {
          position: absolute; inset: -8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%; filter: blur(8px);
        }

        .ov-banner-icon-inner {
          position: relative;
          width: 72px; height: 72px;
          background: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .ov-banner-badge {
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

        .ov-banner-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--ov-green-accent);
          animation: ov-pulse 2s ease-in-out infinite;
        }
        @keyframes ov-pulse {
          0%, 100% { opacity: 0.4; } 50% { opacity: 1; }
        }

        .ov-banner-title {
          font-size: 26px; font-weight: 900; color: #fff;
          letter-spacing: -0.02em; margin: 0 0 6px;
        }
        @media (min-width: 768px) { .ov-banner-title { font-size: 30px; } }

        .ov-banner-desc {
          font-size: 14px; font-weight: 500;
          color: rgba(255, 255, 255, 0.75);
          margin: 0; max-width: 340px;
          line-height: 1.5;
          display: inline-block;
        }

        /* ==================== BODY ==================== */

        .ov-body { padding: 24px; }

        /* ==================== MESSAGE BOX ==================== */

        .ov-message-box {
          background: var(--ov-green-lighter);
          border: 1px solid #bbf7d0;
          border-radius: var(--ov-radius);
          padding: 16px;
          margin-bottom: 24px;
          text-align: center;
        }

        .ov-message-text {
          font-size: 14px; font-weight: 600;
          color: var(--ov-green-mid);
          line-height: 1.6; margin: 0;
        }

        /* ==================== ACTIONS ==================== */

        .ov-actions {
          display: flex; flex-direction: column; gap: 10px;
          margin-bottom: 20px;
        }
        @media (min-width: 640px) {
          .ov-actions { flex-direction: row; }
        }

        .ov-btn {
          flex: 1; padding: 14px 20px;
          border: none; border-radius: var(--ov-radius);
          font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.15s;
          font-family: var(--ov-font);
          display: flex; align-items: center;
          justify-content: center; gap: 8px;
        }
        .ov-btn:active { transform: scale(0.98); }

        .ov-btn-primary {
          background: var(--ov-green);
          color: #fff;
        }
        .ov-btn-primary:hover {
          background: var(--ov-green-mid);
          box-shadow: 0 4px 16px rgba(20, 83, 45, 0.2);
          transform: translateY(-1px);
        }

        .ov-btn-secondary {
          background: #fff;
          color: var(--ov-mid);
          border: 1px solid var(--ov-border);
        }
        .ov-btn-secondary:hover {
          border-color: var(--ov-green-accent);
          color: var(--ov-green);
          background: var(--ov-green-lighter);
          transform: translateY(-1px);
        }

        /* ==================== REDIRECT BAR ==================== */

        .ov-redirect-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--ov-bg);
          border: 1px solid var(--ov-border);
          border-radius: var(--ov-radius);
          margin-bottom: 20px;
        }

        .ov-redirect-text {
          font-size: 12px; font-weight: 600;
          color: var(--ov-light);
        }

        .ov-redirect-countdown {
          font-size: 13px; font-weight: 900;
          color: var(--ov-green-600);
          font-variant-numeric: tabular-nums;
          min-width: 20px; text-align: center;
        }

        .ov-redirect-progress {
          width: 100%; height: 3px;
          background: var(--ov-border);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 6px;
        }

        .ov-redirect-fill {
          height: 100%;
          background: var(--ov-green-600);
          border-radius: 2px;
          transition: width 1s linear;
        }

        /* ==================== DIVIDER ==================== */

        .ov-divider {
          height: 1px;
          background: var(--ov-border);
          margin-bottom: 20px;
        }

        /* ==================== SUPPORT ==================== */

        .ov-support { text-align: center; }

        .ov-support-link {
          display: inline-flex;
          align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600;
          color: var(--ov-light);
          text-decoration: none;
          cursor: pointer;
          border: none; background: none;
          padding: 0; font-family: var(--ov-font);
          transition: color 0.15s;
        }
        .ov-support-link:hover { color: var(--ov-green-600); }

        .ov-support-text {
          text-decoration: underline;
          text-underline-offset: 2px;
        }
      `}</style>

      <Confetti
        width={dimensions.width}
        height={dimensions.height}
        recycle={false}
        numberOfPieces={600}
        colors={[
          "#14532d",
          "#16a34a",
          "#22c55e",
          "#dcfce7",
          "#fcd34d",
          "#fca5a5",
        ]}
        style={{ position: "fixed", top: 0, left: 0, zIndex: 100, pointerEvents: "none" }}
      />

      <div className="ov-root">
        <div className="ov-container">
          {/* Page Header */}
          <div className="ov-page-header">
            <div className="ov-page-header-accent" />
            <div>
              <h1 className="ov-page-title">Order Received</h1>
              <p className="ov-page-count">Your order has been placed successfully</p>
            </div>
            <div className="ov-page-header-line" />
          </div>

          {/* Main Card */}
          <div className={`ov-card ${isVisible ? "ov-card-visible" : ""}`}>
            {/* Banner */}
            <div className="ov-banner">
              <div className="ov-banner-icon-wrap">
                <div className="ov-banner-icon-glow" />
                <div className="ov-banner-icon-inner">
                  <CheckCircle
                    style={{ width: 36, height: 36, color: "#16a34a" }}
                  />
                </div>
              </div>

              <div className="ov-banner-badge">
                <span className="ov-banner-badge-dot" />
                Order Confirmed
              </div>

              <h2 className="ov-banner-title">Order Received!</h2>
              <p className="ov-banner-desc">
                Thank you for your purchase. Your order has been successfully
                placed and our team will process it shortly.
              </p>
            </div>

            {/* Body */}
            <div className="ov-body">
              {/* Message */}
              <div className="ov-message-box">
                <p className="ov-message-text">
                  Our fulfillment team will contact you soon to confirm your
                  order details and delivery schedule.
                </p>
              </div>

              {/* Redirect Countdown */}
              <div className="ov-redirect-bar">
                <Clock
                  style={{
                    width: 14,
                    height: 14,
                    color: "var(--ov-light)",
                    flexShrink: 0,
                  }}
                />
                <span className="ov-redirect-text">
                  Redirecting to home in
                </span>
                <span className="ov-redirect-countdown">{countdown}s</span>
              </div>

              {/* Actions */}
              <div className="ov-actions">
                <button
                  onClick={() => navigate("/order-history")}
                  className="ov-btn ov-btn-primary"
                >
                  <ClipboardList style={{ width: 18, height: 18 }} />
                  View My Orders
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="ov-btn ov-btn-secondary"
                >
                  <Home style={{ width: 18, height: 18 }} />
                  Continue Shopping
                </button>
              </div>

              {/* Divider */}
              <div className="ov-divider" />

              {/* Support */}
              <div className="ov-support">
                <button
                  onClick={() => navigate("/contact")}
                  className="ov-support-link"
                >
                  <HelpCircle style={{ width: 15, height: 15 }} />
                  <span className="ov-support-text">
                    Need help? Contact Support
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderReceived;