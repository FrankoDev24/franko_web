import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Bars3BottomLeftIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as OutlineHeartIcon } from "@heroicons/react/24/outline";
import {
  HeartIcon as SolidHeartIcon,
  ShoppingCartIcon,
  EyeIcon,
  CheckIcon,
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
const BROWSE_ALL_URL = "/";

const PROMO_START = Date.parse("2026-10-02T00:00:00Z");
const PROMO_END = PROMO_START + 24 * 60 * 60 * 1000;
const LAUNCH_LABEL = "Friday 2 October 2026, 8:00 AM";

const pad = (number) => String(number ?? 0).padStart(2, "0");

const getPhase = (now) =>
  now < PROMO_START ? "before" : now < PROMO_END ? "live" : "ended";

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
  if (!imagePath) return "";
  if (imagePath.includes("\\")) {
    return `https://testing.frankotrading.com/Media/Products_Images/${imagePath.split("\\").pop()}`;
  }
  return imagePath;
};

/* ==================== TEASER ICONS ==================== */

const IconHours = () => (
  <svg viewBox="0 0 80 80" className="sp-ico" aria-hidden="true">
    <circle cx="40" cy="40" r="30" className="sp-ico-face" />
    <circle cx="40" cy="40" r="30" className="sp-ico-ring" />
    <path d="M40 16.5v4.2M40 59.3v4.2M16.5 40h4.2M59.3 40h4.2" className="sp-ico-tick" />
    <path d="M40 40V26.5" className="sp-ico-hand" />
    <path d="M40 40l11 6" className="sp-ico-hand sp-ico-hand-brass" />
    <circle cx="40" cy="40" r="2.2" className="sp-ico-hub" />
    <rect x="50" y="50" width="22" height="14" rx="7" className="sp-ico-badge" />
    <text x="61" y="60" textAnchor="middle" className="sp-ico-badge-text">24</text>
  </svg>
);

const IconDrop = () => (
  <svg viewBox="0 0 80 80" className="sp-ico" aria-hidden="true">
    <rect x="16" y="18" width="48" height="48" rx="8" className="sp-ico-face" />
    <rect x="16" y="18" width="48" height="48" rx="8" className="sp-ico-ring" />
    <path d="M16 32h48" className="sp-ico-rule" />
    <circle cx="28" cy="25" r="2" className="sp-ico-hub" />
    <circle cx="36" cy="25" r="2" className="sp-ico-brass-dot" />
    <text x="40" y="54" textAnchor="middle" className="sp-ico-num">02</text>
  </svg>
);

const IconRemind = () => (
  <svg viewBox="0 0 80 80" className="sp-ico" aria-hidden="true">
    <path d="M40 16a4 4 0 0 1 4 4v2.2a16 16 0 0 1 12 15.4V46l4 6H20l4-6V37.6A16 16 0 0 1 36 22.2V20a4 4 0 0 1 4-4Z" className="sp-ico-face" />
    <path d="M40 16a4 4 0 0 1 4 4v2.2a16 16 0 0 1 12 15.4V46l4 6H20l4-6V37.6A16 16 0 0 1 36 22.2V20a4 4 0 0 1 4-4Z" className="sp-ico-ring" />
    <path d="M34 54a6 6 0 0 0 12 0" className="sp-ico-hand" />
    <path d="M18 28c2-8 6-12 10-14M62 28c-2-8-6-12-10-14" className="sp-ico-hand-brass" />
  </svg>
);

const IconDeal = () => (
  <svg viewBox="0 0 80 80" className="sp-ico" aria-hidden="true">
    <path d="M18 34.5 34.2 18H58a6 6 0 0 1 6 6v23.8L46.5 65.3a6 6 0 0 1-8.5 0L18 45.3a6 6 0 0 1 0-8.5Z" className="sp-ico-face" />
    <path d="M18 34.5 34.2 18H58a6 6 0 0 1 6 6v23.8L46.5 65.3a6 6 0 0 1-8.5 0L18 45.3a6 6 0 0 1 0-8.5Z" className="sp-ico-ring" />
    <circle cx="52" cy="30" r="3.2" className="sp-ico-brass-dot" />
    <path d="M34 46.5c2.2-4.8 6.2-7.2 12-7.2 3.4 0 6 .8 8 2.4" className="sp-ico-hand" />
    <path d="M36 40.2h.1M44 48.8h.1" className="sp-ico-percent" />
  </svg>
);

const IconWait = () => (
  <svg viewBox="0 0 80 80" className="sp-ico" aria-hidden="true">
    <path d="M28 16h24M28 64h24" className="sp-ico-hand" />
    <path d="M30 18h20c0 8-6 12-10 16-4 4-10 8-10 16s6 12 10 16c4 4 10 8 10 16H30c0-8 6-12 10-16 4-4 10-8 10-16s-6-12-10-16c-4-4-10-8-10-16Z" className="sp-ico-face" />
    <path d="M30 18h20c0 8-6 12-10 16-4 4-10 8-10 16s6 12 10 16c4 4 10 8 10 16H30c0-8 6-12 10-16 4-4 10-8 10-16s-6-12-10-16c-4-4-10-8-10-16Z" className="sp-ico-ring" />
    <path d="M34 26h12l-6 8-6-8Z" className="sp-ico-brass-fill" />
  </svg>
);

const IconLoveCart = () => (
  <svg viewBox="0 0 80 80" className="sp-ico" aria-hidden="true">
    <circle cx="22" cy="40" r="12" className="sp-ico-face" />
    <circle cx="22" cy="40" r="12" className="sp-ico-ring" />
    <circle cx="58" cy="40" r="12" className="sp-ico-face" />
    <circle cx="58" cy="40" r="12" className="sp-ico-ring" />
    <path d="M34 40h12" className="sp-ico-hand-brass" />
    <circle cx="40" cy="40" r="2" className="sp-ico-brass-dot" />
    <path d="M22 36.5a3.2 3.2 0 0 1 3.2-2.2c1.2 0 2 .6 2.8 1.6.8-1 1.6-1.6 2.8-1.6a3.2 3.2 0 0 1 3.2 2.2c0 2.6-3.2 4.8-6 6.6-2.8-1.8-6-4-6-6.6Z" className="sp-ico-heart" />
    <path d="M53 36h8l-1.2 7.2a2 2 0 0 1-2 .8h-6.2" className="sp-ico-hand" />
    <circle cx="55.2" cy="47.5" r="1.1" className="sp-ico-hub" />
    <circle cx="60.2" cy="47.5" r="1.1" className="sp-ico-hub" />
  </svg>
);

