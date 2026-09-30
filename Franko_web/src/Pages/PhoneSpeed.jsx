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
  ShoppingCartIcon as CartOutlineIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as OutlineHeartIcon,
  HeartIcon as SolidHeartIcon,
  ShoppingCartIcon,
  EyeIcon,
  CheckIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";

import { fetchProductsByShowroom } from "../Redux/Slice/productSlice";
import {
  addToWishlist,
  removeFromWishlist,
} from "../Redux/Slice/wishlistSlice";
import { CircularPagination } from "../Component/CircularPagination";
import ProductDetailModal from "../Component/ProductDetailModal";
import useAddToCart from "../Component/Cart";
import speedLogo from "../assets/speed-logo.png";
import telecelWhite from "../assets/Telecel White.png";

/* ===================== SHOWROOM / CONFIG ===================== */

const SHOWROOM_ID = "1eb2a7fe-7c6d-4b98-b806-3e9a82164f1f";
const PRODUCTS_PER_PAGE = 12;
const MAX_PRICE = 200000;
const BROWSE_ALL_URL = "/";
const CART_STORAGE_KEY = "telecel_speed_cart";
const CART_PREFIX = "Tel";

// Sale window — 24 hours, starting midnight Accra time (GMT year-round, so "Z" works).
const PROMO_START = Date.parse("2026-10-02T00:00:00Z");
const PROMO_END = PROMO_START + 24 * 60 * 60 * 1000;
const LAUNCH_LABEL = "Friday 2 October 2026, 8:00 AM";

const COLOR = {
  red: "#BB1420",
  redDeep: "#A80F1B",
  forest: "#2C5E48",
  forestDeep: "#234A39",
  gold: "#FFD400",
  goldText: "#FFD400",
  goldBtn: "#FFD400",
  sage: "#E7F0EB",
  sageLine: "#C9D9CF",
  rose: "#F6EEEE",
  roseLine: "#E4CFD1",
};

const teasersBefore = [{ text: "24 hours Only", icon: "hours" }];
const teasersLive = [
  { text: "Shop today's exclusive deals before they are gone.", icon: "hourglass" },
  { text: "Limited-time prices. No need to wait.", icon: "tag" },
  { text: "Find it. Love it. Add it to your cart.", icon: "cart" },
];

const pad = (number) => String(number ?? 0).padStart(2, "0");
const getPhase = (now) =>
  now < PROMO_START ? "before" : now < PROMO_END ? "live" : "ended";

/* ===================== TELECEL CART HELPERS =====================
 * Cart IDs always begin with "Tel". The cart itself has an id of
 * "Tel-<timestamp>-<rand>", and every line item also gets a unique
 * "Tel-..." cartItemId. Persisted to localStorage so it survives
 * refreshes, and kept in React state so the UI re-renders.
 */

