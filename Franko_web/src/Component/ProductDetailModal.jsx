// Simplified version of ProductDetailModal with sticky bottom action bar
import React, { useEffect, useState } from "react";
import { Modal, InputNumber } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductById } from "../Redux/Slice/productSlice";
import { CheckCircleIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";
import { Helmet } from "react-helmet";
import useAddToCart from "./Cart";
import AuthModal from "../Component/AuthModal";

const formatPrice = (price) => price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const Badge = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 text-green-700 text-sm font-medium border border-green-200">
    <Icon className="w-4 h-4" />
    {text}
  </div>
);

const WhatsAppIcon = ({ className }) => (
   <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.63z"/>
  </svg>
);

const ProductDetailModal = ({ productID, isModalVisible, onClose }) => {
  const dispatch = useDispatch();
  const { addProductToCart, loading: cartLoading } = useAddToCart();
  const product = useSelector((state) => state.products.currentProduct?.[0]);

  const [quantity, setQuantity] = useState(1);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    if (productID && isModalVisible) {
      dispatch(fetchProductById(productID));
    }
  }, [dispatch, productID, isModalVisible]);
const handleAddToCart = async () => {
  const customer = JSON.parse(localStorage.getItem("customer"));
  if (!customer) return setAuthModalOpen(true);

  try {
    await addProductToCart({ ...product, quantity });
    onClose(); // ✅ Close modal after successful add to cart
  } catch {
    alert("Failed to add to cart");
  }
};

  const handleWhatsAppSupport = () => {
    const message = `Hi! I'm interested in:\n📦 ${product.productName}\n💰 ₵${formatPrice(product.price)} x ${quantity}\n💵 ₵${formatPrice(product.price * quantity)}`;
    window.open(`https://wa.me/+233246422338?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (!product) {
    return (
      <Modal open={isModalVisible} onCancel={onClose} footer={null} centered width="90%">
        <div className="text-center py-10">
          <div className="animate-spin h-10 w-10 mx-auto border-4 border-emerald-400 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </Modal>
    );
  }

  const imageUrl = `https://smfteapi.salesmate.app/Media/Products_Images/${product.productImage?.split("\\").pop()}`;

  return (
    <>
      <Modal
        open={isModalVisible}
        onCancel={onClose}
        footer={null}
        centered
        width="95%"
        bodyStyle={{ padding: 0, height: "90vh", display: "flex", flexDirection: "column" }}
        className="product-modal"
      >
        <Helmet>
          <title>{product.productName} - ₵{formatPrice(product.price)}</title>
          <meta name="description" content={`Buy ${product.productName} for ₵${formatPrice(product.price)}.`} />
        </Helmet>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          <div className="flex-1 p-4 bg-gray-50 flex items-center justify-center">
            <img
              src={imageUrl}
              alt={product.productName}
              className="rounded-2xl max-h-[400px] object-contain"
            />
          </div>

          <div className="flex-1 p-2 space-y-2 overflow-y-auto">
            <h1 className="text-md font-semibold text-gray-800">{product.productName}</h1>

            <div>
          
              <div className="text-red-600 text-lg font-bold">
                ₵{formatPrice(product.price)}
              </div>
            </div>

            <Badge icon={CheckCircleIcon} text="In Stock" />
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Description</h3>
              <div className="text-gray-600 text-sm max-h-32 md:max-h-72 overflow-y-auto whitespace-pre-line">
                {product.description}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-10">
          <div className="flex flex-wrap gap-2 md:gap-4 justify-center max-w-2xl mx-auto">
            <button
              onClick={handleAddToCart}
              disabled={cartLoading}
              className="flex-1 min-w-[160px] h-12 bg-red-100 text-red-700 border border-red-400 rounded-xl flex items-center justify-center gap-2 font-semibold hover:bg-red-200 transition"
            >
              {cartLoading ? (
                <div className="animate-spin border-2 border-red-500 border-t-transparent rounded-full h-5 w-5" />
              ) : (
                <ShoppingCartIcon className="w-5 h-5" />
              )}
              Add to Cart
            </button>

            <button
              onClick={handleWhatsAppSupport}
              className="flex-1 min-w-[160px] h-12 bg-green-600 text-white rounded-xl flex items-center justify-center gap-2 font-semibold hover:bg-green-700 transition"
            >
              <WhatsAppIcon className="w-5 h-5" />
              WhatsApp Support
            </button>
          </div>
        </div>
      </Modal>

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};

export default ProductDetailModal;
