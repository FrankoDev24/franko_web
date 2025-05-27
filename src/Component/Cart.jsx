// src/hooks/useAddToCart.js
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { message } from "antd";
import { addToCart } from "../Redux/Slice/cartSlice";

const useAddToCart = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.cart);
  const cartId = useSelector((state) => state.cart.cartId);
  const [loading, setLoading] = useState(false);

  const addProductToCart = async (product) => {
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

    try {
      await dispatch(addToCart(cartData)).unwrap();
      message.success("Product added to cart successfully!");

      // Optional: Google Tag Manager or similar
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
    } catch (error) {
      message.error(
        `Failed to add product to cart: ${error?.message || "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return { addProductToCart, loading };
};

export default useAddToCart;
