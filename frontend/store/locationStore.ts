import { create } from 'zustand';

interface Location {
  latitude: number;
  longitude: number;
}

interface LocationState {
  location: Location | null;
  hasPermission: boolean | null;
  setLocation: (location: Location) => void;
  setPermission: (hasPermission: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  location: null,
  hasPermission: null,
  setLocation: (location) => set({ location }),
  setPermission: (hasPermission) => set({ hasPermission }),
}));