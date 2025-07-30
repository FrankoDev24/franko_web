import React, { useState, useEffect } from 'react';
import { Typography } from "@material-tailwind/react";
import { PhoneOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { Zap, Clock, ShoppingCart } from 'lucide-react';

const AnnouncementBar = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [urgencyPulse, setUrgencyPulse] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const promoDate = new Date('2025-07-31T00:00:00').getTime(); // Tomorrow
      const distance = promoDate - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const pulseTimer = setInterval(() => {
      setPulseAnimation(true);
      setTimeout(() => setPulseAnimation(false), 1000);
    }, 2000);

    return () => clearInterval(pulseTimer);
  }, []);

  useEffect(() => {
    const urgencyTimer = setInterval(() => {
      setUrgencyPulse(true);
      setTimeout(() => setUrgencyPulse(false), 800);
    }, 1500);

    return () => clearInterval(urgencyTimer);
  }, []);

  const isPromoActive = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div className="w-full bg-gradient-to-br from-orange-200 via-yellow-600 to-orange-400 shadow-2xl overflow-hidden relative hover:scale-[1.01] transition-transform duration-300">
      {/* Enhanced Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-2 left-4 w-8 h-8 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-yellow-300 rounded-full animate-bounce shadow-lg"></div>
        <div className="absolute top-3 right-6 w-6 h-6 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-pink-300 rounded-full animate-pulse shadow-lg"></div>
        <div className="absolute bottom-3 left-1/4 w-4 h-4 md:w-8 md:h-8 lg:w-12 lg:h-12 bg-green-300 rounded-full animate-spin shadow-lg"></div>
        <div className="absolute top-1/2 right-1/3 w-3 h-3 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-orange-300 rounded-full animate-bounce shadow-lg"></div>
        <div className="absolute bottom-2 right-4 w-6 h-6 md:w-12 md:h-12 bg-purple-300 rounded-full animate-pulse shadow-lg"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 px-1">
        <div className="mx-auto">
          
          {/* Mobile Layout - Flex and Compact */}
          <div className="block md:hidden py-1">
            <div className="flex  gap-2">
              {/* Left: Cashback Title */}
              <div className="flex items-center">
                <div className={`flex items-center space-x-1 ${pulseAnimation ? 'animate-pulse scale-110' : ''} transition-transform duration-500`}>
                  <Zap className="text-yellow-300 w-6 h-6 animate-bounce drop-shadow-2xl" />
                  <div className="text-left">
                    <div className="text-red-600 font-extrabold text-xl tracking-wider drop-shadow-2xl leading-tight">
                      CASHBACK
                    </div>
                    <h2 className={`text-black font-black text-lg tracking-widest ${urgencyPulse ? 'animate-bounce scale-110' : 'animate-pulse'} transition-all duration-300`}>
                      PROMO!
                    </h2>
                  </div>
                </div>
              </div>

              {/* Center: Countdown Timer */}
              <div className="flex flex-col items-center">
                <div className="text-black text-center">
                  <p className="text-xs font-bold animate-pulse">
                    {isPromoActive ? "🔥 LIVE! 🔥" : "⏰ STARTS IN"}
                  </p>
                </div>
                {!isPromoActive && (
                  <div className="flex items-center space-x-1 bg-black/50 backdrop-blur-lg rounded-lg px-2 py-1 border border-yellow-400 shadow-xl">
                    <Clock className="text-yellow-300 w-3 h-3 animate-spin drop-shadow-lg" />
                    <div className="flex items-center space-x-1 text-white font-black">
                      <div className="text-center bg-yellow-400/20 rounded px-1">
                        <div className="text-xs text-yellow-300 animate-pulse font-mono">
                          {timeLeft.days.toString().padStart(2, '0')}
                        </div>
                        <div className="text-[9px] uppercase text-yellow-200">D</div>
                      </div>
                      <span className="text-yellow-300 text-xs">:</span>
                      <div className="text-center bg-yellow-400/20 rounded px-1">
                        <div className="text-xs text-yellow-300 animate-pulse font-mono">
                          {timeLeft.hours.toString().padStart(2, '0')}
                        </div>
                        <div className="text-[9px] uppercase text-yellow-200">H</div>
                      </div>
                      <span className="text-yellow-300 text-xs">:</span>
                      <div className="text-center bg-yellow-400/20 rounded px-1">
                        <div className="text-xs text-yellow-300 animate-pulse font-mono">
                          {timeLeft.minutes.toString().padStart(2, '0')}
                        </div>
                        <div className="text-[9px] uppercase text-yellow-200">M</div>
                      </div>
                    </div>
                  </div>
                )}
                {isPromoActive && (
                  <div className="bg-gradient-to-r from-green-500 to-yellow-500 text-black font-black text-xs px-2 py-1 rounded-lg animate-bounce shadow-xl">
                    🎉 ACTIVE! 🎉
                  </div>
                )}
              </div>

              {/* Right: Shop Now Button */}
              <div className="flex items-center">
                <button 
                  onClick={() => window.location.href = '/cashback-deals'}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white font-black text-xs uppercase tracking-wide px-3 py-2 rounded-full border-2 border-white shadow-xl transform hover:scale-105 transition-all duration-300 animate-pulse flex items-center space-x-1"
                >
                  <ShoppingCart className="w-3 h-3 animate-bounce" />
                  <span>SHOP</span>
                </button>
              </div>
            </div>

            {/* Mobile Second Row - Badges and Contact */}
            <div className="flex items-center justify-between mt-2 gap-2">
              {/* Left: Product badges */}
              <div className="flex flex-wrap gap-1">
                <span className="text-black text-[10px] font-bold uppercase bg-white/80 px-2 py-0.5 rounded-full border border-red-600">
                  ONLINE ONLY
                </span>
                <span className="text-white text-[10px] font-bold uppercase bg-red-600/70 px-2 py-0.5 rounded-full">
                 24 HOURS ONLY
                </span>
              </div>

              {/* Right: Contact */}
              <div className="bg-black/50 backdrop-blur-lg rounded-lg px-2 py-1 border border-yellow-400 shadow-xl">
                <div className=" text-yellow-300 text-xs">
                 Need Help? Contact Us! 
                </div>
                <div className="flex items-center space-x-2">
                  
                  <div className="text-yellow-300 text-xs flex items-center hover:text-yellow-100 transition-all duration-300 transform hover:scale-110 cursor-pointer group">
                    <PhoneOutlined className="mr-1 text-yellow-400 text-sm group-hover:animate-bounce" />
                    <a href="tel:+233302225651" className="text-yellow-300 hover:text-yellow-100 transition-all font-bold">
                      Call
                    </a>
                  </div>
                  
                  <div className="text-yellow-300 text-xs flex items-center hover:text-yellow-100 transition-all duration-300 transform hover:scale-110 cursor-pointer group">
                    <WhatsAppOutlined className="mr-1 text-green-400 text-sm group-hover:animate-bounce" />
                    <a
                      href="https://wa.me/233246422338"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yellow-300 hover:text-yellow-100 transition-all font-bold"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Unchanged */}
          <div className="hidden md:flex items-center justify-between gap-4">
            
            {/* Cashback Title - Desktop */}
            <div className="flex items-center justify-start w-auto">
              <div className={`flex items-center space-x-3 ${pulseAnimation ? 'animate-pulse scale-110' : ''} transition-transform duration-500`}>
                <Zap className="text-yellow-300 w-12 h-12 animate-bounce drop-shadow-2xl" />
                <div className="text-left">
                  <h1 className="text-red-600 font-black text-5xl lg:text-5xl tracking-wider drop-shadow-2xl leading-tight">
                   CASHBACK
                  </h1>
                  <h2 className={`text-black font-black text-4xl lg:text-5xl tracking-widest ${urgencyPulse ? 'animate-bounce scale-110' : 'animate-pulse'} transition-all duration-300`}>
                    PROMO!
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-yellow-200 text-sm font-bold uppercase tracking-wide bg-pink-800/60 px-2 py-1 rounded-full border border-yellow-400">
                      ONLINE PURCHASE ONLY
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className="text-white text-sm font-bold uppercase tracking-wide bg-green-600/70 px-2 py-1 rounded-full">
                        24 HOURS ONLY
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-white text-sm font-bold uppercase tracking-wide bg-red-600/70 px-2 py-1 rounded-full">
                        SELECTED PRODUCTS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Countdown Timer - Desktop */}
            <div className="flex items-center justify-center w-auto">
              <div className="flex flex-col items-center space-y-2">
                <div className="text-black text-center">
                  <p className="text-lg font-bold animate-pulse">
                    {isPromoActive ? "🔥 CASHBACK IS LIVE! 🔥" : "⏰ CASHBACK STARTS IN"}
                  </p>
                </div>
                {!isPromoActive && (
                  <div className="flex items-center space-x-3 bg-black/50 backdrop-blur-lg rounded-xl px-2 py-2 border-2 border-yellow-400 shadow-2xl">
                    <Clock className="text-yellow-300 w-6 h-6 animate-spin drop-shadow-lg" />
                    <div className="flex items-center space-x-2 text-white font-black">
                      <div className="text-center bg-yellow-400/20 rounded-lg px-2 py-1">
                        <div className="text-xl lg:text-2xl text-yellow-300 animate-pulse drop-shadow-lg font-mono">
                          {timeLeft.days.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs uppercase tracking-wider text-yellow-200">Day</div>
                      </div>
                      <span className="text-yellow-300 text-xl animate-pulse">:</span>
                      <div className="text-center bg-yellow-400/20 rounded-lg px-2 py-1">
                        <div className="text-xl lg:text-2xl text-yellow-300 animate-pulse drop-shadow-lg font-mono">
                          {timeLeft.hours.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs uppercase tracking-wider text-yellow-200">Hrs</div>
                      </div>
                      <span className="text-yellow-300 text-xl animate-pulse">:</span>
                      <div className="text-center bg-yellow-400/20 rounded-lg px-2 py-1">
                        <div className="text-xl lg:text-2xl text-yellow-300 animate-pulse drop-shadow-lg font-mono">
                          {timeLeft.minutes.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs uppercase tracking-wider text-yellow-200">Min</div>
                      </div>
                      <span className="text-yellow-300 text-xl animate-pulse">:</span>
                      <div className="text-center bg-yellow-400/20 rounded-lg px-2 py-1">
                        <div className="text-xl lg:text-2xl text-yellow-300 animate-pulse drop-shadow-lg font-mono">
                          {timeLeft.seconds.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs uppercase tracking-wider text-yellow-200">Sec</div>
                      </div>
                    </div>
                  </div>
                )}
                {isPromoActive && (
                  <div className="bg-gradient-to-r from-green-500 to-yellow-500 text-black font-black text-xl px-6 py-3 rounded-xl animate-bounce shadow-2xl">
                    🎉 CASHBACK NOW ACTIVE! 🎉
                  </div>
                )}
              </div>
            </div>
              <button 
                onClick={() => window.location.href = '/cashback-deals'}
                className="bg-gradient-to-r from-red-500 to-red-600  text-white font-black text-sm uppercase tracking-wide px-6 py-3 rounded-full border-2 border-white shadow-2xl transform hover:scale-105 transition-all duration-300 animate-pulse flex items-center space-x-2"
              >
                <ShoppingCart className="w-5 h-5 animate-bounce" />
                <span>SHOP NOW</span>
              </button>
              

            {/* Contact Section & Shop Now - Desktop */}
            <div className="flex flex-col items-center justify-center gap-2 w-auto">
              <div className="bg-black/50 backdrop-blur-lg rounded-xl px-4 py-3 border-2 border-yellow-400 shadow-2xl">
                <Typography variant="small" className="text-center mb-2 font-bold text-yellow-300 text-sm">
                  🎯 NEED HELP? CONTACT US! 🎯
                </Typography>
                
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-yellow-300 text-sm flex items-center hover:text-yellow-100 transition-all duration-300 transform hover:scale-110 cursor-pointer group">
                    <PhoneOutlined className="mr-2 text-yellow-400 text-lg group-hover:animate-bounce" />
                    <a href="tel:+233302225651" className="text-yellow-300 hover:text-yellow-100 transition-all font-bold">
                     Call
                    </a>
                  </div>
                  
                  <div className="text-yellow-300 text-sm flex items-center hover:text-yellow-100 transition-all duration-300 transform hover:scale-110 cursor-pointer group">
                    <WhatsAppOutlined className="mr-2 text-green-400 text-lg group-hover:animate-bounce" />
                    <a
                      href="https://wa.me/233246422338"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yellow-300 hover:text-yellow-100 transition-all font-bold"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Desktop Shop Now Button */}
            
              <div className="text-white text-sm font-semibold text-center">
                Don't miss out on our exclusive cashback offer! Shop now and enjoy amazing savings!
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Enhanced animated border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-pink-400 to-orange-400 animate-pulse shadow-lg"></div>
      
      {/* Enhanced floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/5 w-1 h-1 md:w-2 md:h-2 bg-yellow-300 rounded-full animate-ping shadow-lg"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-orange-300 rounded-full animate-pulse shadow-lg"></div>
        <div className="absolute bottom-1/3 left-1/2 w-1 h-1 md:w-1.5 md:h-1.5 bg-pink-300 rounded-full animate-bounce shadow-lg"></div>
        <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-green-300 rounded-full animate-ping shadow-lg"></div>
        <div className="absolute bottom-1/4 right-1/5 w-1 h-1 md:w-2 md:h-2 bg-purple-300 rounded-full animate-pulse shadow-lg"></div>
      </div>
    </div>
  );
};

export default AnnouncementBar;