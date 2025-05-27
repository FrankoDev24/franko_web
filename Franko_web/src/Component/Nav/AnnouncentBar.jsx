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
    <div className="w-full flex items-center h-10 bg-gradient-to-r from-green-500 via-green-400 to-green-600 text-white shadow-md overflow-hidden text-xs sm:text-sm md:text-base">
      {/* Marquee Section */}
      <div className="flex-1 overflow-hidden">
        <div className="flex animate-marquee gap-8 w-max">
          {[...promoMessages, ...promoMessages].map((msg, index) => (
            <Typography
              key={index}
              className="font-semibold px-4 min-w-max whitespace-nowrap"
            >
              {msg}
            </Typography>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="flex flex-col justify-center bg-white/80 text-green-800 h-full px-3 py-2 sm:px-4 sm:py-2 shadow-inner rounded-l-full">
        {/* Contact Us Heading */}
        <span className="font-semibold text-center text-[11px] sm:text-xs md:text-sm text-green-900 tracking-wide">
          Need help? Contact us!
        </span>

        {/* Contact Details Row */}
        <div className="flex items-center justify-center gap-4 mt-1">
          {/* Call */}
          <div className="flex items-center gap-1 hover:text-green-600 hover:underline cursor-pointer transition">
            <PhoneIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" />
            <span className="text-[11px] sm:text-sm font-medium">030 274 0642</span>
          </div>
          {/* WhatsApp */}
          <div className="flex items-center gap-1 hover:text-green-600 hover:underline cursor-pointer transition">
            <FaWhatsapp className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" />
            <span className="text-[11px] sm:text-sm font-medium">055 260 2605</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
