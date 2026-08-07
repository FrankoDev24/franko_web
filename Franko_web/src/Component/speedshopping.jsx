import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  EyeIcon,
  FireIcon,
  HeartIcon as OutlineHeartIcon,
  HeartIcon as SolidHeartIcon,
  ShoppingCartIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { Tooltip } from "@material-tailwind/react";

import { fetchProductByShowroomAndRecord } from "../Redux/Slice/productSlice";
import {
  addToWishlist,
  removeFromWishlist,
} from "../Redux/Slice/wishlistSlice";
import useAddToCart from "./Cart";

const SHOWROOM_ID = "84b6b4e2-4fa4-4f3e-b89c-900812d95815";
const SPEED_SHOPPING_URL = "/speed-shopping";

// =====================================================
// NOTIFICATION
// =====================================================

const Notification = ({ message, type, visible, onClose }) => {
  const timerRef = useRef(null);
  const isSuccess = type === "success";
  const Icon = isSuccess ? CheckCircleIcon : XCircleIcon;

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (visible && message) {
      timerRef.current = setTimeout(onClose, 3000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [visible, message, onClose]);

  if (!visible || !message) return null;

  return (
    <div className="speed-notification">
      <div
        className={`speed-notification-content ${
          isSuccess ? "success" : "error"
        }`}
      >
        <Icon className="speed-notification-icon" />
        <span>{message}</span>

        <button
          type="button"
          onClick={onClose}
          className="speed-notification-close"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// =====================================================
// HELPERS
// =====================================================

const pad = (value) => String(value ?? 0).padStart(2, "0");

const getEndOfToday = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date.getTime();
};

const getTimeLeft = () => {
  const difference = getEndOfToday() - Date.now();

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return "https://via.placeholder.com/300x300?text=Product";
  }

  if (imagePath.includes("\\")) {
    return `https://testing.frankotrading.com/Media/Products_Images/${
      imagePath.split("\\").pop()
    }`;
  }

  return imagePath;
};

const formatPrice = (price) => {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return "GH₵0.00";
  }

  return `GH₵${numericPrice.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// =====================================================
// SPEED SHOPPING COMPONENT
// =====================================================

const Speed = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const carouselRef = useRef(null);

  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  const [isHovered, setIsHovered] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const [notification, setNotification] = useState({
    message: "",
    type: "success",
    visible: false,
  });

  const { addProductToCart, loading: cartLoading } = useAddToCart();

  const { productsByShowroom, loading } = useSelector(
    (state) => state.products
  );

  const wishlist = useSelector((state) => state.wishlist.items || []);

  const products = productsByShowroom?.[SHOWROOM_ID] || [];

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const closeNotification = useCallback(() => {
    setNotification((previous) => ({
      ...previous,
      visible: false,
    }));
  }, []);

  const showNotification = useCallback((message, type = "success") => {
    setNotification({
      message,
      type,
      visible: true,
    });
  }, []);

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  useEffect(() => {
    dispatch(
      fetchProductByShowroomAndRecord({
        showRoomCode: SHOWROOM_ID,
        recordNumber: 10,
      })
    );
  }, [dispatch]);

  // =====================================================
  // COUNTDOWN - ENDS AT CLOSE OF TODAY
  // =====================================================

  useEffect(() => {
    const updateCountdown = () => {
      setTimeLeft(getTimeLeft());
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  // =====================================================
  // WISHLIST AND CART ACTIONS
  // =====================================================

  const isInWishlist = useCallback(
    (productId) =>
      wishlist.some(
        (item) => item.id === productId || item.productID === productId
      ),
    [wishlist]
  );

  const handleWishlistToggle = (product) => {
    const productId = product.productID || product.id;

    try {
      if (isInWishlist(productId)) {
        dispatch(removeFromWishlist(productId));
        showNotification("Removed from wishlist");
      } else {
        dispatch(
          addToWishlist({
            ...product,
            id: productId,
          })
        );
        showNotification("Added to wishlist");
      }
    } catch {
      showNotification("Unable to update wishlist", "error");
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await addProductToCart(product);
      showNotification("Added to cart successfully");
    } catch {
      showNotification("Unable to add product to cart", "error");
    }
  };

  // =====================================================
  // CAROUSEL
  // =====================================================

  const updateCarouselArrows = useCallback(() => {
    const carousel = carouselRef.current;

    if (!carousel) return;

    const { scrollLeft, scrollWidth, clientWidth } = carousel;

    setShowLeftArrow(scrollLeft > 5);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
  }, []);

  const scrollProducts = (direction) => {
    if (!carouselRef.current) return;

    carouselRef.current.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    updateCarouselArrows();

    const carousel = carouselRef.current;

    if (!carousel) return undefined;

    carousel.addEventListener("scroll", updateCarouselArrows);
    window.addEventListener("resize", updateCarouselArrows);

    return () => {
      carousel.removeEventListener("scroll", updateCarouselArrows);
      window.removeEventListener("resize", updateCarouselArrows);
    };
  }, [products, loading, updateCarouselArrows]);

  useEffect(() => {
    if (isHovered || loading || products.length <= 1) {
      return undefined;
    }

    const interval = setInterval(() => {
      const carousel = carouselRef.current;

      if (!carousel) return;

      const { scrollLeft, scrollWidth, clientWidth } = carousel;

      if (scrollLeft + clientWidth >= scrollWidth - 5) {
        carousel.scrollTo({
          left: 0,
          behavior: "smooth",
        });
      } else {
        scrollProducts("right");
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isHovered, loading, products]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      <Notification
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
        onClose={closeNotification}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

        :root {
          --speed-font: 'DM Sans', sans-serif;

          /* Promotion colours */
          --speed-purple-dark: #1e0a36;
          --speed-purple: #4d1070;
          --speed-purple-soft: #f7f0fa;
          --speed-pink: #b90f67;
          --speed-orange: #ff8a00;
          --speed-yellow: #ffd500;

          /* Neutral shopping colours */
          --speed-text: #24152f;
          --speed-muted: #77717d;
          --speed-border: #e9e1ec;
          --speed-white: #ffffff;
          --speed-danger: #c62852;
        }

        .speed-root,
        .speed-root * {
          box-sizing: border-box;
          font-family: var(--speed-font);
          -webkit-font-smoothing: antialiased;
        }

        .speed-root {
          width: 100%;
          color: var(--speed-text);
        }

        /* =========================
           NOTIFICATION
        ========================== */

        .speed-notification {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 9999;
          animation: speed-slide-in 0.25s ease-out;
        }

        .speed-notification-content {
          min-width: 280px;
          max-width: calc(100vw - 32px);
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 12px 15px;
          border-radius: 7px;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 8px 24px rgba(30, 10, 54, 0.18);
        }

        .speed-notification-content.success {
          background: var(--speed-purple);
        }

        .speed-notification-content.error {
          background: var(--speed-danger);
        }

        .speed-notification-icon {
          width: 19px;
          height: 19px;
          flex-shrink: 0;
        }

        .speed-notification-close {
          margin-left: auto;
          border: 0;
          background: transparent;
          color: rgba(255, 255, 255, 0.8);
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
        }

        /* =========================
           HEADER
        ========================== */

        .speed-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 13px 16px;
          border: 1px solid #eadced;
          border-left: 4px solid var(--speed-pink);
          border-radius: 8px;
          background: linear-gradient(
            105deg,
            #fbeaff 0%,
            #fff5d6 68%,
            #fff8ed 100%
          );
          box-shadow: 0 4px 16px rgba(77, 16, 112, 0.09);
        }

        .speed-header-left {
          min-width: 0;
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .speed-header-icon {
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid #eadced;
          border-radius: 50%;
          color: var(--speed-purple);
          background: #fff;
        }

        .speed-heading {
          min-width: 0;
          flex: 1;
        }

        .speed-title {
          overflow: hidden;
          color: var(--speed-purple-dark);
          font-size: 17px;
          font-weight: 900;
          line-height: 1.2;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .speed-subtitle {
          margin-top: 3px;
          color: var(--speed-muted);
          font-size: 10px;
          font-weight: 500;
        }

        .speed-divider {
          width: 1px;
          height: 30px;
          flex-shrink: 0;
          background: #e8dceb;
        }

        .speed-timer-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .speed-timer-label {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--speed-purple);
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .speed-timer {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .speed-timer-block {
          min-width: 31px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4px 5px;
          border: 1px solid #f0da8b;
          border-radius: 5px;
          color: var(--speed-purple-dark);
          background: #fff5c9;
        }

        .speed-timer-value {
          font-size: 12px;
          font-weight: 900;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .speed-timer-unit {
          margin-top: 2px;
          color: #806b26;
          font-size: 7px;
          font-weight: 700;
          line-height: 1;
          text-transform: uppercase;
        }

        .speed-timer-separator {
          margin-bottom: 9px;
          color: var(--speed-pink);
          font-size: 13px;
          font-weight: 900;
        }

        .speed-view-button {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
          padding: 8px 14px;
          border: 1px solid #efc800;
          border-radius: 999px;
          color: var(--speed-purple-dark);
          background: var(--speed-yellow);
          box-shadow: 0 2px 6px rgba(255, 213, 0, 0.2);
          font-size: 12px;
          font-weight: 900;
          text-decoration: none;
          transition: 0.2s ease;
        }

        .speed-view-button:hover {
          background: #ffca00;
          transform: translateY(-1px);
        }

        /* =========================
           CAROUSEL
        ========================== */

        .speed-carousel-wrapper {
          position: relative;
          margin-top: 16px;
        }

        .speed-carousel {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 2px 1px 5px;
          scroll-behavior: smooth;
          scrollbar-width: none;
        }

        .speed-carousel::-webkit-scrollbar {
          display: none;
        }

        .speed-scroll-button {
          position: absolute;
          top: 50%;
          z-index: 5;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--speed-border);
          border-radius: 50%;
          color: var(--speed-purple);
          background: #fff;
          box-shadow: 0 3px 12px rgba(30, 10, 54, 0.12);
          cursor: pointer;
          transform: translateY(-50%);
          transition: 0.2s ease;
        }

        .speed-scroll-button:hover {
          background: #fff8d8;
          transform: translateY(-50%) scale(1.05);
        }

        .speed-scroll-button.left {
          left: -8px;
        }

        .speed-scroll-button.right {
          right: -8px;
        }

        /* =========================
           PRODUCT CARD
        ========================== */

        .speed-card {
          width: 160px;
          min-width: 160px;
          overflow: hidden;
          flex-shrink: 0;
          border: 1px solid var(--speed-border);
          border-radius: 8px;
          background: var(--speed-white);
          cursor: pointer;
          transition: 0.2s ease;
        }

        .speed-card:hover {
          border-color: #d9b8df;
          box-shadow: 0 6px 18px rgba(77, 16, 112, 0.1);
          transform: translateY(-2px);
        }

        .speed-card-image {
          position: relative;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 10px;
          background: #fff;
        }

        .speed-card-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.25s ease;
        }

        .speed-card:hover .speed-card-image img {
          transform: scale(1.05);
        }

        .speed-card-overlay {
          position: absolute;
          inset: 0;
          display: none;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(30, 10, 54, 0.66);
        }

        .speed-card:hover .speed-card-overlay {
          display: flex;
        }

        .speed-action-button {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .speed-action-button:hover {
          background: #fff4c5;
          transform: scale(1.08);
        }

        .speed-action-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .speed-card-body {
          min-height: 87px;
          padding: 10px 12px;
          text-align: center;
        }

        .speed-card-name {
          min-height: 36px;
          overflow: hidden;
          color: var(--speed-text);
          display: -webkit-box;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.35;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .speed-card-price {
          margin-top: 6px;
          color: var(--speed-pink);
          font-size: 14px;
          font-weight: 900;
        }

        .speed-card-old-price {
          margin-top: 2px;
          color: #99919d;
          font-size: 12px;
          text-decoration: line-through;
        }

        .speed-badge {
          position: absolute;
          top: 8px;
          z-index: 3;
          padding: 3px 7px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 800;
          line-height: 1;
          text-transform: uppercase;
        }

        .speed-badge.sold {
          left: 8px;
          color: #fff;
          background: var(--speed-purple-dark);
        }

        .speed-badge.discount {
          right: 8px;
          color: var(--speed-purple-dark);
          background: var(--speed-yellow);
        }

        /* =========================
           VIEW ALL CARD
        ========================== */

        .speed-view-all-card {
          width: 110px;
          min-width: 110px;
          min-height: 235px;
          display: flex;
          flex-shrink: 0;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--speed-purple);
          text-decoration: none;
        }

        .speed-view-all-circle {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #eadced;
          border-radius: 50%;
          color: var(--speed-purple);
          background: #fff;
          transition: 0.2s ease;
        }

        .speed-view-all-card:hover .speed-view-all-circle {
          color: var(--speed-purple-dark);
          background: #fff3c4;
          transform: scale(1.07);
        }

        .speed-view-all-label {
          font-size: 12px;
          font-weight: 900;
        }

        /* =========================
           SKELETON
        ========================== */

        .speed-skeleton {
          width: 160px;
          min-width: 160px;
          overflow: hidden;
          border: 1px solid var(--speed-border);
          border-radius: 8px;
          background: #fff;
        }

        .speed-skeleton-image {
          height: 150px;
          background: linear-gradient(
            90deg,
            #f4f0f5 25%,
            #eae2ed 50%,
            #f4f0f5 75%
          );
          background-size: 200% 100%;
          animation: speed-shimmer 1.4s infinite;
        }

        .speed-skeleton-content {
          padding: 12px;
        }

        .speed-skeleton-line {
          width: 80%;
          height: 10px;
          margin-bottom: 8px;
          border-radius: 3px;
          background: linear-gradient(
            90deg,
            #f4f0f5 25%,
            #eae2ed 50%,
            #f4f0f5 75%
          );
          background-size: 200% 100%;
          animation: speed-shimmer 1.4s infinite;
        }

        .speed-skeleton-line.short {
          width: 50%;
          height: 8px;
          margin-bottom: 0;
        }

        @keyframes speed-shimmer {
          from {
            background-position: 200% 0;
          }

          to {
            background-position: -200% 0;
          }
        }

        @keyframes speed-slide-in {
          from {
            opacity: 0;
            transform: translateX(25px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (min-width: 768px) {
          .speed-header {
            padding: 14px 20px;
          }

          .speed-card,
          .speed-skeleton {
            width: 220px;
            min-width: 220px;
          }

          .speed-card-image,
          .speed-skeleton-image {
            height: 195px;
          }

          .speed-view-all-card {
            width: 140px;
            min-width: 140px;
            min-height: 282px;
          }

          .speed-title {
            font-size: 18px;
          }

          .speed-carousel {
            gap: 16px;
          }
        }

        /* ========================================
           MOBILE STYLES – header title always visible
        ========================================== */

        @media (max-width: 700px) {
          .speed-header {
            align-items: flex-start;
            flex-wrap: wrap;
            background: linear-gradient(
              105deg,
              #fce3ff 0%,
              #fff2c8 50%,
              #fff9ef 100%
            );
          }

          .speed-header-left {
            flex-wrap: wrap;
            gap: 8px;
            width: 100%;
          }

          .speed-header-icon {
            width: 32px;
            height: 32px;
          }

          .speed-heading {
            flex: 1 1 auto;
            min-width: calc(100% - 60px);
          }

          .speed-title {
            white-space: normal;
            word-wrap: break-word;
            font-size: 15px;
            line-height: 1.3;
          }

          .speed-divider {
            display: none;
          }

          .speed-timer-group {
            margin-left: 0;
            flex-basis: 100%;
            justify-content: flex-start;
          }

          .speed-view-button {
            margin-left: auto;
          }
        }

        @media (max-width: 480px) {
          .speed-header {
            padding: 11px 12px;
          }

          .speed-header-icon {
            width: 28px;
            height: 28px;
          }

          .speed-title {
            font-size: 14px;
          }

          .speed-subtitle {
            font-size: 9px;
          }

          .speed-timer-group {
            gap: 5px;
          }

          .speed-timer-label {
            display: none;
          }

          .speed-timer-block {
            min-width: 27px;
            padding: 4px 3px;
          }

          .speed-timer-value {
            font-size: 10px;
          }

          .speed-timer-unit {
            font-size: 6px;
          }

          .speed-view-button {
            padding: 6px 10px;
            font-size: 10px;
          }

          .speed-scroll-button.left {
            left: -4px;
          }

          .speed-scroll-button.right {
            right: -4px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .speed-root *,
          .speed-root *::before,
          .speed-root *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <section className="speed-root mx-auto px-4 py-2 md:px-16">
        {/* HEADER */}

        <div className="speed-header">
          <div className="speed-header-left">
            <div className="speed-header-icon">
              <FireIcon style={{ width: 17, height: 17 }} />
            </div>

            <div className="speed-heading">
              <div className="speed-title">Franko Speed Shopping</div>
              <div className="speed-subtitle">Ends at midnight today</div>
            </div>

            <div className="speed-divider" />

            <div className="speed-timer-group">
              <div className="speed-timer-label">
                <ClockIcon style={{ width: 13, height: 13 }} />
                <span>Ends today</span>
              </div>

              <div className="speed-timer">
                <div className="speed-timer-block">
                  <span className="speed-timer-value">
                    {pad(timeLeft.days)}
                  </span>
                  <span className="speed-timer-unit">Days</span>
                </div>

                <span className="speed-timer-separator">:</span>

                <div className="speed-timer-block">
                  <span className="speed-timer-value">
                    {pad(timeLeft.hours)}
                  </span>
                  <span className="speed-timer-unit">Hrs</span>
                </div>

                <span className="speed-timer-separator">:</span>

                <div className="speed-timer-block">
                  <span className="speed-timer-value">
                    {pad(timeLeft.minutes)}
                  </span>
                  <span className="speed-timer-unit">Min</span>
                </div>

                <span className="speed-timer-separator">:</span>

                <div className="speed-timer-block">
                  <span className="speed-timer-value">
                    {pad(timeLeft.seconds)}
                  </span>
                  <span className="speed-timer-unit">Sec</span>
                </div>
              </div>
            </div>
          </div>

          <Link to={SPEED_SHOPPING_URL} className="speed-view-button">
            <span>View All</span>
            <ChevronRightIcon style={{ width: 14, height: 14 }} />
          </Link>
        </div>

        {/* PRODUCT CAROUSEL */}

        <div className="speed-carousel-wrapper">
          {showLeftArrow && (
            <button
              type="button"
              className="speed-scroll-button left"
              onClick={() => scrollProducts("left")}
              aria-label="Scroll products left"
            >
              <ChevronLeftIcon style={{ width: 17, height: 17 }} />
            </button>
          )}

          <div
            ref={carouselRef}
            className="speed-carousel"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div className="speed-skeleton" key={index}>
                    <div className="speed-skeleton-image" />

                    <div className="speed-skeleton-content">
                      <div className="speed-skeleton-line" />
                      <div className="speed-skeleton-line short" />
                    </div>
                  </div>
                ))
              : products.map((product) => {
                  const {
                    productID,
                    productName,
                    productImage,
                    price,
                    oldPrice,
                    stock,
                  } = product;

                  const numericPrice = Number(price);
                  const numericOldPrice = Number(oldPrice);
                  const numericStock = Number(stock);

                  const isOnSale =
                    numericOldPrice > 0 &&
                    numericOldPrice > numericPrice;

                  const discount = isOnSale
                    ? Math.round(
                        ((numericOldPrice - numericPrice) /
                          numericOldPrice) *
                          100
                      )
                    : 0;

                  const inWishlist = isInWishlist(productID);

                  return (
                    <article
                      key={productID}
                      className="speed-card"
                      onClick={() => navigate(`/product/${productID}`)}
                    >
                      <div className="speed-card-image">
                        {numericStock === 0 && (
                          <span className="speed-badge sold">
                            Sold Out
                          </span>
                        )}

                        {isOnSale && numericStock !== 0 && (
                          <span className="speed-badge discount">
                            -{discount}%
                          </span>
                        )}

                        <img
                          src={getImageUrl(productImage)}
                          alt={productName || "Product"}
                          loading="lazy"
                        />

                        <div
                          className="speed-card-overlay"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Tooltip
                            content={
                              inWishlist
                                ? "Remove from Wishlist"
                                : "Add to Wishlist"
                            }
                          >
                            <button
                              type="button"
                              className="speed-action-button"
                              onClick={() =>
                                handleWishlistToggle(product)
                              }
                              aria-label={
                                inWishlist
                                  ? "Remove from wishlist"
                                  : "Add to wishlist"
                              }
                            >
                              {inWishlist ? (
                                <SolidHeartIcon
                                  style={{
                                    width: 17,
                                    height: 17,
                                    color: "var(--speed-pink)",
                                  }}
                                />
                              ) : (
                                <OutlineHeartIcon
                                  style={{
                                    width: 17,
                                    height: 17,
                                    color: "#716a76",
                                  }}
                                />
                              )}
                            </button>
                          </Tooltip>

                          <Tooltip content="View Details">
                            <button
                              type="button"
                              className="speed-action-button"
                              onClick={() =>
                                navigate(`/product/${productID}`)
                              }
                              aria-label="View product details"
                            >
                              <EyeIcon
                                style={{
                                  width: 17,
                                  height: 17,
                                  color: "var(--speed-purple)",
                                }}
                              />
                            </button>
                          </Tooltip>

                          <Tooltip
                            content={
                              numericStock === 0
                                ? "Out of Stock"
                                : "Add to Cart"
                            }
                          >
                            <button
                              type="button"
                              className="speed-action-button"
                              disabled={
                                cartLoading || numericStock === 0
                              }
                              onClick={() => handleAddToCart(product)}
                              aria-label="Add product to cart"
                            >
                              <ShoppingCartIcon
                                style={{
                                  width: 17,
                                  height: 17,
                                  color: "var(--speed-purple)",
                                }}
                              />
                            </button>
                          </Tooltip>
                        </div>
                      </div>

                      <div className="speed-card-body">
                        <div className="speed-card-name">
                          {productName || "Unnamed product"}
                        </div>

                        <div className="speed-card-price">
                          {formatPrice(price)}
                        </div>

                        {numericOldPrice > 0 && (
                          <div className="speed-card-old-price">
                            {formatPrice(oldPrice)}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}

            {!loading && (
              <Link
                to={SPEED_SHOPPING_URL}
                className="speed-view-all-card"
              >
                <span className="speed-view-all-circle">
                  <ArrowRightIcon style={{ width: 20, height: 20 }} />
                </span>

                <span className="speed-view-all-label">View All</span>
              </Link>
            )}
          </div>

          {showRightArrow && (
            <button
              type="button"
              className="speed-scroll-button right"
              onClick={() => scrollProducts("right")}
              aria-label="Scroll products right"
            >
              <ChevronRightIcon style={{ width: 17, height: 17 }} />
            </button>
          )}
        </div>
      </section>
    </>
  );
};

export default Speed;