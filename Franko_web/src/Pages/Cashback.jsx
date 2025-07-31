import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByShowroom } from "../Redux/Slice/productSlice";
import { fetchShowrooms } from "../Redux/Slice/showRoomSlice";
import { Card, Typography } from "antd";
import { 
  ShoppingCartOutlined,
  FireOutlined,
  StarOutlined
} from "@ant-design/icons";
import { 
  FunnelIcon, 
  XMarkIcon, 
  AdjustmentsHorizontalIcon, 
  TagIcon,
  ChevronDownIcon,
  Bars3BottomLeftIcon,
  BoltIcon
} from "@heroicons/react/24/outline";
import useAddToCart from "../Component/Cart";
import { CircularPagination } from "../Component/CircularPagination";
import gif from "../assets/no.gif";
import { Helmet } from "react-helmet";

const { Title, Text } = Typography;

const Cashback = () => {
  const showRoomID = '67f53c84-0257-4719-a170-ff62e3d707f1';
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { productsByShowroom = {}, loading, showroom } = useSelector(
    (state) => state.products
  );

  // Cart hook
  const { addProductToCart, loading: cartLoading } = useAddToCart();
  const [addingToCart, setAddingToCart] = useState({});

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Price Filter States - separate for input and actual filtering
  const [inputPriceRange, setInputPriceRange] = useState({ min: 0, max: 200000 });
  const [appliedPriceRange, setAppliedPriceRange] = useState([0, 200000]);
  const [showDiscountedOnly, setShowDiscountedOnly] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Crazy Price Drop Timer - ends July 10th at 11:59 PM
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(fetchProductsByShowroom(showRoomID));
    dispatch(fetchShowrooms());
  }, [dispatch]);

  // Countdown timer effect
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const promoEndDate = new Date('2025-07-10T23:59:59');
      const difference = promoEndDate - now;

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      } else {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSortDropdown(false);
    };

    if (showSortDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSortDropdown]);

  // Apply price filter
  const applyPriceFilter = () => {
    const min = Math.max(0, inputPriceRange.min || 0);
    const max = Math.min(200000, inputPriceRange.max || 200000);
    setAppliedPriceRange([min, max]);
    setCurrentPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setInputPriceRange({ min: 0, max: 200000 });
    setAppliedPriceRange([0, 200000]);
    setShowDiscountedOnly(false);
    setSortBy("newest");
    setCurrentPage(1);
  };

  // Sort products - FIXED: Now properly returns sorted array
  const sortProducts = (products) => {
    if (!products || products.length === 0) return [];
    
    const sorted = [...products];
    switch (sortBy) {
      case "oldest":
        return sorted.sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));
      case "price-low":
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price-high":
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "name-az":
        return sorted.sort((a, b) => (a.productName || "").localeCompare(b.productName || ""));
      case "name-za":
        return sorted.sort((a, b) => (b.productName || "").localeCompare(a.productName || ""));
      default: // newest
        return sorted.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
    }
  };

  // Helper functions
  const getValidImageUrl = (imagePath) => {
    if (!imagePath) return '/api/placeholder/300/300';
    return `https://smfteapi.salesmate.app/Media/Products_Images/${imagePath.split("\\").pop()}`;
  };

  const handleAddToCart = async (product) => {
    setAddingToCart(prev => ({ ...prev, [product.productID]: true }));
    
    try {
      await addProductToCart(product);
    } finally {
      setAddingToCart(prev => ({ ...prev, [product.productID]: false }));
    }
  };

  const handleProductClick = (productID, isUnavailable) => {
    if (!isUnavailable) {
      navigate(`/product/${productID}`);
    }
  };

  // Close filter drawer
  const closeFilterDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Filtering products based on price range and other filters
  const filteredProducts = sortProducts(
    (productsByShowroom[showRoomID] || [])
      .filter((product) => {
        const withinRange = product.price >= appliedPriceRange[0] && product.price <= appliedPriceRange[1];
        const hasDiscount = showDiscountedOnly ? product.oldPrice > product.price : true;
        return withinRange && hasDiscount;
      })
  );

  // Pagination logic
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Format price with commas
  const formatPrice = (price) => `₵${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  // Calculate discount percentage
  const calculateDiscount = (oldPrice, price) => {
    if (oldPrice > price) {
      return Math.round(((oldPrice - price) / oldPrice) * 100);
    }
    return 0;
  };

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name-az", label: "Name: A to Z" },
    { value: "name-za", label: "Name: Z to A" },
  ];

  // Check if promo has ended
  const promoEnded = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  const renderFilterContent = () => (
    <div className="w-full lg:w-80 space-y-6">
      {/* Filter Header */}
      <div className="hidden lg:flex items-center gap-3 pb-4 border-b border-orange-200">
        <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
          <AdjustmentsHorizontalIcon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Filters</h3>
      </div>

      {/* Price Range Input */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 md:p-6 rounded-2xl border border-orange-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <h4 className="text-base font-semibold text-orange-800">Price Range</h4>
        </div>
        
        <div className="space-y-4">
          {/* Input Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-orange-700 mb-1">Min Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-600 text-sm">₵</span>
                <input
                  type="number"
                  min="0"
                  max="200000"
                  value={inputPriceRange.min}
                  onChange={(e) => setInputPriceRange(prev => ({ ...prev, min: +e.target.value }))}
                  className="w-full pl-6 pr-3 py-2 border border-orange-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-orange-700 mb-1">Max Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-600 text-sm">₵</span>
                <input
                  type="number"
                  min="0"
                  max="200000"
                  value={inputPriceRange.max}
                  onChange={(e) => setInputPriceRange(prev => ({ ...prev, max: +e.target.value }))}
                  className="w-full pl-6 pr-3 py-2 border border-orange-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="200000"
                />
              </div>
            </div>
          </div>

          {/* Apply Filter Button */}
          <button
            onClick={applyPriceFilter}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
          >
            Apply Price Filter
          </button>

          {/* Current Applied Range Display */}
          <div className="bg-orange-100 px-3 py-2 rounded-lg border border-orange-300">
            <div className="flex justify-between items-center">
              <span className="text-xs text-orange-700 font-medium">Applied Range:</span>
              <span className="text-xs text-orange-800 font-semibold">
                ₵{appliedPriceRange[0].toLocaleString()} - ₵{appliedPriceRange[1].toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Toggle */}
      <div className="bg-gradient-to-br from-red-50 to-yellow-50 p-4 rounded-2xl border border-red-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
              <TagIcon className="w-4 h-4 text-white" />
            </div>
            <label htmlFor="discount-toggle" className="text-sm md:text-base font-semibold text-red-800 cursor-pointer">
              Show Only Discounted Items
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
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 shadow-lg' 
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

      {/* Reset Filters Button */}
      <button
        onClick={resetFilters}
        className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-2.5 rounded-lg font-medium transition-all duration-200"
      >
        Reset All Filters
      </button>

      {/* Mobile Only: Close Filter Button */}
      <div className="lg:hidden">
        <button
          onClick={closeFilterDrawer}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span>Apply Filters</span>
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Offer",
    "name": "Cashback Deals – Save Up to ₵2000",
    "description": "Flash Sale! Save up to ₵2000 instantly at checkout. No coupon code required. Offer valid for 24 hours only on Sales Mate.",
    "url": "https://www.frankotrading.com/cashback-deals",  // Replace with actual URL
    "priceCurrency": "GHS",
    "availability": "https://schema.org/InStock",
    "price": "0",
    "eligibleRegion": {
      "@type": "Country",
      "name": "Ghana"
    },
    "seller": {
      "@type": "Organization",
      "name": "Franko Trading Enterprise",
      "url": "https://www.frankotrading.com",  // Replace with actual site URL
      "logo": "https://www.frankotrading.com/frankoIcon.png"  // Replace with your logo
    },
    "validFrom": "2025-07-31T00:00:00+00:00",
    "validThrough": "2025-08-01T00:00:00+00:00"
  };



  return (
    <div className="min-h-screen">
 <Helmet>
        <title>Cashback Deals: Save Up to ₵2000 – 24 Hours Only | Sales Mate</title>
        <meta
          name="description"
          content="Flash Sale Alert! Enjoy massive cashback savings up to ₵2000 at checkout – no coupon needed. 24 hours only. Shop now on Sales Mate and grab the best deals before they’re gone!"
        />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-red-400 to-orange-400 rounded-full opacity-15 animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-gradient-to-r from-yellow-400 to-red-400 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full opacity-10 animate-ping"></div>
      </div>

      <div className="p-2 md:px-2 mx-auto relative z-10">
        {/* Enhanced Mobile Header */}
        <div className="md:hidden space-y-3">
          {/* Promo Banner Mobile */}
          <div className="bg-gradient-to-r from-orange-500 via bg-yellow-400 to-yellow-500 text-white rounded-2xl p-4 shadow-2xl border-2 border-yellow-300">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FireOutlined className="text-2xl animate-bounce" />
                <h2 className="text-xl font-black">CASH BACK PROMO!</h2>
                <FireOutlined className="text-2xl animate-bounce" />
              </div>
              <p className="text-sm font-semibold text-yellow-200 mb-3">
                🚀 Unbeatable Deals • Limited Time Only!
              </p>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex gap-3">
            {/* Filter Button */}
            <button 
              onClick={() => setIsDrawerOpen(true)} 
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              <FunnelIcon className="w-5 h-5" />
              <span className="font-medium text-sm">Filter</span>
            </button>

            {/* Sort Button */}
            <div className="relative flex-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSortDropdown(!showSortDropdown);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 bg-white border-2 border-orange-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
              >
                <Bars3BottomLeftIcon className="w-5 h-5 text-orange-600" />
                <span className="text-orange-700 font-medium text-sm">Sort</span>
                <ChevronDownIcon className={`w-4 h-4 text-orange-500 transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Mobile Sort Dropdown */}
              {showSortDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-orange-200 rounded-xl shadow-lg z-50">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl ${
                        sortBy === option.value
                          ? 'bg-orange-50 text-orange-700 font-medium'
                          : 'text-gray-700 hover:bg-orange-50'
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

        {/* Enhanced Mobile Drawer - FIXED: Added proper close functionality */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
              onClick={closeFilterDrawer}
            ></div>
            
            {/* Drawer content - FIXED: Made responsive for mobile */}
            <div className="relative w-full max-w-sm h-full bg-white shadow-2xl overflow-auto transform transition-transform duration-300 ease-out">
              <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 border-b border-orange-300 px-4 py-4 z-10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <AdjustmentsHorizontalIcon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Filters</h2>
                  </div>
                  
                  <button 
                    onClick={closeFilterDrawer}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200"
                  >
                    <XMarkIcon className="w-6 h-6 text-white" />
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
              {/* Desktop Promo Banner */}
              <div className="bg-gradient-to-r from-orange-400 via-red-500 to-yellow-500 text-white rounded-3xl p-6 mb-6 shadow-2xl border-2 border-yellow-300">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <FireOutlined className="text-3xl animate-bounce" />
                    <h2 className="text-2xl font-black">CASH BACK PROMO!</h2>
                    <FireOutlined className="text-3xl animate-bounce" />
                  </div>
                  <p className="text-lg font-semibold text-yellow-200 mb-4">
                    🚀 Unbeatable Deals • Limited Time Only!
                  </p>
                </div>
              </div>
              
              {renderFilterContent()}
            </div>
          </aside>

          {/* Products Section */}
          <section className="flex-1">
            {currentProducts.length > 0 ? (
              <div className="space-y-4">
                {/* Desktop Header with Sort */}
                <div className="hidden md:block bg-white p-6 rounded-2xl shadow-lg border-2 border-orange-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                          <BoltIcon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                         Cash Back Promo Deals
                        </h2>
                      </div>
                      <p className="text-gray-600">
                        Discover incredible savings on premium products
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Product Count */}
                      <div className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 px-4 py-2 rounded-full border-2 border-orange-300">
                        <span className="font-bold">
                          <strong>{currentProducts.length}</strong> of <strong>{filteredProducts.length}</strong> deals
                        </span>
                      </div>

                      {/* Desktop Sort Dropdown - FIXED: Added event handling */}
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSortDropdown(!showSortDropdown);
                          }}
                          className="flex items-center gap-2 px-4 py-2 border-2 border-orange-200 rounded-lg hover:border-orange-300 transition-colors duration-200 bg-white"
                        >
                          <Bars3BottomLeftIcon className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-700">
                            {sortOptions.find(opt => opt.value === sortBy)?.label}
                          </span>
                          <ChevronDownIcon className={`w-4 h-4 text-orange-500 transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showSortDropdown && (
                          <div className="absolute top-full right-0 mt-2 w-48 bg-white border-2 border-orange-200 rounded-lg shadow-lg z-50">
                            {sortOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSortBy(option.value);
                                  setShowSortDropdown(false);
                                  setCurrentPage(1);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                                  sortBy === option.value
                                    ? 'bg-orange-50 text-orange-700 font-medium'
                                    : 'text-gray-700 hover:bg-orange-50'
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
                  {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                      {Array.from({ length: itemsPerPage }).map((_, index) => (
                        <Card key={index} className="animate-pulse shadow-lg rounded-2xl border-2 border-gray-200">
                          <div className="h-40 md:h-48 bg-gradient-to-br from-gray-200 to-gray-200 rounded-t-2xl" />
                          <div className="p-3 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                      {currentProducts.map((product) => {
                        const discount = calculateDiscount(product.oldPrice, product.price);
                        const soldOut = product.stock === 0;
                        const isAllBrands = product.brandName === "All brands";
                        const isUnavailable = soldOut || isAllBrands;
                        const isAddingToCart = addingToCart[product.productID];
                        
                        return (
                          <div
                            key={product.productID}
                            className={`group bg-white rounded-2xl shadow-lg overflow-hidden relative transition-all duration-300 border-2 ${
                              isUnavailable 
                                ? 'opacity-60 cursor-not-allowed border-gray-200' 
                                : 'hover:shadow-2xl transform hover:-translate-y-3 cursor-pointer border-yellow-200 '
                            }`}
                            onClick={() => handleProductClick(product.productID, isUnavailable)}
                          >
                            {/* Enhanced Badges */}
                            <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                              {/* Cashback Badge - Always visible for available products */}
                              {!isUnavailable && (
                                <span className="bg-gray-800 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg animate-pulse border border-white">
                                  💰 CASHBACK
                                </span>
                              )}
                              
                              {/* Status Badge */}
                              {isAllBrands ? (
                                <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded-full font-bold">
                                  OUT OF STOCK
                                </span>
                              ) : soldOut ? (
                                <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded-full font-bold">
                                  SOLD OUT
                                </span>
                              ) : discount > 0 ? (
                                <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white text-xs font-black px-3 py-1 rounded-full animate-bounce border border-white">
                                  🔥 -{discount}% OFF
                                </span>
                              ) : (
                                <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white text-xs font-black px-3 py-1 rounded-full border border-white">
                                  ⚡ CRAZY DEAL
                                </span>
                              )}
                            </div>

                            {/* Special Effects Overlay */}
                            {!isUnavailable && (
                              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-yellow-400/5 to-red-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                            )}

                            {/* Image Container */}
                            <div className="relative overflow-hidden">
                              <div className={`h-40 md:h-48 w-full flex items-center justify-center  ${
                                isUnavailable ? 'grayscale' : ''
                              }`}>
                                <img
                                  src={getValidImageUrl(product.productImage)}
                                  alt={product.productName}
                                  className={`h-full w-full object-contain transition-all duration-500 ${
                                    !isUnavailable ? 'group-hover:scale-110' : ''
                                  }`}
                                />
                              </div>

                              {/* Promotional Overlay - Only for available products */}
                              {!isUnavailable && (
                                <div className="absolute inset-0 bg-gradient-to-t from-orange-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                                      <StarOutlined className="text-yellow-500 text-xs" />
                                      <span className="text-xs font-bold text-gray-800">PROMO DEAL</span>
                                      <StarOutlined className="text-yellow-500 text-xs" />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="p-3 text-center">
                              <h3 className={`text-xs md:text-sm font-semibold line-clamp-2 mb-3 transition-colors ${
                                isUnavailable 
                                  ? 'text-gray-500' 
                                  : 'text-gray-800 '
                              }`}>
                                {product.productName}
                              </h3>
                              
                              {/* Enhanced Price Section */}
                              <div className="space-y-2">
                                <div className="flex justify-center items-center gap-2">
                                  <span className={`font-black text-lg md:text-xl ${
                                    isUnavailable ? 'text-gray-500' : 'text-orange-600 group-hover:text-red-600'
                                  }`}>
                                    {formatPrice(product.price)}
                                  </span>
                                  {product.oldPrice > 0 && (
                                    <span className="text-sm text-gray-400 line-through font-medium">
                                      {formatPrice(product.oldPrice)}
                                    </span>
                                  )}
                                </div>

                                {/* Savings Display */}
                                {!isUnavailable && product.oldPrice > 0 && discount > 0 && (
                                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-2 py-1 rounded-lg">
                                    <span className="text-xs font-bold text-green-700">
                                      You Save: {formatPrice(product.oldPrice - product.price)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons - Only show for available products */}
                              {!isUnavailable && (
                                <div className="space-y-2 mt-4 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                  {/* Add to Cart Button */}
                                  <button
                                    className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white px-3 py-2 rounded-xl font-bold hover:from-orange-600 hover:via-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                                    disabled={isAddingToCart}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToCart(product);
                                    }}
                                  >
                                    <ShoppingCartOutlined className="text-sm" />
                                    <span className="text-sm">
                                      {isAddingToCart ? "Adding..." : "Add to Cart"}
                                    </span>
                                  </button>
                                  
                                  {/* Quick View Button */}
                                  <button
                                    className="w-full bg-gradient-to-r from-black to-gray-500 text-white px-3 py-1.5 rounded-lg font-medium transition-all duration-300 text-sm shadow-md hover:shadow-lg"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleProductClick(product.productID, false);
                                    }}
                                  >
                                    Quick View
                                  </button>
                                </div>
                              )}

                              {/* Unavailable message for out of stock items */}
                              {isUnavailable && (
                                <div className="mt-4">
                                  <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl font-bold text-sm border border-gray-200">
                                    {isAllBrands ? "Out of Stock" : "Sold Out"}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Enhanced Pagination */}
                {totalPages > 1 && !loading && (
                  <div className="flex justify-center ">
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
              <div className="bg-white rounded-2xl shadow-lg border-2 border-orange-200 p-8 mt-6 md:mt-24">
                <div className="flex flex-col justify-center items-center text-center space-y-6">
                  <div className="relative">
                    <img src={gif} alt="No products found" className="max-h-24 md:max-h-72 opacity-80" />

                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      No Deals Found!
                    </h3>
                    <p className="text-gray-600 max-w-md text-sm md:text-base">
                      All the cash back deals might be sold out! 
                      Try adjusting your filters or check back soon for more amazing deals.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={resetFilters}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      🔄 Reset Filters
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      🏠 Browse All Products
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Cashback;