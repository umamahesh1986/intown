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

// --- LINKS ---
const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/intown830',
  facebook: 'https://www.facebook.com/share/171uBhNRZa/',
  linkedin: 'https://www.linkedin.com/in/vinodintown?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app',
  youtube: 'https://youtube.com/@intownprivilege?si=dpk7wf9bffUWmFFA',
};

const LEGAL_LINKS = {
  terms: 'https://docs.google.com/document/d/1jQllU196uZcFhAj92OuXSOrobSGXg-oyaof5k2HB3nw/preview',
  privacy: 'https://YOUR_WEBSITE.com/privacy'
};

const openExternalURL = async (url: string) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else Alert.alert('Error', `Cannot open URL: ${url}`);
  } catch (error) {
    Alert.alert('Error', 'Failed to open link');
  }
};

// --- MAGIC SCRIPT ---
const INJECTED_JAVASCRIPT = `
  const meta = document.createElement('meta');
  meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  meta.setAttribute('name', 'viewport');
  document.getElementsByTagName('head')[0].appendChild(meta);

  const style = document.createElement('style');
  style.innerHTML = \`
    .fp-h { display: none !important; }
    .hp-h { display: none !important; }
    .docs-ml-header-item { display: none !important; }
    #docs-header { display: none !important; }
    .ndfHFb-c4YZDc-Wrql6b { display: none !important; }
  \`;
  document.head.appendChild(style);
  true;
`;

export default function Footer() {
  const iconSize = 18;
  const { width: screenWidth } = useWindowDimensions();
  const isLargeScreen = Platform.OS === 'web' || screenWidth > 768;

  const [modalVisible, setModalVisible] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  const openInApp = (url: string, title: string) => {
    setCurrentUrl(url);
    setModalTitle(title);
    setModalVisible(true);
  };

  return (
    <View style={styles.footer}>
      <Text style={styles.footerTagline}>
        Shop Local, Save Instantly! Connecting Communities Through Personal Bond.
      </Text>
      <Text style={styles.footerDescription}>
        India's most trusted local savings network, helping customers save
        instantly while enabling small businesses to thrive.
      </Text>

      {/* --- Social Media Links --- */}
      <View style={styles.socialContainer}>
        <TouchableOpacity style={styles.socialButton} onPress={() => openExternalURL(SOCIAL_LINKS.instagram)}>
          <Ionicons name="logo-instagram" size={iconSize} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton} onPress={() => openExternalURL(SOCIAL_LINKS.facebook)}>
          <Ionicons name="logo-facebook" size={iconSize} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton} onPress={() => openExternalURL(SOCIAL_LINKS.linkedin)}>
          <Ionicons name="logo-linkedin" size={iconSize} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton} onPress={() => openExternalURL(SOCIAL_LINKS.youtube)}>
          <Ionicons name="logo-youtube" size={iconSize} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* --- Legal Links --- */}
      <View style={styles.linksContainer}>
        <TouchableOpacity onPress={() => openInApp(LEGAL_LINKS.terms, 'Terms of Use')}>
          <Text style={styles.linkText}>Terms of Use</Text>
        </TouchableOpacity>
        <Text style={styles.separator}>|</Text>
        <TouchableOpacity onPress={() => openInApp(LEGAL_LINKS.privacy, 'Privacy Policy')}>
          <Text style={styles.linkText}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerCopyright}>
        Copyright © 2025, Yagnavihar Lifestyle Pvt. Ltd.
      </Text>

      {/* --- MODAL --- */}
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
                width: isLargeScreen ? '80%' : '90%', 
                height: isLargeScreen ? '80%' : '80%' 
              }
            ]}
            onPress={(e) => {
              e.stopPropagation();
            }}
          >
            
            {/* Header */}
            <View style={styles.modalHeader}>
              {/* Left spacer to balance layout */}
              <View style={{ width: 30 }} /> 
              
              {/* Show Title ONLY if NOT Android */}
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
                    src={currentUrl} 
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="Legal Document"
                  />
              ) : (
                  <WebView 
                    source={{ uri: currentUrl }} 
                    style={{ flex: 1, backgroundColor: 'white' }}
                    nestedScrollEnabled={true} 
                    startInLoadingState={true}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    scalesPageToFit={Platform.OS === 'ios'}
                    injectedJavaScript={INJECTED_JAVASCRIPT}
                    onMessage={() => {}} 
                  />
              )}
            </View>

          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerTagline: {
    fontSize: Platform.select({ android: 16, default: 18 }),
    fontWeight: 'bold',
    color: '#FF6600',
    textAlign: 'center',
    marginBottom: 16,
  },
  footerDescription: {
    fontSize: Platform.select({ android: 12, default: 14 }),
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: Platform.select({ android: 18, default: 22 }),
    marginBottom: 28,
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
    marginHorizontal: 12, 
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  linkText: {
    fontSize: Platform.select({ android: 10, default: 12 }),
    color: '#FF6600',
    fontWeight: '500',
    marginHorizontal: 10,
  },
  separator: { 
    fontSize: Platform.select({ android: 10, default: 12 }),
    color: '#999999',
  },
  footerCopyright: {
    fontSize: Platform.select({ android: 10, default: 12 }),
    color: '#999999',
    textAlign: 'center',
  },

  // --- MODAL STYLES ---
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
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 10,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      }
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
});