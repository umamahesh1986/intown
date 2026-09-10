import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = "https://devapi.intownlocal.com";


export default function MerchantSalesDashboard() {
  const [merchantId, setMerchantId] =
    useState<string | null>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMerchantData = async () => {
    try {
      const storedMerchantId =
        await AsyncStorage.getItem("merchantId");

      if (!storedMerchantId) {
        console.log("Merchant ID not found");
        setLoading(false);
        return;
      }

      setMerchantId(storedMerchantId);

      const [
        merchantHistoryResponse,
        salesResponse,
      ] = await Promise.all([
        fetch(
          `${API}/IN/transactions/merchants/${storedMerchantId}`
        ),
        fetch(`${API}/IN/sales`),
      ]);

      const merchantHistoryData =
        await merchantHistoryResponse.json();

      const salesData =
        await salesResponse.json();

      const historyList =
        Array.isArray(merchantHistoryData)
          ? merchantHistoryData
          : merchantHistoryData?.content ||
            merchantHistoryData?.data ||
            merchantHistoryData?.transactions ||
            [];

      const salesList = Array.isArray(salesData)
        ? salesData
        : salesData?.content ||
          salesData?.data ||
          salesData?.sales ||
          [];

      const merchantSales = salesList.filter(
        (item: any) =>
          String(item.merchantId) ===
          String(storedMerchantId)
      );

      setHistory(historyList);
      setSales(merchantSales);
    } catch (error) {
      console.log("MERCHANT DATA ERROR:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMerchantData();
  }, []);

  const totalSales = history.reduce(
    (sum, item) =>
      sum +
      Number(
        item.amount ||
          item.totalAmount ||
          item.saleAmount ||
          0
      ),
    0
  );

  const uniqueCustomers = new Set(
    history
      .map(
        (item) =>
          item.customerId ||
          item.customer?.id
      )
      .filter(Boolean)
  ).size;

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const todayCustomers = new Set(
    history
      .filter((item) =>
        item.createdAt?.startsWith(today)
      )
      .map(
        (item) =>
          item.customerId ||
          item.customer?.id
      )
      .filter(Boolean)
  ).size;

  const totalSavings = history.reduce(
    (sum, item) =>
      sum +
      Number(
        item.savings ||
          item.customerSavings ||
          0
      ),
    0
  );

  const refresh = () => {
    setRefreshing(true);
    loadMerchantData();
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#f58220"
        />
        <Text>Loading merchant data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
        />
      }
    >
      <Text style={styles.title}>
        Merchant Dashboard
      </Text>

      <Text style={styles.merchantId}>
        Merchant ID: {merchantId || "-"}
      </Text>

      <Text style={styles.sectionTitle}>
        Sales Overview
      </Text>

      <View style={styles.grid}>
        <StatCard
          title="Total Sales"
          value={`₹${totalSales.toFixed(2)}`}
        />

        <StatCard
          title="Customers"
          value={String(uniqueCustomers)}
        />

        <StatCard
          title="Today's Customers"
          value={String(todayCustomers)}
        />

        <StatCard
          title="Transactions"
          value={String(history.length)}
        />

        <StatCard
          title="Customer Savings"
          value={`₹${totalSavings.toFixed(2)}`}
        />

        <StatCard
          title="Sales Records"
          value={String(sales.length)}
        />
      </View>

      <Text style={styles.sectionTitle}>
        Merchant Sales History
      </Text>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text>No sales available</Text>
        </View>
      ) : (
        history.map((item, index) => (
          <View
            style={styles.saleCard}
            key={String(item.id || index)}
          >
            <View>
              <Text style={styles.saleTitle}>
                Sale #{item.id || index + 1}
              </Text>

              <Text style={styles.info}>
                Customer:{" "}
                {item.customerId ||
                  item.customer?.id ||
                  "-"}
              </Text>

              <Text style={styles.info}>
                Date:{" "}
                {item.createdAt
                  ? new Date(
                      item.createdAt
                    ).toLocaleDateString()
                  : "-"}
              </Text>

              <Text style={styles.info}>
                Status:{" "}
                {item.status || "COMPLETED"}
              </Text>
            </View>

            <Text style={styles.amount}>
              ₹
              {Number(
                item.amount ||
                  item.totalAmount ||
                  item.saleAmount ||
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
      <Text style={styles.label}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
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
  },

  merchantId: {
    color: "#777",
    marginTop: 5,
    marginBottom: 25,
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
  },

  label: {
    color: "#777",
    fontSize: 14,
  },

  value: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 7,
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
    fontSize: 16,
    fontWeight: "700",
  },

  info: {
    color: "#777",
    marginTop: 4,
  },

  amount: {
    fontSize: 17,
    fontWeight: "700",
    color: "#168a3b",
  },

  empty: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 12,
    alignItems: "center",
  },
});

