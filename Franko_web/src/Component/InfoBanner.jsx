import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getHomePageAdvertisment } from "../Redux/Slice/advertismentSlice"; // Import the action

const InfoBanner = () => {
  const dispatch = useDispatch();
  const { advertisments } = useSelector((state) => state.advertisment);
  const backendBaseURL = "https://smfteapi.salesmate.app";
  const targetFileId = "dceed369-a7fe-4058-8e62-5ab61df74514"; // Specific fileId

  const [homePageAd, setHomePageAd] = useState(null); // Store the specific ad

  useEffect(() => {
    dispatch(getHomePageAdvertisment("Home Page")); // Fetch on mount
  }, [dispatch]);

  useEffect(() => {
    // Find the advertisement with the specific fileId
    const matchingAd = advertisments.find((ad) => ad.fileId === targetFileId);
    if (matchingAd) {
      setHomePageAd(matchingAd);
    }
  }, [advertisments]);

  const imageUrl = homePageAd
    ? `${backendBaseURL}/Media/Ads/${homePageAd.fileName.split("\\").pop()}`
    : "https://via.placeholder.com/1200x400"; // Fallback image

  return (
    <div className=" mx-auto px-4 md:px-8 mt-3">
      {/* Single Advertisement Image */}
      <div className="relative h-full overflow-hidden rounded-lg shadow-lg">
        <img
          src={imageUrl}
          alt="Advertisement Banner"
          className="w-full h-auto object-cover"
        />
      </div>
    </div>
  );
};

export default InfoBanner;
