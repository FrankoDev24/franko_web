# Product Sitemap Update — 2026-11-25

Updated the SEO product snapshot and `public/sitemap.xml` from the owner's
authorized 2026-11-25 catalogue export (`products_export_2026-11-25.xlsx`,
`Products` tab, **382 rows**).

## Summary of Counts

| Artifact | 2026-11-12 Snapshot | Previous `HEAD` `sitemap.xml` | 2026-11-25 Update |
| --- | ---: | ---: | ---: |
| Spreadsheet rows | 365 | — | **382** |
| Validated product UUIDs (`seo/data/products.json`) | 364 | — | **381** |
| Sitemap-only malformed UUID rows (`product-sitemap-only.json`) | 1 (`S/N 156`) | — | **1** (`S/N 173`, `itel 5600 new`) |
| Duplicate slug conflicts (`product-conflicts.json`) | 0 | — | **0** |
| Total `<loc>` entries in `public/sitemap.xml` | 380 | 383 (382 unique, 1 duplicate) | **397** (397 unique: 15 static + 382 products) |
| Permanent UUID → slug 301 redirects | 364 | — | **381** |

## Catalogue Delta vs. Previous Snapshot & Sitemap

- **30 products added** vs. `products-2026-11-12-full.csv`:
  - 25 new Nov 14–24 catalogue additions (`S/N 1..25`), including Asano
    fridges/freezers/ACs, Tecno Megapad 2, Itel City 200, Samsung Galaxy A07 /
    A17 4G / A57 5G, Redmi A5, Oraimo accessories, and Franko TCL air
    conditioners.
  - 5 additional catalogue products (`S/N 81`, `193`, `239`, `267`, `277`):
    `itel PowerBank (20000mAh) PP-21`, `itel PowerBank 27000mAh-ISW-023`,
    `itel Phone (It 5263)`, `Franko Table Top Fridge (90l)FR-090L`, and
    `Samsung S25 Ultra 256GB+12GB`.
- **28 unique URLs added** vs. `HEAD:Franko_web/public/sitemap.xml` (two slugs
  — `oraimo-data-cable-ocd-1525cc` and `franko-ac-2-0hp-tcl-f18as` — had been
  appended manually to `public/sitemap.xml` without entries in `products.json`;
  both are now properly indexed in `seo/data/products.json` with their real
  UUIDs so `postbuild` preserves them and generates their 301 redirects).
- **1 duplicate `<loc>` entry fixed**: `HEAD:Franko_web/public/sitemap.xml`
  listed `https://www.frankotrading.com/product/franko-ac-2-5hp-tcl-f24as`
  twice. The regenerated sitemap contains **397 unique `<loc>` entries** with
  zero duplicates.
- **1 product renamed**: `b939d2c8-64f5-41b9-bd6d-a731648dc34a` changed from
  `Franko Ac (2.5hp) Tcl-F24as` to `Franko Ac (1.5hp) Tcl -F12as` (`S/N 115`),
  while new UUID `76d0e9a4-5961-4d23-9cd6-73ad7e004ef4` (`S/N 23`) now owns
  `Franko Ac (2.5hp) Tcl-F24as`.
- **13 delisted products removed** that were no longer present in
  `products_export_2026-11-25.xlsx`.

## Files Updated

- `Franko_web/seo/data/products-2026-11-25-full.csv` (new canonical CSV export)
- `Franko_web/seo/data/products.json` (381 validated records)
- `Franko_web/seo/data/product-sitemap-only.json` (1 malformed-UUID record)
- `Franko_web/seo/data/product-invalid.json` (audit trail)
- `Franko_web/seo/data/product-conflicts.json` (empty array)
- `Franko_web/public/sitemap.xml` (397 unique `<loc>` URLs)
- `Franko_web/src/utils/productSlug.test.mjs` (updated snapshot assertions + duplicate check)
- `Franko_web/seo/README.md` (updated documentation)
