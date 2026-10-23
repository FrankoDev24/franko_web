# Text-free pending states and faster product pages

- Removed visible pending labels throughout storefront and agent pages, including
  route/auth fallbacks, category headers/counts, profile, cart, orders and product
  enrichment. Existing spinners/card skeletons remain, and route/deferred sections
  use a shared skeleton. State variable names and native image `loading` attributes
  are implementation details, not displayed words.
- Product information displays trimmed `brandName` and descriptive `tag` values.
  Numeric codes, empty values and missing tags are hidden. The supplied Samsung
  Fold 8 example displays Samsung and hides tag 23295652. Text like New Arrival,
  Best Seller and 5G Offer appears as a badge; text is escaped by React.
- Product detail API requests start immediately for indexed product slugs and UUID
  URLs, without waiting for the whole catalogue. New names still fall back to
  the live catalogue. Backend UUID APIs are unchanged; prices/stock remain live.
- Separate detail request status avoids hiding a ready product while unrelated
  category/catalogue requests run. Latest-request guards prevent old responses
  from overwriting a more recent product visit. Concurrent reads for one UUID
  share a request; there is no completed-response price/stock cache.
- The active product image gets high priority; hidden gallery images aren't
  requested until selected. Existing preview group and gallery navigation remain.
- Narrow Material Tailwind and lodash module imports keep unused components out
  of the shared storefront bundle. Route splitting, deferred homepage sections and
  catalogue request sharing from earlier updates are retained.

55 automated tests pass, including tag rules, the supplied response shape, local
slug lookup, concurrent request reuse, failure retry and a source-level guard
against reintroducing the forbidden visible pending label. Production build passes.
A shared large-bundle warning remains. Actual production speed depends on backend
latency, image delivery and hosting compression; no live speed score is claimed.

Deploy the full rebuilt dist directory, not a mixture of old/new hashed assets.
Keep the same deployment environment variables and reload the browser fully.
The sitemap and duplicate/invalid-record reports are unchanged.
