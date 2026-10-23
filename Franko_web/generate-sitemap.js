// Generate sitemap + genuine hosting redirects from the SAME live catalogue.
import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { seoArtifacts } from './scripts/seo-artifacts.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
async function catalogue(endpoint, snapshot) {
  if (snapshot) return JSON.parse(readFileSync(snapshot, 'utf8'));
  if (!process.env.VITE_LAMBDA_BASE_URL) throw new Error('Configure VITE_LAMBDA_BASE_URL or SEO_PRODUCTS_FILE and SEO_BRANDS_FILE');
  const url = new URL(process.env.VITE_LAMBDA_BASE_URL);
  url.searchParams.set('endpoint', endpoint);
  const response = await fetch(url, {
    headers: { [process.env.VITE_LAMBDA_HEADER_NAME || 'Identifier']: process.env.VITE_LAMBDA_HEADER_VALUE || 'Franko' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Catalogue request failed (${response.status})`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Catalogue must be a complete JSON array');
  return data;
}
let products, brands;
if (process.env.SEO_STATIC_ONLY === '1') {
  console.warn('STATIC-ONLY PREVIEW: no product/brand sitemap entries or 301s. Do not use for production migration.');
  products = []; brands = [];
} else if (process.env.SEO_SOURCE !== 'live' && !process.env.SEO_PRODUCTS_FILE) {
  // Checked-in snapshot of the spreadsheet supplied by the site owner. Builds
  // must retain these entries even when the live backend is unavailable.
  products = JSON.parse(readFileSync(`${root}seo/data/products.json`, 'utf8'));
  brands = process.env.SEO_BRANDS_FILE
    ? JSON.parse(readFileSync(process.env.SEO_BRANDS_FILE, 'utf8')) : [];
  console.warn('Using approved spreadsheet product snapshot; no brand data was supplied in that sheet.');
} else {
  [products, brands] = await Promise.all([
    catalogue('/Product/Product-Get', process.env.SEO_PRODUCTS_FILE),
    catalogue('/Brand/Get-Brand', process.env.SEO_BRANDS_FILE),
  ]);
  if (!products.length) throw new Error('Refusing to publish empty product SEO artifacts');
  if (process.env.SEO_SOURCE === 'live' && !brands.length) throw new Error('Refusing to publish empty live brand catalogue');
}
const previous = process.env.SEO_PREVIOUS_INDEX ? JSON.parse(readFileSync(process.env.SEO_PREVIOUS_INDEX, 'utf8')) : {};
const { sitemap, redirects, index } = seoArtifacts(products, brands, previous);
const rules = redirects.flatMap(([from, to]) => [`${from} ${to} 301!`, `${from}/ ${to} 301!`]).join('\n');
const nginx = redirects.map(([from, to]) => `location = ${from} { return 301 ${to}$is_args$args; }\nlocation = ${from}/ { return 301 ${to}$is_args$args; }`).join('\n');
for (const folder of ['public', ...(existsSync(`${root}dist`) ? ['dist'] : [])]) {
  writeFileSync(`${root}${folder}/sitemap.xml`, sitemap);
  writeFileSync(`${root}${folder}/_redirects`, `${rules}\n/* /index.html 200\n`);
  writeFileSync(`${root}${folder}/seo-index.json`, JSON.stringify(index));
}
writeFileSync(`${root}seo-redirects.nginx.conf`, `${nginx}\n`);
console.log(`Generated sitemap and ${redirects.length} permanent redirects.`);
