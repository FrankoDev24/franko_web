// src/hooks/useAddToCart.js
import { useCallback, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  getCartById,
  getOrCreateCartId,
} from "../Redux/Slice/cartSlice";

const EMPTY_CART = [];

const getProductId = (product) =>
  product?.productId ??
  product?.productID ??
  product?.ProductId ??
  product?.ProductID ??
  product?.id;

const getErrorMessage = (error) =>
  (typeof error === "string" ? error : error?.message || error?.Message) ||
  "Failed to add product to cart";

const useAddToCart = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart?.cart) || EMPTY_CART;
  const cartId = useSelector((state) => state.cart?.cartId);
  const [loading, setLoading] = useState(false);
  const inFlightRef = useRef(false);

  const addProductToCart = useCallback(async (product) => {
    const productId = getProductId(product);
    if (productId === undefined || productId === null || productId === "") {
      throw new Error("ProductId is required");
    }

    if (inFlightRef.current) {
      throw new Error("Please wait for the current item to finish adding.");
    }

    const isProductInCart = Array.isArray(cartItems) && cartItems.some((item) => {
      const itemId = getProductId(item);
      return itemId !== undefined && itemId !== null &&
        String(itemId) === String(productId);
    });

    if (isProductInCart) {
      throw new Error("Product is already in the cart");
    }

    const currentCartId = cartId || getOrCreateCartId();

    // IMPORTANT: carry the display metadata into the thunk.
    // The previous hook sent only an ID, price and quantity, so the reducer
    // could not populate productName/imagePath for the sidebar.
    const cartData = {
      CartId: currentCartId,
      ProductId: productId,
      ProductName: product.productName || product.ProductName || product.name || "",
      ImagePath:
        product.imagePath ||
        product.ImagePath ||
        product.productImage ||
        product.ProductImage ||
        "",
      Price: product.price ?? product.Price ?? product.unitPrice ?? product.UnitPrice ?? 0,
      Quantity: 1,
    };

    inFlightRef.current = true;
    setLoading(true);

    try {
      // A successful backend add, rather than a local-storage poll, confirms success.
      await dispatch(addToCart(cartData)).unwrap();

      // Analytics must not turn a successful cart add into a reported failure.
      try {
        if (typeof window !== "undefined") {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: "add_to_cart",
            ecommerce: {
              items: [{
                item_name: cartData.ProductName,
                item_id: productId,
                price: cartData.Price,
                quantity: 1,
              }],
            },
          });
        }
      } catch (error) {
        console.warn("Cart add succeeded, but analytics could not be recorded:", error);
      }

      // The updated slice retains known names/images if this response is sparse.
      // A refresh failure does not undo an add that the server already accepted.
      try {
        await dispatch(getCartById(currentCartId)).unwrap();
      } catch (error) {
        console.warn("Cart add succeeded, but the cart refresh failed:", error);
      }

      return true;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [cartId, cartItems, dispatch]);

  return { addProductToCart, loading };
};

export default useAddToCart;
