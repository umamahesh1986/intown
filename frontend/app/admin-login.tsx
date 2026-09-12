import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const API = "https://devapi.intownlocal.com";

export default function AdminLogin() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const mobile = phone.trim();

    if (!mobile) {
      Alert.alert("Error", "Please enter phone number");
      return;
    }

    if (mobile.length !== 10) {
      Alert.alert(
        "Invalid Number",
        "Please enter a valid 10-digit phone number"
      );
      return;
    }

    try {
      setLoading(true);

      console.log("Searching phone:", mobile);

      const response = await fetch(
        `${API}/IN/search/${encodeURIComponent(mobile)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      console.log("Search status:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          Alert.alert(
            "Not Registered",
            "This phone number is not registered."
          );
        } else {
          Alert.alert(
            "Login Failed",
            `Unable to identify user. Status: ${response.status}`
          );
        }

        return;
      }

      const data = await response.json();

      console.log("Login response:", data);
      console.log("Customer object:", data?.customer);
      console.log("Merchant object:", data?.merchant);

      /*
       * CUSTOMER
       */
      if (data?.customer) {
        const customer = data.customer;

        const customerId =
          customer?.customerId ??
          customer?.id ??
          customer?.customerID ??
          customer?.userId;

        console.log("Customer ID:", customerId);

        if (!customerId) {
          Alert.alert(
            "Login Error",
            "Customer ID was not found in API response."
          );
          return;
        }

        await AsyncStorage.setItem(
          "customerId",
          String(customerId)
        );

        await AsyncStorage.setItem(
          "userPhone",
          mobile
        );

        await AsyncStorage.setItem(
          "userRole",
          "CUSTOMER"
        );

        await AsyncStorage.removeItem("merchantId");

        console.log(
          "Customer login successful"
        );

        console.log(
          "Opening /admin-customer"
        );

        router.replace("/admin-customer");

        return;
      }

      /*
       * MERCHANT
       */
      if (data?.merchant) {
        const merchant = data.merchant;

        const merchantId =
          merchant?.merchantId ??
          merchant?.id ??
          merchant?.merchantID ??
          merchant?.userId;

        console.log("Merchant ID:", merchantId);

        if (!merchantId) {
          Alert.alert(
            "Login Error",
            "Merchant ID was not found in API response."
          );
          return;
        }

        await AsyncStorage.setItem(
          "merchantId",
          String(merchantId)
        );

        await AsyncStorage.setItem(
          "userPhone",
          mobile
        );

        await AsyncStorage.setItem(
          "userRole",
          "MERCHANT"
        );

        await AsyncStorage.removeItem("customerId");

        console.log(
          "Merchant login successful"
        );

        console.log(
          "Opening /admin-merchants"
        );

        router.replace("/admin-merchants");

        return;
      }

      Alert.alert(
        "Not Registered",
        "This phone number is not registered as Customer or Merchant."
      );
    } catch (error) {
      console.log("LOGIN ERROR:", error);

      Alert.alert(
        "Error",
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>
          INtown
        </Text>

        <Text style={styles.title}>
          Welcome Back
        </Text>

        <Text style={styles.subtitle}>
          Login with your registered phone number
        </Text>

        <Text style={styles.label}>
          Phone Number
        </Text>

        <View style={styles.phoneContainer}>
          <Text style={styles.countryCode}>
            +91
          </Text>

          <TextInput
            value={phone}
            onChangeText={(value) => {
              const number =
                value.replace(/[^0-9]/g, "");

              setPhone(number);
            }}
            placeholder="Enter phone number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.loginButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.loginText}>
              LOGIN
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.info}>
          Your registered phone number will
          automatically identify your account.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7F9",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 5,
  },

  logo: {
    fontSize: 34,
    fontWeight: "900",
    color: "#F58220",
    textAlign: "center",
    marginBottom: 25,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#222",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 28,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },

  phoneContainer: {
    height: 54,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },

  countryCode: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#222",
  },

  loginButton: {
    height: 54,
    backgroundColor: "#F58220",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },

  disabledButton: {
    opacity: 0.7,
  },

  loginText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  info: {
    fontSize: 12,
    lineHeight: 18,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
});