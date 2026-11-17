export function referralNumber(value?: string): string {
  const phone = (value || '').trim();
  if (phone && !/^\d{10}$/.test(phone)) throw new Error('Referred By must be a 10-digit phone number.');
  return phone;
}
export function registrationReferralMessage(response: any): string {
  const message = response?.referralMessage ?? response?.data?.referralMessage;
  return typeof message === 'string' ? message.trim() : '';
}
