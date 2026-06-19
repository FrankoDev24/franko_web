import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutCustomer } from "./Redux/Slice/customerSlice";
import CryptoJS from "crypto-js";

/* ==================== COMPONENTS ==================== */
import Nav from "./Component/Nav/Navbar";
import NoInternetPage from "./Component/NoInternet";
import ScrollToTop from "./Pages/ScrollToTop";

/* ==================== PUBLIC PAGES (CUSTOMER) ==================== */
import Home from "./Pages/Home";
import About from "./Pages/About";
import Contact from "./Pages/Contact";
import BrandsPage from "./Pages/Brands";
import ShowroomProductsPage from "./Pages/ShowRooomProducts";
import Phones from "./Pages/Phones";
import ProductDescription from "./Pages/ProductDescription";
import ProductCard from "./Component/ProductCard";
import Cart from "./Pages/Cart";
import Laptops from "./Pages/Laptops";
import Fridge from "./Pages/Fridge";
import Television from "./Pages/Television";
import Speakers from "./Pages/Speaker";
import Accessories from "./Pages/Accessories";
import Appliances from "./Pages/Appliances";
import Combo from "./Pages/Combo";
import Airconditioners from "./Pages/AC";
import Checkout from "./Pages/Checkout";
import OrderReceived from "./Pages/OrderReceived";
import Locations from "./Pages/Locations";
import Cancellation from "./Pages/OrderCancelled";
import Account from "./Pages/Account";
import Products from "./Pages/Products";
import Terms from "./Pages/Terms";
import OrderHistory from "./Pages/OrderHistory";
import Wishlist from "./Pages/Wishlist";
import OrderSuccess from "./Pages/OrderSucess";

/* ==================== AGENT PAGES ==================== */
import AgentPage from "./Pages/Agents/AgentPage/AgentPage";
import AgentDashboard from "./Pages/Agents/AgentPage/AgentDashboard";
import AgentOrders from "./Pages/Agents/AgentPage/AgentOrders";
import CTP001ProductsPage from "./Pages/Agents/AgentPage/CTP001ProductsPage";

/* ═══════════════════════════════════════════════════════════════
   ENCRYPTED LOCALSTORAGE IMPLEMENTATION
═══════════════════════════════════════════════════════════════ */
const SECRET_KEY = import.meta.env.VITE_SECRET_KEY || "your-secret-key";

const encrypt = (data) => {
  try {
    const str = typeof data === "string" ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(str, SECRET_KEY).toString();
  } catch (err) {
    console.error("Encryption error:", err);
    return data;
  }
};

const decrypt = (cipherText) => {
  try {
    if (!cipherText || typeof cipherText !== "string") return cipherText;
    if (!cipherText.startsWith("U2FsdGVkX1")) return cipherText;

    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (err) {
    console.error("Decryption error:", err);
    return cipherText;
  }
};

(function enforceEncryptedLocalStorage() {
  const originalSet = Storage.prototype.setItem;
  const originalGet = Storage.prototype.getItem;
  const originalRemove = Storage.prototype.removeItem;

  Storage.prototype.setItem = function (key, value) {
    try {
      // Do not encrypt the activity timestamp for pure speed/performance
      if (key === "lastActivityTimestamp" || (typeof value === "string" && value.startsWith("U2FsdGVkX1"))) {
        originalSet.call(this, key, value);
      } else {
        const encrypted = encrypt(value);
        originalSet.call(this, key, encrypted);
      }
    } catch (err) {
      originalSet.call(this, key, value);
    }
  };

  Storage.prototype.getItem = function (key) {
    try {
      const encrypted = originalGet.call(this, key);
      if (!encrypted) return null;
      if (key === "lastActivityTimestamp") return encrypted;

      const decrypted = decrypt(encrypted);
      try { return JSON.parse(decrypted); } catch { return decrypted; }
    } catch (err) { return null; }
  };

  Storage.prototype.removeItem = function (key) {
    originalRemove.call(this, key);
  };
})();

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
      try { return JSON.parse(data); } catch { return null; }
    }
    return data;
  } catch (e) {
    return null;
  }
};

