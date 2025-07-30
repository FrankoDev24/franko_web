// src/components/AddToCartButton.jsx
import { useState } from "react";
import { Button } from "@material-tailwind/react";
import { ShoppingCartIcon, CheckIcon } from "@heroicons/react/24/outline";
import { message } from "antd";
import useAddToCart from "./Cart";

const CartButton = ({ product, className = "", fullWidth = false }) => {
  const { addProductToCart, loading } = useAddToCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleClick = async () => {
    try {
      await addProductToCart(product);

      // Show success message
      message.success({
        content: `${product.productName || "Product"} added to cart successfully! 🛒`,
        duration: 4,
        style: { marginTop: "20vh" },
      });

      // Temporary visual feedback
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } catch (error) {
      message.warning({
        content: error?.message || "Failed to add product to cart",
        duration: 5,
        style: { marginTop: "20vh" },
      });
    }
  };

  return (
    <Button
      fullWidth={fullWidth}
      disabled={loading}
      onClick={handleClick}
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
