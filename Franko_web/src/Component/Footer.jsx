import React from 'react';
import { Input, Button } from 'antd';
import { MailOutlined, FacebookOutlined, TwitterOutlined, PhoneOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { FaTiktok, FaWhatsapp } from 'react-icons/fa';
import app from "../assets/apps.png"
import play from "../assets/plays.png"
import logo from "../assets/frankoIcon.png";

const Footer = () => {
  return (
    <footer className="w-full bg-gray-800  text-white">
      {/* Newsletter Section */}
     
      {/* Main Footer */}
      <div className="mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 py-1 px-6">
        {/* Company Info */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <img 
              src= {logo}
              alt="Franko Trading" 
              className="h-16 mb-4 filter brightness-110" 
            />
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Ghana's premier destination for phones and electronic devices. 
              Quality products, unbeatable prices.
            </p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50">
            <div className="flex items-center gap-2 mb-3">
              <PhoneOutlined className="text-green-400" />
              <p className="text-sm font-semibold text-gray-200">Need Help?</p>
            </div>
            <a 
              href="tel:+233246422338" 
              className="text-white text-lg font-bold hover:text-green-400 transition-colors duration-300 block mb-3"
            >
              +233 246 422 338
            </a>
            <Button
              type="primary"
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 border-0 flex items-center gap-2 px-4 py-2 h-10 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300"
              onClick={() => window.open('https://wa.me/233246422338', '_blank')}
            >
              <FaWhatsapp className="text-lg" />
              Chat with us
            </Button>
          </div>
        </div>

        {/* Links Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-bold text-white mb-4 text-base border-b border-green-600/30 pb-2">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/about" 
                  className="text-gray-300 hover:text-green-400 text-sm transition-colors duration-300 hover:translate-x-1 inline-block"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  to="/shops" 
                  className="text-gray-300 hover:text-green-400 text-sm transition-colors duration-300 hover:translate-x-1 inline-block"
                >
                  Shops
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-gray-300 hover:text-green-400 text-sm transition-colors duration-300 hover:translate-x-1 inline-block"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="text-gray-300 hover:text-green-400 text-sm transition-colors duration-300 hover:translate-x-1 inline-block"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 text-base border-b border-green-600/30 pb-2">Account</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/account" 
                  className="text-gray-300 hover:text-green-400 text-sm transition-colors duration-300 hover:translate-x-1 inline-block"
                >
                  My Account
                </Link>
              </li>
               <li>
                <Link 
                  to="/wishlist" 
                  className="text-gray-300 hover:text-green-400 text-sm transition-colors duration-300 hover:translate-x-1 inline-block"
                >
                 My Wishlist
                </Link>
              </li>
              <li>
                <Link 
                  to="/sign-up" 
                  className="text-gray-300 hover:text-green-400 text-sm transition-colors duration-300 hover:translate-x-1 inline-block"
                >
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 text-base border-b border-green-600/30 pb-2">Orders</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/order-history" 
                  className="text-gray-300 hover:text-green-400 text-sm transition-colors duration-300 hover:translate-x-1 inline-block"
                >
                  Order History
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* App Download Section */}
      <div className="flex flex-row items-center space-y-6 mt-82 lg:mt-0">
  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50">
    <h4 className="font-bold text-white mb-3 text-base">Download Our App</h4>
    <p className="text-gray-300 text-sm mb-6 leading-relaxed">
      Get exclusive deals and faster checkout.
    </p>

    {/* Make buttons display side by side */}
    <div className="flex flex-row space-x-4">
      <a
        href="https://apps.apple.com/us/app/franko-trading/id6741319907"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center px-4 py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 group"
      >
        <img
          src={app}
          alt="Download on the App Store"
          className="h-12 w-auto object-contain group-hover:brightness-110 transition-all duration-300"
        />
      </a>

      <a
        href="https://play.google.com/store/apps/details?id=com.poldark.mrfranky2"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center px-4 py-1 rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 group"
      >
        <img
          src={play}
          alt="Download on Google Play"
          className="h-12 w-auto object-contain group-hover:brightness-110 transition-all duration-300"
        />
      </a>
    </div>
  </div>
</div>

      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
        <div className=" mx-auto flex flex-col md:flex-row justify-between items-center py-2 px-6">
          
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <span className="text-gray-500 text-sm hidden md:block">Follow us:</span>
            <div className="flex gap-4">
              <a 
                href="https://www.facebook.com/frankotradingenterprise" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-blue-600 p-3 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                <FacebookOutlined className="text-lg hover:text-white" />
              </a>
              <a 
                href="https://x.com/frankotrading1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-blue-400 p-3 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                <TwitterOutlined className="text-lg hover:text-white" />
              </a>
              <a 
                href="https://www.tiktok.com/@frankotrading" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-pink-600 p-3 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                <FaTiktok className="text-lg hover:text-white" />
              </a>
            </div>
            
          </div>
          <div className="text-gray-400 text-sm">
            © 2024 Franko Trading Ltd. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;