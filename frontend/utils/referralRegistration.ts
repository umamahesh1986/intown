import AsyncStorage from '@react-native-async-storage/async-storage';

export function referralNumber(value?: string): string {
  const phone = (value || '').trim();
  if (phone && !/^\d{10}$/.test(phone)) throw new Error('Referred By must be a 10-digit phone number.');
  return phone;
}
export function registrationReferralMessage(response: any): string {
  const message = response?.referralMessage ?? response?.data?.referralMessage;
  return typeof message === 'string' ? message.trim() : '';
}
// Installation identifier for backend duplicate-reward checks; not an auth credential.
export async function registrationDeviceId(): Promise<string> {
  const key = 'registration_device_id';
  const existing = await AsyncStorage.getItem(key);
  if (existing) return existing;
  const value = `device_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  await AsyncStorage.setItem(key, value);
  return value;
}
