import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  BackHandler,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { checkForUpdate, STORE_URLS } from '../utils/versionCheck';

/**
 * Force Update Modal
 * - Checks the app version once on mount.
 * - If a newer version exists on Play Store / App Store, shows a non-dismissible
 *   modal with an "Update Now" CTA that opens the store listing.
 * - Hardware back button on Android cannot close it while update is required.
 */
export default function ForceUpdateModal() {
  const [visible, setVisible] = useState(false);
  const [storeVersion, setStoreVersion] = useState<string | null>(null);
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const result = await checkForUpdate();
        if (cancelled) return;
        setInstalledVersion(result.installedVersion);
        setStoreVersion(result.storeVersion);
        if (result.updateRequired) {
          console.log(
            `[ForceUpdate] Installed ${result.installedVersion} < Store ${result.storeVersion} → showing update modal`,
          );
          setVisible(true);
        }
      } catch (e) {
        console.warn('[ForceUpdate] Check failed:', e);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Block Android hardware back button while the modal is forced
  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [visible]);

  const handleUpdate = async () => {
    const primary =
      Platform.OS === 'android' ? STORE_URLS.android : STORE_URLS.ios;
    const fallback =
      Platform.OS === 'android' ? STORE_URLS.androidWeb : STORE_URLS.iosWeb;
    try {
      const supported = await Linking.canOpenURL(primary);
      await Linking.openURL(supported ? primary : fallback);
    } catch (e) {
      try {
        await Linking.openURL(fallback);
      } catch {
        // last resort — leave modal open
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
      onRequestClose={() => {
        // Intentionally do nothing — non-dismissible
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card} testID="force-update-modal">
          <View style={styles.iconWrap}>
            <Ionicons name="cloud-download" size={36} color="#FF8A00" />
          </View>
          <Text style={styles.title}>Update Available</Text>
          <Text style={styles.message}>
            A new version of the app is available. Please update the app to
            continue using INtown.
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
