import React from "react";
import { Typography } from "@material-tailwind/react";
import { PhoneIcon } from "@heroicons/react/24/outline";

const promoMessages = [
  "🎉 FRANKO EASTER SALE!",
  "🔥 UP TO -40%",
  "🚚 FREE DELIVERY ON SELECTED ITEMS",
  "📻 TUNE IN TO FRANKO RADIO FOR TECH UPDATES!",
  "🎁 SHOP NOW WHILE STOCK LASTS!"
];

const AnnouncementBar = () => {
  return (
    <div className="w-full flex items-center h-8 bg-green-400 text-white shadow-md overflow-hidden">
      {/* Marquee Section */}
      <div className="flex-1 overflow-hidden">
        <div className="flex animate-marquee gap-8 w-max">
          {[...promoMessages, ...promoMessages].map((msg, index) => (
            <Typography
              key={index}
              className="font-semibold text-xs sm:text-sm md:text-base px-4 min-w-max"
            >
              {msg}
            </Typography>
          ))}
        </div>
      </div>

      {/* Call to Order Box */}
      <div className="bg-green-100 text-green-800 px-2 py-1 h-full flex items-center justify-center rounded-l-xl shadow-inner min-w-[180px] md:min-w-[210px]">
        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm md:text-base font-medium">
          <PhoneIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sm:inline">Call to Order</span>
          <span className="font-bold text-green-900">030 274 0642</span>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
