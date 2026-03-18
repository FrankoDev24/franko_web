import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByCategory } from "../Redux/Slice/productSlice";
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

const categoryId = "9170b363-bb16-4980-83a1-7e3a3bbba964";

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

  const bgClass = type === "success" ? "ap-notif-success" : "ap-notif-error";
  const Icon = type === "success" ? CheckCircleIcon : XCircleIcon;

  return (
    <div className="fixed top-4 right-4 z-50 ap-animate-slide-in">
      <div className={`ap-notif ${bgClass}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="ap-notif-text">{message}</span>
        <button onClick={onClose} className="ap-notif-close">×</button>
      </div>
    </div>
  );
};

// ==================== SKELETON ====================

const SkeletonCard = () => (
  <div className="ap-skeleton">
    <div className="ap-skeleton-img" />
    <div style={{ padding: "10px 12px" }}>
      <div className="ap-skeleton-line" style={{ width: "80%", marginBottom: 8, marginLeft: "auto", marginRight: "auto" }} />
      <div className="ap-skeleton-line" style={{ width: "50%", height: 8, marginLeft: "auto", marginRight: "auto" }} />
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

const Appliances = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { productsByCategory = {}, loading } = useSelector((state) => state.products);
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
    dispatch(fetchProductsByCategory(categoryId)).then(() => {
      setHasLoadedOnce(true);
    });
  }, [dispatch]);

  const products = useMemo(() => {
    return productsByCategory[categoryId] || [];
  }, [productsByCategory]);

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
      ? `https://ct002.frankotrading.com:444/Media/Products_Images/${imagePath.split("\\").pop()}`
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
    <div className="ap-filter-content">
      <div className="hidden ap-filter-header ap-desktop-only">
        <AdjustmentsHorizontalIcon style={{ width: 18, height: 18, color: "var(--ap-green)" }} />
        <span className="ap-filter-header-text">Filters</span>
      </div>

      {/* Price Range */}
      <div className="ap-filter-section">
        <div className="ap-filter-section-title">
          <div className="ap-dot" style={{ background: "var(--ap-green-accent)" }} />
          <span>Price Range</span>
        </div>
        <div className="ap-price-inputs">
          <div className="ap-price-field">
            <label className="ap-price-label">Min</label>
            <div className="ap-price-input-wrap">
              <span className="ap-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.min}
                onChange={(e) => setInputPriceRange((prev) => ({ ...prev, min: +e.target.value }))}
                className="ap-price-input"
                placeholder="0"
              />
            </div>
          </div>
          <div className="ap-price-field">
            <label className="ap-price-label">Max</label>
            <div className="ap-price-input-wrap">
              <span className="ap-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.max}
                onChange={(e) => setInputPriceRange((prev) => ({ ...prev, max: +e.target.value }))}
                className="ap-price-input"
                placeholder="200000"
              />
            </div>
          </div>
        </div>
        <button onClick={applyPriceFilter} className="ap-apply-btn">
          Apply Price Filter
        </button>
        <div className="ap-applied-range">
          <span className="ap-applied-label">Active:</span>
          <span className="ap-applied-value">
            ₵{appliedPriceRange[0].toLocaleString()} – ₵{appliedPriceRange[1].toLocaleString()}
          </span>
        </div>
      </div>

      {/* Discount Toggle */}
      <div className="ap-filter-section ap-discount-section">
        <div className="ap-discount-row">
          <div className="ap-discount-info">
            <div className="ap-discount-icon">
              <TagIcon style={{ width: 14, height: 14, color: "#fff" }} />
            </div>
            <span className="ap-discount-label">Discounted Only</span>
          </div>
          <div
            onClick={() => setShowDiscountedOnly(!showDiscountedOnly)}
            className={`ap-toggle ${showDiscountedOnly ? "ap-toggle-on" : ""}`}
          >
            <div className="ap-toggle-knob" />
          </div>
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div className="ap-filter-section">
          <div className="ap-filter-section-title">
            <div className="ap-dot" style={{ background: "var(--ap-green)" }} />
            <span>Brands</span>
          </div>
          <div className="ap-brand-tags">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => {
                  setSelectedBrand(selectedBrand === brand ? null : brand);
                  setCurrentPage(1);
                }}
                className={`ap-brand-tag ${selectedBrand === brand ? "ap-brand-tag-active" : ""}`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {isFiltersActive && (
        <button onClick={resetFilters} className="ap-reset-btn">
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
          --ap-font: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          --ap-green: #14532d;
          --ap-green-mid: #166534;
          --ap-green-light: #dcfce7;
          --ap-green-lighter: #f0fdf4;
          --ap-green-accent: #22c55e;
          --ap-dark: #1a1a1a;
          --ap-mid: #555;
          --ap-light: #888;
          --ap-border: #e0e0e0;
          --ap-bg-subtle: #f7f7f7;
          --ap-red: #dc2626;
          --ap-pink: #e11d48;
          --ap-radius: 4px;
        }

        .ap-root, .ap-root * {
          font-family: var(--ap-font);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          box-sizing: border-box;
        }

        .ap-desktop-only { display: none; }
        @media (min-width: 1024px) { .ap-desktop-only { display: flex; } }

        /* ==================== NOTIFICATION ==================== */

        .ap-notif {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: var(--ap-radius);
          min-width: 280px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .ap-notif-success { background: var(--ap-green); color: #fff; }
        .ap-notif-error { background: var(--ap-red); color: #fff; }

        .ap-notif-text { font-size: 14px; font-weight: 500; flex: 1; }

        .ap-notif-close {
          background: transparent; border: none; color: rgba(255,255,255,0.8);
          font-size: 18px; cursor: pointer; padding: 0; line-height: 1;
        }
        .ap-notif-close:hover { color: #fff; }

        @keyframes ap-slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .ap-animate-slide-in { animation: ap-slide-in-right 0.3s ease-out; }

        /* ==================== PAGE HEADER ==================== */

        .ap-page-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--ap-border);
        }

        .ap-page-header-accent {
          width: 4px; height: 28px; border-radius: 2px;
          background: var(--ap-green); flex-shrink: 0;
        }

        .ap-page-title {
          font-size: 20px; font-weight: 800; color: var(--ap-dark);
          letter-spacing: -0.02em; line-height: 1.2; margin: 0;
        }
        @media (min-width: 768px) { .ap-page-title { font-size: 24px; } }

        .ap-page-count {
          font-size: 13px; font-weight: 500; color: var(--ap-light); margin-top: 2px;
        }

        .ap-page-header-line {
          flex: 1; height: 1px; background: var(--ap-border); display: none;
        }
        @media (min-width: 768px) { .ap-page-header-line { display: block; } }

        /* ==================== MOBILE CONTROLS ==================== */

        .ap-mobile-controls { display: flex; gap: 8px; margin-bottom: 16px; }
        @media (min-width: 1024px) { .ap-mobile-controls { display: none; } }

        .ap-filter-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: var(--ap-green); color: #fff;
          border: none; border-radius: var(--ap-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--ap-font);
        }
        .ap-filter-trigger:active { transform: scale(0.98); }

        .ap-sort-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: #fff; color: var(--ap-mid);
          border: 1px solid var(--ap-border); border-radius: var(--ap-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--ap-font); position: relative;
        }
        .ap-sort-trigger:active { transform: scale(0.98); }

        /* ==================== SORT DROPDOWN ==================== */

        .ap-sort-drop {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: #fff; border: 1px solid var(--ap-border);
          border-radius: var(--ap-radius); box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          z-index: 50; overflow: hidden; animation: ap-fade 0.15s ease;
        }

        @keyframes ap-fade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ap-sort-option {
          display: block; width: 100%; text-align: left; padding: 10px 14px;
          font-size: 13px; font-weight: 500; color: var(--ap-mid);
          background: none; border: none; cursor: pointer; transition: all 0.1s;
          font-family: var(--ap-font); border-bottom: 1px solid #f5f5f5;
        }
        .ap-sort-option:last-child { border-bottom: none; }
        .ap-sort-option:hover { background: var(--ap-bg-subtle); }
        .ap-sort-option-active {
          background: var(--ap-green-light) !important;
          color: var(--ap-green) !important; font-weight: 600 !important;
        }

        /* ==================== DESKTOP TOOLBAR ==================== */

        .ap-toolbar {
          display: none; align-items: center; justify-content: space-between;
          padding: 12px 16px; background: #fff; border: 1px solid var(--ap-border);
          border-radius: var(--ap-radius); margin-bottom: 16px;
        }
        @media (min-width: 768px) { .ap-toolbar { display: flex; } }

        .ap-toolbar-left { display: flex; align-items: center; gap: 12px; }

        .ap-toolbar-count { font-size: 13px; font-weight: 500; color: var(--ap-light); }
        .ap-toolbar-count strong { color: var(--ap-dark); font-weight: 700; }

        .ap-toolbar-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: var(--ap-green-light); color: var(--ap-green);
          font-size: 11px; font-weight: 700; padding: 3px 10px;
          border-radius: 100px; text-transform: uppercase; letter-spacing: 0.03em;
        }

        .ap-toolbar-right { display: flex; align-items: center; gap: 8px; }

        .ap-desktop-sort { position: relative; }

        .ap-desktop-sort-btn {
          display: flex; align-items: center; gap: 6px; padding: 7px 14px;
          background: #fff; border: 1px solid var(--ap-border);
          border-radius: var(--ap-radius); font-size: 13px; font-weight: 500;
          color: var(--ap-mid); cursor: pointer; transition: all 0.15s;
          font-family: var(--ap-font);
        }
        .ap-desktop-sort-btn:hover {
          border-color: var(--ap-green-accent); color: var(--ap-dark);
        }

        .ap-desktop-sort-drop {
          position: absolute; top: calc(100% + 4px); right: 0; width: 200px;
          background: #fff; border: 1px solid var(--ap-border);
          border-radius: var(--ap-radius); box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          z-index: 50; overflow: hidden; animation: ap-fade 0.15s ease;
        }

        /* ==================== FILTER SIDEBAR ==================== */

        .ap-filter-content { display: flex; flex-direction: column; gap: 16px; }

        .ap-filter-header {
          display: flex; align-items: center; gap: 8px;
          padding-bottom: 12px; border-bottom: 1px solid var(--ap-border);
        }
        .ap-filter-header-text {
          font-size: 16px; font-weight: 800; color: var(--ap-dark); letter-spacing: -0.01em;
        }

        .ap-filter-section {
          padding: 16px; background: #fff; border: 1px solid var(--ap-border);
          border-radius: var(--ap-radius);
        }
        .ap-filter-section-title {
          display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
          font-size: 14px; font-weight: 700; color: var(--ap-dark);
        }
        .ap-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .ap-price-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .ap-price-field { display: flex; flex-direction: column; gap: 4px; }
        .ap-price-label {
          font-size: 11px; font-weight: 600; color: var(--ap-light);
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .ap-price-input-wrap { position: relative; display: flex; align-items: center; }
        .ap-price-symbol {
          position: absolute; left: 10px; font-size: 13px; font-weight: 600; color: var(--ap-light);
        }
        .ap-price-input {
          width: 100%; padding: 8px 10px 8px 24px; border: 1px solid var(--ap-border);
          border-radius: var(--ap-radius); font-size: 13px; font-weight: 500;
          color: var(--ap-dark); font-family: var(--ap-font);
          transition: border-color 0.15s; outline: none;
        }
        .ap-price-input:focus {
          border-color: var(--ap-green-accent);
          box-shadow: 0 0 0 2px rgba(34,197,94,0.1);
        }

        .ap-apply-btn {
          width: 100%; padding: 9px; background: var(--ap-green); color: #fff;
          border: none; border-radius: var(--ap-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background 0.15s;
          font-family: var(--ap-font); margin-bottom: 10px;
        }
        .ap-apply-btn:hover { background: var(--ap-green-mid); }
        .ap-apply-btn:active { transform: scale(0.98); }

        .ap-applied-range {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 10px; background: var(--ap-green-lighter);
          border: 1px solid #bbf7d0; border-radius: var(--ap-radius);
        }
        .ap-applied-label { font-size: 11px; font-weight: 600; color: var(--ap-green-mid); }
        .ap-applied-value { font-size: 12px; font-weight: 700; color: var(--ap-green); }

        .ap-discount-section { background: var(--ap-green-lighter); border-color: #bbf7d0; }
        .ap-discount-row { display: flex; align-items: center; justify-content: space-between; }
        .ap-discount-info { display: flex; align-items: center; gap: 10px; }
        .ap-discount-icon {
          width: 28px; height: 28px; border-radius: var(--ap-radius);
          background: var(--ap-green); display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .ap-discount-label { font-size: 13px; font-weight: 600; color: var(--ap-dark); }

        .ap-toggle {
          width: 40px; height: 22px; border-radius: 11px; background: #d1d5db;
          cursor: pointer; transition: background 0.2s; padding: 2px; flex-shrink: 0;
        }
        .ap-toggle-on { background: var(--ap-green) !important; }
        .ap-toggle-knob {
          width: 18px; height: 18px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15); transition: transform 0.2s;
        }
        .ap-toggle-on .ap-toggle-knob { transform: translateX(18px); }

        .ap-brand-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .ap-brand-tag {
          padding: 5px 12px; font-size: 12px; font-weight: 500; color: var(--ap-mid);
          background: var(--ap-bg-subtle); border: 1px solid var(--ap-border);
          border-radius: 100px; cursor: pointer; transition: all 0.15s;
          font-family: var(--ap-font); white-space: nowrap;
        }
        .ap-brand-tag:hover {
          border-color: var(--ap-green-accent); color: var(--ap-green);
          background: var(--ap-green-light);
        }
        .ap-brand-tag-active {
          background: var(--ap-green) !important; color: #fff !important;
          border-color: var(--ap-green) !important; font-weight: 600 !important;
        }

        .ap-reset-btn {
          width: 100%; padding: 9px; background: #fff; color: var(--ap-red);
          border: 1px solid #fecaca; border-radius: var(--ap-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--ap-font);
        }
        .ap-reset-btn:hover { background: #fef2f2; border-color: var(--ap-red); }
        .ap-reset-btn:active { transform: scale(0.98); }

        /* ==================== DRAWER ==================== */

        .ap-drawer-overlay {
          position: fixed; inset: 0; z-index: 100; display: flex;
          animation: ap-fade 0.2s ease;
        }
        .ap-drawer-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.4); }
        .ap-drawer-panel {
          position: relative; width: 100%; max-width: 320px; height: 100%;
          background: #fff; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow-y: auto; z-index: 1; animation: ap-slide-in 0.25s ease;
        }
        @keyframes ap-slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .ap-drawer-header {
          position: sticky; top: 0; background: #fff; display: flex;
          align-items: center; justify-content: space-between; padding: 14px 16px;
          border-bottom: 1px solid var(--ap-border); z-index: 2;
        }
        .ap-drawer-header-left { display: flex; align-items: center; gap: 8px; }
        .ap-drawer-header-title { font-size: 16px; font-weight: 800; color: var(--ap-dark); }
        .ap-drawer-close {
          width: 32px; height: 32px; display: flex; align-items: center;
          justify-content: center; border: 1px solid var(--ap-border);
          border-radius: var(--ap-radius); background: #fff; cursor: pointer;
          transition: background 0.12s;
        }
        .ap-drawer-close:active { background: #f5f5f5; }
        .ap-drawer-body { padding: 16px; }

        /* ==================== PRODUCT GRID ==================== */

        .ap-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) { .ap-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .ap-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
        @media (min-width: 1280px) { .ap-grid { grid-template-columns: repeat(4, 1fr); } }

        /* ==================== CARDS ==================== */

        .ap-card {
          border: 1px solid var(--ap-border); border-radius: var(--ap-radius);
          overflow: hidden; background: #fff; transition: all 0.2s ease; cursor: pointer;
        }
        .ap-card:hover {
          border-color: var(--ap-green-accent);
          box-shadow: 0 4px 16px rgba(20, 83, 45, 0.08);
        }

        .ap-card-img {
          position: relative; height: 190px; display: flex; align-items: center;
          justify-content: center; padding: 10px; overflow: hidden;
        }
        @media (min-width: 768px) { .ap-card-img { height: 195px; } }

        .ap-card-img img {
          height: 100%; width: 100%; object-fit: contain; transition: transform 0.3s ease;
        }
        .ap-card:hover .ap-card-img img { transform: scale(1.05); }

        .ap-card-overlay {
          position: absolute; inset: 0; background: rgba(20, 83, 45, 0.45);
          display: none; align-items: center; justify-content: center; gap: 8px; z-index: 2;
        }
        .ap-card:hover .ap-card-overlay { display: flex; }

        .ap-card-action {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 50%; background: #fff;
          border: none; cursor: pointer; transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .ap-card-action:hover {
          transform: scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .ap-card-action:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .ap-card-body { padding: 10px 12px; text-align: center; }

        .ap-card-name {
          font-size: 15px; font-weight: 600; color: var(--ap-dark); line-height: 1.35;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; min-height: 35px;
        }

        .ap-card-price { font-size: 15px; font-weight: 900; color: var(--ap-red); margin-top: 2px; }

        .ap-card-old-price {
          font-size: 12px; font-weight: 400; color: var(--ap-light);
          text-decoration: line-through; margin-top: 2px;
        }

        .ap-card-badge {
          position: absolute; top: 8px; font-size: 9px; font-weight: 700;
          padding: 3px 8px; border-radius: 100px; z-index: 3;
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .ap-card-badge-sold { left: 8px; background: var(--ap-dark); color: #fff; }
        .ap-card-badge-discount {
          right: 8px; background: var(--ap-red); color: #fff;
          font-size: 10px; padding: 3px 7px;
        }

        /* ==================== SKELETON ==================== */

        .ap-skeleton {
          border: 1px solid #eee; border-radius: var(--ap-radius);
          overflow: hidden; background: #fff;
        }
        .ap-skeleton-img {
          height: 150px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: ap-shimmer 1.5s infinite;
        }
        @media (min-width: 768px) { .ap-skeleton-img { height: 195px; } }

        @keyframes ap-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .ap-skeleton-line {
          height: 10px; border-radius: 2px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: ap-shimmer 1.5s infinite;
        }

        /* ==================== EMPTY STATE ==================== */

        .ap-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center; padding: 60px 24px;
          background: #fff; border: 1px solid var(--ap-border);
          border-radius: var(--ap-radius); margin-top: 16px;
        }

        .ap-empty-icon-wrap {
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--ap-bg-subtle); display: flex; align-items: center;
          justify-content: center; margin-bottom: 20px;
          border: 1px solid var(--ap-border);
        }

        .ap-empty-title {
          font-size: 18px; font-weight: 700; color: var(--ap-dark); margin-bottom: 8px;
        }

        .ap-empty-desc {
          font-size: 14px; color: var(--ap-light); max-width: 360px;
          line-height: 1.6; margin-bottom: 24px;
        }

        .ap-empty-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; }

        .ap-empty-reset {
          padding: 10px 20px; background: var(--ap-green); color: #fff;
          border: none; border-radius: var(--ap-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background 0.15s;
          font-family: var(--ap-font);
        }
        .ap-empty-reset:hover { background: var(--ap-green-mid); }

        .ap-empty-browse {
          padding: 10px 20px; background: #fff; color: var(--ap-mid);
          border: 1px solid var(--ap-border); border-radius: var(--ap-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--ap-font); text-decoration: none;
        }
        .ap-empty-browse:hover { border-color: var(--ap-green-accent); color: var(--ap-dark); }

        /* ==================== LAYOUT ==================== */

        .ap-layout { display: flex; flex-direction: column; gap: 0; }
        @media (min-width: 1024px) { .ap-layout { flex-direction: row; gap: 24px; } }

        .ap-sidebar { display: none; width: 280px; flex-shrink: 0; }
        @media (min-width: 1024px) { .ap-sidebar { display: block; } }

        .ap-sidebar-sticky { position: sticky; top: 80px; }
        .ap-main { flex: 1; min-width: 0; }
        .ap-pagination { display: flex; justify-content: center; margin-top: 24px; }
      `}</style>

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="ap-root min-h-screen">
        <Helmet>
          <title>Best Appliances in Ghana | Buy Affordable & Quality Appliances</title>
          <meta
            name="description"
            content="Upgrade your kitchen with quality appliances from Franko Trading. Shop blenders, air fryers, hand mixers, microwaves, rice cookers, and more — all at unbeatable prices with fast delivery across Ghana."
          />
          <meta
            name="keywords"
            content="Buy Blender Ghana, Affordable Appliances, Best Appliances in Ghana, Kitchen Appliances"
          />
          <meta property="og:title" content="Best Appliances in Ghana | Buy Affordable & Quality Appliances" />
          <meta
            property="og:description"
            content="Upgrade your kitchen with quality appliances from Franko Trading. Shop blenders, air fryers, hand mixers, microwaves, rice cookers, and more — all at unbeatable prices with fast delivery across Ghana."
          />
          <meta property="og:type" content="product.group" />
          <meta property="og:url" content="https://www.frankotrading.com/appliances" />
          <meta
            property="og:image"
            content={
              filteredProducts.length > 0
                ? `https://ct002.frankotrading.com:444/Media/Products_Images/${filteredProducts[0].productImage.split("\\").pop()}`
                : "default-image-url"
            }
          />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Best Appliances in Ghana | Buy Affordable & Quality Appliances" />
          <meta
            name="twitter:description"
            content="Find top-quality appliances in Ghana at the best prices. Buy now and enjoy fast delivery!"
          />
          <meta
            name="twitter:image"
            content={
              filteredProducts.length > 0
                ? `https://ct002.frankotrading.com:444/Media/Products_Images/${filteredProducts[0].productImage.split("\\").pop()}`
                : "default-image-url"
            }
          />
          <link rel="canonical" href="https://www.frankotrading.com/appliances" />
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "Appliances",
              "description":
                "Upgrade your kitchen with quality appliances from Franko Trading. Shop blenders, air fryers, hand mixers, microwaves, rice cookers, and more.",
              "url": "https://www.frankotrading.com/appliances",
              "numberOfItems": filteredProducts.length,
              "itemListElement": filteredProducts.map((item, index) => ({
                "@type": "Product",
                "position": index + 1,
                "name": item.productName,
                "image": `https://ct002.frankotrading.com:444/Media/Products_Images/${item.productImage.split("\\").pop()}`,
                "description": item.description,
                "brand": {
                  "@type": "Brand",
                  "name": item.brandName,
                },
                "sku": item.productID,
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
                    "name": "Franko Trading",
                  },
                  "shippingDetails": {
                    "@type": "OfferShippingDetails",
                    "shippingRate": {
                      "@type": "MonetaryAmount",
                      "currency": "GHS",
                      "value": "30.00",
                    },
                    "shippingDestination": {
                      "@type": "DefinedRegion",
                      "addressCountry": "GH",
                    },
                    "deliveryTime": {
                      "@type": "ShippingDeliveryTime",
                      "handlingTime": {
                        "@type": "QuantitativeValue",
                        "minValue": 1,
                        "maxValue": 2,
                        "unitCode": "DAY",
                      },
                      "transitTime": {
                        "@type": "QuantitativeValue",
                        "minValue": 3,
                        "maxValue": 5,
                        "unitCode": "DAY",
                      },
                    },
                  },
                  "hasMerchantReturnPolicy": {
                    "@type": "MerchantReturnPolicy",
                    "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                    "merchantReturnDays": 14,
                    "returnMethod": "https://schema.org/ReturnByMail",
                    "returnFees": "https://schema.org/FreeReturn",
                    "applicableCountry": "GH",
                  },
                },
              })),
            })}
          </script>
        </Helmet>

        <div className="px-4 md:px-16 py-6">
          {/* Page Header */}
          <div className="ap-page-header">
            <div className="ap-page-header-accent" />
            <div>
              <h1 className="ap-page-title">
                {selectedBrand ? `${selectedBrand} Appliances` : "Appliances"}
              </h1>
              <p className="ap-page-count">
                {isInitialLoading
                  ? "Loading products..."
                  : `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <div className="ap-page-header-line" />
          </div>

          {/* Mobile Controls */}
          <div className="ap-mobile-controls">
            <button onClick={() => setIsDrawerOpen(true)} className="ap-filter-trigger">
              <FunnelIcon style={{ width: 16, height: 16 }} />
              <span>Filters</span>
              {isFiltersActive && (
                <span
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", marginLeft: 2 }}
                />
              )}
            </button>
            <div className="ap-sort-trigger" onClick={() => setShowSortDropdown(!showSortDropdown)}>
              <Bars3BottomLeftIcon style={{ width: 16, height: 16 }} />
              <span>Sort</span>
              <ChevronDownIcon
                style={{
                  width: 14,
                  height: 14,
                  transition: "transform 0.2s",
                  transform: showSortDropdown ? "rotate(180deg)" : "none",
                }}
              />
              {showSortDropdown && (
                <div className="ap-sort-drop">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                        setCurrentPage(1);
                      }}
                      className={`ap-sort-option ${sortBy === option.value ? "ap-sort-option-active" : ""}`}
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
            <div className="ap-drawer-overlay">
              <div className="ap-drawer-backdrop" onClick={() => setIsDrawerOpen(false)} />
              <div className="ap-drawer-panel">
                <div className="ap-drawer-header">
                  <div className="ap-drawer-header-left">
                    <AdjustmentsHorizontalIcon
                      style={{ width: 18, height: 18, color: "var(--ap-green)" }}
                    />
                    <span className="ap-drawer-header-title">Filters</span>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} className="ap-drawer-close">
                    <XMarkIcon style={{ width: 14, height: 14, color: "var(--ap-light)" }} />
                  </button>
                </div>
                <div className="ap-drawer-body">{renderFilterContent()}</div>
              </div>
            </div>
          )}

          {/* Layout */}
          <div className="ap-layout">
            <aside className="ap-sidebar">
              <div className="ap-sidebar-sticky">{renderFilterContent()}</div>
            </aside>

            <section className="ap-main">
              {/* Desktop Toolbar */}
              {(hasProducts || isInitialLoading) && (
                <div className="ap-toolbar">
                  <div className="ap-toolbar-left">
                    <span className="ap-toolbar-count">
                      {isInitialLoading ? (
                        "Loading..."
                      ) : (
                        <>
                          Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong>–
                          <strong>{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</strong>{" "}
                          of <strong>{filteredProducts.length}</strong>
                        </>
                      )}
                    </span>
                    {isFiltersActive && <span className="ap-toolbar-badge">Filtered</span>}
                  </div>
                  <div className="ap-toolbar-right">
                    <div className="ap-desktop-sort">
                      <button
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        className="ap-desktop-sort-btn"
                      >
                        <Bars3BottomLeftIcon style={{ width: 14, height: 14 }} />
                        <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                        <ChevronDownIcon
                          style={{
                            width: 12,
                            height: 12,
                            transition: "transform 0.2s",
                            transform: showSortDropdown ? "rotate(180deg)" : "none",
                          }}
                        />
                      </button>
                      {showSortDropdown && (
                        <div className="ap-desktop-sort-drop">
                          {sortOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortBy(option.value);
                                setShowSortDropdown(false);
                                setCurrentPage(1);
                              }}
                              className={`ap-sort-option ${
                                sortBy === option.value ? "ap-sort-option-active" : ""
                              }`}
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
                <div className="ap-grid">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Products */}
              {!isInitialLoading && hasProducts && (
                <>
                  <div className="ap-grid">
                    {currentProducts.map((product) => {
                      const { productID, productName, productImage, price, oldPrice, stock } = product;
                      const isOnSale = oldPrice > 0 && oldPrice > price;
                      const discountPercent = isOnSale
                        ? Math.round(((oldPrice - price) / oldPrice) * 100)
                        : 0;
                      const soldOut = stock === 0;
                      const inWishlist = isInWishlist(productID);

                      return (
                        <div key={productID} className="ap-card">
                          <div className="ap-card-img">
                            {soldOut && (
                              <span className="ap-card-badge ap-card-badge-sold">Sold Out</span>
                            )}
                            {isOnSale && !soldOut && (
                              <span className="ap-card-badge ap-card-badge-discount">
                                -{discountPercent}%
                              </span>
                            )}

                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onClick={() => navigate(`/product/${productID}`)}
                            >
                              <img
                                src={getValidImageUrl(productImage)}
                                alt={productName}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://via.placeholder.com/150";
                                }}
                              />
                            </div>

                            <div
                              className="ap-card-overlay"
                              onClick={() => navigate(`/product/${productID}`)}
                            >
                              <Tooltip
                                content={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                              >
                                <button
                                  className="ap-card-action"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWishlistToggle(product);
                                  }}
                                >
                                  {inWishlist ? (
                                    <SolidHeartIcon
                                      style={{ width: 16, height: 16, color: "var(--ap-pink)" }}
                                    />
                                  ) : (
                                    <OutlineHeartIcon
                                      style={{ width: 16, height: 16, color: "var(--ap-mid)" }}
                                    />
                                  )}
                                </button>
                              </Tooltip>
                              <Tooltip content="View Details">
                                <button
                                  className="ap-card-action"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/product/${productID}`);
                                  }}
                                >
                                  <EyeIcon
                                    style={{ width: 16, height: 16, color: "var(--ap-green)" }}
                                  />
                                </button>
                              </Tooltip>
                              <Tooltip content={soldOut ? "Out of Stock" : "Add to Cart"}>
                                <button
                                  className="ap-card-action"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(product);
                                  }}
                                  disabled={cartLoading || soldOut}
                                >
                                  <ShoppingCartIcon
                                    style={{ width: 16, height: 16, color: "var(--ap-green-mid)" }}
                                  />
                                </button>
                              </Tooltip>
                            </div>
                          </div>

                          <div className="ap-card-body">
                            <div className="ap-card-name">{productName}</div>
                            <div className="ap-card-price">{formatPrice(price)}</div>
                            {oldPrice > 0 && (
                              <div className="ap-card-old-price">{formatPrice(oldPrice)}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="ap-pagination">
                      <CircularPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {trulyEmpty && (
                <div className="ap-empty">
                  <div className="ap-empty-icon-wrap">
                    <MagnifyingGlassIcon
                      style={{ width: 32, height: 32, color: "var(--ap-light)" }}
                    />
                  </div>
                  <div className="ap-empty-title">
                    {isFiltersActive ? "No matching appliances" : "No appliances available"}
                  </div>
                  <div className="ap-empty-desc">
                    {isFiltersActive
                      ? "Try adjusting your price range, brand, or filters to find what you're looking for."
                      : "We don't have any appliances available at the moment. Please check back later or explore other categories."}
                  </div>
                  <div className="ap-empty-actions">
                    {isFiltersActive && (
                      <button onClick={resetFilters} className="ap-empty-reset">
                        Clear Filters
                      </button>
                    )}
                    <button onClick={() => navigate("/")} className="ap-empty-browse">
                      Browse All Products
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {showSortDropdown && (
          <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
        )}
      </div>
    </>
  );
};

export default Appliances;