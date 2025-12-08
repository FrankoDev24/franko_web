import { useRef, useState, useEffect } from "react";
import { Typography, IconButton } from "@material-tailwind/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import phone from "../assets/phone.jpg";
import laptop from "../assets/lap.jpg";
import fridge from "../assets/fridge.jpg";
import tv from "../assets/tv.jpg";
import speaker from "../assets/speaker.jpg";
import blender from "../assets/blender.jpg";
import ac from "../assets/ac.jpg";
import combo from "../assets/machine.jpg";
import accessories from "../assets/acce.png";

const categories = [
  { name: "Phones", img: phone, route: "/phones" },
  { name: "Laptops", img: laptop, route: "/computers" },
  { name: "Refrigerator", img: fridge, route: "/refrigerator" },
  { name: "Television", img: tv, route: "/television" },
  { name: "Speakers", img: speaker, route: "/speakers" },
  { name: "Appliances", img: blender, route: "/appliances" },
  { name: "Air-conditioners", img: ac, route: "/air-condition" },
  { name: "Washing Machine", img: combo, route: "/washing-machine" },
  { name: "Accessories", img: accessories, route: "/accessories" },
];

const CategoryComponent = () => {
  const scrollRef = useRef();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [autoScrollDir, setAutoScrollDir] = useState("right");
  const [isHovered, setIsHovered] = useState(false);
  const autoScrollInterval = useRef(null);
  const navigate = useNavigate();

  const updateScrollButtons = () => {
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current || {};
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  const scroll = (direction) => {
    const scrollAmount = window.innerWidth < 768 ? 200 : 320;
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleCategoryClick = (category) => {
    navigate(category.route);
  };

  useEffect(() => {
    const container = scrollRef.current;

    const handleScroll = () => {
      updateScrollButtons();
      const { scrollLeft, scrollWidth, clientWidth } = container;
      if (scrollLeft + clientWidth >= scrollWidth - 5) setAutoScrollDir("left");
      else if (scrollLeft <= 0) setAutoScrollDir("right");
    };

    updateScrollButtons();
    container?.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      container?.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, []);

  useEffect(() => {
    const startAutoScroll = () => {
      if (!isHovered) {
        autoScrollInterval.current = setInterval(() => {
          scroll(autoScrollDir);
        }, 4000);
      }
    };

    const pauseAutoScroll = () => clearInterval(autoScrollInterval.current);

    startAutoScroll();

    return () => {
      pauseAutoScroll();
    };
  }, [autoScrollDir, isHovered]);

  return (
    <section >
      <div className="mx-auto px-4 md:px-16 py-6">
        {/* Header with improved styling */}
        <div className="mb-2">
          <h2 className="text-md md:text-lg font-bold text-gray-900 relative inline-block mt-2">
            Shop by Category
            <span className="absolute -bottom-2 left-0 w-20 h-1 bg-gradient-to-r from-red-500 to-red-400 rounded-full"></span>
          </h2>
          <p className="text-sm md:text-sm text-gray-700 mt-3">
            Explore our wide range of electronics and appliances
          </p>
        </div>

        {/* Horizontal Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

        <div 
          className="relative flex items-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Left Arrow with improved styling */}
          <IconButton
            aria-label="Scroll left"
            onClick={() => scroll("left")}
            className={`absolute left-0 z-20 bg-white shadow-lg hover:shadow-xl w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border border-gray-200 hover:border-red-300 ${
              canScrollLeft ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
            }`}
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-700 hover:text-red-500 transition-colors duration-300" />
          </IconButton>

          {/* Scrollable Categories with improved spacing */}
          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-6 lg:gap-8 overflow-x-auto scroll-smooth scrollbar-hide px-1 py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((cat, idx) => (
              <div
                key={idx}
                onClick={() => handleCategoryClick(cat)}
                className="flex-shrink-0 w-24 md:w-32 lg:w-36 flex flex-col items-center text-center cursor-pointer group transition-all duration-300 hover:scale-105 p-2 rounded-xl hover:bg-white hover:shadow-md"
              >
                {/* Improved image container with better hover effects */}
                <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-white shadow-md group-hover:shadow-xl ring-2 ring-gray-100 group-hover:ring-red-300 flex items-center justify-center mb-3 transition-all duration-300 overflow-hidden relative">
                  <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 flex items-center justify-center">
                    <img
                      src={cat.img}
                      alt={cat.name}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                  {/* Subtle gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-red-50 to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-full"></div>
                </div>
                
                {/* Improved typography */}
                <Typography className="text-xs md:text-sm lg:text-base text-gray-800 font-semibold group-hover:text-red-600 transition-colors duration-300 text-center leading-tight">
                  {cat.name}
                </Typography>
                
                {/* Subtle indicator dot */}
                <div className="w-1 h-1 bg-red-400 rounded-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>

          {/* Right Arrow with improved styling */}
          <IconButton
            aria-label="Scroll right"
            onClick={() => scroll("right")}
            className={`absolute right-0 z-20 bg-white shadow-lg hover:shadow-xl w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border border-gray-200 hover:border-red-300 ${
              canScrollRight ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
            }`}
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            <ChevronRightIcon className="w-6 h-6 text-gray-700 hover:text-red-500 transition-colors duration-300" />
          </IconButton>
        </div>

      </div>
    </section>
  );
};

export default CategoryComponent;