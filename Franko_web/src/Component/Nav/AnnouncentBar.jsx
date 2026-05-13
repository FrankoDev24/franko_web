import React, { useState, useEffect, useCallback } from "react";

const promoMessages = [
  { text: "Free Delivery Within Accra & Kumasi", badge: "🚚 FREE SHIPPING", highlight: "FREE" },
  { text: "On All Products Purchased Online", badge: "🛒 SHOP ONLINE", highlight: "ALL" },
  { text: "Save More With Free Delivery Today", badge: "✨ LIMITED OFFER", highlight: "TODAY" },
];

const AnnouncementBar = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [direction, setDirection] = useState("up");
  const [isVisible, setIsVisible] = useState(true);
  const [showBar, setShowBar] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [timeProgress, setTimeProgress] = useState(0);

  useEffect(() => {
    requestAnimationFrame(() => setShowBar(true));
  }, []);

  const nextMessage = useCallback(() => {
    setDirection("up");
    setIsVisible(false);
    setTimeProgress(0);
    setTimeout(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % promoMessages.length);
      setDirection("up");
      setIsVisible(true);
    }, 200);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextMessage, 4500);
    return () => clearInterval(interval);
  }, [isPaused, nextMessage]);

  useEffect(() => {
    if (isPaused) return;
    setTimeProgress(0);
    const startTime = Date.now();
    const duration = 4500;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setTimeProgress(progress);
      if (progress < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [currentMessageIndex, isPaused]);

  const goToMessage = (idx) => {
    if (idx === currentMessageIndex) return;
    setDirection(idx > currentMessageIndex ? "up" : "down");
    setIsVisible(false);
    setTimeProgress(0);
    setTimeout(() => {
      setCurrentMessageIndex(idx);
      setIsVisible(true);
    }, 350);
  };

  const TruckIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 3h15v13H1z" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );

  const PhoneIcon = ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );

  const WhatsAppIcon = ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
    </svg>
  );

  const SparkleIcon = ({ size = 10 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
      <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41Z" />
    </svg>
  );

  const currentMsg = promoMessages[currentMessageIndex];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .ab-root * {
          font-family: 'DM Sans', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        @keyframes ab-slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes ab-drive {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(3px) rotate(-1deg); }
          50% { transform: translateX(0) rotate(0deg); }
          75% { transform: translateX(2px) rotate(0.5deg); }
        }

        @keyframes ab-marquee-shine {
          0% { left: -60%; }
          100% { left: 160%; }
        }

        @keyframes ab-gradient-shift {
          0% { background-position: 0% 50%; }
          25% { background-position: 50% 25%; }
          50% { background-position: 100% 50%; }
          75% { background-position: 50% 75%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes ab-badge-pop {
          0% { transform: scale(0.7) rotate(-3deg); opacity: 0; }
          50% { transform: scale(1.08) rotate(1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        @keyframes ab-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }

        @keyframes ab-pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(6,95,70,0.3); }
          70% { box-shadow: 0 0 0 4px rgba(6,95,70,0); }
          100% { box-shadow: 0 0 0 0 rgba(6,95,70,0); }
        }

        @keyframes ab-sparkle-rotate {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(90deg) scale(0.8); }
          50% { transform: rotate(180deg) scale(1.1); }
          75% { transform: rotate(270deg) scale(0.9); }
          100% { transform: rotate(360deg) scale(1); }
        }

        .ab-root {
          animation: ab-slideDown 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform;
        }

        .ab-bg {
          background: linear-gradient(135deg, #86efac 0%, #6ee7b7 20%, #a7f3d0 40%, #86efac 60%, #6ee7b7 80%, #a7f3d0 100%);
          background-size: 400% 400%;
          animation: ab-gradient-shift 12s ease-in-out infinite;
          position: relative;
        }

        .ab-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.04) 100%);
          pointer-events: none;
        }

        .ab-shine {
          position: relative;
          overflow: hidden;
        }

        .ab-shine::before {
          content: '';
          position: absolute;
          top: 0;
          left: -60%;
          width: 35%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), rgba(255,255,255,0.35), rgba(255,255,255,0.2), transparent);
          animation: ab-marquee-shine 6s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        }

        .ab-truck {
          animation: ab-drive 2.5s ease-in-out infinite;
          display: inline-flex;
          filter: drop-shadow(0 1px 1px rgba(6,78,59,0.3));
        }

        .ab-badge-enter {
          animation: ab-badge-pop 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .ab-msg-visible {
          transform: translateY(0);
          opacity: 1;
          filter: blur(0);
          transition: all 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .ab-msg-hidden-up {
          transform: translateY(-130%);
          opacity: 0;
          filter: blur(2px);
          transition: all 0.35s cubic-bezier(0.55, 0, 1, 0.45);
        }

        .ab-msg-hidden-down {
          transform: translateY(130%);
          opacity: 0;
          filter: blur(2px);
          transition: all 0.35s cubic-bezier(0.55, 0, 1, 0.45);
        }

        /* ═══ 3D TEXT SHADOW STYLES ═══ */
        .ab-text-3d {
          text-shadow:
            0 4px 0 rgba(167, 243, 208, 0.9),
            0 5px 0 rgba(134, 239, 172, 0.6),
            0 4px 1px rgba(6, 78, 59, 0.08),
            0 0 2px rgba(6, 95, 70, 0.06),
            0 1px 3px rgba(6, 78, 59, 0.12),
            0 3px 5px rgba(6, 78, 59, 0.06);
        }

        .ab-text-3d-badge {
          text-shadow:
            0 1px 0 rgba(4, 47, 30, 0.5),
            0 2px 2px rgba(0, 0, 0, 0.15),
            0 4 19px rgba(209, 250, 229, 0.2);
        }

        .ab-text-3d-label {
          text-shadow:
            0 1px 0 rgba(167, 243, 208, 0.8),
            0 1px 2px rgba(6, 78, 59, 0.06);
        }

        .ab-text-3d-btn-light {
          text-shadow:
            0 1px 0 rgba(167, 243, 208, 0.7),
            0 1px 2px rgba(6, 78, 59, 0.08);
        }

        .ab-text-3d-btn-dark {
          text-shadow:
            0 1px 0 rgba(0, 0, 0, 0.2),
            0 2px 3px rgba(0, 0, 0, 0.12),
            0 0 6px rgba(37, 211, 102, 0.15);
        }

        .ab-text-3d-mobile {
          text-shadow:
            0 1px 0 rgba(167, 243, 208, 0.85),
            0 1px 1px rgba(6, 78, 59, 0.06),
            0 2px 3px rgba(6, 78, 59, 0.04);
        }

        .ab-link {
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          cursor: pointer;
          text-decoration: none;
          position: relative;
          overflow: hidden;
          will-change: transform;
        }

        .ab-link::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .ab-link:hover::after {
          opacity: 1;
        }

        .ab-link:hover {
          transform: translateY(-2px) scale(1.03);
        }

        .ab-link:active {
          transform: translateY(0) scale(0.97);
          transition-duration: 0.1s;
        }

        .ab-link-phone:hover {
          box-shadow: 0 6px 20px rgba(6,95,70,0.15), 0 0 0 1px rgba(6,95,70,0.1), inset 0 -2px 4px rgba(0,0,0,0.03);
        }

        .ab-link-wa:hover {
          box-shadow: 0 6px 24px rgba(37,211,102,0.4), 0 0 0 1px rgba(37,211,102,0.2), inset 0 -2px 4px rgba(0,0,0,0.08);
        }

        .ab-indicator {
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          border: none;
          padding: 0;
          position: relative;
          background: transparent;
          outline: none;
        }

        .ab-indicator:hover {
          transform: scale(1.4);
        }

        .ab-indicator:focus-visible {
          outline: 2px solid #065f46;
          outline-offset: 2px;
          border-radius: 100px;
        }

        .ab-indicator-active {
          animation: ab-pulse-ring 2s ease-out infinite;
        }

        .ab-divider {
          width: 1px;
          height: 22px;
          background: linear-gradient(to bottom, transparent 5%, rgba(6,95,70,0.12) 30%, rgba(6,95,70,0.12) 70%, transparent 95%);
          flex-shrink: 0;
        }

        .ab-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: 'Plus Jakarta Sans', 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 3.5px 11px;
          border-radius: 100px;
          white-space: nowrap;
          position: relative;
          overflow: hidden;
        }

        .ab-badge::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%);
          pointer-events: none;
        }

        .ab-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ab-sparkle {
          animation: ab-sparkle-rotate 4s linear infinite;
          display: inline-flex;
          opacity: 0.5;
          filter: drop-shadow(0 0 2px rgba(6,95,70,0.3));
        }

        .ab-progress-container {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: rgba(6,95,70,0.06);
          overflow: hidden;
        }

        .ab-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, rgba(6,95,70,0.15), rgba(6,95,70,0.4));
          border-radius: 0 1px 1px 0;
          transition: width 0.1s linear;
          box-shadow: 0 0 4px rgba(6,95,70,0.1);
        }

        .ab-contact-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10px;
          font-weight: 700;
          color: #065f46;
          opacity: 0.4;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          white-space: nowrap;
          animation: ab-float 3s ease-in-out infinite;
        }

        .ab-phone-text,
        .ab-wa-text {
          font-family: 'DM Sans', sans-serif;
          font-variant-numeric: tabular-nums;
        }

        @media (hover: none) {
          .ab-link:active {
            transform: scale(0.95);
            opacity: 0.9;
          }
          .ab-link:hover {
            transform: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ab-root,
          .ab-truck,
          .ab-sparkle,
          .ab-bg,
          .ab-shine::before,
          .ab-contact-label {
            animation: none !important;
          }
          .ab-msg-visible,
          .ab-msg-hidden-up,
          .ab-msg-hidden-down {
            transition: opacity 0.2s ease !important;
            transform: none !important;
            filter: none !important;
          }
        }
      `}</style>

      {/* ════════════ DESKTOP ════════════ */}
      <div
        className={`ab-root hidden md:block ${showBar ? "" : "opacity-0"}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="banner"
        aria-label="Promotional announcements"
        aria-live="polite"
      >
        <div className="ab-bg">
          <div className="ab-shine">
            <div
              style={{
                maxWidth: "1440px",
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 40px",
                height: "38px",
                position: "relative",
                zIndex: 2,
              }}
            >
              {/* ── Left: Promo ── */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, justifyContent: "center" }}>
                <div className="ab-sparkle" style={{ color: "#065f46", flexShrink: 0 }}>
                  <SparkleIcon size={8} />
                </div>

                <div className="ab-truck" style={{ color: "#065f46", flexShrink: 0 }}>
                  <TruckIcon size={18} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden", height: "26px" }}>
                  <div
                    key={`badge-${currentMessageIndex}`}
                    className="ab-badge ab-badge-enter ab-text-3d-badge"
                    style={{
                      background: "linear-gradient(135deg, #065f46 0%, #064e3b 100%)",
                      color: "#d1fae5",
                      boxShadow: "0 2px 10px rgba(6,95,70,0.3), inset 0 1px 0 rgba(255,255,255,0.1), 0 3px 1px rgba(6,78,59,0.15)",
                    }}
                  >
                    {currentMsg.badge}
                  </div>

                  <div style={{ position: "relative", height: "26px", overflow: "hidden", minWidth: "220px" }}>
                    <div
                      className={isVisible ? "ab-msg-visible" : direction === "up" ? "ab-msg-hidden-up" : "ab-msg-hidden-down"}
                      style={{ display: "flex", alignItems: "center", height: "26px" }}
                    >
                      <span
                        className="ab-text ab-text-3d"
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "18px",
                          fontWeight: 800,
                          color: "#064e3b",
                          letterSpacing: "0.2px",
                        }}
                      >
                        {currentMsg.text}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ab-sparkle" style={{ color: "#065f46", flexShrink: 0, animationDelay: "2s" }}>
                  <SparkleIcon size={6} />
                </div>

                <div style={{ display: "flex", gap: "7px", marginLeft: "4px", alignItems: "center" }}>
                  {promoMessages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToMessage(idx)}
                      className={`ab-indicator ${idx === currentMessageIndex ? "ab-indicator-active" : ""}`}
                      aria-label={`Go to message ${idx + 1}`}
                      aria-current={idx === currentMessageIndex ? "true" : "false"}
                      style={{
                        width: idx === currentMessageIndex ? "22px" : "7px",
                        height: "7px",
                        borderRadius: "100px",
                        backgroundColor: idx === currentMessageIndex ? "#065f46" : "rgba(6,95,70,0.15)",
                        boxShadow: idx === currentMessageIndex
                          ? "0 9px 20px rgba(6,95,70,0.35), 0 2px 2px rgba(6,78,59,0.15)"
                          : "inset 0 1px 1px rgba(0,0,0,0.05)",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="ab-divider" style={{ margin: "0 28px" }} />

              {/* ── Right: Contact ── */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                <span className="ab-contact-label ab-text-3d-label font-black">
                  Need Help?
                </span>

                <a
                  href="tel:+233302225651"
                  className="ab-link ab-link-phone"
                  onMouseEnter={() => setHoveredLink("phone")}
                  onMouseLeave={() => setHoveredLink(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    backgroundColor: hoveredLink === "phone" ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    borderRadius: "100px",
                    padding: "6px 18px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#065f46",
                    border: "1px solid rgba(255,255,255,0.7)",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 0 rgba(6,78,59,0.04)",
                  }}
                >
                  <PhoneIcon size={13} />
                  <span className="ab-phone-text ab-text-3d-btn-light">030 222 5651 / 024 642 2338</span>
                </a>

                {/* <a
                  href="https://wa.me/233503607980"
                  className="ab-link ab-link-wa"
                  onMouseEnter={() => setHoveredLink("wa")}
                  onMouseLeave={() => setHoveredLink(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    background: hoveredLink === "wa"
                      ? "linear-gradient(135deg, #2be070, #17a168)"
                      : "linear-gradient(135deg, #25D366, #128C7E)",
                    borderRadius: "100px",
                    padding: "6px 18px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.2)",
                    boxShadow: "0 2px 12px rgba(37,211,102,0.3), inset 0 1px 0 rgba(255,255,255,0.15), 0 3px 0 rgba(18,140,126,0.2)",
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon size={14} />
                  <span className="ab-wa-text ab-text-3d-btn-dark">050 360 7980</span>
                </a> */}
              </div>

              {/* Progress bar */}
              <div className="ab-progress-container">
                <div
                  className="ab-progress-bar"
                  style={{ width: `${timeProgress * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════ MOBILE ════════════ */}
      <div
        className={`ab-root md:hidden ${showBar ? "" : "opacity-0"}`}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 2500)}
        role="banner"
        aria-label="Promotional announcements"
        aria-live="polite"
      >
        <div className="ab-bg">
          <div className="ab-shine">
            {/* Top: Promo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "0 16px",
                height: "20px",
                position: "relative",
                zIndex: 2,
              }}
            >
            
              <div style={{ display: "flex", alignItems: "center", gap: "7px", overflow: "hidden", height: "22px", flex: 1, justifyContent: "center" }}>
              

                <div style={{ position: "relative", height: "22px", overflow: "hidden" }}>
                  <div
                    className={isVisible ? "ab-msg-visible" : "ab-msg-hidden-up"}
                    style={{ display: "flex", alignItems: "center", height: "22px" }}
                  >
                    <span
                      className="ab-text ab-text-3d-mobile"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#064e3b",
                        letterSpacing: "0.15px",
                        textShadow: "0 20px 4px"
                      }}
                    >
                      {currentMsg.text}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "5px", flexShrink: 0, alignItems: "center" }}>
                {promoMessages.map((_, idx) => (
                  <div
                    key={idx}
                    className="ab-indicator"
                    onClick={() => goToMessage(idx)}
                    role="button"
                    aria-label={`Go to message ${idx + 1}`}
                    tabIndex={0}
                    style={{
                      width: idx === currentMessageIndex ? "16px" : "5px",
                      height: "5px",
                      borderRadius: "100px",
                      backgroundColor: idx === currentMessageIndex ? "#065f46" : "rgba(6,95,70,0.15)",
                      boxShadow: idx === currentMessageIndex
                        ? "0 20px 4px rgba(6,95,70,0.25), 0 1px 1px rgba(6,78,59,0.1)"
                        : "inset 0 1px 1px rgba(0,0,0,0.04)",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>

              <div className="ab-progress-container">
                <div
                  className="ab-progress-bar"
                  style={{ width: `${timeProgress * 100}%` }}
                />
              </div>
            </div>

            {/* Bottom: Contact */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "0 16px",
                height: "34px",
                borderTop: "1px solid rgba(6,95,70,0.06)",
                backgroundColor: "rgba(255,255,255,0.06)",
                position: "relative",
                zIndex: 2,
              }}
            >
              <span
                className="ab-text-3d-label"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "8.5px",
                  fontWeight: 700,
                  color: "#065f46",
                  opacity: 0.9,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                contact us
              </span>

              <a
                href="tel:+233302225651"
                className="ab-link ab-link-phone"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  backgroundColor: "rgba(255,255,255,0.55)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  borderRadius: "100px",
                  padding: "2px 14px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#065f46",
                  border: "1px solid rgba(255,255,255,0.6)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.03), 0 2px 0 rgba(6,78,59,0.03)",
                }}
              >
                <PhoneIcon size={11} />
                <span className="ab-phone-text ab-text-3d-btn-light">030 222 5651 or 024 642 2338 </span>
              </a>
{/* 
              <a
                href="https://wa.me/233503607980"
                className="ab-link ab-link-wa"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "linear-gradient(135deg, #25D366, #128C7E)",
                  borderRadius: "100px",
                  padding: "2px 14px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: "0 2px 8px rgba(37,211,102,0.2), 0 2px 0 rgba(18,140,126,0.15)",
                }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon size={12} />
                <span className="ab-wa-text ab-text-3d-btn-dark">050 360 7980</span>
              </a> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnnouncementBar;