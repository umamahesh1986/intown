import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================================================
// Lightweight navigation cache — used to pass complex objects (like a shop
// object) between screens WITHOUT bloating the URL with JSON-encoded query
// params. Values live in memory for the current session (instant reads) and
// are also mirrored to AsyncStorage so a page reload / cold start can still
// recover the most recently viewed shop.
// ==========================================================================

type Shop = any;
const memoryCache: Record<string, Shop> = {};
const KEY_PREFIX = 'nav_shop_';
const KEY_CURRENT = 'nav_shop_current';

const idOf = (shop: Shop): string | null => {
  const raw = shop?.id ?? shop?.shopId ?? shop?.merchantId;
  return raw != null ? String(raw) : null;
};

/**
 * Stash a shop object before navigating to a detail screen.
 * Also persists to AsyncStorage as a fallback for reloads.
 */
export const setNavShop = async (shop: Shop): Promise<void> => {
  if (!shop) return;
  const id = idOf(shop);
  if (id) memoryCache[id] = shop;
  memoryCache.__current = shop;
  try {
    if (id) await AsyncStorage.setItem(`${KEY_PREFIX}${id}`, JSON.stringify(shop));
    await AsyncStorage.setItem(KEY_CURRENT, JSON.stringify(shop));
  } catch {}
};

/**
 * Retrieve a shop by id. Reads memory first, then AsyncStorage.
 * If no id is given, returns the last-set shop.
 */
export const getNavShop = async (shopId?: string | number | null): Promise<Shop | null> => {
  const key = shopId != null ? String(shopId) : null;
  if (key && memoryCache[key]) return memoryCache[key];
  if (memoryCache.__current) {
    const currId = idOf(memoryCache.__current);
    if (!key || currId === key) return memoryCache.__current;
  }
  try {
    if (key) {
      const stored = await AsyncStorage.getItem(`${KEY_PREFIX}${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        memoryCache[key] = parsed;
        return parsed;
      }
    }
    const current = await AsyncStorage.getItem(KEY_CURRENT);
    if (current) {
      const parsed = JSON.parse(current);
      const currId = idOf(parsed);
      if (!key || currId === key) {
        if (currId) memoryCache[currId] = parsed;
        memoryCache.__current = parsed;
        return parsed;
      }
    }
  } catch {}
  return null;
};

export const clearNavShop = async (shopId?: string | number | null): Promise<void> => {
  const key = shopId != null ? String(shopId) : null;
  if (key) {
    delete memoryCache[key];
    try { await AsyncStorage.removeItem(`${KEY_PREFIX}${key}`); } catch {}
  }
  delete memoryCache.__current;
  try { await AsyncStorage.removeItem(KEY_CURRENT); } catch {}
};
