import React, { useState, useEffect, useRef} from "react";
import {Navbar,Typography,IconButton,Drawer, List,ListItem,ListItemPrefix,Dialog,DialogHeader,DialogBody} from "@material-tailwind/react";
import {ShoppingBagIcon,UserCircleIcon,Bars3Icon,XMarkIcon,HomeIcon,DevicePhoneMobileIcon,Squares2X2Icon, // for AppstoreOutlined
    ChevronRightIcon, // for CaretRightOutlined
    TagIcon, RadioIcon,PhoneArrowDownLeftIcon,TruckIcon,MagnifyingGlassIcon, BuildingStorefrontIcon} from "@heroicons/react/24/outline";
import { useLocation, useNavigate } from "react-router-dom";
import AnnouncementBar from "./AnnouncentBar";
import logo from "../../assets/frankoIcon.png"
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../../Redux/Slice/categorySlice';
import { fetchBrands } from '../../Redux/Slice/brandSlice';
import { getCartById } from '../../Redux/Slice/cartSlice';
import AuthModal from "../AuthModal";

const Nav = () => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [isRadioOpen, setIsRadioOpen] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState("menu"); // "menu" or "categories"
  const location = useLocation();

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

  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const currentCustomer = useSelector((state) => state.customer.currentCustomer);

  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchBrands());
  }, [dispatch]);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      const cartId = localStorage.getItem('cartId');
      if (cartId) {
        dispatch(getCartById(cartId));
      }
    }
  }, [dispatch]);
  
  const handleAccountClick = () => {
    if (!currentCustomer) {
      setShowAuthModal(true);
    } else {
      navigate("/account");
    }
  }
  
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
      <Navbar className="mx-auto max-w-full px-4 py-2 rounded-none shadow-md bg-white s">
     
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
            {/* Search bar for large screens */}
          

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center justify-between w-full">
  <Typography as="a" href="/" className="text-xl font-bold tracking-wide text-green-600">
    <img src={logo} alt="Franko Trading" className="h-12 md:h-12 w-auto object-contain my-2" />
  </Typography>

  {/* Full-width Search */}
  <div className="flex-1 mx-8">
  <div className="flex items-center gap-2 px-3 py-2 w-full">
        
        {/* Category Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-400 rounded-full hover:bg-green-700 transition duration-200"
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
                      className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-green-300 rounded-lg transition ${
                        hoveredCategory === category.categoryId ? 'bg-green-600 text-white' : ''
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

        {/* Input Field */}
        <div className="flex items-center flex-grow bg-gray-100 border border-gray-300 rounded-full px-4 py-1.5 ml-2 focus-within:ring-2 focus-within:ring-green-500 transition">
  <input
    type="text"
    placeholder="Search for products..."
    className="bg-transparent outline-none w-full text-sm placeholder-gray-500"
  />
  <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 ml-2" />
</div>

      </div>
  </div>

  {/* Right side links */}
  <div className="flex items-center gap-4">
    <a href="/" className={`hover:text-green-600 ${isActive("/") && "text-green-600 font-semibold"}`}>Home</a>
    <a href="/about" className={`hover:text-green-600 ${isActive("/about") && "text-green-600 font-semibold"}`}>About Us</a>
    <a href="/track" className={`hover:text-green-600 ${isActive("/track") && "text-green-600 font-semibold"}`}>Track Order</a>
    <button onClick={toggleRadio} className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition">🎧 Radio</button>
    {(() => {


if (currentCustomer) {
  const initial = currentCustomer.firstName?.[0]?.toUpperCase() || "U";

  return (
    <button
      onClick={handleAccountClick}
      className="bg-green-500 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold hover:bg-green-600 transition"
      title={`${currentCustomer.firstName || ''} ${currentCustomer.lastName || ''}`.trim()}
    >
      {initial}
    </button>
  );

  } else {
    return (
      <button onClick={handleAccountClick}>
        <UserCircleIcon className="h-6 w-6 text-gray-700 hover:text-green-600" />
      </button>
    );
  }
})()}

{showAuthModal && (
  <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
)}

    <div onClick={() => navigate(`/cart/${localStorage.getItem('cartId')}`)} className="relative cursor-pointer">
  <ShoppingBagIcon className="h-6 w-6 text-gray-700 hover:text-green-600" />
  {totalItems > 0 && (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
      {totalItems}
    </span>
  )}
