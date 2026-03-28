import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { refreshUserSession, forceSessionExpire, clearSessionExpiring } from './Redux/Slice/userSlice'
import { triggerForceLogout } from './Redux/Slice/customerSlice'
import { useTokenMigration } from './hooks/useTokenMigration'
import axiosInstance from './Redux/Slice/AxiosInstance'

// ✅ Import AuthModal
import AuthModal from './Component/AuthModal'

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
import DigiPage from './Pages/DigitalMarketer/DigiPage'
import DigiOrders from './Pages/DigitalMarketer/Digi/DigiOrders'
import DigiProducts from './Pages/DigitalMarketer/Digi/DigiProducts'
import ContentBranchProduct from './Pages/ContentManager/ContentManagerPage/ContentBranchProduct'
import BranchProductsPage from './Pages/AdminPages/BranchProductsPage'

// ==================== HELPER: READ FROM STORAGE ====================

const readFromStorage = (key) => {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null || raw === undefined) return null
    if (typeof raw === 'object') return raw
    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return null
      return JSON.parse(trimmed)
    }
    return null
  } catch (error) {
    console.warn(`⚠️ Failed to read "${key}" from storage:`, error)
    return null
  }
}

// ==================== SESSION EXPIRY MODAL COMPONENT ====================

const SessionExpiryModal = () => {
  const dispatch = useDispatch()
  const { sessionExpiring, sessionExpiresAt, currentUser } = useSelector((state) => state.user)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    if (!sessionExpiring || !sessionExpiresAt) return

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((sessionExpiresAt - Date.now()) / 1000))
      setTimeLeft(remaining)

      if (remaining === 0) {
        handleLogout()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionExpiring, sessionExpiresAt])

  const handleKeepLoggedIn = async () => {
    try {
      await dispatch(refreshUserSession()).unwrap()
      dispatch(clearSessionExpiring())
    } catch (error) {
      console.error('Failed to refresh session:', error)
      handleLogout()
    }
  }

  const handleLogout = () => {
    dispatch(forceSessionExpire())
    window.location.href = '/admin/login'
  }

  if (!sessionExpiring || !currentUser) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: 'white', borderRadius: '12px', padding: '32px',
          maxWidth: '450px', width: '90%',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)', textAlign: 'center',
        }}
      >
        <div style={{ width: '64px', height: '64px', margin: '0 auto 20px', backgroundColor: '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>
          Session Expiring Soon
        </h2>
        <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '24px', lineHeight: '1.6' }}>
          Your session will expire in{' '}
          <span style={{ fontWeight: '700', color: timeLeft < 60 ? '#DC2626' : '#F59E0B', fontSize: '20px' }}>
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
          {' '}due to inactivity.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleKeepLoggedIn}
            style={{ flex: '1', minWidth: '140px', padding: '12px 24px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
          >
            Keep Me Logged In
          </button>
          <button
            onClick={handleLogout}
            style={{ flex: '1', minWidth: '140px', padding: '12px 24px', backgroundColor: 'transparent', color: '#6B7280', border: '2px solid #D1D5DB', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
        <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '20px' }}>
          Click "Keep Me Logged In" to continue working or "Logout" to end your session.
        </p>
      </div>
    </div>
  )
}

// ==================== UTILITY FUNCTIONS ====================

const getUserRole = () => {
  try {
    const customer = readFromStorage('customer')
    const user = readFromStorage('user')
    
    if (!customer && !user) return null
    if (user?.position) return user.position
    return customer?.accountType || null
  } catch (err) {
    console.error('❌ getUserRole error:', err)
    return null
  }
}

const isWebBrowser = () => {
  const ua = navigator.userAgent
  return !ua.includes('Electron') && /Mozilla|Chrome|Safari|Firefox/i.test(ua)
}

const isElectron = () => navigator.userAgent.includes('Electron')

// ==================== PROTECTED ROUTE COMPONENT ====================

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const userRole = getUserRole()

  if (isWebBrowser() && userRole && !['Developer', 'agent', 'Fulfillment'].includes(userRole)) {
    return <Navigate to="/" replace />
  }

  if (isElectron()) {
    return children
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />
  }

  return children
}

// ==================== BLOCKED ROUTE COMPONENT ====================

const BlockedRoute = () => <Navigate to="/" replace />

// ==================== CONDITIONAL NAVBAR ====================

const ConditionalNavbar = () => {
  const location = useLocation()
  const pathname = location.pathname

  const hiddenPaths = ['/admin/login', '/admin/register', '/admin/process']

  const isAdminPath = pathname.startsWith('/admin/')
  const isFulfillmentPath = pathname.startsWith('/fulfillment/')
  const isContentPath = pathname.startsWith('/content/')
  const isDevPath = pathname.startsWith('/dev/')
  const isDigiPath = pathname.startsWith('/digi/')

  return !hiddenPaths.includes(pathname) &&
    !isAdminPath && !isFulfillmentPath && !isContentPath &&
    !isDevPath && !isDigiPath && <Nav />
}

// ==================== AUTH MODAL CONTROLLER HOOK ====================

