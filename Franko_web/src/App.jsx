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
import OrderSuccessPage from "./Pages/OrderSucess";

/* ==================== AGENT PAGES ==================== */
import AgentPage from "./Pages/Agents/AgentPage/AgentPage";
import AgentDashboard from "./Pages/Agents/AgentPage/AgentDashboard";
import AgentOrders from "./Pages/Agents/AgentPage/AgentOrders";

/* ==================== AUTH PAGES ==================== */


/* ═══════════════════════════════════════════════════════════════
   ENCRYPTED LOCALSTORAGE IMPLEMENTATION
═══════════════════════════════════════════════════════════════ */

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY || "your-secret-key";

/**
 * Encrypt data using AES encryption
 */
const encrypt = (data) => {
  try {
    const str = typeof data === "string" ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(str, SECRET_KEY).toString();
  } catch (err) {
    console.error("Encryption error:", err);
    return data;
  }
};

/**
 * Decrypt AES encrypted data
 */
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

/**
 * Monkey patch localStorage for automatic encryption/decryption
 */
(function enforceEncryptedLocalStorage() {
  const originalSet = Storage.prototype.setItem;
  const originalGet = Storage.prototype.getItem;
  const originalRemove = Storage.prototype.removeItem;

  Storage.prototype.setItem = function (key, value) {
    try {
      if (typeof value === "string" && value.startsWith("U2FsdGVkX1")) {
        originalSet.call(this, key, value);
      } else {
        const encrypted = encrypt(value);
        originalSet.call(this, key, encrypted);
      }
    } catch (err) {
      console.error("setItem error:", err);
      originalSet.call(this, key, value);
    }
  };

  Storage.prototype.getItem = function (key) {
    try {
      const encrypted = originalGet.call(this, key);
      if (!encrypted) return null;

      const decrypted = decrypt(encrypted);

      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (err) {
      console.error("getItem error:", err);
      return null;
    }
  };

  Storage.prototype.removeItem = function (key) {
    originalRemove.call(this, key);
  };
})();

/* ═══════════════════════════════════════════════════════════════
   SAFE STORAGE HELPERS
═══════════════════════════════════════════════════════════════ */

/**
 * Safely get data from localStorage
 */
const safeGetFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);

    if (!data) return null;

    if (typeof data === "object" && data !== null) {
      return data;
    }

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
  } catch (e) {
    console.error(`Error getting ${key} from storage:`, e);
    return null;
  }
};

/**
 * Safely set data to localStorage
 */
const safeSetToStorage = (key, value) => {
  try {
    if (!value) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.error(`Error setting ${key} to storage:`, e);
  }
};

/**
 * Clean up corrupted localStorage entries
 */
const cleanupCorruptedEntries = () => {
  try {
    const keysToCheck = ["customer", "user", "loginTime", "lastActivity"];
    keysToCheck.forEach((key) => {
      const data = safeGetFromStorage(key);
      if (typeof data === "string" && data === "[object Object]") {
        console.warn(`Removing corrupted entry: ${key}`);
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.error("Error cleaning up corrupted entries:", e);
  }
};

// Initialize cleanup on app load
cleanupCorruptedEntries();

/* ═══════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
═══════════════════════════════════════════════════════════════ */

/**
 * Get current user role from storage
 * Returns: "customer", "agent", or null
 */
const getUserRole = () => {
  try {
    const customer = safeGetFromStorage("customer");
    const user = safeGetFromStorage("user");

    if (!customer && !user) return null;

    // For agent users (stored in user slice with position)
    if (user?.position === "agent") return "agent";
    
    // For customer accounts
    return customer?.accountType || null; // "customer" or "agent"
  } catch (err) {
    console.error("Error getting user role:", err);
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
        // Check customer authentication
        if (customer && (!customer.accessToken || customer.accessToken === "")) {
          console.warn("Customer token invalid, logging out");
          dispatch(logoutCustomer());
          safeSetToStorage("customer", null);
          navigate("/", { replace: true });
          return;
        }

   

        // Sync localStorage with Redux state
        const storedCustomer = safeGetFromStorage("customer");
 
        if (customer && !storedCustomer) {
          safeSetToStorage("customer", customer);
        }

      
      } catch (error) {
        console.error("Auth check error:", error);
        cleanupCorruptedEntries();
      }
    };

    // Initial check
    checkAuthState();

    // Periodic check every 30 seconds
    const interval = setInterval(checkAuthState, 30000);

    return () => clearInterval(interval);
  }, [customer,  dispatch, navigate]);

  return null;
};

/* ═══════════════════════════════════════════════════════════════
   PROTECTED ROUTE COMPONENT (Agent Only)
═══════════════════════════════════════════════════════════════ */

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const userRole = getUserRole();

  // Check if user's role is in the allowed roles
  if (!userRole || !allowedRoles.includes(userRole)) {
    console.warn(`Access denied for role: ${userRole}`);
    return <Navigate to="/" replace />;
  }

  return children;
};

/* ═══════════════════════════════════════════════════════════════
   STORAGE MANAGER COMPONENT
═══════════════════════════════════════════════════════════════ */

const StorageManager = () => {
  useEffect(() => {
    // Initial cleanup
    cleanupCorruptedEntries();

    // Periodic cleanup every 10 minutes
    const cleanupInterval = setInterval(() => {
      cleanupCorruptedEntries();
    }, 10 * 60 * 1000);

    // Cleanup on page unload
    const handleBeforeUnload = () => {
      try {
        const customer = safeGetFromStorage("customer");
        const user = safeGetFromStorage("user");

        if (customer && (!customer.accessToken || customer.accessToken === "")) {
          safeSetToStorage("customer", null);
        }

        if (user && (!user.accessToken || user.accessToken === "")) {
          safeSetToStorage("user", null);
          safeSetToStorage("loginTime", null);
          safeSetToStorage("lastActivity", null);
        }
      } catch (e) {
        console.error("Cleanup error on unload:", e);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
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


  /* ──────────────────────────────────────────
     Network Status Monitoring
  ────────────────────────────────────────── */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log("📡 Back online");
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log("📡 Went offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  /* ──────────────────────────────────────────
     Initialize Token Monitor (for agents)
  ────────────────────────────────────────── */


    // Initialize token monitor

  /* ──────────────────────────────────────────
     Show No Internet Page if Offline
  ────────────────────────────────────────── */
  if (!isOnline) {
    return <NoInternetPage />;
  }

  /* ──────────────────────────────────────────
     Render Application
  ────────────────────────────────────────── */
  return (
    <>
      <StorageManager />
      <AuthenticationChecker />
      <Nav />
      <ScrollToTop />

      <Routes>
        {/* ==================== CUSTOMER ROUTES (PUBLIC) ==================== */}
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
        <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
        <Route path="/account" element={<Account />} />
        <Route path="/shops" element={<Locations />} />
        <Route path="/order-cancelled" element={<Cancellation />} />

       
 

        {/* ==================== AGENT ROUTES (PROTECTED) ==================== */}
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

        {/* ==================== DEFAULT REDIRECT ==================== */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;