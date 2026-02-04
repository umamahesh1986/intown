import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "../store/authStore";
import { searchUserByPhone, determineUserRole } from "../utils/api";

// Platform-specific Firebase imports
let firebaseAuth: any = null;
let webAuth: any = null;
let webPhoneAuthProvider: any = null;
let webSignInWithCredential: any = null;

// For mobile: use @react-native-firebase/auth (native module)
// For web: use firebase/auth (JS SDK)
if (Platform.OS === 'web') {
  // Web: Use Firebase JS SDK
  const firebaseAuthModule = require('firebase/auth');
  const firebaseConfig = require('../firebase/firebaseConfig');
  webAuth = firebaseConfig.auth;
  webPhoneAuthProvider = firebaseAuthModule.PhoneAuthProvider;
  webSignInWithCredential = firebaseAuthModule.signInWithCredential;
} else {
  // Mobile: Use React Native Firebase (native)
  try {
    firebaseAuth = require('@react-native-firebase/auth').default;
  } catch (e) {
    console.log('React Native Firebase not available, falling back to test mode');
  }
}

/* ===============================
   CONFIG
================================ */
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;
const WEB_TEST_OTP = "123456"; // Test OTP for web development
const USE_WEB_TEST_MODE = true; // Enable test mode for web only

/* ===============================
   PHONE FORMATTER
================================ */
const formatPhoneNumber = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return `+${cleaned}`;
  }

  if (phone.startsWith("+")) {
    return phone;
  }

  return `+91${cleaned}`;
};

