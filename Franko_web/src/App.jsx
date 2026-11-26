import ProductDetailSkeleton from "./Component/ProductDetailSkeleton";
import { productPageModule } from "./utils/productPageModule";
import { appStorage as localStorage } from "./utils/secureLocalStorageInit";
import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutCustomer } from "./Redux/Slice/customerSlice";

/* ==================== COMPONENTS ==================== */
import Nav from "./Component/Nav/Navbar";
import NoInternetPage from "./Component/NoInternet";
import ScrollToTop from "./Pages/ScrollToTop";

/* ==================== PUBLIC PAGES (CUSTOMER) ==================== */
const Home = lazy(() => import("./Pages/Home"));
import About from "./Pages/About";
import Contact from "./Pages/Contact";
const BrandsPage = lazy(() => import("./Pages/Brands"));
const ShowroomProductsPage = lazy(() => import("./Pages/ShowRooomProducts"));
const Phones = lazy(() => import("./Pages/Phones"));
const ProductDescription = lazy(productPageModule);
const Cart = lazy(() => import("./Pages/Cart"));
const Laptops = lazy(() => import("./Pages/Laptops"));
const Fridge = lazy(() => import("./Pages/Fridge"));
const Television = lazy(() => import("./Pages/Television"));
const Speakers = lazy(() => import("./Pages/Speaker"));
const Accessories = lazy(() => import("./Pages/Accessories"));
const Appliances = lazy(() => import("./Pages/Appliances"));
const Combo = lazy(() => import("./Pages/Combo"));
const Airconditioners = lazy(() => import("./Pages/AC"));
const Checkout = lazy(() => import("./Pages/Checkout"));
const OrderReceived = lazy(() => import("./Pages/OrderReceived"));
import Locations from "./Pages/Locations";
import Cancellation from "./Pages/OrderCancelled";
const Account = lazy(() => import("./Pages/Account"));
const Products = lazy(() => import("./Pages/Products"));
import Terms from "./Pages/Terms";
import PhoneSpeed from "./Pages/PhoneSpeed";
import Speed from "./Pages/Speed";
import TelCheckout from "./Pages/TelCheckout";

const OrderHistory = lazy(() => import("./Pages/OrderHistory"));
const Wishlist = lazy(() => import("./Pages/Wishlist"));
const OrderSuccess = lazy(() => import("./Pages/OrderSucess"));

/* ==================== AGENT PAGES ==================== */
const AgentPage = lazy(() => import("./Pages/Agents/AgentPage/AgentPage"));
const AgentDashboard = lazy(() => import("./Pages/Agents/AgentPage/AgentDashboard"));
const AgentOrders = lazy(() => import("./Pages/Agents/AgentPage/AgentOrders"));
const CTP001ProductsPage = lazy(() => import("./Pages/Agents/AgentPage/CTP001ProductsPage"));

/* ═══════════════════════════════════════════════════════════════
   ROUTES THAT RENDER WITHOUT THE MAIN NAVBAR
═══════════════════════════════════════════════════════════════ */
const NAVBAR_HIDDEN_PREFIXES = ["/telecel-blackfriday", "/tel-cart", "/tel-checkout"];

const shouldHideNavbar = (pathname) =>
  NAVBAR_HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

/* ═══════════════════════════════════════════════════════════════
   SAFE STORAGE HELPERS
═══════════════════════════════════════════════════════════════ */
const safeGetFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    if (typeof data === "object" && data !== null) return data;
    if (typeof data === "string" && data === "[object Object]") {
      localStorage.removeItem(key);
      return null;
    }
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    return data;
  } catch {
    return null;
  }
};

