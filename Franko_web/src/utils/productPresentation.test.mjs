import test from 'node:test';
import assert from 'node:assert/strict';
import { displayProductTag, normalizeProductDetails, dedupeRequests } from './productPresentation.mjs';
import { indexedProduct } from './productRouteIndex.mjs';

test('product tags hide numeric internal codes and display descriptive text', () => {
  for (const value of ['23295652', ' 23295652 ', 23295652, null, undefined, '', ' ', '-12', '1,234', '12.5', '1e3']) {
    assert.equal(displayProductTag(value), '');
  }
  for (const [value, expected] of [['New Arrival', 'New Arrival'], ['  Best Seller  ', 'Best Seller'], ['5G Offer', '5G Offer']]) {
    assert.equal(displayProductTag(value), expected);
  }
});

test('supplied product response preserves brand and normalizes array/object details', () => {
  const product = { productID: '921f33e2-fb2d-4c39-9f45-82072cea54a4', productName: 'Samsung Fold 8 (512GB + 12GB) ', brandName: 'Samsung', tag: '23295652' };
  assert.deepEqual(normalizeProductDetails([product]), [product]);
  assert.deepEqual(normalizeProductDetails(product), [product]);
  assert.equal(normalizeProductDetails([product])[0].brandName, 'Samsung');
  assert.equal(displayProductTag(product.tag), '');
  assert.throws(() => normalizeProductDetails({ message: 'Failed' }));
  assert.throws(() => normalizeProductDetails([]));
});

test('known product slugs and UUIDs resolve without a catalogue network request', () => {
  const id = '921f33e2-fb2d-4c39-9f45-82072cea54a4';
  assert.equal(indexedProduct('samsung-fold-8-512gb-12gb').productID, id);
  assert.equal(indexedProduct(id).productID, id);
  assert.equal(indexedProduct('new-product-not-in-snapshot'), null);
});

test('concurrent detail reads share a request but completed prices are not cached', async () => {
  let calls = 0;
  const request = dedupeRequests(async id => { calls++; return id; });
  const first = request('one');
  assert.equal(request('one'), first);
  assert.equal(await first, 'one');
  assert.equal(calls, 1);
  await request('one');
  assert.equal(calls, 2);
});

test('failed detail reads can be retried', async () => {
  let calls = 0;
  const request = dedupeRequests(async () => { if (++calls === 1) throw new Error('offline'); return 'ok'; });
  await assert.rejects(request('one'), /offline/);
  assert.equal(await request('one'), 'ok');
});
