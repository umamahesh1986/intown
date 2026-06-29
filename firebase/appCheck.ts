import { Platform } from 'react-native';

/**
 * Initialize Firebase App Check with Play Integrity on Android.
 * This enables silent device verification, eliminating reCAPTCHA for phone auth.
 * Must be called BEFORE any Firebase Auth calls.
 */
export async function initializeAppCheck() {
  if (Platform.OS === 'web') return;

  try {
    const appCheck = require('@react-native-firebase/app-check').default;

    const rnfbProvider = appCheck().newReactNativeFirebaseAppCheckProvider();
    rnfbProvider.configure({
      android: {
        provider: __DEV__ ? 'debug' : 'playIntegrity',
      },
      apple: {
        provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
      },
    });

    await appCheck().initializeAppCheck({
      provider: rnfbProvider,
      isTokenAutoRefreshEnabled: true,
    });

    console.log('=== Firebase App Check initialized with Play Integrity ===');
  } catch (error) {
    console.warn('Firebase App Check initialization failed:', error);
  }
}