const useAuthModalController = () => {
  const { currentCustomer, isAuthenticated, forceLogout } = useSelector(
    (state) => state.customer
  )
  const location = useLocation()
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // ✅ Paths where AuthModal should NEVER appear
  const excludedPaths = [
    '/admin',
    '/agent',
    '/fulfillment',
    '/content',
    '/dev',
    '/digi',
  ]

  const isExcludedPath = excludedPaths.some((path) =>
    location.pathname.startsWith(path)
  )

  useEffect(() => {
    // Never show on staff/admin paths
    if (isExcludedPath) {
      setAuthModalOpen(false)
      return
    }

    // ✅ Show modal if:
    // 1. Customer has NO bearer token
    // 2. forceLogout flag is set (from token errors)
    const hasNoToken =
      !currentCustomer?.accessToken ||
      currentCustomer?.accessToken?.trim() === ''

    const shouldShowModal = hasNoToken || forceLogout

    setAuthModalOpen(shouldShowModal)
  }, [currentCustomer, isAuthenticated, forceLogout, isExcludedPath, location.pathname])

  return { authModalOpen, setAuthModalOpen }
}

// ==================== GLOBAL 401 INTERCEPTOR ====================

const useGlobal401Handler = () => {
  const dispatch = useDispatch()
  const location = useLocation()

  useEffect(() => {
    // ✅ Setup response interceptor to catch 401s for customers
    const interceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const endpoint = error.config?.params?.endpoint || error.config?.url || ''
          const isCustomerEndpoint = endpoint.toLowerCase().includes('customer')

          // Only auto-logout customers on 401 (users have their own session management)
          if (isCustomerEndpoint) {
            const currentPath = location.pathname
            const isStaffPath = ['/admin', '/dev', '/fulfillment', '/content', '/agent', '/digi'].some(
              (p) => currentPath.startsWith(p)
            )

            // Don't logout on staff paths
            if (!isStaffPath) {
              console.warn('🔒 401 Unauthorized — triggering customer force logout')
              dispatch(triggerForceLogout())
            }
          }
        }

        return Promise.reject(error)
      }
    )

    // ✅ Cleanup on unmount
    return () => {
      axiosInstance.interceptors.response.eject(interceptor)
    }
  }, [dispatch, location.pathname])
}

// ==================== APP CONTENT COMPONENT ====================

