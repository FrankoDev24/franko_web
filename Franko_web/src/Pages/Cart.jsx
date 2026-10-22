// src/pages/Cart.jsx
import CartView from "../Component/CartView";

/**
 * Standard shopping-cart page — route: /cart/:cartId
 *
 * All rendering and cart behaviour lives in Component/CartView.jsx, backed
 * by Redux/Slice/cartSlice.js. The :cartId route param selects which cart
 * to open; the slice keeps every product added under that one id instead
 * of collapsing the cart to the single record Cart-GetbyID returns.
 */
const Cart = () => <CartView />;

export default Cart;
