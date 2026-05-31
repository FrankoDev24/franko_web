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

const categoryId = "12f11417-4f9e-4e4a-a18d-f9ff0d4c85a6";

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

  const bgClass = type === "success" ? "lp-notif-success" : "lp-notif-error";
  const Icon = type === "success" ? CheckCircleIcon : XCircleIcon;

  return (
    <div className="fixed top-4 right-4 z-50 lp-animate-slide-in">
      <div className={`lp-notif ${bgClass}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="lp-notif-text">{message}</span>
        <button onClick={onClose} className="lp-notif-close">×</button>
      </div>
    </div>
  );
};

// ==================== SKELETON ====================

const SkeletonCard = () => (
  <div className="lp-skeleton">
    <div className="lp-skeleton-img" />
    <div style={{ padding: "10px 12px" }}>
      <div className="lp-skeleton-line" style={{ width: "80%", marginBottom: 8, marginLeft: "auto", marginRight: "auto" }} />
      <div className="lp-skeleton-line" style={{ width: "50%", height: 8, marginLeft: "auto", marginRight: "auto" }} />
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

const Laptops = () => {
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
    <div className="lp-filter-content">
      <div className="hidden lp-filter-header lp-desktop-only">
        <AdjustmentsHorizontalIcon style={{ width: 18, height: 18, color: "var(--lp-green)" }} />
        <span className="lp-filter-header-text">Filters</span>
      </div>

      {/* Price Range */}
      <div className="lp-filter-section">
        <div className="lp-filter-section-title">
          <div className="lp-dot" style={{ background: "var(--lp-green-accent)" }} />
          <span>Price Range</span>
        </div>
        <div className="lp-price-inputs">
          <div className="lp-price-field">
            <label className="lp-price-label">Min</label>
            <div className="lp-price-input-wrap">
              <span className="lp-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.min}
                onChange={(e) => setInputPriceRange((prev) => ({ ...prev, min: +e.target.value }))}
                className="lp-price-input"
                placeholder="0"
              />
            </div>
          </div>
          <div className="lp-price-field">
            <label className="lp-price-label">Max</label>
            <div className="lp-price-input-wrap">
              <span className="lp-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.max}
                onChange={(e) => setInputPriceRange((prev) => ({ ...prev, max: +e.target.value }))}
                className="lp-price-input"
                placeholder="200000"
              />
            </div>
          </div>
        </div>
        <button onClick={applyPriceFilter} className="lp-apply-btn">
          Apply Price Filter
        </button>
        <div className="lp-applied-range">
          <span className="lp-applied-label">Active:</span>
          <span className="lp-applied-value">
            ₵{appliedPriceRange[0].toLocaleString()} – ₵{appliedPriceRange[1].toLocaleString()}
          </span>
        </div>
      </div>

      {/* Discount Toggle */}
      <div className="lp-filter-section lp-discount-section">
        <div className="lp-discount-row">
          <div className="lp-discount-info">
            <div className="lp-discount-icon">
              <TagIcon style={{ width: 14, height: 14, color: "#fff" }} />
            </div>
            <span className="lp-discount-label">Discounted Only</span>
          </div>
          <div
            onClick={() => setShowDiscountedOnly(!showDiscountedOnly)}
            className={`lp-toggle ${showDiscountedOnly ? "lp-toggle-on" : ""}`}
          >
            <div className="lp-toggle-knob" />
          </div>
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div className="lp-filter-section">
          <div className="lp-filter-section-title">
            <div className="lp-dot" style={{ background: "var(--lp-green)" }} />
            <span>Brands</span>
          </div>
          <div className="lp-brand-tags">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => {
                  setSelectedBrand(selectedBrand === brand ? null : brand);
                  setCurrentPage(1);
                }}
                className={`lp-brand-tag ${selectedBrand === brand ? "lp-brand-tag-active" : ""}`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {isFiltersActive && (
        <button onClick={resetFilters} className="lp-reset-btn">
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
          --lp-font: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          --lp-green: #14532d;
          --lp-green-mid: #166534;
          --lp-green-light: #dcfce7;
          --lp-green-lighter: #f0fdf4;
          --lp-green-accent: #22c55e;
          --lp-dark: #1a1a1a;
          --lp-mid: #555;
          --lp-light: #888;
          --lp-border: #e0e0e0;
          --lp-bg-subtle: #f7f7f7;
          --lp-red: #dc2626;
          --lp-pink: #e11d48;
          --lp-radius: 4px;
        }

        .lp-root, .lp-root * {
          font-family: var(--lp-font);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          box-sizing: border-box;
        }

        .lp-desktop-only { display: none; }
        @media (min-width: 1024px) { .lp-desktop-only { display: flex; } }

        /* ==================== NOTIFICATION ==================== */

        .lp-notif {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: var(--lp-radius);
          min-width: 280px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .lp-notif-success { background: var(--lp-green); color: #fff; }
        .lp-notif-error { background: var(--lp-red); color: #fff; }

        .lp-notif-text { font-size: 14px; font-weight: 500; flex: 1; }

        .lp-notif-close {
          background: transparent; border: none; color: rgba(255,255,255,0.8);
          font-size: 18px; cursor: pointer; padding: 0; line-height: 1;
        }
        .lp-notif-close:hover { color: #fff; }

        @keyframes lp-slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .lp-animate-slide-in { animation: lp-slide-in-right 0.3s ease-out; }

        /* ==================== PAGE HEADER ==================== */

        .lp-page-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--lp-border);
        }

        .lp-page-header-accent {
          width: 4px; height: 28px; border-radius: 2px;
          background: var(--lp-green); flex-shrink: 0;
        }

        .lp-page-title {
          font-size: 20px; font-weight: 800; color: var(--lp-dark);
          letter-spacing: -0.02em; line-height: 1.2; margin: 0;
        }
        @media (min-width: 768px) { .lp-page-title { font-size: 24px; } }

        .lp-page-count {
          font-size: 13px; font-weight: 500; color: var(--lp-light); margin-top: 2px;
        }

        .lp-page-header-line {
          flex: 1; height: 1px; background: var(--lp-border); display: none;
        }
        @media (min-width: 768px) { .lp-page-header-line { display: block; } }

        /* ==================== MOBILE CONTROLS ==================== */

        .lp-mobile-controls { display: flex; gap: 8px; margin-bottom: 16px; }
        @media (min-width: 1024px) { .lp-mobile-controls { display: none; } }

        .lp-filter-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: var(--lp-green); color: #fff;
          border: none; border-radius: var(--lp-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--lp-font);
        }
        .lp-filter-trigger:active { transform: scale(0.98); }

        .lp-sort-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: #fff; color: var(--lp-mid);
          border: 1px solid var(--lp-border); border-radius: var(--lp-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--lp-font); position: relative;
        }
        .lp-sort-trigger:active { transform: scale(0.98); }

        /* ==================== SORT DROPDOWN ==================== */

        .lp-sort-drop {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: #fff; border: 1px solid var(--lp-border);
          border-radius: var(--lp-radius); box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          z-index: 50; overflow: hidden; animation: lp-fade 0.15s ease;
        }

        @keyframes lp-fade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .lp-sort-option {
          display: block; width: 100%; text-align: left; padding: 10px 14px;
          font-size: 13px; font-weight: 500; color: var(--lp-mid);
          background: none; border: none; cursor: pointer; transition: all 0.1s;
          font-family: var(--lp-font); border-bottom: 1px solid #f5f5f5;
        }
        .lp-sort-option:last-child { border-bottom: none; }
        .lp-sort-option:hover { background: var(--lp-bg-subtle); }
        .lp-sort-option-active {
          background: var(--lp-green-light) !important;
          color: var(--lp-green) !important; font-weight: 600 !important;
        }

        /* ==================== DESKTOP TOOLBAR ==================== */

        .lp-toolbar {
          display: none; align-items: center; justify-content: space-between;
          padding: 12px 16px; background: #fff; border: 1px solid var(--lp-border);
          border-radius: var(--lp-radius); margin-bottom: 16px;
        }
        @media (min-width: 768px) { .lp-toolbar { display: flex; } }

        .lp-toolbar-left { display: flex; align-items: center; gap: 12px; }

        .lp-toolbar-count { font-size: 13px; font-weight: 500; color: var(--lp-light); }
        .lp-toolbar-count strong { color: var(--lp-dark); font-weight: 700; }

        .lp-toolbar-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: var(--lp-green-light); color: var(--lp-green);
          font-size: 11px; font-weight: 700; padding: 3px 10px;
          border-radius: 100px; text-transform: uppercase; letter-spacing: 0.03em;
        }

        .lp-toolbar-right { display: flex; align-items: center; gap: 8px; }

        .lp-desktop-sort { position: relative; }

        .lp-desktop-sort-btn {
          display: flex; align-items: center; gap: 6px; padding: 7px 14px;
          background: #fff; border: 1px solid var(--lp-border);
          border-radius: var(--lp-radius); font-size: 13px; font-weight: 500;
          color: var(--lp-mid); cursor: pointer; transition: all 0.15s;
          font-family: var(--lp-font);
        }
        .lp-desktop-sort-btn:hover {
          border-color: var(--lp-green-accent); color: var(--lp-dark);
        }

        .lp-desktop-sort-drop {
          position: absolute; top: calc(100% + 4px); right: 0; width: 200px;
          background: #fff; border: 1px solid var(--lp-border);
          border-radius: var(--lp-radius); box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          z-index: 50; overflow: hidden; animation: lp-fade 0.15s ease;
        }

        /* ==================== FILTER SIDEBAR ==================== */

        .lp-filter-content { display: flex; flex-direction: column; gap: 16px; }

        .lp-filter-header {
          display: flex; align-items: center; gap: 8px;
          padding-bottom: 12px; border-bottom: 1px solid var(--lp-border);
        }
        .lp-filter-header-text {
          font-size: 16px; font-weight: 800; color: var(--lp-dark); letter-spacing: -0.01em;
        }

        .lp-filter-section {
          padding: 16px; background: #fff; border: 1px solid var(--lp-border);
          border-radius: var(--lp-radius);
        }
        .lp-filter-section-title {
          display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
          font-size: 14px; font-weight: 700; color: var(--lp-dark);
        }
        .lp-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .lp-price-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .lp-price-field { display: flex; flex-direction: column; gap: 4px; }
        .lp-price-label {
          font-size: 11px; font-weight: 600; color: var(--lp-light);
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .lp-price-input-wrap { position: relative; display: flex; align-items: center; }
        .lp-price-symbol {
          position: absolute; left: 10px; font-size: 13px; font-weight: 600; color: var(--lp-light);
        }
        .lp-price-input {
          width: 100%; padding: 8px 10px 8px 24px; border: 1px solid var(--lp-border);
          border-radius: var(--lp-radius); font-size: 13px; font-weight: 500;
          color: var(--lp-dark); font-family: var(--lp-font);
          transition: border-color 0.15s; outline: none;
        }
        .lp-price-input:focus {
          border-color: var(--lp-green-accent);
          box-shadow: 0 0 0 2px rgba(34,197,94,0.1);
        }

        .lp-apply-btn {
          width: 100%; padding: 9px; background: var(--lp-green); color: #fff;
          border: none; border-radius: var(--lp-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background 0.15s;
          font-family: var(--lp-font); margin-bottom: 10px;
        }
        .lp-apply-btn:hover { background: var(--lp-green-mid); }
        .lp-apply-btn:active { transform: scale(0.98); }

        .lp-applied-range {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 10px; background: var(--lp-green-lighter);
          border: 1px solid #bbf7d0; border-radius: var(--lp-radius);
        }
        .lp-applied-label { font-size: 11px; font-weight: 600; color: var(--lp-green-mid); }
        .lp-applied-value { font-size: 12px; font-weight: 700; color: var(--lp-green); }

        .lp-discount-section { background: var(--lp-green-lighter); border-color: #bbf7d0; }
        .lp-discount-row { display: flex; align-items: center; justify-content: space-between; }
        .lp-discount-info { display: flex; align-items: center; gap: 10px; }
        .lp-discount-icon {
          width: 28px; height: 28px; border-radius: var(--lp-radius);
          background: var(--lp-green); display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .lp-discount-label { font-size: 13px; font-weight: 600; color: var(--lp-dark); }

        .lp-toggle {
          width: 40px; height: 22px; border-radius: 11px; background: #d1d5db;
          cursor: pointer; transition: background 0.2s; padding: 2px; flex-shrink: 0;
        }
        .lp-toggle-on { background: var(--lp-green) !important; }
        .lp-toggle-knob {
          width: 18px; height: 18px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15); transition: transform 0.2s;
        }
        .lp-toggle-on .lp-toggle-knob { transform: translateX(18px); }

        .lp-brand-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .lp-brand-tag {
          padding: 5px 12px; font-size: 12px; font-weight: 500; color: var(--lp-mid);
          background: var(--lp-bg-subtle); border: 1px solid var(--lp-border);
          border-radius: 100px; cursor: pointer; transition: all 0.15s;
          font-family: var(--lp-font); white-space: nowrap;
        }
        .lp-brand-tag:hover {
          border-color: var(--lp-green-accent); color: var(--lp-green);
          background: var(--lp-green-light);
        }
        .lp-brand-tag-active {
          background: var(--lp-green) !important; color: #fff !important;
          border-color: var(--lp-green) !important; font-weight: 600 !important;
        }

        .lp-reset-btn {
          width: 100%; padding: 9px; background: #fff; color: var(--lp-red);
          border: 1px solid #fecaca; border-radius: var(--lp-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--lp-font);
        }
        .lp-reset-btn:hover { background: #fef2f2; border-color: var(--lp-red); }
        .lp-reset-btn:active { transform: scale(0.98); }

        /* ==================== DRAWER ==================== */

        .lp-drawer-overlay {
          position: fixed; inset: 0; z-index: 100; display: flex;
          animation: lp-fade 0.2s ease;
        }
        .lp-drawer-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.4); }
        .lp-drawer-panel {
          position: relative; width: 100%; max-width: 320px; height: 100%;
          background: #fff; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow-y: auto; z-index: 1; animation: lp-slide-in 0.25s ease;
        }
        @keyframes lp-slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .lp-drawer-header {
          position: sticky; top: 0; background: #fff; display: flex;
          align-items: center; justify-content: space-between; padding: 14px 16px;
          border-bottom: 1px solid var(--lp-border); z-index: 2;
        }
        .lp-drawer-header-left { display: flex; align-items: center; gap: 8px; }
        .lp-drawer-header-title { font-size: 16px; font-weight: 800; color: var(--lp-dark); }
        .lp-drawer-close {
          width: 32px; height: 32px; display: flex; align-items: center;
          justify-content: center; border: 1px solid var(--lp-border);
          border-radius: var(--lp-radius); background: #fff; cursor: pointer;
          transition: background 0.12s;
        }
        .lp-drawer-close:active { background: #f5f5f5; }
        .lp-drawer-body { padding: 16px; }

        /* ==================== PRODUCT GRID ==================== */

        .lp-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) { .lp-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .lp-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
        @media (min-width: 1280px) { .lp-grid { grid-template-columns: repeat(4, 1fr); } }

        /* ==================== CARDS ==================== */

        .lp-card {
          border: 1px solid var(--lp-border); border-radius: var(--lp-radius);
          overflow: hidden; background: #fff; transition: all 0.2s ease; cursor: pointer;
        }
        .lp-card:hover {
          border-color: var(--lp-green-accent);
          box-shadow: 0 4px 16px rgba(20, 83, 45, 0.08);
        }

        .lp-card-img {
          position: relative; height: 190px; display: flex; align-items: center;
          justify-content: center; padding: 10px; overflow: hidden;
        }
        @media (min-width: 768px) { .lp-card-img { height: 195px; } }

        .lp-card-img img {
          height: 100%; width: 100%; object-fit: contain; transition: transform 0.3s ease;
        }
        .lp-card:hover .lp-card-img img { transform: scale(1.05); }

        .lp-card-overlay {
          position: absolute; inset: 0; background: rgba(20, 83, 45, 0.45);
          display: none; align-items: center; justify-content: center; gap: 8px; z-index: 2;
        }
        .lp-card:hover .lp-card-overlay { display: flex; }

        .lp-card-action {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 50%; background: #fff;
          border: none; cursor: pointer; transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .lp-card-action:hover {
          transform: scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .lp-card-action:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .lp-card-body { padding: 10px 12px; text-align: center; }

        .lp-card-name {
          font-size: 15px; font-weight: 600; color: var(--lp-dark); line-height: 1.35;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; min-height: 35px;
        }

        .lp-card-price { font-size: 15px; font-weight: 900; color: var(--lp-red); margin-top: 2px; }

        .lp-card-old-price {
          font-size: 12px; font-weight: 400; color: var(--lp-light);
          text-decoration: line-through; margin-top: 2px;
        }

        .lp-card-badge {
          position: absolute; top: 8px; font-size: 9px; font-weight: 700;
          padding: 3px 8px; border-radius: 100px; z-index: 3;
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .lp-card-badge-sold { left: 8px; background: var(--lp-dark); color: #fff; }
        .lp-card-badge-discount {
          right: 8px; background: var(--lp-red); color: #fff;
          font-size: 10px; padding: 3px 7px;
        }

        /* ==================== SKELETON ==================== */

        .lp-skeleton {
          border: 1px solid #eee; border-radius: var(--lp-radius);
          overflow: hidden; background: #fff;
        }
        .lp-skeleton-img {
          height: 150px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: lp-shimmer 1.5s infinite;
        }
        @media (min-width: 768px) { .lp-skeleton-img { height: 195px; } }

        @keyframes lp-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .lp-skeleton-line {
          height: 10px; border-radius: 2px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: lp-shimmer 1.5s infinite;
        }

        /* ==================== EMPTY STATE ==================== */

        .lp-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center; padding: 60px 24px;
          background: #fff; border: 1px solid var(--lp-border);
          border-radius: var(--lp-radius); margin-top: 16px;
        }

        .lp-empty-icon-wrap {
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--lp-bg-subtle); display: flex; align-items: center;
          justify-content: center; margin-bottom: 20px;
          border: 1px solid var(--lp-border);
        }

        .lp-empty-title {
          font-size: 18px; font-weight: 700; color: var(--lp-dark); margin-bottom: 8px;
        }

        .lp-empty-desc {
          font-size: 14px; color: var(--lp-light); max-width: 360px;
          line-height: 1.6; margin-bottom: 24px;
        }

        .lp-empty-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; }

        .lp-empty-reset {
          padding: 10px 20px; background: var(--lp-green); color: #fff;
          border: none; border-radius: var(--lp-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background 0.15s;
          font-family: var(--lp-font);
        }
        .lp-empty-reset:hover { background: var(--lp-green-mid); }

        .lp-empty-browse {
          padding: 10px 20px; background: #fff; color: var(--lp-mid);
          border: 1px solid var(--lp-border); border-radius: var(--lp-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--lp-font); text-decoration: none;
        }
        .lp-empty-browse:hover { border-color: var(--lp-green-accent); color: var(--lp-dark); }

        /* ==================== LAYOUT ==================== */

        .lp-layout { display: flex; flex-direction: column; gap: 0; }
        @media (min-width: 1024px) { .lp-layout { flex-direction: row; gap: 24px; } }

        .lp-sidebar { display: none; width: 280px; flex-shrink: 0; }
        @media (min-width: 1024px) { .lp-sidebar { display: block; } }

        .lp-sidebar-sticky { position: sticky; top: 80px; }
        .lp-main { flex: 1; min-width: 0; }
        .lp-pagination { display: flex; justify-content: center; margin-top: 24px; }
      `}</style>

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="lp-root min-h-screen">
        <Helmet>
          <title>Laptops & Computers Ghana | Buy Desktops, Laptops & Accessories</title>
          <meta name="description" content="Buy laptops, desktops, and computer accessories at Franko Trading. Choose top brands like HP, Lenovo, Acer, and Dell — with free shipping and warranty support." />
          <meta name="keywords" content="computers, laptops, desktops, accessories, buy online" />
          <meta property="og:title" content="Laptops - Buy Laptops, Desktops, and Accessories" />
          <meta property="og:description" content="Shop laptops, desktops, and computer accessories at Franko Trading. Choose top brands like HP, Lenovo, Acer, and Dell — with free shipping and warranty support." />
          <meta property="og:image" content={filteredProducts.length > 0 ? `https://testing.frankotrading.com/Media/Products_Images/${filteredProducts[0].productImage.split("\\").pop()}` : "default-image-url"} />
          <meta property="og:url" content="https://www.frankotrading.com/computers" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Computers - Buy Laptops, Desktops, and Accessories" />
          <meta name="twitter:description" content="Shop laptops, desktops, and computer accessories at Franko Trading. Choose top brands like HP, Lenovo, Acer, and Dell — with free shipping and warranty support." />
          <meta name="twitter:image" content={filteredProducts.length > 0 ? `https://testing.frankotrading.com/Media/Products_Images/${filteredProducts[0].productImage.split("\\").pop()}` : "default-image-url"} />
          <link rel="canonical" href="https://www.frankotrading.com/computers" />
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "Laptops & Computers in Ghana",
              "description": "Explore our range of laptops, desktops, and computer accessories from top brands like HP, Lenovo, Acer, and Dell. Enjoy free shipping and warranty support on all purchases.",
              "url": "https://www.frankotrading.com/computers",
              "numberOfItems": filteredProducts.length,
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
                "productID": item.productID,
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
          <div className="lp-page-header">
            <div className="lp-page-header-accent" />
            <div>
              <h1 className="lp-page-title">
                {selectedBrand ? `${selectedBrand} Laptops` : "Laptops & Computers"}
              </h1>
              <p className="lp-page-count">
                {isInitialLoading
                  ? "Loading products..."
                  : `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <div className="lp-page-header-line" />
          </div>

          {/* Mobile Controls */}
          <div className="lp-mobile-controls">
            <button onClick={() => setIsDrawerOpen(true)} className="lp-filter-trigger">
              <FunnelIcon style={{ width: 16, height: 16 }} />
              <span>Filters</span>
              {isFiltersActive && (
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", marginLeft: 2 }} />
              )}
            </button>
            <div className="lp-sort-trigger" onClick={() => setShowSortDropdown(!showSortDropdown)}>
              <Bars3BottomLeftIcon style={{ width: 16, height: 16 }} />
              <span>Sort</span>
              <ChevronDownIcon
                style={{ width: 14, height: 14, transition: "transform 0.2s", transform: showSortDropdown ? "rotate(180deg)" : "none" }}
              />
              {showSortDropdown && (
                <div className="lp-sort-drop">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                        setCurrentPage(1);
                      }}
                      className={`lp-sort-option ${sortBy === option.value ? "lp-sort-option-active" : ""}`}
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
            <div className="lp-drawer-overlay">
              <div className="lp-drawer-backdrop" onClick={() => setIsDrawerOpen(false)} />
              <div className="lp-drawer-panel">
                <div className="lp-drawer-header">
                  <div className="lp-drawer-header-left">
                    <AdjustmentsHorizontalIcon style={{ width: 18, height: 18, color: "var(--lp-green)" }} />
                    <span className="lp-drawer-header-title">Filters</span>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} className="lp-drawer-close">
                    <XMarkIcon style={{ width: 14, height: 14, color: "var(--lp-light)" }} />
                  </button>
                </div>
                <div className="lp-drawer-body">{renderFilterContent()}</div>
              </div>
            </div>
          )}

          {/* Layout */}
          <div className="lp-layout">
            <aside className="lp-sidebar">
              <div className="lp-sidebar-sticky">{renderFilterContent()}</div>
            </aside>

            <section className="lp-main">
              {/* Desktop Toolbar */}
              {(hasProducts || isInitialLoading) && (
                <div className="lp-toolbar">
                  <div className="lp-toolbar-left">
                    <span className="lp-toolbar-count">
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
                    {isFiltersActive && <span className="lp-toolbar-badge">Filtered</span>}
                  </div>
                  <div className="lp-toolbar-right">
                    <div className="lp-desktop-sort">
                      <button onClick={() => setShowSortDropdown(!showSortDropdown)} className="lp-desktop-sort-btn">
                        <Bars3BottomLeftIcon style={{ width: 14, height: 14 }} />
                        <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                        <ChevronDownIcon
                          style={{ width: 12, height: 12, transition: "transform 0.2s", transform: showSortDropdown ? "rotate(180deg)" : "none" }}
                        />
                      </button>
                      {showSortDropdown && (
                        <div className="lp-desktop-sort-drop">
                          {sortOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortBy(option.value);
                                setShowSortDropdown(false);
                                setCurrentPage(1);
                              }}
                              className={`lp-sort-option ${sortBy === option.value ? "lp-sort-option-active" : ""}`}
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
                <div className="lp-grid">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Products */}
              {!isInitialLoading && hasProducts && (
                <>
                  <div className="lp-grid">
                    {currentProducts.map((product) => {
                      const { productID, productName, productImage, price, oldPrice, stock } = product;
                      const isOnSale = oldPrice > 0 && oldPrice > price;
                      const discountPercent = isOnSale ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
                      const soldOut = stock === 0;
                      const inWishlist = isInWishlist(productID);

                      return (
                        <div key={productID} className="lp-card">
                          <div className="lp-card-img">
                            {soldOut && <span className="lp-card-badge lp-card-badge-sold">Sold Out</span>}
                            {isOnSale && !soldOut && (
                              <span className="lp-card-badge lp-card-badge-discount">-{discountPercent}%</span>
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

                            <div className="lp-card-overlay" onClick={() => navigate(`/product/${productID}`)}>
                              <Tooltip content={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}>
                                <button
                                  className="lp-card-action"
                                  onClick={(e) => { e.stopPropagation(); handleWishlistToggle(product); }}
                                >
                                  {inWishlist ? (
                                    <SolidHeartIcon style={{ width: 16, height: 16, color: "var(--lp-pink)" }} />
                                  ) : (
                                    <OutlineHeartIcon style={{ width: 16, height: 16, color: "var(--lp-mid)" }} />
                                  )}
                                </button>
                              </Tooltip>
                              <Tooltip content="View Details">
                                <button
                                  className="lp-card-action"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/product/${productID}`); }}
                                >
                                  <EyeIcon style={{ width: 16, height: 16, color: "var(--lp-green)" }} />
                                </button>
                              </Tooltip>
                              <Tooltip content={soldOut ? "Out of Stock" : "Add to Cart"}>
                                <button
                                  className="lp-card-action"
                                  onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                                  disabled={cartLoading || soldOut}
                                >
                                  <ShoppingCartIcon style={{ width: 16, height: 16, color: "var(--lp-green-mid)" }} />
                                </button>
                              </Tooltip>
                            </div>
                          </div>

                          <div className="lp-card-body">
                            <div className="lp-card-name">{productName}</div>
                            <div className="lp-card-price">{formatPrice(price)}</div>
                            {oldPrice > 0 && <div className="lp-card-old-price">{formatPrice(oldPrice)}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="lp-pagination">
                      <CircularPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {trulyEmpty && (
                <div className="lp-empty">
                  <div className="lp-empty-icon-wrap">
                    <MagnifyingGlassIcon style={{ width: 32, height: 32, color: "var(--lp-light)" }} />
                  </div>
                  <div className="lp-empty-title">
                    {isFiltersActive ? "No matching laptops" : "No laptops available"}
                  </div>
                  <div className="lp-empty-desc">
                    {isFiltersActive
                      ? "Try adjusting your price range, brand, or filters to find what you're looking for."
                      : "We don't have any laptops available at the moment. Please check back later or explore other categories."}
                  </div>
                  <div className="lp-empty-actions">
                    {isFiltersActive && (
                      <button onClick={resetFilters} className="lp-empty-reset">
                        Clear Filters
                      </button>
                    )}
                    <button onClick={() => navigate("/")} className="lp-empty-browse">
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

export default Laptops;