export default function OTPScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const isWeb = Platform.OS === 'web';
  const isMobile = Platform.OS === 'android' || Platform.OS === 'ios';

  const { setUser, setToken } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otpPopupMessage, setOtpPopupMessage] = useState("");

  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showOtpSentPopup = (message: string) => {
    setOtpPopupMessage(message);
    setShowOtpPopup(true);
    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current);
    }
    popupTimerRef.current = setTimeout(() => {
      setShowOtpPopup(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }
    };
  }, []);

  /* ===============================
     RESEND TIMER
  ================================ */
  useEffect(() => {
    if (canResend) return;

    if (timer === 0) {
      setCanResend(true);
      return;
    }

    const id = setInterval(() => {
      setTimer(t => t - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [timer, canResend]);

  /* ===============================
     SEND OTP
  ================================ */
  const sendOtp = async () => {
    if (isSendingOtp) return;
    
    const formattedPhone = formatPhoneNumber(phone || "");
    console.log("=== SENDING OTP ===");
    console.log("Platform:", Platform.OS);
    console.log("Phone:", formattedPhone);
    
    setStatusMessage("Initializing...");
    setIsSendingOtp(true);
    setCanResend(false);
    setTimer(RESEND_SECONDS);
    setOtp(Array(OTP_LENGTH).fill(""));
    setOtpSent(false);

    try {
      // WEB: Use Test Mode or Firebase JS SDK
      if (isWeb) {
        if (USE_WEB_TEST_MODE) {
          console.log("=== WEB TEST MODE ===");
          setStatusMessage("Test Mode: Use OTP 123456");
          await new Promise(resolve => setTimeout(resolve, 1000));
          setVerificationId("WEB_TEST_MODE");
          setOtpSent(true);
          setStatusMessage("Test OTP: 123456");
          showOtpSentPopup("OTP sent successfully (Test Mode)");
        } else {
          // Real web Firebase auth would go here
          // Note: Web reCAPTCHA setup needed for production
          setStatusMessage("Web auth not configured");
        }
        setIsSendingOtp(false);
        return;
      }

      // MOBILE: Use @react-native-firebase/auth
      if (isMobile && firebaseAuth) {
        console.log("=== MOBILE REAL OTP ===");
        setStatusMessage("Sending SMS...");
        
        try {
          // Configure phone auth settings for better compatibility
          const auth = firebaseAuth();
          
          // Set app verification to use reCAPTCHA if Play Integrity fails
          if (auth.settings) {
            auth.settings.appVerificationDisabledForTesting = false;
          }
          
          // Send OTP
          const confirmation = await auth.signInWithPhoneNumber(formattedPhone);
          
          console.log("=== OTP SENT SUCCESSFULLY ===");
          setConfirmationResult(confirmation);
          setOtpSent(true);
          setStatusMessage("OTP sent! Check your SMS.");
          showOtpSentPopup("OTP sent successfully");
        } catch (firebaseError: any) {
          console.error("Firebase Phone Auth Error:", firebaseError.code, firebaseError.message);
          
          // Handle specific error: missing-client-identifier
          if (firebaseError.code === 'auth/missing-client-identifier' || 
              firebaseError.code === 'auth/app-not-authorized' ||
              firebaseError.code === 'auth/invalid-app-credential') {
            // Fallback to test mode when Firebase config is incomplete
            console.log("=== FALLING BACK TO TEST MODE ===");
            setStatusMessage("Using Test Mode (Firebase config pending)");
            await new Promise(resolve => setTimeout(resolve, 500));
            setVerificationId("FIREBASE_CONFIG_PENDING");
            setOtpSent(true);
            setStatusMessage("Test OTP: 123456");
            showOtpSentPopup("Test Mode: Use OTP 123456");
            
            Alert.alert(
              "Firebase Setup Required",
              "To enable real SMS OTP:\n\n" +
              "1. Enable Play Integrity API in Google Cloud Console\n" +
              "2. Configure App Check in Firebase Console\n" +
              "3. Or add test phone number in Firebase Auth\n\n" +
              "For now, use test OTP: 123456",
              [{ text: "OK" }]
            );
          } else {
            throw firebaseError; // Re-throw other errors
          }
        }
      } else {
        // Fallback for mobile without native Firebase
        console.log("=== MOBILE FALLBACK TEST MODE ===");
        setStatusMessage("Test Mode: Use OTP 123456");
        await new Promise(resolve => setTimeout(resolve, 1000));
        setVerificationId("MOBILE_TEST_MODE");
        setOtpSent(true);
        setStatusMessage("Test OTP: 123456");
        showOtpSentPopup("OTP sent (Test Mode - Native Firebase not available)");
      }
      
    } catch (err: any) {
      console.error("=== SEND OTP ERROR ===");
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      
      setStatusMessage("");
      setOtpSent(false);
      
      let errorMessage = "Failed to send OTP. Please try again.";
      
      if (err.code === 'auth/invalid-phone-number') {
        errorMessage = "Invalid phone number. Please check and try again.";
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Please wait a few minutes and try again.";
      } else if (err.code === 'auth/quota-exceeded') {
        errorMessage = "SMS limit reached. Please try again later.";
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (err.code === 'auth/app-not-authorized') {
        errorMessage = "App not authorized. Please check Firebase configuration.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSendingOtp(false);
    }
  };

  /* ===============================
     AUTO SEND OTP ON MOUNT
  ================================ */
  useEffect(() => {
    const t = setTimeout(sendOtp, 1000);
    return () => clearTimeout(t);
  }, []);

  /* ===============================
     SHAKE ANIMATION
  ================================ */
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  /* ===============================
     VERIFY OTP
  ================================ */
  const handleVerifyOTP = async () => {
    if (isLoading) return;

    const code = otp.join("");
    console.log("=== VERIFYING OTP ===");
    console.log("Platform:", Platform.OS);
    console.log("Entered OTP:", code);

    if (code.length !== OTP_LENGTH) {
      shake();
      Alert.alert("Invalid OTP", "Please enter the complete 6-digit OTP");
      return;
    }

    if (!confirmationResult && !verificationId) {
      Alert.alert(
        "OTP Not Sent", 
        "Please wait for OTP to be sent first, or click 'Resend OTP'",
        [
          { text: "Resend OTP", onPress: () => sendOtp() },
          { text: "Cancel", style: "cancel" }
        ]
      );
      return;
    }

    setIsLoading(true);
    setStatusMessage("Verifying OTP...");

    try {
      const phoneNumber = formatPhoneNumber(phone || "");
      let userId = `user_${Date.now()}`;

      // WEB TEST MODE or MOBILE FALLBACK or FIREBASE CONFIG PENDING
      if (verificationId === "WEB_TEST_MODE" || verificationId === "MOBILE_TEST_MODE" || verificationId === "FIREBASE_CONFIG_PENDING") {
        console.log("=== TEST MODE VERIFICATION ===");
        
        if (code !== WEB_TEST_OTP) {
          throw { code: 'auth/invalid-verification-code', message: 'Invalid OTP. For testing, use: 123456' };
        }
        
        console.log("Test OTP verified successfully!");
        userId = `test_${Date.now()}`;
      } 
      // MOBILE: Real Firebase verification
      else if (confirmationResult) {
        console.log("=== MOBILE REAL VERIFICATION ===");
        const userCredential = await confirmationResult.confirm(code);
        
        console.log("=== OTP VERIFIED SUCCESSFULLY ===");
        console.log("User UID:", userCredential.user.uid);
        userId = userCredential.user.uid;
      }

      // Call the userType API
      setStatusMessage("Checking user type...");
      console.log("Calling userType API for:", phoneNumber);
      
      const searchResponse = await searchUserByPhone(phoneNumber);
      console.log("API Response:", JSON.stringify(searchResponse, null, 2));

      await AsyncStorage.setItem(
        "user_search_response",
        JSON.stringify(searchResponse)
      );

      if (searchResponse?.customer?.id) {
        await AsyncStorage.setItem(
          "customer_id",
          String(searchResponse.customer.id)
        );
      }
      if (searchResponse?.merchant?.id) {
        await AsyncStorage.setItem(
          "merchant_id",
          String(searchResponse.merchant.id)
        );
      }
      if (searchResponse?.merchant?.shopName) {
        await AsyncStorage.setItem(
          "merchant_shop_name",
          String(searchResponse.merchant.shopName)
        );
      }
      
      // Determine dashboard based on userType
      const roleInfo = determineUserRole(searchResponse);
      console.log("User Type:", roleInfo.userType);
      console.log("Dashboard:", roleInfo.dashboard);

      const lowerUserType = (roleInfo.userType ?? '').toLowerCase();
      const mappedUserType: 'merchant' | 'member' | 'user' =
        lowerUserType.includes('merchant')
          ? 'merchant'
          : lowerUserType.includes('customer') || lowerUserType === 'dual'
          ? 'member'
          : 'user';
      const resolvedId =
        roleInfo.userData?.customer?.id ??
        roleInfo.userData?.merchant?.id ??
        roleInfo.userData?.user?.id ??
        userId;
      const resolvedName =
        roleInfo.userData?.customer?.contactName ??
        roleInfo.userData?.customer?.name ??
        roleInfo.userData?.merchant?.contactName ??
        roleInfo.userData?.merchant?.name ??
        roleInfo.userData?.merchant?.shopName ??
        roleInfo.userData?.user?.name ??
        'User';

      const authUser = {
        id: String(resolvedId ?? userId),
        name: resolvedName,
        phone: phoneNumber,
        userType: mappedUserType,
      };

      await AsyncStorage.setItem("user_data", JSON.stringify(authUser));
      await AsyncStorage.setItem("user_role", roleInfo.role);
      await AsyncStorage.setItem("user_type", roleInfo.userType);
      
      setUser(authUser);
      setToken(`token_${userId}`);

      setStatusMessage("Success! Redirecting...");
      
      // Navigate to dashboard with userType param
      router.replace({
        pathname: roleInfo.dashboard as any,
        params: { userType: roleInfo.userType }
      });
      
    } catch (err: any) {
      console.error("=== VERIFY OTP ERROR ===");
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      
      shake();
      setStatusMessage("");
      
      let errorMessage = "Verification failed. Please try again.";
      
      if (err.code === 'auth/invalid-verification-code') {
        const isTestMode = verificationId === "WEB_TEST_MODE" || verificationId === "MOBILE_TEST_MODE";
        errorMessage = isTestMode 
          ? `Invalid OTP. For testing, use: ${WEB_TEST_OTP}`
          : "Invalid OTP. Please check the code and try again.";
      } else if (err.code === 'auth/code-expired') {
        errorMessage = "OTP has expired. Please request a new one.";
        setCanResend(true);
      } else if (err.code === 'auth/session-expired') {
        errorMessage = "Session expired. Please request a new OTP.";
        setCanResend(true);
        setConfirmationResult(null);
        setVerificationId(null);
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert("Verification Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /* ===============================
     OTP INPUT HANDLERS
  ================================ */
  const handleOtpChange = (value: string, index: number) => {
    // Handle paste of full OTP
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const newOtp = Array(OTP_LENGTH).fill("");
      digits.forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtp(newOtp);
      
      if (digits.length >= OTP_LENGTH) {
        inputRefs.current[OTP_LENGTH - 1]?.focus();
      } else {
        inputRefs.current[digits.length]?.focus();
      }
      return;
    }

    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Check if we're in test mode
  const isTestMode = verificationId === "WEB_TEST_MODE" || verificationId === "MOBILE_TEST_MODE" || verificationId === "FIREBASE_CONFIG_PENDING";

  /* ===============================
     UI
  ================================ */
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter the 6-digit OTP code that we sent to</Text>
        <Text style={styles.phoneNumber}>+91 {phone}</Text>
        
        {/* Test Mode Banner */}
        {isTestMode && (
          <View style={styles.testModeBanner}>
            <Ionicons name="information-circle" size={20} color="#1976D2" />
            <Text style={styles.testModeText}>Test Mode: Use OTP 123456</Text>
          </View>
        )}
        
        {/* Real SMS Banner for Mobile */}
        {isMobile && !isTestMode && otpSent && (
          <View style={styles.realSmsBanner}>
            <Ionicons name="phone-portrait" size={20} color="#4CAF50" />
            <Text style={styles.realSmsText}>Real SMS sent to your phone</Text>
          </View>
        )}
        
        {/* Status Indicator */}
        {otpSent ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.successText}>
              {isTestMode ? "Ready to verify (Test Mode)" : "OTP sent successfully"}
            </Text>
          </View>
        ) : (
          <View style={styles.waitingContainer}>
            <Ionicons name="time" size={20} color="#FF9800" />
            <Text style={styles.waitingText}>
              {isSendingOtp ? "Sending OTP..." : "Waiting for OTP..."}
            </Text>
          </View>
        )}

        {/* Loading Status */}
        {statusMessage ? (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color="#FF6600" />
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        ) : null}

        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <View style={styles.otpContainer}>
            {otp.map((d, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputRefs.current[i] = r; }}
                style={[styles.otpInput, d ? styles.otpInputFilled : null]}
                keyboardType="number-pad"
                maxLength={1}
                value={d}
                onChangeText={v => handleOtpChange(v, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                autoFocus={i === 0}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
              />
            ))}
          </View>
        </Animated.View>

        <TouchableOpacity
          style={[styles.button, (isLoading || isSendingOtp || !otpSent) && styles.buttonDisabled]}
          onPress={handleVerifyOTP}
          disabled={isLoading || isSendingOtp || !otpSent}
        >
          {isLoading ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.buttonText}> Verifying...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendLabel}>Didn't receive the code? </Text>
          <TouchableOpacity 
            onPress={sendOtp} 
            disabled={!canResend || isSendingOtp}
          >
            <Text style={[styles.resendText, (!canResend || isSendingOtp) && styles.resendDisabled]}>
              {isSendingOtp ? "Sending..." : canResend ? "Resend OTP" : `Resend in ${timer}s`}
            </Text>
          </TouchableOpacity>
        </View>

      </View>

      <Modal visible={showOtpPopup} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>
            <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
            <Text style={styles.popupText}>{otpPopupMessage}</Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* ===============================
   STYLES
================================ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, padding: 24 },
  backButton: { marginTop: 40, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "bold", color: "#000" },
  subtitle: { color: "#666", marginTop: 8, fontSize: 16 },
  phoneNumber: { color: "#000", fontSize: 18, fontWeight: "600", marginTop: 4 },
  
  testModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  testModeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  
  realSmsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  realSmsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  successText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  waitingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF6600',
  },
  otpContainer: { 
    flexDirection: "row", 
    justifyContent: "center", 
    marginTop: 24,
    marginBottom: 16,
  },
  otpInput: {
    width: 50,
    height: 60,
    fontSize: 24,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 6,
    textAlign: "center",
    marginHorizontal: 4,
    color: "#000",
  },
  otpInputFilled: {
    borderColor: "#FF6600",
    backgroundColor: "#FFF8F0",
  },
  button: {
    backgroundColor: "#FF6600",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: { 
    backgroundColor: "#FFB380",
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: '600' 
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  resendLabel: {
    color: '#666',
    fontSize: 14,
  },
  resendText: { 
    color: "#FF6600", 
    fontWeight: '600',
    fontSize: 14,
  },
  resendDisabled: {
    color: '#999',
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  popupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  popupText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },
});
