import React from "react";
import { Typography } from "@material-tailwind/react";
import { PhoneIcon } from "@heroicons/react/24/outline";
import { FaWhatsapp } from "react-icons/fa";

const promoMessages = [
  "🎉 FRANKO EASTER SALE!",
  "🔥 UP TO -40%",
  "🚚 FREE DELIVERY ON SELECTED ITEMS",
  "📻 TUNE IN TO FRANKO RADIO FOR TECH UPDATES!",
  "🎁 SHOP NOW WHILE STOCK LASTS!",
];

const AnnouncementBar = () => {
  return (
    <>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
      <div className="bg-gradient-to-r from-red-500 to-red-400 text-white overflow-hidden">
      {/* Desktop Layout - Side by side */}
      <div className="hidden md:flex items-center justify-between px-2 py12">
        {/* Marquee Section */}
        <div className="flex-1 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap" style={{animation: 'marquee 25s linear infinite'}}>
            {[...promoMessages, ...promoMessages].map((msg, index) => (
              <span key={index} className="mx-5 text-sm font-medium">
                {msg}
              </span>
            ))}
          </div>
        </div>
        
        {/* Contact Section */}
        <div className="flex-shrink-0 ml-8">
          {/* Contact Us Heading */}
          <Typography variant="small" className="text-center mb-2 font-semibold">
            Need help? Contact us!
          </Typography>
          
          {/* Contact Details Row */}
          <div className="flex items-center space-x-4">
            {/* Call */}
            <div className="flex items-center space-x-2">
              <PhoneIcon className="h-4 w-4" />
              <span className="text-sm">030 274 0642</span>
            </div>
            
            {/* WhatsApp */}
            <div className="flex items-center space-x-2">
              <FaWhatsapp className="h-4 w-4" />
              <span className="text-sm">055 260 2605</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Stacked */}
      <div className="md:hidden">
        {/* Marquee Section */}
        <div className="overflow-hidden py-2">
          <div className="flex animate-marquee whitespace-nowrap" style={{animation: 'marquee 15s linear infinite'}}>
            {[...promoMessages, ...promoMessages].map((msg, index) => (
              <span key={index} className="mx-6 text-sm font-medium">
                {msg}
              </span>
            ))}
          </div>
        </div>
        
        {/* Contact Section Below Marquee */}
      {/* Contact Section Below Marquee */}
<div className="px-4 py-2 border-t border-white/20">
  {/* Contact Us Heading */}
  <Typography variant="small" className="text-center mb-2 font-semibold">
    Need help? Contact us!
  </Typography>
  
  {/* Contact Details Row */}
  <div className="flex items-center justify-center space-x-6">
    {/* Call - Clickable */}
    <a 
      href="tel:+233302740642" 
      className="flex items-center space-x-2 hover:text-blue-200 transition-colors duration-200 cursor-pointer group"
    >
      <PhoneIcon className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
      <span className="text-sm group-hover:underline">030 274 0642</span>
    </a>
    
    {/* WhatsApp - Clickable */}
    <a 
      href="https://wa.me/233552602605" 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center space-x-2 hover:text-green-200 transition-colors duration-200 cursor-pointer group"
    >
      <FaWhatsapp className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
      <span className="text-sm group-hover:underline">055 260 2605</span>
    </a>
  </div>
</div>
      </div>
  </div>
    </>
  );
};

export default AnnouncementBar;