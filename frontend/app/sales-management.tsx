import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";

const API = "https://devapi.intownlocal.com";

export default function AdminSales() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSales = async () => {
    try {
      const response = await fetch(`${API}/IN/sales`);
      const data = await response.json();

      console.log("SALES:", data);

      const list = Array.isArray(data)
        ? data
        : data?.content ||
          data?.data ||
          data?.sales ||
          [];

      setSales(list);
    } catch (error) {
      console.log("SALES ERROR:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const totalSales = sales.reduce(
    (sum, sale) =>
      sum +
      Number(
        sale.amount ||
          sale.totalAmount ||
          sale.saleAmount ||
          0
      ),
    0
  );

  const completedSales = sales.filter(
    (sale) =>
      String(sale.status || "").toUpperCase() ===
      "COMPLETED"
  ).length;

  const pendingSales = sales.filter(
    (sale) =>
      String(sale.status || "").toUpperCase() ===
      "PENDING"
  ).length;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#f58220" />
        <Text>Loading sales...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadSales();
          }}
        />
      }
    >
      <Text style={styles.title}>
        Sales Management
      </Text>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>
          Total Sales
        </Text>

        <Text style={styles.totalValue}>
          ₹{totalSales.toFixed(2)}
        </Text>
      </View>

      <View style={styles.grid}>
        <Stat
          title="Transactions"
          value={sales.length}
        />

        <Stat
          title="Completed"
          value={completedSales}
        />

        <Stat
          title="Pending"
          value={pendingSales}
        />
      </View>

      <Text style={styles.sectionTitle}>
        All Sales
      </Text>

      {sales.length === 0 ? (
        <View style={styles.empty}>
          <Text>No sales found</Text>
        </View>
      ) : (
        sales.map((sale, index) => (
          <TouchableOpacity
            style={styles.saleCard}
            key={String(sale.id || index)}
            onPress={() =>
              console.log(
                "SELECTED SALE:",
                sale
              )
            }
          >
            <View style={styles.saleInfo}>
              <Text style={styles.saleTitle}>
                Sale #{sale.id || index + 1}
              </Text>

              <Text style={styles.detail}>
                Customer:{" "}
                {sale.customerId || "-"}
              </Text>

              <Text style={styles.detail}>
                Merchant:{" "}
                {sale.merchantId || "-"}
              </Text>

              <Text style={styles.detail}>
                Date:{" "}
                {sale.createdAt
                  ? new Date(
                      sale.createdAt
                    ).toLocaleDateString()
                  : "-"}
              </Text>

              <Text style={styles.detail}>
                Status:{" "}
                {sale.status || "N/A"}
              </Text>
            </View>

            <Text style={styles.amount}>
              ₹
              {Number(
                sale.amount ||
                  sale.totalAmount ||
                  sale.saleAmount ||
                  0
              ).toFixed(2)}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

function Stat({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
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
    gap: 10,
  },

  title: {
    fontSize: 27,
    fontWeight: "700",
    marginTop: 15,
    marginBottom: 20,
  },

  totalCard: {
    backgroundColor: "#fff",
    padding: 22,
    borderRadius: 15,
    marginBottom: 12,
  },

  totalLabel: {
    color: "#777",
  },

  totalValue: {
    color: "#f58220",
    fontSize: 32,
    fontWeight: "700",
    marginTop: 5,
  },

  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  stat: {
    backgroundColor: "#fff",
    width: "31%",
    padding: 15,
    borderRadius: 12,
  },

  statLabel: {
    color: "#777",
    fontSize: 12,
  },

  statValue: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 5,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },

  saleCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 13,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  saleInfo: {
    flex: 1,
  },

  saleTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  detail: {
    color: "#777",
    marginTop: 4,
  },

  amount: {
    color: "#168a3b",
    fontWeight: "700",
    fontSize: 17,
  },

  empty: {
    backgroundColor: "#fff",
    padding: 30,
    alignItems: "center",
    borderRadius: 12,
  },
});