const IconClosed = () => (
  <svg viewBox="0 0 80 80" className="sp-ico" aria-hidden="true">
    <circle cx="40" cy="40" r="26" className="sp-ico-face" />
    <circle cx="40" cy="40" r="26" className="sp-ico-ring" />
    <path d="M40 26v14l8 6" className="sp-ico-hand" />
    <path d="M28 54c3 4 7 6 12 6s9-2 12-6" className="sp-ico-hand-brass" />
  </svg>
);

const SpeedMark = () => (
  <svg viewBox="0 0 64 64" className="sp-mark" aria-hidden="true">
    <rect x="6" y="8" width="52" height="48" rx="14" className="sp-mark-bag" />
    <path d="M22 24c0-6 4.2-10 10-10s10 4 10 10" className="sp-mark-handle" />
    <path d="M34 28l-8 12h7l-2 10 12-16h-7l2-6h-4Z" className="sp-mark-bolt" />
  </svg>
);

const TEASERS_BEFORE = [
  {
    id: "hours",
    kicker: "One window",
    line: "24 hours only",
    detail: "A single day of prices. When the clock ends, they go back.",
    Icon: IconHours,
  },
  {
    id: "drop",
    kicker: "The date",
    line: "Drops Friday, 2 October",
    detail: "Doors open together. Nothing is listed before then.",
    Icon: IconDrop,
  },
  {
    id: "remind",
    kicker: "Stay close",
    line: "Set a reminder before the drop",
    detail: "We'll flag it on this page the moment the sale opens.",
    Icon: IconRemind,
  },
];

const TEASERS_LIVE = [
  {
    id: "deal",
    kicker: "While it lasts",
    line: "Shop today's exclusive deals before they are gone.",
    detail: "These prices belong to this window only.",
    Icon: IconDeal,
  },
  {
    id: "wait",
    kicker: "No queue",
    line: "Limited-time prices. No need to wait.",
    detail: "Find the piece, add it, and check out while the clock runs.",
    Icon: IconWait,
  },
  {
    id: "love",
    kicker: "Three steps",
    line: "Find it. Love it. Add it to your cart.",
    detail: "The short list is already on this page.",
    Icon: IconLoveCart,
  },
];

const artFor = {
  hours: "clock",
  drop: "calendar",
  remind: "bell",
  deal: "tag",
  wait: "glass",
  love: "path",
};

const TeaserArt = ({ id }) => {
  const scene = artFor[id] || "clock";
  return (
    <svg viewBox="0 0 360 320" className="sp-art" role="img" aria-label="Sale teaser illustration">
      <circle cx="180" cy="156" r="132" className="sp-art-wash" />
      <circle cx="180" cy="156" r="108" className="sp-art-ring" />
      <circle cx="180" cy="156" r="86" className="sp-art-ring sp-art-ring-soft" />
      {scene === "clock" && (
        <g>
          <circle cx="180" cy="150" r="72" className="sp-art-card" />
          <circle cx="180" cy="150" r="72" className="sp-art-stroke" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="180"
              y1="86"
              x2="180"
              y2={deg % 90 === 0 ? "96" : "92"}
              className="sp-art-tick"
              transform={`rotate(${deg} 180 150)`}
            />
          ))}
          <path d="M180 150 V104" className="sp-art-hand" />
          <path d="M180 150 L214 166" className="sp-art-hand sp-art-hand-brass" />
          <circle cx="180" cy="150" r="4" className="sp-art-hub" />
          <text x="180" y="176" textAnchor="middle" className="sp-art-num">24</text>
          <text x="180" y="248" textAnchor="middle" className="sp-art-caption">ONE DAY ONLY</text>
        </g>
      )}
      {scene === "calendar" && (
        <g>
          <rect x="98" y="78" width="164" height="168" rx="16" className="sp-art-card" />
          <rect x="98" y="78" width="164" height="168" rx="16" className="sp-art-stroke" />
          <path d="M98 118h164" className="sp-art-rule" />
          <rect x="98" y="78" width="164" height="40" rx="16" className="sp-art-head" />
          <circle cx="128" cy="98" r="4" className="sp-art-pin" />
          <circle cx="146" cy="98" r="4" className="sp-art-pin-brass" />
          <text x="180" y="186" textAnchor="middle" className="sp-art-date">02</text>
          <text x="180" y="214" textAnchor="middle" className="sp-art-caption">OCTOBER</text>
        </g>
      )}
      {scene === "bell" && (
        <g>
          <path d="M116 118c8-22 18-32 28-36" className="sp-art-wave" />
          <path d="M244 118c-8-22-18-32-28-36" className="sp-art-wave" />
          <path d="M180 84a10 10 0 0 1 10 10v6c28 6 40 24 40 48v22l12 16H118l12-16v-22c0-24 12-42 40-48v-6a10 10 0 0 1 10-10Z" className="sp-art-card" />
          <path d="M180 84a10 10 0 0 1 10 10v6c28 6 40 24 40 48v22l12 16H118l12-16v-22c0-24 12-42 40-48v-6a10 10 0 0 1 10-10Z" className="sp-art-stroke" />
          <path d="M164 204a16 16 0 0 0 32 0" className="sp-art-hand" />
          <text x="180" y="252" textAnchor="middle" className="sp-art-caption">REMIND ME</text>
        </g>
      )}
      {scene === "tag" && (
        <g>
          <path d="M86 132 150 68h92a16 16 0 0 1 16 16v92L196 238a16 16 0 0 1-22.6 0L86 154.6A16 16 0 0 1 86 132Z" className="sp-art-card" />
          <path d="M86 132 150 68h92a16 16 0 0 1 16 16v92L196 238a16 16 0 0 1-22.6 0L86 154.6A16 16 0 0 1 86 132Z" className="sp-art-stroke" />
          <circle cx="214" cy="104" r="8" className="sp-art-pin-brass" />
          <text x="176" y="156" textAnchor="middle" className="sp-art-date">%</text>
          <text x="180" y="252" textAnchor="middle" className="sp-art-caption">TODAY ONLY</text>
        </g>
      )}
      {scene === "glass" && (
        <g>
          <path d="M128 78h104M128 242h104" className="sp-art-hand" />
          <path d="M136 86h88c0 28-22 40-32 52-8 10-12 16-12 24s4 14 12 24c10 12 32 24 32 52h-88c0-28 22-40 32-52 8-10 12-16 12-24s-4-14-12-24c-10-12-32-24-32-52Z" className="sp-art-card" />
          <path d="M136 86h88c0 28-22 40-32 52-8 10-12 16-12 24s4 14 12 24c10 12 32 24 32 52h-88c0-28 22-40 32-52 8-10 12-16 12-24s-4-14-12-24c-10-12-32-24-32-52Z" className="sp-art-stroke" />
          <path d="M156 104h48l-24 28-24-28Z" className="sp-art-sand" />
          <text x="180" y="272" textAnchor="middle" className="sp-art-caption">NO NEED TO WAIT</text>
        </g>
      )}
      {scene === "path" && (
        <g>
          <path d="M78 160h204" className="sp-art-path" />
          <circle cx="78" cy="160" r="36" className="sp-art-card" />
          <circle cx="180" cy="160" r="36" className="sp-art-card" />
          <circle cx="282" cy="160" r="36" className="sp-art-card" />
          <circle cx="78" cy="160" r="36" className="sp-art-stroke" />
          <circle cx="180" cy="160" r="36" className="sp-art-stroke" />
          <circle cx="282" cy="160" r="36" className="sp-art-stroke" />
          <circle cx="70" cy="160" r="7" className="sp-art-lens" />
          <path d="M75 166l8 8" className="sp-art-hand" />
          <path d="M180 148c0-8 6-12 10-12 3 0 5 2 6 4 1-2 3-4 6-4 4 0 10 4 10 12 0 10-10 16-16 20-6-4-16-10-16-20Z" className="sp-art-heart" />
          <path d="M268 150h22l-3 16h-16" className="sp-art-hand" />
          <circle cx="272" cy="172" r="2.4" className="sp-art-hub" />
          <circle cx="286" cy="172" r="2.4" className="sp-art-hub" />
          <text x="78" y="220" textAnchor="middle" className="sp-art-step">FIND</text>
          <text x="180" y="220" textAnchor="middle" className="sp-art-step">LOVE</text>
          <text x="282" y="220" textAnchor="middle" className="sp-art-step">CART</text>
        </g>
      )}
    </svg>
  );
};

