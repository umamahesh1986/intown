import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.intown.andriod';
const SHARE_TITLE = 'INtown';
const SHARE_TEXT =
  'Discover nearby local shops & exclusive INtown member savings. Try INtown:';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  /** Optional override of the URL/text to share */
  url?: string;
  title?: string;
  message?: string;
}

const composeMessage = (msg: string, url: string) => `${msg} ${url}`;

const openOrFallback = async (primary: string, fallback: string) => {
  try {
    const can = await Linking.canOpenURL(primary);
    if (can) {
      await Linking.openURL(primary);
      return;
    }
  } catch {
    // ignore — try fallback
  }
  try {
    await Linking.openURL(fallback);
  } catch {
    // last resort — silently ignore
  }
};

export default function ShareModal({
  visible,
  onClose,
  url = PLAY_STORE_URL,
  title = SHARE_TITLE,
  message = SHARE_TEXT,
}: ShareModalProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const fullMessage = composeMessage(message, url);
  const encMsg = encodeURIComponent(fullMessage);
  const encUrl = encodeURIComponent(url);

  const handleShareX = () =>
    openOrFallback(
      `twitter://post?message=${encMsg}`,
      `https://twitter.com/intent/tweet?text=${encMsg}`,
    );

  const handleShareFacebook = () =>
    openOrFallback(
      `fb://facewebmodal/f?href=https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
      `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
    );

  const handleShareInstagram = async () => {
    // Instagram has no public link-sharer URL. Best effort: copy link to
    // clipboard and open the Instagram app's home/profile so the user can
    // paste it into a DM or Story.
    try {
      await Clipboard.setStringAsync(fullMessage);
    } catch {
      // ignore
    }
    await openOrFallback(
      'instagram://app',
      'https://www.instagram.com/intown830/',
    );
  };

  const handleShareWhatsApp = () =>
    openOrFallback(
      `whatsapp://send?text=${encMsg}`,
      `https://api.whatsapp.com/send?text=${encMsg}`,
    );

  const handleShareEmail = () =>
    openOrFallback(
      `mailto:?subject=${encodeURIComponent(title)}&body=${encMsg}`,
      `mailto:?subject=${encodeURIComponent(title)}&body=${encMsg}`,
    );

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(url);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card} testID="share-modal">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.appBadge}>
              <Text style={styles.appBadgeText}>IN</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>Share this app</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
              testID="share-modal-close-btn"
            >
              <Ionicons name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Icons row */}
          <View style={styles.iconsRow}>
            <TouchableOpacity
              style={styles.iconCol}
              onPress={handleShareX}
              activeOpacity={0.7}
              testID="share-x-btn"
            >
              <View style={[styles.iconCircle, { backgroundColor: '#000000' }]}>
                <Ionicons name="logo-twitter" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.iconLabel}>X</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconCol}
              onPress={handleShareFacebook}
              activeOpacity={0.7}
              testID="share-facebook-btn"
            >
              <View style={[styles.iconCircle, { backgroundColor: '#1877F2' }]}>
                <Ionicons name="logo-facebook" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.iconLabel}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconCol}
              onPress={handleShareInstagram}
              activeOpacity={0.7}
              testID="share-instagram-btn"
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: '#E4405F' },
                ]}
              >
                <Ionicons name="logo-instagram" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.iconLabel}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconCol}
              onPress={handleShareWhatsApp}
              activeOpacity={0.7}
              testID="share-whatsapp-btn"
            >
              <View style={[styles.iconCircle, { backgroundColor: '#25D366' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.iconLabel}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconCol}
              onPress={handleShareEmail}
              activeOpacity={0.7}
              testID="share-email-btn"
            >
              <View style={[styles.iconCircle, { backgroundColor: '#7A7A7A' }]}>
                <Ionicons name="mail" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.iconLabel}>Email</Text>
            </TouchableOpacity>
          </View>

          {/* URL preview + Copy */}
          <View style={styles.urlRow}>
            <Text style={styles.urlText} numberOfLines={1}>
              {url}
            </Text>
            <TouchableOpacity
              onPress={handleCopy}
              style={styles.copyBtn}
              activeOpacity={0.7}
              testID="share-copy-btn"
            >
              <Ionicons
                name={copyStatus === 'copied' ? 'checkmark' : 'copy-outline'}
                size={16}
                color="#0C8A4A"
              />
              <Text style={styles.copyBtnText}>
                {copyStatus === 'copied' ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  appBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FF8A00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 17,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 18,
  },
  iconCol: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconLabel: {
    fontSize: 11,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F8FA',
    borderWidth: 1,
    borderColor: '#E5E8EC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  urlText: {
    flex: 1,
    fontSize: 13,
    color: '#444',
    marginRight: 10,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  copyBtnText: {
    color: '#0C8A4A',
    fontWeight: '700',
    fontSize: 13,
  },
});
