import { useState, useEffect } from 'react'
import {Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Nav from './Component/Nav/Navbar'
import Home from './Pages/Home'
import About from './Pages/About'
import Contact from './Pages/Contact'
import BrandsPage from './Pages/Brands'
import ShowroomProductsPage from './Pages/ShowRooomProducts'
import Phones from './Pages/Phones'
import ProductDescription from './Pages/ProductDescription'
import ProductCard from './Component/ProductCard'
import Cart from './Pages/Cart'
import Laptops from './Pages/Laptops'
import Fridge from './Pages/Fridge'
import Television from './Pages/Television'
import Speakers from './Pages/Speaker'
import Accessories from './Pages/Accessories'
import Appliances from './Pages/Appliances'
import Combo from './Pages/Combo'
import Airconditioners from './Pages/AC'
import Checkout from './Pages/Checkout'
import OrderReceived from './Pages/OrderReceived'
import Locations from './Pages/Locations'
import Cancellation from './Pages/OrderCancelled'
import AdminPage from './Pages/AdminPages/AdminPanel'
import Dashboard from './Pages/AdminPages/Dashboard'
import Orders from './Pages/AdminPages/Orders/Orders'
import AdminProducts from './Pages/AdminPages/Products/AdminProducts'
import Adminbrands from './Pages/AdminPages/Adminbrands'
import AdminCategory from './Pages/AdminPages/AdminCategory'
import AdminShowroom from './Pages/AdminPages/AdminShowroom'
import Users from './Pages/AdminPages/Users'
import Customers from './Pages/AdminPages/Customers'
import AdvertisementPage from './Pages/AdminPages/Advertisement'
import Account from './Pages/Account'
import Products from './Pages/Products'
import Terms from './Pages/Terms'
import OrderHistory from './Pages/OrderHistory'
import Wishlist from './Pages/Wishlist'
import AgentPage from './Pages/Agents/AgentPage/AgentPage'
import AgentDashboard from './Pages/Agents/AgentPage/AgentDashboard'
import AgentOrders from './Pages/Agents/AgentPage/AgentOrders'
import FulfillmentPage from './Pages/Fulfilments/FulfilmentPage/FulfilmentPage'
import FulfilmentsDashboard from './Pages/Fulfilments/FulfilmentPage/FulfilmentsDashboard'
import FulfilmentsOrder from './Pages/Fulfilments/FulfilmentPage/FulfilmentsOrder'
import ContentDashboard from './Pages/ContentManager/ContentManagerPage/ContentDashboard'
import ContentProduct from './Pages/ContentManager/ContentManagerPage/ContentProduct'
import ContentShowroom from './Pages/ContentManager/ContentManagerPage/ContentShowroom'
import Contentbrand from './Pages/ContentManager/ContentManagerPage/Contentbrand'
import ContentCategory from './Pages/ContentManager/ContentManagerPage/ContentCategory'
import ContentBanner from './Pages/ContentManager/ContentManagerPage/ContentBanner'
import ContentPage from './Pages/ContentManager/ContentPage'
import NoInternetPage from './Component/NoInternet'
import UserLogin from './Pages/AdminAuth/UserLogin'
import UserRegistration from './Pages/AdminAuth/UserRegistration'
import DevPage from './Pages/Developer/DevPage'
import DevDashboard from './Pages/Developer/Dev/DevDashboard'
import DevBrands from './Pages/Developer/Dev/DevBrands'
import DevCategory from './Pages/Developer/Dev/DevCategory'
import DevProducts from './Pages/Developer/Dev/DevProducts'
import DevOrders from './Pages/Developer/Dev/DevOrders'
import DevShowroom from './Pages/Developer/Dev/DevShowroom'
import DevBanners from './Pages/Developer/Dev/DevBanners'
import DevUsers from './Pages/Developer/Dev/DevUsers'
import DevCustomers from './Pages/Developer/Dev/DevCustomers'
import Payments from './Pages/Developer/Dev/Payments'
import OrderSuccessPage from './Pages/OrderSucess'
import ScrollToTop from './Pages/ScrollToTop'
import BackToSchool from './Pages/BackToSchool'

// Utility to fetch customer role


const getUserRole = () => {
  try {
    const customer = JSON.parse(localStorage.getItem("customer"));
    const user = JSON.parse(localStorage.getItem("user"));
    if (!customer && !user) return null;

    if (user?.position) return user.position; // Supervisor, Developer, etc.
    return customer?.accountType || null; // customer, agent, admin
  } catch (err) {
    console.error("Error reading user role from localStorage", err);
    return null;
  }
};

const isWebBrowser = () => {
  const ua = navigator.userAgent;
  return !ua.includes("Electron") && /Mozilla|Chrome|Safari|Firefox/i.test(ua);
};

const isElectron = () => navigator.userAgent.includes("Electron");

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const userRole = getUserRole();

  // ✅ Web-only restriction: allow only Developer and agent
  if (isWebBrowser() && userRole && !["Developer", "agent"].includes(userRole)) {
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


const ConditionalNavbar = () => {
  const location = useLocation();
  const pathname = location.pathname;

  const hiddenPaths = [
    "/admin/login",
    "/admin/register",
    
  ];

  const isAdminPath = pathname.startsWith("/admin/");
 
  const isFulfillmentPath = pathname.startsWith("/fulfillment/");
  const isContentPath = pathname.startsWith("/content/");
  const isDevPath = pathname.startsWith("/dev/");

  return !hiddenPaths.includes(pathname) && 
         !isAdminPath && 
       
         !isFulfillmentPath && 
         !isContentPath &&
          !isDevPath && 
         <Nav />;
};

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
    return <div>
<NoInternetPage/>
    </div>; 
  }

  return (
    <>
      <ConditionalNavbar />

   <ScrollToTop/>

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/phones" element={<Phones ProductCard={ProductCard} />} />
        <Route path= "/back-to-school" element= {<BackToSchool/>} />
 
        <Route path="/computers" element={<Laptops ProductCard={ProductCard} />} />
        <Route path="/refrigerator" element={<Fridge ProductCard={ProductCard} />} />
        <Route path="/television" element={<Television ProductCard={ProductCard} />} />
        <Route path="/speakers" element={<Speakers ProductCard={ProductCard} />} />
        <Route path="/accessories" element={<Accessories ProductCard={ProductCard} />} />
        <Route path="/appliances" element={<Appliances ProductCard={ProductCard} />} />
        <Route path="/combo" element={<Combo ProductCard={ProductCard} />} />
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
         <Route path="/admin/login" element={< UserLogin/>} />
          <Route path="/admin/register" element={< UserRegistration/>} />
          

        

        {/* Admin - Protected */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'Supervisor']}>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'Supervisor']}>
              <AdminPage>
                <Dashboard />
              </AdminPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/orders" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'Supervisor']}>
              <AdminPage>
                <Orders />
              </AdminPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/products" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'Supervisor']}>
              <AdminPage>
                <AdminProducts />
              </AdminPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/brands" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'Supervisor']}>
              <AdminPage>
                <Adminbrands />
              </AdminPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/categories" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'Supervisor']}>
              <AdminPage>
                <AdminCategory />
              </AdminPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'Supervisor']}>
              <AdminPage>
                <Users />
              </AdminPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/customers" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'Supervisor']}>
              <AdminPage>
                <Customers />
              </AdminPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/showroom" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'Supervisor']}>
              <AdminPage>
                <AdminShowroom />
              </AdminPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/banner" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'Supervisor']}>
              <AdminPage>
                <AdvertisementPage />
              </AdminPage>
            </ProtectedRoute>
          } 
        />

        {/* Agent Routes - Protected */}
        <Route 
          path="/agent/*" 
          element={
            <ProtectedRoute allowedRoles={['agent']}>
              <AgentPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/agent/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['agent']}>
              <AgentPage>
                <AgentDashboard />
              </AgentPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/agent/orders" 
          element={
            <ProtectedRoute allowedRoles={['agent']}>
              <AgentPage>
                <AgentOrders />
              </AgentPage>
            </ProtectedRoute>
          } 
        />

        {/* Fulfillment Routes - Protected */}
        <Route 
          path="/fulfillment/*" 
          element={
            <ProtectedRoute allowedRoles={['Fulfillment']}>
              <FulfillmentPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/fulfillment/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Fulfillment']}>
              <FulfillmentPage>
                <FulfilmentsDashboard />
              </FulfillmentPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/fulfillment/orders" 
          element={
            <ProtectedRoute allowedRoles={['Fulfillment']}>
              <FulfillmentPage>
                <FulfilmentsOrder />
              </FulfillmentPage>
            </ProtectedRoute>
          } 
        />

        {/* Content Manager Routes - Protected */}
        <Route 
          path="/content/*" 
          element={
            <ProtectedRoute allowedRoles={['Webcontentmanager']}>
              <ContentPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/content/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Webcontentmanager']}>
              <ContentPage>
                <ContentDashboard />
              </ContentPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/content/products" 
          element={
            <ProtectedRoute allowedRoles={['Webcontentmanager']}>
              <ContentPage>
                <ContentProduct />
              </ContentPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/content/showroom" 
          element={
            <ProtectedRoute allowedRoles={['Webcontentmanager']}>
              <ContentPage>
                <ContentShowroom />
              </ContentPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/content/brands" 
          element={
            <ProtectedRoute allowedRoles={['Webcontentmanager']}>
              <ContentPage>
                <Contentbrand />
              </ContentPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/content/category" 
          element={
            <ProtectedRoute allowedRoles={['Webcontentmanager']}>
              <ContentPage>
                <ContentCategory />
              </ContentPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/content/banner" 
          element={
            <ProtectedRoute allowedRoles={['Webcontentmanager']}>
              <ContentPage>
                <ContentBanner />
              </ContentPage>
            </ProtectedRoute>
          } 
        />
        {/* Developer Routes - Protected */}
        <Route 
          path="/dev/*" 
          element={
            <ProtectedRoute allowedRoles={['Developer']}>
              <DevPage />       
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dev/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['Developer']}>
              <DevPage>
                <DevDashboard />
              </DevPage>
            </ProtectedRoute>
          }       
        />
        <Route 
          path="/dev/brands" 
          element={
            <ProtectedRoute allowedRoles={['Developer']}>
              <DevPage>
                <DevBrands />
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/dev/categories" 
          element={
            <ProtectedRoute allowedRoles={['Developer']}>
              <DevPage>
                <DevCategory /> 
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/dev/products" 
          element={ 
            <ProtectedRoute allowedRoles={['Developer']}>
              <DevPage>
                <DevProducts />
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/dev/orders" 
          element={  
            <ProtectedRoute allowedRoles={['Developer']}>
              <DevPage>
                <DevOrders />
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/dev/showroom" 
          element={   
            <ProtectedRoute allowedRoles={['Developer']}>
              <DevPage>
                <DevShowroom />
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/dev/banner" 
          element={   
            <ProtectedRoute allowedRoles={['Developer']}>
              <DevPage>
                <DevBanners />
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/dev/users" 
          element={
            <ProtectedRoute allowedRoles={['Developer']}>
              <DevPage>
                <DevUsers />
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/dev/customers" 
          element={   
            <ProtectedRoute allowedRoles={['Developer']}>
              <DevPage>
                <DevCustomers />
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/dev/payments" 
          element={
            <ProtectedRoute allowedRoles={['Developer']}>
              <DevPage>
                <Payments />
              </DevPage>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/dev" 
          element={
            <ProtectedRoute allowedRoles={['Developer']}>
              <DevPage />
            </ProtectedRoute>
          }
        />


        {/* Default route redirects */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
  
    </>
  )
}

export default App