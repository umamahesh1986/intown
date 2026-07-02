
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  ImageBackground,
  Linking,

} from "react-native";
import { Ionicons , FontAwesome, FontAwesome5} from "@expo/vector-icons";

const ModalAppAlert = () => {
  const [showModal, setShowModal] = useState(true);

  const openPlayStore = () => {
  Linking.openURL("https://play.google.com/store/apps/details?id=com.yourapp");
};
const openGPay = async () => {
  const supported = await Linking.canOpenURL("tez://");

  if (supported) {
    Linking.openURL("tez://");
  } else {
    Linking.openURL(
      "https://payments.google.com/gp/w/home/signup"
    );
  }
};

  return (
    <View style={styles.container}>
      
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>

              {/* IMAGE logo */}

              <Image
                source={{
                  uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcREp33GcU5D-kbBOZu0f1HBjrUKwpuC-JTdqWz_GNws4RDQTFGXMF8-hfA&s=10"
                }}
                style={styles.image}
              />

              {/* CARD */}
              <SafeAreaView style={styles.container}>
      <View style={styles.contain}>
        
        {/* LEFT CARD */}
        <View style={styles.leftCard}>
          <view>
          <Ionicons name="volume-high" size={22} color="#E65100" />
          <Text style={styles.earn}>EARN</Text>
          <Ionicons name="volume-high" size={22} color="#E65100" />
          </view>
          <Text style={styles.amount}>₹25</Text>

          {/* FIRST RIBBON */}
          <View style={styles.ribbonMain}>
            <View style={styles.cutCircleLeft} />
            <Text style={styles.ribbonText}>
              ON YOUR
              <Text style={styles.first}>
                1ST </Text>TRANSACTION
              
            </Text>
            <View style={styles.cutCircleRight} />
          </View>

          {/* SECOND RIBBON */}
          <View style={styles.shopWrap}>
            <View style={styles.shopRibbon}>
              <View style={styles.cutCircleLeft} />
              <Text style={styles.shopText}>
                SHOP LOCAL. SAVE MORE.
              </Text>
              <View style={styles.cutCircleRight} />
            </View>

            <View style={styles.heartWrap}>
              <FontAwesome
                name="heart-o"
                size={35}
                color="#ff9d00"
              />
            </View>
          </View>
        </View>

        {/* RIGHT CARD */}
        <View style={styles.rightCard}>
          
          {/* MOBILE */}
          <View style={styles.mobileWrapper}>
            <View style={styles.notch} />

            <View style={styles.screen}>
              <Text style={styles.logo}>INTOWN</Text>
              <Text style={styles.nameicon}> <Ionicons
                name="location-sharp"
                size={22}
                color="#fff"
              /></Text>
             
              <Text style={styles.tagline}>
                Shop Local, Save Instantly
              </Text>
            </View>
          </View>

          {/* BADGE */}
          <View style={styles.badge}>
            <Ionicons
              name="gift-outline"
              size={18}
              color="#ff9d00"
            />
            <Text style={styles.badgeTop}>INSTANT</Text>
            <Text style={styles.badgeAmount}>₹25</Text>
            <Text style={styles.badgeBottom}>CASHBACK</Text>
          </View>

          {/* HOME */}
          <Image
            source={{
              uri: "https://img.magnific.com/free-vector/house-building-cartoon-vector-icon-illustration-building-object-icon-isolated-flat-vector_138676-13433.jpg",
            }}
            style={styles.home}
          />
        </View>

      </View>
    </SafeAreaView>



              {/* DESC */}
              <View style={styles.desc}>
                <View style={styles.descIcon}>
         <Ionicons name="warning" size={26} color="#4d4a49" />
                </View>

                <View style={styles.descTextContainer}>
                  <Text style={styles.text1}>NO QUESTIONING.</Text>
                  <Text style={styles.text2}>REAL CASH REWARDING.</Text>
                
                  <Text style={styles.text3}>
                    Get<Text style={styles.first}>₹25 Cashback </Text>
                    on your first transaction</Text>
                  
                </View>
                 <View style={styles.descIcon}>
                 <Ionicons name="volume-high" size={22} color="#E65100" />
                </View>

              </View>

{/* STEPS */}
<Text style={styles.stepsTitle}>HOW <Text style={styles.first}>
  IT WORKS?</Text></Text>

<View style={styles.stepsContainer}>

  {/* LEFT SIDE */}
  <View style={styles.leftLineContainer}>
    {[1, 2, 3, 4, 5].map((num, index) => (
      <View key={index} style={styles.numberContainer}>
        <View style={styles.circle}>
          <Text style={styles.number}>{num}</Text>
        </View>
        {index !== 4 && <View style={styles.dottedLine} />}
      </View>
    ))}
  </View>

  {/* RIGHT SIDE */}
  <View style={styles.rightContent}>

    {/* STEP 1 */}
    <View style={styles.step}>
      <View style={[styles.iconBox, { shadowColor: "#2d2828" }]}>
        <Ionicons name="download-outline" size={30} color="#2d2828" />
      </View>
      <View style={styles.textBox}>
        <Text style={styles.title}>Download <Text style={styles.first}>Intown App</Text></Text>
        <Text style={styles.subStep}>From Play Store / App Store</Text>
      </View>
    </View>

    {/* STEP 2 */}
    <View style={styles.step}>
      <View style={[styles.iconBox, { shadowColor: "#f2b956" }]}>
        <Ionicons name="person-outline" size={30} color="#f2b956" />
      </View>
      <View style={styles.textBox}>
        <Text style={styles.title}>Become a <Text style={styles.first}>Customer or Merchant</Text></Text>
        <Text style={styles.subStep}>Create your account in few steps</Text>
      </View>
    </View>

    {/* STEP 3 */}
    <View style={styles.step}>
      <View style={[styles.iconBox, { shadowColor: "#171414" }]}>
        <Ionicons name="home-outline" size={30} color="#f26161" />
      </View>
      <View style={styles.textBox}>
        <Text style={styles.title}>Do Your <Text style={styles.first}>First Transaction</Text></Text>
        <Text style={styles.subStep}>At any <Text style={styles.first}>Intown </Text>Merchant</Text>
      </View>
    </View>

    {/* STEP 4 */}
    <View style={styles.step}>
      <View style={[styles.iconBox, { shadowColor: "#46b735" }]}>
        <Ionicons name="logo-whatsapp" size={30} color="#46b735" />
      </View>
      <View style={styles.textBox}>
        <Text style={styles.title}>Send Payment Screenshot</Text>
        <Text style={styles.subStep}>On WhatsApp</Text>
        <Text style={styles.first}>84644872314</Text>
      </View>
    </View>

    {/* STEP 5 */}
    <View style={styles.step}>
      <View style={[styles.iconBox, { shadowColor: "#1b1818" }]}>
        <Ionicons name="bag-outline" size={30} color="#1b1818" />
      </View>
      <View style={styles.textBox}>
        <Text style={styles.title}>Get  <Text style={styles.first}>₹25 Cashback</Text></Text>
        <Text style={styles.subStep}>After  <Text style={styles.first}>Confirmation</Text></Text>
      </View>
    </View>

  </View>
</View>


{/* footer */}
<View style={styles.footer}>

  {/* LEFT SIDE - QR + TEXT */}
  <View style={styles.leftBox}>
    <Image
      source={{
        uri: "https://img.favpng.com/7/23/23/qr-code-barcode-scanners-image-scanner-png-favpng-supG12caS2YuRf8rDUGLrThLZ.jpg"
      }}
      style={styles.scanner}
    />

    <Text style={styles.scanText}>
      SCAN & DOWNLOAD 
      
    </Text>
 <Text style={styles.first}>INTOWN APP</Text>
  </View>

  {/* RIGHT SIDE - BUTTONS */}
  <View style={styles.rightBox}>

    {/* Play Store */}
    <TouchableOpacity onPress={openPlayStore} style={styles.btnRow}>
      <FontAwesome name="android" size={20} color="#3DDC84" />

      <Image
        source={{
          uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/512px-Google_Play_Store_badge_EN.svg.png"
        }}
         style={{ width: 20, height: 20 }}
      />

      <Text style={styles.btnText}>Play Store</Text>
    </TouchableOpacity>

    {/* Google Pay */}
    <TouchableOpacity onPress={openGPay} style={styles.btnRow}>

      <FontAwesome name="google" size={20} color="#4285F4" />

      <Image
        source={{
          uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png"
        }}
        style={{ width: 20, height: 20 }}
      />

      <Text style={styles.btnText}>Google Pay</Text>
    </TouchableOpacity>

  </View>

   <View style={styles.iconBox}>
  <FontAwesome5 name="lock" size={22} color="#2E7D32" />
  <Text style={styles.iconText}>SAFE & SECURE</Text>
</View>
<View style={styles.iconBox}>
  <FontAwesome5 name="shield-alt" size={22} color="#1565C0" />
  <Text style={styles.iconText}>TRUSTED LOCAL APP</Text>
</View>
<View style={styles.iconBox}>
  <Ionicons name="location-sharp" size={22} color="#E65100" />
  <Text style={styles.iconText}>BEST OFFERS NEAR YOU</Text>
</View>
<View style={styles.iconBox}>
  
  <FontAwesome name="whatsapp" size={30} color="#4dc92b" />

  <Text style={styles.iconText}>
    ANY QUESTIONS? 
  </Text>
  <Text style={styles.iconText}>
    WHATSAPP US 
  </Text>
 <Text style={styles.first}>
    8464872314
  </Text>
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
     justifyContent: "center",   
    alignItems: "center",       
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
    height: 50,
    resizeMode: "contain",
    alignSelf: "center",
    borderRadius: 5,
      
  
  },



  contain: {
    flexDirection: "row",
    gap: 0,
  },

  /* LEFT CARD */
  leftCard: {
    width: 250,
   transform: [{ rotate: "-10deg" }],
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    elevation: 5,
  },

  earn: {
    fontSize: 30,
     fontWeight: "bold",
    color: "#1a1a1a",
  },

  amount: {
  fontSize: 60,
  fontWeight: "bold",
  color: "#ff6600",
  textShadowColor: "#00000066",
  textShadowOffset: { width: 2, height: 2 },
  textShadowRadius: 4,
},

  /* FIRST RIBBON */
  ribbonMain: {
    backgroundColor: "#393835",
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 8,
    position: "relative",
  },

  ribbonText: {
    color: "#fff",
    fontSize: 10,
    textAlign: "center",
  },

  /* SECOND RIBBON */
  shopWrap: {
    marginTop: 12,
    alignItems: "center",
  },

  shopRibbon: {
    backgroundColor: "#ff6600",
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 6,
    position: "relative",
  },

  shopText: {
    color: "#fff",
    fontSize: 10,
    textAlign: "center",
  },

  heartWrap: {
  
    left:100,
  },

  /* 🔥 CUT EFFECT (CIRCLES) */
  cutCircleLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftWidth: 12,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#fff",
  },

  cutCircleRight: {
    position: "absolute",
    right: 0,
    top: 0,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderRightWidth: 12,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: "#fff",
  },

  first:{
    color:"#ff6600",
     fontWeight: "bold",
     fontSize:12,


  },
  /* RIGHT CARD */
  rightCard: {
    width: 160,
    height: 220,
    
    borderRadius: 15,
    padding: 10,
    elevation: 5,
    justifyContent: "center",
    alignItems: "center",
  },

  mobileWrapper: {
    width: 100,
    height: 200,
    backgroundColor: "#000",
    borderRadius: 20,
    padding: 5,
    transform: [{ rotate: "10deg" }],
  },

  notch: {
    width: 30,
    height: 5,
    backgroundColor: "#333",
    alignSelf: "center",
    borderRadius: 3,
    marginBottom: 5,
  },

  screen: {
    flex: 1,
    backgroundColor: "#ff6600",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
nameicon:{
 bottom:30,
  color: "#ebe9f0",
},
  logo: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    bottom:35,
  },

  tagline: {
    color: "#fff",
    fontSize: 8,
    textAlign: "center",
     bottom:30,
  },

  /* BADGE */
  badge: {
    position: "absolute",
    bottom: 5,
    right:20,
    alignItems: "center",
    backgroundColor: "#000",
    padding: 10,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#ff6600",
    borderStyle: "dotted",
  },

  badgeTop: {
    fontSize: 8,
    color: "#fff",
  },

  badgeAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ff6600",
  },

  badgeBottom: {
    fontSize: 10,
    color: "#fff",
  },

 home: {
  position: "absolute",
  left:100,
  bottom: 0,
  width: 100,
  height: 100, 
  zIndex: -1,
 },


 desc: {
  flexDirection: "row",
  alignItems: "center",      
  justifyContent: "space-evenly", 
  marginTop: 12,
  padding: 10,
  borderRadius: 12,
  elevation: 2,
  borderWidth: 1,     
  borderColor: "#ff6600", 
   alignSelf: "center" ,
},

