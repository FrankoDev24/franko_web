import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByShowroom } from "../Redux/Slice/productSlice";
import { useNavigate } from "react-router-dom";
import { addToWishlist, removeFromWishlist } from "../Redux/Slice/wishlistSlice";
import {
  FunnelIcon, XMarkIcon,  TagIcon,
  ChevronDownIcon, Bars3BottomLeftIcon, 
} from "@heroicons/react/24/outline";
import {
  HeartIcon as OutlineHeartIcon, HeartIcon as SolidHeartIcon,
  ShoppingCartIcon, EyeIcon, CheckCircleIcon, XCircleIcon,
} from "@heroicons/react/24/solid";

import { CircularPagination } from "../Component/CircularPagination";
import useAddToCart from "../Component/Cart";
import { Helmet } from "react-helmet";

const showroomId = "84b6b4e2-4fa4-4f3e-b89c-900812d95815";
const EVENT_START = new Date("2026-08-07T09:00:00Z").getTime();
const EVENT_END = EVENT_START + 3 * 60 * 60 * 1000;

const upcomingTeasers = [
 
  "6 Hours Only. 7th Aug 9AM GMT. No Restock.",
  "Are you FAST enough? ",
 
];
const liveTeasers = ["🚨 IT'S LIVE! DON'T BLINK!", "Stock vanishing - GO GO GO!", "Don't think. Just CLAIM!"];
const endedTeasers = ["You blinked. You missed it.", "Next drop = even wilder."];

const pad = (n) => String(n).padStart(2, "0");
const getTimeLeft = (target) => {
  const diff = target - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, total: 0 };
  return { d: Math.floor(diff / 86400000), h: Math.floor((diff / 3600000) % 24), m: Math.floor((diff / 60000) % 60), s: Math.floor((diff / 1000) % 60), total: diff };
};

const Notification = ({ message, type, isVisible, onClose }) => {
  const ref = useRef(null);
  useEffect(() => () => clearTimeout(ref.current), []);
  useEffect(() => {
    if (isVisible && message) { clearTimeout(ref.current); ref.current = setTimeout(onClose, 3000); }
  }, [isVisible, message, onClose]);
  if (!isVisible || !message) return null;
  const Icon = type === "success" ? CheckCircleIcon : XCircleIcon;
  return (
    <div className="fixed top-4 right-4 z-50 ss-animate-slide-in">
      <div className={`ss-notif ss-notif-${type}`}><Icon className="w-5 h-5" /><span className="ss-notif-text">{message}</span><button onClick={onClose} className="ss-notif-close">×</button></div>
    </div>
  );
};
const SkeletonCard = () => (
  <div className="ss-skeleton"><div className="ss-skeleton-img" />
    <div style={{ padding: "10px 12px" }}><div className="ss-skeleton-line" style={{ width: "80%", margin: "0 auto 8px" }} /><div className="ss-skeleton-line" style={{ width: "50%", height: 8, margin: "0 auto" }} /></div>
  </div>
);

