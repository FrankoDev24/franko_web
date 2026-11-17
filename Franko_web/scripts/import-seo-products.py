"""Import an authorized Products sheet CSV. Never invent IDs or names to resolve collisions.

Usage: python scripts/import-seo-products.py [export.csv]

Outputs (all under seo/data/):
  products.json             - validated ID/name records used by the runtime route index
                              AND by sitemap/redirect generation.
  product-sitemap-only.json - rows whose UUID is malformed but whose name is valid.
                              Their name-only URL is still published in the sitemap;
                              no legacy /product/<uuid> redirect is fabricated.
  product-invalid.json      - audit trail of rows that could not be fully validated.
  product-conflicts.json    - different UUIDs sharing one name-only URL (withheld).
"""
import csv
import json
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'seo/data/products-2026-10-23.csv'
UUID = r'[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}'


def slugify(value):
    value = unicodedata.normalize('NFD', value.lower().strip())
    value = ''.join(c for c in value if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', '-', value).strip('-')


rows = list(csv.DictReader(source.open(encoding='utf-8-sig', newline='')))
groups = defaultdict(list)
ids = set()
invalid = []

for row in rows:
    name, product_id = row['Product Name'].strip(), row['Product ID'].strip().lower()
    slug = slugify(name)
    if not name or not slug:
        invalid.append({"row": row["S/N"], "productName": name,
                        "productID": product_id, "reason": "Missing name or empty slug"})
        continue
    valid_id = bool(re.fullmatch(UUID, product_id))
    if valid_id and product_id in ids:
        raise ValueError(f'Duplicate product ID {product_id}')
    if valid_id:
        ids.add(product_id)
    else:
        invalid.append({"row": row["S/N"], "productName": name,
                        "productID": product_id,
                        "reason": "Malformed UUID in sheet; published as sitemap-only, no redirect"})
    groups[slug].append({
        "slug": slug,
        "productName": name,
        "productID": product_id if valid_id else None,
        "row": row["S/N"],
        "sitemapOnly": not valid_id,
    })

included, sitemap_only, conflicts = [], [], []
for slug, items in groups.items():
    if len(items) > 1:
        conflicts.append({
            "slug": slug,
            "reason": "Different records share the same name-only URL",
            "products": [{"productID": i["productID"], "productName": i["productName"],
                          "row": i["row"]} for i in items],
        })
        continue
    item = items[0]
    # status is the generator's inclusion marker, NOT a live stock/status check.
    if item["sitemapOnly"]:
        sitemap_only.append({
            "productName": item["productName"],
            "status": 1,
            "sitemapOnly": True,
            "row": item["row"],
            "sheetProductID": item["productID"],
            "reason": "Malformed UUID in the sheet; name-only URL published without a legacy redirect",
        })
    else:
        included.append({"productID": item["productID"],
                         "productName": item["productName"], "status": 1})

out = ROOT / 'seo/data'
(out / 'products.json').write_text(json.dumps(included, indent=2, ensure_ascii=False) + '\n')
(out / 'product-sitemap-only.json').write_text(
    json.dumps(sitemap_only, indent=2, ensure_ascii=False) + '\n')
(out / 'product-conflicts.json').write_text(json.dumps(conflicts, indent=2, ensure_ascii=False) + '\n')
(out / 'product-invalid.json').write_text(json.dumps(invalid, indent=2, ensure_ascii=False) + '\n')
print(f'{len(rows)} records: {len(invalid)} invalid (all published as sitemap-only), '
      f'{len(included)} validated, {sum(len(c["products"]) for c in conflicts)} '
      f'withheld in {len(conflicts)} conflicting slugs -> '
      f'{len(included) + len(sitemap_only)} product URLs')
