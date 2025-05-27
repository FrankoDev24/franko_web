import { useRef, useState, useEffect } from "react";
import { Typography, IconButton } from "@material-tailwind/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import phone from "../assets/phone.jpeg";
import laptop from "../assets/lap.jpeg";
import fridge from "../assets/fridge.jpeg";
import tv from "../assets/tv.jpeg";
import speaker from "../assets/speaker.jpeg";
import blender from "../assets/blender.jpeg";
import ac from "../assets/ac.jpeg";
import combo from "../assets/combo.jpeg";
import accessories from "../assets/acce.png";

const categories = [
  { name: "Phones", img: phone },
  { name: "Laptops", img: laptop },
  { name: "Refrigerator", img: fridge },
  { name: "Television", img: tv },
  { name: "Speakers", img: speaker },
  { name: "Appliances", img: blender },
  { name: "Air-conditioners", img: ac },
  { name: "Combo", img: combo },
  { name: "Accessories", img: accessories },
];

const CategoryComponent = () => {
  const scrollRef = useRef();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [autoScrollDir, setAutoScrollDir] = useState("right");
  const autoScrollInterval = useRef(null);
  const navigate = useNavigate();

  const updateScrollButtons = () => {
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current || {};
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
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
      autoScrollInterval.current = setInterval(() => {
        scroll(autoScrollDir);
      }, 4000);
    };

    const pauseAutoScroll = () => clearInterval(autoScrollInterval.current);

    const container = scrollRef.current;
    startAutoScroll();
    container?.addEventListener("mouseenter", pauseAutoScroll);
    container?.addEventListener("mouseleave", startAutoScroll);

    return () => {
      pauseAutoScroll();
      container?.removeEventListener("mouseenter", pauseAutoScroll);
      container?.removeEventListener("mouseleave", startAutoScroll);
    };
  }, [autoScrollDir]);

  return (
    <section >
      <div className="mx-auto px-4 md:px-24 py-4">
      <h2 className="text-sm md:text-lg font-bold text-gray-900 relative whitespace-nowrap">
        Shop by Category
      <span className="absolute -bottom-1 left-0 w-16 h-1 bg-red-400 rounded-full "></span>
    </h2>

    {/* Horizontal Divider */}
    <div className="flex-grow h-px bg-gray-300 mb-4" />

        <div className="relative flex items-center ">
          {/* Left Arrow */}
          <IconButton
            aria-label="Scroll left"
            onClick={() => scroll("left")}
            className={`absolute left-0 z-10 bg-white shadow-md w-10 h-10 rounded-full flex items-center justify-center transition-opacity duration-300 ${
              canScrollLeft ? "opacity-100" : "opacity-0"
            }`}
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
          </IconButton>

          {/* Scrollable Categories */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide px-1"
          >
            {categories.map((cat, idx) => (
           <div
           key={idx}
           onClick={() => navigate(`/${cat.name.toLowerCase()}`)}
           className="flex-shrink-0 w-28 md:w-32 lg:w-36 flex flex-col items-center text-center cursor-pointer group transition-transform duration-300 hover:scale-105"
         >
           <div className="w-24 h-24 md:w-28 md:h-28 rounded-full mt-2 shadow-md group-hover:shadow-xl ring-1 ring-gray-200 group-hover:ring-green-400 flex items-center justify-center mb-2 transition-all duration-300">
             <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center overflow-hidden">
               <img
                 src={cat.img}
                 alt={cat.name}
                 className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
               />
             </div>
           </div>
           <Typography className="text-xs md:text-sm text-gray-800 font-semibold group-hover:text-green-600 transition-colors duration-300">
             {cat.name}
           </Typography>
         </div>
         
            ))}
          </div>

          {/* Right Arrow */}
          <IconButton
            aria-label="Scroll right"
            onClick={() => scroll("right")}
            className={`absolute right-0 z-10 bg-white shadow-md w-10 h-10 rounded-full flex items-center justify-center transition-opacity duration-300 ${
              canScrollRight ? "opacity-100" : "opacity-0"
            }`}
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            <ChevronRightIcon className="w-6 h-6 text-gray-600" />
          </IconButton>
        </div>
      </div>
    </section>
  );
};

export default CategoryComponent;
