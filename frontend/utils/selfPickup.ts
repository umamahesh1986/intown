// Compare registered Indian phone numbers independently of dashboard role or IDs.
export function isSelfPickup(customerPhone: unknown, merchantPhone: unknown): boolean {
  const normalize = (value: unknown): string | null => {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const digits = String(value).replace(/\D/g, '');
    const phone = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
    return /^\d{10}$/.test(phone) ? phone : null;
  };
  const customer = normalize(customerPhone);
  const merchant = normalize(merchantPhone);
  return customer !== null && merchant !== null && customer === merchant;
}
