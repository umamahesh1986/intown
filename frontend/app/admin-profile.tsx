import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AdminProfile() {
  const [adminId, setAdminId] = useState("");
  const [adminName, setAdminName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const loadAdmin = async () => {
      const id =
        await AsyncStorage.getItem("adminId");

      const name =
        await AsyncStorage.getItem("adminName");

      const storedPhone =
        await AsyncStorage.getItem("phoneNumber");

      const storedEmail =
        await AsyncStorage.getItem("email");

      setAdminId(id || "");
      setAdminName(name || "Admin");
      setPhone(storedPhone || "");
      setEmail(storedEmail || "");
    };

    loadAdmin();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            A
          </Text>
        </View>

        <Text style={styles.title}>
          Admin Profile
        </Text>

        <Text style={styles.subtitle}>
          Sales Management Administrator
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>
          Admin ID
        </Text>

        <Text style={styles.value}>
          {adminId || "-"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>
          Name
        </Text>

        <Text style={styles.value}>
          {adminName}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>
          Phone Number
        </Text>

        <Text style={styles.value}>
          {phone || "-"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>
          Email
        </Text>

        <Text style={styles.value}>
          {email || "-"}
        </Text>
      </View>

      <View style={styles.roleCard}>
        <Text style={styles.roleLabel}>
          Account Role
        </Text>

        <Text style={styles.role}>
          ADMIN
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    padding: 16,
  },

  header: {
    alignItems: "center",
    paddingVertical: 25,
  },

  avatar: {
    width: 85,
    height: 85,
    borderRadius: 43,
    backgroundColor: "#f58220",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  avatarText: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "700",
  },

  title: {
    fontSize: 27,
    fontWeight: "700",
  },

  subtitle: {
    color: "#777",
    marginTop: 5,
  },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 13,
    marginBottom: 10,
  },

  label: {
    color: "#777",
    fontSize: 13,
  },

  value: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 5,
  },

  roleCard: {
    backgroundColor: "#fff1e5",
    padding: 20,
    borderRadius: 13,
    marginTop: 10,
    marginBottom: 30,
  },

  roleLabel: {
    color: "#777",
  },

  role: {
    color: "#f58220",
    fontWeight: "800",
    fontSize: 20,
    marginTop: 5,
  },
});

