import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutCustomer } from "./Redux/Slice/customerSlice";
import { logoutUser } from "./Redux/Slice/userSlice";
import CryptoJS from "crypto-js";
import Nav from "./Component/Nav/Navbar";
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
import AdminPage from "./Pages/AdminPages/AdminPanel";
import Dashboard from "./Pages/AdminPages/Dashboard";
import Orders from "./Pages/AdminPages/Orders/Orders";
import AdminProducts from "./Pages/AdminPages/Products/AdminProducts";
import Adminbrands from "./Pages/AdminPages/Adminbrands";
import AdminCategory from "./Pages/AdminPages/AdminCategory";
import AdminShowroom from "./Pages/AdminPages/AdminShowroom";
import Users from "./Pages/AdminPages/Users";
import Customers from "./Pages/AdminPages/Customers";
import AdvertisementPage from "./Pages/AdminPages/Advertisement";
import Account from "./Pages/Account";
import Products from "./Pages/Products";
import Terms from "./Pages/Terms";
import OrderHistory from "./Pages/OrderHistory";
import Wishlist from "./Pages/Wishlist";
import AgentPage from "./Pages/Agents/AgentPage/AgentPage";
import AgentDashboard from "./Pages/Agents/AgentPage/AgentDashboard";
import AgentOrders from "./Pages/Agents/AgentPage/AgentOrders";
import FulfillmentPage from "./Pages/Fulfilments/FulfilmentPage/FulfilmentPage";
import FulfilmentsDashboard from "./Pages/Fulfilments/FulfilmentPage/FulfilmentsDashboard";
import FulfilmentsOrder from "./Pages/Fulfilments/FulfilmentPage/FulfilmentsOrder";
import ContentDashboard from "./Pages/ContentManager/ContentManagerPage/ContentDashboard";
import ContentProduct from "./Pages/ContentManager/ContentManagerPage/ContentProduct";
import ContentShowroom from "./Pages/ContentManager/ContentManagerPage/ContentShowroom";
import Contentbrand from "./Pages/ContentManager/ContentManagerPage/Contentbrand";
import ContentCategory from "./Pages/ContentManager/ContentManagerPage/ContentCategory";
import ContentBanner from "./Pages/ContentManager/ContentManagerPage/ContentBanner";
import ContentPage from "./Pages/ContentManager/ContentPage";
import NoInternetPage from "./Component/NoInternet";
import UserLogin from "./Pages/AdminAuth/UserLogin";
import UserRegistration from "./Pages/AdminAuth/UserRegistration";
import DevPage from "./Pages/Developer/DevPage";
import DevDashboard from "./Pages/Developer/Dev/DevDashboard";
import DevBrands from "./Pages/Developer/Dev/DevBrands";
import DevCategory from "./Pages/Developer/Dev/DevCategory";
import DevProducts from "./Pages/Developer/Dev/DevProducts";
import DevOrders from "./Pages/Developer/Dev/DevOrders";
import DevShowroom from "./Pages/Developer/Dev/DevShowroom";
import DevBanners from "./Pages/Developer/Dev/DevBanners";
import DevUsers from "./Pages/Developer/Dev/DevUsers";
import DevCustomers from "./Pages/Developer/Dev/DevCustomers";
import Payments from "./Pages/Developer/Dev/Payments";
import OrderSuccessPage from "./Pages/OrderSucess";
import ScrollToTop from "./Pages/ScrollToTop";
import DigiPage from "./Pages/DigitalMarketer/DigiPage";
import DigiOrders from "./Pages/DigitalMarketer/Digi/DigiOrders";
import DigiProducts from "./Pages/DigitalMarketer/Digi/DigiProducts";
import ContentBranchProduct from "./Pages/ContentManager/ContentManagerPage/ContentBranchProduct";
import BranchProductsPage from "./Pages/AdminPages/BranchProductsPage";

// ==================== ENCRYPTED LOCALSTORAGE IMPLEMENTATION ====================

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY || "your-secret-key";

// --- Encryption helpers ---
const encrypt = (data) => {
  try {
    const str = typeof data === "string" ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(str, SECRET_KEY).toString();
  } catch (err) {
    return data;
  }
};

