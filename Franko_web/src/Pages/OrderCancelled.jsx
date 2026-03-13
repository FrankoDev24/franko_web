import React, { useEffect, useState } from "react";
import { XCircle, AlertTriangle, ShoppingCart, RefreshCw, HelpCircle } from "lucide-react";

function Cancellation() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleTryAgain = () => {
    window.location.href = "/checkout";
  };
  
  const handleContinueShopping = () => {
    window.location.href = "/";
  };

  const handleContactSupport = () => {
    window.location.href = "/contact";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br  px-4  flex items-center justify-center relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-red-100 rounded-full opacity-20 blur-2xl"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-100 rounded-full opacity-20 blur-3xl"></div>

      <div className={`max-w-lg w-full transform transition-all duration-700 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          
          {/* Header Section */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-5"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-3 shadow-lg">
                <XCircle className="w-10 h-10 text-red-600 animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Payment Unsuccessful</h1>
        
            </div>
          </div>

          {/* Content Section */}
          <div className="px-6 py-6">
            
            {/* Possible Reasons */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-amber-900 font-semibold text-sm mb-2">Possible reasons:</p>
                  <ul className="space-y-1.5 text-amber-800 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span>Payment was not approved on your mobile device</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span>Insufficient balance or incorrect PIN</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span>Network connectivity issues</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-5">
              <button
                onClick={handleTryAgain}
                className="group w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                <span>Try Payment Again</span>
              </button>
              
              <button
                onClick={handleContinueShopping}
                className="group w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Continue Shopping</span>
              </button>
            </div>

            {/* Support Link */}
            <div className="pt-4 border-t border-gray-200 text-center">
              <button 
                onClick={handleContactSupport}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors group"
              >
                <HelpCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="underline underline-offset-2">Need help? Contact Support</span>
              </button>
            </div>
          </div>
        </div>

       
      </div>
    </div>
  );
}

export default Cancellation;