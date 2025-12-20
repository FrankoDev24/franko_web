import React, { useState, useEffect } from "react"

const BRAND_COLORS = {
  green: '#38A169',
  darkGreen: '#2F855A',
  white: '#FFFFFF',
};

const promoMessages = [
  "FREE DELIVERY WITHIN ACCRA & KUMASI",
  "ON ALL PRODUCTS PURCHASED ONLINE",
  "SAVE MORE WITH FREE DELIVERY",
];

const AnnouncementBar = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showLeftElement, setShowLeftElement] = useState(false);
  const [showRightElement, setShowRightElement] = useState(false);

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

  useEffect(() => {
    setTimeout(() => setShowLeftElement(true), 100);
    setTimeout(() => setShowRightElement(true), 300);
  }, []);

  const ShoppingCartIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  );

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

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex text-white px-2 py-0.5 items-center gap-2 shadow-xl text-lg" style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.green} 0%, ${BRAND_COLORS.darkGreen} 100%)` }}>
        
        {/* Free Delivery Promo */}
        <div 
          className={`flex-1 relative h-9 overflow-hidden rounded-lg transition-all duration-700 delay-300 ${showLeftElement ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
          style={{ background: `linear-gradient(135deg, #68D391 0%, #38A169 100%)` }}
        >
          <div className="absolute inset-0 flex items-center justify-center px-2">
            <div className={`transform transition-all duration-300 ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}>
              <div className="font-semibold text-center text-lg flex items-center gap-1" style={{ textShadow: '5px 8px 6px rgba(0, 0, 0, 0.5)' }}>
                <ShoppingCartIcon size={14} />
                {promoMessages[currentMessageIndex]}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div 
          className={`flex-shrink-0 rounded backdrop-blur-sm px-2 transition-all duration-700 delay-500 ${showRightElement ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
        >
          <div className="text-white font-semibold text-xs mb-0.5 text-center">Need Help? Contact Us</div>
          <div className="flex items-center gap-1.5">
            <a
              href="tel:+233302225651"
              className="flex items-center text-white transition-all duration-200 hover:scale-105 rounded px-1.5 py-0.5"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <PhoneIcon />
              <span className="font-semibold text-xs ml-1">0302225651</span>
            </a>

            <a
              href="https://wa.me/233555939311"
              className="flex items-center text-white transition-all duration-200 hover:scale-105 rounded px-1.5 py-0.5"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              <span className="font-semibold text-xs ml-1">0555939311</span>
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden text-white px-2 shadow-md text-xs" style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.green} 0%, ${BRAND_COLORS.darkGreen} 100%)` }}>
        
        {/* Free Delivery Promo */}
        <div 
          className={`relative h-7 overflow-hidden rounded-md mb-1 transition-all duration-700 delay-200 ${showLeftElement ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
          style={{ background: `linear-gradient(135deg, #68D391 0%, #38A169 100%)` }}
        >
          <div className="absolute inset-0 flex items-center justify-center px-1">
            <div className={`transform transition-all duration-300 ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}>
              <div className="font-semibold text-center text-sm leading-tight flex items-center gap-1" style={{ textShadow: '4px 5px 4px rgba(0, 0, 0, 0.5)' }}>
                <ShoppingCartIcon size={12} />
                {promoMessages[currentMessageIndex]}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div 
          className={`rounded backdrop-blur-sm px-1.5 transition-all duration-700 delay-400 ${showRightElement ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
        >
          <div className="text-white font-medium text-xs mb-0.5 text-center">Need Help? Contact Us!</div>
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
              href="https://wa.me/233555939311"
              className="flex items-center text-white rounded px-1.5 py-0.5"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              <span className="font-semibold text-xs ml-0.5">0555939311</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnnouncementBar;
