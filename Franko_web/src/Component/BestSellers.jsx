import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  HeartIcon as OutlineHeartIcon,
  ShoppingCartIcon,ArrowRightIcon,
  EyeIcon,
} from "@heroicons/react/24/solid";
import { fetchProductByShowroomAndRecord } from "../Redux/Slice/productSlice";
import { fetchHomePageShowrooms } from "../Redux/Slice/showRoomSlice";
import useAddToCart from "./Cart";
import {  Tooltip } from "@material-tailwind/react";

const BestSellers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const { homePageShowrooms } = useSelector((state) => state.showrooms);
  const { productsByShowroom, loading } = useSelector((state) => state.products);
  const { addProductToCart, loading: cartLoading } = useAddToCart();

  const [activeShowroom, setActiveShowroom] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showArrows, setShowArrows] = useState({ left: false, right: false });

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
     {/* Showroom Tabs */}
     <div className="mb-6">
  <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
    <h2 className="text-sm md:text-lg font-bold text-gray-900 relative whitespace-nowrap">
      Trending Products
      <span className="absolute -bottom-1 left-0 w-16 h-1 bg-red-400 rounded-full" />
    </h2>
    <div className="flex-grow h-px bg-gray-300" />
    <div className="flex flex-wrap gap-4">
      {homePageShowrooms?.map((showroom) => {
        const isActive = activeShowroom === showroom.showRoomID;
        return (
          <button
            key={showroom.showRoomID}
            onClick={() => handleShowroomClick(showroom.showRoomID)}
            className={`transition text-sm px-4 py-1.5 rounded-full font-medium border ${
              isActive
                ? "bg-green-400 text-white border-green-600"
                : "text-gray-500 border-gray-300 hover:text-black hover:border-black"
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

    const discount =
      oldPrice > 0 ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

    return (
      <div
        key={productID}
        className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden min-w-[200px] w-[200px]"
      >
        <div className="relative overflow-hidden">
          {stock === 0 ? (
            <span className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-0.5 rounded-full z-10">
              SOLD OUT
            </span>
          ) : discount > 0 ? (
            <span className="absolute top-2 left-2 bg-red-400 text-white text-xs font-semibold px-2 py-1 rounded-full z-10 w-10 h-10 flex items-center justify-center">
              -{discount}%
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
            <Tooltip content="Add to Wishlist" placement="top">
              <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full">
                <OutlineHeartIcon className="w-5 h-5 text-white hover:text-red-400" />
              </button>
            </Tooltip>
            <Tooltip content="View Details" placement="top">
              <button
                onClick={() => navigate(`/product/${productID}`)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full"
              >
                <EyeIcon className="w-5 h-5 text-white hover:text-yellow-400" />
              </button>
            </Tooltip>
            <Tooltip content="Add to Cart" placement="top">
              <button
                onClick={() => addProductToCart(product)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full"
                disabled={cartLoading}
              >
                <ShoppingCartIcon className="w-5 h-5 text-white hover:text-green-400" />
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

  {/* View All Button */}
  {!loading && productsByShowroom?.[activeShowroom]?.length > 0 && (
    <div className="min-w-[150px] w-[200px] flex items-center justify-center">
      <button
        onClick={() => navigate(`/showroom/${activeShowroom}`)}
        className="flex items-center gap-1 text-green-500 hover:text-green-600 transition"
      >
        <span className="text-sm font-medium">View All</span>
        <ArrowRightIcon className="w-5 h-5" />
      </button>
    </div>
  )}
</div>

      </div>
    </section>
  );
};

export default BestSellers;