/* ==================== SMALL UI ==================== */

const Notification = ({ message, type, visible, onClose }) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (visible && message) timeoutRef.current = setTimeout(onClose, 3000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visible, message, onClose]);

  if (!visible || !message) return null;

  return (
    <div className={`sp-toast ${type === "success" ? "is-ok" : "is-err"}`}>
      <span className="sp-toast-dot" />
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Close">
        ×
      </button>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="sp-card sp-skel">
    <div className="sp-skel-img" />
    <div className="sp-skel-line" />
    <div className="sp-skel-line short" />
  </div>
);

const FilterChip = ({ label, onRemove }) => (
  <button type="button" onClick={onRemove} className="sp-chip">
    {label}
    <XMarkIcon className="w-3.5 h-3.5" />
  </button>
);

const TimeUnit = ({ value, label, size = "sm" }) => (
  <div className={`sp-time ${size === "lg" ? "is-lg" : ""}`}>
    <span>{pad(value)}</span>
    <small>{label}</small>
  </div>
);

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
  const teaserSet = isTeaser ? TEASERS_BEFORE : TEASERS_LIVE;

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

  const products = useMemo(
    () => productsByShowroom?.[SHOWROOM_ID] || [],
    [productsByShowroom]
  );

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

  const activeTeaser = teaserSet[teaserIndex % teaserSet.length];

  const selectTeaser = (index) => {
    setTeaserVisible(false);
    setTimeout(() => {
      setTeaserIndex(index);
      setTeaserVisible(true);
    }, 160);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTeaserVisible(false);
      setTimeout(() => {
        setTeaserIndex((prev) => (prev + 1) % teaserSet.length);
        setTeaserVisible(true);
      }, 220);
    }, 4200);
    return () => clearInterval(interval);
  }, [teaserSet.length]);

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

  const renderFilters = () => (
    <div className="sp-filters">
      <div className="sp-panel">
        <h3>Price range</h3>
        <div className="sp-price-grid">
          <label>
            Min
            <span>
              <i>₵</i>
              <input
                type="number"
                min="0"
                value={inputPriceRange.min}
                onChange={(e) =>
                  setInputPriceRange((prev) => ({ ...prev, min: e.target.value }))
                }
              />
            </span>
          </label>
          <label>
            Max
            <span>
              <i>₵</i>
              <input
                type="number"
                min="0"
                value={inputPriceRange.max}
                onChange={(e) =>
                  setInputPriceRange((prev) => ({ ...prev, max: e.target.value }))
                }
              />
            </span>
          </label>
        </div>
        <button type="button" className="sp-btn sp-btn-forest" onClick={applyPriceFilter}>
          Apply price
        </button>
      </div>

      <div className="sp-panel sp-toggle-row">
        <div className="sp-toggle-label">
          <IconDeal />
          <span>Discounted only</span>
        </div>
        <button
          type="button"
          className={`sp-switch ${showDiscountedOnly ? "is-on" : ""}`}
          onClick={() => {
            setShowDiscountedOnly((prev) => !prev);
            setCurrentPage(1);
          }}
          aria-label="Toggle discounted only"
        >
          <i />
        </button>
      </div>

      {brands.length > 0 && (
        <div className="sp-panel">
          <h3>Brands</h3>
          <div className="sp-brands">
            {brands.map((brand) => (
              <button
                type="button"
                key={brand}
                onClick={() => {
                  setSelectedBrand(selectedBrand === brand ? "" : brand);
                  setCurrentPage(1);
                }}
                className={selectedBrand === brand ? "is-on" : ""}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      <button type="button" className="sp-btn sp-btn-ghost" onClick={() => navigate(BROWSE_ALL_URL)}>
        Browse other products
        <ChevronRightIcon className="w-3.5 h-3.5" />
      </button>

      {filtersActive && (
        <button type="button" className="sp-btn sp-btn-quiet" onClick={resetFilters}>
          Reset all filters
        </button>
      )}
    </div>
  );

  const isInitialLoading = loading && !hasLoadedOnce;
  const hasNoResults = hasLoadedOnce && !loading && filteredProducts.length === 0;
  const noResultsFromFilters = hasNoResults && filtersActive;
  const timerLabel = countdown.phase === "live" ? "Ends in" : isTeaser ? "Drops in" : null;
  const ActiveIcon = activeTeaser?.Icon || IconClosed;

  return (
    <>
      <Helmet>
        <title>
          {isTeaser
            ? "Speed Shopping drops 2 October | Franko Trading"
            : "Speed Shopping | Franko Trading"}
        </title>
      </Helmet>

      <style>{SPEED_STYLES}</style>

      <Notification
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
        onClose={hideNotification}
      />

      <div className="sp-page">
        <div className="sp-wrap">
          <header className="sp-banner">
            <div className="sp-banner-brand">
              <div className="sp-mark-wrap">
                <SpeedMark />
              </div>
              <div className="min-w-0">
                <p className="sp-kicker">Franko Trading</p>
                <h1>
                  Speed <em>Shopping</em>
                </h1>
                <p className={`sp-banner-line ${teaserVisible ? "is-on" : ""}`}>
                  <span className="sp-banner-ico">
                    {countdown.phase === "ended" ? <IconClosed /> : <ActiveIcon />}
                  </span>
                  {countdown.phase === "ended"
                    ? "This flash sale has ended — thanks for shopping with us."
                    : activeTeaser.line}
                </p>
              </div>
            </div>

            <div className="sp-banner-side">
              {countdown.phase !== "ended" ? (
                <div className="sp-banner-timer">
                  <span className="sp-timer-label">
                    {countdown.phase === "live" && <i className="sp-live-dot" />}
                    {timerLabel}
                  </span>
                  <div className="sp-times">
                    {countdown.days > 0 && (
                      <>
                        <TimeUnit value={countdown.days} label="Days" />
                        <b>:</b>
                      </>
                    )}
                    <TimeUnit value={countdown.hours} label="Hrs" />
                    <b>:</b>
                    <TimeUnit value={countdown.minutes} label="Min" />
                    <b>:</b>
                    <TimeUnit value={countdown.seconds} label="Sec" />
                  </div>
                </div>
              ) : (
                <div className="sp-ended-pill">
                  <IconClosed />
                  Sale ended
                </div>
              )}

              {isTeaser && (
                <button
                  type="button"
                  onClick={handleNotifyMe}
                  disabled={notifyMeOn}
                  className={`sp-btn sp-btn-brass ${notifyMeOn ? "is-set" : ""}`}
                >
                  <IconRemind />
                  {notifyMeOn ? "Reminder set" : "Remind me"}
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate(BROWSE_ALL_URL)}
                className="sp-btn sp-btn-ghost sp-desktop-only"
              >
                Browse other products
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {isTeaser ? (
            <section className="sp-hero">
              <div className="sp-hero-frame">
                <div className="sp-hero-copy">
                  <p className="sp-eyebrow">
                    <i />
                    Opens {LAUNCH_LABEL}
                  </p>
                  <h2>Coming soon</h2>
                  <p className="sp-lead">
                    The list stays hidden until the window opens. Use the marks
                    below to read what this drop is — one day, one date, one reminder.
                  </p>

                  <div className="sp-hero-times">
                    {countdown.days > 0 && <TimeUnit value={countdown.days} label="Days" size="lg" />}
                    <TimeUnit value={countdown.hours} label="Hrs" size="lg" />
                    <TimeUnit value={countdown.minutes} label="Min" size="lg" />
                    <TimeUnit value={countdown.seconds} label="Sec" size="lg" />
                  </div>

                  <div className="sp-hero-actions">
                    <button
                      type="button"
                      onClick={handleNotifyMe}
                      disabled={notifyMeOn}
                      className={`sp-btn sp-btn-wine ${notifyMeOn ? "is-set" : ""}`}
                    >
                      <IconRemind />
                      {notifyMeOn ? "Reminder set" : "Remind me"}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(BROWSE_ALL_URL)}
                      className="sp-btn sp-btn-ghost"
                    >
                      Browse other products
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className={`sp-hero-art ${teaserVisible ? "is-on" : ""}`} key={activeTeaser.id}>
                  <TeaserArt id={activeTeaser.id} />
                  <div className="sp-art-chip">
                    <activeTeaser.Icon />
                    <div>
                      <strong>{activeTeaser.kicker}</strong>
                      <span>{activeTeaser.line}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sp-teaser-grid">
                {TEASERS_BEFORE.map((item, index) => {
                  const on = activeTeaser.id === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`sp-teaser-card ${on ? "is-on" : ""}`}
                      onClick={() => selectTeaser(index)}
                    >
                      <span className="sp-teaser-ico">
                        <item.Icon />
                      </span>
                      <span className="sp-teaser-copy">
                        <small>{item.kicker}</small>
                        <strong>{item.line}</strong>
                        <em>{item.detail}</em>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <>
              <div className="sp-promise-row">
                {TEASERS_LIVE.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`sp-promise ${activeTeaser.id === item.id ? "is-on" : ""}`}
                    onClick={() => selectTeaser(index)}
                  >
                    <item.Icon />
                    <span>{item.line}</span>
                  </button>
                ))}
              </div>

              <div className="sp-mobile-controls">
                <button type="button" className="sp-btn sp-btn-forest" onClick={() => setIsDrawerOpen(true)}>
                  <FunnelIcon className="w-4 h-4" />
                  Filters
                  {filtersActive && <i className="sp-filter-dot" />}
                </button>
                <div className="sp-sort">
                  <button type="button" className="sp-btn sp-btn-ghost" onClick={() => setIsSortOpen((prev) => !prev)}>
                    <Bars3BottomLeftIcon className="w-4 h-4" />
                    {sortOptions.find((option) => option.value === sortBy)?.label}
                    <ChevronDownIcon className={`w-4 h-4 ${isSortOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isSortOpen && (
                    <div className="sp-sort-menu">
                      {sortOptions.map((option) => (
                        <button
                          type="button"
                          key={option.value}
                          className={sortBy === option.value ? "is-on" : ""}
                          onClick={() => {
                            setSortBy(option.value);
                            setCurrentPage(1);
                            setIsSortOpen(false);
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {isDrawerOpen && (
                <div className="sp-drawer">
                  <button type="button" className="sp-drawer-back" onClick={() => setIsDrawerOpen(false)} aria-label="Close filters" />
                  <div className="sp-drawer-panel">
                    <div className="sp-drawer-head">
                      <strong>Filters</strong>
                      <button type="button" onClick={() => setIsDrawerOpen(false)} aria-label="Close">
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                    {renderFilters()}
                  </div>
                </div>
              )}

              <div className="sp-layout">
                <aside className="sp-aside">
                  <div className="sp-aside-sticky">{renderFilters()}</div>
                </aside>

                <main className="sp-main">
                  {filtersActive && !isInitialLoading && (
                    <div className="sp-chips">
                      {!priceIsDefault && (
                        <FilterChip
                          label={`${formatPrice(appliedPriceRange[0])} – ${formatPrice(appliedPriceRange[1])}`}
                          onRemove={removePriceFilter}
                        />
                      )}
                      {showDiscountedOnly && <FilterChip label="Discounted only" onRemove={removeDiscountFilter} />}
                      {selectedBrand && <FilterChip label={selectedBrand} onRemove={removeBrandFilter} />}
                      {sortBy !== "newest" && (
                        <FilterChip
                          label={sortOptions.find((o) => o.value === sortBy)?.label}
                          onRemove={removeSortFilter}
                        />
                      )}
                      <button type="button" className="sp-clear" onClick={resetFilters}>
                        Clear all
                      </button>
                    </div>
                  )}

                  {isInitialLoading && (
                    <div className="sp-grid">
                      {Array.from({ length: 8 }).map((_, idx) => (
                        <SkeletonCard key={idx} />
                      ))}
                    </div>
                  )}

                  {!isInitialLoading && currentProducts.length > 0 && (
                    <>
                      <div className="sp-grid">
                        {currentProducts.map((product) => {
                          const productId = product.productID || product.id;
                          const price = Number(product.price) || 0;
                          const oldPrice = Number(product.oldPrice) || 0;
                          const stock = Number(product.stock);
                          const soldOut = stock === 0;
                          const onSale = oldPrice > price && oldPrice > 0;
                          const discount = onSale ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
                          const justAdded = recentlyAdded.has(productId);
                          const image = getImageUrl(product.productImage);

                          return (
                            <article key={productId} className="sp-card">
                              <div className="sp-card-media" onClick={() => navigate(`/product/${productId}`)}>
                                {soldOut && <span className="sp-badge is-out">Sold out</span>}
                                {onSale && !soldOut && <span className="sp-badge is-sale">-{discount}%</span>}
                                {image ? (
                                  <img src={image} alt={product.productName || "Product"} loading="lazy" />
                                ) : (
                                  <ProductFallback />
                                )}
                                <div className="sp-card-actions" onClick={(e) => e.stopPropagation()}>
                                  <button type="button" onClick={() => handleWishlistToggle(product)} aria-label="Wishlist">
                                    {isInWishlist(productId) ? (
                                      <SolidHeartIcon className="w-4 h-4 sp-heart" />
                                    ) : (
                                      <OutlineHeartIcon className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button type="button" onClick={() => navigate(`/product/${productId}`)} aria-label="View">
                                    <EyeIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAddToCart(product)}
                                    disabled={cartLoading || soldOut}
                                    aria-label="Add to cart"
                                  >
                                    {justAdded ? <CheckIcon className="w-4 h-4" /> : <ShoppingCartIcon className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                              <div className="sp-card-body">
                                <h3>{product.productName || "Unnamed product"}</h3>
                                <p>{formatPrice(price)}</p>
                                {onSale && <s>{formatPrice(oldPrice)}</s>}
                              </div>
                            </article>
                          );
                        })}
                      </div>

                      {totalPages > 1 && (
                        <div className="sp-pager">
                          <CircularPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                          />
                        </div>
                      )}

                      <div className="sp-bottom-cta">
                        <button type="button" className="sp-btn sp-btn-ghost" onClick={() => navigate(BROWSE_ALL_URL)}>
                          Browse other products
                          <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}

                  {hasNoResults && (
                    <div className="sp-empty">
                      <span className="sp-teaser-ico">
                        {noResultsFromFilters ? <IconDeal /> : <IconClosed />}
                      </span>
                      <h2>
                        {noResultsFromFilters
                          ? "No matches for these filters"
                          : countdown.phase === "ended"
                          ? "Speed Shopping is closed"
                          : "Deals are still loading"}
                      </h2>
                      <p>
                        {noResultsFromFilters
                          ? "Widen the price range or clear a filter to see more of this drop."
                          : countdown.phase === "ended"
                          ? "The 24-hour window has closed. The rest of the store is open as usual."
                          : "The first batch is being uploaded. Explore the rest of the store while you wait."}
                      </p>
                      <div className="sp-hero-actions">
                        {noResultsFromFilters && (
                          <button type="button" className="sp-btn sp-btn-forest" onClick={resetFilters}>
                            Clear all filters
                          </button>
                        )}
                        <button type="button" className="sp-btn sp-btn-wine" onClick={() => navigate(BROWSE_ALL_URL)}>
                          Browse other products
                          <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      </div>
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

const ProductFallback = () => (
  <svg viewBox="0 0 120 120" className="sp-fallback" aria-hidden="true">
    <rect x="28" y="22" width="64" height="76" rx="8" fill="#f4efe8" stroke="#6b3a42" strokeWidth="1.4" />
    <path d="M40 40h40M40 52h28M40 64h34" stroke="#35584a" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="78" cy="78" r="6" fill="#f3eadc" stroke="#a68456" />
  </svg>
);

const SPEED_STYLES = `
  .sp-page {
    min-height: 100vh;
    color: #2a2422;
    background:
      radial-gradient(900px 420px at 0% -10%, rgba(107, 58, 66, 0.08), transparent 55%),
      radial-gradient(800px 380px at 100% 0%, rgba(53, 88, 74, 0.1), transparent 50%),
      #f3efe8;
    font-family: "Avenir Next", "Segoe UI", sans-serif;
  }
  .sp-page * { box-sizing: border-box; }
  .sp-wrap {
    width: min(1800px, calc(100% - 24px));
    margin: 0 auto;
    padding: 18px 0 48px;
  }
  .sp-banner {
    display: flex;
    flex-wrap: wrap;
    gap: 18px 28px;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    border-radius: 22px;
    background:
      linear-gradient(120deg, rgba(255,255,255,0.04), transparent 32%),
      linear-gradient(90deg, #4a2c32 0%, #5c3840 58%, #4e3138 100%);
    color: #f6f0e8;
    box-shadow: 0 16px 40px rgba(74, 44, 50, 0.16);
  }
  .sp-banner-brand, .sp-banner-side, .sp-banner-timer, .sp-times, .sp-hero-times, .sp-hero-actions {
    display: flex;
    align-items: center;
  }
  .sp-banner-brand { gap: 14px; min-width: 0; }
  .sp-mark-wrap {
    width: 58px;
    height: 58px;
    flex: 0 0 auto;
    border-radius: 18px;
    background: #f7f1e8;
    display: grid;
    place-items: center;
    box-shadow: inset 0 0 0 1px rgba(166, 132, 86, 0.45);
  }
  .sp-mark { width: 40px; height: 40px; }
  .sp-mark-bag { fill: #f4e9eb; stroke: #6b3a42; stroke-width: 1.6; }
  .sp-mark-handle { fill: none; stroke: #35584a; stroke-width: 2.2; stroke-linecap: round; }
  .sp-mark-bolt { fill: #a68456; }
  .sp-kicker {
    margin: 0;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #d7c4a3;
    font-weight: 700;
  }
  .sp-banner h1 {
    margin: 1px 0 0;
    font-family: Palatino, "Iowan Old Style", Georgia, serif;
    font-size: clamp(26px, 3vw, 40px);
    font-weight: 600;
    letter-spacing: -0.03em;
    line-height: 1;
    color: #fbf7f2;
  }
  .sp-banner h1 em {
    font-style: italic;
    color: #e4d2ae;
    font-weight: 500;
  }
  .sp-banner-line {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0 0;
    min-height: 22px;
    color: #eadfce;
    font-size: 13px;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.25s ease, transform 0.25s ease;
  }
  .sp-banner-line.is-on { opacity: 1; transform: none; }
  .sp-banner-ico { width: 22px; height: 22px; flex: 0 0 auto; color: #e4d2ae; }
  .sp-banner-ico .sp-ico { width: 22px; height: 22px; }
  .sp-banner-side { gap: 10px; flex-wrap: wrap; }
  .sp-banner-timer { gap: 10px; }
  .sp-timer-label, .sp-ended-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #e4d2ae;
  }
  .sp-live-dot {
    width: 7px;
    height: 7px;
    border-radius: 99px;
    background: #c6aa78;
    box-shadow: 0 0 0 4px rgba(198, 170, 120, 0.18);
  }
  .sp-times, .sp-hero-times { gap: 6px; }
  .sp-times b { color: rgba(246, 240, 232, 0.35); font-weight: 500; }
  .sp-time {
    min-width: 42px;
    padding: 6px 6px 5px;
    border-radius: 10px;
    background: #fbf8f4;
    color: #35584a;
    text-align: center;
    box-shadow: inset 0 -2px 0 #e7d3ae;
  }
  .sp-time span {
    display: block;
    font-variant-numeric: tabular-nums;
    font-weight: 750;
    font-size: 14px;
    line-height: 1;
  }
  .sp-time small {
    display: block;
    margin-top: 3px;
    font-size: 8px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #8a7b70;
  }
  .sp-time.is-lg {
    min-width: 74px;
    padding: 12px 8px 10px;
    border-radius: 14px;
    border: 1px solid #e7dfd4;
    box-shadow: 0 8px 18px rgba(42, 36, 34, 0.04);
  }
  .sp-time.is-lg span {
    font-family: Palatino, Georgia, serif;
    font-size: 34px;
    font-weight: 600;
    color: #2f4d40;
  }
  .sp-time.is-lg small { font-size: 10px; margin-top: 6px; }
  .sp-ended-pill {
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.08);
  }
  .sp-ended-pill .sp-ico { width: 18px; height: 18px; }
  .sp-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1px solid transparent;
    border-radius: 12px;
    padding: 10px 14px;
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  }
  .sp-btn:active { transform: scale(0.98); }
  .sp-btn:disabled { cursor: default; opacity: 0.85; }
  .sp-btn .sp-ico, .sp-btn svg.sp-ico { width: 18px; height: 18px; }
  .sp-btn-brass { background: #e7d3ae; color: #4a2c32; }
  .sp-btn-brass:hover { background: #efe0c4; }
  .sp-btn-brass.is-set, .sp-btn-wine.is-set { background: rgba(255,255,255,0.12); color: #f6f0e8; border-color: rgba(231, 211, 174, 0.35); }
  .sp-btn-wine { background: #6b3a42; color: #fbf7f2; }
  .sp-btn-wine:hover { background: #5c3138; }
  .sp-btn-forest { background: #35584a; color: #f7f3ec; width: 100%; }
  .sp-btn-forest:hover { background: #2d4c40; }
  .sp-btn-ghost {
    background: transparent;
    color: #35584a;
    border-color: #d5cbbf;
  }
  .sp-btn-ghost:hover { background: #f7f1e8; }
  .sp-banner .sp-btn-ghost {
    color: #f6f0e8;
    border-color: rgba(246, 240, 232, 0.22);
    background: rgba(255,255,255,0.04);
  }
  .sp-btn-quiet {
    width: 100%;
    background: #fbf8f4;
    color: #6b3a42;
    border-color: #ead9dc;
  }
  .sp-desktop-only { display: none; }
  .sp-hero { margin-top: 18px; }
  .sp-hero-frame {
    display: grid;
    gap: 0;
    padding: 12px;
    border-radius: 28px;
    background:
      linear-gradient(160deg, rgba(255,255,255,0.05), transparent 40%),
      linear-gradient(145deg, #2a4538, #35584a 60%, #2c4a3e);
    box-shadow: 0 18px 40px rgba(42, 69, 56, 0.12);
  }
  .sp-hero-copy, .sp-hero-art {
    background: #fbf8f4;
  }
  .sp-hero-copy {
    padding: 28px 22px 26px;
    border-radius: 20px 20px 0 0;
  }
  .sp-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: #6b3a42;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .sp-eyebrow i {
    width: 7px;
    height: 7px;
    border-radius: 99px;
    background: #a68456;
  }
  .sp-hero-copy h2, .sp-empty h2 {
    margin: 10px 0 0;
    font-family: Palatino, "Iowan Old Style", Georgia, serif;
    font-size: clamp(40px, 6vw, 68px);
    font-weight: 600;
    letter-spacing: -0.04em;
    line-height: 0.95;
    color: #2a2422;
  }
  .sp-lead, .sp-empty p {
    max-width: 460px;
    margin: 14px 0 0;
    color: #74685f;
    font-size: 15px;
    line-height: 1.55;
  }
  .sp-hero-times { margin-top: 22px; flex-wrap: wrap; }
  .sp-hero-actions { gap: 10px; flex-wrap: wrap; margin-top: 22px; }
  .sp-hero-art {
    position: relative;
    min-height: 280px;
    border-radius: 0 0 20px 20px;
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .sp-hero-art.is-on { animation: spRise 0.45s ease; }
  .sp-art { width: min(100%, 380px); height: auto; }
  .sp-art-wash { fill: #eef3ef; }
  .sp-art-ring { fill: none; stroke: #c9b89a; stroke-width: 1; }
  .sp-art-ring-soft { stroke: #d7e0d9; }
  .sp-art-card { fill: #fbf8f4; }
  .sp-art-stroke, .sp-art-hand, .sp-art-tick, .sp-art-rule { fill: none; stroke: #5c403c; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
  .sp-art-hand-brass, .sp-art-wave, .sp-art-path { fill: none; stroke: #a68456; stroke-width: 1.7; stroke-linecap: round; }
  .sp-art-hub, .sp-art-pin { fill: #6b3a42; }
  .sp-art-pin-brass, .sp-art-sand, .sp-art-heart { fill: #c6aa78; }
  .sp-art-head { fill: #35584a; }
  .sp-art-lens { fill: none; stroke: #35584a; stroke-width: 1.8; }
  .sp-art-num, .sp-art-date {
    font-family: Palatino, Georgia, serif;
    font-size: 42px;
    fill: #6b3a42;
  }
  .sp-art-date { font-size: 64px; }
  .sp-art-caption, .sp-art-step {
    font-size: 11px;
    letter-spacing: 0.16em;
    fill: #74685f;
    font-family: "Avenir Next", "Segoe UI", sans-serif;
  }
  .sp-art-chip {
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 16px;
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(251, 248, 244, 0.92);
    border: 1px solid #e7dfd4;
    box-shadow: 0 10px 24px rgba(42, 36, 34, 0.06);
  }
  .sp-art-chip .sp-ico { width: 36px; height: 36px; flex: 0 0 auto; }
  .sp-art-chip strong, .sp-teaser-copy small, .sp-promise span {
    display: block;
  }
  .sp-art-chip strong {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #6b3a42;
  }
  .sp-art-chip span, .sp-teaser-copy em {
    display: block;
    color: #5c534c;
    font-size: 13px;
    font-style: normal;
    line-height: 1.35;
  }
  .sp-teaser-grid {
    display: grid;
    gap: 12px;
    margin-top: 14px;
  }
  .sp-teaser-card, .sp-promise {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    text-align: left;
    width: 100%;
    padding: 14px;
    border-radius: 18px;
    border: 1px solid #e4dcd2;
    background: #fbf8f4;
    color: inherit;
    font: inherit;
    cursor: pointer;
    transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  }
  .sp-teaser-card.is-on, .sp-promise.is-on {
    border-color: #c9b0b4;
    box-shadow: 0 10px 24px rgba(107, 58, 66, 0.08);
    transform: translateY(-1px);
  }
  .sp-teaser-ico {
    width: 64px;
    height: 64px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    border-radius: 18px;
    background: #f4efe8;
  }
  .sp-teaser-copy small {
    color: #a68456;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .sp-teaser-copy strong {
    display: block;
    margin-top: 3px;
    font-size: 16px;
    letter-spacing: -0.02em;
  }
  .sp-teaser-copy em { margin-top: 4px; }
  .sp-ico { width: 56px; height: 56px; }
  .sp-ico-face { fill: #fbf8f4; }
  .sp-ico-ring, .sp-ico-hand, .sp-ico-tick, .sp-ico-rule, .sp-ico-percent { fill: none; stroke: #5c403c; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
  .sp-ico-hand-brass { fill: none; stroke: #a68456; stroke-width: 1.6; stroke-linecap: round; }
  .sp-ico-hub, .sp-ico-heart, .sp-ico-badge { fill: #6b3a42; }
  .sp-ico-brass-dot, .sp-ico-brass-fill { fill: #c6aa78; }
  .sp-ico-badge-text, .sp-ico-num {
    font-family: Palatino, Georgia, serif;
    fill: #fbf8f4;
    font-size: 9px;
  }
  .sp-ico-num { fill: #6b3a42; font-size: 18px; }
  .sp-promise-row {
    display: grid;
    gap: 10px;
    margin-top: 14px;
  }
  .sp-promise { align-items: center; padding: 10px 12px; }
  .sp-promise .sp-ico { width: 34px; height: 34px; flex: 0 0 auto; }
  .sp-promise span { font-size: 13px; font-weight: 650; line-height: 1.35; }
  .sp-mobile-controls, .sp-layout, .sp-chips, .sp-filters { display: flex; }
  .sp-mobile-controls { gap: 10px; margin-top: 14px; }
  .sp-mobile-controls .sp-btn { flex: 1; }
  .sp-sort { position: relative; flex: 1; }
  .sp-sort .sp-btn { width: 100%; background: #fbf8f4; }
  .sp-sort-menu {
    position: absolute;
    z-index: 20;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    overflow: hidden;
    border-radius: 14px;
    border: 1px solid #e4dcd2;
    background: #fbf8f4;
    box-shadow: 0 16px 30px rgba(42, 36, 34, 0.08);
  }
  .sp-sort-menu button {
    display: block;
    width: 100%;
    text-align: left;
    padding: 10px 12px;
    border: 0;
    border-bottom: 1px solid #f0e9e1;
    background: transparent;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }
  .sp-sort-menu button.is-on { background: #eef3ef; color: #35584a; font-weight: 700; }
  .sp-filter-dot {
    width: 7px;
    height: 7px;
    border-radius: 99px;
    background: #c6aa78;
  }
  .sp-drawer { position: fixed; inset: 0; z-index: 50; }
  .sp-drawer-back { position: absolute; inset: 0; border: 0; background: rgba(42, 36, 34, 0.45); }
  .sp-drawer-panel {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: min(340px, 90vw);
    overflow: auto;
    padding: 18px;
    background: #f3efe8;
  }
  .sp-drawer-head, .sp-toggle-row, .sp-toggle-label, .sp-chips {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .sp-drawer-head { margin-bottom: 14px; }
  .sp-drawer-head button, .sp-toast button {
    border: 0;
    background: transparent;
    cursor: pointer;
    font: inherit;
  }
  .sp-layout { display: block; margin-top: 16px; }
  .sp-aside { display: none; }
  .sp-filters, .sp-chips { flex-direction: column; gap: 10px; }
  .sp-chips { flex-direction: row; flex-wrap: wrap; align-items: center; margin-bottom: 14px; }
  .sp-panel {
    padding: 14px;
    border-radius: 16px;
    background: #fbf8f4;
    border: 1px solid #e4dcd2;
  }
  .sp-panel h3 {
    margin: 0 0 10px;
    font-size: 13px;
    letter-spacing: -0.02em;
  }
  .sp-price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
  .sp-price-grid label, .sp-brands { font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #8a7b70; }
  .sp-price-grid span { position: relative; display: block; margin-top: 4px; }
  .sp-price-grid i {
    position: absolute;
    left: 8px;
    top: 9px;
    font-style: normal;
    color: #a68456;
  }
  .sp-price-grid input {
    width: 100%;
    padding: 8px 8px 8px 22px;
    border-radius: 10px;
    border: 1px solid #e4dcd2;
    background: #fff;
    font: inherit;
    font-size: 12px;
    text-transform: none;
    letter-spacing: 0;
    color: #2a2422;
  }
  .sp-toggle-row { gap: 12px; }
  .sp-toggle-label { gap: 8px; justify-content: flex-start; font-size: 13px; font-weight: 700; }
  .sp-toggle-label .sp-ico { width: 28px; height: 28px; }
  .sp-switch {
    width: 38px;
    height: 22px;
    padding: 2px;
    border: 0;
    border-radius: 99px;
    background: #e4dcd2;
    cursor: pointer;
  }
  .sp-switch i {
    display: block;
    width: 18px;
    height: 18px;
    border-radius: 99px;
    background: white;
    transition: transform 0.15s ease;
  }
  .sp-switch.is-on { background: #35584a; }
  .sp-switch.is-on i { transform: translateX(16px); }
  .sp-brands { display: flex; flex-wrap: wrap; gap: 6px; text-transform: none; letter-spacing: 0; font-weight: 600; }
  .sp-brands button {
    border-radius: 999px;
    border: 1px solid #e4dcd2;
    background: #fff;
    padding: 6px 10px;
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  .sp-brands button.is-on { background: #35584a; color: #f7f3ec; border-color: #35584a; }
  .sp-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .sp-card {
    overflow: hidden;
    border-radius: 18px;
    border: 1px solid #e4dcd2;
    background: #fbf8f4;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .sp-card:hover { transform: translateY(-2px); box-shadow: 0 14px 28px rgba(42, 36, 34, 0.06); }
  .sp-card-media {
    position: relative;
    height: 190px;
    display: grid;
    place-items: center;
    background: #f6f1ea;
    cursor: pointer;
  }
  .sp-card-media img, .sp-fallback { max-width: 78%; max-height: 78%; object-fit: contain; }
  .sp-badge {
    position: absolute;
    top: 10px;
    z-index: 1;
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.04em;
  }
  .sp-badge.is-sale { right: 10px; background: #6b3a42; color: #fbf7f2; }
  .sp-badge.is-out { left: 10px; background: #e7dfd4; color: #5c534c; }
  .sp-card-actions {
    position: absolute;
    inset: 0;
    display: none;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: rgba(42, 36, 34, 0.28);
  }
  .sp-card:hover .sp-card-actions, .sp-card:focus-within .sp-card-actions { display: flex; }
  .sp-card-actions button {
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 999px;
    background: #fbf8f4;
    color: #35584a;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .sp-card-actions button:disabled { opacity: 0.45; cursor: not-allowed; }
  .sp-heart { color: #6b3a42; }
  .sp-card-body { padding: 12px 12px 14px; text-align: center; }
  .sp-card-body h3 {
    margin: 0;
    min-height: 38px;
    font-size: 14px;
    font-weight: 650;
    line-height: 1.35;
  }
  .sp-card-body p {
    margin: 8px 0 0;
    color: #35584a;
    font-weight: 800;
  }
  .sp-card-body s { color: #9a8f86; font-size: 12px; }
  .sp-chip, .sp-clear {
    border: 0;
    background: transparent;
    font: inherit;
    cursor: pointer;
  }
  .sp-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px 6px 10px;
    border-radius: 999px;
    background: #eef3ef;
    color: #35584a;
    font-size: 12px;
    font-weight: 700;
  }
  .sp-clear { color: #6b3a42; font-size: 12px; font-weight: 800; }
  .sp-pager, .sp-bottom-cta { display: flex; justify-content: center; margin-top: 22px; }
  .sp-empty {
    padding: 42px 20px;
    text-align: center;
    border-radius: 22px;
    background: #fbf8f4;
    border: 1px solid #e4dcd2;
  }
  .sp-empty .sp-teaser-ico, .sp-empty .sp-hero-actions { margin-left: auto; margin-right: auto; }
  .sp-empty h2 { font-size: 36px; }
  .sp-empty p { margin-left: auto; margin-right: auto; }
  .sp-skel-img, .sp-skel-line {
    background: linear-gradient(90deg, #f4efe8, #fbf8f4, #f4efe8);
    background-size: 200% 100%;
    animation: spShimmer 1.4s linear infinite;
  }
  .sp-skel-img { height: 180px; }
  .sp-skel-line { height: 12px; margin: 14px 18px 0; border-radius: 99px; }
  .sp-skel-line.short { width: 46%; margin: 10px auto 16px; }
  .sp-toast {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 80;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 260px;
    max-width: min(420px, calc(100vw - 32px));
    padding: 12px 14px;
    border-radius: 14px;
    color: #fbf7f2;
    font-size: 13px;
    font-weight: 650;
    box-shadow: 0 12px 30px rgba(42, 36, 34, 0.16);
  }
  .sp-toast.is-ok { background: #35584a; }
  .sp-toast.is-err { background: #6b3a42; }
  .sp-toast-dot { width: 8px; height: 8px; border-radius: 99px; background: #e7d3ae; }
  .sp-toast button { margin-left: auto; color: inherit; font-size: 18px; }
  @keyframes spRise {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes spShimmer {
    from { background-position: 100% 0; }
    to { background-position: -100% 0; }
  }
  @media (min-width: 760px) {
    .sp-wrap { width: min(1800px, calc(100% - 40px)); }
    .sp-hero-frame { grid-template-columns: 1.05fr 0.95fr; }
    .sp-hero-copy { border-radius: 20px 0 0 20px; padding: 42px 40px; }
    .sp-hero-art { border-radius: 0 20px 20px 0; min-height: 460px; }
    .sp-teaser-grid, .sp-promise-row { grid-template-columns: repeat(3, 1fr); }
    .sp-card-media { height: 230px; }
  }
  @media (min-width: 1024px) {
    .sp-desktop-only { display: inline-flex; }
    .sp-mobile-controls { display: none; }
    .sp-layout { display: flex; gap: 22px; align-items: flex-start; }
    .sp-aside { display: block; width: 270px; flex: 0 0 auto; }
    .sp-aside-sticky { position: sticky; top: 16px; }
    .sp-main { flex: 1; min-width: 0; }
    .sp-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
  }
  @media (min-width: 1280px) {
    .sp-grid { grid-template-columns: repeat(4, 1fr); }
  }
  @media (prefers-reduced-motion: reduce) {
    .sp-hero-art.is-on, .sp-skel-img, .sp-skel-line { animation: none; }
  }
`;

export default Speed;
