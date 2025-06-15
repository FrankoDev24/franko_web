import React from "react";
import { Typography } from "@material-tailwind/react";
import { PhoneIcon } from "@heroicons/react/24/outline";
import { PhoneOutlined,   WhatsAppOutlined, } from "@ant-design/icons";
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
      <div className="hidden md:flex items-center justify-between px-2 ">
        {/* Marquee Section */}
        <div className="flex-1 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap" style={{animation: 'marquee 65s linear infinite'}}>
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
     <p className="text-white text-sm flex items-center">
              <PhoneOutlined className="mr-2" />
              <a href="tel:+233302225651" className="text-white hover:text-gray-200 transition">
                +233302225651
              </a>
            </p>
            {/* WhatsApp */}
             <p className="text-white text-sm flex items-center">
  <WhatsAppOutlined className="mr-2" />
  <a
    href="https://wa.me/233246422338"
    target="_blank"
    rel="noopener noreferrer"
    className="text-white hover:text-gray-200 transition"
  >
    +233246422338
  </a>
</p>

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
   <p className="text-white text-sm flex items-center">
              <PhoneOutlined className="mr-2" />
              <a href="tel:+233302225651" className="text-white hover:text-gray-200 transition">
                +233302225651
              </a>
            </p>
    
    {/* WhatsApp - Clickable */}
             <p className="text-white text-sm flex items-center">
  <WhatsAppOutlined className="mr-2" />
  <a
    href="https://wa.me/233246422338"
    target="_blank"
    rel="noopener noreferrer"
    className="text-white hover:text-gray-200 transition"
  >
    +233246422338
  </a>
</p>

  </div>
</div>
      </div>
  </div>
    </>
  );
};

export default AnnouncementBar;