import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  HeartIcon as OutlineHeartIcon,
  HeartIcon as SolidHeartIcon,
  ShoppingCartIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";

import { fetchProductsByCategory } from "../Redux/Slice/productSlice";
import { Card, CardBody, Tooltip } from "@material-tailwind/react";
import useAddToCart from "./Cart";
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
  }, [isVisible, message, onClose]);

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

const PhoneDeals = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const categoryId = "51d1fff2-7b71-46aa-9b34-2e553a40e921";

  const { productsByCategory = {}, loading } = useSelector(
    (state) => state.products
  );
  const { addProductToCart, loading: cartLoading } = useAddToCart();
  const wishlist = useSelector((state) => state.wishlist.items || []);
  const isInWishlist = (id) =>
    Array.isArray(wishlist) && wishlist.some((item) => item.id === id);

  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const intervalRef = useRef(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "success",
    isVisible: false,
  });

  // cache of image blob URLs keyed by original productImage path
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

  const sortedProducts = (Array.isArray(productsByCategory[categoryId])
    ? productsByCategory[categoryId]
    : []
  )
    .filter(
      (product) =>
        product.productID !== "9d88a301-e4ff-42a2-957a-9c611d4cce12"
    )
    .sort(
      (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
    )
    .slice(0, 10);

  useEffect(() => {
    dispatch(fetchProductsByCategory(categoryId));
  }, [dispatch, categoryId]);

  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      setItemsPerPage(width < 768 ? 2 : 5);
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () =>
      window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1;
  const currentProducts = sortedProducts.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  );

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 6000);

    return () => clearInterval(intervalRef.current);
  }, [totalPages, currentPage, itemsPerPage]);

  // load images for current sortedProducts via axiosInstance
  useEffect(() => {
    if (!sortedProducts.length) return;

    let isCancelled = false;

    const loadImages = async () => {
      const toLoad = sortedProducts.filter(
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
              `Error loading product image for ${p.productID}:`,
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
  }, [sortedProducts, imageUrls]);

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(price || 0);

  const getValidImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/150";
    return imageUrls[imagePath] || "https://via.placeholder.com/150";
  };

  return (
    <div className="mx-auto px-4 md:px-24 py-4">
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
      {/* Header */}
      <div className="mb-6 flex items-center gap-4 flex-wrap md:flex-nowrap">
        <h2 className="text-sm md:text-lg font-bold text-gray-900 relative whitespace-nowrap">
          Mobile Phones
          <span className="absolute -bottom-1 left-0 w-16 h-1 bg-red-400 rounded-full" />
        </h2>
        <div className="flex-grow h-px bg-gray-300" />
        <Link
          to="/phones"
          className="flex items-center gap-1 text-red-400 hover:text-red-600 transition"
        >
          <span className="text-sm font-medium">View All</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {(loading || currentProducts.length === 0
          ? [...Array(itemsPerPage)]
          : currentProducts
        ).map((product, idx) => {
          if (loading || !product) {
            return (
              <Card
                key={idx}
                className="animate-pulse shadow rounded-2xl"
              >
                <div className="h-40 bg-gray-300 rounded-t-2xl" />
                <CardBody>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-1" />
                </CardBody>
              </Card>
            );
          }

          const discount =
            product.oldPrice > 0
              ? Math.round(
                  ((product.oldPrice - product.price) /
                    product.oldPrice) *
                    100
                )
              : 0;
          const soldOut = product.stock === 0;
          const inWishlist = isInWishlist(
            product.id || product.productID
          );

          return (
            <div
              key={product.productID}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden relative"
            >
              {/* Badge */}
              {soldOut ? (
                <span className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-0.5 rounded-full z-10">
                  SOLD OUT
                </span>
              ) : discount > 0 ? (
                <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full z-10 w-10 h-10 flex items-center justify-center">
                  SALE
                </span>
              ) : null}

              {/* Image */}
              <div className="relative overflow-hidden">
                <div
                  className="h-40 md:h-48 w-full flex items-center justify-center cursor-pointer"
                  onClick={() =>
                    navigate(`/product/${product.productID}`)
                  }
                >
                  <img
                    src={getValidImageUrl(product.productImage)}
                    alt={product.productName}
                    className="h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Hover Actions */}
                <div
                  className="absolute inset-0 hidden group-hover:flex items-center justify-center gap-3 bg-black/40 z-20 transition-all cursor-pointer"
                  onClick={() =>
                    navigate(`/product/${product.productID}`)
                  }
                >
                  {/* Wishlist Icon */}
                  <Tooltip
                    content={
                      inWishlist
                        ? "Remove from Wishlist"
                        : "Add to Wishlist"
                    }
                  >
                    <button
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWishlistToggle(product);
                      }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/product/${product.productID}`
                        );
                      }}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <EyeIcon className="w-5 h-5 text-white hover:text-green-400" />
                    </button>
                  </Tooltip>

                  {/* Add to Cart */}
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
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={
                        cartLoading || product.stock === 0
                      }
                    >
                      <ShoppingCartIcon className="w-5 h-5 text-white hover:text-red-400" />
                    </button>
                  </Tooltip>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 text-center space-y-1">
                <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
                  {product.productName}
                </h3>
                <div className="flex flex-col md:flex-row items-center justify-center gap-1 mt-1">
                  <span className="text-red-500 font-medium text-sm">
                    {formatPrice(product.price)}
                  </span>
                  {product.oldPrice > 0 && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatPrice(product.oldPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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
    </div>
  );
};

export default PhoneDeals;