import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByShowroom } from "../Redux/Slice/productSlice";
import { fetchShowrooms } from "../Redux/Slice/showRoomSlice";
import { FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@material-tailwind/react";
import { CircularPagination } from "../Component/CircularPagination";
import gif from "../assets/no.gif";
import ProductCard from "../Component/ProductCard";

// Sidebar filter component
const FilterSidebar = ({
  priceRange,
  setPriceRange,
  showDiscountedOnly,
  setShowDiscountedOnly,
  isDrawerOpen,
  setIsDrawerOpen,
  allShowrooms,
  currentShowroomID,
  onShowroomSelect,
}) => {
  const handleRangeChange = (index, value) => {
    const newRange = [...priceRange];
    newRange[index] = +value;
    setPriceRange(newRange);
  };

  const content = (
    <div className="space-y-6">
      {/* Filters Section */}
      <div>
        <h3 className="hidden md:block md:text-lg font-semibold">Filters</h3>

        <p className="text-sm text-gray-500 mb-2 mt-4">
          Price Range: ₵{priceRange[0]} - ₵{priceRange[1]}
        </p>

        <div className="flex gap-2 ">
          <input
            type="range"
            min="0"
            max="200000"
            step="1000"
            value={priceRange[0]}
            onChange={(e) => handleRangeChange(0, e.target.value)}
            className="w-full accent-green-500"
          />
          <input
            type="range"
            min="0"
            max="200000"
            step="1000"
            value={priceRange[1]}
            className="w-full accent-green-500"
            onChange={(e) => handleRangeChange(1, e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            checked={showDiscountedOnly}
            onChange={() => setShowDiscountedOnly(!showDiscountedOnly)}
          />
          <label className="text-sm">Show Discounted</label>
        </div>
      </div>

      {/* Related Showrooms Section */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Showrooms</h4>
        <div className="space-y-2">
          {allShowrooms
            .filter(
              (room) =>
                !["Products out of stock", "Spotlight", "Flash sales"].includes(
                  room.showRoomName
                )
            )
            .map((room) => (
              <div
                key={room.showRoomID}
                onClick={() => {
                  onShowroomSelect(room.showRoomID);
                  setIsDrawerOpen(false);
                }}
                className={`cursor-pointer px-3 py-1 rounded-full text-sm transition ${
                  room.showRoomID === currentShowroomID
                    ? "bg-green-200 text-green-800 font-semibold"
                    : "text-gray-700 hover:bg-green-100"
                }`}
              >
                {room.showRoomName}
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer */}
      {isDrawerOpen && (
        <div className="fixed top-0 left-0 w-3/4 h-full bg-white z-50 p-4 shadow-lg overflow-auto md:hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Filters</h2>
            <button onClick={() => setIsDrawerOpen(false)}>
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          {content}
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block md:border-r md:pr-4 border-gray-200 md:mr-6">
        {content}
      </div>
    </>
  );
};

const ShowroomProductsPage = () => {
  const { showRoomID } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { productsByShowroom, loading } = useSelector(
    (state) => state.products
  );
  const { showrooms } = useSelector((state) => state.showrooms);

  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [showDiscountedOnly, setShowDiscountedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const itemsPerPage = 8;

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(fetchShowrooms());
    dispatch(fetchProductsByShowroom(showRoomID));
  }, [dispatch, showRoomID]);

  const selectedShowroom = showrooms.find((s) => s.showRoomID === showRoomID);

  const filteredProducts = (productsByShowroom[showRoomID] || [])
    .filter(
      (product) =>
        product.price >= priceRange[0] &&
        product.price <= priceRange[1] &&
        (!showDiscountedOnly || product.oldPrice > product.price)
    )
    .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="flex flex-col md:flex-row p-4 md:p-8">
      {/* Filter button on mobile */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <h2 className=" md:hidden text-xl font-bold text-gray-700">
          {selectedShowroom?.showRoomName || "Showroom Products"}
        </h2>
        <Tooltip content="Filter">
          <button onClick={() => setIsDrawerOpen(true)}>
            <FunnelIcon className="w-6 h-6 text-gray-700" />
          </button>
        </Tooltip>
      </div>

      {/* Filter Sidebar */}
      <FilterSidebar
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        showDiscountedOnly={showDiscountedOnly}
        setShowDiscountedOnly={setShowDiscountedOnly}
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        allShowrooms={showrooms}
        currentShowroomID={showRoomID}
        onShowroomSelect={(id) => {
          setCurrentPage(1);
          navigate(`/showroom/${id}`);
        }}
      />

      {/* Product Display */}
      <section className="flex-1">
        {currentProducts.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-gray-500 flex items-center justify-between">
              <h2 className="text-lg font-bold mb-4 text-gray-700 hidden md:block">
                {selectedShowroom?.showRoomName || "Showroom Products"}
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
  );
};

export default ShowroomProductsPage;
