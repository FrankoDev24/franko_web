import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByShowroom } from "../Redux/Slice/productSlice";
import { fetchShowrooms } from "../Redux/Slice/showRoomSlice";
import { addToWishlist, removeFromWishlist } from "../Redux/Slice/wishlistSlice";
import {
  FunnelIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  TagIcon,
  ChevronDownIcon,
  Bars3BottomLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as OutlineHeartIcon,
  HeartIcon as SolidHeartIcon,
  ShoppingCartIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { Tooltip } from "@material-tailwind/react";
import { CircularPagination } from "../Component/CircularPagination";
import useAddToCart from "../Component/Cart";
import { Helmet } from "react-helmet";

// ==================== NOTIFICATION ====================

const Notification = ({ message, type, isVisible, onClose }) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isVisible && message) {
      timeoutRef.current = setTimeout(() => onClose(), 3000);
    }
  }, [isVisible, message]);

  if (!isVisible || !message) return null;

  const bgClass = type === "success" ? "sp-notif-success" : "sp-notif-error";
  const Icon = type === "success" ? CheckCircleIcon : XCircleIcon;

  return (
    <div className="fixed top-4 right-4 z-50 sp-animate-slide-in">
      <div className={`sp-notif ${bgClass}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="sp-notif-text">{message}</span>
        <button onClick={onClose} className="sp-notif-close">×</button>
      </div>
    </div>
  );
};

// ==================== SKELETON ====================

const SkeletonCard = () => (
  <div className="sp-skeleton">
    <div className="sp-skeleton-img" />
    <div style={{ padding: "10px 12px" }}>
      <div className="sp-skeleton-line" style={{ width: "80%", marginBottom: 8, marginLeft: "auto", marginRight: "auto" }} />
      <div className="sp-skeleton-line" style={{ width: "50%", height: 8, marginLeft: "auto", marginRight: "auto" }} />
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

const ShowroomProductsPage = () => {
  const { showRoomID } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { productsByShowroom, loading } = useSelector((state) => state.products);
  const { showrooms } = useSelector((state) => state.showrooms);
  const wishlist = useSelector((state) => state.wishlist.items || []);
  const { addProductToCart, loading: cartLoading } = useAddToCart();

  const [inputPriceRange, setInputPriceRange] = useState({ min: 0, max: 200000 });
  const [appliedPriceRange, setAppliedPriceRange] = useState([0, 200000]);
  const [showDiscountedOnly, setShowDiscountedOnly] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [notification, setNotification] = useState({
    message: "",
    type: "success",
    isVisible: false,
  });

  const itemsPerPage = 12;

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  }, []);

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message: "", type: "success", isVisible: false });
    requestAnimationFrame(() => {
      setNotification({ message, type, isVisible: true });
    });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(fetchShowrooms());
    dispatch(fetchProductsByShowroom(showRoomID)).then(() => {
      setHasLoadedOnce(true);
    });
  }, [dispatch, showRoomID]);

  const selectedShowroom = showrooms.find((s) => s.showRoomID === showRoomID);
  const availableShowrooms = showrooms.filter(
    (room) =>
      !["Products out of stock", "Spotlight", "Flash sales"].includes(room.showRoomName)
  );

  const applyPriceFilter = () => {
    const min = Math.max(0, inputPriceRange.min || 0);
    const max = Math.min(200000, inputPriceRange.max || 200000);
    setAppliedPriceRange([min, max]);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setInputPriceRange({ min: 0, max: 200000 });
    setAppliedPriceRange([0, 200000]);
    setShowDiscountedOnly(false);
    setSortBy("newest");
    setCurrentPage(1);
  };

  const sortProducts = (products) => {
    const sorted = [...products];
    switch (sortBy) {
      case "oldest":
        return sorted.sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price);
      case "name-az":
        return sorted.sort((a, b) => a.productName.localeCompare(b.productName));
      case "name-za":
        return sorted.sort((a, b) => b.productName.localeCompare(a.productName));
      default:
        return sorted.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
    }
  };

  const products = productsByShowroom[showRoomID] || [];
  const filteredProducts = sortProducts(
    products.filter((p) => {
      const withinRange = p.price >= appliedPriceRange[0] && p.price <= appliedPriceRange[1];
      const hasDiscount = showDiscountedOnly ? (p.oldPrice || 0) > p.price : true;
      return withinRange && hasDiscount;
    })
  );

  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const isFiltersActive =
    appliedPriceRange[0] !== 0 ||
    appliedPriceRange[1] !== 200000 ||
    showDiscountedOnly ||
    sortBy !== "Sort By";

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price-low", label: "Price: Low → High" },
    { value: "price-high", label: "Price: High → Low" },
    { value: "name-az", label: "Name: A → Z" },
    { value: "name-za", label: "Name: Z → A" },
  ];

  const handleShowroomSelect = (id) => {
    setCurrentPage(1);
    setIsDrawerOpen(false);
    setHasLoadedOnce(false);
    navigate(`/showroom/${id}`);
  };

  // ==================== HELPERS ====================

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return "₵0.00";
    return `GH₵${Number(price).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getValidImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/150";
    return imagePath.includes("\\")
      ? `https://testing.frankotrading.com/Media/Products_Images/${imagePath.split("\\").pop()}`
      : imagePath;
  };

  const isInWishlist = (id) =>
    Array.isArray(wishlist) && wishlist.some((item) => item.id === id);

  const handleWishlistToggle = async (product) => {
    try {
      const id = product.productID;
      if (isInWishlist(id)) {
        dispatch(removeFromWishlist(id));
        showNotification("Removed from wishlist");
      } else {
        dispatch(addToWishlist({ ...product, id }));
        showNotification("Added to wishlist");
      }
    } catch {
      showNotification("Failed to update wishlist", "error");
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await addProductToCart(product);
      showNotification("Added to cart");
    } catch {
      showNotification("Failed to add to cart", "error");
    }
  };

  // ==================== FILTER SIDEBAR ====================

  const renderFilterContent = () => (
    <div className="sp-filter-content">
      <div className="hidden sp-filter-header sp-desktop-only">
        <AdjustmentsHorizontalIcon style={{ width: 18, height: 18, color: "var(--sp-green)" }} />
        <span className="sp-filter-header-text">Filters</span>
      </div>

      {/* Price Range */}
      <div className="sp-filter-section">
        <div className="sp-filter-section-title">
          <div className="sp-dot" style={{ background: "var(--sp-green-accent)" }} />
          <span>Price Range</span>
        </div>
        <div className="sp-price-inputs">
          <div className="sp-price-field">
            <label className="sp-price-label">Min</label>
            <div className="sp-price-input-wrap">
              <span className="sp-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.min}
                onChange={(e) => setInputPriceRange((prev) => ({ ...prev, min: +e.target.value }))}
                className="sp-price-input"
                placeholder="0"
              />
            </div>
          </div>
          <div className="sp-price-field">
            <label className="sp-price-label">Max</label>
            <div className="sp-price-input-wrap">
              <span className="sp-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.max}
                onChange={(e) => setInputPriceRange((prev) => ({ ...prev, max: +e.target.value }))}
                className="sp-price-input"
                placeholder="200000"
              />
            </div>
          </div>
        </div>
        <button onClick={applyPriceFilter} className="sp-apply-btn">
          Apply Price Filter
        </button>
        <div className="sp-applied-range">
          <span className="sp-applied-label">Active:</span>
          <span className="sp-applied-value">
            ₵{appliedPriceRange[0].toLocaleString()} – ₵{appliedPriceRange[1].toLocaleString()}
          </span>
        </div>
      </div>

      {/* Discount Toggle */}
      <div className="sp-filter-section sp-discount-section">
        <div className="sp-discount-row">
          <div className="sp-discount-info">
            <div className="sp-discount-icon">
              <TagIcon style={{ width: 14, height: 14, color: "#fff" }} />
            </div>
            <span className="sp-discount-label">Discounted Only</span>
          </div>
          <div
            onClick={() => setShowDiscountedOnly(!showDiscountedOnly)}
            className={`sp-toggle ${showDiscountedOnly ? "sp-toggle-on" : ""}`}
          >
            <div className="sp-toggle-knob" />
          </div>
        </div>
      </div>

      {/* Showrooms */}
      {availableShowrooms.length > 0 && (
        <div className="sp-filter-section">
          <div className="sp-filter-section-title">
            <div className="sp-dot" style={{ background: "var(--sp-green)" }} />
            <span>Showrooms</span>
          </div>
          <div className="sp-showroom-tags">
            {availableShowrooms.map((room) => (
              <button
                key={room.showRoomID}
                onClick={() => handleShowroomSelect(room.showRoomID)}
                className={`sp-showroom-tag ${room.showRoomID === showRoomID ? "sp-showroom-tag-active" : ""}`}
              >
                {room.showRoomName}
              </button>
            ))}
          </div>
        </div>
      )}

      {isFiltersActive && (
        <button onClick={resetFilters} className="sp-reset-btn">
          Reset All Filters
        </button>
      )}
    </div>
  );

  // ==================== DETERMINE WHAT TO SHOW ====================

  const isInitialLoading = loading && !hasLoadedOnce;
  const hasProducts = currentProducts.length > 0;
  const trulyEmpty = hasLoadedOnce && !loading && filteredProducts.length === 0;

  // ==================== RENDER ====================

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700;800;900&display=swap');

        :root {
          --sp-font: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          --sp-green: #14532d;
          --sp-green-mid: #166534;
          --sp-green-light: #dcfce7;
          --sp-green-lighter: #f0fdf4;
          --sp-green-accent: #22c55e;
          --sp-dark: #1a1a1a;
          --sp-mid: #555;
          --sp-light: #888;
          --sp-border: #e0e0e0;
          --sp-bg-subtle: #f7f7f7;
          --sp-red: #dc2626;
          --sp-pink: #e11d48;
          --sp-radius: 4px;
        }

        .sp-root, .sp-root * {
          font-family: var(--sp-font);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          box-sizing: border-box;
        }

        .sp-desktop-only { display: none; }
        @media (min-width: 1024px) { .sp-desktop-only { display: flex; } }

        /* ==================== NOTIFICATION ==================== */

        .sp-notif {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: var(--sp-radius);
          min-width: 280px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .sp-notif-success { background: var(--sp-green); color: #fff; }
        .sp-notif-error { background: var(--sp-red); color: #fff; }

        .sp-notif-text { font-size: 14px; font-weight: 500; flex: 1; }

        .sp-notif-close {
          background: transparent; border: none; color: rgba(255,255,255,0.8);
          font-size: 18px; cursor: pointer; padding: 0; line-height: 1;
        }
        .sp-notif-close:hover { color: #fff; }

        @keyframes sp-slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .sp-animate-slide-in { animation: sp-slide-in-right 0.3s ease-out; }

        /* ==================== PAGE HEADER ==================== */

        .sp-page-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--sp-border);
        }

        .sp-page-header-accent {
          width: 4px; height: 28px; border-radius: 2px;
          background: var(--sp-green); flex-shrink: 0;
        }

        .sp-page-title {
          font-size: 20px; font-weight: 800; color: var(--sp-dark);
          letter-spacing: -0.02em; line-height: 1.2; margin: 0;
        }
        @media (min-width: 768px) { .sp-page-title { font-size: 24px; } }

        .sp-page-count {
          font-size: 13px; font-weight: 500; color: var(--sp-light); margin-top: 2px;
        }

        .sp-page-header-line {
          flex: 1; height: 1px; background: var(--sp-border); display: none;
        }
        @media (min-width: 768px) { .sp-page-header-line { display: block; } }

        /* ==================== MOBILE CONTROLS ==================== */

        .sp-mobile-controls { display: flex; gap: 8px; margin-bottom: 16px; }
        @media (min-width: 1024px) { .sp-mobile-controls { display: none; } }

        .sp-filter-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: var(--sp-green); color: #fff;
          border: none; border-radius: var(--sp-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--sp-font);
        }
        .sp-filter-trigger:active { transform: scale(0.98); }

        .sp-sort-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: #fff; color: var(--sp-mid);
          border: 1px solid var(--sp-border); border-radius: var(--sp-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--sp-font); position: relative;
        }
        .sp-sort-trigger:active { transform: scale(0.98); }

        /* ==================== SORT DROPDOWN ==================== */

        .sp-sort-drop {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: #fff; border: 1px solid var(--sp-border);
          border-radius: var(--sp-radius); box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          z-index: 50; overflow: hidden; animation: sp-fade 0.15s ease;
        }

        @keyframes sp-fade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .sp-sort-option {
          display: block; width: 100%; text-align: left; padding: 10px 14px;
          font-size: 13px; font-weight: 500; color: var(--sp-mid);
          background: none; border: none; cursor: pointer; transition: all 0.1s;
          font-family: var(--sp-font); border-bottom: 1px solid #f5f5f5;
        }
        .sp-sort-option:last-child { border-bottom: none; }
        .sp-sort-option:hover { background: var(--sp-bg-subtle); }
        .sp-sort-option-active {
          background: var(--sp-green-light) !important;
          color: var(--sp-green) !important; font-weight: 600 !important;
        }

        /* ==================== DESKTOP TOOLBAR ==================== */

        .sp-toolbar {
          display: none; align-items: center; justify-content: space-between;
          padding: 12px 16px; background: #fff; border: 1px solid var(--sp-border);
          border-radius: var(--sp-radius); margin-bottom: 16px;
        }
        @media (min-width: 768px) { .sp-toolbar { display: flex; } }

        .sp-toolbar-left { display: flex; align-items: center; gap: 12px; }

        .sp-toolbar-count { font-size: 13px; font-weight: 500; color: var(--sp-light); }
        .sp-toolbar-count strong { color: var(--sp-dark); font-weight: 700; }

        .sp-toolbar-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: var(--sp-green-light); color: var(--sp-green);
          font-size: 11px; font-weight: 700; padding: 3px 10px;
          border-radius: 100px; text-transform: uppercase; letter-spacing: 0.03em;
        }

        .sp-toolbar-right { display: flex; align-items: center; gap: 8px; }

        .sp-desktop-sort { position: relative; }

        .sp-desktop-sort-btn {
          display: flex; align-items: center; gap: 6px; padding: 7px 14px;
          background: #fff; border: 1px solid var(--sp-border);
          border-radius: var(--sp-radius); font-size: 13px; font-weight: 500;
          color: var(--sp-mid); cursor: pointer; transition: all 0.15s;
          font-family: var(--sp-font);
        }
        .sp-desktop-sort-btn:hover {
          border-color: var(--sp-green-accent); color: var(--sp-dark);
        }

        .sp-desktop-sort-drop {
          position: absolute; top: calc(100% + 4px); right: 0; width: 200px;
          background: #fff; border: 1px solid var(--sp-border);
          border-radius: var(--sp-radius); box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          z-index: 50; overflow: hidden; animation: sp-fade 0.15s ease;
        }

        /* ==================== FILTER SIDEBAR ==================== */

        .sp-filter-content { display: flex; flex-direction: column; gap: 16px; }

        .sp-filter-header {
          display: flex; align-items: center; gap: 8px;
          padding-bottom: 12px; border-bottom: 1px solid var(--sp-border);
        }
        .sp-filter-header-text {
          font-size: 16px; font-weight: 800; color: var(--sp-dark); letter-spacing: -0.01em;
        }

        .sp-filter-section {
          padding: 16px; background: #fff; border: 1px solid var(--sp-border);
          border-radius: var(--sp-radius);
        }
        .sp-filter-section-title {
          display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
          font-size: 14px; font-weight: 700; color: var(--sp-dark);
        }
        .sp-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .sp-price-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .sp-price-field { display: flex; flex-direction: column; gap: 4px; }
        .sp-price-label {
          font-size: 11px; font-weight: 600; color: var(--sp-light);
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .sp-price-input-wrap { position: relative; display: flex; align-items: center; }
        .sp-price-symbol {
          position: absolute; left: 10px; font-size: 13px; font-weight: 600; color: var(--sp-light);
        }
        .sp-price-input {
          width: 100%; padding: 8px 10px 8px 24px; border: 1px solid var(--sp-border);
          border-radius: var(--sp-radius); font-size: 13px; font-weight: 500;
          color: var(--sp-dark); font-family: var(--sp-font);
          transition: border-color 0.15s; outline: none;
        }
        .sp-price-input:focus {
          border-color: var(--sp-green-accent);
          box-shadow: 0 0 0 2px rgba(34,197,94,0.1);
        }

        .sp-apply-btn {
          width: 100%; padding: 9px; background: var(--sp-green); color: #fff;
          border: none; border-radius: var(--sp-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background 0.15s;
          font-family: var(--sp-font); margin-bottom: 10px;
        }
        .sp-apply-btn:hover { background: var(--sp-green-mid); }
        .sp-apply-btn:active { transform: scale(0.98); }

        .sp-applied-range {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 10px; background: var(--sp-green-lighter);
          border: 1px solid #bbf7d0; border-radius: var(--sp-radius);
        }
        .sp-applied-label { font-size: 11px; font-weight: 600; color: var(--sp-green-mid); }
        .sp-applied-value { font-size: 12px; font-weight: 700; color: var(--sp-green); }

        .sp-discount-section { background: var(--sp-green-lighter); border-color: #bbf7d0; }
        .sp-discount-row { display: flex; align-items: center; justify-content: space-between; }
        .sp-discount-info { display: flex; align-items: center; gap: 10px; }
        .sp-discount-icon {
          width: 28px; height: 28px; border-radius: var(--sp-radius);
          background: var(--sp-green); display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .sp-discount-label { font-size: 13px; font-weight: 600; color: var(--sp-dark); }

        .sp-toggle {
          width: 40px; height: 22px; border-radius: 11px; background: #d1d5db;
          cursor: pointer; transition: background 0.2s; padding: 2px; flex-shrink: 0;
        }
        .sp-toggle-on { background: var(--sp-green) !important; }
        .sp-toggle-knob {
          width: 18px; height: 18px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15); transition: transform 0.2s;
        }
        .sp-toggle-on .sp-toggle-knob { transform: translateX(18px); }

        .sp-showroom-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .sp-showroom-tag {
          padding: 5px 12px; font-size: 12px; font-weight: 500; color: var(--sp-mid);
          background: var(--sp-bg-subtle); border: 1px solid var(--sp-border);
          border-radius: 100px; cursor: pointer; transition: all 0.15s;
          font-family: var(--sp-font); white-space: nowrap;
        }
        .sp-showroom-tag:hover {
          border-color: var(--sp-green-accent); color: var(--sp-green);
          background: var(--sp-green-light);
        }
        .sp-showroom-tag-active {
          background: var(--sp-green) !important; color: #fff !important;
          border-color: var(--sp-green) !important; font-weight: 600 !important;
        }

        .sp-reset-btn {
          width: 100%; padding: 9px; background: #fff; color: var(--sp-red);
          border: 1px solid #fecaca; border-radius: var(--sp-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--sp-font);
        }
        .sp-reset-btn:hover { background: #fef2f2; border-color: var(--sp-red); }
        .sp-reset-btn:active { transform: scale(0.98); }

        /* ==================== DRAWER ==================== */

        .sp-drawer-overlay {
          position: fixed; inset: 0; z-index: 100; display: flex;
          animation: sp-fade 0.2s ease;
        }
        .sp-drawer-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.4); }
        .sp-drawer-panel {
          position: relative; width: 100%; max-width: 320px; height: 100%;
          background: #fff; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow-y: auto; z-index: 1; animation: sp-slide-in 0.25s ease;
        }
        @keyframes sp-slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .sp-drawer-header {
          position: sticky; top: 0; background: #fff; display: flex;
          align-items: center; justify-content: space-between; padding: 14px 16px;
          border-bottom: 1px solid var(--sp-border); z-index: 2;
        }
        .sp-drawer-header-left { display: flex; align-items: center; gap: 8px; }
        .sp-drawer-header-title { font-size: 16px; font-weight: 800; color: var(--sp-dark); }
        .sp-drawer-close {
          width: 32px; height: 32px; display: flex; align-items: center;
          justify-content: center; border: 1px solid var(--sp-border);
          border-radius: var(--sp-radius); background: #fff; cursor: pointer;
          transition: background 0.12s;
        }
        .sp-drawer-close:active { background: #f5f5f5; }
        .sp-drawer-body { padding: 16px; }

        /* ==================== PRODUCT GRID ==================== */

        .sp-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) { .sp-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .sp-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
        @media (min-width: 1280px) { .sp-grid { grid-template-columns: repeat(4, 1fr); } }

        /* ==================== CARDS ==================== */

        .sp-card {
          border: 1px solid var(--sp-border); border-radius: var(--sp-radius);
          overflow: hidden; background: #fff; transition: all 0.2s ease; cursor: pointer;
        }
        .sp-card:hover {
          border-color: var(--sp-green-accent);
          box-shadow: 0 4px 16px rgba(20, 83, 45, 0.08);
        }

        .sp-card-img {
          position: relative; height: 190px; display: flex; align-items: center;
          justify-content: center; padding: 10px; overflow: hidden;
        }
        @media (min-width: 768px) { .sp-card-img { height: 195px; } }

        .sp-card-img img {
          height: 100%; width: 100%; object-fit: contain; transition: transform 0.3s ease;
        }
        .sp-card:hover .sp-card-img img { transform: scale(1.05); }

        .sp-card-overlay {
          position: absolute; inset: 0; background: rgba(20, 83, 45, 0.45);
          display: none; align-items: center; justify-content: center; gap: 8px; z-index: 2;
        }
        .sp-card:hover .sp-card-overlay { display: flex; }

        .sp-card-action {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 50%; background: #fff;
          border: none; cursor: pointer; transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .sp-card-action:hover {
          transform: scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .sp-card-action:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .sp-card-body { padding: 10px 12px; text-align: center; }

        .sp-card-name {
          font-size: 15px; font-weight: 600; color: var(--sp-dark); line-height: 1.35;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; min-height: 35px;
        }

        .sp-card-price { font-size: 15px; font-weight: 900; color: var(--sp-red); margin-top: 2px; }

        .sp-card-old-price {
          font-size: 12px; font-weight: 400; color: var(--sp-light);
          text-decoration: line-through; margin-top: 2px;
        }

        .sp-card-badge {
          position: absolute; top: 8px; font-size: 9px; font-weight: 700;
          padding: 3px 8px; border-radius: 100px; z-index: 3;
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .sp-card-badge-sold { left: 8px; background: var(--sp-dark); color: #fff; }
        .sp-card-badge-discount {
          right: 8px; background: var(--sp-red); color: #fff;
          font-size: 10px; padding: 3px 7px;
        }

        /* ==================== SKELETON ==================== */

        .sp-skeleton {
          border: 1px solid #eee; border-radius: var(--sp-radius);
          overflow: hidden; background: #fff;
        }
        .sp-skeleton-img {
          height: 150px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: sp-shimmer 1.5s infinite;
        }
        @media (min-width: 768px) { .sp-skeleton-img { height: 195px; } }

        @keyframes sp-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .sp-skeleton-line {
          height: 10px; border-radius: 2px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: sp-shimmer 1.5s infinite;
        }

        /* ==================== EMPTY STATE ==================== */

        .sp-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center; padding: 60px 24px;
          background: #fff; border: 1px solid var(--sp-border);
          border-radius: var(--sp-radius); margin-top: 16px;
        }

        .sp-empty-icon-wrap {
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--sp-bg-subtle); display: flex; align-items: center;
          justify-content: center; margin-bottom: 20px;
          border: 1px solid var(--sp-border);
        }

        .sp-empty-title {
          font-size: 18px; font-weight: 700; color: var(--sp-dark); margin-bottom: 8px;
        }

        .sp-empty-desc {
          font-size: 14px; color: var(--sp-light); max-width: 360px;
          line-height: 1.6; margin-bottom: 24px;
        }

        .sp-empty-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; }

        .sp-empty-reset {
          padding: 10px 20px; background: var(--sp-green); color: #fff;
          border: none; border-radius: var(--sp-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background 0.15s;
          font-family: var(--sp-font);
        }
        .sp-empty-reset:hover { background: var(--sp-green-mid); }

        .sp-empty-browse {
          padding: 10px 20px; background: #fff; color: var(--sp-mid);
          border: 1px solid var(--sp-border); border-radius: var(--sp-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--sp-font); text-decoration: none;
        }
        .sp-empty-browse:hover { border-color: var(--sp-green-accent); color: var(--sp-dark); }

        /* ==================== LAYOUT ==================== */

        .sp-layout { display: flex; flex-direction: column; gap: 0; }
        @media (min-width: 1024px) { .sp-layout { flex-direction: row; gap: 24px; } }

        .sp-sidebar { display: none; width: 280px; flex-shrink: 0; }
        @media (min-width: 1024px) { .sp-sidebar { display: block; } }

        .sp-sidebar-sticky { position: sticky; top: 80px; }
        .sp-main { flex: 1; min-width: 0; }
        .sp-pagination { display: flex; justify-content: center; margin-top: 24px; }
      `}</style>

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="sp-root min-h-screen">
        <Helmet>
          <title>{`${selectedShowroom?.showRoomName || "Showroom"} | Franko Trading`}</title>
          <meta name="description" content={`Explore products in ${selectedShowroom?.showRoomName || "our showroom"} at Franko Trading.`} />
          <link rel="canonical" href={`https://www.frankotrading.com/showroom/${showRoomID}`} />
        </Helmet>

        <div className="px-4 md:px-16 py-6">
          {/* Page Header */}
          <div className="sp-page-header">
            <div className="sp-page-header-accent" />
            <div>
              <h1 className="sp-page-title">{selectedShowroom?.showRoomName || "Showroom"}</h1>
              <p className="sp-page-count">
                {isInitialLoading
                  ? "Loading products..."
                  : `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <div className="sp-page-header-line" />
          </div>

          {/* Mobile Controls */}
          <div className="sp-mobile-controls">
            <button onClick={() => setIsDrawerOpen(true)} className="sp-filter-trigger">
              <FunnelIcon style={{ width: 16, height: 16 }} />
              <span>Filters</span>
              {isFiltersActive && (
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", marginLeft: 2 }} />
              )}
            </button>
            <div className="sp-sort-trigger" onClick={() => setShowSortDropdown(!showSortDropdown)}>
              <Bars3BottomLeftIcon style={{ width: 16, height: 16 }} />
              <span>Sort</span>
              <ChevronDownIcon
                style={{ width: 14, height: 14, transition: "transform 0.2s", transform: showSortDropdown ? "rotate(180deg)" : "none" }}
              />
              {showSortDropdown && (
                <div className="sp-sort-drop">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                        setCurrentPage(1);
                      }}
                      className={`sp-sort-option ${sortBy === option.value ? "sp-sort-option-active" : ""}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Drawer */}
          {isDrawerOpen && (
            <div className="sp-drawer-overlay">
              <div className="sp-drawer-backdrop" onClick={() => setIsDrawerOpen(false)} />
              <div className="sp-drawer-panel">
                <div className="sp-drawer-header">
                  <div className="sp-drawer-header-left">
                    <AdjustmentsHorizontalIcon style={{ width: 18, height: 18, color: "var(--sp-green)" }} />
                    <span className="sp-drawer-header-title">Filters</span>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} className="sp-drawer-close">
                    <XMarkIcon style={{ width: 14, height: 14, color: "var(--sp-light)" }} />
                  </button>
                </div>
                <div className="sp-drawer-body">{renderFilterContent()}</div>
              </div>
            </div>
          )}

          {/* Layout */}
          <div className="sp-layout">
            <aside className="sp-sidebar">
              <div className="sp-sidebar-sticky">{renderFilterContent()}</div>
            </aside>

            <section className="sp-main">
              {/* Desktop Toolbar */}
              {(hasProducts || isInitialLoading) && (
                <div className="sp-toolbar">
                  <div className="sp-toolbar-left">
                    <span className="sp-toolbar-count">
                      {isInitialLoading ? (
                        "Loading..."
                      ) : (
                        <>
                          Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong>–
                          <strong>{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</strong> of{" "}
                          <strong>{filteredProducts.length}</strong>
                        </>
                      )}
                    </span>
                    {isFiltersActive && <span className="sp-toolbar-badge">Filtered</span>}
                  </div>
                  <div className="sp-toolbar-right">
                    <div className="sp-desktop-sort">
                      <button onClick={() => setShowSortDropdown(!showSortDropdown)} className="sp-desktop-sort-btn">
                        <Bars3BottomLeftIcon style={{ width: 14, height: 14 }} />
                        <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                        <ChevronDownIcon
                          style={{ width: 12, height: 12, transition: "transform 0.2s", transform: showSortDropdown ? "rotate(180deg)" : "none" }}
                        />
                      </button>
                      {showSortDropdown && (
                        <div className="sp-desktop-sort-drop">
                          {sortOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortBy(option.value);
                                setShowSortDropdown(false);
                                setCurrentPage(1);
                              }}
                              className={`sp-sort-option ${sortBy === option.value ? "sp-sort-option-active" : ""}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== CONTENT STATES ==================== */}

              {/* Loading State */}
              {isInitialLoading && (
                <div className="sp-grid">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Products */}
              {!isInitialLoading && hasProducts && (
                <>
                  <div className="sp-grid">
                    {currentProducts.map((product) => {
                      const { productID, productName, productImage, price, oldPrice, stock } = product;
                      const isOnSale = oldPrice > 0 && oldPrice > price;
                      const discountPercent = isOnSale ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
                      const soldOut = stock === 0;
                      const inWishlist = isInWishlist(productID);

                      return (
                        <div key={productID} className="sp-card">
                          <div className="sp-card-img">
                            {soldOut && <span className="sp-card-badge sp-card-badge-sold">Sold Out</span>}
                            {isOnSale && !soldOut && (
                              <span className="sp-card-badge sp-card-badge-discount">-{discountPercent}%</span>
                            )}

                            <div
                              style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                              onClick={() => navigate(`/product/${productID}`)}
                            >
                              <img
                                src={getValidImageUrl(productImage)}
                                alt={productName}
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150"; }}
                              />
                            </div>

                            <div className="sp-card-overlay" onClick={() => navigate(`/product/${productID}`)}>
                              <Tooltip content={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}>
                                <button
                                  className="sp-card-action"
                                  onClick={(e) => { e.stopPropagation(); handleWishlistToggle(product); }}
                                >
                                  {inWishlist ? (
                                    <SolidHeartIcon style={{ width: 16, height: 16, color: "var(--sp-pink)" }} />
                                  ) : (
                                    <OutlineHeartIcon style={{ width: 16, height: 16, color: "var(--sp-mid)" }} />
                                  )}
                                </button>
                              </Tooltip>
                              <Tooltip content="View Details">
                                <button
                                  className="sp-card-action"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/product/${productID}`); }}
                                >
                                  <EyeIcon style={{ width: 16, height: 16, color: "var(--sp-green)" }} />
                                </button>
                              </Tooltip>
                              <Tooltip content={soldOut ? "Out of Stock" : "Add to Cart"}>
                                <button
                                  className="sp-card-action"
                                  onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                                  disabled={cartLoading || soldOut}
                                >
                                  <ShoppingCartIcon style={{ width: 16, height: 16, color: "var(--sp-green-mid)" }} />
                                </button>
                              </Tooltip>
                            </div>
                          </div>

                          <div className="sp-card-body">
                            <div className="sp-card-name">{productName}</div>
                            <div className="sp-card-price">{formatPrice(price)}</div>
                            {oldPrice > 0 && <div className="sp-card-old-price">{formatPrice(oldPrice)}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="sp-pagination">
                      <CircularPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                  )}
                </>
              )}

              {/* Empty State — only when truly empty after loading */}
              {trulyEmpty && (
                <div className="sp-empty">
                  <div className="sp-empty-icon-wrap">
                    <MagnifyingGlassIcon style={{ width: 32, height: 32, color: "var(--sp-light)" }} />
                  </div>
                  <div className="sp-empty-title">
                    {isFiltersActive ? "No matching products" : "No products available"}
                  </div>
                  <div className="sp-empty-desc">
                    {isFiltersActive
                      ? "Try adjusting your price range or filters to find what you're looking for."
                      : "This showroom doesn't have any products right now. Check back soon or explore other showrooms."}
                  </div>
                  <div className="sp-empty-actions">
                    {isFiltersActive && (
                      <button onClick={resetFilters} className="sp-empty-reset">
                        Clear Filters
                      </button>
                    )}
                    <button onClick={() => navigate("/")} className="sp-empty-browse">
                      Browse All Products
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {showSortDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />}
      </div>
    </>
  );
};

export default ShowroomProductsPage;