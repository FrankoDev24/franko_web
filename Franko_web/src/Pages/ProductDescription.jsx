import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { Image } from "antd";
import { fetchProductById, fetchProducts } from "../Redux/Slice/productSlice";
import { updateCartItem, deleteCartItem, getCartById } from '../Redux/Slice/cartSlice';
import ProductDetailSkeleton from "../Component/ProductDetailSkeleton";
import { Button, Tooltip, IconButton, Drawer } from "@material-tailwind/react";
import { ShoppingCartIcon, CheckCircleIcon, HeartIcon as SolidHeartIcon, EyeIcon, TruckIcon, ShieldCheckIcon, PhoneIcon, CreditCardIcon,
  ShareIcon,
  TrashIcon,
  MinusIcon,
  PlusIcon,
  XMarkIcon,
  ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import ProductCard from "../Component/ProductCard";
import useAddToCart from "../Component/Cart";
import AuthModal from "../Component/AuthModal";
import { Helmet } from "react-helmet";

const formatPrice = (price) =>
  price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const ProductDescription = () => {
  const { productID } = useParams();
  const { addProductToCart, loading: cartLoading } = useAddToCart();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  
  // State management
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [cartSidebarOpen, setCartSidebarOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Redux selectors
  const { currentProduct, products, loading } = useSelector((state) => state.products);
  const { cart, loading: cartLoadingState, error: cartError, cartId } = useSelector((state) => state.cart);
  const [viewedProducts, setViewedProducts] = useState([]);

    useEffect(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);
  // Fetch cart data when component mounts or cartId changes
  useEffect(() => {
    if (cartId) {
      dispatch(getCartById(cartId));
    }
  }, [dispatch, cartId]);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchProductById(productID));

  }, [dispatch, productID]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("viewedProducts")) || [];
    setViewedProducts(stored);
  }, []);

  // Sticky header scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const productDetailsSection = document.getElementById('product-details-section');
      if (productDetailsSection) {
        const rect = productDetailsSection.getBoundingClientRect();
        setShowStickyHeader(rect.bottom < 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (currentProduct?.length > 0) {
      const prod = currentProduct[0];
      const image = `https://smfteapi.salesmate.app/Media/Products_Images/${prod.productImage
        .split("\\")
        .pop()}`;
      const viewedItem = {
        id: prod.productID,
        name: prod.productName,
        price: prod.price,
        image,
      };

      const stored = JSON.parse(localStorage.getItem("viewedProducts")) || [];
      const updated = [
        viewedItem,
        ...stored.filter((item) => item.id !== viewedItem.id),
      ].slice(0, 4);

      localStorage.setItem("viewedProducts", JSON.stringify(updated));
      setViewedProducts(updated);
    }
  }, [currentProduct]);

  // Enhanced out-of-stock checker function
  const isOutOfStock = (product) => {
    if (!product) return false;
    
    const outOfStockIndicators = [
      "all brands",
      "products out of stock",
      "out of stock",
      "unavailable",
      "not available"
    ];
    
    // Check brandName
    if (product.brandName && 
        outOfStockIndicators.some(indicator => 
          product.brandName.toLowerCase().includes(indicator.toLowerCase())
        )) {
      return true;
    }
    
    // Check categoryName
    if (product.categoryName && 
        outOfStockIndicators.some(indicator => 
          product.categoryName.toLowerCase().includes(indicator.toLowerCase())
        )) {
      return true;
    }
    
    // Check showRoomName
    if (product.showRoomName && 
        outOfStockIndicators.some(indicator => 
          product.showRoomName.toLowerCase().includes(indicator.toLowerCase())
        )) {
      return true;
    }
    
    // Check for explicit stock status if available
    if (product.stockStatus && 
        product.stockStatus.toLowerCase() === 'out of stock') {
      return true;
    }
    
    // Check for quantity if available
    if (product.quantity !== undefined && product.quantity <= 0) {
      return true;
    }
    
    return false;
  };

  // Enhanced Add to Cart function that opens sidebar
  const handleAddToCartAndOpenSidebar = async (product) => {
    if (isOutOfStock(product)) {
      return; // Don't proceed if out of stock
    }
    
    setIsAddingToCart(true);
    try {
      await addProductToCart(product);
      // Refresh cart data after adding
      if (cartId) {
        await dispatch(getCartById(cartId));
      }
      setCartSidebarOpen(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Enhanced Add to Cart function for related products (without opening sidebar)
  const handleAddToCartOnly = async (product) => {
    if (isOutOfStock(product)) {
      return; // Don't proceed if out of stock
    }
    
    setIsAddingToCart(true);
    try {
      await addProductToCart(product);
      // Refresh cart data after adding
      if (cartId) {
        await dispatch(getCartById(cartId));
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Cart quantity handlers
  const handleQuantityChange = async (productId, quantity) => {
    if (quantity >= 1) {
      await dispatch(updateCartItem({ cartId, productId, quantity }));
      // Refresh cart data after update
      dispatch(getCartById(cartId));
    }
  };

  const handleRemoveItem = async (productId) => {
    await dispatch(deleteCartItem({ cartId, productId }));
    // Refresh cart data after removal
    dispatch(getCartById(cartId));
  };

  // Checkout handler with authentication check
  const handleCheckout = () => {
    const storedCustomer = JSON.parse(localStorage.getItem("customer"));

    if (!storedCustomer) {
      // Close sidebar first, then open auth modal
      setCartSidebarOpen(false);
      setTimeout(() => {
        setAuthModalOpen(true);
      }, 300); // Small delay to ensure sidebar closes first
      return;
    }
    // GTM event tracking
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "proceed_to_checkout",
    cartValue: cartTotal.toFixed(2),
    cartItems: cart.map(item => ({
      productId: item.productId,
      name: item.productName,
      price: item.price,
      quantity: item.quantity
    }))
  });
    localStorage.setItem("selectedCart", JSON.stringify(cart));
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

  // Helper: Get valid image URL - FIXED VERSION
  const getValidImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/150";
    
    // Handle different image path formats
    if (imagePath.includes("\\")) {
      return `https://smfteapi.salesmate.app/Media/Products_Images/${imagePath.split("\\").pop()}`;
    } else if (imagePath.includes("/")) {
      return `https://smfteapi.salesmate.app/Media/Products_Images/${imagePath.split("/").pop()}`;
    } else {
      // If it's just a filename
      return `https://smfteapi.salesmate.app/Media/Products_Images/${imagePath}`;
    }
  };

  // Render cart item image - IMPROVED VERSION
  const renderCartImage = (item) => {
    // Try multiple image path sources
    let imagePath = item.imagePath || item.productImage || item.image;
    
    if (!imagePath) {
      return (
        <img 
          src="https://via.placeholder.com/150" 
          alt="Placeholder" 
          className="w-full h-full object-cover rounded-lg" 
        />
      );
    }
    
    const imageUrl = getValidImageUrl(imagePath);
    
    return (
      <img 
        src={imageUrl} 
        alt={item.productName || "Product"} 
        className="w-full h-full object-cover rounded-lg"
        onError={(e) => {
          e.target.src = "https://via.placeholder.com/150";
        }}
      />
    );
  };

  // Calculate cart totals
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Combined loading state for cart buttons
  const isCartButtonLoading = cartLoading || isAddingToCart;

  // Handle auth modal close and potentially reopen sidebar
  const handleAuthModalClose = () => {
    setAuthModalOpen(false);
  };

  if (loading || !currentProduct?.length) {
    return <ProductDetailSkeleton />;
  }

  const product = currentProduct[0];
  const outOfStock = isOutOfStock(product);
  const imageUrl = `https://smfteapi.salesmate.app/Media/Products_Images/${product.productImage
    .split("\\")
    .pop()}`;
  const descriptionLines = product.description.split("\n").map((line, i) => (
    <p key={i} className="text-sm text-gray-700 mb-1">
      {line}
    </p>
  ));
   const productUrl = window.location.href;

  const related = products.slice(-12);

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
      {/* Sticky Header for Large Screens */}
      <div className={`fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 transition-transform duration-300 hidden lg:block ${
        showStickyHeader ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={imageUrl}
                alt={product.productName}
                className="w-12 h-12 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">
                  {product.productName}
                </h3>
                <p className="text-red-500 font-bold text-sm">
                  GH₵{formatPrice(product.price)}.00
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outlined"
                className={`font-semibold shadow-lg flex items-center gap-2 px-4 py-2 transition duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  outOfStock 
                    ? 'border-gray-400 text-gray-500 bg-gray-100' 
                    : 'border-red-600 text-red-600 hover:bg-red-50'
                }`}
                onClick={() => handleAddToCartAndOpenSidebar(product)}
                disabled={isCartButtonLoading || outOfStock}
              >
                {isCartButtonLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    Adding to cart...
                  </>
                ) : outOfStock ? (
                  <>
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    Out of Stock
                  </>
                ) : (
                  <>
                    <ShoppingCartIcon className="w-4 h-4" />
                    Add to Cart
                  </>
                )}
              </Button>

             
            </div>
          </div>
        </div>
      </div>

      {/* Main Product Details Section */}
      <div id="product-details-section" className="grid lg:grid-cols-2 gap-12">
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
          <div className="font-bold text-gray-900 text-lg md:text-xl">
            {product.productName}
          </div>
          
          <div className="flex items-center gap-4 text-red-500 bg-red-50 rounded-lg p-3 shadow-md">
            <div className="text-lg md:text-xl font-bold">
              GH₵{formatPrice(product.price)}.00
            </div>
            {product.oldPrice > 0 && (
              <div className="text-sm text-gray-400 line-through">
                GH₵ {formatPrice(product.oldPrice)}.00
              </div>
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

          {/* Enhanced Stock Status Display */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm border transition duration-200 w-max ${
            outOfStock 
              ? 'bg-red-50 text-red-800 border-red-200' 
              : 'bg-green-50 text-green-800 border-green-200 hover:shadow-md'
          }`}>
            {outOfStock ? (
              <>
                <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                <span>Out of Stock</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span>In Stock</span>
              </>
            )}
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-sm md:text-md font-bold text-gray-700 relative whitespace-nowrap mt-4 mb-3">
                  Product Description
                  <span className="absolute -bottom-1 left-0 w-16 h-1 bg-red-400 rounded-full"></span>
                </h2>
              </div>
            </div>

            <div className="bg-white p-2 max-h-72 overflow-y-auto transition-all duration-300 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100">
              <div className="space-y-4 text-gray-800 text-base leading-relaxed">
                {descriptionLines}
              </div>
            </div>
          </div>

          <div className="pt-2">
            {/* Desktop Buttons */}
<div className="hidden md:flex flex-wrap gap-4 items-center">
  <Button
    variant="outlined"
    className={`group relative flex items-center justify-center gap-2.5 px-6 py-3.5 w-full rounded-2xl font-semibold text-sm transition-all duration-300 ease-out shadow-xl shadow-red-200 hover:shadow-2xl hover:shadow-red-300 focus:outline-none focus:ring-3 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none overflow-hidden ${
      outOfStock
        ? 'bg-gray-50 text-gray-400 border-2 border-gray-200 shadow-sm shadow-gray-200 cursor-not-allowed'
        : isCartButtonLoading
        ? 'bg-red-500 text-white border-2 border-red-500 shadow-red-300'
        : 'bg-red-500 text-white border-2 border-red-500 hover:bg-red-600 hover:border-red-600 focus:ring-red-300'
    }`}
    onClick={() => handleAddToCartAndOpenSidebar(product)}
    disabled={isCartButtonLoading || outOfStock}
    aria-label={
      outOfStock 
        ? "Product out of stock" 
        : isCartButtonLoading 
        ? "Adding product to cart" 
        : "Add product to cart"
    }
  >
    {/* Background gradient animation */}
    {!outOfStock && (
      <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
    )}
    
    {/* Content */}
    <div className="relative z-10 flex items-center gap-2.5">
      {isCartButtonLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Adding to Cart...</span>
        </>
      ) : outOfStock ? (
        <>
          <ExclamationTriangleIcon className="w-5 h-5 text-gray-400 group-hover:scale-110 transition-transform duration-200" />
          <span className="font-medium">Out of Stock</span>
        </>
      ) : (
        <>
          <ShoppingCartIcon className="w-5 h-5 transition-all duration-300 group-hover:scale-110 text-white" />
          <span className="font-medium text-white transition-colors duration-300">
            Add to Cart
          </span>
        </>
      )}
    </div>
    
    {/* Success ripple effect (optional enhancement) */}
    {!outOfStock && !isCartButtonLoading && (
      <div className="absolute inset-0 bg-green-400 rounded-2xl scale-0 opacity-0 group-active:scale-100 group-active:opacity-30 transition-all duration-150" />
    )}
  </Button>
</div>

            {/* Mobile Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-xl z-50 flex items-center justify-between md:hidden">
              <div className="flex gap-2 w-full">
                <Button
  variant="outlined"
  className={`flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-2xl transition-all duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-1 ${
    outOfStock
      ? 'bg-gray-100 text-gray-500 border border-gray-300'
      : 'bg-red-100 text-red-600 border border-red-300 hover:bg-red-200 hover:border-red-400'
  }`}
  onClick={() => handleAddToCartAndOpenSidebar(product)}
  disabled={isCartButtonLoading || outOfStock}
>
  {isCartButtonLoading ? (
    <>
      <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm">Adding...</span>
    </>
  ) : outOfStock ? (
    <>
      <ExclamationTriangleIcon className="w-5 h-5" />
      <span className="text-sm">Out of Stock</span>
    </>
  ) : (
    <>
      <ShoppingCartIcon className="w-5 h-5" />
      <span className="text-sm">Add to Cart</span>
    </>
  )}
</Button>

               
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Features */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm text-gray-700 mt-2 md:mt-6">
        {[
          "Fast Shipping",
          "Quality Assurance",
          "Customer Support",
          "Secure Payment",
        ].map((title, idx) => {
          const icon = [
            <TruckIcon className="w-5 h-5 text-red-600" />,
            <ShieldCheckIcon className="w-5 h-5 text-green-600" />,
            <PhoneIcon className="w-5 h-5 text-red-400" />,
            <CreditCardIcon className="w-5 h-5 text-teal-500" />,
          ];
          const subtitle = [
            "All over Ghana",
            "certified products",
            "Dedicated support team",
            "Safe Payment Processing",
          ];

          return (
            <div
              key={idx}
              className="flex items-start gap-2 hover:bg-gray-50 p-2 rounded-lg transition"
            >
              {icon[idx]}
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-xs text-gray-500">{subtitle[idx]}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recently Viewed Products */}
      {viewedProducts.length > 0 && (
        <section className="mt-16">
          <div className="mb-6 flex items-center gap-4 flex-wrap md:flex-nowrap">
            <h2 className="text-sm md:text-xl font-bold text-gray-900 relative whitespace-nowrap">
              Recently Viewed Products
              <span className="absolute -bottom-1 left-0 w-16 h-1 bg-red-400 rounded-full" />
            </h2>
            <div className="flex-grow h-px bg-gray-300" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {viewedProducts.map((product, index) => {
              const productOutOfStock = isOutOfStock(product);
              const discount =
                product.oldPrice > 0
                  ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
                  : 0;

              const imageUrl = getValidImageUrl(product.image);

              return (
                <div
                  key={product.id || index}
                  className={`group bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden ${
                    productOutOfStock ? 'opacity-75' : ''
                  }`}
                >
                  <div className="relative overflow-hidden">
                    {productOutOfStock && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full z-10">
                        Out of Stock
                      </span>
                    )}
                    {discount > 0 && !productOutOfStock && (
                      <span className="absolute top-2 left-2 bg-red-400 text-white text-xs font-semibold px-2 py-1 rounded-full z-10 w-10 h-10 flex items-center justify-center">
                        -{discount}%
                      </span>
                    )}

                    <div
                      className="h-40 md:h-52 w-full flex items-center justify-center cursor-pointer transition-transform duration-300"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/150";
                        }}
                      />
                    </div>

                   <div
  className="absolute inset-0 hidden group-hover:flex items-center justify-center gap-3 bg-black/40 z-20 transition-all cursor-pointer"
  onClick={() => navigate(`/product/${product.id}`)}
>
                      <Tooltip content="Add to Wishlist" placement="top">
                        <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full">
                          <SolidHeartIcon className="w-5 h-5 text-white hover:text-red-400" />
                        </button>
                      </Tooltip>
                      <Tooltip content="View Details" placement="top">
                        <button
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-full"
                          onClick={() => navigate(`/product/${product.id}`)}
                        >
                            <EyeIcon className="w-5 h-5 text-white hover:text-green-400" /> 
                        </button>
                      </Tooltip>
                    
                    </div>
                  </div>

                  <div className="p-3 text-center space-y-1">
                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
                      {product.name || "Unnamed Product"}
                    </h3>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <span className="text-red-500 font-medium text-sm">
                        ₵{formatPrice(product.price)}.00
                      </span>
                      {product.oldPrice > 0 && (
                        <span className="text-xs line-through text-gray-400">
                          ₵{formatPrice(product.oldPrice)}.00
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-10">
          <div className="mb-6 flex items-center gap-4 flex-wrap md:flex-nowrap">
            <h2 className="text-sm md:text-xl font-bold text-gray-900 relative whitespace-nowrap">
              You May Also Like
              <span className="absolute -bottom-1 left-0 w-16 h-1 bg-red-400 rounded-full" />
            </h2>
            <div className="flex-grow h-px bg-gray-300" />
          </div>
          <ProductCard currentProducts={related} navigate={navigate} />
        </section>
      )}


      {/* Cart Sidebar - IMPROVED VERSION */}
      <Drawer
        placement="right"
        open={cartSidebarOpen}
        onClose={() => setCartSidebarOpen(false)}
        className="p-0"
        size={400}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <div className="flex items-center gap-2">
              <ShoppingCartIcon className="w-6 h-6 text-red-600" />
              <h2 className="text-lg font-bold text-gray-800">Shopping Cart</h2>
            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                  {totalCartItems} Item{totalCartItems !== 1 ? 's' : ''}
                </div>
              )}
              <IconButton
                variant="text"
                onClick={() => setCartSidebarOpen(false)}
                className="rounded-full"
              >
                <XMarkIcon className="w-5 h-5" />
              </IconButton>
            </div>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto">
            {cartLoadingState ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <ShoppingCartIcon className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 text-sm">Start shopping to fill it up!</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {cart.map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="bg-white border rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {renderCartImage(item)}
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
                              onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <MinusIcon className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-xs font-semibold">
                              {item.quantity || 1}
                            </span>
                            <Button
                              size="sm"
                              variant="text"
                              className="min-w-0 px-2 py-1"
                              onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                            >
                              <PlusIcon className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700 font-bold text-sm">
                              ₵{formatPrice((item.price || 0) * (item.quantity || 1))}.00
                            </span>
                            <IconButton
                              size="sm"
                              variant="text"
                              color="red"
                              className="p-1"
                              onClick={() => handleRemoveItem(item.productId)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </IconButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="border-t bg-white p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Total:</span>
                  <span className="text-lg font-bold text-red-600">
                    ₵{formatPrice(cartTotal)}.00
                  </span>
                </div>
                
                <p className="text-xs text-center text-gray-500">
                  * Taxes & shipping calculated at checkout
                </p>
                
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
      className="border-gray-300 text-gray-700 py-2 rounded-lg"
      onClick={() => navigate(`/cart/${cartId}`)}
      disabled={!cartId} // Optional: disable if cartId doesn't exist
    >
      View Cart Page
    </Button>

                </div>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onClose={handleAuthModalClose}
        onSuccess={() => {
          setAuthModalOpen(false);
          setCartSidebarOpen(true);
        }}

 />
    </div>
  );
};

export default ProductDescription;