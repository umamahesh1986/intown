import { Booking, bookingToday, slotRequest } from './slotBookings';
export type BookingPeriod = 'Today' | 'Week' | 'Month' | 'All' | 'Date';
const shiftDate = (date: string, days: number) => {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
export function merchantBookingRange(period: BookingPeriod, selected: string, today = bookingToday()): { start: string; end: string } | null {
  if (period === 'All') return null;
  if (period === 'Today') return { start: today, end: today };
  if (period === 'Date') return { start: selected, end: selected };
  if (period === 'Week') {
    const start = shiftDate(today, -((new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7));
    return { start, end: shiftDate(start, 6) };
  }
  const start = `${today.slice(0, 7)}-01`;
  const next = new Date(`${start}T12:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return { start, end: shiftDate(next.toISOString().slice(0, 10), -1) };
}
export function rangeDates(start: string, end: string): string[] {
  const dates: string[] = [];
  for (let date = start; date <= end; date = shiftDate(date, 1)) dates.push(date);
  return dates;
}
export async function loadMerchantBookings(id: string, token: string | null, period: BookingPeriod, date: string, isCurrent = () => true): Promise<Booking[]> {
  const base = `/merchant/${encodeURIComponent(id)}`;
  const range = merchantBookingRange(period, date);
  const verify = (data: Booking[]) => {
    if (!Array.isArray(data)) throw new Error('Invalid booking history response. Please refresh.');
    return data;
  };
  let records: Booking[] = [];
  if (!range) {
    // The daily endpoint defaults to today when date is omitted (verified in
    // the deployed OpenAPI schema). Full history requires a separate resource.
    // See MERCHANT_BOOKING_HISTORY_BACKEND.md for its server contract.
    if (!isCurrent()) return [];
    try { records = verify(await slotRequest<Booking[]>(`${base}/history`, token)); }
    catch (error: any) {
      if ([400, 404, 405, 422].includes(error.status)) throw new Error('All booking history needs a booking-service update. Your older records cannot be loaded from the daily-only service. Today, week, month and specific-date views remain available.');
      throw error;
    }
  } else {
    const dates = rangeDates(range.start, range.end);
    let cursor = 0;
    let failed = false;
    // At most four daily requests at once; fail the entire range on any error.
    await Promise.all(Array.from({ length: Math.min(4, dates.length) }, async () => {
      while (cursor < dates.length && isCurrent() && !failed) {
        const day = dates[cursor++];
        try {
          const data = verify(await slotRequest<Booking[]>(`${base}?date=${day}`, token));
          records.push(...data.filter(b => b.bookingDate >= range.start && b.bookingDate <= range.end));
        } catch (error) { failed = true; throw error; }
      }
    }));
  }
  records = Array.from(new Map(records.map(b => [b.bookingId, b])).values());
  return records.sort((a, b) => `${b.bookingDate} ${b.startTime}`.localeCompare(`${a.bookingDate} ${a.startTime}`));
}
