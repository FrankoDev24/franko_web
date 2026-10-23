/**
 * Franko Trading - Product Slug Utilities (v2 - no-flash)
 * Deterministic slug from productName ONLY - no catalogue needed for link creation
 * This is key to fixing the "old URL flash" -> links must be created without waiting
 */

export const slugify = (text = "") => {
  return String(text)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
};

export const isUUID = (value = "") =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value).trim());

/**
 * CANONICAL slug - deterministic, no DB lookup needed
 * This MUST be the single source of truth for BOTH:
 * 1. Creating links (ProductCard -> navigate)
 * 2. Resolving links (ProductDescription -> find product)
 * 
 * Duplicate names must be given distinct descriptive names before publishing.
 * Never append IDs or depend on the current catalogue to create a URL.
 */
export const getProductSlug = (product) => {
  if (!product) return "";
  const base = slugify(product.productName || product.ProductName || product.name || "");
  return base;
};

export const buildSlugMap = (products = []) => {
  const map = new Map();
  products.forEach(p => {
    const slug = getProductSlug(p, products);
    if (slug) map.set(slug, p);
  });
  return map;
};

export const findProductBySlug = (products = [], slug = "") => {
  const clean = slugify(slug);
  return products.find(p => getProductSlug(p, products) === clean) || null;
};

export const findProductById = (products = [], id = "") => {
  const target = String(id).toLowerCase();
  return products.find(p => String(p.productID || p.Productid || "").toLowerCase() === target) || null;
};

export const resolveSlugToId = (products = [], slug = "") => {
  const product = findProductBySlug(products, slug);
  return product ? String(product.productID || product.Productid || "") : null;
};

/**
 * Direct link generator - USE THIS EVERYWHERE you currently do `/product/${product.productID}`
 * Example: <Link to={getProductUrl(product)} /> or navigate(getProductUrl(product))
 * This never exposes the UUID, so the address bar never flashes the old format.
 */
export const getProductUrl = (product, allProducts = []) => {
  return `/product/${getProductSlug(product, allProducts)}`;
};

/**
 * For viewedProducts / cart items that only have { name } or { productName }
 */
export const getSlugForName = (name = "") => slugify(name);

// Brand IDs remain internal to the API, just like product UUIDs.
export const getBrandSlug = (brand) => slugify(brand?.brandName || brand?.name || "");
export const getBrandUrl = (brand) => `/brand/${getBrandSlug(brand)}`;
export const findBrand = (brands = [], value = "") =>
  brands.find(b => String(b.brandId).toLowerCase() === value.toLowerCase()) ||
  brands.find(b => getBrandSlug(b) === slugify(value)) || null;