const decrypt = (cipherText) => {
  try {
    if (!cipherText || typeof cipherText !== "string") return cipherText;
    if (!cipherText.startsWith("U2FsdGVkX1")) return cipherText; // Only decrypt valid AES data

    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (err) {
    return cipherText;
  }
};

// --- Monkey patch localStorage ---
(function enforceEncryptedLocalStorage() {
  const originalSet = Storage.prototype.setItem;
  const originalGet = Storage.prototype.getItem;
  const originalRemove = Storage.prototype.removeItem;

  // ✅ Encrypt automatically when setting
  Storage.prototype.setItem = function (key, value) {
    try {
      if (typeof value === "string" && value.startsWith("U2FsdGVkX1")) {
        // already encrypted
        originalSet.call(this, key, value);
      } else {
        const encrypted = encrypt(value);
        originalSet.call(this, key, encrypted);
      }
    } catch (err) {
      originalSet.call(this, key, value);
    }
  };

  // ✅ Decrypt automatically when getting
  Storage.prototype.getItem = function (key) {
    try {
      const encrypted = originalGet.call(this, key);
      if (!encrypted) return null;

      const decrypted = decrypt(encrypted);

      // If it's JSON, parse safely
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted; // plain string
      }
    } catch (err) {
      return null;
    }
  };

  Storage.prototype.removeItem = function (key) {
    originalRemove.call(this, key);
  };
})();

// ==================== SAFE STORAGE HELPERS ====================

const safeGetFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);

    // The monkey-patched localStorage already returns parsed objects or null
    if (!data) return null;

    // If it's already an object (from monkey patch), return it
    if (typeof data === "object" && data !== null) {
      return data;
    }

    // If it's a string that looks like corrupted object notation
    if (typeof data === "string" && data === "[object Object]") {
      localStorage.removeItem(key);
      return null;
    }

    // If it's a valid JSON string, try parsing it
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch (parseError) {
        return null;
      }
    }

    return data;
  } catch (e) {
    return null;
  }
};

const safeSetToStorage = (key, value) => {
  try {
    if (!value) {
      localStorage.removeItem(key);
    } else {
      // The monkey-patched localStorage will handle encryption and stringification
      localStorage.setItem(key, value);
    }
  } catch (e) {}
};

