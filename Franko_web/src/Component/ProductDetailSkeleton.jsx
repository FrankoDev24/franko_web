import React from "react";

const ProductDetailSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-pulse space-y-16">
      {/* Top Section: Image + Info */}
      <div className="grid lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="flex justify-center items-start">
          <div className="rounded-2xl bg-gray-200 w-full h-96" />
        </div>

        {/* Product Info */}
        <div className="space-y-6 w-full">
          {/* Product Title */}
          <div className="h-8 bg-gray-300 rounded w-3/4" />
          
          {/* Price Section */}
          <div className="flex items-center gap-4">
            <div className="h-10 w-28 bg-gray-300 rounded-xl" />
            <div className="h-6 w-20 bg-gray-200 rounded" />
          </div>
          
          {/* Stock Status */}
          <div className="h-5 w-32 bg-gray-300 rounded" />

          {/* Product Description Section */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="h-6 w-40 bg-gray-300 rounded" />
              <div className="w-8 h-8 bg-gray-300 rounded-full" />
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-4/6" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <div className="h-12 bg-gray-300 rounded-2xl flex-1" />
            <div className="h-12 bg-gray-200 rounded-2xl w-full sm:w-40" />
            <div className="h-12 bg-gray-200 rounded-2xl w-full sm:w-40" />
          </div>

          {/* Mobile Action Buttons */}
          <div className="sm:hidden flex gap-3 pt-4">
            <div className="h-12 bg-gray-300 rounded-2xl flex-1" />
            <div className="h-12 w-12 bg-gray-200 rounded-2xl" />
            <div className="h-12 w-12 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Feature Icons Section */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-gray-300 rounded-full" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-20 mx-auto" />
              <div className="h-3 bg-gray-200 rounded w-16 mx-auto" />
            </div>
          </div>
        ))}
      </div>

    

      {/* Recently Viewed Products */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 bg-gray-300 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="group bg-white rounded-2xl shadow-md overflow-hidden space-y-3"
            >
              <div className="h-40 bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4" />
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-gray-300 rounded w-16" />
                  <div className="h-3 bg-gray-200 rounded w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related Products */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 bg-gray-300 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="group bg-white rounded-2xl shadow-md overflow-hidden space-y-3"
            >
              <div className="relative">
                <div className="h-40 bg-gray-200" />
                {/* Sale badge skeleton */}
                {i % 3 === 0 && (
                  <div className="absolute top-2 left-2 w-12 h-12 bg-gray-300 rounded-full" />
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4" />
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 bg-gray-300 rounded w-16" />
                  <div className="h-3 bg-gray-200 rounded w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    
    </div>
  );
};

export default ProductDetailSkeleton;