import React from "react";
import { Card } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";

// Importing image assets directly
import Samsung from "../assets/samsung.png";
import infinix from "../assets/infinix.png";
import tecno from "../assets/tec.png";
import Hmd from "../assets/hmd.png";
import itelImg from "../assets/itel.png";
import Huawei from "../assets/huawel.png";

// Brand data with unique UUIDs
const brands = [
  { id: "760af684-7a19-46ab-acc5-7445ef32073a", name: "Samsung", src: Samsung },
  { id: "c163ee86-1d24-4c97-943b-1f82a09c6066", name: "Infinix", src: infinix },
  { id: "86cca959-70a4-448e-86f1-3601309f49a6", name: "Tecno", src: tecno },
  { id: "fb694e59-77be-455f-9573-acf917ffb39d", name: "HMD", src: Hmd },
  { id: "4c1dba1d-61b2-4ec3-9c03-38036dd02c89", name: "Itel", src: itelImg },
  { id: "d643698d-f794-4d33-9237-4a913aa463a2", name: "Huawei", src: Huawei },
];

const BrandsBanner = () => {
  const navigate = useNavigate();

  const handleBrandClick = (brandId) => {
    navigate(`/brand/${brandId}`);
  };

  return (
    <section className="py-8 bg-white">
      <div className="mx-auto px-4 md:px-24 py-4">
        {/* Header section */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 relative inline-block">
              Shop by brand
            </h2>
          </div>

          {/* Full gray divider */}
          <div className="w-full h-px bg-gray-300 mt-1 relative">
            <div className="absolute left-0 top-0 h-px w-24 bg-red-400"></div>
          </div>
        </div>

        {/* Brand cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {brands.map((brand) => (
            <Card
              key={brand.id}
              onClick={() => handleBrandClick(brand.id)}
              className="border border-gray-200 shadow-none bg-white p-6 flex items-center justify-center hover:shadow-md transition duration-300 cursor-pointer"
            >
              <img
                src={brand.src}
                alt={brand.name}
                className="max-h-12 object-contain"
              />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandsBanner;
