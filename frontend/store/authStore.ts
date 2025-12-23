import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  phone: string;
  userType: 'user' | 'member' | 'merchant' | null; // user type tracking
  membershipPlan?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setUserType: (userType: 'user' | 'member' | 'merchant') => void;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
   updateProfile: (data: { name: string }) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setUser: async (user) => {
    if (user) {
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem('user_data');
    }
    set({ user, isAuthenticated: !!user });
  },
  setToken: async (token) => {
    if (token) {
      await AsyncStorage.setItem('auth_token', token);
    } else {
      await AsyncStorage.removeItem('auth_token');
    }
    set({ token });
  },
  setUserType: async (userType) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, userType };
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    }
  },
  logout: async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      // Reset state immediately
      set({ user: null, token: null, isAuthenticated: false });
      console.log('Auth store logout completed');
    } catch (error) {
      console.error('Error in auth store logout:', error);
      // Reset state even if storage clear fails
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
  loadAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      if (token && userData) {
        const user = JSON.parse(userData);
        set({ user, token, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    }
  },
 updateProfile: (data) =>
  set((state) => ({
    user: state.user
      ? { ...state.user, ...data }
      : state.user,
  })),


}));