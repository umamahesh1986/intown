import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
} from "react-native";

const FruitsScreen = () => {
  const fruits = [
    {
      name: "Apple",
      image: "https://cdn-icons-png.flaticon.com/512/415/415682.png",
    },
    {
      name: "Banana",
      image: "https://cdn-icons-png.flaticon.com/512/590/590685.png",
    },
    {
      name: "Mango",
      image: "https://cdn-icons-png.flaticon.com/512/590/590692.png",
    },
    {
      name: "Orange",
      image: "https://cdn-icons-png.flaticon.com/512/135/135620.png",
    },
    {
      name: "Grapes",
      image: "https://cdn-icons-png.flaticon.com/512/590/590682.png",
    },
  ];

  return (
    <View style={styles.container}>
      
      <Text style={styles.title}>Fruits</Text>

      <FlatList
        data={fruits}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.name}>{item.name}</Text>
          </View>
        )}
      />

    </View>
  );
};

export default FruitsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    marginTop: 10,
    borderRadius: 10,
    elevation: 2,
  },

  image: {
    width: 50,
    height: 50,
  },

  name: {
    marginLeft: 15,
    fontSize: 16,
  },
});