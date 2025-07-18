'use client'
import React, { useState, useEffect, useCallback  } from "react";
import Link from "next/link";
import DropDown from "./DropDown";
import { fetchProductDetails } from "@/utils/api";
import { OffsetPrintingPricingRule, Product } from "@/app/models/products";
import { addToCartOffSetPrinting } from "@/utils/cart";
import { findOffsetPrintingPricingRule } from "@/utils/priceFinder";
import { useRouter } from "next/navigation";
import FileUploader from "./FileUploader";
import { findOffsetPrintingPricingRule1, calculateOffsetPrintingPrice} from "./PriceCalculator";
import toast from "react-hot-toast";
import { useCartStore } from "@/utils/store/cartStore";

const ProductUpload = ({ product }: { product: any }) => {
  const dataId = product.id;
  const productDetails = product;//stores state from dropdown and passed to princingfrle finder
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  const [selectedPricingRule, setSelectedPricingRule] = useState<OffsetPrintingPricingRule | null>(null);
  const [uploadedDocumentId, setUploadedDocumentId] = useState<number | null>(null);
  const isAddToCartDisabled = !selectedPricingRule || !uploadedDocumentId;
  const router = useRouter();
  const incrementCart = useCartStore((state) => state.incrementCart);
  
    // Check if user is logged in
    const isLoggedIn = () => {
      const token = localStorage.getItem("jwtToken");
      return !!token;
    };

    const handleUploadSuccess = (documentId: number) => {
      console.log("Received Document ID from child:", documentId);
      setUploadedDocumentId(documentId);
    };

  // Fetch product details when component mounts

useEffect(() => {
  if (!productDetails || !selectedSize || !selectedQuantity || !selectedQuality) {
    console.warn("Missing required fields. Resetting price and pricing rule.");
    setCalculatedPrice(null); // Reset price
    setSelectedPricingRule(null); // Reset pricing rule
    return;
  }

  // Handle invalid quantity
  if (selectedQuantity === null || selectedQuantity <= 0) {
    console.warn("Quantity is zero or invalid. Resetting price and pricing rule.");
    setCalculatedPrice(null); // Reset price
    setSelectedPricingRule(null); // Reset pricing rule
    return;
  }

  if (errorMessage) {
    console.warn("Pricing rule not fetched due to validation error.");
    setCalculatedPrice(null); // Reset price
    setSelectedPricingRule(null); // Reset pricing rule
    return;
  }

  console.log("Extracted OffsetPrintingPricingRules:", productDetails?.OffsetPrintingPricingRules);

  const pricingrule = findOffsetPrintingPricingRule(
    productDetails.OffsetPrintingPricingRules,
    selectedSize,
    selectedQuantity,
    selectedQuality
  );
  setSelectedPricingRule(pricingrule);

  // Calculate price
  const price = calculateOffsetPrintingPrice(
    productDetails.OffsetPrintingPricingRules,
    selectedSize,
    selectedQuantity,
    selectedQuality
  );
  setCalculatedPrice(price);

  console.log("Matched Pricing Rule:", pricingrule);
  setSelectedPrice(pricingrule ? pricingrule.Price : null); // Store selected price
}, [selectedSize, selectedQuantity, selectedQuality, productDetails, errorMessage]);


  // Process stored cart item after login
    const processPendingCartItem = async () => {
      const pendingCartItem = sessionStorage.getItem("pendingCartItem");
      if (!pendingCartItem) return;
  
      const {
        dataId: pendingDataId,
        selectedPricingRule: pendingPricingRule,
        uploadedDocumentId: pendingDocumentId,
      } = JSON.parse(pendingCartItem);
  
      try {
        await addToCartOffSetPrinting(
          pendingDataId,
          pendingPricingRule,
          selectedQuantity ?? 1, // Default to 1 if quantity is not set
          pendingDocumentId,
        );
        sessionStorage.removeItem("pendingCartItem");
        router.push("/Cart");
      } catch (error) {
        setErrorMessage("Failed to process pending cart item. Please try again.");
      }
    };
       const handleAddToCart = async () => {
          if (!productDetails || !selectedPricingRule) {
            setErrorMessage("Please select all options before adding to the cart.");
            return;
          }
          if (!isLoggedIn()) {
            const pendingItem = {
              productType: "offsetPrinting",
              dataId,
              selectedPricingRule,
              uploadedDocumentId,
            };
            sessionStorage.setItem("pendingCartItem", JSON.stringify(pendingItem));
            router.push(`/auth/signin?redirect=/`); // ✅ Redirect to cart after login
            toast.success("Product added to cart!");
            return;
          }
          try{
            await addToCartOffSetPrinting(
              dataId, 
              selectedPricingRule,
              selectedQuantity ?? 1, // Default to 1 if quantity is not set
              uploadedDocumentId ?? undefined
            ); //2= buddle quantity change that
           toast.success("Product added to cart!");
             incrementCart();  
           router.push("/");
          }  catch (error) {
            alert("Failed to add to cart. Please try again.");
          }
        };

        const handleProceedToCart = async () => {
          if (!productDetails || !selectedPricingRule) {
            setErrorMessage("Please select all options before adding to the cart.");
            return;
          }
          if (!isLoggedIn()) {
            const pendingItem = {
              productType: "offsetPrinting",
              dataId,
              selectedPricingRule,
              uploadedDocumentId,
            };
            sessionStorage.setItem("pendingCartItem", JSON.stringify(pendingItem));
            router.push(`/auth/signin?redirect=/Cart`); // ✅ Redirect to cart after login
            return;
          }
          try{
            await addToCartOffSetPrinting(
              dataId, 
              selectedPricingRule,
              selectedQuantity ?? 1, // Default to 1 if quantity is not set
              uploadedDocumentId ?? undefined
            ); //2= buddle quantity change that
           toast.success("Product added to cart!");
            router.push("/Cart");
          }  catch (error) {
            alert("Failed to add to cart. Please try again.");
          }
        };


    useEffect(() => {
      if (isLoggedIn()) {
        processPendingCartItem();
      }
    }, []);

  return (
    <div className="flex flex-col pt-[31px] bg-white px-4 md:px-20 pb-[79px] py-20">
      {/* First Row */}
      <div className="flex flex-col md:flex-row">
        {/* Left Section */}
        <FileUploader onUploadSuccess={handleUploadSuccess} />  
        {/* Right Section */}
        <div className="flex flex-1 flex-col justify-between px-4 md:px-7 py-[25px] rounded shadow">
        {productDetails &&<DropDown
           productDetails={productDetails} 
           onSizeChange={setSelectedSize}
           onQuantityChange={setSelectedQuantity}
           onQualityChange={setSelectedQuality}
          />}
          {/**Note */}
          <div className="flex-1 flex flex-row mt-10 ml-0 md:ml-30 text-base text-[#000] overflow-hidden">
              <span className="font-medium whitespace-nowrap">Note :</span>
              <span className="font-normal italic whitespace-nowrap"> In Offset Printing, quantity 1 represents 1000 copies.</span>
          </div>
          <div className="flex-1 flex-col items-start justify-start mt-10">
          </div>
          <div className="flex-1 flex flex-col md:flex-row justify-center gap-2 md:gap-19 mt-19">
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
                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="24" viewBox="0 0 25 24" fill="none">
                  <path d="M14.5003 5C14.5003 4.46957 14.2896 3.96086 13.9145 3.58579C13.5395 3.21071 13.0308 3 12.5003 3C11.9699 3 11.4612 3.21071 11.0861 3.58579C10.711 3.96086 10.5003 4.46957 10.5003 5M9.49232 15H12.4923M12.4923 15H15.4923M12.4923 15V12M12.4923 15V18M19.7603 9.696L21.1453 18.696C21.1891 18.9808 21.1709 19.2718 21.0917 19.5489C21.0126 19.8261 20.8746 20.0828 20.687 20.3016C20.4995 20.5204 20.2668 20.6961 20.005 20.8167C19.7433 20.9372 19.4585 20.9997 19.1703 21H5.83032C5.54195 21 5.25699 20.9377 4.99496 20.8173C4.73294 20.6969 4.50005 20.5212 4.31226 20.3024C4.12448 20.0836 3.98624 19.8267 3.90702 19.5494C3.82781 19.2721 3.80949 18.981 3.85332 18.696L5.23832 9.696C5.31097 9.22359 5.5504 8.79282 5.91324 8.4817C6.27609 8.17059 6.73835 7.9997 7.21632 8H17.7843C18.2621 7.99994 18.7241 8.17094 19.0868 8.48203C19.4494 8.79312 19.6877 9.22376 19.7603 9.696Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
                <span className="font-medium text-lg">Add to Cart</span>
            </button>

            {/* Second Button */}
            <button
            onClick={handleProceedToCart}
            disabled={isAddToCartDisabled}
            className={`relative flex h-[44px] w-full md:flex-1 items-center justify-center rounded-[48px] border-2 text-lg
              ${isAddToCartDisabled
                ? "cursor-not-allowed border-gray-400 bg-gray-200 text-gray-500"
                : "cursor-pointer border-[#242424] bg-white text-[#242424]"
              }`}                
              >             
               <span className="pr-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="#242424">
                  <path d="M14.1667 5.50016V3.8335H5V5.50016H7.91667C9.00167 5.50016 9.9175 6.1985 10.2625 7.16683H5V8.8335H10.2625C10.0919 9.31979 9.77463 9.74121 9.3545 10.0397C8.93438 10.3382 8.43203 10.4991 7.91667 10.5002H5V12.5118L9.655 17.1668H12.0117L7.01167 12.1668H7.91667C8.87651 12.1651 9.80644 11.8327 10.5499 11.2255C11.2933 10.6184 11.8048 9.77363 11.9983 8.8335H14.1667V7.16683H11.9983C11.8715 6.56003 11.6082 5.99007 11.2283 5.50016H14.1667Z" fill="black"/>
                </svg>
              </span>
                <span className="font-bold">{calculatedPrice || "0"}</span>
                <span className="font-medium pl-4">Proceed To Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductUpload;