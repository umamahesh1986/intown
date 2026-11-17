import { Booking, statusStyle } from './slotBookings';
import { send } from './orderPush';
import { searchUserByPhone } from './api';
export function bookingNotification(b: Booking, merchant: boolean) {
  const cancelled = b.status === 'CANCELLED';
  return {
    kind: merchant ? cancelled ? 'BOOKING_CANCELLED_MERCHANT' as const : 'BOOKING_RECEIVED_MERCHANT' as const : 'BOOKING_STATUS_CUSTOMER' as const,
    title: merchant ? cancelled ? 'Booking cancelled' : 'New slot request' : b.status === 'ACCEPTED' ? 'Booking confirmed' : `Booking ${statusStyle[b.status]?.label.toLowerCase() || 'updated'}`,
    body: `${merchant ? b.customerName || 'Customer' : b.merchantName || 'Merchant'} · ${b.bookingDate} · ${b.startTime} – ${b.endTime}${b.merchantActionReason ? '\n' + b.merchantActionReason : ''}`,
    targetRoute: merchant ? '/merchant-bookings' as const : '/my-bookings' as const,
    bookingDate: b.bookingDate, targetTab: b.status, pickup_id: b.bookingId,
  };
}
export async function pushBookingEvent(b: Booking, merchant: boolean) {
  try {
    let id: string | number | undefined = b.merchantId;
    if (!merchant) { id = b.customerId; if (!id) { const lookup = await searchUserByPhone(b.customerPhoneNumber); id = lookup?.customer?.id ?? lookup?.data?.customer?.id; } }
    if (!id) return;
    const n = bookingNotification(b, merchant);
    await send({ toRole: merchant ? 'merchant' : 'customer', toUserId: id, title: n.title, body: n.body, data: { type: n.kind, bookingDate: b.bookingDate, bookingId: b.bookingId, pickup_id: b.bookingId, status: b.status } });
  } catch { /* Delivery failure must not reverse a successful booking. */ }
}
