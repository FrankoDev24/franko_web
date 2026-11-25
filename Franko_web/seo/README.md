# Spreadsheet Product Sitemap Source

Current source: [products_export_2026-11-25.xlsx](https://docs.google.com/spreadsheets/d/1Zj_KmNppRhzZTngCgI6k4lLAEz5qtl3L/edit?usp=sharing),
`Products` tab, imported on 2026-11-25. The source spreadsheet was not edited.
This replaces the earlier `products_export_2026-11-12` snapshot (365 rows / 364
validated UUIDs) and the original `products_export_2026-10-23` snapshot (361
rows / 356 products).

- `data/products-2026-11-25-full.csv`: complete authorized export, **382 rows**.
- `data/products.json`: **381** validated product IDs/names. This also drives
  the runtime route index (`src/utils/productRouteIndex.mjs`), so every entry
  must have a valid UUID.
- `data/product-sitemap-only.json`: **1** row whose sheet UUID is malformed
  (S/N 173, `itel 5600 new`, `f4f29be2-e84a-4c75-b53f-082c7e20567s`). Its
  name-only URL `/product/itel-5600-new` is still published in `sitemap.xml`,
  but no legacy `/product/<uuid>` redirect is fabricated for it and it is kept
  out of the runtime route index. Fix the UUID in the catalogue / next export
  to restore full redirect and index coverage.
- `data/product-invalid.json`: audit trail for that malformed row.
- `data/product-conflicts.json`: empty — zero slug collisions across all 382
  products.
- `data/products-2026-10-23.csv`, `data/products-2026-11-12-full.csv`:
  historical snapshots kept for traceability, not read by the build.

The sheet provides names and IDs, **not** backend status, stock, modification
times, or brand data. `status: 1` in the generated snapshot is an inclusion
marker for this owner-approved sitemap list, not a verified live availability
assertion; live product availability continues to come from the API. Names are
preserved verbatim so the exact shared JavaScript `slugify` function
(`src/utils/productSlug.js`) guarantees agreement between the live UI and the
sitemap.

## Current Result

- `public/sitemap.xml`: **397 `<loc>` URLs** (**15 static URLs + 382 unique
  product URLs**), zero duplicate `<loc>` values, zero raw UUID URLs, and zero
  checkout/account routes.
- `_redirects` / `seo-redirects.nginx.conf`: **381** permanent legacy
  `/product/<uuid>` → `/product/<slug>` 301 redirects (plus trailing-slash
  variants).
- `seo-index.json`: indexes all **381** validated product UUIDs.

## Refresh from a Newer Authorized Export

```bash
cp /path/to/new-export.csv seo/data/products-YYYY-MM-DD-full.csv
python3 scripts/import-seo-products.py seo/data/products-YYYY-MM-DD-full.csv
npm run generate:sitemap
npm run build
```

Default builds use the checked-in snapshot and require **no `.env` file** or
live backend credentials. To generate directly from the live API instead, pass
the API variables via your environment (not a `.env` file) and run
`SEO_SOURCE=live npm run build`. Deploy the generated `_redirects` / Nginx
rules alongside `dist/`.
