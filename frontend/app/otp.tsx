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
const RESEND_SECONDS = 60;

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
  const [otpSent, setOtpSent] = useState(false);

  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
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
     SEND OTP
  ================================ */
  const sendOtp = async () => {
    if (isSendingOtp) return;
    
    try {
      const formattedPhone = formatPhoneNumber(phone || "");
      console.log("=== SENDING OTP ===");
      console.log("Phone:", formattedPhone);
      
      setStatusMessage("Initializing...");
      setIsSendingOtp(true);
      setCanResend(false);
      setTimer(RESEND_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(""));
      setOtpSent(false);

      // Check if recaptcha is ready
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
      console.log("ID Length:", id?.length);
      
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
      console.error("Full error:", JSON.stringify(err, null, 2));
      
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
    // Wait for component to fully mount and reCAPTCHA to initialize
    const t = setTimeout(sendOtp, 1500);
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
    console.log("Entered OTP:", code);
    console.log("OTP Length:", code.length);
    console.log("Has Verification ID:", !!verificationId);
    console.log("Verification ID:", verificationId?.substring(0, 20) + "...");

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
      console.log("Creating credential...");
      const credential = PhoneAuthProvider.credential(verificationId, code);
      
      console.log("Signing in with credential...");
      const result = await signInWithCredential(auth, credential);
      
      console.log("=== OTP VERIFIED SUCCESSFULLY ===");
      console.log("User UID:", result.user.uid);
      console.log("User Phone:", result.user.phoneNumber);
      
      const phoneNumber = result.user.phoneNumber || phone || "";
      const userId = result.user.uid;

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
      
      // Navigate to dashboard
      router.replace(roleInfo.dashboard as any);
      
    } catch (err: any) {
      console.error("=== VERIFY OTP ERROR ===");
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      console.error("Full error:", JSON.stringify(err, null, 2));
      
      shake();
      setStatusMessage("");
      
      let errorMessage = "Verification failed. Please try again.";
      
      if (err.code === 'auth/invalid-verification-code') {
        errorMessage = "Invalid OTP. Please check the code and try again.";
      } else if (err.code === 'auth/code-expired') {
        errorMessage = "OTP has expired. Please request a new one.";
        setCanResend(true);
      } else if (err.code === 'auth/session-expired') {
        errorMessage = "Session expired. Please request a new OTP.";
        setCanResend(true);
        setVerificationId(null);
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection.";
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
      
      // Focus appropriate input
      if (digits.length >= OTP_LENGTH) {
        inputRefs.current[OTP_LENGTH - 1]?.focus();
        // Auto verify after paste
        setTimeout(() => {
          if (newOtp.every(d => d !== "")) {
            handleVerifyOTP();
          }
        }, 500);
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
      {/* Firebase Recaptcha Modal */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification={true}
        androidHardwareAccelerationDisabled={true}
        androidLayerType="software"
      />

      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
        <Text style={styles.phoneNumber}>+91 {phone}</Text>
        
        {/* Status Indicator */}
        {otpSent ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.successText}>OTP sent successfully</Text>
          </View>
        ) : (
          <View style={styles.waitingContainer}>
            <Ionicons name="time" size={20} color="#FF9800" />
            <Text style={styles.waitingText}>Waiting for OTP...</Text>
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
                importantForAutofill="yes"
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

        {/* Debug Info (remove in production) */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Verification ID: {verificationId ? "✓ Set" : "✗ Not set"}
            </Text>
            <Text style={styles.debugText}>
              OTP Sent: {otpSent ? "✓ Yes" : "✗ No"}
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
