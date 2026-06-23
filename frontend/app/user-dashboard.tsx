import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

const App = () => {
  const [screen, setScreen] = useState("home");
  const [search, setSearch] = useState("");
  const [locationName, setLocationName] = useState("Set Location");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [formType, setFormType] = useState("");

 
  const DATA = {
    fruits: [
      { id: "1", name: "Apple", image: "https://cdn-icons-png.flaticon.com/512/415/415733.png" },
      { id: "2", name: "Banana", image: "https://cdn-icons-png.flaticon.com/512/590/590685.png" },
    ],
    vegetables: [
      { id: "3", name: "Carrot", image: "https://cdn-icons-png.flaticon.com/512/2909/2909763.png" },
      { id: "4", name: "Tomato", image: "https://cdn-icons-png.flaticon.com/512/135/135620.png" },
    ],
    dairy: [
      { id: "5", name: "Milk", image: "https://cdn-icons-png.flaticon.com/512/1046/1046784.png" },
      { id: "6", name: "Cheese", image: "https://cdn-icons-png.flaticon.com/512/135/135620.png" },
    ],
    bakery: [
      { id: "7", name: "Bread", image: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png" },
      { id: "8", name: "Cake", image: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png" },
    ],
    electronics: [
      { id: "9", name: "Mobile", image: "https://cdn-icons-png.flaticon.com/512/1041/1041883.png" },
      { id: "10", name: "Laptop", image: "https://cdn-icons-png.flaticon.com/512/1041/1041883.png" },
    ],
    clothes: [
      { id: "11", name: "Shirt", image: "https://cdn-icons-png.flaticon.com/512/892/892458.png" },
      { id: "12", name: "Jeans", image: "https://cdn-icons-png.flaticon.com/512/892/892458.png" },
    ],
    groceries: [
      { id: "13", name: "Rice", image: "https://cdn-icons-png.flaticon.com/512/3081/3081559.png" },
      { id: "14", name: "Oil", image: "https://cdn-icons-png.flaticon.com/512/3081/3081559.png" },
    ],
  };

 
  const shops = [
    {
      id: "1",
      name: "Fresh Mart",
      location: "Hyderabad",
      discount: "20% OFF",
      image: "https://images.unsplash.com/photo-1604719312566-8912e9c8a213",
    },
    {
      id: "2",
      name: "Veggie Shop",
      location: "Secunderabad",
      discount: "10% OFF",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e",
    },
  ];


  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    let loc = await Location.getCurrentPositionAsync({});
    let address = await Location.reverseGeocodeAsync(loc.coords);

    if (address.length > 0) {
      setLocationName(address[0].city || "Your Location");
    }
  };


  const filteredCategories = Object.keys(DATA).filter((item) =>
    item.toLowerCase().includes(search.toLowerCase())
  );


  if (screen === "home") {
    return (
      <ScrollView style={styles.container}>

       
        <View style={styles.headerCard}>
          <TouchableOpacity onPress={getCurrentLocation}>
            <Ionicons name="location" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setScreen("setLocation")}>
            <Text style={styles.locationText}>{locationName}</Text>
          </TouchableOpacity>

          <View style={styles.iconRow}>
            <Ionicons name="notifications" size={22} color="#fff" />
            <TouchableOpacity onPress={() => setShowUserMenu(!showUserMenu)}>
              <Ionicons name="person-circle" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

     
        {showUserMenu && (
          <View style={styles.card}>
            <Text>Profile</Text>
            <Text>Orders</Text>
            <Text>Logout</Text>
          </View>
        )}

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#888" />
          <TextInput
            placeholder="Search..."
            style={{ flex: 1 }}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {search !== "" && (
          <View style={styles.card}>
            {filteredCategories.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setSelectedCategory(item);
                  setScreen("category");
                  setSearch("");
                }}
              >
                <Text style={styles.searchItem}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

      
        <View style={styles.banner}>
          <Text style={styles.bannerText}>for Local</Text>
          <Text style={{ color: "#fff" }}>Shop Local | Save Local | Buy Local</Text>
        </View>

        
        <Text style={styles.title}>Categories</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={Object.keys(DATA)}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setSelectedCategory(item);
                setScreen("category");
              }}
            >
              <View style={styles.categoryCard}>
                <Image
                  source={{ uri: DATA[item][0].image }}
                  style={styles.catImage}
                />
                <Text style={styles.catText}>{item}</Text>
              </View>
            </TouchableOpacity>
          )}
        />

    
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              setFormType("Merchant");
              setScreen("form");
            }}
          >
            <Text style={styles.btnText}>Merchant</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              setFormType("Customer");
              setScreen("form");
            }}
          >
            <Text style={styles.btnText}>Customer</Text>
          </TouchableOpacity>
        </View>

      
        <Text style={styles.title}>Nearby Shops</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={shops}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.shopCard}>
              <Image source={{ uri: item.image }} style={styles.shopImg} />
              <Text style={styles.shopName}>{item.name}</Text>
              <Text style={styles.shopLoc}>{item.location}</Text>
              <Text style={styles.discount}>{item.discount}</Text>
            </View>
          )}
        />
      </ScrollView>
    );
  }

  
  if (screen === "category") {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setScreen("home")}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{selectedCategory}</Text>

        <FlatList
          data={DATA[selectedCategory]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <Image source={{ uri: item.image }} style={styles.img} />
              <Text>{item.name}</Text>
            </View>
          )}
        />
      </View>
    );
  }


  if (screen === "form") {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setScreen("home")}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{formType} Form</Text>

        <TextInput placeholder="Name" style={styles.input} />
        <TextInput placeholder="Phone" style={styles.input} />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => setScreen("home")}
        >
          <Text style={styles.btnText}>Save</Text>
        </TouchableOpacity>
      </View>
    );
  }

  
  if (screen === "setLocation") {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setScreen("home")}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Set Location</Text>

        <TextInput
          placeholder="Enter Location"
          style={styles.input}
          onChangeText={(text) => setLocationName(text)}
        />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => setScreen("home")}
        >
          <Text style={styles.btnText}>Save</Text>
        </TouchableOpacity>
      </View>
    );
  }
};

