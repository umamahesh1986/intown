import axios from "axios";
import { Platform } from "react-native";

/* ===============================
   BASE URL RESOLUTION
================================ */

// Android emulator → 10.0.2.2
// iOS simulator / web → localhost
const LOCAL_BACKEND =
  Platform.OS === "android"
    ? "http://10.0.2.2:8001"
    : "http://localhost:8001";

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || LOCAL_BACKEND;

const EXTERNAL_API =
  "http://intownlocal.us-east-1.elasticbeanstalk.com/it";

/* ===============================
   AXIOS INSTANCES
================================ */

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 10000, // 10 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

export const externalApi = axios.create({
  baseURL: EXTERNAL_API,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ===============================
   HELPER: NETWORK ERROR CHECK
================================ */
const isNetworkError = (error: any) => {
  return (
    !error.response &&
    (error.message === "Network Error" ||
      error.code === "ECONNABORTED")
  );
};

/* ===============================
   AUTH APIs
================================ */

export const sendOTP = async (phone: string) => {
  try {
    const response = await api.post("/send-otp", { phone });
    return response.data;
  } catch (error: any) {
    console.warn("sendOTP API failed:", error.message);

    // ✅ Offline / backend-down fallback
    if (isNetworkError(error)) {
      return {
        success: true,
        message: "OTP sent successfully (offline mode)",
        otp: "1234",
      };
    }

    throw error;
  }
};

export const verifyOTP = async (phone: string, otp: string) => {
  try {
    const response = await api.post("/verify-otp", { phone, otp });
    return response.data;
  } catch (error: any) {
    console.warn("verifyOTP API failed:", error.message);

    // ✅ Offline fallback
    if (isNetworkError(error)) {
      if (otp === "1234") {
        return {
          success: true,
          message: "OTP verified successfully (offline mode)",
          user: {
            id: `user_${Date.now()}`,
            name: "Test User",
            phone,
            email: `${phone}@test.com`,
            userType: "user",
          },
          token: `token_${Date.now()}`,
        };
      }

      return {
        success: false,
        message: "Invalid OTP",
      };
    }

    throw error;
  }
};

/* ===============================
   SHOPS & MASTER DATA
================================ */

export const getShops = async (
  lat: number,
  lng: number,
  category?: string
) => {
  const params: any = { lat, lng };
  if (category) params.category = category;

  const response = await api.get("/shops", { params });
  return response.data;
};

export const getPlans = async () => {
  const response = await api.get("/plans");
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
};

/* ===============================
   MEMBER REGISTRATION (MOCK)
================================ */

export const registerMember = async (memberData: any) => {
  console.log("Registering member (mock):", memberData);

  return {
    success: true,
    message: "Member registered successfully",
    memberId: `MEM${Date.now()}`,
    data: memberData,
  };

  // Real API (enable later)
  // const response = await externalApi.post("/customer/", memberData);
  // return response.data;
};

/* ===============================
   MERCHANT REGISTRATION (MOCK)
================================ */

export const registerMerchant = async (merchantData: any) => {
  console.log("Registering merchant (mock):", merchantData);

  return {
    success: true,
    message: "Merchant registered successfully",
    merchantId: `MER${Date.now()}`,
    data: merchantData,
  };

  // Real API (enable later)
  // const response = await externalApi.post("/merchant/", merchantData);
  // return response.data;
};

/* ===============================
   PAYMENT (MOCK)
================================ */

export const processPayment = async (paymentData: any) => {
  console.log("Processing payment (mock):", paymentData);

  return {
    success: true,
    transactionId: `TXN${Date.now()}`,
    message: "Payment successful",
    savings: paymentData.amount * 0.1,
  };
};

/* ===============================
   USER SEARCH API (After OTP Verification)
================================ */

const INTOWN_API_BASE = "https://devapi.intownlocal.com/IN";

export interface UserSearchResponse {
  user?: any;
  customer?: any;
  merchant?: any;
}

export const searchUserByPhone = async (phoneNumber: string): Promise<UserSearchResponse> => {
  try {
    // Clean phone number - remove +91 or 91 prefix if present
    let cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.startsWith("91") && cleanPhone.length > 10) {
      cleanPhone = cleanPhone.substring(2);
    }
    
    console.log("Searching user by phone:", cleanPhone);
    
    const response = await axios.get(`${INTOWN_API_BASE}/search/${cleanPhone}`, {
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    console.log("User search response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("User search error:", error.message);
    
    // Return empty response on error - user will be treated as new user
    return {
      user: null,
      customer: null,
      merchant: null,
    };
  }
};

/* ===============================
   DETERMINE USER ROLE & DASHBOARD
================================ */

export type UserRole = 'user' | 'customer' | 'merchant' | 'dual' | 'new';

export interface RoleInfo {
  role: UserRole;
  dashboard: string;
  userData: UserSearchResponse;
}

export const determineUserRole = (response: UserSearchResponse): RoleInfo => {
  const hasUser = response.user && Object.keys(response.user).length > 0;
  const hasCustomer = response.customer && Object.keys(response.customer).length > 0;
  const hasMerchant = response.merchant && Object.keys(response.merchant).length > 0;
  
  console.log("Role check - User:", hasUser, "Customer:", hasCustomer, "Merchant:", hasMerchant);
  
  // Check for dual role (customer + merchant)
  if (hasCustomer && hasMerchant) {
    return {
      role: 'dual',
      dashboard: '/dual-dashboard',
      userData: response,
    };
  }
  
  // Single role checks
  if (hasMerchant) {
    return {
      role: 'merchant',
      dashboard: '/merchant-dashboard',
      userData: response,
    };
  }
  
  if (hasCustomer) {
    return {
      role: 'customer',
      dashboard: '/member-dashboard',
      userData: response,
    };
  }
  
  if (hasUser) {
    return {
      role: 'user',
      dashboard: '/user-dashboard',
      userData: response,
    };
  }
  
  // New user - no data found
  return {
    role: 'new',
    dashboard: '/user-dashboard',
    userData: response,
  };
};
