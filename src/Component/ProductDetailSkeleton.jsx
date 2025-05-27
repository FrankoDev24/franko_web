import React from "react";

const ProductDetailSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-pulse space-y-16">
      {/* Top Section: Image + Info */}
      <div className="grid lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="flex justify-center items-start">
          <div className="rounded-2xl bg-gray-200 w-full h-full" />
        </div>

        {/* Product Info */}
        <div className="space-y-5 w-full">
          <div className="h-6 bg-gray-300 rounded w-3/4" /> {/* Title */}
          <div className="flex items-center gap-4">
            <div className="h-8 w-24 bg-gray-300 rounded-xl" />
            <div className="h-4 w-16 bg-gray-300 rounded" />
          </div>
          <div className="h-5 w-32 bg-gray-300 rounded" /> {/* Stock */}

          {/* Product Description */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="h-5 w-40 bg-gray-300 rounded" />
              <div className="w-10 h-10 bg-gray-300 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-4/6" />
            </div>
          </div>

          {/* Buttons */}
          <div className="hidden md:flex gap-4 pt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-300 rounded-2xl w-40" />
            ))}
          </div>
        </div>
      </div>

      {/* Feature Icons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-6 h-6 bg-gray-300 rounded-full" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-24" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Recently Viewed */}
      <div>
        <div className="h-6 w-40 bg-gray-300 rounded mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="border rounded-2xl p-4 bg-white shadow space-y-3"
            >
              <div className="h-40 bg-gray-200 rounded-xl" />
              <div className="h-4 bg-gray-300 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* Related Products */}
      <div>
        <div className="h-6 w-40 bg-gray-300 rounded mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="border rounded-2xl p-4 bg-white shadow space-y-3"
            >
              <div className="h-40 bg-gray-200 rounded-xl" />
              <div className="h-4 bg-gray-300 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
