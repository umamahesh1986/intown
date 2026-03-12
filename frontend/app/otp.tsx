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

// For mobile: use @react-native-firebase/auth (native module)
if (Platform.OS !== 'web') {
  try {
    firebaseAuth = require('@react-native-firebase/auth').default;
  } catch (e) {
    console.log('React Native Firebase not available');
  }
}

/* ===============================
   CONFIG
================================ */
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;
const WEB_TEST_OTP = "123456"; // Test OTP for web only

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
    
    setStatusMessage("Sending OTP...");
    setIsSendingOtp(true);
    setCanResend(false);
    setTimer(RESEND_SECONDS);
    setOtp(Array(OTP_LENGTH).fill(""));
    setOtpSent(false);

    try {
      // WEB: Use test OTP mode
      if (isWeb) {
        console.log("=== WEB TEST MODE ===");
        setStatusMessage("Sending OTP...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        setVerificationId("WEB_TEST_MODE");
        setOtpSent(true);
        setStatusMessage("");
        showOtpSentPopup("OTP sent successfully");
        setIsSendingOtp(false);
        return;
      }

      // MOBILE: Use real @react-native-firebase/auth
      if (isMobile && firebaseAuth) {
        console.log("=== MOBILE REAL OTP ===");
        setStatusMessage("Sending SMS...");
        
        const auth = firebaseAuth();
        
        if (auth.settings) {
          auth.settings.appVerificationDisabledForTesting = false;
        }
        
        const confirmation = await auth.signInWithPhoneNumber(formattedPhone);
        
        console.log("=== OTP SENT SUCCESSFULLY (Mobile) ===");
        setConfirmationResult(confirmation);
        setOtpSent(true);
        setStatusMessage("OTP sent! Check your SMS.");
        showOtpSentPopup("OTP sent successfully");
      } else if (isMobile && !firebaseAuth) {
        throw new Error('Firebase native module not available. Please ensure @react-native-firebase/auth is properly installed.');
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
      } else if (err.code === 'auth/missing-client-identifier') {
        errorMessage = "App verification failed. Please check Firebase setup.";
      } else if (err.code === 'auth/invalid-app-credential') {
        errorMessage = "App credential error. Please check Firebase setup.";
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

      // WEB: Test mode verification
      if (verificationId === "WEB_TEST_MODE") {
        console.log("=== WEB TEST MODE VERIFICATION ===");
        if (code !== WEB_TEST_OTP) {
          throw { code: 'auth/invalid-verification-code', message: 'Invalid OTP' };
        }
        console.log("Web test OTP verified successfully!");
        userId = `web_test_${Date.now()}`;
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
        errorMessage = "Invalid OTP. Please check the code and try again.";
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
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter the 6-digit OTP code that we sent to</Text>
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
            <Text style={styles.waitingText}>
              {isSendingOtp ? "Sending OTP..." : "Waiting for OTP..."}
            </Text>
          </View>
        )}

        {/* Loading Status */}
        {statusMessage ? (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color="#FF8A00" />
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
    color: '#FF8A00',
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
    borderColor: "#FF8A00",
    backgroundColor: "#FFF8F0",
  },
  button: {
    backgroundColor: "#FF8A00",
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
    color: "#FF8A00", 
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
