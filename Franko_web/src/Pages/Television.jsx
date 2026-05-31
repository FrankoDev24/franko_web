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

const categoryId = "b51e02c2-540a-484a-9307-392fac7b50ed";

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

  const bgClass = type === "success" ? "tv-notif-success" : "tv-notif-error";
  const Icon = type === "success" ? CheckCircleIcon : XCircleIcon;

  return (
    <div className="fixed top-4 right-4 z-50 tv-animate-slide-in">
      <div className={`tv-notif ${bgClass}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="tv-notif-text">{message}</span>
        <button onClick={onClose} className="tv-notif-close">×</button>
      </div>
    </div>
  );
};

// ==================== SKELETON ====================

const SkeletonCard = () => (
  <div className="tv-skeleton">
    <div className="tv-skeleton-img" />
    <div style={{ padding: "10px 12px" }}>
      <div className="tv-skeleton-line" style={{ width: "80%", marginBottom: 8, marginLeft: "auto", marginRight: "auto" }} />
      <div className="tv-skeleton-line" style={{ width: "50%", height: 8, marginLeft: "auto", marginRight: "auto" }} />
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

const Television = () => {
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
    <div className="tv-filter-content">
      <div className="hidden tv-filter-header tv-desktop-only">
        <AdjustmentsHorizontalIcon style={{ width: 18, height: 18, color: "var(--tv-green)" }} />
        <span className="tv-filter-header-text">Filters</span>
      </div>

      {/* Price Range */}
      <div className="tv-filter-section">
        <div className="tv-filter-section-title">
          <div className="tv-dot" style={{ background: "var(--tv-green-accent)" }} />
          <span>Price Range</span>
        </div>
        <div className="tv-price-inputs">
          <div className="tv-price-field">
            <label className="tv-price-label">Min</label>
            <div className="tv-price-input-wrap">
              <span className="tv-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.min}
                onChange={(e) => setInputPriceRange((prev) => ({ ...prev, min: +e.target.value }))}
                className="tv-price-input"
                placeholder="0"
              />
            </div>
          </div>
          <div className="tv-price-field">
            <label className="tv-price-label">Max</label>
            <div className="tv-price-input-wrap">
              <span className="tv-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.max}
                onChange={(e) => setInputPriceRange((prev) => ({ ...prev, max: +e.target.value }))}
                className="tv-price-input"
                placeholder="200000"
              />
            </div>
          </div>
        </div>
        <button onClick={applyPriceFilter} className="tv-apply-btn">
          Apply Price Filter
        </button>
        <div className="tv-applied-range">
          <span className="tv-applied-label">Active:</span>
          <span className="tv-applied-value">
            ₵{appliedPriceRange[0].toLocaleString()} – ₵{appliedPriceRange[1].toLocaleString()}
          </span>
        </div>
      </div>

      {/* Discount Toggle */}
      <div className="tv-filter-section tv-discount-section">
        <div className="tv-discount-row">
          <div className="tv-discount-info">
            <div className="tv-discount-icon">
              <TagIcon style={{ width: 14, height: 14, color: "#fff" }} />
            </div>
            <span className="tv-discount-label">Discounted Only</span>
          </div>
          <div
            onClick={() => setShowDiscountedOnly(!showDiscountedOnly)}
            className={`tv-toggle ${showDiscountedOnly ? "tv-toggle-on" : ""}`}
          >
            <div className="tv-toggle-knob" />
          </div>
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div className="tv-filter-section">
          <div className="tv-filter-section-title">
            <div className="tv-dot" style={{ background: "var(--tv-green)" }} />
            <span>Brands</span>
          </div>
          <div className="tv-brand-tags">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => {
                  setSelectedBrand(selectedBrand === brand ? null : brand);
                  setCurrentPage(1);
                }}
                className={`tv-brand-tag ${selectedBrand === brand ? "tv-brand-tag-active" : ""}`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {isFiltersActive && (
        <button onClick={resetFilters} className="tv-reset-btn">
          Reset All Filters
        </button>
      )}
    </div>
  );

  // ==================== DETERMINE WHAT TO SHOW ====================

  const isInitialLoading = loading && !hasLoadedOnce;
  const hasProducts = currentProducts.length > 0;
  const trulyEmpty = hasLoadedOnce && !loading && filteredProducts.length === 0;

  // ==================== STRUCTURED DATA ====================

  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "ItemList",
    "name": "Television Collection",
    "description": "Browse our latest collection of televisions with high-quality resolution and top brands.",
    "url": "https://www.frankotrading.com/television",
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
    })),
  };

  // ==================== RENDER ====================

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700;800;900&display=swap');

        :root {
          --tv-font: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          --tv-green: #14532d;
          --tv-green-mid: #166534;
          --tv-green-light: #dcfce7;
          --tv-green-lighter: #f0fdf4;
          --tv-green-accent: #22c55e;
          --tv-dark: #1a1a1a;
          --tv-mid: #555;
          --tv-light: #888;
          --tv-border: #e0e0e0;
          --tv-bg-subtle: #f7f7f7;
          --tv-red: #dc2626;
          --tv-pink: #e11d48;
          --tv-radius: 4px;
        }

        .tv-root, .tv-root * {
          font-family: var(--tv-font);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          box-sizing: border-box;
        }

        .tv-desktop-only { display: none; }
        @media (min-width: 1024px) { .tv-desktop-only { display: flex; } }

        .tv-notif {
          display: flex; align-items: center; gap: 10px; padding: 12px 16px;
          border-radius: var(--tv-radius); min-width: 280px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .tv-notif-success { background: var(--tv-green); color: #fff; }
        .tv-notif-error { background: var(--tv-red); color: #fff; }
        .tv-notif-text { font-size: 14px; font-weight: 500; flex: 1; }
        .tv-notif-close {
          background: transparent; border: none; color: rgba(255,255,255,0.8);
          font-size: 18px; cursor: pointer; padding: 0; line-height: 1;
        }
        .tv-notif-close:hover { color: #fff; }

        @keyframes tv-slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .tv-animate-slide-in { animation: tv-slide-in-right 0.3s ease-out; }

        .tv-page-header {
          display: flex; align-items: center; gap: 16px; margin-bottom: 20px;
          padding-bottom: 16px; border-bottom: 1px solid var(--tv-border);
        }
        .tv-page-header-accent {
          width: 4px; height: 28px; border-radius: 2px; background: var(--tv-green); flex-shrink: 0;
        }
        .tv-page-title {
          font-size: 20px; font-weight: 800; color: var(--tv-dark);
          letter-spacing: -0.02em; line-height: 1.2; margin: 0;
        }
        @media (min-width: 768px) { .tv-page-title { font-size: 24px; } }
        .tv-page-count { font-size: 13px; font-weight: 500; color: var(--tv-light); margin-top: 2px; }
        .tv-page-header-line { flex: 1; height: 1px; background: var(--tv-border); display: none; }
        @media (min-width: 768px) { .tv-page-header-line { display: block; } }

        .tv-mobile-controls { display: flex; gap: 8px; margin-bottom: 16px; }
        @media (min-width: 1024px) { .tv-mobile-controls { display: none; } }

        .tv-filter-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: var(--tv-green); color: #fff;
          border: none; border-radius: var(--tv-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: var(--tv-font);
        }
        .tv-filter-trigger:active { transform: scale(0.98); }

        .tv-sort-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: #fff; color: var(--tv-mid);
          border: 1px solid var(--tv-border); border-radius: var(--tv-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--tv-font); position: relative;
        }
        .tv-sort-trigger:active { transform: scale(0.98); }

        .tv-sort-drop {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: #fff; border: 1px solid var(--tv-border);
          border-radius: var(--tv-radius); box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          z-index: 50; overflow: hidden; animation: tv-fade 0.15s ease;
        }
        @keyframes tv-fade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tv-sort-option {
          display: block; width: 100%; text-align: left; padding: 10px 14px;
          font-size: 13px; font-weight: 500; color: var(--tv-mid);
          background: none; border: none; cursor: pointer; transition: all 0.1s;
          font-family: var(--tv-font); border-bottom: 1px solid #f5f5f5;
        }
        .tv-sort-option:last-child { border-bottom: none; }
        .tv-sort-option:hover { background: var(--tv-bg-subtle); }
        .tv-sort-option-active {
          background: var(--tv-green-light) !important;
          color: var(--tv-green) !important; font-weight: 600 !important;
        }

        .tv-toolbar {
          display: none; align-items: center; justify-content: space-between;
          padding: 12px 16px; background: #fff; border: 1px solid var(--tv-border);
          border-radius: var(--tv-radius); margin-bottom: 16px;
        }
        @media (min-width: 768px) { .tv-toolbar { display: flex; } }
        .tv-toolbar-left { display: flex; align-items: center; gap: 12px; }
        .tv-toolbar-count { font-size: 13px; font-weight: 500; color: var(--tv-light); }
        .tv-toolbar-count strong { color: var(--tv-dark); font-weight: 700; }
        .tv-toolbar-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: var(--tv-green-light); color: var(--tv-green);
          font-size: 11px; font-weight: 700; padding: 3px 10px;
          border-radius: 100px; text-transform: uppercase; letter-spacing: 0.03em;
        }
        .tv-toolbar-right { display: flex; align-items: center; gap: 8px; }
        .tv-desktop-sort { position: relative; }
        .tv-desktop-sort-btn {
          display: flex; align-items: center; gap: 6px; padding: 7px 14px;
          background: #fff; border: 1px solid var(--tv-border);
          border-radius: var(--tv-radius); font-size: 13px; font-weight: 500;
          color: var(--tv-mid); cursor: pointer; transition: all 0.15s; font-family: var(--tv-font);
        }
        .tv-desktop-sort-btn:hover { border-color: var(--tv-green-accent); color: var(--tv-dark); }
        .tv-desktop-sort-drop {
          position: absolute; top: calc(100% + 4px); right: 0; width: 200px;
          background: #fff; border: 1px solid var(--tv-border);
          border-radius: var(--tv-radius); box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          z-index: 50; overflow: hidden; animation: tv-fade 0.15s ease;
        }

        .tv-filter-content { display: flex; flex-direction: column; gap: 16px; }
        .tv-filter-header {
          display: flex; align-items: center; gap: 8px;
          padding-bottom: 12px; border-bottom: 1px solid var(--tv-border);
        }
        .tv-filter-header-text { font-size: 16px; font-weight: 800; color: var(--tv-dark); letter-spacing: -0.01em; }
        .tv-filter-section {
          padding: 16px; background: #fff; border: 1px solid var(--tv-border); border-radius: var(--tv-radius);
        }
        .tv-filter-section-title {
          display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
          font-size: 14px; font-weight: 700; color: var(--tv-dark);
        }
        .tv-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .tv-price-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .tv-price-field { display: flex; flex-direction: column; gap: 4px; }
        .tv-price-label {
          font-size: 11px; font-weight: 600; color: var(--tv-light);
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .tv-price-input-wrap { position: relative; display: flex; align-items: center; }
        .tv-price-symbol { position: absolute; left: 10px; font-size: 13px; font-weight: 600; color: var(--tv-light); }
        .tv-price-input {
          width: 100%; padding: 8px 10px 8px 24px; border: 1px solid var(--tv-border);
          border-radius: var(--tv-radius); font-size: 13px; font-weight: 500;
          color: var(--tv-dark); font-family: var(--tv-font); transition: border-color 0.15s; outline: none;
        }
        .tv-price-input:focus { border-color: var(--tv-green-accent); box-shadow: 0 0 0 2px rgba(34,197,94,0.1); }
        .tv-apply-btn {
          width: 100%; padding: 9px; background: var(--tv-green); color: #fff;
          border: none; border-radius: var(--tv-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background 0.15s;
          font-family: var(--tv-font); margin-bottom: 10px;
        }
        .tv-apply-btn:hover { background: var(--tv-green-mid); }
        .tv-apply-btn:active { transform: scale(0.98); }
        .tv-applied-range {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 10px; background: var(--tv-green-lighter);
          border: 1px solid #bbf7d0; border-radius: var(--tv-radius);
        }
        .tv-applied-label { font-size: 11px; font-weight: 600; color: var(--tv-green-mid); }
        .tv-applied-value { font-size: 12px; font-weight: 700; color: var(--tv-green); }

        .tv-discount-section { background: var(--tv-green-lighter); border-color: #bbf7d0; }
        .tv-discount-row { display: flex; align-items: center; justify-content: space-between; }
        .tv-discount-info { display: flex; align-items: center; gap: 10px; }
        .tv-discount-icon {
          width: 28px; height: 28px; border-radius: var(--tv-radius);
          background: var(--tv-green); display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .tv-discount-label { font-size: 13px; font-weight: 600; color: var(--tv-dark); }
        .tv-toggle {
          width: 40px; height: 22px; border-radius: 11px; background: #d1d5db;
          cursor: pointer; transition: background 0.2s; padding: 2px; flex-shrink: 0;
        }
        .tv-toggle-on { background: var(--tv-green) !important; }
        .tv-toggle-knob {
          width: 18px; height: 18px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15); transition: transform 0.2s;
        }
        .tv-toggle-on .tv-toggle-knob { transform: translateX(18px); }

        .tv-brand-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .tv-brand-tag {
          padding: 5px 12px; font-size: 12px; font-weight: 500; color: var(--tv-mid);
          background: var(--tv-bg-subtle); border: 1px solid var(--tv-border);
          border-radius: 100px; cursor: pointer; transition: all 0.15s;
          font-family: var(--tv-font); white-space: nowrap;
        }
        .tv-brand-tag:hover {
          border-color: var(--tv-green-accent); color: var(--tv-green); background: var(--tv-green-light);
        }
        .tv-brand-tag-active {
          background: var(--tv-green) !important; color: #fff !important;
          border-color: var(--tv-green) !important; font-weight: 600 !important;
        }
        .tv-reset-btn {
          width: 100%; padding: 9px; background: #fff; color: var(--tv-red);
          border: 1px solid #fecaca; border-radius: var(--tv-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--tv-font);
        }
        .tv-reset-btn:hover { background: #fef2f2; border-color: var(--tv-red); }
        .tv-reset-btn:active { transform: scale(0.98); }

        .tv-drawer-overlay {
          position: fixed; inset: 0; z-index: 100; display: flex; animation: tv-fade 0.2s ease;
        }
        .tv-drawer-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.4); }
        .tv-drawer-panel {
          position: relative; width: 100%; max-width: 320px; height: 100%;
          background: #fff; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow-y: auto; z-index: 1; animation: tv-slide-in 0.25s ease;
        }
        @keyframes tv-slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .tv-drawer-header {
          position: sticky; top: 0; background: #fff; display: flex;
          align-items: center; justify-content: space-between; padding: 14px 16px;
          border-bottom: 1px solid var(--tv-border); z-index: 2;
        }
        .tv-drawer-header-left { display: flex; align-items: center; gap: 8px; }
        .tv-drawer-header-title { font-size: 16px; font-weight: 800; color: var(--tv-dark); }
        .tv-drawer-close {
          width: 32px; height: 32px; display: flex; align-items: center;
          justify-content: center; border: 1px solid var(--tv-border);
          border-radius: var(--tv-radius); background: #fff; cursor: pointer; transition: background 0.12s;
        }
        .tv-drawer-close:active { background: #f5f5f5; }
        .tv-drawer-body { padding: 16px; }

        .tv-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (min-width: 640px) { .tv-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .tv-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
        @media (min-width: 1280px) { .tv-grid { grid-template-columns: repeat(4, 1fr); } }

        .tv-card {
          border: 1px solid var(--tv-border); border-radius: var(--tv-radius);
          overflow: hidden; background: #fff; transition: all 0.2s ease; cursor: pointer;
        }
        .tv-card:hover {
          border-color: var(--tv-green-accent); box-shadow: 0 4px 16px rgba(20, 83, 45, 0.08);
        }
        .tv-card-img {
          position: relative; height: 190px; display: flex; align-items: center;
          justify-content: center; padding: 10px; overflow: hidden;
        }
        @media (min-width: 768px) { .tv-card-img { height: 195px; } }
        .tv-card-img img {
          height: 100%; width: 100%; object-fit: contain; transition: transform 0.3s ease;
        }
        .tv-card:hover .tv-card-img img { transform: scale(1.05); }
        .tv-card-overlay {
          position: absolute; inset: 0; background: rgba(20, 83, 45, 0.45);
          display: none; align-items: center; justify-content: center; gap: 8px; z-index: 2;
        }
        .tv-card:hover .tv-card-overlay { display: flex; }
        .tv-card-action {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 50%; background: #fff;
          border: none; cursor: pointer; transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .tv-card-action:hover { transform: scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .tv-card-action:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .tv-card-body { padding: 10px 12px; text-align: center; }
        .tv-card-name {
          font-size: 15px; font-weight: 600; color: var(--tv-dark); line-height: 1.35;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; min-height: 35px;
        }
        .tv-card-price { font-size: 15px; font-weight: 900; color: var(--tv-red); margin-top: 2px; }
        .tv-card-old-price {
          font-size: 12px; font-weight: 400; color: var(--tv-light);
          text-decoration: line-through; margin-top: 2px;
        }
        .tv-card-badge {
          position: absolute; top: 8px; font-size: 9px; font-weight: 700;
          padding: 3px 8px; border-radius: 100px; z-index: 3;
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .tv-card-badge-sold { left: 8px; background: var(--tv-dark); color: #fff; }
        .tv-card-badge-discount {
          right: 8px; background: var(--tv-red); color: #fff; font-size: 10px; padding: 3px 7px;
        }

        .tv-skeleton {
          border: 1px solid #eee; border-radius: var(--tv-radius); overflow: hidden; background: #fff;
        }
        .tv-skeleton-img {
          height: 150px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: tv-shimmer 1.5s infinite;
        }
        @media (min-width: 768px) { .tv-skeleton-img { height: 195px; } }
        @keyframes tv-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .tv-skeleton-line {
          height: 10px; border-radius: 2px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: tv-shimmer 1.5s infinite;
        }

        .tv-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center; padding: 60px 24px;
          background: #fff; border: 1px solid var(--tv-border);
          border-radius: var(--tv-radius); margin-top: 16px;
        }
        .tv-empty-icon-wrap {
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--tv-bg-subtle); display: flex; align-items: center;
          justify-content: center; margin-bottom: 20px; border: 1px solid var(--tv-border);
        }
        .tv-empty-title { font-size: 18px; font-weight: 700; color: var(--tv-dark); margin-bottom: 8px; }
        .tv-empty-desc {
          font-size: 14px; color: var(--tv-light); max-width: 360px; line-height: 1.6; margin-bottom: 24px;
        }
        .tv-empty-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; }
        .tv-empty-reset {
          padding: 10px 20px; background: var(--tv-green); color: #fff;
          border: none; border-radius: var(--tv-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: var(--tv-font);
        }
        .tv-empty-reset:hover { background: var(--tv-green-mid); }
        .tv-empty-browse {
          padding: 10px 20px; background: #fff; color: var(--tv-mid);
          border: 1px solid var(--tv-border); border-radius: var(--tv-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--tv-font); text-decoration: none;
        }
        .tv-empty-browse:hover { border-color: var(--tv-green-accent); color: var(--tv-dark); }

        .tv-layout { display: flex; flex-direction: column; gap: 0; }
        @media (min-width: 1024px) { .tv-layout { flex-direction: row; gap: 24px; } }
        .tv-sidebar { display: none; width: 280px; flex-shrink: 0; }
        @media (min-width: 1024px) { .tv-sidebar { display: block; } }
        .tv-sidebar-sticky { position: sticky; top: 80px; }
        .tv-main { flex: 1; min-width: 0; }
        .tv-pagination { display: flex; justify-content: center; margin-top: 24px; }
      `}</style>

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="tv-root min-h-screen">
        <Helmet>
          <title>Buy the Latest Televisions Online | 4K, Smart TVs & Best Deals</title>
          <meta name="description" content="Explore our latest televisions with high resolution and best prices. Available from top brands." />
          <meta name="keywords" content="Television, TV, Smart TV, 4K TV, Best TVs, Buy TV Online" />
          <link rel="canonical" href="https://www.frankotrading.com/television" />
          <meta property="og:title" content="Buy the Latest Televisions Online | 4K, Smart TVs & Best Deals" />
          <meta property="og:description" content="Explore our latest televisions with high resolution and best prices. Available from top brands." />
          <meta property="og:image" content={filteredProducts.length > 0 ? `https://testing.frankotrading.com/Media/Products_Images/${filteredProducts[0].productImage.split("\\").pop()}` : "default-image-url"} />
          <meta property="og:url" content="https://www.frankotrading.com/television" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Buy the Latest Televisions Online | 4K, Smart TVs & Best Deals" />
          <meta name="twitter:description" content="Explore our latest televisions with high resolution and best prices. Available from top brands." />
          <meta name="twitter:image" content={filteredProducts.length > 0 ? `https://testing.frankotrading.com/Media/Products_Images/${filteredProducts[0].productImage.split("\\").pop()}` : "default-image-url"} />
          <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        </Helmet>

        <div className="px-4 md:px-16 py-6">
          {/* Page Header */}
          <div className="tv-page-header">
            <div className="tv-page-header-accent" />
            <div>
              <h1 className="tv-page-title">
                {selectedBrand ? `${selectedBrand} Televisions` : "Televisions"}
              </h1>
              <p className="tv-page-count">
                {isInitialLoading
                  ? "Loading products..."
                  : `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <div className="tv-page-header-line" />
          </div>

          {/* Mobile Controls */}
          <div className="tv-mobile-controls">
            <button onClick={() => setIsDrawerOpen(true)} className="tv-filter-trigger">
              <FunnelIcon style={{ width: 16, height: 16 }} />
              <span>Filters</span>
              {isFiltersActive && (
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", marginLeft: 2 }} />
              )}
            </button>
            <div className="tv-sort-trigger" onClick={() => setShowSortDropdown(!showSortDropdown)}>
              <Bars3BottomLeftIcon style={{ width: 16, height: 16 }} />
              <span>Sort</span>
              <ChevronDownIcon
                style={{ width: 14, height: 14, transition: "transform 0.2s", transform: showSortDropdown ? "rotate(180deg)" : "none" }}
              />
              {showSortDropdown && (
                <div className="tv-sort-drop">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                        setCurrentPage(1);
                      }}
                      className={`tv-sort-option ${sortBy === option.value ? "tv-sort-option-active" : ""}`}
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
            <div className="tv-drawer-overlay">
              <div className="tv-drawer-backdrop" onClick={() => setIsDrawerOpen(false)} />
              <div className="tv-drawer-panel">
                <div className="tv-drawer-header">
                  <div className="tv-drawer-header-left">
                    <AdjustmentsHorizontalIcon style={{ width: 18, height: 18, color: "var(--tv-green)" }} />
                    <span className="tv-drawer-header-title">Filters</span>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} className="tv-drawer-close">
                    <XMarkIcon style={{ width: 14, height: 14, color: "var(--tv-light)" }} />
                  </button>
                </div>
                <div className="tv-drawer-body">{renderFilterContent()}</div>
              </div>
            </div>
          )}

          {/* Layout */}
          <div className="tv-layout">
            <aside className="tv-sidebar">
              <div className="tv-sidebar-sticky">{renderFilterContent()}</div>
            </aside>

            <section className="tv-main">
              {/* Desktop Toolbar */}
              {(hasProducts || isInitialLoading) && (
                <div className="tv-toolbar">
                  <div className="tv-toolbar-left">
                    <span className="tv-toolbar-count">
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
                    {isFiltersActive && <span className="tv-toolbar-badge">Filtered</span>}
                  </div>
                  <div className="tv-toolbar-right">
                    <div className="tv-desktop-sort">
                      <button onClick={() => setShowSortDropdown(!showSortDropdown)} className="tv-desktop-sort-btn">
                        <Bars3BottomLeftIcon style={{ width: 14, height: 14 }} />
                        <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                        <ChevronDownIcon
                          style={{ width: 12, height: 12, transition: "transform 0.2s", transform: showSortDropdown ? "rotate(180deg)" : "none" }}
                        />
                      </button>
                      {showSortDropdown && (
                        <div className="tv-desktop-sort-drop">
                          {sortOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortBy(option.value);
                                setShowSortDropdown(false);
                                setCurrentPage(1);
                              }}
                              className={`tv-sort-option ${sortBy === option.value ? "tv-sort-option-active" : ""}`}
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
                <div className="tv-grid">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Products */}
              {!isInitialLoading && hasProducts && (
                <>
                  <div className="tv-grid">
                    {currentProducts.map((product) => {
                      const { productID, productName, productImage, price, oldPrice, stock } = product;
                      const isOnSale = oldPrice > 0 && oldPrice > price;
                      const discountPercent = isOnSale ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
                      const soldOut = stock === 0;
                      const inWishlist = isInWishlist(productID);

                      return (
                        <div key={productID} className="tv-card">
                          <div className="tv-card-img">
                            {soldOut && <span className="tv-card-badge tv-card-badge-sold">Sold Out</span>}
                            {isOnSale && !soldOut && (
                              <span className="tv-card-badge tv-card-badge-discount">-{discountPercent}%</span>
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
                            <div className="tv-card-overlay" onClick={() => navigate(`/product/${productID}`)}>
                              <Tooltip content={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}>
                                <button
                                  className="tv-card-action"
                                  onClick={(e) => { e.stopPropagation(); handleWishlistToggle(product); }}
                                >
                                  {inWishlist ? (
                                    <SolidHeartIcon style={{ width: 16, height: 16, color: "var(--tv-pink)" }} />
                                  ) : (
                                    <OutlineHeartIcon style={{ width: 16, height: 16, color: "var(--tv-mid)" }} />
                                  )}
                                </button>
                              </Tooltip>
                              <Tooltip content="View Details">
                                <button
                                  className="tv-card-action"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/product/${productID}`); }}
                                >
                                  <EyeIcon style={{ width: 16, height: 16, color: "var(--tv-green)" }} />
                                </button>
                              </Tooltip>
                              <Tooltip content={soldOut ? "Out of Stock" : "Add to Cart"}>
                                <button
                                  className="tv-card-action"
                                  onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                                  disabled={cartLoading || soldOut}
                                >
                                  <ShoppingCartIcon style={{ width: 16, height: 16, color: "var(--tv-green-mid)" }} />
                                </button>
                              </Tooltip>
                            </div>
                          </div>
                          <div className="tv-card-body">
                            <div className="tv-card-name">{productName}</div>
                            <div className="tv-card-price">{formatPrice(price)}</div>
                            {oldPrice > 0 && <div className="tv-card-old-price">{formatPrice(oldPrice)}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {totalPages > 1 && (
                    <div className="tv-pagination">
                      <CircularPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {trulyEmpty && (
                <div className="tv-empty">
                  <div className="tv-empty-icon-wrap">
                    <MagnifyingGlassIcon style={{ width: 32, height: 32, color: "var(--tv-light)" }} />
                  </div>
                  <div className="tv-empty-title">
                    {isFiltersActive ? "No matching televisions" : "No televisions available"}
                  </div>
                  <div className="tv-empty-desc">
                    {isFiltersActive
                      ? "Try adjusting your price range, brand, or filters to find what you're looking for."
                      : "We don't have any televisions available at the moment. Please check back later or explore other categories."}
                  </div>
                  <div className="tv-empty-actions">
                    {isFiltersActive && (
                      <button onClick={resetFilters} className="tv-empty-reset">
                        Clear Filters
                      </button>
                    )}
                    <button onClick={() => navigate("/")} className="tv-empty-browse">
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

export default Television;