/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getBannerPageAdvertisment } from "../Redux/Slice/advertismentSlice";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css"; // default CSS

import ban from "../assets/ban.jpeg";

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
          .map((ad, index) => (
            <SplideSlide key={ad.id || index}>
              <img
                src={`${backendBaseURL}/Media/Ads/${ad.fileName.split("\\").pop()}`}
                alt={`Banner ${index + 1}`}
                className="w-full h-full object-cover rounded-lg shadow-lg"
              />
            </SplideSlide>
          ))}
      </Splide>
    );
  };

  return (
    <div className=" mx-auto p-1 md:p-4 bg-gray-100">
      <div className="flex flex-col md:flex-row relative bg-gray-30">

        {/* Desktop Banner */}
        <div className="hidden md:block w-full">
          {loading || filteredAds.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <img src={ban} alt="Fallback" className="w-full h-full object-cover rounded-lg" />
            </div>
          ) : (
            renderBanner(false)
          )}
        </div>

        {/* Mobile Banner */}
        <div className="md:hidden w-full relative">
          {loading || filteredAds.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <img src={ban} alt="Fallback" className="w-full h-full object-cover rounded-lg" />
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
