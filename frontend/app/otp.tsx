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
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "../store/authStore";
import { searchUserByPhone, determineUserRole } from "../utils/api";

// Only import Firebase for mobile
let FirebaseRecaptchaVerifierModal: any = null;
let PhoneAuthProvider: any = null;
let signInWithCredential: any = null;
let auth: any = null;
let firebaseConfig: any = null;

if (Platform.OS !== 'web') {
  // Dynamic imports for mobile only
  const firebaseRecaptcha = require('expo-firebase-recaptcha');
  FirebaseRecaptchaVerifierModal = firebaseRecaptcha.FirebaseRecaptchaVerifierModal;
  
  const firebaseAuth = require('firebase/auth');
  PhoneAuthProvider = firebaseAuth.PhoneAuthProvider;
  signInWithCredential = firebaseAuth.signInWithCredential;
  
  const firebaseConfigModule = require('../firebase/firebaseConfig');
  auth = firebaseConfigModule.auth;
  firebaseConfig = firebaseConfigModule.firebaseConfig;
}

/* ===============================
   CONFIG
================================ */
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;
const WEB_TEST_OTP = "123456"; // Test OTP for web development

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

  const { setUser, setToken } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const recaptchaVerifier = useRef<any>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

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
     SEND OTP (WEB vs MOBILE)
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

    // WEB: Use Test Mode (no Firebase)
    if (isWeb) {
      console.log("=== WEB TEST MODE ===");
      setStatusMessage("Test Mode: Use OTP 123456");
      
      // Simulate OTP sent
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setVerificationId("WEB_TEST_MODE");
      setOtpSent(true);
      setStatusMessage("Test OTP: 123456");
      setIsSendingOtp(false);
      
      Alert.alert(
        "Test Mode (Web)", 
        `For web testing, use OTP: ${WEB_TEST_OTP}\n\nThis bypasses Firebase reCAPTCHA which doesn't work in web preview.`,
        [{ text: "OK" }]
      );
      return;
    }

    // MOBILE: Use Real Firebase OTP
    try {
      if (!recaptchaVerifier.current) {
        console.log("Waiting for reCAPTCHA...");
        setStatusMessage("Loading reCAPTCHA...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (!recaptchaVerifier.current) {
          Alert.alert(
            "Error", 
            "reCAPTCHA not ready. Please wait a moment and try again.",
            [{ text: "Retry", onPress: () => sendOtp() }]
          );
          setIsSendingOtp(false);
          setStatusMessage("");
          return;
        }
      }

      console.log("reCAPTCHA ready, sending OTP...");
      setStatusMessage("Sending SMS...");
      
      const provider = new PhoneAuthProvider(auth);
      const id = await provider.verifyPhoneNumber(
        formattedPhone,
        recaptchaVerifier.current
      );
      
      console.log("=== OTP SENT SUCCESSFULLY ===");
      console.log("Verification ID:", id);
      
      setVerificationId(id);
      setOtpSent(true);
      setStatusMessage("OTP sent! Enter the code.");
      
      Alert.alert(
        "OTP Sent ✓", 
        `SMS sent to ${formattedPhone}\n\nPlease enter the 6-digit OTP you receive.`,
        [{ text: "OK" }]
      );
      
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
      } else if (err.code === 'auth/captcha-check-failed') {
        errorMessage = "Verification failed. Please try again.";
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
     VERIFY OTP (WEB vs MOBILE)
  ================================ */
  const handleVerifyOTP = async () => {
    if (isLoading) return;

    const code = otp.join("");
    console.log("=== VERIFYING OTP ===");
    console.log("Platform:", Platform.OS);
    console.log("Entered OTP:", code);
    console.log("Has Verification ID:", !!verificationId);

    if (code.length !== OTP_LENGTH) {
      shake();
      Alert.alert("Invalid OTP", "Please enter the complete 6-digit OTP");
      return;
    }

    if (!verificationId) {
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

      // WEB: Test Mode Verification
      if (isWeb) {
        console.log("=== WEB TEST MODE VERIFICATION ===");
        
        if (code !== WEB_TEST_OTP) {
          throw { code: 'auth/invalid-verification-code', message: 'Invalid OTP. For web testing, use: 123456' };
        }
        
        console.log("Web test OTP verified successfully!");
        userId = `web_test_${Date.now()}`;
      } 
      // MOBILE: Real Firebase Verification
      else {
        console.log("Creating Firebase credential...");
        const credential = PhoneAuthProvider.credential(verificationId, code);
        
        console.log("Signing in with credential...");
        const result = await signInWithCredential(auth, credential);
        
        console.log("=== OTP VERIFIED SUCCESSFULLY ===");
        console.log("User UID:", result.user.uid);
        userId = result.user.uid;
      }

      // Call the userType API
      setStatusMessage("Checking user type...");
      console.log("Calling userType API for:", phoneNumber);
      
      const searchResponse = await searchUserByPhone(phoneNumber);
      console.log("API Response:", JSON.stringify(searchResponse, null, 2));
      
      // Determine dashboard based on userType
      const roleInfo = determineUserRole(searchResponse);
      console.log("User Type:", roleInfo.userType);
      console.log("Dashboard:", roleInfo.dashboard);

      // Save user data
      const userData = {
        uid: userId,
        phone: phoneNumber,
        role: roleInfo.role,
        userType: roleInfo.userType,
        ...roleInfo.userData,
      };

      await AsyncStorage.setItem("user_data", JSON.stringify(userData));
      await AsyncStorage.setItem("user_role", roleInfo.role);
      await AsyncStorage.setItem("user_type", roleInfo.userType);
      
      setUser(userData);
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
        errorMessage = isWeb 
          ? `Invalid OTP. For web testing, use: ${WEB_TEST_OTP}`
          : "Invalid OTP. Please check the code and try again.";
      } else if (err.code === 'auth/code-expired') {
        errorMessage = "OTP has expired. Please request a new one.";
        setCanResend(true);
      } else if (err.code === 'auth/session-expired') {
        errorMessage = "Session expired. Please request a new OTP.";
        setCanResend(true);
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

  /* ===============================
     UI
  ================================ */
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Firebase Recaptcha Modal - ONLY for mobile */}
      {!isWeb && FirebaseRecaptchaVerifierModal && firebaseConfig && (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebaseConfig}
          attemptInvisibleVerification={true}
          androidHardwareAccelerationDisabled={true}
          androidLayerType="software"
        />
      )}

      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
        <Text style={styles.phoneNumber}>+91 {phone}</Text>
        
        {/* Web Test Mode Banner */}
        {isWeb && (
          <View style={styles.testModeBanner}>
            <Ionicons name="information-circle" size={20} color="#1976D2" />
            <Text style={styles.testModeText}>Web Test Mode: Use OTP 123456</Text>
          </View>
        )}
        
        {/* Status Indicator */}
        {otpSent ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.successText}>
              {isWeb ? "Ready to verify (Test Mode)" : "OTP sent successfully"}
            </Text>
          </View>
        ) : (
          <View style={styles.waitingContainer}>
            <Ionicons name="time" size={20} color="#FF9800" />
            <Text style={styles.waitingText}>
              {isWeb ? "Initializing test mode..." : "Waiting for OTP..."}
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

        {/* Debug Info */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Platform: {Platform.OS} | Mode: {isWeb ? "Test" : "Firebase"}
            </Text>
            <Text style={styles.debugText}>
              Verification ID: {verificationId ? "✓ Set" : "✗ Not set"}
            </Text>
          </View>
        )}
      </View>
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
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    textAlign: "center",
    marginHorizontal: 4,
    color: "#000",
    backgroundColor: "#FAFAFA",
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
  debugContainer: {
    marginTop: 40,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
