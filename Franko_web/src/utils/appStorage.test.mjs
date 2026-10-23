import test from 'node:test';
import assert from 'node:assert/strict';
import CryptoJS from 'crypto-js';
import { createAppStorage } from './appStorage.mjs';
import { catalogueRows, sanitizePersistedCatalogue } from './catalogueShape.mjs';

const secret = 'test-only-key';
function fixture() {
  const values = new Map();
  const native = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
  return { native, app: createAppStorage(native, secret) };
}

test('explicit storage preserves app consumers without patching native methods', () => {
  const { native, app } = fixture();
  const originalGet = native.getItem;
  app.setItem('customer', { contactNumber: '0123456789' });
  assert.ok(native.getItem('customer').startsWith('U2FsdGVkX1'));
  assert.deepEqual(app.getItem('customer'), { contactNumber: '0123456789' });
  app.setItem('wishlist', JSON.stringify([{ id: 'one' }]));
  assert.deepEqual(app.getItem('wishlist'), [{ id: 'one' }]);
  app.setItem('cartId', 'cart-id');
  assert.equal(app.getItem('cartId'), 'cart-id');
  assert.equal(native.getItem, originalGet);
  app.removeItem('cartId');
  assert.equal(app.getItem('cartId'), null);
});

test('legacy plaintext and single/double encrypted app data remain readable', () => {
  const { native, app } = fixture();
  const text = JSON.stringify({ categories: [] });
  const encrypted = CryptoJS.AES.encrypt(text, secret).toString();
  for (const value of [text, encrypted, CryptoJS.AES.encrypt(encrypted, secret).toString()]) {
    native.setItem('persist:root', value);
    assert.deepEqual(app.getItem('persist:root'), { categories: [] });
  }
});

test('bad ciphertext is discarded per key without touching cart or chat', () => {
  const { native, app } = fixture();
  native.setItem('persist:root', 'U2FsdGVkX1-invalid');
  native.setItem('twk-token', 'U2FsdGVkX1-chat-owned-token');
  app.setItem('cart', [{ productID: 'one', quantity: 2 }]);
  assert.equal(app.getItem('persist:root'), null);
  assert.equal(native.getItem('persist:root'), null);
  assert.equal(native.getItem('twk-token'), 'U2FsdGVkX1-chat-owned-token');
  assert.equal(app.getItem('cart')[0].quantity, 2);
});

test('activity timestamps are interoperable and legacy timestamps decrypt', () => {
  const { native, app } = fixture();
  app.setItem('lastActivityTimestamp', '12345');
  assert.equal(native.getItem('lastActivityTimestamp'), '12345');
  assert.equal(Number(app.getItem('lastActivityTimestamp')), 12345);
  native.setItem('lastActivityTimestamp', CryptoJS.AES.encrypt('54321', secret).toString());
  assert.equal(Number(app.getItem('lastActivityTimestamp')), 54321);
});

test('catalogue extraction handles wrappers but rejects error objects', () => {
  const rows = [{ categoryId: 'one', categoryName: 'Phones' }];
  for (const input of [rows, { categories: rows }, { data: rows }, { body: JSON.stringify(rows) }, JSON.stringify(rows)]) {
    assert.deepEqual(catalogueRows(input, 'categories'), rows);
  }
  for (const input of [null, 'bad', { message: 'Unauthorized' }, { data: 'Failed' }]) {
    assert.equal(catalogueRows(input, 'categories'), null);
  }
});

test('persist rehydration repairs malformed lists and stale loading flags', () => {
  const saved = {
    categories: { categories: { message: 'failed' }, loading: true },
    brands: { brands: 'bad', loading: true, lastFetched: 1234 },
    _persist: { rehydrated: true },
  };
  const repaired = sanitizePersistedCatalogue(saved);
  assert.deepEqual(repaired.categories.categories, []);
  assert.deepEqual(repaired.brands.brands, []);
  assert.equal(repaired.brands.lastFetched, 0);
  assert.equal(repaired.categories.loading, false);
  assert.equal(saved.categories.loading, true);
  assert.deepEqual(repaired._persist, saved._persist);
});