const generateTelId = () =>
  `${CART_PREFIX}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

const loadTelCart = () => {
  if (typeof window === "undefined") {
    return { id: generateTelId(), items: [] };
  }
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.id === "string" &&
        parsed.id.startsWith(CART_PREFIX) &&
        Array.isArray(parsed.items)
      ) {
        return parsed;
      }
    }
  } catch (_) {
    /* ignore */
  }
  return { id: generateTelId(), items: [] };
};

const saveTelCart = (cart) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (_) {
    /* ignore */
  }
};

/* ===================== ICONS ===================== */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const HoursIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
    <circle cx="12" cy="12" r="8.25" />
    <path d="M12 8.1V12l2.5 1.6" />
  </svg>
);
const HourglassIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
    <path d="M8 5h8M8 19h8" />
    <path d="M8.4 5.4c.2 2.8 3.6 3.6 3.6 6.6s-3.4 3.7-3.6 6.6" />
    <path d="M15.6 5.4c-.2 2.8-3.6 3.6-3.6 6.6s3.4 3.7 3.6 6.6" />
  </svg>
);
const PriceTagIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
    <path d="M4.4 11.7 11.5 4.6h6.6v6.6l-7.1 7.1a1.6 1.6 0 0 1-2.3 0l-4.3-4.3a1.6 1.6 0 0 1 0-2.3Z" />
    <circle cx="15.2" cy="8.2" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);
const CartHeartIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
    <path d="M5 6.5h1.6l1.2 8.2a1 1 0 0 0 1 .8h7.8a1 1 0 0 0 1-.8L18.8 9H8" />
    <path d="M12.2 11.2c.4-.5 1.3-.4 1.3.4 0 .8-1.3 1.6-1.3 1.6s-1.3-.8-1.3-1.6c0-.8.9-.9 1.3-.4Z" />
    <circle cx="9.4" cy="18.4" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="15.2" cy="18.4" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);
const ClosedIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
    <circle cx="12" cy="12" r="8.25" />
    <path d="M8.8 12.2 11 14.3l4.3-4.6" />
  </svg>
);
const BagIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
    <path d="M6.5 8.5h11l-.9 10.2a1 1 0 0 1-1 .8H8.4a1 1 0 0 1-1-.8L6.5 8.5Z" />
    <path d="M9.2 8.5V7.2a2.8 2.8 0 0 1 5.6 0v1.3" />
  </svg>
);

const TEASER_ICONS = {
  hours: HoursIcon,
  hourglass: HourglassIcon,
  tag: PriceTagIcon,
  cart: CartHeartIcon,
  closed: ClosedIcon,
  bag: BagIcon,
};

const TeaserGlyph = ({ name, className = "w-5 h-5" }) => {
  const Icon = TEASER_ICONS[name] || HoursIcon;
  return <Icon className={className} />;
};

/* ===================== COUNTDOWN HOOK ===================== */

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
    return `https://testing.frankotrading.com/Media/Products_Images/${imagePath
      .split("\\")
      .pop()}`;
  }
  return imagePath;
};

/* ===================== NOTIFICATION ===================== */

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
        className="flex items-center gap-3 min-w-[280px] px-4 py-3 rounded-lg shadow-lg text-white text-sm font-semibold"
        style={{ background: type === "success" ? COLOR.forest : COLOR.red }}
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

/* ===================== SKELETON ===================== */

const SkeletonCard = () => (
  <div className="bg-white border border-[#e6e1dc] rounded-lg overflow-hidden">
    <div className="h-60 md:h-72 bg-gradient-to-r from-[#e7f0eb] via-[#f7faf8] to-[#e7f0eb] animate-pulse" />
    <div className="p-4 text-center">
      <div className="h-4 w-3/4 mx-auto rounded bg-[#d7e6de] animate-pulse mb-2" />
      <div className="h-4 w-1/2 mx-auto rounded bg-[#d7e6de] animate-pulse" />
    </div>
  </div>
);

const FilterChip = ({ label, onRemove }) => (
  <button
    type="button"
    onClick={onRemove}
    className="group inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-[#e7f0eb] border border-[#c9d9cf] text-xs font-semibold text-[#2C5E48] hover:bg-[#dce8e1] transition"
  >
    {label}
    <XMarkIcon className="w-3.5 h-3.5 text-[#6e947e] group-hover:text-[#2C5E48] transition" />
  </button>
);

const TimeUnit = ({ value, label, size = "sm" }) => (
  <div
    className={
      size === "lg"
        ? "min-w-[70px] sm:min-w-[84px] bg-white/95 rounded-xl py-3 px-2 text-center border border-white/40"
        : "min-w-[34px] bg-white/95 rounded-md py-1 px-1.5 text-center"
    }
  >
    <span
      className={`block font-semibold leading-none tabular-nums text-[#2C5E48] ${
        size === "lg" ? "text-3xl sm:text-4xl" : "text-sm"
      }`}
    >
      {pad(value)}
    </span>
    <span
      className={`block font-medium text-[#6d7a74] ${
        size === "lg" ? "text-[10px] mt-2 tracking-wide" : "text-[7px] mt-1"
      }`}
    >
      {label}
    </span>
  </div>
);

/* ===================== MAIN ===================== */

const PhoneSpeed = () => {
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

  const [inputPriceRange, setInputPriceRange] = useState({
    min: 0,
    max: MAX_PRICE,
  });
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

  /* ---------- Product modal (like ProductsPage) ---------- */
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const openProductModal = useCallback((productId) => {
    setSelectedProductId(productId);
    setIsModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedProductId(null);
    setIsModalVisible(false);
  }, []);

  /* ---------- Telecel cart state ---------- */
  const [telCart, setTelCart] = useState(() => loadTelCart());
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    saveTelCart(telCart);
  }, [telCart]);

  const telCartItemCount = useMemo(
    () => telCart.items.reduce((sum, it) => sum + (it.quantity || 1), 0),
    [telCart.items]
  );
  const telCartSubtotal = useMemo(
    () =>
      telCart.items.reduce(
        (sum, it) => sum + (Number(it.price) || 0) * (it.quantity || 1),
        0
      ),
    [telCart.items]
  );

  const addToTelCart = useCallback(
    async (product, quantity = 1) => {
      const pid = product.productID || product.id;
      // Call the existing cart hook so the backend still gets the add.
      // If it fails we still update local Tel cart so the UI works.
      try {
        await addProductToCart({ ...product, quantity });
      } catch (e) {
        // swallow — local cart still works
      }
      setTelCart((prev) => {
        const existing = prev.items.find(
          (i) => (i.productID || i.id) === pid
        );
        let nextItems;
        if (existing) {
          nextItems = prev.items.map((i) =>
            i === existing
              ? { ...i, quantity: (i.quantity || 1) + quantity }
              : i
          );
        } else {
          nextItems = [
            ...prev.items,
            {
              ...product,
              cartItemId: generateTelId(), // Always starts with "Tel-"
              quantity,
              addedAt: Date.now(),
            },
          ];
        }
        return { ...prev, items: nextItems };
      });
    },
    [addProductToCart]
  );

  const updateTelCartQty = useCallback((cartItemId, delta) => {
    setTelCart((prev) => ({
      ...prev,
      items: prev.items
        .map((i) =>
          i.cartItemId === cartItemId
            ? { ...i, quantity: Math.max(1, (i.quantity || 1) + delta) }
            : i
        ),
    }));
  }, []);

  const removeFromTelCart = useCallback((cartItemId) => {
    setTelCart((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.cartItemId !== cartItemId),
    }));
  }, []);

  /* ---------- End of Telecel cart ---------- */

  const teaserLines = isTeaser ? teasersBefore : teasersLive;
  const activeTeaser =
    countdown.phase === "ended"
      ? {
          text: "This flash sale has ended — thanks for shopping with us.",
          icon: "closed",
        }
      : teaserLines[teaserIndex] || teaserLines[0];

  const products = useMemo(
    () => productsByShowroom?.[SHOWROOM_ID] || [],
    [productsByShowroom]
  );

  const brands = useMemo(() => {
    return [
      ...new Set(products.map((p) => p.brandName).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const isInWishlist = useCallback(
    (productId) =>
      wishlist.some(
        (item) => item.id === productId || item.productID === productId
      ),
    [wishlist]
  );

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, visible: false }));
  }, []);

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, visible: true });
  }, []);

  useEffect(() => {
    if (teaserLines.length < 2) return undefined;
    const interval = setInterval(() => {
      setTeaserVisible(false);
      setTimeout(() => {
        setTeaserIndex((prev) => (prev + 1) % teaserLines.length);
        setTeaserVisible(true);
      }, 220);
    }, 3500);
    return () => clearInterval(interval);
  }, [teaserLines.length]);

  useEffect(() => {
    setTeaserIndex(0);
    setTeaserVisible(true);
  }, [countdown.phase]);

  useEffect(() => {
    if (isTeaser) return;
    const request = dispatch(fetchProductsByShowroom(SHOWROOM_ID));
    if (request?.then) {
      request.then(() => setHasLoadedOnce(true));
    } else {
      setHasLoadedOnce(true);
    }
  }, [dispatch, isTeaser]);

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

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const price = Number(product.price) || 0;
      const oldPrice = Number(product.oldPrice) || 0;
      const matchesPrice =
        price >= appliedPriceRange[0] && price <= appliedPriceRange[1];
      const matchesDiscount = !showDiscountedOnly || oldPrice > price;
      const matchesBrand =
        !selectedBrand || product.brandName === selectedBrand;
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
          return (
            new Date(b.dateCreated || 0) - new Date(a.dateCreated || 0)
          );
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
    !priceIsDefault ||
    showDiscountedOnly ||
    Boolean(selectedBrand) ||
    sortBy !== "newest";

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
      await addToTelCart(product, 1);
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
    showNotification(
      "Reminder set — we'll flash it here the moment the sale opens"
    );
  };

  /* ===================== FILTERS SIDEBAR ===================== */
  const renderFilters = () => (
    <div className="flex flex-col gap-3">
      <div className="bg-white border border-[#e6e1dc] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-[#2c3330] mb-3">
          Price Range
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-[#6d7a74]">
            Min
            <div className="relative mt-1">
              <span className="absolute left-2 top-2 text-xs font-medium text-[#8a928e]">
                ₵
              </span>
              <input
                type="number"
                min="0"
                value={inputPriceRange.min}
                onChange={(e) =>
                  setInputPriceRange((prev) => ({
                    ...prev,
                    min: e.target.value,
                  }))
                }
                className="w-full pl-6 pr-2 py-2 border border-[#e6e1dc] rounded-lg text-xs outline-none focus:border-[#2C5E48]"
              />
            </div>
          </label>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-[#6d7a74]">
            Max
            <div className="relative mt-1">
              <span className="absolute left-2 top-2 text-xs font-medium text-[#8a928e]">
                ₵
              </span>
              <input
                type="number"
                min="0"
                value={inputPriceRange.max}
                onChange={(e) =>
                  setInputPriceRange((prev) => ({
                    ...prev,
                    max: e.target.value,
                  }))
                }
                className="w-full pl-6 pr-2 py-2 border border-[#e6e1dc] rounded-lg text-xs outline-none focus:border-[#2C5E48]"
              />
            </div>
          </label>
        </div>
        <button
          type="button"
          onClick={applyPriceFilter}
          className="w-full py-2 bg-[#2C5E48] text-white text-xs font-semibold rounded-lg hover:bg-[#234A39] active:scale-[0.98] transition"
        >
          Apply Price
        </button>
      </div>

      <div className="bg-white border border-[#e6e1dc] rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#3c4540]">
            <span className="w-7 h-7 rounded-lg bg-[#e7f0eb] flex items-center justify-center text-[#2C5E48]">
              <TagIcon className="h-4 w-4" />
            </span>
            Discounted Products
          </div>
          <button
            type="button"
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${
              showDiscountedOnly ? "bg-[#2C5E48]" : "bg-[#ddd8d2]"
            }`}
            onClick={() => {
              setShowDiscountedOnly((prev) => !prev);
              setCurrentPage(1);
            }}
            aria-label="Toggle discounted only"
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                showDiscountedOnly ? "translate-x-4" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {brands.length > 0 && (
        <div className="bg-white border border-[#e6e1dc] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[#2c3330] mb-3">Brands</h3>
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
                    ? "bg-[#2C5E48] text-white border-[#2C5E48]"
                    : "bg-white text-[#5c6661] border-[#e6e1dc] hover:border-[#8aaf98]"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate(BROWSE_ALL_URL)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-white border border-[#c9d9cf] text-[#2C5E48] rounded-lg text-xs font-semibold hover:bg-[#e7f0eb] active:scale-[0.98] transition"
      >
        Browse Other Products
        <ChevronRightIcon className="w-3.5 h-3.5" />
      </button>

      {filtersActive && (
        <button
          type="button"
          onClick={resetFilters}
          className="w-full py-2 bg-white text-[#8C3D45] border border-[#e4cfd1] rounded-lg text-xs font-semibold hover:bg-[#f6eeee] active:scale-[0.98] transition"
        >
          Reset All Filters
        </button>
      )}
    </div>
  );

  const isInitialLoading = loading && !hasLoadedOnce;
  const hasNoResults =
    hasLoadedOnce && !loading && filteredProducts.length === 0;
  const noResultsFromFilters = hasNoResults && filtersActive;

  const timerLabel =
    countdown.phase === "live"
      ? "Ends in"
      : isTeaser
      ? "Drops in"
      : null;

  return (
    <>
      <Helmet>
        <title>
          {isTeaser
            ? "Speed Shopping drops 2 October | Franko Trading"
            : "Speed Shopping | Franko Trading"}
        </title>
      </Helmet>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes speedLivePing {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes speedPop {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes cartBounce {
          0% { transform: scale(0); }
          50% { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        .speed-fk-bg { background: linear-gradient(90deg, #A80F1B 0%, #BB1420 50%, #A80F1B 100%); }
        .speed-green-bg { background: #2A5644; }
        .speed-pop { animation: speedPop 0.28s ease-out; }
        .cart-bounce { animation: cartBounce 0.35s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .speed-pop, .cart-bounce { animation: none !important; }
        }
      `}</style>

      <Notification
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
        onClose={hideNotification}
      />

      <div className="min-h-screen bg-[#f7f5f3] text-[#2c3330]">
        <div className="mx-auto w-full max-w-[1800px] px-3 sm:px-5 lg:px-8 py-3 sm:py-3">

          {/* ==================== BANNER ==================== */}
          <header className="speed-fk-bg relative flex flex-col md:flex-row md:items-center md:justify-between gap-3 min-h-[46px] px-4 py-3 md:px-5 rounded-xl border border-[#A80F1B]">
            <div className="relative z-[1] flex items-center gap-3 min-w-0">
              {/* Telecel logo + Speed Shopping logo side by side */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <img
                  src={telecelWhite}
                  alt="Telecel"
                  className="h-12 sm:h-14 w-auto object-contain"
                />
                <span className="h-10 sm:h-12 w-px bg-white/25" aria-hidden="true" />
                <img
                  src={speedLogo}
                  alt="Speed Shopping"
                  className="h-12 sm:h-14 w-auto object-contain"
                />
              </div>
              <div className="min-w-0 hidden sm:block">
                <h1 className="text-base sm:text-lg lg:text-2xl font-semibold text-white leading-tight">
                   <span style={{ color: COLOR.goldText }}>Speed Shopping</span>
                </h1>
                <p
                  className={`flex items-center gap-1.5 text-[12px] lg:text-[13px] text-white/90 mt-0.5 transition-opacity duration-200 ${
                    teaserVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <TeaserGlyph
                    name={activeTeaser.icon}
                    className="w-3.5 h-3.5 flex-shrink-0"
                    // gold glyph
                    style={{ color: "#FFD400" }}
                  />
                  <span>{activeTeaser.text}</span>
                </p>
              </div>
            </div>

            {/* Countdown + actions */}
            <div className="relative z-[1] flex flex-col sm:flex-row sm:items-center gap-2.5 w-full md:w-auto">
              {countdown.phase !== "ended" ? (
                <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto bg-black/10 md:bg-transparent px-3 md:px-0 py-2 md:py-0 rounded-lg md:rounded-none">
                  <span className="flex items-center gap-1.5 text-white text-[10px] font-semibold uppercase tracking-[0.14em] whitespace-nowrap">
                    {countdown.phase === "live" && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span
                          className="absolute inline-flex h-full w-full rounded-full bg-[#FFD400] opacity-70"
                          style={{
                            animation:
                              "speedLivePing 1.8s cubic-bezier(0,0,0.2,1) infinite",
                          }}
                        />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#FFD400]" />
                      </span>
                    )}
                    {timerLabel}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {countdown.days > 0 && (
                      <>
                        <TimeUnit value={countdown.days} label="DAYS" />
                        <span className="text-white/35 font-medium">:</span>
                      </>
                    )}
                    <TimeUnit value={countdown.hours} label="HRS" />
                    <span className="text-white/35 font-medium">:</span>
                    <TimeUnit value={countdown.minutes} label="MIN" />
                    <span className="text-white/35 font-medium">:</span>
                    <TimeUnit value={countdown.seconds} label="SEC" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full md:w-auto bg-white/10 px-3 py-2 rounded-lg">
                  <SparklesIcon className="w-4 h-4 text-[#FFD400] flex-shrink-0" />
                  <span className="text-xs font-medium text-[#F0E2C4]">
                    Sale ended
                  </span>
                </div>
              )}

              {/* Cart button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/15 whitespace-nowrap transition active:scale-[0.98]"
              >
                <CartOutlineIcon className="w-4 h-4" />
                Cart
                {telCartItemCount > 0 && (
                  <span
                    key={telCartItemCount}
                    className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 text-[10px] font-bold rounded-full flex items-center justify-center cart-bounce"
                    style={{ background: COLOR.goldBtn, color: COLOR.forestDeep }}
                  >
                    {telCartItemCount}
                  </span>
                )}
              </button>

              {isTeaser && (
                <button
                  type="button"
                  onClick={handleNotifyMe}
                  disabled={notifyMeOn}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition active:scale-[0.98] ${
                    notifyMeOn
                      ? "bg-white/10 text-[#F0E2C4] cursor-default"
                      : "bg-[#FFD400] text-[#234A39] hover:bg-[#e6bf00]"
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
                className="hidden md:inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/15 whitespace-nowrap transition active:scale-[0.98]"
              >
                Browse Other Products
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {/* ==================== TEASER MODE ==================== */}
          {isTeaser ? (
            <section className="mt-5">
              <div className="speed-green-bg relative rounded-2xl border border-[#234A39] px-5 py-14 sm:py-16 text-center">
                <div className="relative z-[1] max-w-lg mx-auto flex flex-col items-center">
                  <div className="flex items-center gap-3">
                    <img
                      src={telecelWhite}
                      alt="Telecel"
                      className="h-20 sm:h-24 w-auto object-contain"
                    />
                    <span className="h-16 w-px bg-white/25" aria-hidden="true" />
                    <img
                      src={speedLogo}
                      alt="Speed Shopping"
                      className="h-20 sm:h-24 w-auto object-contain"
                    />
                  </div>

                  <h2 className="mt-5 text-3xl sm:text-[2rem] font-semibold text-white leading-tight tracking-tight">
                    Coming soon
                  </h2>
                  <p className="mt-2 text-sm text-[#d5e4db]">
                    Speed Shopping starts on {LAUNCH_LABEL}
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
                      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition active:scale-[0.98] ${
                        notifyMeOn
                          ? "bg-white/10 text-white cursor-default"
                          : "bg-[#FFD400] text-[#234A39] hover:bg-[#e6bf00]"
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
                      className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/15 transition active:scale-[0.98]"
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
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#2C5E48] text-white text-sm font-semibold active:scale-[0.98] transition"
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
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white border border-[#e6e1dc] text-sm font-medium active:scale-[0.98] transition"
                    onClick={() => setIsSortOpen((prev) => !prev)}
                  >
                    <Bars3BottomLeftIcon className="w-4 h-4" />
                    {sortOptions.find((option) => option.value === sortBy)?.label}
                    <ChevronDownIcon
                      className={`w-4 h-4 transition-transform ${
                        isSortOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isSortOpen && (
                    <div
                      className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-[#e6e1dc] rounded-lg shadow-lg overflow-hidden"
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
                          className={`w-full px-4 py-2.5 text-left text-sm border-b border-[#f1eeea] last:border-0 transition ${
                            sortBy === option.value
                              ? "bg-[#e7f0eb] font-semibold text-[#2C5E48]"
                              : "text-[#3c4540] hover:bg-[#f7f5f3]"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ==================== MOBILE FILTER DRAWER ==================== */}
              {isDrawerOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                  <div
                    className="absolute inset-0 bg-black/40"
                    onClick={() => setIsDrawerOpen(false)}
                  />
                  <div className="absolute left-0 top-0 h-full w-[320px] max-w-[90vw] bg-white p-5 overflow-y-auto animate-[slideIn_0.25s_ease-out]">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-lg font-semibold text-[#2c3330]">
                        Filters
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsDrawerOpen(false)}
                        className="p-1 rounded hover:bg-[#f7f5f3]"
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
                <aside className="hidden lg:block w-64 flex-shrink-0">
                  <div className="sticky top-5">{renderFilters()}</div>
                </aside>

                <main className="flex-1 min-w-0">
                  {filtersActive && !isInitialLoading && (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {!priceIsDefault && (
                        <FilterChip
                          label={`${formatPrice(appliedPriceRange[0])} – ${formatPrice(
                            appliedPriceRange[1]
                          )}`}
                          onRemove={removePriceFilter}
                        />
                      )}
                      {showDiscountedOnly && (
                        <FilterChip
                          label="Discounted only"
                          onRemove={removeDiscountFilter}
                        />
                      )}
                      {selectedBrand && (
                        <FilterChip
                          label={selectedBrand}
                          onRemove={removeBrandFilter}
                        />
                      )}
                      {sortBy !== "newest" && (
                        <FilterChip
                          label={
                            sortOptions.find((o) => o.value === sortBy)?.label
                          }
                          onRemove={removeSortFilter}
                        />
                      )}
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-xs font-semibold text-[#8C3D45] hover:underline ml-1"
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
                            ? Math.round(
                                ((oldPrice - price) / oldPrice) * 100
                              )
                            : 0;
                          const justAdded = recentlyAdded.has(productId);

                          return (
                            <article
                              key={productId}
                              className="group bg-white border border-[#e6e1dc] rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                            >
                              <div
                                className="relative h-48 sm:h-60 md:h-72 flex items-center justify-center p-3 cursor-pointer"
                                onClick={() => openProductModal(productId)}
                              >
                                {soldOut && (
                                  <span className="absolute top-2 left-2 z-10 px-2 py-0.5 text-[9px] font-semibold rounded-full bg-[#234A39] text-white">
                                    Sold Out
                                  </span>
                                )}
                                {onSale && !soldOut && (
                                  <span className="absolute top-2 right-2 z-10 px-2 py-0.5 text-[9px] font-semibold rounded-full bg-[#FFD400] text-[#234A39]">
                                    -{discount}%
                                  </span>
                                )}

                                <img
                                  src={getImageUrl(product.productImage)}
                                  alt={product.productName || "Product"}
                                  loading="lazy"
                                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                                />

                                <div
                                  className="absolute inset-0 bg-[#1e2824]/35 hidden group-hover:flex items-center justify-center gap-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition"
                                    onClick={() => handleWishlistToggle(product)}
                                    aria-label="Wishlist"
                                  >
                                    {isInWishlist(productId) ? (
                                      <SolidHeartIcon className="w-4 h-4 text-[#8C3D45]" />
                                    ) : (
                                      <OutlineHeartIcon className="w-4 h-4 text-[#8a928e]" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition"
                                    onClick={() => openProductModal(productId)}
                                    aria-label="View"
                                  >
                                    <EyeIcon className="w-4 h-4 text-[#2C5E48]" />
                                  </button>
                                  <button
                                    type="button"
                                    className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                    onClick={() => handleAddToCart(product)}
                                    disabled={cartLoading || soldOut}
                                    aria-label="Add to cart"
                                  >
                                    {justAdded ? (
                                      <CheckIcon className="w-4 h-4 text-[#2C5E48] speed-pop" />
                                    ) : (
                                      <ShoppingCartIcon className="w-4 h-4 text-[#2C5E48]" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="p-3 border-t border-[#f1eeea] text-center">
                                <h3 className="text-sm font-medium text-[#2c3330] line-clamp-2 min-h-[38px]">
                                  {product.productName || "Unnamed product"}
                                </h3>
                                <p className="mt-2 text-[15px] font-semibold text-[#2C5E48]">
                                  {formatPrice(price)}
                                </p>
                                {onSale && (
                                  <p className="text-xs text-[#8a928e] line-through">
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

                      <div className="flex justify-center mt-8">
                        <button
                          type="button"
                          onClick={() => navigate(BROWSE_ALL_URL)}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-[#c9d9cf] bg-white text-[#2C5E48] text-sm font-semibold hover:bg-[#e7f0eb] active:scale-[0.98] transition"
                        >
                          Browse Other Products
                          <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}

                  {hasNoResults && (
                    <div className="bg-white border border-[#e6e1dc] rounded-xl p-10 sm:p-12 text-center">
                      {noResultsFromFilters ? (
                        <>
                          <h2 className="text-2xl font-semibold text-[#2C5E48] mb-2">
                            No matches for these filters
                          </h2>
                          <p className="text-[#6d7a74] text-sm max-w-md mx-auto mb-6">
                            Try widening your price range or clearing a filter
                            to see more Speed Shopping deals.
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={resetFilters}
                              className="px-6 py-3 rounded-lg bg-[#2C5E48] text-white text-sm font-semibold hover:bg-[#234A39] active:scale-[0.98] transition"
                            >
                              Clear All Filters
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(BROWSE_ALL_URL)}
                              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-lg border border-[#c9d9cf] text-[#2C5E48] text-sm font-semibold hover:bg-[#e7f0eb] active:scale-[0.98] transition"
                            >
                              Browse Other Products
                              <ChevronRightIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#e7f0eb] text-[#2C5E48] flex items-center justify-center">
                            <BagIcon className="w-6 h-6" />
                          </div>
                          <h2 className="text-2xl font-semibold text-[#2C5E48] mb-2">
                            {countdown.phase === "ended"
                              ? "Speed Shopping is closed"
                              : "Deals are still loading"}
                          </h2>
                          <p className="text-[#6d7a74] text-sm max-w-md mx-auto mb-6">
                            {countdown.phase === "ended"
                              ? "The 24-hour window has closed. Thanks for shopping with us — the rest of the store is open as usual."
                              : "The first batch is being uploaded now. Refresh in a moment, or explore the rest of the store while you wait."}
                          </p>
                          <button
                            type="button"
                            onClick={() => navigate(BROWSE_ALL_URL)}
                            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-lg bg-[#2C5E48] text-white text-sm font-semibold hover:bg-[#234A39] active:scale-[0.98] transition"
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

      {/* ==================== PRODUCT DETAIL MODAL ==================== */}
      {selectedProductId && (
        <ProductDetailModal
          productID={selectedProductId}
          isModalVisible={isModalVisible}
          onClose={closeModal}
        />
      )}

      {/* ==================== TELECEL CART DRAWER ==================== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[9998]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-[slideIn_0.25s_ease-out]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#2c3330] flex items-center gap-2">
                <ShoppingCartIcon className="w-5 h-5" style={{ color: COLOR.red }} />
                Your Cart
                <span
                  className="ml-1 px-2 py-0.5 text-xs rounded-full text-white"
                  style={{ background: COLOR.red }}
                >
                  {telCartItemCount}
                </span>
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="Close cart"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ scrollbarWidth: "thin" }}>
              {telCart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                    style={{ background: COLOR.sage }}
                  >
                    <CartOutlineIcon
                      className="w-8 h-8"
                      style={{ color: COLOR.forest }}
                    />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    Your cart is empty
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Add some Telecel Speed Shopping deals!
                  </p>
                </div>
              ) : (
                telCart.items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition"
                  >
                    <img
                      src={getImageUrl(item.productImage)}
                      alt={item.productName || "Product"}
                      className="w-16 h-16 object-contain rounded bg-gray-50 flex-shrink-0"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://via.placeholder.com/100?text=Product";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                        {item.productName || "Product"}
                      </p>
                      <p
                        className="text-[10px] font-mono text-gray-400 mt-1 truncate"
                        title={item.cartItemId}
                      >
                        {item.cartItemId}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p
                          className="text-sm font-bold"
                          style={{ color: COLOR.forest }}
                        >
                          {formatPrice(item.price)}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-gray-200 rounded">
                            <button
                              onClick={() =>
                                updateTelCartQty(item.cartItemId, -1)
                              }
                              className="w-6 h-6 text-gray-500 hover:bg-green-50 hover:text-green-800 text-sm font-semibold flex items-center justify-center"
                            >
                              <MinusIcon className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateTelCartQty(item.cartItemId, 1)
                              }
                              className="w-6 h-6 text-gray-500 hover:bg-green-50 hover:text-green-800 text-sm font-semibold flex items-center justify-center"
                            >
                              <PlusIcon className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromTelCart(item.cartItemId)}
                            className="text-gray-400 hover:text-red-600 transition"
                            title="Remove"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {telCart.items.length > 0 && (
                <p className="text-[10px] font-mono text-gray-400 text-center pt-2">
                  Cart ID: {telCart.id}
                </p>
              )}
            </div>

            {telCart.items.length > 0 && (
              <div className="border-t border-gray-100 p-5 space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(telCartSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold text-[#2c3330]">
                  <span>Total</span>
                  <span style={{ color: COLOR.forest }}>
                    {formatPrice(telCartSubtotal)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    showNotification("Proceeding to checkout...");
                    setIsCartOpen(false);
                  }}
                  className="w-full py-3 rounded-lg text-white font-semibold transition active:scale-[0.98] hover:brightness-110"
                  style={{ background: COLOR.forest }}
                >
                  Checkout
                </button>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-2.5 rounded-lg border text-sm font-semibold transition hover:bg-gray-50"
                  style={{ borderColor: COLOR.sageLine, color: COLOR.forest }}
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close sort menu on outside click */}
      {isSortOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setIsSortOpen(false)}
        />
      )}
    </>
  );
};

export default PhoneSpeed;
