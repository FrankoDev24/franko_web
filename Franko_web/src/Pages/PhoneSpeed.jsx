import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Helmet } from "react-helmet";
import {
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  Bars3BottomLeftIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as OutlineHeartIcon,
  HeartIcon as SolidHeartIcon,
  ShoppingCartIcon,
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
import { getCartById } from "../Redux/Slice/cartSlice";
import TelCartSidebar from "../Component/TelCartSidebar";
import speedLogo from "../assets/speed-logo.png";
import telecelWhite from "../assets/Telecel White.png";

/* ===================== SHOWROOM / CONFIG ===================== */

const SHOWROOM_ID = "1eb2a7fe-7c6d-4b98-b806-3e9a82164f1f";
const PRODUCTS_PER_PAGE = 12;
const MAX_PRICE = 200000;

// Sale window — 24 hours, starting 8:00 AM Accra time.
// Accra is GMT+0 all year round, so the "Z" (UTC) offset is correct as-is.
const PROMO_START = Date.parse("2026-10-02T08:00:00Z");
const PROMO_END = PROMO_START + 24 * 60 * 60 * 1000;

// Orders are accepted during the pre-launch countdown too, so products for
// this showroom are always rendered (never hidden behind the teaser).
// Flip to `false` if the grid should ever become browse-only until launch.
const ALLOW_EARLY_ORDERS = true;

// Human label derived from PROMO_START so it can never drift out of sync.
const PROMO_START_LABEL = (() => {
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Accra",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(PROMO_START));
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Accra",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(PROMO_START));
  return `${date}, ${time}`;
})();

/* Telecel palette — this flow uses no green. */
const COLOR = {
  red: "#BB1420",        // Telecel red — primary
  redDeep: "#A80F1B",    // pressed / hover
  redDeeper: "#7A0B13",  // deep red (text on gold, toasts)
  gold: "#FFD400",       // Telecel gold — accents + cart
  goldText: "#FFD400",
  goldBtn: "#FFD400",
  rose: "#F6EEEE",       // light red surface
  roseLight: "#FDF0F0",  // lightest red surface
  roseLine: "#E4CFD1",   // light red border
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
        className="flex items-center gap-3 min-w-[280px] px-4 py-3 rounded-xl shadow-xl text-white text-sm font-semibold"
        style={{ background: type === "success" ? COLOR.red : COLOR.redDeeper }}
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
  <div className="bg-white border border-[#F0E6E6] rounded-2xl overflow-hidden">
    <div className="h-44 sm:h-56 md:h-64 bg-gradient-to-r from-[#F8EEEE] via-[#FDF7F7] to-[#F8EEEE] animate-pulse" />
    <div className="p-3.5">
      <div className="h-4 w-3/4 rounded bg-[#F1DEDE] animate-pulse mb-2" />
      <div className="h-4 w-1/2 rounded bg-[#F1DEDE] animate-pulse mb-3" />
      <div className="h-9 w-full rounded-xl bg-[#F8EEEE] animate-pulse" />
    </div>
  </div>
);

const FilterChip = ({ label, onRemove }) => (
  <button
    type="button"
    onClick={onRemove}
    className="group inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-[#FDF0F0] border border-[#E4CFD1] text-xs font-semibold text-[#BB1420] hover:bg-[#F6E3E5] transition"
  >
    {label}
    <XMarkIcon className="w-3.5 h-3.5 text-[#C49AA0] group-hover:text-[#BB1420] transition" />
  </button>
);

const TimeUnit = ({ value, label, size = "sm" }) => (
  <div
    className={
      size === "lg"
        ? "min-w-[70px] sm:min-w-[84px] bg-white/95 rounded-xl py-3 px-2 text-center border border-white/40 shadow-sm"
        : "min-w-[34px] bg-white/95 rounded-md py-1 px-1.5 text-center"
    }
  >
    <span
      className={`block font-semibold leading-none tabular-nums text-[#BB1420] ${
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

  const { productsByShowroom = {}, loading } = useSelector(
    (state) => state.products
  );
  // The standard cart — same slice Cart.jsx uses. Its id begins with "Tel".
  const { cart: reduxCart = [], cartId: reduxCartId } = useSelector(
    (state) => state.cart
  );
  const wishlist = useSelector((state) => state.wishlist.items || []);
  const { addProductToCart, loading: cartLoading } = useAddToCart();

  const countdown = useCountdown();
  const isTeaser = countdown.phase === "before";
  // Pre-launch orders are allowed, so the catalog renders in every phase.
  const canOrder = ALLOW_EARLY_ORDERS || !isTeaser;

  const [teaserIndex, setTeaserIndex] = useState(0);
  const [teaserVisible, setTeaserVisible] = useState(true);
  const [recentlyAdded, setRecentlyAdded] = useState(() => new Set());

  const [inputPriceRange, setInputPriceRange] = useState({
    min: 0,
    max: MAX_PRICE,
  });
  const [appliedPriceRange, setAppliedPriceRange] = useState([0, MAX_PRICE]);
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

  /* ---------- Cart (standard slice, "Tel" cart id) ---------- */
  const [isCartOpen, setIsCartOpen] = useState(false);
  /* id of the product currently being added — drives the card spinner and the
     loading state on the header cart icon. */
  const [addingProductId, setAddingProductId] = useState(null);

  const cartItemCount = useMemo(
    () => (reduxCart || []).reduce((sum, it) => sum + (it.quantity || 1), 0),
    [reduxCart]
  );
  /* Latest cart, readable from inside an async handler without a stale closure. */
  const cartRef = useRef(reduxCart);
  cartRef.current = reduxCart;

  /* The app encrypts localStorage and its getItem already returns parsed JSON,
     so accept both an array and a JSON string here. */
  const readStoredCart = useCallback(() => {
    try {
      const raw = localStorage.getItem("cart");
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (typeof raw === "string") {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  /** How many of this product the cart holds right now (redux ⊕ storage). */
  const getCartLineQty = useCallback(
    (id) => {
      const matches = (item) =>
        String(
          item?.productId ??
            item?.productID ??
            item?.ProductId ??
            item?.ProductID ??
            item?.id ??
            ""
        ) === String(id);
      const sum = (list) =>
        (list || []).reduce(
          (total, item) =>
            matches(item) ? total + (Number(item.quantity) || 1) : total,
          0
        );
      return Math.max(sum(cartRef.current), sum(readStoredCart()));
    },
    [readStoredCart]
  );

  const cartBusy = cartLoading || addingProductId !== null;

  // Refresh from the API once, so the sidebar matches the server cart.
  useEffect(() => {
    const storedId = reduxCartId || localStorage.getItem("cartId");
    if (storedId) dispatch(getCartById(storedId));
  }, [dispatch, reduxCartId]);
  /* ---------- End of cart ---------- */

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

  /* Products for this showroom are loaded in EVERY phase — the teaser must
     not stop the fetch, otherwise the grid stays empty until launch. */
  const loadProducts = useCallback(() => {
    const request = dispatch(fetchProductsByShowroom(SHOWROOM_ID));
    if (request?.then) {
      request.then(() => setHasLoadedOnce(true));
    } else {
      setHasLoadedOnce(true);
    }
  }, [dispatch]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const applyPriceFilter = () => {
    const min = Math.max(0, Number(inputPriceRange.min) || 0);
    const max = Math.min(MAX_PRICE, Number(inputPriceRange.max) || MAX_PRICE);
    setAppliedPriceRange([Math.min(min, max), Math.max(min, max)]);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setInputPriceRange({ min: 0, max: MAX_PRICE });
    setAppliedPriceRange([0, MAX_PRICE]);
    setSelectedBrand("");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const price = Number(product.price) || 0;
      const matchesPrice =
        price >= appliedPriceRange[0] && price <= appliedPriceRange[1];
      const matchesBrand =
        !selectedBrand || product.brandName === selectedBrand;
      return matchesPrice && matchesBrand;
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
  }, [products, appliedPriceRange, selectedBrand, sortBy]);

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

  const filtersActive = !priceIsDefault || Boolean(selectedBrand) || sortBy !== "newest";

  const removePriceFilter = () => {
    setInputPriceRange({ min: 0, max: MAX_PRICE });
    setAppliedPriceRange([0, MAX_PRICE]);
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

  const flashAdded = useCallback((id) => {
    setRecentlyAdded((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setRecentlyAdded((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1600);
  }, []);

  const handleAddToCart = async (product) => {
    if (!canOrder) {
      showNotification(
        `Ordering opens ${PROMO_START_LABEL} — browse for now`,
        "error"
      );
      return;
    }
    if (Number(product.stock) === 0) {
      showNotification("This product is out of stock", "error");
      return;
    }

    const id = product.productID || product.id;
    const qtyBefore = getCartLineQty(id);

    setAddingProductId(id);
    try {
      await addProductToCart({ ...product, quantity: 1 });
    } catch {
      /* The call can reject even when the line landed (optimistic write, or a
         failing follow-up refetch). The cart below has the final say. */
    } finally {
      setAddingProductId(null);
    }

    /* Poll briefly: the slice may update redux / localStorage a beat later. */
    const landed = await new Promise((resolve) => {
      let tries = 0;
      const check = () => {
        tries += 1;
        if (getCartLineQty(id) > qtyBefore) return resolve(true);
        if (tries >= 6) return resolve(false);
        return setTimeout(check, 120);
      };
      check();
    });

    if (landed) {
      showNotification("Added to cart successfully");
      flashAdded(id);
    } else {
      showNotification(
        "Couldn't add this item to your cart. Please try again.",
        "error"
      );
    }
  };

  /* ===================== FILTERS SIDEBAR ===================== */
  const renderFilters = () => (
    <div className="flex flex-col gap-3">
      <div className="bg-white border border-[#F0E6E6] rounded-2xl p-4 shadow-sm">
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
                className="w-full pl-6 pr-2 py-2 border border-[#e6e1dc] rounded-xl text-xs outline-none focus:border-[#BB1420]"
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
                className="w-full pl-6 pr-2 py-2 border border-[#e6e1dc] rounded-xl text-xs outline-none focus:border-[#BB1420]"
              />
            </div>
          </label>
        </div>
        <button
          type="button"
          onClick={applyPriceFilter}
          className="w-full py-2 bg-[#BB1420] text-white text-xs font-semibold rounded-xl hover:bg-[#A80F1B] active:scale-[0.98] transition"
        >
          Apply Price
        </button>
      </div>

      {brands.length > 0 && (
        <div className="bg-white border border-[#F0E6E6] rounded-2xl p-4 shadow-sm">
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
                    ? "bg-[#BB1420] text-white border-[#BB1420]"
                    : "bg-white text-[#5c6661] border-[#e6e1dc] hover:border-[#D8B4B8]"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtersActive && (
        <button
          type="button"
          onClick={resetFilters}
          className="w-full py-2 bg-white text-[#8C3D45] border border-[#e4cfd1] rounded-xl text-xs font-semibold hover:bg-[#f6eeee] active:scale-[0.98] transition"
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
    countdown.phase === "live" ? "Ends in" : isTeaser ? "Drops in" : null;

  const rangeStart = (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const rangeEnd = Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length);

  const emptyHeadline = noResultsFromFilters
    ? "No matches for these filters"
    : countdown.phase === "ended"
    ? "Speed Shopping is closed"
    : isTeaser
    ? "Deals are on the way"
    : "Deals are still loading";

  const emptyBody = noResultsFromFilters
    ? "Try widening your price range or clearing a brand to see more Speed Shopping deals."
    : countdown.phase === "ended"
    ? "The 24-hour window has closed. Thanks for shopping with us — the rest of the store is open as usual."
    : isTeaser
    ? `The sale opens ${PROMO_START_LABEL}. Stock is being uploaded now — refresh in a moment.`
    : "The first batch is being uploaded now. Refresh in a moment.";

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
        .speed-green-bg { background: linear-gradient(135deg, #A80F1B 0%, #BB1420 100%); }
        .speed-pop { animation: speedPop 0.28s ease-out; }
        .cart-bounce { animation: cartBounce 0.35s ease-out; }

        /* ---------- product card ---------- */
        .speed-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .speed-card:hover,
        .speed-card:focus-visible {
          transform: translateY(-4px);
          border-color: #E4CFD1;
          box-shadow: 0 18px 34px -18px rgba(187, 20, 32, 0.35);
          outline: none;
        }
        .speed-card-media img { transition: transform 0.35s ease; }
        .speed-card:hover .speed-card-media img { transform: scale(1.06); }
        .speed-card-view {
          opacity: 0; transform: translateY(6px);
          transition: opacity 0.22s ease, transform 0.22s ease;
        }
        .speed-card:hover .speed-card-view { opacity: 1; transform: translateY(0); }
        .speed-card-add { transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease; }
        .speed-card-add:active:not(:disabled) { transform: scale(0.98); }

        /* ---------- cart (icon only, no button chrome) ---------- */
        .speed-cart-btn {
          transition: transform 0.18s ease, background 0.18s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .speed-cart-btn:hover { background: rgba(255, 255, 255, 0.12); transform: translateY(-1px); }
        .speed-cart-btn:active { transform: scale(0.94); }

        @media (prefers-reduced-motion: reduce) {
          .speed-pop, .cart-bounce { animation: none !important; }
          .speed-card, .speed-card-media img, .speed-card-view, .speed-cart-btn { transition: none !important; }
          .speed-card:hover { transform: none; }
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
          <div className="sticky top-0 z-30 -mx-3 sm:-mx-5 lg:-mx-8 px-3 sm:px-5 lg:px-8 pt-3 pb-3 bg-[#f7f5f3]/95 backdrop-blur-sm">
            <header className="speed-fk-bg relative flex flex-col md:flex-row md:items-center md:justify-between gap-3 min-h-[46px] px-4 py-3 md:px-5 rounded-xl border border-[#A80F1B] shadow-[0_10px_30px_-18px_rgba(187,20,32,0.9)]">
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
                      className="w-3.5 h-3.5 flex-shrink-0 text-[#FFD400]"
                    />
                    <span>{activeTeaser.text}</span>
                  </p>
                </div>
              </div>

              {/* Countdown + cart */}
              <div className="relative z-[1] flex items-center gap-2.5 w-full md:w-auto">
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

                {/* ===== the cart — icon only, always in reach ===== */}
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  aria-label={`Open cart, ${cartItemCount} item${
                    cartItemCount === 1 ? "" : "s"
                  }`}
                  className="speed-cart-btn relative inline-flex h-11 w-11 items-center justify-center rounded-full text-white flex-shrink-0"
                >
                  {cartBusy ? (
                    <span
                      aria-hidden="true"
                      className="h-6 w-6 rounded-full border-[3px] border-white/30 border-t-[#FFD400] animate-spin"
                    />
                  ) : (
                    <ShoppingCartIcon className="w-7 h-7 drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]" />
                  )}

                  {cartItemCount > 0 && !cartBusy && (
                    <span
                      key={cartItemCount}
                      className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 text-[11px] font-black rounded-full flex items-center justify-center cart-bounce ring-2 ring-[#A80F1B]"
                      style={{ background: COLOR.goldBtn, color: COLOR.redDeeper }}
                    >
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </header>
          </div>

          {/* ==================== PRE-LAUNCH HERO ====================
              Shown only before the promo opens. The product grid still
              renders below it, so the showroom is never hidden. */}
          {isTeaser && (
            <section className="mt-1">
              <div className="speed-green-bg relative rounded-2xl border border-[#A80F1B] px-5 py-9 sm:py-11 text-center">
                <div className="relative z-[1] max-w-lg mx-auto flex flex-col items-center">
                  <div className="flex items-center gap-3">
                    <img
                      src={telecelWhite}
                      alt="Telecel"
                      className="h-16 sm:h-20 w-auto object-contain"
                    />
                    <span className="h-14 w-px bg-white/25" aria-hidden="true" />
                    <img
                      src={speedLogo}
                      alt="Speed Shopping"
                      className="h-16 sm:h-20 w-auto object-contain"
                    />
                  </div>

                  <h2 className="mt-4 text-2xl sm:text-3xl font-semibold text-white leading-tight tracking-tight">
                    Coming soon
                  </h2>
                  <p className="mt-2 text-sm text-[#FBD9DC]">
                    Speed Shopping starts on {PROMO_START_LABEL}
                  </p>

                  <div className="mt-6 flex items-center justify-center gap-2 sm:gap-3">
                    {countdown.days > 0 && (
                      <TimeUnit value={countdown.days} label="DAYS" size="lg" />
                    )}
                    <TimeUnit value={countdown.hours} label="HRS" size="lg" />
                    <TimeUnit value={countdown.minutes} label="MIN" size="lg" />
                    <TimeUnit value={countdown.seconds} label="SEC" size="lg" />
                  </div>

                  {ALLOW_EARLY_ORDERS && (
                    <p className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-[#FFD400]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FFD400]" />
                      Ordering is open — shop the deals below
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ==================== PRE-LAUNCH NOTICE ==================== */}
          {isTeaser && (
            <div className="mt-4 flex items-start sm:items-center gap-2.5 rounded-xl border border-[#e5cd75] bg-[#FFF8DB] px-4 py-2.5">
              <SparklesIcon
                className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0"
                style={{ color: "#A87D00" }}
              />
              <p className="text-xs sm:text-sm text-[#6f5410]">
                {ALLOW_EARLY_ORDERS
                  ? `Prices below are live now — browse and place your order before the sale ends. The 24-hour window opens ${PROMO_START_LABEL}.`
                  : `Sale opens ${PROMO_START_LABEL}. You can browse everything below now — ordering unlocks when the timer hits zero.`}
              </p>
            </div>
          )}

          {/* ==================== CATALOG (all phases) ==================== */}
          <>
              {/* ==================== MOBILE CONTROLS ==================== */}
              <div className="flex gap-3 mt-4 lg:hidden">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#BB1420] text-white text-sm font-semibold active:scale-[0.98] transition"
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
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-[#e6e1dc] text-sm font-medium active:scale-[0.98] transition"
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
                      className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-[#e6e1dc] rounded-xl shadow-xl overflow-hidden"
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
                              ? "bg-[#FDF0F0] font-semibold text-[#BB1420]"
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
                  <div className="sticky top-28">{renderFilters()}</div>
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
                      <div className="flex items-baseline justify-between mb-3">
                        <p className="text-xs font-semibold text-[#6d7a74]">
                          Showing {rangeStart}–{rangeEnd} of {filteredProducts.length}{" "}
                          deal{filteredProducts.length === 1 ? "" : "s"}
                        </p>
                      </div>

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
                          const isAddingThis = String(addingProductId) === String(productId);
                          const addDisabled =
                            cartLoading || soldOut || !canOrder || isAddingThis;

                          return (
                            <article
                              key={productId}
                              role="button"
                              tabIndex={0}
                              aria-label={`View details for ${
                                product.productName || "this product"
                              }`}
                              onClick={() => openProductModal(productId)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  openProductModal(productId);
                                }
                              }}
                              className="speed-card group relative flex flex-col bg-white border border-[#F0E6E6] rounded-2xl overflow-hidden cursor-pointer"
                            >
                              {/* ---------- media ---------- */}
                              <div className="speed-card-media relative h-44 sm:h-56 md:h-64 flex items-center justify-center p-4 bg-gradient-to-b from-[#FDF9F9] to-white">
                                {/* ---- Speed Shopping tag + status, stacked ---- */}
                                <div className="absolute top-2.5 left-2.5 z-10 flex flex-col items-start gap-1.5">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#BB1420] px-2 py-[3px] text-[9px] font-black uppercase tracking-[0.08em] text-[#FFD400] shadow-[0_4px_10px_-4px_rgba(187,20,32,0.9)]">
                                    <PriceTagIcon className="h-2.5 w-2.5" />
                                    Speed Shopping
                                  </span>
                                  {soldOut && (
                                    <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide rounded-full bg-[#5F5652] text-white">
                                      Sold Out
                                    </span>
                                  )}
                                  {onSale && !soldOut && (
                                    <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-[#FFD400] text-[#7A0B13] shadow-sm">
                                      -{discount}%
                                    </span>
                                  )}
                                </div>

                                <img
                                  src={getImageUrl(product.productImage)}
                                  alt={product.productName || "Product"}
                                  loading="lazy"
                                  className="h-full w-full object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.06)]"
                                />

                                {/* wishlist — always visible, no hover needed */}
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleWishlistToggle(product);
                                  }}
                                  aria-label={
                                    isInWishlist(productId)
                                      ? "Remove from wishlist"
                                      : "Add to wishlist"
                                  }
                                  className="absolute top-2.5 right-2.5 z-10 w-9 h-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition"
                                >
                                  {isInWishlist(productId) ? (
                                    <SolidHeartIcon className="w-4 h-4 text-[#8C3D45]" />
                                  ) : (
                                    <OutlineHeartIcon className="w-4 h-4 text-[#8a928e]" />
                                  )}
                                </button>

                                {/* hover hint — the whole card opens details */}
                                <span className="speed-card-view pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-center gap-1.5 rounded-xl bg-white/90 backdrop-blur px-3 py-2 text-[11px] font-bold text-[#BB1420] shadow-md">
                                  View details
                                </span>
                              </div>

                              {/* ---------- body ---------- */}
                              <div className="flex flex-1 flex-col border-t border-[#F5EDED] p-3 sm:p-3.5">
                                <h3 className="text-[13px] sm:text-sm font-semibold leading-snug text-[#2c3330] line-clamp-2 min-h-[38px] group-hover:text-[#BB1420] transition">
                                  {product.productName || "Unnamed product"}
                                </h3>

                                <div className="mt-2 flex items-baseline gap-2">
                                  <span className="text-[16px] sm:text-[17px] font-extrabold text-[#BB1420] tabular-nums">
                                    {formatPrice(price)}
                                  </span>
                                  {onSale && (
                                    <span className="text-[11px] text-[#a49c95] line-through tabular-nums">
                                      {formatPrice(oldPrice)}
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleAddToCart(product);
                                  }}
                                  disabled={addDisabled}
                                  className={`speed-card-add mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[12.5px] font-bold ${
                                    soldOut || !canOrder
                                      ? "bg-[#f1eeea] text-[#a49c95] cursor-not-allowed"
                                      : justAdded
                                      ? "bg-[#A80F1B] text-white"
                                      : "bg-[#BB1420] text-white hover:bg-[#A80F1B] hover:shadow-[0_10px_22px_-12px_rgba(187,20,32,0.85)]"
                                  } ${cartLoading && !justAdded ? "opacity-70" : ""}`}
                                >
                                  {isAddingThis ? (
                                    <>
                                      <span
                                        aria-hidden="true"
                                        className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
                                      />
                                      Adding…
                                    </>
                                  ) : justAdded ? (
                                    <>
                                      <CheckIcon className="w-4 h-4 speed-pop" /> Added!
                                    </>
                                  ) : soldOut ? (
                                    "Sold Out"
                                  ) : (
                                    <>
                                      <ShoppingCartIcon className="w-4 h-4" /> Add to Cart
                                    </>
                                  )}
                                </button>
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
                    <div className="bg-white border border-[#F0E6E6] rounded-2xl p-10 sm:p-12 text-center">
                      {noResultsFromFilters ? (
                        <>
                          <h2 className="text-2xl font-semibold text-[#BB1420] mb-2">
                            {emptyHeadline}
                          </h2>
                          <p className="text-[#6d7a74] text-sm max-w-md mx-auto mb-6">
                            {emptyBody}
                          </p>
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="px-6 py-3 rounded-xl bg-[#BB1420] text-white text-sm font-semibold hover:bg-[#A80F1B] active:scale-[0.98] transition"
                          >
                            Clear All Filters
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#FDF0F0] text-[#BB1420] flex items-center justify-center">
                            <BagIcon className="w-6 h-6" />
                          </div>
                          <h2 className="text-2xl font-semibold text-[#BB1420] mb-2">
                            {emptyHeadline}
                          </h2>
                          <p className="text-[#6d7a74] text-sm max-w-md mx-auto mb-6">
                            {emptyBody}
                          </p>
                          <button
                            type="button"
                            onClick={loadProducts}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#BB1420] text-white text-sm font-semibold hover:bg-[#A80F1B] active:scale-[0.98] transition"
                          >
                            Refresh deals
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </main>
              </div>
          </>
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

      {/* ==================== CART SIDEBAR (shared with /tel-cart) ====================
          Same cart, same thunks, same "Tel" id as the cart page. Checkout hands
          off to /tel-checkout, which runs the orderSlice + paymentSlice flow. */}
      <TelCartSidebar
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        checkoutPath="/tel-checkout"
        checkoutDisabled={!canOrder}
        checkoutDisabledMessage={
          canOrder
            ? undefined
            : `Ordering opens ${PROMO_START_LABEL} — browse for now.`
        }
      />

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
