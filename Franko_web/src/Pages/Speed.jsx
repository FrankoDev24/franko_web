import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  FunnelIcon,
  XMarkIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Bars3BottomLeftIcon,
  BellIcon,
  BellAlertIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as OutlineHeartIcon,
  HeartIcon as SolidHeartIcon,
  ShoppingCartIcon,
  EyeIcon,
  CheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  BoltIcon,
} from "@heroicons/react/24/solid";

import { fetchProductsByShowroom } from "../Redux/Slice/productSlice";
import {
  addToWishlist,
  removeFromWishlist,
} from "../Redux/Slice/wishlistSlice";
import { CircularPagination } from "../Component/CircularPagination";
import useAddToCart from "../Component/Cart";
import { ShoppingBagIcon } from "lucide-react";

const SHOWROOM_ID = "84b6b4e2-4fa4-4f3e-b89c-900812d95815";
const PRODUCTS_PER_PAGE = 12;
const MAX_PRICE = 200000;

// Where "Browse other products" should send people once they're done here.
// Point this at your main catalog / homepage route.
const BROWSE_ALL_URL = "/";

// Sale window — 24 hours, starting midnight Accra time (GMT year-round, so "Z" works).
const PROMO_START = Date.parse("2026-10-02T00:00:00Z");
const PROMO_END = PROMO_START + 24 * 60 * 60 * 1000;

const LAUNCH_LABEL = "Friday 2 October 2026, 8:00 AM";

// Rotating one-liners for the red banner, per phase.
const teasersBefore = [
  "The deals are locked until 2 October.",
  "One day. One drop. Prices you will not see again.",
  "Set your reminder — this one moves fast.",
];

const teasersLive = [
  "Shop today's exclusive deals before they are gone.",
  "Limited-time prices. No need to wait.",
  "Find it. Love it. Add it to your cart.",
];

const pad = (number) => String(number ?? 0).padStart(2, "0");

const getPhase = (now) =>
  now < PROMO_START ? "before" : now < PROMO_END ? "live" : "ended";

/* One shared ticking clock for the whole page: before → live → ended. */
const useCountdown = () => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const phase = getPhase(now);
  const target = phase === "before" ? PROMO_START : PROMO_END;
  const diff = phase === "ended" ? 0 : Math.max(0, target - now);

  return {
    phase,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
};

const formatPrice = (price) => {
  const value = Number(price);
  if (!Number.isFinite(value)) return "GH₵0.00";
  return `GH₵${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return "https://via.placeholder.com/500";
  if (imagePath.includes("\\")) {
    return `https://testing.frankotrading.com/Media/Products_Images/${imagePath.split("\\").pop()}`;
  }
  return imagePath;
};

// ==================== NOTIFICATION ====================

