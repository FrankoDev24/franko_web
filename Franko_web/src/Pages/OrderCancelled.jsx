import React, { useEffect, useState } from "react";
import { XCircle, AlertTriangle, ArrowLeft, ShoppingCart, RefreshCw } from "lucide-react";

function Cancellation() {
  // Navigation functions using window.location for direct page navigation
  const handleTryAgain = () => {
    // Navigate to checkout page
    window.location.href = "/checkout";
  };
  
  const handleContinueShopping = () => {
    // Navigate to home page
    window.location.href = "/";
  };

  const handleContactSupport = () => {
    // Navigate to contact us page
    window.location.href = "/contact";
  };

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // Animated failure icon component
  const FailureAnimation = () => (
    <div className="relative mb-6">
      <div className="animate-pulse">
        <XCircle className="w-20 h-20 text-red-500 mx-auto" />
      </div>
      <div className="absolute inset-0 animate-ping">
        <XCircle className="w-20 h-20 text-red-300 mx-auto opacity-30" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br px-2 lg:px-2 flex items-center justify-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-red-100 rounded-full opacity-20 animate-bounce"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-red-200 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-red-150 rounded-full opacity-15 animate-ping"></div>

      <div className={`max-w-2xl w-full transform transition-all duration-700 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl p-8 sm:p-12 border border-red-100 relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-red-50 opacity-50 rounded-3xl"></div>
          
          <div className="relative z-10 text-center">
            {/* Animated failure icon */}
            <FailureAnimation />

            <h1 className="text-xl md:text-2xl font-black text-gray-800 mb-4 tracking-tight">
              Payment <span className="text-red-600">Failed</span>
            </h1>
            
            <p className="text-gray-600 text-sm md:text-lg mb-3 leading-relaxed max-w-lg mx-auto">
              We couldn't process your payment. Don't worry - no charges have been made to your account.
            </p>

            {/* Enhanced info box */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 mb-8 text-left shadow-sm">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-800 font-semibold mb-3 text-lg">What happened?</p>
                  <div className="space-y-2 text-amber-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                      <span>Payment method declined or insufficient funds</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                      <span>Network connection issues</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                      <span>Expired card or incorrect details</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced action buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                className="group bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold py-4 px-8 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
                onClick={handleTryAgain}
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                <span>Try Different Payment</span>
              </button>
              
              <button
                className="group bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-4 px-8 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
                onClick={handleContinueShopping}
              >
                <ShoppingCart className="w-5 h-5 group-hover:bounce" />
                <span>Continue Shopping</span>
              </button>
            </div>

            {/* Additional help section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-gray-500 text-sm mb-3">
                Still having trouble? Our support team is here to help.
              </p>
              <button 
                className="text-blue-600 hover:text-blue-700 font-medium text-sm underline underline-offset-2 transition-colors"
                onClick={handleContactSupport}
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cancellation;