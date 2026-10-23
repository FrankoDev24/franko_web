# Product navigation clarification — latest behavior

This note supersedes the no-product-skeleton behavior in INSTANT_NAVIGATION.md
and earlier delivery notes.

Clicking a product changes the route immediately to its name-only detail URL.
The route-level Suspense boundary is keyed by pathname so React does not retain
the homepage while the destination's JavaScript is pending. Its fallback is the
product-detail skeleton, and the detail page also shows that skeleton until a
successful full detail response is available. Catalogue card data is used only
for immediate UUID resolution, not presented as completed detail data.

The skeleton contains no visible pending-state wording. Fresh full detail data
can render directly without an artificial wait. Once details are displayed, an
unrelated rerender does not hide them merely because the cache TTL passes.

Homepage appearance, five-minute public-read caching, safe private endpoints,
60-second detail reuse, SEO URLs, sitemap, brand/tag and storage fixes remain.
63 regression tests pass; production build succeeds. Production browser smoke
testing remains necessary. Deploy the complete latest dist folder and reload tabs.
