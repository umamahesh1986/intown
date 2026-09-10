// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   Keyboard,
// } from "react-native";
// import { useLocalSearchParams, useRouter } from "expo-router";

// const API = "https://devapi.intownlocal.com";

// export default function AdminOtp() {
//   const router = useRouter();

//   const { phone } = useLocalSearchParams<{
//     phone: string;
//   }>();

//   const [otp, setOtp] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   const handleVerifyOTP = async () => {
//     if (otp.length !== 6) {
//       Alert.alert("Error", "Please enter 6 digit OTP");
//       return;
//     }

//     try {
//       setIsLoading(true);

//       const payload = {
//         mobileNumber: `91${phone}`,
//         otpCode: otp,
//       };

//       console.log("ADMIN VERIFY REQUEST:", payload);

//       const response = await fetch(
//         `${API}/IN/otp/verify`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Accept: "*/*",
//           },
//           body: JSON.stringify(payload),
//         }
//       );

//       const text = await response.text();

//       console.log(
//         "ADMIN VERIFY STATUS:",
//         response.status
//       );

//       console.log(
//         "ADMIN VERIFY RESPONSE:",
//         text
//       );

//       if (!response.ok) {
//         Alert.alert(
//           "Invalid OTP",
//           text || "Please enter correct OTP"
//         );
//         return;
//       }

//       Keyboard.dismiss();

//       router.replace("/admin-dashboard");
//     } catch (error) {
//       console.log("ADMIN VERIFY ERROR:", error);

//       Alert.alert(
//         "Error",
//         "OTP verification failed"
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.card}>
//         <Text style={styles.logo}>INtown</Text>

//         <Text style={styles.title}>
//           Verify OTP
//         </Text>

//         <Text style={styles.subtitle}>
//           Enter the OTP sent to
//         </Text>

//         <Text style={styles.phone}>
//           +91 {phone}
//         </Text>

//         <TextInput
//           style={styles.input}
//           placeholder="Enter 6 digit OTP"
//           placeholderTextColor="#999"
//           keyboardType="number-pad"
//           maxLength={6}
//           value={otp}
//           onChangeText={(value) =>
//             setOtp(value.replace(/\D/g, ""))
//           }
//         />

//         <TouchableOpacity
//           style={[
//             styles.button,
//             isLoading && styles.buttonDisabled,
//           ]}
//           onPress={handleVerifyOTP}
//           disabled={isLoading}
//         >
//           <Text style={styles.buttonText}>
//             {isLoading
//               ? "Verifying..."
//               : "Verify OTP"}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           onPress={() => router.back()}
//           style={styles.changeButton}
//         >
//           <Text style={styles.changeText}>
//             Change Mobile Number
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f5f5f5",
//     justifyContent: "center",
//     paddingHorizontal: 20,
//   },

//   card: {
//     width: "100%",
//     maxWidth: 500,
//     alignSelf: "center",
//     backgroundColor: "#fff",
//     borderRadius: 20,
//     padding: 28,
//     elevation: 6,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.12,
//     shadowRadius: 10,
//   },

//   logo: {
//     color: "#f58220",
//     fontSize: 32,
//     fontWeight: "800",
//     textAlign: "center",
//     marginBottom: 20,
//   },

//   title: {
//     fontSize: 28,
//     fontWeight: "800",
//     color: "#222",
//     textAlign: "center",
//   },

//   subtitle: {
//     fontSize: 14,
//     color: "#777",
//     textAlign: "center",
//     marginTop: 10,
//   },

//   phone: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#222",
//     textAlign: "center",
//     marginTop: 5,
//     marginBottom: 25,
//   },

//   input: {
//     height: 55,
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 12,
//     fontSize: 20,
//     color: "#222",
//     textAlign: "center",
//     letterSpacing: 7,
//   },

//   button: {
//     height: 54,
//     backgroundColor: "#f58220",
//     borderRadius: 12,
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 22,
//   },

//   buttonDisabled: {
//     opacity: 0.6,
//   },

//   buttonText: {
//     color: "#fff",
//     fontSize: 17,
//     fontWeight: "700",
//   },

//   changeButton: {
//     alignItems: "center",
//     marginTop: 20,
//   },

//   changeText: {
//     color: "#f58220",
//     fontSize: 14,
//     fontWeight: "600",
//   },
// });



import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import {
  verifyOtpApi,
  searchUserByPhone,
  determineUserRole,
} from "../utils/api";

const RADIUS = 12;

const VIDEO_URL =
  "https://intown-dev.s3.ap-south-1.amazonaws.com/LoginBackgroundVideo/INtownVideo.mp4";

const LOGO_URL =
  "https://intown-dev.s3.ap-south-1.amazonaws.com/app_logo/intown-logo.jpg";

const BackgroundContent = React.memo(() => {
  if (Platform.OS === "web") {
    return (
      <video
        src={VIDEO_URL}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          top: 0,
          left: 0,
          zIndex: -1,
        }}
      />
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Video
        source={{ uri: VIDEO_URL }}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
    </View>
  );
});

