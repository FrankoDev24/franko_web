import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByCategory } from "../Redux/Slice/productSlice";
import { useNavigate } from "react-router-dom";
import { 
  FunnelIcon, 
  XMarkIcon, 
  AdjustmentsHorizontalIcon, 
  TagIcon,
  ChevronDownIcon,
  Bars3BottomLeftIcon,
 } from "@heroicons/react/24/outline";
import ProductCard from "../Component/ProductCard";
import { CircularPagination } from "../Component/CircularPagination";
import gif from "../assets/no.gif";
import { TbAirConditioning } from "react-icons/tb";

const categoryId = "db54033b-e95d-4a6c-8744-45e4d462c19e"; // Television category ID"

const Airconditioners = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { productsByCategory = {}, loading } = useSelector((state) => state.products);

  // Price range states - separate for input and actual filtering (matching Brand page)
  const [inputPriceRange, setInputPriceRange] = useState({ min: 0, max: 200000 });
  const [appliedPriceRange, setAppliedPriceRange] = useState([0, 200000]);
  const [showDiscountedOnly, setShowDiscountedOnly] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, price-low, price-high, name-az, name-za
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const itemsPerPage = 8;

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(fetchProductsByCategory(categoryId));
  }, [dispatch]);

  const products = useMemo(() => {
    const categoryProducts = productsByCategory[categoryId] || [];
    return categoryProducts;
  }, [productsByCategory]);

  const brands = useMemo(() => {
    return Array.from(new Set(products.map((product) => product.brandName))).sort();
  }, [products]);

  // Apply price filter
  const applyPriceFilter = () => {
    const min = Math.max(0, inputPriceRange.min || 0);
    const max = Math.min(200000, inputPriceRange.max || 200000);
    setAppliedPriceRange([min, max]);
    setCurrentPage(1);
    // Close drawer on mobile after applying filter
    setIsDrawerOpen(false);
  };

  // Reset filters
  const resetFilters = () => {
    setInputPriceRange({ min: 0, max: 200000 });
    setAppliedPriceRange([0, 200000]);
    setShowDiscountedOnly(false);
    setSelectedBrand(null);
    setSortBy("newest");
    setCurrentPage(1);
    // Close drawer on mobile after resetting
    setIsDrawerOpen(false);
  };

  // Toggle discount filter with drawer close
  const toggleDiscountFilter = () => {
    setShowDiscountedOnly(!showDiscountedOnly);
    // Close drawer on mobile after toggling
    setIsDrawerOpen(false);
  };

  // Select brand with drawer close
  const selectBrand = (brand) => {
    setSelectedBrand(selectedBrand === brand ? null : brand);
    setCurrentPage(1);
    // Close drawer on mobile after selecting brand
    setIsDrawerOpen(false);
  };

  // Sort products
  const sortProducts = (products) => {
    const sorted = [...products];
    switch (sortBy) {
      case "oldest":
        return sorted.sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price);
      case "name-az":
        return sorted.sort((a, b) => a.productName.localeCompare(b.productName));
      case "name-za":
        return sorted.sort((a, b) => b.productName.localeCompare(a.productName));
      default: // newest
        return sorted.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
    }
  };
const filteredProducts = sortProducts(
  products.filter((product) => {
      const withinRange = product.price >= appliedPriceRange[0] && product.price <= appliedPriceRange[1];
      const hasDiscount = showDiscountedOnly ? product.oldPrice > product.price : true;
      const matchesBrand = selectedBrand ? product.brandName === selectedBrand : true;
      return withinRange && hasDiscount && matchesBrand;
    })
  );

