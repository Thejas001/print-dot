"use client";
import React, { useState, useMemo  } from "react";
import { Product } from "@/app/models/products";
import {noticeTypeQualityRules} from "@/utils/bindingdisable"; // Adjust the import path as necessary

const DropDown = ({
    productDetails,
    onSizeChange,
    onQuantityChange,
    onQualityChange
}:{
    productDetails: Product,
    onSizeChange: (size: string) => void;
    onQuantityChange: (quantity: number) => void;
    onQualityChange: (quality: string) => void; 
}) => {

      const [isOpenSize, setIsOpenSize] = useState(false);
      const [selectedSize, setSelectedSize] = useState("");
    
      const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);

      const [isOpenQuality, setIsOpenQuality] = useState(false);
      const [selectedQuality, setSelectedQulaity] = useState("");
      
      const sizeOptions = productDetails.NoticeType || [];
      const sizeQuantity = productDetails.quantity || []; // Change this to quantity
      const qualityOptions = productDetails.Quality || [];

const getFilteredQualities = () => {
  const isOffsetPrinting = productDetails.name === "Offset Printing";

  if (!isOffsetPrinting) return qualityOptions;

  const allowedQualities = noticeTypeQualityRules[selectedSize];
  if (allowedQualities) {
    return qualityOptions.filter((q) =>
      allowedQualities.includes(q.toUpperCase())
    );
  }

  // If no rule defined, return all
  return qualityOptions;
};


      
    return (
        <div className="flex flex-col md:flex-row gap-6 md:gap-[45px] w-full">
        {/* Left DropDown Section */}
            <div className="flex flex-col gap-4 md:gap-10 w-full md:w-1/2">
                <div className="h-auto">
                <label className="block text-[#242424] text-base font-medium leading-6 tracking-[-0.2px] mb-2.5">
                     Size
                </label>
                <div
                    className="relative border rounded-md focus:ring-2 focus:ring-gray-300 py-3 px-5 bg-white cursor-pointer"
                    onClick={() => setIsOpenSize(!isOpenSize)}
                >
                    <div className="text-sm font-normal text-gray-700">{selectedSize || "Select Size"}</div>
                    <span className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400">
                    ▼
                    </span>
                </div>
                {isOpenSize && (
                    <ul className="z-10 w-full mt-1 py-3 bg-white border rounded-md shadow-lg">
                    {sizeOptions.map((option, index) => (
                        <li
                        key={index}
                        className={`px-5 py-3 text-sm cursor-pointer ${
                            selectedSize === option ? "bg-[#242424] text-white" : "bg-white text-[#242424] hover:bg-[#242424] hover:text-white"
                        }`}
                        onClick={() => { 
                            setSelectedSize(option); 
                            onSizeChange(option);
                            setIsOpenSize(false); }}
                        >
                        {option}
                        </li>
                    ))}
                    </ul>
                )}
                </div>
                {/**Orientation DropDown */}
                <div className="h-auto">
                <label className="block text-[#242424] text-base font-medium leading-6 tracking-[-0.2px] mb-2.5">
                     Quantity
                </label>
                 <input
                    type="number"
                    min="1"
                    className="border rounded-md focus:ring-2 focus:ring-gray-300 py-3 px-5 bg-white text-gray-700 w-full"
                    placeholder="Enter Quantity"
                    value={selectedQuantity || ""}
                    onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        const adjustedValue = value;
                        setSelectedQuantity(value);
                        onQuantityChange(adjustedValue);
                    }}
                    />
                </div>
            </div>

        {/* Right DropDown Section */}
        <div className="flex flex-col gap-4 w-full md:w-1/2">
            <div className="h-auto">
            <label className="block text-[#242424] text-base font-medium leading-6 tracking-[-0.2px] mb-2.5">
                Quality
            </label>
            <div
                className="relative border rounded-md focus:ring-2 focus:ring-gray-300 py-3 px-5 bg-white cursor-pointer"
                onClick={() => setIsOpenQuality(!isOpenQuality)}
            >
                <div className="text-sm font-normal text-gray-700">{selectedQuality || "Select Quality"}</div>
                <span className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400">
                ▼
                </span>
            </div>
            {isOpenQuality && (
                <ul className="z-10 w-full mt-1 py-3 bg-white border rounded-md shadow-lg">
                {getFilteredQualities().map((option, index) => (
                    <li
                    key={index}
                    className={`px-5 py-3 text-sm cursor-pointer ${
                        selectedQuality === option ? "bg-[#242424] text-white" : "bg-white text-[#242424] hover:bg-[#242424] hover:text-white"
                    }`}
                    onClick={() => { 
                        setSelectedQulaity(option); 
                        onQualityChange(option);
                        setIsOpenQuality(false); 
                    }}
                    >
                    {option}
                    </li>
                ))}
                </ul>
            )}
            </div>
        </div>
    </div>
    );
};

export default DropDown;