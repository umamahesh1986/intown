import { Platform } from 'react-native';
import * as Application from 'expo-application';
import axios from 'axios';

const ANDROID_PACKAGE_ID = 'com.intown.andriod';
// Published App Store listing: "INtownlocal" (numeric id is stable even if the bundle id changes).
const APP_STORE_ID = '6766092424';
const IOS_BUNDLE_IDS = ['com.vinodreddy.intownlocalapp', 'com.vinodreddy.intownlocal'];

export const STORE_URLS = {
  android: `market://details?id=${ANDROID_PACKAGE_ID}`,
  androidWeb: `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_ID}`,
  ios: `https://apps.apple.com/in/app/id${APP_STORE_ID}`,
  iosNative: `itms-apps://apps.apple.com/in/app/id${APP_STORE_ID}`,
};

interface StoreRelease {
  version: string;
  storeUrl: string;
}

export interface VersionCheckResult {
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
  // Play has no public version API; match only version-shaped metadata blocks.
  const patterns = [
    /"softwareVersion"\s*:\s*"(\d+(?:\.\d+)*)"/i,
    /\[\[\["(\d+(?:\.\d+)+)"\]\],/,
    /\[\[\["(\d+(?:\.\d+)+)"\]\]/,
    /Current\s+Version[^<]*<\/div>\s*<span[^>]*>\s*(\d+(?:\.\d+)*)\s*</i,
    /itemprop="softwareVersion"[^>]*>\s*(\d+(?:\.\d+)*)\s*</i,
  ];
  for (const pattern of patterns) {
    const version = html.match(pattern)?.[1];
    if (isVersion(version)) return version;
  }
  return null;
};

type ItunesApp = { bundleId?: string; version?: string; trackId?: number; trackViewUrl?: string };

export const pickItunesApp = (results: unknown): ItunesApp | null => {
  if (!Array.isArray(results)) return null;
  const apps = results as ItunesApp[];
  return (
    apps.find((app) => String(app.trackId) === APP_STORE_ID) ??
    apps.find((app) => !!app.bundleId && IOS_BUNDLE_IDS.includes(app.bundleId)) ??
    null
  );
};

const lookupItunes = async (params: Record<string, string>): Promise<ItunesApp | null> => {
  const response = await axios.get('https://itunes.apple.com/lookup', {
    // `_` busts Apple's CDN cache so a fresh release is seen promptly.
    params: { ...params, country: 'in', _: Date.now() },
    timeout: 12000,
    headers: { Accept: 'application/json' },
  });
  const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  return pickItunesApp(data?.results);
};

const getAppStoreRelease = async (): Promise<StoreRelease | null> => {
  let app = await lookupItunes({ id: APP_STORE_ID });
  if (!app) {
    for (const bundleId of IOS_BUNDLE_IDS) {
      app = await lookupItunes({ bundleId });
      if (app) break;
    }
  }
  if (!app || !isVersion(app.version)) return null;
  const storeUrl =
    Number.isSafeInteger(app.trackId) && (app.trackId as number) > 0
      ? `https://apps.apple.com/in/app/id${app.trackId}`
      : STORE_URLS.ios;
  return { version: app.version, storeUrl };
};

const getPlayStoreRelease = async (): Promise<StoreRelease | null> => {
  const response = await axios.get(`${STORE_URLS.androidWeb}&hl=en_IN&gl=IN&_=${Date.now()}`, {
    timeout: 12000,
    headers: { Accept: 'text/html', 'User-Agent': 'Mozilla/5.0' },
  });
  const version = typeof response.data === 'string' ? parsePlayStoreVersion(response.data) : null;
  return version ? { version, storeUrl: STORE_URLS.androidWeb } : null;
};

const getStoreRelease = (): Promise<StoreRelease | null> =>
  Platform.OS === 'android' ? getPlayStoreRelease() : getAppStoreRelease();

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
