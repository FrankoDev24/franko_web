// src/components/AddToCartButton.jsx
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@material-tailwind/react";
import { ShoppingCartIcon, CheckIcon } from "@heroicons/react/24/outline";
import { message } from "antd";
import { addToCart } from "../Redux/Slice/cartSlice";

const CartButton = ({ product, className = "", fullWidth = false }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.cart);
  const cartId = useSelector((state) => state.cart.cartId);
  const [loading, setLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = () => {
    const isProductInCart = cartItems.some(
      (item) => item.productID === product.productID
    );

    if (isProductInCart) {
      message.warning({
        content: "Product is already in the cart.",
        duration: 3,
        style: {
          marginTop: '20vh',
        },
      });
      return;
    }

    setLoading(true);

    const cartData = {
      cartId,
      productID: product.productID,
      price: product.price,
      quantity: 1,
    };

    dispatch(addToCart(cartData))
      .then(() => {
        // Enhanced success notification
        message.success({
          content: `${product.productName || 'Product'} added to cart successfully! 🛒`,
          duration: 4,
          style: {
            marginTop: '20vh',
          },
        });

        // Visual feedback on button
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);

        // Google Analytics tracking
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "add_to_cart",
          ecommerce: {
            items: [
              {
                item_name: product.productName,
                item_id: product.productID,
                price: product.price,
                quantity: 1,
              },
            ],
          },
        });
      })
      .catch((error) => {
        message.error({
          content: `Failed to add product to cart: ${error?.message || "Unknown error"}`,
          duration: 5,
          style: {
            marginTop: '20vh',
          },
        });
      })
      .finally(() => setLoading(false));
  };

  return (
    <Button
      fullWidth={fullWidth}
      disabled={loading}
      onClick={handleAddToCart}
      className={`flex items-center gap-2 px-2 py-3 font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-md ${
        loading
          ? "bg-red-300 cursor-not-allowed"
          : justAdded
          ? "bg-green-500 hover:bg-green-600 text-white"
          : "bg-red-400 hover:bg-red-700 text-white"
      } ${className}`}
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Adding...
        </>
      ) : justAdded ? (
        <>
          <CheckIcon className="w-5 h-5" />
          Added!
        </>
      ) : (
        <>
          <ShoppingCartIcon className="w-5 h-5" />
          Add to Cart
        </>
      )}
    </Button>
  );
};

export default CartButton;