import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  phone: string;
  userType: 'user' | 'member' | 'merchant' | 'dual' | null;
  membershipPlan?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setUserType: (userType: 'user' | 'member' | 'merchant' | 'dual') => void;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
  updateProfile: (data: { name: string }) => void;
  setGuest: (isGuest: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isGuest: false,
  setUser: async (user) => {
    if (user) {
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem('user_data');
    }
    // A real login always supersedes any earlier guest session.
    set({ user, isAuthenticated: !!user, isGuest: false });
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
      // Clear ALL cached keys from AsyncStorage
      const keysToRemove = [
        'auth_token',
        'user_data',
        'customer_id',
        'merchant_id',
        'merchant_shop_name',
        'user_search_response',
        'user_role',
        'user_type',
      ];
      await AsyncStorage.multiRemove(keysToRemove);

      // Reset state immediately
      set({ user: null, token: null, isAuthenticated: false, isGuest: false });
      console.log('Auth store logout completed — all data cleared');
    } catch (error) {
      console.error('Error in auth store logout:', error);
      // Reset state even if storage clear fails
      set({ user: null, token: null, isAuthenticated: false, isGuest: false });
    }
  },
  loadAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      if (token && userData) {
        const user = JSON.parse(userData);
        set({ user, token, isAuthenticated: true, isGuest: false });
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

  setGuest: (isGuest) => {
    set({ isGuest });
  },

}));