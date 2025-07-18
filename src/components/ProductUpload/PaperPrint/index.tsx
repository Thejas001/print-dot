"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import DropDown from "./DropDoun";
import AddOnService from "./AddOnService";
import FileUploader from "./fileupload";
import { fetchProductDetails } from "@/utils/api";
import {
  Addon,
  PaperPrintingPricingRule,
  Product,
} from "@/app/models/products";
import { findPricingRule, findAddonPrice } from "@/utils/priceFinder";
import { validatePrintSelection } from "@/utils/validatePrint";
import PriceCalculator from "./PriceCalculator";
import { addToCartPaperPrint } from "@/utils/cart";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCartStore } from "@/utils/store/cartStore";

const ProductUpload = ({ product }: { product: any }) => {
  const dataId = product.id;
const [selectedOption, setSelectedOption] = useState<"" | "B/W" | "Color">("");
  const productDetails = product;//stores state from dropdown and passed to princingfrle finder
  const [selectedSize, setSelectedSize] = useState<string>(""); // Size selected
  const [noOfCopies, setNoOfCopies] = useState<number>(0); // Number of copies selected
  const [pageCount, setPageCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [uploadedDocumentId, setUploadedDocumentId] = useState<number | null>(null);
  const [selectedBindingType, setSelectedBindingType] = useState("");
  const [selectedBinderColor, setSelectedBinderColor] = useState("");
  const [copySelection, setCopySelection] = useState<string>("");
  const [customCopies, setCustomCopies] = useState<number>(0);
  const [selectedPricingRule, setSelectedPricingRule] = useState<PaperPrintingPricingRule | null>(null);
  const isAddToCartDisabled = !selectedPricingRule || !uploadedDocumentId;
  const [selectedAddonRule, setSelectedAddonRule] = useState<Addon | null>(
    null,
  );

  const router = useRouter();
  const incrementCart = useCartStore((state) => state.incrementCart);

  // Check if user is logged in
  const isLoggedIn = () => {
    const token = localStorage.getItem("jwtToken");
    return !!token;
  };

  const handleCopySelectionChange = (value: string) => {
    setCopySelection(value);
  };

  const handleCustomCopiesChange = (value: string) => {
    const parsedValue = parseInt(value, 10);
    setCustomCopies(isNaN(parsedValue) ? 0 : parsedValue); // Default to 0 if invalid
  };

  const handleBindingTypeChange = (bindingType: string) => {
    console.log("Selected Binding Type:", bindingType);
    setSelectedBindingType(bindingType);
  };

  const handleBinderColorChange = (binderColor: string) => {
    setSelectedBinderColor(binderColor);
    // You can also perform other actions here if needed
  };

  const handleUploadSuccess = (documentId: number) => {
    console.log("Received Document ID from child:", documentId);
    setUploadedDocumentId(documentId);

  };

  // Validate Printing Rules
  useEffect(() => {
    const error = validatePrintSelection(
      selectedSize,
      selectedOption,
      pageCount,
    );
    setErrorMessage(error);
  }, [selectedSize, selectedOption, pageCount]);

  // Function to get the correct pricing rule
  useEffect(() => {
    console.log("useEffect triggered");
    if (!productDetails || !selectedSize || !selectedOption || !pageCount)
      return;

    if (errorMessage) {
      console.warn("Pricing rule not fetched due to validation error.");
      return;
    }

    const mappedColor = selectedOption === "B/W" ? "BlackAndWhite" : "Color";

    // ✅ Fetch the base price from PricingRules
    const pricingRule = findPricingRule(
      productDetails.PaperPrintingPricingRules,
      selectedSize,
      mappedColor,
      pageCount,
    );

    setSelectedPricingRule(pricingRule);
    console.log("**********PricingRule**********", pricingRule);

    if (pricingRule) {
      console.log("Matched Pricing Rule:", pricingRule);
    } else {
      console.warn("No matching pricing rule found.");
    }

    // ✅ Fetch the addon price from Addons
    const addonRule = selectedBindingType
      ? findAddonPrice(
          productDetails.Addons,
          selectedBindingType,
          selectedSize,
          mappedColor,
          pageCount,
        )
      : null;

    setSelectedAddonRule(addonRule);
    console.log("Addon Rule:", addonRule);
  }, [selectedSize, selectedOption, productDetails, pageCount, errorMessage, selectedBindingType]);

  // Process stored cart item after login
  const processPendingCartItem = async () => {
    const pendingCartItem = sessionStorage.getItem("pendingCartItem");
    if (!pendingCartItem) return;

    const {
      dataId: pendingDataId,
      selectedPricingRule: pendingPricingRule,
      pageCount: pendingPageCount,
      selectedBindingType: pendingBindingType,
      selectedAddonRule: pendingAddonRule,
      addonBookCount: pendingAddonBookCount,
    } = JSON.parse(pendingCartItem);

    try {
      await addToCartPaperPrint(
        pendingDataId,
        pendingPricingRule,
        pendingPageCount,
        pendingBindingType,
        pendingAddonRule,
        pendingAddonBookCount,
      );
      sessionStorage.removeItem("pendingCartItem");
      router.push("/Cart");
    } catch (error) {
      setErrorMessage("Failed to process pending cart item. Please try again.");
    }
  };

  //add to cart

  const handleAddToCart = async () => {
    if (!productDetails || !selectedPricingRule) {
      setErrorMessage("Please select all options before adding to the cart.");
      return;
    }

    if (!isLoggedIn()) {
      const pendingItem = {
        productType: "paperprinting",
        selectedPricingRule,
        pageCount, // ✅ Store page count
        selectedBindingType, // ✅ Store binding type
        selectedAddonRule, // ✅ Store addon rule
        addonBookCount:
          copySelection === "all" ? noOfCopies : customCopies || 0, // ✅ Store copies count
      };
      sessionStorage.setItem("pendingCartItem", JSON.stringify(pendingItem));
      toast.success("Product added to cart!");
      router.push(`/auth/signin?redirect=/`); // ✅ Redirect to cart after login
      return;
    }

    const addonBookCount =
      copySelection === "all" ? noOfCopies : customCopies || 0; // Define it here
    const addonDetails = {
      addons: productDetails?.Addons || [], // Safely accessing the Addons array
      selectedBindingType,
      selectedSize,
      selectedColor: selectedOption,
      pageCount,
      addonBookCount,
    };

    try {
      await addToCartPaperPrint(
        dataId,
        selectedPricingRule,
        pageCount,
        selectedBindingType,
        selectedAddonRule,
        addonBookCount,
      );
      toast.success("Product added to cart!");
      incrementCart();
      router.push("/");
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  const handleProceedToCart = async () => {
    if (!productDetails || !selectedPricingRule) {
      setErrorMessage("Please select all options before adding to the cart.");
      return;
    }

    if (!isLoggedIn()) {
      const pendingItem = {
        productType: "paperprinting",
        selectedPricingRule,
        pageCount, // ✅ Store page count
        selectedBindingType, // ✅ Store binding type
        selectedAddonRule, // ✅ Store addon rule
        addonBookCount:
          copySelection === "all" ? noOfCopies : customCopies || 0, // ✅ Store copies count
      };
      sessionStorage.setItem("pendingCartItem", JSON.stringify(pendingItem));
      router.push(`/auth/signin?redirect=/Cart`); // ✅ Redirect to cart after login
      return;
    }

    const addonBookCount =
      copySelection === "all" ? noOfCopies : customCopies || 0; // Define it here
   
      const addonDetails = {
      addons: productDetails?.Addons || [], // Safely accessing the Addons array
      selectedBindingType,
      selectedSize,
      selectedColor: selectedOption,
      pageCount,
      addonBookCount,
    };

    try {
      await addToCartPaperPrint(
        dataId,
        selectedPricingRule,
        pageCount,
        selectedBindingType,
        selectedAddonRule,
        addonBookCount,
      );
      toast.success("Product added to cart!");
      router.push("/Cart");
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  useEffect(() => {
    if (isLoggedIn()) {
      processPendingCartItem();
    }
  }, []);

  return (
    <div className="flex flex-col bg-white px-4 py-20 pb-[79px] pt-[31px] md:px-20">
      {/* First Row */}
      <div className="flex flex-col md:flex-row">
        {/* Left Section */}
        <FileUploader onUploadSuccess={handleUploadSuccess} pageCount={pageCount} setPageCount={setPageCount} />
        {/* Right Section */}
        {productDetails && (
          <div className="flex flex-1 flex-col justify-between rounded px-4 py-[25px] shadow md:px-7">
            <div className="mb-10 flex flex-row space-x-10">
              {/* Color Options */}
              <div
                className="flex cursor-pointer items-center gap-4"
                onClick={() => setSelectedOption("B/W")} // Set selected option
              >
                {/* Radio Button */}
                <div
                  className={`flex h-7.5 w-7.5 items-center justify-center rounded-full border ${
                    selectedOption === "B/W"
                      ? "border-4 border-[#242424]"
                      : "border-2 border-[#D1D5DB]"
                  }`}
                ></div>
                <span className="tracking-tighter-[-0.2px] text-base font-medium leading-6 text-[#242424]">
                  B/W print
                </span>
              </div>

              {/* Delivery Option */}
              <div
                className="flex cursor-pointer items-center gap-4"
                onClick={() => setSelectedOption("Color")} // Set selected option
              >
                {/* Radio Button */}
                <div
                  className={`flex h-7.5 w-7.5 items-center justify-center rounded-full border ${
                    selectedOption === "Color"
                      ? "border-4 border-[#242424]"
                      : "border-2 border-[#D1D5DB]"
                  }`}
                ></div>
                <span className="tracking-tighter-[-0.2px] text-base font-medium leading-6 text-[#242424]">
                  Color Print
                </span>
              </div>
            </div>
            <DropDown
              productDetails={productDetails}
              onSizeChange={setSelectedSize} // ✅ Handle Size Change
              onCopiesChange={setNoOfCopies} // ✅ Handle No. of Copies Change
            />

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 text-sm text-red-500">{errorMessage}</div>
            )}

            <div className="mt-10 flex-1 flex-col items-start justify-start">
              <AddOnService
                productDetails={productDetails}
                onBindingTypeChange={handleBindingTypeChange}
                onBinderColorChange={handleBinderColorChange}
                onCopySelectionChange={handleCopySelectionChange}
                onCustomCopiesChange={handleCustomCopiesChange}
                pageCount={pageCount}
                paperSize={selectedSize}
                colorType={selectedOption}
              />
            </div>

            <PriceCalculator
              pricingRules={productDetails.PaperPrintingPricingRules || []}
              addons={productDetails.Addons || []}
              selectedSize={selectedSize}
              selectedColor={selectedOption === "" ? "B/W" : selectedOption}
              pageCount={pageCount}
              noOfCopies={noOfCopies}
              copySelection={copySelection}
              customCopies={customCopies} // Now always a number
              selectedBindingType={selectedBindingType}
              onPriceUpdate={(price) => setCalculatedPrice(price)}
            />

            {/* Buttons */}
            <div className="mt-19 flex flex-1 flex-col md:flex-row justify-center gap-2 md:gap-19">
              {/* First Button */}
              <button 
              onClick={handleAddToCart}
              disabled={isAddToCartDisabled}
              className={`relative flex h-[44px] w-full md:flex-1 items-center justify-center gap-4 rounded-[48px] text-lg
                ${isAddToCartDisabled
                  ? "cursor-not-allowed bg-gray-300 text-gray-500"
                  : "cursor-pointer bg-[#242424] text-white"
                }`}               
                >               
                <span className="pr-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="25"
                    height="24"
                    viewBox="0 0 25 24"
                    fill="none"
                  >
                    <path
                      d="M14.5003 5C14.5003 4.46957 14.2896 3.96086 13.9145 3.58579C13.5395 3.21071 13.0308 3 12.5003 3C11.9699 3 11.4612 3.21071 11.0861 3.58579C10.711 3.96086 10.5003 4.46957 10.5003 5M9.49232 15H12.4923M12.4923 15H15.4923M12.4923 15V12M12.4923 15V18M19.7603 9.696L21.1453 18.696C21.1891 18.9808 21.1709 19.2718 21.0917 19.5489C21.0126 19.8261 20.8746 20.0828 20.687 20.3016C20.4995 20.5204 20.2668 20.6961 20.005 20.8167C19.7433 20.9372 19.4585 20.9997 19.1703 21H5.83032C5.54195 21 5.25699 20.9377 4.99496 20.8173C4.73294 20.6969 4.50005 20.5212 4.31226 20.3024C4.12448 20.0836 3.98624 19.8267 3.90702 19.5494C3.82781 19.2721 3.80949 18.981 3.85332 18.696L5.23832 9.696C5.31097 9.22359 5.5504 8.79282 5.91324 8.4817C6.27609 8.17059 6.73835 7.9997 7.21632 8H17.7843C18.2621 7.99994 18.7241 8.17094 19.0868 8.48203C19.4494 8.79312 19.6877 9.22376 19.7603 9.696Z"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div >
                  <span className="text-lg font-medium">Add to Cart</span>
                </div>
              </button>

              {/* Second Button */}
              <button
                disabled={isAddToCartDisabled}
                onClick={handleProceedToCart}
                className={`relative flex h-[44px] w-full md:flex-1 items-center justify-center rounded-[48px] border-2 text-lg
                  ${isAddToCartDisabled
                    ? "cursor-not-allowed border-gray-400 bg-gray-200 text-gray-500"
                    : "cursor-pointer border-[#242424] bg-white text-[#242424]"
                  }`}                
                  >
                <span className="pr-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="21"
                    viewBox="0 0 20 21"
                    fill="#242424"
                  >
                    <path
                      d="M14.1667 5.50016V3.8335H5V5.50016H7.91667C9.00167 5.50016 9.9175 6.1985 10.2625 7.16683H5V8.8335H10.2625C10.0919 9.31979 9.77463 9.74121 9.3545 10.0397C8.93438 10.3382 8.43203 10.4991 7.91667 10.5002H5V12.5118L9.655 17.1668H12.0117L7.01167 12.1668H7.91667C8.87651 12.1651 9.80644 11.8327 10.5499 11.2255C11.2933 10.6184 11.8048 9.77363 11.9983 8.8335H14.1667V7.16683H11.9983C11.8715 6.56003 11.6082 5.99007 11.2283 5.50016H14.1667Z"
                      fill="black"
                    />
                  </svg>
                </span>
                <span className="font-bold">
                  {calculatedPrice !== null ? `${calculatedPrice}` : "0"}
                </span>
                <span className="pl-4 font-medium">Proceed To Cart</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductUpload;
