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
  instagram: 'https://www.instagram.com/intown830/',
  facebook: 'https://www.facebook.com/share/171uBhNRZa/',
  linkedin: 'https://www.linkedin.com/in/vinodintown/',
  youtube: 'https://www.youtube.com/@intown830',
};

// --- LEGAL CONTENT HTML ---
const LEGAL_CONTENT = {
  terms: `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 20px; line-height: 1.6; color: #333;
    }
    h1 {
      color: #FF8A00; font-size: 24px; border-bottom: 2px solid #eee;
      padding-bottom: 10px; margin-bottom: 20px;
    }
    h2 {
      color: #1A1A1A; font-size: 18px; margin-top: 25px;
      margin-bottom: 10px; font-weight: bold;
    }
    p { margin-bottom: 12px; font-size: 14px; }
    ul { margin-left: 20px; margin-bottom: 15px; font-size: 14px; }
    li { margin-bottom: 6px; }
    strong { color: #000; }
  </style>
</head>
<body>
  <h1>Terms and Conditions – Intown</h1>
  <p><strong>Effective Date:</strong> 04 March 2026</p>

  <p>
    Welcome to Intown. These Terms and Conditions (“Terms”) govern your use of the Intown mobile application and related services. By accessing or using the Intown app, you agree to comply with and be bound by these Terms.
  </p>
  <p>If you do not agree with these Terms, please do not use the application.</p>

  <h2>1. About Intown</h2>
  <p>
    Intown is a platform that helps users discover nearby participating merchants and explore available in-store benefits. The app connects customers with local businesses for discovery and information purposes.
  </p>
  <p>
    Intown does not sell products directly and does not process in-store transactions between customers and merchants.
  </p>

  <h2>2. User Accounts</h2>
  <p>To access certain features, users may need to create an account using phone number verification (OTP).</p>
  <p>Users agree to:</p>
  <ul>
    <li>Provide accurate and valid information</li>
    <li>Maintain the security of their account</li>
    <li>Use the app only for lawful purposes</li>
  </ul>
  <p>Users are responsible for all activities that occur under their account.</p>

  <h2>3. Merchant Listings</h2>
  <p>Businesses may register and list their stores on the Intown platform. Merchant information such as:</p>
  <ul>
    <li>Business name</li>
    <li>Address</li>
    <li>Contact details</li>
    <li>Description</li>
  </ul>
  <p>may be displayed in the app to help users discover nearby services. Intown does not guarantee the availability, quality, or accuracy of services offered by merchants.</p>

  <h2>4. Benefits and Offers</h2>
  <p>Some participating merchants may provide benefits to Intown users. Important:</p>
  <ul>
    <li>Benefits are determined by individual merchants.</li>
    <li>Availability and terms may vary by location or merchant.</li>
    <li>Intown does not guarantee specific savings or benefits.</li>
    <li>Users should confirm details directly with the merchant before making purchases.</li>
  </ul>

  <h2>5. Subscription and Payments</h2>
  <p>Certain features of the Intown app may require a subscription. Subscriptions may be offered through Google Play Billing. By purchasing a subscription:</p>
  <ul>
    <li>You agree to the pricing and billing terms displayed at the time of purchase.</li>
    <li>Subscriptions may renew automatically unless cancelled through your Google Play account.</li>
    <li>Refunds and billing management are handled by Google Play according to their policies.</li>
  </ul>

  <h2>6. Acceptable Use</h2>
  <p>Users agree not to:</p>
  <ul>
    <li>Use the app for unlawful purposes</li>
    <li>Upload false or misleading information</li>
    <li>Attempt to disrupt or interfere with the app’s operation</li>
    <li>Misuse merchant listings or platform services</li>
  </ul>

  <h2>7. Intellectual Property</h2>
  <p>All content within the Intown app, including logos, design, software, and branding, is the property of Intown unless otherwise stated. Users may not copy, reproduce, distribute, or modify any content without permission.</p>

  <h2>8. Limitation of Liability</h2>
  <p>Intown is not responsible for: Transactions between users and merchants; Merchant service quality; Disputes between customers and businesses; Any loss or damages resulting from merchant interactions.</p>

  <h2>9. Termination</h2>
  <p>Intown reserves the right to suspend or terminate user accounts if users violate these Terms or misuse the platform.</p>

  <h2>10. Changes to Terms</h2>
  <p>We may update these Terms from time to time. Continued use of the app after changes indicates acceptance of the updated Terms.</p>

  <h2>11. Governing Law</h2>
  <p>These Terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in India.</p>

  <h2>12. Contact Information</h2>
  <p>
    <strong>Email:</strong> support@intownlocal.com<br>
    <strong>Company:</strong> Yagnavihar Lifestyle Private Limited<br>
    <strong>Location:</strong> Hyderabad, India
  </p>
</body>
</html>`,

  privacy: `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 20px; line-height: 1.6; color: #333;
    }
    h1 {
      color: #FF8A00; font-size: 24px; border-bottom: 2px solid #eee;
      padding-bottom: 10px; margin-bottom: 20px;
    }
    h2 {
      color: #1A1A1A; font-size: 18px; margin-top: 25px;
      margin-bottom: 10px; font-weight: bold;
    }
    p { margin-bottom: 12px; font-size: 14px; }
    ul { margin-left: 20px; margin-bottom: 15px; font-size: 14px; }
    li { margin-bottom: 6px; }
  </style>
</head>
<body>
  <h1>Privacy Policy – Intown</h1>
  <p><strong>Effective Date:</strong> 04 March 2026</p>
  <p>
    Intown (“we”, “our”, or “us”) operates the Intown mobile application (the “App”). This Privacy Policy explains how we collect, use, disclose, and protect your information.
  </p>

  <h2>1. Information We Collect</h2>
  <p><strong>Personal Information:</strong> Phone number (for OTP verification), basic account info, and preferences.</p>
  <p><strong>Location Information:</strong> Approximate location data to help show nearby participating merchants.</p>
  <p><strong>Usage Information:</strong> App activity, device info, and performance data to improve the experience.</p>

  <h2>2. How We Use Your Information</h2>
  <ul>
    <li>To manage user accounts and OTP authentication</li>
    <li>To display nearby participating merchants</li>
    <li>To provide customer support and prevent misuse</li>
  </ul>
  <p>We do not sell your personal information to third parties.</p>

  <h2>3. Merchant Listings</h2>
  <p>Merchant information (business name, address, contact details) may be visible to users to help discover services.</p>

  <h2>4. Data Sharing</h2>
  <p>We may share limited info with trusted service providers (Cloud hosting, Auth, Analytics) who are required to protect user data.</p>

  <h2>5. Data Security</h2>
  <p>We take reasonable measures to protect user data, though no digital platform is 100% secure.</p>

  <h2>6. Data Retention</h2>
  <p>We retain info as long as necessary for services or legal obligations. Users may request account deletion.</p>

  <h2>7. Children's Privacy</h2>
  <p>Intown is not intended for children under 13. We do not knowingly collect their info.</p>

  <h2>8. User Rights</h2>
  <p>Users may request access, correction, or deletion of their personal information via the contact info below.</p>

  <h2>9. Third-Party Services</h2>
  <p>The app uses services like Firebase Authentication and Cloud infrastructure which have their own privacy policies.</p>

  <h2>10. Changes to This Policy</h2>
  <p>Updates will be posted on this page and become effective immediately upon publication.</p>

  <h2>11. Contact Us</h2>
  <p>
    <strong>Email:</strong> support@intownlocal.com<br>
    <strong>Company:</strong> Yagnavihar Lifestyle Private Limited<br>
    <strong>Location:</strong> Hyderabad, India
  </p>
</body>
</html>`
};

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

          <TouchableOpacity style={styles.iconButton}>
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
            onPress={() =>
              openExternalURL('https://www.intownlocal.com/delete-account')
            }
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
});