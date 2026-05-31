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

const categoryId = "2cf502a2-e621-4ed1-9bd5-6cebc165d6fe";

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

  const bgClass = type === "success" ? "wm-notif-success" : "wm-notif-error";
  const Icon = type === "success" ? CheckCircleIcon : XCircleIcon;

  return (
    <div className="fixed top-4 right-4 z-50 wm-animate-slide-in">
      <div className={`wm-notif ${bgClass}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="wm-notif-text">{message}</span>
        <button onClick={onClose} className="wm-notif-close">
          ×
        </button>
      </div>
    </div>
  );
};

// ==================== SKELETON ====================

const SkeletonCard = () => (
  <div className="wm-skeleton">
    <div className="wm-skeleton-img" />
    <div style={{ padding: "10px 12px" }}>
      <div
        className="wm-skeleton-line"
        style={{
          width: "80%",
          marginBottom: 8,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      />
      <div
        className="wm-skeleton-line"
        style={{
          width: "50%",
          height: 8,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      />
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

const Combo = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { productsByCategory = {}, loading } = useSelector(
    (state) => state.products
  );
  const wishlist = useSelector((state) => state.wishlist.items || []);
  const { addProductToCart, loading: cartLoading } = useAddToCart();

  const [inputPriceRange, setInputPriceRange] = useState({
    min: 0,
    max: 200000,
  });
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
    return Array.from(
      new Set(products.map((product) => product.brandName))
    ).sort();
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
        return sorted.sort(
          (a, b) => new Date(a.dateCreated) - new Date(b.dateCreated)
        );
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price);
      case "name-az":
        return sorted.sort((a, b) =>
          a.productName.localeCompare(b.productName)
        );
      case "name-za":
        return sorted.sort((a, b) =>
          b.productName.localeCompare(a.productName)
        );
      default:
        return sorted.sort(
          (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
        );
    }
  };

  const filteredProducts = sortProducts(
    products.filter((p) => {
      const withinRange =
        p.price >= appliedPriceRange[0] && p.price <= appliedPriceRange[1];
      const hasDiscount = showDiscountedOnly
        ? (p.oldPrice || 0) > p.price
        : true;
      const matchesBrand = selectedBrand
        ? p.brandName === selectedBrand
        : true;
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
    <div className="wm-filter-content">
      <div className="hidden wm-filter-header wm-desktop-only">
        <AdjustmentsHorizontalIcon
          style={{ width: 18, height: 18, color: "var(--wm-green)" }}
        />
        <span className="wm-filter-header-text">Filters</span>
      </div>

      {/* Price Range */}
      <div className="wm-filter-section">
        <div className="wm-filter-section-title">
          <div
            className="wm-dot"
            style={{ background: "var(--wm-green-accent)" }}
          />
          <span>Price Range</span>
        </div>
        <div className="wm-price-inputs">
          <div className="wm-price-field">
            <label className="wm-price-label">Min</label>
            <div className="wm-price-input-wrap">
              <span className="wm-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.min}
                onChange={(e) =>
                  setInputPriceRange((prev) => ({
                    ...prev,
                    min: +e.target.value,
                  }))
                }
                className="wm-price-input"
                placeholder="0"
              />
            </div>
          </div>
          <div className="wm-price-field">
            <label className="wm-price-label">Max</label>
            <div className="wm-price-input-wrap">
              <span className="wm-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.max}
                onChange={(e) =>
                  setInputPriceRange((prev) => ({
                    ...prev,
                    max: +e.target.value,
                  }))
                }
                className="wm-price-input"
                placeholder="200000"
              />
            </div>
          </div>
        </div>
        <button onClick={applyPriceFilter} className="wm-apply-btn">
          Apply Price Filter
        </button>
        <div className="wm-applied-range">
          <span className="wm-applied-label">Active:</span>
          <span className="wm-applied-value">
            ₵{appliedPriceRange[0].toLocaleString()} – ₵
            {appliedPriceRange[1].toLocaleString()}
          </span>
        </div>
      </div>

      {/* Discount Toggle */}
      <div className="wm-filter-section wm-discount-section">
        <div className="wm-discount-row">
          <div className="wm-discount-info">
            <div className="wm-discount-icon">
              <TagIcon style={{ width: 14, height: 14, color: "#fff" }} />
            </div>
            <span className="wm-discount-label">Discounted Only</span>
          </div>
          <div
            onClick={() => setShowDiscountedOnly(!showDiscountedOnly)}
            className={`wm-toggle ${showDiscountedOnly ? "wm-toggle-on" : ""}`}
          >
            <div className="wm-toggle-knob" />
          </div>
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div className="wm-filter-section">
          <div className="wm-filter-section-title">
            <div
              className="wm-dot"
              style={{ background: "var(--wm-green)" }}
            />
            <span>Brands</span>
          </div>
          <div className="wm-brand-tags">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => {
                  setSelectedBrand(
                    selectedBrand === brand ? null : brand
                  );
                  setCurrentPage(1);
                }}
                className={`wm-brand-tag ${
                  selectedBrand === brand ? "wm-brand-tag-active" : ""
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {isFiltersActive && (
        <button onClick={resetFilters} className="wm-reset-btn">
          Reset All Filters
        </button>
      )}
    </div>
  );

  // ==================== DETERMINE WHAT TO SHOW ====================

  const isInitialLoading = loading && !hasLoadedOnce;
  const hasProducts = currentProducts.length > 0;
  const trulyEmpty =
    hasLoadedOnce && !loading && filteredProducts.length === 0;

  // ==================== RENDER ====================

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700;800;900&display=swap');

        :root {
          --wm-font: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          --wm-green: #14532d;
          --wm-green-mid: #166534;
          --wm-green-light: #dcfce7;
          --wm-green-lighter: #f0fdf4;
          --wm-green-accent: #22c55e;
          --wm-dark: #1a1a1a;
          --wm-mid: #555;
          --wm-light: #888;
          --wm-border: #e0e0e0;
          --wm-bg-subtle: #f7f7f7;
          --wm-red: #dc2626;
          --wm-pink: #e11d48;
          --wm-radius: 4px;
        }

        .wm-root, .wm-root * {
          font-family: var(--wm-font);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          box-sizing: border-box;
        }

        .wm-desktop-only { display: none; }
        @media (min-width: 1024px) { .wm-desktop-only { display: flex; } }

        /* ==================== NOTIFICATION ==================== */

        .wm-notif {
          display: flex; align-items: center; gap: 10px; padding: 12px 16px;
          border-radius: var(--wm-radius); min-width: 280px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .wm-notif-success { background: var(--wm-green); color: #fff; }
        .wm-notif-error { background: var(--wm-red); color: #fff; }
        .wm-notif-text { font-size: 14px; font-weight: 500; flex: 1; }
        .wm-notif-close {
          background: transparent; border: none; color: rgba(255,255,255,0.8);
          font-size: 18px; cursor: pointer; padding: 0; line-height: 1;
        }
        .wm-notif-close:hover { color: #fff; }

        @keyframes wm-slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .wm-animate-slide-in { animation: wm-slide-in-right 0.3s ease-out; }

        /* ==================== PAGE HEADER ==================== */

        .wm-page-header {
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 20px; padding-bottom: 16px;
          border-bottom: 1px solid var(--wm-border);
        }
        .wm-page-header-accent {
          width: 4px; height: 28px; border-radius: 2px;
          background: var(--wm-green); flex-shrink: 0;
        }
        .wm-page-title {
          font-size: 20px; font-weight: 800; color: var(--wm-dark);
          letter-spacing: -0.02em; line-height: 1.2; margin: 0;
        }
        @media (min-width: 768px) { .wm-page-title { font-size: 24px; } }
        .wm-page-count {
          font-size: 13px; font-weight: 500; color: var(--wm-light); margin-top: 2px;
        }
        .wm-page-header-line {
          flex: 1; height: 1px; background: var(--wm-border); display: none;
        }
        @media (min-width: 768px) { .wm-page-header-line { display: block; } }

        /* ==================== MOBILE CONTROLS ==================== */

        .wm-mobile-controls { display: flex; gap: 8px; margin-bottom: 16px; }
        @media (min-width: 1024px) { .wm-mobile-controls { display: none; } }

        .wm-filter-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: var(--wm-green); color: #fff;
          border: none; border-radius: var(--wm-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--wm-font);
        }
        .wm-filter-trigger:active { transform: scale(0.98); }

        .wm-sort-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: #fff; color: var(--wm-mid);
          border: 1px solid var(--wm-border); border-radius: var(--wm-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--wm-font); position: relative;
        }
        .wm-sort-trigger:active { transform: scale(0.98); }

        /* ==================== SORT DROPDOWN ==================== */

        .wm-sort-drop {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: #fff; border: 1px solid var(--wm-border);
          border-radius: var(--wm-radius); box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          z-index: 50; overflow: hidden; animation: wm-fade 0.15s ease;
        }

        @keyframes wm-fade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .wm-sort-option {
          display: block; width: 100%; text-align: left; padding: 10px 14px;
          font-size: 13px; font-weight: 500; color: var(--wm-mid);
          background: none; border: none; cursor: pointer; transition: all 0.1s;
          font-family: var(--wm-font); border-bottom: 1px solid #f5f5f5;
        }
        .wm-sort-option:last-child { border-bottom: none; }
        .wm-sort-option:hover { background: var(--wm-bg-subtle); }
        .wm-sort-option-active {
          background: var(--wm-green-light) !important;
          color: var(--wm-green) !important; font-weight: 600 !important;
        }

        /* ==================== DESKTOP TOOLBAR ==================== */

        .wm-toolbar {
          display: none; align-items: center; justify-content: space-between;
          padding: 12px 16px; background: #fff; border: 1px solid var(--wm-border);
          border-radius: var(--wm-radius); margin-bottom: 16px;
        }
        @media (min-width: 768px) { .wm-toolbar { display: flex; } }

        .wm-toolbar-left { display: flex; align-items: center; gap: 12px; }
        .wm-toolbar-count { font-size: 13px; font-weight: 500; color: var(--wm-light); }
        .wm-toolbar-count strong { color: var(--wm-dark); font-weight: 700; }
        .wm-toolbar-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: var(--wm-green-light); color: var(--wm-green);
          font-size: 11px; font-weight: 700; padding: 3px 10px;
          border-radius: 100px; text-transform: uppercase; letter-spacing: 0.03em;
        }
        .wm-toolbar-right { display: flex; align-items: center; gap: 8px; }

        .wm-desktop-sort { position: relative; }
        .wm-desktop-sort-btn {
          display: flex; align-items: center; gap: 6px; padding: 7px 14px;
          background: #fff; border: 1px solid var(--wm-border);
          border-radius: var(--wm-radius); font-size: 13px; font-weight: 500;
          color: var(--wm-mid); cursor: pointer; transition: all 0.15s;
          font-family: var(--wm-font);
        }
        .wm-desktop-sort-btn:hover {
          border-color: var(--wm-green-accent); color: var(--wm-dark);
        }
        .wm-desktop-sort-drop {
          position: absolute; top: calc(100% + 4px); right: 0; width: 200px;
          background: #fff; border: 1px solid var(--wm-border);
          border-radius: var(--wm-radius); box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          z-index: 50; overflow: hidden; animation: wm-fade 0.15s ease;
        }

        /* ==================== FILTER SIDEBAR ==================== */

        .wm-filter-content { display: flex; flex-direction: column; gap: 16px; }

        .wm-filter-header {
          display: flex; align-items: center; gap: 8px;
          padding-bottom: 12px; border-bottom: 1px solid var(--wm-border);
        }
        .wm-filter-header-text {
          font-size: 16px; font-weight: 800; color: var(--wm-dark); letter-spacing: -0.01em;
        }

        .wm-filter-section {
          padding: 16px; background: #fff; border: 1px solid var(--wm-border);
          border-radius: var(--wm-radius);
        }
        .wm-filter-section-title {
          display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
          font-size: 14px; font-weight: 700; color: var(--wm-dark);
        }
        .wm-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .wm-price-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .wm-price-field { display: flex; flex-direction: column; gap: 4px; }
        .wm-price-label {
          font-size: 11px; font-weight: 600; color: var(--wm-light);
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .wm-price-input-wrap { position: relative; display: flex; align-items: center; }
        .wm-price-symbol {
          position: absolute; left: 10px; font-size: 13px; font-weight: 600; color: var(--wm-light);
        }
        .wm-price-input {
          width: 100%; padding: 8px 10px 8px 24px; border: 1px solid var(--wm-border);
          border-radius: var(--wm-radius); font-size: 13px; font-weight: 500;
          color: var(--wm-dark); font-family: var(--wm-font);
          transition: border-color 0.15s; outline: none;
        }
        .wm-price-input:focus {
          border-color: var(--wm-green-accent);
          box-shadow: 0 0 0 2px rgba(34,197,94,0.1);
        }

        .wm-apply-btn {
          width: 100%; padding: 9px; background: var(--wm-green); color: #fff;
          border: none; border-radius: var(--wm-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background 0.15s;
          font-family: var(--wm-font); margin-bottom: 10px;
        }
        .wm-apply-btn:hover { background: var(--wm-green-mid); }
        .wm-apply-btn:active { transform: scale(0.98); }

        .wm-applied-range {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 10px; background: var(--wm-green-lighter);
          border: 1px solid #bbf7d0; border-radius: var(--wm-radius);
        }
        .wm-applied-label { font-size: 11px; font-weight: 600; color: var(--wm-green-mid); }
        .wm-applied-value { font-size: 12px; font-weight: 700; color: var(--wm-green); }

        .wm-discount-section { background: var(--wm-green-lighter); border-color: #bbf7d0; }
        .wm-discount-row { display: flex; align-items: center; justify-content: space-between; }
        .wm-discount-info { display: flex; align-items: center; gap: 10px; }
        .wm-discount-icon {
          width: 28px; height: 28px; border-radius: var(--wm-radius);
          background: var(--wm-green); display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .wm-discount-label { font-size: 13px; font-weight: 600; color: var(--wm-dark); }

        .wm-toggle {
          width: 40px; height: 22px; border-radius: 11px; background: #d1d5db;
          cursor: pointer; transition: background 0.2s; padding: 2px; flex-shrink: 0;
        }
        .wm-toggle-on { background: var(--wm-green) !important; }
        .wm-toggle-knob {
          width: 18px; height: 18px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15); transition: transform 0.2s;
        }
        .wm-toggle-on .wm-toggle-knob { transform: translateX(18px); }

        .wm-brand-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .wm-brand-tag {
          padding: 5px 12px; font-size: 12px; font-weight: 500; color: var(--wm-mid);
          background: var(--wm-bg-subtle); border: 1px solid var(--wm-border);
          border-radius: 100px; cursor: pointer; transition: all 0.15s;
          font-family: var(--wm-font); white-space: nowrap;
        }
        .wm-brand-tag:hover {
          border-color: var(--wm-green-accent); color: var(--wm-green);
          background: var(--wm-green-light);
        }
        .wm-brand-tag-active {
          background: var(--wm-green) !important; color: #fff !important;
          border-color: var(--wm-green) !important; font-weight: 600 !important;
        }

        .wm-reset-btn {
          width: 100%; padding: 9px; background: #fff; color: var(--wm-red);
          border: 1px solid #fecaca; border-radius: var(--wm-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--wm-font);
        }
        .wm-reset-btn:hover { background: #fef2f2; border-color: var(--wm-red); }
        .wm-reset-btn:active { transform: scale(0.98); }

        /* ==================== DRAWER ==================== */

        .wm-drawer-overlay {
          position: fixed; inset: 0; z-index: 100; display: flex;
          animation: wm-fade 0.2s ease;
        }
        .wm-drawer-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.4); }
        .wm-drawer-panel {
          position: relative; width: 100%; max-width: 320px; height: 100%;
          background: #fff; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow-y: auto; z-index: 1; animation: wm-slide-in 0.25s ease;
        }
        @keyframes wm-slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .wm-drawer-header {
          position: sticky; top: 0; background: #fff; display: flex;
          align-items: center; justify-content: space-between; padding: 14px 16px;
          border-bottom: 1px solid var(--wm-border); z-index: 2;
        }
        .wm-drawer-header-left { display: flex; align-items: center; gap: 8px; }
        .wm-drawer-header-title { font-size: 16px; font-weight: 800; color: var(--wm-dark); }
        .wm-drawer-close {
          width: 32px; height: 32px; display: flex; align-items: center;
          justify-content: center; border: 1px solid var(--wm-border);
          border-radius: var(--wm-radius); background: #fff; cursor: pointer;
          transition: background 0.12s;
        }
        .wm-drawer-close:active { background: #f5f5f5; }
        .wm-drawer-body { padding: 16px; }

        /* ==================== PRODUCT GRID ==================== */

        .wm-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
        }
        @media (min-width: 640px) { .wm-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .wm-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
        @media (min-width: 1280px) { .wm-grid { grid-template-columns: repeat(4, 1fr); } }

        /* ==================== CARDS ==================== */

        .wm-card {
          border: 1px solid var(--wm-border); border-radius: var(--wm-radius);
          overflow: hidden; background: #fff; transition: all 0.2s ease; cursor: pointer;
        }
        .wm-card:hover {
          border-color: var(--wm-green-accent);
          box-shadow: 0 4px 16px rgba(20, 83, 45, 0.08);
        }

        .wm-card-img {
          position: relative; height: 190px; display: flex; align-items: center;
          justify-content: center; padding: 10px; overflow: hidden;
        }
        @media (min-width: 768px) { .wm-card-img { height: 195px; } }

        .wm-card-img img {
          height: 100%; width: 100%; object-fit: contain; transition: transform 0.3s ease;
        }
        .wm-card:hover .wm-card-img img { transform: scale(1.05); }

        .wm-card-overlay {
          position: absolute; inset: 0; background: rgba(20, 83, 45, 0.45);
          display: none; align-items: center; justify-content: center; gap: 8px; z-index: 2;
        }
        .wm-card:hover .wm-card-overlay { display: flex; }

        .wm-card-action {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 50%; background: #fff;
          border: none; cursor: pointer; transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .wm-card-action:hover {
          transform: scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .wm-card-action:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .wm-card-body { padding: 10px 12px; text-align: center; }

        .wm-card-name {
          font-size: 15px; font-weight: 600; color: var(--wm-dark); line-height: 1.35;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; min-height: 35px;
        }

        .wm-card-price { font-size: 15px; font-weight: 900; color: var(--wm-red); margin-top: 2px; }

        .wm-card-old-price {
          font-size: 12px; font-weight: 400; color: var(--wm-light);
          text-decoration: line-through; margin-top: 2px;
        }

        .wm-card-badge {
          position: absolute; top: 8px; font-size: 9px; font-weight: 700;
          padding: 3px 8px; border-radius: 100px; z-index: 3;
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .wm-card-badge-sold { left: 8px; background: var(--wm-dark); color: #fff; }
        .wm-card-badge-discount {
          right: 8px; background: var(--wm-red); color: #fff;
          font-size: 10px; padding: 3px 7px;
        }

        /* ==================== SKELETON ==================== */

        .wm-skeleton {
          border: 1px solid #eee; border-radius: var(--wm-radius);
          overflow: hidden; background: #fff;
        }
        .wm-skeleton-img {
          height: 150px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: wm-shimmer 1.5s infinite;
        }
        @media (min-width: 768px) { .wm-skeleton-img { height: 195px; } }

        @keyframes wm-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .wm-skeleton-line {
          height: 10px; border-radius: 2px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: wm-shimmer 1.5s infinite;
        }

        /* ==================== EMPTY STATE ==================== */

        .wm-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center; padding: 60px 24px;
          background: #fff; border: 1px solid var(--wm-border);
          border-radius: var(--wm-radius); margin-top: 16px;
        }
        .wm-empty-icon-wrap {
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--wm-bg-subtle); display: flex; align-items: center;
          justify-content: center; margin-bottom: 20px;
          border: 1px solid var(--wm-border);
        }
        .wm-empty-title {
          font-size: 18px; font-weight: 700; color: var(--wm-dark); margin-bottom: 8px;
        }
        .wm-empty-desc {
          font-size: 14px; color: var(--wm-light); max-width: 360px;
          line-height: 1.6; margin-bottom: 24px;
        }
        .wm-empty-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; }
        .wm-empty-reset {
          padding: 10px 20px; background: var(--wm-green); color: #fff;
          border: none; border-radius: var(--wm-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background 0.15s;
          font-family: var(--wm-font);
        }
        .wm-empty-reset:hover { background: var(--wm-green-mid); }
        .wm-empty-browse {
          padding: 10px 20px; background: #fff; color: var(--wm-mid);
          border: 1px solid var(--wm-border); border-radius: var(--wm-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--wm-font); text-decoration: none;
        }
        .wm-empty-browse:hover { border-color: var(--wm-green-accent); color: var(--wm-dark); }

        /* ==================== LAYOUT ==================== */

        .wm-layout { display: flex; flex-direction: column; gap: 0; }
        @media (min-width: 1024px) { .wm-layout { flex-direction: row; gap: 24px; } }

        .wm-sidebar { display: none; width: 280px; flex-shrink: 0; }
        @media (min-width: 1024px) { .wm-sidebar { display: block; } }

        .wm-sidebar-sticky { position: sticky; top: 80px; }
        .wm-main { flex: 1; min-width: 0; }
        .wm-pagination { display: flex; justify-content: center; margin-top: 24px; }
      `}</style>

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="wm-root min-h-screen">
        <Helmet>
          <title>
            Washing Machines in Ghana | Best Prices & Brands – Franko Trading
          </title>
          <meta
            name="description"
            content="Find the best washing machine deals and discounts on your favorite products. Shop top brands at affordable prices with fast delivery across Ghana."
          />
          <meta
            name="keywords"
            content="Washing Machines, Buy Washing Machine Online, Best Washing Machine Brands Ghana, Affordable Washing Machines"
          />
          <meta
            property="og:title"
            content="Washing Machines in Ghana | Best Prices & Brands – Franko Trading"
          />
          <meta
            property="og:description"
            content="Get amazing discounts on our exclusive washing machine deals."
          />
          <meta property="og:type" content="product.group" />
          <meta
            property="og:url"
            content="https://www.frankotrading.com/washing-machine"
          />
          <meta
            property="og:image"
            content={
              filteredProducts.length > 0
                ? `https://testing.frankotrading.com/Media/Products_Images/${filteredProducts[0].productImage.split("\\").pop()}`
                : "default-image-url"
            }
          />
          <meta name="twitter:card" content="summary_large_image" />
          <meta
            name="twitter:title"
            content="Washing Machines in Ghana | Best Prices – Franko Trading"
          />
          <meta
            name="twitter:description"
            content="Get amazing discounts on our washing machines."
          />
          <meta
            name="twitter:image"
            content={
              filteredProducts.length > 0
                ? `https://testing.frankotrading.com/Media/Products_Images/${filteredProducts[0].productImage.split("\\").pop()}`
                : "default-image-url"
            }
          />
          <link
            rel="canonical"
            href="https://www.frankotrading.com/washing-machine"
          />
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "Washing Machines",
              description:
                "Shop high-quality washing machines from top brands at Franko Trading.",
              url: "https://www.frankotrading.com/washing-machine",
              itemListElement: filteredProducts.map((item, index) => ({
                "@type": "Product",
                position: index + 1,
                name: item.productName,
                image: `https://testing.frankotrading.com/Media/Products_Images/${item.productImage.split("\\").pop()}`,
                description: item.description,
                sku: item.productID,
                brand: {
                  "@type": "Brand",
                  name: item.brandName,
                },
                offers: {
                  "@type": "Offer",
                  priceCurrency: "GHS",
                  price: item.price,
                  priceValidUntil: "2025-12-31",
                  itemCondition: "https://schema.org/NewCondition",
                  availability: "https://schema.org/InStock",
                  url: `https://www.frankotrading.com/product/${item.productID}`,
                  seller: {
                    "@type": "Organization",
                    name: "Franko Trading",
                  },
                  shippingDetails: {
                    "@type": "OfferShippingDetails",
                    shippingRate: {
                      "@type": "MonetaryAmount",
                      currency: "GHS",
                      value: "30.00",
                    },
                    shippingDestination: {
                      "@type": "DefinedRegion",
                      addressCountry: "GH",
                    },
                    deliveryTime: {
                      "@type": "ShippingDeliveryTime",
                      handlingTime: {
                        "@type": "QuantitativeValue",
                        minValue: 1,
                        maxValue: 2,
                        unitCode: "DAY",
                      },
                      transitTime: {
                        "@type": "QuantitativeValue",
                        minValue: 3,
                        maxValue: 5,
                        unitCode: "DAY",
                      },
                    },
                  },
                  hasMerchantReturnPolicy: {
                    "@type": "MerchantReturnPolicy",
                    returnPolicyCategory:
                      "https://schema.org/MerchantReturnFiniteReturnWindow",
                    merchantReturnDays: 14,
                    returnMethod: "https://schema.org/ReturnByMail",
                    returnFees: "https://schema.org/FreeReturn",
                    applicableCountry: "GH",
                  },
                },
              })),
            })}
          </script>
        </Helmet>

        <div className="px-4 md:px-16 py-6">
          {/* Page Header */}
          <div className="wm-page-header">
            <div className="wm-page-header-accent" />
            <div>
              <h1 className="wm-page-title">
                {selectedBrand
                  ? `${selectedBrand} Washing Machines`
                  : "Washing Machines"}
              </h1>
              <p className="wm-page-count">
                {isInitialLoading
                  ? "Loading products..."
                  : `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <div className="wm-page-header-line" />
          </div>

          {/* Mobile Controls */}
          <div className="wm-mobile-controls">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="wm-filter-trigger"
            >
              <FunnelIcon style={{ width: 16, height: 16 }} />
              <span>Filters</span>
              {isFiltersActive && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#fff",
                    marginLeft: 2,
                  }}
                />
              )}
            </button>
            <div
              className="wm-sort-trigger"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
            >
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
                <div className="wm-sort-drop">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                        setCurrentPage(1);
                      }}
                      className={`wm-sort-option ${sortBy === option.value ? "wm-sort-option-active" : ""}`}
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
            <div className="wm-drawer-overlay">
              <div
                className="wm-drawer-backdrop"
                onClick={() => setIsDrawerOpen(false)}
              />
              <div className="wm-drawer-panel">
                <div className="wm-drawer-header">
                  <div className="wm-drawer-header-left">
                    <AdjustmentsHorizontalIcon
                      style={{
                        width: 18,
                        height: 18,
                        color: "var(--wm-green)",
                      }}
                    />
                    <span className="wm-drawer-header-title">Filters</span>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="wm-drawer-close"
                  >
                    <XMarkIcon
                      style={{
                        width: 14,
                        height: 14,
                        color: "var(--wm-light)",
                      }}
                    />
                  </button>
                </div>
                <div className="wm-drawer-body">{renderFilterContent()}</div>
              </div>
            </div>
          )}

          {/* Layout */}
          <div className="wm-layout">
            <aside className="wm-sidebar">
              <div className="wm-sidebar-sticky">{renderFilterContent()}</div>
            </aside>

            <section className="wm-main">
              {/* Desktop Toolbar */}
              {(hasProducts || isInitialLoading) && (
                <div className="wm-toolbar">
                  <div className="wm-toolbar-left">
                    <span className="wm-toolbar-count">
                      {isInitialLoading ? (
                        "Loading..."
                      ) : (
                        <>
                          Showing{" "}
                          <strong>
                            {(currentPage - 1) * itemsPerPage + 1}
                          </strong>
                          –
                          <strong>
                            {Math.min(
                              currentPage * itemsPerPage,
                              filteredProducts.length
                            )}
                          </strong>{" "}
                          of <strong>{filteredProducts.length}</strong>
                        </>
                      )}
                    </span>
                    {isFiltersActive && (
                      <span className="wm-toolbar-badge">Filtered</span>
                    )}
                  </div>
                  <div className="wm-toolbar-right">
                    <div className="wm-desktop-sort">
                      <button
                        onClick={() =>
                          setShowSortDropdown(!showSortDropdown)
                        }
                        className="wm-desktop-sort-btn"
                      >
                        <Bars3BottomLeftIcon
                          style={{ width: 14, height: 14 }}
                        />
                        <span>
                          {
                            sortOptions.find((o) => o.value === sortBy)
                              ?.label
                          }
                        </span>
                        <ChevronDownIcon
                          style={{
                            width: 12,
                            height: 12,
                            transition: "transform 0.2s",
                            transform: showSortDropdown
                              ? "rotate(180deg)"
                              : "none",
                          }}
                        />
                      </button>
                      {showSortDropdown && (
                        <div className="wm-desktop-sort-drop">
                          {sortOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortBy(option.value);
                                setShowSortDropdown(false);
                                setCurrentPage(1);
                              }}
                              className={`wm-sort-option ${sortBy === option.value ? "wm-sort-option-active" : ""}`}
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
                <div className="wm-grid">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Products */}
              {!isInitialLoading && hasProducts && (
                <>
                  <div className="wm-grid">
                    {currentProducts.map((product) => {
                      const {
                        productID,
                        productName,
                        productImage,
                        price,
                        oldPrice,
                        stock,
                      } = product;
                      const isOnSale = oldPrice > 0 && oldPrice > price;
                      const discountPercent = isOnSale
                        ? Math.round(
                            ((oldPrice - price) / oldPrice) * 100
                          )
                        : 0;
                      const soldOut = stock === 0;
                      const inWishlist = isInWishlist(productID);

                      return (
                        <div key={productID} className="wm-card">
                          <div className="wm-card-img">
                            {soldOut && (
                              <span className="wm-card-badge wm-card-badge-sold">
                                Sold Out
                              </span>
                            )}
                            {isOnSale && !soldOut && (
                              <span className="wm-card-badge wm-card-badge-discount">
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
                              onClick={() =>
                                navigate(`/product/${productID}`)
                              }
                            >
                              <img
                                src={getValidImageUrl(productImage)}
                                alt={productName}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    "https://via.placeholder.com/150";
                                }}
                              />
                            </div>

                            <div
                              className="wm-card-overlay"
                              onClick={() =>
                                navigate(`/product/${productID}`)
                              }
                            >
                              <Tooltip
                                content={
                                  inWishlist
                                    ? "Remove from Wishlist"
                                    : "Add to Wishlist"
                                }
                              >
                                <button
                                  className="wm-card-action"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWishlistToggle(product);
                                  }}
                                >
                                  {inWishlist ? (
                                    <SolidHeartIcon
                                      style={{
                                        width: 16,
                                        height: 16,
                                        color: "var(--wm-pink)",
                                      }}
                                    />
                                  ) : (
                                    <OutlineHeartIcon
                                      style={{
                                        width: 16,
                                        height: 16,
                                        color: "var(--wm-mid)",
                                      }}
                                    />
                                  )}
                                </button>
                              </Tooltip>
                              <Tooltip content="View Details">
                                <button
                                  className="wm-card-action"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/product/${productID}`);
                                  }}
                                >
                                  <EyeIcon
                                    style={{
                                      width: 16,
                                      height: 16,
                                      color: "var(--wm-green)",
                                    }}
                                  />
                                </button>
                              </Tooltip>
                              <Tooltip
                                content={
                                  soldOut
                                    ? "Out of Stock"
                                    : "Add to Cart"
                                }
                              >
                                <button
                                  className="wm-card-action"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(product);
                                  }}
                                  disabled={cartLoading || soldOut}
                                >
                                  <ShoppingCartIcon
                                    style={{
                                      width: 16,
                                      height: 16,
                                      color: "var(--wm-green-mid)",
                                    }}
                                  />
                                </button>
                              </Tooltip>
                            </div>
                          </div>

                          <div className="wm-card-body">
                            <div className="wm-card-name">
                              {productName}
                            </div>
                            <div className="wm-card-price">
                              {formatPrice(price)}
                            </div>
                            {oldPrice > 0 && (
                              <div className="wm-card-old-price">
                                {formatPrice(oldPrice)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="wm-pagination">
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
                <div className="wm-empty">
                  <div className="wm-empty-icon-wrap">
                    <MagnifyingGlassIcon
                      style={{
                        width: 32,
                        height: 32,
                        color: "var(--wm-light)",
                      }}
                    />
                  </div>
                  <div className="wm-empty-title">
                    {isFiltersActive
                      ? "No matching washing machines"
                      : "No washing machines available"}
                  </div>
                  <div className="wm-empty-desc">
                    {isFiltersActive
                      ? "Try adjusting your price range, brand, or filters to find what you're looking for."
                      : "We don't have any washing machines available at the moment. Please check back later or explore other categories."}
                  </div>
                  <div className="wm-empty-actions">
                    {isFiltersActive && (
                      <button
                        onClick={resetFilters}
                        className="wm-empty-reset"
                      >
                        Clear Filters
                      </button>
                    )}
                    <button
                      onClick={() => navigate("/")}
                      className="wm-empty-browse"
                    >
                      Browse All Products
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {showSortDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowSortDropdown(false)}
          />
        )}
      </div>
    </>
  );
};

export default Combo;