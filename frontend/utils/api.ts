import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions
export const sendOTP = async (phone: string) => {
  const response = await api.post('/send-otp', { phone });
  return response.data;
};

export const verifyOTP = async (phone: string, otp: string) => {
  const response = await api.post('/verify-otp', { phone, otp });
  return response.data;
};

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

export const processPayment = async (paymentData: any) => {
  const response = await api.post('/payment', paymentData);
  return response.data;
};