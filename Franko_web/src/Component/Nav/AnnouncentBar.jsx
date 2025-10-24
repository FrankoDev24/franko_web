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
  purple: '#9B2C7D',
  darkPurple: '#7A1F63',
  magenta: '#B83280',
  yellow: '#F6E05E',
};

const promoMessages = [
  "🚚 FREE DELIVERY WITHIN ACCRA & KUMASI!",
  "🎯 ON ALL PRODUCTS PURCHASED ONLINE",
  "💰 SAVE MORE WITH FREE DELIVERY!",
  "🛒 START SHOPPING NOW!",
];

const AnnouncementBar = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [bagBounce, setBagBounce] = useState(false);

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

  // Bounce animation for shopping bag
  useEffect(() => {
    const bounceInterval = setInterval(() => {
      setBagBounce(true);
      setTimeout(() => setBagBounce(false), 500);
    }, 2000);

    return () => clearInterval(bounceInterval);
  }, []);

  const PhoneIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
  );

  const WhatsAppIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
    </svg>
  );

  const ShoppingBagIcon = ({ animate }) => (
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5"
      className={animate ? 'bag-bounce' : ''}
    >
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );

  return (
    <>
      {/* Desktop Layout - Ultra Compact */}
      <div className="hidden md:flex text-white px-2 py-1 items-center gap-2 shadow-md text-sm" style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.green} 0%, ${BRAND_COLORS.darkGreen} 100%)` }}>
        
        {/* Shop Online Badge - Compact */}
        <div className="flex-shrink-0">
          <div 
            className="relative rounded-lg overflow-hidden px-4 py-1 transition-all duration-300 hover:scale-105" 
            style={{ 
              background: `linear-gradient(135deg, ${BRAND_COLORS.red} 0%, ${BRAND_COLORS.darkRed} 100%)`,
            }}
          >
            {/* Shimmer effect overlay */}
            <div 
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
                animation: 'shimmer 2s infinite'
              }}
            />
            
            {/* Animated background pulse */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${BRAND_COLORS.darkRed} 0%, transparent 70%)`,
                animation: 'backgroundPulse 2s ease-in-out infinite'
              }}
            />
            
            <div className="flex items-center gap-2 relative z-10">
              <ShoppingBagIcon animate={bagBounce} />
              <span 
                className="text-white font-bold text-base"
                style={{ 
                  animation: 'slideIn 0.8s ease-out',
                  textShadow: '1px 1px 3px rgba(0, 0, 0, 0.3)'
                }}
              >
                SHOP ONLINE
              </span>
              <span className="text-yellow-300 font-extrabold text-base" style={{ animation: 'pulse 2s infinite, colorShift 3s infinite' }}>
                & SAVE BIG
              </span>
            </div>
          </div>
        </div>

        {/* Main Promo Animation Section - Compact */}
        <div className="flex-1 relative h-7 overflow-hidden rounded-lg" style={{ background: `linear-gradient(135deg, #68D391 0%, #38A169 100%)` }}>
          <div className="absolute inset-0 flex items-center justify-center px-2">
            <div
              className={`transform transition-all duration-300 ${
                isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
              }`}
            >
              <div className="font-semibold text-center" style={{ textShadow: '3px 4px 7px rgba(0, 0, 0, 0.5)' }}>
                {promoMessages[currentMessageIndex]}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section - Compact */}
        <div className="flex-shrink-0 rounded backdrop-blur-sm px-2 py-1" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
          <div className="text-white font-semibold text-xs mb-0.5 text-center">Need Help? Contact Us</div>
          <div className="flex items-center gap-2">
            <a
              href="tel:+233302225651"
              className="flex items-center text-white transition-all duration-200 hover:scale-105 rounded px-1.5 py-0.5"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <PhoneIcon />
              <span className="font-semibold text-xs ml-1">0302225651</span>
            </a>

            <a
              href="https://wa.me/233246422338"
              className="flex items-center text-white transition-all duration-200 hover:scale-105 rounded px-1.5 py-0.5"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              <span className="font-semibold text-xs ml-1">0246422338</span>
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Ultra Compact */}
      <div className="md:hidden text-white py-1 px-1 shadow-md text-xs" style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.green} 0%, ${BRAND_COLORS.darkGreen} 100%)` }}>
        
        {/* Top Row: Shop Badge + Promo Message */}
        <div className="flex items-center gap-1.5 mb-1">
          {/* Shop Online Badge */}
          <div 
            className="flex-shrink-0 rounded-md overflow-hidden px-2 py-1 transition-all duration-300" 
            style={{ 
              background: `linear-gradient(135deg, ${BRAND_COLORS.red} 0%, ${BRAND_COLORS.darkRed} 100%)`,
            }}
          >
         
            
            <div className="flex items-center gap-1 relative z-10">
              <div style={{ transform: 'scale(0.8)' }}>
                <ShoppingBagIcon animate={bagBounce} />
              </div>
              <span 
                className="text-white font-bold text-xs whitespace-nowrap"
                style={{ 
                  animation: 'slideIn 0.8s ease-out, colorShift 3s infinite',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)'
                }}
              >
                SHOP & SAVE BIG
              </span>
            </div>
          </div>

          {/* Promo Animation */}
          <div className="flex-1 relative h-6 overflow-hidden rounded-md py-4" style={{ background: `linear-gradient(135deg, #68D391 0%, #38A169 100%)` }}>
            <div className="absolute inset-0 flex items-center justify-center px-1">
              <div
                className={`transform transition-all duration-300 ${
                  isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
                }`}
              >
                <div className="font-semibold text-center text-xs leading-tight" style={{ textShadow: '3px 3px 5px rgba(0, 0, 0, 0.5)' }}>
                  {promoMessages[currentMessageIndex]}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Contact */}
        <div className="rounded backdrop-blur-sm px-1.5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
          <div className="text-white font-medium text-xs mb-0.5 text-center">Need Help? Contact Us</div>
          <div className="flex items-center justify-center gap-1.5">
            <a
              href="tel:+233302225651"
              className="flex items-center text-white rounded px-1.5 py-0.5"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <PhoneIcon />
              <span className="font-semibold text-xs ml-0.5">0302225651</span>
            </a>

            <a
              href="https://wa.me/233246422338"
              className="flex items-center text-white rounded px-1.5 py-0.5"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              <span className="font-semibold text-xs ml-0.5">0246422338</span>
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

        @keyframes bag-bounce {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-4px) rotate(-5deg);
          }
          50% {
            transform: translateY(0) rotate(0deg);
          }
          75% {
            transform: translateY(-2px) rotate(5deg);
          }
        }

        .bag-bounce {
          animation: bag-bounce 0.5s ease-in-out;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }

        @keyframes slideIn {
          0% {
            transform: translateX(-10px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes backgroundPulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes colorShift {
          0%, 100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.2);
          }
        }
      `}</style>
    </>
  );
};

export default AnnouncementBar;