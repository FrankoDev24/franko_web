import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { Image } from "antd";
import { fetchProductById, fetchProducts } from "../Redux/Slice/productSlice";
import { updateCartItem, deleteCartItem, getCartById } from '../Redux/Slice/cartSlice';
import ProductDetailSkeleton from "../Component/ProductDetailSkeleton";
import { Button, Tooltip, IconButton, Checkbox, Dialog, DialogHeader, DialogBody, DialogFooter } from "@material-tailwind/react";
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
  XMarkIcon,
  ShoppingBagIcon
} from "@heroicons/react/24/outline";
import { FaWhatsapp } from "react-icons/fa";
import ProductCard from "../Component/ProductCard";
import useAddToCart from "../Component/Cart";
import { Divider } from 'antd';
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
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  // Redux selectors
  const { currentProduct, products, loading } = useSelector((state) => state.products);
  const { cart, loading: cartLoadingState, error, cartId } = useSelector((state) => state.cart);
  const [viewedProducts, setViewedProducts] = useState([]);

  // Fetch cart data when component mounts or cartId changes
  useEffect(() => {
    if (cartId) {
      dispatch(getCartById(cartId));
    }
  }, [dispatch, cartId]);

  // Reset selection when cart changes
  useEffect(() => {
    setSelectedItems([]);
    setSelectAll(false);
  }, [cart]);

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

  // Cart sidebar functions
  const toggleSelectAll = () => {
    const allSelected = !selectAll;
    setSelectAll(allSelected);
    setSelectedItems(allSelected ? cart.map((item) => item.productId) : []);
  };

  const toggleItemSelection = (productId) => {
    setSelectedItems((prev) => {
      const newSelection = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      
      setSelectAll(newSelection.length === cart.length && cart.length > 0);
      return newSelection;
    });
  };

  const handleCheckout = () => {
    const storedCustomer = JSON.parse(localStorage.getItem("customer"));
  
    if (!storedCustomer) {
      setAuthModalOpen(true);
      return;
    }
  
    localStorage.setItem("selectedCart", JSON.stringify(cart));
    navigate("/checkout");
  };

  const handleQuantityChange = (productId, quantity) => {
    if (quantity >= 1) {
      dispatch(updateCartItem({ cartId, productId, quantity }));
    }
  };

  const handleRemoveItem = (productId) => {
    dispatch(deleteCartItem({ cartId, productId }));
    setSelectedItems(prev => prev.filter(id => id !== productId));
  };

  const handleBatchDelete = () => {
    selectedItems.forEach((id) => {
      dispatch(deleteCartItem({ cartId, productId: id }));
    });
    setSelectedItems([]);
    setSelectAll(false);
    setOpenModal(false);
  };

  // Calculate totals for the entire cart
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Enhanced add to cart handler that opens sidebar
  const handleAddToCart = async (product) => {
    await addProductToCart(product);
    setCartSidebarOpen(true);
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
    return imagePath.includes("\\")
      ? `https://smfteapi.salesmate.app/Media/Products_Images/${imagePath.split("\\").pop()}`
      : imagePath;
  };

  const renderCartImage = (imagePath) => {
    if (!imagePath) {
      return <img src="https://via.placeholder.com/150" alt="Placeholder" className="w-full h-full object-cover rounded-lg" />;
    }
    const backendBaseURL = "https://smfteapi.salesmate.app";
    const imageUrl = `${backendBaseURL}/Media/Products_Images/${imagePath.split("\\").pop()}`;
    return <img src={imageUrl} alt="Product" className="w-full h-full object-cover rounded-lg" />;
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
                variant="filled"
                className="bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg flex items-center gap-2 px-4 py-2 transition duration-300 hover:scale-105"
                onClick={() => handleAddToCart(product)}
                disabled={cartLoading}
              >
                <ShoppingCartIcon className="w-4 h-4" />
                Add to Cart
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
              <h2 className="text-sm md:text-md font-bold text-gray-700 relative whitespace-nowrap mt-4 mb-3">
                Product Description
                <span className="absolute -bottom-1 left-0 w-16 h-1 bg-red-400 rounded-full"></span>
              </h2>
            </div>

            <div className="bg-white p-2 max-h-72 overflow-y-auto transition-all duration-300 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100">
              <div className="space-y-4 text-gray-800 text-base leading-relaxed">
                {descriptionLines}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            <div className="hidden md:flex flex-wrap gap-4 items-center">
              <Button
                variant="filled"
                className="bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg flex items-center gap-2 px-4 py-3 transition duration-300 hover:scale-105"
                onClick={() => handleAddToCart(product)}
                disabled={cartLoading}
              >
                <ShoppingCartIcon className="w-5 h-5" />
                Add to Cart
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
                  variant="filled"
                  fullWidth
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 py-3 transition duration-300 hover:scale-105 shadow-md"
                  onClick={() => handleAddToCart(product)}
                  disabled={cartLoading}
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
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
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-full"
                          onClick={() => addProductToCart(product)}
                          disabled={cartLoading}
                        >
                          <ShoppingCartIcon className="w-5 h-5 text-white hover:text-red-400" />
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

      {/* Cart Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform transition-transform duration-300 ease-in-out ${
        cartSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex h-full flex-col bg-white shadow-2xl">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-4 py-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <ShoppingBagIcon className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Shopping Cart ({totalCartItems})
              </h2>
            </div>
            <button
              onClick={() => setCartSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto">
            {cartLoadingState ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <ShoppingBagIcon className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 mb-4">Add some products to get started!</p>
                <Button
                  onClick={() => {
                    setCartSidebarOpen(false);
                    navigate("/products");
                  }}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <>
                {/* Cart Controls */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <Checkbox
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      label={<span className="text-sm font-medium">Select All</span>}
                      ripple={false}
                    />
                    {selectedItems.length > 0 && (
                      <Button
                        variant="text"
                        color="red"
                        size="sm"
                        onClick={() => setOpenModal(true)}
                        className="flex items-center gap-1"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1">
                  {cart.map((item, index) => (
                    <div key={item.productId} className="p-4 border-b">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedItems.includes(item.productId)}
                          onChange={() => toggleItemSelection(item.productId)}
                          ripple={false}
                        />
                        
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {renderCartImage(item.imagePath)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                            {item.productName}
                          </h4>
                          <p className="text-red-500 font-bold text-sm mb-2">
                            ₵{item.price}.00
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center bg-gray-50 rounded-lg border">
                              <Button
                                size="sm"
                                variant="text"
                                className="min-w-0 px-2 py-1"
                                onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <MinusIcon className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">
                                {item.quantity}
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
                              <span className="text-sm font-bold">
                                ₵{(item.price * item.quantity).toFixed(2)}
                              </span>
                              <Button
                                size="sm"
                                variant="text"
                                color="red"
                                className="min-w-0 p-1"
                                onClick={() => handleRemoveItem(item.productId)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-red-600">
                  ₵{cartTotal.toFixed(2)}
                </span>
              </div>
              
              <div className="space-y-2">
                <Button
                  fullWidth
                  onClick={handleCheckout}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3"
                >
                  Checkout
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate("/cart")}
                  className="border-gray-300 text-gray-700"
                >
                  View Full Cart
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Backdrop */}
      {cartSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setCartSidebarOpen(false)}
        />
      )}

      {/* Confirm Delete Modal */}
      <Dialog open={openModal} handler={setOpenModal} className="bg-white rounded-2xl">
        <DialogHeader className="text-gray-800">
          <div className="flex items-center gap-2">
            <TrashIcon className="w-6 h-6 text-red-500" />
            Confirm Deletion
          </div>
        </DialogHeader>
        <DialogBody className="text-gray-600">
          Are you sure you want to remove {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} from your cart? This action cannot be undone.
        </DialogBody>
        <DialogFooter className="space-x-2">
          <Button 
            variant="text" 
            onClick={() => setOpenModal(false)}
            className="text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button 
            color="red" 
            onClick={handleBatchDelete}
            className="bg-red-500 hover:bg-red-600"
          >
            Remove Items
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};

export default ProductDescription;