import React, { useEffect, useRef, useState , useCallback} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  HeartIcon as OutlineHeartIcon,
  ShoppingCartIcon,ArrowRightIcon,
  HeartIcon as SolidHeartIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/solid";
import { fetchProductByShowroomAndRecord } from "../Redux/Slice/productSlice";
import { fetchHomePageShowrooms } from "../Redux/Slice/showRoomSlice";
import useAddToCart from "./Cart";
import {  Tooltip } from "@material-tailwind/react";
import {
  addToWishlist,
  removeFromWishlist,
} from "../Redux/Slice/wishlistSlice";

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

const BestSellers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const { homePageShowrooms } = useSelector((state) => state.showrooms);
  const { productsByShowroom, loading } = useSelector((state) => state.products);
  const { addProductToCart, loading: cartLoading } = useAddToCart();
  const wishlist = useSelector((state) => state.wishlist.items);

  const isInWishlist = (id) => wishlist.some((item) => item.id === id);

  const [activeShowroom, setActiveShowroom] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showArrows, setShowArrows] = useState({ left: false, right: false });
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
    dispatch(fetchHomePageShowrooms());
  }, [dispatch]);

  useEffect(() => {
    if (homePageShowrooms?.length > 0) {
      const first = homePageShowrooms[0];
      setActiveShowroom(first?.showRoomID);
      dispatch(fetchProductByShowroomAndRecord({ showRoomCode: first?.showRoomID, recordNumber: 10 }));
    }
  }, [homePageShowrooms, dispatch]);

  useEffect(() => {
    const handleScroll = () => {
      const container = scrollRef.current;
      if (container) {
        const { scrollLeft, scrollWidth, clientWidth } = container;
        setShowArrows({
          left: scrollLeft > 0,
          right: scrollLeft + clientWidth < scrollWidth - 5,
        });
      }
    };

    handleScroll();
    const container = scrollRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [productsByShowroom, activeShowroom]);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      const container = scrollRef.current;
      if (!container) return;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      if (scrollLeft + clientWidth >= scrollWidth - 5) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollBy({ left: 300, behavior: "smooth" });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered, activeShowroom]);

  const getImageUrl = (path) =>
    path?.includes("\\")
      ? `https://smfteapi.salesmate.app/Media/Products_Images/${path.split("\\").pop()}`
      : path || "https://via.placeholder.com/150";

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(price || 0);

  const handleShowroomClick = (id) => {
    setActiveShowroom(id);
    dispatch(fetchProductByShowroomAndRecord({ showRoomCode: id, recordNumber: 10 }));
  };

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  return (
    
    <section className="px-4 md:px-16 py-6">
      <Notification
        key={notification.id}
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
     {/* Showroom Tabs */}
     <div className="mb-6">
  <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
    <h2 className="text-sm md:text-lg font-bold text-gray-900 relative whitespace-nowrap">
      Trending Products
      <span className="absolute -bottom-1 left-0 w-16 h-1 bg-red-400 rounded-full" />
    </h2>
    <div className="flex-grow h-px bg-gray-300" />
    <div className="flex flex-wrap gap-4">
      {Array.isArray(homePageShowrooms) &&
  homePageShowrooms.map((showroom) => {
    const isActive = activeShowroom === showroom.showRoomID;
    return (
      <button
        key={showroom.showRoomID}
        onClick={() => handleShowroomClick(showroom.showRoomID)}
        className={`transition text-sm px-4 py-1.5 rounded-full font-medium border ${
          isActive
            ? "bg-red-400 text-white border-red-600 hover:scale-105"
            : "text-gray-500 border-gray-300 hover:text-black hover:scale-105 "
        }`}
      >
        {showroom.showRoomName}
      </button>
    );
  })}

    </div>
  </div>
</div>

      
    

      {/* Scroll Arrows */}
      <div className="relative">
        {showArrows.left && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border shadow p-2 rounded-full hover:scale-105 transition"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {showArrows.right && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border shadow p-2 rounded-full hover:scale-105 transition"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Product Cards */}
        <div
  ref={scrollRef}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
  className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2"
>
  {(loading ? [...Array(8)] : productsByShowroom?.[activeShowroom])?.map((product, i) => {
    if (loading) {
      return (
        <div key={i} className="animate-pulse bg-white rounded-2xl shadow-md p-4 min-w-[200px] space-y-4">
          <div className="h-40 bg-gray-200 rounded-xl"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
        </div>
      );
    }

    const {
      productID,
      productName,
      price,
      oldPrice,
      stock,
      productImage,
    } = product;

    const isOnSale = oldPrice > 0 && oldPrice > price;
    const inWishlist = isInWishlist(productID);

    return (
      <div
        key={productID}
        className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden min-w-[170px] w-[200px]"
      >
        <div className="relative overflow-hidden">
          {stock === 0 ? (
            <span className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-0.5 rounded-full z-10">
              SOLD OUT
            </span>
          ) : isOnSale > 0 ? (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full z-10 w-10 h-10 flex items-center justify-center">
        SALE
            </span>
          ) : null}

          <div
            className="h-40 w-full flex items-center justify-center cursor-pointer transition-transform duration-300"
            onClick={() => navigate(`/product/${productID}`)}
          >
            <img
              src={getImageUrl(productImage)}
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
          <h3 className="text-xs md:text-sm font-medium text-gray-900 line-clamp-2">{productName}</h3>
         <div className="flex flex-col md:flex-row items-center justify-center gap-1 mt-1">

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

  {/* View All Button */}
  {!loading && productsByShowroom?.[activeShowroom]?.length > 0 && (
    <div className="min-w-[150px] w-[200px] flex items-center justify-center">
      <button
        onClick={() => navigate(`/showroom/${activeShowroom}`)}
        className="flex items-center gap-1 text-red-500 hover:text-red-600 transition"
      >
        <span className="text-sm font-medium">View All</span>
        <ArrowRightIcon className="w-5 h-5" />
      </button>
    </div>
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
    </section>
  );
};

export default BestSellers;
