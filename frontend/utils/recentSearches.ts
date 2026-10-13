import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'recent_searches_v1';
export const MAX_RECENT_SEARCHES = 5;

export const loadRecentSearches = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string' && s.trim()) : [];
  } catch {
    return [];
  }
};

// Most recent first, de-duplicated case-insensitively, capped at MAX_RECENT_SEARCHES.
export const addRecentSearch = async (term: string): Promise<string[]> => {
  const clean = term.trim();
  if (!clean) return loadRecentSearches();
  const existing = await loadRecentSearches();
  const next = [clean, ...existing.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(
    0,
    MAX_RECENT_SEARCHES,
  );
  await AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  return next;
};

export const clearRecentSearches = async (): Promise<void> => {
  await AsyncStorage.removeItem(KEY).catch(() => {});
};
