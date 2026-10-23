"""Import an authorized Products sheet CSV. Never invent names to resolve collisions.
Usage: python scripts/import-seo-products.py [export.csv]
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
    if not name or not re.fullmatch(r'[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}', product_id):
        invalid.append({"row": row["S/N"], "productName": name, "productID": product_id, "reason": "Missing name or invalid UUID"})
        continue
    if product_id in ids:
        raise ValueError(f'Duplicate product ID {product_id}')
    ids.add(product_id)
    slug = slugify(name)
    if not slug:
        raise ValueError(f'Empty slug at row {row["S/N"]}')
    groups[slug].append({'productID': product_id, 'productName': name})

included, conflicts = [], []
for slug, products in groups.items():
    if len(products) > 1:
        conflicts.append({'slug': slug, 'reason': 'Different UUIDs have the same name-only URL', 'products': products})
    else:
        # status is the generator's inclusion marker, NOT a live stock/status check.
        included.append({**products[0], 'status': 1})
(ROOT / 'seo/data/products.json').write_text(json.dumps(included, indent=2, ensure_ascii=False) + '\n')
(ROOT / 'seo/data/product-conflicts.json').write_text(json.dumps(conflicts, indent=2, ensure_ascii=False) + '\n')
(ROOT / 'seo/data/product-invalid.json').write_text(json.dumps(invalid, indent=2, ensure_ascii=False) + '\n')
print(f'{len(rows)} records: {len(invalid)} invalid, {len(included)} included, {sum(len(c["products"]) for c in conflicts)} withheld in {len(conflicts)} conflicting slugs')
