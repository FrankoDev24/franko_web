import { useParams } from 'react-router-dom';
import { rememberedProduct } from '../utils/productMemory.mjs';

// Real page frame, not a skeleton or simulated product/price.
export default function ProductPageShell({ name }) {
  const { slug = '' } = useParams();
  const known = rememberedProduct(slug);
  return <main className="max-w-7xl mx-auto px-4 py-8" aria-busy="true" aria-label="Product details">
    <p className="text-sm text-gray-500 mb-4">Home / Product Details</p>
    <div className="grid lg:grid-cols-2 gap-12">
      <div>{known?.productImage && <img src={known.productImage.startsWith('http') ? known.productImage : `https://ct002.frankotrading.com:444/Media/Products_Images/${known.productImage.split(/[\\/]/).pop()}`} alt={known.productName || ''} className="w-full h-80 object-contain" fetchPriority="high" />}</div>
      <div><h1 className="text-2xl font-bold">{name || known?.productName || 'Product Details'}</h1></div>
    </div>
  </main>;
}
