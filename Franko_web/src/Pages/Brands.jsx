import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByBrand } from "../Redux/Slice/productSlice";
import { fetchBrands } from "../Redux/Slice/brandSlice";
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

  const bgClass = type === "success" ? "br-notif-success" : "br-notif-error";
  const Icon = type === "success" ? CheckCircleIcon : XCircleIcon;

  return (
    <div className="fixed top-4 right-4 z-50 br-animate-slide-in">
      <div className={`br-notif ${bgClass}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="br-notif-text">{message}</span>
        <button onClick={onClose} className="br-notif-close">×</button>
      </div>
    </div>
  );
};

// ==================== SKELETON ====================

const SkeletonCard = () => (
  <div className="br-skeleton">
    <div className="br-skeleton-img" />
    <div style={{ padding: "10px 12px" }}>
      <div className="br-skeleton-line" style={{ width: "80%", marginBottom: 8, marginLeft: "auto", marginRight: "auto" }} />
      <div className="br-skeleton-line" style={{ width: "50%", height: 8, marginLeft: "auto", marginRight: "auto" }} />
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

const Brand = () => {
  const { brandId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { brandProducts, loading } = useSelector((state) => state.products);
  const { brands } = useSelector((state) => state.brands);
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
    window.scrollTo(0, 0);
    setHasLoadedOnce(false);
    dispatch(fetchBrands());
    dispatch(fetchProductsByBrand(brandId)).then(() => {
      setHasLoadedOnce(true);
    });
  }, [dispatch, brandId]);

  const selectedBrand = brands.find((brand) => brand.brandId === brandId);
  const filteredBrands = selectedBrand
    ? brands.filter((b) => b.categoryId === selectedBrand.categoryId)
    : [];

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

  const filteredProducts = sortProducts(
    (brandProducts || []).filter((p) => {
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
    <div className="br-filter-content">
      <div className="hidden br-filter-header br-desktop-only">
        <AdjustmentsHorizontalIcon style={{ width: 18, height: 18, color: "var(--br-green)" }} />
        <span className="br-filter-header-text">Filters</span>
      </div>

      {/* Price Range */}
      <div className="br-filter-section">
        <div className="br-filter-section-title">
          <div className="br-dot" style={{ background: "var(--br-green-accent)" }} />
          <span>Price Range</span>
        </div>
        <div className="br-price-inputs">
          <div className="br-price-field">
            <label className="br-price-label">Min</label>
            <div className="br-price-input-wrap">
              <span className="br-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.min}
                onChange={(e) => setInputPriceRange((prev) => ({ ...prev, min: +e.target.value }))}
                className="br-price-input"
                placeholder="0"
              />
            </div>
          </div>
          <div className="br-price-field">
            <label className="br-price-label">Max</label>
            <div className="br-price-input-wrap">
              <span className="br-price-symbol">₵</span>
              <input
                type="number"
                min="0"
                max="200000"
                value={inputPriceRange.max}
                onChange={(e) => setInputPriceRange((prev) => ({ ...prev, max: +e.target.value }))}
                className="br-price-input"
                placeholder="200000"
              />
            </div>
          </div>
        </div>
        <button onClick={applyPriceFilter} className="br-apply-btn">
          Apply Price Filter
        </button>
        <div className="br-applied-range">
          <span className="br-applied-label">Active:</span>
          <span className="br-applied-value">
            ₵{appliedPriceRange[0].toLocaleString()} – ₵{appliedPriceRange[1].toLocaleString()}
          </span>
        </div>
      </div>

      {/* Discount Toggle */}
      <div className="br-filter-section br-discount-section">
        <div className="br-discount-row">
          <div className="br-discount-info">
            <div className="br-discount-icon">
              <TagIcon style={{ width: 14, height: 14, color: "#fff" }} />
            </div>
            <span className="br-discount-label">Discounted Only</span>
          </div>
          <div
            onClick={() => setShowDiscountedOnly(!showDiscountedOnly)}
            className={`br-toggle ${showDiscountedOnly ? "br-toggle-on" : ""}`}
          >
            <div className="br-toggle-knob" />
          </div>
        </div>
      </div>

      {/* Related Brands */}
      {filteredBrands.length > 0 && (
        <div className="br-filter-section">
          <div className="br-filter-section-title">
            <div className="br-dot" style={{ background: "var(--br-green)" }} />
            <span>Related Brands</span>
          </div>
          <div className="br-brand-tags">
            {filteredBrands.map((brand) => (
              <button
                key={brand.brandId}
                onClick={() => {
                  navigate(`/brand/${brand.brandId}`);
                  setIsDrawerOpen(false);
                }}
                className={`br-brand-tag ${brand.brandId === brandId ? "br-brand-tag-active" : ""}`}
              >
                {brand.brandName}
              </button>
            ))}
          </div>
        </div>
      )}

      {isFiltersActive && (
        <button onClick={resetFilters} className="br-reset-btn">
          Reset All Filters
        </button>
      )}
    </div>
  );

  // ==================== DETERMINE WHAT TO SHOW ====================

  const isInitialLoading = loading && !hasLoadedOnce;
  const hasProducts = currentProducts.length > 0;
  const trulyEmpty = hasLoadedOnce && !loading && filteredProducts.length === 0;

  // ==================== SEO ====================

  const brandName = selectedBrand?.brandName || "Featured Brands";
  const pageTitle = selectedBrand
    ? `Buy ${brandName} Products in Ghana | Franko Trading`
    : "Explore Branded Products | Franko Trading";
  const description = selectedBrand
    ? `Buy genuine ${brandName} electronics and accessories at Franko Trading. Fast delivery and best prices guaranteed.`
    : "Browse a wide selection of authentic electronics and accessories from top brands.";
  const pageUrl = `https://www.frankotrading.com/brand/${brandId}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Franko Trading Enterprise",
        url: "https://www.frankotrading.com",
        logo: "https://www.frankotrading.com/assets/images/logo.png",
        sameAs: [
          "https://www.facebook.com/frankotrading",
          "https://www.instagram.com/frankotrading",
          "https://twitter.com/frankotrading",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+233302225651",
          contactType: "Customer Service",
          areaServed: "GH",
          availableLanguage: ["English"],
        },
      },
      {
        "@type": "Brand",
        name: selectedBrand?.brandName || "Franko Trading",
        description: selectedBrand
          ? `Official ${selectedBrand.brandName} distributor in Ghana.`
          : "Shop authentic electronics and accessories from Franko Trading.",
        logo: selectedBrand?.brandImage || "https://www.frankotrading.com/frankoIcon.png",
        url: pageUrl,
      },
      {
        "@type": "ItemList",
        name: `${selectedBrand?.brandName || "Brand"} Product Catalog`,
        url: pageUrl,
        itemListElement: currentProducts.map((product, index) => ({
          "@type": "Product",
          position: index + 1,
          name: product.productName,
          image: getValidImageUrl(product.productImage),
          description: product.description || `${product.productName} available at Franko Trading.`,
          sku: product.productID,
          brand: {
            "@type": "Brand",
            name: selectedBrand?.brandName || "Franko Trading",
          },
          offers: {
            "@type": "Offer",
            priceCurrency: "GHS",
            price: product.price,
            priceValidUntil: "2025-12-31",
            itemCondition: "https://schema.org/NewCondition",
            availability: "https://schema.org/InStock",
            url: `https://www.frankotrading.com/product/${product.productID}`,
            seller: {
              "@type": "Organization",
              name: "Franko Trading Enterprise",
            },
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: { "@type": "MonetaryAmount", currency: "GHS", value: "30.00" },
              shippingDestination: { "@type": "DefinedRegion", addressCountry: "GH" },
              deliveryTime: {
                "@type": "ShippingDeliveryTime",
                handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
                transitTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 5, unitCode: "DAY" },
              },
            },
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
              merchantReturnDays: 14,
              returnMethod: "https://schema.org/ReturnByMail",
              returnFees: "https://schema.org/FreeReturn",
              applicableCountry: "GH",
            },
          },
        })),
      },
    ],
  };

  // ==================== RENDER ====================

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700;800;900&display=swap');

        :root {
          --br-font: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          --br-green: #14532d;
          --br-green-mid: #166534;
          --br-green-light: #dcfce7;
          --br-green-lighter: #f0fdf4;
          --br-green-accent: #22c55e;
          --br-dark: #1a1a1a;
          --br-mid: #555;
          --br-light: #888;
          --br-border: #e0e0e0;
          --br-bg-subtle: #f7f7f7;
          --br-red: #dc2626;
          --br-pink: #e11d48;
          --br-radius: 4px;
        }

        .br-root, .br-root * {
          font-family: var(--br-font);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          box-sizing: border-box;
        }

        .br-desktop-only { display: none; }
        @media (min-width: 1024px) { .br-desktop-only { display: flex; } }

        .br-notif {
          display: flex; align-items: center; gap: 10px; padding: 12px 16px;
          border-radius: var(--br-radius); min-width: 280px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .br-notif-success { background: var(--br-green); color: #fff; }
        .br-notif-error { background: var(--br-red); color: #fff; }
        .br-notif-text { font-size: 14px; font-weight: 500; flex: 1; }
        .br-notif-close {
          background: transparent; border: none; color: rgba(255,255,255,0.8);
          font-size: 18px; cursor: pointer; padding: 0; line-height: 1;
        }
        .br-notif-close:hover { color: #fff; }

        @keyframes br-slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .br-animate-slide-in { animation: br-slide-in-right 0.3s ease-out; }

        .br-page-header {
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 20px; padding-bottom: 16px;
          border-bottom: 1px solid var(--br-border);
        }
        .br-page-header-accent {
          width: 4px; height: 28px; border-radius: 2px;
          background: var(--br-green); flex-shrink: 0;
        }
        .br-page-title {
          font-size: 20px; font-weight: 800; color: var(--br-dark);
          letter-spacing: -0.02em; line-height: 1.2; margin: 0;
        }
        @media (min-width: 768px) { .br-page-title { font-size: 24px; } }
        .br-page-count {
          font-size: 13px; font-weight: 500; color: var(--br-light); margin-top: 2px;
        }
        .br-page-header-line {
          flex: 1; height: 1px; background: var(--br-border); display: none;
        }
        @media (min-width: 768px) { .br-page-header-line { display: block; } }

        .br-mobile-controls { display: flex; gap: 8px; margin-bottom: 16px; }
        @media (min-width: 1024px) { .br-mobile-controls { display: none; } }

        .br-filter-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: var(--br-green); color: #fff;
          border: none; border-radius: var(--br-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--br-font);
        }
        .br-filter-trigger:active { transform: scale(0.98); }

        .br-sort-trigger {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 14px; background: #fff; color: var(--br-mid);
          border: 1px solid var(--br-border); border-radius: var(--br-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--br-font); position: relative;
        }
        .br-sort-trigger:active { transform: scale(0.98); }

        .br-sort-drop {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: #fff; border: 1px solid var(--br-border);
          border-radius: var(--br-radius); box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          z-index: 50; overflow: hidden; animation: br-fade 0.15s ease;
        }

        @keyframes br-fade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .br-sort-option {
          display: block; width: 100%; text-align: left; padding: 10px 14px;
          font-size: 13px; font-weight: 500; color: var(--br-mid);
          background: none; border: none; cursor: pointer; transition: all 0.1s;
          font-family: var(--br-font); border-bottom: 1px solid #f5f5f5;
        }
        .br-sort-option:last-child { border-bottom: none; }
        .br-sort-option:hover { background: var(--br-bg-subtle); }
        .br-sort-option-active {
          background: var(--br-green-light) !important;
          color: var(--br-green) !important; font-weight: 600 !important;
        }

        .br-toolbar {
          display: none; align-items: center; justify-content: space-between;
          padding: 12px 16px; background: #fff; border: 1px solid var(--br-border);
          border-radius: var(--br-radius); margin-bottom: 16px;
        }
        @media (min-width: 768px) { .br-toolbar { display: flex; } }

        .br-toolbar-left { display: flex; align-items: center; gap: 12px; }
        .br-toolbar-count { font-size: 13px; font-weight: 500; color: var(--br-light); }
        .br-toolbar-count strong { color: var(--br-dark); font-weight: 700; }
        .br-toolbar-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: var(--br-green-light); color: var(--br-green);
          font-size: 11px; font-weight: 700; padding: 3px 10px;
          border-radius: 100px; text-transform: uppercase; letter-spacing: 0.03em;
        }
        .br-toolbar-right { display: flex; align-items: center; gap: 8px; }

        .br-desktop-sort { position: relative; }
        .br-desktop-sort-btn {
          display: flex; align-items: center; gap: 6px; padding: 7px 14px;
          background: #fff; border: 1px solid var(--br-border);
          border-radius: var(--br-radius); font-size: 13px; font-weight: 500;
          color: var(--br-mid); cursor: pointer; transition: all 0.15s;
          font-family: var(--br-font);
        }
        .br-desktop-sort-btn:hover {
          border-color: var(--br-green-accent); color: var(--br-dark);
        }
        .br-desktop-sort-drop {
          position: absolute; top: calc(100% + 4px); right: 0; width: 200px;
          background: #fff; border: 1px solid var(--br-border);
          border-radius: var(--br-radius); box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          z-index: 50; overflow: hidden; animation: br-fade 0.15s ease;
        }

        .br-filter-content { display: flex; flex-direction: column; gap: 16px; }
        .br-filter-header {
          display: flex; align-items: center; gap: 8px;
          padding-bottom: 12px; border-bottom: 1px solid var(--br-border);
        }
        .br-filter-header-text {
          font-size: 16px; font-weight: 800; color: var(--br-dark); letter-spacing: -0.01em;
        }
        .br-filter-section {
          padding: 16px; background: #fff; border: 1px solid var(--br-border);
          border-radius: var(--br-radius);
        }
        .br-filter-section-title {
          display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
          font-size: 14px; font-weight: 700; color: var(--br-dark);
        }
        .br-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .br-price-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .br-price-field { display: flex; flex-direction: column; gap: 4px; }
        .br-price-label {
          font-size: 11px; font-weight: 600; color: var(--br-light);
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .br-price-input-wrap { position: relative; display: flex; align-items: center; }
        .br-price-symbol {
          position: absolute; left: 10px; font-size: 13px; font-weight: 600; color: var(--br-light);
        }
        .br-price-input {
          width: 100%; padding: 8px 10px 8px 24px; border: 1px solid var(--br-border);
          border-radius: var(--br-radius); font-size: 13px; font-weight: 500;
          color: var(--br-dark); font-family: var(--br-font);
          transition: border-color 0.15s; outline: none;
        }
        .br-price-input:focus {
          border-color: var(--br-green-accent);
          box-shadow: 0 0 0 2px rgba(34,197,94,0.1);
        }

        .br-apply-btn {
          width: 100%; padding: 9px; background: var(--br-green); color: #fff;
          border: none; border-radius: var(--br-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background 0.15s;
          font-family: var(--br-font); margin-bottom: 10px;
        }
        .br-apply-btn:hover { background: var(--br-green-mid); }
        .br-apply-btn:active { transform: scale(0.98); }

        .br-applied-range {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 10px; background: var(--br-green-lighter);
          border: 1px solid #bbf7d0; border-radius: var(--br-radius);
        }
        .br-applied-label { font-size: 11px; font-weight: 600; color: var(--br-green-mid); }
        .br-applied-value { font-size: 12px; font-weight: 700; color: var(--br-green); }

        .br-discount-section { background: var(--br-green-lighter); border-color: #bbf7d0; }
        .br-discount-row { display: flex; align-items: center; justify-content: space-between; }
        .br-discount-info { display: flex; align-items: center; gap: 10px; }
        .br-discount-icon {
          width: 28px; height: 28px; border-radius: var(--br-radius);
          background: var(--br-green); display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .br-discount-label { font-size: 13px; font-weight: 600; color: var(--br-dark); }

        .br-toggle {
          width: 40px; height: 22px; border-radius: 11px; background: #d1d5db;
          cursor: pointer; transition: background 0.2s; padding: 2px; flex-shrink: 0;
        }
        .br-toggle-on { background: var(--br-green) !important; }
        .br-toggle-knob {
          width: 18px; height: 18px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15); transition: transform 0.2s;
        }
        .br-toggle-on .br-toggle-knob { transform: translateX(18px); }

        .br-brand-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .br-brand-tag {
          padding: 5px 12px; font-size: 12px; font-weight: 500; color: var(--br-mid);
          background: var(--br-bg-subtle); border: 1px solid var(--br-border);
          border-radius: 100px; cursor: pointer; transition: all 0.15s;
          font-family: var(--br-font); white-space: nowrap;
        }
        .br-brand-tag:hover {
          border-color: var(--br-green-accent); color: var(--br-green);
          background: var(--br-green-light);
        }
        .br-brand-tag-active {
          background: var(--br-green) !important; color: #fff !important;
          border-color: var(--br-green) !important; font-weight: 600 !important;
        }

        .br-reset-btn {
          width: 100%; padding: 9px; background: #fff; color: var(--br-red);
          border: 1px solid #fecaca; border-radius: var(--br-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--br-font);
        }
        .br-reset-btn:hover { background: #fef2f2; border-color: var(--br-red); }
        .br-reset-btn:active { transform: scale(0.98); }

        .br-drawer-overlay {
          position: fixed; inset: 0; z-index: 100; display: flex;
          animation: br-fade 0.2s ease;
        }
        .br-drawer-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.4); }
        .br-drawer-panel {
          position: relative; width: 100%; max-width: 320px; height: 100%;
          background: #fff; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow-y: auto; z-index: 1; animation: br-slide-in 0.25s ease;
        }
        @keyframes br-slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .br-drawer-header {
          position: sticky; top: 0; background: #fff; display: flex;
          align-items: center; justify-content: space-between; padding: 14px 16px;
          border-bottom: 1px solid var(--br-border); z-index: 2;
        }
        .br-drawer-header-left { display: flex; align-items: center; gap: 8px; }
        .br-drawer-header-title { font-size: 16px; font-weight: 800; color: var(--br-dark); }
        .br-drawer-close {
          width: 32px; height: 32px; display: flex; align-items: center;
          justify-content: center; border: 1px solid var(--br-border);
          border-radius: var(--br-radius); background: #fff; cursor: pointer;
          transition: background 0.12s;
        }
        .br-drawer-close:active { background: #f5f5f5; }
        .br-drawer-body { padding: 16px; }

        .br-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
        }
        @media (min-width: 640px) { .br-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .br-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
        @media (min-width: 1280px) { .br-grid { grid-template-columns: repeat(4, 1fr); } }

        .br-card {
          border: 1px solid var(--br-border); border-radius: var(--br-radius);
          overflow: hidden; background: #fff; transition: all 0.2s ease; cursor: pointer;
        }
        .br-card:hover {
          border-color: var(--br-green-accent);
          box-shadow: 0 4px 16px rgba(20, 83, 45, 0.08);
        }
        .br-card-img {
          position: relative; height: 190px; display: flex; align-items: center;
          justify-content: center; padding: 10px; overflow: hidden;
        }
        @media (min-width: 768px) { .br-card-img { height: 195px; } }
        .br-card-img img {
          height: 100%; width: 100%; object-fit: contain; transition: transform 0.3s ease;
        }
        .br-card:hover .br-card-img img { transform: scale(1.05); }

        .br-card-overlay {
          position: absolute; inset: 0; background: rgba(20, 83, 45, 0.45);
          display: none; align-items: center; justify-content: center; gap: 8px; z-index: 2;
        }
        .br-card:hover .br-card-overlay { display: flex; }

        .br-card-action {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 50%; background: #fff;
          border: none; cursor: pointer; transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .br-card-action:hover {
          transform: scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .br-card-action:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .br-card-body { padding: 10px 12px; text-align: center; }
        .br-card-name {
          font-size: 15px; font-weight: 600; color: var(--br-dark); line-height: 1.35;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; min-height: 35px;
        }
        .br-card-price { font-size: 15px; font-weight: 900; color: var(--br-red); margin-top: 2px; }
        .br-card-old-price {
          font-size: 12px; font-weight: 400; color: var(--br-light);
          text-decoration: line-through; margin-top: 2px;
        }
        .br-card-badge {
          position: absolute; top: 8px; font-size: 9px; font-weight: 700;
          padding: 3px 8px; border-radius: 100px; z-index: 3;
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .br-card-badge-sold { left: 8px; background: var(--br-dark); color: #fff; }
        .br-card-badge-discount {
          right: 8px; background: var(--br-red); color: #fff;
          font-size: 10px; padding: 3px 7px;
        }

        .br-skeleton {
          border: 1px solid #eee; border-radius: var(--br-radius);
          overflow: hidden; background: #fff;
        }
        .br-skeleton-img {
          height: 150px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: br-shimmer 1.5s infinite;
        }
        @media (min-width: 768px) { .br-skeleton-img { height: 195px; } }
        @keyframes br-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .br-skeleton-line {
          height: 10px; border-radius: 2px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%; animation: br-shimmer 1.5s infinite;
        }

        .br-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center; padding: 60px 24px;
          background: #fff; border: 1px solid var(--br-border);
          border-radius: var(--br-radius); margin-top: 16px;
        }
        .br-empty-icon-wrap {
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--br-bg-subtle); display: flex; align-items: center;
          justify-content: center; margin-bottom: 20px;
          border: 1px solid var(--br-border);
        }
        .br-empty-title {
          font-size: 18px; font-weight: 700; color: var(--br-dark); margin-bottom: 8px;
        }
        .br-empty-desc {
          font-size: 14px; color: var(--br-light); max-width: 360px;
          line-height: 1.6; margin-bottom: 24px;
        }
        .br-empty-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; }
        .br-empty-reset {
          padding: 10px 20px; background: var(--br-green); color: #fff;
          border: none; border-radius: var(--br-radius); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: background 0.15s;
          font-family: var(--br-font);
        }
        .br-empty-reset:hover { background: var(--br-green-mid); }
        .br-empty-browse {
          padding: 10px 20px; background: #fff; color: var(--br-mid);
          border: 1px solid var(--br-border); border-radius: var(--br-radius);
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: var(--br-font); text-decoration: none;
        }
        .br-empty-browse:hover { border-color: var(--br-green-accent); color: var(--br-dark); }

        .br-layout { display: flex; flex-direction: column; gap: 0; }
        @media (min-width: 1024px) { .br-layout { flex-direction: row; gap: 24px; } }
        .br-sidebar { display: none; width: 280px; flex-shrink: 0; }
        @media (min-width: 1024px) { .br-sidebar { display: block; } }
        .br-sidebar-sticky { position: sticky; top: 80px; }
        .br-main { flex: 1; min-width: 0; }
        .br-pagination { display: flex; justify-content: center; margin-top: 24px; }
      `}</style>

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="br-root min-h-screen">
        <Helmet>
          <title>{pageTitle}</title>
          <meta name="title" content={pageTitle} />
          <meta name="description" content={description} />
          <link rel="canonical" href={pageUrl} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={pageUrl} />
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={selectedBrand?.brandImage || "https://www.frankotrading.com/assets/frankoIcon.png"} />
          <meta property="og:site_name" content="Franko Trading Enterprise" />
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:url" content={pageUrl} />
          <meta property="twitter:title" content={pageTitle} />
          <meta property="twitter:description" content={description} />
          <meta property="twitter:image" content={selectedBrand?.brandImage || "https://www.frankotrading.com/assets/frankoIcon.png"} />
          <meta name="keywords" content={`${brandName}, electronics Ghana, buy ${brandName}, Franko Trading`} />
          <meta name="robots" content="index, follow" />
          <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        </Helmet>

        <div className="px-4 md:px-16 py-6">
          {/* Page Header */}
          <div className="br-page-header">
            <div className="br-page-header-accent" />
            <div>
              <h1 className="br-page-title">
                {isInitialLoading ? "Loading..." : (selectedBrand?.brandName || "Brand Products")}
              </h1>
              <p className="br-page-count">
                {isInitialLoading
                  ? "Loading products..."
                  : `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <div className="br-page-header-line" />
          </div>

          {/* Mobile Controls */}
          <div className="br-mobile-controls">
            <button onClick={() => setIsDrawerOpen(true)} className="br-filter-trigger" disabled={isInitialLoading}>
              <FunnelIcon style={{ width: 16, height: 16 }} />
              <span>Filters</span>
              {isFiltersActive && (
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", marginLeft: 2 }} />
              )}
            </button>
            <div className="br-sort-trigger" onClick={() => !isInitialLoading && setShowSortDropdown(!showSortDropdown)}>
              <Bars3BottomLeftIcon style={{ width: 16, height: 16 }} />
              <span>Sort</span>
              <ChevronDownIcon
                style={{ width: 14, height: 14, transition: "transform 0.2s", transform: showSortDropdown ? "rotate(180deg)" : "none" }}
              />
              {showSortDropdown && (
                <div className="br-sort-drop">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                        setCurrentPage(1);
                      }}
                      className={`br-sort-option ${sortBy === option.value ? "br-sort-option-active" : ""}`}
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
            <div className="br-drawer-overlay">
              <div className="br-drawer-backdrop" onClick={() => setIsDrawerOpen(false)} />
              <div className="br-drawer-panel">
                <div className="br-drawer-header">
                  <div className="br-drawer-header-left">
                    <AdjustmentsHorizontalIcon style={{ width: 18, height: 18, color: "var(--br-green)" }} />
                    <span className="br-drawer-header-title">Filters</span>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} className="br-drawer-close">
                    <XMarkIcon style={{ width: 14, height: 14, color: "var(--br-light)" }} />
                  </button>
                </div>
                <div className="br-drawer-body">{renderFilterContent()}</div>
              </div>
            </div>
          )}

          {/* Layout */}
          <div className="br-layout">
            <aside className="br-sidebar">
              <div className="br-sidebar-sticky">{renderFilterContent()}</div>
            </aside>

            <section className="br-main">
              {/* Desktop Toolbar */}
              {(hasProducts || isInitialLoading) && (
                <div className="br-toolbar">
                  <div className="br-toolbar-left">
                    <span className="br-toolbar-count">
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
                    {isFiltersActive && <span className="br-toolbar-badge">Filtered</span>}
                  </div>
                  <div className="br-toolbar-right">
                    <div className="br-desktop-sort">
                      <button onClick={() => setShowSortDropdown(!showSortDropdown)} className="br-desktop-sort-btn">
                        <Bars3BottomLeftIcon style={{ width: 14, height: 14 }} />
                        <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                        <ChevronDownIcon
                          style={{ width: 12, height: 12, transition: "transform 0.2s", transform: showSortDropdown ? "rotate(180deg)" : "none" }}
                        />
                      </button>
                      {showSortDropdown && (
                        <div className="br-desktop-sort-drop">
                          {sortOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortBy(option.value);
                                setShowSortDropdown(false);
                                setCurrentPage(1);
                              }}
                              className={`br-sort-option ${sortBy === option.value ? "br-sort-option-active" : ""}`}
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
                <div className="br-grid">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Products */}
              {!isInitialLoading && hasProducts && (
                <>
                  <div className="br-grid">
                    {currentProducts.map((product) => {
                      const { productID, productName, productImage, price, oldPrice, stock } = product;
                      const isOnSale = oldPrice > 0 && oldPrice > price;
                      const discountPercent = isOnSale ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
                      const soldOut = stock === 0;
                      const inWishlist = isInWishlist(productID);

                      return (
                        <div key={productID} className="br-card">
                          <div className="br-card-img">
                            {soldOut && <span className="br-card-badge br-card-badge-sold">Sold Out</span>}
                            {isOnSale && !soldOut && (
                              <span className="br-card-badge br-card-badge-discount">-{discountPercent}%</span>
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

                            <div className="br-card-overlay" onClick={() => navigate(`/product/${productID}`)}>
                              <Tooltip content={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}>
                                <button
                                  className="br-card-action"
                                  onClick={(e) => { e.stopPropagation(); handleWishlistToggle(product); }}
                                >
                                  {inWishlist ? (
                                    <SolidHeartIcon style={{ width: 16, height: 16, color: "var(--br-pink)" }} />
                                  ) : (
                                    <OutlineHeartIcon style={{ width: 16, height: 16, color: "var(--br-mid)" }} />
                                  )}
                                </button>
                              </Tooltip>
                              <Tooltip content="View Details">
                                <button
                                  className="br-card-action"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/product/${productID}`); }}
                                >
                                  <EyeIcon style={{ width: 16, height: 16, color: "var(--br-green)" }} />
                                </button>
                              </Tooltip>
                              <Tooltip content={soldOut ? "Out of Stock" : "Add to Cart"}>
                                <button
                                  className="br-card-action"
                                  onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                                  disabled={cartLoading || soldOut}
                                >
                                  <ShoppingCartIcon style={{ width: 16, height: 16, color: "var(--br-green-mid)" }} />
                                </button>
                              </Tooltip>
                            </div>
                          </div>

                          <div className="br-card-body">
                            <div className="br-card-name">{productName}</div>
                            <div className="br-card-price">{formatPrice(price)}</div>
                            {oldPrice > 0 && <div className="br-card-old-price">{formatPrice(oldPrice)}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="br-pagination">
                      <CircularPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {trulyEmpty && (
                <div className="br-empty">
                  <div className="br-empty-icon-wrap">
                    <MagnifyingGlassIcon style={{ width: 32, height: 32, color: "var(--br-light)" }} />
                  </div>
                  <div className="br-empty-title">
                    {isFiltersActive ? "No matching products" : "No products available"}
                  </div>
                  <div className="br-empty-desc">
                    {isFiltersActive
                      ? "Try adjusting your price range or filters to find what you're looking for."
                      : "This brand doesn't have any products available at the moment. Please check back later or explore other brands."}
                  </div>
                  <div className="br-empty-actions">
                    {isFiltersActive && (
                      <button onClick={resetFilters} className="br-empty-reset">
                        Clear Filters
                      </button>
                    )}
                    <button onClick={() => navigate("/")} className="br-empty-browse">
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

export default Brand;