const safeSetToStorage = (key, value) => {
  try {
    if (!value) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch (e) {
    console.error(`Error setting ${key} to storage:`, e);
  }
};

const cleanupCorruptedEntries = () => {
  try {
    ["customer", "user", "loginTime", "lastActivity"].forEach((key) => {
      const data = safeGetFromStorage(key);
      if (typeof data === "string" && data === "[object Object]") {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.error("Error cleaning up entries:", e);
  }
};

cleanupCorruptedEntries();

const getUserRole = () => {
  try {
    const customer = safeGetFromStorage("customer");
    const user = safeGetFromStorage("user");
    if (!customer && !user) return null;
    if (user?.position === "agent") return "agent";
    if (customer?.isAgent === true) return "agent";
    return customer?.accountType || null;
  } catch {
    return null;
  }
};

/* ═══════════════════════════════════════════════════════════════
   AUTHENTICATION CHECKER COMPONENT
═══════════════════════════════════════════════════════════════ */
const AuthenticationChecker = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const customer = useSelector((state) => state.customer.currentCustomer);

  useEffect(() => {
    const checkAuthState = () => {
      try {
        if (customer && (!customer.accessToken || customer.accessToken === "")) {
          dispatch(logoutCustomer());
          safeSetToStorage("customer", null);
          navigate("/", { replace: true });
          return;
        }
        const storedCustomer = safeGetFromStorage("customer");
        if (customer && !storedCustomer) {
          safeSetToStorage("customer", customer);
        }
      } catch {
        cleanupCorruptedEntries();
      }
    };
    checkAuthState();
    const interval = setInterval(checkAuthState, 30000);
    return () => clearInterval(interval);
  }, [customer, dispatch, navigate]);

  return null;
};

/* ═══════════════════════════════════════════════════════════════
   PROTECTED ROUTE COMPONENT
═══════════════════════════════════════════════════════════════ */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const userRole = getUserRole();
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

/* ═══════════════════════════════════════════════════════════════
   STORAGE & ACTIVITY MANAGER COMPONENT
═══════════════════════════════════════════════════════════════ */
const StorageManager = () => {
  useEffect(() => {
    cleanupCorruptedEntries();
    const updateActivity = () => {
      localStorage.setItem("lastActivityTimestamp", Date.now().toString());
    };
    updateActivity();
    let throttleTimer;
    const handleActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        updateActivity();
        throttleTimer = null;
      }, 3000);
    };
    const activeEvents = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    activeEvents.forEach((evt) =>
      window.addEventListener(evt, handleActivity, { passive: true })
    );
    const cleanupInterval = setInterval(() => {
      cleanupCorruptedEntries();
    }, 10 * 60 * 1000);
    const handleBeforeUnload = () => {
      try {
        const customer = safeGetFromStorage("customer");
        const user = safeGetFromStorage("user");
        if (customer && (!customer.accessToken || customer.accessToken === ""))
          safeSetToStorage("customer", null);
        if (user && (!user.accessToken || user.accessToken === "")) {
          safeSetToStorage("user", null);
          safeSetToStorage("loginTime", null);
          safeSetToStorage("lastActivity", null);
        }
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      activeEvents.forEach((evt) => window.removeEventListener(evt, handleActivity));
      if (throttleTimer) clearTimeout(throttleTimer);
      clearInterval(cleanupInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
  return null;
};

/* ═══════════════════════════════════════════════════════════════
   MAIN APP COMPONENT
═══════════════════════════════════════════════════════════════ */
function MetaPageViews() {
  const { pathname, search } = useLocation();
  const lastPage = useRef(null);
  useEffect(() => {
    const page = pathname + search;
    if (
      lastPage.current !== null &&
      lastPage.current !== page &&
      typeof window.fbq === "function"
    ) {
      window.fbq("trackSingle", "1039651225691142", "PageView");
    }
    lastPage.current = page;
  }, [pathname, search]);
  return null;
}

function FirstVisitBlackFriday() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => {
    try {
      if (
        Date.now() > Date.parse("2026-11-27T23:59:59Z") ||
        localStorage.getItem("blackFridayFirstVisit") ||
        localStorage.getItem("customer")
      ) {
        return false;
      }
      localStorage.setItem("blackFridayFirstVisit", "shown");
      return true;
    } catch {
      return false;
    }
  });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearInterval(id);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  const start = Date.parse("2026-11-27T00:00:00Z");
  const end = Date.parse("2026-11-27T23:59:59Z");
  const isBeforeStart = now < start;
  const remaining = Math.max(0, Math.floor(((isBeforeStart ? start : end) - now) / 1000));

  const d = Math.floor(remaining / 86400);
  const h = Math.floor((remaining % 86400) / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div
      role="presentation"
      onClick={() => setOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8, 8, 8, 0.78)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        padding: 20,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="bf-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(440px, 100%)",
          borderRadius: 24,
          padding: "32px 28px 28px",
          background:
            "radial-gradient(circle at 50% -40%, #3a3a3a 0%, #171717 48%, #080808 100%)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          color: "#FFFFFF",
          textAlign: "center",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.65)",
          overflow: "hidden",
        }}
      >
        {/* Top Black Friday gradient bar */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #FFD400, #FF9F0F, #E50914)",
          }}
        />

        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            width: 32,
            height: 32,
            borderRadius: 999,
            color: "rgba(255, 255, 255, 0.8)",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            fontSize: 20,
            lineHeight: 1,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <div
          style={{
            color: "#FFD400",
            fontWeight: 800,
            letterSpacing: 2,
            fontSize: 11,
            textTransform: "uppercase",
          }}
        >
          FRANKO TRADING · 27 NOV 2026
        </div>

        {/* Discount Callout */}
        <div
          style={{
            display: "inline-block",
            marginTop: 14,
            padding: "6px 14px",
            borderRadius: 999,
            background: "#E50914",
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            boxShadow: "0 6px 20px rgba(229, 9, 20, 0.45)",
          }}
        >
          Discounts Up To <span style={{ color: "#FFD400" }}>40% OFF</span>
        </div>

        <h2
          id="bf-title"
          style={{
            fontSize: 34,
            fontWeight: 900,
            lineHeight: 1.1,
            margin: "14px 0 10px",
            letterSpacing: "-0.02em",
            color: "#FFFFFF",
          }}
        >
          Black Friday <span style={{ color: "#FFD400" }}>is {isBeforeStart ? "Coming." : "Here."}</span>
        </h2>

        <p
          style={{
            color: "rgba(255, 255, 255, 0.78)",
            fontSize: 14,
            lineHeight: 1.5,
            margin: "0 auto 18px",
            maxWidth: 340,
          }}
        >
          Save <strong style={{ color: "#FFD400" }}>up to 40% OFF</strong> on phones,
          laptops &amp; home appliances - online &amp; across all Franko branches.
        </p>

        {/* Countdown */}
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "rgba(255, 255, 255, 0.6)",
              marginBottom: 8,
            }}
          >
            {isBeforeStart ? "Starts in" : "Ends in"}
          </div>
          <div
            aria-live="off"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {[
              { val: pad(d), label: "Days" },
              { val: pad(h), label: "Hrs" },
              { val: pad(m), label: "Min" },
              { val: pad(s), label: "Sec" },
            ].map((unit) => (
              <div
                key={unit.label}
                style={{
                  minWidth: 56,
                  padding: "8px 6px",
                  borderRadius: 10,
                  background: "#080808",
                  border: "1px solid rgba(255, 212, 0, 0.28)",
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    lineHeight: 1,
                    color: "#FFD400",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {unit.val}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "rgba(255, 255, 255, 0.55)",
                    marginTop: 4,
                  }}
                >
                  {unit.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            navigate("/blackfriday");
          }}
          style={{
            border: 0,
            borderRadius: 12,
            padding: "14px 24px",
            background: "#FFD400",
            color: "#080808",
            fontWeight: 900,
            fontSize: 14,
            cursor: "pointer",
            width: "100%",
            boxShadow: "0 8px 24px rgba(255, 212, 0, 0.28)",
          }}
        >
          Explore Black Friday deals →
        </button>
      </section>
    </div>
  );
}

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { pathname } = useLocation();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOnline) {
    return <NoInternetPage />;
  }

  return (
    <>
      <FirstVisitBlackFriday />
      <MetaPageViews />
      <StorageManager />
      <AuthenticationChecker />
      {!shouldHideNavbar(pathname) && <Nav />}
      <ScrollToTop />

      <Suspense
        key={pathname}
        fallback={pathname.startsWith("/product/") ? <ProductDetailSkeleton /> : null}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/phones" element={<Phones />} />
          <Route path="/computers" element={<Laptops />} />
          <Route path="/refrigerator" element={<Fridge />} />
          <Route path="/television" element={<Television />} />
          <Route path="/speakers" element={<Speakers />} />
          <Route path="/accessories" element={<Accessories />} />
          <Route path="/appliances" element={<Appliances />} />
          <Route path="/washing-machine" element={<Combo />} />
          <Route path="/air-condition" element={<Airconditioners />} />
          <Route path="/cart/:cartId" element={<Cart />} />

          {/* ═══════════════════════════════════════════════════
            PRODUCT ROUTE - SLUG MIGRATION
            New canonical path uses product-name slug:
              /product/samsung-galaxy-a56-5g

            Legacy UUID path continues to work and is handled
            inside ProductDescription with a client-side redirect
            + server 301 (see SEO_MIGRATION_GUIDE.md).
            Keep the single route below - it matches BOTH
            slugs and UUIDs (UUID = just another string).
        ═══════════════════════════════════════════════════ */}
          <Route
            path="/product/:slug"
            element={
              <Suspense key={pathname} fallback={<ProductDetailSkeleton />}>
                <ProductDescription />
              </Suspense>
            }
          />

          <Route path="showroom/:showRoomID" element={<ShowroomProductsPage />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/brand/:brandId" element={<BrandsPage />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/products" element={<Products />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-received" element={<OrderReceived />} />
          <Route path="/order-success/:orderId" element={<OrderSuccess />} />
          <Route path="/account" element={<Account />} />
          <Route path="/blackfriday" element={<Speed />} />
          <Route path="/telecel-blackfriday" element={<PhoneSpeed />} />
          <Route path="/tel-checkout" element={<TelCheckout />} />

          <Route path="/shops" element={<Locations />} />
          <Route path="/order-cancelled" element={<Cancellation />} />

          <Route
            path="/agent/*"
            element={
              <ProtectedRoute allowedRoles={["agent"]}>
                <AgentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent/dashboard"
            element={
              <ProtectedRoute allowedRoles={["agent"]}>
                <AgentPage>
                  <AgentDashboard />
                </AgentPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent/orders"
            element={
              <ProtectedRoute allowedRoles={["agent"]}>
                <AgentPage>
                  <AgentOrders />
                </AgentPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent/order-placement"
            element={
              <ProtectedRoute allowedRoles={["agent"]}>
                <AgentPage>
                  <CTP001ProductsPage />
                </AgentPage>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;