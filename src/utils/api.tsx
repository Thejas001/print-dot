import axios from "axios";
import https from "https"; 
import { Product } from "@/app/models/products";
import { extractPhotoFramePricingRules, 
        extractPaperPrintingPricingRules, 
        extractBusinessCardPricingRules,
        extractOffsetPrintingPricingRules,
        extractLetterHeadPricingRules,
        extractPolaroidPricingRules,
        extracNameSlipPricingRules,
        extractCanvasPricingRules,
      } from "@/utils/extractPricingRule";
import { CartItems } from "@/app/models/CartItems";
const agent = new https.Agent({  
  rejectUnauthorized: false, // ✅ Allow self-signed certificates
}); 
export const API = axios.create({
  baseURL: "https://fourdotsapp.azurewebsites.net/api",
  headers: { "Content-Type": "application/json" },
  httpsAgent: agent, // ✅ Use the custom HTTPS agent
});

// ✅ Check for localStorage only in the browser
API.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

export const getUserDetails = async () => {
  try {
    const response = await API.get("/account/profile");
    return response.data; // Assuming the API returns user details directly
  } catch (error: any) {
    console.error("Error fetching user details:", error);
    throw error.response?.data?.message || "Failed to fetch user details";
  }
};

export const updateUserName = async (userName: string) => {
  try {
    const response = await API.put("/account/update-name", { name: userName });
    return response.data; // Assuming the API returns updated user details directly
  } catch (error: any) {
    console.error("Error updating user name:", error);
    throw error.response?.data?.message || "Failed to update user name";
  }
}
export const getUserAddress = async () => {
  try {
    const response = await API.get("/address");
    return response.data; // Assuming the API returns user address directly
  } catch (error: any) {
    console.error("Error fetching user address:", error);
    throw error.response?.data?.message || "Failed to fetch user address";
  }
}

export const addUserAddress = async (address: any) => {
  try {
    const response = await API.post("/address", address);
    return response.data; // Assuming the API returns user address directly
  } catch (error: any) {
    console.error("Error adding user address:", error);
    throw error.response?.data?.message || "Failed to add user address";
  }
}

export const updateUserDetails = async (userDetails: any) => {
  try {
    const response = await API.put("/account/update-name", userDetails);
    return response.data; // Assuming the API returns updated user details directly
  } catch (error: any) {
    console.error("Error updating user details:", error);
    throw error.response?.data?.message || "Failed to update user details";
  }
}
export const updateOrderStatus = async (orderId: number, status: number) => {
  try {
    const response = await API.put(`/order/${orderId}/status`, {
      OrderStatus: status,
    });
    return response.data; // Adjust as per your API's response structure
  } catch (error: any) {
    console.error(`Error updating order ${orderId} status:`, error);
    throw error.response?.data?.message || "Failed to update order status";
  }
};


