# Spreadsheet product sitemap source

Source: [products_export_2026-10-23](https://docs.google.com/spreadsheets/d/1Nm9_dl7ezRs4lW8KnEEyzBnv6dxRJhhN_CddGaCxLV0/edit), Products tab, read via the authorized Google Sheets/Drive connectors.
Snapshot imported 2026-10-23. The source spreadsheet was not edited.

- `data/products-2026-10-23.csv`: complete authorized export, 361 rows.
- `data/products.json`: 356 unique, validated product IDs/names used by normal builds.
- `data/product-invalid.json`: one malformed UUID (row 147, itel 5600 new),
  withheld rather than guessing the intended ID.
- `data/product-conflicts.json`: four records in two conflicting name-only slugs,
  withheld to avoid choosing an arbitrary UUID or making up product variants.

The sheet provides names and IDs, **not** backend status, stock, modification times
or brand data. `status: 1` in the generated snapshot is an inclusion marker for
this owner-approved sitemap list, not a verified live availability assertion.
Existing API calls still control live product display/stock. Names (including
apparent typos and literal backslash sequences) are preserved; the exact shared
JavaScript slug function produces URLs. Do not silently correct a name in the
sitemap alone: the site and sitemap must agree.

Resolve conflicts by assigning meaningful unique product names in the catalogue
and supplying a fresh sheet export, or confirming which duplicate ID is canonical:

- Samsung Galaxy Flip 7 (12GB + 512GB) - Plus Free Voucher
- Samsung S24+ (512GB + 12GB) - Plus Free Voucher

To refresh from a newer authorized CSV:

```
python scripts/import-seo-products.py /path/to/new-export.csv
npm run generate:sitemap
npm run build
```

Default builds use the checked-in snapshot, so product sitemap entries are not
lost during an offline build. This is a snapshot, not automatic synchronization
with future spreadsheet edits. To restore live-catalogue generation explicitly:
`SEO_SOURCE=live npm run build`. `SEO_PRODUCTS_FILE` and `SEO_BRANDS_FILE` still
support complete JSON exports. Brand entries require brand IDs/names, which this
sheet does not contain. Deploy the generated redirects along with `dist`.

The sitemap contains 356 product URLs plus 15 static URLs = **371 URLs**.
`public/robots.txt` already advertises its production location. Deploy before
submitting `https://www.frankotrading.com/sitemap.xml` to Search Console. A sitemap
supports discovery; search engines decide whether and when to index each page.
