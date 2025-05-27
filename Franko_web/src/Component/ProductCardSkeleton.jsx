import React from "react";

const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-md min-w-[160px] md:min-w-[220px] lg:min-w-[250px] p-3 animate-pulse">
      <div className="h-40 bg-gray-200 rounded mb-2" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );
};

export default ProductCardSkeleton;
