import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../store/authStore";
import { useRouter } from "expo-router";

export default function ProfileMenu() {

  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

 return (
  <View style={styles.screen}>

    {/* Header with Back Button */}
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Profile</Text>
    </View>

    <View style={styles.container}>

      <TouchableOpacity
  style={styles.item}
  onPress={() => router.push("/account")}
>
  <Ionicons name="person-outline" size={22} color="#FF8A00" />
  <Text style={styles.text}>My Account</Text>
</TouchableOpacity>

      <TouchableOpacity
  style={styles.item}
  onPress={() => router.push("/register-member")}
>
  <Ionicons name="star-outline" size={22} color="#FF8A00" />
  <Text style={styles.text}>Become a Customer</Text>
</TouchableOpacity>

      <TouchableOpacity
  style={styles.item}
  onPress={() => router.push("/register-merchant")}
>
        <Ionicons name="storefront-outline" size={22} color="#FF8A00" />
        <Text style={styles.text}>Become a Merchant</Text>
      </TouchableOpacity>

     <TouchableOpacity
  style={styles.item}
  onPress={() => {
    logout();
    router.replace("/login");
  }}
>
  <Ionicons name="log-out-outline" size={22} color="red" />
  <Text style={[styles.text, { color: "red" }]}>Logout</Text>
</TouchableOpacity>

    </View>
</View>
);

}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    elevation: 5
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },

  text: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600"
  },
  screen:{
flex:1,
backgroundColor:"#F5F6FA"
},

header:{
flexDirection:"row",
alignItems:"center",
paddingHorizontal:16,
paddingVertical:12
},

backButton:{
marginRight:10
},

headerTitle:{
fontSize:18,
fontWeight:"700",
color:"#000"
},
});