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

const categoryId = "4f5076f8-34b6-42b8-a9c5-a1e92e3d08fb";

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

  const bgClass = type === "success" ? "fr-notif-success" : "fr-notif-error";
  const Icon = type === "success" ? CheckCircleIcon : XCircleIcon;

  return (
    <div className="fixed top-4 right-4 z-50 fr-animate-slide-in">
      <div className={`fr-notif ${bgClass}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="fr-notif-text">{message}</span>
        <button onClick={onClose} className="fr-notif-close">×</button>
      </div>
    </div>
  );
};

// ==================== SKELETON ====================

const SkeletonCard = () => (
  <div className="fr-skeleton">
    <div className="fr-skeleton-img" />
    <div style={{ padding: "10px 12px" }}>
      <div className="fr-skeleton-line" style={{ width: "80%", marginBottom: 8, marginLeft: "auto", marginRight: "auto" }} />
      <div className="fr-skeleton-line" style={{ width: "50%", height: 8, marginLeft: "auto", marginRight: "auto" }} />
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

const Fridge = () => {
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
    <div className="fr-filter-content">
      <div className="hidden fr-filter-header fr-desktop-only">
        <AdjustmentsHorizontalIcon style={{ width: 18, height: 18, color: "var(--fr-green)" }} />
        <span className="fr-filter-header-text">Filters</span>
      </div>

      {/* Price Range */}
      <div className="fr-filter-section">
        <div className="fr-filter-section-title">
          <div className="fr-dot" style={{ background: "var(--fr-green-accent)" }} />
          <span>Price Range</span>
        </div>
        <div className="fr-price-inputs">
          <div className="fr-price-field">
            <label className="fr-price-label">Min</label>
            <div className="fr-price-input-wrap">
              <span className="fr-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.min}
                onChange={(e) => setInputPriceRange((prev) => ({ ...prev, min: +e.target.value }))}
                className="fr-price-input"
                placeholder="0"
              />
            </div>
          </div>
          <div className="fr-price-field">
            <label className="fr-price-label">Max</label>
            <div className="fr-price-input-wrap">
              <span className="fr-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.max}
                onChange={(e) => setInputPriceRange((prev) => ({ ...prev, max: +e.target.value }))}
                className="fr-price-input"
                placeholder="200000"
              />
            </div>
          </div>
        </div>
        <button onClick={applyPriceFilter} className="fr-apply-btn">
          Apply Price Filter
        </button>
        <div className="fr-applied-range">
          <span className="fr-applied-label">Active:</span>
          <span className="fr-applied-value">
            ₵{appliedPriceRange[0].toLocaleString()} – ₵{appliedPriceRange[1].toLocaleString()}
          </span>
        </div>
      </div>

      {/* Discount Toggle */}
      <div className="fr-filter-section fr-discount-section">
        <div className="fr-discount-row">
          <div className="fr-discount-info">
            <div className="fr-discount-icon">
              <TagIcon style={{ width: 14, height: 14, color: "#fff" }} />
            </div>
            <span className="fr-discount-label">Discounted Only</span>
          </div>
          <div
            onClick={() => setShowDiscountedOnly(!showDiscountedOnly)}
            className={`fr-toggle ${showDiscountedOnly ? "fr-toggle-on" : ""}`}
          >
            <div className="fr-toggle-knob" />
          </div>
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div className="fr-filter-section">
          <div className="fr-filter-section-title">
            <div className="fr-dot" style={{ background: "var(--fr-green)" }} />
            <span>Brands</span>
          </div>
          <div className="fr-brand-tags">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => {
                  setSelectedBrand(selectedBrand === brand ? null : brand);
                  setCurrentPage(1);
                }}
                className={`fr-brand-tag ${selectedBrand === brand ? "fr-brand-tag-active" : ""}`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {isFiltersActive && (
        <button onClick={resetFilters} className="fr-reset-btn">
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
          --fr-font: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          --fr-green: #14532d;
          --fr-green-mid: #166534;
          --fr-green-light: #dcfce7;
          --fr-green-lighter: #f0fdf4;
          --fr-green-accent: #22c55e;
          --fr-dark: #1a1a1a;
          --fr-mid: #555;
          --fr-light: #888;
          --fr-border: #e0e0e0;
          --fr-bg-subtle: #f7f7f7;
          --fr-red: #dc2626;
          --fr-pink: #e11d48;
          --fr-radius: 4px;
        }

        .fr-root, .fr-root * {
          font-family: var(--fr-font);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          box-sizing: border-box;
        }

        .fr-desktop-only { display: none; }
        @media (min-width: 1024px) { .fr-desktop-only { display: flex; } }

        /* ==================== NOTIFICATION ==================== */

        .fr-notif {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: var(--fr-radius);
          min-width: 280px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .fr-notif-success { background: var(--fr-green); color: #fff; }
        .fr-notif-error { background: var(--fr-red); color: #fff; }

        .fr-notif-text { font-size: 14px; font-weight: 500; flex: 1; }

        .fr-notif-close {
          background: transparent; border: none; color: rgba(255,255,255,0.8);
          font-size: 18px; cursor: pointer; padding: 0; line-height: 1;
        }
        .fr-notif-close:hover { color: #fff; }

        @keyframes fr-slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .fr-animate-slide-in { animation: fr-slide-in-right 0.3s ease-out; }

        /* ==================== PAGE HEADER ==================== */

        .fr-page-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--fr-border);
        }

        .fr-page-header-accent {
          width: 4px; height: 28px; border-radius: 2px;
          background: var(--fr-green); flex-shrink: 0;
        }

        .fr-page-title {
          font-size: 20px; font-weight: 800; color: var(--fr-dark);
          letter-spacing: -0.02em; line-height: 1.2; margin: 0;
        }
        @media (min-width: 768px) { .fr-page-title { font-size: 24px; } }

        .fr-page-count {
          font-size: 13px; font-weight: 500; color: var(--fr-light); margin-top: 2px;
        }

        .fr-page-header-line {
          flex: 1; height: 1px; background: var(--fr-border); display: none;
        }
        @media (min-width: 768px) { .fr-page-header-line { display: block; } }

        /* ==================== MOBILE CONTROLS ==================== */

        .fr-mobile-controls { display: flex; gap: 8px; margin-bottom: 16px; }
        @media (min-width: 1024px) { .fr-mobile-controls { display: none; } }

        .fr-filter-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: var(--fr-green); color: #fff;
          border: none; border-radius: var(--fr-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--fr-font);
        }
        .fr-filter-trigger:active { transform: scale(0.98); }

        .fr-sort-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: #fff; color: var(--fr-mid);
          border: 1px solid var(--fr-border); border-radius: var(--fr-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--fr-font); position: relative;
        }
        .fr-sort-trigger:active { transform: scale(0.98); }

        /* ==================== SORT DROPDOWN ==================== */

        .fr-sort-drop {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: #fff; border: 1px solid var(--fr-border);
          border-radius: var(--fr-radius); box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          z-index: 50; overflow: hidden; animation: fr-fade 0.15s ease;
        }

        @keyframes fr-fade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fr-sort-option {
          display: block; width: 100%; text-align: left; padding: 10px 14px;
          font-size: 13px; font-weight: 500; color: var(--fr-mid);
          background: none; border: none; cursor: pointer; transition: all 0.1s;
          font-family: var(--fr-font); border-bottom: 1px solid #f5f5f5;
        }
        .fr-sort-option:last-child { border-bottom: none; }
        .fr-sort-option:hover { background: var(--fr-bg-subtle); }
        .fr-sort-option-active {
          background: var(--fr-green-light) !important;
          color: var(--fr-green) !important; font-weight: 600 !important;
        }

        /* ==================== DESKTOP TOOLBAR ==================== */

        .fr-toolbar {
          display: none; align-items: center; justify-content: space-between;
          padding: 12px 16px; background: #fff; border: 1px solid var(--fr-border);
          border-radius: var(--fr-radius); margin-bottom: 16px;
        }
        @media (min-width: 768px) { .fr-toolbar { display: flex; } }

        .fr-toolbar-left { display: flex; align-items: center; gap: 12px; }

        .fr-toolbar-count { font-size: 13px; font-weight: 500; color: var(--fr-light); }
        .fr-toolbar-count strong { color: var(--fr-dark); font-weight: 700; }

        .fr-toolbar-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: var(--fr-green-light); color: var(--fr-green);
          font-size: 11px; font-weight: 700; padding: 3px 10px;
          border-radius: 100px; text-transform: uppercase; letter-spacing: 0.03em;
        }

        .fr-toolbar-right { display: flex; align-items: center; gap: 8px; }

        .fr-desktop-sort { position: relative; }

        .fr-desktop-sort-btn {
          display: flex; align-items: center; gap: 6px; padding: 7px 14px;
          background: #fff; border: 1px solid var(--fr-border);
          border-radius: var(--fr-radius); font-size: 13px; font-weight: 500;
          color: var(--fr-mid); cursor: pointer; transition: all 0.15s;
          font-family: var(--fr-font);
        }
        .fr-desktop-sort-btn:hover {
          border-color: var(--fr-green-accent); color: var(--fr-dark);
        }

        .fr-desktop-sort-drop {
          position: absolute; top: calc(100% + 4px); right: 0; width: 200px;
          background: #fff; border: 1px solid var(--fr-border);
          border-radius: var(--fr-radius); box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          z-index: 50; overflow: hidden; animation: fr-fade 0.15s ease;
        }

        /* ==================== FILTER SIDEBAR ==================== */

        .fr-filter-content { display: flex; flex-direction: column; gap: 16px; }

        .fr-filter-header {
          display: flex; align-items: center; gap: 8px;
          padding-bottom: 12px; border-bottom: 1px solid var(--fr-border);
        }
        .fr-filter-header-text {
          font-size: 16px; font-weight: 800; color: var(--fr-dark); letter-spacing: -0.01em;
        }

        .fr-filter-section {
          padding: 16px; background: #fff; border: 1px solid var(--fr-border);
          border-radius: var(--fr-radius);
        }
        .fr-filter-section-title {
          display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
          font-size: 14px; font-weight: 700; color: var(--fr-dark);
        }
        .fr-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .fr-price-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .fr-price-field { display: flex; flex-direction: column; gap: 4px; }
        .fr-price-label {
          font-size: 11px; font-weight: 600; color: var(--fr-light);
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .fr-price-input-wrap { position: relative; display: flex; align-items: center; }
        .fr-price-symbol {
          position: absolute; left: 10px; font-size: 13px; font-weight: 600; color: var(--fr-light);
        }
        .fr-price-input {
          width: 100%; padding: 8px 10px 8px 24px; border: 1px solid var(--fr-border);
          border-radius: var(--fr-radius); font-size: 13px; font-weight: 500;
          color: var(--fr-dark); font-family: var(--fr-font);
          transition: border-color 0.15s; outline: none;
        }
        .fr-price-input:focus {
          border-color: var(--fr-green-accent);
          box-shadow: 0 0 0 2px rgba(34,197,94,0.1);
        }

        .fr-apply-btn {
          width: 100%; padding: 9px; background: var(--fr-green); color: #fff;
          border: none; border-radius: var(--fr-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background 0.15s;
          font-family: var(--fr-font); margin-bottom: 10px;
        }
        .fr-apply-btn:hover { background: var(--fr-green-mid); }
        .fr-apply-btn:active { transform: scale(0.98); }

        .fr-applied-range {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 10px; background: var(--fr-green-lighter);
          border: 1px solid #bbf7d0; border-radius: var(--fr-radius);
        }
        .fr-applied-label { font-size: 11px; font-weight: 600; color: var(--fr-green-mid); }
        .fr-applied-value { font-size: 12px; font-weight: 700; color: var(--fr-green); }

        .fr-discount-section { background: var(--fr-green-lighter); border-color: #bbf7d0; }
        .fr-discount-row { display: flex; align-items: center; justify-content: space-between; }
        .fr-discount-info { display: flex; align-items: center; gap: 10px; }
        .fr-discount-icon {
          width: 28px; height: 28px; border-radius: var(--fr-radius);
          background: var(--fr-green); display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .fr-discount-label { font-size: 13px; font-weight: 600; color: var(--fr-dark); }

        .fr-toggle {
          width: 40px; height: 22px; border-radius: 11px; background: #d1d5db;
          cursor: pointer; transition: background 0.2s; padding: 2px; flex-shrink: 0;
        }
        .fr-toggle-on { background: var(--fr-green) !important; }
        .fr-toggle-knob {
          width: 18px; height: 18px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15); transition: transform 0.2s;
        }
        .fr-toggle-on .fr-toggle-knob { transform: translateX(18px); }

        .fr-brand-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .fr-brand-tag {
          padding: 5px 12px; font-size: 12px; font-weight: 500; color: var(--fr-mid);
          background: var(--fr-bg-subtle); border: 1px solid var(--fr-border);
          border-radius: 100px; cursor: pointer; transition: all 0.15s;
          font-family: var(--fr-font); white-space: nowrap;
        }
        .fr-brand-tag:hover {
          border-color: var(--fr-green-accent); color: var(--fr-green);
          background: var(--fr-green-light);
        }
        .fr-brand-tag-active {
          background: var(--fr-green) !important; color: #fff !important;
          border-color: var(--fr-green) !important; font-weight: 600 !important;
        }

        .fr-reset-btn {
          width: 100%; padding: 9px; background: #fff; color: var(--fr-red);
          border: 1px solid #fecaca; border-radius: var(--fr-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--fr-font);
        }
        .fr-reset-btn:hover { background: #fef2f2; border-color: var(--fr-red); }
        .fr-reset-btn:active { transform: scale(0.98); }

        /* ==================== DRAWER ==================== */

        .fr-drawer-overlay {
          position: fixed; inset: 0; z-index: 100; display: flex;
          animation: fr-fade 0.2s ease;
        }
        .fr-drawer-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.4); }
        .fr-drawer-panel {
          position: relative; width: 100%; max-width: 320px; height: 100%;
          background: #fff; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow-y: auto; z-index: 1; animation: fr-slide-in 0.25s ease;
        }
        @keyframes fr-slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .fr-drawer-header {
          position: sticky; top: 0; background: #fff; display: flex;
          align-items: center; justify-content: space-between; padding: 14px 16px;
          border-bottom: 1px solid var(--fr-border); z-index: 2;
        }
        .fr-drawer-header-left { display: flex; align-items: center; gap: 8px; }
        .fr-drawer-header-title { font-size: 16px; font-weight: 800; color: var(--fr-dark); }
        .fr-drawer-close {
          width: 32px; height: 32px; display: flex; align-items: center;
          justify-content: center; border: 1px solid var(--fr-border);
          border-radius: var(--fr-radius); background: #fff; cursor: pointer;
          transition: background 0.12s;
        }
        .fr-drawer-close:active { background: #f5f5f5; }
        .fr-drawer-body { padding: 16px; }

        /* ==================== PRODUCT GRID ==================== */

        .fr-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) { .fr-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .fr-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
        @media (min-width: 1280px) { .fr-grid { grid-template-columns: repeat(4, 1fr); } }

        /* ==================== CARDS ==================== */

        .fr-card {
          border: 1px solid var(--fr-border); border-radius: var(--fr-radius);
          overflow: hidden; background: #fff; transition: all 0.2s ease; cursor: pointer;
        }
        .fr-card:hover {
          border-color: var(--fr-green-accent);
          box-shadow: 0 4px 16px rgba(20, 83, 45, 0.08);
        }

        .fr-card-img {
          position: relative; height: 190px; display: flex; align-items: center;
          justify-content: center; padding: 10px; overflow: hidden;
        }
        @media (min-width: 768px) { .fr-card-img { height: 195px; } }

        .fr-card-img img {
          height: 100%; width: 100%; object-fit: contain; transition: transform 0.3s ease;
        }
        .fr-card:hover .fr-card-img img { transform: scale(1.05); }

        .fr-card-overlay {
          position: absolute; inset: 0; background: rgba(20, 83, 45, 0.45);
          display: none; align-items: center; justify-content: center; gap: 8px; z-index: 2;
        }
        .fr-card:hover .fr-card-overlay { display: flex; }

        .fr-card-action {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 50%; background: #fff;
          border: none; cursor: pointer; transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .fr-card-action:hover {
          transform: scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .fr-card-action:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .fr-card-body { padding: 10px 12px; text-align: center; }

        .fr-card-name {
          font-size: 15px; font-weight: 600; color: var(--fr-dark); line-height: 1.35;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; min-height: 35px;
        }

        .fr-card-price { font-size: 15px; font-weight: 900; color: var(--fr-red); margin-top: 2px; }

        .fr-card-old-price {
          font-size: 12px; font-weight: 400; color: var(--fr-light);
          text-decoration: line-through; margin-top: 2px;
        }

        .fr-card-badge {
          position: absolute; top: 8px; font-size: 9px; font-weight: 700;
          padding: 3px 8px; border-radius: 100px; z-index: 3;
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .fr-card-badge-sold { left: 8px; background: var(--fr-dark); color: #fff; }
        .fr-card-badge-discount {
          right: 8px; background: var(--fr-red); color: #fff;
          font-size: 10px; padding: 3px 7px;
        }

        /* ==================== SKELETON ==================== */

        .fr-skeleton {
          border: 1px solid #eee; border-radius: var(--fr-radius);
          overflow: hidden; background: #fff;
        }
        .fr-skeleton-img {
          height: 150px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: fr-shimmer 1.5s infinite;
        }
        @media (min-width: 768px) { .fr-skeleton-img { height: 195px; } }

        @keyframes fr-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .fr-skeleton-line {
          height: 10px; border-radius: 2px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: fr-shimmer 1.5s infinite;
        }

        /* ==================== EMPTY STATE ==================== */

        .fr-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center; padding: 60px 24px;
          background: #fff; border: 1px solid var(--fr-border);
          border-radius: var(--fr-radius); margin-top: 16px;
        }

        .fr-empty-icon-wrap {
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--fr-bg-subtle); display: flex; align-items: center;
          justify-content: center; margin-bottom: 20px;
          border: 1px solid var(--fr-border);
        }

        .fr-empty-title {
          font-size: 18px; font-weight: 700; color: var(--fr-dark); margin-bottom: 8px;
        }

        .fr-empty-desc {
          font-size: 14px; color: var(--fr-light); max-width: 360px;
          line-height: 1.6; margin-bottom: 24px;
        }

        .fr-empty-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; }

        .fr-empty-reset {
          padding: 10px 20px; background: var(--fr-green); color: #fff;
          border: none; border-radius: var(--fr-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background 0.15s;
          font-family: var(--fr-font);
        }
        .fr-empty-reset:hover { background: var(--fr-green-mid); }

        .fr-empty-browse {
          padding: 10px 20px; background: #fff; color: var(--fr-mid);
          border: 1px solid var(--fr-border); border-radius: var(--fr-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--fr-font); text-decoration: none;
        }
        .fr-empty-browse:hover { border-color: var(--fr-green-accent); color: var(--fr-dark); }

        /* ==================== LAYOUT ==================== */

        .fr-layout { display: flex; flex-direction: column; gap: 0; }
        @media (min-width: 1024px) { .fr-layout { flex-direction: row; gap: 24px; } }

        .fr-sidebar { display: none; width: 280px; flex-shrink: 0; }
        @media (min-width: 1024px) { .fr-sidebar { display: block; } }

        .fr-sidebar-sticky { position: sticky; top: 80px; }
        .fr-main { flex: 1; min-width: 0; }
        .fr-pagination { display: flex; justify-content: center; margin-top: 24px; }
      `}</style>

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="fr-root min-h-screen">
        <Helmet>
          <title>Shop Refrigerators - Best Prices & Top Brands</title>
          <meta name="description" content="Find the best refrigerators from top brands at unbeatable prices. Shop now and enjoy great deals on high-quality fridges!" />
          <meta property="og:title" content="Shop Refrigerators - Best Prices & Top Brands" />
          <meta property="og:description" content="Find the best refrigerators from top brands at unbeatable prices. Shop now and enjoy great deals on high-quality fridges!" />
          <meta property="og:image" content={filteredProducts.length > 0 ? `https://testing.frankotrading.com/Media/Products_Images/${filteredProducts[0].productImage.split("\\").pop()}` : "default-image-url"} />
          <meta property="og:url" content="https://www.frankotrading.com/refrigerator" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Shop Refrigerators - Best Prices & Top Brands" />
          <meta name="twitter:description" content="Find the best refrigerators from top brands at unbeatable prices. Shop now and enjoy great deals on high-quality fridges!" />
          <meta name="twitter:image" content={filteredProducts.length > 0 ? `https://testing.frankotrading.com/Media/Products_Images/${filteredProducts[0].productImage.split("\\").pop()}` : "default-image-url"} />
          <link rel="canonical" href="https://www.frankotrading.com/refrigerator" />
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "ItemList",
              "name": "Refrigerators",
              "description": "Find the best refrigerators from top brands at unbeatable prices.",
              "url": "https://www.frankotrading.com/refrigerator",
              "itemListElement": filteredProducts.map((item, index) => ({
                "@type": "Product",
                "position": index + 1,
                "name": item.productName,
                "image": `https://testing.frankotrading.com/Media/Products_Images/${item.productImage.split("\\").pop()}`,
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
              })),
            })}
          </script>
        </Helmet>

        <div className="px-4 md:px-16 py-6">
          {/* Page Header */}
          <div className="fr-page-header">
            <div className="fr-page-header-accent" />
            <div>
              <h1 className="fr-page-title">
                {selectedBrand ? `${selectedBrand} Refrigerators` : "Refrigerators"}
              </h1>
              <p className="fr-page-count">
                {isInitialLoading
                  ? "Loading products..."
                  : `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <div className="fr-page-header-line" />
          </div>

          {/* Mobile Controls */}
          <div className="fr-mobile-controls">
            <button onClick={() => setIsDrawerOpen(true)} className="fr-filter-trigger">
              <FunnelIcon style={{ width: 16, height: 16 }} />
              <span>Filters</span>
              {isFiltersActive && (
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", marginLeft: 2 }} />
              )}
            </button>
            <div className="fr-sort-trigger" onClick={() => setShowSortDropdown(!showSortDropdown)}>
              <Bars3BottomLeftIcon style={{ width: 16, height: 16 }} />
              <span>Sort</span>
              <ChevronDownIcon
                style={{ width: 14, height: 14, transition: "transform 0.2s", transform: showSortDropdown ? "rotate(180deg)" : "none" }}
              />
              {showSortDropdown && (
                <div className="fr-sort-drop">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                        setCurrentPage(1);
                      }}
                      className={`fr-sort-option ${sortBy === option.value ? "fr-sort-option-active" : ""}`}
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
            <div className="fr-drawer-overlay">
              <div className="fr-drawer-backdrop" onClick={() => setIsDrawerOpen(false)} />
              <div className="fr-drawer-panel">
                <div className="fr-drawer-header">
                  <div className="fr-drawer-header-left">
                    <AdjustmentsHorizontalIcon style={{ width: 18, height: 18, color: "var(--fr-green)" }} />
                    <span className="fr-drawer-header-title">Filters</span>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} className="fr-drawer-close">
                    <XMarkIcon style={{ width: 14, height: 14, color: "var(--fr-light)" }} />
                  </button>
                </div>
                <div className="fr-drawer-body">{renderFilterContent()}</div>
              </div>
            </div>
          )}

          {/* Layout */}
          <div className="fr-layout">
            <aside className="fr-sidebar">
              <div className="fr-sidebar-sticky">{renderFilterContent()}</div>
            </aside>

            <section className="fr-main">
              {/* Desktop Toolbar */}
              {(hasProducts || isInitialLoading) && (
                <div className="fr-toolbar">
                  <div className="fr-toolbar-left">
                    <span className="fr-toolbar-count">
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
                    {isFiltersActive && <span className="fr-toolbar-badge">Filtered</span>}
                  </div>
                  <div className="fr-toolbar-right">
                    <div className="fr-desktop-sort">
                      <button onClick={() => setShowSortDropdown(!showSortDropdown)} className="fr-desktop-sort-btn">
                        <Bars3BottomLeftIcon style={{ width: 14, height: 14 }} />
                        <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                        <ChevronDownIcon
                          style={{ width: 12, height: 12, transition: "transform 0.2s", transform: showSortDropdown ? "rotate(180deg)" : "none" }}
                        />
                      </button>
                      {showSortDropdown && (
                        <div className="fr-desktop-sort-drop">
                          {sortOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortBy(option.value);
                                setShowSortDropdown(false);
                                setCurrentPage(1);
                              }}
                              className={`fr-sort-option ${sortBy === option.value ? "fr-sort-option-active" : ""}`}
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
                <div className="fr-grid">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Products */}
              {!isInitialLoading && hasProducts && (
                <>
                  <div className="fr-grid">
                    {currentProducts.map((product) => {
                      const { productID, productName, productImage, price, oldPrice, stock } = product;
                      const isOnSale = oldPrice > 0 && oldPrice > price;
                      const discountPercent = isOnSale ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
                      const soldOut = stock === 0;
                      const inWishlist = isInWishlist(productID);

                      return (
                        <div key={productID} className="fr-card">
                          <div className="fr-card-img">
                            {soldOut && <span className="fr-card-badge fr-card-badge-sold">Sold Out</span>}
                            {isOnSale && !soldOut && (
                              <span className="fr-card-badge fr-card-badge-discount">-{discountPercent}%</span>
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

                            <div className="fr-card-overlay" onClick={() => navigate(`/product/${productID}`)}>
                              <Tooltip content={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}>
                                <button
                                  className="fr-card-action"
                                  onClick={(e) => { e.stopPropagation(); handleWishlistToggle(product); }}
                                >
                                  {inWishlist ? (
                                    <SolidHeartIcon style={{ width: 16, height: 16, color: "var(--fr-pink)" }} />
                                  ) : (
                                    <OutlineHeartIcon style={{ width: 16, height: 16, color: "var(--fr-mid)" }} />
                                  )}
                                </button>
                              </Tooltip>
                              <Tooltip content="View Details">
                                <button
                                  className="fr-card-action"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/product/${productID}`); }}
                                >
                                  <EyeIcon style={{ width: 16, height: 16, color: "var(--fr-green)" }} />
                                </button>
                              </Tooltip>
                              <Tooltip content={soldOut ? "Out of Stock" : "Add to Cart"}>
                                <button
                                  className="fr-card-action"
                                  onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                                  disabled={cartLoading || soldOut}
                                >
                                  <ShoppingCartIcon style={{ width: 16, height: 16, color: "var(--fr-green-mid)" }} />
                                </button>
                              </Tooltip>
                            </div>
                          </div>

                          <div className="fr-card-body">
                            <div className="fr-card-name">{productName}</div>
                            <div className="fr-card-price">{formatPrice(price)}</div>
                            {oldPrice > 0 && <div className="fr-card-old-price">{formatPrice(oldPrice)}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="fr-pagination">
                      <CircularPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {trulyEmpty && (
                <div className="fr-empty">
                  <div className="fr-empty-icon-wrap">
                    <MagnifyingGlassIcon style={{ width: 32, height: 32, color: "var(--fr-light)" }} />
                  </div>
                  <div className="fr-empty-title">
                    {isFiltersActive ? "No matching refrigerators" : "No refrigerators available"}
                  </div>
                  <div className="fr-empty-desc">
                    {isFiltersActive
                      ? "Try adjusting your price range, brand, or filters to find what you're looking for."
                      : "We don't have any refrigerators available at the moment. Please check back later or explore other categories."}
                  </div>
                  <div className="fr-empty-actions">
                    {isFiltersActive && (
                      <button onClick={resetFilters} className="fr-empty-reset">
                        Clear Filters
                      </button>
                    )}
                    <button onClick={() => navigate("/")} className="fr-empty-browse">
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

export default Fridge;