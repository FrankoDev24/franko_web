# Spreadsheet product sitemap source

Current source: [products_export_2026-11-12](https://docs.google.com/spreadsheets/d/1n2tsPflhrrhIqfvH_n93zO3yFqOpekGmftubAh2Ls1Y/edit?usp=sharing),
Products tab, exported as CSV through the authorized Google Drive connector on
2026-11-13. The spreadsheet itself was not edited. This replaces the earlier
[products_export_2026-10-23](https://docs.google.com/spreadsheets/d/1Nm9_dl7ezRs4lW8KnEEyzBnv6dxRJhhN_CddGaCxLV0/edit)
snapshot (361 rows / 356 products).

- `data/products-2026-11-12-full.csv`: complete authorized export, **365 rows**.
- `data/products.json`: **364** validated product IDs/names. This is also the
  runtime route index (`src/utils/productRouteIndex.mjs`), so every entry must
  have a valid UUID.
- `data/product-sitemap-only.json`: **1** row whose sheet UUID is malformed
  (S/N 156, `itel 5600 new`, `f4f29be2-…-082c7e20567s`). Its name-only URL
  `/product/itel-5600-new` is still published in the sitemap, but no legacy
  `/product/<uuid>` redirect is invented for it and it is kept out of the
  runtime index. Correct the UUID in the catalogue / next export to give it a
  redirect and full index coverage.
- `data/product-invalid.json`: audit trail for that malformed row.
- `data/product-conflicts.json`: empty — no two records share a name-only slug
  in this export. (The older snapshot had four conflicting records.)
- `data/products-2026-10-23.csv`, `products-2026-11-12-sample.csv`: historical
  and debugging artefacts, not used by the build.

The sheet provides names and IDs, **not** backend status, stock, modification
times or brand data. All 365 rows say `In Stock`; `status: 1` in the generated
snapshot is an inclusion marker for this owner-approved sitemap list, not a
verified live availability assertion. Existing API calls still control live
product display/stock. Names (including apparent typos and literal backslash
sequences) are preserved; the exact shared JavaScript `slugify` function
(`src/utils/productSlug.js`) produces the URLs. Do not silently correct a name
in the sitemap alone: the site and sitemap must agree.

## Current result

`sitemap.xml` contains **365 product URLs + 15 static URLs = 380 URLs**
(previously 30 URLs: only 15 products had been checked into `v4`).
`_redirects` / `seo-redirects.nginx.conf` contain **364** permanent UUID →
name-only 301s (729 Netlify lines with trailing-slash variants), and
`seo-index.json` indexes the 364 validated IDs. The 15 original v4 product
URLs are all still present. No UUID URLs, duplicate `<loc>` values, checkout or
account routes are published.

## Refresh from a newer authorized CSV

```
python3 scripts/import-seo-products.py /path/to/new-export.csv
cp /path/to/new-export.csv seo/data/products-YYYY-MM-DD-full.csv
node generate-sitemap.js     # or: npm run generate:sitemap
npm run build
```

Default builds use the checked-in snapshot, so product sitemap entries are not
lost during an offline build. This is a snapshot, **not** automatic
synchronization with future spreadsheet edits. To restore live-catalogue
generation explicitly: `SEO_SOURCE=live npm run build`. `SEO_PRODUCTS_FILE`
and `SEO_BRANDS_FILE` still support complete JSON exports. Brand entries
require brand IDs/names, which this sheet does not contain. Deploy the
generated `_redirects` / Nginx rules along with `dist`.

`public/robots.txt` already advertises the production sitemap location. Deploy
before submitting `https://www.frankotrading.com/sitemap.xml` to Search
Console. A sitemap supports discovery; search engines decide whether and when
to index each page.
