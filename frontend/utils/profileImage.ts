import AsyncStorage from '@react-native-async-storage/async-storage';

// Single source of truth for the profile avatar. The backend's
// `/IN/search/{phone}` response returns BOTH customer.images and
// merchant.images for dual users — each image has { isPrimary, s3ImageUrl }.
// We persist them under role-specific keys so every screen (dashboards, account,
// member card, etc.) can pick the right avatar without re-fetching.

export type ProfileRole = 'customer' | 'merchant';

const key = (role: ProfileRole) => `profile_image_${role}`;
const LEGACY_KEY = 'user_profile_image'; // older single-key cache
// account.tsx historically wrote under these names — mirror writes so it keeps
// working without changes.
const accountKey = (role: ProfileRole) =>
  role === 'customer' ? 'customer_profile_image' : 'merchant_profile_image';

export const pickPrimaryS3Url = (images: unknown): string | null => {
  if (typeof images === 'string') return images || null;
  if (!Array.isArray(images) || images.length === 0) return null;
  const withUrl = images.map((img: any) => typeof img === 'string' ? { s3ImageUrl: img } : { ...img, s3ImageUrl: img?.s3ImageUrl || img?.url })
    .filter((img: any) => typeof img?.s3ImageUrl === 'string' && img.s3ImageUrl.length > 0 && !/special_offer/i.test(img.s3ImageUrl));
  if (withUrl.length === 0) return null;
  const primary = withUrl.find((img: any) => img?.isPrimary);
  return primary?.s3ImageUrl ?? withUrl[withUrl.length - 1].s3ImageUrl;
};

export const profileImageFromRecord = (record: any): string | null =>
  pickPrimaryS3Url(record?.images) || pickPrimaryS3Url(record?.s3ImageUrl) ||
  pickPrimaryS3Url(record?.profileImage) || pickPrimaryS3Url(record?.image);

export const getProfileImage = async (role: ProfileRole): Promise<string | null> => {
  // Check canonical key, then legacy variants (account.tsx and pre-refactor code).
  const candidates = await Promise.all([
    AsyncStorage.getItem(accountKey(role)),
    AsyncStorage.getItem(key(role)),
    AsyncStorage.getItem('user_search_response'),
    AsyncStorage.getItem(`${role}_profile_images`),
    AsyncStorage.getItem(LEGACY_KEY),
  ]);
  let searchImage: string | null = null;
  let galleryImage: string | null = null;
  try { searchImage = profileImageFromRecord(JSON.parse(candidates[2] || '{}')?.[role]); } catch {}
  try { galleryImage = pickPrimaryS3Url(JSON.parse(candidates[3] || '[]')); } catch {}
  return candidates[0] || candidates[1] || searchImage || galleryImage || candidates[4] || null;
};

// The customer avatar is also served by /s3; it is not always included by /profile.
export const refreshProfileImage = async (role: ProfileRole, apiBase: string): Promise<string | null> => {
  const cached = await getProfileImage(role);
  let id = await AsyncStorage.getItem(`${role}_id`);
  if (!id) {
    try { id = JSON.parse((await AsyncStorage.getItem('user_search_response')) || '{}')?.[role]?.id; } catch {}
  }
  if (!id) return cached;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${apiBase}/s3?${role}Id=${encodeURIComponent(String(id))}`, { signal: controller.signal });
    if (!response.ok) return cached;
    const body = await response.json();
    const data = body?.data ?? body;
    const url = Array.isArray(data) ? pickPrimaryS3Url(data) : profileImageFromRecord(data);
    if (url) await setProfileImage(role, url);
    return url || cached;
  } catch { return cached; }
  finally { clearTimeout(timeout); }
};

export const setProfileImage = async (
  role: ProfileRole,
  url: string | null,
): Promise<void> => {
  if (url) {
    await AsyncStorage.multiSet([
      [key(role), url],
      [accountKey(role), url],
      [LEGACY_KEY, url],
    ]);
  } else {
    await AsyncStorage.multiRemove([key(role), accountKey(role)]);
  }
};

// Pulls the primary image URL out of the `/IN/search/{phone}` response and
// persists customer + merchant images under their respective role keys.
export const persistProfileImagesFromSearchResponse = async (
  response: unknown,
): Promise<void> => {
  const r: any = response ?? {};
  const customerUrl = pickPrimaryS3Url(r.customer?.images);
  const merchantUrl = pickPrimaryS3Url(r.merchant?.images);

  if (customerUrl) await setProfileImage('customer', customerUrl);
  if (merchantUrl) await setProfileImage('merchant', merchantUrl);
  // setProfileImage already mirrors to LEGACY_KEY; if only one role was
  // populated, prefer customer for the single-key fallback (matches old
  // behavior for customer-only users, who were the majority).
  if (customerUrl && !merchantUrl) await AsyncStorage.setItem(LEGACY_KEY, customerUrl);
};
