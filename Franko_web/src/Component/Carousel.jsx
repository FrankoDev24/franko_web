/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";

import { getBannerPageAdvertisment } from "../Redux/Slice/advertismentSlice";
import ban from "../assets/banner.jpeg";

const backendBaseURL = "https://ct002.frankotrading.com:444";

export default function Carousel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const splideRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState([]);
  const [heightRatio, setHeightRatio] = useState(0.5625);

  // Load default banner ratio
  useEffect(() => {
    const img = new Image();
    img.src = ban;
    img.onload = () => {
      const r = img.naturalHeight / img.naturalWidth;
      setHeightRatio(Number.isFinite(r) && r > 0 ? r : 0.5625);
    };
  }, []);

  // Fetch advertisements
  useEffect(() => {
    let mounted = true;
    dispatch(getBannerPageAdvertisment())
      .then((res) => {
        if (!mounted) return;
        setAds(Array.isArray(res?.payload) ? res.payload : []);
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  const filteredAds = useMemo(
    () => (ads || []).filter((ad) => ad?.index !== 0),
    [ads]
  );

  const handleBannerClick = (adsNote) => {
    if (!adsNote || adsNote === "#") return;

    if (adsNote.startsWith("http")) {
      window.location.assign(adsNote);
      return;
    }

    navigate(adsNote);
  };

  const startAutoplay = () => {
    const splide = splideRef.current?.splide;
    const autoplay = splide?.Components?.Autoplay;
    if (autoplay && autoplay.isPaused()) autoplay.play();
  };

  const renderSplide = (isMobile) => {
    const options = {
      type: "fade",
      rewind: true,
      arrows: false,
      pagination: true,
      autoplay: true,
      interval: isMobile ? 2500 : 4500,
      speed: 800,
      pauseOnHover: true,
      pauseOnFocus: true,
      heightRatio,
    };

    return (
      <>
        <Splide
          ref={splideRef}
          options={options}
          onMounted={() => startAutoplay()}
          onMove={() => startAutoplay()}
        >
          {/* Default First Slide */}
          

          {/* Advertisement Slides */}
          {filteredAds.map((ad, index) => {
            const file = String(ad?.fileName || "").split("\\").pop();
            const imageUrl = `${backendBaseURL}/Media/Ads/${file}`;

            return (
              <SplideSlide key={ad?.id ?? index}>
                <div
                  onClick={() => handleBannerClick(ad?.adsNote)}
                  className="w-full h-full cursor-pointer relative"
                >
                  <img
                    src={imageUrl}
                    alt="Advertisement"
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => (e.currentTarget.src = ban)}
                  />

                  {ad?.adsNote && (
                    <div className="absolute bottom-4 left-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBannerClick(ad?.adsNote);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-semibold shadow-md"
                      >
                        Shop Now →
                      </button>
                    </div>
                  )}
                </div>
              </SplideSlide>
            );
          })}
        </Splide>
      </>
    );
  };

  return (
    <div className="mx-auto p-1 md:p-2">
      <div className="w-full">
        {loading ? (
          <img
            src={ban}
            alt="Franko Trading"
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          renderSplide(false)
        )}
      </div>
    </div>
  );
}
