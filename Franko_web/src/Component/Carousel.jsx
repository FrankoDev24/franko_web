/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";

import { getBannerPageAdvertisment } from "../Redux/Slice/advertismentSlice";
import ban from "../assets/banner.jpg";

const backendBaseURL = "https://testing.frankotrading.com";

export default function Carousel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const splideRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState([]);
  const [heightRatio, setHeightRatio] = useState(0.0);

  useEffect(() => {
    const img = new Image();
    img.src = ban;
    img.onload = () => {
      const r = img.naturalHeight / img.naturalWidth;
      setHeightRatio(Number.isFinite(r) && r > 0 ? r : 0.5625);
    };
    img.onerror = () => setHeightRatio(0.5625);
  }, []);

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
    if (!heightRatio) {
      return (
        <img
          src={ban}
          alt="Franko Trading"
          className="w-full h-full object-cover rounded-lg"
        />
      );
    }

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
      resetProgress: false,
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      heightRatio,
      autoHeight: false,
    };

    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap');

          .carousel-container * {
            font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }

          .carousel-container .splide,
          .carousel-container .splide__track,
          .carousel-container .splide__list,
          .carousel-container .splide__slide {
            height: 100%;
          }

          .banner-slide {
            position: relative;
            overflow: hidden;
          }

          .banner-media {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            border-radius: 0.5rem;
          }

          .carousel-shop-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            height: 38px;
            padding: 0 14px;
            font-size: 13px;
            font-weight: 600;
            color: #fff;
            background: #dc2626;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.15s ease;
            box-shadow: 0 2px 10px rgba(220, 38, 38, 0.25);
            z-index: 12;
          }
          .carousel-shop-btn:hover { background: #b91c1c; }

          @media (max-width: 640px) {
            .carousel-shop-btn { height: 34px; padding: 0 12px; font-size: 12px; }
          }
        `}</style>

        <Splide
          ref={splideRef}
          options={options}
          onMounted={() => startAutoplay()}
          onMove={() => startAutoplay()}
        >
          {/* New YouTube Slide Added as First Slide */}
          <SplideSlide className="banner-slide">
            <div className="w-full h-full relative">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/WqGRV-fXaUs?autoplay=0&mute=1&controls=1"
                title="Galaxy Unpacked 2026"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 rounded text-xs md:text-sm font-bold z-10">
                Invitation to Galaxy Unpacked 2026
              </div>
            </div>
          </SplideSlide>

          {/* Existing Fetched Ads */}
          {filteredAds.map((ad, index) => {
            const file = String(ad?.fileName || "").split("\\").pop();
            const imageUrl = `${backendBaseURL}/Media/Ads/${file}`;

            return (
              <SplideSlide key={ad?.id ?? index} className="banner-slide">
                <div
                  onClick={() => handleBannerClick(ad?.adsNote)}
                  className="w-full h-full cursor-pointer relative"
                >
                  <img
                    src={imageUrl}
                    alt="Franko Trading"
                    className="banner-media shadow-lg"
                    onError={(e) => (e.currentTarget.src = ban)}
                  />

                  {ad?.adsNote && (
                    <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-6 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBannerClick(ad?.adsNote);
                        }}
                        className="carousel-shop-btn"
                      >
                        Shop Now
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
    <div className="mx-auto p-1 md:p-2 carousel-container">
      <div className="flex flex-col md:flex-row relative bg-gray-30">
        {/* Desktop */}
        <div className="hidden md:block w-full">
          {loading ? (
            <img src={ban} alt="Franko Trading" className="w-full h-full object-cover rounded-lg" />
          ) : (
            renderSplide(false)
          )}
        </div>

        {/* Mobile */}
        <div className="md:hidden w-full relative">
          {loading ? (
            <img src={ban} alt="Franko Trading" className="w-full h-full object-cover rounded-lg" />
          ) : (
            renderSplide(true)
          )}
        </div>
      </div>
    </div>
  );
}