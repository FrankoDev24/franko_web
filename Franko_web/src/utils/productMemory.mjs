import { getProductSlug } from './productSlug.js';
const records = new Map();
const aliases = new Map();
const TTL = 300_000;
export function rememberProducts(payload, details = false) {
  if (Array.isArray(payload)) { payload.forEach(p => rememberProducts(p, details)); return; }
  if (!payload || typeof payload !== 'object') return;
  const id = String(payload.productID || payload.Productid || '').toLowerCase();
  if (!id) {
    // Redux product-by-category/showroom results contain nested arrays.
    Object.values(payload).filter(Array.isArray).forEach(rows => rememberProducts(rows, details));
    return;
  }
  const old = records.get(id);
  const product = { ...old?.product, ...payload };
  records.set(id, { product, time: Date.now(), detailsTime: details ? Date.now() : old?.detailsTime });
  const slug = getProductSlug(product);
  if (slug) aliases.set(slug, id);
  // Bound memory usage for long browsing sessions.
  if (records.size > 2000) records.delete(records.keys().next().value);
}
export function rememberedProduct(value = '') {
  const key = String(value).toLowerCase();
  const entry = records.get(aliases.get(key) || key);
  return entry && Date.now() - entry.time < TTL ? entry.product : null;
}
export function freshProductDetails(id) {
  const entry = records.get(String(id).toLowerCase());
  return entry && Date.now() - (entry.detailsTime || 0) < 60_000 ? entry.product : null;
}
