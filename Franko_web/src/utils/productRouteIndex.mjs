import products from '../../seo/data/products.json' with { type: 'json' };
import { getProductSlug } from './productSlug.js';

const byId = new Map(products.map(p => [p.productID.toLowerCase(), p]));
const bySlug = new Map(products.map(p => [getProductSlug(p), p]));
// The index supplies IDs/names only; prices, availability and descriptions still
// come from the unchanged live UUID API. New products fall back to the catalogue.
export const indexedProduct = value => byId.get(value.toLowerCase()) || bySlug.get(value.toLowerCase()) || null;