const cleanupCorruptedEntries = () => {
  try {
    const keysToCheck = ["customer", "user", "loginTime"];
    keysToCheck.forEach((key) => {
      const data = safeGetFromStorage(key);
      if (typeof data === "string" && data === "[object Object]") {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {}
};

// Clean up on app initialization
cleanupCorruptedEntries();

// ==================== UTILITY FUNCTIONS ====================

const getUserRole = () => {
  try {
    const customer = safeGetFromStorage("customer");
    const user = safeGetFromStorage("user");

    if (!customer && !user) return null;

    if (user?.position) return user.position; // Supervisor, Developer, etc.
    return customer?.accountType || null; // customer, agent, admin
  } catch (err) {
    return null;
  }
};

const isWebBrowser = () => {
  const ua = navigator.userAgent;
  return !ua.includes("Electron") && /Mozilla|Chrome|Safari|Firefox/i.test(ua);
};

const isElectron = () => navigator.userAgent.includes("Electron");

// ==================== AUTHENTICATION CHECKER ====================
const AuthenticationChecker = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const customer = useSelector((state) => state.customer.currentCustomer);
  const user = useSelector((state) => state.user.currentUser);

  useEffect(() => {
    const checkAuthState = () => {
      try {
        // Check customer authentication
        if (
          customer &&
          (!customer.accessToken || customer.accessToken === "")
        ) {
          dispatch(logoutCustomer());
          safeSetToStorage("customer", null);
          navigate("/", { replace: true });
          return;
        }

        // Check user authentication
        if (user && (!user.accessToken || user.accessToken === "")) {
          dispatch(logoutUser());
          safeSetToStorage("user", null);
          safeSetToStorage("loginTime", null);
          navigate("/", { replace: true });
          return;
        }

        // Additional check: verify localStorage data consistency
        const storedCustomer = safeGetFromStorage("customer");
        const storedUser = safeGetFromStorage("user");

        // If Redux state has customer but localStorage doesn't, sync them
        if (customer && !storedCustomer) {
          safeSetToStorage("customer", customer);
        }

        // If Redux state has user but localStorage doesn't, sync them
        if (user && !storedUser) {
          safeSetToStorage("user", user);
        }

        // If localStorage has data but Redux state doesn't, this might indicate a refresh
        // Let Redux initialization handle this case
      } catch (error) {
        // On any error, clear potentially corrupted data
        cleanupCorruptedEntries();
      }
    };

    // Check on mount
    checkAuthState();

    // Check periodically every 30 seconds
    const interval = setInterval(checkAuthState, 30000);

    return () => clearInterval(interval);
  }, [customer, user, dispatch, navigate]);

  return null;
};

// ==================== PROTECTED ROUTE COMPONENT ====================

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const userRole = getUserRole();

  // ✅ Web-only restriction: allow only Developer, agent, and Fulfillment
  if (
    isWebBrowser() &&
    userRole &&
    !["Developer", "agent", "Fulfillment"].includes(userRole)
  ) {
    return <Navigate to="/" replace />;
  }

  // ✅ Electron allows all roles (you can modify this as needed)
  if (isElectron()) {
    return children;
  }

  // ✅ Check if user's role is in the allowed roles
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// ==================== 🔒 BLOCKED ROUTE COMPONENT ====================

/**
 * BlockedRoute - Prevents access to specified routes entirely
 * This is used for /admin/process to block all access
 */
const BlockedRoute = () => {
  return <Navigate to="/" replace />;
};

// ==================== CONDITIONAL NAVBAR ====================

const ConditionalNavbar = () => {
  const location = useLocation();
  const pathname = location.pathname;

  const hiddenPaths = [
    "/admin/login",
    "/admin/register",
    "/admin/process", // ✅ Hide navbar on blocked route too
  ];

  const isAdminPath = pathname.startsWith("/admin/");
  const isFulfillmentPath = pathname.startsWith("/fulfillment/");
  const isContentPath = pathname.startsWith("/content/");
  const isDevPath = pathname.startsWith("/dev/");
  const isDigiPath = pathname.startsWith("/digi/");

  return (
    !hiddenPaths.includes(pathname) &&
    !isAdminPath &&
    !isFulfillmentPath &&
    !isContentPath &&
    !isDevPath &&
    !isDigiPath && <Nav />
  );
};

// ==================== STORAGE CLEANUP UTILITY ====================
const StorageManager = () => {
  useEffect(() => {
    // Cleanup corrupted entries on app start
    cleanupCorruptedEntries();

    // Set up periodic cleanup (every 10 minutes)
    const cleanupInterval = setInterval(() => {
      cleanupCorruptedEntries();
    }, 10 * 60 * 1000);

    // Cleanup on page unload
    const handleBeforeUnload = () => {
      try {
        // Ensure any pending storage operations are completed
        const customer = safeGetFromStorage("customer");
        const user = safeGetFromStorage("user");

        if (
          customer &&
          (!customer.accessToken || customer.accessToken === "")
        ) {
          safeSetToStorage("customer", null);
        }

        if (user && (!user.accessToken || user.accessToken === "")) {
          safeSetToStorage("user", null);
          safeSetToStorage("loginTime", null);
        }
      } catch (e) {}
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(cleanupInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return null;
};

// ==================== MAIN APP COMPONENT ====================

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor network status
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
    return (
      <div>
        <NoInternetPage />
      </div>
    );
  }

  return (
    <>
      <StorageManager />
      <AuthenticationChecker />
      <ConditionalNavbar />
      <ScrollToTop />

      <Routes>
        {/* ==================== PUBLIC ROUTES ==================== */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/phones" element={<Phones ProductCard={ProductCard} />} />
        <Route
          path="/computers"
          element={<Laptops ProductCard={ProductCard} />}
        />
        <Route
          path="/refrigerator"
          element={<Fridge ProductCard={ProductCard} />}
        />
        <Route
          path="/television"
          element={<Television ProductCard={ProductCard} />}
        />
        <Route
          path="/speakers"
          element={<Speakers ProductCard={ProductCard} />}
        />
        <Route
          path="/accessories"
          element={<Accessories ProductCard={ProductCard} />}
        />
        <Route
          path="/appliances"
          element={<Appliances ProductCard={ProductCard} />}
        />
        <Route
          path="/washing-machine"
          element={<Combo ProductCard={ProductCard} />}
        />
        <Route
          path="/air-condition"
          element={<Airconditioners ProductCard={ProductCard} />}
        />
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

        {/* ==================== AUTH ROUTES ==================== */}
        <Route path="/admin/login" element={<UserLogin />} />

        {/* 🔒 BLOCKED ROUTE - No one can access this */}
        <Route path="/admin/process" element={<BlockedRoute />} />
        <Route path="/admin/register" element={<BlockedRoute />} />

        {/* ==================== ADMIN ROUTES - PROTECTED ==================== */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin", "Supervisor"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin", "Supervisor"]}>
              <AdminPage>
                <Dashboard />
              </AdminPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRoles={["admin", "Supervisor"]}>
              <AdminPage>
                <Orders />
              </AdminPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute allowedRoles={["admin", "Supervisor"]}>
              <AdminPage>
                <AdminProducts />
              </AdminPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/brands"
          element={
            <ProtectedRoute allowedRoles={["admin", "Supervisor"]}>
              <AdminPage>
                <Adminbrands />
              </AdminPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute allowedRoles={["admin", "Supervisor"]}>
              <AdminPage>
                <AdminCategory />
              </AdminPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/branch-products"
          element={
            <ProtectedRoute allowedRoles={["admin", "Supervisor"]}>
              <AdminPage>
                <BranchProductsPage />
              </AdminPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute allowedRoles={["admin", "Supervisor"]}>
              <AdminPage>
                <Customers />
              </AdminPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/showroom"
          element={
            <ProtectedRoute allowedRoles={["admin", "Supervisor"]}>
              <AdminPage>
                <AdminShowroom />
              </AdminPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/banner"
          element={
            <ProtectedRoute allowedRoles={["admin", "Supervisor"]}>
              <AdminPage>
                <AdvertisementPage />
              </AdminPage>
            </ProtectedRoute>
          }
        />

        {/* ==================== AGENT ROUTES - PROTECTED ==================== */}
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

        {/* ==================== FULFILLMENT ROUTES - PROTECTED ==================== */}
        <Route
          path="/fulfillment/*"
          element={
            <ProtectedRoute allowedRoles={["Fulfillment"]}>
              <FulfillmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fulfillment/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Fulfillment"]}>
              <FulfillmentPage>
                <FulfilmentsDashboard />
              </FulfillmentPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fulfillment/orders"
          element={
            <ProtectedRoute allowedRoles={["Fulfillment"]}>
              <FulfillmentPage>
                <FulfilmentsOrder />
              </FulfillmentPage>
            </ProtectedRoute>
          }
        />

        {/* ==================== CONTENT MANAGER ROUTES - PROTECTED ==================== */}
        <Route
          path="/content/*"
          element={
            <ProtectedRoute allowedRoles={["Webcontentmanager"]}>
              <ContentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/content/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Webcontentmanager"]}>
              <ContentPage>
                <ContentDashboard />
              </ContentPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/content/products"
          element={
            <ProtectedRoute allowedRoles={["Webcontentmanager"]}>
              <ContentPage>
                <ContentProduct />
              </ContentPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/content/showroom"
          element={
            <ProtectedRoute allowedRoles={["Webcontentmanager"]}>
              <ContentPage>
                <ContentShowroom />
              </ContentPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/content/brands"
          element={
            <ProtectedRoute allowedRoles={["Webcontentmanager"]}>
              <ContentPage>
                <Contentbrand />
              </ContentPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/content/category"
          element={
            <ProtectedRoute allowedRoles={["Webcontentmanager"]}>
              <ContentPage>
                <ContentCategory />
              </ContentPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/content/branch-products"
          element={
            <ProtectedRoute allowedRoles={["Webcontentmanager"]}>
              <ContentPage>
                <ContentBranchProduct />
              </ContentPage>
            </ProtectedRoute>
          }
        />

        {/* ==================== DEVELOPER ROUTES - PROTECTED ==================== */}
        <Route
          path="/dev/*"
          element={
            <ProtectedRoute allowedRoles={["Developer"]}>
              <DevPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Developer"]}>
              <DevPage>
                <DevDashboard />
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev/brands"
          element={
            <ProtectedRoute allowedRoles={["Developer"]}>
              <DevPage>
                <DevBrands />
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev/categories"
          element={
            <ProtectedRoute allowedRoles={["Developer"]}>
              <DevPage>
                <DevCategory />
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev/products"
          element={
            <ProtectedRoute allowedRoles={["Developer"]}>
              <DevPage>
                <DevProducts />
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev/orders"
          element={
            <ProtectedRoute allowedRoles={["Developer"]}>
              <DevPage>
                <DevOrders />
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev/showroom"
          element={
            <ProtectedRoute allowedRoles={["Developer"]}>
              <DevPage>
                <DevShowroom />
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev/banner"
          element={
            <ProtectedRoute allowedRoles={["Developer"]}>
              <DevPage>
                <DevBanners />
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev/users"
          element={
            <ProtectedRoute allowedRoles={["Developer"]}>
              <DevPage>
                <DevUsers />
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev/customers"
          element={
            <ProtectedRoute allowedRoles={["Developer"]}>
              <DevPage>
                <DevCustomers />
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev/payments"
          element={
            <ProtectedRoute allowedRoles={["Developer"]}>
              <DevPage>
                <Payments />
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev"
          element={
            <ProtectedRoute allowedRoles={["Developer"]}>
              <DevPage />
            </ProtectedRoute>
          }
        />

        {/* ==================== DIGITAL MARKETER ROUTES - PROTECTED ==================== */}
        <Route
          path="/digi/*"
          element={
            <ProtectedRoute allowedRoles={["Social"]}>
              <DigiPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/digi/orders"
          element={
            <ProtectedRoute allowedRoles={["Social"]}>
              <DigiPage>
                <DigiOrders />
              </DigiPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/digi/products"
          element={
            <ProtectedRoute allowedRoles={["Social"]}>
              <DigiPage>
                <DigiProducts />
              </DigiPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/digi"
          element={
            <ProtectedRoute allowedRoles={["Social"]}>
              <DigiPage />
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
