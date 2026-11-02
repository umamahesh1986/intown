export type PassRole = 'customer' | 'merchant' | 'dual';

export const passId = (value: unknown): string | null => {
  const id = value == null ? '' : String(value).trim();
  return id && !['null', 'undefined'].includes(id) ? id : null;
};

export function resolvePassRole(from: string | undefined, type: string, customerId: string | null, merchantId: string | null): PassRole {
  if (from?.startsWith('dual')) return 'dual';
  if (from === 'merchant') return 'merchant';
  if (from === 'customer' || from === 'member') return 'customer';
  if (type.toLowerCase().includes('dual') || (customerId && merchantId)) return 'dual';
  return type.toLowerCase().includes('merchant') || merchantId ? 'merchant' : 'customer';
}

export function passValidity(value: unknown): { label: string; expired: boolean } {
  if (typeof value !== 'string' || !value) return { label: 'Not available', expired: false };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { label: 'Not available', expired: false };
  return {
    label: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    expired: date.getTime() < Date.now(),
  };
}
