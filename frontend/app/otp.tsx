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
import { searchUserByPhone, determineUserRole } from "../utils/api";

// SMS Auto-Read for Android (reads OTP from SMS and auto-fills input fields)
// NOTE: Only loaded on native Android, not on web (web bundler cannot resolve native modules)
let startOtpListener: any = null;
let removeOtpListener: any = null;
let getOtpHash: any = null;

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

  // Lazy-load OTP verify on Android only (inside component to avoid web bundler issues)
  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        const otpVerify = require('react-native-otp-verify');
        startOtpListener = otpVerify.startOtpListener;
        removeOtpListener = otpVerify.removeListener;
        getOtpHash = otpVerify.getHash;
      } catch (e) {
        console.log('react-native-otp-verify not available:', e);
      }
    }
  }, []);

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otpPopupMessage, setOtpPopupMessage] = useState("");
  const [autoVerifying, setAutoVerifying] = useState(false);

  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasProcessedAuth = useRef(false);
  const authUnsubscribe = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);
  const smsListenerActive = useRef(false);

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
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }
      // Clean up auth listener on unmount
      if (authUnsubscribe.current) {
        authUnsubscribe.current();
      }
      // Clean up SMS listener
      if (smsListenerActive.current && removeOtpListener) {
        try { removeOtpListener(); } catch (e) {}
        smsListenerActive.current = false;
      }
    };
  }, []);

  /* ===============================
     HELPER: Safely clean up SMS listener (call only once)
  ================================ */
  const cleanupSmsListener = useCallback(() => {
    if (smsListenerActive.current && removeOtpListener) {
      try { removeOtpListener(); } catch (e) {}
      smsListenerActive.current = false;
    }
  }, []);

  /* ===============================
     HELPER: Safe state update (only if component is still mounted)
  ================================ */
  const safeSetState = useCallback(<T,>(setter: (val: T) => void, val: T) => {
    if (isMountedRef.current) setter(val);
  }, []);

  /* ===============================
     SHARED POST-VERIFICATION LOGIC
  ================================ */
  const processVerifiedUser = useCallback(async (userId: string) => {
    if (hasProcessedAuth.current) return;
    hasProcessedAuth.current = true;

    // Clean up ALL listeners immediately to prevent race conditions
    if (authUnsubscribe.current) {
      authUnsubscribe.current();
      authUnsubscribe.current = null;
    }
    cleanupSmsListener();

    try {
      const phoneNumber = formatPhoneNumber(phone || "");

      setStatusMessage("Checking user type...");
      console.log("Calling userType API for:", phoneNumber);
      
      const searchResponse = await searchUserByPhone(phoneNumber);
      console.log("API Response:", JSON.stringify(searchResponse, null, 2));

      await AsyncStorage.setItem(
        "user_search_response",
        JSON.stringify(searchResponse)
      );

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

      // Store merchant-specific data before navigating
      if (searchResponse?.merchant?.businessName) {
        await AsyncStorage.setItem("merchant_shop_name", String(searchResponse.merchant.businessName));
      }
      if (searchResponse?.merchant?.description) {
        await AsyncStorage.setItem("merchant_description", String(searchResponse.merchant.description));
      }
      if (searchResponse?.merchant?.contactName) {
        await AsyncStorage.setItem("merchant_contact_name", String(searchResponse.merchant.contactName));
      }

      // IMPORTANT: Await setUser and setToken to ensure state is set BEFORE navigation
      console.log("=== SETTING AUTH STATE ===");
      console.log("authUser:", JSON.stringify(authUser));
      await setUser(authUser);
      console.log("=== setUser DONE ===");
      await setToken(`token_${userId}`);
      console.log("=== setToken DONE ===");

      if (isMountedRef.current) {
        setStatusMessage("Success! Redirecting...");
      }

      // Build route params — include merchantId for merchant/dual dashboards
      const routeParams: Record<string, string> = { userType: roleInfo.userType };
      if (roleInfo.role === 'merchant' || roleInfo.role === 'dual') {
        const mId = searchResponse?.merchant?.id;
        if (mId) routeParams.merchantId = String(mId);
      }

      console.log("=== NAVIGATING TO ===", roleInfo.dashboard, JSON.stringify(routeParams));

      // Small delay to let state updates flush before navigation
      await new Promise(resolve => setTimeout(resolve, 300));

      router.replace({
        pathname: roleInfo.dashboard as any,
        params: routeParams,
      });
      console.log("=== NAVIGATION DISPATCHED ===");
    } catch (err: any) {
      console.error("=== PROCESS USER ERROR ===", err);
      hasProcessedAuth.current = false;
      if (isMountedRef.current) {
        Alert.alert("Error", "Failed to complete login. Please try again.");
        setStatusMessage("");
        setIsLoading(false);
        setAutoVerifying(false);
      }
    }
  }, [phone, router, setUser, setToken, cleanupSmsListener]);

  /* ===============================
     AUTO-SUBMIT OTP (after SMS auto-fill)
     CRITICAL: Check if Firebase already auto-verified before calling confirm().
     Calling confirm() on an already-verified session causes a native crash
     on some Android devices.
  ================================ */
  const autoSubmitOtp = useCallback(async (digits: string[]) => {
    if (hasProcessedAuth.current || !confirmationResult) return;
    
    const code = digits.join('');
    if (code.length !== OTP_LENGTH) return;

    console.log('=== AUTO-SUBMITTING OTP ===', code);
    if (isMountedRef.current) {
      setIsLoading(true);
      setStatusMessage("Auto-verifying OTP...");
    }

    try {
      // Stop ALL listeners first to prevent any concurrent processing
      if (authUnsubscribe.current) {
        authUnsubscribe.current();
        authUnsubscribe.current = null;
      }
      cleanupSmsListener();

      // CRITICAL: Check if Firebase already auto-verified this session.
      // If the user is already signed in, calling confirm() again may crash
      // the native Firebase SDK on some Android devices.
      if (firebaseAuth) {
        const auth = firebaseAuth();
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log('=== USER ALREADY VERIFIED BY FIREBASE ===', currentUser.uid);
          await processVerifiedUser(currentUser.uid);
          return;
        }
      }

      const userCredential = await confirmationResult.confirm(code);
      console.log('=== AUTO-SUBMIT OTP VERIFIED ===', userCredential.user.uid);
      await processVerifiedUser(userCredential.user.uid);
    } catch (err: any) {
      console.log('Auto-submit verification failed:', err.code, err.message);
      
      // Session/code expired — auto-resend OTP
      if (err.code === 'auth/session-expired' || err.code === 'auth/code-expired') {
        console.log("=== AUTO-SUBMIT: SESSION EXPIRED — RESENDING OTP ===");
        hasProcessedAuth.current = false;
        if (isMountedRef.current) {
          setStatusMessage("OTP expired, resending...");
          setIsLoading(false);
        }
        try {
          await sendOtp(true);
          if (isMountedRef.current) {
            Alert.alert("OTP Resent", "Your previous OTP expired. A new OTP has been sent.");
          }
        } catch (_) {}
        return;
      }

      // If the error is because auth was already completed, process the current user
      if (firebaseAuth && !hasProcessedAuth.current) {
        const auth = firebaseAuth();
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log('=== RECOVERING: Using already-signed-in user ===', currentUser.uid);
          await processVerifiedUser(currentUser.uid);
          return;
        }
      }

      if (!hasProcessedAuth.current && isMountedRef.current) {
        setStatusMessage("");
        setIsLoading(false);
      }
    }
  }, [confirmationResult, processVerifiedUser, cleanupSmsListener]);

  /* ===============================
     SMS AUTO-READ & AUTO-FILL OTP
     Reads incoming SMS, extracts 6-digit OTP, and fills input fields automatically.
     IMPORTANT: Guard all state updates with hasProcessedAuth and isMountedRef
     to prevent crashes when Firebase auto-verify has already navigated away.
  ================================ */
  const startSmsAutoRead = useCallback(() => {
    if (!startOtpListener || Platform.OS !== 'android') return;

    try {
      // Log the app hash (needed for SMS format if using custom backend)
      if (getOtpHash) {
        getOtpHash().then((hash: string[]) => {
          console.log('=== App SMS Hash ===', hash);
        }).catch(() => {});
      }

      startOtpListener((message: string) => {
        console.log('=== SMS RECEIVED ===', message);

        // If auth was already processed (e.g., Firebase auto-verified),
        // do NOT touch any state or refs — the component may be unmounting.
        if (hasProcessedAuth.current || !isMountedRef.current) {
          console.log('=== SMS ignored: auth already processed or unmounted ===');
          return;
        }

        // Extract 6-digit OTP from the SMS message
        const otpMatch = /(\d{6})/.exec(message);
        if (otpMatch && otpMatch[1]) {
          const otpCode = otpMatch[1];
          console.log('=== OTP AUTO-READ ===', otpCode);
          
          // Auto-fill OTP digits in input fields
          const digits = otpCode.split('');
          if (isMountedRef.current) setOtp(digits);
          
          // Focus on the last input field to show it's filled
          setTimeout(() => {
            if (!hasProcessedAuth.current && isMountedRef.current) {
              try { inputRefs.current[OTP_LENGTH - 1]?.focus(); } catch (_) {}
            }
          }, 100);

          // Show auto-fill feedback
          if (isMountedRef.current) setStatusMessage("OTP auto-filled! Verifying...");
          
          // Auto-submit after a brief delay so user can see the filled digits
          setTimeout(() => {
            if (!hasProcessedAuth.current && isMountedRef.current) {
              autoSubmitOtp(digits);
            }
          }, 800);
        }
      });
      smsListenerActive.current = true;
      console.log('=== SMS Auto-Read listener started ===');
    } catch (error) {
      console.log('SMS Auto-Read failed to start:', error);
    }
  }, [autoSubmitOtp]);

  /* ===============================
     AUTO OTP DETECTION (Android)
     Firebase reads SMS silently and auto-verifies.
     onAuthStateChanged fires when auto-verification succeeds.
     IMPORTANT: Skip the first event (cached user from previous session).
  ================================ */
  const startAutoVerifyListener = useCallback(() => {
    if (!isMobile || !firebaseAuth) return;

    // Clean up any previous listener
    if (authUnsubscribe.current) {
      authUnsubscribe.current();
    }

    hasProcessedAuth.current = false;
    const auth = firebaseAuth();

    // Skip the first onAuthStateChanged event — it fires immediately
    // with the cached user from a previous session, NOT from a new OTP verification.
    let isInitialEvent = true;

    authUnsubscribe.current = auth.onAuthStateChanged((user: any) => {
      if (isInitialEvent) {
        isInitialEvent = false;
        console.log("=== Skipping initial cached auth event ===", user?.uid || 'null');
        return;
      }

      if (user && !hasProcessedAuth.current) {
        console.log("=== AUTO-VERIFICATION DETECTED (new auth) ===");
        console.log("User UID:", user.uid);

        // Clean up SMS listener immediately to prevent race condition
        cleanupSmsListener();

        if (isMountedRef.current) {
          setAutoVerifying(true);
          setStatusMessage("OTP auto-detected! Verifying...");
          setIsLoading(true);
        }
        processVerifiedUser(user.uid);
      }
    });
  }, [isMobile, processVerifiedUser]);

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
  const [isResend, setIsResend] = useState(false);

  const sendOtp = async (forceResend = false) => {
    if (isSendingOtp) return;
    
    const formattedPhone = formatPhoneNumber(phone || "");
    console.log("=== SENDING OTP ===");
    console.log("Platform:", Platform.OS);
    console.log("Phone:", formattedPhone);
    console.log("Force resend:", forceResend);
    
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
        
        // Sign out any previously cached user to prevent auto-verify
        // from triggering with the old session
        try {
          if (auth.currentUser) {
            console.log("=== Signing out cached user before OTP ===");
            await auth.signOut();
          }
        } catch (e) {
          console.log("Sign out failed (non-critical):", e);
        }
        
        // Only pass forceResend=true when user explicitly clicks "Resend OTP"
        const confirmation = await auth.signInWithPhoneNumber(formattedPhone, forceResend);
        
        console.log("=== OTP SENT SUCCESSFULLY (Mobile) ===");
        setConfirmationResult(confirmation);
        setOtpSent(true);
        setIsResend(true);
        setStatusMessage("OTP sent! Check your SMS.");
        showOtpSentPopup("OTP sent successfully");
        
        // Start listening for auto-verification (Android reads SMS silently)
        startAutoVerifyListener();
        
        // Start SMS auto-read to fill OTP input fields
        startSmsAutoRead();
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
    const t = setTimeout(() => sendOtp(false), 1000);
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
    if (isLoading || hasProcessedAuth.current) return;

    const code = otp.join("");
    console.log("=== VERIFYING OTP (Manual) ===");
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
          { text: "Resend OTP", onPress: () => sendOtp(true) },
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
        console.log("=== MOBILE MANUAL VERIFICATION ===");
        // Stop auto-verify listener since user is verifying manually
        if (authUnsubscribe.current) {
          authUnsubscribe.current();
          authUnsubscribe.current = null;
        }
        cleanupSmsListener();

        // Check if Firebase already auto-verified (prevents native crash)
        if (firebaseAuth) {
          const auth = firebaseAuth();
          const currentUser = auth.currentUser;
          if (currentUser) {
            console.log("=== USER ALREADY VERIFIED ===", currentUser.uid);
            userId = currentUser.uid;
          } else {
            const userCredential = await confirmationResult.confirm(code);
            console.log("=== OTP VERIFIED SUCCESSFULLY ===");
            console.log("User UID:", userCredential.user.uid);
            userId = userCredential.user.uid;
          }
        } else {
          const userCredential = await confirmationResult.confirm(code);
          console.log("=== OTP VERIFIED SUCCESSFULLY ===");
          console.log("User UID:", userCredential.user.uid);
          userId = userCredential.user.uid;
        }
      }

      // Use shared post-verification logic
      await processVerifiedUser(userId);
      
    } catch (err: any) {
      console.error("=== VERIFY OTP ERROR ===");
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      
      shake();
      setStatusMessage("");
      hasProcessedAuth.current = false;
      
      let errorMessage = "Verification failed. Please try again.";
      
      if (err.code === 'auth/invalid-verification-code') {
        errorMessage = "Invalid OTP. Please check the code and try again.";
      } else if (err.code === 'auth/code-expired' || err.code === 'auth/session-expired') {
        // Session/code expired — auto-resend OTP and let user try again
        console.log("=== SESSION/CODE EXPIRED — AUTO-RESENDING OTP ===");
        hasProcessedAuth.current = false;
        setStatusMessage("OTP expired, resending...");
        setIsLoading(false);
        try {
          await sendOtp(true);
          Alert.alert(
            "OTP Resent",
            "Your previous OTP expired. A new OTP has been sent. Please enter the new code."
          );
        } catch (_) {
          Alert.alert("Session Expired", "Please go back and try again.");
        }
        return; // Skip the generic error alert below
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
        {autoVerifying ? (
          <View style={styles.autoVerifyContainer}>
            <ActivityIndicator size="small" color="#4CAF50" />
            <Text style={styles.autoVerifyText}>OTP auto-detected! Logging you in...</Text>
          </View>
        ) : otpSent ? (
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
            onPress={() => sendOtp(true)} 
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
  autoVerifyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  autoVerifyText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '600',
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