</div>

  </div>
</div>

 


          {/* Mobile Cart Icon */}
          <div className="lg:hidden relative">
          <div onClick={() => navigate(`/cart/${localStorage.getItem('cartId')}`)} className="relative cursor-pointer">
  <ShoppingBagIcon className="h-6 w-6 text-gray-700 hover:text-green-600" />
  {totalItems > 0 && (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
      {totalItems}
    </span>
  )}
</div>

          </div>
        </div>
        {/* Mobile Search Bar */}
        <div className="w-full lg:hidden">
  <div className="flex items-center rounded-full px-4 py-2 shadow-md border border-gray-300">
    <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
    <input
  type="text"
  placeholder="Search products, brands and categories"
  className="ml-3 bg-white text-gray-800 text-sm w-full focus:outline-none placeholder-gray-400"
/>
  </div>
</div>
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
            className={`w-1/2 py-2 font-semibold border-b-2 ${activeSidebar === "categories" ? "border-green-500 text-green-600" : "border-gray-200"}`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveSidebar("menu")}
            className={`w-1/2 py-2 font-semibold border-b-2 ${activeSidebar === "menu" ? "border-green-500 text-green-600" : "border-gray-200"}`}
          >
            Main Menu
          </button>
          
        </div>

        {/* Sidebar Content */}
        <div>
          {activeSidebar === "menu" ? (
            <List>
                          {(() => {
  const customer = localStorage.getItem("customer");
  if (customer) {
    const parsed = JSON.parse(customer);
    const firstName = parsed?.firstName || "User";


    return (
      <div className="flex items-center gap-3 px-3 py-1 rounded-full bg-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
        <span className="text-gray-800 font-semibold text-sm hover:text-green-600 transition">
          Hi, {firstName}
        </span>
       
      </div>
    );
  } else {
    return (
      <button
        onClick={handleAccountClick}
        className="p-2 rounded-full hover:bg-gray-200 transition"
        aria-label="User menu"
      >
        <UserCircleIcon className="h-7 w-7 text-gray-700 hover:text-green-600 transition" />
      </button>
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

            <List>
            {categories
              .filter(
                (cat) =>
                  cat.stockStatus !== "Products out of stock" &&
                  cat.categoryName !== "Products out of stock"
              )
              .map((category) => {
                const categoryBrands = brands.filter(
                  (brand) => brand.categoryId === category.categoryId
                );
                const isExpanded = hoveredCategory === category.categoryId;
          
                return (
                  <div key={category.categoryId} className="mb-2">
                    <div className="flex justify-between items-center px-3 py-2 rounded hover:bg-green-50 transition">
                      <button
                        onClick={() => {
                          // Toggle the dropdown on category click
                          setHoveredCategory(isExpanded ? null : category.categoryId);
                        }}
                        className="flex items-center gap-2 text-left w-full"
                      >
                        <TagIcon className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-gray-800">
                          {category.categoryName}
                        </span>
                      </button>
          
                      <button
                        onClick={() =>
                          setHoveredCategory(isExpanded ? null : category.categoryId)
                        }
                        className="ml-2 p-1 rounded hover:bg-gray-100 transition"
                      >
                        <ChevronRightIcon
                          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                      </button>
                    </div>
          
                    <div
                      className={`transition-all duration-300 ease-in-out ${
                        isExpanded ? "max-h-52 mt-1" : "max-h-0"
                      } overflow-hidden`}
                    >
                      {categoryBrands.length > 0 && (
                        <div className="ml-6 border-l border-gray-200 pl-4 pr-2 py-2 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                          {categoryBrands.map((brand) => (
                            <div
                              key={brand.brandId}
                              onClick={() => {
                                // Set selected brand and navigate
                                setSelectedBrandId(brand.brandId); // Set active brand
                                closeDrawerAndNavigate(`/brand/${brand.brandId}`);
                                setHoveredCategory(null); // Close the dropdown after selecting the brand
                              }}
                              className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-600 cursor-pointer transition bg-gray-100 rounded-lg"
                            >
                              <span
                                className={`${
                                  selectedBrandId === brand.brandId
                                    ? "bg-green-200" // Active background color for the selected brand
                                    : ""
                                } p-2 rounded-lg`}
                              >
                                {brand.brandName}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </List>
          
          
             

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
