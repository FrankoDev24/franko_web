import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByCategory } from "../Redux/Slice/productSlice";
import { useNavigate } from "react-router-dom";
import gif from "../assets/no.gif";
import { CircularPagination } from "../Component/CircularPagination";
import { FunnelIcon, XMarkIcon, AdjustmentsHorizontalIcon, TagIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@material-tailwind/react";
import ProductCard from "../Component/ProductCard";
 
const categoryId = "51d1fff2-7b71-46aa-9b34-2e553a40e921";

const Phones = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { productsByCategory = {}, loading } = useSelector((state) => state.products);

  const [filters, setFilters] = useState({
    selectedBrand: null,
    priceRange: [0, 200000],
    showDiscountedOnly: false,
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    dispatch(fetchProductsByCategory(categoryId));
    window.scrollTo(0, 0);
  }, [dispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const products = useMemo(() => {
    const categoryProducts = productsByCategory[categoryId] || [];
    return categoryProducts
      .slice()
      .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
  }, [productsByCategory]);

  const brands = useMemo(() => {
    return Array.from(new Set(products.map((product) => product.brandName)));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const { selectedBrand, priceRange, showDiscountedOnly } = filters;
      const matchesBrand = selectedBrand
        ? product.brandName === selectedBrand
        : true;
      const matchesPrice =
        product.price >= priceRange[0] && product.price <= priceRange[1];
      const matchesDiscount = showDiscountedOnly
        ? (product.oldPrice || 0) > product.price
        : true;
      return matchesBrand && matchesPrice && matchesDiscount;
    });
  }, [products, filters]);

  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const resetFilters = () => {
    setFilters({
      selectedBrand: null,
      priceRange: [0, 200000],
      showDiscountedOnly: false,
    });
  };

  const renderFilterContent = () => (
    <div className="w-full lg:w-80 space-y-8">
      {/* Filter Header */}
      <div className="hidden lg:flex items-center gap-3 pb-4 border-b border-gray-300">
        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
          <AdjustmentsHorizontalIcon className="w-5 h-5 text-white" />
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
            <span className="text-sm font-medium text-gray-600">₵{filters.priceRange[0].toLocaleString()}</span>
            <span className="text-xs text-gray-400">to</span>
            <span className="text-sm font-medium text-gray-600">₵{filters.priceRange[1].toLocaleString()}</span>
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
              value={filters.priceRange[0]}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  priceRange: [
                    Math.min(+e.target.value, prev.priceRange[1] - 1000),
                    prev.priceRange[1],
                  ],
                }))
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
              value={filters.priceRange[1]}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  priceRange: [
                    prev.priceRange[0],
                    Math.max(+e.target.value, prev.priceRange[0] + 1000),
                  ],
                }))
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
              checked={filters.showDiscountedOnly}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  showDiscountedOnly: e.target.checked,
                }))
              }
              className="sr-only"
            />
            <div
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  showDiscountedOnly: !prev.showDiscountedOnly,
                }))
              }
              className={`w-12 h-6 rounded-full cursor-pointer transition-all duration-300 ${
                filters.showDiscountedOnly 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg' 
                  : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                  filters.showDiscountedOnly ? 'translate-x-6' : 'translate-x-0.5'
                } mt-0.5`}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Selection */}
      {brands.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h4 className="text-base font-semibold text-gray-800">Filter by Brand</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {brands.map((brand) => (
              <button
                key={brand}
                className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  filters.selectedBrand === brand
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md"
                }`}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    selectedBrand: prev.selectedBrand === brand ? null : brand,
                  }))
                }
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reset Filters Button */}
      <button
        onClick={resetFilters}
        className="w-full px-6 py-3 bg-gradient-to-r from-red-400 to-pink-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
      >
        Clear All Filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="p-4 md:px-24 mx-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DevicePhoneMobileIcon className="w-5 h-5 text-red-300" />
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {filters.selectedBrand || "All Phones"}
              </h2>
            </div>
            <p className="text-sm text-gray-500">
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
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 z-10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                      <AdjustmentsHorizontalIcon className="w-5 h-5 text-red" />
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
              
              <div className="p-6">
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
                  <span>₵{filters.priceRange[0].toLocaleString()}</span>
                  <span>₵{filters.priceRange[1].toLocaleString()}</span>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="200000"
                    step="1000"
                    value={filters.priceRange[0]}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        priceRange: [
                          Math.min(+e.target.value, prev.priceRange[1] - 1000),
                          prev.priceRange[1],
                        ],
                      }))
                    }
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb-emerald"
                  />
                  <input
                    type="range"
                    min="0"
                    max="200000"
                    step="1000"
                    value={filters.priceRange[1]}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        priceRange: [
                          prev.priceRange[0],
                          Math.max(+e.target.value, prev.priceRange[0] + 1000),
                        ],
                      }))
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
                      checked={filters.showDiscountedOnly}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          showDiscountedOnly: e.target.checked,
                        }))
                      }
                      className="sr-only"
                    />
                    <div
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          showDiscountedOnly: !prev.showDiscountedOnly,
                        }))
                      }
                      className={`w-10 h-5 rounded-full cursor-pointer transition-all duration-300 ${
                        filters.showDiscountedOnly 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md' 
                          : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
                          filters.showDiscountedOnly ? 'translate-x-5' : 'translate-x-0.5'
                        } mt-0.5`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Brands - Compact */}
              {brands.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h4 className="text-sm font-semibold text-gray-800">Brands</h4>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {brands.slice(0, 6).map((brand) => (
                      <button
                        key={brand}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            selectedBrand: prev.selectedBrand === brand ? null : brand,
                          }))
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                          filters.selectedBrand === brand
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm"
                            : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                    {brands.length > 6 && (
                      <span className="px-3 py-1.5 text-xs text-gray-500 bg-gray-100 rounded-full">
                        +{brands.length - 6} more
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
                <div className="hidden md:block bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                          <DevicePhoneMobileIcon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                          {filters.selectedBrand || "All Phones"}
                        </h2>
                      </div>
                      <p className="text-gray-500 text-sm">
                        Discover the latest smartphones and mobile devices
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-r from-emerald-100 to-teal-100 px-4 py-2 rounded-full border border-emerald-200">
                        <span className="text-sm font-medium text-emerald-700">
                          <strong>{currentProducts.length}</strong> of <strong>{filteredProducts.length}</strong> products
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <ProductCard
                    currentProducts={currentProducts}
                    navigate={navigate}
                    loading={loading}
                  />
                </div>

                {/* Pagination */}
                {totalPages > 1 && !loading && (
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
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
                    <h3 className="text-xl font-semibold text-gray-800">No Phones Found</h3>
                    <p className="text-gray-600 max-w-md">
                      We couldn't find any phones matching your current filters. 
                      Try adjusting your search criteria or browse other categories.
                    </p>
                  </div>
                  
                  <button
                    onClick={resetFilters}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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

export default Phones;