import { Platform, Vibration } from 'react-native';
import { Audio } from 'expo-av';

const VIBRATION_PATTERN = [0, 200, 120, 200];
let audioReady = false;

const playChime = async () => {
  if (!audioReady && Platform.OS !== 'web') {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true });
    audioReady = true;
  }
  const { sound } = await Audio.Sound.createAsync(require('../assets/sounds/order-chime.wav'), { shouldPlay: true, volume: 1 });
  sound.setOnPlaybackStatusUpdate((s) => {
    if (s.isLoaded && s.didJustFinish) sound.unloadAsync().catch(() => {});
  });
};

// Short chime + vibration when a new order notification arrives while the app is open.
export const playNotificationFeedback = () => {
  try {
    if (Platform.OS === 'web') {
      (globalThis as any).navigator?.vibrate?.(VIBRATION_PATTERN.slice(1));
    } else {
      Vibration.vibrate(VIBRATION_PATTERN);
    }
  } catch {}
  playChime().catch((e) => console.warn('[notificationFeedback] chime failed', e?.message || e));
};
