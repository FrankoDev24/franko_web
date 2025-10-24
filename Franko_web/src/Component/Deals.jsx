/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  HeartIcon as OutlineHeartIcon,
  HeartIcon as SolidHeartIcon,
  ShoppingCartIcon,
  EyeIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { fetchProductByShowroomAndRecord } from "../Redux/Slice/productSlice";
import {
  addToWishlist,
  removeFromWishlist,
} from "../Redux/Slice/wishlistSlice";
import { Card, CardBody, Tooltip } from "@material-tailwind/react";
import useAddToCart from "./Cart";

const Notification = ({ message, type, isVisible, onClose }) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isVisible && message) {
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, 3000);
    }
  }, [isVisible, message]);

  if (!isVisible || !message) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const Icon = type === 'success' ? CheckCircleIcon : XCircleIcon;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[300px]`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-auto text-white/80 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};

const Deals = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const showroomID = "1e93aeb7-bba7-4bd4-b017-ea3267047d46";

  const [timeLeft, setTimeLeft] = useState({});
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [notification, setNotification] = useState({
    message: '',
    type: 'success',
    isVisible: false
  });

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ 
      ...prev, 
      isVisible: false 
    }));
  }, []);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message: '', type: 'success', isVisible: false });
    requestAnimationFrame(() => {
      setNotification({
        message,
        type,
        isVisible: true
      });
    });
  }, []);

  const { addProductToCart, loading: cartLoading } = useAddToCart();
  const { productsByShowroom, loading } = useSelector((state) => state.products);
  const wishlist = useSelector((state) => state.wishlist.items);

  const isInWishlist = (id) => wishlist.some((item) => item.id === id);

  const handleWishlistToggle = async (product) => {
    try {
      const id = product.id || product.productID;
      if (isInWishlist(id)) {
        dispatch(removeFromWishlist(id));
        showNotification("Removed from wishlist", "success");
      } else {
        dispatch(addToWishlist({ ...product, id }));
        showNotification("Added to wishlist", "success");
      }
    } catch {
      showNotification("Failed to update wishlist", "error");
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await addProductToCart(product);
      showNotification("Added to cart successfully", "success");
    } catch {
      showNotification("Failed to add to cart", "error");
    }
  };

  useEffect(() => {
    dispatch(fetchProductByShowroomAndRecord({ showRoomCode: showroomID, recordNumber: 10 }));
  }, [dispatch]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date(2025, 9, 25, 0, 0, 0);
      const diff = endOfDay - now;

      if (diff > 0) {
        setTimeLeft({
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    const interval = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateArrows = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
      }
    };

    updateArrows();
    scrollRef.current?.addEventListener("scroll", updateArrows);
    return () => scrollRef.current?.removeEventListener("scroll", updateArrows);
  }, [productsByShowroom]);

  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 5) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scroll("right");
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [productsByShowroom, isHovered]);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const getValidImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/150";
    return imagePath.includes("\\")
      ? `https://smfteapi.salesmate.app/Media/Products_Images/${imagePath.split("\\").pop()}`
      : imagePath;
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(price || 0);

  return (
    <>
      <Notification
        key={notification.id}
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="mx-auto px-2 md:px-24 py-3">
        {/* Header Section - Compact Banner */}
        <div className="mb-3 relative overflow-hidden rounded-xl bg-gradient-to-r from-red-500 via-orange-500 to-red-600 p-2.5 md:p-3 shadow-lg">
          {/* Animated background effects */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-white animate-shimmer" style={{
              backgroundImage: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
            }}></div>
          </div>

          <div className="relative z-10 flex items-center justify-between gap-2 md:gap-3">
            {/* Title - More Compact */}
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              <span className="text-xl md:text-2xl animate-bounce-slow">🔥</span>
              <div>
                <h2 className="text-sm md:text-lg font-black text-white animate-pulse-slow drop-shadow-lg leading-tight">
                  DEALS OF THE WEEK
                </h2>
                <span className="inline-block bg-yellow-400 text-red-900 text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full animate-wiggle shadow-lg">
                  ⚡ LIMITED TIME ⚡
                </span>
              </div>
            </div>
            


            {/* Countdown Timer - Compact */}
          
            
            {/* See More Button */}
            <Link
              to={`/showroom/${showroomID}`}
              className="flex items-center gap-1 bg-white text-red-600 hover:bg-red-50 px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-xs md:text-sm transition-all duration-300 hover:scale-105 shadow-lg whitespace-nowrap flex-shrink-0"
            >
              <span>See More</span>
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Products Carousel */}
        <div className="relative mt-4">
          {showLeftArrow && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 shadow-lg p-2 rounded-full hover:bg-red-50 hover:border-red-300 transition-all hover:scale-110"
            >
              <svg className="h-4 w-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div
            ref={scrollRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth px-1"
          >
            {(loading ? [...Array(10)] : productsByShowroom?.[showroomID])?.map((product, idx) => {
              if (loading) {
                return (
                  <Card key={idx} className="min-w-[160px] md:min-w-[200px] w-[160px] md:w-[200px] animate-pulse shadow mb-2">
                    <div className="h-32 md:h-40 bg-gray-300" />
                    <CardBody className="p-2">
                      <div className="h-3 bg-gray-300 rounded w-3/4 mb-2" />
                      <div className="h-2 bg-gray-200 rounded w-1/2" />
                    </CardBody>
                  </Card>
                );
              }

              const {
                productID,
                productName,
                productImage,
                price,
                oldPrice,
                stock,
              } = product;

              const isOnSale = oldPrice > 0 && oldPrice > price;
              const discountPercent = isOnSale ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
              const inWishlist = isInWishlist(productID);

              return (
                <div
                  key={productID}
                  className="group mb-2 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden min-w-[160px] md:min-w-[220px] w-[160px] md:w-[220px] border-2 border-transparent hover:border-red-400"
                >
                  <div className="relative overflow-hidden">
                    {stock === 0 ? (
                      <span className="absolute top-2 left-2 bg-gray-800 text-white text-[10px] md:text-xs px-2 py-0.5 rounded-full z-10 font-bold">
                        SOLD OUT
                      </span>
                    ) : isOnSale ? (
                      <div className="absolute top-2 left-2 z-10">
                        <div className="bg-gradient-to-br from-red-500 to-red-700 text-white text-xs md:text-xs font-bold w-12 h-12 md:w-14 md:h-14 rounded-full flex flex-col items-center justify-center shadow-lg animate-bounce-slow">
                          <span className="text-[4px] md:text-xs">SAVE</span>
                          <span className="text-xs">{discountPercent}% OFF</span>
                        </div>
                      </div>
                    ) : null}

                    <div
                      className="h-32 md:h-40 w-full flex items-center justify-center cursor-pointer transition-transform duration-300 p-2"
                      onClick={() => navigate(`/product/${productID}`)}
                    >
                      <img
                        src={getValidImageUrl(productImage)}
                        alt={productName}
                        className="h-full object-contain transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>

                    <div
                      className="absolute inset-0 hidden group-hover:flex items-center justify-center gap-2  z-20 transition-all cursor-pointer"
                      onClick={() => navigate(`/product/${product.productID}`)}
                    >
                      <Tooltip content={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}>
                        <button
                          className="p-2 bg-white/90 hover:bg-white rounded-full transition-all hover:scale-110 shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWishlistToggle(product);
                          }}
                        >
                          {inWishlist ? (
                            <SolidHeartIcon className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                          ) : (
                            <OutlineHeartIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
                          )}
                        </button>
                      </Tooltip>

                      <Tooltip content="View Details">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/product/${product.productID}`);
                          }}
                          className="p-2 bg-white/90 hover:bg-white rounded-full transition-all hover:scale-110 shadow-lg"
                        >
                          <EyeIcon className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                        </button>
                      </Tooltip>

                      <Tooltip content={product.stock === 0 ? "Out of Stock" : "Add to Cart"}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          className="p-2 bg-white/90 hover:bg-white rounded-full transition-all hover:scale-110 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={cartLoading || product.stock === 0}
                        >
                          <ShoppingCartIcon className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="p-2 md:p-3 text-center space-y-1 bg-white">
                    <h3 className="text-xs md:text-sm font-semibold text-gray-800 line-clamp-2 min-h-[32px] md:min-h-[40px]">
                      {productName}
                    </h3>
                    <div className="flex flex-col items-center justify-center gap-0.5 pt-1">
                      <span className="text-red-600 font-black text-base md:text-sm">
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

            {!loading && (
              <div className="min-w-[120px] md:min-w-[150px] w-[120px] md:w-[150px] flex items-center justify-center">
                <Link
                  to={`/showroom/${showroomID}`}
                  className="flex flex-col items-center gap-2 text-red-500 hover:text-red-600 transition-all group hover:scale-105"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <ArrowRightIcon className="w-8 h-8 md:w-10 md:h-10 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <span className="text-xs md:text-sm font-bold">View All Deals</span>
                </Link>
              </div>
            )}
          </div>

          {showRightArrow && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 shadow-lg p-2 rounded-full hover:bg-red-50 hover:border-red-300 transition-all hover:scale-110"
            >
              <svg className="h-4 w-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg> 
            </button>
          )}
        </div>
      </div>

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
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        @keyframes pulse-fast {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }
        
        @keyframes blink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
        
        @keyframes wiggle {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-3deg);
          }
          75% {
            transform: rotate(3deg);
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s infinite;
        }
        
        .animate-pulse-fast {
          animation: pulse-fast 1s infinite;
        }
        
        .animate-blink {
          animation: blink 1s infinite;
        }
        
        .animate-wiggle {
          animation: wiggle 1.5s ease-in-out infinite;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default Deals;