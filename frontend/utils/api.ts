import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
const EXTERNAL_API = 'http://intownlocal.us-east-1.elasticbeanstalk.com/it';

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const externalApi = axios.create({
  baseURL: EXTERNAL_API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth APIs
export const sendOTP = async (phone: string) => {
  try {
    const response = await api.post('/send-otp', { phone });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    // Fallback for development/testing
    return {
      success: true,
      message: 'OTP sent successfully (offline mode)',
      otp: '1234' // For testing
    };
  }
};

export const verifyOTP = async (phone: string, otp: string) => {
  try {
    const response = await api.post('/verify-otp', { phone, otp });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    // Fallback for development/testing
    if (otp === '1234') {
      return {
        success: true,
        message: 'OTP verified successfully (offline mode)',
        user: {
          id: `user_${Date.now()}`,
          name: 'Test User',
          phone: phone,
          email: `${phone}@test.com`,
          userType: 'user'
        },
        token: `token_${Date.now()}`
      };
    } else {
      return {
        success: false,
        message: 'Invalid OTP'
      };
    }
  }
};

// Shop APIs
export const getShops = async (lat: number, lng: number, category?: string) => {
  const params: any = { lat, lng };
  if (category) params.category = category;
  const response = await api.get('/shops', { params });
  return response.data;
};

export const getPlans = async () => {
  const response = await api.get('/plans');
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

// Member Registration (External API - Mocked for now)
export const registerMember = async (memberData: any) => {
  // Mock response for now
  console.log('Registering member:', memberData);
  return {
    success: true,
    message: 'Member registered successfully',
    memberId: `MEM${Date.now()}`,
    data: memberData,
  };
  
  // Real API call (uncomment when ready):
  // const response = await externalApi.post('/customer/', memberData);
  // return response.data;
};

// Merchant Registration (External API - Mocked for now)
export const registerMerchant = async (merchantData: any) => {
  // Mock response for now
  console.log('Registering merchant:', merchantData);
  return {
    success: true,
    message: 'Merchant registered successfully',
    merchantId: `MER${Date.now()}`,
    data: merchantData,
  };
  
  // Real API call (uncomment when ready):
  // const response = await externalApi.post('/merchant/', merchantData);
  // return response.data;
};

// Payment API (Mocked)
export const processPayment = async (paymentData: any) => {
  console.log('Processing payment:', paymentData);
  return {
    success: true,
    transactionId: `TXN${Date.now()}`,
    message: 'Payment successful',
    savings: paymentData.amount * 0.1,
  };
  
};
// 🔐 Check role after OTP verification
export const checkUserRole = async (phone: string) => {
  const response = await fetch('http://localhost:8080/auth/check-role', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone }),
  });

  if (!response.ok) {
    throw new Error('Failed to check user role');
  }

  return response.json();
};
// 👤 Auto-register new user
export const autoRegisterUser = async (phone: string) => {
  const response = await fetch('http://localhost:8080/auth/auto-register-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone }),
  });

  if (!response.ok) {
    throw new Error('Failed to auto-register user');
  }

  return response.json();
};


