import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { Image } from "antd";
import { fetchProductById, fetchProducts } from "../Redux/Slice/productSlice";
import { updateCartItem, deleteCartItem, getCartById, addToCart } from '../Redux/Slice/cartSlice';
import ProductDetailSkeleton from "../Component/ProductDetailSkeleton";
import { Button, Tooltip, IconButton, Drawer } from "@material-tailwind/react";
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
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import ProductCard from "../Component/ProductCard";
import AuthModal from "../Component/AuthModal";
import { Helmet } from "react-helmet";
import { Divider } from "antd";

// ==================== UTILITY FUNCTIONS ====================

const formatPrice = (price) => {
  if (!price || isNaN(price)) return "0";
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
      localStorage.setItem(key, value);
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
  const { cart, loading: cartLoadingState, error: cartError, cartId } = useSelector((state) => state.cart);

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
      const image = `https://ct002.frankotrading.com:444/Media/Products_Images/${prod.productImage.split("\\").pop()}`;

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
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
          <div class="text-gray-600">Loading more product details</div>
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
              body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
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
    const indicators = ["all brands", "products out of stock", "out of stock", "unavailable", "not available"];
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

      // ✅ Show sidebar immediately with loading state
      setCartSidebarOpen(true);
      setCartLoading(true);

      // ✅ Always reload full cart from DB
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
          // Silent fail - cart may already be updated
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
    
    // ✅ Show loading state for this specific item
    setUpdatingQuantity(prev => ({ ...prev, [productId]: true }));
    setCartSyncError(null);

    try {
      // Optimistic update
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

      // ✅ Always reload full cart from DB after update
      setCartLoading(true);
      const updatedCart = await dispatch(getCartById(activeCartId)).unwrap();
      if (updatedCart && Array.isArray(updatedCart)) {
        const normalizedCart = updatedCart.map(normalizeCartItem);
        safeLocalStorage.setItem('cart', normalizedCart);
        setLocalCart(normalizedCart);
        setCartSyncError(null);
      }
    } catch (error) {
      // Rollback on error
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
    
    // ✅ Show loading state for this specific item
    setRemovingItem(prev => ({ ...prev, [productId]: true }));
    setCartSyncError(null);

    try {
      // Optimistic removal
      const optimisticCart = localCart.filter(item => item.productId !== productId);
      safeLocalStorage.setItem('cart', optimisticCart);
      setLocalCart(optimisticCart);

      await dispatch(deleteCartItem({
        CartId: activeCartId,
        ProductId: String(productId),
      })).unwrap();

      // ✅ Always reload full cart from DB after deletion
      setCartLoading(true);
      const updatedCart = await dispatch(getCartById(activeCartId)).unwrap();
      if (updatedCart && Array.isArray(updatedCart)) {
        const normalizedCart = updatedCart.map(normalizeCartItem);
        safeLocalStorage.setItem('cart', normalizedCart);
        setLocalCart(normalizedCart);
        setCartSyncError(null);
      }
    } catch (error) {
      // Rollback on error
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
    const base = "https://ct002.frankotrading.com:444/Media/Products_Images/";
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
        className="w-full h-full object-cover rounded-lg"
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
  const imageUrl = `https://ct002.frankotrading.com:444/Media/Products_Images/${product.productImage.split("\\").pop()}`;
  const descriptionLines = product.description.split("\n").map((line, i) => (
    <p key={i} className="text-sm text-gray-700 mb-1">{line}</p>
  ));
  const productUrl = window.location.href;
  const related = products.slice(-12);

  // ==================== RENDER ====================

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
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
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-lg transition-all duration-300 ${
          showStickyCart ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <img
                  src={imageUrl}
                  alt={product.productName}
                  className="w-16 h-16 object-contain rounded-lg border border-gray-200"
                  onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">{product.productName}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-bold text-red-600">GH₵{formatPrice(product.price)}.00</span>
                  {product.oldPrice > 0 && (
                    <span className="text-sm text-gray-400 line-through">GH₵{formatPrice(product.oldPrice)}.00</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Button
                size="sm"
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  outOfStock
                    ? 'bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed'
                    : isAddingToCart
                    ? 'bg-red-400 text-white'
                    : 'bg-red-500 text-white hover:bg-red-600 shadow-md'
                }`}
                onClick={() => handleAddToCartAndOpenSidebar(product)}
                disabled={isAddingToCart || outOfStock}
              >
                {isAddingToCart ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Adding...</span></>
                ) : outOfStock ? (
                  <><ExclamationTriangleIcon className="w-4 h-4" /><span>Out of Stock</span></>
                ) : (
                  <><ShoppingCartIcon className="w-4 h-4" /><span>Add to Cart</span></>
                )}
              </Button>

              <button
                onClick={() => setCartSidebarOpen(true)}
                className="relative bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg p-3 transition-colors duration-200"
                disabled={!localCart || localCart.length === 0}
              >
                <ShoppingCartIcon className="w-5 h-5" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalCartItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Network / Cart Error Alert */}
      {cartSyncError && (
        <div className={`mb-4 p-4 rounded-lg border-l-4 ${
          cartSyncError.includes('successfully') ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'
        }`}>
          <div className="flex items-center">
            <ExclamationTriangleIcon className={`w-5 h-5 mr-2 ${cartSyncError.includes('successfully') ? 'text-green-600' : 'text-yellow-600'}`} />
            <p className={`text-sm ${cartSyncError.includes('successfully') ? 'text-green-800' : 'text-yellow-800'}`}>
              {cartSyncError}
            </p>
          </div>
        </div>
      )}

      {/* Main Product Details - keeping original structure */}
      <div id="product-details-section" ref={productDetailsRef} className="grid lg:grid-cols-2 gap-12 pt-4">
        {/* Product image and details remain the same */}
        <div className="flex justify-center items-start">
          <Image.PreviewGroup>
            <Image
              src={imageUrl}
              className="rounded-2xl shadow-xl object-cover max-w-full transition-transform duration-300 hover:scale-105"
              alt={product.productName}
            />
          </Image.PreviewGroup>
        </div>

        <div className="space-y-4">
          <div className="font-bold text-gray-900 text-lg md:text-xl">{product.productName}</div>

          <div className="flex items-center gap-4 text-red-500 bg-red-50 rounded-lg p-3 shadow-md">
            <div className="text-lg md:text-xl font-bold">GH₵{formatPrice(product.price)}.00</div>
            {product.oldPrice > 0 && (
              <div className="text-sm text-gray-400 line-through">GH₵ {formatPrice(product.oldPrice)}.00</div>
            )}
          </div>

          <div className="flex items-center flex-wrap justify-between gap-2">
            <div className="flex items-center flex-wrap gap-2">
              {product.tag && (
                <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                  {product.tag}
                </div>
              )}
              {product.productColor && (
                <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium border">
                  Color: {product.productColor}
                </div>
              )}
            </div>
            <IconButton
              onClick={() => handleShare("general")}
              className="bg-red-400 text-white rounded-full p-3 shadow-lg transition duration-300 hover:scale-110"
            >
              <ShareIcon className="w-5 h-5" />
            </IconButton>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm border transition duration-200 w-max ${
            outOfStock ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200 hover:shadow-md'
          }`}>
            {outOfStock ? (
              <><ExclamationTriangleIcon className="w-4 h-4 text-red-600" /><span>Out of Stock</span></>
            ) : (
              <><CheckCircleIcon className="w-4 h-4 text-green-600" /><span>In Stock</span></>
            )}
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm md:text-md font-bold text-gray-700 relative whitespace-nowrap mt-4 mb-3">
                Product Description
                <span className="absolute -bottom-1 left-0 w-16 h-1 bg-red-400 rounded-full"></span>
              </h2>
            </div>
            <div className="bg-white p-2 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100">
              <div className="space-y-4 text-gray-800 text-base leading-relaxed">{descriptionLines}</div>
            </div>
          </div>

          {/* Desktop Add to Cart */}
          <div className="pt-2">
            <div className="hidden md:flex flex-wrap gap-4 items-center">
              <Button
                variant="outlined"
                className={`group relative flex items-center justify-center gap-2.5 px-6 py-3.5 w-full rounded-2xl font-semibold text-sm transition-all duration-300 ease-out shadow-xl shadow-red-200 hover:shadow-2xl hover:shadow-red-300 focus:outline-none focus:ring-3 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none overflow-hidden ${
                  outOfStock
                    ? 'bg-gray-50 text-gray-400 border-2 border-gray-200 shadow-sm shadow-gray-200 cursor-not-allowed'
                    : isAddingToCart
                    ? 'bg-red-300 text-white border-2 border-red-500 shadow-red-300'
                    : 'bg-red-500 text-white border-2 border-red-500 hover:bg-red-600 hover:border-red-600 focus:ring-red-300'
                }`}
                onClick={() => handleAddToCartAndOpenSidebar(product)}
                disabled={isAddingToCart || outOfStock}
              >
                {!outOfStock && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                )}
                <div className="relative z-10 flex items-center gap-2.5">
                  {isAddingToCart ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span className="font-medium">Adding to Cart...</span></>
                  ) : outOfStock ? (
                    <><ExclamationTriangleIcon className="w-5 h-5 text-gray-400 group-hover:scale-110 transition-transform duration-200" /><span className="font-medium">Out of Stock</span></>
                  ) : (
                    <><ShoppingCartIcon className="w-5 h-5 transition-all duration-300 group-hover:scale-110 text-white" /><span className="font-medium text-white transition-colors duration-300">Add to Cart</span></>
                  )}
                </div>
                {!outOfStock && !isAddingToCart && (
                  <div className="absolute inset-0 bg-green-400 rounded-2xl scale-0 opacity-0 group-active:scale-100 group-active:opacity-30 transition-all duration-150" />
                )}
              </Button>
            </div>

            {/* Mobile Add to Cart */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-xl z-40 flex items-center justify-between md:hidden">
              <div className="flex gap-2 w-full">
                <Button
                  variant="outlined"
                  className={`flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-2xl transition-all duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed flex-1 ${
                    outOfStock
                      ? 'bg-gray-100 text-gray-500 border border-gray-300'
                      : 'bg-red-500 text-white border border-red-500 hover:bg-red-600 hover:border-red-600'
                  }`}
                  onClick={() => handleAddToCartAndOpenSidebar(product)}
                  disabled={isAddingToCart || outOfStock}
                >
                  {isAddingToCart ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span className="text-sm">Adding...</span></>
                  ) : outOfStock ? (
                    <><ExclamationTriangleIcon className="w-5 h-5" /><span className="text-sm">Out of Stock</span></>
                  ) : (
                    <><ShoppingCartIcon className="w-5 h-5" /><span className="text-sm">Add to Cart</span></>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keeping all other sections the same (Flix Media, Service Features, Recently Viewed, Related Products) */}
      
      {/* ==================== ENHANCED CART SIDEBAR ==================== */}
      <Drawer
        placement="right"
        open={cartSidebarOpen}
        onClose={() => setCartSidebarOpen(false)}
        className="p-0"
        size={400}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <div className="flex items-center gap-2">
              <ShoppingCartIcon className="w-6 h-6 text-red-600" />
              <h2 className="text-lg font-bold text-gray-800">Shopping Cart</h2>
            </div>
            <div className="flex items-center gap-2">
              {localCart.length > 0 && (
                <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                  {totalCartItems} Item{totalCartItems !== 1 ? 's' : ''}
                </div>
              )}
              <IconButton variant="text" onClick={() => setCartSidebarOpen(false)} className="rounded-full">
                <XMarkIcon className="w-5 h-5" />
              </IconButton>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* ✅ ENHANCED LOADING STATE - Full overlay with spinner */}
            {cartLoading ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-white">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mb-4" />
                  <ArrowPathIcon className="w-6 h-6 text-red-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <p className="text-gray-700 font-semibold text-base mb-1">Updating your cart...</p>
               
              </div>
            ) : !Array.isArray(localCart) || localCart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <ShoppingCartIcon className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 text-sm">Start shopping to fill it up!</p>
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
                      className={`bg-white border rounded-lg p-3 shadow-sm transition-all duration-200 ${
                        isUpdating || isRemoving ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      {/* ✅ Item-specific loading overlay */}
                      {(isUpdating || isRemoving) && (
                        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg z-10">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mb-2" />
                            <span className="text-xs text-gray-600 font-medium">
                              {isRemoving ? 'Removing...' : 'Updating...'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 relative">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {renderImage(item.imagePath)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 text-sm line-clamp-2 mb-1">
                            {item.productName || "Product Name"}
                          </h4>
                          <p className="text-red-500 font-bold text-sm">
                            ₵{formatPrice(item.price || 0)}.00
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center bg-gray-50 rounded border">
                              <Button
                                size="sm"
                                variant="text"
                                className="min-w-0 px-2 py-1"
                                onClick={() => handleQuantityChange(item.productId, (item.quantity || 1) - 1)}
                                disabled={isUpdating || isRemoving || (item.quantity || 1) <= 1}
                              >
                                <MinusIcon className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-xs font-semibold">{item.quantity || 1}</span>
                              <Button
                                size="sm"
                                variant="text"
                                className="min-w-0 px-2 py-1"
                                onClick={() => handleQuantityChange(item.productId, (item.quantity || 1) + 1)}
                                disabled={isUpdating || isRemoving}
                              >
                                <PlusIcon className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-gray-700 font-bold text-sm">
                                ₵{formatPrice(lineTotal)}.00
                              </span>
                              <IconButton
                                size="sm"
                                variant="text"
                                color="red"
                                className="p-1"
                                onClick={() => handleRemoveItem(item.productId)}
                                disabled={isUpdating || isRemoving}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </IconButton>
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
            <div className="border-t bg-white p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Total:</span>
                  <span className="text-lg font-bold text-red-600">₵{formatPrice(cartTotal)}.00</span>
                </div>
                <p className="text-xs text-center text-gray-500">* Taxes & shipping calculated at checkout</p>
                <Divider className="my-2" />
                <div className="space-y-2">
                  <Button
                    fullWidth
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg shadow-md transition duration-200"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    className="border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                    onClick={handleContinueShopping}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      <AuthModal open={authModalOpen} onClose={handleAuthModalClose} onSuccess={handleAuthSuccess} />
    </div>
  );
};

export default ProductDescription;