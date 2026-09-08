import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from "react-native";
import { Picker } from "@react-native-picker/picker";

const API = "https://devapi.intownlocal.com";
const { width } = Dimensions.get("window");

export default function Orders() {
  const customerId = 100068;
  const merchantId = 101;

  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedQty, setSelectedQty] = useState<any>({});
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    getProducts();
  }, []);

  const getProducts = async () => {
    const res = await fetch(`${API}/IN/products/`);
    const data = await res.json();
    setProducts(data);
  };

  // ADD CART (grouped)
  const addCart = (product: any) => {
    const qty = selectedQty[product.id] || "100g";

    const exist = cart.find((x) => x.id === product.id);

    if (exist) {
      setCart(
        cart.map((x) =>
          x.id === product.id
            ? { ...x, quantity: x.quantity + 1 }
            : x
        )
      );
    } else {
      setCart([
        ...cart,
        { ...product, quantity: 1, weight: qty }
      ]);
    }
  };

  const changeQty = (id: number, type: string) => {
    setCart(
      cart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                type === "plus"
                  ? item.quantity + 1
                  : item.quantity > 1
                  ? item.quantity - 1
                  : 1
            }
          : item
      )
    );
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      Alert.alert("Cart empty");
      return;
    }

    await fetch(
      `${API}/IN/customers/${customerId}/pickup-orders`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          merchantId,
          items: cart.map((item) => ({
            productName: item.name,
            quantity: `${item.quantity} ${item.weight}`
          }))
        })
      }
    );

    Alert.alert("Order placed");
    setCart([]);
  };

  return (
    <View style={{ flex: 1 }}>

      {/* CART TOGGLE */}
      <TouchableOpacity
        style={styles.cartToggle}
        onPress={() => setShowCart(!showCart)}
      >
        <Text style={{ color: "#fff" }}>
          Cart ({cart.length})
        </Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>

        {/* PRODUCTS GRID */}
        <View style={styles.grid}>
          {products.map((item) => (
            <View key={item.id} style={styles.card}>

              <Image
                source={{
                  uri: item.s3ImageUrl || "https://via.placeholder.com/100"
                }}
                style={styles.img}
              />

              <Text style={styles.name}>{item.name}</Text>

              <Picker
                selectedValue={selectedQty[item.id] || "100g"}
                onValueChange={(value) =>
                  setSelectedQty({
                    ...selectedQty,
                    [item.id]: value
                  })
                }
                style={styles.picker}
              >
                <Picker.Item label="100g" value="100g" />
                <Picker.Item label="200g" value="200g" />
                <Picker.Item label="500g" value="500g" />
                <Picker.Item label="1kg" value="1kg" />
              </Picker>

              {/* ADD CART TOP */}
              <TouchableOpacity
                onPress={() => addCart(item)}
                style={styles.addBtn}
              >
                <Text style={styles.btnText}>Add</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* CART VIEW */}
        {showCart && (
          <View style={styles.cartBox}>
            <Text style={styles.cartTitle}>Cart Items</Text>

            {cart.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <Text>
                  {item.name} ({item.weight})
                </Text>

                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    onPress={() => changeQty(item.id, "minus")}
                    style={styles.minus}
                  >
                    <Text style={styles.btnText}>-</Text>
                  </TouchableOpacity>

                  <Text>{item.quantity}</Text>

                  <TouchableOpacity
                    onPress={() => changeQty(item.id, "plus")}
                    style={styles.plus}
                  >
                    <Text style={styles.btnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FIXED PLACE ORDER */}
      <TouchableOpacity style={styles.placeBtn} onPress={placeOrder}>
        <Text style={styles.btnText}>Place Order</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center"
  },

  // 🔥 Responsive card width
  card: {
    width: width < 400 ? width / 3 - 10 : width / 6 - 10,
    margin: 4,
    backgroundColor: "#fff",
    padding: 6,
    borderRadius: 8,
    elevation: 3,
    alignItems: "center"
  },

  img: {
    width: "100%",
    height: width < 400 ? 70 : 55,
    borderRadius: 6
  },

  name: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 3
  },

  picker: {
    height: 28,
    width: "100%"
  },

  addBtn: {
    backgroundColor: "#16a34a",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 5,
    marginTop: 4,
    width: "100%"
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 10
  },

  // 🔥 Cart Toggle
  cartToggle: {
    backgroundColor: "#111",
    padding: 12,
    alignItems: "center"
  },

  // 🔥 Centered Cart Box
  cartBox: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 12,
    marginTop: 15,
    elevation: 4
  },

  cartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center"
  },

  cartItem: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginTop: 8
  },

  qtyRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
    gap: 10
  },

  minus: {
    backgroundColor: "#ef4444",
    padding: 6,
    borderRadius: 5
  },

  plus: {
    backgroundColor: "#22c55e",
    padding: 6,
    borderRadius: 5
  },

  // 🔥 Fixed bottom button
  placeBtn: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#2563eb",
    padding: 16
  }
});

