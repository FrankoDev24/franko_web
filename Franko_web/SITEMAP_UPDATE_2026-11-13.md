# Sitemap rebuild — 2026-11-13

Source: [products_export_2026-11-12](https://docs.google.com/spreadsheets/d/1n2tsPflhrrhIqfvH_n93zO3yFqOpekGmftubAh2Ls1Y/edit?usp=sharing)
(365 rows), exported through the Google Drive connector. The spreadsheet was
read only; it was not modified.

## What changed

| | Before (v4) | After |
|---|---|---|
| Product rows in checked-in snapshot | 15 | **365** |
| Product URLs in `public/sitemap.xml` | 15 | **365** |
| Total `<loc>` entries | 30 | **380** (365 products + 15 static) |
| UUID → name-only 301 redirects | 15 | **364** |
| `seo-index.json` product entries | 15 | **364** |
| Conflicting name-only slugs | 0 | **0** |

`seo/data/products-2026-11-12-full.csv` replaced the truncated 15-row export.
`seo/data/products.json` now holds the 364 records with valid UUIDs (this file
is also the runtime route index). One row — S/N 156, `itel 5600 new`, whose
sheet UUID ends in a non-hex `s` — is recorded in
`seo/data/product-sitemap-only.json` and `product-invalid.json`. Its real
name-only URL `/product/itel-5600-new` **is** in the sitemap, but no legacy
`/product/<uuid>` redirect was invented and it is not in the runtime index.
Correct that UUID in the catalogue / next export to close the gap.

## Files touched

- `seo/data/products-2026-11-12-full.csv` (replaced)
- `seo/data/products.json`, `product-sitemap-only.json` (new),
  `product-invalid.json`, `product-conflicts.json` (regenerated)
- `scripts/import-seo-products.py` — publishes name-only URLs for malformed-UUID
  rows without fabricating IDs
- `scripts/seo-artifacts.mjs` — accepts `sitemapOnly` records: sitemap entry yes,
  UUID redirect / index entry no
- `generate-sitemap.js` — merges sitemap-only records into SEO generation only
- `public/sitemap.xml`, `public/_redirects`, `public/seo-index.json`,
  `seo-redirects.nginx.conf` (regenerated)
- `src/utils/productSlug.test.mjs` — expectations updated; new assertion that
  all 365 rows appear exactly once
- `seo/README.md`, `SEO_MIGRATION.md`, `RUNTIME_FIXES.md` (docs refreshed)
- `.env.example` (new): key names only. The refreshed project ZIP deliberately
  excludes the real `.env` that was embedded in the publicly shared v4 archive —
  restore your own `.env` before building, and rotate those credentials.

## Verification

- XML parses; 380 `<loc>` values, no duplicates, no UUID URLs, all on
  `https://www.frankotrading.com`.
- Every one of the 365 sheet names produces a slug via the app's own
  `src/utils/productSlug.js` and that exact URL is present. Zero missing, zero
  unexpected.
- All 15 product URLs from v4 are still present.
- `node --test src/utils/*.test.mjs`: 61/62 pass. The single failure
  (`pendingText.test.mjs`, "forbidden pending label" in `CartView.jsx` and
  `ProductDetailModal.jsx`) is pre-existing in the untouched v4 archive —
  confirmed by running the same test against a pristine extraction.

## Deployment

Deploy `dist` (or copy `public/sitemap.xml`, `public/_redirects` and
`public/seo-index.json` into your published `dist`) together with the
`seo-redirects.nginx.conf` rules / Netlify `_redirects`. Keep the 301 rules
ahead of the SPA fallback. Then submit
`https://www.frankotrading.com/sitemap.xml` in Search Console. Live product
availability still comes from the API; this sitemap is a discovery list built
from the owner-approved sheet, not a stock feed.
