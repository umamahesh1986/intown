import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const API = "https://devapi.intownlocal.com";

export default function AdminLogin() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [merchantData, setMerchantData] = useState<any>(null);
  const [loginPhone, setLoginPhone] = useState("");

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState(
    "Please enter your registered phone number"
  );

  const showCustomAlert = (message: string) => {
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  const closeCustomAlert = () => {
    setShowAlertModal(false);
  };

  const loginAsCustomer = async () => {
    try {
      const customerId = customerData?.customer?.id;

      if (!customerId) {
        showCustomAlert(
          "Customer ID was not returned by the API."
        );
        return;
      }

      await AsyncStorage.setItem(
        "customerId",
        String(customerId)
      );

      await AsyncStorage.setItem(
        "userPhone",
        loginPhone
      );

      await AsyncStorage.setItem(
        "userRole",
        "CUSTOMER"
      );

      await AsyncStorage.removeItem("merchantId");

      setShowRoleModal(false);

      router.replace("/admin-customer");
    } catch (error) {
      console.log("Customer login error:", error);

      showCustomAlert(
        "Unable to login as Customer."
      );
    }
  };

  const loginAsMerchant = async () => {
    try {
      const merchantId = merchantData?.merchant?.id;

      console.log("Merchant ID:", merchantId);

      if (!merchantId) {
        showCustomAlert(
          "Merchant ID was not returned by the API."
        );
        return;
      }

      await AsyncStorage.setItem(
        "merchantId",
        String(merchantId)
      );

      await AsyncStorage.setItem(
        "userPhone",
        loginPhone
      );

      await AsyncStorage.setItem(
        "userRole",
        "MERCHANT"
      );

      await AsyncStorage.removeItem("customerId");

      setShowRoleModal(false);

      router.replace("/admin-merchants");
    } catch (error) {
      console.log("Merchant login error:", error);

      showCustomAlert(
        "Unable to login as Merchant."
      );
    }
  };

  const handleLogin = async () => {
    const cleanPhone = phone.trim();

    if (!cleanPhone) {
      showCustomAlert(
        "Please enter your registered phone number"
      );
      return;
    }

    if (!/^\d{10}$/.test(cleanPhone)) {
      showCustomAlert(
        "Please enter your registered phone number"
      );
      return;
    }

    try {
      setLoading(true);

      console.log(
        "Searching phone:",
        cleanPhone
      );

      const response = await fetch(
        `${API}/IN/search/${encodeURIComponent(
          cleanPhone
        )}`,
        {
          method: "GET",
          headers: {
            Accept: "*/*",
          },
        }
      );

      console.log(
        "Search status:",
        response.status
      );

      let data: any = null;

      try {
        data = await response.json();
      } catch (error) {
        data = null;
      }

      console.log(
        "FULL LOGIN RESPONSE:",
        data
      );

      if (!response.ok) {
        showCustomAlert(
          "Please enter your registered phone number"
        );
        return;
      }

      const customer = data?.customer ?? null;
      const merchant = data?.merchant ?? null;

      const customerId = customer?.id ?? null;
      const merchantId = merchant?.id ?? null;

      console.log(
        "Customer:",
        customer
      );

      console.log(
        "Merchant:",
        merchant
      );

      console.log(
        "Customer ID:",
        customerId
      );

      console.log(
        "Merchant ID:",
        merchantId
      );

      const hasCustomer =
        customer !== null &&
        customerId !== null;

      const hasMerchant =
        merchant !== null &&
        merchantId !== null;

      console.log(
        "Customer Found:",
        hasCustomer
      );

      console.log(
        "Merchant Found:",
        hasMerchant
      );

      setCustomerData(
        hasCustomer ? data : null
      );

      setMerchantData(
        hasMerchant ? data : null
      );

      setLoginPhone(cleanPhone);

      if (hasCustomer && hasMerchant) {
        setShowRoleModal(true);
        return;
      }

      if (hasCustomer) {
        await AsyncStorage.setItem(
          "customerId",
          String(customerId)
        );

        await AsyncStorage.setItem(
          "userPhone",
          cleanPhone
        );

        await AsyncStorage.setItem(
          "userRole",
          "CUSTOMER"
        );

        await AsyncStorage.removeItem(
          "merchantId"
        );

        router.replace(
          "/admin-customer"
        );

        return;
      }

      if (hasMerchant) {
        await AsyncStorage.setItem(
          "merchantId",
          String(merchantId)
        );

        await AsyncStorage.setItem(
          "userPhone",
          cleanPhone
        );

        await AsyncStorage.setItem(
          "userRole",
          "MERCHANT"
        );

        await AsyncStorage.removeItem(
          "customerId"
        );

        router.replace(
          "/admin-merchants"
        );

        return;
      }

      showCustomAlert(
        "Please enter your registered phone number"
      );
    } catch (error) {
      console.log(
        "Search/Login error:",
        error
      );

      showCustomAlert(
        "Please enter your registered phone number"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <View style={styles.card}>

        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>
            IN
          </Text>
        </View>

        <Text style={styles.title}>
          Login
        </Text>

        <Text style={styles.subtitle}>
          Enter your registered phone number
        </Text>

        <View style={styles.inputContainer}>

          <Text style={styles.countryCode}>
            +91
          </Text>

          <TextInput
            value={phone}
            onChangeText={(text) =>
              setPhone(
                text
                  .replace(/[^0-9]/g, "")
                  .slice(0, 10)
              )
            }
            placeholder="Phone Number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
          />

        </View>

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.buttonText}>
              Continue
            </Text>
          )}
        </TouchableOpacity>

      </View>

      {/* REGISTERED PHONE ALERT MODAL */}

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
              Phone Number
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

      {/* CUSTOMER / MERCHANT MODAL */}

      <Modal
        visible={showRoleModal}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowRoleModal(false)
        }
      >
        <View style={styles.modalOverlay}>

          <View style={styles.roleModal}>

            <View style={styles.roleIcon}>
              <Text style={styles.roleIconText}>
                IN
              </Text>
            </View>

            <Text style={styles.modalTitle}>
              Choose Account
            </Text>

            <Text style={styles.modalSubtitle}>
              This phone number is registered as both
              Customer and Merchant.
            </Text>

            <TouchableOpacity
              style={styles.roleButton}
              onPress={loginAsCustomer}
            >
              <View>
                <Text style={styles.roleButtonTitle}>
                  Customer
                </Text>

                <Text style={styles.roleButtonSubtitle}>
                  Open Customer page
                </Text>
              </View>

              <Text style={styles.arrow}>
                →
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roleButton}
              onPress={loginAsMerchant}
            >
              <View>
                <Text style={styles.roleButtonTitle}>
                  Merchant
                </Text>

                <Text style={styles.roleButtonSubtitle}>
                  Open Merchant page
                </Text>
              </View>

              <Text style={styles.arrow}>
                →
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() =>
                setShowRoleModal(false)
              }
            >
              <Text style={styles.cancelText}>
                Cancel
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
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
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
    marginBottom: 28,
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
    marginBottom: 18,
  },

  countryCode: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
    marginRight: 12,
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
    marginBottom: 24,
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

  /* ROLE MODAL */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  roleModal: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 26,
  },

  roleIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF1E5",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 14,
  },

  roleIconText: {
    color: "#F58220",
    fontSize: 18,
    fontWeight: "900",
  },

  modalTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#171717",
    textAlign: "center",
    marginBottom: 8,
  },

  modalSubtitle: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 22,
  },

  roleButton: {
    width: "100%",
    minHeight: 72,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },

  roleButtonTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222222",
    marginBottom: 4,
  },

  roleButtonSubtitle: {
    fontSize: 12,
    color: "#888888",
  },

  arrow: {
    fontSize: 24,
    color: "#F58220",
    fontWeight: "700",
  },

  cancelButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  cancelText: {
    color: "#777777",
    fontSize: 15,
    fontWeight: "700",
  },
});