const Notification = ({ message, type, visible, onClose }) => {
  const timeoutRef = useRef(null);
  const Icon = type === "success" ? CheckCircleIcon : XCircleIcon;

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (visible && message) {
      timeoutRef.current = setTimeout(onClose, 3000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visible, message, onClose]);

  if (!visible || !message) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-[slideIn_0.3s_ease-out]">
      <div
        className={`flex items-center gap-3 min-w-[280px] px-4 py-3 rounded-lg shadow-xl text-white text-sm font-semibold ${
          type === "success" ? "bg-[#0E8A43]" : "bg-[#BB1420]"
        }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span>{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto text-xl leading-none hover:opacity-70"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// ==================== SKELETON CARD ====================

const SkeletonCard = () => (
  <div className="bg-white border border-[#e7e0ea] rounded-lg overflow-hidden">
    <div className="h-60 md:h-72 bg-gradient-to-r from-[#e8f6ed] via-[#f6fbf8] to-[#e8f6ed] animate-pulse" />
    <div className="p-4 text-center">
      <div className="h-4 w-3/4 mx-auto rounded bg-[#d6efdf] animate-pulse mb-2" />
      <div className="h-4 w-1/2 mx-auto rounded bg-[#d6efdf] animate-pulse" />
    </div>
  </div>
);

// ==================== FILTER CHIP ====================

const FilterChip = ({ label, onRemove }) => (
  <button
    type="button"
    onClick={onRemove}
    className="group inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-[#e8f6ed] border border-[#b7e0c6] text-xs font-semibold text-[#0E8A43] hover:bg-[#d6efdf] transition"
  >
    {label}
    <XMarkIcon className="w-3.5 h-3.5 text-[#5fb183] group-hover:text-[#0E8A43] transition" />
  </button>
);

// ==================== COUNTDOWN UNIT ====================

const TimeUnit = ({ value, label, size = "sm" }) => (
  <div
    className={
      size === "lg"
        ? "min-w-[70px] sm:min-w-[84px] bg-white rounded-xl py-3 px-2 text-center shadow-sm border border-[#d6efdf]"
        : "min-w-[34px] bg-white rounded-md py-1 px-1.5 text-center"
    }
  >
    <span
      className={`block font-black leading-none tabular-nums text-[#0E8A43] ${
        size === "lg" ? "text-3xl sm:text-4xl" : "text-sm"
      }`}
    >
      {pad(value)}
    </span>
    <span
      className={`block font-bold text-gray-500 ${
        size === "lg" ? "text-[10px] mt-2 tracking-wide" : "text-[7px] mt-1 opacity-60"
      }`}
    >
      {label}
    </span>
  </div>
);

// ==================== MAIN COMPONENT ====================

const Speed = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { productsByShowroom = {}, loading } = useSelector(
    (state) => state.products
  );
  const wishlist = useSelector((state) => state.wishlist.items || []);
  const { addProductToCart, loading: cartLoading } = useAddToCart();

  const countdown = useCountdown();
  const isTeaser = countdown.phase === "before";

  const [teaserIndex, setTeaserIndex] = useState(0);
  const [teaserVisible, setTeaserVisible] = useState(true);
  const [notifyMeOn, setNotifyMeOn] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState(() => new Set());

  const [inputPriceRange, setInputPriceRange] = useState({ min: 0, max: MAX_PRICE });
  const [appliedPriceRange, setAppliedPriceRange] = useState([0, MAX_PRICE]);
  const [showDiscountedOnly, setShowDiscountedOnly] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [notification, setNotification] = useState({
    message: "",
    type: "success",
    visible: false,
  });

  const teaserLines = isTeaser ? teasersBefore : teasersLive;

  // Build products list
  const products = useMemo(
    () => productsByShowroom?.[SHOWROOM_ID] || [],
    [productsByShowroom]
  );

  // Unique brands
  const brands = useMemo(() => {
    return [...new Set(products.map((p) => p.brandName).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b)
    );
  }, [products]);

  const isInWishlist = useCallback(
    (productId) =>
      wishlist.some((item) => item.id === productId || item.productID === productId),
    [wishlist]
  );

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, visible: false }));
  }, []);

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, visible: true });
  }, []);

  // Rotate teaser messages
  useEffect(() => {
    const interval = setInterval(() => {
      setTeaserVisible(false);
      setTimeout(() => {
        setTeaserIndex((prev) => (prev + 1) % teaserLines.length);
        setTeaserVisible(true);
      }, 220);
    }, 3500);
    return () => clearInterval(interval);
  }, [teaserLines.length]);

  // Fetch data once — skipped entirely while the page is still a teaser,
  // since nothing is meant to be visible before the drop.
  useEffect(() => {
    if (isTeaser) return;
    const request = dispatch(fetchProductsByShowroom(SHOWROOM_ID));
    if (request?.then) {
      request.then(() => setHasLoadedOnce(true));
    } else {
      setHasLoadedOnce(true);
    }
  }, [dispatch, isTeaser]);

  // Apply price filter
  const applyPriceFilter = () => {
    const min = Math.max(0, Number(inputPriceRange.min) || 0);
    const max = Math.min(MAX_PRICE, Number(inputPriceRange.max) || MAX_PRICE);
    setAppliedPriceRange([Math.min(min, max), Math.max(min, max)]);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setInputPriceRange({ min: 0, max: MAX_PRICE });
    setAppliedPriceRange([0, MAX_PRICE]);
    setShowDiscountedOnly(false);
    setSelectedBrand("");
    setSortBy("newest");
    setCurrentPage(1);
  };

  // Filter + sort
  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const price = Number(product.price) || 0;
      const oldPrice = Number(product.oldPrice) || 0;
      const matchesPrice = price >= appliedPriceRange[0] && price <= appliedPriceRange[1];
      const matchesDiscount = !showDiscountedOnly || oldPrice > price;
      const matchesBrand = !selectedBrand || product.brandName === selectedBrand;
      return matchesPrice && matchesDiscount && matchesBrand;
    });

    return result.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.dateCreated || 0) - new Date(b.dateCreated || 0);
        case "price-low":
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        case "price-high":
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        case "name-az":
          return (a.productName || "").localeCompare(b.productName || "");
        case "name-za":
          return (b.productName || "").localeCompare(a.productName || "");
        default:
          return new Date(b.dateCreated || 0) - new Date(a.dateCreated || 0);
      }
    });
  }, [products, appliedPriceRange, showDiscountedOnly, selectedBrand, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name-az", label: "Name: A to Z" },
    { value: "name-za", label: "Name: Z to A" },
  ];

  const priceIsDefault =
    appliedPriceRange[0] === 0 && appliedPriceRange[1] === MAX_PRICE;

  const filtersActive =
    !priceIsDefault || showDiscountedOnly || Boolean(selectedBrand) || sortBy !== "newest";

  const removePriceFilter = () => {
    setInputPriceRange({ min: 0, max: MAX_PRICE });
    setAppliedPriceRange([0, MAX_PRICE]);
    setCurrentPage(1);
  };
  const removeDiscountFilter = () => {
    setShowDiscountedOnly(false);
    setCurrentPage(1);
  };
  const removeBrandFilter = () => {
    setSelectedBrand("");
    setCurrentPage(1);
  };
  const removeSortFilter = () => {
    setSortBy("newest");
    setCurrentPage(1);
  };

  const handleWishlistToggle = (product) => {
    const id = product.productID || product.id;
    if (isInWishlist(id)) {
      dispatch(removeFromWishlist(id));
      showNotification("Removed from wishlist");
    } else {
      dispatch(addToWishlist({ ...product, id }));
      showNotification("Added to wishlist");
    }
  };

  const handleAddToCart = async (product) => {
    if (Number(product.stock) === 0) {
      showNotification("This product is out of stock", "error");
      return;
    }
    const id = product.productID || product.id;
    try {
      await addProductToCart(product);
      showNotification("Added to cart successfully");
      setRecentlyAdded((prev) => new Set(prev).add(id));
      setTimeout(() => {
        setRecentlyAdded((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 1600);
    } catch {
      showNotification("Unable to add product to cart", "error");
    }
  };

  const handleNotifyMe = () => {
    setNotifyMeOn(true);
    showNotification("Reminder set — we'll flash it here the moment the sale opens");
  };

  // ==================== FILTERS CONTENT ====================
  const renderFilters = () => (
    <div className="flex flex-col gap-3">
      {/* Price */}
      <div className="bg-white border border-[#e7e0ea] rounded-lg p-4">
        <h3 className="text-sm font-extrabold text-gray-800 mb-3">Price Range</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <label className="text-[10px] font-bold uppercase text-gray-500">
            Min
            <div className="relative mt-1">
              <span className="absolute left-2 top-2 text-xs font-bold text-gray-400">₵</span>
              <input
                type="number"
                min="0"
                value={inputPriceRange.min}
                onChange={(e) =>
                  setInputPriceRange((prev) => ({ ...prev, min: e.target.value }))
                }
                className="w-full pl-6 pr-2 py-2 border border-[#e7e0ea] rounded-lg text-xs outline-none focus:border-[#0E8A43]"
              />
            </div>
          </label>
          <label className="text-[10px] font-bold uppercase text-gray-500">
            Max
            <div className="relative mt-1">
              <span className="absolute left-2 top-2 text-xs font-bold text-gray-400">₵</span>
              <input
                type="number"
                min="0"
                value={inputPriceRange.max}
                onChange={(e) =>
                  setInputPriceRange((prev) => ({ ...prev, max: e.target.value }))
                }
                className="w-full pl-6 pr-2 py-2 border border-[#e7e0ea] rounded-lg text-xs outline-none focus:border-[#0E8A43]"
              />
            </div>
          </label>
        </div>
        <button
          type="button"
          onClick={applyPriceFilter}
          className="w-full py-2 bg-[#0E8A43] text-white text-xs font-bold rounded-lg hover:bg-[#0a6b34] active:scale-[0.98] transition"
        >
          Apply Price
        </button>
      </div>

      {/* Discount Toggle */}
      <div className="bg-white border border-[#e7e0ea] rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <span className="w-7 h-7 rounded-lg bg-[#e8f6ed] flex items-center justify-center">
              <TagIcon className="h-4 w-4 text-[#0E8A43]" />
            </span>
            Discounted Products
          </div>
          <button
            type="button"
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${
              showDiscountedOnly ? "bg-[#0E8A43]" : "bg-gray-200"
            }`}
            onClick={() => {
              setShowDiscountedOnly((prev) => !prev);
              setCurrentPage(1);
            }}
            aria-label="Toggle discounted only"
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                showDiscountedOnly ? "translate-x-4" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div className="bg-white border border-[#e7e0ea] rounded-lg p-4">
          <h3 className="text-sm font-extrabold text-gray-800 mb-3">Brands</h3>
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => (
              <button
                type="button"
                key={brand}
                onClick={() => {
                  setSelectedBrand(selectedBrand === brand ? "" : brand);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-xs rounded-full border font-medium transition ${
                  selectedBrand === brand
                    ? "bg-[#0E8A43] text-white border-[#0E8A43]"
                    : "bg-white text-gray-600 border-[#e7e0ea] hover:border-[#7ecfa0]"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Browse other products */}
      <button
        type="button"
        onClick={() => navigate(BROWSE_ALL_URL)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-white border border-[#b7e0c6] text-[#0E8A43] rounded-lg text-xs font-bold hover:bg-[#e8f6ed] active:scale-[0.98] transition"
      >
        Browse Other Products
        <ChevronRightIcon className="w-3.5 h-3.5" />
      </button>

      {/* Reset */}
      {filtersActive && (
        <button
          type="button"
          onClick={resetFilters}
          className="w-full py-2 bg-white text-[#BB1420] border border-[#f3c6cb] rounded-lg text-xs font-bold hover:bg-[#fdecee] active:scale-[0.98] transition"
        >
          Reset All Filters
        </button>
      )}
    </div>
  );

  const isInitialLoading = loading && !hasLoadedOnce;
  const hasNoResults = hasLoadedOnce && !loading && filteredProducts.length === 0;
  const noResultsFromFilters = hasNoResults && filtersActive;

  const timerLabel =
    countdown.phase === "live" ? "Ends in" : isTeaser ? "Drops in" : null;

  const bannerLine = isTeaser
    ? teaserLines[teaserIndex]
    : countdown.phase === "ended"
    ? "This flash sale has ended — thanks for shopping with us."
    : teaserLines[teaserIndex];

  return (
    <>
      <Helmet>
        <title>
          {isTeaser
            ? "Speed Shopping drops 2 October | Franko Trading"
            : "Speed Shopping | Franko Trading"}
        </title>
      </Helmet>

      {/* Palette taken from the Franko announcement bar: red #BB1420/#A80F1B,
          yellow #FFD400, green #0E8A43/#0A6B34. Custom keyframes below
          drive the icon, shine and lock animations. */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes speedLivePing {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes speedPop {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes speedIconPop {
          0% { transform: scale(0) rotate(-30deg); opacity: 0; }
          60% { transform: scale(1.15) rotate(8deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes speedIconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes speedShine {
          0% { transform: translateX(-120%); }
          55% { transform: translateX(220%); }
          100% { transform: translateX(220%); }
        }
        @keyframes speedComingSoon {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-7px) rotate(4deg); }
        }
        .speed-fk-bg {
          background: linear-gradient(90deg, #A80F1B 0%, #BB1420 50%, #A80F1B 100%);
        }
        .speed-green-bg {
          background: linear-gradient(135deg, #0A6B34 0%, #0E8A43 55%, #0A6B34 100%);
        }
        .speed-shine {
          animation: speedShine 5s ease-in-out infinite;
        }
        .speed-pop { animation: speedPop 0.35s ease-out; }
        .speed-icon-enter {
          animation: speedIconPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both,
                     speedIconFloat 2.4s ease-in-out 0.6s infinite;
        }
        .speed-coming-soon-icon {
          animation: speedComingSoon 2.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .speed-shine, .speed-icon-enter, .speed-coming-soon-icon,
          .speed-pop { animation: none !important; }
        }
      `}</style>

      <Notification
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
        onClose={hideNotification}
      />

      <div className="min-h-screen bg-[#faf9fb] text-[#302936]">
        <div className="mx-auto w-full max-w-[1800px] px-3 sm:px-5 lg:px-8 py-3 sm:py-3">

          {/* ==================== BANNER ==================== */}
          <header className="speed-fk-bg relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-3 min-h-[46px] px-4 py-3 md:px-6 rounded-xl border border-[#7a0e18] border-l-4 border-l-[#FFD400] shadow-lg">
            <span
              aria-hidden="true"
              className="speed-shine pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />

            <div className="relative z-[1] flex items-center gap-3 min-w-0">
              <div className="relative w-12 h-12 flex-shrink-0 rounded-full border-2 border-[#FFD400] bg-white flex items-center justify-center speed-icon-enter">
                <img src="/speed.jpg" alt="Speed Shopping" className="w-9 h-9 object-contain" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#FFD400] flex items-center justify-center shadow">
                  <BoltIcon className="w-3 h-3 text-[#0E8A43]" />
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-base lg:text-3xl font-black text-white leading-tight whitespace-nowrap">
                  Franko <span className="text-[#FFD400]">Speed Shopping</span>
                </h1>
                <p
                  className={`text-[11px] lg:text-xs text-[#FFE9A8] italic mt-1 transition-opacity duration-200 ${
                    teaserVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {bannerLine}
                </p>
              </div>
            </div>

            {/* Countdown + actions */}
            <div className="relative z-[1] flex flex-col sm:flex-row sm:items-center gap-2.5 w-full md:w-auto">
              {countdown.phase !== "ended" ? (
                <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto bg-black/10 md:bg-transparent px-3 md:px-0 py-2 md:py-0 rounded-lg md:rounded-none">
                  <span className="flex items-center gap-1.5 text-[#FFD400] text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap">
                    {countdown.phase === "live" && (
                      <span className="relative flex h-2 w-2">
                        <span
                          className="absolute inline-flex h-full w-full rounded-full bg-[#FFD400] opacity-75"
                          style={{ animation: "speedLivePing 1.6s cubic-bezier(0,0,0.2,1) infinite" }}
                        />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FFD400]" />
                      </span>
                    )}
                    {timerLabel}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {countdown.days > 0 && (
                      <>
                        <TimeUnit value={countdown.days} label="DAYS" />
                        <span className="text-white/50 font-black">:</span>
                      </>
                    )}
                    <TimeUnit value={countdown.hours} label="HRS" />
                    <span className="text-white/50 font-black">:</span>
                    <TimeUnit value={countdown.minutes} label="MIN" />
                    <span className="text-white/50 font-black">:</span>
                    <TimeUnit value={countdown.seconds} label="SEC" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full md:w-auto bg-white/10 px-3 py-2 rounded-lg">
                  <SparklesIcon className="w-4 h-4 text-[#FFD400] flex-shrink-0" />
                  <span className="text-xs font-bold text-[#FFE9A8]">Sale ended</span>
                </div>
              )}

              {isTeaser && (
                <button
                  type="button"
                  onClick={handleNotifyMe}
                  disabled={notifyMeOn}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition active:scale-[0.97] ${
                    notifyMeOn
                      ? "bg-white/10 text-[#FFE45C] cursor-default"
                      : "bg-[#FFD400] text-[#0E8A43] hover:bg-[#ffcf00]"
                  }`}
                >
                  {notifyMeOn ? (
                    <BellAlertIcon className="w-4 h-4 speed-pop" />
                  ) : (
                    <BellIcon className="w-4 h-4" />
                  )}
                  {notifyMeOn ? "Reminder set" : "Remind me"}
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate(BROWSE_ALL_URL)}
                className="hidden md:inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 whitespace-nowrap transition active:scale-[0.97]"
              >
                Browse Other Products
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {/* ==================== TEASER MODE (before 2 Oct 2026) ==================== */}
          {isTeaser ? (
            <section className="mt-5">
              <div className="speed-green-bg relative overflow-hidden rounded-2xl border border-[#0a6b34] px-5 py-14 sm:py-20 text-center">
                <span
                  aria-hidden="true"
                  className="speed-shine pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                />

                <div className="relative z-[1] max-w-lg mx-auto flex flex-col items-center">
                  <span className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center speed-icon-enter">
                    <ShoppingBagIcon className="w-8 h-8 text-[#FFD400]" />
                  </span>

                  <h2 className="mt-5 text-3xl sm:text-4xl font-black text-white leading-tight">
                    Coming soon
                  </h2>
                  <p className="mt-2 text-sm text-[#d9f2e3]">
                    Speed Shopping opens {LAUNCH_LABEL}
                  </p>

                  <div className="mt-7 flex items-center justify-center gap-2 sm:gap-3">
                    {countdown.days > 0 && (
                      <TimeUnit value={countdown.days} label="DAYS" size="lg" />
                    )}
                    <TimeUnit value={countdown.hours} label="HRS" size="lg" />
                    <TimeUnit value={countdown.minutes} label="MIN" size="lg" />
                    <TimeUnit value={countdown.seconds} label="SEC" size="lg" />
                  </div>

                  <div className="mt-7 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      onClick={handleNotifyMe}
                      disabled={notifyMeOn}
                      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition active:scale-[0.98] ${
                        notifyMeOn
                          ? "bg-white/15 text-white cursor-default"
                          : "bg-[#FFD400] text-[#0a6b34] hover:bg-[#ffcf00]"
                      }`}
                    >
                      {notifyMeOn ? (
                        <BellAlertIcon className="w-4 h-4 speed-pop" />
                      ) : (
                        <BellIcon className="w-4 h-4" />
                      )}
                      {notifyMeOn ? "Reminder set" : "Remind me"}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(BROWSE_ALL_URL)}
                      className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-white/10 border border-white/25 text-white text-sm font-bold hover:bg-white/20 transition active:scale-[0.98]"
                    >
                      Browse Other Products
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <>
              {/* ==================== MOBILE CONTROLS ==================== */}
              <div className="flex gap-3 mt-4 lg:hidden">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#0E8A43] text-white text-sm font-bold active:scale-[0.98] transition"
                  onClick={() => setIsDrawerOpen(true)}
                >
                  <FunnelIcon className="w-4 h-4" />
                  Filters
                  {filtersActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFD400]" />
                  )}
                </button>

                <div className="relative flex-1">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white border border-[#e7e0ea] text-sm font-semibold active:scale-[0.98] transition"
                    onClick={() => setIsSortOpen((prev) => !prev)}
                  >
                    <Bars3BottomLeftIcon className="w-4 h-4" />
                    {sortOptions.find((option) => option.value === sortBy)?.label}
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isSortOpen && (
                    <div
                      className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-[#e7e0ea] rounded-lg shadow-lg overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {sortOptions.map((option) => (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                            setCurrentPage(1);
                            setIsSortOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm border-b border-[#f2edf3] last:border-0 transition ${
                            sortBy === option.value
                              ? "bg-[#e8f6ed] font-bold text-[#0E8A43]"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ==================== MOBILE DRAWER ==================== */}
              {isDrawerOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                  <div
                    className="absolute inset-0 bg-black/50"
                    onClick={() => setIsDrawerOpen(false)}
                  />
                  <div className="absolute left-0 top-0 h-full w-[320px] max-w-[90vw] bg-white p-5 overflow-y-auto animate-[slideIn_0.25s_ease-out]">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-lg font-black text-gray-900">Filters</span>
                      <button
                        type="button"
                        onClick={() => setIsDrawerOpen(false)}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                    {renderFilters()}
                  </div>
                </div>
              )}

              {/* ==================== MAIN LAYOUT ==================== */}
              <div className="flex gap-5 mt-5">
                {/* Sidebar */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                  <div className="sticky top-5">{renderFilters()}</div>
                </aside>

                {/* Products */}
                <main className="flex-1 min-w-0">
                  {/* Active filter chips */}
                  {filtersActive && !isInitialLoading && (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {!priceIsDefault && (
                        <FilterChip
                          label={`${formatPrice(appliedPriceRange[0])} – ${formatPrice(appliedPriceRange[1])}`}
                          onRemove={removePriceFilter}
                        />
                      )}
                      {showDiscountedOnly && (
                        <FilterChip label="Discounted only" onRemove={removeDiscountFilter} />
                      )}
                      {selectedBrand && (
                        <FilterChip label={selectedBrand} onRemove={removeBrandFilter} />
                      )}
                      {sortBy !== "newest" && (
                        <FilterChip
                          label={sortOptions.find((o) => o.value === sortBy)?.label}
                          onRemove={removeSortFilter}
                        />
                      )}
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-xs font-bold text-[#BB1420] hover:underline ml-1"
                      >
                        Clear all
                      </button>
                    </div>
                  )}

                  {isInitialLoading && (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <SkeletonCard key={idx} />
                      ))}
                    </div>
                  )}

                  {!isInitialLoading && currentProducts.length > 0 && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                        {currentProducts.map((product) => {
                          const productId = product.productID || product.id;
                          const price = Number(product.price) || 0;
                          const oldPrice = Number(product.oldPrice) || 0;
                          const stock = Number(product.stock);
                          const soldOut = stock === 0;
                          const onSale = oldPrice > price && oldPrice > 0;
                          const discount = onSale
                            ? Math.round(((oldPrice - price) / oldPrice) * 100)
                            : 0;
                          const justAdded = recentlyAdded.has(productId);

                          return (
                            <article
                              key={productId}
                              className="group bg-white border border-[#e7e0ea] rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                            >
                              <div
                                className="relative h-48 sm:h-60 md:h-72 flex items-center justify-center p-3 cursor-pointer"
                                onClick={() => navigate(`/product/${productId}`)}
                              >
                                {soldOut && (
                                  <span className="absolute top-2 left-2 z-10 px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-[#0a6b34] text-white">
                                    Sold Out
                                  </span>
                                )}
                                {onSale && !soldOut && (
                                  <span className="absolute top-2 right-2 z-10 px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-[#FFD400] text-[#0a6b34]">
                                    -{discount}%
                                  </span>
                                )}

                                <img
                                  src={getImageUrl(product.productImage)}
                                  alt={product.productName || "Product"}
                                  loading="lazy"
                                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                                />

                                {/* Overlay */}
                                <div
                                  className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center gap-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition"
                                    onClick={() => handleWishlistToggle(product)}
                                    aria-label="Wishlist"
                                  >
                                    {isInWishlist(productId) ? (
                                      <SolidHeartIcon className="w-4 h-4 text-[#BB1420]" />
                                    ) : (
                                      <OutlineHeartIcon className="w-4 h-4 text-gray-500" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition"
                                    onClick={() => navigate(`/product/${productId}`)}
                                    aria-label="View"
                                  >
                                    <EyeIcon className="w-4 h-4 text-[#0E8A43]" />
                                  </button>
                                  <button
                                    type="button"
                                    className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                    onClick={() => handleAddToCart(product)}
                                    disabled={cartLoading || soldOut}
                                    aria-label="Add to cart"
                                  >
                                    {justAdded ? (
                                      <CheckIcon className="w-4 h-4 text-[#0E8A43] speed-pop" />
                                    ) : (
                                      <ShoppingCartIcon className="w-4 h-4 text-[#0E8A43]" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="p-3 border-t border-[#f2eef3] text-center">
                                <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 min-h-[38px]">
                                  {product.productName || "Unnamed product"}
                                </h3>
                                <p className="mt-2 text-[15px] font-black text-[#0E8A43]">
                                  {formatPrice(price)}
                                </p>
                                {onSale && (
                                  <p className="text-xs text-gray-400 line-through">
                                    {formatPrice(oldPrice)}
                                  </p>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>

                      {totalPages > 1 && (
                        <div className="flex justify-center mt-8">
                          <CircularPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                          />
                        </div>
                      )}

                      {/* Bottom CTA — always available once there are results */}
                      <div className="flex justify-center mt-8">
                        <button
                          type="button"
                          onClick={() => navigate(BROWSE_ALL_URL)}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-[#b7e0c6] bg-white text-[#0E8A43] text-sm font-bold hover:bg-[#e8f6ed] active:scale-[0.98] transition"
                        >
                          Browse Other Products
                          <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}

                  {hasNoResults && (
                    <div className="bg-white border border-[#e7e0ea] rounded-xl p-10 sm:p-12 text-center">
                      {noResultsFromFilters ? (
                        <>
                          <h2 className="text-2xl font-black text-[#0E8A43] mb-2">
                            No matches for these filters
                          </h2>
                          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                            Try widening your price range or clearing a filter to see more
                            Speed Shopping deals.
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={resetFilters}
                              className="px-6 py-3 rounded-lg bg-[#0E8A43] text-white text-sm font-bold hover:bg-[#0a6b34] active:scale-[0.98] transition"
                            >
                              Clear All Filters
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(BROWSE_ALL_URL)}
                              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-lg border border-[#b7e0c6] text-[#0E8A43] text-sm font-bold hover:bg-[#e8f6ed] active:scale-[0.98] transition"
                            >
                              Browse Other Products
                              <ChevronRightIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#e8f6ed] flex items-center justify-center speed-coming-soon-icon">
                            <ShoppingBagIcon className="w-7 h-7 text-[#0E8A43]" />
                          </div>
                          <h2 className="text-2xl font-black text-[#0E8A43] mb-2">
                            {countdown.phase === "ended"
                              ? "Speed Shopping is closed"
                              : "Deals are still loading"}
                          </h2>
                          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                            {countdown.phase === "ended"
                              ? "The 24-hour window has closed. Thanks for shopping with us — the rest of the store is open as usual."
                              : "The first batch is being uploaded now. Refresh in a moment, or explore the rest of the store while you wait."}
                          </p>
                          <button
                            type="button"
                            onClick={() => navigate(BROWSE_ALL_URL)}
                            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-lg bg-[#0E8A43] text-white text-sm font-bold hover:bg-[#0a6b34] active:scale-[0.98] transition"
                          >
                            Browse Other Products
                            <ChevronRightIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </main>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Speed;