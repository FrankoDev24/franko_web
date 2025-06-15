import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchProductById } from "../Redux/Slice/productSlice";
import { Button, Modal, message, InputNumber } from "antd";
import { ShoppingBagIcon, ShoppingCartIcon, HeartIcon, ShareIcon, TruckIcon, ShieldCheckIcon, ClockIcon,CheckCircleIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { Helmet } from "react-helmet";
import AuthModal from "../Component/AuthModal"
import useAddToCart from "./Cart";

// Custom Notification Component
const Notification = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const Icon = type === 'success' ? CheckCircleIcon : XCircleIcon;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[300px]`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-auto text-white/80 hover:text-white"
        >
          ×
        </button>
      </div>
    </div>
  );
};

const formatPrice = (price) => price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const ProductDetailModal = ({ productID, isModalVisible, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentProduct = useSelector((state) => state.products.currentProduct || []);
  const { addProductToCart, loading: cartLoading } = useAddToCart();

  const [isBuying, setIsBuying] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  // Notification state
  const [notification, setNotification] = useState({
    message: '',
    type: 'success', // 'success' or 'error'
    isVisible: false
  });

  const showNotification = (message, type = 'success') => {
    setNotification({
      message,
      type,
      isVisible: true
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    if (isModalVisible && productID) {
      dispatch(fetchProductById(productID));
    }
  }, [dispatch, productID, isModalVisible]);

  const handleBuyNow = () => {
    if (!currentProduct.length) return;

    const storedCustomer = JSON.parse(localStorage.getItem("customer"));

    if (!storedCustomer) {
      setAuthModalOpen(true);
      return;
    }

    setIsBuying(true);

    const product = currentProduct[0];
    const selectedCart = [{
      productId: product.productID,
      productName: product.productName,
      price: product.price,
      total: product.price * quantity,
      quantity: quantity,
      imagePath: product.productImage || "",
    }];

    localStorage.setItem("selectedCart", JSON.stringify(selectedCart));
    
    onClose();
    navigate("/checkout");
    
    setIsBuying(false);
  };

  const handleAddToCart = async () => {
    if (!currentProduct.length) return;

    const storedCustomer = JSON.parse(localStorage.getItem("customer"));

    if (!storedCustomer) {
      setAuthModalOpen(true);
      return;
    }

    try {
      const product = currentProduct[0];
      // Use the same cart logic as ProductCard
      await addProductToCart({
        ...product,
        quantity: quantity
      });
      
      // Show success notification
      showNotification(`${quantity} item(s) added to cart successfully!`, "success");
    } catch (error) {
      console.error("Error adding to cart:", error);
      showNotification("Failed to add item to cart. Please try again.", "error");
    }
  };

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    message.success(isFavorite ? "Removed from favorites" : "Added to favorites");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.productName,
        text: `Check out this amazing product: ${product.productName}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      message.success("Product link copied to clipboard!");
    }
  };

  if (!currentProduct || !currentProduct.length) {
    return (
      <Modal
        visible={isModalVisible}
        onCancel={onClose}
        footer={null}
        width="95%"
        centered
        className="rounded-lg"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold text-gray-700">Loading Product...</h2>
          </div>
        </div>
      </Modal>
    );
  }

  const product = currentProduct[0];
  const backendBaseURL = "https://smfteapi.salesmate.app";
  const imageUrl = `${backendBaseURL}/Media/Products_Images/${product.productImage?.split("\\").pop()}`;

  return (
    <>
      {/* Notification Component */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <Modal
        visible={isModalVisible}
        onCancel={onClose}
        footer={null}
        width="95%"
        centered
        bodyStyle={{
          maxHeight: "90vh",
          overflow: "hidden",
          padding: 0,
        }}
        className="rounded-lg product-modal"
        style={{ maxWidth: "1200px" }}
      >
        <Helmet>
          <meta
            name="description"
            content={`Buy ${product.productName} for ₵${formatPrice(product.price)}. Check out this amazing product for the best price!`}
          />
          <title>{product.productName} - Best Price Online</title>
        </Helmet>

        <div className="bg-white rounded-lg overflow-hidden">
        

          <div className="flex flex-col lg:flex-row max-h-[calc(90vh-140px)] overflow-hidden">
            {/* Image Section */}
            <div className="flex-1 p-6flex items-center justify-center">
              <div className="relative group">
                <img
                  src={imageUrl}
                  alt={product.productName}
                  className="rounded-xl shadow-xl w-full object-contain max-h-[400px] lg:max-h-[500px] transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0  rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            {/* Product Info Section */}
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="space-y-2">
                {/* Product Name and Price */}
                <div>
                  <h1 className="text-md lg:text-2xl font-bold mb-2 text-gray-900 leading-tight">
                    {product.productName}
                  </h1>
                  <div className="flex items-baseline gap-3 text-red-500 bg-red-50 p-2 rounded-lg shadow-sm">
                    <span className="text-sm lg:text-xl font-bold">
                      ₵{formatPrice(product.price)}.00
                    </span>
                    <span className="text-xs md:tex-sm text-gray-400 line-through">
                      ₵{formatPrice(Math.round(product.price * 1.2))}.00
                    </span>
                    
                  </div>
                </div>

                {/* Stock and Features */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-800 text-sm font-medium border border-green-200">
                    <ShieldCheckIcon className="w-4 h-4" />
                    <span>In Stock</span>
                  </div>
                 
                </div>

                {/* Description */}
                <div>
                <h2 className="text-sm md:text-md font-bold text-gray-700 relative whitespace-nowrap mt-4 mb-3">
                  Product Description
                  <span className="absolute -bottom-1 left-0 w-16 h-1 bg-red-400 rounded-full "></span>
                </h2>
                             <div className="bg-white p-2 max-h-72 overflow-y-auto  transition-all duration-300 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100">
                    {product.description?.split("\n").map((line, idx) => (
                      <p key={idx} className="text-gray-700 mb-2 leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Fixed Bottom Action Bar */}
          <div className="border-t p-4 shadow-lg">
            <div className="flex flex-row gap-4 max-w-md mx-auto">
              <button
                disabled={cartLoading}
                onClick={handleAddToCart}
                className="group flex-1 h-10 md:h-12 px-4 text-sm md:text-md font-semibold border-2 border-red-500 text-red-600 bg-white hover:bg-red-50 hover:border-red-600 hover:text-red-700 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 flex items-center justify-center   disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {cartLoading ? (
                  <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ShoppingCartIcon className="w-6 h-6 transition-transform group-hover:scale-110" />
                )}
                <span>{cartLoading ? 'Adding...' : 'Add to Cart'}</span>
              </button>
              
              <button
                disabled={isBuying}
                onClick={handleBuyNow}
                className="group flex-1 h-10 md:h-12 px-4 text-sm md:text-md font-semibold text-white bg-gradient-to-r from-green-300 via-green-400 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                {isBuying ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ShoppingBagIcon className="w-6 h-6 transition-transform group-hover:scale-110 relative z-10" />
                )}
                <span className="relative z-10">{isBuying ? 'Processing...' : 'Buy Now'}</span>
              </button>
            </div>
          
          </div>
        </div>
      </Modal>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        .product-modal .ant-modal-content {
          border-radius: 12px;
          overflow: hidden;
        }
      `}</style>
    </>
  );
};

export default ProductDetailModal;