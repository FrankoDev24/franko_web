# Runtime fixes (2026-10-23)

## Storage decryption errors
Removed both global Storage.prototype patches. All app storage consumers now
explicitly import the app adapter from utils/secureLocalStorageInit.js; browser
localStorage/sessionStorage remain native for third-party widgets such as Tawk.
The adapter preserves existing object/JSON app consumers, reads legacy encrypted
entries (including nested encryption), and drops only an individual unreadable
app entry rather than clearing all storage. An entry encrypted with a different
VITE_SECRET_KEY cannot be recovered; that user may need to sign in again. Keep the
same deployment key across builds. Client-side encryption is not an authorization
boundary and must not be used to protect server credentials.

## categories.filter crash
Category and brand reads normalize arrays and known JSON/Lambda wrappers; error
objects reject the thunk instead of entering list state. A Redux Persist migration
repairs cached non-array lists and resets stale loading flags. Navbar selectors
also guard categories, brands and products independently, covering cached data
before the next request completes. Backend errors still need investigation if
requests fail; normalization does not turn an authorization error into success.

## React Router warnings
Enabled v7_startTransition and v7_relativeSplatPath on BrowserRouter. Page lazy
imports are already declared at module scope.

## Validation and deployment
49 Node regression tests pass, including legacy storage, third-party key isolation,
malformed persisted state and wrapped category responses. Vite production build
passes. Existing large-chunk warning remains. Live backend/widget operation and
production browser integration must still be smoke-tested after deployment.

Deploy the corrected dist folder and perform a full page reload: an already-open
page retains old prototype patches until its JavaScript context is replaced. No
manual clearing of all browser storage is required. Test an existing browser
profile, login, cart, wishlist, category menus, chat, and direct agent routes. The
356 product / 371 total sitemap URLs and redirect rules are unchanged.
