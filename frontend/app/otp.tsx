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
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { 
  PhoneAuthProvider, 
  signInWithCredential,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from "firebase/auth";

import { auth, firebaseConfig } from "../firebase/firebaseConfig";
import { useAuthStore } from "../store/authStore";
import { searchUserByPhone, determineUserRole } from "../utils/api";

// Conditionally import FirebaseRecaptchaVerifierModal for native only
let FirebaseRecaptchaVerifierModal: any = null;
if (Platform.OS !== 'web') {
  FirebaseRecaptchaVerifierModal = require('expo-firebase-recaptcha').FirebaseRecaptchaVerifierModal;
}

/* ===============================
   CONFIG
================================ */
const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

// Web Test Mode - Bypass reCAPTCHA for web testing
// Set to false to enable real Firebase OTP on web
const WEB_TEST_MODE = true;
const TEST_OTP = "123456";

/* ===============================
   PHONE FORMATTER (CRITICAL FIX)
================================ */
const formatPhoneNumber = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");

  // India default
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return `+${cleaned}`;
  }

  if (phone.startsWith("+")) {
    return phone;
  }

  throw new Error("Invalid phone number");
};

export default function OTPScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const { setUser, setToken } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const recaptchaVerifier = useRef<any>(null);
  const webRecaptchaVerifier = useRef<RecaptchaVerifier | null>(null);
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
     SETUP WEB RECAPTCHA (only if not in test mode)
  ================================ */
  useEffect(() => {
    if (Platform.OS === 'web' && !WEB_TEST_MODE) {
      // Create invisible recaptcha container
      const containerId = 'recaptcha-container';
      let container = document.getElementById(containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        document.body.appendChild(container);
      }

      try {
        webRecaptchaVerifier.current = new RecaptchaVerifier(auth, containerId, {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA verified');
          },
        });
      } catch (error) {
        console.error('Error setting up recaptcha:', error);
      }
    }

    return () => {
      if (Platform.OS === 'web' && !WEB_TEST_MODE) {
        const container = document.getElementById('recaptcha-container');
        if (container) {
          container.remove();
        }
      }
    };
  }, []);

  /* ===============================
     SEND OTP
  ================================ */
  const sendOtp = async () => {
    try {
      const formattedPhone = formatPhoneNumber(phone);
      console.log("Sending OTP to:", formattedPhone);

      setCanResend(false);
      setTimer(RESEND_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(""));

      if (Platform.OS === 'web') {
        if (WEB_TEST_MODE) {
          // Web Test Mode - No real OTP, use test code
          console.log("Web Test Mode: Using test OTP:", TEST_OTP);
          setConfirmationResult({ testMode: true });
          Alert.alert(
            "Test Mode", 
            `OTP sent to +91 ${phone}\n\nFor testing, use OTP: ${TEST_OTP}`
          );
          return;
        }

        // Real Firebase OTP for web (if test mode disabled)
        if (!webRecaptchaVerifier.current) {
          console.error("reCAPTCHA verifier not initialized");
          Alert.alert("Error", "reCAPTCHA not initialized. Please refresh the page.");
          return;
        }

        console.log("Calling signInWithPhoneNumber...");
        const result = await signInWithPhoneNumber(auth, formattedPhone, webRecaptchaVerifier.current);
        console.log("OTP sent successfully, confirmation result:", result);
        setConfirmationResult(result);
        Alert.alert("OTP Sent", "Please check your phone for the OTP");
      } else {
        // Native: Use PhoneAuthProvider with FirebaseRecaptchaVerifierModal
        // This will send REAL SMS OTP on mobile devices
        if (!recaptchaVerifier.current) {
          console.error("Native reCAPTCHA verifier not initialized");
          return;
        }

        console.log("Using PhoneAuthProvider for native...");
        const provider = new PhoneAuthProvider(auth);
        const id = await provider.verifyPhoneNumber(
          formattedPhone,
          recaptchaVerifier.current
        );
        console.log("Verification ID received:", id);
        setVerificationId(id);
        Alert.alert("OTP Sent", "Please check your phone for the OTP");
      }
    } catch (err: any) {
      console.error('Send OTP error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      let errorMessage = "Failed to send OTP. Please try again.";
      
      if (err.code === 'auth/invalid-phone-number') {
        errorMessage = "Invalid phone number format. Please check and try again.";
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "Too many requests. Please try again later.";
      } else if (err.code === 'auth/captcha-check-failed') {
        errorMessage = "reCAPTCHA verification failed. Please try again.";
      } else if (err.code === 'auth/quota-exceeded') {
        errorMessage = "SMS quota exceeded. Please try again later.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert("Error", errorMessage);
    }
  };

  /* ===============================
     AUTO SEND OTP
  ================================ */
  useEffect(() => {
    const t = setTimeout(sendOtp, 500);
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

    if (code.length !== OTP_LENGTH) {
      shake();
      Alert.alert("Invalid OTP", "Please enter 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      let result;

      if (Platform.OS === 'web') {
        // Web: Use confirmationResult
        if (!confirmationResult) {
          Alert.alert("Error", "Please request OTP first");
          setIsLoading(false);
          return;
        }
        result = await confirmationResult.confirm(code);
      } else {
        // Native: Use credential
        if (!verificationId) {
          Alert.alert("Error", "Please request OTP first");
          setIsLoading(false);
          return;
        }
        const credential = PhoneAuthProvider.credential(verificationId, code);
        result = await signInWithCredential(auth, credential);
      }

      const token = await result.user.getIdToken();
      const phoneNumber = result.user.phoneNumber || phone;

      // Call the search API to get user role
      console.log("Searching user data for phone:", phoneNumber);
      const searchResponse = await searchUserByPhone(phoneNumber);
      
      // Determine user role and dashboard
      const roleInfo = determineUserRole(searchResponse);
      console.log("User role determined:", roleInfo.role, "Dashboard:", roleInfo.dashboard);

      // Prepare user data based on role
      const userData = {
        uid: result.user.uid,
        phone: phoneNumber,
        role: roleInfo.role,
        ...roleInfo.userData,
      };

      // Save user data
      await AsyncStorage.setItem("user_data", JSON.stringify(userData));
      await AsyncStorage.setItem("user_role", roleInfo.role);
      await AsyncStorage.setItem("user_search_response", JSON.stringify(searchResponse));
      
      setUser(userData);
      setToken(token);

      // Navigate to appropriate dashboard
      router.replace(roleInfo.dashboard as any);
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      shake();
      Alert.alert("Error", err.message || "Invalid or expired OTP");
    } finally {
      setIsLoading(false);
    }
  };

  /* ===============================
     OTP INPUT
  ================================ */
  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every(d => d !== "")) {
      setTimeout(handleVerifyOTP, 150);
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
      {/* Native-only: Firebase Recaptcha Modal */}
      {Platform.OS !== 'web' && FirebaseRecaptchaVerifierModal && (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebaseConfig}
        />
      )}

      {/* Web-only: Hidden recaptcha container */}
      {Platform.OS === 'web' && (
        <div id="recaptcha-container" style={{ display: 'none' }} />
      )}

      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>

        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>Sent to +91 {phone}</Text>

        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <View style={styles.otpContainer}>
            {otp.map((d, i) => (
              <TextInput
                key={i}
                ref={r => (inputRefs.current[i] = r)}
                style={styles.otpInput}
                keyboardType="number-pad"
                maxLength={1}
                value={d}
                onChangeText={v => handleOtpChange(v, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                autoFocus={i === 0}
              />
            ))}
          </View>
        </Animated.View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerifyOTP}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Verifying..." : "Verify & Continue"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={sendOtp} disabled={!canResend}>
          <Text style={[styles.resendText, !canResend && { opacity: 0.5 }]}>
            {canResend ? "Resend OTP" : `Resend in ${timer}s`}
          </Text>
        </TouchableOpacity>
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
  title: { fontSize: 32, fontWeight: "bold" },
  subtitle: { color: "#666", marginBottom: 40 },
  otpContainer: { flexDirection: "row", justifyContent: "center", gap: 8 },
  otpInput: {
    width: 48,
    height: 56,
    fontSize: 22,
    borderWidth: 2,
    borderColor: "#FF6600",
    borderRadius: 8,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#FF6600",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 30,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 18 },
  resendText: { textAlign: "center", marginTop: 16, color: "#FF6600" },
});
