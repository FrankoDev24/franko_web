/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";

import { getBannerPageAdvertisment } from "../Redux/Slice/advertismentSlice";
import ban from "../assets/banner.jpg";

const backendBaseURL = "https://ct002.frankotrading.com:444";

const YT_ID = "SA93zbnoR4U";
const YT_THUMB = `https://img.youtube.com/vi/${YT_ID}/maxresdefault.jpg`;
const YT_EMBED = `https://www.youtube.com/embed/${YT_ID}?autoplay=1&rel=0&modestbranding=1`;

// When LIVE, navigate in SAME TAB to Samsung
const LIVE_URL = "https://www.samsung.com/";

// "Live in 5 days at 6:00pm" => dynamic target: now + 5 days, time set to 6:00 PM
const getTargetDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  d.setHours(18, 0, 0, 0); // 6:00 PM
  return d;
};

export default function Carousel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const splideRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState([]);
  const [isYouTubePlaying, setIsYouTubePlaying] = useState(false);

  const [heightRatio, setHeightRatio] = useState(0.0);

  const [now, setNow] = useState(Date.now());
  const [targetDate] = useState(() => getTargetDate());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const msLeft = targetDate.getTime() - now;
  const isLive = msLeft <= 0;

  const formatCountdown = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  };

  const formatTime12h = (date) => {
    let h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m}${ampm}`;
  };

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

  // SAME TAB navigation for external URLs + internal routes
  const handleBannerClick = (adsNote) => {
    if (!adsNote || adsNote === "#") return;

    if (adsNote.startsWith("http")) {
      window.location.assign(adsNote); // same tab
      return;
    }

    navigate(adsNote);
  };

  // IMPORTANT:
  // Splide autoplay may stop if the component re-renders frequently (your countdown updates every second).
  // We force autoplay to start/resume after mount and after slide moves.
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

      // Always enable autoplay in Splide options:
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
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
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

          .yt-iframe-wrapper {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
          }
          .yt-iframe-wrapper iframe {
            width: 100%;
            height: 100%;
            border: 0;
            display: block;
            border-radius: 0.5rem;
          }

          .yt-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.55));
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            cursor: pointer;
            z-index: 5;
          }

          .yt-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(220, 38, 38, 0.96);
            color: white;
            padding: 10px 14px;
            border-radius: 999px;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.2px;
            z-index: 10;
            line-height: 1;
            max-width: calc(100% - 24px);
            white-space: nowrap;
            box-shadow: 0 10px 24px rgba(0,0,0,0.25);
          }

          .yt-dot {
            width: 10px;
            height: 10px;
            background: white;
            border-radius: 50%;
            animation: blink 1.5s infinite;
            flex: 0 0 auto;
          }

          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }

          .yt-play {
            width: 60px;
            height: 60px;
            background: rgba(220, 38, 38, 0.95);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
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
            white-space: nowrap;
            text-decoration: none;
            box-shadow: 0 2px 10px rgba(220, 38, 38, 0.25);
            z-index: 12;
          }
          .carousel-shop-btn:hover { background: #b91c1c; }

          @media (max-width: 640px) {
            .carousel-shop-btn { height: 34px; padding: 0 12px; font-size: 12px; }
            .yt-badge { top: 10px; right: 10px; padding: 8px 12px; font-size: 12px; }
            .yt-dot { width: 8px; height: 8px; }
            .yt-play { width: 50px; height: 50px; }
          }
        `}</style>

        <Splide
          ref={splideRef}
          options={options}
          onMounted={() => startAutoplay()}
          onMove={() => startAutoplay()}
        >
          {/* First slide */}
          <SplideSlide className="banner-slide">
            <div
              className="w-full h-full relative"
              onClick={() => !isYouTubePlaying && setIsYouTubePlaying(true)}
            >
              {!isYouTubePlaying ? (
                <>
                  <img
                    src={YT_THUMB}
                    alt="Franko Trading Live"
                    className="banner-media shadow-lg"
                    onError={(e) => (e.currentTarget.src = ban)}
                  />

                  <div className="yt-badge">
                    {isLive ? (
                      <>
                        <span className="yt-dot" />
                        <span>LIVE</span>
                      </>
                    ) : (
                      <span>
                        Live in 5 days at {formatTime12h(targetDate)} •{" "}
                        {formatCountdown(msLeft)}
                      </span>
                    )}
                  </div>

                  <div className="yt-overlay">
                    <div className="yt-play">
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-6 z-10">
                    <button
                      className="carousel-shop-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isLive) window.location.assign(LIVE_URL);
                      }}
                    >
                      {isLive ? "Watch Live" : "Coming Soon"}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <div className="yt-iframe-wrapper">
                  <iframe
                    src={YT_EMBED}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Live Stream"
                  />
                </div>
              )}
            </div>
          </SplideSlide>

          {/* Ads */}
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
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
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
        <div className="hidden md:block w-full">
          {loading ? (
            <img src={ban} alt="Franko Trading" className="w-full h-full object-cover rounded-lg" />
          ) : (
            renderSplide(false)
          )}
        </div>

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