import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { Image} from "antd";
import { fetchProductById, fetchProducts } from "../Redux/Slice/productSlice";
import ProductDetailSkeleton from "../Component/ProductDetailSkeleton";
import { Button, Tooltip, IconButton } from "@material-tailwind/react";
import {ShoppingCartIcon,CheckCircleIcon,HeartIcon as OutlineHeartIcon,EyeIcon,TruckIcon,ShieldCheckIcon, PhoneIcon,CreditCardIcon,ShareIcon,} from "@heroicons/react/24/outline";
import { ShoppingBagIcon } from "@heroicons/react/24/outline"; // Make sure this is imported
import { FaWhatsapp } from "react-icons/fa";
import CartButton from "../Component/CartButton";
import ProductCard from "../Component/ProductCard";
import useAddToCart from "../Component/Cart";

const formatPrice = (price) =>
  price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const ProductDescription = () => {
  const { productID } = useParams();

  const { addProductToCart, loading: cartLoading } = useAddToCart();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentProduct, products, loading } = useSelector((state) => state.products);
  const [viewedProducts, setViewedProducts] = useState([]);
  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchProductById(productID));
    window.scrollTo(0, 0);
  }, [dispatch, productID]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("viewedProducts")) || [];
    setViewedProducts(stored);
  }, []);

  useEffect(() => {
    if (currentProduct?.length > 0) {
      const prod = currentProduct[0];
      const image = `https://smfteapi.salesmate.app/Media/Products_Images/${prod.productImage
        .split("\\")
        .pop()}`;
      const viewedItem = {
        id: prod.productID,
        name: prod.productName,
        price: prod.price,
        image,
      };

      const stored = JSON.parse(localStorage.getItem("viewedProducts")) || [];
      const updated = [
        viewedItem,
        ...stored.filter((item) => item.id !== viewedItem.id),
      ].slice(0, 4);

      localStorage.setItem("viewedProducts", JSON.stringify(updated));
      setViewedProducts(updated);
    }
  }, [currentProduct]);

  const handleShare = (platform) => {
    const url = window.location.href;
    const shareUrl =
      platform === "facebook"
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            url
          )}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank");
  };

