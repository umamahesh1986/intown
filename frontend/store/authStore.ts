import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dob?: string;
  gender?: string;
  userType: 'user' | 'member' | 'merchant' | null; // user type tracking
  membershipPlan?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // async setters (because we use AsyncStorage)
  setUser: (user: User | null) => Promise<void>;
  setToken: (token: string | null) => Promise<void>;
  setUserType: (userType: 'user' | 'member' | 'merchant') => Promise<void>;

  // 🔥 NEW: update only part of the user (for My Account edit screen)
  updateUser: (data: Partial<User>) => Promise<void>;

  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
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
      // ✅ fixed spread bug here
      const updatedUser: User = { ...currentUser, userType };
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    }
  },

  // ✅ NEW: used by My Account editable screen
  updateUser: async (data) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      ...data,
    };

    await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      set({ user: null, token: null, isAuthenticated: false });
      console.log('Auth store logout completed');
    } catch (error) {
      console.error('Error in auth store logout:', error);
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  loadAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      if (token && userData) {
        const user: User = JSON.parse(userData);
        set({ user, token, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    }
  },
}));
