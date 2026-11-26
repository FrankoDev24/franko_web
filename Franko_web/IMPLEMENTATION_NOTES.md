# Checkout update — handoff

The production frontend build succeeds. `node --test src/utils/checkoutFlow.test.mjs` passes (24 tests). Full `npm test` reports 64/65 passing: the existing pending-text test finds labels in CartView, ProductDetailModal and TelCartSidebar, outside the changed code.

Implemented: success-response recognition including the supplied trailing period and code 01; Telecel-only checkout selection and prefix validation; a light-green approval modal; an idle status check three minutes after the approval review opens; opt-in delivery address saving for signed-in users; prominent manual-location button; guest registration option; first-visit Black Friday campaign popup using the existing 2026 event dates; and duplicate prevention at the shared asynchronous cart-add layer.

Limitations requiring follow-up before production:
- The checkout remains browser-driven. It cannot guarantee dispatch or redirect when a user goes offline, closes the browser, or the order API fails after payment. Reliable processing requires a backend payment webhook/status reconciliation job and idempotent order creation keyed by transaction reference; test against the live gateway and order service before deployment. Do not pay again if a payment succeeded but the order needs assistance.
- Unknown, pending, and transport-error status responses are NOT automatically cancelled. They may represent a payment that succeeds later; cancellation without authoritative gateway cancellation or reconciliation risks losing a paid order. Explicit terminal failures still navigate to cancellation.
- The three-minute inactivity recheck only runs while the review modal is mounted. It is not a server-side timer.
- Guest registration uses the existing customer API and requires integration testing with its validation and login behaviour. A real recipient name and delivery address are still required at checkout.
- The MoMo OTP is held in component state, not stored in localStorage. Hashing a short OTP in localStorage would be vulnerable to brute force and cannot replace server-side verification. The existing app storage adapter uses reversible encryption, not hashing.
- Duplicate prevention covers the shared addToCart/createCartItem thunks; other independently implemented cart writes and cross-device/concurrent server requests require server-side uniqueness enforcement and integration tests.
- The location form was adjusted, not fully redesigned. No live payment or backend end-to-end tests were run.
- `.env` has been omitted from this archive. Configure deployment secrets separately; do not ship secrets in frontend bundles.
