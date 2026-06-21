
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const shadowStyle = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 6,
};

const SavingsPage = () => {
  const [showMore, setShowMore] = useState(false);

  const savingsData = [
    { id: 1, title: "Today", amount: "₹120", icon: "today" },
    { id: 2, title: "Month", amount: "₹2,450", icon: "calendar-month" },
    { id: 3, title: "Year", amount: "₹18,900", icon: "event-available" },
  ];

  const transactions = [
    { id: 1, date: "20 Jun", bill: "₹500", saved: "₹100", paid: "₹350" },
    { id: 2, date: "18 Jun", bill: "₹1000", saved: "₹300", paid: "₹700" },
    { id: 3, date: "15 Jun", bill: "₹300", saved: "₹150", paid: "₹150" },
  ];

  const howItWorks = [
    "Shop at INtown partner stores",
    "Pay using INtown app",
    "Get instant savings on every purchase",
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.heading}>My Savings</Text>
      </View>

      {/* Savings Cards */}
      <View style={styles.cardRow}>
        {savingsData.map((item) => (
          <View key={item.id} style={styles.card}>
           
            <MaterialIcons names={item.icon} size={30} color="#FF8A00" />
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardAmount}>{item.amount}</Text>
          </View>
        ))}
      </View>

      {/* Total Savings */}
      <View style={styles.totalCard}>
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/3135/3135706.png",
          }}
          style={styles.image}
        />
        <Text style={styles.totalText}>Total Savings ₹21,470</Text>
      </View>

      
      <View style={styles.sectionHeaderCard}>
        <MaterialIcons name="receipt-long" size={26} color="#FF8A00" />
        <Text style={styles.subHeading}>Recent Transactions</Text>
      </View>

      {/* First Transaction */}
      <View style={styles.transactionCard}>
        <Text style={styles.date}>{transactions[0].date}</Text>
        <View style={styles.row}>
          <Text style={styles.grayText}>Bill: {transactions[0].bill}</Text>
          <Text style={styles.savedText}>
            Saved: {transactions[0].saved}
          </Text>
          <Text style={styles.grayText}>Paid: {transactions[0].paid}</Text>
        </View>
      </View>

     
      <TouchableOpacity
        style={styles.dropdownBtn}
        onPress={() => setShowMore(!showMore)}
      >
        <Text style={styles.viewMore}>
          {showMore ? "Show Less" : "View More"}
        </Text>
        <Ionicons
          name={showMore ? "chevron-up" : "chevron-down"}
          size={20}
          color="#FF8A00"
        />
      </TouchableOpacity>

      
      {showMore &&
        transactions.slice(1).map((item) => (
          <View key={item.id} style={styles.transactionCard}>
            <Text style={styles.date}>{item.date}</Text>
            <View style={styles.row}>
              <Text style={styles.grayText}>Bill: {item.bill}</Text>
              <Text style={styles.savedText}>
                Saved: {item.saved}
              </Text>
              <Text style={styles.grayText}>Paid: {item.paid}</Text>
            </View>
          </View>
        ))}

      {/* How Savings Work */}
      <View style={styles.sectionHeaderCard}>
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/1828/1828884.png",
          }}
          style={styles.headerImage}
        />
        <Text style={styles.subHeading}>How Savings Work</Text>
      </View>

      {howItWorks.map((step, index) => (
        <View key={index} style={styles.stepCard}>
          <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default SavingsPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    padding: 16,
  },

  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },

  subHeading: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
    marginLeft: 10,
  },

  headerCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 18,
    marginBottom: 18,
    alignItems: "center",
    ...shadowStyle,
  },

  sectionHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 14,
    marginVertical: 12,
    ...shadowStyle,
  },

  headerImage: {
    width: 28,
    height: 28,
  },

  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    width: "31%",
    ...shadowStyle,
  },

  cardTitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#777",
  },

  cardAmount: {
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 5,
    color: "#FF8A00",
  },

  totalCard: {
    backgroundColor: "#FF8A00",
    padding: 22,
    borderRadius: 20,
    marginTop: 20,
    alignItems: "center",
    ...shadowStyle,
  },

  image: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },

  totalText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },

  transactionCard: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 14,
    marginBottom: 12,
    ...shadowStyle,
  },

  date: {
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  grayText: {
    color: "#666",
  },

  savedText: {
    color: "#22871a",
    fontWeight: "bold",
  },

  dropdownBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },

  viewMore: {
    color: "#FF8A00",
    fontWeight: "bold",
    marginRight: 5,
  },

  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    ...shadowStyle,
  },

  stepText: {
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
  },
});