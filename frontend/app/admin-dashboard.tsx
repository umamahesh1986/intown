// import React from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";

// export default function AdminDashboard() {
//   const router = useRouter();

//   return (
//     <ScrollView style={styles.container}>
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.title}>Admin Dashboard</Text>
//           <Text style={styles.subtitle}>INtown Sales Management</Text>
//         </View>

//         <View style={styles.adminIcon}>
//           <Ionicons name="person" size={24} color="#fff" />
//         </View>
//       </View>

//       <Text style={styles.sectionTitle}>Overview</Text>

//       <View style={styles.grid}>
//         <StatCard
//           title="Total Customers"
//           value="1,250"
//           icon="people"
//           onPress={() => router.push("/admin-customer")}
//         />

//         <StatCard
//           title="Total Merchants"
//           value="350"
//           icon="storefront"
//           onPress={() => router.push("/admin-merchants")}
//         />

//         <StatCard
//           title="Active Shops"
//           value="280"
//           icon="checkmark-circle"
//           onPress={() => router.push("/admin-merchants")}
//         />

//         <StatCard
//           title="Inactive Shops"
//           value="70"
//           icon="close-circle"
//           onPress={() => router.push("/admin-merchants")}
//         />
//       </View>

//       <Text style={styles.sectionTitle}>Customer Savings</Text>

//       <View style={styles.card}>
//         <SavingRow title="Today" value="₹8,500" />
//         <SavingRow title="This Week" value="₹42,000" />
//         <SavingRow title="This Month" value="₹1,85,000" />
//         <SavingRow title="This Year" value="₹18,50,000" />

//         <View style={styles.totalRow}>
//           <Text style={styles.totalLabel}>Total Customer Savings</Text>
//           <Text style={styles.totalValue}>₹25,40,000</Text>
//         </View>
//       </View>

//       <Text style={styles.sectionTitle}>Merchant Performance</Text>

//       <View style={styles.grid}>
//         <StatCard
//           title="Daily Customers"
//           value="125"
//           icon="today"
//           onPress={() => router.push("/admin-merchants")}
//         />

//         <StatCard
//           title="Weekly Customers"
//           value="650"
//           icon="calendar"
//           onPress={() => router.push("/admin-merchants")}
//         />

//         <StatCard
//           title="Monthly Customers"
//           value="2,800"
//           icon="calendar-outline"
//           onPress={() => router.push("/admin-merchants")}
//         />

//         <StatCard
//           title="Regular Customers"
//           value="620"
//           icon="person-circle"
//           onPress={() => router.push("/admin-merchants")}
//         />
//       </View>

//       <Text style={styles.sectionTitle}>Sales & Profit</Text>

//       <View style={styles.card}>
//         <SavingRow title="Today's Sales" value="₹85,000" />
//         <SavingRow title="Weekly Sales" value="₹4,20,000" />
//         <SavingRow title="Monthly Sales" value="₹18,50,000" />
//         <SavingRow title="Yearly Sales" value="₹2,15,00,000" />

//         <View style={styles.profitBox}>
//           <Text style={styles.profitTitle}>Total Profit</Text>
//           <Text style={styles.profitValue}>₹21,50,000</Text>
//         </View>
//       </View>

//       <TouchableOpacity
//         style={styles.button}
//         onPress={() => router.push("/admin-customer")}
//       >
//         <Text style={styles.buttonText}>Customer Management</Text>
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={styles.button}
//         onPress={() => router.push("/admin-merchants")}
//       >
//         <Text style={styles.buttonText}>Merchant Management</Text>
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={styles.button}
//         onPress={() => router.push("/sales-management")}
//       >
//         <Text style={styles.buttonText}>Sales Management</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }

// function StatCard({
//   title,
//   value,
//   icon,
//   onPress,
// }: {
//   title: string;
//   value: string;
//   icon: any;
//   onPress: () => void;
// }) {
//   return (
//     <TouchableOpacity style={styles.statCard} onPress={onPress}>
//       <Ionicons name={icon} size={28} color="#f58220" />
//       <Text style={styles.statTitle}>{title}</Text>
//       <Text style={styles.statValue}>{value}</Text>
//     </TouchableOpacity>
//   );
// }

