import { NativeModules, Platform } from 'react-native';
import * as Application from 'expo-application';
import axios from 'axios';
import countryCodes from './storefrontCountries.json';

const ANDROID_PACKAGE_ID = 'com.intown.andriod';
const APP_STORE_ID = '6766092424';
export const STORE_URLS = {
  android: `market://details?id=${ANDROID_PACKAGE_ID}`,
  androidWeb: `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_ID}`,
  ios: `https://apps.apple.com/app/id${APP_STORE_ID}`,
  iosNative: `itms-apps://apps.apple.com/app/id${APP_STORE_ID}`,
};

export interface VersionCheckResult {
  updateRequired: boolean;
  installedVersion: string | null;
  installedBuild: string | null;
  storeVersion: string | null;
  storeUrl?: string;
  checked: boolean;
}

const isVersion = (value: unknown): value is string => typeof value === 'string' && /^\d+(?:\.\d+)*$/.test(value);
export const compareVersion = (installed: string, published: string): number => {
  if (!isVersion(installed) || !isVersion(published)) throw new Error('Invalid version');
  const left = installed.split('.'); const right = published.split('.');
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const a = (left[i] || '0').replace(/^0+/, '') || '0';
    const b = (right[i] || '0').replace(/^0+/, '') || '0';
    if (a.length !== b.length) return a.length < b.length ? -1 : 1;
    if (a !== b) return a < b ? -1 : 1;
  }
  return 0;
};

export const checkForUpdate = async (): Promise<VersionCheckResult> => {
  const installedVersion = Application.nativeApplicationVersion;
  const installedBuild = Application.nativeBuildVersion;
  const unknown: VersionCheckResult = { updateRequired: false, installedVersion, installedBuild, storeVersion: null, checked: false };
  if (!isVersion(installedVersion) || !Application.applicationId) return unknown;
  try {
    if (Platform.OS === 'android') {
      if (Application.applicationId !== ANDROID_PACKAGE_ID || !NativeModules.StoreUpdate?.check) return unknown;
      const available = await NativeModules.StoreUpdate.check();
      if (typeof available !== 'boolean') return unknown;
      return { ...unknown, checked: true, updateRequired: available, storeUrl: STORE_URLS.androidWeb };
    }
    if (Platform.OS === 'ios') {
      if (!NativeModules.Storefront?.country) return unknown;
      const storefront = await NativeModules.Storefront.country();
      const country = typeof storefront === 'string' ? (countryCodes as Record<string, string>)[storefront.toUpperCase()] : undefined;
      if (!country) return unknown;
      const response = await axios.get('https://itunes.apple.com/lookup', { params: { id: APP_STORE_ID, country: country.toLowerCase() }, timeout: 12000, headers: { Accept: 'application/json' } });
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      const app = Array.isArray(data?.results) ? data.results.find((item: any) => String(item.trackId) === APP_STORE_ID && item.bundleId === Application.applicationId && item.kind === 'software') : null;
      if (!app || !isVersion(app.version)) return unknown;
      return { ...unknown, checked: true, updateRequired: compareVersion(installedVersion, app.version) < 0, storeVersion: app.version, storeUrl: `https://apps.apple.com/${country.toLowerCase()}/app/id${APP_STORE_ID}` };
    }
  } catch (error) { console.warn('[VersionCheck] Store lookup failed:', error); }
  return unknown;
};