const SpeedShopping = () => {
  const dispatch = useDispatch(); const navigate = useNavigate();
  const { productsByShowroom = {}, loading } = useSelector((s) => s.products);
  const wishlist = useSelector((s) => s.wishlist.items || []);
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
  const [notification, setNotification] = useState({ message: "", type: "success", isVisible: false });

  const [countdown, setCountdown] = useState(() => getTimeLeft(EVENT_START));
  const [phase, setPhase] = useState("upcoming");
  const [teaserIdx, setTeaserIdx] = useState(0);
  const [teaserVisible, setTeaserVisible] = useState(true);
  const activeTeasers = useMemo(() => phase === "upcoming" ? upcomingTeasers : phase === "live" ? liveTeasers : endedTeasers, [phase]);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      if (now < EVENT_START) { setPhase("upcoming"); setCountdown(getTimeLeft(EVENT_START)); }
      else if (now < EVENT_END) { setPhase("live"); setCountdown(getTimeLeft(EVENT_END)); }
      else { setPhase("ended"); setCountdown({ d: 0, h: 0, m: 0, s: 0, total: 0 }); }
    }; tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  useEffect(() => { setTeaserIdx(0); setTeaserVisible(true); }, [phase]);
  useEffect(() => {
    const id = setInterval(() => {
      setTeaserVisible(false);
      setTimeout(() => { setTeaserIdx((p) => (p + 1) % activeTeasers.length); setTeaserVisible(true); }, 200);
    }, 2800); return () => clearInterval(id);
  }, [activeTeasers]);

  const hideNotification = useCallback(() => setNotification((p) => ({ ...p, isVisible: false })), []);
  const showNotification = useCallback((m, t = "success") => {
    setNotification({ message: "", type: "success", isVisible: false });
    requestAnimationFrame(() => setNotification({ message: m, type: t, isVisible: true }));
  }, []);

  useEffect(() => { dispatch(fetchProductsByShowroom(showroomId)).then(() => setHasLoadedOnce(true)); }, [dispatch]);

  const products = useMemo(() => productsByShowroom[showroomId] || [], [productsByShowroom]);
  const brands = useMemo(() => Array.from(new Set(products.map((p) => p.brandName))).sort(), [products]);

  const applyPriceFilter = () => { setAppliedPriceRange([Math.max(0, inputPriceRange.min || 0), Math.min(200000, inputPriceRange.max || 200000)]); setCurrentPage(1); };
  const resetFilters = () => { setInputPriceRange({ min: 0, max: 200000 }); setAppliedPriceRange([0, 200000]); setShowDiscountedOnly(false); setSelectedBrand(null); setSortBy("newest"); setCurrentPage(1); };
  const sortProducts = (list) => {
    const s = [...list];
    switch (sortBy) {
      case "oldest": return s.sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));
      case "price-low": return s.sort((a, b) => a.price - b.price);
      case "price-high": return s.sort((a, b) => b.price - a.price);
      case "name-az": return s.sort((a, b) => a.productName.localeCompare(b.productName));
      case "name-za": return s.sort((a, b) => b.productName.localeCompare(a.productName));
      default: return s.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
    }
  };

  const filteredProducts = sortProducts(products.filter((p) => p.price >= appliedPriceRange[0] && p.price <= appliedPriceRange[1] && (showDiscountedOnly ? (p.oldPrice || 0) > p.price : true) && (selectedBrand ? p.brandName === selectedBrand : true)));
  const currentProducts = filteredProducts.slice((currentPage - 1) * 12, currentPage * 12);
  const totalPages = Math.ceil(filteredProducts.length / 12);
  const isFiltersActive = appliedPriceRange[0] !== 0 || appliedPriceRange[1] !== 200000 || showDiscountedOnly || selectedBrand !== null || sortBy !== "newest";
  const liveProgress = phase === "live" ? ((Date.now() - EVENT_START) / (EVENT_END - EVENT_START)) * 100 : 0;

  const formatPrice = (p) => !p || isNaN(p) ? "₵0.00" : `GH₵${Number(p).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  const getValidImageUrl = (p) => !p ? "https://via.placeholder.com/150" : p.includes("\\") ? `https://testing.frankotrading.com/Media/Products_Images/${p.split("\\").pop()}` : p;
  const isInWishlist = (id) => wishlist.some((i) => i.id === id);

  const renderFilterContent = () => (
    <div className="ss-filter-content">
      <div className="ss-filter-section"><div className="ss-filter-section-title"><div className="ss-dot" style={{ background: "#FFD500" }} /><span>Price Range</span></div>
        <div className="ss-price-inputs"><div className="ss-price-field"><label className="ss-price-label">Min</label><div className="ss-price-input-wrap"><span className="ss-price-symbol">₵</span><input type="number" value={inputPriceRange.min} onChange={(e) => setInputPriceRange((p) => ({ ...p, min: +e.target.value }))} className="ss-price-input" /></div></div><div className="ss-price-field"><label className="ss-price-label">Max</label><div className="ss-price-input-wrap"><span className="ss-price-symbol">₵</span><input type="number" value={inputPriceRange.max} onChange={(e) => setInputPriceRange((p) => ({ ...p, max: +e.target.value }))} className="ss-price-input" /></div></div></div>
        <button onClick={applyPriceFilter} className="ss-apply-btn">Apply</button></div>
      <div className="ss-filter-section ss-discount-section"><div className="ss-discount-row"><div className="ss-discount-info"><div className="ss-discount-icon"><TagIcon style={{ width: 14, height: 14, color: "#fff" }} /></div><span className="ss-discount-label">Discounted Only</span></div><div onClick={() => setShowDiscountedOnly(!showDiscountedOnly)} className={`ss-toggle ${showDiscountedOnly ? "ss-toggle-on" : ""}`}><div className="ss-toggle-knob" /></div></div></div>
      {brands.length > 0 && <div className="ss-filter-section"><div className="ss-filter-section-title"><div className="ss-dot" style={{ background: "#A30D5F" }} /><span>Brands</span></div><div className="ss-brand-tags">{brands.map((b) => <button key={b} onClick={() => { setSelectedBrand(selectedBrand === b ? null : b); setCurrentPage(1); }} className={`ss-brand-tag ${selectedBrand === b ? "ss-brand-tag-active" : ""}`}>{b}</button>)}</div></div>}
      {isFiltersActive && <button onClick={resetFilters} className="ss-reset-btn">Reset All</button>}
    </div>
  );

  const isInitialLoading = loading && !hasLoadedOnce;
  const hasProducts = currentProducts.length > 0;
  const trulyEmpty = hasLoadedOnce && !loading && filteredProducts.length === 0;
  const sortOptions = [{ value: "newest", label: "Newest First" }, { value: "price-low", label: "Price: Low → High" }, { value: "price-high", label: "Price: High → Low" }];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@800;900&display=swap');
        :root{--ss-grad:linear-gradient(90deg,#4D1070 0%,#7A0E6A 45%,#A30D5F 75%,#B90F67 100%);--ss-gold:linear-gradient(90deg,#FF8A00,#FFD500);--ss-border:#e7ddf0;--ss-display:'Plus Jakarta Sans',sans-serif;--ss-font:'DM Sans',sans-serif;}
        .ss-root,.ss-root *{font-family:var(--ss-font);box-sizing:border-box;-webkit-font-smoothing:antialiased;}
        .ss-notif{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:12px;min-width:280px;box-shadow:0 10px 30px rgba(30,10,54,.25);} .ss-notif-success{background:var(--ss-grad);color:#fff;} .ss-notif-error{background:#dc2626;color:#fff;} .ss-notif-text{font-size:14px;font-weight:600;flex:1;} .ss-notif-close{background:none;border:none;color:#fff;font-size:18px;cursor:pointer;}
        @keyframes ss-slide-in-right{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}} .ss-animate-slide-in{animation:ss-slide-in-right .3s ease-out}
        .ss-hero{position:relative;border-radius:14px;overflow:hidden;margin-bottom:12px;background:linear-gradient(90deg,#1E0A36 0%,#321156 18%,#4D1070 38%,#7A0E6A 68%,#A30D5F 85%,#B90F67 100%);border:1px solid rgba(255,255,255,.14);box-shadow:0 14px 36px rgba(77,16,112,.24);}
        .ss-hero::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.08),transparent 70%);pointer-events:none;}
        .ss-hero-shine{position:absolute;top:0;left:-45%;width:36%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);animation:ss-shine 5.5s ease-in-out infinite;} @keyframes ss-shine{0%{left:-45%}60%{left:130%}100%{left:130%}}
        .ss-hero-inner{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:11px 14px;min-height:66px;}
        .ss-hero-left{display:flex;align-items:center;gap:12px;min-width:0;}
        .ss-logo-wrap{width:52px;height:52px;flex-shrink:0;border-radius:50%;background:#fff;border:3px solid #FFD500;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 5px rgba(255,213,0,0.22),0 3px 0 #fff,0 8px 24px rgba(0,0,0,.4);animation:ss-float 3s ease-in-out infinite;} @keyframes ss-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}
        .ss-logo-img{width:36px;height:36px;object-fit:contain;filter:contrast(1.15) saturate(1.1);}
        .ss-hero-title{font-family:var(--ss-display);font-weight:900;font-size:18px;color:#fff;line-height:1;letter-spacing:.5px;text-shadow:0 1px 0 #000,0 3px 12px rgba(0,0,0,.6);} .ss-hero-title span{color:#FFD500;text-shadow:0 1px 0 #8a5000,0 2px 0 #6d3d00,0 0 18px rgba(255,213,0,.9);}
        .ss-teaser-wrap{height:15px;overflow:hidden;margin-top:3px;} .ss-teaser{font-size:11px;font-weight:800;font-style:italic;color:#ffe88a;white-space:nowrap;text-shadow:0 0 12px rgba(255,213,0,.6);transition:all .26s cubic-bezier(.22,1,.36,1);} .ss-teaser.hide{transform:translateY(-14px);opacity:0;filter:blur(4px);} .ss-teaser.show{transform:translateY(0);opacity:1;}
        .ss-hero-chip{padding:3px 9px;border-radius:100px;font-size:9px;font-weight:900;background:var(--ss-gold);color:#1E0A36;border:1px solid rgba(255,255,255,.8);box-shadow:0 2px 0 #b45500,0 4px 12px rgba(0,0,0,.3);white-space:nowrap;margin-left:6px;}
        .ss-cd-wrap{display:flex;align-items:center;gap:10px;flex-shrink:0;} .ss-cd-label{font-size:8.5px;font-weight:900;letter-spacing:1px;color:#FFD500;text-transform:uppercase;white-space:nowrap;} .ss-cd-label.live{color:#fff;display:flex;align-items:center;gap:5px;} .ss-live-dot{width:7px;height:7px;border-radius:50%;background:#FF2A2A;animation:ss-pulse 1.2s infinite;} @keyframes ss-pulse{0%{box-shadow:0 0 0 0 rgba(255,42,42,.6)}70%{box-shadow:0 0 0 8px rgba(255,42,42,0)}100%{box-shadow:0 0 0 0 rgba(255,42,42,0)}}
        .ss-cd{display:flex;align-items:center;gap:3px;} .ss-cd-box{min-width:44px;height:38px;border-radius:9px;background:#fff;color:#2d1066;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 2px 0 rgba(0,0,0,.14),0 6px 14px rgba(0,0,0,.18);} .ss-cd-box.live{background:#FFD500;color:#1E0A36;box-shadow:0 2px 0 #8a5000,0 6px 18px rgba(0,0,0,.25),0 0 20px rgba(255,213,0,.5);} .ss-cd-num{font-size:15px;font-weight:900;line-height:1;font-variant-numeric:tabular-nums;} .ss-cd-unit{font-size:7px;font-weight:900;opacity:.6;letter-spacing:.6px;} .ss-cd-sep{color:rgba(255,255,255,.6);font-weight:800;}
        .ss-shop-btn{background:var(--ss-gold);color:#1E0A36;padding:7px 14px;border-radius:100px;font-size:11px;font-weight:900;box-shadow:0 4px 14px rgba(255,165,0,.45);animation:ss-btnPulse 1.8s infinite;text-decoration:none;} @keyframes ss-btnPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        .ss-prog{position:absolute;bottom:0;left:0;height:3px;background:#FFD500;box-shadow:0 0 10px #FFD500;transition:width 1s linear;}
        /* EMPTY TEASER - BOLD TIMER */
        .ss-empty-teaser{position:relative;border-radius:18px;padding:26px 20px 18px;background:radial-gradient(140% 140% at 15% 10%,#7A0E6A 0%,#4D1070 32%,#1E0A36 68%,#000 100%);border:1px solid rgba(255,255,255,.14);box-shadow:0 18px 44px rgba(30,10,54,.32);text-align:center;overflow:hidden;animation:ss-cardIn .5s ease both;}
        @keyframes ss-cardIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .ss-empty-teaser-shine{position:absolute;top:0;left:-45%;width:34%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);animation:ss-shine 5s ease-in-out infinite;}
        .ss-empty-logo{width:72px;height:72px;margin:0 auto 12px;border-radius:50%;background:#fff;border:3.5px solid #FFD500;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 6px rgba(255,213,0,.18),0 10px 26px rgba(0,0,0,.45);animation:ss-float 3s ease-in-out infinite;}
        .ss-empty-logo img{width:46px;height:46px;object-fit:contain;filter:contrast(1.18);}
        .ss-empty-kicker{display:inline-flex;padding:5px 12px;border-radius:100px;background:var(--ss-gold);color:#1E0A36;font-size:10px;font-weight:900;letter-spacing:.9px;box-shadow:0 3px 14px rgba(255,213,0,.5);}
        .ss-empty-h1{font-family:var(--ss-display);font-weight:900;font-size:28px;line-height:.95;color:#fff;margin:10px 0 0;text-shadow:0 2px 0 #000,0 6px 20px rgba(0,0,0,.6);} .ss-empty-h1 span{color:#FFD500;text-shadow:0 0 22px rgba(255,213,0,.9),0 2px 8px rgba(0,0,0,.7);}
        .ss-teaser-fade-wrap{height:18px;overflow:hidden;margin-top:8px;display:flex;justify-content:center;}
        .ss-teaser-fade{font-size:13px;font-weight:800;font-style:italic;color:#ffe88a;white-space:nowrap;text-shadow:0 0 14px rgba(255,213,0,.65);transition:.26s;} .ss-teaser-fade.hide{transform:translateY(-16px);opacity:0;filter:blur(4px);} .ss-teaser-fade.show{transform:translateY(0);opacity:1;}
        .ss-empty-cd{display:flex;justify-content:center;gap:9px;margin:18px 0 8px;}
        .ss-empty-cd-box{min-width:76px;height:80px;border-radius:13px;background:#fff;color:#1E0A36;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:inset 0 1px 0 #fff,0 4px 0 rgba(0,0,0,.16),0 12px 24px rgba(0,0,0,.32);position:relative;} .ss-empty-cd-box::after{content:'';position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(0,0,0,.07);}
        .ss-empty-cd-box.live{background:#FFD500;box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 4px 0 #8a5000,0 12px 24px rgba(0,0,0,.32),0 0 22px rgba(255,213,0,.55);}
        .ss-empty-cd-num{font-size:30px;font-weight:900;line-height:1;letter-spacing:-.5px;font-variant-numeric:tabular-nums;} .ss-empty-cd-unit{font-size:9.5px;font-weight:900;letter-spacing:1px;opacity:.65;margin-top:3px;}
        .ss-empty-cd-sep{font-size:26px;font-weight:900;color:rgba(255,255,255,.6);align-self:center;}
        .ss-empty-note{font-size:11px;font-weight:800;letter-spacing:.8px;color:rgba(255,255,255,.75);margin-top:12px;text-transform:uppercase;}
        .ss-empty-suspense{font-size:13px;font-weight:500;color:rgba(255,255,255,.9);max-width:440px;margin:8px auto 0;line-height:1.55;}
        .ss-empty-actions{display:flex;gap:8px;justify-content:center;margin-top:16px;} .ss-empty-browse{padding:10px 18px;background:#fff;color:#4D1070;border:none;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.2);text-decoration:none;} .ss-empty-reset{padding:10px 18px;background:transparent;color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;}
        @media(max-width:560px){.ss-empty-h1{font-size:22px}.ss-empty-cd-box{min-width:62px;height:68px;border-radius:11px}.ss-empty-cd-num{font-size:24px}.ss-empty-logo{width:60px;height:60px}.ss-empty-logo img{width:38px;height:38px}}
        /* GRID + CARDS - compact */
        .ss-mobile-controls{display:flex;gap:8px;margin-bottom:10px;}@media(min-width:1024px){.ss-mobile-controls{display:none;}}
        .ss-filter-trigger{flex:1;display:flex;justify-content:center;align-items:center;gap:6px;padding:10px 14px;background:var(--ss-grad);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;}
        .ss-sort-trigger{flex:1;display:flex;justify-content:center;align-items:center;gap:6px;padding:10px 14px;background:#fff;color:#5a5566;border:1px solid var(--ss-border);border-radius:10px;font-size:13px;font-weight:600;position:relative;cursor:pointer;}
        .ss-sort-drop{position:absolute;top:calc(100% + 6px);left:0;right:0;background:#fff;border:1px solid var(--ss-border);border-radius:10px;box-shadow:0 10px 30px rgba(77,16,112,.12);z-index:50;overflow:hidden;} .ss-sort-option{width:100%;text-align:left;padding:10px 14px;font-size:13px;background:none;border:none;border-bottom:1px solid #f5f0f8;cursor:pointer;} .ss-filter-content{display:flex;flex-direction:column;gap:10px;} .ss-filter-section{padding:12px;background:#fff;border:1px solid var(--ss-border);border-radius:10px;} .ss-filter-section-title{font-size:13px;font-weight:700;display:flex;gap:8px;align-items:center;margin-bottom:8px;} .ss-dot{width:6px;height:6px;border-radius:50%;} .ss-price-inputs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;} .ss-price-label{font-size:10px;font-weight:700;color:#8a8494;text-transform:uppercase;} .ss-price-input-wrap{position:relative;} .ss-price-symbol{position:absolute;left:9px;top:7px;font-size:12px;font-weight:700;color:#8a8494;} .ss-price-input{width:100%;padding:6px 10px 6px 22px;border:1px solid var(--ss-border);border-radius:8px;font-size:13px;} .ss-apply-btn{width:100%;padding:8px;background:var(--ss-grad);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;} .ss-discount-section{background:#faf6fd;border-color:#ecd9f5;} .ss-discount-row{display:flex;justify-content:space-between;align-items:center;} .ss-discount-info{display:flex;gap:8px;align-items:center;} .ss-discount-icon{width:26px;height:26px;border-radius:7px;background:var(--ss-grad);display:flex;align-items:center;justify-content:center;} .ss-discount-label{font-size:13px;font-weight:600;} .ss-toggle{width:36px;height:20px;border-radius:10px;background:#d9d0e3;padding:2px;cursor:pointer;} .ss-toggle-on{background:var(--ss-grad)!important;} .ss-toggle-knob{width:16px;height:16px;border-radius:50%;background:#fff;transition:.2s;} .ss-toggle-on .ss-toggle-knob{transform:translateX(16px);} .ss-brand-tags{display:flex;flex-wrap:wrap;gap:6px;} .ss-brand-tag{padding:4px 10px;font-size:11px;background:#f8f5fb;border:1px solid var(--ss-border);border-radius:100px;cursor:pointer;} .ss-brand-tag-active{background:var(--ss-grad)!important;color:#fff!important;} .ss-reset-btn{width:100%;padding:8px;background:#fff;color:#dc2626;border:1px solid #fecaca;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;} .ss-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}@media(min-width:1024px){.ss-grid{grid-template-columns:repeat(3,1fr);}}@media(min-width:1280px){.ss-grid{grid-template-columns:repeat(4,1fr);}} .ss-card{border:1px solid var(--ss-border);border-radius:12px;overflow:hidden;background:#fff;transition:.22s;animation:ss-cardIn .4s ease both;} .ss-card:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(163,13,95,.14);border-color:#A30D5F;} .ss-card-img{position:relative;height:160px;display:flex;align-items:center;justify-content:center;padding:10px;} .ss-card-img img{height:100%;width:100%;object-fit:contain;transition:.35s;} .ss-card:hover .ss-card-img img{transform:scale(1.06);} .ss-card-overlay{position:absolute;inset:0;background:rgba(30,10,54,.52);display:none;align-items:center;justify-content:center;gap:8px;z-index:2;} .ss-card:hover .ss-card-overlay{display:flex;} .ss-card-action{width:32px;height:32px;border-radius:50%;background:#fff;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;} .ss-card-body{padding:8px 10px;text-align:center;} .ss-card-name{font-size:13px;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:34px;} .ss-card-price{font-size:13.5px;font-weight:900;color:#A30D5F;margin-top:3px;} .ss-card-old-price{font-size:11px;color:#8a8494;text-decoration:line-through;} .ss-card-badge{position:absolute;top:8px;font-size:9px;font-weight:800;padding:3px 7px;border-radius:100px;z-index:3;} .ss-card-badge-sold{left:8px;background:#1E0A36;color:#fff;} .ss-card-badge-discount{right:8px;background:var(--ss-gold);color:#2B0B54;font-weight:900;}
        .ss-skeleton{border:1px solid #f0e9f5;border-radius:12px;overflow:hidden;background:#fff;} .ss-skeleton-img{height:160px;background:linear-gradient(90deg,#f3edf8 25%,#ece1f5 50%,#f3edf8 75%);background-size:200% 100%;animation:ss-shimmer 1.5s infinite;}@keyframes ss-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}} .ss-skeleton-line{height:10px;border-radius:3px;background:linear-gradient(90deg,#f3edf8 25%,#ece1f5 50%,#f3edf8 75%);background-size:200% 100%;animation:ss-shimmer 1.5s infinite;}
        .ss-layout{display:flex;flex-direction:column;gap:0;}@media(min-width:1024px){.ss-layout{flex-direction:row;gap:18px;}} .ss-sidebar{display:none;width:260px;flex-shrink:0;}@media(min-width:1024px){.ss-sidebar{display:block;}} .ss-sidebar-sticky{position:sticky;top:76px;} .ss-main{flex:1;min-width:0;} .ss-pagination{display:flex;justify-content:center;margin-top:16px;}
        .ss-drawer-overlay{position:fixed;inset:0;z-index:100;display:flex;} .ss-drawer-backdrop{position:absolute;inset:0;background:rgba(30,10,54,.45);} .ss-drawer-panel{position:relative;width:100%;max-width:320px;height:100%;background:#fff;overflow-y:auto;z-index:1;} .ss-drawer-header{position:sticky;top:0;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--ss-border);} .ss-drawer-body{padding:12px;}
        @media(max-width:768px){.ss-hero-inner{flex-direction:column;align-items:stretch;padding:0}.ss-hero-left{padding:10px 12px;justify-content:space-between}.ss-hero-title{font-size:13.5px}.ss-teaser{font-size:10px}.ss-logo-wrap{width:42px;height:42px}.ss-logo-img{width:28px;height:28px}.ss-cd-wrap{width:100%;justify-content:space-between;padding:8px 12px;background:rgba(0,0,0,.22);border-top:1px solid rgba(255,255,255,.08);backdrop-filter:blur(8px)}.ss-cd-box{min-width:38px;height:34px}.ss-cd-num{font-size:13px}}
      `}</style>

      <Notification message={notification.message} type={notification.type} isVisible={notification.isVisible} onClose={hideNotification} />
      <div className="ss-root min-h-screen bg-[#fcfafd]">
        <Helmet><title>Speed Shopping • Franko Trading</title></Helmet>
        <div className="px-4 lg:px-10 py-4">

          <div className="ss-hero">
            <div className="ss-hero-shine" />
            <div className="ss-hero-inner"> 
              <div className="ss-hero-left">
                <div className="ss-logo-wrap"><img src="/speed.jpg" alt="Speed" className="ss-logo-img" /></div>
                <div><div className="ss-hero-title">FRANKO <span>SPEED SHOPPING</span></div><div className="ss-teaser-wrap"><span className={`ss-teaser ${teaserVisible ? "show" : "hide"}`}>{activeTeasers[teaserIdx]}</span></div></div>
                <div className="ss-hero-chip">{phase === "upcoming" ? "COMING SOON" : phase === "live" ? "LIVE NOW!" : "ENDED"}</div>
              </div>
              <div className="ss-cd-wrap">
                <div className={`ss-cd-label ${phase === "live" ? "live" : ""}`}>{phase === "live" && <span className="ss-live-dot" />}{phase === "upcoming" ? "SECRET UNLOCKS IN" : phase === "live" ? "VANISHES IN" : ""}</div>
                {phase !== "ended" ? (
                  <div className="ss-cd">{countdown.d > 0 && <><div className={`ss-cd-box ${phase}`}><span className="ss-cd-num">{pad(countdown.d)}</span><span className="ss-cd-unit">DAYS</span></div><span className="ss-cd-sep">:</span></>}
                    <div className={`ss-cd-box ${phase}`}><span className="ss-cd-num">{pad(countdown.h)}</span><span className="ss-cd-unit">HRS</span></div><span className="ss-cd-sep">:</span>
                    <div className={`ss-cd-box ${phase}`}><span className="ss-cd-num">{pad(countdown.m)}</span><span className="ss-cd-unit">MINS</span></div><span className="ss-cd-sep">:</span>
                    <div className={`ss-cd-box ${phase}`}><span className="ss-cd-num">{pad(countdown.s)}</span><span className="ss-cd-unit">SECS</span></div></div>
                ) : <span style={{ color: "#FFD500", fontWeight: 900 }}>GONE 💨</span>}
                {phase === "live" && <a href="#products" className="ss-shop-btn">CLAIM ⚡</a>}
              </div>
            </div>
            {phase === "live" && <div className="ss-prog" style={{ width: `${liveProgress}%` }} />}
          </div>

          <div className="ss-mobile-controls">
            <button onClick={() => setIsDrawerOpen(true)} className="ss-filter-trigger"><FunnelIcon style={{ width: 16, height: 16 }} />Filters</button>
            <div className="ss-sort-trigger" onClick={() => setShowSortDropdown(!showSortDropdown)}><Bars3BottomLeftIcon style={{ width: 16, height: 16 }} /><span>{sortOptions.find((o) => o.value === sortBy)?.label}</span><ChevronDownIcon style={{ width: 12, height: 12 }} />
              {showSortDropdown && <div className="ss-sort-drop">{sortOptions.map((o) => <button key={o.value} onClick={(e) => { e.stopPropagation(); setSortBy(o.value); setShowSortDropdown(false); setCurrentPage(1); }} className="ss-sort-option" style={{ fontWeight: sortBy === o.value ? 800 : 500 }}>{o.label}</button>)}</div>}
            </div>
          </div>
          {isDrawerOpen && <div className="ss-drawer-overlay"><div className="ss-drawer-backdrop" onClick={() => setIsDrawerOpen(false)} /><div className="ss-drawer-panel"><div className="ss-drawer-header"><span style={{ fontWeight: 900 }}>Filters</span><button onClick={() => setIsDrawerOpen(false)}><XMarkIcon style={{ width: 18, height: 18 }} /></button></div><div className="ss-drawer-body">{renderFilterContent()}</div></div></div>}

          <div className="ss-layout" id="products">
            <aside className="ss-sidebar"><div className="ss-sidebar-sticky">{renderFilterContent()}</div></aside>
            <section className="ss-main">
              {isInitialLoading && <div className="ss-grid">{Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}</div>}

              {!isInitialLoading && hasProducts && <>
                <div className="ss-grid">{currentProducts.map((product, idx) => {
                  const isOnSale = product.oldPrice > 0 && product.oldPrice > product.price;
                  const discount = isOnSale ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
                  const soldOut = product.stock === 0;
                  return (
                    <div key={product.productID} className="ss-card" style={{ animationDelay: `${idx * 30}ms` }}>
                      <div className="ss-card-img">{soldOut && <span className="ss-card-badge ss-card-badge-sold">Sold Out</span>}{isOnSale && !soldOut && <span className="ss-card-badge ss-card-badge-discount">-{discount}%</span>}
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => navigate(`/product/${product.productID}`)}><img src={getValidImageUrl(product.productImage)} alt={product.productName} /></div>
                        <div className="ss-card-overlay"><button className="ss-card-action" onClick={(e) => { e.stopPropagation(); dispatch(wishlist.some((i) => i.id === product.productID) ? removeFromWishlist(product.productID) : addToWishlist({ ...product, id: product.productID })); }}><SolidHeartIcon style={{ width: 15, height: 15, color: "#A30D5F" }} /></button><button className="ss-card-action" onClick={() => navigate(`/product/${product.productID}`)}><EyeIcon style={{ width: 15, height: 15 }} /></button><button className="ss-card-action" onClick={() => { addProductToCart(product); }}><ShoppingCartIcon style={{ width: 15, height: 15, color: "#A30D5F" }} /></button></div>
                      </div>
                      <div className="ss-card-body"><div className="ss-card-name">{product.productName}</div><div className="ss-card-price">{formatPrice(product.price)}</div></div>
                    </div>
                  );
                })}</div>
                {totalPages > 1 && <div className="ss-pagination"><CircularPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>}
              </>}

              {trulyEmpty && (
                phase === "upcoming" ? (
                  <div className="ss-empty-teaser">
                    <div className="ss-empty-teaser-shine" />
                    <div className="ss-empty-logo"><img src="/speed.jpg" alt="Franko" /></div>
                    <div className="ss-empty-kicker">SPEED SHOPPING • 7TH AUG • 9AM GMT</div>
                    
                    <div className="ss-teaser-fade-wrap"><p className={`ss-teaser-fade ${teaserVisible ? "show" : "hide"}`}>{activeTeasers[teaserIdx]}</p></div>
                    <div className="ss-empty-cd">
                      {countdown.d > 0 && <><div className="ss-empty-cd-box"><span className="ss-empty-cd-num">{pad(countdown.d)}</span><span className="ss-empty-cd-unit">DAYS</span></div><span className="ss-empty-cd-sep">:</span></>}
                      <div className="ss-empty-cd-box"><span className="ss-empty-cd-num">{pad(countdown.h)}</span><span className="ss-empty-cd-unit">HRS</span></div><span className="ss-empty-cd-sep">:</span>
                      <div className="ss-empty-cd-box"><span className="ss-empty-cd-num">{pad(countdown.m)}</span><span className="ss-empty-cd-unit">MINS</span></div><span className="ss-empty-cd-sep">:</span>
                      <div className="ss-empty-cd-box live"><span className="ss-empty-cd-num">{pad(countdown.s)}</span><span className="ss-empty-cd-unit">SECS</span></div>
                    </div>
                    <p className="ss-empty-note">🗓️  Begins on 7th Aug 9AM GMT • ⏳ Only 6 Hours • No Restock</p>
                   
                    <div className="ss-empty-actions"><button onClick={() => navigate("/")} className="ss-empty-browse">Browse Other Products🔔</button>{isFiltersActive && <button onClick={resetFilters} className="ss-empty-reset">Clear Filters</button>}</div>
                  </div>
                ) : (
                  <div className="ss-empty-teaser live">
                    <h2 className="ss-empty-h1" style={{ fontSize: 22 }}>FILTERED OUT? 😅</h2>
                    <p className="ss-empty-suspense">Live deals are flying right now — your filters hid them. Ends in:</p>
                    <div className="ss-empty-cd"><div className="ss-empty-cd-box live"><span className="ss-empty-cd-num">{pad(countdown.h)}</span><span className="ss-empty-cd-unit">HRS</span></div><span className="ss-empty-cd-sep">:</span><div className="ss-empty-cd-box live"><span className="ss-empty-cd-num">{pad(countdown.m)}</span><span className="ss-empty-cd-unit">MINS</span></div><span className="ss-empty-cd-sep">:</span><div className="ss-empty-cd-box live"><span className="ss-empty-cd-num">{pad(countdown.s)}</span><span className="ss-empty-cd-unit">SECS</span></div></div>
                    <button onClick={resetFilters} className="ss-empty-browse" style={{ marginTop: 14 }}>Show LIVE Deals ⚡</button>
                  </div>
                )
              )}
            </section>
          </div>
        </div>
        {showSortDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />}
      </div>
    </>
  );
};
export default SpeedShopping;