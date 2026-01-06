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
    if (!recaptchaVerifier.current) return;

    try {
      const formattedPhone = formatPhoneNumber(phone);

      setCanResend(false);
      setTimer(RESEND_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(""));

      const provider = new PhoneAuthProvider(auth);
      const id = await provider.verifyPhoneNumber(
        formattedPhone,
        recaptchaVerifier.current
      );

      setVerificationId(id);
    } catch (err: any) {
      Alert.alert(
        "Invalid Number",
        err.message || "Enter valid mobile number"
      );
    }
  };

  /* ===============================
     AUTO SEND OTP
  ================================ */
  useEffect(() => {
    const t = setTimeout(sendOtp, 300);
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

    if (!verificationId || code.length !== OTP_LENGTH) {
      shake();
      Alert.alert("Invalid OTP", "Please enter 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      const credential = PhoneAuthProvider.credential(
        verificationId,
        code
      );

      const result = await signInWithCredential(auth, credential);
      const token = await result.user.getIdToken();

      const user = {
        uid: result.user.uid,
        phone: result.user.phoneNumber,
      };

      await AsyncStorage.setItem("user_data", JSON.stringify(user));
      setUser(user);
      setToken(token);

      router.replace("/user-dashboard");
    } catch {
      shake();
      Alert.alert("Error", "Invalid or expired OTP");
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
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
      />

      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>

        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>Sent to {phone}</Text>

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
