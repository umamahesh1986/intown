// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   Keyboard,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { sendOtpApi } from "../utils/api";

// export default function AdminLogin() {
//   const router = useRouter();

//   const [phone, setPhone] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [phoneError, setPhoneError] = useState("");

//   const handleSendOTP = async () => {
//     const cleanPhone = phone.replace(/\D/g, "").slice(-10);

//     if (cleanPhone.length !== 10) {
//       setPhoneError("Please enter a valid 10-digit phone number");
//       return;
//     }

//     setPhoneError("");
//     setIsLoading(true);

//     try {
//       const mobileNumber = `91${cleanPhone}`;

//       console.log("ADMIN MOBILE NUMBER:", mobileNumber);

//       const response = await sendOtpApi(mobileNumber);

//       console.log("ADMIN SEND OTP RESPONSE:", response);

//       Keyboard.dismiss();

//       router.push({
//         pathname: "/admin-otp",
//         params: {
//           phone: cleanPhone,
//         },
//       });
//     } catch (error: any) {
//       console.log("ADMIN SEND OTP ERROR:", error);

//       Alert.alert(
//         "Error",
//         error?.message || "Failed to send OTP"
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//     >
//       <View style={styles.card}>
//         <Text style={styles.logo}>INtown</Text>

//         <Text style={styles.title}>Admin Login</Text>

//         <Text style={styles.subtitle}>
//           Login to access Admin Portal
//         </Text>

//         <Text style={styles.label}>Mobile Number</Text>

//         <View style={styles.inputRow}>
//           <Text style={styles.countryCode}>+91</Text>

//           <TextInput
//             style={styles.input}
//             placeholder="Enter mobile number"
//             placeholderTextColor="#999"
//             keyboardType="phone-pad"
//             value={phone}
//             onChangeText={(value) => {
//               setPhone(value.replace(/\D/g, ""));
//               setPhoneError("");
//             }}
//             maxLength={10}
//           />
//         </View>

//         {phoneError ? (
//           <Text style={styles.errorText}>
//             {phoneError}
//           </Text>
//         ) : null}

//         <TouchableOpacity
//           style={[
//             styles.button,
//             isLoading && styles.buttonDisabled,
//           ]}
//           onPress={handleSendOTP}
//           disabled={isLoading}
//         >
//           <Text style={styles.buttonText}>
//             {isLoading ? "Sending OTP..." : "Get OTP"}
//           </Text>
//         </TouchableOpacity>

//         <Text style={styles.note}>
//           You will receive a one-time password on this number
//         </Text>
//       </View>
//     </KeyboardAvoidingView>
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
//     marginTop: 8,
//     marginBottom: 28,
//   },

//   label: {
//     fontSize: 14,
//     fontWeight: "700",
//     color: "#333",
//     marginBottom: 8,
//   },

//   inputRow: {
//     height: 55,
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 15,
//   },

//   countryCode: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#333",
//     marginRight: 8,
//   },

//   input: {
//     flex: 1,
//     height: "100%",
//     fontSize: 16,
//     color: "#222",
//   },

//   errorText: {
//     color: "#d93025",
//     fontSize: 13,
//     marginTop: 8,
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

//   note: {
//     color: "#999",
//     fontSize: 12,
//     textAlign: "center",
//     marginTop: 15,
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import { sendOtpApi } from "../utils/api";

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

export default function AdminLogin() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const handleSendOTP = async () => {
    const cleanPhone = phone
      .replace(/\D/g, "")
      .slice(-10);

    if (cleanPhone.length !== 10) {
      setPhoneError(
        "Please enter a valid 10-digit phone number"
      );
      return;
    }

    setPhoneError("");
    setIsLoading(true);

    try {
      const mobileNumber = `91${cleanPhone}`;

      console.log(
        "LOGIN MOBILE NUMBER:",
        mobileNumber
      );

      const response = await sendOtpApi(mobileNumber);

      console.log(
        "SEND OTP RESPONSE:",
        response
      );

      router.push({
        pathname: "/admin-otp",
        params: {
          phone: cleanPhone,
        },
      });
    } catch (err: any) {
      console.log("SEND OTP ERROR:", err);

      Alert.alert(
        "Error",
        err?.message ||
          "Failed to send OTP. Please try again."
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
              <Text style={styles.loginTitle}>
                Login
              </Text>

              <Text style={styles.loginSubtitle}>
                Enter your mobile number
              </Text>

              <View style={styles.inputRow}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="call"
                    size={18}
                    color="#666"
                  />
                </View>

                <TextInput
                  style={[
                    styles.input,
                    inputWebStyle,
                  ]}
                  placeholder="Enter mobile number"
                  placeholderTextColor="#9b9b9b"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(value) => {
                    setPhone(
                      value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    );
                    setPhoneError("");
                  }}
                  maxLength={10}
                />
              </View>

              {phoneError ? (
                <Text style={styles.errorText}>
                  {phoneError}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.button,
                  isLoading &&
                    styles.buttonDisabled,
                ]}
                onPress={handleSendOTP}
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
                      Sending OTP...
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={styles.buttonText}
                  >
                    Get OTP
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.smallNote}>
                You will receive a one-time
                password on this number
              </Text>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
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
    paddingVertical: 20,
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

  loginTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 5,
  },

  loginSubtitle: {
    color: "#FFE0CC",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 18,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 10,
    height: 56,
    paddingHorizontal: 12,
    marginBottom: 18,
    borderColor: "#ececec",
    borderWidth: 1,
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    height: "100%",
  },

  errorText: {
    color: "#FFE0CC",
    fontSize: 13,
    marginBottom: 12,
    marginTop: -8,
  },

  button: {
    backgroundColor: "#E85B1A",
    height: 54,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
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

  smallNote: {
    color: "#FFE0CC",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },
});

