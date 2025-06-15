import { useState, useEffect, useRef} from "react";
import {Navbar,Typography,IconButton,Drawer, List,ListItem,ListItemPrefix,Dialog,DialogHeader,DialogBody} from "@material-tailwind/react";
import {ShoppingBagIcon,UserCircleIcon,Bars3Icon,XMarkIcon,HomeIcon,DevicePhoneMobileIcon,Squares2X2Icon,ChevronRightIcon,TagIcon, RadioIcon,PhoneArrowDownLeftIcon,TruckIcon,MagnifyingGlassIcon} from "@heroicons/react/24/outline";
import { Heart, CheckIcon } from "lucide-react"; // Import Lucide React icons
import { useLocation, useNavigate } from "react-router-dom";
import AnnouncementBar from "./AnnouncentBar";
import logo from "../../assets/frankoIcon.png"
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../../Redux/Slice/categorySlice';
import { fetchBrands } from '../../Redux/Slice/brandSlice';
import { fetchProducts } from '../../Redux/Slice/productSlice'; // Import the products slice
import { getCartById } from '../../Redux/Slice/cartSlice';
import AuthModal from "../AuthModal";
import { debounce } from 'lodash';

const Nav = () => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [isRadioOpen, setIsRadioOpen] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState("menu"); // "menu" or "categories"
  const location = useLocation();

  // Search states - similar to SearchModal
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Wishlist state
  const [wishlistCount, setWishlistCount] = useState(0);

  const totalItems = useSelector((state) => state.cart.totalItems);
  const toggleDrawer = () => setOpenDrawer(!openDrawer);
  const toggleRadio = () => setIsRadioOpen(!isRadioOpen);
  const closeDrawerAndNavigate = (href) => {
    window.location.href = href;
    setOpenDrawer(false);
  };
  const isActive = (path) => location.pathname === path;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categories } = useSelector((state) => state.categories);
  const { brands } = useSelector((state) => state.brands);
  const { products = [], loading } = useSelector((state) => state.products); // Get products with loading state

  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const currentCustomer = useSelector((state) => state.customer.currentCustomer);

  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const dropdownRef = useRef(null);

  // Function to get wishlist count from localStorage
  const getWishlistCount = () => {
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      return Array.isArray(wishlist) ? wishlist.length : 0;
    } catch (error) {
      console.error('Error parsing wishlist from localStorage:', error);
      return 0;
    }
  };

  // Function to handle wishlist navigation
  const handleWishlistClick = () => {
    navigate('/wishlist');
  };

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchBrands());
    if (products.length === 0) {
      dispatch(fetchProducts()); // Only fetch if no products exist
    }
  }, [dispatch, products.length]);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      const cartId = localStorage.getItem('cartId');
      if (cartId) {
        dispatch(getCartById(cartId));
      }
    }
  }, [dispatch]);

  // Update wishlist count on component mount and when localStorage changes
  useEffect(() => {
    setWishlistCount(getWishlistCount());

    // Listen for storage changes (when wishlist is updated in other tabs/components)
    const handleStorageChange = (e) => {
      if (e.key === 'wishlist') {
        setWishlistCount(getWishlistCount());
      }
    };

    // Listen for custom wishlist update events
    const handleWishlistUpdate = () => {
      setWishlistCount(getWishlistCount());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);

    // Check for wishlist updates periodically (in case of same-tab updates)
    const interval = setInterval(() => {
      const currentCount = getWishlistCount();
      if (currentCount !== wishlistCount) {
        setWishlistCount(currentCount);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
      clearInterval(interval);
    };
  }, [wishlistCount]);

  // Debounce logic setup - similar to SearchModal
  useEffect(() => {
    debounceRef.current = debounce((value) => setSearchQuery(value), 300);
    return () => debounceRef.current?.cancel();
  }, []);

  // Search functionality with debouncing
  useEffect(() => {
    if (searchQuery.trim()) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  // Fixed handleClickOutside to properly handle scrollbar clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        // Check if the click is on a scrollbar by examining the target
        const isScrollbarClick = (
          event.target === document.documentElement ||
          event.target === document.body ||
          (event.target.tagName && event.target.tagName.toLowerCase() === 'html')
        );
        
        // Don't close if it's a scrollbar click
        if (!isScrollbarClick) {
          setShowSearchResults(false);
        }
      }
    };
    
    // Use mousedown instead of click for better detection
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleAccountClick = () => {
    if (!currentCustomer) {
      setShowAuthModal(true);
    } else {
      navigate("/account");
    }
  }

  // Search handlers - similar to SearchModal
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    debounceRef.current(value);
  };

  // Enhanced product click handler with proper navigation
  const handleProductClick = (productID) => {
    // Clear search results and input
    setShowSearchResults(false);
    setInputValue('');
    setSearchQuery('');
    
    // Navigate to product page
    navigate(`/product/${productID}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Removed navigation to search page - now just keeps showing results
    if (inputValue.trim()) {
      setShowSearchResults(true);
    }
  };

  // Utility functions from SearchModal
  const backendBaseURL = 'https://smfteapi.salesmate.app';
  
  const formatPrice = (price) => `₵${price?.toLocaleString?.() || 'N/A'}`;

  const highlightText = (text = '') => {
    if (!searchQuery) return text;
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.replace(regex, '<span style="background-color: yellow; font-weight: bold;">$1</span>');
  };

  const getImageURL = (productImage) => {
    if (!productImage) return null;
    const imagePath = productImage.split('\\').pop();
    return `${backendBaseURL}/Media/Products_Images/${imagePath}`;
  };

  // Filter products based on search query - REMOVED LIMIT to show all results
  const filteredProducts = searchQuery
    ? products.filter((product) =>
        product.productName?.toLowerCase().includes(searchQuery.toLowerCase())
      ) // Removed .slice(0, 8) to show all results
    : [];
  
  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setHoveredCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className ="sticky top-0 z-50 bg-white">
     <AnnouncementBar />

      {/* Top Navbar */}
      <Navbar className="mx-auto max-w-full px-4 py-1 rounded-none shadow-md bg-white s">
     
        <div className="flex items-center justify-between text-blue-gray-900">
          <div className="flex items-center gap-2 lg:hidden">
            <IconButton variant="text" onClick={toggleDrawer}>
              <Bars3Icon className="h-6 w-6 text-gray-900" />
            </IconButton>
            <Typography
              as="a"
              href="/"
              className="text-xl font-bold tracking-wide text-green-600"
            >
              <img src={logo} alt="Franko Trading" className="h-12 md:h-12 w-auto object-contain my-2"/>
            </Typography>
          </div>
          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center justify-between w-full">
  <Typography as="a" href="/" className="text-xl font-bold tracking-wide text-green-600">
    <img src={logo} alt="Franko Trading" className="h-12 md:h-12 w-auto object-contain my-2" />
  </Typography>

  {/* Full-width Search */}
  <div className="flex-1 mx-12">
  <div className="flex items-center gap-2 px-3 py-2 w-full">
        
        {/* Category Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-400 rounded-full transition duration-200"
          >
            <Squares2X2Icon className="h-5 w-5" />
            All Categories
          </button>

          {showDropdown && (
            <div className="absolute top-14 left-0 flex shadow-xl bg-white border rounded-lg z-50 animate-fade-in">
              
              {/* Category List */}
              <div className="w-64 max-h-[500px] overflow-y-auto p-2 border-r bg-white rounded-l-lg">
                {categories
                  .filter(cat =>
                    cat.stockStatus !== 'Products out of stock' &&
                    cat.categoryName !== 'Products out of stock'
                  )
                  .map((category) => (
                    <div
                      key={category.categoryId}
                      className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-red-400 rounded-lg transition ${
                        hoveredCategory === category.categoryId ? 'bg-red-600 text-white' : ''
                      }`}
                      onMouseEnter={() => setHoveredCategory(category.categoryId)}
                    >
                      <div className="flex items-center gap-2">
                        <TagIcon className={`h-4 w-4 ${hoveredCategory === category.categoryId ? 'text-white' : 'text-green-600'}`} />
                        <span>{category.categoryName}</span>
                      </div>
                      <ChevronRightIcon className="h-4 w-4" />
                    </div>
                  ))}
              </div>

              {/* Brand Flyout */}
              {hoveredCategory && (
                <div className="w-64 max-h-[500px] overflow-y-auto p-2 bg-gray-50 rounded-r-lg">
                  {brands
                    .filter((brand) => brand.categoryId === hoveredCategory)
                    .map((brand) => (
                      <div
                        key={brand.brandId}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-green-100 rounded-md transition"
                        onClick={() => {
                          navigate(`/brand/${brand.brandId}`);
                          setShowDropdown(false);
                          setHoveredCategory(null);
                        }}
                      >
                        {brand.brandName}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Input with Results */}
        <div className="flex items-center flex-grow ml-2 relative" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="flex items-center w-full bg-gray-100 border border-gray-300 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-green-500 transition">
            <input
              type="text"
              value={inputValue}
              onChange={handleSearchChange}
              placeholder="Search for products..."
              className="bg-transparent outline-none w-full text-sm placeholder-gray-500"
            />
            <button type="submit">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 ml-2 cursor-pointer hover:text-green-600" />
            </button>
          </form>

          {/* Search Results Dropdown - Enhanced to show all results */}
          {showSearchResults && (
            <div 
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
              onMouseDown={(e) => {
                // Prevent the search results from closing when clicking inside
                e.stopPropagation();
              }}
            >
              {loading ? (
                // Loading skeleton
                <div className="p-4">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                      <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : inputValue.trim() === '' ? (
                <div className="p-4 text-center text-gray-500">
                  Start typing to search for products
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No products found for "{inputValue}"
                </div>
              ) : (
                <>
                  {/* Display count of results */}
                  <div className="p-3 bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
                    Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} for "{inputValue}"
                  </div>
                  
                  {filteredProducts.map((product) => {
                    const imageURL = getImageURL(product.productImage);
                    return (
                      <div
                        key={product.productID}
                        onClick={() => handleProductClick(product.productID)}
                        className="flex items-center gap-3 p-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        {imageURL ? (
                          <img
                            src={imageURL}
                            alt={product.productName}
                            className="w-12 h-12 object-cover rounded-md"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 
                            className="text-sm font-medium text-green-600 truncate"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(product.productName || '')
                            }}
                          />
                          <p className="text-sm text-red-600 font-semibold">
                            Price: {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {/* Removed "View all results" section */}
                </>
              )}
            </div>
          )}
        </div>

      </div>
  </div>

  {/* Right side links */}
  <div className="flex items-center gap-4">
    <a href="/" className={`hover:text-red-500 transition-colors ${isActive("/") && "text-red-500 font-semibold"}`}>Home</a>
    <a href="/about" className={`hover:text-red-500 transition-colors ${isActive("/about") && "text-red-500 font-semibold"}`}>About Us</a>
    <a href="/shops" className={`hover:text-red-500 transition-colors ${isActive("/shops") && "text-red-500 font-semibold"}`}>Shops</a>
    <button onClick={toggleRadio} className="bg-red-500 text-white px-3 py-1.5 rounded-full hover:bg-red-600 transition-all duration-200 transform hover:scale-105 shadow-md">
      🎧 Radio
    </button>
    
    {/* Enhanced Account Button */}
    {(() => {
      if (currentCustomer) {
        const initial = currentCustomer.firstName?.[0]?.toUpperCase() || "U";
        return (
          <button
            onClick={handleAccountClick}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full h-9 w-9 flex items-center justify-center font-bold hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-md"
            title={`${currentCustomer.firstName || ''} ${currentCustomer.lastName || ''}`.trim()}
          >
            {initial}
          </button>
        );
      } else {
        return (
          <button onClick={handleAccountClick} className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200">
            <UserCircleIcon className="h-6 w-6 text-gray-700 hover:text-green-600" />
          </button>
        );
      }
    })()}

    {/* Enhanced Wishlist Icon */}
    <div 
      onClick={handleWishlistClick} 
      className="relative cursor-pointer p-2 rounded-full hover:bg-pink-50 transition-all duration-200 group"
      title="Wishlist"
    >
      <Heart className="h-6 w-6 text-pink-500 hover:text-pink-600 group-hover:scale-110 transition-all duration-200" />
      {wishlistCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold shadow-md animate-pulse">
          {wishlistCount > 99 ? '99+' : wishlistCount}
        </span>
      )}
    </div>

    {/* Enhanced Cart Icon */}
    <div 
      onClick={() => navigate(`/cart/${localStorage.getItem('cartId')}`)} 
      className="relative cursor-pointer p-2 rounded-full hover:bg-green-50 transition-all duration-200 group"
      title="Shopping Cart"
    >
      <ShoppingBagIcon className="h-6 w-6 text-gray-700 hover:text-green-600 group-hover:scale-110 transition-all duration-200" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold shadow-md animate-pulse">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </div>

  </div>
</div>

          {/* Mobile Icons Section */}
          <div className="lg:hidden flex items-center gap-3">
            {/* Mobile Wishlist Icon */}
            <div 
              onClick={handleWishlistClick} 
              className="relative cursor-pointer p-1.5 rounded-full hover:bg-pink-50 transition-all duration-200"
              title="Wishlist"
            >
              <Heart className="h-5 w-5 text-pink-500" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs px-1 py-0.5 rounded-full font-semibold">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </div>

            {/* Mobile Cart Icon */}
            <div 
              onClick={() => navigate(`/cart/${localStorage.getItem('cartId')}`)} 
              className="relative cursor-pointer p-1.5 rounded-full hover:bg-green-50 transition-all duration-200"
              title="Shopping Cart"
            >
              <ShoppingBagIcon className="h-5 w-5 text-gray-700 hover:text-green-600" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full font-semibold">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        <div className="w-full lg:hidden relative" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="flex items-center rounded-full px-4 py-2 shadow-md border border-gray-300">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
            <input
              type="text"
              value={inputValue}
              onChange={handleSearchChange}
              placeholder="Search products, brands and categories"
              className="ml-3 bg-white text-gray-800 text-sm w-full focus:outline-none placeholder-gray-400"
            />
          </form>

          {/* Mobile Search Results - Enhanced to show all results */}
          {showSearchResults && (
            <div 
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
              onMouseDown={(e) => {
                // Prevent the search results from closing when clicking inside
                e.stopPropagation();
              }}
            >
              {loading ? (
                <div className="p-4">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-md"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : inputValue.trim() === '' ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Start typing to search for products
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No products found for "{inputValue}"
                </div>
              ) : (
                <>
                  {/* Display count of results for mobile */}
                  <div className="p-3 bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
                    Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                  </div>
                  
                  {filteredProducts.map((product) => {
                    const imageURL = getImageURL(product.productImage);
                    return (
                      <div
                        key={product.productID}
                        onClick={() => handleProductClick(product.productID)}
                        className="flex items-center gap-3 p-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        {imageURL ? (
                          <img
                            src={imageURL}
                            alt={product.productName}
                            className="w-10 h-10 object-cover rounded-md"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 
                            className="text-sm font-medium text-green-600 truncate"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(product.productName || '')
                            }}
                          />
                          <p className="text-sm text-red-600 font-semibold">
                            Price: {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {/* Removed "View all results" section for mobile */}
                </>
              )}
            </div>
          )}
        </div>

        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
        )}
      </Navbar>

      {/* Mobile Sidebar Drawer */}
<Drawer open={openDrawer} onClose={toggleDrawer} className="p-4">
  <div className="mb-4 flex items-center justify-between">
    <IconButton variant="text" onClick={toggleDrawer}>
      <XMarkIcon className="h-6 w-6 text-gray-900" />
    </IconButton>
  </div>

  {/* Toggle Tabs */}
  <div className="flex justify-between mb-4">
    <button
      onClick={() => setActiveSidebar("categories")}
      className={`w-1/2 py-2 font-semibold border-b-2 transition-colors ${
        activeSidebar === "categories" 
          ? "border-green-500 text-green-600" 
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      Categories
    </button>
    <button
      onClick={() => setActiveSidebar("menu")}
      className={`w-1/2 py-2 font-semibold border-b-2 transition-colors ${
        activeSidebar === "menu" 
          ? "border-green-500 text-green-600" 
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      Main Menu
    </button>
  </div>

  {/* Sidebar Content */}
  <div className="h-full overflow-hidden">
    {activeSidebar === "menu" ? (
      <List>
        {(() => {
          const customer = localStorage.getItem("customer");
          if (customer) {
            const parsed = JSON.parse(customer);
            const firstName = parsed?.firstName || "User";

            return (
              <div className="flex items-center gap-3 px-3 py-2 mb-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {firstName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-gray-800 font-medium">
                  Welcome, {firstName}
                </span>
              </div>
            );
          } else {
            return (
              <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <button
                  onClick={handleAccountClick}
                  className="flex items-center gap-3 w-full text-left hover:text-green-600 transition-colors"
                >
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  <span className="text-gray-700 font-medium">Sign In</span>
                </button>
              </div>
            );
          }
        })()}

        <ListItem onClick={() => closeDrawerAndNavigate("/")}>
          <ListItemPrefix><HomeIcon className="h-5 w-5" /></ListItemPrefix>Home
        </ListItem>
        <ListItem onClick={() => closeDrawerAndNavigate("/about")}>
          <ListItemPrefix><DevicePhoneMobileIcon className="h-5 w-5" /></ListItemPrefix>About Us
        </ListItem>
        <ListItem onClick={() => closeDrawerAndNavigate("/track")}>
          <ListItemPrefix><TruckIcon className="h-5 w-5" /></ListItemPrefix>Track Order
        </ListItem>
        <ListItem onClick={toggleRadio}>
          <ListItemPrefix><RadioIcon className="h-5 w-5 text-green-600" /></ListItemPrefix>
          <span className="text-green-600 font-medium">🎧 Franko Radio</span>
        </ListItem>
        <ListItem onClick={() => closeDrawerAndNavigate("/contact")}>
          <ListItemPrefix><PhoneArrowDownLeftIcon className="h-5 w-5" /></ListItemPrefix>Support
        </ListItem>
      </List>
    ) : (
      <div className="h-full flex flex-col">


        {/* Categories List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <List className="space-y-2">
            {categories
              .filter((cat) => 
                cat.stockStatus !== "Products out of stock" &&
                cat.categoryName !== "Products out of stock"
              )
              .map((category) => {
                const categoryBrands = brands.filter(
                  (brand) => brand.categoryId === category.categoryId
                );
                const isExpanded = hoveredCategory === category.categoryId;
                const hasMatchingBrands = categoryBrands.length > 0;

                return (
                  <div key={category.categoryId} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
                    {/* Category Header */}
                    <div 
                      className="flex justify-between items-center p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (hasMatchingBrands) {
                          // Only allow toggling when clicking the header area directly
                          if (isExpanded) {
                            setHoveredCategory(null);
                          } else {
                            setHoveredCategory(category.categoryId);
                          }
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 text-left w-full pointer-events-none">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <TagIcon className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-gray-800 block">
                            {category.categoryName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {categoryBrands.length} brand{categoryBrands.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {hasMatchingBrands && (
                        <div className="pointer-events-none">
                          <ChevronRightIcon
                            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </div>
                      )}
                    </div>

                    {/* Brands List */}
                    <div
                      className={`transition-all duration-300 ease-in-out ${
                        isExpanded ? "max-h-64" : "max-h-0"
                      } overflow-hidden`}
                    >
                      {hasMatchingBrands && (
                        <div 
                          className="border-t border-gray-100 bg-gray-50"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div 
                            className="p-2 space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300"
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            onScroll={(e) => e.stopPropagation()}
                          >
                            {categoryBrands.map((brand) => (
                              <button
                                key={brand.brandId}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedBrandId(brand.brandId);
                                  closeDrawerAndNavigate(`/brand/${brand.brandId}`);
                                  // Don't close the category here - let it stay open
                                }}
                                className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-all ${
                                  selectedBrandId === brand.brandId
                                    ? "bg-green-100 text-green-700 border border-green-200"
                                    : "hover:bg-white hover:shadow-sm text-gray-700"
                                }`}
                              >
                                <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center shadow-sm">
                                  <span className="text-xs font-medium text-gray-600">
                                    {brand.brandName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="font-medium text-sm">
                                  {brand.brandName}
                                </span>
                                {selectedBrandId === brand.brandId && (
                                  <CheckIcon className="h-4 w-4 text-green-600 ml-auto" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </List>
        </div>
      </div>
    )}
  </div>
</Drawer>
 
            {/* Radio Dialog */}
            <Dialog open={isRadioOpen} handler={toggleRadio} size="sm">
        <DialogHeader className="flex justify-between items-center">
          Franko Radio Live 🎙️
          <IconButton variant="text" onClick={toggleRadio}>
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col items-center gap-4">
            <audio controls autoPlay className="w-full rounded-md shadow">
              <source src="https://s48.myradiostream.com/:13420/listen.mp3" type="audio/mpeg" />
            </audio>
            <p className="text-sm text-center text-gray-600">
              Streaming live now!!!!!
            </p>
          </div>
        </DialogBody>
      </Dialog>
    </div>
  );
};

export default Nav;