const safeSetToStorage = (key, value) => {
  try {
    if (!value) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch (e) { console.error(`Error setting ${key} to storage:`, e); }
};

const cleanupCorruptedEntries = () => {
  try {
    ["customer", "user", "loginTime", "lastActivity"].forEach((key) => {
      const data = safeGetFromStorage(key);
      if (typeof data === "string" && data === "[object Object]") {
        localStorage.removeItem(key);
      }
    });
  } catch (e) { console.error("Error cleaning up entries:", e); }
};

cleanupCorruptedEntries();

const getUserRole = () => {
  try {
    const customer = safeGetFromStorage("customer");
    const user = safeGetFromStorage("user");
    if (!customer && !user) return null;
    if (user?.position === "agent") return "agent";
    return customer?.accountType || null; 
  } catch (err) { return null; }
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
      } catch (error) {
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

    // Tracker for User Activity 
    const updateActivity = () => {
      localStorage.setItem("lastActivityTimestamp", Date.now().toString());
    };
    updateActivity(); // Initialize on load

    let throttleTimer;
    const handleActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        updateActivity();
        throttleTimer = null;
      }, 3000); // Record activity at most once every 3 seconds
    };

    const activeEvents = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    activeEvents.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));

    const cleanupInterval = setInterval(() => {
      cleanupCorruptedEntries();
    }, 10 * 60 * 1000);

    const handleBeforeUnload = () => {
      try {
        const customer = safeGetFromStorage("customer");
        const user = safeGetFromStorage("user");
        if (customer && (!customer.accessToken || customer.accessToken === "")) safeSetToStorage("customer", null);
        if (user && (!user.accessToken || user.accessToken === "")) {
          safeSetToStorage("user", null);
          safeSetToStorage("loginTime", null);
          safeSetToStorage("lastActivity", null);
        }
      } catch (e) { console.error("Cleanup error:", e); }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      activeEvents.forEach(evt => window.removeEventListener(evt, handleActivity));
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
function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
      <StorageManager />
      <AuthenticationChecker />
      <Nav />
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/phones" element={<Phones ProductCard={ProductCard} />} />
        <Route path="/computers" element={<Laptops ProductCard={ProductCard} />} />
        <Route path="/refrigerator" element={<Fridge ProductCard={ProductCard} />} />
        <Route path="/television" element={<Television ProductCard={ProductCard} />} />
        <Route path="/speakers" element={<Speakers ProductCard={ProductCard} />} />
        <Route path="/accessories" element={<Accessories ProductCard={ProductCard} />} />
        <Route path="/appliances" element={<Appliances ProductCard={ProductCard} />} />
        <Route path="/washing-machine" element={<Combo ProductCard={ProductCard} />} />
        <Route path="/air-condition" element={<Airconditioners ProductCard={ProductCard} />} />
        <Route path="/cart/:cartId" element={<Cart />} />
        <Route path="/product/:productID" element={<ProductDescription />} />
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
        <Route path="/shops" element={<Locations />} />
        <Route path="/order-cancelled" element={<Cancellation />} />

        <Route path="/agent/*" element={<ProtectedRoute allowedRoles={["agent"]}><AgentPage /></ProtectedRoute>} />
        <Route path="/agent/dashboard" element={<ProtectedRoute allowedRoles={["agent"]}><AgentPage><AgentDashboard /></AgentPage></ProtectedRoute>} />
        <Route path="/agent/orders" element={<ProtectedRoute allowedRoles={["agent"]}><AgentPage><AgentOrders /></AgentPage></ProtectedRoute>} />
        <Route path="/agent/order-placement" element={<ProtectedRoute allowedRoles={["agent"]}><AgentPage><CTP001ProductsPage /></AgentPage></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;