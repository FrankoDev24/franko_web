# Instant product navigation and cached homepage return

This update preserves the homepage design, section ordering, cards, banners and
carousels. It does not rebuild or redesign the homepage to resemble a different
site. Existing fixed category/brand content is still rendered as before.

## Product clicks
- Catalogue responses already fetched for cards populate bounded session-memory
  product records. A click renders that product's real name, price, image, brand
  and available description immediately, without waiting for a second API call.
- Product code is warmed during browser idle time and pointer/focus intent. This
  preloads JavaScript only; it does not prefetch every product from the database.
- Removed skeleton fallbacks from the product route and detail component. A cold
  direct link with no cached product shows the actual static page frame and known
  name until its live data arrives. We never fabricate prices or availability.
- Detail API calls still use UUIDs. The first visit refreshes details separately;
  returning to the same product within 60 seconds reuses its successful detail
  response. A changed product/expired data needs a fresh request. Existing error
  handling and latest-request guards remain.

## Home -> product -> Home
- Public catalogue/category/brand/showroom/advert reads share a five-minute
  in-memory cache and coalesce identical in-flight requests. Return navigation
  may dispatch Redux actions, but fresh responses cause no additional HTTP or
  backend/database request. A full reload, expired cache, or changed catalogue
  legitimately fetches new data.
- Cache keys include category/showroom/record count/advert parameters so unrelated
  sections do not receive one another's data. Empty successful lists cache too;
  failures do not. Memory is bounded and catalogue mutations invalidate reads.
- Cached cards no longer disappear behind a global shared pending flag/skeleton
  while another section fetches. Cached banner/info-banner data and the first
  showroom are used synchronously on remount. Homepage layout/order is unchanged.
- Account, cart, payment, orders, authentication and other private endpoints are
  never included in this public-read cache. Cart mutations do not invalidate the
  public catalogue. Checkout/server validation remains authoritative for prices.

## Checks
63 Node tests pass, including cache reuse, TTL, empty results, in-flight sharing,
failure retry, invalidation races, synchronous clicked-product data and route
fallback guards. A mocked Axios/Redux integration check confirmed four initial
home read requests and zero additional requests when repeating those reads, with
the clicked product available synchronously. This is not a live browser/DB timing
measurement. Production build passes; existing large shared chunk warning remains.

Deploy the full latest dist directory; keep existing environment variables and
fully refresh browser tabs. The sitemap, slug URLs, brand/tag rules and previous
storage/navbar fixes are retained. See START-HERE.txt in the delivery ZIP.
