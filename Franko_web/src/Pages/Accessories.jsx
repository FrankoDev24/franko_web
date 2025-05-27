import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByCategory } from "../Redux/Slice/productSlice";
import { useNavigate } from "react-router-dom";
import gif from "../assets/no.gif";
import { CircularPagination } from "../Component/CircularPagination";
import { FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@material-tailwind/react";
import ProductCard from "../Component/ProductCard"; // ← Add this
 
const categoryId = "2cfdb823-bbfd-495b-84a5-b5508356c1f6"

const Accessories = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { productsByCategory = {}, loading } = useSelector((state) => state.products
  );

  const [filters, setFilters] = useState({
    selectedBrand: null,
    priceRange: [0, 200000],
    showDiscountedOnly: false,
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    dispatch(fetchProductsByCategory(categoryId));
    window.scrollTo(0, 0);
  }, [dispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const products = useMemo(() => {
    const categoryProducts = productsByCategory[categoryId] || [];
    return categoryProducts
      .slice()
      .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
  }, [productsByCategory]);

  const brands = useMemo(() => {
    return Array.from(new Set(products.map((product) => product.brandName)));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const { selectedBrand, priceRange, showDiscountedOnly } = filters;
      const matchesBrand = selectedBrand
        ? product.brandName === selectedBrand
        : true;
      const matchesPrice =
        product.price >= priceRange[0] && product.price <= priceRange[1];
      const matchesDiscount = showDiscountedOnly
        ? (product.oldPrice || 0) > product.price
        : true;
      return matchesBrand && matchesPrice && matchesDiscount;
    });
  }, [products, filters]);

  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const resetFilters = () => {
    setFilters({
      selectedBrand: null,
      priceRange: [0, 200000],
      showDiscountedOnly: false,
    });
  };

  const renderFilters = () => (
    <div className="space-y-6 w-full md:w-72">
      <h3 className="text-lg font-semibold text-gray-800 hidden md:block">
        Filters
      </h3>
      <div>
        <p className="text-sm text-gray-600 mb-2">
          Price: ₵{filters.priceRange[0]} - ₵{filters.priceRange[1]}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="200000"
            step="1000"
            value={filters.priceRange[0]}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                priceRange: [
                  Math.min(+e.target.value, prev.priceRange[1] - 1000),
                  prev.priceRange[1],
                ],
              }))
            }
            className="w-full accent-red-500"
          />
          <input
            type="range"
            min="0"
            max="200000"
            step="1000"
            value={filters.priceRange[1]}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                priceRange: [
                  prev.priceRange[0],
                  Math.max(+e.target.value, prev.priceRange[0] + 1000),
                ],
              }))
            }
            className="w-full accent-red-500"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={filters.showDiscountedOnly}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              showDiscountedOnly: e.target.checked,
            }))
          }
        />
        <span className="text-sm text-gray-700">Discounted Only</span>
      </div>
      <div>
        <h4 className="font-semibold text-gray-700 mb-2">Brands</h4>
        <div className="grid grid-cols-2 gap-2">
          {brands.map((brand) => (
            <button
              key={brand}
              className={`w-full text-left px-2 py-2 text-sm rounded-lg ${
                filters.selectedBrand === brand
                  ? "bg-green-200 text-green-800 font-semibold"
                  : "text-gray-700 hover:bg-green-100"
              }`}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  selectedBrand: prev.selectedBrand === brand ? null : brand,
                }))
              }
            >
              {brand}
            </button>
          ))}
        </div>
      </div>
      <button
        className="mt-4 text-sm text-red-500 underline"
        onClick={resetFilters}
      >
        Clear All Filters
      </button>
    </div>
  );

  return (
    <div className="p-4 lg:p-12">
      <div className="md:hidden flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-700">
          {filters.selectedBrand || "Accessories"}
        </h2>
        <Tooltip content="Filter" placement="top">
          <button onClick={() => setIsDrawerOpen(true)} title="Filter Products">
            <FunnelIcon className="w-6 h-6 text-gray-700" />
          </button>
        </Tooltip>
      </div>
      {isDrawerOpen && (
        <div className="fixed top-0 left-0 w-3/4 h-full bg-white z-50 p-4 shadow-lg overflow-auto transition-transform duration-300 ease-in-out">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Filters</h2>
            <button onClick={() => setIsDrawerOpen(false)}>
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          {renderFilters()}
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-6">
        <aside>
          <div className="hidden md:block md:border-r md:pr-8 border-gray-200">
            {renderFilters()}
          </div>
        </aside>
        <section className="flex-1">
          <div className="mb-4 text-sm text-gray-500 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-700 hidden md:block">
              {filters.selectedBrand || "Accessories"}
            </h2>
            <span>
              Showing <strong>{currentProducts.length}</strong> product(s)
            </span>
          </div>
          {!loading && currentProducts.length === 0 ? (
            <div className="flex flex-col justify-center items-center mt-10 text-center w-full">
              <img
                src={gif}
                alt="No products found"
                className=" h-full mb-2"
              />
              <p className="text-gray-600 text-lg">No products found.</p>
            </div>
          ) : (
            <>
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
          )}
        </section>
      </div>
    </div>
  );
};

export default Accessories;
