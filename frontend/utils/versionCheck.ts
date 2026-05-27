import { Platform } from 'react-native';
import * as Application from 'expo-application';
import axios from 'axios';

/**
 * App Force-Update Check
 * Compares the installed app version against the latest version
 * available on Google Play Store (Android) / Apple App Store (iOS).
 */

const ANDROID_PACKAGE_ID = 'com.intown.andriod'; // from app.json -> android.package
const IOS_BUNDLE_ID = 'com.vinodreddy.intownlocal'; // from app.json -> ios.bundleIdentifier

export interface VersionCheckResult {
  updateRequired: boolean;
  installedVersion: string | null;
  storeVersion: string | null;
}

/** Parse "x.y.z" into a numeric tuple suitable for comparison */
const parseVersion = (v: string | null | undefined): number[] => {
  if (!v) return [0, 0, 0];
  return v
    .split('.')
    .map((part) => parseInt(part.replace(/\D/g, ''), 10) || 0);
};

/** -1 if a<b, 0 if equal, 1 if a>b */
const compareVersion = (a: string, b: string): number => {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
};

const getInstalledVersion = (): string | null => {
  return Application.nativeApplicationVersion ?? null;
};

/** Scrapes the Play Store HTML to find the latest published version */
const getPlayStoreVersion = async (
  packageId: string,
): Promise<string | null> => {
  try {
    const url = `https://play.google.com/store/apps/details?id=${packageId}&hl=en&gl=us`;
    const res = await axios.get(url, {
      timeout: 12000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 13; SM-S908U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    const html: string = res.data ?? '';
    // Try several patterns Google has used; first match wins.
    const patterns = [
      /\[\[\["([\d.]+)"\]\],\s*"[\d.]+",/, // anchored layout block
      /"softwareVersion"\s*:\s*"([\d.]+)"/i,
      /Current\s+Version[^<]*<\/div>\s*<span[^>]*>\s*([\d.]+)\s*</i,
      /Version[^"]{0,40}"\s*>([\d.]+)</i,
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m && m[1]) return m[1].trim();
    }
    return null;
  } catch (e) {
    console.warn('[VersionCheck] Play Store fetch failed:', (e as Error).message);
    return null;
  }
};

/** iTunes Lookup — public, no auth required */
const getAppStoreVersion = async (
  bundleId: string,
): Promise<string | null> => {
  try {
    const res = await axios.get(
      `https://itunes.apple.com/lookup?bundleId=${bundleId}`,
      { timeout: 12000, headers: { Accept: 'application/json' } },
    );
    const v = res.data?.results?.[0]?.version;
    return typeof v === 'string' ? v : null;
  } catch (e) {
    console.warn('[VersionCheck] App Store fetch failed:', (e as Error).message);
    return null;
  }
};

/**
 * Main entry: returns whether the current installed app is older than the
 * store version. Failure to reach the store is treated as "no update required"
 * so the user is never locked out by a transient network issue.
 */
export const checkForUpdate = async (): Promise<VersionCheckResult> => {
  const installedVersion = getInstalledVersion();

  if (Platform.OS === 'web') {
    return { updateRequired: false, installedVersion, storeVersion: null };
  }

  if (!installedVersion) {
    return { updateRequired: false, installedVersion: null, storeVersion: null };
  }

  const storeVersion =
    Platform.OS === 'android'
      ? await getPlayStoreVersion(ANDROID_PACKAGE_ID)
      : await getAppStoreVersion(IOS_BUNDLE_ID);

  if (!storeVersion) {
    return { updateRequired: false, installedVersion, storeVersion: null };
  }

  const updateRequired = compareVersion(installedVersion, storeVersion) < 0;
  return { updateRequired, installedVersion, storeVersion };
};

export const STORE_URLS = {
  android: `market://details?id=${ANDROID_PACKAGE_ID}`,
  androidWeb: `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_ID}`,
  ios: `itms-apps://itunes.apple.com/app/id?bundleId=${IOS_BUNDLE_ID}`,
  iosWeb: `https://apps.apple.com/app/id?bundleId=${IOS_BUNDLE_ID}`,
};
