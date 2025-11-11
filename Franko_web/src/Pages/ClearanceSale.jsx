import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByShowroom } from "../Redux/Slice/productSlice";
import { fetchShowrooms } from "../Redux/Slice/showRoomSlice";
import { Card, Typography } from "antd";
import { 
  ShoppingCartOutlined,
  StarOutlined
} from "@ant-design/icons";
import { 
  FunnelIcon, 
  XMarkIcon, 
  AdjustmentsHorizontalIcon, 
  TagIcon,
  ChevronDownIcon,
  Bars3BottomLeftIcon,
  SparklesIcon,
  FireIcon,
  BoltIcon
} from "@heroicons/react/24/outline";
import useAddToCart from "../Component/Cart";
import { CircularPagination } from "../Component/CircularPagination";
import gif from "../assets/no.gif";
import { Helmet } from "react-helmet";

const { Title, Text } = Typography;

// Loading Skeleton Component
const ProductSkeleton = () => {
  const BRAND_COLORS = {
    black: '#1A1A1A',
    lightGray: '#F5F5F5',
    mediumGray: '#E5E5E5'
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 animate-pulse" style={{borderColor: BRAND_COLORS.mediumGray}}>
      <div className="h-40 md:h-48 w-full" style={{backgroundColor: BRAND_COLORS.lightGray}}></div>
      <div className="p-3 space-y-3">
        <div className="h-4 rounded" style={{backgroundColor: BRAND_COLORS.mediumGray}}></div>
        <div className="h-4 rounded w-3/4" style={{backgroundColor: BRAND_COLORS.mediumGray}}></div>
        <div className="h-6 rounded w-1/2 mx-auto" style={{backgroundColor: BRAND_COLORS.mediumGray}}></div>
        <div className="h-10 rounded" style={{backgroundColor: BRAND_COLORS.mediumGray}}></div>
      </div>
    </div>
  );
};

