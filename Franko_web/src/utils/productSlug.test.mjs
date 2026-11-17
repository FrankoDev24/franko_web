import test from 'node:test';
import assert from 'node:assert/strict';
import { slugify, getProductUrl, getProductSlug, findProductBySlug, findBrand, getBrandUrl } from './productSlug.js';
import { seoArtifacts } from '../../scripts/seo-artifacts.mjs';
const id = 'e3bb06fa-0000-4000-8000-000000000000';
const product = { productID: id, productName: 'Samsung Galaxy A56 5G', status: 1 };
const brand = { brandId: id, brandName: 'Samsung' };
test('name-only product URLs are independent of catalogue and never append UUIDs', () => {
  assert.equal(getProductUrl(product), '/product/samsung-galaxy-a56-5g');
  assert.equal(getProductSlug(product, [product, { ...product, productID: 'other' }]), 'samsung-galaxy-a56-5g');
  assert.equal(findProductBySlug([product], 'samsung-galaxy-a56-5g'), product);
  assert.equal(slugify('  Télévision 55” / 4K  '), 'television-55-4k');
  assert.equal(getProductSlug({ productID: id }), '');
});
test('brands resolve both readable names and legacy UUIDs internally', () => {
  assert.equal(getBrandUrl(brand), '/brand/samsung');
  assert.equal(findBrand([brand], 'samsung'), brand);
  assert.equal(findBrand([brand], id), brand);
  assert.equal(findBrand([brand], 'unknown'), null);
});
test('SEO artifacts agree with UI URLs, exclude inactive items and redirect old names', () => {
  const result = seoArtifacts([product, { ...product, productID: 'inactive', productName: 'Hidden', status: 0 }], [brand], { products: { [id]: 'old-name' } });
  assert.ok(result.sitemap.includes('https://www.frankotrading.com'+getProductUrl(product)));
  assert.ok(result.sitemap.includes('https://www.frankotrading.com'+getBrandUrl(brand)));
  assert.ok(!result.sitemap.includes(id));
  assert.ok(!result.sitemap.includes('hidden'));
  assert.deepEqual(result.redirects.find(([from]) => from === '/product/'+id), ['/product/'+id, getProductUrl(product)]);
  assert.deepEqual(result.redirects.find(([from]) => from === '/product/old-name'), ['/product/old-name', getProductUrl(product)]);
});
test('ambiguous name-only URLs block migration rather than silently selecting a UUID', () => {
  assert.throws(() => seoArtifacts([product, { ...product, productID: 'other' }], [brand]), /Duplicate product slug/);
  assert.throws(() => seoArtifacts([product], [brand, { ...brand, brandId: 'other' }]), /Duplicate brand slug/);
});

test('approved spreadsheet sitemap includes EVERY product record exactly once', async () => {
  const { readFileSync } = await import('node:fs');
  const load = name => JSON.parse(readFileSync(new URL(`../../seo/data/${name}.json`, import.meta.url), 'utf8'));
  const products = load('products');
  const sitemapOnly = load('product-sitemap-only');
  const conflicts = load('product-conflicts');
  const invalid = load('product-invalid');
  assert.equal(products.length, 364);
  assert.equal(sitemapOnly.length, 1);
  assert.equal(invalid.length, 1);
  assert.equal(conflicts.length, 0);
  // Every one of the 365 sheet rows is accounted for.
  assert.equal(products.length + sitemapOnly.length + conflicts.flatMap(c => c.products).length, 365);
  const { sitemap, redirects, index } = seoArtifacts([...products, ...sitemapOnly], []);
  assert.equal((sitemap.match(/<loc>/g) || []).length, 380); // 15 static + 365 products
  assert.equal(redirects.length, 364);                        // no invented redirect for a bad UUID
  assert.equal(Object.keys(index.products).length, 364);
  for (const product of [...products, ...sitemapOnly]) {
    assert.ok(sitemap.includes(`https://www.frankotrading.com${getProductUrl(product)}</loc>`));
    if (product.productID) assert.ok(!sitemap.includes(product.productID));
  }
  for (const conflict of conflicts) assert.ok(!sitemap.includes(`/product/${conflict.slug}</loc>`));
  // Malformed sheet UUID still gets its real name URL, but never a UUID redirect.
  assert.ok(sitemap.includes('/product/itel-5600-new</loc>'));
  assert.ok(!redirects.some(([from]) => from.includes('f4f29be2')));
});
