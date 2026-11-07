import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
  Modal,
  Pressable,
  useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import ShareModal from './ShareModal';
import { LEGAL_CONTENT } from '../utils/legalContent';


// --- LINKS ---
const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/intown830/',
  facebook: 'https://www.facebook.com/share/171uBhNRZa/',
  linkedin: 'https://www.linkedin.com/in/vinodintown/',
  youtube: 'https://www.youtube.com/@intown830',
};

// --- LEGAL CONTENT HTML ---


const openExternalURL = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('Error', 'Failed to open link');
  }
};

type FooterProps = {
  dashboardType: 'user' | 'member' | 'merchant';
};

export default function Footer({ dashboardType }: FooterProps) {
  const iconSize = 18;
  const { width: screenWidth } = useWindowDimensions();
  const isLargeScreen = Platform.OS === 'web' || screenWidth > 768;

  const [modalVisible, setModalVisible] = useState(false);
  const [currentHtml, setCurrentHtml] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const handleDeleteAccountConfirm = () => {
    setDeleteConfirmVisible(false);
    openExternalURL('https://www.intownlocal.com/delete-account');
  };

  const openInApp = (htmlContent: string, title: string) => {
    setCurrentHtml(htmlContent);
    setModalTitle(title);
    setModalVisible(true);
  };

  const openSupportEmail = () => {
  const email = 'support@intownlocal.com';
  const subject = 'INtown Support Request';
  const body = 'Hello INtown Support Team,';

  const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  Linking.openURL(url);
};

const contactSupport = () => {
  Linking.openURL("tel:+919052263555");
};

  return (
    <View>

      <View style={styles.footer}>

        {/* <Text style={styles.title}>InTown</Text>

<Text style={styles.tagline}>
Local Stores. Real Savings.
</Text> */}

        {/* ICONS */}
        <View style={styles.iconRow}>

         <TouchableOpacity
  style={styles.iconButton}
  onPress={() => Linking.openURL('https://www.intownlocal.com/')}
>
  <Ionicons name="globe-outline" size={26} color="#556575" />
</TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowShareModal(true)}
            testID="footer-share-btn"
          >
            <Ionicons name="share-social-outline" size={26} color="#556575" />
          </TouchableOpacity>

         <TouchableOpacity style={styles.iconButton} onPress={openSupportEmail}>
  <Ionicons name="mail-outline" size={26} color="#556575" />
</TouchableOpacity>

        </View>

        {/* LINKS */}
        <View style={styles.linksContainer}>

          <TouchableOpacity onPress={() => openInApp(LEGAL_CONTENT.terms, 'Terms')}>
            <Text style={styles.linkText}>Terms & Conditions</Text>
          </TouchableOpacity>

          <Text style={styles.dot}></Text>

          <TouchableOpacity onPress={() => openInApp(LEGAL_CONTENT.privacy, 'Privacy')}>
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>

        </View>

        <View style={styles.linksContainer}>

          <TouchableOpacity onPress={contactSupport}>
  <Text style={styles.linkText}>Contact Support</Text>
</TouchableOpacity>

          <Text style={styles.dot}></Text>

          <TouchableOpacity
            onPress={() => setDeleteConfirmVisible(true)}
            testID="footer-delete-account-btn"
          >
            <Text style={styles.linkText}>Delete Account</Text>
          </TouchableOpacity>

        </View>
        <Text style={styles.footerCopyright}>
          © Yagnavihar Lifestyle Pvt Ltd. 2026 All rights reserved. 
        </Text>





      </View>


      {/* MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable
            style={[
              styles.modalContainer,
              {
                width: isLargeScreen ? '95%' : '90%',
                height: isLargeScreen ? '95%' : '80%'
              }
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ width: 30 }} />
              {Platform.OS === 'android' ? null : (
                <Text style={styles.modalTitle}>{modalTitle}</Text>
              )}
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
              {Platform.OS === 'web' ? (
                <iframe
                  srcDoc={currentHtml}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="Legal Document"
                />
              ) : (
                <WebView
                  source={{ html: currentHtml }}
                  style={{ flex: 1, backgroundColor: 'white' }}
                  nestedScrollEnabled={true}
                  startInLoadingState={true}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  scalesPageToFit={Platform.OS === 'ios'}
                  originWhitelist={['*']}
                />
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      {/* Delete Account Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={deleteConfirmVisible}
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDeleteConfirmVisible(false)}
          testID="delete-confirm-overlay"
        >
          <Pressable
            style={styles.deleteConfirmCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.deleteIconWrap}>
              <Ionicons name="warning" size={36} color="#D32F2F" />
            </View>
            <Text style={styles.deleteConfirmTitle}>Delete Account?</Text>
            <Text style={styles.deleteConfirmBody}>
              This will take you to the INtown website to permanently delete your account.
              This action cannot be undone.
            </Text>

            <View style={styles.deleteConfirmActions}>
              <TouchableOpacity
                style={[styles.deleteConfirmBtn, styles.deleteCancelBtn]}
                onPress={() => setDeleteConfirmVisible(false)}
                testID="delete-confirm-cancel-btn"
              >
                <Text style={styles.deleteCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteConfirmBtn, styles.deleteConfirmPrimaryBtn]}
                onPress={handleDeleteAccountConfirm}
                testID="delete-confirm-confirm-btn"
              >
                <Text style={styles.deleteConfirmPrimaryBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#F3F6F9',
    alignItems: 'center',
    paddingVertical: 36,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    width: '100%',
    flexWrap: 'wrap',
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8EDF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  linksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  separator: {
    fontSize: 15,
    color: '#7A8A9A',
    marginHorizontal: 10,
  },
  footerCopyright: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    maxWidth: 1000,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
      android: { elevation: 10 },
      web: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 }
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    height: 60,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  closeButton: {
    padding: 5,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'white',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FF8A00',
  },


  tagline: {
    fontSize: 18,
    color: '#5F6F81',
    marginTop: 8,
    marginBottom: 35,
  },


  iconRow: {
    flexDirection: 'row',
    marginBottom: 30,
  },


  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },

  support: {
    fontSize: 16,
    color: '#7A8A9A',
    marginBottom: 25,
  },
  dot: {
    marginHorizontal: 10,
    color: '#9AA7B5',
    fontSize: 16,
  },
  delete: {
    fontSize: 16,
    color: '#7A8A9A',
    marginBottom: 25,
  },

  deleteContainer: {
    marginBottom: 25,
  },

  deleteText: {
    fontSize: 16,
    color: '#7A8A9A',
  },

  // Delete-account confirmation modal
  deleteConfirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
    width: '86%',
    maxWidth: 380,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 12 },
      web: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
    }),
  },
  deleteIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FDECEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  deleteConfirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteConfirmBody: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  deleteConfirmActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCancelBtn: {
    backgroundColor: '#F1F3F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  deleteCancelBtnText: {
    color: '#333',
    fontWeight: '700',
    fontSize: 14,
  },
  deleteConfirmPrimaryBtn: {
    backgroundColor: '#D32F2F',
  },
  deleteConfirmPrimaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});