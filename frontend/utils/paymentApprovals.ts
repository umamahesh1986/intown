import { INTOWN_API_BASE } from './api';

export interface PendingPayment {
  transactionId: number;
  customerId: number;
  merchantId: number;
  customerName?: string;
  totalPrice: number;
  payablePrice: number;
  inTownSavings?: number;
  pointsEarned?: number | null;
  status: string;
  message?: string;
}

const headers = (token?: string | null) => ({
  Accept: 'application/json', 'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export async function getPendingPayments(merchantId: string | number, token?: string | null): Promise<PendingPayment[]> {
  const response = await fetch(`${INTOWN_API_BASE}/transactions/merchants/${encodeURIComponent(String(merchantId))}/pending`, { headers: headers(token) });
  if (!response.ok) throw new Error('Unable to load INcoins approvals. Please retry.');
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Unable to read pending payments. Please retry.');
  return data.filter(payment => String(payment.merchantId) === String(merchantId) && payment.status === 'PENDING_APPROVAL');
}

export async function approvePayment(transactionId: number, token?: string | null): Promise<PendingPayment> {
  const response = await fetch(`${INTOWN_API_BASE}/transactions/${encodeURIComponent(String(transactionId))}/merchant-action`, {
    method: 'POST', headers: headers(token), body: JSON.stringify({ action: 'ACCEPT' }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Approval failed. Refresh the list and try again.');
  if (data.status !== 'COMPLETED') throw new Error('Payment approval has not completed. Refresh to check its status.');
  return data;
}
