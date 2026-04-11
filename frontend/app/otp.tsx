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
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "../store/authStore";
import { searchUserByPhone, determineUserRole, sendOtpApi, verifyOtpApi } from "../utils/api";

/* ===============================
   CONFIG
================================ */
const OTP_LENGTH = 4;
const RESEND_SECONDS = 30;

/* ===============================
   PHONE FORMATTER
================================ */
const formatPhoneNumber = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.startsWith("91") && cleaned.length === 12) return `+${cleaned}`;
  if (phone.startsWith("+")) return phone;
  return `+91${cleaned}`;
};

const toApiPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) return `91${cleaned}`;
  if (cleaned.startsWith("91") && cleaned.length === 12) return cleaned;
  return `91${cleaned}`;
};

const maskPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "").slice(-10);
  if (cleaned.length < 10) return phone;
  return `******${cleaned.slice(-4)}`;
};

export default function OTPScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const { setUser, setToken } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [otpSent, setOtpSent] = useState(true); // OTP was already sent from login screen
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otpPopupMessage, setOtpPopupMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasProcessedAuth = useRef(false);
  const isMountedRef = useRef(true);

  const showOtpSentPopup = (message: string) => {
    setOtpPopupMessage(message);
    setShowOtpPopup(true);
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    popupTimerRef.current = setTimeout(() => {
      setShowOtpPopup(false);
    }, 2000);
  };

  useEffect(() => {
    isMountedRef.current = true;
    // Show success popup on mount since OTP was sent from login screen
    showOtpSentPopup("OTP sent successfully");
    return () => {
      isMountedRef.current = false;
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, []);

  /* ===============================
     SHARED POST-VERIFICATION LOGIC
  ================================ */
  const processVerifiedUser = useCallback(async (userId: string) => {
    if (hasProcessedAuth.current) return;
    hasProcessedAuth.current = true;

    try {
      const phoneNumber = formatPhoneNumber(phone || "");

      setStatusMessage("Checking user type...");
      const searchResponse = await searchUserByPhone(phoneNumber);

      await AsyncStorage.setItem("user_search_response", JSON.stringify(searchResponse));

      if (searchResponse?.customer?.id) {
        await AsyncStorage.setItem("customer_id", String(searchResponse.customer.id));
      }
      if (searchResponse?.merchant?.id) {
        await AsyncStorage.setItem("merchant_id", String(searchResponse.merchant.id));
      }
      if (searchResponse?.merchant?.shopName) {
        await AsyncStorage.setItem("merchant_shop_name", String(searchResponse.merchant.shopName));
      }

      const roleInfo = determineUserRole(searchResponse);

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

      if (searchResponse?.merchant?.businessName) {
        await AsyncStorage.setItem("merchant_shop_name", String(searchResponse.merchant.businessName));
      }
      if (searchResponse?.merchant?.description) {
        await AsyncStorage.setItem("merchant_description", String(searchResponse.merchant.description));
      }
      if (searchResponse?.merchant?.contactName) {
        await AsyncStorage.setItem("merchant_contact_name", String(searchResponse.merchant.contactName));
      }

      await setUser(authUser);
      await setToken(`token_${userId}`);

      if (isMountedRef.current) {
        setStatusMessage("Success! Redirecting...");
      }

      const routeParams: Record<string, string> = { userType: roleInfo.userType };
      if (roleInfo.role === 'merchant' || roleInfo.role === 'dual') {
        const mId = searchResponse?.merchant?.id;
        if (mId) routeParams.merchantId = String(mId);
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      router.replace({
        pathname: roleInfo.dashboard as any,
        params: routeParams,
      });
    } catch (err: any) {
      hasProcessedAuth.current = false;
      if (isMountedRef.current) {
        Alert.alert("Error", "Failed to complete login. Please try again.");
        setStatusMessage("");
        setIsLoading(false);
      }
    }
  }, [phone, router, setUser, setToken]);

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
     RESEND OTP
  ================================ */
  const handleResendOtp = async () => {
    if (isSendingOtp) return;
    setIsSendingOtp(true);
    setCanResend(false);
    setTimer(RESEND_SECONDS);
    setOtp(Array(OTP_LENGTH).fill(""));
    setErrorMessage("");
    setStatusMessage("Resending OTP...");

    try {
      const mobileNumber = toApiPhone(phone || "");
      await sendOtpApi(mobileNumber);
      setOtpSent(true);
      setStatusMessage("");
      showOtpSentPopup("OTP sent successfully");
    } catch (err: any) {
      setStatusMessage("");
      Alert.alert("Error", err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

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
    if (isLoading || hasProcessedAuth.current) return;

    const code = otp.join("");

    if (code.length !== OTP_LENGTH) {
      shake();
      setErrorMessage("Please enter the complete 4-digit OTP");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setStatusMessage("Verifying OTP...");

    try {
      const mobileNumber = toApiPhone(phone || "");
      const response = await verifyOtpApi(mobileNumber, code);

      if (response.success === false) {
        throw { message: response.message || "OTP verification failed. Invalid or expired OTP." };
      }

      // OTP verified successfully
      const userId = response.userId || response.user?.id || `user_${Date.now()}`;
      await processVerifiedUser(String(userId));
    } catch (err: any) {
      shake();
      hasProcessedAuth.current = false;
      setStatusMessage("");

      const msg = err.message || "Invalid or expired OTP. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /* ===============================
     OTP INPUT HANDLERS
  ================================ */
  const handleOtpChange = (value: string, index: number) => {
    setErrorMessage("");

    // Handle paste of multiple digits
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const newOtp = Array(OTP_LENGTH).fill("");
      digits.forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtp(newOtp);

      if (digits.length >= OTP_LENGTH) {
        inputRefs.current[OTP_LENGTH - 1]?.focus();
        // Auto-submit when all digits pasted
        setTimeout(() => {
          const code = newOtp.join("");
          if (code.length === OTP_LENGTH) {
            handleVerifyOTP();
          }
        }, 300);
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

    // Auto-submit when last digit entered
    if (value && index === OTP_LENGTH - 1) {
      const code = newOtp.join("");
      if (code.length === OTP_LENGTH) {
        setTimeout(() => handleVerifyOTP(), 300);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const inputWebStyle: any =
    Platform.OS === 'web'
      ? { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' }
      : null;

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
        <Text style={styles.subtitle}>Enter the 4-digit OTP code that we sent to</Text>
        <Text style={styles.phoneNumber}>+91 {maskPhone(phone || "")}</Text>

        {/* Status Indicator */}
        {otpSent && !errorMessage ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.successText}>OTP sent successfully</Text>
          </View>
        ) : null}

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#F44336" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

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
                style={[styles.otpInput, inputWebStyle, d ? styles.otpInputFilled : null, errorMessage ? styles.otpInputError : null]}
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
          style={[styles.button, (isLoading || isSendingOtp) && styles.buttonDisabled]}
          onPress={handleVerifyOTP}
          disabled={isLoading || isSendingOtp}
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
            onPress={handleResendOtp}
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
    flex: 1,
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
    width: 64,
    height: 72,
    fontSize: 28,
    fontWeight: 'bold',
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    textAlign: "center",
    marginHorizontal: 8,
    color: "#000",
    backgroundColor: "#FAFAFA",
  },
  otpInputFilled: {
    borderColor: "#FF8A00",
    backgroundColor: "#FFF8F0",
  },
  otpInputError: {
    borderColor: "#F44336",
    backgroundColor: "#FFF5F5",
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
    fontWeight: '600',
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
