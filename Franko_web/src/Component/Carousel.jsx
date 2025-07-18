/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getBannerPageAdvertisment } from "../Redux/Slice/advertismentSlice";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css"; // default CSS

import ban from "../assets/kumasi.jpg";

const backendBaseURL = "https://smfteapi.salesmate.app";

const Carousel = () => {
  const [loading, setLoading] = useState(true);
  const [filteredAds, setFilteredAds] = useState([]);

  const dispatch = useDispatch();
  const { advertisments = [] } = useSelector((state) => state.advertisment);

  useEffect(() => {
    dispatch(getBannerPageAdvertisment())
      .then((response) => {
        if (response.payload && response.payload.length > 0) {
          setFilteredAds(response.payload);
        } else {
          setFilteredAds([]);
        }
      })
      .finally(() => setLoading(false));
  }, [dispatch]);

  const renderBanner = (isMobile = false) => {
    const options = {
      type: "fade",
      autoplay: true,
      interval: isMobile ? 2000 : 5000,
      speed: 500,
      rewind: true,
      arrows: false,
      pagination: true,
    };

    return (
      <Splide options={options}>
        {filteredAds
          .filter((ad) => ad.index !== 0)
          .map((ad, index) => {
            const imageUrl = `${backendBaseURL}/Media/Ads/${ad.fileName.split("\\").pop()}`;
            return (
              <SplideSlide key={ad.id || index} className="relative group">
                {/* Entire image is clickable */}
                <a href={ad.adsNote || "#"} className="block w-full h-full">
                  <img
                    src={imageUrl}
                    alt="Franko Trading"
                    className="w-full h-full object-cover rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105"
                  />
                </a>

                {/* Buy Now Button */}
             {/* Buy Now Button */}
{ad.adsNote && (
  <div className="absolute bottom-2 left-2 sm:left-6 z-10">
    <a
      href={ad.adsNote}
      className="group relative inline-block transform transition-all duration-300 hover:scale-105"
    >
      {/* Pulsing background effect */}
      <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse opacity-75 blur-md"></div>

      {/* Main button */}
      <div className="relative bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-sm sm:text-lg px-4 py-2 sm:px-8 sm:py-4 rounded-full shadow-2xl border-2 border-red-400 transition-all duration-300 transform hover:shadow-red-500/50 hover:shadow-xl">
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

        {/* Button content */}
        <div className="relative flex items-center space-x-1 md:space-x-2">
          <span className="text-xs sm:text-sm font-bold tracking-wide">🛒 BUY NOW</span>
          <div className="bg-white/20 rounded-full p-0.5 sm:p-1 group-hover:bg-white/30 transition-colors duration-300">
           
          </div>
        </div>
      </div>

      {/* Outer glow */}
      <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse"></div>
    </a>
  </div>
)}
              </SplideSlide>
            );
          })}
      </Splide>
    );
  };

  return (
    <div className="mx-auto p-1 md:p-2">
      <div className="flex flex-col md:flex-row relative bg-gray-30">
        {/* Desktop Banner */}
        <div className="hidden md:block w-full">
          {loading || filteredAds.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={ban}
                alt="Franko Trading"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          ) : (
            renderBanner(false)
          )}
        </div>

        {/* Mobile Banner */}
        <div className="md:hidden w-full relative">
          {loading || filteredAds.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={ban}
                alt="Franko Trading"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          ) : (
            renderBanner(true)
          )}
        </div>
      </div>
    </div>
  );
};

export default Carousel;
