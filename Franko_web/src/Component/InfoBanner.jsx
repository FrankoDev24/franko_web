import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getHomePageAdvertisment } from "../Redux/Slice/advertismentSlice";

const InfoBanner = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { advertisments } = useSelector((state) => state.advertisment);
  const backendBaseURL = "https://smfteapi.salesmate.app";
  const targetFileId = "dceed369-a7fe-4058-8e62-5ab61df74514";

  const [homePageAd, setHomePageAd] = useState(null);

  useEffect(() => {
    dispatch(getHomePageAdvertisment("Home Page"));
  }, [dispatch]);

  useEffect(() => {
    const matchingAd = advertisments.find((ad) => ad.fileId === targetFileId);
    if (matchingAd) {
      setHomePageAd(matchingAd);
    }
  }, [advertisments]);

  const imageUrl = homePageAd
    ? `${backendBaseURL}/Media/Ads/${homePageAd.fileName.split("\\").pop()}`
    : "https://via.placeholder.com/1200x400";

  return (
    <div className="mx-auto px-4 md:px-8 mt-3">
      <div
        className="relative h-full overflow-hidden rounded-lg shadow-lg cursor-pointer"
        onClick={() => navigate("/back-to-school")}
      >
        <img
          src={imageUrl}
          alt="Advertisement Banner"
          className="w-full h-auto object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
    </div>
  );
};

export default InfoBanner;
