import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  HeartIcon as OutlineHeartIcon,
  ShoppingCartIcon,
  EyeIcon,
} from "@heroicons/react/24/solid";
import { fetchProductsByCategory } from "../Redux/Slice/productSlice";
import { Card, CardBody, Tooltip } from "@material-tailwind/react";
import useAddToCart from "./Cart";

const LaptopDeals = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const categoryId =  "12f11417-4f9e-4e4a-a18d-f9ff0d4c85a6";
  const { productsByCategory = {}, loading } = useSelector((state) => state.products);
  const { addProductToCart, loading: cartLoading } = useAddToCart();

  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const intervalRef = useRef(null);

  const sortedProducts = (productsByCategory[categoryId] || [])
    .filter((product) => product.productID !== "9d88a301-e4ff-42a2-957a-9c611d4cce12")
    .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
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
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
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

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(price || 0);

  const getValidImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/150";
    return imagePath.includes("\\")
      ? `https://smfteapi.salesmate.app/Media/Products_Images/${imagePath.split("\\").pop()}`
      : imagePath;
  };

  return (
    <div className="mx-auto px-4 md:px-24 py-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4 flex-wrap md:flex-nowrap">
        <h2 className="text-sm md:text-lg font-bold text-gray-900 relative whitespace-nowrap">
       Laptops & Computers
          <span className="absolute -bottom-1 left-0 w-16 h-1 bg-red-400 rounded-full" />
        </h2>
        <div className="flex-grow h-px bg-gray-300" />
        <Link
          to="/laptops"
          className="flex items-center gap-1 text-green-500 hover:text-green-600 transition"
        >
          <span className="text-sm font-medium">View All</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
              <Card key={idx} className="animate-pulse shadow rounded-2xl">
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
              ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
              : 0;
          const soldOut = product.stock === 0;

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
                <span className="absolute top-2 left-2 bg-red-400 text-white text-xs font-semibold px-2 py-1 rounded-full z-10 w-10 h-10 flex items-center justify-center">
                  -{discount}%
                </span>
              ) : null}

              {/* Image */}
              <div className="relative overflow-hidden">
                <div
                  className="h-40 md:h-48 w-full flex items-center justify-center cursor-pointer"
                  onClick={() => navigate(`/product/${product.productID}`)}
                >
                  <img
                    src={getValidImageUrl(product.productImage)}
                    alt={product.productName}
                    className="h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 hidden group-hover:flex items-center justify-center gap-3 bg-black/40 z-20 transition-all">
                  <Tooltip content="Add to Wishlist" placement="top">
                    <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full">
                      <OutlineHeartIcon className="w-5 h-5 text-white hover:text-red-400" />
                    </button>
                  </Tooltip>
                  <Tooltip content="View Details" placement="top">
                    <button
                      onClick={() => navigate(`/product/${product.productID}`)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-full"
                    >
                      <EyeIcon className="w-5 h-5 text-white hover:text-green-400" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Add to Cart" placement="top">
  <button
    className="p-2 bg-white/10 hover:bg-white/20 rounded-full"
    onClick={() => addProductToCart(product)}
    disabled={cartLoading}
  >
    <ShoppingCartIcon className="w-5 h-5 text-white hover:text-red-400" />
  </button>
</Tooltip>

                </div>
              </div>

              {/* Info */}
              <div className="p-3 text-center space-y-1">
                <h3 className="text-xs md:text-sm font-medium text-gray-800 line-clamp-2">
                  {product.productName}
                </h3>
                <div className="flex justify-center items-center gap-2">
                  <span className="text-red-500 font-medium text-xs md:text-sm">
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
    </div>
  );
};

export default LaptopDeals;


  