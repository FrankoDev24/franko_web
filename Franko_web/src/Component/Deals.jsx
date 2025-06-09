/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link, } from "react-router-dom";
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

// Enhanced Notification Component with Fixed Auto-Hide
const Notification = ({ message, type, isVisible, onClose }) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Clear any existing timeout when component unmounts or dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Only set timeout if notification is visible and has a message
    if (isVisible && message) {
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, 3000);
    }
  }, [isVisible, message]); // Remove onClose from dependencies to prevent recreation

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

  // Notification state with better management
   // Simplified notification state
   const [notification, setNotification] = useState({
    message: '',
    type: 'success',
    isVisible: false
  });

  // Memoize the hide function to prevent unnecessary re-renders
  const hideNotification = useCallback(() => {
    setNotification(prev => ({ 
      ...prev, 
      isVisible: false 
    }));
  }, []);

  const showNotification = useCallback((message, type = 'success') => {
    // Reset any existing notification first
    setNotification({ message: '', type: 'success', isVisible: false });
    
    // Use requestAnimationFrame to ensure state reset is processed
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
      const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
      const nextSunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSunday, 23, 59, 59);
      const diff = nextSunday - now;

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
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
      {/* Notification Component with key prop for re-mounting */}
      <Notification
        key={notification.id}
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="mx-auto px-4 md:px-24 py-4">
        <div className="mb-2">
          <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
            <h2 className="text-sm md:text-lg font-bold text-gray-900 relative whitespace-nowrap">
              Deals of the Week
              <span className="absolute -bottom-1 left-0 w-16 h-1 bg-red-400 rounded-full"></span>
            </h2>
            <div className="flex-grow h-px bg-gray-300" />
            <div className="bg-red-400 text-white px-2 py-2 rounded-full shadow-lg flex gap-3 font-md text-sm tracking-wide items-center whitespace-nowrap">
              <span>Ends in:</span>
              <div className="flex gap-1">
                <span>{String(timeLeft.days).padStart(2, "0")}d</span>:
                <span>{String(timeLeft.hours).padStart(2, "0")}h</span>:
                <span>{String(timeLeft.minutes).padStart(2, "0")}m</span>:
                <span>{String(timeLeft.seconds).padStart(2, "0")}s</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-6">
          {showLeftArrow && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 shadow p-2 rounded-full hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div
            ref={scrollRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth px-4"
          >
            {(loading ? [...Array(10)] : productsByShowroom?.[showroomID])?.map((product, idx) => {
              if (loading) {
                return (
                  <Card key={idx} className="min-w-[200px] w-[200px] animate-pulse shadow mb-2">
                    <div className="h-40 bg-gray-300" />
                    <CardBody>
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-1" />
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
              const inWishlist = isInWishlist(productID);

              return (
                <div
                  key={productID}
                  className="group mb-2 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden min-w-[200px] w-[200px]"
                >
                  <div className="relative overflow-hidden">
                    {stock === 0 ? (
                      <span className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-0.5 rounded-full z-10">
                        SOLD OUT
                      </span>
                    ) : isOnSale ? (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold w-10 h-10 rounded-full z-10 flex items-center justify-center">
                        SALE
                      </span>
                    ) : null}

                    <div
                      className="h-40 w-full flex items-center justify-center cursor-pointer transition-transform duration-300"
                      onClick={() => navigate(`/product/${productID}`)}
                    >
                      <img
                        src={getValidImageUrl(productImage)}
                        alt={productName}
                        className="h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    <div className="absolute inset-0 hidden group-hover:flex items-center justify-center gap-3 bg-black/40 z-20 transition-all">
                      {/* Wishlist Icon */}
                      <Tooltip content={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}>
                        <button 
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                          onClick={() => handleWishlistToggle(product)}
                        >
                          {inWishlist ? (
                            <SolidHeartIcon className="w-5 h-5 text-red-500" />
                          ) : (
                            <OutlineHeartIcon className="w-5 h-5 text-white hover:text-red-400" />
                          )}
                        </button>
                      </Tooltip>

                      {/* View Details */}
                      <Tooltip content="View Details">
                        <button
                          onClick={() => navigate(`/product/${productID}`)}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        >
                          <EyeIcon className="w-5 h-5 text-white hover:text-green-400" />
                        </button>
                      </Tooltip>

                      {/* Add to Cart */}
                      <Tooltip content={stock === 0 ? "Out of Stock" : "Add to Cart"}>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={cartLoading || stock === 0}
                        >
                          <ShoppingCartIcon className="w-5 h-5 text-white hover:text-red-400" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="p-3 text-center space-y-1">
                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2">{productName}</h3>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <span className="text-red-500 font-medium text-sm">{formatPrice(price)}</span>
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
              <div className="min-w-[150px] w-[200px] flex items-center justify-center">
                <Link
                  to={`/showroom/${showroomID}`}
                  className="flex items-center gap-1 text-green-500 hover:text-green-600 transition-colors"
                >
                  <span className="text-sm font-medium">View All</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>

          {showRightArrow && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 shadow p-2 rounded-full hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Deals;