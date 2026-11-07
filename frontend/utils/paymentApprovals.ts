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

const customerNames = new Map<string, { name: string; expires: number }>();
const cleanName = (value: unknown) => typeof value === 'string' ? value.trim() : '';

async function resolveCustomerName(customerId: number, merchantId: string | number, token?: string | null): Promise<string> {
  if (!Number.isSafeInteger(customerId) || customerId <= 0) return '';
  const key = `${merchantId}:${customerId}`;
  const cached = customerNames.get(key);
  if (cached && cached.expires > Date.now()) return cached.name;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${INTOWN_API_BASE}/customer/${customerId}`, { headers: headers(token), signal: controller.signal });
    if (!response.ok) return '';
    const body = await response.json();
    const customer = body?.data ?? body;
    if (customer.id != null && String(customer.id) !== String(customerId)) return '';
    const name = cleanName(customer.contactName) || cleanName(customer.name);
    if (name) customerNames.set(key, { name, expires: Date.now() + 5 * 60 * 1000 });
    return name;
  } catch { return ''; }
  finally { clearTimeout(timeout); }
}

export async function getPendingPayments(merchantId: string | number, token?: string | null): Promise<PendingPayment[]> {
  const response = await fetch(`${INTOWN_API_BASE}/transactions/merchants/${encodeURIComponent(String(merchantId))}/pending`, { headers: headers(token) });
  if (!response.ok) throw new Error('Unable to load INcoins approvals. Please retry.');
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Unable to read pending payments. Please retry.');
  const pending: PendingPayment[] = data.filter(payment => String(payment.merchantId) === String(merchantId) && payment.status === 'PENDING_APPROVAL');
  const lookups = new Map<number, Promise<string>>();
  return Promise.all(pending.map(async payment => {
    const existingName = cleanName(payment.customerName);
    if (existingName) return { ...payment, customerName: existingName };
    if (!lookups.has(payment.customerId)) lookups.set(payment.customerId, resolveCustomerName(payment.customerId, merchantId, token));
    return { ...payment, customerName: await lookups.get(payment.customerId) };
  }));
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
