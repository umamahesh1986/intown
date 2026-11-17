export const APP_DOWNLOAD_URL = 'https://intownlocal.com/download';
export const REFERRAL_REWARD_TEXT = 'For customer referrals: 300 redeemable INCoins.\nFor merchant START plan referrals: 500 redeemable INCoins.\nFor merchant LAUNCH plan referrals: 1000 redeemable INCoins.';

export function appShareMessage(phone?: string | null, url = APP_DOWNLOAD_URL): string {
  const digits = (phone || '').replace(/\D/g, '');
  const referral = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  if (!/^\d{10}$/.test(referral)) return `You are invited to join INtown, your trusted local shopping and rewards platform. ${url}`;
  return `You are invited to join INtown your trusted local shopping and rewards platform. Simply enter this number *${referral}* in the "Referred By" field during registration to unlock exclusive redeemable INCoins. ${url}`;
}