export default App;

 
const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#F5F7FB" },

  headerCard: {
    backgroundColor: "#FF8A00",
    padding: 15,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  locationText: { color: "#fff", fontWeight: "bold" },

  iconRow: { flexDirection: "row", gap: 15 },

  searchBox: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    marginVertical: 10,
    alignItems: "center",
  },

  banner: {
    backgroundColor: "#10B981",
    padding: 15,
    borderRadius: 15,
    marginVertical: 10,
  },

  bannerText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  title: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },

  categoryCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginRight: 10,
    alignItems: "center",
    elevation: 3,
  },

  catText: { fontWeight: "bold" },

  catImage: { width: 50, height: 50, marginBottom: 5 },

  buttonRow: { flexDirection: "row", justifyContent: "space-between" },

  primaryBtn: {
    backgroundColor: "#FF8A00",
    padding: 12,
    borderRadius: 12,
  },

  secondaryBtn: {
    backgroundColor: "#10B981",
    padding: 12,
    borderRadius: 12,
  },

  btnText: { color: "#fff", fontWeight: "bold" },

  shopCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 15,
    marginRight: 10,
    width: 150,
    elevation: 3,
  },

  shopImg: { width: "100%", height: 100, borderRadius: 10 },

  shopName: { fontWeight: "bold" },

  shopLoc: { color: "#666" },

  discount: { color: "#10B981", fontWeight: "bold" },

  itemCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    marginVertical: 5,
    alignItems: "center",
  },

  img: { width: 60, height: 60 },

  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
  },

  back: { marginBottom: 10, fontSize: 16 },

  card: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    marginVertical: 10,
  },

  searchItem: { padding: 10 },
});