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

// --- LEGAL CONTENT HTML ---
const LEGAL_CONTENT = {
  terms: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333; }
        h1 { color: #FF6600; font-size: 24px; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
        h2 { color: #1A1A1A; font-size: 18px; margin-top: 25px; margin-bottom: 10px; font-weight: bold; }
        p { margin-bottom: 12px; font-size: 14px; }
        ul { margin-bottom: 15px; padding-left: 20px; }
        li { margin-bottom: 5px; font-size: 14px; }
        strong { color: #000; }
      </style>
    </head>
    <body>
      <p><strong>Effective Date:</strong> November 03, 2025</p>
      
      <p>Welcome to INtown. By accessing, browsing, or using our website, mobile application, or services, you acknowledge that you have read, understood, and agreed to be bound by these Terms of Use ("Terms"). If you do not agree, please discontinue use of our services immediately.</p>
      
      <h2>1. Definitions</h2>
      <p><strong>"Platform"</strong> refers to the INtown website, mobile application, and related services.</p>
      <p><strong>"User"</strong> refers to any individual who accesses or uses the Platform.</p>
      <p><strong>"Merchant"</strong> refers to local offline stores offering discounts or deals through INtown.</p>
      <p><strong>"Services"</strong> refers to the benefits, privileges, discount offers, and related digital features provided by INtown.</p>
      
      <h2>2. Eligibility</h2>
      <p>Users must be at least 18 years old and capable of entering into legally binding contracts under applicable law. By using the Platform, you confirm your eligibility.</p>
      
      <h2>3. Account Registration</h2>
      <p>Users may be required to register an account using a valid mobile number and OTP verification. You are responsible for maintaining account confidentiality and all activities under your account.</p>
      
      <h2>4. Service Description</h2>
      <p>INtown facilitates access to merchant-provided discounts and privileges at partnered offline stores. INtown acts solely as an aggregator and technology facilitator. All products, services, pricing, and offers are owned, controlled, and fulfilled by the respective merchants.</p>
      <p>INtown does not guarantee availability, service levels, or specific discount values at any time.</p>
      
      <h2>5. Use of the Platform</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Misuse, hack, or breach the Platform’s security.</li>
        <li>Create fraudulent accounts.</li>
        <li>Misrepresent information to merchants or INtown.</li>
        <li>Exploit offers in bad faith.</li>
      </ul>
      <p>INtown reserves the right to suspend or terminate accounts for misuse.</p>
      
      <h2>6. Merchant Offers & Pricing</h2>
      <p>All offers, discounts, and prices are solely determined by the merchant and may change without prior notice. INtown does not set, influence, or regulate merchant pricing.</p>
      <p>In case of disputes, users must first attempt resolution with the concerned merchant.</p>
      
      <h2>7. Payments</h2>
      <p>Some services may require subscription payment. Fees once paid are non-refundable unless otherwise stated. Payments within stores are processed via UPI or other supported methods.</p>
      
      <h2>8. User Obligations</h2>
      <p>Users must:</p>
      <ul>
        <li>Follow store policies.</li>
        <li>Provide accurate information.</li>
        <li>Respect merchant staff and premises.</li>
      </ul>
      <p>Abusive behaviour may result in permanent account and card cancellation.</p>
      
      <h2>9. Limitation of Liability</h2>
      <p>To the maximum extent permitted under applicable law, INtown shall not be liable for:</p>
      <ul>
        <li>Product/service defects</li>
        <li>Merchant behaviour or service quality</li>
        <li>Unavailability of offers or stores</li>
        <li>Financial losses, indirect damages, or reputational harm</li>
      </ul>
      <p>INtown’s total liability for any claim shall not exceed the subscription amount paid in the preceding 12 months.</p>
      
      <h2>10. Merchant Responsibility</h2>
      <p>Merchants are solely responsible for:</p>
      <ul>
        <li>Product quality</li>
        <li>Service standards</li>
        <li>Pricing and discounts provided</li>
      </ul>
      <p>Disputes should be addressed directly with the respective merchant first.</p>
      
      <h2>11. Intellectual Property</h2>
      <p>All content, logos, branding, designs, and software are the exclusive property of INtown. Reproduction without permission is prohibited.</p>
      <br/><br/>
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333; }
        h1 { color: #FF6600; font-size: 24px; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
        h2 { color: #1A1A1A; font-size: 18px; margin-top: 25px; margin-bottom: 10px; font-weight: bold; }
        p { margin-bottom: 12px; font-size: 14px; }
        .contact-box { background-color: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee; }
      </style>
    </head>
    <body>
      <p><strong>Last Updated:</strong> November 2025</p>
      
      <p>Welcome to INtown's Privacy Policy. We are committed to protecting your personal information and your right to privacy.</p>

       <h2>1. Privacy Policy</h2>
      <p>By using the Platform, you consent to collection and usage of information as outlined in our Privacy Policy. INtown does not share personal information with unauthorized third parties.</p>
      
      <h2>2. Suspension & Termination</h2>
      <p>INtown reserves the right to suspend or terminate accounts due to:</p>
      <ul>
        <li>Misuse</li>
        <li>Fraudulent activity</li>
        <li>Terms violation</li>
        <li>Legal requests from authorities</li>
      </ul>
      
      <h2>3. Refunds & Cancellations</h2>
      <p>Purchases of INtown Access and subscriptions are final and non-refundable, except where required under applicable consumer protection laws or in cases of proven technical failures directly attributable to INtown.</p>
      
      <h2>4. Third‑Party Links</h2>
      <p>The Platform may contain external links. INtown is not responsible for content, policies, or services on third‑party websites.</p>
      
      <h2>5. Modification of Terms</h2>
      <p>INtown may update Terms at any time without prior notice. Continued use implies acceptance of modifications.</p>
      
      <h2>6. Disclaimers</h2>
      <p>Services are provided on an "AS IS" and "AS AVAILABLE" basis. INtown does not guarantee:</p>
      <ul>
        <li>Continuous Platform availability</li>
        <li>Offer accuracy or merchant participation</li>
        <li>Absence of technical interruptions</li>
      </ul>
      <p>Users acknowledge that merchant participation may vary based on independent business decisions.</p>
      
      <h2>7. Indemnification</h2>
      <p>Users agree to indemnify and hold INtown harmless from claims, damages, legal disputes, and expenses arising from misuse or violation of these Terms.</p>
      
      <h2>8. Governing Law & Jurisdiction</h2>
      <p>These Terms are governed by the laws of India. Any legal disputes shall be subject exclusively to the courts of Hyderabad, Telangana.</p>
      
      <h2>9. Contact Information</h2>
      <div class="contact-box">
        <p>For support, queries, or complaints:</p>
        <p><strong>Email:</strong> support@intownlocal.com<br>
        <strong>Phone:</strong> +91-9052263555<br>
        <strong>Address:</strong> Hyderabad, Telangana, India</p>
      </div>
    </body>
    </html>
  `
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

export default function Footer() {
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
        <TouchableOpacity onPress={() => openInApp(LEGAL_CONTENT.terms, 'Terms of Use')}>
          <Text style={styles.linkText}>Terms of Use</Text>
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