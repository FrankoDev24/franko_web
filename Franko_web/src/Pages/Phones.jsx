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

const categoryId = "51d1fff2-7b71-46aa-9b34-2e553a40e921";

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

  const bgClass = type === "success" ? "ph-notif-success" : "ph-notif-error";
  const Icon = type === "success" ? CheckCircleIcon : XCircleIcon;

  return (
    <div className="fixed top-4 right-4 z-50 ph-animate-slide-in">
      <div className={`ph-notif ${bgClass}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="ph-notif-text">{message}</span>
        <button onClick={onClose} className="ph-notif-close">×</button>
      </div>
    </div>
  );
};

// ==================== SKELETON ====================

const SkeletonCard = () => (
  <div className="ph-skeleton">
    <div className="ph-skeleton-img" />
    <div style={{ padding: "10px 12px" }}>
      <div className="ph-skeleton-line" style={{ width: "80%", marginBottom: 8, marginLeft: "auto", marginRight: "auto" }} />
      <div className="ph-skeleton-line" style={{ width: "50%", height: 8, marginLeft: "auto", marginRight: "auto" }} />
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

const Phones = () => {
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
    <div className="ph-filter-content">
      <div className="hidden ph-filter-header ph-desktop-only">
        <AdjustmentsHorizontalIcon style={{ width: 18, height: 18, color: "var(--ph-green)" }} />
        <span className="ph-filter-header-text">Filters</span>
      </div>

      {/* Price Range */}
      <div className="ph-filter-section">
        <div className="ph-filter-section-title">
          <div className="ph-dot" style={{ background: "var(--ph-green-accent)" }} />
          <span>Price Range</span>
        </div>
        <div className="ph-price-inputs">
          <div className="ph-price-field">
            <label className="ph-price-label">Min</label>
            <div className="ph-price-input-wrap">
              <span className="ph-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.min}
                onChange={(e) => setInputPriceRange((prev) => ({ ...prev, min: +e.target.value }))}
                className="ph-price-input"
                placeholder="0"
              />
            </div>
          </div>
          <div className="ph-price-field">
            <label className="ph-price-label">Max</label>
            <div className="ph-price-input-wrap">
              <span className="ph-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.max}
                onChange={(e) => setInputPriceRange((prev) => ({ ...prev, max: +e.target.value }))}
                className="ph-price-input"
                placeholder="200000"
              />
            </div>
          </div>
        </div>
        <button onClick={applyPriceFilter} className="ph-apply-btn">
          Apply Price Filter
        </button>
        <div className="ph-applied-range">
          <span className="ph-applied-label">Active:</span>
          <span className="ph-applied-value">
            ₵{appliedPriceRange[0].toLocaleString()} – ₵{appliedPriceRange[1].toLocaleString()}
          </span>
        </div>
      </div>

      {/* Discount Toggle */}
      <div className="ph-filter-section ph-discount-section">
        <div className="ph-discount-row">
          <div className="ph-discount-info">
            <div className="ph-discount-icon">
              <TagIcon style={{ width: 14, height: 14, color: "#fff" }} />
            </div>
            <span className="ph-discount-label">Discounted Only</span>
          </div>
          <div
            onClick={() => setShowDiscountedOnly(!showDiscountedOnly)}
            className={`ph-toggle ${showDiscountedOnly ? "ph-toggle-on" : ""}`}
          >
            <div className="ph-toggle-knob" />
          </div>
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div className="ph-filter-section">
          <div className="ph-filter-section-title">
            <div className="ph-dot" style={{ background: "var(--ph-green)" }} />
            <span>Brands</span>
          </div>
          <div className="ph-brand-tags">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => {
                  setSelectedBrand(selectedBrand === brand ? null : brand);
                  setCurrentPage(1);
                }}
                className={`ph-brand-tag ${selectedBrand === brand ? "ph-brand-tag-active" : ""}`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {isFiltersActive && (
        <button onClick={resetFilters} className="ph-reset-btn">
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
          --ph-font: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          --ph-green: #14532d;
          --ph-green-mid: #166534;
          --ph-green-light: #dcfce7;
          --ph-green-lighter: #f0fdf4;
          --ph-green-accent: #22c55e;
          --ph-dark: #1a1a1a;
          --ph-mid: #555;
          --ph-light: #888;
          --ph-border: #e0e0e0;
          --ph-bg-subtle: #f7f7f7;
          --ph-red: #dc2626;
          --ph-pink: #e11d48;
          --ph-radius: 4px;
        }

        .ph-root, .ph-root * {
          font-family: var(--ph-font);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          box-sizing: border-box;
        }

        .ph-desktop-only { display: none; }
        @media (min-width: 1024px) { .ph-desktop-only { display: flex; } }

        /* ==================== NOTIFICATION ==================== */

        .ph-notif {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: var(--ph-radius);
          min-width: 280px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .ph-notif-success { background: var(--ph-green); color: #fff; }
        .ph-notif-error { background: var(--ph-red); color: #fff; }

        .ph-notif-text { font-size: 14px; font-weight: 500; flex: 1; }

        .ph-notif-close {
          background: transparent; border: none; color: rgba(255,255,255,0.8);
          font-size: 18px; cursor: pointer; padding: 0; line-height: 1;
        }
        .ph-notif-close:hover { color: #fff; }

        @keyframes ph-slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .ph-animate-slide-in { animation: ph-slide-in-right 0.3s ease-out; }

        /* ==================== PAGE HEADER ==================== */

        .ph-page-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--ph-border);
        }

        .ph-page-header-accent {
          width: 4px; height: 28px; border-radius: 2px;
          background: var(--ph-green); flex-shrink: 0;
        }

        .ph-page-title {
          font-size: 20px; font-weight: 800; color: var(--ph-dark);
          letter-spacing: -0.02em; line-height: 1.2; margin: 0;
        }
        @media (min-width: 768px) { .ph-page-title { font-size: 24px; } }

        .ph-page-count {
          font-size: 13px; font-weight: 500; color: var(--ph-light); margin-top: 2px;
        }

        .ph-page-header-line {
          flex: 1; height: 1px; background: var(--ph-border); display: none;
        }
        @media (min-width: 768px) { .ph-page-header-line { display: block; } }

        /* ==================== MOBILE CONTROLS ==================== */

        .ph-mobile-controls { display: flex; gap: 8px; margin-bottom: 16px; }
        @media (min-width: 1024px) { .ph-mobile-controls { display: none; } }

        .ph-filter-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: var(--ph-green); color: #fff;
          border: none; border-radius: var(--ph-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--ph-font);
        }
        .ph-filter-trigger:active { transform: scale(0.98); }

        .ph-sort-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: #fff; color: var(--ph-mid);
          border: 1px solid var(--ph-border); border-radius: var(--ph-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--ph-font); position: relative;
        }
        .ph-sort-trigger:active { transform: scale(0.98); }

        /* ==================== SORT DROPDOWN ==================== */

        .ph-sort-drop {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: #fff; border: 1px solid var(--ph-border);
          border-radius: var(--ph-radius); box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          z-index: 50; overflow: hidden; animation: ph-fade 0.15s ease;
        }

        @keyframes ph-fade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ph-sort-option {
          display: block; width: 100%; text-align: left; padding: 10px 14px;
          font-size: 13px; font-weight: 500; color: var(--ph-mid);
          background: none; border: none; cursor: pointer; transition: all 0.1s;
          font-family: var(--ph-font); border-bottom: 1px solid #f5f5f5;
        }
        .ph-sort-option:last-child { border-bottom: none; }
        .ph-sort-option:hover { background: var(--ph-bg-subtle); }
        .ph-sort-option-active {
          background: var(--ph-green-light) !important;
          color: var(--ph-green) !important; font-weight: 600 !important;
        }

        /* ==================== DESKTOP TOOLBAR ==================== */

        .ph-toolbar {
          display: none; align-items: center; justify-content: space-between;
          padding: 12px 16px; background: #fff; border: 1px solid var(--ph-border);
          border-radius: var(--ph-radius); margin-bottom: 16px;
        }
        @media (min-width: 768px) { .ph-toolbar { display: flex; } }

        .ph-toolbar-left { display: flex; align-items: center; gap: 12px; }

        .ph-toolbar-count { font-size: 13px; font-weight: 500; color: var(--ph-light); }
        .ph-toolbar-count strong { color: var(--ph-dark); font-weight: 700; }

        .ph-toolbar-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: var(--ph-green-light); color: var(--ph-green);
          font-size: 11px; font-weight: 700; padding: 3px 10px;
          border-radius: 100px; text-transform: uppercase; letter-spacing: 0.03em;
        }

        .ph-toolbar-right { display: flex; align-items: center; gap: 8px; }

        .ph-desktop-sort { position: relative; }

        .ph-desktop-sort-btn {
          display: flex; align-items: center; gap: 6px; padding: 7px 14px;
          background: #fff; border: 1px solid var(--ph-border);
          border-radius: var(--ph-radius); font-size: 13px; font-weight: 500;
          color: var(--ph-mid); cursor: pointer; transition: all 0.15s;
          font-family: var(--ph-font);
        }
        .ph-desktop-sort-btn:hover {
          border-color: var(--ph-green-accent); color: var(--ph-dark);
        }

        .ph-desktop-sort-drop {
          position: absolute; top: calc(100% + 4px); right: 0; width: 200px;
          background: #fff; border: 1px solid var(--ph-border);
          border-radius: var(--ph-radius); box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          z-index: 50; overflow: hidden; animation: ph-fade 0.15s ease;
        }

        /* ==================== FILTER SIDEBAR ==================== */

        .ph-filter-content { display: flex; flex-direction: column; gap: 16px; }

        .ph-filter-header {
          display: flex; align-items: center; gap: 8px;
          padding-bottom: 12px; border-bottom: 1px solid var(--ph-border);
        }
        .ph-filter-header-text {
          font-size: 16px; font-weight: 800; color: var(--ph-dark); letter-spacing: -0.01em;
        }

        .ph-filter-section {
          padding: 16px; background: #fff; border: 1px solid var(--ph-border);
          border-radius: var(--ph-radius);
        }
        .ph-filter-section-title {
          display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
          font-size: 14px; font-weight: 700; color: var(--ph-dark);
        }
        .ph-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .ph-price-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .ph-price-field { display: flex; flex-direction: column; gap: 4px; }
        .ph-price-label {
          font-size: 11px; font-weight: 600; color: var(--ph-light);
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .ph-price-input-wrap { position: relative; display: flex; align-items: center; }
        .ph-price-symbol {
          position: absolute; left: 10px; font-size: 13px; font-weight: 600; color: var(--ph-light);
        }
        .ph-price-input {
          width: 100%; padding: 8px 10px 8px 24px; border: 1px solid var(--ph-border);
          border-radius: var(--ph-radius); font-size: 13px; font-weight: 500;
          color: var(--ph-dark); font-family: var(--ph-font);
          transition: border-color 0.15s; outline: none;
        }
        .ph-price-input:focus {
          border-color: var(--ph-green-accent);
          box-shadow: 0 0 0 2px rgba(34,197,94,0.1);
        }

        .ph-apply-btn {
          width: 100%; padding: 9px; background: var(--ph-green); color: #fff;
          border: none; border-radius: var(--ph-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background 0.15s;
          font-family: var(--ph-font); margin-bottom: 10px;
        }
        .ph-apply-btn:hover { background: var(--ph-green-mid); }
        .ph-apply-btn:active { transform: scale(0.98); }

        .ph-applied-range {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 10px; background: var(--ph-green-lighter);
          border: 1px solid #bbf7d0; border-radius: var(--ph-radius);
        }
        .ph-applied-label { font-size: 11px; font-weight: 600; color: var(--ph-green-mid); }
        .ph-applied-value { font-size: 12px; font-weight: 700; color: var(--ph-green); }

        .ph-discount-section { background: var(--ph-green-lighter); border-color: #bbf7d0; }
        .ph-discount-row { display: flex; align-items: center; justify-content: space-between; }
        .ph-discount-info { display: flex; align-items: center; gap: 10px; }
        .ph-discount-icon {
          width: 28px; height: 28px; border-radius: var(--ph-radius);
          background: var(--ph-green); display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .ph-discount-label { font-size: 13px; font-weight: 600; color: var(--ph-dark); }

        .ph-toggle {
          width: 40px; height: 22px; border-radius: 11px; background: #d1d5db;
          cursor: pointer; transition: background 0.2s; padding: 2px; flex-shrink: 0;
        }
        .ph-toggle-on { background: var(--ph-green) !important; }
        .ph-toggle-knob {
          width: 18px; height: 18px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15); transition: transform 0.2s;
        }
        .ph-toggle-on .ph-toggle-knob { transform: translateX(18px); }

        .ph-brand-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .ph-brand-tag {
          padding: 5px 12px; font-size: 12px; font-weight: 500; color: var(--ph-mid);
          background: var(--ph-bg-subtle); border: 1px solid var(--ph-border);
          border-radius: 100px; cursor: pointer; transition: all 0.15s;
          font-family: var(--ph-font); white-space: nowrap;
        }
        .ph-brand-tag:hover {
          border-color: var(--ph-green-accent); color: var(--ph-green);
          background: var(--ph-green-light);
        }
        .ph-brand-tag-active {
          background: var(--ph-green) !important; color: #fff !important;
          border-color: var(--ph-green) !important; font-weight: 600 !important;
        }

        .ph-reset-btn {
          width: 100%; padding: 9px; background: #fff; color: var(--ph-red);
          border: 1px solid #fecaca; border-radius: var(--ph-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--ph-font);
        }
        .ph-reset-btn:hover { background: #fef2f2; border-color: var(--ph-red); }
        .ph-reset-btn:active { transform: scale(0.98); }

        /* ==================== DRAWER ==================== */

        .ph-drawer-overlay {
          position: fixed; inset: 0; z-index: 100; display: flex;
          animation: ph-fade 0.2s ease;
        }
        .ph-drawer-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.4); }
        .ph-drawer-panel {
          position: relative; width: 100%; max-width: 320px; height: 100%;
          background: #fff; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow-y: auto; z-index: 1; animation: ph-slide-in 0.25s ease;
        }
        @keyframes ph-slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .ph-drawer-header {
          position: sticky; top: 0; background: #fff; display: flex;
          align-items: center; justify-content: space-between; padding: 14px 16px;
          border-bottom: 1px solid var(--ph-border); z-index: 2;
        }
        .ph-drawer-header-left { display: flex; align-items: center; gap: 8px; }
        .ph-drawer-header-title { font-size: 16px; font-weight: 800; color: var(--ph-dark); }
        .ph-drawer-close {
          width: 32px; height: 32px; display: flex; align-items: center;
          justify-content: center; border: 1px solid var(--ph-border);
          border-radius: var(--ph-radius); background: #fff; cursor: pointer;
          transition: background 0.12s;
        }
        .ph-drawer-close:active { background: #f5f5f5; }
        .ph-drawer-body { padding: 16px; }

        /* ==================== PRODUCT GRID ==================== */

        .ph-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) { .ph-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .ph-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
        @media (min-width: 1280px) { .ph-grid { grid-template-columns: repeat(4, 1fr); } }

        /* ==================== CARDS ==================== */

        .ph-card {
          border: 1px solid var(--ph-border); border-radius: var(--ph-radius);
          overflow: hidden; background: #fff; transition: all 0.2s ease; cursor: pointer;
        }
        .ph-card:hover {
          border-color: var(--ph-green-accent);
          box-shadow: 0 4px 16px rgba(20, 83, 45, 0.08);
        }

        .ph-card-img {
          position: relative; height: 190px; display: flex; align-items: center;
          justify-content: center; padding: 10px; overflow: hidden;
        }
        @media (min-width: 768px) { .ph-card-img { height: 195px; } }

        .ph-card-img img {
          height: 100%; width: 100%; object-fit: contain; transition: transform 0.3s ease;
        }
        .ph-card:hover .ph-card-img img { transform: scale(1.05); }

        .ph-card-overlay {
          position: absolute; inset: 0; background: rgba(20, 83, 45, 0.45);
          display: none; align-items: center; justify-content: center; gap: 8px; z-index: 2;
        }
        .ph-card:hover .ph-card-overlay { display: flex; }

        .ph-card-action {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 50%; background: #fff;
          border: none; cursor: pointer; transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .ph-card-action:hover {
          transform: scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .ph-card-action:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .ph-card-body { padding: 10px 12px; text-align: center; }

        .ph-card-name {
          font-size: 15px; font-weight: 600; color: var(--ph-dark); line-height: 1.35;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; min-height: 35px;
        }

        .ph-card-price { font-size: 15px; font-weight: 900; color: var(--ph-red); margin-top: 2px; }

        .ph-card-old-price {
          font-size: 12px; font-weight: 400; color: var(--ph-light);
          text-decoration: line-through; margin-top: 2px;
        }

        .ph-card-badge {
          position: absolute; top: 8px; font-size: 9px; font-weight: 700;
          padding: 3px 8px; border-radius: 100px; z-index: 3;
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .ph-card-badge-sold { left: 8px; background: var(--ph-dark); color: #fff; }
        .ph-card-badge-discount {
          right: 8px; background: var(--ph-red); color: #fff;
          font-size: 10px; padding: 3px 7px;
        }

        /* ==================== SKELETON ==================== */

        .ph-skeleton {
          border: 1px solid #eee; border-radius: var(--ph-radius);
          overflow: hidden; background: #fff;
        }
        .ph-skeleton-img {
          height: 150px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: ph-shimmer 1.5s infinite;
        }
        @media (min-width: 768px) { .ph-skeleton-img { height: 195px; } }

        @keyframes ph-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .ph-skeleton-line {
          height: 10px; border-radius: 2px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: ph-shimmer 1.5s infinite;
        }

        /* ==================== EMPTY STATE ==================== */

        .ph-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center; padding: 60px 24px;
          background: #fff; border: 1px solid var(--ph-border);
          border-radius: var(--ph-radius); margin-top: 16px;
        }

        .ph-empty-icon-wrap {
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--ph-bg-subtle); display: flex; align-items: center;
          justify-content: center; margin-bottom: 20px;
          border: 1px solid var(--ph-border);
        }

        .ph-empty-title {
          font-size: 18px; font-weight: 700; color: var(--ph-dark); margin-bottom: 8px;
        }

        .ph-empty-desc {
          font-size: 14px; color: var(--ph-light); max-width: 360px;
          line-height: 1.6; margin-bottom: 24px;
        }

        .ph-empty-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; }

        .ph-empty-reset {
          padding: 10px 20px; background: var(--ph-green); color: #fff;
          border: none; border-radius: var(--ph-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background 0.15s;
          font-family: var(--ph-font);
        }
        .ph-empty-reset:hover { background: var(--ph-green-mid); }

        .ph-empty-browse {
          padding: 10px 20px; background: #fff; color: var(--ph-mid);
          border: 1px solid var(--ph-border); border-radius: var(--ph-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--ph-font); text-decoration: none;
        }
        .ph-empty-browse:hover { border-color: var(--ph-green-accent); color: var(--ph-dark); }

        /* ==================== LAYOUT ==================== */

        .ph-layout { display: flex; flex-direction: column; gap: 0; }
        @media (min-width: 1024px) { .ph-layout { flex-direction: row; gap: 24px; } }

        .ph-sidebar { display: none; width: 280px; flex-shrink: 0; }
        @media (min-width: 1024px) { .ph-sidebar { display: block; } }

        .ph-sidebar-sticky { position: sticky; top: 80px; }
        .ph-main { flex: 1; min-width: 0; }
        .ph-pagination { display: flex; justify-content: center; margin-top: 24px; }
      `}</style>

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="ph-root min-h-screen">
        <Helmet>
          <title>Smartphones in Ghana | Latest Phones & Great Prices – Franko Trading</title>
          <meta name="description" content="Explore the newest smartphones in Ghana at Franko Trading. From budget to flagship devices, find phones from Samsung, Apple, Infinix, and Tecno — fast shipping and secure checkout." />
          <meta name="keywords" content="mobile phones, smartphones, best phone deals, buy smartphones, latest phones" />
          <meta property="og:title" content="Smartphones in Ghana | Latest Phones & Great Prices – Franko Trading" />
          <meta property="og:description" content="Explore the newest smartphones in Ghana at Franko Trading. From budget to flagship devices, find phones from Samsung, Apple, Infinix, and Tecno — fast shipping and secure checkout." />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={window.location.href} />
          <meta property="og:image" content={filteredProducts.length > 0 ? `https://ct002.frankotrading.com:444/Media/Products_Images/${filteredProducts[0].productImage.split("\\").pop()}` : "default-image-url"} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Smartphones in Ghana | Latest Phones & Great Prices – Franko Trading" />
          <meta name="twitter:description" content="Explore the newest smartphones in Ghana at Franko Trading. From budget to flagship devices, find phones from Samsung, Apple, Infinix, and Tecno — fast shipping and secure checkout." />
          <meta name="twitter:image" content={filteredProducts.length > 0 ? `https://ct002.frankotrading.com:444/Media/Products_Images/${filteredProducts[0].productImage.split("\\").pop()}` : "default-image-url"} />
          <link rel="canonical" href="https://www.frankotrading.com/phones" />
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "Smart Phones",
              "description": "Explore a variety of mobile phones at the best prices. Find your perfect smartphone today!",
              "url": "https://www.frankotrading.com/phones",
              "itemListElement": filteredProducts.map((item, index) => ({
                "@type": "Product",
                "position": index + 1,
                "name": item.productName,
                "description": item.productDescription,
                "sku": item.productID,
                "image": `https://ct002.frankotrading.com:444/Media/Products_Images/${item.productImage.split("\\").pop()}`,
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
          <div className="ph-page-header">
            <div className="ph-page-header-accent" />
            <div>
              <h1 className="ph-page-title">
                {selectedBrand ? `${selectedBrand} Phones` : "Mobile Phones"}
              </h1>
              <p className="ph-page-count">
                {isInitialLoading
                  ? "Loading products..."
                  : `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <div className="ph-page-header-line" />
          </div>

          {/* Mobile Controls */}
          <div className="ph-mobile-controls">
            <button onClick={() => setIsDrawerOpen(true)} className="ph-filter-trigger">
              <FunnelIcon style={{ width: 16, height: 16 }} />
              <span>Filters</span>
              {isFiltersActive && (
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", marginLeft: 2 }} />
              )}
            </button>
            <div className="ph-sort-trigger" onClick={() => setShowSortDropdown(!showSortDropdown)}>
              <Bars3BottomLeftIcon style={{ width: 16, height: 16 }} />
              <span>Sort</span>
              <ChevronDownIcon
                style={{ width: 14, height: 14, transition: "transform 0.2s", transform: showSortDropdown ? "rotate(180deg)" : "none" }}
              />
              {showSortDropdown && (
                <div className="ph-sort-drop">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                        setCurrentPage(1);
                      }}
                      className={`ph-sort-option ${sortBy === option.value ? "ph-sort-option-active" : ""}`}
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
            <div className="ph-drawer-overlay">
              <div className="ph-drawer-backdrop" onClick={() => setIsDrawerOpen(false)} />
              <div className="ph-drawer-panel">
                <div className="ph-drawer-header">
                  <div className="ph-drawer-header-left">
                    <AdjustmentsHorizontalIcon style={{ width: 18, height: 18, color: "var(--ph-green)" }} />
                    <span className="ph-drawer-header-title">Filters</span>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} className="ph-drawer-close">
                    <XMarkIcon style={{ width: 14, height: 14, color: "var(--ph-light)" }} />
                  </button>
                </div>
                <div className="ph-drawer-body">{renderFilterContent()}</div>
              </div>
            </div>
          )}

          {/* Layout */}
          <div className="ph-layout">
            <aside className="ph-sidebar">
              <div className="ph-sidebar-sticky">{renderFilterContent()}</div>
            </aside>

            <section className="ph-main">
              {/* Desktop Toolbar */}
              {(hasProducts || isInitialLoading) && (
                <div className="ph-toolbar">
                  <div className="ph-toolbar-left">
                    <span className="ph-toolbar-count">
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
                    {isFiltersActive && <span className="ph-toolbar-badge">Filtered</span>}
                  </div>
                  <div className="ph-toolbar-right">
                    <div className="ph-desktop-sort">
                      <button onClick={() => setShowSortDropdown(!showSortDropdown)} className="ph-desktop-sort-btn">
                        <Bars3BottomLeftIcon style={{ width: 14, height: 14 }} />
                        <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                        <ChevronDownIcon
                          style={{ width: 12, height: 12, transition: "transform 0.2s", transform: showSortDropdown ? "rotate(180deg)" : "none" }}
                        />
                      </button>
                      {showSortDropdown && (
                        <div className="ph-desktop-sort-drop">
                          {sortOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortBy(option.value);
                                setShowSortDropdown(false);
                                setCurrentPage(1);
                              }}
                              className={`ph-sort-option ${sortBy === option.value ? "ph-sort-option-active" : ""}`}
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
                <div className="ph-grid">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Products */}
              {!isInitialLoading && hasProducts && (
                <>
                  <div className="ph-grid">
                    {currentProducts.map((product) => {
                      const { productID, productName, productImage, price, oldPrice, stock } = product;
                      const isOnSale = oldPrice > 0 && oldPrice > price;
                      const discountPercent = isOnSale ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
                      const soldOut = stock === 0;
                      const inWishlist = isInWishlist(productID);

                      return (
                        <div key={productID} className="ph-card">
                          <div className="ph-card-img">
                            {soldOut && <span className="ph-card-badge ph-card-badge-sold">Sold Out</span>}
                            {isOnSale && !soldOut && (
                              <span className="ph-card-badge ph-card-badge-discount">-{discountPercent}%</span>
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

                            <div className="ph-card-overlay" onClick={() => navigate(`/product/${productID}`)}>
                              <Tooltip content={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}>
                                <button
                                  className="ph-card-action"
                                  onClick={(e) => { e.stopPropagation(); handleWishlistToggle(product); }}
                                >
                                  {inWishlist ? (
                                    <SolidHeartIcon style={{ width: 16, height: 16, color: "var(--ph-pink)" }} />
                                  ) : (
                                    <OutlineHeartIcon style={{ width: 16, height: 16, color: "var(--ph-mid)" }} />
                                  )}
                                </button>
                              </Tooltip>
                              <Tooltip content="View Details">
                                <button
                                  className="ph-card-action"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/product/${productID}`); }}
                                >
                                  <EyeIcon style={{ width: 16, height: 16, color: "var(--ph-green)" }} />
                                </button>
                              </Tooltip>
                              <Tooltip content={soldOut ? "Out of Stock" : "Add to Cart"}>
                                <button
                                  className="ph-card-action"
                                  onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                                  disabled={cartLoading || soldOut}
                                >
                                  <ShoppingCartIcon style={{ width: 16, height: 16, color: "var(--ph-green-mid)" }} />
                                </button>
                              </Tooltip>
                            </div>
                          </div>

                          <div className="ph-card-body">
                            <div className="ph-card-name">{productName}</div>
                            <div className="ph-card-price">{formatPrice(price)}</div>
                            {oldPrice > 0 && <div className="ph-card-old-price">{formatPrice(oldPrice)}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="ph-pagination">
                      <CircularPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {trulyEmpty && (
                <div className="ph-empty">
                  <div className="ph-empty-icon-wrap">
                    <MagnifyingGlassIcon style={{ width: 32, height: 32, color: "var(--ph-light)" }} />
                  </div>
                  <div className="ph-empty-title">
                    {isFiltersActive ? "No matching phones" : "No phones available"}
                  </div>
                  <div className="ph-empty-desc">
                    {isFiltersActive
                      ? "Try adjusting your price range, brand, or filters to find what you're looking for."
                      : "We don't have any phones available at the moment. Please check back later or explore other categories."}
                  </div>
                  <div className="ph-empty-actions">
                    {isFiltersActive && (
                      <button onClick={resetFilters} className="ph-empty-reset">
                        Clear Filters
                      </button>
                    )}
                    <button onClick={() => navigate("/")} className="ph-empty-browse">
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

export default Phones;