function AppContent() {
  const { currentCustomer } = useSelector((state) => state.customer)
  const { authModalOpen, setAuthModalOpen } = useAuthModalController()

  // ✅ Setup global 401 handler
  useGlobal401Handler()

  return (
    <>
      {/* Session expiry for admin/staff users */}
      <SessionExpiryModal />

      {/* ✅ Auth modal — appears when customer has no bearer token or after 401 errors */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
        currentCustomer={currentCustomer}
      />

      <ConditionalNavbar />
      <ScrollToTop />

      <Routes>
        {/* ==================== PUBLIC ROUTES ==================== */}
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

        {/* ==================== AUTH ROUTES ==================== */}
        <Route path="/admin/login" element={<UserLogin />} />
        <Route path="/admin/process" element={<BlockedRoute />} />
        <Route path="/admin/register" element={<BlockedRoute />} />

        {/* ==================== ADMIN ROUTES ==================== */}
        <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin', 'Supervisor']}><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'Supervisor']}><AdminPage><Dashboard /></AdminPage></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin', 'Supervisor']}><AdminPage><Orders /></AdminPage></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['admin', 'Supervisor']}><AdminPage><AdminProducts /></AdminPage></ProtectedRoute>} />
        <Route path="/admin/brands" element={<ProtectedRoute allowedRoles={['admin', 'Supervisor']}><AdminPage><Adminbrands /></AdminPage></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['admin', 'Supervisor']}><AdminPage><AdminCategory /></AdminPage></ProtectedRoute>} />
        <Route path="/admin/branch-products" element={<ProtectedRoute allowedRoles={['admin', 'Supervisor']}><AdminPage><BranchProductsPage /></AdminPage></ProtectedRoute>} />
        <Route path="/admin/customers" element={<ProtectedRoute allowedRoles={['admin', 'Supervisor']}><AdminPage><Customers /></AdminPage></ProtectedRoute>} />
        <Route path="/admin/showroom" element={<ProtectedRoute allowedRoles={['admin', 'Supervisor']}><AdminPage><AdminShowroom /></AdminPage></ProtectedRoute>} />
        <Route path="/admin/banner" element={<ProtectedRoute allowedRoles={['admin', 'Supervisor']}><AdminPage><AdvertisementPage /></AdminPage></ProtectedRoute>} />

        {/* ==================== AGENT ROUTES ==================== */}
        <Route path="/agent/*" element={<ProtectedRoute allowedRoles={['agent']}><AgentPage /></ProtectedRoute>} />
        <Route path="/agent/dashboard" element={<ProtectedRoute allowedRoles={['agent']}><AgentPage><AgentDashboard /></AgentPage></ProtectedRoute>} />
        <Route path="/agent/orders" element={<ProtectedRoute allowedRoles={['agent']}><AgentPage><AgentOrders /></AgentPage></ProtectedRoute>} />

        {/* ==================== FULFILLMENT ROUTES ==================== */}
        <Route path="/fulfillment/*" element={<ProtectedRoute allowedRoles={['Fulfillment']}><FulfillmentPage /></ProtectedRoute>} />
        <Route path="/fulfillment/dashboard" element={<ProtectedRoute allowedRoles={['Fulfillment']}><FulfillmentPage><FulfilmentsDashboard /></FulfillmentPage></ProtectedRoute>} />
        <Route path="/fulfillment/orders" element={<ProtectedRoute allowedRoles={['Fulfillment']}><FulfillmentPage><FulfilmentsOrder /></FulfillmentPage></ProtectedRoute>} />

        {/* ==================== CONTENT MANAGER ROUTES ==================== */}
        <Route path="/content/*" element={<ProtectedRoute allowedRoles={['Webcontentmanager']}><ContentPage /></ProtectedRoute>} />
        <Route path="/content/dashboard" element={<ProtectedRoute allowedRoles={['Webcontentmanager']}><ContentPage><ContentDashboard /></ContentPage></ProtectedRoute>} />
        <Route path="/content/products" element={<ProtectedRoute allowedRoles={['Webcontentmanager']}><ContentPage><ContentProduct /></ContentPage></ProtectedRoute>} />
        <Route path="/content/showroom" element={<ProtectedRoute allowedRoles={['Webcontentmanager']}><ContentPage><ContentShowroom /></ContentPage></ProtectedRoute>} />
        <Route path="/content/brands" element={<ProtectedRoute allowedRoles={['Webcontentmanager']}><ContentPage><Contentbrand /></ContentPage></ProtectedRoute>} />
        <Route path="/content/category" element={<ProtectedRoute allowedRoles={['Webcontentmanager']}><ContentPage><ContentCategory /></ContentPage></ProtectedRoute>} />
        <Route path="/content/branch-products" element={<ProtectedRoute allowedRoles={['Webcontentmanager']}><ContentPage><ContentBranchProduct /></ContentPage></ProtectedRoute>} />

        {/* ==================== DEVELOPER ROUTES ==================== */}
        <Route path="/dev/*" element={<ProtectedRoute allowedRoles={['Developer']}><DevPage /></ProtectedRoute>} />
        <Route path="/dev/dashboard" element={<ProtectedRoute allowedRoles={['Developer']}><DevPage><DevDashboard /></DevPage></ProtectedRoute>} />
        <Route path="/dev/brands" element={<ProtectedRoute allowedRoles={['Developer']}><DevPage><DevBrands /></DevPage></ProtectedRoute>} />
        <Route path="/dev/categories" element={<ProtectedRoute allowedRoles={['Developer']}><DevPage><DevCategory /></DevPage></ProtectedRoute>} />
        <Route path="/dev/products" element={<ProtectedRoute allowedRoles={['Developer']}><DevPage><DevProducts /></DevPage></ProtectedRoute>} />
        <Route path="/dev/orders" element={<ProtectedRoute allowedRoles={['Developer']}><DevPage><DevOrders /></DevPage></ProtectedRoute>} />
        <Route path="/dev/showroom" element={<ProtectedRoute allowedRoles={['Developer']}><DevPage><DevShowroom /></DevPage></ProtectedRoute>} />
        <Route path="/dev/banner" element={<ProtectedRoute allowedRoles={['Developer']}><DevPage><DevBanners /></DevPage></ProtectedRoute>} />
        <Route path="/dev/users" element={<ProtectedRoute allowedRoles={['Developer']}><DevPage><DevUsers /></DevPage></ProtectedRoute>} />
        <Route path="/dev/customers" element={<ProtectedRoute allowedRoles={['Developer']}><DevPage><DevCustomers /></DevPage></ProtectedRoute>} />
        <Route path="/dev/payments" element={<ProtectedRoute allowedRoles={['Developer']}><DevPage><Payments /></DevPage></ProtectedRoute>} />
        <Route path="/dev" element={<ProtectedRoute allowedRoles={['Developer']}><DevPage /></ProtectedRoute>} />

        {/* ==================== DIGITAL MARKETER ROUTES ==================== */}
        <Route path="/digi/*" element={<ProtectedRoute allowedRoles={['Social']}><DigiPage /></ProtectedRoute>} />
        <Route path="/digi/orders" element={<ProtectedRoute allowedRoles={['Social']}><DigiPage><DigiOrders /></DigiPage></ProtectedRoute>} />
        <Route path="/digi/products" element={<ProtectedRoute allowedRoles={['Social']}><DigiPage><DigiProducts /></DigiPage></ProtectedRoute>} />
        <Route path="/digi" element={<ProtectedRoute allowedRoles={['Social']}><DigiPage /></ProtectedRoute>} />

        {/* ==================== DEFAULT REDIRECT ==================== */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

// ==================== MAIN APP COMPONENT ====================

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // ✅ RUN TOKEN MIGRATION ON APP STARTUP
  useTokenMigration()

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOnline) {
    return <div><NoInternetPage /></div>
  }

  return <AppContent />
}

export default App