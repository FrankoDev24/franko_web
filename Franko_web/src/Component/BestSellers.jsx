import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  HeartIcon as OutlineHeartIcon,
  ShoppingCartIcon,
  ArrowRightIcon,
  HeartIcon as SolidHeartIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { fetchProductByShowroomAndRecord } from "../Redux/Slice/productSlice";
import { fetchHomePageShowrooms } from "../Redux/Slice/showRoomSlice";
import useAddToCart from "./Cart";
import { Tooltip } from "@material-tailwind/react";
import {
  addToWishlist,
  removeFromWishlist,
} from "../Redux/Slice/wishlistSlice";
import axiosInstance from "../Redux/Slice/AxiosInstance"; // ✅ use axios instance for images

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

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  const Icon = type === "success" ? CheckCircleIcon : XCircleIcon;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div
        className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[300px]`}
      >
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
  const { productsByShowroom, loading } = useSelector(
    (state) => state.products
  );
  const { addProductToCart, loading: cartLoading } = useAddToCart();
  const wishlist = useSelector((state) => state.wishlist.items || []);
  const isInWishlist = (id) =>
    Array.isArray(wishlist) && wishlist.some((item) => item.id === id);

  const [activeShowroom, setActiveShowroom] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showArrows, setShowArrows] = useState({ left: false, right: false });
  const [notification, setNotification] = useState({
    message: "",
    type: "success",
    isVisible: false,
  });

  // cache for product images (blob URLs) keyed by productImage path
  const [imageUrls, setImageUrls] = useState({});

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message: "", type: "success", isVisible: false });
    requestAnimationFrame(() => {
      setNotification({
        message,
        type,
        isVisible: true,
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
      dispatch(
        fetchProductByShowroomAndRecord({
          showRoomCode: first?.showRoomID,
          recordNumber: 10,
        })
      );
    }
  }, [homePageShowrooms, dispatch]);

  // Load images for active showroom via axiosInstance
  useEffect(() => {
    if (!activeShowroom) return;
    const products = productsByShowroom?.[activeShowroom] || [];
    if (!products.length) return;

    let isCancelled = false;

    const loadImages = async () => {
      const toLoad = products.filter(
        (p) => p.productImage && !imageUrls[p.productImage]
      );
      if (!toLoad.length) return;

      await Promise.allSettled(
        toLoad.map(async (p) => {
          const imagePath = p.productImage;
          const fileName = imagePath.split("\\").pop();
          if (!fileName) return;

          try {
            const res = await axiosInstance.get(
              `/Media/Products_Images/${fileName}`,
              { responseType: "blob" }
            );
            if (isCancelled) return;

            const blobUrl = URL.createObjectURL(res.data);
            setImageUrls((prev) => ({
              ...prev,
              [imagePath]: blobUrl,
            }));
          } catch (err) {
            console.error(
              `Error loading image for product ${p.productID}:`,
              err
            );
          }
        })
      );
    };

    loadImages();

    return () => {
      isCancelled = true;
    };
  }, [productsByShowroom, activeShowroom, imageUrls]);

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
    path ? imageUrls[path] || "https://via.placeholder.com/150" : "https://via.placeholder.com/150";

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(price || 0);

  const handleShowroomClick = (id) => {
    setActiveShowroom(id);
    dispatch(
      fetchProductByShowroomAndRecord({
        showRoomCode: id,
        recordNumber: 10,
      })
    );
  };

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -300 : 300,
      behavior: "smooth",
    });
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
      <div className="mb-4">
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
                    onClick={() =>
                      handleShowroomClick(showroom.showRoomID)
                    }
                    className={`transition text-sm px-4 py-1.5 rounded-full font-medium border ${
                      isActive
                        ? "bg-red-400 text-white border-red-600 hover:scale-105"
                        : "text-gray-500 border-gray-300 hover:text-black hover:scale-105"
                    }`}
                  >
                    {showroom.showRoomName}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Scroll Arrows + Product Cards (Deals-style UI) */}
      <div className="relative">
        {showArrows.left && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 shadow-lg p-2 rounded-full hover:bg-red-50 hover:border-red-300 transition-all hover:scale-110"
          >
            <svg
              className="w-4 h-4 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {showArrows.right && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 shadow-lg p-2 rounded-full hover:bg-red-50 hover:border-red-300 transition-all hover:scale-110"
          >
            <svg
              className="w-4 h-4 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}

        <div
          ref={scrollRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2"
        >
          {(loading
            ? [...Array(8)]
            : productsByShowroom?.[activeShowroom]
          )?.map((product, i) => {
            if (loading) {
              return (
                <div
                  key={i}
                  className="min-w-[160px] md:min-w-[220px] w-[160px] md:w-[220px] animate-pulse bg-white rounded-xl shadow-md p-4 space-y-4 mb-2"
                >
                  <div className="h-32 md:h-40 bg-gray-200 rounded-xl" />
                  <div className="h-3 bg-gray-300 rounded w-3/4 mx-auto" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
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
                className="group mb-2 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden min-w-[160px] md:min-w-[220px] w-[160px] md:w-[220px] border-2 border-transparent hover:border-red-400"
              >
                <div className="relative overflow-hidden">
                  {stock === 0 ? (
                    <span className="absolute top-2 left-2 bg-gray-800 text-white text-[10px] md:text-xs px-2 py-0.5 rounded-full z-10 font-bold">
                      SOLD OUT
                    </span>
                  ) : isOnSale ? (
                    <div className="absolute top-2 left-2 z-10" />
                  ) : null}

                  <div
                    className="h-32 md:h-40 w-full flex items-center justify-center cursor-pointer transition-transform duration-300 p-2"
                    onClick={() => navigate(`/product/${productID}`)}
                  >
                    <img
                      src={getImageUrl(productImage)}
                      alt={productName}
                      className="h-full object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>

                  <div
                    className="absolute inset-0 hidden group-hover:flex items-center justify-center gap-2 z-20 transition-all cursor-pointer"
                    onClick={() =>
                      navigate(`/product/${product.productID}`)
                    }
                  >
                    <Tooltip
                      content={
                        inWishlist
                          ? "Remove from Wishlist"
                          : "Add to Wishlist"
                      }
                    >
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
                          navigate(
                            `/product/${product.productID}`
                          );
                        }}
                        className="p-2 bg-white/90 hover:bg-white rounded-full transition-all hover:scale-110 shadow-lg"
                      >
                        <EyeIcon className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                      </button>
                    </Tooltip>

                    <Tooltip
                      content={
                        product.stock === 0
                          ? "Out of Stock"
                          : "Add to Cart"
                      }
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        className="p-2 bg-white/90 hover:bg-white rounded-full transition-all hover:scale-110 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={
                          cartLoading || product.stock === 0
                        }
                      >
                        <ShoppingCartIcon className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                      </button>
                    </Tooltip>
                  </div>
                </div>

                <div className="p-2 md:p-3 text-center space-y-1 bg-white">
                  <h3 className="text-xs md:text-sm text-gray-800 line-clamp-2 min-h-[32px] md:min-h-[40px]">
                    {productName}
                  </h3>
                  <div className="flex flex-col items-center justify-center gap-0.5 pt-1">
                    <span className="text-red-600 font-bold text-xs md:text-sm">
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

          {!loading &&
            productsByShowroom?.[activeShowroom]?.length > 0 && (
              <div className="min-w-[120px] md:min-w-[150px] w-[120px] md:w-[150px] flex items-center justify-center">
                <button
                  onClick={() =>
                    navigate(`/showroom/${activeShowroom}`)
                  }
                  className="flex flex-col items-center gap-2 text-red-500 hover:text-red-600 transition-all group hover:scale-105"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <ArrowRightIcon className="w-8 h-8 md:w-10 md:h-10 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <span className="text-xs md:text-sm font-bold">
                    View All
                  </span>
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