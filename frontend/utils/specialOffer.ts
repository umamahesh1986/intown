export interface SpecialOfferSource {
  specialOffers?: (string | null)[] | null;
  specialOfferEndDate?: string | null;
}

const parseEnd = (iso?: string | null): Date | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

export const isSpecialOfferExpired = (shop?: SpecialOfferSource | null, now = Date.now()) => {
  const end = parseEnd(shop?.specialOfferEndDate);
  return !!end && end.getTime() < now;
};

// Trimmed, non-empty offers — empty when the merchant has none or the end date has passed.
export const getActiveSpecialOffers = (shop?: SpecialOfferSource | null, now = Date.now()): string[] => {
  if (!shop || isSpecialOfferExpired(shop, now)) return [];
  return (shop.specialOffers || []).map((o) => String(o || '').trim()).filter(Boolean);
};

export const formatOfferValidTill = (shop?: SpecialOfferSource | null) => {
  const end = parseEnd(shop?.specialOfferEndDate);
  return end ? end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
};

// Calendar days left until the end date (0 = ends today, 1 = tomorrow). null when no end date.
export const daysUntilOfferEnds = (shop?: SpecialOfferSource | null, now = Date.now()): number | null => {
  const end = parseEnd(shop?.specialOfferEndDate);
  if (!end) return null;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOfDay(end) - startOfDay(new Date(now))) / 86400000);
};
