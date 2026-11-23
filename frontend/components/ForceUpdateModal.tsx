import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  AppState,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { checkForUpdate, STORE_URLS } from '../utils/versionCheck';

/** Checks the native store on launch and foreground; users may defer an update. */
export default function ForceUpdateModal() {
  const [visible, setVisible] = useState(false);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);
  const [storeVersion, setStoreVersion] = useState<string | null>(null);
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let checking = false;
    let lastCheck = 0;
    let retryAfter = 0;
    const run = async () => {
      if (checking || Date.now() < retryAfter || Date.now() - lastCheck < 60 * 60 * 1000) return;
      checking = true;
      retryAfter = Date.now() + 5 * 60 * 1000;
      try {
        const result = await checkForUpdate();
        if (cancelled) return;
        setInstalledVersion(result.installedVersion);
        setStoreVersion(result.storeVersion);
        if (result.storeUrl) setStoreUrl(result.storeUrl);
        // Only a successful store lookup may change visibility; a failed lookup keeps the current state.
        if (result.checked) {
          lastCheck = Date.now();
          setVisible(result.updateRequired);
          if (result.updateRequired) {
            console.log(
              `[ForceUpdate] Installed ${result.installedVersion} < Store ${result.storeVersion} → showing update modal`,
            );
          }
        }
      } catch (e) {
        console.warn('[ForceUpdate] Check failed:', e);
      } finally {
        checking = false;
      }
    };
    run();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void run();
    });
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  const handleUpdate = async () => {
    const web =
      storeUrl ?? (Platform.OS === 'android' ? STORE_URLS.androidWeb : STORE_URLS.ios);
    const native =
      Platform.OS === 'android' ? STORE_URLS.android : web.replace(/^https:\/\//, 'itms-apps://');
    try {
      await Linking.openURL(native);
    } catch {
      try {
        await Linking.openURL(web);
      } catch {
        Alert.alert('Unable to open store', 'Please try again or open INtown in your app store to update.');
      }
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.card} testID="force-update-modal">
          <View style={styles.iconWrap}>
            <Ionicons name="cloud-download" size={36} color="#FF8A00" />
          </View>
          <Text style={styles.title}>New Update Available!</Text>
          <Text style={styles.message}>
            A new version of INtownLocal is available. Update now to enjoy the latest improvements.
          </Text>
          {storeVersion && installedVersion ? (
            <Text style={styles.versionLine}>
              Installed: {installedVersion}  •  Latest: {storeVersion}
            </Text>
          ) : null}
          <TouchableOpacity
            style={styles.button}
            onPress={handleUpdate}
            activeOpacity={0.85}
            testID="force-update-now-btn"
          >
            <Ionicons name="open-outline" size={18} color="#FFFFFF" />
            <Text style={styles.buttonText}>Update Now</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVisible(false)} accessibilityRole="button" style={styles.later}><Text style={styles.laterText}>Later</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 14,
  },
  versionLine: {
    fontSize: 12,
    color: '#888',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8A00',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
    width: '100%',
  },
  later: { paddingHorizontal: 24, paddingTop: 16 },
  laterText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