const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name-az", label: "Name: A to Z" },
    { value: "name-za", label: "Name: Z to A" },
  ];

  const renderFilterContent = () => (
    <div className="w-full lg:w-80 space-y-6">
      {/* Filter Header */}
      <div className="hidden lg:flex items-center gap-3 pb-4 border-b border-gray-300">
        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
          <AdjustmentsHorizontalIcon className="w-5 h-5 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Filters</h3>
      </div>

      {/* Price Range Input */}
      <div className="bg-gradient-to-br from-gray-50 to-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <h4 className="text-base font-semibold text-gray-700">Price Range</h4>
        </div>
        
        <div className="space-y-4">
          {/* Input Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₵</span>
                <input
                  type="number"
                  min="0"
                  max="200000"
                  value={inputPriceRange.min}
                  onChange={(e) => setInputPriceRange(prev => ({ ...prev, min: +e.target.value }))}
                  className="w-full pl-6 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₵</span>
                <input
                  type="number"
                  min="0"
                  max="200000"
                  value={inputPriceRange.max}
                  onChange={(e) => setInputPriceRange(prev => ({ ...prev, max: +e.target.value }))}
                  className="w-full pl-6 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="200000"
                />
              </div>
            </div>
          </div>

          {/* Apply Filter Button */}
          <button
            onClick={applyPriceFilter}
            className="w-full bg-gradient-to-r from-green-400 to-teal-300 text-white py-2.5 rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
          >
            Apply Price Filter
          </button>

          {/* Current Applied Range Display */}
          <div className="bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
            <div className="flex justify-between items-center">
              <span className="text-xs text-emerald-700 font-medium">Applied Range:</span>
              <span className="text-xs text-emerald-800 font-semibold">
                ₵{appliedPriceRange[0].toLocaleString()} - ₵{appliedPriceRange[1].toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Toggle */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-2xl border border-red-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-400 to-orange-500 rounded-lg">
              <TagIcon className="w-4 h-4 text-white" />
            </div>
            <label htmlFor="discount-toggle" className="text-sm md:text-base font-semibold text-gray-800 cursor-pointer">
              Discounted Items Only
            </label>
          </div>
          
          <div className="relative">
            <input
              type="checkbox"
              id="discount-toggle"
              checked={showDiscountedOnly}
              onChange={toggleDiscountFilter}
              className="sr-only"
            />
            <div
              onClick={toggleDiscountFilter}
              className={`w-12 h-6 rounded-full cursor-pointer transition-all duration-300 ${
                showDiscountedOnly 
                  ? 'bg-gradient-to-r from-green-500 to-teal-600 shadow-lg' 
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

      {/* Brand Selection */}
      {brands.length > 0 && (
        <div className="bg-gradient-to-br from-red-50 to-green-50 p-4 md:p-6 rounded-2xl border border-green-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <h4 className="text-sm md:text-base font-semibold text-gray-800">Filter by Brand</h4>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => selectBrand(brand)}
                className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                  selectedBrand === brand
                    ? "bg-gradient-to-r from-red-200 to-green-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-green-300 hover:text-green-600 hover:shadow-md"
                }`}
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
        className="w-full bg-red-400 hover:bg-red-200 text-white py-1.5 rounded-lg font-medium transition-colors duration-200"
      >
        Reset All Filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen ">
      <div className="p-2 md:px-2 mx-auto">
        {/* Enhanced Mobile Header */}
        <div className="md:hidden space-y-2 ">
          {/* Phone Info */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <TbAirConditioning  className="w-5 h-5 text-red-300" />
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {selectedBrand ? `${selectedBrand}` : "Airconditioners"}
              </h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {filteredProducts.length} products available
            </p>
          </div>

          {/* Mobile Controls */}
          <div className="flex gap-3">
            {/* Filter Button */}
            <button 
              onClick={() => setIsDrawerOpen(true)} 
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              <FunnelIcon className="w-5 h-5 text-red-400" />
              <span className="font-medium text-sm">Filter</span>
            </button>

            {/* Sort Button */}
            <div className="relative flex-1">
              <button 
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
              >
                <Bars3BottomLeftIcon className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700 font-medium text-sm">Sort</span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Mobile Sort Dropdown */}
              {showSortDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl ${
                        sortBy === option.value
                          ? 'bg-emerald-50 text-emerald-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Drawer */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsDrawerOpen(false)}
            ></div>
            
            {/* Drawer content */}
            <div className="relative w-full max-w-sm h-full bg-white shadow-2xl overflow-auto transform transition-transform duration-300 ease-out">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 z-10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg">
                      <AdjustmentsHorizontalIcon className="w-5 h-5 text-red-400" />
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
              
              <div className="p-4">
                {renderFilterContent()}
              </div>
            </div>
          </div>
        )}

        {/* Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="lg:w-80">
            <div className="hidden lg:block sticky top-6">
              {renderFilterContent()}
            </div>
          </aside>

          {/* Products Section */}
          <section className="flex-1">
            {currentProducts.length > 0 ? (
              <div className="space-y-2">
                {/* Desktop Header with Sort */}
                <div className="hidden md:block bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                           <TbAirConditioning  className="w-6 h-6 text-red-300" />
                        </div>
                        <h2 className="text-md md:text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                          {selectedBrand ? `${selectedBrand}` : "Air-Conditioners"}
                        </h2>
                      </div>
                      <p className="text-gray-500 text-sm mt-1">
                        Discover amazing smart Air-Conditioners from various brands
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Product Count */}
                      <div className="bg-red-50 text-red-700 px-3 py-1 rounded-full border border-emerald-200">
                        <span className="text-sm font-medium">
                          <strong>{currentProducts.length}</strong> of <strong>{filteredProducts.length}</strong> products
                        </span>
                      </div>

                      {/* Desktop Sort Dropdown */}
                      <div className="relative">
                        <button 
                          onClick={() => setShowSortDropdown(!showSortDropdown)}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200"
                        >
                          <Bars3BottomLeftIcon className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">
                            {sortOptions.find(opt => opt.value === sortBy)?.label}
                          </span>
                          <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showSortDropdown && (
                          <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                            {sortOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setSortBy(option.value);
                                  setShowSortDropdown(false);
                                  setCurrentPage(1);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                                  sortBy === option.value
                                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="md:p-6">
                  <ProductCard
                    currentProducts={currentProducts}
                    navigate={navigate}
                    loading={loading}
                  />
                </div>

                {/* Pagination */}
                {totalPages > 1 && !loading && (
                  <div className="flex justify-center">
                    <CircularPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-6 md:mt-24">
                <div className="flex flex-col justify-center items-center text-center space-y-6">
                  <div className="relative">
                    <img src={gif} alt="No products found" className="max-h-24 md:max-h-72 opacity-80" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-800">No Air-Conditioners Found</h3>
                    <p className="text-gray-600 max-w-md text-sm md:text-base">
                      We couldn't find any Air-Conditioners matching your current filters. 
                      Try adjusting your search criteria or browse other brands.
                    </p>
                  </div>
                  
                  <button
                    onClick={resetFilters}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-300 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {showSortDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSortDropdown(false)}
        ></div>
      )}
    </div>
  );
};

export default Airconditioners