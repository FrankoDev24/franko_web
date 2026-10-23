# Name-only URLs and loading improvements

## Recommendation
Proceed with name-only product and brand slugs, e.g. `/product/samsung-galaxy-a56-5g`
and `/brand/samsung`. UUIDs remain in the database and all detail/cart/brand API
calls still use the original IDs. No backend endpoint changes are required.

The shared `src/utils/productSlug.js` is used by category pages, homepage deal
cards, navbar search and brand menus, wishlist/account, related products, recently
viewed items, structured data, and sitemap generation. React replaces legacy UUID
paths for usability, but **that is not an HTTP 301**.

### Duplicate names
A name-only URL cannot uniquely identify two different records with the same name.
The production generator rejects these collisions, rather than appending an ID or
publishing ambiguous URLs. Give product variants meaningful unique names (storage,
colour, model). For duplicate brand records (e.g. per-category Samsung records),
consolidate them or assign distinct descriptive public names before migrating.
Check the entire catalogue before launch. Names without letters/digits also block
migration. The UI uses deterministic names regardless of catalogue completeness.

## Generate production SEO artifacts
Run from `Franko_web`:

```
npm ci --legacy-peer-deps
npm run build
```

Default builds now use the authorized spreadsheet snapshot described in
`seo/README.md` (356 products; four conflicting records and one invalid UUID are
withheld). Run `SEO_SOURCE=live npm run build` for the original live-source mode.

In live-source mode, the postbuild step fetches complete products and brands using existing
`VITE_LAMBDA_BASE_URL`, `VITE_LAMBDA_HEADER_NAME`, `VITE_LAMBDA_HEADER_VALUE` settings.
It deliberately fails if the catalogue is unavailable, empty, or ambiguous; do not
publish a partial migration. Alternatively provide complete JSON array exports:

```
SEO_PRODUCTS_FILE=/path/products.json SEO_BRANDS_FILE=/path/brands.json npm run build
```

Products must include `productID`, `productName`, `status`; brands must include
`brandId`, `brandName`. Only active products (`status = 1`) are indexed. Run in CI
with backend connectivity: this Arena environment cannot reach the live API host.
For an offline **preview only**, `SEO_STATIC_ONLY=1 npm run build` generates just
static routes, without product/brand sitemap entries or migration redirects.
Never use that mode to deploy the production migration.

Artifacts:
- `dist/sitemap.xml`: real public routes and name-only catalogue URLs; no UUIDs,
  fabricated modification dates, checkout/account URLs or obsolete static routes.
- `dist/_redirects`: product/brand UUID and trailing-slash paths → canonical paths
  with HTTP 301, followed by SPA fallback. Netlify-compatible (`301!`).
- `seo-redirects.nginx.conf`: exact-match Nginx locations for the same 301s.
- `dist/seo-index.json`: retain privately with release artifacts to track renames.
  It contains public IDs/names only; do not put credentials in catalogue exports.

On Netlify, deploy `dist` and ensure generated `_redirects` rules run before SPA
fallback. On Nginx, include `seo-redirects.nginx.conf` inside the site server block;
use `location / { try_files $uri $uri/ /index.html; }`. Enable gzip/Brotli and cache
hashed `/assets/` files for one year with `immutable`. Revalidate index.html and
sitemap.xml. For other hosting/CDN services, translate the generated exact mappings
into that platform's permanent redirects **before** its SPA rewrite.

For renames, pass `SEO_PREVIOUS_INDEX=/path/previous/seo-index.json` during build.
Archive redirects across releases and retain historical aliases for at least a
year (ideally indefinitely); the generator compares against the supplied snapshot,
not an entire historical database. Do not rename products casually after launch.

## Canonicals and launch validation
- Product and brand Helmet canonicals, Open Graph URLs and JSON-LD use the same
  name-only URLs as cards and sitemap. Removed the hardcoded global homepage
  canonical that otherwise appeared on every route; homepage owns its canonical.
- Direct slug visits resolve to UUIDs before using `fetchProductById(UUID)` or
  the existing products-by-brand endpoint. Legacy links remain usable in React.
- Runtime metadata is client-rendered as in the existing SPA. Non-JavaScript
  social crawlers may need prerendering/SSR later; this change does not add SSR.
- On the deployed host, check `curl -I https://www.frankotrading.com/product/UUID`
  and the equivalent brand URL: expect **301** plus the exact slug Location.
  Follow through to 200, preserving query strings with no loops. Test deep-link
  refreshes, back/forward, two consecutive product visits, unavailable products,
  navbar search, every category, related products, wishlist and cart/checkout.
- Submit the new sitemap in Search Console, keep redirects active, and monitor
  indexing, 404s, organic traffic and canonical selection. Temporary ranking and
  traffic fluctuations are normal as search engines recrawl and consolidate URLs;
  there is no guaranteed recovery timeline. Avoid reverting URLs back and forth.

## Loading performance
- Route-level lazy loading keeps agent dashboards, reports and checkout code out
  of the initial storefront route. Navbar authentication loads on demand.
- Six below-fold homepage sections use IntersectionObserver (600px prefetch margin)
  and lazy modules, with reserved placeholders and a no-observer fallback.
- Shared catalogue requests are coalesced and cached in memory for 60 seconds;
  failed requests are not cached. Brand reads avoid concurrent/recent duplicates.
- Product-card images are lazy/async; the first carousel image is high priority,
  later slide images lazy. UUID-to-slug canonical creation cannot use stale product
  details from a previously visited route.

Validate performance using Lighthouse mobile and field Core Web Vitals on the
production host. No live speed score or latency guarantee is claimed: API latency,
image sizes, caching/compression and third-party scripts still affect loading.
The build still warns about a large shared bundle; further vendor/UI-library
reduction and responsive image delivery would be useful follow-up work.

## Checks
`node --test src/utils/*.test.mjs` covers slug formatting, name-only links, brand
resolution, UUID/rename mappings, active-product sitemap inclusion and duplicate
rejection, plus existing cart/checkout regressions. Run the production build with
a real catalogue before deployment. Existing npm audit findings require separate
review; no unsafe force-upgrade is applied here.
