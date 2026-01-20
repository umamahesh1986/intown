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
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";

import { auth, firebaseConfig } from "../firebase/firebaseConfig";
import { useAuthStore } from "../store/authStore";
import { searchUserByPhone, determineUserRole } from "../utils/api";

/* ===============================
   CONFIG
================================ */
const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

// Web uses test mode, Mobile uses real Firebase OTP
const WEB_TEST_MODE = true;
const TEST_OTP = "123456";

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

  const { setUser, setToken } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const isWebTestMode = Platform.OS === 'web' && WEB_TEST_MODE;

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
    
    try {
      const formattedPhone = formatPhoneNumber(phone || "");
      console.log("Sending OTP to:", formattedPhone);
      setStatusMessage("Sending OTP...");

      setIsSendingOtp(true);
      setCanResend(false);
      setTimer(RESEND_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(""));

      if (isWebTestMode) {
        // Web Test Mode
        console.log("Web Test Mode: Using test OTP:", TEST_OTP);
        setStatusMessage("");
        Alert.alert(
          "Test Mode", 
          `OTP sent to ${formattedPhone}\n\nFor testing, use OTP: ${TEST_OTP}`
        );
        setIsSendingOtp(false);
        return;
      }

      // Real Firebase OTP for Mobile
      if (!recaptchaVerifier.current) {
        setStatusMessage("Waiting for reCAPTCHA...");
        // Wait a bit for reCAPTCHA to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!recaptchaVerifier.current) {
          Alert.alert("Error", "Please wait for reCAPTCHA to load and try again");
          setIsSendingOtp(false);
          setStatusMessage("");
          return;
        }
      }

      console.log("Sending real Firebase OTP...");
      setStatusMessage("Sending SMS...");
      
      const provider = new PhoneAuthProvider(auth);
      const id = await provider.verifyPhoneNumber(
        formattedPhone,
        recaptchaVerifier.current
      );
      
      console.log("Verification ID received:", id);
      setVerificationId(id);
      setStatusMessage("OTP sent! Check your phone.");
      
      Alert.alert(
        "OTP Sent ✓", 
        "Please check your phone for the SMS OTP.\n\nThe OTP will auto-fill when received.",
        [{ text: "OK" }]
      );
      
    } catch (err: any) {
      console.error('Send OTP error:', err);
      setStatusMessage("");
      
      let errorMessage = "Failed to send OTP. Please try again.";
      
      if (err.code === 'auth/invalid-phone-number') {
        errorMessage = "Invalid phone number format.";
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "Too many requests. Please try again in a few minutes.";
      } else if (err.code === 'auth/quota-exceeded') {
        errorMessage = "SMS quota exceeded. Please try again later.";
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection.";
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
     VERIFY OTP & DETERMINE USER TYPE
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
    setStatusMessage("Verifying OTP...");

    try {
      let phoneNumber = phone || "";
      let userId = `user_${Date.now()}`;

      if (isWebTestMode) {
        // Web Test Mode - Verify test OTP
        if (code !== TEST_OTP) {
          shake();
          Alert.alert("Invalid OTP", `Please enter the test OTP: ${TEST_OTP}`);
          setIsLoading(false);
          setStatusMessage("");
          return;
        }
        console.log("Web Test Mode: OTP verified");
        phoneNumber = formatPhoneNumber(phone || "");
      } else {
        // Real Firebase OTP verification for Mobile
        if (!verificationId) {
          Alert.alert("Error", "Please request OTP first by clicking 'Resend OTP'");
          setIsLoading(false);
          setStatusMessage("");
          return;
        }
        
        console.log("Verifying Firebase OTP...");
        const credential = PhoneAuthProvider.credential(verificationId, code);
        const result = await signInWithCredential(auth, credential);
        
        phoneNumber = result.user.phoneNumber || phone || "";
        userId = result.user.uid;
        console.log("Firebase OTP verified successfully, UID:", userId);
      }

      // Call the userType API to determine user role
      setStatusMessage("Checking user type...");
      console.log("Calling userType API for phone:", phoneNumber);
      
      const searchResponse = await searchUserByPhone(phoneNumber);
      console.log("API Response:", JSON.stringify(searchResponse, null, 2));
      
      // Determine user role and dashboard based on userType
      const roleInfo = determineUserRole(searchResponse);
      console.log("User Type:", roleInfo.userType);
      console.log("Role:", roleInfo.role);
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
      await AsyncStorage.setItem("user_search_response", JSON.stringify(searchResponse));
      
      setUser(userData);
      setToken(`token_${userId}`);

      setStatusMessage("Redirecting...");
      
      // Navigate to appropriate dashboard based on userType
      // - new_user → /user-dashboard
      // - in_Customer → /member-dashboard  
      // - in_Merchant → /merchant-dashboard
      // - dual (both) → /dual-dashboard
      console.log("Navigating to:", roleInfo.dashboard);
      router.replace(roleInfo.dashboard as any);
      
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      shake();
      setStatusMessage("");
      
      let errorMessage = "Invalid or expired OTP";
      if (err.code === 'auth/invalid-verification-code') {
        errorMessage = "Invalid OTP. Please check and try again.";
      } else if (err.code === 'auth/code-expired') {
        errorMessage = "OTP expired. Please request a new one.";
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection.";
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /* ===============================
     OTP INPUT HANDLERS
  ================================ */
  const handleOtpChange = (value: string, index: number) => {
    // Handle paste of full OTP (auto-fill from SMS)
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (i < OTP_LENGTH) newOtp[i] = digit;
      });
      setOtp(newOtp);
      
      // Focus last filled input
      const lastIndex = Math.min(digits.length - 1, OTP_LENGTH - 1);
      inputRefs.current[lastIndex]?.focus();
      
      // Auto-verify if complete
      if (newOtp.every(d => d !== "")) {
        setTimeout(handleVerifyOTP, 300);
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

    // Auto-verify when all digits entered
    if (newOtp.every(d => d !== "")) {
      setTimeout(handleVerifyOTP, 300);
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
      {/* Firebase Recaptcha Modal - Only for Mobile */}
      {Platform.OS !== 'web' && (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebaseConfig}
          attemptInvisibleVerification={true}
        />
      )}

      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>Sent to +91 {phone}</Text>
        
        {/* Mode Indicator */}
        {isWebTestMode ? (
          <View style={styles.testModeContainer}>
            <Ionicons name="flask" size={16} color="#FF9800" />
            <Text style={styles.testModeText}>Test Mode - Use OTP: {TEST_OTP}</Text>
          </View>
        ) : (
          <View style={styles.realModeContainer}>
            <Ionicons name="phone-portrait" size={16} color="#4CAF50" />
            <Text style={styles.realModeText}>Real SMS OTP - Check your phone</Text>
          </View>
        )}

        {/* Status Message */}
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
                textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : undefined}
                autoComplete={Platform.OS === 'android' ? 'sms-otp' : undefined}
              />
            ))}
          </View>
        </Animated.View>

        <TouchableOpacity
          style={[styles.button, (isLoading || isSendingOtp) && styles.buttonDisabled]}
          onPress={handleVerifyOTP}
          disabled={isLoading || isSendingOtp}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={sendOtp} 
          disabled={!canResend || isSendingOtp}
          style={styles.resendButton}
        >
          <Text style={[styles.resendText, (!canResend || isSendingOtp) && { opacity: 0.5 }]}>
            {isSendingOtp ? "Sending..." : canResend ? "Resend OTP" : `Resend in ${timer}s`}
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
  title: { fontSize: 32, fontWeight: "bold", color: "#000" },
  subtitle: { color: "#666", marginBottom: 8 },
  testModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  testModeText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#FF9800',
    fontWeight: '600',
  },
  realModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  realModeText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF6600',
  },
  otpContainer: { 
    flexDirection: "row", 
    justifyContent: "center", 
    marginVertical: 20,
  },
  otpInput: {
    width: 48,
    height: 56,
    fontSize: 22,
    fontWeight: 'bold',
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 8,
    textAlign: "center",
    marginHorizontal: 4,
    color: "#000",
    backgroundColor: "#fff",
  },
  otpInputFilled: {
    borderColor: "#FF6600",
    backgroundColor: "#FFF8F0",
  },
  button: {
    backgroundColor: "#FF6600",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: '600' },
  resendButton: {
    padding: 16,
    alignItems: 'center',
  },
  resendText: { 
    color: "#FF6600", 
    fontWeight: '600',
    fontSize: 16,
  },
});