const ClearanceSale = () => {
  const showRoomID = '67f53c84-0257-4719-a170-ff62e3d707f1';
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Pre Black Friday Brand Colors
  const BRAND_COLORS = {
    black: '#1A1A1A',
    darkGray: '#2D2D2D',
    red: '#FF0000',
    darkRed: '#CC0000',
    yellow: '#FFD700',
    white: '#FFFFFF',
    lightGray: '#F5F5F5',
    mediumGray: '#E5E5E5',
    textGray: '#666666'
  };
  
  const { productsByShowroom = {}, loading, showroom } = useSelector(
    (state) => state.products
  );

  // Cart hook
  const { addProductToCart, loading: cartLoading } = useAddToCart();
  const [addingToCart, setAddingToCart] = useState({});

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter States
  const [inputPriceRange, setInputPriceRange] = useState({ min: 0, max: 200000 });
  const [appliedPriceRange, setAppliedPriceRange] = useState([0, 200000]);
  const [showDiscountedOnly, setShowDiscountedOnly] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Timer State
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
      const promoEndDate = new Date('2025-11-22T23:59:59');
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

  // Sort products
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
      default:
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

  const closeFilterDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Filtering products
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

  // Format price
  const formatPrice = (price) => `₵${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  // Calculate discount
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

  const promoEnded = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  const renderFilterContent = () => (
    <div className="w-full lg:w-80 space-y-6">
      {/* Filter Header */}
      <div className="hidden lg:flex items-center gap-3 pb-4" style={{borderBottom: `2px solid ${BRAND_COLORS.mediumGray}`}}>
        <div className="p-2 rounded-lg" style={{backgroundColor: BRAND_COLORS.red}}>
          <AdjustmentsHorizontalIcon className="w-5 h-5" style={{color: BRAND_COLORS.white}} />
        </div>
        <h3 className="text-xl font-bold" style={{color: BRAND_COLORS.black}}>Filters</h3>
      </div>

      {/* Price Range Input */}
      <div className="p-4 md:p-6 rounded-2xl border shadow-sm" style={{
        backgroundColor: BRAND_COLORS.lightGray,
        borderColor: BRAND_COLORS.mediumGray
      }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: BRAND_COLORS.red}}></div>
          <h4 className="text-base font-semibold" style={{color: BRAND_COLORS.black}}>Price Range</h4>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{color: BRAND_COLORS.textGray}}>Min Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm" style={{color: BRAND_COLORS.red}}>₵</span>
                <input
                  type="number"
                  min="0"
                  max="200000"
                  value={inputPriceRange.min}
                  onChange={(e) => setInputPriceRange(prev => ({ ...prev, min: +e.target.value }))}
                  className="w-full pl-6 pr-3 py-2 border rounded-lg text-sm focus:ring-2 transition-colors"
                  style={{
                    borderColor: BRAND_COLORS.mediumGray
                  }}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium mb-1" style={{color: BRAND_COLORS.textGray}}>Max Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm" style={{color: BRAND_COLORS.red}}>₵</span>
                <input
                  type="number"
                  min="0"
                  max="200000"
                  value={inputPriceRange.max}
                  onChange={(e) => setInputPriceRange(prev => ({ ...prev, max: +e.target.value }))}
                  className="w-full pl-6 pr-3 py-2 border rounded-lg text-sm focus:ring-2 transition-colors"
                  style={{
                    borderColor: BRAND_COLORS.mediumGray
                  }}
                  placeholder="200000"
                />
              </div>
            </div>
          </div>

          <button
            onClick={applyPriceFilter}
            className="w-full py-2.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
            style={{
              backgroundColor: BRAND_COLORS.red,
              color: BRAND_COLORS.white
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = BRAND_COLORS.darkRed}
            onMouseLeave={(e) => e.target.style.backgroundColor = BRAND_COLORS.red}
          >
            Apply Price Filter
          </button>

          <div className="px-3 py-2 rounded-lg border" style={{
            backgroundColor: BRAND_COLORS.white,
            borderColor: BRAND_COLORS.mediumGray
          }}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium" style={{color: BRAND_COLORS.textGray}}>Applied Range:</span>
              <span className="text-xs font-semibold" style={{color: BRAND_COLORS.black}}>
                ₵{appliedPriceRange[0].toLocaleString()} - ₵{appliedPriceRange[1].toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Toggle */}
      <div className="p-4 rounded-2xl border" style={{
        backgroundColor: BRAND_COLORS.lightGray,
        borderColor: BRAND_COLORS.mediumGray
      }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{backgroundColor: BRAND_COLORS.yellow}}>
              <TagIcon className="w-4 h-4" style={{color: BRAND_COLORS.black}} />
            </div>
            <label htmlFor="discount-toggle" className="text-sm md:text-base font-semibold cursor-pointer" style={{color: BRAND_COLORS.black}}>
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
              className="w-12 h-6 rounded-full cursor-pointer transition-all duration-300 shadow-lg"
              style={{
                backgroundColor: showDiscountedOnly ? BRAND_COLORS.red : BRAND_COLORS.mediumGray
              }}
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

      {/* Reset Filters */}
      <button
        onClick={resetFilters}
        className="w-full py-2.5 rounded-lg font-medium transition-all duration-200"
        style={{
          backgroundColor: BRAND_COLORS.darkGray,
          color: BRAND_COLORS.white
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = BRAND_COLORS.black}
        onMouseLeave={(e) => e.target.style.backgroundColor = BRAND_COLORS.darkGray}
      >
        Reset All Filters
      </button>

      {/* Mobile Close Button */}
      <div className="lg:hidden">
        <button
          onClick={closeFilterDrawer}
          className="w-full py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
          style={{
            backgroundColor: BRAND_COLORS.red,
            color: BRAND_COLORS.white
          }}
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
    "name": "Pre Black Friday Sale – Massive Discounts on Electronics",
    "description": "Huge Pre Black Friday sale! Get massive discounts on tablets, laptops, home appliances, and more.",
    "url": "https://www.frankotrading.com/clearance-sale",
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
      "url": "https://www.frankotrading.com"
    },
    "validFrom": "2025-10-30T00:00:00+00:00",
    "validThrough": "2025-11-10T23:59:59+00:00"
  };

  return (
    <div className="min-h-screen" style={{backgroundColor: BRAND_COLORS.lightGray}}>
      <Helmet>
        <title>Pre Black Friday Sale | Franko Trading</title>
        <meta
          name="description"
          content="Unbeatable Pre Black Friday sale prices! Shop electronics, appliances, and accessories at massive discounts from October 30th to November 10th."
        />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="p-2 md:px-2 mx-auto relative z-10">
        {/* Mobile Header */}
        <div className="md:hidden space-y-3">
          <div className="text-white rounded-2xl p-4 shadow-2xl border-2" style={{
            background: `linear-gradient(135deg, ${BRAND_COLORS.black} 0%, ${BRAND_COLORS.darkGray} 100%)`,
            borderColor: BRAND_COLORS.red
          }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <BoltIcon className="w-6 h-6 animate-bounce" style={{color: BRAND_COLORS.yellow}} />
                <h2 className="text-xl font-black">PRE BLACK FRIDAY!</h2>
                <FireIcon className="w-6 h-6 animate-bounce" style={{color: BRAND_COLORS.red}} />
              </div>
              <div className="text-xs font-semibold" style={{color: BRAND_COLORS.yellow}}>
                30th Oct - 22nd Nov 2025
              </div>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex gap-3">
            <button 
              onClick={() => setIsDrawerOpen(true)} 
              className="flex-1 flex items-center justify-center gap-2 p-3 text-white rounded-xl shadow-lg"
              style={{backgroundColor: BRAND_COLORS.red}}
            >
              <FunnelIcon className="w-5 h-5" />
              <span className="font-medium text-sm">Filter</span>
            </button>

            <div className="relative flex-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSortDropdown(!showSortDropdown);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 bg-white border-2 rounded-xl shadow-sm"
                style={{borderColor: BRAND_COLORS.mediumGray}}
              >
                <Bars3BottomLeftIcon className="w-5 h-5" style={{color: BRAND_COLORS.red}} />
                <span className="font-medium text-sm" style={{color: BRAND_COLORS.black}}>Sort</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} style={{color: BRAND_COLORS.red}} />
              </button>

              {showSortDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 rounded-xl shadow-lg z-50" style={{borderColor: BRAND_COLORS.mediumGray}}>
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
                        sortBy === option.value ? 'font-medium' : ''
                      }`}
                      style={{
                        backgroundColor: sortBy === option.value ? BRAND_COLORS.lightGray : 'transparent',
                        color: sortBy === option.value ? BRAND_COLORS.red : BRAND_COLORS.textGray
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={closeFilterDrawer}
            ></div>
            
            <div className="relative w-full max-w-sm h-full bg-white shadow-2xl overflow-auto">
              <div className="sticky top-0 border-b px-4 py-2 z-10" style={{
                background: `linear-gradient(135deg, ${BRAND_COLORS.black} 0%, ${BRAND_COLORS.darkGray} 100%)`,
                borderBottomColor: BRAND_COLORS.mediumGray
              }}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <AdjustmentsHorizontalIcon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Filters</h2>
                  </div>
                  
                  <button 
                    onClick={closeFilterDrawer}
                    className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg"
                  >
                    <XMarkIcon className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
              
              <div className="p-2">
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
              <div className="text-white rounded-3xl p-6 mb-6 shadow-2xl border-2" style={{
                background: `linear-gradient(135deg, ${BRAND_COLORS.black} 0%, ${BRAND_COLORS.darkGray} 100%)`,
                borderColor: BRAND_COLORS.red
              }}>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <BoltIcon className="w-8 h-8 animate-bounce" style={{color: BRAND_COLORS.yellow}} />
                    <h2 className="text-2xl font-black">PRE BLACK FRIDAY!</h2>
                    <FireIcon className="w-8 h-8 animate-bounce" style={{color: BRAND_COLORS.red}} />
                  </div>
                  <div className="text-sm font-semibold mt-2" style={{color: BRAND_COLORS.yellow}}>
                    30th October - 22nd November 2025
                  </div>
                </div>
              </div>
              
              {renderFilterContent()}
            </div>
          </aside>

          {/* Products Section */}
          <section className="flex-1">
            {loading || !productsByShowroom[showRoomID] ? (
              <div className="space-y-4">
                {/* Desktop Header Skeleton */}
                <div className="hidden md:block bg-white p-6 rounded-2xl shadow-lg border-2 animate-pulse" style={{borderColor: BRAND_COLORS.mediumGray}}>
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="h-8 w-48 rounded" style={{backgroundColor: BRAND_COLORS.mediumGray}}></div>
                      <div className="h-4 w-64 rounded" style={{backgroundColor: BRAND_COLORS.lightGray}}></div>
                    </div>
                    <div className="flex gap-4">
                      <div className="h-10 w-32 rounded-full" style={{backgroundColor: BRAND_COLORS.mediumGray}}></div>
                      <div className="h-10 w-40 rounded-lg" style={{backgroundColor: BRAND_COLORS.mediumGray}}></div>
                    </div>
                  </div>
                </div>

                {/* Products Grid Skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
                  {[...Array(10)].map((_, index) => (
                    <ProductSkeleton key={index} />
                  ))}
                </div>
              </div>
            ) : currentProducts.length > 0 ? (
              <div className="space-y-4">
                {/* Desktop Header */}
                <div className="hidden md:block bg-white p-2 rounded-2xl shadow-lg border-2" style={{borderColor: BRAND_COLORS.mediumGray}}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="px-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg" style={{backgroundColor: BRAND_COLORS.red}}>
                          <TagIcon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold" style={{color: BRAND_COLORS.black}}>
                          Pre Black Friday Sale
                        </h2>
                      </div>
                      <p style={{color: BRAND_COLORS.textGray}}>
                        It massive savings on electronics, appliances, and accessories! Hurry
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="px-4 py-2 rounded-full border-2" style={{
                        backgroundColor: BRAND_COLORS.lightGray,
                        color: BRAND_COLORS.black,
                        borderColor: BRAND_COLORS.mediumGray
                      }}>
                        <span className="font-bold">
                          <strong>{currentProducts.length}</strong> of <strong>{filteredProducts.length}</strong> items
                        </span>
                      </div>

                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSortDropdown(!showSortDropdown);
                          }}
                          className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg bg-white"
                          style={{borderColor: BRAND_COLORS.mediumGray}}
                        >
                          <Bars3BottomLeftIcon className="w-4 h-4" style={{color: BRAND_COLORS.red}} />
                          <span className="text-sm font-medium" style={{color: BRAND_COLORS.black}}>
                            {sortOptions.find(opt => opt.value === sortBy)?.label}
                          </span>
                          <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} style={{color: BRAND_COLORS.red}} />
                        </button>

                        {showSortDropdown && (
                          <div className="absolute top-full right-0 mt-2 w-48 bg-white border-2 rounded-lg shadow-lg z-50" style={{borderColor: BRAND_COLORS.mediumGray}}>
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
                                  sortBy === option.value ? 'font-medium' : ''
                                }`}
                                style={{
                                  backgroundColor: sortBy === option.value ? BRAND_COLORS.lightGray : 'transparent',
                                  color: sortBy === option.value ? BRAND_COLORS.red : BRAND_COLORS.textGray
                                }}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
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
                            ? 'opacity-60 cursor-not-allowed' 
                            : 'hover:shadow-2xl transform hover:-translate-y-3 cursor-pointer'
                        }`}
                        style={{
                          borderColor: BRAND_COLORS.mediumGray
                        }}
                        onClick={() => handleProductClick(product.productID, isUnavailable)}
                      >
                        {/* Badges */}
                        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                          {isAllBrands ? (
                            <span className="text-white text-xs px-2 py-1 rounded-full font-bold" style={{backgroundColor: BRAND_COLORS.darkGray}}>
                              OUT OF STOCK
                            </span>
                          ) : soldOut ? (
                            <span className="text-white text-xs px-2 py-1 rounded-full font-bold" style={{backgroundColor: BRAND_COLORS.darkGray}}>
                              SOLD OUT
                            </span>
                          ) : discount > 0 ? (
                            <span className="text-white text-xs font-black px-3 py-1 rounded-full animate-bounce border border-white"
                                  style={{background: `linear-gradient(135deg, ${BRAND_COLORS.red} 0%, ${BRAND_COLORS.darkRed} 100%)`}}>
                              -{discount}%
                            </span>
                          ) : (
                            <span className="text-white text-xs font-black px-3 py-1 rounded-full border animate-pulse"
                                  style={{backgroundColor: BRAND_COLORS.red, borderColor: BRAND_COLORS.yellow}}>
                              HOT DEAL
                            </span>
                          )}
                        </div>

                        {/* Special Effects Overlay */}
                        {!isUnavailable && (
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                               style={{background: `linear-gradient(135deg, ${BRAND_COLORS.red}10 0%, ${BRAND_COLORS.yellow}05 100%)`}}>
                          </div>
                        )}

                        {/* Image Container */}
                        <div className="relative overflow-hidden">
                          <div className={`h-40 md:h-48 w-full flex items-center justify-center ${
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

                          {/* Sale Overlay */}
                          {!isUnavailable && (
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                <div className="flex items-center gap-1 bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full">
                                  <BoltIcon className="text-xs w-4 h-4" style={{color: BRAND_COLORS.red}} />
                                  <span className="text-xs font-bold" style={{color: BRAND_COLORS.black}}>BLACK FRIDAY</span>
                                  <FireIcon className="text-xs w-4 h-4" style={{color: BRAND_COLORS.red}} />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-3 text-center">
                          <h3 className={`text-xs md:text-sm font-semibold line-clamp-2 mb-1 transition-colors ${
                            isUnavailable 
                              ? 'text-gray-500' 
                              : 'group-hover:text-opacity-80'
                          }`}
                          style={{color: isUnavailable ? BRAND_COLORS.mediumGray : BRAND_COLORS.black}}>
                            {product.productName}
                          </h3>
                          
                          {/* Price Section */}
                          <div className="space-y-2">
                            <div className="flex justify-center items-center gap-2">
                              <span className={`font-black text-sm md:text-lg ${
                                isUnavailable ? 'text-gray-500' : ''
                              }`}
                              style={{color: isUnavailable ? BRAND_COLORS.mediumGray : BRAND_COLORS.red}}>
                                {formatPrice(product.price)}
                              </span>
                              {product.oldPrice > 0 && (
                                <span className="text-xs line-through font-medium" style={{color: BRAND_COLORS.mediumGray}}>
                                  {formatPrice(product.oldPrice)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {!isUnavailable && (
                            <div className="space-y-2 mt-4">
                              <button
                                className="w-full text-white px-3 py-2 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                                style={{
                                  background: `linear-gradient(135deg, ${BRAND_COLORS.red} 0%, ${BRAND_COLORS.darkRed} 100%)`
                                }}
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
                              
                              <button
                                className="w-full text-white px-3 py-1.5 rounded-lg font-medium transition-all duration-300 text-sm shadow-md hover:shadow-lg"
                                style={{backgroundColor: BRAND_COLORS.black}}
                                onMouseEnter={(e) => e.target.style.backgroundColor = BRAND_COLORS.darkGray}
                                onMouseLeave={(e) => e.target.style.backgroundColor = BRAND_COLORS.black}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProductClick(product.productID, false);
                                }}
                              >
                                Quick View
                              </button>
                            </div>
                          )}

                          {/* Unavailable message */}
                          {isUnavailable && (
                            <div className="mt-4">
                              <div className="px-4 py-2 rounded-xl font-bold text-sm border" style={{
                                backgroundColor: BRAND_COLORS.lightGray,
                                color: BRAND_COLORS.mediumGray,
                                borderColor: BRAND_COLORS.mediumGray
                              }}>
                                {isAllBrands ? "Out of Stock" : "Sold Out"}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && !loading && (
                  <div className="flex justify-center">
                    <div>
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
              <div className="bg-white rounded-2xl shadow-lg border-2 p-8 mt-6 md:mt-24" style={{borderColor: BRAND_COLORS.mediumGray}}>
                <div className="flex flex-col justify-center items-center text-center space-y-6">
                  <div className="relative">
                    <img src={gif} alt="No products found" className="max-h-24 md:max-h-72 opacity-80" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-xl md:text-2xl font-bold" style={{color: BRAND_COLORS.red}}>
                      No Sale Items Found!
                    </h3>
                    <p className="max-w-md text-sm md:text-base" style={{color: BRAND_COLORS.textGray}}>
                      All the amazing Pre Black Friday deals might be sold out! 
                      Try adjusting your filters or check back soon for more incredible discounts.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={resetFilters}
                      className="px-6 py-3 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      style={{background: `linear-gradient(135deg, ${BRAND_COLORS.red} 0%, ${BRAND_COLORS.darkRed} 100%)`}}
                    >
                      Reset Filters
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className="px-6 py-3 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      style={{background: `linear-gradient(135deg, ${BRAND_COLORS.black} 0%, ${BRAND_COLORS.darkGray} 100%)`}}
                    >
                      Browse All Products
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

export default ClearanceSale;