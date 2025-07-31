import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByShowroom } from "../Redux/Slice/productSlice";
import { fetchShowrooms } from "../Redux/Slice/showRoomSlice";
import { Card, Typography } from "antd";
import { 
  ShoppingCartOutlined,
  FireOutlined,
  ArrowRightOutlined
} from "@ant-design/icons";
import { 
  EyeIcon, 
  SparklesIcon
} from "@heroicons/react/24/outline";
import useAddToCart from "../Component/Cart";
import gif from "../assets/no.gif";

const { Title, Text } = Typography;

const CashbackComponent = ({ showInHomePage = false, maxItems = 10 }) => {
  const showRoomID = '67f53c84-0257-4719-a170-ff62e3d707f1';
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { productsByShowroom = {}, loading, showroom } = useSelector(
    (state) => state.products
  );

  // Cart hook
  const { addProductToCart, loading: cartLoading } = useAddToCart();
  const [addingToCart, setAddingToCart] = useState({});

  // Carousel State
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const intervalRef = useRef(null);

  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    dispatch(fetchProductsByShowroom(showRoomID));
    dispatch(fetchShowrooms());
  }, [dispatch]);

  // Update items per page based on screen size
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      if (showInHomePage) {
        setItemsPerPage(width < 768 ? 2 : width < 1024 ? 3 : 4);
      } else {
        setItemsPerPage(width < 768 ? 2 : 5);
      }
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, [showInHomePage]);

  // Get products with cashback deals (sort by newest and filter available ones)
  const cashbackProducts = (productsByShowroom[showRoomID] || [])
    .filter(product => {
      const soldOut = product.stock === 0;
      const isAllBrands = product.brandName === "All brands";
      return !soldOut && !isAllBrands; // Only show available products
    })
    .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
    .slice(0, maxItems);

  const totalPages = Math.ceil(cashbackProducts.length / itemsPerPage);
  const currentProducts = cashbackProducts.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  );

  // Auto-slide effect
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    if (totalPages > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentPage((prev) => (prev + 1) % totalPages);
      }, 6000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [totalPages, currentPage, itemsPerPage]);

  // Countdown timer effect - ends July 10th at 11:59 PM
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const promoEndDate = new Date('2025-07-10T23:59:59');
      const difference = promoEndDate - now;

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      } else {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Helper functions
  const getValidImageUrl = (imagePath) => {
    if (!imagePath) return '/api/placeholder/300/300';
    return `https://smfteapi.salesmate.app/Media/Products_Images/${imagePath.split("\\").pop()}`;
  };

  const handleAddToCart = async (product) => {
    setAddingToCart(prev => ({ ...prev, [product.productID]: true }));
    
    try {
      await addProductToCart(product);
    } finally {
      setAddingToCart(prev => ({ ...prev, [product.productID]: false }));
    }
  };

  const handleProductClick = (productID, isUnavailable) => {
    if (!isUnavailable) {
      navigate(`/product/${productID}`);
    }
  };

  const handleViewAll = () => {
    navigate('/cashback-deals');
  };

  // Format price with commas
  const formatPrice = (price) => `₵${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  // Calculate discount percentage
  const calculateDiscount = (oldPrice, price) => {
    if (oldPrice > price) {
      return Math.round(((oldPrice - price) / oldPrice) * 100);
    }
    return 0;
  };

  // Check if promo has ended
  const promoEnded = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (loading) {
    return (
      <div className="w-full space-y-6">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-32 bg-gradient-to-r from-orange-200 to-red-200 rounded-3xl mb-6"></div>
        </div>
        
        {/* Products Grid Skeleton */}
        <div className={`grid gap-4 md:gap-6 ${
          showInHomePage 
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' 
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
        }`}>
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <Card key={index} className="animate-pulse shadow-lg rounded-2xl border-2 border-gray-200">
              <div className="h-40 md:h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-2xl" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded w-full mt-3" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (cashbackProducts.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl shadow-lg border-2 border-orange-200 p-8">
        <div className="flex flex-col justify-center items-center text-center space-y-6">
          <div className="relative">
            <img src={gif} alt="No cashback deals" className="max-h-32 md:max-h-48 opacity-80" />
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white p-2 rounded-full">
              <FireOutlined className="text-xl" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              No Cashback Deals Available
            </h3>
            <p className="text-gray-600 max-w-md text-sm md:text-base">
              All cashback deals are currently sold out! Check back soon for more amazing deals.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 md:px-24 py-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full opacity-5 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-red-400 to-orange-400 rounded-full opacity-10 animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-18 h-18 bg-gradient-to-r from-yellow-400 to-red-400 rounded-full opacity-5 animate-pulse"></div>
      </div>

      {/* Enhanced Header Section */}
      <div className="relative mb-6">
        <div className="bg-gradient-to-r from-orange-500 via-yellow-700 to-yellow-500 text-white rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-yellow-300 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-8 h-8 border-2 border-white rounded-full animate-ping"></div>
            <div className="absolute top-8 right-8 w-6 h-6 border-2 border-white rounded-full animate-pulse"></div>
            <div className="absolute bottom-4 left-8 w-4 h-4 border-2 border-white rounded-full animate-bounce"></div>
            <div className="absolute bottom-8 right-4 w-5 h-5 border-2 border-white rounded-full animate-ping"></div>
          </div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left Side - Title and Description */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <SparklesIcon className="w-6 h-6 text-yellow-200" />
                  </div>
                  <div className="flex items-center gap-2">
                    <FireOutlined className="text-xl md:text-3xl animate-bounce" />
                    <h2 className="text-2xl md:text-3xl font-black">CASHBACK PROMO!</h2>
                    <FireOutlined className="text-xl md:text-3xl animate-bounce" />
                  </div>
                </div>
                
                <p className="text-sm md:text-base text-black opacity-90">
                  Limited time offer • While stocks last 
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Header with View All */}
      <div className="mb-6 flex items-center gap-4 flex-wrap md:flex-nowrap">
        <h2 className="text-sm md:text-lg font-bold text-gray-900 relative whitespace-nowrap">
          💰 Cashback Deals | Best Offers
          <span className="absolute -bottom-1 left-0 w-16 h-1 bg-gradient-to-r from-orange-400 to-red-400 rounded-full" />
        </h2>
        <div className="flex-grow h-px bg-gray-300" />
        
        {/* View All Button */}
        {cashbackProducts.length > 0 && (
          <button
            onClick={handleViewAll}
            className="flex items-center gap-1 text-orange-500 hover:text-red-600 transition-colors duration-300"
          >
            <span className="text-sm font-medium">View All</span>
            <ArrowRightOutlined className="text-sm transition-transform duration-300 hover:translate-x-1" />
          </button>
        )}
      </div>

      {/* Products Carousel Grid */}
      <div className={`grid gap-4 md:gap-6 ${
        showInHomePage 
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' 
          : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
      }`}>
        {(loading || currentProducts.length === 0
          ? [...Array(itemsPerPage)]
          : currentProducts
        ).map((product, idx) => {
          if (loading || !product) {
            return (
              <Card key={idx} className="animate-pulse shadow-lg rounded-2xl border-2 border-gray-200">
                <div className="h-40 md:h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-2xl" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-8 bg-gray-200 rounded w-full mt-3" />
                </div>
              </Card>
            );
          }

          const discount = calculateDiscount(product.oldPrice, product.price);
          const isAddingToCart = addingToCart[product.productID];
          
          return (
            <div
              key={product.productID}
              className="group bg-white rounded-2xl shadow-lg overflow-hidden relative transition-all duration-300 border-2 border-yellow-200 "
              onClick={() => handleProductClick(product.productID, false)}
            >
              {/* Enhanced Badges */}
              <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                {/* Cashback Badge - Always visible */}
                <span className="bg-gray-800 text-white text-xs font-black px-2 md:px-3 py-1 rounded-full shadow-lg animate-pulse border border-white">
                  💰 CASHBACK
                </span>
                
                {/* Discount Badge */}
                {discount > 0 ? (
                  <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white text-xs font-black px-2 md:px-3 py-1 rounded-full animate-bounce border border-white">
                    🔥 -{discount}% OFF
                  </span>
                ) : (
                  <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white text-xs font-black px-2 md:px-3 py-1 rounded-full border border-white">
                    ⚡ HOT DEAL
                  </span>
                )}
              </div>

              {/* Special Effects Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-yellow-400/5 to-red-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              {/* Image Container */}
              <div className="relative overflow-hidden">
                <div className="h-40 md:h-48 w-full flex items-center justify-center">
                  <img
                    src={getValidImageUrl(product.productImage)}
                    alt={product.productName}
                    className="h-full w-full object-contain transition-all duration-500 group-hover:scale-110"
                  />
                </div>
              </div>

              {/* Product Info */}
              <div className="p-3 text-center">
                <h3 className="text-xs md:text-sm font-semibold line-clamp-2 mb-3 text-gray-800 group-hover:text-gray-900 transition-colors">
                  {product.productName}
                </h3>
                
                {/* Enhanced Price Section */}
                <div className="space-y-2">
                  <div className="flex justify-center items-center gap-2">
                    <span className="font-black text-md md:text-xl text-orange-600 group-hover:text-red-600 transition-colors">
                      {formatPrice(product.price)}
                    </span>
                    {product.oldPrice > 0 && (
                      <span className="text-sm text-gray-400 line-through font-medium">
                        {formatPrice(product.oldPrice)}
                      </span>
                    )}
                  </div>

                  {/* Savings Display */}
                  {product.oldPrice > 0 && discount > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-2 py-1 rounded-lg">
                      <span className="text-xs font-bold text-green-700">
                        You Save: {formatPrice(product.oldPrice - product.price)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 mt-4 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  {/* Add to Cart Button */}
                  <button
                    className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white px-3 py-2 rounded-xl font-bold hover:from-orange-600 hover:via-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                    disabled={isAddingToCart}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                  >
                    <ShoppingCartOutlined className="text-sm" />
                    <span className="text-sm">
                      {isAddingToCart ? "Adding..." : "Add to Cart"}
                    </span>
                  </button>
                  
                  {/* Quick View Button */}
                  <button
                    className="w-full bg-gradient-to-r from-black to-gray-500 text-white px-3 py-1.5 rounded-lg font-medium transition-all duration-300 text-sm shadow-md hover:shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(product.productID, false);
                    }}
                  >
                    Quick View
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Dots */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentPage
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 scale-125'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CashbackComponent;