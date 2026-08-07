import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  FunnelIcon,
  XMarkIcon,
  TagIcon,
  ChevronDownIcon,
  Bars3BottomLeftIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as OutlineHeartIcon,
  HeartIcon as SolidHeartIcon,
  ShoppingCartIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";

import { fetchProductsByShowroom } from "../Redux/Slice/productSlice";
import {
  addToWishlist,
  removeFromWishlist,
} from "../Redux/Slice/wishlistSlice";
import { CircularPagination } from "../Component/CircularPagination";
import useAddToCart from "../Component/Cart";

const SHOWROOM_ID = "84b6b4e2-4fa4-4f3e-b89c-900812d95815";
const PRODUCTS_PER_PAGE = 12;
const MAX_PRICE = 200000;

const teasers = [
  "Shop today's exclusive deals before they are gone.",
  "Limited-time prices. No need to wait.",
  "Find it. Love it. Add it to your cart.",
];

const pad = (number) => String(number ?? 0).padStart(2, "0");

const getEndOfToday = () => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end.getTime();
};

const getTimeLeftToday = () => {
  const difference = getEndOfToday() - Date.now();

  if (difference <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
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
          type === "success" ? "bg-purple-950" : "bg-red-700"
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
    <div className="h-60 md:h-72 bg-gradient-to-r from-purple-50 via-purple-100/50 to-purple-50 animate-pulse" />
    <div className="p-4 text-center">
      <div className="h-4 w-3/4 mx-auto rounded bg-purple-100 animate-pulse mb-2" />
      <div className="h-4 w-1/2 mx-auto rounded bg-purple-100 animate-pulse" />
    </div>
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

  const [countdown, setCountdown] = useState(getTimeLeftToday());
  const [teaserIndex, setTeaserIndex] = useState(0);
  const [teaserVisible, setTeaserVisible] = useState(true);

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

  // Countdown to midnight
  useEffect(() => {
    const interval = setInterval(() => setCountdown(getTimeLeftToday()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotate teaser messages
  useEffect(() => {
    const interval = setInterval(() => {
      setTeaserVisible(false);
      setTimeout(() => {
        setTeaserIndex((prev) => (prev + 1) % teasers.length);
        setTeaserVisible(true);
      }, 220);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Fetch data once
  useEffect(() => {
    const request = dispatch(fetchProductsByShowroom(SHOWROOM_ID));
    if (request?.then) {
      request.then(() => setHasLoadedOnce(true));
    } else {
      setHasLoadedOnce(true);
    }
  }, [dispatch]);

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

  const filtersActive =
    appliedPriceRange[0] !== 0 ||
    appliedPriceRange[1] !== MAX_PRICE ||
    showDiscountedOnly ||
    Boolean(selectedBrand) ||
    sortBy !== "newest";

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
    try {
      await addProductToCart(product);
      showNotification("Added to cart successfully");
    } catch {
      showNotification("Unable to add product to cart", "error");
    }
  };

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name-az", label: "Name: A to Z" },
    { value: "name-za", label: "Name: Z to A" },
  ];

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
                className="w-full pl-6 pr-2 py-2 border border-[#e7e0ea] rounded-lg text-xs outline-none focus:border-purple-400"
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
                className="w-full pl-6 pr-2 py-2 border border-[#e7e0ea] rounded-lg text-xs outline-none focus:border-purple-400"
              />
            </div>
          </label>
        </div>
        <button
          type="button"
          onClick={applyPriceFilter}
          className="w-full py-2 bg-purple-900 text-white text-xs font-bold rounded-lg hover:bg-purple-800 transition"
        >
          Apply Price
        </button>
      </div>

      {/* Discount Toggle */}
      <div className="bg-white border border-[#e7e0ea] rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <span className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
              <TagIcon className="h-4 w-4 text-purple-900" />
            </span>
            Discounted Products
          </div>
          <button
            type="button"
            className={`w-9 h-5 rounded-full p-0.5 transition ${
              showDiscountedOnly ? "bg-purple-900" : "bg-gray-200"
            }`}
            onClick={() => {
              setShowDiscountedOnly((prev) => !prev);
              setCurrentPage(1);
            }}
            aria-label="Toggle discounted only"
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white shadow transform transition ${
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
                    ? "bg-purple-900 text-white border-purple-900"
                    : "bg-white text-gray-600 border-[#e7e0ea] hover:border-purple-400"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reset */}
      {filtersActive && (
        <button
          type="button"
          onClick={resetFilters}
          className="w-full py-2 bg-white text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-50 transition"
        >
          Reset All Filters
        </button>
      )}
    </div>
  );

  const isInitialLoading = loading && !hasLoadedOnce;
  const hasNoResults = hasLoadedOnce && !loading && filteredProducts.length === 0;

  return (
    <>
      <Helmet>
        <title>Speed Shopping | Franko Trading</title>
      </Helmet>

      {/* Custom animation for notification */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
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
          <header className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-3 min-h-[46px] px-4 py-2 md:px-6 rounded-xl border border-[#6b5678] border-l-4 border-l-yellow-400 bg-gradient-to-r from-[#2e1065] to-[#4c1d95] shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 flex-shrink-0 rounded-full border-2 border-yellow-400 bg-white flex items-center justify-center">
                <img src="/speed.jpg" alt="Speed Shopping" className="w-9 h-9 object-contain" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-base lg:text-3xl font-black text-white leading-tight whitespace-nowrap">
                  Franko <span className="text-yellow-400">Speed Shopping</span>
                </h1>
                <p
                  className={`text-[11px] lg:text-xs text-yellow-200/80 italic mt-1 transition-opacity duration-200 ${
                    teaserVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {teasers[teaserIndex]}
                </p>
               
              </div>
            </div>

            {/* Countdown */}
            <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto bg-black/10 md:bg-transparent px-3 md:px-0 py-2 md:py-0 rounded-lg md:rounded-none">
              <span className="text-yellow-400 text-[10px] font-extrabold uppercase tracking-wider">Ends today</span>
              <div className="flex items-center gap-1.5">
                <div className="min-w-[34px] bg-white text-purple-950 rounded-md py-1 px-1.5 text-center">
                  <span className="block text-sm font-black leading-none">{pad(countdown.hours)}</span>
                  <span className="block text-[7px] font-bold opacity-60 mt-1">HRS</span>
                </div>
                <span className="text-white/50 font-black">:</span>
                <div className="min-w-[34px] bg-white text-purple-950 rounded-md py-1 px-1.5 text-center">
                  <span className="block text-sm font-black leading-none">{pad(countdown.minutes)}</span>
                  <span className="block text-[7px] font-bold opacity-60 mt-1">MIN</span>
                </div>
                <span className="text-white/50 font-black">:</span>
                <div className="min-w-[34px] bg-white text-purple-950 rounded-md py-1 px-1.5 text-center">
                  <span className="block text-sm font-black leading-none">{pad(countdown.seconds)}</span>
                  <span className="block text-[7px] font-bold opacity-60 mt-1">SEC</span>
                </div>
              </div>
            </div>
          </header>

          {/* ==================== MOBILE CONTROLS ==================== */}
          <div className="flex gap-3 mt-4 lg:hidden">
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-purple-900 text-white text-sm font-bold"
              onClick={() => setIsDrawerOpen(true)}
            >
              <FunnelIcon className="w-4 h-4" />
              Filters
            </button>

            <div className="relative flex-1">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white border border-[#e7e0ea] text-sm font-semibold"
                onClick={() => setIsSortOpen((prev) => !prev)}
              >
                <Bars3BottomLeftIcon className="w-4 h-4" />
                {sortOptions.find((option) => option.value === sortBy)?.label}
                <ChevronDownIcon className="w-4 h-4" />
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
                      className={`w-full px-4 py-2.5 text-left text-sm border-b border-[#f2edf3] last:border-0 ${
                        sortBy === option.value
                          ? "bg-purple-50 font-bold text-purple-900"
                          : "text-gray-700"
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
              <div className="absolute left-0 top-0 h-full w-[320px] max-w-[90vw] bg-white p-5 overflow-y-auto">
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

                      return (
                        <article
                          key={productId}
                          className="bg-white border border-[#e7e0ea] rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                        >
                          <div
                            className="relative h-48 sm:h-60 md:h-72 flex items-center justify-center p-3 cursor-pointer"
                            onClick={() => navigate(`/product/${productId}`)}
                          >
                            {soldOut && (
                              <span className="absolute top-2 left-2 z-10 px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-[#354030] text-white">
                                Sold Out
                              </span>
                            )}
                            {onSale && !soldOut && (
                              <span className="absolute top-2 right-2 z-10 px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-yellow-400 text-[#5b4611]">
                                -{discount}%
                              </span>
                            )}

                            <img
                              src={getImageUrl(product.productImage)}
                              alt={product.productName || "Product"}
                              loading="lazy"
                              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                            />

                            {/* Overlay */}
                            <div
                              className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-110 transition"
                                onClick={() => handleWishlistToggle(product)}
                                aria-label="Wishlist"
                              >
                                {isInWishlist(productId) ? (
                                  <SolidHeartIcon className="w-4 h-4 text-pink-600" />
                                ) : (
                                  <OutlineHeartIcon className="w-4 h-4 text-gray-500" />
                                )}
                              </button>
                              <button
                                type="button"
                                className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-110 transition"
                                onClick={() => navigate(`/product/${productId}`)}
                                aria-label="View"
                              >
                                <EyeIcon className="w-4 h-4 text-purple-900" />
                              </button>
                              <button
                                type="button"
                                className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                onClick={() => handleAddToCart(product)}
                                disabled={cartLoading || soldOut}
                                aria-label="Add to cart"
                              >
                                <ShoppingCartIcon className="w-4 h-4 text-purple-900" />
                              </button>
                            </div>
                          </div>

                          <div className="p-3 border-t border-[#f2eef3] text-center">
                            <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 min-h-[38px]">
                              {product.productName || "Unnamed product"}
                            </h3>
                            <p className="mt-2 text-[15px] font-black text-purple-900">
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
                </>
              )}

              {hasNoResults && (
                <div className="bg-white border border-[#e7e0ea] rounded-xl p-12 text-center">
                  <h2 className="text-2xl font-black text-purple-900 mb-2">
                    No products found
                  </h2>
                  <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                    Try changing your filters to see more Speed Shopping products available today.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-6 py-3 rounded-lg bg-purple-900 text-white text-sm font-bold hover:bg-purple-800 transition"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default Speed;