descIcon: {
  backgroundColor: "#fcf9f7",
  padding: 5,
  borderRadius: 20,
  
},

descTextContainer: {
  marginLeft: 10,
  alignItems: "center",  
},

text1: {
  fontSize: 15,
  color: "#403a3a",
  fontWeight: "bold",
  textAlign: "center",
},

text2: {
  fontSize: 13,
  color: "#ff6600",
  textAlign: "center",
},

text3: {
  fontSize: 13,
  color: "#635f5d",
  textAlign: "center",
},

stepsTitle:{
   textAlign: "center",
  fontSize: 18,
  fontWeight: "bold",
  marginVertical: 12,
  backgroundColor:"#423f3e",
    alignSelf: "center",
    padding:8,
    color:"#f1eae6",
   

},
   

  stepsContainer: {
  flexDirection: "row",
  marginTop: 10,
  justifyContent: "center",   
  alignItems: "center",     
  alignSelf: "center",    
},


leftLineContainer: {
  alignItems: "center",
  marginRight: 13,
},

numberContainer: {
  alignItems: "center",
},

circle: {
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: "#ff6600",
  justifyContent: "center",
  alignItems: "center",
},

number: {
  color: "#fff",
  fontWeight: "bold",
},

dottedLine: {
  width: 2,
  height: 40,
  borderStyle: "dashed",
  borderWidth: 1,
  borderColor: "#ccc",
},

