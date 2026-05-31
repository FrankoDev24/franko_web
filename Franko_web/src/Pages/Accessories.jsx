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

const categoryId = "2cfdb823-bbfd-495b-84a5-b5508356c1f6";

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

  const bgClass = type === "success" ? "ac-notif-success" : "ac-notif-error";
  const Icon = type === "success" ? CheckCircleIcon : XCircleIcon;

  return (
    <div className="fixed top-4 right-4 z-50 ac-animate-slide-in">
      <div className={`ac-notif ${bgClass}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="ac-notif-text">{message}</span>
        <button onClick={onClose} className="ac-notif-close">×</button>
      </div>
    </div>
  );
};

// ==================== SKELETON ====================

const SkeletonCard = () => (
  <div className="ac-skeleton">
    <div className="ac-skeleton-img" />
    <div style={{ padding: "10px 12px" }}>
      <div className="ac-skeleton-line" style={{ width: "80%", marginBottom: 8, marginLeft: "auto", marginRight: "auto" }} />
      <div className="ac-skeleton-line" style={{ width: "50%", height: 8, marginLeft: "auto", marginRight: "auto" }} />
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

const Accessories = () => {
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
      ? `https://testing.frankotrading./Media/Products_Images/${imagePath.split("\\").pop()}`
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
    <div className="ac-filter-content">
      <div className="hidden ac-filter-header ac-desktop-only">
        <AdjustmentsHorizontalIcon style={{ width: 18, height: 18, color: "var(--ac-green)" }} />
        <span className="ac-filter-header-text">Filters</span>
      </div>

      <div className="ac-filter-section">
        <div className="ac-filter-section-title">
          <div className="ac-dot" style={{ background: "var(--ac-green-accent)" }} />
          <span>Price Range</span>
        </div>
        <div className="ac-price-inputs">
          <div className="ac-price-field">
            <label className="ac-price-label">Min</label>
            <div className="ac-price-input-wrap">
              <span className="ac-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.min}
                onChange={(e) => setInputPriceRange((prev) => ({ ...prev, min: +e.target.value }))}
                className="ac-price-input"
                placeholder="0"
              />
            </div>
          </div>
          <div className="ac-price-field">
            <label className="ac-price-label">Max</label>
            <div className="ac-price-input-wrap">
              <span className="ac-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.max}
                onChange={(e) => setInputPriceRange((prev) => ({ ...prev, max: +e.target.value }))}
                className="ac-price-input"
                placeholder="200000"
              />
            </div>
          </div>
        </div>
        <button onClick={applyPriceFilter} className="ac-apply-btn">
          Apply Price Filter
        </button>
        <div className="ac-applied-range">
          <span className="ac-applied-label">Active:</span>
          <span className="ac-applied-value">
            ₵{appliedPriceRange[0].toLocaleString()} – ₵{appliedPriceRange[1].toLocaleString()}
          </span>
        </div>
      </div>

      <div className="ac-filter-section ac-discount-section">
        <div className="ac-discount-row">
          <div className="ac-discount-info">
            <div className="ac-discount-icon">
              <TagIcon style={{ width: 14, height: 14, color: "#fff" }} />
            </div>
            <span className="ac-discount-label">Discounted Only</span>
          </div>
          <div
            onClick={() => setShowDiscountedOnly(!showDiscountedOnly)}
            className={`ac-toggle ${showDiscountedOnly ? "ac-toggle-on" : ""}`}
          >
            <div className="ac-toggle-knob" />
          </div>
        </div>
      </div>

      {brands.length > 0 && (
        <div className="ac-filter-section">
          <div className="ac-filter-section-title">
            <div className="ac-dot" style={{ background: "var(--ac-green)" }} />
            <span>Brands</span>
          </div>
          <div className="ac-brand-tags">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => {
                  setSelectedBrand(selectedBrand === brand ? null : brand);
                  setCurrentPage(1);
                }}
                className={`ac-brand-tag ${selectedBrand === brand ? "ac-brand-tag-active" : ""}`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {isFiltersActive && (
        <button onClick={resetFilters} className="ac-reset-btn">
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
          --ac-font: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          --ac-green: #14532d;
          --ac-green-mid: #166534;
          --ac-green-light: #dcfce7;
          --ac-green-lighter: #f0fdf4;
          --ac-green-accent: #22c55e;
          --ac-dark: #1a1a1a;
          --ac-mid: #555;
          --ac-light: #888;
          --ac-border: #e0e0e0;
          --ac-bg-subtle: #f7f7f7;
          --ac-red: #dc2626;
          --ac-pink: #e11d48;
          --ac-radius: 4px;
        }

        .ac-root, .ac-root * {
          font-family: var(--ac-font);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          box-sizing: border-box;
        }

        .ac-desktop-only { display: none; }
        @media (min-width: 1024px) { .ac-desktop-only { display: flex; } }

        .ac-notif {
          display: flex; align-items: center; gap: 10px; padding: 12px 16px;
          border-radius: var(--ac-radius); min-width: 280px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .ac-notif-success { background: var(--ac-green); color: #fff; }
        .ac-notif-error { background: var(--ac-red); color: #fff; }
        .ac-notif-text { font-size: 14px; font-weight: 500; flex: 1; }
        .ac-notif-close {
          background: transparent; border: none; color: rgba(255,255,255,0.8);
          font-size: 18px; cursor: pointer; padding: 0; line-height: 1;
        }
        .ac-notif-close:hover { color: #fff; }

        @keyframes ac-slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .ac-animate-slide-in { animation: ac-slide-in-right 0.3s ease-out; }

        .ac-page-header {
          display: flex; align-items: center; gap: 16px; margin-bottom: 20px;
          padding-bottom: 16px; border-bottom: 1px solid var(--ac-border);
        }
        .ac-page-header-accent {
          width: 4px; height: 28px; border-radius: 2px; background: var(--ac-green); flex-shrink: 0;
        }
        .ac-page-title {
          font-size: 20px; font-weight: 800; color: var(--ac-dark);
          letter-spacing: -0.02em; line-height: 1.2; margin: 0;
        }
        @media (min-width: 768px) { .ac-page-title { font-size: 24px; } }
        .ac-page-count { font-size: 13px; font-weight: 500; color: var(--ac-light); margin-top: 2px; }
        .ac-page-header-line { flex: 1; height: 1px; background: var(--ac-border); display: none; }
        @media (min-width: 768px) { .ac-page-header-line { display: block; } }

        .ac-mobile-controls { display: flex; gap: 8px; margin-bottom: 16px; }
        @media (min-width: 1024px) { .ac-mobile-controls { display: none; } }

        .ac-filter-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: var(--ac-green); color: #fff;
          border: none; border-radius: var(--ac-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: var(--ac-font);
        }
        .ac-filter-trigger:active { transform: scale(0.98); }

        .ac-sort-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: #fff; color: var(--ac-mid);
          border: 1px solid var(--ac-border); border-radius: var(--ac-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--ac-font); position: relative;
        }
        .ac-sort-trigger:active { transform: scale(0.98); }

        .ac-sort-drop {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: #fff; border: 1px solid var(--ac-border);
          border-radius: var(--ac-radius); box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          z-index: 50; overflow: hidden; animation: ac-fade 0.15s ease;
        }
        @keyframes ac-fade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ac-sort-option {
          display: block; width: 100%; text-align: left; padding: 10px 14px;
          font-size: 13px; font-weight: 500; color: var(--ac-mid);
          background: none; border: none; cursor: pointer; transition: all 0.1s;
          font-family: var(--ac-font); border-bottom: 1px solid #f5f5f5;
        }
        .ac-sort-option:last-child { border-bottom: none; }
        .ac-sort-option:hover { background: var(--ac-bg-subtle); }
        .ac-sort-option-active {
          background: var(--ac-green-light) !important;
          color: var(--ac-green) !important; font-weight: 600 !important;
        }

        .ac-toolbar {
          display: none; align-items: center; justify-content: space-between;
          padding: 12px 16px; background: #fff; border: 1px solid var(--ac-border);
          border-radius: var(--ac-radius); margin-bottom: 16px;
        }
        @media (min-width: 768px) { .ac-toolbar { display: flex; } }
        .ac-toolbar-left { display: flex; align-items: center; gap: 12px; }
        .ac-toolbar-count { font-size: 13px; font-weight: 500; color: var(--ac-light); }
        .ac-toolbar-count strong { color: var(--ac-dark); font-weight: 700; }
        .ac-toolbar-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: var(--ac-green-light); color: var(--ac-green);
          font-size: 11px; font-weight: 700; padding: 3px 10px;
          border-radius: 100px; text-transform: uppercase; letter-spacing: 0.03em;
        }
        .ac-toolbar-right { display: flex; align-items: center; gap: 8px; }
        .ac-desktop-sort { position: relative; }
        .ac-desktop-sort-btn {
          display: flex; align-items: center; gap: 6px; padding: 7px 14px;
          background: #fff; border: 1px solid var(--ac-border);
          border-radius: var(--ac-radius); font-size: 13px; font-weight: 500;
          color: var(--ac-mid); cursor: pointer; transition: all 0.15s; font-family: var(--ac-font);
        }
        .ac-desktop-sort-btn:hover { border-color: var(--ac-green-accent); color: var(--ac-dark); }
        .ac-desktop-sort-drop {
          position: absolute; top: calc(100% + 4px); right: 0; width: 200px;
          background: #fff; border: 1px solid var(--ac-border);
          border-radius: var(--ac-radius); box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          z-index: 50; overflow: hidden; animation: ac-fade 0.15s ease;
        }

        .ac-filter-content { display: flex; flex-direction: column; gap: 16px; }
        .ac-filter-header {
          display: flex; align-items: center; gap: 8px;
          padding-bottom: 12px; border-bottom: 1px solid var(--ac-border);
        }
        .ac-filter-header-text { font-size: 16px; font-weight: 800; color: var(--ac-dark); letter-spacing: -0.01em; }
        .ac-filter-section {
          padding: 16px; background: #fff; border: 1px solid var(--ac-border); border-radius: var(--ac-radius);
        }
        .ac-filter-section-title {
          display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
          font-size: 14px; font-weight: 700; color: var(--ac-dark);
        }
        .ac-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .ac-price-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .ac-price-field { display: flex; flex-direction: column; gap: 4px; }
        .ac-price-label {
          font-size: 11px; font-weight: 600; color: var(--ac-light);
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .ac-price-input-wrap { position: relative; display: flex; align-items: center; }
        .ac-price-symbol { position: absolute; left: 10px; font-size: 13px; font-weight: 600; color: var(--ac-light); }
        .ac-price-input {
          width: 100%; padding: 8px 10px 8px 24px; border: 1px solid var(--ac-border);
          border-radius: var(--ac-radius); font-size: 13px; font-weight: 500;
          color: var(--ac-dark); font-family: var(--ac-font); transition: border-color 0.15s; outline: none;
        }
        .ac-price-input:focus { border-color: var(--ac-green-accent); box-shadow: 0 0 0 2px rgba(34,197,94,0.1); }
        .ac-apply-btn {
          width: 100%; padding: 9px; background: var(--ac-green); color: #fff;
          border: none; border-radius: var(--ac-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background 0.15s;
          font-family: var(--ac-font); margin-bottom: 10px;
        }
        .ac-apply-btn:hover { background: var(--ac-green-mid); }
        .ac-apply-btn:active { transform: scale(0.98); }
        .ac-applied-range {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 10px; background: var(--ac-green-lighter);
          border: 1px solid #bbf7d0; border-radius: var(--ac-radius);
        }
        .ac-applied-label { font-size: 11px; font-weight: 600; color: var(--ac-green-mid); }
        .ac-applied-value { font-size: 12px; font-weight: 700; color: var(--ac-green); }

        .ac-discount-section { background: var(--ac-green-lighter); border-color: #bbf7d0; }
        .ac-discount-row { display: flex; align-items: center; justify-content: space-between; }
        .ac-discount-info { display: flex; align-items: center; gap: 10px; }
        .ac-discount-icon {
          width: 28px; height: 28px; border-radius: var(--ac-radius);
          background: var(--ac-green); display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .ac-discount-label { font-size: 13px; font-weight: 600; color: var(--ac-dark); }
        .ac-toggle {
          width: 40px; height: 22px; border-radius: 11px; background: #d1d5db;
          cursor: pointer; transition: background 0.2s; padding: 2px; flex-shrink: 0;
        }
        .ac-toggle-on { background: var(--ac-green) !important; }
        .ac-toggle-knob {
          width: 18px; height: 18px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15); transition: transform 0.2s;
        }
        .ac-toggle-on .ac-toggle-knob { transform: translateX(18px); }

        .ac-brand-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .ac-brand-tag {
          padding: 5px 12px; font-size: 12px; font-weight: 500; color: var(--ac-mid);
          background: var(--ac-bg-subtle); border: 1px solid var(--ac-border);
          border-radius: 100px; cursor: pointer; transition: all 0.15s;
          font-family: var(--ac-font); white-space: nowrap;
        }
        .ac-brand-tag:hover {
          border-color: var(--ac-green-accent); color: var(--ac-green); background: var(--ac-green-light);
        }
        .ac-brand-tag-active {
          background: var(--ac-green) !important; color: #fff !important;
          border-color: var(--ac-green) !important; font-weight: 600 !important;
        }
        .ac-reset-btn {
          width: 100%; padding: 9px; background: #fff; color: var(--ac-red);
          border: 1px solid #fecaca; border-radius: var(--ac-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--ac-font);
        }
        .ac-reset-btn:hover { background: #fef2f2; border-color: var(--ac-red); }
        .ac-reset-btn:active { transform: scale(0.98); }

        .ac-drawer-overlay {
          position: fixed; inset: 0; z-index: 100; display: flex; animation: ac-fade 0.2s ease;
        }
        .ac-drawer-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.4); }
        .ac-drawer-panel {
          position: relative; width: 100%; max-width: 320px; height: 100%;
          background: #fff; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow-y: auto; z-index: 1; animation: ac-slide-in 0.25s ease;
        }
        @keyframes ac-slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .ac-drawer-header {
          position: sticky; top: 0; background: #fff; display: flex;
          align-items: center; justify-content: space-between; padding: 14px 16px;
          border-bottom: 1px solid var(--ac-border); z-index: 2;
        }
        .ac-drawer-header-left { display: flex; align-items: center; gap: 8px; }
        .ac-drawer-header-title { font-size: 16px; font-weight: 800; color: var(--ac-dark); }
        .ac-drawer-close {
          width: 32px; height: 32px; display: flex; align-items: center;
          justify-content: center; border: 1px solid var(--ac-border);
          border-radius: var(--ac-radius); background: #fff; cursor: pointer; transition: background 0.12s;
        }
        .ac-drawer-close:active { background: #f5f5f5; }
        .ac-drawer-body { padding: 16px; }

        .ac-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (min-width: 640px) { .ac-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .ac-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
        @media (min-width: 1280px) { .ac-grid { grid-template-columns: repeat(4, 1fr); } }

        .ac-card {
          border: 1px solid var(--ac-border); border-radius: var(--ac-radius);
          overflow: hidden; background: #fff; transition: all 0.2s ease; cursor: pointer;
        }
        .ac-card:hover {
          border-color: var(--ac-green-accent); box-shadow: 0 4px 16px rgba(20, 83, 45, 0.08);
        }
        .ac-card-img {
          position: relative; height: 190px; display: flex; align-items: center;
          justify-content: center; padding: 10px; overflow: hidden;
        }
        @media (min-width: 768px) { .ac-card-img { height: 195px; } }
        .ac-card-img img {
          height: 100%; width: 100%; object-fit: contain; transition: transform 0.3s ease;
        }
        .ac-card:hover .ac-card-img img { transform: scale(1.05); }
        .ac-card-overlay {
          position: absolute; inset: 0; background: rgba(20, 83, 45, 0.45);
          display: none; align-items: center; justify-content: center; gap: 8px; z-index: 2;
        }
        .ac-card:hover .ac-card-overlay { display: flex; }
        .ac-card-action {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 50%; background: #fff;
          border: none; cursor: pointer; transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .ac-card-action:hover { transform: scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .ac-card-action:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .ac-card-body { padding: 10px 12px; text-align: center; }
        .ac-card-name {
          font-size: 15px; font-weight: 600; color: var(--ac-dark); line-height: 1.35;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; min-height: 35px;
        }
        .ac-card-price { font-size: 15px; font-weight: 900; color: var(--ac-red); margin-top: 2px; }
        .ac-card-old-price {
          font-size: 12px; font-weight: 400; color: var(--ac-light);
          text-decoration: line-through; margin-top: 2px;
        }
        .ac-card-badge {
          position: absolute; top: 8px; font-size: 9px; font-weight: 700;
          padding: 3px 8px; border-radius: 100px; z-index: 3;
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .ac-card-badge-sold { left: 8px; background: var(--ac-dark); color: #fff; }
        .ac-card-badge-discount {
          right: 8px; background: var(--ac-red); color: #fff; font-size: 10px; padding: 3px 7px;
        }

        .ac-skeleton {
          border: 1px solid #eee; border-radius: var(--ac-radius); overflow: hidden; background: #fff;
        }
        .ac-skeleton-img {
          height: 150px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: ac-shimmer 1.5s infinite;
        }
        @media (min-width: 768px) { .ac-skeleton-img { height: 195px; } }
        @keyframes ac-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .ac-skeleton-line {
          height: 10px; border-radius: 2px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: ac-shimmer 1.5s infinite;
        }

        .ac-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center; padding: 60px 24px;
          background: #fff; border: 1px solid var(--ac-border);
          border-radius: var(--ac-radius); margin-top: 16px;
        }
        .ac-empty-icon-wrap {
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--ac-bg-subtle); display: flex; align-items: center;
          justify-content: center; margin-bottom: 20px; border: 1px solid var(--ac-border);
        }
        .ac-empty-title { font-size: 18px; font-weight: 700; color: var(--ac-dark); margin-bottom: 8px; }
        .ac-empty-desc {
          font-size: 14px; color: var(--ac-light); max-width: 360px; line-height: 1.6; margin-bottom: 24px;
        }
        .ac-empty-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; }
        .ac-empty-reset {
          padding: 10px 20px; background: var(--ac-green); color: #fff;
          border: none; border-radius: var(--ac-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: var(--ac-font);
        }
        .ac-empty-reset:hover { background: var(--ac-green-mid); }
        .ac-empty-browse {
          padding: 10px 20px; background: #fff; color: var(--ac-mid);
          border: 1px solid var(--ac-border); border-radius: var(--ac-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--ac-font); text-decoration: none;
        }
        .ac-empty-browse:hover { border-color: var(--ac-green-accent); color: var(--ac-dark); }

        .ac-layout { display: flex; flex-direction: column; gap: 0; }
        @media (min-width: 1024px) { .ac-layout { flex-direction: row; gap: 24px; } }
        .ac-sidebar { display: none; width: 280px; flex-shrink: 0; }
        @media (min-width: 1024px) { .ac-sidebar { display: block; } }
        .ac-sidebar-sticky { position: sticky; top: 80px; }
        .ac-main { flex: 1; min-width: 0; }
        .ac-pagination { display: flex; justify-content: center; margin-top: 24px; }
      `}</style>

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="ac-root min-h-screen">
        <Helmet>
          <title>Accessories - Shop the Best Products</title>
          <meta name="description" content="Find high-quality accessories at the best prices. Shop now!" />
          <meta property="og:title" content="Accessories - Shop the Best Products" />
          <meta property="og:description" content="Find high-quality accessories at the best prices. Shop now!" />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://www.frankotrading.com/accessories" />
          <meta property="og:image" content={filteredProducts.length > 0 ? `https://testing.frankotrading./Media/Products_Images/${filteredProducts[0].productImage.split("\\").pop()}` : "default-image-url"} />
          <meta property="og:site_name" content="Franko Trading" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Accessories - Shop the Best Products" />
          <meta name="twitter:description" content="Find high-quality accessories at the best prices. Shop now!" />
          <meta name="twitter:image" content={filteredProducts.length > 0 ? `https://testing.frankotrading./Media/Products_Images/${filteredProducts[0].productImage.split("\\").pop()}` : "default-image-url"} />
          <link rel="canonical" href="https://www.frankotrading.com/accessories" />
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "Accessories",
              "description": "Find high-quality accessories at the best prices.",
              "url": "https://www.frankotrading.com/accessories",
              "itemListElement": filteredProducts.map((item, index) => ({
                "@type": "Product",
                "position": index + 1,
                "name": item.productName,
                "image": `https://testing.frankotrading.com/Media/Products_Images/${item.productImage.split("\\").pop()}`,
                "description": item.description,
                "brand": { "@type": "Brand", "name": item.brandName },
                "sku": item.productID,
                "offers": {
                  "@type": "Offer",
                  "priceCurrency": "GHS",
                  "price": item.price,
                  "priceValidUntil": "2025-12-31",
                  "itemCondition": "https://schema.org/NewCondition",
                  "availability": "https://schema.org/InStock",
                  "url": `https://www.frankotrading.com/product/${item.productID}`,
                  "seller": { "@type": "Organization", "name": "Franko Trading" },
                  "shippingDetails": {
                    "@type": "OfferShippingDetails",
                    "shippingRate": { "@type": "MonetaryAmount", "currency": "GHS", "value": "30.00" },
                    "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "GH" },
                    "deliveryTime": {
                      "@type": "ShippingDeliveryTime",
                      "handlingTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 2, "unitCode": "DAY" },
                      "transitTime": { "@type": "QuantitativeValue", "minValue": 3, "maxValue": 5, "unitCode": "DAY" }
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
          <div className="ac-page-header">
            <div className="ac-page-header-accent" />
            <div>
              <h1 className="ac-page-title">
                {selectedBrand ? `${selectedBrand} Accessories` : "Accessories"}
              </h1>
              <p className="ac-page-count">
                {isInitialLoading
                  ? "Loading products..."
                  : `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <div className="ac-page-header-line" />
          </div>

          {/* Mobile Controls */}
          <div className="ac-mobile-controls">
            <button onClick={() => setIsDrawerOpen(true)} className="ac-filter-trigger">
              <FunnelIcon style={{ width: 16, height: 16 }} />
              <span>Filters</span>
              {isFiltersActive && (
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", marginLeft: 2 }} />
              )}
            </button>
            <div className="ac-sort-trigger" onClick={() => setShowSortDropdown(!showSortDropdown)}>
              <Bars3BottomLeftIcon style={{ width: 16, height: 16 }} />
              <span>Sort</span>
              <ChevronDownIcon
                style={{ width: 14, height: 14, transition: "transform 0.2s", transform: showSortDropdown ? "rotate(180deg)" : "none" }}
              />
              {showSortDropdown && (
                <div className="ac-sort-drop">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                        setCurrentPage(1);
                      }}
                      className={`ac-sort-option ${sortBy === option.value ? "ac-sort-option-active" : ""}`}
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
            <div className="ac-drawer-overlay">
              <div className="ac-drawer-backdrop" onClick={() => setIsDrawerOpen(false)} />
              <div className="ac-drawer-panel">
                <div className="ac-drawer-header">
                  <div className="ac-drawer-header-left">
                    <AdjustmentsHorizontalIcon style={{ width: 18, height: 18, color: "var(--ac-green)" }} />
                    <span className="ac-drawer-header-title">Filters</span>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} className="ac-drawer-close">
                    <XMarkIcon style={{ width: 14, height: 14, color: "var(--ac-light)" }} />
                  </button>
                </div>
                <div className="ac-drawer-body">{renderFilterContent()}</div>
              </div>
            </div>
          )}

          {/* Layout */}
          <div className="ac-layout">
            <aside className="ac-sidebar">
              <div className="ac-sidebar-sticky">{renderFilterContent()}</div>
            </aside>

            <section className="ac-main">
              {/* Desktop Toolbar */}
              {(hasProducts || isInitialLoading) && (
                <div className="ac-toolbar">
                  <div className="ac-toolbar-left">
                    <span className="ac-toolbar-count">
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
                    {isFiltersActive && <span className="ac-toolbar-badge">Filtered</span>}
                  </div>
                  <div className="ac-toolbar-right">
                    <div className="ac-desktop-sort">
                      <button onClick={() => setShowSortDropdown(!showSortDropdown)} className="ac-desktop-sort-btn">
                        <Bars3BottomLeftIcon style={{ width: 14, height: 14 }} />
                        <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                        <ChevronDownIcon
                          style={{ width: 12, height: 12, transition: "transform 0.2s", transform: showSortDropdown ? "rotate(180deg)" : "none" }}
                        />
                      </button>
                      {showSortDropdown && (
                        <div className="ac-desktop-sort-drop">
                          {sortOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortBy(option.value);
                                setShowSortDropdown(false);
                                setCurrentPage(1);
                              }}
                              className={`ac-sort-option ${sortBy === option.value ? "ac-sort-option-active" : ""}`}
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

              {/* Loading State */}
              {isInitialLoading && (
                <div className="ac-grid">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Products */}
              {!isInitialLoading && hasProducts && (
                <>
                  <div className="ac-grid">
                    {currentProducts.map((product) => {
                      const { productID, productName, productImage, price, oldPrice, stock } = product;
                      const isOnSale = oldPrice > 0 && oldPrice > price;
                      const discountPercent = isOnSale ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
                      const soldOut = stock === 0;
                      const inWishlist = isInWishlist(productID);

                      return (
                        <div key={productID} className="ac-card">
                          <div className="ac-card-img">
                            {soldOut && <span className="ac-card-badge ac-card-badge-sold">Sold Out</span>}
                            {isOnSale && !soldOut && (
                              <span className="ac-card-badge ac-card-badge-discount">-{discountPercent}%</span>
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
                            <div className="ac-card-overlay" onClick={() => navigate(`/product/${productID}`)}>
                              <Tooltip content={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}>
                                <button
                                  className="ac-card-action"
                                  onClick={(e) => { e.stopPropagation(); handleWishlistToggle(product); }}
                                >
                                  {inWishlist ? (
                                    <SolidHeartIcon style={{ width: 16, height: 16, color: "var(--ac-pink)" }} />
                                  ) : (
                                    <OutlineHeartIcon style={{ width: 16, height: 16, color: "var(--ac-mid)" }} />
                                  )}
                                </button>
                              </Tooltip>
                              <Tooltip content="View Details">
                                <button
                                  className="ac-card-action"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/product/${productID}`); }}
                                >
                                  <EyeIcon style={{ width: 16, height: 16, color: "var(--ac-green)" }} />
                                </button>
                              </Tooltip>
                              <Tooltip content={soldOut ? "Out of Stock" : "Add to Cart"}>
                                <button
                                  className="ac-card-action"
                                  onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                                  disabled={cartLoading || soldOut}
                                >
                                  <ShoppingCartIcon style={{ width: 16, height: 16, color: "var(--ac-green-mid)" }} />
                                </button>
                              </Tooltip>
                            </div>
                          </div>
                          <div className="ac-card-body">
                            <div className="ac-card-name">{productName}</div>
                            <div className="ac-card-price">{formatPrice(price)}</div>
                            {oldPrice > 0 && <div className="ac-card-old-price">{formatPrice(oldPrice)}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {totalPages > 1 && (
                    <div className="ac-pagination">
                      <CircularPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {trulyEmpty && (
                <div className="ac-empty">
                  <div className="ac-empty-icon-wrap">
                    <MagnifyingGlassIcon style={{ width: 32, height: 32, color: "var(--ac-light)" }} />
                  </div>
                  <div className="ac-empty-title">
                    {isFiltersActive ? "No matching accessories" : "No accessories available"}
                  </div>
                  <div className="ac-empty-desc">
                    {isFiltersActive
                      ? "Try adjusting your price range, brand, or filters to find what you're looking for."
                      : "We don't have any accessories available at the moment. Please check back later or explore other categories."}
                  </div>
                  <div className="ac-empty-actions">
                    {isFiltersActive && (
                      <button onClick={resetFilters} className="ac-empty-reset">
                        Clear Filters
                      </button>
                    )}
                    <button onClick={() => navigate("/")} className="ac-empty-browse">
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

export default Accessories;