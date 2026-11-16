import { INPOINTS_API_BASE } from './api';

export interface INCoinsBalance { phoneNumber: string; inCoins: number; lastUpdated: string | null }
export interface INCoinsTransaction { id: number; coins: number; transactionType: string; description: string; created: string | null }
export interface INCoinsHistory { phoneNumber: string; totalCoins: number | null; transactions: INCoinsTransaction[] }

export function walletPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  const phone = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  if (!/^\d{10}$/.test(phone)) throw new Error('Please sign in with your registered phone number.');
  return phone;
}
const amount = (value: unknown): number => {
  if (value == null || value === '' || !Number.isFinite(Number(value))) throw new Error('Invalid INCoins response. Please retry.');
  return Number(value);
};
async function request(phone: string, token: string, history: boolean) {
  if (!token) throw new Error('Please sign in to view your wallet.');
  const suffix = `/phone/${encodeURIComponent(walletPhone(phone))}${history ? '/history' : ''}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  const options = { signal: controller.signal, headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } };
  let json: any;
  try {
    let response = await fetch(`${INPOINTS_API_BASE}/coins${suffix}`, options);
    // Legacy phone aliases only; never fall back on authorization or server errors.
    if (response.status === 404 || response.status === 405) response = await fetch(`${INPOINTS_API_BASE}/points${suffix}`, options);
    if (response.status === 404 || response.status === 405) {
      // Redact the phone and token; retain the host to diagnose deployment mismatches.
      console.warn('[INCoins] Phone wallet routes unavailable at API base:', INPOINTS_API_BASE);
      throw new Error('INCoins wallets are currently unavailable on this server. Please try again later.');
    }
    if (!response.ok) throw new Error(`Unable to load INCoins (HTTP ${response.status}). Please retry.`);
    json = await response.json();
  } finally { clearTimeout(timer); }
  const data = json?.data ?? json;
  if (data?.phoneNumber && walletPhone(String(data.phoneNumber)) !== walletPhone(phone)) throw new Error('Wallet identity does not match your account.');
  return data;
}
export async function getINCoinsBalanceByPhone(phone: string, token: string): Promise<INCoinsBalance> {
  const data = await request(phone, token, false);
  return { phoneNumber: walletPhone(phone), inCoins: amount(data.inCoins ?? data.inPoints ?? data.currentTotalPoints), lastUpdated: data.lastUpdated ?? null };
}
export async function getINCoinsHistoryByPhone(phone: string, token: string): Promise<INCoinsHistory> {
  const data = await request(phone, token, true);
  if (!Array.isArray(data.transactions)) throw new Error('Invalid INCoins history. Please retry.');
  return { phoneNumber: walletPhone(phone), totalCoins: data.totalCoins == null && data.totalPoints == null ? null : amount(data.totalCoins ?? data.totalPoints),
    transactions: data.transactions.map((item: any) => {
      if (!Number.isSafeInteger(Number(item.id))) throw new Error('Invalid INCoins transaction.');
      return { id: Number(item.id), coins: amount(item.coins ?? item.points), transactionType: item.transactionType || '', description: item.description || item.merchantName || '', created: item.created ?? null };
    }) };
}
// Documented display settings, never used to calculate or credit a balance.
export const DOCUMENTED_REFERRAL_REWARDS = [
  { label: 'Customer — Free Trial', coins: 300 },
  { label: 'Merchant START', coins: 500 },
  { label: 'Merchant LAUNCH', coins: 1000 },
];
export const referralShareMessage = (phone: string) => `Join INtown and enter my registered phone number ${walletPhone(phone)} in the Referred By field during registration to receive eligible INCoins referral rewards.`;
export const transactionTitle = (type: string) => type ? type.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) : 'INCoins activity';