rightContent: {
  flex: 1,
},

step: {
  flexDirection: "row",
  alignItems: "flex-start",
  marginBottom: 25,
  

},

textBox: {
  marginLeft: 10,
  
},

title: {
  fontWeight: "bold",
  fontSize: 14,
},

subStep: {
  fontSize: 12,
  color: "#777",
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
    fontSize:10,
  },


 footer: {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  flexWrap: "wrap",
  padding: 10,
 borderWidth: 1,     
  borderColor: "#ff6600", 
  borderRadius: 8,  
   alignSelf: "center" ,
},

leftBox: {
  alignItems: "center",
  marginHorizontal: 10,
},

rightBox: {
  flexDirection: "column" ,
  alignItems: "center",
  
},

btnRow: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#000",   
  borderWidth: 1,            
  borderColor: "#fff",      
  padding: 5,               
  borderRadius: 8            
},



iconBox: {
  width: 50,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#f5f7f9",
  borderRadius: 10, 
  elevation: 10,
  shadowColor: "#f5f7f9",
   shadowOpacity: 1,
   shadowRadius: 15,
   borderWidth: 1,
   borderColor: "#f5f7f9",    
},

scanner: {
  width: 50,
  height: 50,
  resizeMode: "contain",
},

scanText: {
  fontSize: 8,
 
  textAlign: "center",
},
 
iconText: {
  fontSize:8,
  textAlign: "center",

 
}


});




