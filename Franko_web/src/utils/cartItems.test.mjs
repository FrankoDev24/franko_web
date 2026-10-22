import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  extractCartItems,
  normalizeCartItem,
  normalizeCartItems,
  dedupeCartItems,
  upsertCartItem,
  mergeCartItems,
  setCartItemQuantity,
  removeCartItem,
  cartTotals,
  resolveCartIdValue,
} from './cartItems.mjs';

const line = (productId, quantity = 1, price = 100) => ({
  productId: String(productId),
  productName: `Product ${productId}`,
  imagePath: `${productId}.jpg`,
  price,
  quantity,
});

/* ---------- extractCartItems: every GetbyID response shape ---------- */

test('extract: bare array of lines passes through untouched', () => {
  const data = [line(1), line(2), line(3)];
  assert.equal(extractCartItems(data).length, 3);
});

test('extract: a SINGLE cart record (GetbyID by one cart id) becomes one line', () => {
  const data = { cartId: 'Tel-1', productId: 9, productName: 'Solo', price: 50, quantity: 1 };
  const found = extractCartItems(data);
  assert.equal(found.length, 1);
  assert.equal(found[0].productId, 9);
});

test('extract: enveloped payloads are unwrapped', () => {
  assert.equal(extractCartItems({ data: [line(1), line(2)] }).length, 2);
  assert.equal(extractCartItems({ response: { data: [line(1)] } }).length, 1);
  assert.equal(extractCartItems({ result: [line(1), line(2), line(3)] }).length, 3);
});

test('extract: cart header object yields its nested lines, not itself', () => {
  const data = { cartId: 'Tel-1', customerId: 'C1', items: [line(1), line(2)] };
  assert.equal(extractCartItems(data).length, 2);
  assert.equal(extractCartItems({ cartId: 'Tel-1', cartItems: [line(4)] }).length, 1);
});

test('extract: stringified JSON and junk input', () => {
  assert.equal(extractCartItems(JSON.stringify([line(1), line(2)])).length, 2);
  assert.deepEqual(extractCartItems(null), []);
  assert.deepEqual(extractCartItems(''), []);
  assert.deepEqual(extractCartItems({}), []);
  assert.deepEqual(extractCartItems(42), []);
});

/* ---------- normalize ---------- */

test('normalize: backend casing variants map onto the canonical line', () => {
  const item = normalizeCartItem({
    ProductID: 12, ProductName: 'Phone', ProductImage: 'p.jpg', Price: 250, Quantity: 2,
  });
  assert.equal(item.productId, '12');
  assert.equal(item.productName, 'Phone');
  assert.equal(item.imagePath, 'p.jpg');
  assert.equal(item.price, 250);
  assert.equal(item.quantity, 2);
  assert.equal(item.total, 500); // price is per-unit; total is derived, never divided
});

test('normalize: lines without a product id are dropped', () => {
  assert.equal(normalizeCartItem({ productName: 'ghost' }), null);
  assert.equal(normalizeCartItems([line(1), { name: 'ghost' }, line(2)]).length, 2);
});

/* ---------- dedupe / upsert ---------- */

test('dedupe: duplicate rows for one product collapse into a single row', () => {
  const out = dedupeCartItems(normalizeCartItems([line(1, 1), line(1, 2), line(2, 1)]));
  assert.equal(out.length, 2);
  assert.equal(out.find((i) => i.productId === '1').quantity, 3);
});

test('upsert: adding a new product appends a row; re-adding tops up the same row', () => {
  let cart = upsertCartItem([], line(1));
  cart = upsertCartItem(cart, line(2));
  cart = upsertCartItem(cart, line(1)); // same product again
  assert.equal(cart.length, 2);
  assert.equal(cart.find((i) => i.productId === '1').quantity, 2);
  assert.equal(cart.find((i) => i.productId === '2').quantity, 1);
});

/* ---------- THE BUG: multi-product cart vs single-record GetbyID ---------- */

test('REGRESSION: a fetch returning ONE record cannot wipe the other products', () => {
  const local = [line(1), line(2), line(3)];              // customer added 3 products
  const serverReply = extractCartItems(line(1));          // GetbyID hands back just one
  const merged = mergeCartItems(local, normalizeCartItems(serverReply));
  assert.equal(merged.length, 3);
  assert.deepEqual(merged.map((i) => i.productId), ['1', '2', '3']);
});

test('REGRESSION: an empty/envelope-less fetch keeps the local cart intact', () => {
  const local = [line(1), line(2)];
  assert.equal(mergeCartItems(local, extractCartItems(null)).length, 2);
  assert.equal(mergeCartItems(local, extractCartItems({ data: [] })).length, 2);
});

test('merge: server lines are added, shared lines take server fields and never lose quantity', () => {
  const local = [line(1, 1, 100), line(2, 3, 200)];       // #2 topped up locally mid-fetch
  const server = [line(1, 5, 111), line(3, 1, 300)];      // server knows #1 x5 and new #3
  const merged = mergeCartItems(local, server);
  assert.equal(merged.length, 3);
  const one = merged.find((i) => i.productId === '1');
  assert.equal(one.quantity, 5);
  assert.equal(one.price, 111);
  assert.equal(merged.find((i) => i.productId === '2').quantity, 3); // local add preserved
  assert.equal(merged.find((i) => i.productId === '3').quantity, 1); // server-only added
});

/* ---------- quantity / remove / totals / ids ---------- */

test('setCartItemQuantity sets an exact quantity and 0 removes the line', () => {
  let cart = [line(1), line(2)];
  cart = setCartItemQuantity(cart, 1, 4);
  assert.equal(cart.find((i) => i.productId === '1').quantity, 4);
  assert.equal(cart.find((i) => i.productId === '1').total, 400);
  cart = setCartItemQuantity(cart, '1', 0);
  assert.deepEqual(cart.map((i) => i.productId), ['2']);
});

test('removeCartItem removes only the requested product', () => {
  const cart = removeCartItem([line(1), line(2), line(3)], 2);
  assert.deepEqual(cart.map((i) => i.productId), ['1', '3']);
});

test('cartTotals counts distinct rows, quantities and money separately', () => {
  const totals = cartTotals([line(1, 2, 100), line(2, 1, 50)]);
  assert.equal(totals.distinctItems, 2);
  assert.equal(totals.totalItems, 3);
  assert.equal(totals.subtotal, 250);
});

test('resolveCartIdValue accepts strings, payloads and quoted storage values', () => {
  assert.equal(resolveCartIdValue('Tel-9'), 'Tel-9');
  assert.equal(resolveCartIdValue({ CartId: 'Tel-8' }), 'Tel-8');
  assert.equal(resolveCartIdValue(null, '"Tel-7"'), 'Tel-7');
  assert.equal(resolveCartIdValue(undefined, ''), null);
});
