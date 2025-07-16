import React, { useEffect } from 'react';
import { 
  Shield, 
Package, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  CreditCard,
  FileText,
  Info
} from "lucide-react";
import logo from "../assets/frankoIcon.png"
import { useNavigate } from 'react-router-dom';

function Terms() {
      const navigate = useNavigate();
       useEffect(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, []);

  const handleContactSupport = () => {
    navigate('/contact'); // Change '/support' to your desired route
  };

  return (
    <div className="min-h-screen  py-4 px-2">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 shadow-lg">
          <img src={logo} alt="Franko Trading" className="h-12 md:h-12 w-auto object-contain my-2" />
          </div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-4">
            FRANKO TRADING LIMITED
          </h1>
          <p className="text-sm md:text-md text-gray-600 max-w-2xl mx-auto">
            Your trusted partner in electronics. Review our terms and policies for a seamless shopping experience.
          </p>
        </div>

       

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Return Policy Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-4 py-2 md:py-6 rounded-t-2xl">
            <div className="flex items-center">
              <FileText className="w-4 md:w-8 h-8 text-white mr-4" />
              <h2 className="text-md font-bold text-white">RETURN POLICY</h2>
            </div>
          </div>

          <div className="p-8">
            {/* Policy Overview */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
              <div className="flex items-start">
                <Info className="w-6 h-6 text-blue-500 mr-3  flex-shrink-0" />
                <div>
                  <p className="text-sm md:text-md leading-relaxed text-gray-800">
                    Subject to Terms and Conditions, Franko Trading Enterprise offers returns and/or exchange or refund for items purchased within{" "}
                    <span className="font-bold text-red-600 bg-red-100 px-2 py-1 rounded">7 DAYS OF PURCHASE</span>. 
                    We do not accept returns and or exchange for any reason whatsoever after the stated period has elapsed.
                  </p>
                </div>
              </div>
            </div>

            {/* Eligibility Section */}
            <div className="mb-10">
              <h3 className="text-md md:text-lg font-bold text-gray-900 mb-6 flex items-center">
                <CheckCircle className="w-7 h-7 text-green-500 mr-3" />
                ELIGIBILITY FOR REFUND, RETURN, AND/OR EXCHANGE
              </h3>

              <div className="space-y-6">
                {/* Wrong Item Delivered */}
                <div className="border border-red-200 rounded-xl overflow-hidden bg-red-50">
                  <div className="bg-red-500 px-6 py-4">
                    <div className="flex items-center">
                      <XCircle className="w-6 h-6 text-white mr-3" />
                      <h4 className="text-md md:text-lg font-semibold text-white">WRONG ITEM DELIVERED</h4>
                    </div>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm ">The seals on the box must not be broken/opened.</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">There should be no dents and liquid intrusion on the item.</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">Proof of Purchase/Receipt must be provided.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Manufacturing Defects */}
                <div className="border border-green-200 rounded-xl overflow-hidden bg-green-50">
                  <div className="bg-green-500 px-6 py-4">
                    <div className="flex items-center">
                      <AlertTriangle className="w-6 h-6 text-white mr-3" />
                      <h4 className="text-md md:text-lg font-semibold text-white">MANUFACTURING DEFECTS</h4>
                    </div>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-green-400 text-sm rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">Within the 7 days, defective items would be replaced with the same piece/unit (depending on stock availability).</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-green-400 text-sm rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">All items shall go through inspection and diagnosis on return to verify the reason provided.</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-green-400 text-sm rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">Returns (defective items) after 7 days would be sent to the Brand's Service Centre for repairs under the Manufacturer Warranty.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Incomplete Package */}
                <div className="border border-yellow-200 rounded-xl overflow-hidden bg-yellow-50">
                  <div className="bg-yellow-700 px-6 py-4">
                    <div className="flex items-center">
                      <Package className="w-6 h-6 text-white mr-3" />
                      <h4 className="text-md md:text-lg font-semibold text-white">INCOMPLETE PACKAGE</h4>
                    </div>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-yellow-300 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">Incomplete package or missing complementary items must be reported within 7 days for immediate redress.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Refund Policy Section */}
            <div className="border-t border-gray-200 pt-10">
              <h3 className="text-md md:text-lg font-bold text-gray-900 mb-6 flex items-center">
                <CreditCard className="w-7 h-7 text-blue-500 mr-3" />
                REFUND/CHARGE BACK POLICY
              </h3>

              <div className="border border-blue-200 rounded-xl overflow-hidden bg-blue-50">
                <div className="bg-blue-500 px-6 py-4">
                  <div className="flex items-center">
                    <Package className="w-6 h-6 text-white mr-3" />
                    <h4 className="text-md md:text-lg font-semibold text-white">UNDELIVERED ORDER/PACKAGE</h4>
                  </div>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-700 text-sm">Refund/charge back request for undelivered orders will go through vetting and approval, with refunds made within 30 days.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-700 text-sm">Charge back requests must be initiated through customer's bank for payments made via credit card or other banking platforms.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-700 text-sm">Refunds will be made by cheque for accounting purposes.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="mt-10 bg-gray-50 rounded-xl p-6 text-center">
              <h4 className="text-md font-semibold text-gray-900 mb-2">Questions about our policies?</h4>
              <p className="text-gray-600 mb-4 text-sm">Our customer service team is here to help you understand our terms and assist with your needs.</p>
              <button onClick={handleContactSupport} className="bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center mx-auto">
                    
                <Shield className="w-5 h-5 mr-2" />
                Contact Support
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

export default Terms;