// src/components/AddToCartButton.jsx
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@material-tailwind/react";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { message } from "antd";
import { addToCart } from "../Redux/Slice/cartSlice";

const CartButton = ({ product, className = "", fullWidth = false }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.cart);
  const cartId = useSelector((state) => state.cart.cartId);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = () => {
    const isProductInCart = cartItems.some(
      (item) => item.productID === product.productID
    );

    if (isProductInCart) {
      message.warning("Product is already in the cart.");
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
        message.success("Product added to cart successfully!");
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
        message.error(
          `Failed to add product to cart: ${error?.message || "Unknown error"}`
        );
      })
      .finally(() => setLoading(false));
  };

  return (
    <Button
      fullWidth={fullWidth}
      disabled={loading}
      onClick={handleAddToCart}
      className={`flex items-center gap-2 px-4 py-3 font-semibold rounded-lg transition duration-300 hover:scale-105 shadow-md ${
        loading
          ? "bg-red-300 cursor-not-allowed"
          : "bg-red-400 hover:bg-red-700 text-white"
      } ${className}`}
    >
      <ShoppingCartIcon className="w-5 h-5" />
      {loading ? "Adding..." : "Add to Cart"}
    </Button>
  );
};

export default CartButton;