// function SavingRow({
//   title,
//   value,
// }: {
//   title: string;
//   value: string;
// }) {
//   return (
//     <View style={styles.row}>
//       <Text style={styles.rowTitle}>{title}</Text>
//       <Text style={styles.rowValue}>{value}</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f7f8fa",
//     padding: 16,
//   },

//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 24,
//   },

//   title: {
//     fontSize: 27,
//     fontWeight: "800",
//     color: "#171717",
//   },

//   subtitle: {
//     marginTop: 4,
//     color: "#777",
//     fontSize: 14,
//   },

//   adminIcon: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: "#f58220",
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   sectionTitle: {
//     fontSize: 19,
//     fontWeight: "800",
//     color: "#222",
//     marginTop: 10,
//     marginBottom: 12,
//   },

//   grid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "space-between",
//   },

//   statCard: {
//     width: "48%",
//     backgroundColor: "#fff",
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 12,
//     elevation: 2,
//   },

//   statTitle: {
//     color: "#777",
//     fontSize: 13,
//     marginTop: 10,
//   },

//   statValue: {
//     color: "#111",
//     fontSize: 22,
//     fontWeight: "800",
//     marginTop: 4,
//   },

//   card: {
//     backgroundColor: "#fff",
//     borderRadius: 18,
//     padding: 18,
//     marginBottom: 14,
//     elevation: 2,
//   },

//   row: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#eee",
//   },

//   rowTitle: {
//     color: "#666",
//     fontSize: 14,
//   },

//   rowValue: {
//     color: "#222",
//     fontWeight: "700",
//   },

//   totalRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 16,
//   },

//   totalLabel: {
//     fontSize: 15,
//     fontWeight: "800",
//   },

//   totalValue: {
//     fontSize: 17,
//     fontWeight: "900",
//     color: "#f58220",
//   },

//   profitBox: {
//     marginTop: 16,
//     backgroundColor: "#fff4e9",
//     borderRadius: 14,
//     padding: 16,
//   },

//   profitTitle: {
//     color: "#777",
//   },

//   profitValue: {
//     fontSize: 25,
//     fontWeight: "900",
//     color: "#f58220",
//     marginTop: 5,
//   },

//   button: {
//     backgroundColor: "#f58220",
//     paddingVertical: 15,
//     borderRadius: 14,
//     alignItems: "center",
//     marginBottom: 12,
//   },

//   buttonText: {
//     color: "#fff",
//     fontSize: 15,
//     fontWeight: "800",
//   },
// });  


import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const API = "https://devapi.intownlocal.com";

type Sale = {
  id?: number | string;
  amount?: number;
  totalAmount?: number;
  customerId?: number;
  merchantId?: number;
  status?: string;
  createdAt?: string;
};

export default function AdminDashboard() {
  const router = useRouter();

  const [sales, setSales] = useState<Sale[]>([]);
  const [dailyActivity, setDailyActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const [salesResponse, activityResponse] = await Promise.all([
        fetch(`${API}/IN/sales`),
        fetch(`${API}/IN/sales/daily-activity`),
      ]);

      const salesData = await salesResponse.json();
      const activityData = await activityResponse.json();

      const salesList = Array.isArray(salesData)
        ? salesData
        : salesData?.content ||
          salesData?.data ||
          salesData?.sales ||
          [];

      const activityList = Array.isArray(activityData)
        ? activityData
        : activityData?.content ||
          activityData?.data ||
          activityData?.activities ||
          [];

      setSales(salesList);
      setDailyActivity(activityList);
    } catch (error) {
      console.log("ADMIN SALES ERROR:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshData = () => {
    setRefreshing(true);
    loadData();
  };

  const totalSales = sales.reduce(
    (sum, item) =>
      sum +
      Number(item.amount || item.totalAmount || 0),
    0
  );

  const totalTransactions = sales.length;

  const uniqueCustomers = new Set(
    sales
      .map((item) => item.customerId)
      .filter(Boolean)
  ).size;

  const uniqueMerchants = new Set(
    sales
      .map((item) => item.merchantId)
      .filter(Boolean)
  ).size;

  const today = new Date().toISOString().split("T")[0];

  const todaySales = sales
    .filter((item) => {
      if (!item.createdAt) return false;
      return item.createdAt.startsWith(today);
    })
    .reduce(
      (sum, item) =>
        sum +
        Number(item.amount || item.totalAmount || 0),
      0
    );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#f58220" />
        <Text style={styles.loadingText}>
          Loading sales management...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshData}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>
            Complete sales management
          </Text>
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push("/admin-profile")}
        >
          <Text style={styles.profileText}>Admin</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>
        Sales Overview
      </Text>

      <View style={styles.grid}>
        <StatCard
          title="Total Sales"
          value={`₹${totalSales.toFixed(2)}`}
        />

        <StatCard
          title="Today's Sales"
          value={`₹${todaySales.toFixed(2)}`}
        />

        <StatCard
          title="Transactions"
          value={String(totalTransactions)}
        />

        <StatCard
          title="Customers"
          value={String(uniqueCustomers)}
        />

        <StatCard
          title="Merchants"
          value={String(uniqueMerchants)}
        />

        <StatCard
          title="Activities"
          value={String(dailyActivity.length)}
        />
      </View>

      <Text style={styles.sectionTitle}>
        Management
      </Text>

      <View style={styles.menuContainer}>
        <MenuButton
          title="Customer Management"
          onPress={() =>
            router.push("/admin-customer")
          }
        />

        <MenuButton
          title="Merchant Management"
          onPress={() =>
            router.push("/admin-merchants")
          }
        />

        <MenuButton
          title="Sales Management"
          onPress={() =>
            router.push("/sales-management")
          }
        />

        <MenuButton
          title="Transactions"
          onPress={() =>
            router.push("/admin-transactions")
          }
        />
      </View>

      <Text style={styles.sectionTitle}>
        Recent Sales
      </Text>

      {sales.length === 0 ? (
        <View style={styles.empty}>
          <Text>No sales available</Text>
        </View>
      ) : (
        sales.slice(0, 10).map((sale, index) => (
          <View
            style={styles.saleCard}
            key={String(sale.id || index)}
          >
            <View>
              <Text style={styles.saleTitle}>
                Sale #{sale.id || index + 1}
              </Text>

              <Text style={styles.saleInfo}>
                Customer: {sale.customerId || "-"}
              </Text>

              <Text style={styles.saleInfo}>
                Merchant: {sale.merchantId || "-"}
              </Text>
            </View>

            <Text style={styles.amount}>
              ₹
              {Number(
                sale.amount ||
                  sale.totalAmount ||
                  0
              ).toFixed(2)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function MenuButton({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuButton}
      onPress={onPress}
    >
      <Text style={styles.menuText}>{title}</Text>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    padding: 16,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#666",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#222",
  },

  subtitle: {
    marginTop: 5,
    color: "#777",
  },

  profileButton: {
    backgroundColor: "#f58220",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },

  profileText: {
    color: "#fff",
    fontWeight: "700",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 10,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
  },

  statTitle: {
    color: "#777",
    fontSize: 14,
  },

  statValue: {
    fontSize: 23,
    fontWeight: "700",
    marginTop: 8,
    color: "#f58220",
  },

  menuContainer: {
    marginBottom: 20,
  },

  menuButton: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  menuText: {
    fontSize: 16,
    fontWeight: "600",
  },

  arrow: {
    fontSize: 28,
    color: "#f58220",
  },

  saleCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  saleTitle: {
    fontWeight: "700",
    fontSize: 16,
  },

  saleInfo: {
    color: "#777",
    marginTop: 4,
  },

  amount: {
    color: "#168a3b",
    fontSize: 17,
    fontWeight: "700",
  },

  empty: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 12,
    alignItems: "center",
  },
});

