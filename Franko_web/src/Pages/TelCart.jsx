// src/pages/TelCart.jsx
import { Helmet } from "react-helmet";
import CartView from "../Component/CartView";
import {
  TelCartSidebarProvider,
  useTelCartSidebar,
} from "../Component/TelCartSidebar";

/**
 * Telecel Speed Shopping cart page — route: /tel-cart
 *
 * Same cart, same slice, same data path as the standard cart page
 * (Component/CartView.jsx renders it) — only the branding is red and
 * checkout hands off to /tel-checkout. Cart ids are minted with the "Tel"
 * prefix by cartSlice, which is what keeps this flow's cart recognisable.
 * Rendering every line from the shared view is what stops the Speed
 * Shopping cart from collapsing to the one record Cart-GetbyID returns.
 */
const TelCart = () => (
  <TelCartSidebarProvider>
    <TelCartInner />
  </TelCartSidebarProvider>
);

const TelCartInner = () => {
  const { openSidebar } = useTelCartSidebar();

  return (
    <>
      <Helmet>
        <title>Shopping Cart | Franko Trading</title>
      </Helmet>
      <CartView telecel onOpenSidebar={openSidebar} />
    </>
  );
};

export default TelCart;
