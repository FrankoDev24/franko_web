import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
// NOTE: assumes a `fetchProductsByShowroom` thunk exists in productSlice, mirroring
// `fetchProductsByCategory`, and that it stores results under `state.products.productsByShowroom`
// keyed by showroom id. Rename this import / selector to match your actual slice if different.
import { fetchProductsByShowroom } from "../Redux/Slice/productSlice";
import { useNavigate } from "react-router-dom";
import { addToWishlist, removeFromWishlist } from "../Redux/Slice/wishlistSlice";
import {
  FunnelIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  TagIcon,
  ChevronDownIcon,
  Bars3BottomLeftIcon,
  MagnifyingGlassIcon,
  BoltIcon,
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

const showroomId = "84b6b4e2-4fa4-4f3e-b89c-900812d95815";

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

  const bgClass = type === "success" ? "ss-notif-success" : "ss-notif-error";
  const Icon = type === "success" ? CheckCircleIcon : XCircleIcon;

  return (
    <div className="fixed top-4 right-4 z-50 ss-animate-slide-in">
      <div className={`ss-notif ${bgClass}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="ss-notif-text">{message}</span>
        <button onClick={onClose} className="ss-notif-close">×</button>
      </div>
    </div>
  );
};

// ==================== SKELETON ====================

const SkeletonCard = () => (
  <div className="ss-skeleton">
    <div className="ss-skeleton-img" />
    <div style={{ padding: "10px 12px" }}>
      <div className="ss-skeleton-line" style={{ width: "80%", marginBottom: 8, marginLeft: "auto", marginRight: "auto" }} />
      <div className="ss-skeleton-line" style={{ width: "50%", height: 8, marginLeft: "auto", marginRight: "auto" }} />
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

const SpeedShopping = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { productsByShowroom = {}, loading } = useSelector((state) => state.products);
  const wishlist = useSelector((state) => state.wishlist.items || []);
  const { addProductToCart, loading: cartLoading } = useAddToCart();

  const [inputPriceRange, setInputPriceRange] = useState({ min: 0, max: 200000 });
  const [appliedPriceRange, setAppliedPriceRange] = useState([0, 200000]);
  const [showDiscountedOnly, setShowDiscountedOnly] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
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
    dispatch(fetchProductsByShowroom(showroomId)).then(() => {
      setHasLoadedOnce(true);
    });
  }, [dispatch]);

  const products = useMemo(() => {
    return productsByShowroom[showroomId] || [];
  }, [productsByShowroom]);

  const brands = useMemo(() => {
    return Array.from(new Set(products.map((product) => product.brandName))).sort();
  }, [products]);

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
    setSelectedBrand(null);
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

  const filteredProducts = sortProducts(
    products.filter((p) => {
      const withinRange = p.price >= appliedPriceRange[0] && p.price <= appliedPriceRange[1];
      const hasDiscount = showDiscountedOnly ? (p.oldPrice || 0) > p.price : true;
      const matchesBrand = selectedBrand ? p.brandName === selectedBrand : true;
      return withinRange && hasDiscount && matchesBrand;
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
    selectedBrand !== null ||
    sortBy !== "newest";

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price-low", label: "Price: Low → High" },
    { value: "price-high", label: "Price: High → Low" },
    { value: "name-az", label: "Name: A → Z" },
    { value: "name-za", label: "Name: Z → A" },
  ];

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
    <div className="ss-filter-content">
      <div className="hidden ss-filter-header ss-desktop-only">
        <AdjustmentsHorizontalIcon style={{ width: 18, height: 18, color: "var(--ss-pink)" }} />
        <span className="ss-filter-header-text">Filters</span>
      </div>

      {/* Price Range */}
      <div className="ss-filter-section">
        <div className="ss-filter-section-title">
          <div className="ss-dot" style={{ background: "var(--ss-gold)" }} />
          <span>Price Range</span>
        </div>
        <div className="ss-price-inputs">
          <div className="ss-price-field">
            <label className="ss-price-label">Min</label>
            <div className="ss-price-input-wrap">
              <span className="ss-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.min}
                onChange={(e) => setInputPriceRange((prev) => ({ ...prev, min: +e.target.value }))}
                className="ss-price-input"
                placeholder="0"
              />
            </div>
          </div>
          <div className="ss-price-field">
            <label className="ss-price-label">Max</label>
            <div className="ss-price-input-wrap">
              <span className="ss-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.max}
                onChange={(e) => setInputPriceRange((prev) => ({ ...prev, max: +e.target.value }))}
                className="ss-price-input"
                placeholder="200000"
              />
            </div>
          </div>
        </div>
        <button onClick={applyPriceFilter} className="ss-apply-btn">
          Apply Price Filter
        </button>
        <div className="ss-applied-range">
          <span className="ss-applied-label">Active:</span>
          <span className="ss-applied-value">
            ₵{appliedPriceRange[0].toLocaleString()} – ₵{appliedPriceRange[1].toLocaleString()}
          </span>
        </div>
      </div>

      {/* Discount Toggle */}
      <div className="ss-filter-section ss-discount-section">
        <div className="ss-discount-row">
          <div className="ss-discount-info">
            <div className="ss-discount-icon">
              <TagIcon style={{ width: 14, height: 14, color: "#fff" }} />
            </div>
            <span className="ss-discount-label">Discounted Only</span>
          </div>
          <div
            onClick={() => setShowDiscountedOnly(!showDiscountedOnly)}
            className={`ss-toggle ${showDiscountedOnly ? "ss-toggle-on" : ""}`}
          >
            <div className="ss-toggle-knob" />
          </div>
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div className="ss-filter-section">
          <div className="ss-filter-section-title">
            <div className="ss-dot" style={{ background: "var(--ss-pink)" }} />
            <span>Brands</span>
          </div>
          <div className="ss-brand-tags">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => {
                  setSelectedBrand(selectedBrand === brand ? null : brand);
                  setCurrentPage(1);
                }}
                className={`ss-brand-tag ${selectedBrand === brand ? "ss-brand-tag-active" : ""}`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {isFiltersActive && (
        <button onClick={resetFilters} className="ss-reset-btn">
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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@800;900&display=swap');

        :root {
          --ss-font: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          --ss-display: 'Plus Jakarta Sans', var(--ss-font);
          --ss-purple-900: #1E0A36;
          --ss-purple-800: #321156;
          --ss-purple-700: #4D1070;
          --ss-pink-700: #7A0E6A;
          --ss-pink: #A30D5F;
          --ss-pink-mid: #B90F67;
          --ss-gold: #FFD500;
          --ss-gold-mid: #FFB600;
          --ss-orange: #FF8A00;
          --ss-purple-light: #f4ecfb;
          --ss-purple-lighter: #faf6fd;
          --ss-dark: #1a1a1a;
          --ss-mid: #5a5566;
          --ss-light: #8a8494;
          --ss-border: #e7ddf0;
          --ss-bg-subtle: #f8f5fb;
          --ss-red: #dc2626;
          --ss-radius: 4px;
          --ss-grad: linear-gradient(90deg, #4D1070 0%, #7A0E6A 45%, #A30D5F 75%, #B90F67 100%);
          --ss-grad-gold: linear-gradient(90deg, #FF8A00 0%, #FFB600 45%, #FFD500 100%);
        }

        .ss-root, .ss-root * {
          font-family: var(--ss-font);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          box-sizing: border-box;
        }

        .ss-desktop-only { display: none; }
        @media (min-width: 1024px) { .ss-desktop-only { display: flex; } }

        /* ==================== NOTIFICATION ==================== */

        .ss-notif {
          display: flex; align-items: center; gap: 10px; padding: 12px 16px;
          border-radius: var(--ss-radius); min-width: 280px;
          box-shadow: 0 4px 20px rgba(30,10,54,0.25);
        }
        .ss-notif-success { background: var(--ss-grad); color: #fff; }
        .ss-notif-error { background: var(--ss-red); color: #fff; }
        .ss-notif-text { font-size: 14px; font-weight: 500; flex: 1; }
        .ss-notif-close {
          background: transparent; border: none; color: rgba(255,255,255,0.8);
          font-size: 18px; cursor: pointer; padding: 0; line-height: 1;
        }
        .ss-notif-close:hover { color: #fff; }

        @keyframes ss-slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .ss-animate-slide-in { animation: ss-slide-in-right 0.3s ease-out; }

        /* ==================== PAGE HEADER ==================== */

        .ss-page-header {
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 20px; padding-bottom: 16px;
          border-bottom: 1px solid var(--ss-border);
        }
        .ss-page-header-accent {
          width: 4px; height: 28px; border-radius: 2px;
          background: var(--ss-grad); flex-shrink: 0;
        }
        .ss-page-title-row { display: flex; align-items: center; gap: 8px; }
        .ss-page-title {
          font-family: var(--ss-display);
          font-size: 20px; font-weight: 800; color: var(--ss-dark);
          letter-spacing: -0.02em; line-height: 1.2; margin: 0;
        }
        @media (min-width: 768px) { .ss-page-title { font-size: 24px; } }
        .ss-page-bolt {
          display: inline-flex; align-items: center; justify-content: center;
          width: 22px; height: 22px; border-radius: 50%; background: var(--ss-grad-gold);
          flex-shrink: 0; box-shadow: 0 2px 8px rgba(255,165,0,0.4);
        }
        .ss-page-count {
          font-size: 13px; font-weight: 500; color: var(--ss-light); margin-top: 2px;
        }
        .ss-page-header-line {
          flex: 1; height: 1px; background: var(--ss-border); display: none;
        }
        @media (min-width: 768px) { .ss-page-header-line { display: block; } }

        /* ==================== MOBILE CONTROLS ==================== */

        .ss-mobile-controls { display: flex; gap: 8px; margin-bottom: 16px; }
        @media (min-width: 1024px) { .ss-mobile-controls { display: none; } }

        .ss-filter-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: var(--ss-grad); color: #fff;
          border: none; border-radius: var(--ss-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--ss-font);
        }
        .ss-filter-trigger:active { transform: scale(0.98); }

        .ss-sort-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: #fff; color: var(--ss-mid);
          border: 1px solid var(--ss-border); border-radius: var(--ss-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--ss-font); position: relative;
        }
        .ss-sort-trigger:active { transform: scale(0.98); }

        /* ==================== SORT DROPDOWN ==================== */

        .ss-sort-drop {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: #fff; border: 1px solid var(--ss-border);
          border-radius: var(--ss-radius); box-shadow: 0 8px 30px rgba(77,16,112,0.12);
          z-index: 50; overflow: hidden; animation: ss-fade 0.15s ease;
        }

        @keyframes ss-fade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ss-sort-option {
          display: block; width: 100%; text-align: left; padding: 10px 14px;
          font-size: 13px; font-weight: 500; color: var(--ss-mid);
          background: none; border: none; cursor: pointer; transition: all 0.1s;
          font-family: var(--ss-font); border-bottom: 1px solid #f5f0f8;
        }
        .ss-sort-option:last-child { border-bottom: none; }
        .ss-sort-option:hover { background: var(--ss-bg-subtle); }
        .ss-sort-option-active {
          background: var(--ss-purple-light) !important;
          color: var(--ss-pink) !important; font-weight: 600 !important;
        }

        /* ==================== DESKTOP TOOLBAR ==================== */

        .ss-toolbar {
          display: none; align-items: center; justify-content: space-between;
          padding: 12px 16px; background: #fff; border: 1px solid var(--ss-border);
          border-radius: var(--ss-radius); margin-bottom: 16px;
        }
        @media (min-width: 768px) { .ss-toolbar { display: flex; } }

        .ss-toolbar-left { display: flex; align-items: center; gap: 12px; }
        .ss-toolbar-count { font-size: 13px; font-weight: 500; color: var(--ss-light); }
        .ss-toolbar-count strong { color: var(--ss-dark); font-weight: 700; }
        .ss-toolbar-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: var(--ss-purple-light); color: var(--ss-pink);
          font-size: 11px; font-weight: 700; padding: 3px 10px;
          border-radius: 100px; text-transform: uppercase; letter-spacing: 0.03em;
        }
        .ss-toolbar-right { display: flex; align-items: center; gap: 8px; }

        .ss-desktop-sort { position: relative; }
        .ss-desktop-sort-btn {
          display: flex; align-items: center; gap: 6px; padding: 7px 14px;
          background: #fff; border: 1px solid var(--ss-border);
          border-radius: var(--ss-radius); font-size: 13px; font-weight: 500;
          color: var(--ss-mid); cursor: pointer; transition: all 0.15s;
          font-family: var(--ss-font);
        }
        .ss-desktop-sort-btn:hover {
          border-color: var(--ss-pink); color: var(--ss-dark);
        }
        .ss-desktop-sort-drop {
          position: absolute; top: calc(100% + 4px); right: 0; width: 200px;
          background: #fff; border: 1px solid var(--ss-border);
          border-radius: var(--ss-radius); box-shadow: 0 8px 30px rgba(77,16,112,0.12);
          z-index: 50; overflow: hidden; animation: ss-fade 0.15s ease;
        }

        /* ==================== FILTER SIDEBAR ==================== */

        .ss-filter-content { display: flex; flex-direction: column; gap: 16px; }

        .ss-filter-header {
          display: flex; align-items: center; gap: 8px;
          padding-bottom: 12px; border-bottom: 1px solid var(--ss-border);
        }
        .ss-filter-header-text {
          font-family: var(--ss-display);
          font-size: 16px; font-weight: 800; color: var(--ss-dark); letter-spacing: -0.01em;
        }

        .ss-filter-section {
          padding: 16px; background: #fff; border: 1px solid var(--ss-border);
          border-radius: var(--ss-radius);
        }
        .ss-filter-section-title {
          display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
          font-size: 14px; font-weight: 700; color: var(--ss-dark);
        }
        .ss-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .ss-price-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .ss-price-field { display: flex; flex-direction: column; gap: 4px; }
        .ss-price-label {
          font-size: 11px; font-weight: 600; color: var(--ss-light);
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .ss-price-input-wrap { position: relative; display: flex; align-items: center; }
        .ss-price-symbol {
          position: absolute; left: 10px; font-size: 13px; font-weight: 600; color: var(--ss-light);
        }
        .ss-price-input {
          width: 100%; padding: 8px 10px 8px 24px; border: 1px solid var(--ss-border);
          border-radius: var(--ss-radius); font-size: 13px; font-weight: 500;
          color: var(--ss-dark); font-family: var(--ss-font);
          transition: border-color 0.15s; outline: none;
        }
        .ss-price-input:focus {
          border-color: var(--ss-pink);
          box-shadow: 0 0 0 2px rgba(163,13,95,0.12);
        }

        .ss-apply-btn {
          width: 100%; padding: 9px; background: var(--ss-grad); color: #fff;
          border: none; border-radius: var(--ss-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: filter 0.15s;
          font-family: var(--ss-font); margin-bottom: 10px;
        }
        .ss-apply-btn:hover { filter: brightness(1.08); }
        .ss-apply-btn:active { transform: scale(0.98); }

        .ss-applied-range {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 10px; background: var(--ss-purple-lighter);
          border: 1px solid #ecd9f5; border-radius: var(--ss-radius);
        }
        .ss-applied-label { font-size: 11px; font-weight: 600; color: var(--ss-pink); }
        .ss-applied-value { font-size: 12px; font-weight: 700; color: var(--ss-purple-700); }

        .ss-discount-section { background: var(--ss-purple-lighter); border-color: #ecd9f5; }
        .ss-discount-row { display: flex; align-items: center; justify-content: space-between; }
        .ss-discount-info { display: flex; align-items: center; gap: 10px; }
        .ss-discount-icon {
          width: 28px; height: 28px; border-radius: var(--ss-radius);
          background: var(--ss-grad); display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .ss-discount-label { font-size: 13px; font-weight: 600; color: var(--ss-dark); }

        .ss-toggle {
          width: 40px; height: 22px; border-radius: 11px; background: #d9d0e3;
          cursor: pointer; transition: background 0.2s; padding: 2px; flex-shrink: 0;
        }
        .ss-toggle-on { background: var(--ss-grad) !important; }
        .ss-toggle-knob {
          width: 18px; height: 18px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15); transition: transform 0.2s;
        }
        .ss-toggle-on .ss-toggle-knob { transform: translateX(18px); }

        .ss-brand-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .ss-brand-tag {
          padding: 5px 12px; font-size: 12px; font-weight: 500; color: var(--ss-mid);
          background: var(--ss-bg-subtle); border: 1px solid var(--ss-border);
          border-radius: 100px; cursor: pointer; transition: all 0.15s;
          font-family: var(--ss-font); white-space: nowrap;
        }
        .ss-brand-tag:hover {
          border-color: var(--ss-pink); color: var(--ss-pink);
          background: var(--ss-purple-light);
        }
        .ss-brand-tag-active {
          background: var(--ss-grad) !important; color: #fff !important;
          border-color: transparent !important; font-weight: 600 !important;
        }

        .ss-reset-btn {
          width: 100%; padding: 9px; background: #fff; color: var(--ss-red);
          border: 1px solid #fecaca; border-radius: var(--ss-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--ss-font);
        }
        .ss-reset-btn:hover { background: #fef2f2; border-color: var(--ss-red); }
        .ss-reset-btn:active { transform: scale(0.98); }

        /* ==================== DRAWER ==================== */

        .ss-drawer-overlay {
          position: fixed; inset: 0; z-index: 100; display: flex;
          animation: ss-fade 0.2s ease;
        }
        .ss-drawer-backdrop { position: absolute; inset: 0; background: rgba(30,10,54,0.45); }
        .ss-drawer-panel {
          position: relative; width: 100%; max-width: 320px; height: 100%;
          background: #fff; box-shadow: 0 20px 60px rgba(30,10,54,0.3);
          overflow-y: auto; z-index: 1; animation: ss-slide-in 0.25s ease;
        }
        @keyframes ss-slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .ss-drawer-header {
          position: sticky; top: 0; background: #fff; display: flex;
          align-items: center; justify-content: space-between; padding: 14px 16px;
          border-bottom: 1px solid var(--ss-border); z-index: 2;
        }
        .ss-drawer-header-left { display: flex; align-items: center; gap: 8px; }
        .ss-drawer-header-title { font-family: var(--ss-display); font-size: 16px; font-weight: 800; color: var(--ss-dark); }
        .ss-drawer-close {
          width: 32px; height: 32px; display: flex; align-items: center;
          justify-content: center; border: 1px solid var(--ss-border);
          border-radius: var(--ss-radius); background: #fff; cursor: pointer;
          transition: background 0.12s;
        }
        .ss-drawer-close:active { background: #f5f0f8; }
        .ss-drawer-body { padding: 16px; }

        /* ==================== PRODUCT GRID ==================== */

        .ss-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
        }
        @media (min-width: 640px) { .ss-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .ss-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
        @media (min-width: 1280px) { .ss-grid { grid-template-columns: repeat(4, 1fr); } }

        /* ==================== CARDS ==================== */

        .ss-card {
          border: 1px solid var(--ss-border); border-radius: var(--ss-radius);
          overflow: hidden; background: #fff; transition: all 0.2s ease; cursor: pointer;
        }
        .ss-card:hover {
          border-color: var(--ss-pink);
          box-shadow: 0 4px 16px rgba(163, 13, 95, 0.12);
        }

        .ss-card-img {
          position: relative; height: 190px; display: flex; align-items: center;
          justify-content: center; padding: 10px; overflow: hidden;
        }
        @media (min-width: 768px) { .ss-card-img { height: 195px; } }

        .ss-card-img img {
          height: 100%; width: 100%; object-fit: contain; transition: transform 0.3s ease;
        }
        .ss-card:hover .ss-card-img img { transform: scale(1.05); }

        .ss-card-overlay {
          position: absolute; inset: 0; background: rgba(30, 10, 54, 0.5);
          display: none; align-items: center; justify-content: center; gap: 8px; z-index: 2;
        }
        .ss-card:hover .ss-card-overlay { display: flex; }

        .ss-card-action {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 50%; background: #fff;
          border: none; cursor: pointer; transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .ss-card-action:hover {
          transform: scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .ss-card-action:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .ss-card-body { padding: 10px 12px; text-align: center; }

        .ss-card-name {
          font-size: 15px; font-weight: 600; color: var(--ss-dark); line-height: 1.35;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; min-height: 35px;
        }

        .ss-card-price { font-size: 15px; font-weight: 900; color: var(--ss-pink); margin-top: 2px; }

        .ss-card-old-price {
          font-size: 12px; font-weight: 400; color: var(--ss-light);
          text-decoration: line-through; margin-top: 2px;
        }

        .ss-card-badge {
          position: absolute; top: 8px; font-size: 9px; font-weight: 700;
          padding: 3px 8px; border-radius: 100px; z-index: 3;
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .ss-card-badge-sold { left: 8px; background: var(--ss-purple-900); color: #fff; }
        .ss-card-badge-discount {
          right: 8px; background: var(--ss-grad-gold); color: var(--ss-purple-900);
          font-size: 10px; padding: 3px 7px; font-weight: 900;
          box-shadow: 0 2px 6px rgba(255,165,0,0.4);
        }

        /* ==================== SKELETON ==================== */

        .ss-skeleton {
          border: 1px solid #f0e9f5; border-radius: var(--ss-radius);
          overflow: hidden; background: #fff;
        }
        .ss-skeleton-img {
          height: 150px;
          background: linear-gradient(90deg, #f3edf8 25%, #ece1f5 50%, #f3edf8 75%);
          background-size: 200% 100%; animation: ss-shimmer 1.5s infinite;
        }
        @media (min-width: 768px) { .ss-skeleton-img { height: 195px; } }

        @keyframes ss-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .ss-skeleton-line {
          height: 10px; border-radius: 2px;
          background: linear-gradient(90deg, #f3edf8 25%, #ece1f5 50%, #f3edf8 75%);
          background-size: 200% 100%; animation: ss-shimmer 1.5s infinite;
        }

        /* ==================== EMPTY STATE ==================== */

        .ss-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center; padding: 60px 24px;
          background: #fff; border: 1px solid var(--ss-border);
          border-radius: var(--ss-radius); margin-top: 16px;
        }
        .ss-empty-icon-wrap {
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--ss-bg-subtle); display: flex; align-items: center;
          justify-content: center; margin-bottom: 20px;
          border: 1px solid var(--ss-border);
        }
        .ss-empty-title {
          font-family: var(--ss-display);
          font-size: 18px; font-weight: 700; color: var(--ss-dark); margin-bottom: 8px;
        }
        .ss-empty-desc {
          font-size: 14px; color: var(--ss-light); max-width: 360px;
          line-height: 1.6; margin-bottom: 24px;
        }
        .ss-empty-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; }
        .ss-empty-reset {
          padding: 10px 20px; background: var(--ss-grad); color: #fff;
          border: none; border-radius: var(--ss-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: filter 0.15s;
          font-family: var(--ss-font);
        }
        .ss-empty-reset:hover { filter: brightness(1.08); }
        .ss-empty-browse {
          padding: 10px 20px; background: #fff; color: var(--ss-mid);
          border: 1px solid var(--ss-border); border-radius: var(--ss-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--ss-font); text-decoration: none;
        }
        .ss-empty-browse:hover { border-color: var(--ss-pink); color: var(--ss-dark); }

        /* ==================== LAYOUT ==================== */

        .ss-layout { display: flex; flex-direction: column; gap: 0; }
        @media (min-width: 1024px) { .ss-layout { flex-direction: row; gap: 24px; } }

        .ss-sidebar { display: none; width: 280px; flex-shrink: 0; }
        @media (min-width: 1024px) { .ss-sidebar { display: block; } }

        .ss-sidebar-sticky { position: sticky; top: 80px; }
        .ss-main { flex: 1; min-width: 0; }
        .ss-pagination { display: flex; justify-content: center; margin-top: 24px; }
      `}</style>

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="ss-root min-h-screen">
        <Helmet>
          <title>Speed Shopping Deals | Franko Trading</title>
          <meta name="description" content="Shop the Speed Shopping showroom for limited-time deals on top products at unbeatable prices." />
          <meta name="keywords" content="speed shopping, deals, discounts, flash sale, Franko Trading" />
          <meta name="robots" content="index, follow" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="Speed Shopping Deals | Franko Trading" />
          <meta property="og:description" content="Shop the Speed Shopping showroom for limited-time deals at unbeatable prices." />
          <meta property="og:image" content={filteredProducts.length > 0 ? `https://testing.frankotrading.com/Media/Products_Images/${filteredProducts[0].productImage.split("\\").pop()}` : "default-image-url"} />
          <meta property="og:url" content="https://www.frankotrading.com/speed-shopping" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Speed Shopping Deals | Franko Trading" />
          <meta name="twitter:description" content="Limited-time deals on top products, only while the clock is running." />
          <meta name="twitter:image" content={filteredProducts.length > 0 ? `https://testing.frankotrading.com/Media/Products_Images/${filteredProducts[0].productImage.split("\\").pop()}` : "default-image-url"} />
          <link rel="canonical" href="https://www.frankotrading.com/speed-shopping" />
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "Speed Shopping",
              "description": "Limited-time deals on top products at unbeatable prices.",
              "url": "https://www.frankotrading.com/speed-shopping",
              "itemListElement": filteredProducts.map((item, index) => ({
                "@type": "Product",
                "position": index + 1,
                "name": item.productName,
                "image": `https://testing.frankotrading.com/Media/Products_Images/${item.productImage.split("\\").pop()}`,
                "description": item.description,
                "sku": item.productID,
                "category": item.categoryName,
                "brand": {
                  "@type": "Brand",
                  "name": item.brandName
                },
                "offers": {
                  "@type": "Offer",
                  "priceCurrency": "GHS",
                  "price": item.price,
                  "priceValidUntil": "2025-12-31",
                  "itemCondition": "https://schema.org/NewCondition",
                  "availability": "https://schema.org/InStock",
                  "url": `https://www.frankotrading.com/product/${item.productID}`,
                  "seller": {
                    "@type": "Organization",
                    "name": "Franko Trading"
                  },
                  "shippingDetails": {
                    "@type": "OfferShippingDetails",
                    "shippingRate": {
                      "@type": "MonetaryAmount",
                      "currency": "GHS",
                      "value": "30.00"
                    },
                    "shippingDestination": {
                      "@type": "DefinedRegion",
                      "addressCountry": "GH"
                    },
                    "deliveryTime": {
                      "@type": "ShippingDeliveryTime",
                      "handlingTime": {
                        "@type": "QuantitativeValue",
                        "minValue": 1,
                        "maxValue": 2,
                        "unitCode": "DAY"
                      },
                      "transitTime": {
                        "@type": "QuantitativeValue",
                        "minValue": 3,
                        "maxValue": 5,
                        "unitCode": "DAY"
                      }
                    }
                  },
                  "hasMerchantReturnPolicy": {
                    "@type": "MerchantReturnPolicy",
                    "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                    "merchantReturnDays": 14,
                    "returnMethod": "https://schema.org/ReturnByMail",
                    "returnFees": "https://schema.org/FreeReturn",
                    "applicableCountry": "GH"
                  }
                }
              }))
            })}
          </script>
        </Helmet>

        <div className="px-4 md:px-16 py-6">
          {/* Page Header */}
          <div className="ss-page-header">
            <div className="ss-page-header-accent" />
            <div>
              <div className="ss-page-title-row">
                <span className="ss-page-bolt">
                  <BoltIcon style={{ width: 13, height: 13, color: "var(--ss-purple-900)" }} />
                </span>
                <h1 className="ss-page-title">
                  {selectedBrand ? `${selectedBrand} — Speed Shopping` : "Speed Shopping"}
                </h1>
              </div>
              <p className="ss-page-count">
                {isInitialLoading
                  ? "Loading deals..."
                  : `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <div className="ss-page-header-line" />
          </div>

          {/* Mobile Controls */}
          <div className="ss-mobile-controls">
            <button onClick={() => setIsDrawerOpen(true)} className="ss-filter-trigger">
              <FunnelIcon style={{ width: 16, height: 16 }} />
              <span>Filters</span>
              {isFiltersActive && (
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", marginLeft: 2 }} />
              )}
            </button>
            <div className="ss-sort-trigger" onClick={() => setShowSortDropdown(!showSortDropdown)}>
              <Bars3BottomLeftIcon style={{ width: 16, height: 16 }} />
              <span>Sort</span>
              <ChevronDownIcon
                style={{ width: 14, height: 14, transition: "transform 0.2s", transform: showSortDropdown ? "rotate(180deg)" : "none" }}
              />
              {showSortDropdown && (
                <div className="ss-sort-drop">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                        setCurrentPage(1);
                      }}
                      className={`ss-sort-option ${sortBy === option.value ? "ss-sort-option-active" : ""}`}
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
            <div className="ss-drawer-overlay">
              <div className="ss-drawer-backdrop" onClick={() => setIsDrawerOpen(false)} />
              <div className="ss-drawer-panel">
                <div className="ss-drawer-header">
                  <div className="ss-drawer-header-left">
                    <AdjustmentsHorizontalIcon style={{ width: 18, height: 18, color: "var(--ss-pink)" }} />
                    <span className="ss-drawer-header-title">Filters</span>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} className="ss-drawer-close">
                    <XMarkIcon style={{ width: 14, height: 14, color: "var(--ss-light)" }} />
                  </button>
                </div>
                <div className="ss-drawer-body">{renderFilterContent()}</div>
              </div>
            </div>
          )}

          {/* Layout */}
          <div className="ss-layout">
            <aside className="ss-sidebar">
              <div className="ss-sidebar-sticky">{renderFilterContent()}</div>
            </aside>

            <section className="ss-main">
              {/* Desktop Toolbar */}
              {(hasProducts || isInitialLoading) && (
                <div className="ss-toolbar">
                  <div className="ss-toolbar-left">
                    <span className="ss-toolbar-count">
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
                    {isFiltersActive && <span className="ss-toolbar-badge">Filtered</span>}
                  </div>
                  <div className="ss-toolbar-right">
                    <div className="ss-desktop-sort">
                      <button onClick={() => setShowSortDropdown(!showSortDropdown)} className="ss-desktop-sort-btn">
                        <Bars3BottomLeftIcon style={{ width: 14, height: 14 }} />
                        <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                        <ChevronDownIcon
                          style={{ width: 12, height: 12, transition: "transform 0.2s", transform: showSortDropdown ? "rotate(180deg)" : "none" }}
                        />
                      </button>
                      {showSortDropdown && (
                        <div className="ss-desktop-sort-drop">
                          {sortOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortBy(option.value);
                                setShowSortDropdown(false);
                                setCurrentPage(1);
                              }}
                              className={`ss-sort-option ${sortBy === option.value ? "ss-sort-option-active" : ""}`}
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
                <div className="ss-grid">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Products */}
              {!isInitialLoading && hasProducts && (
                <>
                  <div className="ss-grid">
                    {currentProducts.map((product) => {
                      const { productID, productName, productImage, price, oldPrice, stock } = product;
                      const isOnSale = oldPrice > 0 && oldPrice > price;
                      const discountPercent = isOnSale ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
                      const soldOut = stock === 0;
                      const inWishlist = isInWishlist(productID);

                      return (
                        <div key={productID} className="ss-card">
                          <div className="ss-card-img">
                            {soldOut && <span className="ss-card-badge ss-card-badge-sold">Sold Out</span>}
                            {isOnSale && !soldOut && (
                              <span className="ss-card-badge ss-card-badge-discount">-{discountPercent}%</span>
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

                            <div className="ss-card-overlay" onClick={() => navigate(`/product/${productID}`)}>
                              <Tooltip content={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}>
                                <button
                                  className="ss-card-action"
                                  onClick={(e) => { e.stopPropagation(); handleWishlistToggle(product); }}
                                >
                                  {inWishlist ? (
                                    <SolidHeartIcon style={{ width: 16, height: 16, color: "var(--ss-pink)" }} />
                                  ) : (
                                    <OutlineHeartIcon style={{ width: 16, height: 16, color: "var(--ss-mid)" }} />
                                  )}
                                </button>
                              </Tooltip>
                              <Tooltip content="View Details">
                                <button
                                  className="ss-card-action"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/product/${productID}`); }}
                                >
                                  <EyeIcon style={{ width: 16, height: 16, color: "var(--ss-purple-700)" }} />
                                </button>
                              </Tooltip>
                              <Tooltip content={soldOut ? "Out of Stock" : "Add to Cart"}>
                                <button
                                  className="ss-card-action"
                                  onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                                  disabled={cartLoading || soldOut}
                                >
                                  <ShoppingCartIcon style={{ width: 16, height: 16, color: "var(--ss-pink)" }} />
                                </button>
                              </Tooltip>
                            </div>
                          </div>

                          <div className="ss-card-body">
                            <div className="ss-card-name">{productName}</div>
                            <div className="ss-card-price">{formatPrice(price)}</div>
                            {oldPrice > 0 && <div className="ss-card-old-price">{formatPrice(oldPrice)}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="ss-pagination">
                      <CircularPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {trulyEmpty && (
                <div className="ss-empty">
                  <div className="ss-empty-icon-wrap">
                    <MagnifyingGlassIcon style={{ width: 32, height: 32, color: "var(--ss-light)" }} />
                  </div>
                  <div className="ss-empty-title">
                    {isFiltersActive ? "No matching deals" : "Speed Shopping Starts Soon!"}
                  </div>
                  <div className="ss-empty-desc">
                    {isFiltersActive
                      ? "Try adjusting your price range, brand, or filters to find what you're looking for."
                      : "Get ready for our exciting Speed Shopping event on 7th August. Amazing deals and limited-time offers will be available, so mark your calendar and be ready to shop before they're gone!"}
                  </div>
                  <div className="ss-empty-actions">
                    {isFiltersActive && (
                      <button onClick={resetFilters} className="ss-empty-reset">
                        Clear Filters
                      </button>
                    )}
                    <button onClick={() => navigate("/")} className="ss-empty-browse">
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

export default SpeedShopping;