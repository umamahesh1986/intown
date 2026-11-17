import { INTOWN_API_BASE } from './api';
export type BookingStatus = 'PENDING_APPROVAL' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED' | 'NO_SHOW';
export interface Booking { customerId?: number; bookingId: string; merchantId: number; merchantName?: string; customerName?: string; customerPhoneNumber: string; bookingDate: string; startTime: string; endTime: string; numberOfPeople: number; status: BookingStatus; merchantActionReason?: string; respondBy?: string; notes?: string }
export interface Slot { startTime: string; endTime: string; status: 'AVAILABLE' | 'BOOKED' | 'BREAK' | 'PAST' | 'CLOSED'; availableCapacity: number; totalCapacity: number }
export interface Availability { merchantId: number; businessName: string; businessCategory: string; bookingDate: string; isWeekOff: boolean; slotCapacity: number; slots: Slot[] }
export const statusStyle: Record<BookingStatus, { label: string; color: string; backgroundColor: string }> = {
  PENDING_APPROVAL: { label: 'Awaiting Confirmation', color: '#B45309', backgroundColor: '#FFF3D6' },
  ACCEPTED: { label: 'Confirmed', color: '#15803D', backgroundColor: '#DCFCE7' },
  REJECTED: { label: 'Declined', color: '#B91C1C', backgroundColor: '#FEE2E2' },
  CANCELLED: { label: 'Cancelled', color: '#64748B', backgroundColor: '#F1F5F9' },
  COMPLETED: { label: 'Completed', color: '#1D4ED8', backgroundColor: '#DBEAFE' },
  EXPIRED: { label: 'Expired', color: '#64748B', backgroundColor: '#F1F5F9' },
  NO_SHOW: { label: 'No Show', color: '#B91C1C', backgroundColor: '#FFF' },
};
// Booking dates and wall-clock times belong to the Indian merchant, regardless of device timezone.
export const bookingToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export function bookingDates(today = bookingToday()) { return Array.from({ length: 8 }, (_, i) => { const d = new Date(`${today}T12:00:00+05:30`); d.setUTCDate(d.getUTCDate() + i); return d.toISOString().slice(0, 10); }); }
export const slotStart = (date: string, time: string) => new Date(`${date}T${time.length === 5 ? time + ':00' : time}+05:30`).getTime();
export const canCancel = (b: Booking, now = Date.now()) => b.status === 'PENDING_APPROVAL' || (b.status === 'ACCEPTED' && slotStart(b.bookingDate, b.startTime) - now >= 3600000);
export const canRequest = (date: string, slot: Slot, now = Date.now()) => slot.status === 'AVAILABLE' && slot.availableCapacity > 0 && slotStart(date, slot.startTime) - now >= 3600000;
export function bookingPhone(phone: string) { const value = phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''); if (!/^\d{10}$/.test(value)) throw new Error('Please sign in with your registered phone number.'); return value; }
export class SlotApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function slotRequest<T>(path: string, token: string | null, body?: unknown): Promise<T> {
  if (!token) throw new Error('Please sign in to manage bookings.');
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`${INTOWN_API_BASE}/slots${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: controller.signal });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new SlotApiError(res.status, res.status === 404 && !data?.message ? 'Slot booking is unavailable on this server. Please try again later.' : data?.message || data?.error || `Unable to update bookings (${res.status}). Please retry.`);
    return data?.data ?? data;
  } finally { clearTimeout(timer); }
}
