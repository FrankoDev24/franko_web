import React, { useState, useEffect } from "react";

const BRAND_COLORS = {
  red: '#E53E3E',
  darkRed: '#C53030',
  green: '#38A169',
  darkGreen: '#2F855A',
  black: '#1A202C',
  gray: '#2D3748',
  white: '#FFFFFF',
  lightGray: '#F7FAFC',
  mediumGray: '#E2E8F0',
  orange: '#ED8936',
  darkOrange: '#DD6B20',
};

const promoMessages = [
  "🚚 FREE DELIVERY WITHIN ACCRA & KUMASI!",
  "🎯 ON ALL PRODUCTS PURCHASED ONLINE",
  "💰 SAVE MORE WITH FREE DELIVERY TO YOUR DOORSTEP!",
  "🛒 START SHOPPING NOW!",
  "T&C APPLY",
];

const AnnouncementBar = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % promoMessages.length);
        setIsAnimating(true);
      }, 300);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const PhoneIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
  );

  const WhatsAppIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
    </svg>
  );

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex text-white px-4 items-center justify-between shadow-lg" style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.green} 0%, ${BRAND_COLORS.darkGreen} 100%)` }}>
        
        {/* Main Promo Animation Section */}
        <div className="flex-1 relative h-10 overflow-hidden rounded-lg shadow-inner mx-4" style={{ background: `linear-gradient(135deg, #68D391 0%, #48BB78 50%, #38A169 100%)` }}>
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`transform transition-all duration-300 ease-in-out ${
                isAnimating 
                  ? 'translate-y-0 opacity-100 scale-100' 
                  : 'translate-y-2 opacity-0 scale-95'
              }`}
            >
              <div
                className={`font-bold text-center px-2 leading-tight ${
                  promoMessages[currentMessageIndex] === "T&C APPLY"
                    ? "text-lg text-white font-bold" 
                    : "text-white text-lg"
                }`}
                style={{
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
                  letterSpacing: '0.5px'
                }}
              >
                {promoMessages[currentMessageIndex]}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="flex-shrink-0 ml-4 rounded-lg px-4 py-1 backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
          <div className="text-white font-medium text-xs mb-1 text-center">
           Need Help? Contact Us:
          </div>
          <div className="flex items-center space-x-3">
            <a
              href="tel:+233302225651"
              className="flex items-center text-white transition-all duration-200 hover:scale-105 rounded px-2 py-1"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'white'}
            >
              <PhoneIcon />
              <span className="font-semibold text-sm ml-1">
                +233302225651
              </span>
            </a>

            <a
              href="https://wa.me/233246422338"
              className="flex items-center text-white transition-all duration-200 hover:scale-105 rounded px-2 py-1"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'white'}
            >
              <WhatsAppIcon />
              <span className="font-semibold text-sm ml-1">
                +233246422338
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden text-white py-1 px-2 shadow-lg" style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.green} 0%, ${BRAND_COLORS.darkGreen} 100%)` }}>
        
        {/* Mobile Promo Animation Section */}
        <div className="relative h-10 overflow-hidden rounded-lg shadow-inner mb-2" style={{ background: `linear-gradient(135deg, #68D391 0%, #48BB78 50%, #38A169 100%)` }}>
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center px-2">
            <div
              className={`transform transition-all duration-300 ease-in-out ${
                isAnimating 
                  ? 'translate-y-0 opacity-100 scale-100' 
                  : 'translate-y-2 opacity-0 scale-95'
              }`}
            >
              <div
                className={`font-bold text-center leading-tight ${
                  promoMessages[currentMessageIndex] === "T&C APPLY" 
                    ? "text-base text-white font-bold" 
                    : "text-white text-sm"
                }`}
                style={{
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                  letterSpacing: '0.3px'
                }}
              >
                {promoMessages[currentMessageIndex]}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Contact Section */}
        <div className="text-center rounded-lg px-3 py-1 backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
          <div className="text-white font-medium text-xs mb-1">
            Need Help? Contact Us:
          </div>
          <div className="flex items-center justify-center space-x-3">
            <a
              href="tel:+233302225651"
              className="flex items-center text-white transition-all duration-200 active:scale-95 rounded px-2 py-1"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <PhoneIcon />
              <span className="font-semibold text-xs ml-1">
                +233302225651
              </span>
            </a>

            <a
              href="https://wa.me/233246422338"
              className="flex items-center text-white transition-all duration-200 active:scale-95 rounded px-2 py-1"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              <span className="font-semibold text-xs ml-1">
                +233246422338
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Enhanced CSS Animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }

        .transition-all {
          will-change: transform, opacity;
        }
      `}</style>
    </>
  );
};

export default AnnouncementBar;