import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
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

  const loginAsCustomer = async () => {
    try {
      const customerId = customerData?.customer?.id;

      if (!customerId) {
        Alert.alert(
          "Customer ID Missing",
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

      Alert.alert(
        "Error",
        "Unable to login as Customer."
      );
    }
  };

  const loginAsMerchant = async () => {
    try {
      const merchantId = merchantData?.merchant?.id;

      console.log(
        "Merchant ID:",
        merchantId
      );

      if (!merchantId) {
        Alert.alert(
          "Merchant ID Missing",
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

      Alert.alert(
        "Error",
        "Unable to login as Merchant."
      );
    }
  };

  const handleLogin = async () => {
    const cleanPhone = phone.trim();

    if (!cleanPhone) {
      Alert.alert(
        "Enter Phone Number",
        "Please enter your registered phone number."
      );
      return;
    }

    if (!/^\d{10}$/.test(cleanPhone)) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit phone number."
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

      const data = await response.json();

      console.log(
        "FULL LOGIN RESPONSE:",
        data
      );

      if (!response.ok) {
        Alert.alert(
          "Search Failed",
          data?.message ||
            "Unable to check this phone number."
        );
        return;
      }

      const customer = data?.customer ?? null;
      const merchant = data?.merchant ?? null;

      const customerId = customer?.id ?? null;
      const merchantId = merchant?.id ?? null;

      console.log(
        "Customer object:",
        customer
      );

      console.log(
        "Merchant object:",
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

        router.replace("/admin-customer");

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

        router.replace("/admin-merchants");

        return;
      }

      Alert.alert(
        "Not Registered",
        "This phone number is not registered as a Customer or Merchant."
      );
    } catch (error) {
      console.log(
        "Search/Login error:",
        error
      );

      Alert.alert(
        "Error",
        "Something went wrong while checking the phone number."
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
          Sales History
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
                  Open Customer Sales History
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
                  Open Merchant Sales History
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

