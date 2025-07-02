import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { Image } from "antd";
import { fetchProductById, fetchProducts } from "../Redux/Slice/productSlice";
import { updateCartItem, deleteCartItem, getCartById } from '../Redux/Slice/cartSlice';
import ProductDetailSkeleton from "../Component/ProductDetailSkeleton";
import { Button, Tooltip, IconButton, Drawer } from "@material-tailwind/react";
import {
  ShoppingCartIcon,
  CheckCircleIcon,
  HeartIcon as OutlineHeartIcon,
  EyeIcon,
  TruckIcon,
  ShieldCheckIcon,
  PhoneIcon,
  CreditCardIcon,
  ShareIcon,
  TrashIcon,
  MinusIcon,
  PlusIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { FaWhatsapp } from "react-icons/fa";
import ProductCard from "../Component/ProductCard";
import useAddToCart from "../Component/Cart";
import AuthModal from "../Component/AuthModal";

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

  // Fetch cart data when component mounts or cartId changes
  useEffect(() => {
    if (cartId) {
      dispatch(getCartById(cartId));
    }
  }, [dispatch, cartId]);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchProductById(productID));
    window.scrollTo(0, 0);
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

  // Enhanced Add to Cart function that opens sidebar
  const handleAddToCartAndOpenSidebar = async (product) => {
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
  const imageUrl = `https://smfteapi.salesmate.app/Media/Products_Images/${product.productImage
    .split("\\")
    .pop()}`;
  const descriptionLines = product.description.split("\n").map((line, i) => (
    <p key={i} className="text-sm text-gray-700 mb-1">
      {line}
    </p>
  ));

  const related = products.slice(-12);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
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
                className="border border-red-600 text-red-600 font-semibold shadow-lg flex items-center gap-2 px-4 py-2 transition duration-300 hover:scale-105 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                onClick={() => handleAddToCartAndOpenSidebar(product)}
                disabled={isCartButtonLoading}
              >
                {isCartButtonLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    Adding to cart...
                  </>
                ) : (
                  <>
                    <ShoppingCartIcon className="w-4 h-4" />
                    Add to Cart
                  </>
                )}
              </Button>

              <a
                href={`https://wa.me/233XXXXXXXXX?text=Hi! I'm interested in buying the ${encodeURIComponent(
                  product?.productName
                )}. Is it currently available, and what's the price?}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-lg flex items-center gap-2 px-3 py-2 transition duration-300 hover:scale-105"
              >
                <FaWhatsapp className="w-4 h-4" />
                Chat
              </a>
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
          <div className="font-bold text-gray-700 text-lg md:text-xl">
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

          <div className="flex items-center gap-2 px-4 py-1 rounded-lg bg-green-50 text-green-800 text-sm font-semibold shadow-sm border border-green-200 hover:shadow-md transition duration-200 w-max">
            <CheckCircleIcon className="w-4 h-4 text-green-600" />
            <span>In Stock</span>
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
                className="border border-red-600 text-red-600 font-semibold shadow-lg flex items-center gap-2 px-4 py-3 transition duration-300 hover:scale-105 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                onClick={() => handleAddToCartAndOpenSidebar(product)}
                disabled={isCartButtonLoading}
              >
                {isCartButtonLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCartIcon className="w-5 h-5" />
                    Add to Cart
                  </>
                )}
              </Button>

              <a
                href={`https://wa.me/233XXXXXXXXX?text=Hi! I'm interested in buying the ${encodeURIComponent(
                  product?.productName
                )}. Is it currently available, and what's the price?}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-lg flex items-center gap-2 px-4 py-2 transition duration-300 hover:scale-105"
              >
                <FaWhatsapp className="w-5 h-5" />
                Chat with Sales
              </a>
              
              <IconButton
                onClick={() => handleShare("general")}
                className="bg-green-300 text-white rounded-full p-3 shadow-lg transition duration-300 hover:scale-110"
              >
                <ShareIcon className="w-5 h-5" />
              </IconButton>
            </div>

            {/* Mobile Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-xl z-50 flex items-center justify-between md:hidden">
              <div className="flex gap-3 w-full">
                <Button
                  variant="outlined"
                  fullWidth
                  className="border border-red-300 bg-red-100 text-red-600 font-semibold rounded-xl flex items-center justify-center gap-2 py-3 transition duration-300 hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  onClick={() => handleAddToCartAndOpenSidebar(product)}
                  disabled={isCartButtonLoading}
                >
                  {isCartButtonLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-red-600 border-t-transparent font-bold rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCartIcon className="w-5 h-5" />
                      Add to Cart
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
              const discount =
                product.oldPrice > 0
                  ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
                  : 0;

              const imageUrl = getValidImageUrl(product.image);

              return (
                <div
                  key={product.id || index}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                >
                  <div className="relative overflow-hidden">
                    {discount > 0 && (
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

                    <div className="absolute inset-0 hidden group-hover:flex items-center justify-center gap-3 bg-black/40 z-20 transition-all">
                      <Tooltip content="Add to Wishlist" placement="top">
                        <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full">
                          <OutlineHeartIcon className="w-5 h-5 text-white hover:text-red-400" />
                        </button>
                      </Tooltip>
                      <Tooltip content="View Details" placement="top">
                        <button
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-full"
                          onClick={() => navigate(`/product/${product.id}`)}
                        >
                          <EyeIcon className="w-5 h-5 text-white hover:text-yellow-400" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Add to Cart" placement="top">
                        <button
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleAddToCartOnly(product)}
                          disabled={isCartButtonLoading}
                        >
                          {isCartButtonLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <ShoppingCartIcon className="w-5 h-5 text-white hover:text-red-400" />
                          )}
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
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};

export default ProductDescription;