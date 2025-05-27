import React, { useState } from "react";
import { Input, Menu, MenuHandler, MenuList, MenuItem, Button } from "@material-tailwind/react";
import { ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const categories = ["All", "Electronics", "Fashion", "Home", "Books", "Toys"];

const SearchBar = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-2">
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Category Dropdown */}
        <Menu open={isOpen} handler={setIsOpen}>
          <MenuHandler>
            <Button
              ripple={false}
              variant="outlined"
              className="flex items-center justify-between gap-2 border-gray-300 text-gray-700 bg-white shadow-md w-full md:w-48 rounded-xl"
            >
              {selectedCategory}
              <ChevronDownIcon strokeWidth={2} className="h-5 w-5 text-gray-600" />
            </Button>
          </MenuHandler>
          <MenuList className="z-[100]">
            {categories.map((category, index) => (
              <MenuItem
                key={index}
                onClick={() => {
                  setSelectedCategory(category);
                  setIsOpen(false);
                }}
                className="text-gray-700"
              >
                {category}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Input
            type="text"
            placeholder="Search products..."
            className="pr-12 border-gray-300 bg-white shadow-md rounded-xl focus:ring-2 focus:ring-green-500"
            labelProps={{
              className: "hidden",
            }}
          />
          <MagnifyingGlassIcon className="h-5 w-5 absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
