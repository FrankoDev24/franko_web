import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addToWishlist,
  removeFromWishlist,
} from "../Redux/Slice/wishlistSlice";
import { fetchProducts } from "../Redux/Slice/productSlice";
import { Tooltip } from "@material-tailwind/react";
import {
  HeartIcon as OutlineHeartIcon,
  HeartIcon as SolidHeartIcon,
  ShoppingCartIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/solid";
import useAddToCart from "./Cart";
import { useNavigate, Link } from "react-router-dom";

// Format image URL
const getValidImageUrl = (imagePath) => {
  if (!imagePath) return "https://via.placeholder.com/150";
  return imagePath.includes("\\")
    ? `https://smfteapi.salesmate.app/Media/Products_Images/${imagePath.split("\\").pop()}`
    : imagePath;
};

// Format price
const formatPrice = (price) =>
  new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(price || 0);

// Skeleton loader
const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-2xl shadow-md p-4 space-y-4">
    <div className="h-40 bg-gray-200 rounded-xl"></div>
    <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
  </div>
);

// Notification
const Notification = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  const Icon = type === "success" ? CheckCircleIcon : XCircleIcon;

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

const NewArrivals = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products, loading } = useSelector((state) => state.products);
  const wishlist = useSelector((state) => state.wishlist.items);
  const { addProductToCart, loading: cartLoading } = useAddToCart();

  const [notification, setNotification] = useState({
    message: "",
    type: "success",
    isVisible: false,
  });

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Get the 10 most recent products based on creation date
  const recentProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // Sort products by creation date (most recent first)
    const sortedProducts = [...products].sort((a, b) => {
      // Handle different possible date field names - fixed the typo and prioritize dateCreated
      const dateA = new Date(a.dateCreated || a.createdAt || a.created_at || a.date_created || a.creationDate || 0);
      const dateB = new Date(b.dateCreated || b.createdAt || b.created_at || b.date_created || b.creationDate || 0);
      
      return dateB - dateA; // Descending order (newest first)
    });
    
    // Return the first 10 products
    return sortedProducts.slice(0, 10);
  }, [products]);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type, isVisible: true });
  };

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  };

  const isInWishlist = (id) => wishlist.some((item) => item.id === id);

  const handleWishlistToggle = (product) => {
    const id = product.productID;
    if (isInWishlist(id)) {
      dispatch(removeFromWishlist(id));
      showNotification("Removed from wishlist");
    } else {
      dispatch(addToWishlist({ ...product, id }));
      showNotification("Added to wishlist");
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
    <div className="mx-auto px-4 md:px-24 py-4">
       {/* Header */}
           <div className="mb-6 flex items-center gap-4 flex-wrap md:flex-nowrap">
             <h2 className="text-sm md:text-xl font-bold text-gray-900 relative whitespace-nowrap">
            New Arrivals
               <span className="absolute -bottom-1 left-0 w-16 h-1 bg-red-400 rounded-full" />
             </h2>
             <div className="flex-grow h-px bg-gray-300" />
             <Link
               to="/products"
               className="flex items-center gap-1 text-red-500 hover:text-red-600 transition"
             >
               <span className="text-sm font-medium">View All Products</span>
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
               </svg>
             </Link>
           </div>
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {(loading ? Array.from({ length: 10 }) : recentProducts).map(
          (product, index) => {
            if (loading) return <SkeletonCard key={index} />;

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
                    onClick={() => navigate(`/product/${productID}`)}
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

                  <div className="absolute inset-0 hidden group-hover:flex items-center justify-center gap-3 bg-black/40 z-20">
                    {/* Wishlist */}
                    <Tooltip content={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}>
                      <button
                        onClick={() => handleWishlistToggle(product)}
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
                        onClick={() => navigate(`/product/${productID}`)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full"
                      >
                        <EyeIcon className="w-5 h-5 text-white hover:text-green-400" />
                      </button>
                    </Tooltip>

                    {/* Cart */}
                    <Tooltip content={stock === 0 ? "Out of Stock" : "Add to Cart"}>
                      <button
                        onClick={() => handleAddToCart(product)}
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
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
                    {productName}
                  </h3>
                  <div className="flex justify-center gap-1 mt-1">
                    <span className="text-red-500 font-medium text-sm">
                      {formatPrice(price)}
                    </span>
                    {isOnSale && (
                      <span className="text-xs line-through text-gray-400">
                        {formatPrice(oldPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          }
        )}
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

export default NewArrivals;