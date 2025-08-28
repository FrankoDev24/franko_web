import React, { useState, useEffect } from "react";
import { Typography } from "@material-tailwind/react";
import { PhoneOutlined, WhatsAppOutlined } from "@ant-design/icons";

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

  return (
    <>
      {/* Desktop Layout - Side by side */}
      <div className="hidden md:flex bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-white py-1 px-4 items-center justify-between shadow-lg">
        {/* Compact GIF Animation Section */}
        <div className="flex-1 relative h-10 overflow-hidden rounded-lg bg-gradient-to-r from-red-500 via-orange-500 to-red-600 shadow-inner">
          {/* Enhanced sparkle overlay */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          </div>
          
          {/* Animated message container */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`transform transition-all duration-300 ease-in-out ${
                isAnimating 
                  ? 'translate-y-0 opacity-100 scale-100' 
                  : 'translate-y-2 opacity-0 scale-95'
              }`}
            >
              <Typography
                variant="h1"
                className={`font-bold text-center px-2 leading-tight ${
                  promoMessages[currentMessageIndex] === "T&C APPLY"
                    ? "text-lg text-white font-bold" 
                    : "text-white text-base"
                }`}
                style={{
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                  letterSpacing: '0.3px'
                }}
              >
                {promoMessages[currentMessageIndex]}
              </Typography>
            </div>
          </div>
        </div>

        {/* Compact Contact Section */}
        <div className="flex-shrink-0 ml-4 bg-white/10 rounded-lg px-3 py-1 backdrop-blur-sm">
          <Typography variant="small" className="text-white font-medium text-xs mb-1 text-center">
           Need Help? Contact Us:
          </Typography>
          <div className="flex items-center space-x-3">
            <a
              href="tel:+233302225651"
              className="flex items-center text-white hover:text-yellow-300 transition-all duration-200 hover:scale-105 bg-white/20 rounded px-2 py-1"
            >
              <PhoneOutlined className="mr-1 text-sm" />
              <Typography variant="small" className="font-semibold text-sm">
                +233302225651
              </Typography>
            </a>

            <a
              href="https://wa.me/233246422338"
              className="flex items-center text-white hover:text-green-300 transition-all duration-200 hover:scale-105 bg-white/20 rounded px-2 py-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppOutlined className="mr-1 text-sm" />
              <Typography variant="small" className="font-semibold text-sm">
                +233246422338
              </Typography>
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Stacked */}
      <div className="md:hidden bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-white py-1 px-3 shadow-lg">
        {/* Compact Mobile GIF Animation Section */}
        <div className="relative h-10 overflow-hidden rounded-lg bg-gradient-to-r from-red-500 via-orange-500 to-red-600 shadow-inner mb-2">
          {/* Enhanced sparkle overlay */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          </div>
          
          {/* Animated message container */}
          <div className="absolute inset-0 flex items-center justify-center px-2">
            <div
              className={`transform transition-all duration-300 ease-in-out ${
                isAnimating 
                  ? 'translate-y-0 opacity-100 scale-100' 
                  : 'translate-y-2 opacity-0 scale-95'
              }`}
            >
              <Typography
                variant="small"
                className={`font-bold text-center leading-tight ${
                  promoMessages[currentMessageIndex] === "T&C APPLY" 
                    ? "text-lg text-white font-bold" 
                    : "text-white text-base"
                }`}
                style={{
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                  letterSpacing: '0.2px'
                }}
              >
                {promoMessages[currentMessageIndex]}
              </Typography>
            </div>
          </div>
        </div>

        {/* Compact Mobile Contact Section */}
        <div className="text-center bg-white/10 rounded-lg px-3 backdrop-blur-sm">
          <Typography variant="small" className="text-white font-medium text-xs mb-1">
            Need Help? Contact Us:
          </Typography>
          <div className="flex items-center justify-center space-x-3">
            <a
              href="tel:+233302225651"
              className="flex items-center text-white hover:text-yellow-300 transition-all duration-200 hover:scale-105 bg-white/20 rounded px-2 py-1"
            >
              <PhoneOutlined className="mr-1 text-sm" />
              <Typography variant="small" className="font-semibold text-sm">
                +233302225651
              </Typography>
            </a>

            <a
              href="https://wa.me/233246422338"
              className="flex items-center text-white hover:text-green-300 transition-all duration-200 hover:scale-105 bg-white/20 rounded px-2 py-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppOutlined className="mr-1 text-sm" />
              <Typography variant="small" className="font-semibold text-sm">
                +233246422338
              </Typography>
            </a>
          </div>
        </div>
      </div>

      {/* Enhanced Custom CSS for animations */}
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

        /* Prevent flash of unstyled content */
        .transition-all {
          will-change: transform, opacity;
        }
      `}</style>
    </>
  );
};

export default AnnouncementBar;