// Helper: Get valid image URL
const getValidImageUrl = (imagePath) => {
  if (!imagePath) return "https://via.placeholder.com/150";
  return imagePath.includes("\\")
    ? `https://smfteapi.salesmate.app/Media/Products_Images/${imagePath.split("\\").pop()}`
    : imagePath;
};
  const handlePlaceOrder = () => {
    alert("Redirecting to order form...");
  };

  if (loading || !currentProduct?.length) {
    return <ProductDetailSkeleton />;
  }

  const product = currentProduct[0];
  const imageUrl = `https://smfteapi.salesmate.app/Media/Products_Images/${product.productImage
    .split("\\")
    .pop()}`;
  const descriptionLines = product.description.split("\n").map((line, i) => (
    <p key={i} className="text-sm text-gray-700 mb-1">
      {line}
    </p>
  ));

  const related = products.slice(-12);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-2 gap-12">
        <div className="flex justify-center items-start">
          <Image.PreviewGroup>
            <Image
              src={imageUrl}
              className="rounded-2xl shadow-xl object-cover max-w-full transition-transform duration-300 hover:scale-105"
              alt={product.productName}
            />
          </Image.PreviewGroup>
        </div>

        <div className="space-y-4">
          {/* Product Title */}
          <div className="font-bold text-gray-700 text-lg md:text-xl">
            {product.productName}
          </div>

          {/* Price Section */}
          <div className="flex items-center gap-4">
            <div className="text-lg md:text-xl font-bold text-red-500 bg-red-50 px-4 py-1.5 rounded-xl shadow-sm">
              ₵{formatPrice(product.price)}.00
            </div>
            {product.oldPrice > 0 && (
              <div className="text-sm text-gray-400 line-through">
                ₵{formatPrice(product.oldPrice)}.00
              </div>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2 px-4 py-1 rounded-lg bg-green-50 text-green-800 text-sm font-semibold shadow-sm border border-green-200 hover:shadow-md transition duration-200 w-max">
            <CheckCircleIcon className="w-4 h-4 text-green-600" />
            <span>In Stock</span>
          </div>

          {/* Product Description */}
          <div className="mt-2">
            <div className="flex items-center justify-between ">
              <div className="flex items-center gap-3">
                <h2 className="text-sm md:text-md font-bold text-gray-700 relative whitespace-nowrap mt-4 mb-3">
                  Product Description
                  <span className="absolute -bottom-1 left-0 w-16 h-1 bg-red-400 rounded-full "></span>
                </h2>
              </div>

              {/* Share Icon at far right */}
            </div>

            <div className="bg-white p-2 max-h-72 overflow-y-auto  transition-all duration-300 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100">
              <div className="space-y-4 text-gray-800 text-base leading-relaxed">
                {descriptionLines}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            {/* Desktop Buttons */}
            <div className="hidden md:flex flex-wrap gap-4 items-center">
            <CartButton product={product} />

              <Button
                variant="outlined"
                className="border border-green-600 text-green-600 font-semibold  shadow-lg flex items-center gap-2 px-4 py-3 transition duration-300 hover:scale-105 hover:bg-green-50"
                onClick={handlePlaceOrder}
              >
                <ShoppingBagIcon className="w-5 h-5" />
                Buy Now
              </Button>

              <a
                href={`https://wa.me/233XXXXXXXXX?text=Hi! I’m interested in buying the ${encodeURIComponent(
                  product?.name
                )}. Is it currently available, and what’s the price?}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white font-Semibold rounded-lg shadow-lg flex items-center gap-2 px-4 py-2 transition duration-300 hover:scale-105"
              >
                <FaWhatsapp c lassName="w-5 h-5" />
                Chat with Sales
              </a>
              <IconButton
                onClick={() => handleShare("general")}
                className="bg-green-300 text-white rounded-full p-3 shadow-lg transition duration-300 hover:scale-110"
              >
                <ShareIcon className="w-5 h-5" />
              </IconButton>
            </div>

            {/* Mobile Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-xl z-50 flex items-center justify-between md:hidden">
              <div className="flex gap-3 w-full">
                <CartButton product={product} fullWidth />

                <Button
                  variant="outlined"
                  fullWidth
                  className="border border-green-600 text-green-600 font-semibold rounded-xl flex items-center justify-center gap-2 py-3 transition duration-300 hover:scale-105 shadow-md"
                  onClick={handlePlaceOrder}
                >
                  <ShoppingBagIcon className="w-5 h-5" />
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm text-gray-700 mt-2 md:mt-6">
        {[
          "Fast Shipping",
          "Quality Assurance",
          "Customer Support",
          "Secure Payment",
        ].map((title, idx) => {
          const icon = [
            <TruckIcon className="w-5 h-5 text-red-600" />,
            <ShieldCheckIcon className="w-5 h-5 text-green-600" />,
            <PhoneIcon className="w-5 h-5 text-red-400" />,
            <CreditCardIcon className="w-5 h-5 text-teal-500" />,
          ];
          const subtitle = [
            "All over Ghana",
            "certified products",
            "Dedicated support team",
            "Safe Payment Processing",
          ];

          return (
            <div
              key={idx}
              className="flex items-start gap-2 hover:bg-gray-50 p-2 rounded-lg transition"
            >
              {icon[idx]}
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-xs text-gray-500">{subtitle[idx]}</p>
              </div>
            </div>
          );
        })}
      </div>
      {viewedProducts.length > 0 && (
  <section className="mt-16">
    <h2 className="text-sm md:text-lg font-bold text-gray-900 relative whitespace-nowrap mb-6">
      Recently Viewed
      <span className="absolute -bottom-1 left-0 w-16 h-1 bg-red-400 rounded-full "></span>
    </h2>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {viewedProducts.map((product, index) => {
        const discount =
          product.oldPrice > 0
            ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
            : 0;

        const imageUrl = getValidImageUrl(product.image);

        return (
          <div
            key={product.id || index}
            className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
          >
            <div className="relative overflow-hidden">
              {/* Discount badge */}
              {discount > 0 && (
                <span className="absolute top-2 left-2 bg-red-400 text-white text-xs font-semibold px-2 py-1 rounded-full z-10 w-10 h-10 flex items-center justify-center">
                  -{discount}%
                </span>
              )}

              {/* Product Image */}
              <div
                className="h-40 md:h-52 w-full flex items-center justify-center cursor-pointer transition-transform duration-300"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Hover icons */}
              <div className="absolute inset-0 hidden group-hover:flex items-center justify-center gap-3 bg-black/40 z-20 transition-all">
                <Tooltip content="Add to Wishlist" placement="top">
                  <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full">
                    <OutlineHeartIcon className="w-5 h-5 text-white hover:text-red-400" />
                  </button>
                </Tooltip>
                <Tooltip content="View Details" placement="top">
                  <button
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <EyeIcon className="w-5 h-5 text-white hover:text-yellow-400" />
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

            {/* Product info */}
            <div className="p-3 text-center space-y-1">
              <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
                {product.name || "Unnamed Product"}
              </h3>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-red-500 font-medium text-sm">
                  {formatPrice(product.price)}
                </span>
                {product.oldPrice > 0 && (
                  <span className="text-xs line-through text-gray-400">
                    {formatPrice(product.oldPrice)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </section>
)}



{related.length > 0 && (
  <section className="mt-10">
    <h2 className="text-sm md:text-lg font-bold text-gray-900 relative whitespace-nowrap mb-6">
      You May Also Like
      <span className="absolute -bottom-1 left-0 w-16 h-1 bg-red-400 rounded-full "></span>
    </h2>
    <ProductCard currentProducts={related} navigate={navigate} />
  </section>
)}

    </div>
  );
};

export default ProductDescription;
