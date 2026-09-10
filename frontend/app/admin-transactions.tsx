import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

const API = "https://devapi.intownlocal.com";

export default function AdminTransactions() {
  const [transactions, setTransactions] =
    useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = async () => {
    try {
      const response = await fetch(
        `${API}/IN/sales`
      );

      const data = await response.json();

      console.log(
        "ADMIN TRANSACTIONS:",
        data
      );

      const list = Array.isArray(data)
        ? data
        : data?.content ||
          data?.data ||
          data?.sales ||
          [];

      setTransactions(list);
    } catch (error) {
      console.log(
        "TRANSACTION ERROR:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const totalAmount = transactions.reduce(
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

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#f58220"
        />
        <Text>
          Loading transactions...
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
          onRefresh={() => {
            setRefreshing(true);
            loadTransactions();
          }}
        />
      }
    >
      <Text style={styles.title}>
        Transactions
      </Text>

      <View style={styles.summary}>
        <Text style={styles.label}>
          Total Transaction Value
        </Text>

        <Text style={styles.total}>
          ₹{totalAmount.toFixed(2)}
        </Text>

        <Text style={styles.count}>
          {transactions.length} transactions
        </Text>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.empty}>
          <Text>
            No transactions found
          </Text>
        </View>
      ) : (
        transactions.map((transaction, index) => (
          <View
            style={styles.card}
            key={String(
              transaction.id || index
            )}
          >
            <View>
              <Text style={styles.transactionTitle}>
                Transaction #
                {transaction.id ||
                  index + 1}
              </Text>

              <Text style={styles.detail}>
                Customer:{" "}
                {transaction.customerId ||
                  "-"}
              </Text>

              <Text style={styles.detail}>
                Merchant:{" "}
                {transaction.merchantId ||
                  "-"}
              </Text>

              <Text style={styles.detail}>
                Date:{" "}
                {transaction.createdAt
                  ? new Date(
                      transaction.createdAt
                    ).toLocaleString()
                  : "-"}
              </Text>

              <Text style={styles.detail}>
                Status:{" "}
                {transaction.status ||
                  "N/A"}
              </Text>
            </View>

            <Text style={styles.amount}>
              ₹
              {Number(
                transaction.amount ||
                  transaction.totalAmount ||
                  transaction.saleAmount ||
                  0
              ).toFixed(2)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
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

  summary: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 14,
    marginBottom: 18,
  },

  label: {
    color: "#777",
  },

  total: {
    fontSize: 30,
    fontWeight: "700",
    color: "#f58220",
    marginTop: 6,
  },

  count: {
    color: "#777",
    marginTop: 5,
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 13,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  transactionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  detail: {
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

