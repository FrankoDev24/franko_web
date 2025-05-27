import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByBrand } from "../Redux/Slice/productSlice";
import { fetchBrands } from "../Redux/Slice/brandSlice";
import { FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@material-tailwind/react";
import ProductCard from "../Component/ProductCard";
import { CircularPagination } from "../Component/CircularPagination";
import gif from "../assets/no.gif";

const Brand = () => {
  const { brandId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { brandProducts, loading } = useSelector((state) => state.products);
  const { brands } = useSelector((state) => state.brands);
  

  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [showDiscountedOnly, setShowDiscountedOnly] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(fetchBrands());
    dispatch(fetchProductsByBrand(brandId));
  }, [dispatch, brandId]);

  const selectedBrand = brands.find((brand) => brand.brandId === brandId);
  const filteredBrands = selectedBrand
    ? brands.filter((b) => b.categoryId === selectedBrand.categoryId)
    : [];
    const filteredProducts = (brandProducts || [])
    .filter((p) => {
      const withinRange = p.price >= priceRange[0] && p.price <= priceRange[1];
      const hasDiscount = showDiscountedOnly ? p.oldPrice > p.price : true;
      return withinRange && hasDiscount;
    })
    .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
  
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  

  const renderFilterContent = () => (
    <div className="w-full md:w-72 space-y-6">
      <h3 className="hidden md:block md:text-lg font-semibold">Filters</h3>

      {/* Price Slider */}
      <div>
        <p className="text-sm text-gray-600 mb-2">
          Price Range: ₵{priceRange[0]} - ₵{priceRange[1]}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="200000"
            step="1000"
            value={priceRange[0]}
            onChange={(e) =>
              setPriceRange([
                Math.min(+e.target.value, priceRange[1] - 1000),
                priceRange[1],
              ])
            }
            className="w-full accent-green-500"
          />
          <input
            type="range"
            min="0"
            max="200000"
            step="1000"
            value={priceRange[1]}
            onChange={(e) =>
              setPriceRange([
                priceRange[0],
                Math.max(+e.target.value, priceRange[0] + 1000),
              ])
            }
            className="w-full accent-green-500"
          />
        </div>
      </div>

      {/* Discount Toggle */}
      <div className="flex justify-between items-center">
        <label htmlFor="discount-toggle" className="text-sm font-medium">
          Discounted only
        </label>
        <input
          type="checkbox"
          id="discount-toggle"
          checked={showDiscountedOnly}
          onChange={() => setShowDiscountedOnly(!showDiscountedOnly)}
          className="accent-green-600 w-5 h-5"
        />
      </div>

      {/* Related Brands */}
      <div>
  <h4 className="text-sm font-semibold mb-2">Related Brands</h4>
  <div className="grid grid-cols-2 gap-2">
    {filteredBrands.map((brand) => (
      <div
        key={brand.brandId}
        onClick={() => {
          navigate(`/brand/${brand.brandId}`);
          setIsDrawerOpen(false);
        }}
        className={`cursor-pointer px-2 py-1 rounded-full text-sm text-center transition ${
          brand.brandId === brandId
            ? "bg-green-200 text-green-800 font-semibold"
            : "text-gray-700 hover:bg-green-100"
        }`}
      >
        {brand.brandName}
      </div>
    ))}
  </div>
</div>

    </div>
  );

  return (
    <div className="p-4 md:px-24 mx-auto">
      {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-700">
          {selectedBrand?.brandName}
        </h2>
        <button onClick={() => setIsDrawerOpen(true)} title="Filter Products">
          <Tooltip content="Filter" placement="top">
            <FunnelIcon className="w-6 h-6 text-gray-700" />
          </Tooltip>
        </button>
      </div>

      {/* Drawer */}
      {isDrawerOpen && (
  <div
    className="fixed inset-0 z-50 flex"
    onClick={() => setIsDrawerOpen(false)}
  >
    {/* Drawer content */}
    <div
      className="w-3/4 h-full bg-white p-4 shadow-lg overflow-auto transition-transform duration-300 ease-in-out"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Filters</h2>
        <button onClick={() => setIsDrawerOpen(false)}>
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
      {renderFilterContent()}
    </div>
  </div>
)}


      {/* Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside>
          <div className="hidden md:block md:border-r md:pr-8 border-gray-200">
            {renderFilterContent()}
          </div>
        </aside>

        {/* Products Section */}
        <section className="flex-1">
  {currentProducts.length > 0 ? (
    <>
      <div className="mb-4 text-sm text-gray-500 flex items-center justify-between">
        <h2 className="text-lg font-bold mb-4 text-gray-700 hidden md:block">
          {selectedBrand?.brandName}
        </h2>
        <span>
          Showing <strong>{currentProducts.length}</strong> product(s)
        </span>
      </div>

      <ProductCard
        currentProducts={currentProducts}
        navigate={navigate}
        loading={loading}
      />

      {totalPages > 1 && !loading && (
        <div className="mt-8 flex justify-center">
          <CircularPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  ) : (
    <div className="flex flex-col justify-center items-center mt-10 text-center ">
      <img src={gif} alt="No products found" className=" h-full mb-2" />
      <p className="text-gray-600 text-lg">No product found.</p>
    </div>
  )}
</section>

     

      </div>
    </div>
  );
};

export default Brand;
