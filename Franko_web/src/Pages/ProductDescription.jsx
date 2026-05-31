import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { Image } from "antd";
import { fetchProductById, fetchProducts } from "../Redux/Slice/productSlice";
import { updateCartItem, deleteCartItem, getCartById, addToCart } from '../Redux/Slice/cartSlice';
import ProductDetailSkeleton from "../Component/ProductDetailSkeleton";
import { Tooltip, Drawer } from "@material-tailwind/react";
import {
  ShoppingCartIcon,
  CheckCircleIcon,
  HeartIcon as SolidHeartIcon,
  EyeIcon,
  TruckIcon,
  ShieldCheckIcon,
  PhoneIcon,
  CreditCardIcon,
  ShareIcon,
  TrashIcon,
  MinusIcon,
  PlusIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import AuthModal from "../Component/AuthModal";
import { Helmet } from "react-helmet";
import { Divider } from "antd";

// ==================== UTILITY FUNCTIONS ====================

const formatPrice = (price) => {
  if (!price || isNaN(price)) return "0.00";
  return Number(price).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getItemLineTotal = (item) => {
  const price = parseFloat(item.price) || 0;
  const quantity = parseInt(item.quantity, 10) || 1;
  return price * quantity;
};

const normalizeCartItem = (item) => {
  const price = parseFloat(item.price || item.Price || 0);
  const quantity = parseInt(item.quantity || item.Quantity || 1, 10);
  return {
    productId: item.productId || item.ProductId,
    productName: item.productName || item.ProductName,
    imagePath: item.imagePath || item.ImagePath,
    price,
    quantity,
    total: price * quantity,
    cartId: item.cartId || item.CartId,
    customerId: item.customerId || item.CustomerId || null,
  };
};

// ==================== SAFE LOCALSTORAGE ====================

const safeLocalStorage = {
  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      if (item === null || item === undefined) return defaultValue;
      if (typeof item === 'object') return item;
      if (typeof item === 'string') {
        try { return JSON.parse(item); } catch { return item; }
      }
      return defaultValue;
    } catch {
      return defaultValue;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

// ==================== MAIN COMPONENT ====================

const ProductDescription = () => {
  const { productID } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showStickyCart, setShowStickyCart] = useState(false);
  const [cartSidebarOpen, setCartSidebarOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [updatingQuantity, setUpdatingQuantity] = useState({});
  const [removingItem, setRemovingItem] = useState({});
  const [flixMediaLoaded, setFlixMediaLoaded] = useState(false);
  const [flixMediaError, setFlixMediaError] = useState(false);
  const [cartSyncError, setCartSyncError] = useState(null);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [viewedProducts, setViewedProducts] = useState([]);
  const [localCart, setLocalCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);

  const productDetailsRef = useRef(null);
  const flixMediaSectionRef = useRef(null);

  const { currentProduct, products, loading } = useSelector((state) => state.products);
  const { cart, cartId } = useSelector((state) => state.cart);

  // ==================== NETWORK STATUS ====================

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(true);
      setCartSyncError(null);
      if (cartId) syncCartWithDatabase();
    };
    const handleOffline = () => {
      setNetworkStatus(false);
      setCartSyncError("You're offline. Changes will sync when connection is restored.");
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [cartId]);

  // ==================== SAMSUNG / FLIX MEDIA ====================

  const isValidSamsungProduct = () => {
    if (!currentProduct?.length) return false;
    const product = currentProduct[0];
    return (
      product.productId3 &&
      typeof product.productId3 === 'string' &&
      product.productId3.trim().toUpperCase().startsWith('SM')
    );
  };

  const showFlixMedia = isValidSamsungProduct();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ==================== CART SYNC ====================

  const syncCartWithDatabase = async () => {
    if (!cartId || !networkStatus) return;
    try {
      const result = await dispatch(getCartById(cartId)).unwrap();
      if (result && Array.isArray(result)) {
        const normalizedCart = result.map(normalizeCartItem);
        safeLocalStorage.setItem("cart", normalizedCart);
        setLocalCart(normalizedCart);
        setCartSyncError(null);
      }
    } catch {
      setCartSyncError("Failed to sync cart. Changes saved locally.");
    }
  };

  useEffect(() => {
    const storedCartId = cartId || safeLocalStorage.getItem('cartId');
    if (storedCartId && typeof storedCartId === 'string') {
      syncCartWithDatabase();
    }
  }, [cartId]);

  useEffect(() => {
    if (Array.isArray(cart) && cart.length >= 0) {
      const normalizedCart = cart.map(normalizeCartItem);
      safeLocalStorage.setItem('cart', normalizedCart);
      setLocalCart(normalizedCart);
    }
  }, [cart]);

  // ==================== PRODUCT DATA ====================

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchProductById(productID));
  }, [dispatch, productID]);

  useEffect(() => {
    if (currentProduct?.length > 0) {
      const prod = currentProduct[0];
      const image = `https://testing.frankotrading.com/Media/Products_Images/${prod.productImage.split("\\").pop()}`;

      const viewedItem = {
        id: prod.productID,
        name: prod.productName,
        price: prod.price,
        oldPrice: prod.oldPrice || 0,
        image,
        brandName: prod.brandName,
        categoryName: prod.categoryName,
        showRoomName: prod.showRoomName,
        stockStatus: prod.stockStatus,
        quantity: prod.quantity,
        viewedAt: new Date().toISOString()
      };

      const parsed = safeLocalStorage.getItem("viewedProducts", []);
      const existingProducts = Array.isArray(parsed) ? parsed : [];
      const filtered = existingProducts.filter((item) => item?.id !== viewedItem.id);
      const updated = [viewedItem, ...filtered].slice(0, 4);
      safeLocalStorage.setItem("viewedProducts", updated);
      setViewedProducts(updated);
    }
  }, [currentProduct]);

  useEffect(() => {
    const stored = safeLocalStorage.getItem("viewedProducts", []);
    const validProducts = Array.isArray(stored) ? stored : [];
    setViewedProducts(validProducts.slice(0, 4));
  }, []);

  // ==================== FLIX MEDIA INTEGRATION ====================

  useEffect(() => {
    if (!showFlixMedia || !currentProduct?.length) return;

    const product = currentProduct[0];
    const mpn = product.productId3?.trim().toUpperCase();

    if (!mpn || !mpn.startsWith('SM')) {
      setFlixMediaError(true);
      setFlixMediaLoaded(true);
      return;
    }

    setFlixMediaLoaded(false);
    setFlixMediaError(false);

    const distributorId = "17909";
    const language = "gh";
    const productMpn = product.productId3 || "";
    const productEan = product.productId2 || "";
    const productBrand = "Samsung";

    const cleanupFlixMedia = () => {
      document.querySelectorAll('script[src*="flixfacts.com"]').forEach(s => s.remove());
      document.querySelectorAll('link[href*="flixfacts.com"], style[data-flix]').forEach(s => s.remove());
      document.querySelectorAll('#flix-inpage, #flix-minisite, .flix-inpage, .flix-minisite').forEach(s => s.remove());
      if (window.flixJsCallbacks) delete window.flixJsCallbacks;
      if (window.flixJs) delete window.flixJs;
    };

    cleanupFlixMedia();

    const initFlixMedia = () => {
      const flixSection = flixMediaSectionRef.current;
      if (!flixSection) return;

      flixSection.innerHTML = '';

      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'flex items-center justify-center py-12';
      loadingDiv.innerHTML = `
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mb-4"></div>
          <div class="text-gray-600" style="font-family: var(--pd-font)">Loading more product details</div>
        </div>
      `;
      flixSection.appendChild(loadingDiv);

      const container = document.createElement('div');
      container.id = 'flix-media-isolated-container';
      container.className = 'flix-media-isolated w-full overflow-hidden';
      container.style.cssText = 'position: relative; width: 100%; min-height: 400px; border: none; overflow: hidden;';

      const iframe = document.createElement('iframe');
      iframe.id = 'flix-media-iframe';
      iframe.style.cssText = 'width: 100%; height: 800px; border: none; overflow: hidden;';
      iframe.onload = () => { setFlixMediaLoaded(true); loadingDiv.remove(); };
      iframe.onerror = () => { setFlixMediaError(true); setFlixMediaLoaded(true); loadingDiv.remove(); };

      iframe.srcdoc = `
        <!DOCTYPE html>
        <html>
          <head>
            <base target="_parent">
            <style>
              body { margin: 0; padding: 0; font-family: 'Source Sans 3', Arial, sans-serif; }
              #flix-container { width: 100%; max-width: 100%; overflow: hidden; }
              .flix-inpage, .flix-minisite { width: 100% !important; max-width: 100% !important; }
              iframe { max-width: 100% !important; }
            </style>
          </head>
          <body>
            <div id="flix-container">
              <div id="flix-inpage"></div>
              <div id="flix-minisite"></div>
            </div>
            <script>
              (function() {
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.async = true;
                script.setAttribute('data-flix-distributor', '${distributorId}');
                script.setAttribute('data-flix-language', '${language}');
                script.setAttribute('data-flix-mpn', '${productMpn}');
                script.setAttribute('data-flix-ean', '${productEan}');
                script.setAttribute('data-flix-brand', '${productBrand}');
                script.setAttribute('data-flix-inpage', 'flix-inpage');
                script.setAttribute('data-flix-button', 'flix-minisite');
                script.src = 'https://media.flixfacts.com/js/loader.js';
                script.onload = function() { window.parent.postMessage({ type: 'FLIX_MEDIA_LOADED' }, '*'); };
                script.onerror = function() { window.parent.postMessage({ type: 'FLIX_MEDIA_ERROR' }, '*'); };
                document.head.appendChild(script);
              })();
            </script>
          </body>
        </html>
      `;

      container.appendChild(iframe);
      flixSection.appendChild(container);

      const messageHandler = (event) => {
        if (event.data.type === 'FLIX_MEDIA_LOADED') setFlixMediaLoaded(true);
        else if (event.data.type === 'FLIX_MEDIA_ERROR') { setFlixMediaError(true); setFlixMediaLoaded(true); }
      };
      window.addEventListener('message', messageHandler);

      return () => {
        window.removeEventListener('message', messageHandler);
        cleanupFlixMedia();
      };
    };

    const style = document.createElement('style');
    style.id = 'flix-media-containment';
    style.textContent = `
      #flix-media-section { isolation: isolate; contain: layout style paint; position: relative; z-index: 1; }
      #flix-media-section * { box-sizing: border-box; max-width: 100%; }
      .flix-media-isolated { position: relative !important; overflow: hidden !important; z-index: 1; }
      #flix-media-iframe { position: relative !important; z-index: 1; }
    `;
    document.head.appendChild(style);

    const cleanup = initFlixMedia();

    return () => {
      cleanup?.();
      document.getElementById('flix-media-containment')?.remove();
      cleanupFlixMedia();
    };
  }, [currentProduct, showFlixMedia]);

  // ==================== STICKY CART ====================

  useEffect(() => {
    const handleScroll = () => {
      if (productDetailsRef.current) {
        setShowStickyCart(productDetailsRef.current.getBoundingClientRect().bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ==================== STOCK CHECK ====================

  const isOutOfStock = (product) => {
    if (!product) return false;
    const indicators = ["All brands", "Products out of stock", "out of stock", "unavailable", "not available"];
    const matchesAny = (field) =>
      field && indicators.some(i => field.toLowerCase().includes(i.toLowerCase()));

    return (
      matchesAny(product.brandName) ||
      matchesAny(product.categoryName) ||
      matchesAny(product.showRoomName) ||
      product.stockStatus?.toLowerCase() === 'out of stock' ||
      (product.quantity !== undefined && product.quantity <= 0)
    );
  };

  // ==================== CART ACTIONS ====================

  const handleAddToCartAndOpenSidebar = async (product) => {
    if (isOutOfStock(product)) return;

    if (!networkStatus) {
      setCartSyncError("No internet connection. Please check your network.");
      return;
    }

    setIsAddingToCart(true);
    setCartSyncError(null);

    try {
      const customer = safeLocalStorage.getItem('customer', null);
      const customerId = customer?.customerAccountNumber || null;

      let storedCartId = cartId || safeLocalStorage.getItem('cartId');
      if (!storedCartId || typeof storedCartId !== 'string') {
        storedCartId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        safeLocalStorage.setItem('cartId', storedCartId);
      }

      const productId = product.productID || product.productId || product.id;
      if (!productId) throw new Error('Product ID is missing');

      const cartItemPayload = {
        CartId: storedCartId,
        ProductId: String(productId),
        ProductName: product.productName || product.name,
        ImagePath: product.productImage || product.imagePath,
        Price: parseFloat(product.price),
        Quantity: 1,
        CustomerId: customerId,
      };

      await dispatch(addToCart(cartItemPayload)).unwrap();

      setCartSidebarOpen(true);
      setCartLoading(true);

      if (storedCartId) {
        try {
          const updatedCart = await dispatch(getCartById(storedCartId)).unwrap();
          if (updatedCart && Array.isArray(updatedCart)) {
            const normalizedCart = updatedCart.map(normalizeCartItem);
            safeLocalStorage.setItem('cart', normalizedCart);
            setLocalCart(normalizedCart);
          }
          setCartSyncError(null);
        } catch {
          // Silent fail
        } finally {
          setCartLoading(false);
        }
      } else {
        setCartLoading(false);
      }
    } catch (error) {
      if (!navigator.onLine) {
        setCartSyncError('No internet connection. Please check your network.');
      } else {
        setCartSyncError(error.message ? `Failed to add to cart: ${error.message}` : 'Failed to add product to cart. Please try again.');
      }
      setCartLoading(false);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    const activeCartId = cartId || safeLocalStorage.getItem('cartId');
    if (!activeCartId) {
      setCartSyncError("Cart ID not found. Please refresh the page.");
      return;
    }

    const previousLocalCart = [...localCart];
    setUpdatingQuantity(prev => ({ ...prev, [productId]: true }));
    setCartSyncError(null);

    try {
      const optimisticCart = localCart.map(item =>
        item.productId === productId
          ? { ...item, quantity: newQuantity, total: parseFloat(item.price) * newQuantity }
          : item
      );
      safeLocalStorage.setItem('cart', optimisticCart);
      setLocalCart(optimisticCart);

      await dispatch(updateCartItem({
        CartId: activeCartId,
        ProductId: String(productId),
        Quantity: newQuantity,
      })).unwrap();

      setCartLoading(true);
      const updatedCart = await dispatch(getCartById(activeCartId)).unwrap();
      if (updatedCart && Array.isArray(updatedCart)) {
        const normalizedCart = updatedCart.map(normalizeCartItem);
        safeLocalStorage.setItem('cart', normalizedCart);
        setLocalCart(normalizedCart);
        setCartSyncError(null);
      }
    } catch (error) {
      safeLocalStorage.setItem('cart', previousLocalCart);
      setLocalCart(previousLocalCart);
      setCartSyncError(`Failed to update quantity: ${error?.message || 'Unknown error'}`);

      try {
        await dispatch(getCartById(activeCartId)).unwrap();
      } catch { /* silent */ }
    } finally {
      setUpdatingQuantity(prev => ({ ...prev, [productId]: false }));
      setCartLoading(false);
    }
  };

  const handleRemoveItem = async (productId) => {
    const activeCartId = cartId || safeLocalStorage.getItem('cartId');
    if (!activeCartId) {
      setCartSyncError("Cart ID not found. Please refresh the page.");
      return;
    }

    const previousLocalCart = [...localCart];
    setRemovingItem(prev => ({ ...prev, [productId]: true }));
    setCartSyncError(null);

    try {
      const optimisticCart = localCart.filter(item => item.productId !== productId);
      safeLocalStorage.setItem('cart', optimisticCart);
      setLocalCart(optimisticCart);

      await dispatch(deleteCartItem({
        CartId: activeCartId,
        ProductId: String(productId),
      })).unwrap();

      setCartLoading(true);
      const updatedCart = await dispatch(getCartById(activeCartId)).unwrap();
      if (updatedCart && Array.isArray(updatedCart)) {
        const normalizedCart = updatedCart.map(normalizeCartItem);
        safeLocalStorage.setItem('cart', normalizedCart);
        setLocalCart(normalizedCart);
        setCartSyncError(null);
      }
    } catch (error) {
      safeLocalStorage.setItem('cart', previousLocalCart);
      setLocalCart(previousLocalCart);
      setCartSyncError(`Failed to remove item: ${error?.message || 'Unknown error'}`);
    } finally {
      setRemovingItem(prev => ({ ...prev, [productId]: false }));
      setCartLoading(false);
    }
  };

  const handleCheckout = () => {
    const storedCustomer = safeLocalStorage.getItem("customer");

    if (!storedCustomer) {
      setPendingCheckout(true);
      setCartSidebarOpen(false);
      setTimeout(() => setAuthModalOpen(true), 300);
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "proceed_to_checkout",
      cartValue: cartTotal.toFixed(2),
      cartItems: localCart.map(item => ({
        productId: item.productId,
        name: item.productName,
        price: item.price,
        quantity: item.quantity,
      })),
    });

    safeLocalStorage.setItem("selectedCart", localCart);
    navigate("/checkout");
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const shareUrl =
      platform === "facebook"
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank");
  };

  const getValidImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/150";
    const base = "https://testing.frankotrading.com/Media/Products_Images/";
    if (imagePath.includes("\\")) return base + imagePath.split("\\").pop();
    if (imagePath.includes("/")) return base + imagePath.split("/").pop();
    return base + imagePath;
  };

  const renderImage = (imagePath) => {
    const imageUrl = getValidImageUrl(imagePath);
    return (
      <img
        src={imageUrl}
        alt="Product"
        className="w-full h-full object-cover rounded"
        onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
      />
    );
  };

  // ==================== TOTALS ====================

  const cartTotal = Array.isArray(localCart)
    ? localCart.reduce((acc, item) => acc + getItemLineTotal(item), 0)
    : 0;

  const totalCartItems = Array.isArray(localCart)
    ? localCart.reduce((acc, item) => acc + (parseInt(item.quantity, 10) || 0), 0)
    : 0;

  const handleAuthModalClose = () => {
    setAuthModalOpen(false);
    setPendingCheckout(false);
  };

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    if (localCart && localCart.length > 0) {
      safeLocalStorage.setItem("selectedCart", localCart);
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "authenticated_checkout",
      cartValue: cartTotal.toFixed(2),
      cartItems: localCart.map(item => ({
        productId: item.productId,
        name: item.productName,
        price: item.price,
        quantity: item.quantity,
      })),
    });
    setTimeout(() => navigate("/checkout"), 100);
  };

  const handleContinueShopping = () => setCartSidebarOpen(false);

  // ==================== LOADING STATE ====================

  if (loading || !currentProduct?.length) {
    return <ProductDetailSkeleton />;
  }

  const product = currentProduct[0];
  const outOfStock = isOutOfStock(product);
  const imageUrl = `https://testing.frankotrading.com/Media/Products_Images/${product.productImage.split("\\").pop()}`;
  const descriptionLines = product.description.split("\n").map((line, i) => (
    <p key={i} className="pd-description-line">{line}</p>
  ));
  const productUrl = window.location.href;
  const related = products.slice(-12);

  // ==================== RENDER ====================

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700;800;900&display=swap');

        :root {
          --pd-font: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          --pd-green: #14532d;
          --pd-green-mid: #166534;
          --pd-green-light: #dcfce7;
          --pd-green-lighter: #f0fdf4;
          --pd-green-accent: #22c55e;
          --pd-dark: #1a1a1a;
          --pd-mid: #555;
          --pd-light: #888;
          --pd-border: #e0e0e0;
          --pd-bg-subtle: #f7f7f7;
          --pd-red: #dc2626;
          --pd-pink: #e11d48;
          --pd-radius: 4px;
        }

        .pd-root, .pd-root * {
          font-family: var(--pd-font);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          box-sizing: border-box;
        }

        /* ==================== HEADER STYLES ==================== */

        .pd-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .pd-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .pd-title-accent {
          width: 4px;
          height: 22px;
          border-radius: 2px;
          background: var(--pd-green);
          flex-shrink: 0;
        }

        @media (min-width: 768px) {
          .pd-title-accent { height: 26px; }
        }

        .pd-section-title {
          font-size: 17px;
          font-weight: 800;
          color: var(--pd-dark);
          letter-spacing: -0.02em;
          line-height: 1;
          white-space: nowrap;
          margin: 0;
        }

        @media (min-width: 768px) {
          .pd-section-title { font-size: 20px; }
        }

        .pd-header-line {
          flex: 1;
          height: 1px;
          background: var(--pd-border);
          min-width: 20px;
        }

        /* ==================== PRODUCT TITLE ==================== */

        .pd-product-title {
          font-size: 20px;
          font-weight: 800;
          color: var(--pd-dark);
          letter-spacing: -0.02em;
          line-height: 1.3;
          margin-bottom: 16px;
        }

        @media (min-width: 768px) {
          .pd-product-title { font-size: 24px; }
        }

        /* ==================== PRICE ==================== */

        .pd-price-container {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--pd-green-lighter);
          border: 1px solid var(--pd-green-light);
          border-radius: var(--pd-radius);
          padding: 12px 16px;
          margin-bottom: 16px;
        }

        .pd-price {
          font-size: 22px;
          font-weight: 900;
          color: var(--pd-red);
        }

        @media (min-width: 768px) {
          .pd-price { font-size: 26px; }
        }

        .pd-old-price {
          font-size: 14px;
          font-weight: 400;
          color: var(--pd-light);
          text-decoration: line-through;
        }

        /* ==================== BADGES ==================== */

        .pd-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .pd-badge-tag {
          background: linear-gradient(135deg, var(--pd-green) 0%, var(--pd-green-mid) 100%);
          color: #fff;
        }

        .pd-badge-color {
          background: var(--pd-bg-subtle);
          color: var(--pd-mid);
          border: 1px solid var(--pd-border);
          text-transform: none;
          font-weight: 500;
        }

        /* ==================== STOCK STATUS ==================== */

        .pd-stock {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: var(--pd-radius);
          font-size: 13px;
          font-weight: 600;
          border: 1px solid;
        }

        .pd-stock-in {
          background: var(--pd-green-lighter);
          color: var(--pd-green);
          border-color: var(--pd-green-light);
        }

        .pd-stock-out {
          background: #fef2f2;
          color: var(--pd-red);
          border-color: #fecaca;
        }

        /* ==================== DESCRIPTION ==================== */

        .pd-description-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .pd-description-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--pd-dark);
        }

        @media (min-width: 768px) {
          .pd-description-title { font-size: 16px; }
        }

        .pd-description-box {
          background: #fff;
          border: 1px solid var(--pd-border);
          border-radius: var(--pd-radius);
          padding: 16px;
          max-height: 280px;
          overflow-y: auto;
        }

        .pd-description-line {
          font-size: 14px;
          color: var(--pd-mid);
          line-height: 1.6;
          margin-bottom: 8px;
        }

        .pd-description-line:last-child {
          margin-bottom: 0;
        }

        /* ==================== BUTTONS ==================== */

        .pd-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 24px;
          border-radius: var(--pd-radius);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
          width: 100%;
        }

        .pd-btn-primary {
          background: var(--pd-green);
          color: #fff;
          border-color: var(--pd-green);
        }

        .pd-btn-primary:hover:not(:disabled) {
          background: var(--pd-green-mid);
          border-color: var(--pd-green-mid);
          box-shadow: 0 4px 16px rgba(20, 83, 45, 0.2);
        }

        .pd-btn-primary:disabled {
          background: var(--pd-border);
          border-color: var(--pd-border);
          color: var(--pd-light);
          cursor: not-allowed;
        }

        /* ==================== SHARE BUTTON ==================== */

        .pd-share-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--pd-green-light);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .pd-share-btn:hover {
          background: var(--pd-green);
          transform: scale(1.1);
        }

        .pd-share-btn:hover svg {
          color: #fff !important;
        }

        /* ==================== CARDS ==================== */

        .pd-card {
          border: 1px solid var(--pd-border);
          border-radius: var(--pd-radius);
          overflow: hidden;
          background: #fff;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .pd-card:hover {
          border-color: var(--pd-green-accent);
          box-shadow: 0 4px 16px rgba(20, 83, 45, 0.08);
        }

        .pd-card-img {
          position: relative;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          overflow: hidden;
        }

        @media (min-width: 768px) {
          .pd-card-img { height: 195px; }
        }

        .pd-card-img img {
          height: 100%;
          width: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
        }

        .pd-card:hover .pd-card-img img {
          transform: scale(1.05);
        }

        .pd-card-overlay {
          position: absolute;
          inset: 0;
          background: rgba(20, 83, 45, 0.45);
          display: none;
          align-items: center;
          justify-content: center;
          gap: 8px;
          z-index: 2;
        }

        .pd-card:hover .pd-card-overlay {
          display: flex;
        }

        .pd-card-action {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #fff;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .pd-card-action:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .pd-card-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .pd-card-body {
          padding: 10px 12px;
          text-align: center;
        }

        .pd-card-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--pd-dark);
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 35px;
        }

        .pd-card-price {
          font-size: 15px;
          font-weight: 900;
          color: var(--pd-red);
          margin-top: 6px;
        }

        .pd-card-old-price {
          font-size: 12px;
          font-weight: 400;
          color: var(--pd-light);
          text-decoration: line-through;
          margin-top: 2px;
        }

        .pd-card-badge {
          position: absolute;
          top: 8px;
          font-size: 9px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 100px;
          z-index: 3;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .pd-card-badge-sold {
          left: 8px;
          background: var(--pd-dark);
          color: #fff;
        }

        .pd-card-badge-discount {
          right: 8px;
          background: var(--pd-red);
          color: #fff;
          font-size: 10px;
          padding: 3px 7px;
        }

        /* ==================== SERVICE FEATURES ==================== */

        .pd-features {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-top: 32px;
        }

        @media (min-width: 640px) {
          .pd-features { grid-template-columns: repeat(4, 1fr); }
        }

        .pd-feature {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px;
          border: 1px solid var(--pd-border);
          border-radius: var(--pd-radius);
          transition: all 0.2s ease;
        }

        .pd-feature:hover {
          border-color: var(--pd-green-accent);
          background: var(--pd-green-lighter);
        }

        .pd-feature-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .pd-feature-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--pd-dark);
          margin-bottom: 2px;
        }

        .pd-feature-subtitle {
          font-size: 11px;
          color: var(--pd-light);
        }

        /* ==================== STICKY BAR ==================== */

        .pd-sticky-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: #fff;
          border-bottom: 1px solid var(--pd-border);
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
        }

        .pd-sticky-bar.pd-hidden {
          transform: translateY(-100%);
          opacity: 0;
        }

        .pd-sticky-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        @media (min-width: 768px) {
          .pd-sticky-inner { padding: 12px 24px; }
        }

        .pd-sticky-product {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .pd-sticky-img {
          width: 48px;
          height: 48px;
          border: 1px solid var(--pd-border);
          border-radius: var(--pd-radius);
          object-fit: contain;
          flex-shrink: 0;
        }

        .pd-sticky-info {
          min-width: 0;
        }

        .pd-sticky-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--pd-dark);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 2px;
        }

        .pd-sticky-price {
          font-size: 16px;
          font-weight: 900;
          color: var(--pd-red);
        }

        .pd-sticky-old-price {
          font-size: 12px;
          color: var(--pd-light);
          text-decoration: line-through;
          margin-left: 8px;
        }

        .pd-sticky-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .pd-sticky-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 20px;
          border-radius: var(--pd-radius);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .pd-sticky-btn-cart {
          background: var(--pd-green);
          color: #fff;
        }

        .pd-sticky-btn-cart:hover:not(:disabled) {
          background: var(--pd-green-mid);
        }

        .pd-sticky-btn-cart:disabled {
          background: var(--pd-border);
          color: var(--pd-light);
          cursor: not-allowed;
        }

        .pd-sticky-cart-icon {
          position: relative;
          width: 40px;
          height: 40px;
          background: var(--pd-bg-subtle);
          border-radius: var(--pd-radius);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pd-sticky-cart-icon:hover {
          background: var(--pd-green-light);
        }

        .pd-sticky-cart-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          background: var(--pd-red);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ==================== CART SIDEBAR ==================== */

        .pd-cart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid var(--pd-border);
          background: #fff;
        }

        .pd-cart-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 800;
          color: var(--pd-dark);
        }

        .pd-cart-count {
          background: var(--pd-green-light);
          color: var(--pd-green);
          padding: 2px 8px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
        }

        .pd-cart-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--pd-bg-subtle);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .pd-cart-close:hover {
          background: var(--pd-border);
        }

        .pd-cart-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 32px;
          text-align: center;
        }

        .pd-cart-empty-icon {
          width: 64px;
          height: 64px;
          color: var(--pd-border);
          margin-bottom: 16px;
        }

        .pd-cart-empty-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--pd-mid);
          margin-bottom: 4px;
        }

        .pd-cart-empty-text {
          font-size: 13px;
          color: var(--pd-light);
        }

        .pd-cart-item {
          position: relative;
          background: #fff;
          border: 1px solid var(--pd-border);
          border-radius: var(--pd-radius);
          padding: 12px;
          transition: all 0.2s ease;
        }

        .pd-cart-item:hover {
          border-color: var(--pd-green-accent);
        }

        .pd-cart-item-inner {
          display: flex;
          gap: 12px;
        }

        .pd-cart-item-img {
          width: 60px;
          height: 60px;
          background: var(--pd-bg-subtle);
          border-radius: var(--pd-radius);
          overflow: hidden;
          flex-shrink: 0;
        }

        .pd-cart-item-info {
          flex: 1;
          min-width: 0;
        }

        .pd-cart-item-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--pd-dark);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .pd-cart-item-price {
          font-size: 14px;
          font-weight: 900;
          color: var(--pd-red);
        }

        .pd-cart-item-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
        }

        .pd-qty-control {
          display: flex;
          align-items: center;
          background: var(--pd-bg-subtle);
          border: 1px solid var(--pd-border);
          border-radius: var(--pd-radius);
        }

        .pd-qty-btn {
          width: 28px;
          height: 28px;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .pd-qty-btn:hover:not(:disabled) {
          background: var(--pd-green-light);
        }

        .pd-qty-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pd-qty-value {
          width: 32px;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          color: var(--pd-dark);
        }

        .pd-cart-item-total {
          font-size: 14px;
          font-weight: 800;
          color: var(--pd-dark);
        }

        .pd-cart-item-remove {
          width: 28px;
          height: 28px;
          background: #fef2f2;
          border: none;
          border-radius: var(--pd-radius);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          margin-left: 8px;
        }

        .pd-cart-item-remove:hover {
          background: #fecaca;
        }

        .pd-cart-footer {
          border-top: 1px solid var(--pd-border);
          background: #fff;
          padding: 16px;
        }

        .pd-cart-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .pd-cart-total-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--pd-mid);
        }

        .pd-cart-total-value {
          font-size: 20px;
          font-weight: 900;
          color: var(--pd-red);
        }

        .pd-cart-note {
          font-size: 11px;
          color: var(--pd-light);
          text-align: center;
          margin-bottom: 12px;
        }

        .pd-cart-checkout {
          width: 100%;
          padding: 14px;
          background: var(--pd-green);
          color: #fff;
          border: none;
          border-radius: var(--pd-radius);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 8px;
        }

        .pd-cart-checkout:hover {
          background: var(--pd-green-mid);
        }

        .pd-cart-continue {
          width: 100%;
          padding: 12px;
          background: #fff;
          color: var(--pd-mid);
          border: 1px solid var(--pd-border);
          border-radius: var(--pd-radius);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pd-cart-continue:hover {
          background: var(--pd-bg-subtle);
          border-color: var(--pd-green-accent);
        }

        /* ==================== ALERT ==================== */

        .pd-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: var(--pd-radius);
          border-left: 4px solid;
          margin-bottom: 16px;
        }

        .pd-alert-warning {
          background: #fffbeb;
          border-left-color: #f59e0b;
        }

        .pd-alert-success {
          background: var(--pd-green-lighter);
          border-left-color: var(--pd-green-accent);
        }

        .pd-alert-text {
          font-size: 13px;
          font-weight: 500;
        }

        .pd-alert-warning .pd-alert-text {
          color: #92400e;
        }

        .pd-alert-success .pd-alert-text {
          color: var(--pd-green);
        }

        /* ==================== GRID ==================== */

        .pd-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        @media (min-width: 640px) {
          .pd-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (min-width: 1024px) {
          .pd-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }
        }

        /* ==================== RELATED PRODUCTS GRID ==================== */

        .pd-grid-related {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        @media (min-width: 640px) {
          .pd-grid-related { grid-template-columns: repeat(3, 1fr); }
        }

        @media (min-width: 768px) {
          .pd-grid-related { grid-template-columns: repeat(4, 1fr); }
        }

        @media (min-width: 1024px) {
          .pd-grid-related { grid-template-columns: repeat(5, 1fr); gap: 16px; }
        }

        @media (min-width: 1280px) {
          .pd-grid-related { grid-template-columns: repeat(6, 1fr); }
        }

        /* ==================== MOBILE BOTTOM BAR ==================== */

        .pd-mobile-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #fff;
          border-top: 1px solid var(--pd-border);
          padding: 12px 16px;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.08);
          z-index: 40;
        }

        @media (min-width: 768px) {
          .pd-mobile-bar { display: none; }
        }

        /* ==================== LOADING SPINNER ==================== */

        .pd-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #fff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: pd-spin 0.8s linear infinite;
        }

        @keyframes pd-spin {
          to { transform: rotate(360deg); }
        }

        /* ==================== IMAGE CONTAINER ==================== */

        .pd-image-container {
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .pd-main-image {
          border-radius: var(--pd-radius);
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          max-width: 100%;
          transition: transform 0.3s ease;
        }

        .pd-main-image:hover {
          transform: scale(1.02);
        }
      `}</style>

      <div className="pd-root max-w-7xl mx-auto px-4 py-2">
   <Helmet>
        <title>{`${product?.productName || "Product"} - Best Price`}</title>
        <meta name="description" content={`Buy ${product?.productName || "this product"} for ₵${formatPrice?.(product?.price) || "0.00"}. High-quality and best prices available.`} />
        <meta property="og:title" content={product?.productName || "Product"} />
        <meta property="og:description" content={`Buy ${product?.productName || "this product"} for ₵${formatPrice?.(product?.price) || "0.00"}.`} />
        <meta property="og:image" content={imageUrl || "default-image-url.jpg"} />
        <meta property="og:url" content={productUrl || "https://www.frankotrading.com"} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={`https://www.frankotrading.com/product/${product?.productID || "defaultID"}`} />
      </Helmet>

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": product.productName,
          "image": imageUrl,
          "description": product.description,
          "sku": product.productID,
          "brand": {
            "@type": "Brand",
            "name": product.brandName
          },
         "offers": {
  "@type": "Offer",
  "priceCurrency": "GHS",
  "price": product.price,
  "priceValidUntil": "2025-12-31",
  "itemCondition": "https://schema.org/NewCondition",
  "availability": "https://schema.org/InStock",
  "url": `https://www.frankotrading.com/product/${product.productID}`,
  "seller": {
    "@type": "Organization",
    "name": "Franko Trading"
  },
  "shippingDetails": {
    "@type": "OfferShippingDetails",
    "shippingRate": {
      "@type": "MonetaryAmount",
      "currency": "GHS",
      "value": "30.00"
    },
    "shippingDestination": {
      "@type": "DefinedRegion",
      "addressCountry": "GH"
    },
    "deliveryTime": {
      "@type": "ShippingDeliveryTime",
      "handlingTime": {
        "@type": "QuantitativeValue",
        "minValue": 1,
        "maxValue": 2,
        "unitCode": "DAY"
      },
      "transitTime": {
        "@type": "QuantitativeValue",
        "minValue": 3,
        "maxValue": 5,
        "unitCode": "DAY"
      }
    }
  },
  "hasMerchantReturnPolicy": {
    "@type": "MerchantReturnPolicy",
    "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
    "merchantReturnDays": 14,
    "returnMethod": "https://schema.org/ReturnByMail",
    "returnFees": "https://schema.org/FreeReturn",
    "applicableCountry": "GH"
  }
}

        })}
      </script>


        {/* Sticky Add to Cart Bar */}
        <div className={`pd-sticky-bar ${showStickyCart ? '' : 'pd-hidden'}`}>
          <div className="pd-sticky-inner">
            <div className="pd-sticky-product">
              <img
                src={imageUrl}
                alt={product.productName}
                className="pd-sticky-img"
                onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
              />
              <div className="pd-sticky-info">
                <h3 className="pd-sticky-name">{product.productName}</h3>
                <div>
                  <span className="pd-sticky-price">GH₵{formatPrice(product.price)}</span>
                  {product.oldPrice > 0 && (
                    <span className="pd-sticky-old-price">GH₵{formatPrice(product.oldPrice)}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pd-sticky-actions">
              <button
                className="pd-sticky-btn pd-sticky-btn-cart"
                onClick={() => handleAddToCartAndOpenSidebar(product)}
                disabled={isAddingToCart || outOfStock}
              >
                {isAddingToCart ? (
                  <><div className="pd-spinner" /><span>Adding...</span></>
                ) : outOfStock ? (
                  <><ExclamationTriangleIcon className="w-4 h-4" /><span>Out of Stock</span></>
                ) : (
                  <><ShoppingCartIcon className="w-4 h-4" /><span>Add to Cart</span></>
                )}
              </button>

              <div
                className="pd-sticky-cart-icon"
                onClick={() => setCartSidebarOpen(true)}
              >
                <ShoppingCartIcon className="w-5 h-5" style={{ color: 'var(--pd-mid)' }} />
                {totalCartItems > 0 && (
                  <span className="pd-sticky-cart-badge">{totalCartItems}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Network / Cart Error Alert */}
        {cartSyncError && (
          <div className={`pd-alert ${cartSyncError.includes('successfully') ? 'pd-alert-success' : 'pd-alert-warning'}`}>
            <ExclamationTriangleIcon className="w-5 h-5" style={{ color: cartSyncError.includes('successfully') ? 'var(--pd-green)' : '#f59e0b' }} />
            <p className="pd-alert-text">{cartSyncError}</p>
          </div>
        )}

        {/* Main Product Details */}
        <div id="product-details-section" ref={productDetailsRef} className="grid lg:grid-cols-2 gap-12 pt-4">
          <div className="pd-image-container">
            <Image.PreviewGroup>
              <Image
                src={imageUrl}
                className="pd-main-image"
                alt={product.productName}
                style={{ maxWidth: '100%', borderRadius: 'var(--pd-radius)' }}
              />
            </Image.PreviewGroup>
          </div>

          <div className="space-y-4">
            <h1 className="pd-product-title">{product.productName}</h1>

            <div className="pd-price-container">
              <span className="pd-price">GH₵{formatPrice(product.price)}</span>
              {product.oldPrice > 0 && (
                <span className="pd-old-price">GH₵{formatPrice(product.oldPrice)}</span>
              )}
            </div>

            <div className="flex items-center flex-wrap justify-between gap-2">
              <div className="flex items-center flex-wrap gap-2">
                {product.tag && (
                  <span className="pd-badge pd-badge-tag">{product.tag}</span>
                )}
                {product.productColor && (
                  <span className="pd-badge pd-badge-color">Color: {product.productColor}</span>
                )}
              </div>
              <button
                className="pd-share-btn"
                onClick={() => handleShare("general")}
              >
                <ShareIcon className="w-5 h-5" style={{ color: 'var(--pd-green)' }} />
              </button>
            </div>

            <div className={`pd-stock ${outOfStock ? 'pd-stock-out' : 'pd-stock-in'}`}>
              {outOfStock ? (
                <><ExclamationTriangleIcon className="w-4 h-4" /><span>Out of Stock</span></>
              ) : (
                <><CheckCircleIcon className="w-4 h-4" /><span>In Stock</span></>
              )}
            </div>

            <div className="mt-4">
              <div className="pd-description-header">
                <div className="pd-title-accent" style={{ height: '20px' }} />
                <h2 className="pd-description-title">Product Description</h2>
              </div>
              <div className="pd-description-box">
                {descriptionLines}
              </div>
            </div>

            {/* Desktop Add to Cart */}
            <div className="pt-4 hidden md:block">
              <button
                className="pd-btn pd-btn-primary"
                onClick={() => handleAddToCartAndOpenSidebar(product)}
                disabled={isAddingToCart || outOfStock}
              >
                {isAddingToCart ? (
                  <><div className="pd-spinner" /><span>Adding to Cart...</span></>
                ) : outOfStock ? (
                  <><ExclamationTriangleIcon className="w-5 h-5" /><span>Out of Stock</span></>
                ) : (
                  <><ShoppingCartIcon className="w-5 h-5" /><span>Add to Cart</span></>
                )}
              </button>
            </div>

            {/* Mobile Add to Cart */}
            <div className="pd-mobile-bar">
              <button
                className="pd-btn pd-btn-primary"
                onClick={() => handleAddToCartAndOpenSidebar(product)}
                disabled={isAddingToCart || outOfStock}
              >
                {isAddingToCart ? (
                  <><div className="pd-spinner" /><span>Adding...</span></>
                ) : outOfStock ? (
                  <><ExclamationTriangleIcon className="w-5 h-5" /><span>Out of Stock</span></>
                ) : (
                  <><ShoppingCartIcon className="w-5 h-5" /><span>Add to Cart</span></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ==================== FLIX MEDIA SECTION ==================== */}
        {showFlixMedia && (
          <div
            id="flix-media-section"
            ref={flixMediaSectionRef}
            className="mt-8 bg-white border border-gray-200 overflow-hidden p-6"
            style={{ borderRadius: 'var(--pd-radius)', contain: 'layout style paint' }}
          >
            <div className="pd-section-header" style={{ marginBottom: '24px' }}>
              <div className="pd-title-wrap">
                <div className="pd-title-accent" />
                <h2 className="pd-section-title">More Product Details</h2>
              </div>
              <div className="pd-header-line" />
            </div>
            {flixMediaError && (
              <div className="text-center py-8" style={{ color: 'var(--pd-light)' }}>
                <p>Unable to load additional product details at this time.</p>
              </div>
            )}
          </div>
        )}

        {/* ==================== SERVICE FEATURES ==================== */}
        <div className="pd-features">
          {[
            { title: "Fast Shipping", subtitle: "All over Ghana", icon: <TruckIcon className="pd-feature-icon" style={{ color: 'var(--pd-green)' }} /> },
            { title: "Quality Assurance", subtitle: "Certified products", icon: <ShieldCheckIcon className="pd-feature-icon" style={{ color: 'var(--pd-green-accent)' }} /> },
            { title: "Customer Support", subtitle: "Dedicated support team", icon: <PhoneIcon className="pd-feature-icon" style={{ color: 'var(--pd-green-mid)' }} /> },
            { title: "Secure Payment", subtitle: "Safe Payment Processing", icon: <CreditCardIcon className="pd-feature-icon" style={{ color: 'var(--pd-green)' }} /> },
          ].map((item, idx) => (
            <div key={idx} className="pd-feature">
              {item.icon}
              <div>
                <p className="pd-feature-title">{item.title}</p>
                <p className="pd-feature-subtitle">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ==================== RECENTLY VIEWED PRODUCTS ==================== */}
        {viewedProducts.length > 0 && (
          <section className="mt-16">
            <div className="pd-section-header">
              <div className="pd-title-wrap">
                <div className="pd-title-accent" />
                <h2 className="pd-section-title">Recently Viewed Products</h2>
              </div>
              <div className="pd-header-line" />
            </div>
            <div className="pd-grid">
              {viewedProducts.map((viewedProduct, index) => {
                if (!viewedProduct || !viewedProduct.id) return null;
                const productOutOfStock = isOutOfStock(viewedProduct);
                const discount = viewedProduct.oldPrice > 0
                  ? Math.round(((viewedProduct.oldPrice - viewedProduct.price) / viewedProduct.oldPrice) * 100)
                  : 0;
                const imgUrl = getValidImageUrl(viewedProduct.image);

                return (
                  <div
                    key={`viewed-${viewedProduct.id}-${index}`}
                    className="pd-card"
                    style={{ opacity: productOutOfStock ? 0.75 : 1 }}
                  >
                    <div className="pd-card-img">
                      {productOutOfStock && (
                        <span className="pd-card-badge pd-card-badge-sold">Sold Out</span>
                      )}
                      {discount > 0 && !productOutOfStock && (
                        <span className="pd-card-badge pd-card-badge-discount">-{discount}%</span>
                      )}
                      <div
                        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => navigate(`/product/${viewedProduct.id}`)}
                      >
                        <img
                          src={imgUrl}
                          alt={viewedProduct.name}
                          onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
                        />
                      </div>
                      <div className="pd-card-overlay" onClick={() => navigate(`/product/${viewedProduct.id}`)}>
                        <Tooltip content="Add to Wishlist" placement="top">
                          <button className="pd-card-action" onClick={(e) => e.stopPropagation()}>
                            <SolidHeartIcon className="w-4 h-4" style={{ color: 'var(--pd-mid)' }} />
                          </button>
                        </Tooltip>
                        <Tooltip content="View Details" placement="top">
                          <button className="pd-card-action" onClick={(e) => { e.stopPropagation(); navigate(`/product/${viewedProduct.id}`); }}>
                            <EyeIcon className="w-4 h-4" style={{ color: 'var(--pd-green)' }} />
                          </button>
                        </Tooltip>
                        <Tooltip content={productOutOfStock ? "Out of Stock" : "Add to Cart"} placement="top">
                          <button 
                            className="pd-card-action" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (!productOutOfStock) handleAddToCartAndOpenSidebar(viewedProduct); 
                            }}
                            disabled={productOutOfStock}
                          >
                            <ShoppingCartIcon className="w-4 h-4" style={{ color: 'var(--pd-green-mid)' }} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="pd-card-body">
                      <h3 className="pd-card-name">{viewedProduct.name || "Unnamed Product"}</h3>
                      <div className="pd-card-price">GH₵{formatPrice(viewedProduct.price)}</div>
                      {viewedProduct.oldPrice > 0 && (
                        <div className="pd-card-old-price">GH₵{formatPrice(viewedProduct.oldPrice)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ==================== YOU MAY ALSO LIKE (RELATED PRODUCTS) ==================== */}
        {related.length > 0 && (
          <section className="mt-10 mb-24 md:mb-1">
            <div className="pd-section-header">
              <div className="pd-title-wrap">
                <div className="pd-title-accent" />
                <h2 className="pd-section-title">You May Also Like</h2>
              </div>
              <div className="pd-header-line" />
            </div>
            <div className="pd-grid-related">
              {related.slice(0, 12).map((relatedProduct, index) => {
                if (!relatedProduct || !relatedProduct.productID) return null;
                
                const productOutOfStock = isOutOfStock(relatedProduct);
                const discount = relatedProduct.oldPrice > 0
                  ? Math.round(((relatedProduct.oldPrice - relatedProduct.price) / relatedProduct.oldPrice) * 100)
                  : 0;
                const imgUrl = getValidImageUrl(relatedProduct.productImage);

                return (
                  <div
                    key={`related-${relatedProduct.productID}-${index}`}
                    className="pd-card"
                    style={{ opacity: productOutOfStock ? 0.75 : 1 }}
                  >
                    <div className="pd-card-img">
                      {productOutOfStock && (
                        <span className="pd-card-badge pd-card-badge-sold">Sold Out</span>
                      )}
                      {discount > 0 && !productOutOfStock && (
                        <span className="pd-card-badge pd-card-badge-discount">-{discount}%</span>
                      )}
                      <div
                        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => navigate(`/product/${relatedProduct.productID}`)}
                      >
                        <img
                          src={imgUrl}
                          alt={relatedProduct.productName}
                          onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
                        />
                      </div>
                      <div className="pd-card-overlay" onClick={() => navigate(`/product/${relatedProduct.productID}`)}>
                        <Tooltip content="Add to Wishlist" placement="top">
                          <button 
                            className="pd-card-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add wishlist logic here if needed
                            }}
                          >
                            <SolidHeartIcon className="w-4 h-4" style={{ color: 'var(--pd-mid)' }} />
                          </button>
                        </Tooltip>
                        <Tooltip content="View Details" placement="top">
                          <button 
                            className="pd-card-action" 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/product/${relatedProduct.productID}`);
                            }}
                          >
                            <EyeIcon className="w-4 h-4" style={{ color: 'var(--pd-green)' }} />
                          </button>
                        </Tooltip>
                        <Tooltip content={productOutOfStock ? "Out of Stock" : "Add to Cart"} placement="top">
                          <button 
                            className="pd-card-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!productOutOfStock) {
                                handleAddToCartAndOpenSidebar(relatedProduct);
                              }
                            }}
                            disabled={productOutOfStock}
                          >
                            <ShoppingCartIcon className="w-4 h-4" style={{ color: 'var(--pd-green-mid)' }} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="pd-card-body">
                                    <h3 className="pd-card-name">{relatedProduct.productName || "Unnamed Product"}</h3>
                      <div className="pd-card-price">GH₵{formatPrice(relatedProduct.price)}</div>
                      {relatedProduct.oldPrice > 0 && (
                        <div className="pd-card-old-price">GH₵{formatPrice(relatedProduct.oldPrice)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ==================== CART SIDEBAR ==================== */}
        <Drawer
          placement="right"
          open={cartSidebarOpen}
          onClose={() => setCartSidebarOpen(false)}
          className="p-0"
          size={400}
        >
          <div className="flex flex-col h-full" style={{ fontFamily: 'var(--pd-font)' }}>
            <div className="pd-cart-header">
              <div className="pd-cart-title">
                <ShoppingCartIcon className="w-5 h-5" style={{ color: 'var(--pd-green)' }} />
                <span>Shopping Cart</span>
                {localCart.length > 0 && (
                  <span className="pd-cart-count">
                    {totalCartItems} Item{totalCartItems !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button className="pd-cart-close" onClick={() => setCartSidebarOpen(false)}>
                <XMarkIcon className="w-4 h-4" style={{ color: 'var(--pd-mid)' }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {cartLoading ? (
                <div className="pd-cart-empty">
                  <div style={{ position: 'relative' }}>
                    <div className="w-16 h-16 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--pd-green-light)', borderTopColor: 'var(--pd-green)' }} />
                    <ArrowPathIcon className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ color: 'var(--pd-green)' }} />
                  </div>
                  <p style={{ color: 'var(--pd-mid)', fontWeight: 600 }}>Updating your cart...</p>
                </div>
              ) : !Array.isArray(localCart) || localCart.length === 0 ? (
                <div className="pd-cart-empty">
                  <ShoppingCartIcon className="pd-cart-empty-icon" />
                  <h3 className="pd-cart-empty-title">Your cart is empty</h3>
                  <p className="pd-cart-empty-text">Start shopping to fill it up!</p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {localCart.map((item, index) => {
                    const isUpdating = updatingQuantity[item.productId];
                    const isRemoving = removingItem[item.productId];
                    const lineTotal = getItemLineTotal(item);

                    return (
                      <div
                        key={`${item.productId}-${index}`}
                        className="pd-cart-item"
                        style={{ opacity: isUpdating || isRemoving ? 0.5 : 1, pointerEvents: isUpdating || isRemoving ? 'none' : 'auto' }}
                      >
                        <div className="pd-cart-item-inner">
                          <div className="pd-cart-item-img">
                            {renderImage(item.imagePath)}
                          </div>
                          <div className="pd-cart-item-info">
                            <h4 className="pd-cart-item-name">{item.productName || "Product Name"}</h4>
                            <p className="pd-cart-item-price">GH₵{formatPrice(item.price || 0)}</p>
                            <div className="pd-cart-item-actions">
                              <div className="pd-qty-control">
                                <button
                                  className="pd-qty-btn"
                                  onClick={() => handleQuantityChange(item.productId, (item.quantity || 1) - 1)}
                                  disabled={isUpdating || isRemoving || (item.quantity || 1) <= 1}
                                >
                                  <MinusIcon className="w-3 h-3" />
                                </button>
                                <span className="pd-qty-value">{item.quantity || 1}</span>
                                <button
                                  className="pd-qty-btn"
                                  onClick={() => handleQuantityChange(item.productId, (item.quantity || 1) + 1)}
                                  disabled={isUpdating || isRemoving}
                                >
                                  <PlusIcon className="w-3 h-3" />
                                </button>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span className="pd-cart-item-total">GH₵{formatPrice(lineTotal)}</span>
                                <button
                                  className="pd-cart-item-remove"
                                  onClick={() => handleRemoveItem(item.productId)}
                                  disabled={isUpdating || isRemoving}
                                >
                                  <TrashIcon className="w-3 h-3" style={{ color: 'var(--pd-red)' }} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {Array.isArray(localCart) && localCart.length > 0 && !cartLoading && (
              <div className="pd-cart-footer">
                <div className="pd-cart-total-row">
                  <span className="pd-cart-total-label">Total:</span>
                  <span className="pd-cart-total-value">GH₵{formatPrice(cartTotal)}</span>
                </div>
                <p className="pd-cart-note">* Taxes & shipping calculated at checkout</p>
                <Divider style={{ margin: '12px 0' }} />
                <button
                  className="pd-cart-checkout"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </button>
                <button
                  className="pd-cart-continue"
                  onClick={handleContinueShopping}
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        </Drawer>

        <AuthModal open={authModalOpen} onClose={handleAuthModalClose} onSuccess={handleAuthSuccess} />
      </div>
    </>
  );
};

export default ProductDescription;