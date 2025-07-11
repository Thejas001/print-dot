"use client";
import React, { useState, useEffect } from "react";
import { Product } from "@/app/models/products";

const DropDown = ({
  productDetails,
  onSizeChange,
  onQuantityChange,
  onPriceCalculation, // Added to pass price and error to the parent
}: {
  productDetails: Product;
  onSizeChange: (size: string) => void;
  onQuantityChange: (quantity: string) => void;
  onPriceCalculation: (price: number | null, error: string | null) => void; // Expecting both price and error in the parent
}) => {
  const [isOpenSize, setIsOpenSize] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState<string | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sizeOptions = productDetails.sizes || [];

  // Function to find pricing based on size and quantity range
  const findPriceForSizeAndQuantity = (size: string, quantity: number) => {
    const matchingRule = productDetails.PolaroidCardPricingRules?.find(rule => {
      const [min, max] = rule.QuantityRange.ValueName.split("-").map(Number);
      return (
        rule.Size?.ValueName.trim() === size.trim() &&
        quantity >= min && quantity <= max
      );
    });

    if (matchingRule) {
      return matchingRule.Price * quantity;
    }

    return null;
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedQuantity(value);

    // Validate that the entered value is a valid number
    const parsedValue = Number(value);
    if (!isNaN(parsedValue) && parsedValue > 0) {
      if (selectedSize) {
        const price = findPriceForSizeAndQuantity(selectedSize, parsedValue);
        if (price !== null) {
          setCalculatedPrice(price);
          setErrorMessage(null); // Clear error message if price is found
        } else {
          setCalculatedPrice(null);
          setErrorMessage("Quantity is out of the valid range for the selected size.");
        }
      }
    } else {
      setCalculatedPrice(null);
      setErrorMessage("Please enter a valid quantity.");
    }

    onQuantityChange(value);

    // Send updated price and error to the parent
    onPriceCalculation(calculatedPrice, errorMessage);
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    onSizeChange(size);

    // Recalculate price and check if quantity is valid
    if (selectedQuantity && !isNaN(Number(selectedQuantity))) {
      const parsedQuantity = Number(selectedQuantity);
      const price = findPriceForSizeAndQuantity(size, parsedQuantity);
      if (price !== null) {
        setCalculatedPrice(price);
        setErrorMessage(null); // Clear error message if price is found
      } else {
        setCalculatedPrice(null);
        setErrorMessage("Not a valid quantity for the selected size.");
      }
    }

    // Send updated price and error to the parent
    onPriceCalculation(calculatedPrice, errorMessage);
  };

  useEffect(() => {
    if (selectedQuantity && selectedSize && !isNaN(Number(selectedQuantity))) {
      const price = findPriceForSizeAndQuantity(selectedSize, Number(selectedQuantity));
      if (price !== null) {
        setCalculatedPrice(price);
        setErrorMessage(null); // Clear error message if price is found
      } else {
        setCalculatedPrice(null);
        setErrorMessage("Quantity is out of the valid range for the selected size.");
      }
    }

    // Send updated price and error to the parent
    onPriceCalculation(calculatedPrice, errorMessage);
  }, [selectedSize, selectedQuantity]);

  useEffect(() => {
    // Send updated price and error to the parent whenever they change
    onPriceCalculation(calculatedPrice, errorMessage);
  }, [calculatedPrice, errorMessage]);

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-[45px] w-full">
      {/* Left DropDown Section */}
      <div className="flex flex-col gap-5 md:gap-10 w-full md:w-1/2">
        <div className="h-auto">
          <label className="block text-[#242424] text-base font-medium leading-6 tracking-[-0.2px] mb-2.5">
            Size
          </label>
          <div
            className="relative border rounded-md focus:ring-2 focus:ring-gray-300 py-3 px-5 bg-white cursor-pointer"
            onClick={() => setIsOpenSize(!isOpenSize)}
          >
            <div className="text-sm font-normal text-gray-700">{selectedSize || "Select Size"}</div>
            <span className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400">▼</span>
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
                    handleSizeChange(option);
                    setIsOpenSize(false);
                  }}
                >
                  {option}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right Input Section with Quantity as Input */}
      <div className="flex flex-col gap-4 w-full md:w-1/2">
        <div className="h-auto">
          <label className="block text-[#242424] text-base font-medium leading-6 tracking-[-0.2px] mb-2.5">
            Quantity
          </label>
            <input
              type="number"
              min="1"
              className="border rounded-md focus:ring-2 focus:ring-gray-300 py-3 px-5 bg-white text-gray-700 w-full"
              value={selectedQuantity || ""}
              placeholder="Enter Quantity"
              onChange={handleQuantityChange}
            />
        </div>
      </div>
    </div>
  );
};

export default DropDown;
