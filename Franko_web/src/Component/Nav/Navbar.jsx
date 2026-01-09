import { useState, useEffect, useRef} from "react";
import {Navbar,Typography,IconButton,Drawer, List,ListItem,ListItemPrefix,Dialog,DialogHeader,DialogBody} from "@material-tailwind/react";
import {ShoppingBagIcon,UserCircleIcon,Bars3Icon,XMarkIcon,HomeIcon,DevicePhoneMobileIcon,Squares2X2Icon,ChevronRightIcon,TagIcon, RadioIcon,PhoneArrowDownLeftIcon,TruckIcon,MagnifyingGlassIcon} from "@heroicons/react/24/outline";
import { Heart, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import AnnouncementBar from "./AnnouncentBar";
import logo from "../../assets/frankoIcon.png"
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../../Redux/Slice/categorySlice';
import { fetchBrands } from '../../Redux/Slice/brandSlice';
import { fetchProducts } from '../../Redux/Slice/productSlice';
import { getCartById } from '../../Redux/Slice/cartSlice';
import AuthModal from "../AuthModal";
import { debounce } from 'lodash';

const Nav = () => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [isRadioOpen, setIsRadioOpen] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState("menu");
  const location = useLocation();
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const totalItems = useSelector((state) => state.cart.totalItems);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categories } = useSelector((state) => state.categories);
  const { brands } = useSelector((state) => state.brands);
  const { products = [], loading } = useSelector((state) => state.products);
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const currentCustomer = useSelector((state) => state.customer.currentCustomer);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const dropdownRef = useRef(null);

  const toggleDrawer = () => setOpenDrawer(!openDrawer);
  const toggleRadio = () => setIsRadioOpen(!isRadioOpen);
  const closeDrawerAndNavigate = (href) => {
    window.location.href = href;
    setOpenDrawer(false);
  };
  const isActive = (path) => location.pathname === path;

  const getWishlistCount = () => {
    try {
      const stored = localStorage.getItem("wishlist");
      if (!stored) return 0;
      const wishlist = typeof stored === "string" ? JSON.parse(stored) : stored;
      return Array.isArray(wishlist) ? wishlist.length : 0;
    } catch (error) {
      return 0;
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
 
  const handleWishlistClick = () => navigate('/wishlist');

  const handleMyOrdersClick = () => {
    if (currentCustomer && currentCustomer.accountType === 'agent') {
      navigate('/agent/dashboard');
    } else {
      navigate('/order-history');
    }
  };

  const closeDrawerAndNavigateToOrders = () => {
    setOpenDrawer(false);
    handleMyOrdersClick();
  };

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchBrands());
    if (products.length === 0) {
      dispatch(fetchProducts());
    }
  }, [dispatch, products.length]);

  useEffect(() => {
    try {
      const storedCustomer = localStorage.getItem("customer");
      const parsedCustomer = typeof storedCustomer === "string" ? JSON.parse(storedCustomer) : storedCustomer;
      if (parsedCustomer && parsedCustomer.customerAccountNumber) {
        const cartId = localStorage.getItem("cartId");
        if (cartId) dispatch(getCartById(cartId));
      }
    } catch (error) {}
  }, [dispatch]);

  useEffect(() => {
    setWishlistCount(getWishlistCount());
    const handleStorageChange = (e) => {
      if (e.key === 'wishlist') setWishlistCount(getWishlistCount());
    };
    const handleWishlistUpdate = () => setWishlistCount(getWishlistCount());
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    const interval = setInterval(() => {
      const currentCount = getWishlistCount();
      if (currentCount !== wishlistCount) setWishlistCount(currentCount);
    }, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
      clearInterval(interval);
    };
  }, [wishlistCount]);

  useEffect(() => {
    debounceRef.current = debounce((value) => setSearchQuery(value), 300);
    return () => debounceRef.current?.cancel();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        const isScrollbarClick = (
          event.target === document.documentElement ||
          event.target === document.body ||
          (event.target.tagName && event.target.tagName.toLowerCase() === 'html')
        );
        if (!isScrollbarClick) setShowSearchResults(false);
      }
    };
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

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    debounceRef.current(value);
  };

  const handleProductClick = (productID) => {
    setShowSearchResults(false);
    setInputValue('');
    setSearchQuery('');
    navigate(`/product/${productID}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) setShowSearchResults(true);
  };

  const backendBaseURL = 'https://fte002n1.salesmate.app';
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

  const filteredProducts = searchQuery
    ? products.filter((product) =>
        product.productName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];
  
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
    <div className="sticky top-0 z-50 bg-white">
      <AnnouncementBar />
      <Navbar className="mx-auto max-w-full px-2 py-1 rounded-none shadow-md bg-white">
        <div className="flex items-center justify-between text-blue-gray-900">
          {/* Mobile Header */}
          <div className="flex items-center gap-2 lg:hidden">
            <IconButton variant="text" onClick={toggleDrawer} className="p-1">
              <Bars3Icon className="h-5 w-5 text-gray-900" />
            </IconButton>
            <Typography as="a" href="/" className="text-xl font-bold tracking-wide text-green-600">
              <img src={logo} alt="Franko Trading" className="h-8 w-auto object-contain"/>
            </Typography>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center justify-between w-full gap-4">
            <Typography as="a" href="/" className="text-xl font-bold tracking-wide text-green-600">
              <img src={logo} alt="Franko Trading" className="h-10 w-auto object-contain" />
            </Typography>

            {/* Search Section */}
            <div className="flex-1 max-w-3xl">
              <div className="flex items-center gap-2">
                {/* Category Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-400 rounded-full hover:bg-red-500 transition"
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                    Categories
                  </button>

                  {showDropdown && (
                    <div className="absolute top-12 left-0 flex shadow-xl bg-white border rounded-lg z-50">
                      <div className="w-56 max-h-[400px] overflow-y-auto p-2 border-r bg-white rounded-l-lg">
                        {categories
                          .filter(cat => cat.stockStatus !== 'Products out of stock' && cat.categoryName !== 'Products out of stock')
                          .map((category) => (
                            <div
                              key={category.categoryId}
                              className={`flex items-center justify-between px-2 py-1.5 text-sm cursor-pointer hover:bg-red-400 rounded-lg transition ${hoveredCategory === category.categoryId ? 'bg-red-600 text-white' : ''}`}
                              onMouseEnter={() => setHoveredCategory(category.categoryId)}
                            >
                              <div className="flex items-center gap-2">
                                <TagIcon className={`h-4 w-4 ${hoveredCategory === category.categoryId ? 'text-white' : 'text-green-600'}`} />
                                <span>{category.categoryName}</span>
                              </div>
                              <ChevronRightIcon className="h-3 w-3" />
                            </div>
                          ))}
                      </div>

                      {hoveredCategory && (
                        <div className="w-56 max-h-[400px] overflow-y-auto p-2 bg-gray-50 rounded-r-lg">
                          {brands
                            .filter((brand) => brand.categoryId === hoveredCategory)
                            .map((brand) => (
                              <div
                                key={brand.brandId}
                                className="px-2 py-1.5 text-sm cursor-pointer hover:bg-green-100 rounded-md transition"
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

                {/* Search Input */}
                <div className="flex items-center flex-grow relative" ref={searchRef}>
                  <form onSubmit={handleSearchSubmit} className="flex items-center w-full bg-gray-100 border border-gray-300 rounded-full px-3 py-1 focus-within:ring-2 focus-within:ring-red-300 transition">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={handleSearchChange}
                      placeholder="Search for products..."
                      className="bg-transparent outline-none w-full text-sm placeholder-gray-500"
                    />
                    <button type="submit">
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-500 ml-2 cursor-pointer hover:text-red-600" />
                    </button>
                  </form>

                  {/* Search Results Dropdown */}
                  {showSearchResults && (
                    <div 
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      {loading ? (
                        <div className="p-3">
                          {Array.from({ length: 3 }, (_, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 animate-pulse">
                              <div className="w-10 h-10 bg-gray-200 rounded-md"></div>
                              <div className="flex-1">
                                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : inputValue.trim() === '' ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          Start typing to search for products
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          No products found for "{inputValue}"
                        </div>
                      ) : (
                        <>
                          <div className="p-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-600">
                            Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                          </div>
                          {filteredProducts.map((product) => {
                            const imageURL = getImageURL(product.productImage);
                            return (
                              <div
                                key={product.productID}
                                onClick={() => handleProductClick(product.productID)}
                                className="flex items-center gap-2 p-2 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                              >
                                {imageURL ? (
                                  <img src={imageURL} alt={product.productName} className="w-10 h-10 object-cover rounded-md" onError={(e) => e.target.style.display = 'none'} />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">No Image</span>
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h4 
                                    className="text-xs font-medium text-green-600 truncate"
                                    dangerouslySetInnerHTML={{__html: highlightText(product.productName || '')}}
                                  />
                                  <p className="text-xs text-red-600 font-semibold">
                                    {formatPrice(product.price)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Navigation Links */}
            <div className="flex items-center gap-3 text-sm">
              <a href="/" className={`hover:text-red-500 transition-colors ${isActive("/") && "text-red-500 font-semibold"}`}>Home</a>
              <a href="/about" className={`hover:text-red-500 transition-colors ${isActive("/about") && "text-red-500 font-semibold"}`}>About</a>
              {currentCustomer && (
                <button 
                  onClick={handleMyOrdersClick}
                  className={`hover:text-red-500 transition-colors ${
                    (currentCustomer.accountType === 'agent' && isActive("/agent/dashboard")) || 
                    (currentCustomer.accountType !== 'agent' && isActive("/order-history")) 
                      ? "text-red-500 font-semibold" 
                      : ""
                  }`}
                >
                  {currentCustomer.accountType === 'agent' ? 'Dashboard' : 'Orders'}
                </button>
              )}
              <a href="/shops" className={`hover:text-red-500 transition-colors ${isActive("/shops") && "text-red-500 font-semibold"}`}>Shops</a>
              <button onClick={toggleRadio} className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600 transition text-xs">
                🎧 Radio
              </button>
              
              {currentCustomer ? (
                <button
                  onClick={handleAccountClick}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold hover:from-red-600 hover:to-red-700 transition-all text-xs"
                  title={`${currentCustomer.firstName || ''} ${currentCustomer.lastName || ''}`.trim()}
                >
                  {currentCustomer.firstName?.[0]?.toUpperCase() || "U"}
                </button>
              ) : (
                <button 
                  onClick={handleAccountClick} 
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-md hover:from-green-600 hover:to-green-700 transition-all text-xs flex items-center gap-1"
                >
                  <User className="w-3 h-3" />
                  <span>Sign Up</span>
                </button>
              )}

              <div 
                onClick={handleWishlistClick} 
                className="relative cursor-pointer p-1.5 rounded-full hover:bg-pink-50 transition-all group"
                title="Wishlist"
              >
                <Heart className="h-5 w-5 text-pink-500 hover:text-pink-600 group-hover:scale-110 transition-all" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white text-xs px-1 py-0.5 rounded-full font-semibold">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </div>

              <div 
                onClick={() => navigate(`/cart/${localStorage.getItem('cartId')}`)} 
                className="relative cursor-pointer p-1.5 rounded-full hover:bg-green-50 transition-all group"
                title="Shopping Cart"
              >
                <ShoppingBagIcon className="h-5 w-5 text-gray-700 hover:text-green-600 group-hover:scale-110 transition-all" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-1 py-0.5 rounded-full font-semibold">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Icons */}
          <div className="lg:hidden flex items-center gap-2">
            <div 
              onClick={handleWishlistClick} 
              className="relative cursor-pointer p-1"
              title="Wishlist"
            >
              <Heart className="h-4 w-4 text-pink-500" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs px-1 rounded-full font-semibold">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </div>

            <div 
              onClick={() => navigate(`/cart/${localStorage.getItem('cartId')}`)} 
              className="relative cursor-pointer p-1"
              title="Shopping Cart"
            >
              <ShoppingBagIcon className="h-4 w-4 text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full font-semibold">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        <div className="w-full lg:hidden mt-2 relative" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="flex items-center rounded-full px-3 py-1.5 shadow-md border border-gray-300">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={inputValue}
              onChange={handleSearchChange}
              placeholder="Search products..."
              className="ml-2 bg-white text-gray-800 text-sm w-full focus:outline-none placeholder-gray-400"
            />
          </form>

          {/* Mobile Search Results */}
          {showSearchResults && (
            <div 
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {loading ? (
                <div className="p-3">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : inputValue.trim() === '' ? (
                <div className="p-3 text-center text-gray-500 text-xs">
                  Start typing to search
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-3 text-center text-gray-500 text-xs">
                  No products found
                </div>
              ) : (
                <>
                  <div className="p-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-600">
                    {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                  </div>
                  {filteredProducts.map((product) => {
                    const imageURL = getImageURL(product.productImage);
                    return (
                      <div
                        key={product.productID}
                        onClick={() => handleProductClick(product.productID)}
                        className="flex items-center gap-2 p-2 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        {imageURL ? (
                          <img src={imageURL} alt={product.productName} className="w-8 h-8 object-cover rounded-md" onError={(e) => e.target.style.display = 'none'} />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 
                            className="text-xs font-medium text-green-600 truncate"
                            dangerouslySetInnerHTML={{__html: highlightText(product.productName || '')}}
                          />
                          <p className="text-xs text-red-600 font-semibold">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {showAuthModal && (
          <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
        )}
      </Navbar>

      {/* Mobile Sidebar Drawer */}
      <Drawer open={openDrawer} onClose={toggleDrawer} className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <IconButton variant="text" onClick={toggleDrawer} className="p-1">
            <XMarkIcon className="h-5 w-5 text-gray-900" />
          </IconButton>
        </div>

        <div className="flex justify-between mb-3">
          <button
            onClick={() => setActiveSidebar("categories")}
            className={`w-1/2 py-1.5 text-sm font-semibold border-b-2 transition-colors ${
              activeSidebar === "categories" 
                ? "border-green-500 text-green-600" 
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveSidebar("menu")}
            className={`w-1/2 py-1.5 text-sm font-semibold border-b-2 transition-colors ${
              activeSidebar === "menu" 
                ? "border-green-500 text-green-600" 
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            Main Menu
          </button>
        </div>

        <div className="h-full overflow-hidden">
          {activeSidebar === "menu" ? (
            <List>
              {currentCustomer ? (
                <div className="flex items-center gap-2 px-2 py-1.5 mb-2 rounded-lg bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
                  <div className="w-7 h-7 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {currentCustomer.firstName?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-green-700 text-xs">
                      {currentCustomer.firstName || ''} {currentCustomer.lastName || ''}
                    </div>
                    <div className="text-xs text-green-600 capitalize">
                      {currentCustomer.accountType || 'Customer'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-2 py-1.5 mb-2 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                  <div className="text-xs font-medium text-blue-700 mb-1.5">Welcome!</div>
                  <button 
                    onClick={() => {
                      setOpenDrawer(false);
                      setShowAuthModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-1.5 px-3 rounded-md text-xs font-medium hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-1.5"
                  >
                    <User className="w-3 h-3" />
                    Sign Up / Login
                  </button>
                </div>
              )}

              <ListItem onClick={() => closeDrawerAndNavigate("/")} className={`py-2 ${isActive("/") ? "text-green-500 bg-green-50" : ""}`}>
                <ListItemPrefix><HomeIcon className="h-4 w-4" /></ListItemPrefix>
                <span className="text-sm">Home</span>
              </ListItem>

              <ListItem onClick={() => closeDrawerAndNavigate("/about")} className={`py-2 ${isActive("/about") ? "text-green-500 bg-green-50" : ""}`}>
                <ListItemPrefix><DevicePhoneMobileIcon className="h-4 w-4" /></ListItemPrefix>
                <span className="text-sm">About Us</span>
              </ListItem>

              {currentCustomer && (
                <ListItem onClick={closeDrawerAndNavigateToOrders} className={`py-2 ${
                  (currentCustomer.accountType === 'agent' && isActive("/agent/dashboard")) || 
                  (currentCustomer.accountType !== 'agent' && isActive("/order-history")) 
                    ? "text-green-500 bg-green-50" 
                    : ""
                }`}>
                  <ListItemPrefix><TruckIcon className="h-4 w-4" /></ListItemPrefix>
                  <span className="text-sm">{currentCustomer.accountType === 'agent' ? 'Dashboard' : 'My Orders'}</span>
                </ListItem>
              )}

              <ListItem onClick={() => closeDrawerAndNavigate("/shops")} className={`py-2 ${isActive("/shops") ? "text-green-500 bg-green-50" : ""}`}>
                <ListItemPrefix><Squares2X2Icon className="h-4 w-4" /></ListItemPrefix>
                <span className="text-sm">Shops</span>
              </ListItem>

              <ListItem onClick={() => closeDrawerAndNavigate("/contact")} className={`py-2 ${isActive("/contact") ? "text-green-500 bg-green-50" : ""}`}>
                <ListItemPrefix><PhoneArrowDownLeftIcon className="h-4 w-4" /></ListItemPrefix>
                <span className="text-sm">Contact</span>
              </ListItem>

              {currentCustomer && (
                <ListItem onClick={() => closeDrawerAndNavigate("/account")} className={`py-2 ${isActive("/account") ? "text-green-500 bg-green-50" : ""}`}>
                  <ListItemPrefix><UserCircleIcon className="h-4 w-4" /></ListItemPrefix>
                  <span className="text-sm">My Account</span>
                </ListItem>
              )}

              <ListItem onClick={() => closeDrawerAndNavigate("/wishlist")} className={`py-2 ${isActive("/wishlist") ? "text-green-500 bg-green-50" : ""}`}>
                <ListItemPrefix><Heart className="h-4 w-4" /></ListItemPrefix>
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm">Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="bg-pink-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  )}
                </div>
              </ListItem>

              <ListItem onClick={() => closeDrawerAndNavigate(`/cart/${localStorage.getItem('cartId')}`)} className={`py-2 ${location.pathname.includes('/cart') ? "text-green-500 bg-green-50" : ""}`}>
                <ListItemPrefix><ShoppingBagIcon className="h-4 w-4" /></ListItemPrefix>
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm">Shopping Cart</span>
                  {totalItems > 0 && (
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </div>
              </ListItem>

              <ListItem onClick={toggleRadio} className="py-2 text-red-500 hover:bg-red-50">
                <ListItemPrefix><RadioIcon className="h-4 w-4" /></ListItemPrefix>
                <span className="text-sm">🎧 Radio</span>
              </ListItem>
            </List>
          ) : (
            <div className="h-full overflow-y-auto">
              <List>
                {categories
                  .filter(cat => 
                    cat.stockStatus !== 'Products out of stock' && 
                    cat.categoryName !== 'Products out of stock'
                  )
                  .map((category) => (
                    <div key={category.categoryId}>
                      <ListItem
                        onClick={() => setSelectedBrandId(selectedBrandId === category.categoryId ? null : category.categoryId)}
                        className="py-2 hover:bg-green-50"
                      >
                        <ListItemPrefix><TagIcon className="h-4 w-4 text-green-600" /></ListItemPrefix>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-sm">{category.categoryName}</span>
                          <ChevronRightIcon 
                            className={`h-3 w-3 transition-transform ${
                              selectedBrandId === category.categoryId ? 'rotate-90' : ''
                            }`} 
                          />
                        </div>
                      </ListItem>
                      
                      {selectedBrandId === category.categoryId && (
                        <div className="ml-3 border-l-2 border-green-100">
                          {brands
                            .filter((brand) => brand.categoryId === category.categoryId)
                            .map((brand) => (
                              <ListItem
                                key={brand.brandId}
                                onClick={() => {
                                  navigate(`/brand/${brand.brandId}`);
                                  setOpenDrawer(false);
                                }}
                                className="pl-4 py-1.5 hover:bg-green-50 text-xs"
                              >
                                <span className="text-gray-600">{brand.brandName}</span>
                              </ListItem>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
              </List>
            </div>
          )}
        </div>
      </Drawer>

      <Dialog open={isRadioOpen} handler={toggleRadio} size="sm">
        <DialogHeader className="flex justify-between items-center text-base py-3">
          Franko Radio Live 🎙️
          <IconButton variant="text" onClick={toggleRadio} className="p-1">
            <XMarkIcon className="h-4 w-4" />
          </IconButton>
        </DialogHeader>
        <DialogBody className="py-3">
          <div className="flex flex-col items-center gap-3">
            <audio controls autoPlay className="w-full rounded-md shadow">
              <source src="https://s48.myradiostream.com/:13420/listen.mp3" type="audio/mpeg" />
            </audio>
            <p className="text-xs text-center text-gray-600">
              Streaming live now!!!!!
            </p>
          </div>
        </DialogBody>
      </Dialog>
    </div>
  );
};

export default Nav;