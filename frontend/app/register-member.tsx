import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { auth } from "../firebase/firebaseConfig";

export default function RegisterMember() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register Member</Text>

      <Text style={styles.subtitle}>
        Firebase Auth initialized: {auth ? "Yes" : "No"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
});