export default function AdminOtp() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    phone?: string;
  }>();

  const phone = Array.isArray(params.phone)
    ? params.phone[0]
    : params.phone || "";

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyOTP = async () => {
    const cleanOtp = otp
      .replace(/\D/g, "")
      .slice(0, 6);

    const cleanPhone = phone
      .replace(/\D/g, "")
      .slice(-10);

    if (cleanPhone.length !== 10) {
      Alert.alert(
        "Error",
        "Invalid mobile number"
      );
      return;
    }

    if (cleanOtp.length !== 6) {
      Alert.alert(
        "Invalid OTP",
        "Please enter 6 digit OTP"
      );
      return;
    }

    try {
      setIsLoading(true);

      const mobileNumber = `91${cleanPhone}`;

      console.log(
        "VERIFY MOBILE NUMBER:",
        mobileNumber
      );

      console.log(
        "VERIFY OTP:",
        cleanOtp
      );

      const verifyResponse =
        await verifyOtpApi(
          mobileNumber,
          cleanOtp
        );

      console.log(
        "VERIFY OTP RESPONSE:",
        verifyResponse
      );

      const user = await searchUserByPhone(
        mobileNumber
      );

      console.log(
        "USER DATA:",
        user
      );

      const role = determineUserRole(user);

      console.log(
        "DETECTED USER ROLE:",
        role
      );

      const normalizedRole = String(
        role || ""
      ).toUpperCase();

      if (
        normalizedRole === "ADMIN" ||
        normalizedRole === "IN_ADMIN"
      ) {
        router.push("/admin-dashboard");
        return;
      }

      if (
        normalizedRole === "CUSTOMER" ||
        normalizedRole === "IN_CUSTOMER"
      ) {
        router.push("/admin-customer");
        return;
      }

      if (
        normalizedRole === "MERCHANT" ||
        normalizedRole === "IN_MERCHANT"
      ) {
        router.push("/admin-merchants");
        return;
      }

      Alert.alert(
        "Role Not Found",
        "This mobile number is not registered as Admin, Customer or Merchant."
      );
    } catch (error: any) {
      console.log(
        "VERIFY OTP ERROR:",
        error
      );

      Alert.alert(
        "Invalid OTP",
        error?.message ||
          "Please enter correct OTP"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputWebStyle: any =
    Platform.OS === "web"
      ? {
          outlineStyle: "none",
          outlineWidth: 0,
          outlineColor: "transparent",
        }
      : undefined;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
    >
      <BackgroundContent />

      <View style={styles.overlay}>
        <View style={styles.centerWrap}>
          <View style={styles.headerCard}>
            <View style={styles.logoBox}>
              <Image
                source={{ uri: LOGO_URL }}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.formWrap}>
            <View style={styles.formCard}>
              <View style={styles.otpIcon}>
                <Ionicons
                  name="shield-checkmark"
                  size={30}
                  color="#fff"
                />
              </View>

              <Text style={styles.title}>
                Verify OTP
              </Text>

              <Text style={styles.subtitle}>
                Enter the OTP sent to
              </Text>

              <Text style={styles.phone}>
                +91 {cleanDisplayPhone(phone)}
              </Text>

              <TextInput
                style={[
                  styles.input,
                  inputWebStyle,
                ]}
                placeholder="Enter 6 digit OTP"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(value) => {
                  setOtp(
                    value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  );
                }}
              />

              <TouchableOpacity
                style={[
                  styles.button,
                  isLoading &&
                    styles.buttonDisabled,
                ]}
                onPress={handleVerifyOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View
                    style={styles.buttonContent}
                  >
                    <ActivityIndicator
                      color="#fff"
                      size="small"
                    />
                    <Text
                      style={styles.buttonText}
                    >
                      {" "}
                      Verifying...
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={styles.buttonText}
                  >
                    Verify OTP
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.changeButton}
                onPress={() =>
                  router.push(
                    "/admin-login"
                  )
                }
                disabled={isLoading}
              >
                <Text
                  style={styles.changeText}
                >
                  Change Mobile Number
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function cleanDisplayPhone(phone: string) {
  const clean = phone
    .replace(/\D/g, "")
    .slice(-10);

  if (clean.length !== 10) {
    return phone;
  }

  return clean;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  headerCard: {
    width: "100%",
    backgroundColor: "#fe6f09",
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
    overflow: "hidden",
  },

  logoBox: {
    backgroundColor: "#fe6f09",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "center",
  },

  logo: {
    width: 220,
    height: 48,
  },

  formWrap: {
    width: "100%",
    marginTop: -18,
  },

  formCard: {
    width: "100%",
    backgroundColor: "#fe6f09",
    borderBottomLeftRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
    paddingVertical: 22,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },

  otpIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E85B1A",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },

  subtitle: {
    color: "#FFE0CC",
    fontSize: 13,
    textAlign: "center",
    marginTop: 7,
  },

  phone: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },

  input: {
    height: 56,
    backgroundColor: "#F7F7F7",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ececec",
    fontSize: 22,
    color: "#000",
    textAlign: "center",
    letterSpacing: 8,
  },

  button: {
    backgroundColor: "#E85B1A",
    height: 54,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  changeButton: {
    alignItems: "center",
    marginTop: 18,
  },

  changeText: {
    color: "#FFE0CC",
    fontSize: 14,
    fontWeight: "600",
  },
});

