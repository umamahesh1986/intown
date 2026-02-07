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
  youtube: 'https://www.youtube.com/@intownprivilege',
};

// --- LEGAL CONTENT HTML ---
const LEGAL_CONTENT = {
  terms: `
    <!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      color: #FF6600;
      font-size: 24px;
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    h2 {
      color: #1A1A1A;
      font-size: 18px;
      margin-top: 25px;
      margin-bottom: 10px;
      font-weight: bold;
    }
    p {
      margin-bottom: 12px;
      font-size: 14px;
    }
    ul {
      margin-left: 20px;
      margin-bottom: 15px;
      font-size: 14px;
    }
    li {
      margin-bottom: 6px;
    }
    strong {
      color: #000;
    }
  </style>
</head>
<body>

  <p><strong>Effective Date:</strong> 31/01/2026</p>

  <p>
    Welcome to INtown (“we”, “our”, “us”).  
    These Terms &amp; Conditions govern your use of the INtown mobile application (“App”).
    By downloading or using the App, you agree to these Terms.
  </p>

  <p>
    If you do not agree to these Terms, please do not use the App.
  </p>

  <h2>1. Use of the App</h2>
  <p>
    INtown is a platform that connects users with local merchants offering savings and services.
    We do not own or operate the listed businesses.
  </p>
  <p>You agree to:</p>
  <ul>
    <li>Use the App for lawful purposes only</li>
    <li>Provide accurate information</li>
    <li>Not misuse the App or its services</li>
  </ul>

  <h2>2. User Accounts</h2>
  <p>
    To use certain features, you may need to register using your mobile number or email.
  </p>
  <p>You are responsible for:</p>
  <ul>
    <li>Maintaining confidentiality of your login credentials</li>
    <li>All activities conducted under your account</li>
  </ul>
  <p>
    We reserve the right to suspend or terminate accounts that violate these Terms.
  </p>

  <h2>3. Merchant Offers &amp; savings</h2>
  <p>
    All offers and savings shown in the App are provided by partner merchants.
  </p>
  <p>INtown:</p>
  <ul>
    <li>Does not guarantee the quality of products or services</li>
    <li>Is not responsible for merchant behavior</li>
    <li>Is not responsible for pricing disputes</li>
  </ul>
  <p>
    Any transaction between a user and a merchant is strictly between them.
  </p>

  <h2>4. Payments (If Applicable)</h2>
  <p>If payments are enabled:</p>
  <ul>
    <li>All payments are processed via third-party payment gateways</li>
    <li>INtown is not responsible for payment failures</li>
    <li>Refunds are subject to merchant policies</li>
  </ul>

  <h2>5. Intellectual Property</h2>
  <p>
    All content in the App including logos, design elements, text, and software
    is owned by or licensed to INtown and protected by applicable laws.
  </p>
  <p>
    You may not copy, modify, or distribute any content without written permission.
  </p>

  <h2>6. Prohibited Activities</h2>
  <p>You agree not to:</p>
  <ul>
    <li>Use the App for illegal purposes</li>
    <li>Post false or misleading information</li>
    <li>Attempt to hack or reverse engineer the App</li>
    <li>Interfere with the App’s security</li>
    <li>Abuse merchants or other users</li>
  </ul>

  <h2>7. Limitation of Liability</h2>
  <p>INtown is not liable for:</p>
  <ul>
    <li>Any indirect or incidental damages</li>
    <li>Losses arising from merchant services</li>
    <li>App downtime or service interruptions</li>
    <li>Loss of data</li>
  </ul>
  <p>
    Use of the App is entirely at your own risk.
  </p>

  <h2>8. Termination</h2>
  <p>
    We may suspend or terminate your access to the App without notice
    if you violate these Terms.
  </p>
  <p>
    You may stop using the App at any time.
  </p>

  <h2>9. Privacy</h2>
  <p>
    Your use of the App is also governed by our Privacy Policy.
    Please review it carefully.
  </p>

  <h2>10. Changes to Terms</h2>
  <p>
    We may update these Terms from time to time.
    Changes will be effective when posted in the App or on the website.
  </p>

  <h2>11. Governing Law</h2>
  <p>
    These Terms shall be governed by and interpreted in accordance
    with the laws of India.
  </p>

  <h2>12. Contact Information</h2>
  <p>
    <strong>Company Name:</strong> Yagnavihar lifestyle private limited<br>
    <strong>Email:</strong> support@intownlocal.com<br>
    <strong>Website:</strong> www.intownlocal.com
  </p>

</body>
</html>

  `,
  // NOTE: You did not provide the full text for Privacy Policy, so this is a placeholder. 
  // Please replace this string with your specific Privacy Policy text when ready.
  privacy: `
    <!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      color: #FF6600;
      font-size: 24px;
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    h2 {
      color: #1A1A1A;
      font-size: 18px;
      margin-top: 25px;
      margin-bottom: 10px;
      font-weight: bold;
    }
    p {
      margin-bottom: 12px;
      font-size: 14px;
    }
    ul {
      margin-left: 20px;
      font-size: 14px;
    }
    .contact-box {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #eee;
    }
  </style>
</head>
<body>


  <p><strong>Effective Date:</strong> 31/01/2026</p>

  <p>
    INtown (“we”, “our”, “us”) operates the INtown mobile application (“App”).
    This Privacy Policy explains how we collect, use, disclose, and safeguard
    your information when you use our App.
  </p>

  <p>
    By using INtown, you agree to the collection and use of information in accordance
    with this Privacy Policy.
  </p>

  <h2>1. Information We Collect</h2>

  <p><strong>a. Personal Information</strong></p>
  <ul>
    <li>Name</li>
    <li>Mobile number</li>
    <li>Email address (if provided)</li>
  </ul>

  <p><strong>b. Location Information</strong></p>
  <p>
    We may collect your approximate location to show nearby local businesses and offers.
  </p>

  <p><strong>c. Usage Data</strong></p>
  <ul>
    <li>App interaction data</li>
    <li>Pages or screens viewed</li>
    <li>Device type and operating system</li>
    <li>IP address</li>
  </ul>

  <p><strong>d. Merchant Information</strong></p>
  <p>For merchant partners, we may collect:</p>
  <ul>
    <li>Business name</li>
    <li>Contact details</li>
    <li>Store location</li>
    <li>Offer information</li>
  </ul>

  <h2>2. How We Use Your Information</h2>
  <ul>
    <li>Provide and maintain the App</li>
    <li>Display nearby merchants and offers</li>
    <li>Improve user experience</li>
    <li>Communicate important updates</li>
    <li>Provide customer support</li>
    <li>Prevent fraud and abuse</li>
    <li>Comply with legal obligations</li>
  </ul>

  <h2>3. Sharing of Information</h2>
  <p>We do not sell or rent your personal information.</p>
  <p>We may share information with:</p>
  <ul>
    <li>Partner merchants (only for service delivery)</li>
    <li>Service providers (hosting, analytics, communication)</li>
    <li>Government or legal authorities if required by law</li>
  </ul>

  <h2>4. Data Retention</h2>
  <p>
    We retain your information only for as long as necessary to fulfill the purposes
    described in this Privacy Policy or as required by law.
  </p>

  <h2>5. Data Security</h2>
  <p>
    We use reasonable administrative, technical, and physical security measures to protect
    your personal information from unauthorized access, disclosure, or misuse.
  </p>
  <p>
    However, no method of transmission over the internet is 100% secure.
  </p>

  <h2>6. User Rights</h2>
  <p>You have the right to:</p>
  <ul>
    <li>Access your personal data</li>
    <li>Request correction</li>
    <li>Request deletion of your data</li>
    <li>Withdraw consent</li>
  </ul>
  <p>To exercise these rights, contact us at:</p>
  <p>📧 support@intownlocal.com</p>

  <h2>7. Location Data</h2>
  <p>Location data is used only to:</p>
  <ul>
    <li>Show nearby stores</li>
    <li>Improve user experience</li>
  </ul>
  <p>We do not use location data for advertising or tracking.</p>

  <h2>8. Children’s Privacy</h2>
  <p>
    INtown is not intended for users under the age of 13.
    We do not knowingly collect personal information from children.
  </p>
  <p>
    If we become aware that we have collected information from a child,
    we will delete it immediately.
  </p>

  <h2>9. Third-Party Services</h2>
  <p>The App may use third-party services such as:</p>
  <ul>
    <li>Google Maps</li>
    <li>Firebase</li>
    <li>Payment gateways</li>
  </ul>
  <p>
    These services have their own privacy policies governing their use of data.
  </p>

  <h2>10. Changes to This Privacy Policy</h2>
  <p>
    We may update this Privacy Policy from time to time.
    We will notify users of any changes by updating the Effective Date.
  </p>

  <h2>11. Contact Us</h2>
  <div class="contact-box">
    <p><strong>Company Name:</strong> INtown</p>
    <p><strong>Email:</strong> support@intownlocal.com</p>
    <p><strong>Website:</strong> www.intownlocal.com</p>
  </div>

  <p style="margin-top:20px; font-size:13px; color:#555;">
    This Privacy Policy applies only to information collected through the INtown mobile application.
  </p>

</body>
</html>
  `
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

  const getFooterTagline = () => {
  switch (dashboardType) {
    case 'member':
      return 'You Deserve For The Best';
    case 'merchant':
      return 'Supporting Local Markets';
    case 'user':
    default:
      return 'Local Stores. Real Savings.';
  }
};

  return (
    <View style={styles.footer}>
      <Text style={styles.footerTagline}>
           {getFooterTagline()}
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
        <TouchableOpacity onPress={() => openInApp(LEGAL_CONTENT.terms, 'Terms and Conditions')}>
          <Text style={styles.linkText}>Terms and Conditions</Text>
        </TouchableOpacity>
        <Text style={styles.separator}>|</Text>
        <TouchableOpacity onPress={() => openInApp(LEGAL_CONTENT.privacy, 'Privacy Policy')}>
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
                width: isLargeScreen ? '95%' : '90%', 
                height: isLargeScreen ? '95%' : '80%' 
              }
            ]}
            onPress={(e) => {
              e.stopPropagation();
            }}
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
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerTagline: {
    fontSize: Platform.select({ android: 16, default: 18 }),
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
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