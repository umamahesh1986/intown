
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function ProfileScreen() {

  const defaultImage =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  // STATES 
  const [image, setImage] = useState(defaultImage);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);

  const [page, setPage] = useState("profile");

  const [editModal, setEditModal] = useState(false);

  const [name, setName] = useState("Mani");
  const [number, setNumber] = useState("9876543210");
  const [email, setEmail] = useState("demo@gmail.com");
  const [date, setDate] = useState("10-01-2000");
  const [gender, setGender] = useState("female");

  const [tempName, setTempName] = useState(name);
  const [tempNumber, setTempNumber] = useState(number);
  const [tempEmail, setTempEmail] = useState(email);
  const [tempDate, setTempDate] = useState(date);
  const [tempGender, setTempGender] = useState(gender);

  // IMAGE HANDLING 
  const pickGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setShowPhotoMenu(false);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setShowPhotoMenu(false);
    }
  };

  const deletePhoto = () => {
    setImage(defaultImage);
    setShowPhotoMenu(false);
  };

  // SAVE PROFILE 
  const saveProfile = () => {
    setName(tempName);
    setNumber(tempNumber);
    setEmail(tempEmail);
    setDate(tempDate);
    setGender(tempGender);
    setEditModal(false);

    Alert.alert("Success", "Profile Updated");
  };

  //  PAGE SWITCH 
  const renderPage = () => {

    if (page === "payment") {
      return (
        <View style={styles.center}>
          <Text style={styles.pageTitle}>Payment History</Text>
          <TouchableOpacity onPress={() => setPage("profile")}>
            <Text style={styles.back}>⬅ Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (page === "savings") {
      return (
        <View style={styles.center}>
          <Text style={styles.pageTitle}>My Savings</Text>
          <TouchableOpacity onPress={() => setPage("profile")}>
            <Text style={styles.back}>⬅ Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (page === "plans") {
      return (
        <View style={styles.center}>
          <Text style={styles.pageTitle}>Plans</Text>
          <TouchableOpacity onPress={() => setPage("profile")}>
            <Text style={styles.back}>⬅ Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView>

        {/*  HEADER  */}
        <Text style={styles.heading}>My Account</Text>

        {/* PROFILE  */}
        <TouchableOpacity
          style={styles.profileBox}
          onPress={() => setShowPhotoMenu(true)}
        >
          <Image source={{ uri: image }} style={styles.profileImage} />
          <View>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.subText}>Tap photo for options</Text>
          </View>
        </TouchableOpacity>

        {/* EDIT BUTTON */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => setEditModal(true)}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>

        {/*  BASIC INFO  */}
        <View style={styles.box}>
          <Text style={styles.title}>Basic Information</Text>

          <Text style={styles.text}>Name : {name}</Text>
          <Text style={styles.text}>Number : {number}</Text>
          <Text style={styles.text}>Email : {email}</Text>
          <Text style={styles.text}>Date : {date}</Text>
          <Text style={styles.text}>Gender : {gender}</Text>
        </View>

        {/*  MORE SECTION */}
        <View style={styles.box}>
          
          <Text style={styles.title}>More</Text>

          <TouchableOpacity style={styles.item} onPress={() => setPage("payment")}>
            <Ionicons name="card-outline" size={20} color="#4F46E5" />
            <Text style={styles.itemText}>Payment History</Text>
            <MaterialIcons name="chevron-right" size={25} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => setPage("savings")}>
            <Ionicons name="wallet-outline" size={20} color="#4F46E5" />
            <Text style={styles.itemText}>My Savings</Text>
            <MaterialIcons name="chevron-right" size={25} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => setPage("plans")}>
            <Ionicons name="document-text-outline" size={20} color="#4F46E5" />
            <Text style={styles.itemText}>Plans</Text>
            <MaterialIcons name="chevron-right" size={25} />
          </TouchableOpacity>

        </View>

      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>

      {renderPage()}

      {/* PHOTO MENU  */}
      <Modal transparent visible={showPhotoMenu} animationType="slide">
        <View style={styles.menuBg}>
          <View style={styles.menuBox}>

            <Text style={styles.menuTitle}>Your Profile</Text>

            <TouchableOpacity style={styles.menuItem} onPress={pickGallery}>
              <Ionicons name="image-outline" size={22} color="#4F46E5" />
              <Text style={styles.menuText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={22} color="#4F46E5" />
              <Text style={styles.menuText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={deletePhoto}>
              <Ionicons name="trash-outline" size={22} color="red" />
              <Text style={[styles.menuText, { color: "red" }]}>
                Delete Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowPhotoMenu(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* EDIT MODAL  */}
      <Modal transparent visible={editModal} animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>

            <ScrollView>

              <Text style={styles.modalTitle}>Edit Profile</Text>

              <TextInput style={styles.input} value={tempName} onChangeText={setTempName} placeholder="Name" />
              <TextInput style={styles.input} value={tempNumber} onChangeText={setTempNumber} placeholder="Number" />
              <TextInput style={styles.input} value={tempEmail} onChangeText={setTempEmail} placeholder="Email" />
              <TextInput style={styles.input} value={tempDate} onChangeText={setTempDate} placeholder="Date" />

              <Text style={{ marginTop: 10 }}>Gender</Text>
              <View style={styles.picker}>
                <Picker
                  selectedValue={tempGender}
                  onValueChange={setTempGender}
                >
                  <Picker.Item label="Male" value="male" />
                  <Picker.Item label="Female" value="female" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Text style={styles.back}>Back</Text>
              </TouchableOpacity>

            </ScrollView>

          </View>
        </View>
      </Modal>

    </View>
  );
}
const styles = StyleSheet.create({

container: {
  flex: 1,
  backgroundColor: "#f5f7ff",
  padding: 20,
},

heading: {
  fontSize: 26,
  fontWeight: "bold",
  textAlign: "center",
  color: "#161620",
  marginBottom: 15,
},

profileBox: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#fff",
  padding: 15,
  borderRadius: 15,
},

profileImage: {
  width: 70,
  height: 70,
  borderRadius: 35,
  marginRight: 15,
},

name: {
  fontSize: 18,
  fontWeight: "bold",
},

subText: {
  color: "gray",
},

editBtn: {
  flexDirection: "row",
  backgroundColor:"#FF8A00",
  padding: 12,
  borderRadius: 10,
  marginTop: 20,
  justifyContent: "center",
  alignItems: "center",
},

editText: {
  color: "#fff",
  marginLeft: 10,
},

box: {
  marginTop: 25,
  backgroundColor: "#fff",
  padding: 15,
  borderRadius: 15,
},

title: {
  fontSize: 18,
  fontWeight: "bold",
  color: "#4F46E5",
  marginBottom: 10,
},

text: {
  paddingVertical: 5,
  borderBottomWidth: 1,
  borderBottomColor: "#eee",
},

item: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: "#eee",
},

itemText: {
  flex: 1,
  marginLeft: 10,
},

menuBg: {
  flex: 1,
  backgroundColor: "#00000080",
  justifyContent: "flex-end",
},

menuBox: {
  backgroundColor: "#fff",
  padding: 20,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
},

menuTitle: {
  fontSize: 18,
  fontWeight: "bold",
  marginBottom: 15,
},

menuItem: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 12,
  gap: 10,
},

menuText: {
  fontSize: 15,
},

cancel: {
  textAlign: "center",
  marginTop: 10,
  color: "gray",
},

modalBg: {
  flex: 1,
  backgroundColor: "#00000080",
  justifyContent: "center",
  padding: 20,
},

modalBox: {
  backgroundColor: "#fff",
  borderRadius: 15,
  padding: 20,
},

modalTitle: {
  fontSize: 18,
  fontWeight: "bold",
},

input: {
  backgroundColor: "#f2f2f2",
  padding: 10,
  borderRadius: 10,
  marginTop: 10,
},

picker: {
  backgroundColor: "#f2f2f2",
  borderRadius: 10,
},

saveBtn: {
  backgroundColor:"#FF8A00",
  padding: 12,
  marginTop: 10,
  borderRadius: 10,
  alignItems: "center",
},

center: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
},

pageTitle: {
  fontSize: 22,
  fontWeight: "bold",
},

back: {
  marginTop: 20,
  color: "blue",
},

});