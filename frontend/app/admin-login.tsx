import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

/* ADMIN LOGIN */
const ADMIN_EMAIL = "admin@intownlocal.com";
const ADMIN_PASSWORD = "Admin@123";

export default function AdminLogin() {
  const router = useRouter();

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState(
    "Please enter your admin email"
  );

  const showCustomAlert = (message: string) => {
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  const closeCustomAlert = () => {
    setShowAlertModal(false);
  };

  /* ADMIN LOGIN */
  const handleAdminLogin = async () => {
    const email = adminEmail.trim().toLowerCase();
    const password = adminPassword;

    if (!email) {
      showCustomAlert("Please enter your admin email");
      return;
    }

    if (!password) {
      showCustomAlert("Please enter your admin password");
      return;
    }

    try {
      setLoading(true);

      if (
        email !== ADMIN_EMAIL.toLowerCase() ||
        password !== ADMIN_PASSWORD
      ) {
        showCustomAlert("Invalid admin email or password");
        return;
      }

      /* Save Admin session */
      await AsyncStorage.setItem("userRole", "ADMIN");
      await AsyncStorage.setItem("adminEmail", email);

      /* Open Admin Dashboard */
      router.replace("/admin-dashboard");
    } catch (error) {
      console.log("Admin login error:", error);

      showCustomAlert("Unable to login as Admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>

        {/* LOGO */}
        <View style={styles.logoCircle}>
          <Image
            source={require("../assets/images/icon.jpeg")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>
          Admin Login
        </Text>

        <Text style={styles.subtitle}>
          Login with your admin credentials
        </Text>

        {/* ADMIN EMAIL */}
        <View style={styles.inputContainer}>
          <TextInput
            value={adminEmail}
            onChangeText={setAdminEmail}
            placeholder="Admin Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </View>

        {/* ADMIN PASSWORD */}
        <View style={styles.inputContainer}>
          <TextInput
            value={adminPassword}
            onChangeText={setAdminPassword}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </View>

        {/* LOGIN BUTTON */}
        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleAdminLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.buttonText}>
              Admin Login
            </Text>
          )}
        </TouchableOpacity>

      </View>

      {/* ALERT MODAL */}
      <Modal
        visible={showAlertModal}
        transparent
        animationType="fade"
        onRequestClose={closeCustomAlert}
      >
        <View style={styles.alertOverlay}>

          <View style={styles.alertModal}>

            <View style={styles.alertIcon}>
              <Text style={styles.alertIconText}>
                !
              </Text>
            </View>

            <Text style={styles.alertTitle}>
              Admin Login
            </Text>

            <Text style={styles.alertMessage}>
              {alertMessage}
            </Text>

            <TouchableOpacity
              style={styles.alertButton}
              onPress={closeCustomAlert}
            >
              <Text style={styles.alertButtonText}>
                OK
              </Text>
            </TouchableOpacity>

          </View>

        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },

  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F58220",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    overflow: "hidden",
  },

  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#171717",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
    marginBottom: 20,
  },

  inputContainer: {
    width: "100%",
    height: 56,
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 16,
    marginBottom: 14,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#222222",
    height: "100%",
  },

  button: {
    width: "100%",
    height: 56,
    backgroundColor: "#F58220",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 10,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  /* ALERT MODAL */

  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  alertModal: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 28,
    alignItems: "center",
  },

  alertIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFF1E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  alertIconText: {
    color: "#F58220",
    fontSize: 30,
    fontWeight: "900",
  },

  alertTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#171717",
    marginBottom: 10,
  },

  alertMessage: {
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },

  alertButton: {
    width: "100%",
    height: 50,
    borderRadius: 13,
    backgroundColor: "#F58220",
    justifyContent: "center",
    alignItems: "center",
  },

  alertButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

});

