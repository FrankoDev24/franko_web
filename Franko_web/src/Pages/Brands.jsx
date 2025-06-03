import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByBrand } from "../Redux/Slice/productSlice";
import { fetchBrands } from "../Redux/Slice/brandSlice";
import { FunnelIcon, XMarkIcon, AdjustmentsHorizontalIcon, TagIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@material-tailwind/react";
import ProductCard from "../Component/ProductCard";
import { CircularPagination } from "../Component/CircularPagination";
import gif from "../assets/no.gif";

const Brand = () => {
  const { brandId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { brandProducts, loading } = useSelector((state) => state.products);
  const { brands } = useSelector((state) => state.brands);
  
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [showDiscountedOnly, setShowDiscountedOnly] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(fetchBrands());
    dispatch(fetchProductsByBrand(brandId));
  }, [dispatch, brandId]);

  const selectedBrand = brands.find((brand) => brand.brandId === brandId);
  const filteredBrands = selectedBrand
    ? brands.filter((b) => b.categoryId === selectedBrand.categoryId)
    : [];
    
  const filteredProducts = (brandProducts || [])
    .filter((p) => {
      const withinRange = p.price >= priceRange[0] && p.price <= priceRange[1];
      const hasDiscount = showDiscountedOnly ? p.oldPrice > p.price : true;
      return withinRange && hasDiscount;
    })
    .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
  
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const renderFilterContent = () => (
    <div className="w-full lg:w-80 space-y-8">
      {/* Filter Header */}
      <div className="hidden lg:flex items-center gap-3 pb-4 border-b border-gray-300">
        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
          <AdjustmentsHorizontalIcon className="w-5 h-5 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Filters</h3>
      </div>

      {/* Price Range Slider */}
      <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <h4 className="text-base font-semibold text-gray-700">Price Range</h4>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center bg-white px-4 py-3 rounded-xl border border-gray-200">
            <span className="text-sm font-medium text-gray-600">₵{priceRange[0].toLocaleString()}</span>
            <span className="text-xs text-gray-400">to</span>
            <span className="text-sm font-medium text-gray-600">₵{priceRange[1].toLocaleString()}</span>
          </div>
        </div>

        <div className="relative space-y-3">
          {/* Min Range Slider */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max="200000"
              step="1000"
              value={priceRange[0]}
              onChange={(e) =>
                setPriceRange([
                  Math.min(+e.target.value, priceRange[1] - 1000),
                  priceRange[1],
                ])
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb-emerald"
            />
          </div>
          
          {/* Max Range Slider */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max="200000"
              step="1000"
              value={priceRange[1]}
              onChange={(e) =>
                setPriceRange([
                  priceRange[0],
                  Math.max(+e.target.value, priceRange[0] + 1000),
                ])
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb-emerald"
            />
          </div>
        </div>
      </div>

      {/* Discount Toggle */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl border border-red-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-400 to-orange-500 rounded-lg">
              <TagIcon className="w-4 h-4 text-white" />
            </div>
            <label htmlFor="discount-toggle" className="text-base font-semibold text-gray-800 cursor-pointer">
              Discounted Items Only
            </label>
          </div>
          
          <div className="relative">
            <input
              type="checkbox"
              id="discount-toggle"
              checked={showDiscountedOnly}
              onChange={() => setShowDiscountedOnly(!showDiscountedOnly)}
              className="sr-only"
            />
            <div
              onClick={() => setShowDiscountedOnly(!showDiscountedOnly)}
              className={`w-12 h-6 rounded-full cursor-pointer transition-all duration-300 ${
                showDiscountedOnly 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg' 
                  : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                  showDiscountedOnly ? 'translate-x-6' : 'translate-x-0.5'
                } mt-0.5`}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Brands */}
      {filteredBrands.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-indigo-50 p-6 rounded-2xl border border-green-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h4 className="text-base font-semibold text-gray-800">Related Brands</h4>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filteredBrands.map((brand) => (
              <button
                key={brand.brandId}
                onClick={() => {
                  navigate(`/brand/${brand.brandId}`);
                  setIsDrawerOpen(false);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                  brand.brandId === brandId
                    ? "bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:text-green-600 hover:shadow-md"
                }`}
              >
                {brand.brandName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="p-4 md:px-24 mx-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {selectedBrand?.brandName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredProducts.length} products available
            </p>
          </div>
          
          <button 
            onClick={() => setIsDrawerOpen(true)} 
            className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Tooltip content="Filter Products" placement="top">
              <FunnelIcon className="w-6 h-6 text-red-300" />
            </Tooltip>
          </button>
        </div>

        {/* Enhanced Drawer */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsDrawerOpen(false)}
            ></div>
            
            {/* Drawer content */}
            <div className="relative w-4/5 max-w-sm h-full bg-white shadow-2xl overflow-auto transform transition-transform duration-300 ease-out">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-2 z-10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                      <AdjustmentsHorizontalIcon className="w-5 h-5 text-red-300" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Filters</h2>
                  </div>
                  
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>
              
              <div className="p-2">
                {renderFilterContent()}
              </div>
            </div>
          </div>
        )}

        {/* Tablet Filters */}
        <div className="hidden sm:block lg:hidden mb-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Price Range - Compact */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <h4 className="text-sm font-semibold text-gray-800">Price Range</h4>
                </div>
                
                <div className="flex justify-between text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  <span>₵{priceRange[0].toLocaleString()}</span>
                  <span>₵{priceRange[1].toLocaleString()}</span>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="200000"
                    step="1000"
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([
                        Math.min(+e.target.value, priceRange[1] - 1000),
                        priceRange[1],
                      ])
                    }
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb-emerald"
                  />
                  <input
                    type="range"
                    min="0"
                    max="200000"
                    step="1000"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([
                        priceRange[0],
                        Math.max(+e.target.value, priceRange[0] + 1000),
                      ])
                    }
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb-emerald"
                  />
                </div>
              </div>

              {/* Discount Toggle - Compact */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <h4 className="text-sm font-semibold text-gray-800">Discounts</h4>
                </div>
                
                <div className="flex items-center justify-between bg-amber-50 px-4 py-3 rounded-lg border border-amber-100">
                  <label htmlFor="tablet-discount-toggle" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Show discounted only
                  </label>
                  
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="tablet-discount-toggle"
                      checked={showDiscountedOnly}
                      onChange={() => setShowDiscountedOnly(!showDiscountedOnly)}
                      className="sr-only"
                    />
                    <div
                      onClick={() => setShowDiscountedOnly(!showDiscountedOnly)}
                      className={`w-10 h-5 rounded-full cursor-pointer transition-all duration-300 ${
                        showDiscountedOnly 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md' 
                          : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
                          showDiscountedOnly ? 'translate-x-5' : 'translate-x-0.5'
                        } mt-0.5`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Brands - Compact */}
              {filteredBrands.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h4 className="text-sm font-semibold text-gray-800">Related Brands</h4>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {filteredBrands.slice(0, 6).map((brand) => (
                      <button
                        key={brand.brandId}
                        onClick={() => navigate(`/brand/${brand.brandId}`)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                          brand.brandId === brandId
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm"
                            : "bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600"
                        }`}
                      >
                        {brand.brandName}
                      </button>
                    ))}
                    {filteredBrands.length > 6 && (
                      <span className="px-3 py-1.5 text-xs text-gray-500 bg-gray-100 rounded-full">
                        +{filteredBrands.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-80">
            <div className="hidden lg:block sticky top-6">
              {renderFilterContent()}
            </div>
          </aside>

          {/* Products Section */}
          <section className="flex-1">
            {currentProducts.length > 0 ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="hidden md:block p-6 rounded-2xl shadow-sm border border-gray-100">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent lg:block">
        {selectedBrand?.brandName}
      </h2>
      <p className="text-gray-400 text-xs">
        Discover amazing products from this brand
      </p>
    </div>
    
    <div className="flex items-center gap-4">
    <div className="bg-gradient-to-r from-green-100 to-teal-100 px-4 py-2 rounded-full border border-emerald-200">
                        <span className="text-sm font-medium text-emerald-700">
                          <strong>{currentProducts.length}</strong> of <strong>{filteredProducts.length}</strong> products
                        </span>
                      </div>
    </div>
  </div>
</div>

                {/* Products Grid */}
                <div className=" p-6">
                  <ProductCard
                    currentProducts={currentProducts}
                    navigate={navigate}
                    loading={loading}
                  />
                </div>

                {/* Pagination */}
                {totalPages > 1 && !loading && (
                  <div className="flex justify-center">
                    <div >
                      <CircularPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
                <div className="flex flex-col justify-center items-center text-center space-y-6">
                  <div className="relative">
                    <img src={gif} alt="No products found" className="max-h-64 opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-gray-800">No Products Found</h3>
                    <p className="text-gray-600 max-w-md">
                      We couldn't find any products matching your current filters. 
                      Try adjusting your search criteria or browse other brands.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setPriceRange([0, 200000]);
                      setShowDiscountedOnly(false);
                      setCurrentPage(1);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-red-400 to-teal-300 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .slider-thumb-emerald::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #0d9488);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .slider-thumb-emerald::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #0d9488);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
      `}</style>
    </div>
  );
};

export default Brand;