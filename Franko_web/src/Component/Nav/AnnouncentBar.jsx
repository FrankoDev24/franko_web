import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const BRAND_COLORS = {
  red: '#E53E3E',
  darkRed: '#C53030',
  frankoRed: '#DC2626',
  green: '#38A169',
  darkGreen: '#2F855A',
  frankoGreen: '#16A34A',
  black: '#1A202C',
  gray: '#2D3748',
  white: '#FFFFFF',
  lightGray: '#F7FAFC',
  mediumGray: '#E2E8F0',
  orange: '#F59E0B',
  darkOrange: '#D97706',
  yellow: '#FDE047',
  brightYellow: '#FACC15',
};

const promoMessages = [
  "🚚 FREE DELIVERY WITHIN ACCRA & KUMASI!",
  "🎯 MASSIVE DISCOUNTS ON ALL PRODUCTS",
  "💰 UNBEATABLE PRICES - LIMITED TIME!",
  "🛒 DON'T MISS OUT - SHOP NOW!",
];

const AnnouncementBar = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const navigate = useNavigate();


  // Countdown to end of today (midnight tonight)
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date(2025, 9, 25, 0, 0, 0); // October 25, 2025 at midnight
      
      const difference = endOfDay - now;
      
      if (difference > 0) {
        return {
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      
      return { hours: 0, minutes: 0, seconds: 0 };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Rotating promo messages
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % promoMessages.length);
        setIsAnimating(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const PhoneIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
  );

  const WhatsAppIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
    </svg>
  );

  const CountdownBox = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div 
        className="rounded-lg px-3 py-1 min-w-[50px] shadow-lg"
        style={{ 
          background: BRAND_COLORS.white,
          border: `2px solid ${BRAND_COLORS.frankoRed}`
        }}
      >
        <div 
          className="font-bold text-2xl leading-none"
          style={{ color: BRAND_COLORS.frankoRed }}
        >
          {String(value).padStart(2, '0')}
        </div>
      </div>
      <div className="text-white text-xs font-semibold mt-1">{label}</div>
    </div>
  );

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:block text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.frankoGreen} 0%, ${BRAND_COLORS.darkGreen} 100%)` }}>
        
        {/* Top Row - Crazy Price Drop with Countdown */}
        <div className="relative overflow-hidden  px-4" style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.orange} 0%, ${BRAND_COLORS.darkOrange} 100%)` }}>
          {/* Animated background dots */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              animation: 'slideBackground 20s linear infinite'
            }}
          />
          
          {/* Shimmer effect */}
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
              animation: 'shimmer 3s infinite'
            }}
          />

          <div className="relative z-10 flex items-center justify-between max-w-7xl mx-auto">
            {/* Left: Crazy Price Drop Text */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-3">
                <span 
                  className="text-3xl"
                  style={{ animation: 'bounce 1s infinite' }}
                >
                  🔥
                </span>
                <div>
                  <div 
                    className="font-black text-2xl leading-none mb-1"
                    style={{ 
                      color: BRAND_COLORS.frankoRed,
                      textShadow: `3px 3px 0px ${BRAND_COLORS.white}, -1px -1px 0px ${BRAND_COLORS.white}, 1px -1px 0px ${BRAND_COLORS.white}, -1px 1px 0px ${BRAND_COLORS.white}`,
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    CRAZY PRICE DROP
                  </div>
                  <div 
                    className="font-bold text-lg"
                    style={{ 
                      color: BRAND_COLORS.white,
                      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    Happening NOW! SAVE BIG!
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Countdown Timer */}
            <div className="flex flex-col items-center mx-6">
              <div 
                className="text-white font-bold text-sm mb-2 tracking-wide"
                style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)' }}
              >
                ⏰ ENDS IN:
              </div>
              <div className="flex items-center gap-3">
                <CountdownBox value={timeLeft.hours} label="HOURS" />
                <span className="text-white font-bold text-3xl">:</span>
                <CountdownBox value={timeLeft.minutes} label="MINS" />
                <span className="text-white font-bold text-3xl">:</span>
                <CountdownBox value={timeLeft.seconds} label="SECS" />
              </div>
            </div>

            {/* Right: CTA Button */}
            <div className="flex-shrink-0">
              <a 
                href="https://www.frankotrading.com/showroom/1e93aeb7-bba7-4bd4-b017-ea3267047d46"
                className="block py-4 px-8 rounded-xl font-black text-xl transition-all duration-300 hover:scale-110 shadow-xl"
                style={{ 
                  background: `linear-gradient(135deg, ${BRAND_COLORS.frankoRed} 0%, ${BRAND_COLORS.darkRed} 100%)`,
                  color: BRAND_COLORS.white,
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                  animation: 'wiggle 1s ease-in-out infinite'
                }}
              >
                SHOP NOW →
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Row - Promo Messages & Contact */}
        <div className="flex items-center justify-between px-4 ">
          {/* Promo Messages Animation */}
          <div className="flex-1 relative h-8 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`transform transition-all duration-300 ${
                  isAnimating ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
                }`}
              >
                <div className="font-semibold text-base" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)' }}>
                  {promoMessages[currentMessageIndex]}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="flex-shrink-0 rounded-lg backdrop-blur-sm px-3 py-1.5 ml-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
            <div className="text-white font-semibold text-xs text-center mb-1">Need Help? Contact Us!</div>
            <div className="flex items-center gap-3">
              <a
                href="tel:+233302225651"
                className="flex items-center text-white transition-all duration-200 hover:scale-105 rounded px-2 py-1"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <PhoneIcon />
                <span className="font-semibold text-xs ml-1">0302225651</span>
              </a>

              <a
                href="https://wa.me/233246422338"
                className="flex items-center text-white transition-all duration-200 hover:scale-105 rounded px-2 py-1"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon />
                <span className="font-semibold text-xs ml-1">233246422338</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.frankoGreen} 0%, ${BRAND_COLORS.darkGreen} 100%)` }}>
        
        {/* Crazy Price Drop Section */}
        <div className="relative overflow-hidden  px-2" style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.orange} 0%, ${BRAND_COLORS.darkOrange} 100%)` }}>
          {/* Animated background */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '15px 15px',
              animation: 'slideBackground 20s linear infinite'
            }}
          />
          
          <div className="relative z-10 flex flex-wrap items-center justify-center text-center">
            {/* Title */}
            <div className="flex items-center gap-2 w-full justify-center">
              <span className="text-2xl" style={{ animation: 'bounce 1s infinite' }}>🔥</span>
              <div
                className="font-black text-lg leading-none"
                style={{
                  color: BRAND_COLORS.frankoRed,
                  textShadow: `2px 2px 0px ${BRAND_COLORS.white}, -1px -1px 0px ${BRAND_COLORS.white}`,
                  animation: 'pulse 2s infinite'
                }}
              >
                CRAZY PRICE DROP
              </div>
            </div>

            {/* Subtitle */}
            <div
              className="text-white font-bold text-xs w-full"
              style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)' }}
            >
              Happening NOW! SAVE BIG!
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-2 w-full justify-center">
              <span className="text-white font-bold text-xs">⏰ ENDS IN:</span>
              <div className="flex items-center gap-1">
                <div
                  className="bg-white rounded px-2 "
                  style={{ border: `1px solid ${BRAND_COLORS.frankoRed}` }}
                >
                  <span className="font-bold text-sm" style={{ color: BRAND_COLORS.frankoRed }}>
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-white font-bold">:</span>
                <div
                  className="bg-white rounded px-2 "
                  style={{ border: `1px solid ${BRAND_COLORS.frankoRed}` }}
                >
                  <span className="font-bold text-sm" style={{ color: BRAND_COLORS.frankoRed }}>
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-white font-bold">:</span>
                <div
                  className="bg-white rounded px-2 "
                  style={{ border: `1px solid ${BRAND_COLORS.frankoRed}` }}
                >
                  <span className="font-bold text-sm" style={{ color: BRAND_COLORS.frankoRed }}>
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <a
              href="https://www.frankotrading.com/showroom/1e93aeb7-bba7-4bd4-b017-ea3267047d46"
              className="inline-block px-6 rounded-lg font-bold text-sm transition-all duration-300 hover:scale-105 mt-1"
              style={{
                background: `linear-gradient(135deg, ${BRAND_COLORS.frankoRed} 0%, ${BRAND_COLORS.darkRed} 100%)`,
                color: BRAND_COLORS.white,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              }}
            >
              SHOP NOW →
            </a>
          </div>
        </div>

        {/* Promo Messages */}
        <div className="relative h-7 overflow-hidden px-2 py-1">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`transform transition-all duration-300 ${
                isAnimating ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
              }`}
            >
              <div className="font-semibold text-xs text-center" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)' }}>
                {promoMessages[currentMessageIndex]}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="rounded-lg backdrop-blur-sm px-2 py-2 mx-2 mb-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
          <div className="text-white font-medium text-xs mb-1 text-center">Need Help? Contact Us!</div>
          <div className="flex items-center justify-center gap-2">
            <a
              href="tel:+233302225651"
              className="flex items-center text-white rounded px-2 py-1 transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <PhoneIcon />
              <span className="font-semibold text-xs ml-1">0302225651</span>
            </a>

            <a
              href="https://wa.me/233246422338"
              className="flex items-center text-white rounded px-2 py-1 transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              <span className="font-semibold text-xs ml-1">233246422338</span>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes wiggle {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-2deg);
          }
          75% {
            transform: rotate(2deg);
          }
        }

        @keyframes slideBackground {
          0% {
            transform: translateX(0) translateY(0);
          }
          100% {
            transform: translateX(20px) translateY(20px);
          }
        }
      `}</style>
    </>
  );
};

export default AnnouncementBar;