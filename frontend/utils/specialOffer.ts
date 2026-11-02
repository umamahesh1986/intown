export interface SpecialOfferSource {
  specialOffers?: (string | null)[] | string | null;
  specialOfferEndDate?: string | null;
  s3ImageUrl?: unknown;
}

// Special-offer banner image convention: uploaded via the merchant S3 upload API with a fixed
// file name so the backend keeps it alongside the shop gallery and customers can identify it.
export const SPECIAL_OFFER_IMAGE_PREFIX = 'special_offer';
export const specialOfferImageFileName = (merchantId: string | number) => `${SPECIAL_OFFER_IMAGE_PREFIX}_${merchantId}.jpg`;

const fileNameFromUrl = (url: string) => {
  try {
    return decodeURIComponent(url.split('?')[0].split('#')[0].split('/').pop() || '');
  } catch {
    return '';
  }
};
export const isSpecialOfferImageName = (name?: string | null) =>
  !!name && name.toLowerCase().startsWith(SPECIAL_OFFER_IMAGE_PREFIX);
export const isSpecialOfferImageUrl = (url?: string | null) => !!url && isSpecialOfferImageName(fileNameFromUrl(url));

// Finds the special-offer banner inside a merchant's `s3ImageUrl` list (objects with fileName or plain URLs).
export const getSpecialOfferImageUrl = (shop?: SpecialOfferSource | null): string | null => {
  const raw = shop?.s3ImageUrl;
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [];
  for (const item of list) {
    if (typeof item === 'string') {
      if (isSpecialOfferImageUrl(item)) return item;
    } else if (item && typeof item === 'object') {
      const o = item as { fileName?: string; s3ImageUrl?: string; url?: string };
      const url = o.s3ImageUrl || o.url || '';
      if (isSpecialOfferImageName(o.fileName) || isSpecialOfferImageUrl(url)) return url || null;
    }
  }
  return null;
};

const parseEnd = (iso?: string | null): Date | null => {
  if (!iso) return null;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T23:59:59.999`) : new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

export const isSpecialOfferExpired = (shop?: SpecialOfferSource | null, now = Date.now()) => {
  const end = parseEnd(shop?.specialOfferEndDate);
  return !!end && end.getTime() < now;
};

// Trimmed, non-empty offers — empty when the merchant has none or the end date has passed.
export const getActiveSpecialOffers = (shop?: SpecialOfferSource | null, now = Date.now()): string[] => {
  if (!shop || isSpecialOfferExpired(shop, now)) return [];
  const raw = shop.specialOffers;
  const offers = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split('\n') : [];
  return offers.map((o) => String(o || '').trim()).filter(Boolean);
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

// Customer-facing countdown: "Ends today" / "Ends tomorrow" / "5 days left" / "till 30 Oct 2026". urgent ≤ 2 days.
export const formatOfferTimeLeft = (
  shop?: SpecialOfferSource | null,
  now = Date.now(),
): { label: string; urgent: boolean } | null => {
  const days = daysUntilOfferEnds(shop, now);
  if (days == null || days < 0) return null;
  if (days === 0) return { label: 'Ends today', urgent: true };
  if (days === 1) return { label: 'Ends tomorrow', urgent: true };
  if (days <= 7) return { label: `${days} days left`, urgent: days <= 2 };
  return { label: `till ${formatOfferValidTill(shop)}`, urgent: false };
};
