import { Platform } from 'react-native';
import * as Application from 'expo-application';
import axios from 'axios';

const ANDROID_PACKAGE_ID = 'com.intown.andriod';
const IOS_BUNDLE_ID = 'com.vinodreddy.intownlocal';

export const STORE_URLS = {
  android: `market://details?id=${ANDROID_PACKAGE_ID}`,
  androidWeb: `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_ID}`,
};

interface StoreRelease {
  version: string;
  storeUrl: string;
}

interface VersionCheckResult {
  updateRequired: boolean;
  installedVersion: string | null;
  storeVersion: string | null;
  storeUrl?: string;
}

export const compareVersion = (installed: string, published: string): number => {
  const left = installed.split('.').map(Number);
  const right = published.split('.').map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const difference = (left[i] ?? 0) - (right[i] ?? 0);
    if (difference) return difference;
  }
  return 0;
};

const isVersion = (value: unknown): value is string =>
  typeof value === 'string' && /^\d+(?:\.\d+)*$/.test(value);

export const parsePlayStoreVersion = (html: string): string | null => {
  // Play does not provide a public version API. Keep matches anchored to
  // version metadata rather than matching unrelated numbers in the page.
  const patterns = [
    /"softwareVersion"\s*:\s*"(\d+(?:\.\d+)*)"/i,
    /\[\[\["(\d+(?:\.\d+)+)"\]\],/,
    /Current\s+Version[^<]*<\/div>\s*<span[^>]*>\s*(\d+(?:\.\d+)*)\s*</i,
  ];
  for (const pattern of patterns) {
    const version = html.match(pattern)?.[1];
    if (isVersion(version)) return version;
  }
  return null;
};

const getStoreRelease = async (): Promise<StoreRelease | null> => {
  if (Platform.OS === 'android') {
    const response = await axios.get(`${STORE_URLS.androidWeb}&hl=en_IN&gl=IN`, {
      timeout: 12000,
      headers: { Accept: 'text/html', 'User-Agent': 'Mozilla/5.0' },
    });
    const version = typeof response.data === 'string'
      ? parsePlayStoreVersion(response.data)
      : null;
    return version ? { version, storeUrl: STORE_URLS.androidWeb } : null;
  }

  const response = await axios.get('https://itunes.apple.com/lookup', {
    params: { bundleId: IOS_BUNDLE_ID, country: 'in' },
    timeout: 12000,
    headers: { Accept: 'application/json' },
  });
  const results = response.data?.results;
  const app = Array.isArray(results)
    ? results.find((result: { bundleId?: string }) => result.bundleId === IOS_BUNDLE_ID)
    : null;
  if (!isVersion(app?.version) || !Number.isSafeInteger(app?.trackId) || app.trackId <= 0) {
    return null;
  }
  // Use Apple's numeric listing ID returned by lookup; bundle IDs are not app URLs.
  return { version: app.version, storeUrl: `https://apps.apple.com/in/app/id${app.trackId}` };
};

export const checkForUpdate = async (): Promise<VersionCheckResult> => {
  const installedVersion = Application.nativeApplicationVersion;
  const noUpdate = { updateRequired: false, installedVersion, storeVersion: null };
  if ((Platform.OS !== 'android' && Platform.OS !== 'ios') || !isVersion(installedVersion)) {
    return noUpdate;
  }
  try {
    const release = await getStoreRelease();
    if (!release) return noUpdate;
    return {
      updateRequired: compareVersion(installedVersion, release.version) < 0,
      installedVersion,
      storeVersion: release.version,
      storeUrl: release.storeUrl,
    };
  } catch (error) {
    // Offline users can still open the app; retry on the next foreground event.
    console.warn('[VersionCheck] Store lookup failed:', error);
    return noUpdate;
  }
};
