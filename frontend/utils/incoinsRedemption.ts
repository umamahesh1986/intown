import AsyncStorage from '@react-native-async-storage/async-storage';
import { INTOWN_API_BASE } from './api';

export const REDEMPTION_WHATSAPP_NUMBER = '919052263555';
export type RedemptionRole = 'customer' | 'merchant';
export interface RedemptionProfile {
  role: RedemptionRole;
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  latitude?: number;
  longitude?: number;
}
type Location = { fullAddress?: string; area?: string; city?: string; latitude?: number; longitude?: number };

export async function loadRedemptionProfile(role: RedemptionRole, token?: string | null): Promise<RedemptionProfile> {
  const id = (await AsyncStorage.getItem(role === 'merchant' ? 'merchant_id' : 'customer_id'))?.trim();
  if (!id || !/^\d+$/.test(id)) throw new Error('Please sign in to load your account details for redemption.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${INTOWN_API_BASE}/${role}/${encodeURIComponent(id)}`, {
      signal: controller.signal, headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!response.ok) throw new Error('Unable to load your account details. Please retry.');
    const body = await response.json();
    const data = body?.data?.[role] ?? body?.[role] ?? body?.data ?? body;
    if (String(data?.id ?? data?.[`${role}Id`]) !== id) throw new Error('Your account details could not be verified. Please sign in again.');
    return {
      role, id, name: String(data.contactName || data.name || data.businessName || 'Not provided'),
      phone: String(data.phoneNumber || data.phone || 'Not provided'), email: String(data.email || 'Not provided'),
      address: String(data.address || 'Not provided'),
      latitude: data.latitude == null ? undefined : Number(data.latitude), longitude: data.longitude == null ? undefined : Number(data.longitude),
    };
  } finally { clearTimeout(timeout); }
}

export function buildRedemptionWhatsAppUrl(profile: RedemptionProfile, balance: number, location?: Location | null): string {
  if (!Number.isFinite(balance) || balance < 0) throw new Error('Your available INcoins balance could not be verified. Please refresh and try again.');
  const currentAddress = location?.fullAddress || [location?.area, location?.city].filter(Boolean).join(', ');
  const coordinates = location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude) ? location : profile;
  const lines = [
    'INtown INcoins redemption request', '',
    `Account type: ${profile.role === 'merchant' ? 'Merchant' : 'Customer'}`,
    `Account ID: ${profile.id}`, `Name: ${profile.name}`, `Phone number: ${profile.phone}`,
    `Email: ${profile.email}`, `Registered address: ${profile.address}`,
    ...(currentAddress ? [`Current location: ${currentAddress}`] : []),
    ...(Number.isFinite(coordinates.latitude) && Number.isFinite(coordinates.longitude)
      ? [`Map: https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`] : []),
    `Available INcoins: ${balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, '',
    'I would like to redeem my INcoins. Please help me with the next steps.',
  ];
  return `https://wa.me/${REDEMPTION_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}
