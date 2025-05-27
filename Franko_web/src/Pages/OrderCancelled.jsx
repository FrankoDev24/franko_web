import React from "react";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import { useWindowSize } from "@react-hook/window-size";

function Cancellation() {
  const navigate = useNavigate();
  const [width, height] = useWindowSize();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8 relative">
      {/* Confetti for visual feedback */}
      <Confetti width={width} height={height} numberOfPieces={150} recycle={false} />

      <div className="max-w-xl w-full bg-white shadow-2xl rounded-2xl p-8 border border-red-100">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-red-600 mb-3">
            Payment Unsuccessful
          </h1>
          <p className="text-gray-700 text-base sm:text-lg mb-6">
            Unfortunately, your order could not be completed due to a payment issue. Don't worry—your account has not been charged.
          </p>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md text-left">
            <p className="text-sm text-green-700 font-semibold mb-1">What you can do:</p>
            <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
              <li>Try again using a different payment option.</li>
              <li>Contact support if the problem persists.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              className="bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-lg hover:bg-gray-400 transition"
              onClick={() => navigate(-1)}
            >
              Try Again
            </button>
            <button
              className="bg-green-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-green-700 transition"
              onClick={() => navigate("/")}
            >
              Back to Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cancellation;
