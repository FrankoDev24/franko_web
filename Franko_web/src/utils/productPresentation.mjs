export function displayProductTag(value) {
  if (typeof value !== 'string') return '';
  const tag = value.trim();
  // Hide internal numeric codes, including signed/decimal/formatted numbers.
  if (!tag || Number.isFinite(Number(tag.replace(/,/g, '')))) return '';
  return tag;
}

export function normalizeProductDetails(data) {
  const rows = Array.isArray(data) ? data : [data];
  const products = rows.filter(p => p && typeof p === 'object' && !Array.isArray(p) && (p.productID || p.Productid));
  if (!products.length) throw new Error('Product details are unavailable');
  return products;
}

// Coalesce concurrent reads only. Never cache stock/price across completed reads.
export function dedupeRequests(fetcher) {
  const requests = new Map();
  return key => {
    if (!requests.has(key)) {
      requests.set(key, Promise.resolve().then(() => fetcher(key)).finally(() => requests.delete(key)));
    }
    return requests.get(key);
  };
}
