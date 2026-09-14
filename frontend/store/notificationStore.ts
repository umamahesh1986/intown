import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'intown_notifications_v1';
const MAX_ITEMS = 50;

export type NotificationKind = 'ORDER_PLACED_CUSTOMER' | 'ORDER_RECEIVED_MERCHANT';

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  targetRoute: '/my-orders' | '/merchant-orders';
  targetTab: string;      // e.g. 'PLACED'
  pickup_id: string;
}

interface NotificationState {
  items: NotificationItem[];
  hydrated: boolean;
  unreadCount: () => number;
  hydrate: () => Promise<void>;
  add: (n: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

const persist = async (items: NotificationItem[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('[notificationStore] persist failed', e);
  }
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  hydrated: false,

  unreadCount: () => get().items.filter((n) => !n.read).length,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as NotificationItem[]) : [];
      set({ items: Array.isArray(parsed) ? parsed : [], hydrated: true });
    } catch {
      set({ items: [], hydrated: true });
    }
  },

  add: (n) => {
    const item: NotificationItem = {
      ...n,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      read: false,
    };
    // De-dupe: if a notification for the same pickup_id + kind already exists and is unread, skip
    const existing = get().items.find(
      (x) => x.pickup_id === item.pickup_id && x.kind === item.kind && !x.read,
    );
    if (existing) return;

    const next = [item, ...get().items].slice(0, MAX_ITEMS);
    set({ items: next });
    persist(next);
  },

  markRead: (id) => {
    const next = get().items.map((n) => (n.id === id ? { ...n, read: true } : n));
    set({ items: next });
    persist(next);
  },

  markAllRead: () => {
    const next = get().items.map((n) => ({ ...n, read: true }));
    set({ items: next });
    persist(next);
  },

  clear: () => {
    set({ items: [] });
    persist([]);
  },
}));
