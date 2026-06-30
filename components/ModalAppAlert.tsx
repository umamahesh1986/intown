
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ModalAppAlert = () => {
  const [showModal, setShowModal] = useState(true);

  return (
    <View style={styles.container}>
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>

              {/* IMAGE */}
              <Image
                source={{
                  uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcREp33GcU5D-kbBOZu0f1HBjrUKwpuC-JTdqWz_GNws4RDQTFGXMF8-hfA&s=10"
                }}
                style={styles.image}
              />

              {/* CARD */}
              <View style={styles.card}>

                {/* LEFT */}
                <View style={styles.left}>
                  <Text style={styles.earn}>EARN</Text>
                  <Text style={styles.amount}>₹25</Text>
                  <Text style={styles.sub}>ON YOUR 1ST TRANSACTION</Text>
                  <Text style={styles.sub}>SHOP LOCAL SAVE MORE</Text>
                </View>

                {/* RIGHT MOBILE */}
                <ImageBackground
                  source={{
                    uri: "https://thumbs.dreamstime.com/b/mobile-phone-smartphone-frame-isolate-layout-white-transparent-background-design-mobile-phone-411452030.jpg",
                  }}
                  style={styles.mobile}
                  imageStyle={{ borderRadius: 15 }}
                >
                  <Image
                    source={{
                      uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcREp33GcU5D-kbBOZu0f1HBjrUKwpuC-JTdqWz_GNws4RDQTFGXMF8-hfA&s=10"
                    }}
                    style={styles.logoImg}
                  />

                  <View style={styles.locationBox}>
                    <Ionicons name="location-sharp" size={16} color="red" />
                  </View>

                  <View style={styles.instant}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="home-sharp" size={14} color="#fff" />
                    </View>
                    <Text style={styles.instantText}>INSTANT</Text>
                    <Text style={styles.amountTexts}>₹25</Text>
                    <Text style={styles.instantText}>CASHBACK</Text>
                  </View>
                </ImageBackground>

              </View>

              {/* DESC */}
              <View style={styles.desc}>
                <View style={styles.descIcon}>
                  <Ionicons name="cash-outline" size={20} color="#fff" />
                </View>

                <View style={styles.descTextContainer}>
                  <Text style={styles.text1}>NO QUESTIONING.</Text>
                  <Text style={styles.text2}>REAL CASH REWARDING.</Text>
                  <Text style={styles.text3}>
                    Get ₹25 Cashback on your first transaction
                  </Text>
                </View>
              </View>

             {/* STEPS */}
<Text style={styles.stepsTitle}>HOW IT WORKS?</Text>

{/* STEP 1 */}
<View style={styles.step}>
  <View style={styles.stepIcon}>
    <Ionicons name="download-outline" size={18} color="#2d2828" />
  </View>
  <View style={styles.textBox}>
    <Text style={styles.title}>Download Intown App</Text>
    <Text style={styles.subStep}>From Play Store / App Store</Text>
  </View>
</View>

{/* STEP 2 */}
<View style={styles.step}>
  <View style={styles.stepIcon}>
    <Ionicons name="person-outline" size={18} color="#232020" />
    
  </View>
  <View style={styles.textBox}>
    <Text style={styles.title}>Become a Customer or Merchant</Text>
    <Text style={styles.subStep}>Create your account in few steps</Text>
  </View>
</View>

{/* STEP 3 */}
<View style={styles.step}>
  <View style={styles.stepIcon}>
    <Ionicons name="home-outline" size={18} color="#171414" />
  </View>
  <View style={styles.textBox}>
    <Text style={styles.title}>Do Your First Transaction</Text>
    <Text style={styles.subStep}>At any Intown Merchant</Text>
  </View>
</View>

{/* STEP 4 */}
<View style={styles.step}>
  <View style={styles.stepIcon}>
    <Ionicons name="logo-whatsapp" size={18} color="#37823e" />
  </View>
  <View style={styles.textBox}>
    <Text style={styles.title}>Send Payment Screenshot</Text>
    <Text style={styles.subStep}>On WhatsApp: 84644872314</Text>
  </View>
</View>

{/* STEP 5 */}
<View style={styles.step}>
  <View style={styles.stepIcon}>
    <Ionicons name="bag-outline" size={18} color="#1b1818" />
  </View>
  <View style={styles.textBox}>
    <Text style={styles.title}>Get ₹25 Cashback</Text>
    <Text style={styles.subStep}>After Confirmation</Text>
  </View>
</View>

              {/* BUTTON */}
              <TouchableOpacity
                style={styles.btn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.btnText}>Close</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ModalAppAlert;

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    
},

  overlay: {
    flex: 1,
    backgroundColor: "#3f3939",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "92%",
    maxHeight: "90%",
    backgroundColor: "#fff7f0",
    borderRadius: 20,
    padding: 15,
  },

  image: {
   
    width: 150,
    height: 150,
    resizeMode: "contain",
    alignSelf: "center",
    marginTop: 20,
    borderRadius: 10,
  
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff7f0",
    borderRadius: 15,
    padding: 12,
    elevation: 3,
  },

  left: { flex: 1 },

  earn: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#000",
    paddingHorizontal: 10,
    borderRadius: 20,
    marginBottom: 5,
    alignSelf: "flex-start",
  },

  amount: {
    fontSize: 50,
    fontWeight: "bold",
    color: "#ff6600",
  },
  amountTexts:{
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff6600",
  },

  sub: {
    fontSize: 11,
    color: "#444",
  },

  mobile: {
    width: 100,
    height: 170,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    
  },

  logoImg: {
  
    width: 50,
    height: 50,
    resizeMode: "contain",
    alignSelf: "center",
    marginTop: 20,
    borderRadius: 10,
  
  },

  locationBox: {
    backgroundColor: "#fff",
    padding: 5,
    borderRadius: 10,
  },

  instant: {
    backgroundColor: "#2c2c30",
    padding: 8,
    borderRadius: 40,
    alignItems: "center",
    elevation: 3,
  },

  iconCircle: {
    backgroundColor: "#ff6600",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 3,
  },

  instantText: {
    fontSize: 9,
    fontWeight: "bold",
    color:"#f6eee9"
  },

  amountText: {
    fontSize: 50,
    fontWeight: "bold",
    color: "#ff6600",
  },

  desc: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    elevation: 2,
  },

  descIcon: {
    backgroundColor: "#ff6600",
    padding: 8,
    borderRadius: 20,
  },

  descTextContainer: {
    marginLeft: 10,
    flex: 1,
  },

  text1: { fontSize: 15, color: "#ff3b30", fontWeight: "bold" },
  text2: { fontSize: 10, color: "#34c759", },
  text3: { fontSize: 10, color: "#ff3b30" },

  stepsTitle: {
    textAlign: "center",
    marginTop: 15,
    fontWeight: "bold",
    color: "#ff6600",
  },

  step: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    elevation: 2,
  },

  stepIcon: {
    backgroundColor: "#f3edf6",
    padding: 8,
    borderRadius: 20,
  },

  textBox: {
    marginLeft: 10,
    flex: 1,
  },

  title: {
    fontSize: 13,
    fontWeight: "bold",
  },

  subStep: {
    fontSize: 11,
    color: "#666",
  },

  btn: {
    backgroundColor: "#ff6600",
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
  },

  btnText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
  },
});