// Send OTP to user's phone
 export const sendOtp = async (phoneNumber: string) => {
    const formattedPhoneNumber = `+91${phoneNumber}`; // Assuming the backend needs the country code
    try {
      const response = await API.post("/Account/register-or-login", { phoneNumber: formattedPhoneNumber });
      if (response.status === 200) {
      return response.data;
      }
      else{
        throw new Error(response.data?.message ||"Failed to send OTP");
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error.response ? error.response.data : error.message);
      throw new Error("Failed to send OTP");
    }
  };
  
  
  // Verify OTP for login
  export const verifyOTP = async (phoneNumber: string, otp: string) => {
    try {
      // Add +91 prefix to phone number if not already present
      const formattedPhoneNumber = phoneNumber.startsWith("+91") ? phoneNumber : `+91${phoneNumber}`;
      
      const response = await API.post("/Account/verify-otp", { phoneNumber: formattedPhoneNumber, otp });
      return response.data.token; // API should return auth token
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      throw error.response?.data?.message || "Invalid OTP";
    }
  };
  
  // Fetch products from the server
  export const fetchProducts = async (): Promise<Product[]> => {
    try {
      const response = await API.get("/products");
  
      const transformed = response.data.map((product: any) => ({
        id: product.ProductID,
        name: product.ProductName,
        description: product.Description,
      }));
  
      return transformed;
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };
  

// Fetch product details by ID
export const fetchProductDetails = async (dataId: number): Promise<Product | null> => {
  try {
    const response = await API.get(`/products/details-with-pricing/${dataId}`);
    const Data = response.data;

    console.log("API Response Data:", Data);

    const formatName = (name: string) =>
      name
        ? name
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        : "";

    const getValues = (attr: any) =>
      attr?.Values?.map((v: any) => (typeof v === "string" ? v : v.ValueName)) || [];

    const extractSize = (attributes: any[]) => {
      const sizeAttribute = attributes?.find((attr: any) =>
        attr.AttributeName.toLowerCase().includes("size")
      );
      return sizeAttribute?.Values?.map((v: any) => (typeof v === "string" ? v : v.ValueName)) || [];
    };

    // ✅ Extract Pricing Rules separately
    const PhotoFramePricingRules = extractPhotoFramePricingRules(Data.PricingRules);
    const PaperPrintingPricingRules = extractPaperPrintingPricingRules(Data.PricingRules, Data.Addons);    
    const BusinessCardPricingRules = extractBusinessCardPricingRules(Data.PricingRules);
    const OffsetPrintingPricingRules = extractOffsetPrintingPricingRules(Data.PricingRules);
    const LetterHeadPricingRules = extractLetterHeadPricingRules(Data.PricingRules);
    const PolaroidCardPricingRules = extractPolaroidPricingRules(Data.PricingRules);
    const NameSlipPricingRules = extracNameSlipPricingRules(Data.PricingRules);
    const CanvasPricingRules = extractCanvasPricingRules(Data.PricingRules);


    console.log(PaperPrintingPricingRules);

    // ✅ Map API response to Product model
    const mappedProduct: Product = {
      id: Data.ProductID,
      pricingrule: Data.PricingRules,
      name: formatName(Data.ProductName),
      description: Data.Description || "",
      sizes: extractSize(Data.Attributes),
      price: Data.Price || 0,
      imageUrl: Data.ImageUrl || "",
      ProductDetailsImages: Data.ProductDetailsImages || [],
      // ✅ Use the getValues function to extract values from attributes
      colors: getValues(
        Data.Attributes?.find((attr: any) => attr.AttributeName.toLowerCase() === "color name")
      ),
      quantity: getValues(
        Data.Attributes?.find((attr: any) => attr.AttributeName.toLowerCase() === "quantity")
      ),

      cardType: getValues(
        Data.Attributes?.find((attr: any) => attr.AttributeName.toLowerCase() === "card type")
      ),
      Quality: getValues(
        Data.Attributes?.find((attr: any) => attr.AttributeName.toLowerCase() === "quality")
      ),
      NoticeType: getValues(
        Data.Attributes?.find((attr: any) => attr.AttributeName.toLowerCase() === "notice type")
      ),
      QuantityRange: getValues(
        Data.Attributes?.find((attr: any) => attr.AttributeName.toLowerCase() === "quantity range")
      ),
      Finish: getValues(
        Data.Attributes?.find((attr: any) => attr.AttributeName.toLowerCase() === "finish")
      ),
        // ✅ Add the Addons field
      Addons: Data.Addons || [],
     
      PhotoFramePricingRules, 
      PaperPrintingPricingRules, 
      BusinessCardPricingRules, 
      OffsetPrintingPricingRules,
      LetterHeadPricingRules,
      PolaroidCardPricingRules,
      NameSlipPricingRules,
      CanvasPricingRules,
    };

    console.log("Mapped Product:", mappedProduct);
    return mappedProduct;
  } catch (error) {
    console.error(`Error fetching product details (ID: ${dataId}):`, error);
    return null;
  }
};



//Cart

export const addToCartApi = async (cartItem: CartItems) => {
  try {
    const response = await API.post(`/cart/items`, cartItem);

    console.log("✅ Successfully added to cart:", response.data);
    return response.data; // No need for response.json()
  } catch (error: any) {
    console.error("Error adding to cart:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to add item to cart");
  }
};


export const placeOrder = async (
  cartItemIds: number[], 
  deliveryOption: string,
  paymentOption: string
) => {    
  try {
    const response = await API.post("/order/create", {
      CartItemIds: cartItemIds,
      PaymentMethod: paymentOption,
      DeliveryType: deliveryOption,
    });

    return response.data;
  } catch (error: any) {
    console.error("Error placing order:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to place order");
  }
};



export const fetchUserOrder = async () => {
  try {
    const response = await API.get(`/order/user`);

    if (response.data?.Success) {
      return response.data.Data; // Extract 'Data' array
    } else {
      throw new Error(response.data?.message || "Failed to fetch orders");
    }
  } catch (error: any) {
    console.error("Error fetching orders:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to fetch orders");
  }
};

export const fetchPaymentRetry = async (orderId: number) => {
  try {
    const response = await API.get(`/order/retry-payment/${orderId}`);
    console.log("API Response Data:", response.data); // Keep this for debugging

    // Return the actual response data directly
    return response.data;
  } catch (error: any) {
    console.error("Error fetching orders:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to fetch orders");
  }
};


export default API;
