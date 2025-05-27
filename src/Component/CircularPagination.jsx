import React from "react";
import { Button, IconButton } from "@material-tailwind/react";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export const CircularPagination = ({ currentPage, totalPages, onPageChange }) => {
  const getItemProps = (index) => ({
    variant: currentPage === index ? "filled" : "text",
    color: currentPage === index ? "red" : "gray",
    onClick: () => onPageChange(index),
    className:
      "rounded-full w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-xs md:text-sm font-medium transition-all duration-300 hover:bg-gray-200",
  });

  const next = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const prev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const generatePages = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
      {/* Previous Button */}
      <Button
        variant="text"
        color="gray"
        onClick={prev}
        disabled={currentPage === 1}
        className={`flex items-center gap-1 rounded-full p-2 min-w-8 md:min-w-10 h-8 md:h-9 text-xs md:text-sm transition-all duration-300 ${
          currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200"
        }`}
      >
        <ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />
      </Button>

      {/* Page Numbers */}
      <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2">
        {generatePages().map((item, index) => {
          if (item === "...") {
            return (
              <span
                key={`dots-${index}`}
                className="px-2 text-gray-400 select-none text-xs md:text-sm"
              >
                ...
              </span>
            );
          }

          return (
            <IconButton key={item} {...getItemProps(item)}>
              {item}
            </IconButton>
          );
        })}
      </div>

      {/* Next Button */}
      <Button
        variant="text"
        color="gray"
        onClick={next}
        disabled={currentPage === totalPages}
        className={`flex items-center gap-1 rounded-full p-2 min-w-8 md:min-w-10 h-8 md:h-9 text-xs md:text-sm transition-all duration-300 ${
          currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200"
        }`}
      >
        <ArrowRightIcon strokeWidth={2} className="h-4 w-4" />
      </Button>
    </div>
  );
};
