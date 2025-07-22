import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPaginatedProducts } from '../Redux/Slice/productSlice';
import { addToWishlist, removeFromWishlist } from '../Redux/Slice/wishlistSlice';
import { Empty } from 'antd';
import { Helmet } from 'react-helmet';
import ProductDetailModal from '../Component/ProductDetailModal';
import useAddToCart from '../Component/Cart';
import {
  HeartIcon as OutlineHeartIcon,
  HeartIcon as SolidHeartIcon,
  ShoppingCartIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon
} from "@heroicons/react/24/solid";
import { Tooltip } from "@material-tailwind/react";

// Custom Notification Component
const Notification = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
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
        <button onClick={onClose} className="ml-auto text-white/80 hover:text-white">×</button>
      </div>
    </div>
  );
};

// Skeleton Component - matching NewArrivals style
const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-2xl shadow-md p-4 space-y-4">
    <div className="h-40 bg-gray-200 rounded-xl"></div>
    <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
  </div>
);

const ProductsPage = () => {
  const dispatch = useDispatch();
  const { products = [], loading } = useSelector((state) => state.products || {});
  const wishlist = useSelector((state) => state.wishlist.items);
  const { addProductToCart, loading: cartLoading } = useAddToCart();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState({
    message: '',
    type: 'success',
    isVisible: false
  });

  const itemsPerPage = 10;
  const observerRef = useRef(null);

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
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setLoadingMore(true);
    dispatch(fetchPaginatedProducts({ pageNumber: currentPage, pageSize: itemsPerPage })).then((response) => {
      if (response.payload) {
        setAllProducts((prev) => [...prev, ...response.payload]);
      }
      setLoadingMore(false);
    });
  }, [dispatch, currentPage]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => product.status !== '0');
  }, [allProducts]);

  const handleProductClick = (productId) => {
    setSelectedProductId(productId);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setSelectedProductId(null);
    setIsModalVisible(false);
  };

  useEffect(() => {
    if (loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { root: null, rootMargin: '100px', threshold: 0.1 }
    );

    if (observerRef.current) observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [loadingMore]);

  // Format price with GHS currency
  const formatPrice = (price) =>
    new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(price || 0);

  // Image formatter
  const getValidImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/150";
    return imagePath.includes("\\")
      ? `https://smfteapi.salesmate.app/Media/Products_Images/${imagePath.split("\\").pop()}`
      : imagePath;
  };

  const isInWishlist = (id) => wishlist.some((item) => item.id === id);

  const handleWishlistToggle = async (product) => {
    try {
      const id = product.productID;
      if (isInWishlist(id)) {
        dispatch(removeFromWishlist(id));
        showNotification("Removed from wishlist");
      } else {
        dispatch(addToWishlist({ ...product, id }));
        showNotification("Added to wishlist");
      }
    } catch {
      showNotification("Failed to update wishlist", "error");
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await addProductToCart(product);
      showNotification("Added to cart");
    } catch {
      showNotification("Failed to add to cart", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Helmet>
        <title>Shop Phones & Gadgets | Best Prices at Franko Trading</title>
        <meta name="description" content="Explore the latest smartphones, laptops, and accessories at unbeatable prices. Shop online at Franko Trading today!" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Shop Phones & Gadgets | Best Prices at Franko Trading" />
      </Helmet>

      {/* Notification Component */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="mx-auto px-4 md:px-24 py-4">
        {/* Enhanced Header */}
        <div className="mb-6 flex items-center gap-4 flex-wrap md:flex-nowrap">
          <h2 className="text-sm md:text-xl font-bold text-gray-900 relative whitespace-nowrap">
            All Products
            <span className="absolute -bottom-1 left-0 w-16 h-1 bg-red-400 rounded-full" />
          </h2>
          <div className="flex-grow h-px bg-gray-300" />
          <div className="flex items-center gap-2 text-gray-500">
            <SparklesIcon className="w-5 h-5" />
            <span className="text-sm">Discover amazing deals</span>
          </div>
        </div>

        {/* Products Grid */}
        {loading && allProducts.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 15 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredProducts.map((product) => {
              const {
                productID,
                productName,
                productImage,
                price,
                oldPrice,
                stock,
              } = product;

              const imageUrl = getValidImageUrl(productImage);
              const isOnSale = oldPrice > 0 && oldPrice > price;
              const inWishlist = isInWishlist(productID);

              return (
                <div
                  key={productID}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden"
                >
                  <div className="relative overflow-hidden">
                    {isOnSale && (
                      <span className="absolute top-2 left-2 bg-red-400 text-white text-xs font-semibold w-10 h-10 rounded-full z-10 flex items-center justify-center">
                        SALE
                      </span>
                    )}

                    <div
                      className="h-40 md:h-52 flex items-center justify-center cursor-pointer"
                      onClick={() => handleProductClick(productID)}
                    >
                      <img
                        src={imageUrl}
                        alt={productName}
                        className="h-full object-contain transition-transform group-hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/150";
                        }}
                      />
                    </div>

                    <div className="absolute inset-0 hidden group-hover:flex items-center justify-center gap-3 bg-black/40 z-20 cursor-pointer"
                   onClick={(e) => {
                            e.stopPropagation();
                            handleProductClick(productID);
                          }}  >
                      {/* Wishlist */}
                      <Tooltip content={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWishlistToggle(product);
                          }}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-full"
                        >
                          {inWishlist ? (
                            <SolidHeartIcon className="w-5 h-5 text-red-500" />
                          ) : (
                            <OutlineHeartIcon className="w-5 h-5 text-white hover:text-red-400" />
                          )}
                        </button>
                      </Tooltip>

                      {/* View */}
                      <Tooltip content="View Details">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductClick(productID);
                          }}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-full"
                        >
                          <EyeIcon className="w-5 h-5 text-white hover:text-green-400" />
                        </button>
                      </Tooltip>

                      {/* Cart */}
                      <Tooltip content={stock === 0 ? "Out of Stock" : "Add to Cart"}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={cartLoading || stock === 0}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-full disabled:opacity-50"
                        >
                          <ShoppingCartIcon className="w-5 h-5 text-white hover:text-red-400" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-3 text-center space-y-1">
                    <h3 className="text-sm md:text-sm text-gray-900 line-clamp-2">
                      {productName || "Unnamed Product"}
                    </h3>
                     <div className="flex flex-col items-center justify-center gap-1 mt-1 md:flex-row">
    <span className="text-red-500 font-medium text-sm">
      {formatPrice(price)}
    </span>
    {oldPrice > 0 && (
      <span className="text-xs line-through text-gray-400">
        {formatPrice(oldPrice)}
      </span>
    )}
  </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-6xl mb-4">🛍️</div>
            <Empty 
              description={
                <span className="text-gray-500 text-lg">
                  No products found. Check back later for amazing deals!
                </span>
              } 
            />
          </div>
        )}

        {/* Observer Element */}
        <div ref={observerRef} className="h-10" />

        {/* Loading More Products */}
        {loadingMore && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-8">
            {Array.from({ length: 10 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProductId && (
        <ProductDetailModal
          productID={selectedProductId}
          isModalVisible={isModalVisible}
          onClose={closeModal}
        />
      )}

      {/* Custom Styles */}
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ProductsPage;