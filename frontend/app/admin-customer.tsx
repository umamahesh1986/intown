import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { INTOWN_API_BASE } from "../utils/api";

export default function AdminCustomer() {
  const [customer, setCustomer] =
    useState<any>(null);

  const [orders, setOrders] =
    useState<any[]>([]);

  const [transactions, setTransactions] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const load = async () => {
    try {
      const role =
        await AsyncStorage.getItem(
          "userRole"
        );

      if (
        role !== "CUSTOMER" &&
        role !== "ADMIN"
      ) {
        setLoading(false);
        return;
      }

      const customerId =
        await AsyncStorage.getItem(
          "customerId"
        );

      if (!customerId) {
        setLoading(false);
        return;
      }

      const API =
        INTOWN_API_BASE.replace(
          /\/$/,
          ""
        );

      const [
        customerResponse,
        ordersResponse,
        transactionResponse,
      ] = await Promise.allSettled([
        fetch(
          `${API}/IN/customer/${customerId}`
        ),

        fetch(
          `${API}/IN/customers/${customerId}/pickup-orders`
        ),

        fetch(
          `${API}/IN/transactions/customers/${customerId}`
        ),
      ]);

      if (
        customerResponse.status ===
        "fulfilled"
      ) {
        const data =
          await customerResponse.value.json();

        if (
          customerResponse.value.ok
        ) {
          setCustomer(
            data?.data ?? data
          );
        }
      }

      if (
        ordersResponse.status ===
        "fulfilled"
      ) {
        if (
          ordersResponse.value.ok
        ) {
          const data =
            await ordersResponse.value.json();

          setOrders(
            Array.isArray(data)
              ? data
              : data?.data ||
                  data?.content ||
                  data?.items ||
                  []
          );
        }
      }

      if (
        transactionResponse.status ===
        "fulfilled"
      ) {
        if (
          transactionResponse.value.ok
        ) {
          const data =
            await transactionResponse.value.json();

          setTransactions(
            Array.isArray(data)
              ? data
              : data?.transactions ||
                  data?.data ||
                  data?.content ||
                  []
          );
        }
      }
    } catch (error) {
      console.log(
        "CUSTOMER ERROR:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, []);

  const totalSpend =
    transactions.reduce(
      (sum, item) =>
        sum +
        Number(
          item?.amount ??
            item?.totalAmount ??
            item?.salesAmount ??
            0
        ),
      0
    );

  const completed =
    orders.filter(
      (item) =>
        String(
          item?.status ??
            item?.orderStatus ??
            ""
        ).toLowerCase() ===
        "completed"
    ).length;

  const pending =
    orders.filter(
      (item) =>
        String(
          item?.status ??
            item?.orderStatus ??
            ""
        ).toLowerCase() ===
        "pending"
    ).length;

  const cancelled =
    orders.filter((item) =>
      [
        "cancelled",
        "canceled",
      ].includes(
        String(
          item?.status ??
            item?.orderStatus ??
            ""
        ).toLowerCase()
      )
    ).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <View style={styles.loaderCard}>
          <View style={styles.loaderCircle}>
            <ActivityIndicator
              size="large"
              color="#F58220"
            />
          </View>

          <Text style={styles.loaderTitle}>
            Loading Customer
          </Text>

          <Text style={styles.loaderText}>
            Fetching customer data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={["#F58220"]}
            tintColor="#F58220"
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerAccent} />

          <Text style={styles.title}>
            Customer Management
          </Text>

          <Text style={styles.subtitle}>
            Customer profile, orders and savings
          </Text>
        </View>

        <View style={styles.grid}>
          <Card
            title="Total Spend"
            value={`₹${totalSpend.toFixed(2)}`}
          />

          <Card
            title="Total Orders"
            value={String(
              orders.length
            )}
          />

          <Card
            title="Completed Orders"
            value={String(completed)}
          />

          <Card
            title="Pending Orders"
            value={String(pending)}
          />

          <Card
            title="Cancelled Orders"
            value={String(cancelled)}
          />

          <Card
            title="Recent Purchases"
            value={String(
              transactions.length
            )}
          />
        </View>

        <Text style={styles.section}>
          Customer Information
        </Text>

        <View style={styles.box}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(
                  customer?.contactName ||
                  customer?.customerName ||
                  customer?.name ||
                  "C"
                )
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>

            <View style={styles.profileText}>
              <Text style={styles.name}>
                {customer?.contactName ||
                  customer?.customerName ||
                  customer?.name ||
                  "Customer"}
              </Text>

              <Text style={styles.profileLabel}>
                Customer Profile
              </Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Customer ID
            </Text>

            <Text style={styles.infoValue}>
              {customer?.customerId ||
                customer?.id ||
                "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Phone
            </Text>

            <Text style={styles.infoValue}>
              {customer?.phoneNumber ||
                customer?.phone ||
                "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Email
            </Text>

            <Text style={styles.infoValue}>
              {customer?.email || "-"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Address
            </Text>

            <Text
              style={[
                styles.infoValue,
                styles.addressValue,
              ]}
            >
              {customer?.address || "-"}
            </Text>
          </View>
        </View>

        <Text style={styles.section}>
          Savings
        </Text>

        <View style={styles.box}>
          <View style={styles.savingRow}>
            <View style={styles.dot} />

            <Text style={styles.savingLabel}>
              Daily Savings
            </Text>

            <Text style={styles.savingValue}>
              ₹0
            </Text>
          </View>

          <View style={styles.savingRow}>
            <View style={styles.dot} />

            <Text style={styles.savingLabel}>
              Weekly Savings
            </Text>

            <Text style={styles.savingValue}>
              ₹0
            </Text>
          </View>

          <View style={styles.savingRow}>
            <View style={styles.dot} />

            <Text style={styles.savingLabel}>
              Monthly Savings
            </Text>

            <Text style={styles.savingValue}>
              ₹0
            </Text>
          </View>

          <View style={styles.savingRow}>
            <View style={styles.dot} />

            <Text style={styles.savingLabel}>
              Yearly Savings
            </Text>

            <Text style={styles.savingValue}>
              ₹0
            </Text>
          </View>
        </View>

        <Text style={styles.section}>
          Spending Trend
        </Text>

        <View style={styles.box}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>
              ₹
            </Text>
          </View>

          <Text style={styles.emptyTitle}>
            Spending Overview
          </Text>

          <Text style={styles.emptyText}>
            Spending trend data will appear
            here.
          </Text>
        </View>

        <Text style={styles.section}>
          Order Status
        </Text>

        <View style={styles.statusCard}>
          <View style={styles.statusItem}>
            <View
              style={[
                styles.statusCircle,
                styles.completedCircle,
              ]}
            >
              <Text
                style={
                  styles.statusCircleText
                }
              >
                {completed}
              </Text>
            </View>

            <Text style={styles.statusLabel}>
              Completed
            </Text>
          </View>

          <View style={styles.statusItem}>
            <View
              style={[
                styles.statusCircle,
                styles.pendingCircle,
              ]}
            >
              <Text
                style={
                  styles.statusCircleText
                }
              >
                {pending}
              </Text>
            </View>

            <Text style={styles.statusLabel}>
              Pending
            </Text>
          </View>

          <View style={styles.statusItem}>
            <View
              style={[
                styles.statusCircle,
                styles.cancelledCircle,
              ]}
            >
              <Text
                style={
                  styles.statusCircleText
                }
              >
                {cancelled}
              </Text>
            </View>

            <Text style={styles.statusLabel}>
              Cancelled
            </Text>
          </View>
        </View>

        <Text style={styles.section}>
          Orders History
        </Text>

        {orders.length === 0 ? (
          <View style={styles.box}>
            <Text style={styles.emptyTitle}>
              No Orders
            </Text>

            <Text style={styles.emptyText}>
              No orders found.
            </Text>
          </View>
        ) : (
          orders.map(
            (order, index) => (
              <View
                key={
                  order?.id ??
                  order?.pickupId ??
                  index
                }
                style={styles.order}
              >
                <View
                  style={
                    styles.orderHeader
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.orderTitle
                      }
                    >
                      Order #
                      {order?.id ??
                        order?.pickupId ??
                        index + 1}
                    </Text>

                    <Text
                      style={
                        styles.orderSubtext
                      }
                    >
                      Order History
                    </Text>
                  </View>

                  <View
                    style={
                      styles.orderStatus
                    }
                  >
                    <Text
                      style={
                        styles.orderStatusText
                      }
                    >
                      {order?.status ||
                        order?.orderStatus ||
                        "-"}
                    </Text>
                  </View>
                </View>
              </View>
            )
          )
        )}

        <Text style={styles.section}>
          Recent Purchases
        </Text>

        {transactions.length === 0 ? (
          <View style={styles.box}>
            <Text style={styles.emptyTitle}>
              No Purchases
            </Text>

            <Text style={styles.emptyText}>
              No purchase history.
            </Text>
          </View>
        ) : (
          transactions
            .slice(0, 10)
            .map(
              (item, index) => (
                <View
                  key={index}
                  style={styles.order}
                >
                  <View
                    style={
                      styles.purchaseRow
                    }
                  >
                    <View
                      style={
                        styles.purchaseIcon
                      }
                    >
                      <Text
                        style={
                          styles.purchaseIconText
                        }
                      >
                        ₹
                      </Text>
                    </View>

                    <View
                      style={
                        styles.purchaseInfo
                      }
                    >
                      <Text
                        style={
                          styles.orderTitle
                        }
                      >
                        {item?.productName ||
                          item?.product?.name ||
                          "Purchase"}
                      </Text>

                      <Text
                        style={
                          styles.orderSubtext
                        }
                      >
                        Recent Purchase
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.amount
                      }
                    >
                      ₹
                      {Number(
                        item?.amount ??
                          item?.totalAmount ??
                          0
                      ).toFixed(2)}
                    </Text>
                  </View>
                </View>
              )
            )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardDot} />

        <Text style={styles.cardTitle}>
          {title}
        </Text>
      </View>

      <Text style={styles.cardValue}>
        {value}
      </Text>

      <View style={styles.cardLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  center: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  loaderCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 35,
    paddingHorizontal: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },

  loaderCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFF3E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  loaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#171717",
    marginBottom: 5,
  },

  loaderText: {
    fontSize: 13,
    color: "#8A8A8A",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 50,
  },

  header: {
    paddingHorizontal: 4,
    marginBottom: 22,
  },

  headerAccent: {
    width: 42,
    height: 4,
    borderRadius: 10,

    marginBottom: 12,
  },

  title: {
    fontSize: 30,
    lineHeight: 37,
    fontWeight: "900",
    color: "#151515",
    letterSpacing: -0.7,
  },

  subtitle: {
    color: "#777777",
    fontSize: 14,
    marginTop: 6,
    lineHeight: 21,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },

  card: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 145,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: "#ECECEC",
    minHeight: 125,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.045,
    shadowRadius: 12,
    elevation: 3,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F58220",
    marginRight: 8,
  },

  cardTitle: {
    color: "#777777",
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },

  cardValue: {
    fontSize: 23,
    fontWeight: "900",
    color: "#171717",
    marginTop: 12,
    letterSpacing: -0.3,
  },

  cardLine: {
    width: 32,
    height: 3,
    borderRadius: 10,
    backgroundColor: "#F58220",
    marginTop: 12,
  },

  section: {
    fontSize: 20,
    fontWeight: "900",
    color: "#181818",
    marginTop: 23,
    marginBottom: 11,
    letterSpacing: -0.3,
  },

  box: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: "#ECECEC",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#FFF0E3",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFD5B5",
  },

  avatarText: {
    color: "#F58220",
    fontSize: 23,
    fontWeight: "900",
  },

  profileText: {
    marginLeft: 13,
    flex: 1,
  },

  name: {
    fontSize: 19,
    fontWeight: "900",
    color: "#171717",
  },

  profileLabel: {
    color: "#999999",
    fontSize: 12,
    marginTop: 3,
  },

  infoDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 7,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 7,
  },

  infoLabel: {
    width: 105,
    color: "#8A8A8A",
    fontSize: 13,
    fontWeight: "600",
  },

  infoValue: {
    flex: 1,
    color: "#242424",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },

  addressValue: {
    lineHeight: 19,
  },

  savingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F58220",
    marginRight: 10,
  },

  savingLabel: {
    flex: 1,
    color: "#666666",
    fontSize: 14,
    fontWeight: "600",
  },

  savingValue: {
    color: "#F58220",
    fontSize: 15,
    fontWeight: "900",
  },

  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#FFF1E5",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 2,
  },

  emptyIconText: {
    fontSize: 21,
    fontWeight: "900",
    color: "#F58220",
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222222",
    textAlign: "center",
  },

  emptyText: {
    color: "#8A8A8A",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },

  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ECECEC",
    flexDirection: "row",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },

  statusItem: {
    alignItems: "center",
    flex: 1,
  },

  statusCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
    borderWidth: 5,
  },

  completedCircle: {
    backgroundColor: "#FFF4EA",
    borderColor: "#F58220",
  },

  pendingCircle: {
    backgroundColor: "#FFF9E8",
    borderColor: "#F0B429",
  },

  cancelledCircle: {
    backgroundColor: "#FFF0F0",
    borderColor: "#D9534F",
  },

  statusCircleText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#202020",
  },

  statusLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666666",
    textAlign: "center",
  },

  order: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ECECEC",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.035,
    shadowRadius: 10,
    elevation: 2,
  },

  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  orderTitle: {
    fontWeight: "900",
    fontSize: 15,
    color: "#202020",
  },

  orderSubtext: {
    color: "#999999",
    fontSize: 11,
    marginTop: 4,
  },

  orderStatus: {
    backgroundColor: "#FFF1E5",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: 125,
  },

  orderStatusText: {
    color: "#F58220",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "capitalize",
  },

  purchaseRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  purchaseIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FFF1E5",
    alignItems: "center",
    justifyContent: "center",
  },

  purchaseIconText: {
    color: "#F58220",
    fontSize: 18,
    fontWeight: "900",
  },

  purchaseInfo: {
    flex: 1,
    marginLeft: 12,
  },

  amount: {
    color: "#F58220",
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 8,
  },
});

