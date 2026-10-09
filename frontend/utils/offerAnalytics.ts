import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from './api';

// Special-offer analytics live on the INtown companion backend (FastAPI):
//   POST {BACKEND_URL}/api/offer-events            { merchantId, eventType: 'VIEW'|'TAP', customerId?, source? }
//   GET  {BACKEND_URL}/api/offer-analytics/{id}?days=7 → { views, taps, uniqueViewers, byDay[] }
const ANALYTICS_BASE = `${BACKEND_URL}/api`;

export type OfferEventSource = 'shop_details' | 'shop_list' | 'deals_strip';

export interface OfferAnalytics {
  merchantId: string;
  days: number;
  views: number;
  taps: number;
  uniqueViewers: number;
  byDay: { date: string; views: number; taps: number }[];
}

const sent = new Set<string>();

// Tap counts (last `days`) for a set of merchants — used to rank "Deals near you". {} on failure.
export const getTrendingTaps = async (merchantIds: (string | number)[], days = 7): Promise<Record<string, number>> => {
  const ids = merchantIds.map(String).filter(Boolean);
  if (ids.length === 0) return {};
  try {
    const res = await fetch(`${ANALYTICS_BASE}/offer-analytics/trending?merchantIds=${encodeURIComponent(ids.join(','))}&days=${days}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return {};
    const json = await res.json();
    return json?.taps || {};
  } catch {
    return {};
  }
};

// Fire-and-forget; de-duped per merchant/type/source for the app session so re-renders don't inflate counts.
export const trackOfferEvent = async (
  merchantId: string | number | undefined | null,
  eventType: 'VIEW' | 'TAP',
  source: OfferEventSource,
) => {
  if (merchantId == null || merchantId === '') return;
  const key = `${merchantId}|${eventType}|${source}`;
  if (eventType === 'VIEW' && sent.has(key)) return;
  sent.add(key);
  try {
    const customerId = await AsyncStorage.getItem('customer_id');
    await fetch(`${ANALYTICS_BASE}/offer-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId: String(merchantId), eventType, customerId, source }),
    });
  } catch (e) {
    console.warn('[offerAnalytics] track failed', e);
  }
};

export const getOfferAnalytics = async (merchantId: string, days = 7): Promise<OfferAnalytics | null> => {
  try {
    const res = await fetch(`${ANALYTICS_BASE}/offer-analytics/${merchantId}?days=${days}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as OfferAnalytics;
  } catch {
    return null;
  }
};
