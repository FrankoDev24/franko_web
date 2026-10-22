# Cart fix — "only one product shows in the cart"

**Date:** 2026-10-22 · **Scope:** cart pages, cart components, cart slice

## The bug

Adding multiple products left only ONE product visible in the cart.

`getCartById` in `src/Redux/Slice/cartSlice.js` assumed
`GET /Cart/Cart-GetbyID/{cartId}` returns a bare array of line items and
**replaced** the whole Redux cart with whatever it returned:

```js
if (!Array.isArray(response.data)) return response.data;  // one cart record
state.cart = Array.isArray(payload) ? payload : [];        // cart := that record
```

`Cart-GetbyID` looks a cart up **by its one cart id** and returns a single
cart record / enveloped payload. Every fetch — cart-page mount, Navbar login
sync, sidebar open, checkout mount, and the refetch after every quantity
change — therefore collapsed a multi-product cart down to that one record,
and the truncated list was then written back over `localStorage`.

The pages compounded it: hand-written optimistic `localStorage` writes before
each refetch, a fetch effect keyed on `cartId` (which the fetch itself could
change, via `cartData[0]?.cartId`), and a cart id that was nulled when the
cart emptied — orphaning the server-side cart behind a brand-new id.

## The fix

**One canonical cart id, merge-only fetches, one row per product.**

- `src/utils/cartItems.mjs` *(new)* — pure helpers:
  - `extractCartItems()` unwraps any GetbyID response shape: bare array,
    single cart record, `{ data: [...] }`, `{ response: { data: [...] } }`,
    cart header with nested `items`/`cartItems`, stringified JSON.
  - `mergeCartItems()` **unions** server lines with locally added lines.
    A fetch can add/refresh lines, but can never silently delete a product —
    lines leave only via explicit delete / update-to-zero / clear.
  - `normalizeCartItem`, `dedupeCartItems`, `upsertCartItem`,
    `setCartItemQuantity`, `removeCartItem`, `cartTotals`, `resolveCartIdValue`.
- `src/Redux/Slice/cartSlice.js` *(rewritten)* — cart id minted once, kept in
  `localStorage`, never taken from `cartData[0]`, never nulled on empty, only
  rotated by `clearCart()` after a completed order. `getCartById(cartId?)`
  honours the id callers pass, unwraps the response, merges it against
  post-request state (so adds landing mid-fetch survive), and still fulfils
  with an **array** so existing `.unwrap()` callers (cart pages,
  `ProductDescription`, checkout) keep working. Same public exports as
  before (`addToCart`, `createCartItem`, `updateCartItem`, `deleteCartItem`,
  `clearCart`, `addCart`, `removeFromCart`, `setCartItems`,
  `getOrCreateCartId`, `generateTelCartId`, `isTelCartId`) plus selectors
  (`selectCartItems`, `selectCartId`, `selectCartCount`, `selectCartTotals`).
  `telCartSlice`'s identical `Array.isArray` guard was fixed the same way.
- `src/Component/CartView.jsx` *(new)* — the single cart-page body shared by
  both cart pages. Renders **every** line in `state.cart`, keyed by
  `productId`; fetches **once per cart id** (honouring the `/cart/:cartId`
  route param); no `localStorage` mirroring, no refetch-after-every-click;
  selection is pruned (not blanket-cleared) when the cart changes.
- `src/Pages/Cart.jsx`, `src/Pages/TelCart.jsx` *(rewritten)* — thin wrappers
  over `CartView` (standard: green → `/checkout`; Telecel: red →
  `/tel-checkout`, cart-id copy pill, sidebar quick-view). Both were
  previously ~1,300-line duplicated implementations of the buggy pattern.
- `src/Component/Cart.jsx` (`useAddToCart`), `CartButton.jsx`,
  `TelCartSidebar.jsx`, `UpdateCartModal.jsx` *(rewritten)* — everything goes
  through the slice under the same canonical cart id; no hand-written
  optimistic storage writes or clobbering refetches. A failed server write
  reconciles with a single (now safe) merge-fetch.

## Verification

- `node --test src/utils/cartItems.test.mjs src/utils/checkoutFlow.test.mjs`
  → **38/38 pass**, including regression tests: local `[A, B, C]` merged with
  a single-record GetbyID reply stays `[A, B, C]`.
- Live slice simulation (real slice, mocked backend reproducing the bug):
  3 adds → 3 rows; single-record `Cart-GetbyID` → still 3 rows; enveloped
  reply merges quantities without dropping local-only lines; update/delete
  touch only their own line; persistence verified.
- `npm run build` succeeds; ESLint clean on the changed files.

## Running this copy

```bash
npm install
npm run dev      # development
npm run build    # production build (regenerates dist/)
```

`node_modules/` and the stale `dist/` build are excluded from this zip.

## Note

The `/tel-cart` route is still commented out in `src/App.jsx`, exactly as it
was before this fix. `Pages/TelCart.jsx` is rewritten and ready — uncomment
the import and route there to enable it.
