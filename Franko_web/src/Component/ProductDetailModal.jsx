// Enhanced ProductDetailModal with improved UI design and sticky cart button
import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductById } from "../Redux/Slice/productSlice";
import { CheckCircleIcon, ShoppingCartIcon, HeartIcon, ShareIcon, StarIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { Helmet } from "react-helmet";
import useAddToCart from "./Cart";
import AuthModal from "../Component/AuthModal";

const formatPrice = (price) => price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const Badge = ({ icon: Icon, text, variant = "success" }) => {
  const variants = {
    success: "bg-green-50 text-green-700 border-green-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200"
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${variants[variant]}`}>
      <Icon className="w-4 h-4" />
      {text}
    </div>
  );
};

const ProductDetailModal = ({ productID, isModalVisible, onClose }) => {
  const dispatch = useDispatch();
  const { addProductToCart, loading: cartLoading } = useAddToCart();
  const product = useSelector((state) => state.products.currentProduct?.[0]);

  const [quantity, setQuantity] = useState(1);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (productID && isModalVisible) {
      dispatch(fetchProductById(productID));
    }
  }, [dispatch, productID, isModalVisible]);

  const handleAddToCart = async () => {
    try {
      await addProductToCart({ ...product, quantity });
      onClose(); // Close modal after successful add to cart
    } catch {
      alert("Failed to add to cart");
    }
  };

  const handleShare = async () => {
    const productUrl = window.location.href;
    const shareData = {
      title: product.productName,
      text: `Check out this product: ${product.productName} - ₵${formatPrice(product.price)}.00`,
      url: productUrl
    };

    try {
      // Use Web Share API if available (mobile devices)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        
        // Show success feedback
        const button = event.currentTarget;
        const originalContent = button.innerHTML;
        button.innerHTML = `<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>`;
        button.classList.add('bg-green-100');
        
        setTimeout(() => {
          button.innerHTML = originalContent;
          button.classList.remove('bg-green-100');
        }, 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: Create a simple share text
      const shareText = `${product.productName} - ₵${formatPrice(product.price)}.00\n${window.location.href}`;
      prompt('Copy this link to share:', shareText);
    }
  };

  const handleQuantityChange = (action) => {
    if (action === 'increment') {
      setQuantity(prev => prev + 1);
    } else if (action === 'decrement' && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  if (!product) {
    return (
      <Modal 
        open={isModalVisible} 
        onCancel={onClose} 
        footer={null} 
        centered 
        width="95%"
        style={{ maxWidth: '1200px' }}
        className="product-modal"
      >
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 mx-auto border-3 border-red-500 border-t-transparent rounded-full mb-6"></div>
            <p className="text-gray-600 text-lg">Loading product details...</p>
          </div>
        </div>
      </Modal>
    );
  }

  const imageUrl = `https://smfteapi.salesmate.app/Media/Products_Images/${product.productImage?.split("\\").pop()}`;

  return (
    <>
      <Modal
        open={isModalVisible}
        onCancel={onClose}
        footer={null}
        centered
        width="95%"
        style={{ maxWidth: '1200px' }}
        bodyStyle={{ padding: 0, height: "90vh", display: "flex", flexDirection: "column" }}
        className="product-modal"
        destroyOnClose
      >
        <Helmet>
          <title>{product.productName} - ₵{formatPrice(product.price)}</title>
          <meta name="description" content={`Buy ${product.productName} for ₵${formatPrice(product.price)}.`} />
        </Helmet>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
          {/* Image Section */}
          <div className="w-full lg:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center min-h-[300px] lg:min-h-full relative">
            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button 
                onClick={() => setIsFavorite(!isFavorite)}
                className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-200"
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorite ? (
                  <HeartSolidIcon className="w-5 h-5 text-red-500" />
                ) : (
                  <HeartIcon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <button 
                onClick={handleShare}
                className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-200"
                title="Share product"
              >
                <ShareIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="relative group">
              <img
                src={imageUrl}
                alt={product.productName}
                className="w-full max-w-md h-auto max-h-[350px] lg:max-h-[500px] object-contain rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Content Section */}
          <div className="w-full lg:w-1/2 flex flex-col bg-white">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 lg:p-8 space-y-6 pb-32"> {/* Added bottom padding for sticky button */}
                
                {/* Product Header */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h1 className="text-lg lg:text-2xl font-bold text-gray-900 leading-tight mb-2">
                        {product.productName}
                      </h1>
                      
                     
                    </div>
                  </div>

                  {/* Price Section */}
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-2 border border-red-100">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl lg:text-2xl font-bold text-red-600">
                        ₵{formatPrice(product.price)}.00
                      </span>
                    
                      {/* <span className="text-sm text-gray-500 line-through ml-2">₵{formatPrice(product.price * 1.2)}.00</span> */}
                    </div>
                   
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge icon={CheckCircleIcon} text="In Stock" variant="success" />
                    <Badge icon={CheckCircleIcon} text="Fast Delivery" variant="success" />
                  </div>
                </div>

                {/* Quantity Selector */}
               
                {/* Description Section */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800">Product Details</h3>
                  <div className=" rounded-xl p-4">
                    <div className="text-gray-700 text-sm lg:text-base leading-relaxed whitespace-pre-line">
                      {product.description || "No description available for this product."}
                    </div>
                  </div>
                </div>
                
              </div>
            </div>

            {/* Sticky Add to Cart Section */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 lg:p-6 shadow-lg">
              <div className="flex flex-col gap-3">
                {/* Price Summary */}
               
                {/* Action Buttons */}
                <div className="flex gap-3">
                 
                  <button
                    onClick={handleAddToCart}
                    disabled={cartLoading}
                    className="flex-1 h-12 lg:h-14 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {cartLoading ? (
                      <>
                        <div className="animate-spin border-2 border-white/30 border-t-white rounded-full h-4 w-4" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingCartIcon className="w-5 h-5" />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};

export default ProductDetailModal;