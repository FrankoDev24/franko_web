import  { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPaginatedProducts } from '../Redux/Slice/productSlice';
import { Empty } from 'antd';
import { Helmet } from 'react-helmet';


const ProductsPage = () => {
  const dispatch = useDispatch();
  const { products = [], loading } = useSelector((state) => state.products || {});

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState({});
  const [allProducts, setAllProducts] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const itemsPerPage = 16;
  const observerRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setLoadingMore(true);
    dispatch(fetchPaginatedProducts({ pageNumber: currentPage, pageSize: itemsPerPage })).then((response) => {
      if (response.payload) {
        setAllProducts((prev) => [...prev, ...response.payload]);
      }
      setLoadingMore(false);
    });
  }, [dispatch, currentPage]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => product.status !== '0');
  }, [allProducts]);

  const handleProductClick = (productId) => {
    setSelectedProductId(productId);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setSelectedProductId(null);
    setIsModalVisible(false);
  };

  useEffect(() => {
    if (loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { root: null, rootMargin: '100px', threshold: 0.1 }
    );

    if (observerRef.current) observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [loadingMore]);

  const formatPrice = (price) =>
    price?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Helmet>
        <title>Shop Phones & Gadgets | Best Prices at Franko Trading</title>
        <meta name="description" content="Explore the latest smartphones, laptops, and accessories at unbeatable prices. Shop online at Franko Trading today!" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Shop Phones & Gadgets | Best Prices at Franko Trading" />
      </Helmet>

      <h1 className="text-md md:text-lg font-semibold mb-2 text-center md:text-left text-red-600">Shop</h1>

      {loading && allProducts.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="animate-pulse border rounded-lg shadow p-3 bg-gray-100 relative">
              <div className="h-36 bg-gray-200 rounded-lg"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mt-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.productID}
              className="relative p-4 bg-white border rounded-lg shadow hover:shadow-xl transform hover:scale-105 transition-transform cursor-pointer group"
              onClick={() => handleProductClick(product.productID)}
            >
              {product.oldPrice > 0 && product.oldPrice > product.price && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                  {Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% OFF
                </div>
              )}

              <div className="h-32 md:h-32 lg:h-48 flex items-center justify-center mb-3">
                {imageLoading[product.productID] ? (
                  <div className="animate-pulse w-32 md:w-24 lg:w-48 h-32 bg-gray-200 rounded-lg" />
                ) : (
                  <img
                    src={`https://smfteapi.salesmate.app/Media/Products_Images/${product.productImage.split('\\').pop()}`}
                    alt={product.productName}
                    className="w-fit h-full p-1 object-cover rounded-lg"
                    onLoad={() => setImageLoading((prev) => ({ ...prev, [product.productID]: false }))}
                    onError={() => setImageLoading((prev) => ({ ...prev, [product.productID]: true }))}
                  />
                )}
              </div>

              <h2 className="text-sm md:text-md font-semibold line-clamp-2">{product.productName}</h2>

              <div className="flex flex-row gap-4">
                <p className="text-red-500 font-bold text-sm sm:text-md">₵{formatPrice(product.price)}</p>
                {product.oldPrice > 0 && (
                  <p className="text-gray-500 line-through text-xs mt-1">₵{formatPrice(product.oldPrice)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty description="No Products Found" />
      )}

      <div ref={observerRef} className="h-10" />

      {loadingMore && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse border rounded-lg shadow p-3 bg-gray-100 relative">
              <div className="h-36 bg-gray-200 rounded-lg"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mt-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
            </div>
          ))}
        </div>
      )}

      
    </div>
  );
};

export default ProductsPage;
