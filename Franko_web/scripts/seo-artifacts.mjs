import { getProductSlug, getBrandSlug } from '../src/utils/productSlug.js';

export const staticPaths = ['/', '/about', '/products', '/contact', '/accessories', '/speakers',
  '/television', '/appliances', '/refrigerator', '/air-condition', '/phones', '/computers',
  '/washing-machine', '/shops', '/terms'];
const escapeXml = value => value.replace(/[<>&"']/g, c => ({'<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;'}[c]));

export function seoArtifacts(products, brands, previous = {}) {
  const redirects = new Map();
  const paths = [...staticPaths];
  const index = { products: {}, brands: {} };
  for (const [kind, items, slugOf, idOf] of [
    ['product', products.filter(p => Number(p.status) === 1), getProductSlug, p => p.productID || p.Productid],
    ['brand', brands, getBrandSlug, b => b.brandId],
  ]) {
    const seen = new Map();
    for (const item of items) {
      const id = String(idOf(item) || '');
      const slug = slugOf(item);
      if (!id || !slug) throw new Error(`Missing ID or name in ${kind} catalogue`);
      if (seen.has(slug) && seen.get(slug) !== id) {
        throw new Error(`Duplicate ${kind} slug "${slug}". Give variants distinct descriptive names before deployment; IDs will not be appended.`);
      }
      seen.set(slug, id);
      const path = `/${kind}/${slug}`;
      paths.push(path);
      redirects.set(`/${kind}/${id}`, path);
      const oldSlug = previous[`${kind}s`]?.[id];
      if (oldSlug && oldSlug !== slug) redirects.set(`/${kind}/${oldSlug}`, path);
      index[`${kind}s`][id] = slug;
    }
  }
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(paths)].map(path => `  <url><loc>${escapeXml(`https://www.frankotrading.com${path}`)}</loc></url>`).join('\n')}\n</urlset>\n`;
  return { sitemap, index, redirects: [...redirects] };
}
