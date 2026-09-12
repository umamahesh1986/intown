import React, {
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { INTOWN_API_BASE } from "../utils/api";

export default function AdminTransactions() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1000;
  const isDesktop = width >= 1000;

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const role = await AsyncStorage.getItem("userRole");

      if (role !== "ADMIN" && role !== "MERCHANT") {
        setLoading(false);
        return;
      }

      const merchantId =
        await AsyncStorage.getItem("merchantId");

      if (role === "MERCHANT" && !merchantId) {
        setLoading(false);
        return;
      }

      const API = INTOWN_API_BASE.replace(/\/$/, "");

      let url = "";

      if (role === "MERCHANT") {
        url = `${API}/IN/transactions/merchants/${merchantId}`;
      }

      if (role === "ADMIN") {
        url = `${API}/IN/transactions/`;
      }

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      console.log(
        "Transactions status:",
        response.status
      );

      if (!response.ok) {
        throw new Error(
          `Transaction API error ${response.status}`
        );
      }

      const data = await response.json();

      console.log("Transactions:", data);

      setTransactions(
        Array.isArray(data)
          ? data
          : data?.transactions ||
              data?.data ||
              data?.content ||
              []
      );
    } catch (error) {
      console.log("TRANSACTION ERROR:", error);
      setTransactions([]);
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

  const totalRevenue = transactions.reduce(
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

  const successful = transactions.filter((item) =>
    [
      "success",
      "successful",
      "completed",
      "paid",
    ].includes(
      String(
        item?.status ??
          item?.paymentStatus ??
          ""
      ).toLowerCase()
    )
  ).length;

  const refunded = transactions.filter(
    (item) =>
      String(
        item?.status ??
          item?.paymentStatus ??
          ""
      ).toLowerCase() === "refunded"
  ).length;

  const other = Math.max(
    transactions.length -
      successful -
      refunded,
    0
  );

  const successRate = transactions.length
    ? (
        (successful /
          transactions.length) *
        100
      ).toFixed(1)
    : "0";

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <View style={styles.loadingCircle}>
          <ActivityIndicator
            size="large"
            color="#F58220"
          />
        </View>

        <Text style={styles.loadingTitle}>
          Loading Transactions
        </Text>

        <Text style={styles.loadingSub}>
          Please wait...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: isMobile
              ? 14
              : isTablet
              ? 22
              : 30,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#F58220"
          />
        }
      >
        {/* HEADER */}

        <View
          style={[
            styles.header,
            isMobile && styles.headerMobile,
          ]}
        >
          <View style={styles.headerLeft}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDot} />

              <Text style={styles.eyebrow}>
                ADMIN FINANCE
              </Text>
            </View>

            <Text
              style={[
                styles.title,
                isMobile && styles.mobileTitle,
              ]}
            >
              Transactions
            </Text>

            <Text
              style={[
                styles.subtitle,
                isMobile &&
                  styles.mobileSubtitle,
              ]}
            >
              Monitor payments, transaction activity
              and payment performance.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.refreshButton}
            onPress={refresh}
          >
            <Ionicons
              name="refresh-outline"
              size={20}
              color="#F58220"
            />

            {!isMobile && (
              <Text style={styles.refreshText}>
                Refresh
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* PAYMENT ACTIONS */}

        <View
          style={[
            styles.paymentActions,
            isMobile &&
              styles.paymentActionsMobile,
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.88}
            style={[
              styles.paymentCard,
              styles.paymentPrimary,
              isMobile &&
                styles.paymentCardMobile,
            ]}
            onPress={() =>
              router.push("/payment" as any)
            }
          >
            <View
              style={styles.paymentIconPrimary}
            >
              <Ionicons
                name="card-outline"
                size={25}
                color="#fff"
              />
            </View>

            <View style={styles.paymentInfo}>
              <Text
                style={[
                  styles.paymentTitle,
                  styles.paymentTitleWhite,
                ]}
              >
                Payment
              </Text>

              <Text
                style={[
                  styles.paymentDescription,
                  styles.paymentDescriptionWhite,
                ]}
              >
                Make a new payment
              </Text>
            </View>

            <View
              style={styles.arrowCircleWhite}
            >
              <Ionicons
                name="arrow-forward"
                size={17}
                color="#F58220"
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.88}
            style={[
              styles.paymentCard,
              styles.paymentSecondary,
              isMobile &&
                styles.paymentCardMobile,
            ]}
            onPress={() =>
              router.push(
                "/payment-history" as any
              )
            }
          >
            <View
              style={styles.paymentIconSecondary}
            >
              <Ionicons
                name="time-outline"
                size={25}
                color="#F58220"
              />
            </View>

            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>
                Payment History
              </Text>

              <Text
                style={styles.paymentDescription}
              >
                View previous payments
              </Text>
            </View>

            <View style={styles.arrowCircle}>
              <Ionicons
                name="arrow-forward"
                size={17}
                color="#F58220"
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* FINANCIAL OVERVIEW */}

        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Financial Overview
            </Text>

            <Text style={styles.sectionSub}>
              Current transaction performance
            </Text>
          </View>
        </View>

        {/* METRICS */}

        <View
          style={[
            styles.grid,
            isMobile && styles.gridMobile,
          ]}
        >
          <Card
            icon="wallet-outline"
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString(
              "en-IN",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}`}
            width={
              isDesktop
                ? "24%"
                : isTablet
                ? "48%"
                : "100%"
            }
          />

          <Card
            icon="receipt-outline"
            title="Total Transactions"
            value={String(
              transactions.length
            )}
            width={
              isDesktop
                ? "24%"
                : isTablet
                ? "48%"
                : "100%"
            }
          />

          <Card
            icon="checkmark-circle-outline"
            title="Success Rate"
            value={`${successRate}%`}
            width={
              isDesktop
                ? "24%"
                : isTablet
                ? "48%"
                : "100%"
            }
          />

          <Card
            icon="return-down-back-outline"
            title="Refunded"
            value={String(refunded)}
            width={
              isDesktop
                ? "24%"
                : isTablet
                ? "48%"
                : "100%"
            }
          />
        </View>

        {/* PAYMENT STATUS */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Payment Status
            </Text>

            <Text style={styles.sectionSub}>
              Transaction health overview
            </Text>
          </View>
        </View>

        <View style={styles.statusBox}>
          <StatusRow
            icon="checkmark-circle"
            title="Successful"
            count={successful}
            total={transactions.length}
            type="success"
          />

          <StatusRow
            icon="return-down-back"
            title="Refunded"
            count={refunded}
            total={transactions.length}
            type="refund"
          />

          <StatusRow
            icon="ellipsis-horizontal-circle"
            title="Other"
            count={other}
            total={transactions.length}
            type="other"
          />
        </View>

        {/* TRANSACTION HISTORY */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Transaction History
            </Text>

            <Text style={styles.sectionSub}>
              Complete payment activity
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {transactions.length}
            </Text>
          </View>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="receipt-outline"
                size={30}
                color="#F58220"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No Transactions
            </Text>

            <Text style={styles.emptyText}>
              No transaction records are
              available right now.
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsBox}>
            {transactions.map(
              (item, index) => {
                const itemStatus = String(
                  item?.status ??
                    item?.paymentStatus ??
                    "-"
                );

                const normalizedStatus =
                  itemStatus.toLowerCase();

                const isSuccess = [
                  "success",
                  "successful",
                  "completed",
                  "paid",
                ].includes(
                  normalizedStatus
                );

                const isRefund =
                  normalizedStatus.includes(
                    "refund"
                  );

                return (
                  <View
                    key={
                      item?.id ??
                      item?.transactionId ??
                      index
                    }
                    style={[
                      styles.transaction,
                      index ===
                        transactions.length -
                          1 &&
                        styles.lastTransaction,
                    ]}
                  >
                    <View
                      style={[
                        styles.transactionIcon,
                        isRefund &&
                          styles.refundIcon,
                      ]}
                    >
                      <Ionicons
                        name={
                          isRefund
                            ? "return-down-back-outline"
                            : "card-outline"
                        }
                        size={22}
                        color={
                          isRefund
                            ? "#D32F2F"
                            : "#F58220"
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.transactionMain
                      }
                    >
                      <Text
                        style={
                          styles.transactionTitle
                        }
                        numberOfLines={1}
                      >
                        {item?.transactionId ||
                          item?.id ||
                          `Transaction ${
                            index + 1
                          }`}
                      </Text>

                      <Text
                        style={
                          styles.transactionDate
                        }
                        numberOfLines={1}
                      >
                        {item?.createdAt ||
                          item?.transactionDate ||
                          item?.date ||
                          "-"}
                      </Text>

                      <View
                        style={
                          styles.methodRow
                        }
                      >
                        <Ionicons
                          name="card-outline"
                          size={13}
                          color="#999"
                        />

                        <Text
                          style={styles.small}
                        >
                          {item?.paymentMethod ||
                            item?.method ||
                            "Payment"}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={
                        styles.transactionRight
                      }
                    >
                      <Text
                        style={styles.amount}
                      >
                        ₹
                        {Number(
                          item?.amount ??
                            item?.totalAmount ??
                            0
                        ).toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </Text>

                      <View
                        style={[
                          styles.statusBadge,
                          isSuccess &&
                            styles.successBadge,
                          isRefund &&
                            styles.refundBadge,
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            isSuccess &&
                              styles.successDot,
                            isRefund &&
                              styles.refundDot,
                          ]}
                        />

                        <Text
                          style={[
                            styles.status,
                            isSuccess &&
                              styles.successText,
                            isRefund &&
                              styles.refundText,
                          ]}
                        >
                          {itemStatus}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              }
            )}
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({
  icon,
  title,
  value,
  width,
}: {
  icon: any;
  title: string;
  value: string;
  width: string;
}) {
  return (
    <View
      style={[
        styles.card,
        
      ]}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Ionicons
            name={icon}
            size={21}
            color="#F58220"
          />
        </View>

        <View style={styles.cardMiniIcon}>
          <Ionicons
            name="arrow-up-outline"
            size={14}
            color="#F58220"
          />
        </View>
      </View>

      <Text style={styles.cardTitle}>
        {title}
      </Text>

      <Text
        style={styles.cardValue}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      <View style={styles.cardLine}>
        <View style={styles.cardLineFill} />
      </View>
    </View>
  );
}

function StatusRow({
  icon,
  title,
  count,
  total,
  type,
}: {
  icon: any;
  title: string;
  count: number;
  total: number;
  type: "success" | "refund" | "other";
}) {
  const percentage = total
    ? Math.round(
        (count / total) * 100
      )
    : 0;

  return (
    <View style={styles.statusRow}>
      <View style={styles.statusLeft}>
        <View
          style={[
            styles.statusIcon,
            type === "refund" &&
              styles.statusIconRefund,
            type === "other" &&
              styles.statusIconOther,
          ]}
        >
          <Ionicons
            name={icon}
            size={19}
            color={
              type === "success"
                ? "#2E9B5B"
                : type === "refund"
                ? "#D32F2F"
                : "#777"
            }
          />
        </View>

        <View style={styles.statusInfo}>
          <Text style={styles.statusTitle}>
            {title}
          </Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                type === "success" &&
                  styles.successProgress,
                type === "refund" &&
                  styles.refundProgress,
                type === "other" &&
                  styles.otherProgress,
                {
                  width: `${percentage}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.statusRight}>
        <Text style={styles.statusCount}>
          {count}
        </Text>

        <Text style={styles.statusPercent}>
          {percentage}%
        </Text>
      </View>
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
  },

  loadingCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF1E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  loadingTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222",
  },

  loadingSub: {
    color: "#999",
    marginTop: 5,
  },

  content: {
    paddingTop: 22,
  },

  header: {
    minHeight: 92,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  headerMobile: {
    alignItems: "flex-start",
  },

  headerLeft: {
    flex: 1,
  },

  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#F58220",
    marginRight: 7,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    color: "#F58220",
    letterSpacing: 1.6,
  },

  title: {
    fontSize: 31,
    fontWeight: "900",
    color: "#181818",
    letterSpacing: -0.8,
  },

  mobileTitle: {
    fontSize: 26,
  },

  subtitle: {
    fontSize: 14,
    color: "#858585",
    marginTop: 5,
  },

  mobileSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    maxWidth: "90%",
  },

  refreshButton: {
    height: 46,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F1E7DF",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },

  refreshText: {
    color: "#F58220",
    fontWeight: "800",
    fontSize: 13,
  },

  paymentActions: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 28,
  },

  paymentActionsMobile: {
    flexDirection: "column",
  },

  paymentCard: {
    flex: 1,
    minHeight: 86,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },

  paymentCardMobile: {
    width: "100%",
    flex: undefined,
  },

  paymentPrimary: {
    backgroundColor: "#F58220",
    borderColor: "#F58220",
    shadowColor: "#F58220",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 5,
  },

  paymentSecondary: {
    backgroundColor: "#fff",
    borderColor: "#F2E4D8",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  paymentIconPrimary: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor:
      "rgba(255,255,255,0.20)",
    justifyContent: "center",
    alignItems: "center",
  },

  paymentIconSecondary: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFF1E5",
    justifyContent: "center",
    alignItems: "center",
  },

  paymentInfo: {
    flex: 1,
    marginLeft: 13,
  },

  paymentTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#222",
  },

  paymentTitleWhite: {
    color: "#fff",
  },

  paymentDescription: {
    fontSize: 11,
    color: "#888",
    marginTop: 4,
  },

  paymentDescriptionWhite: {
    color: "rgba(255,255,255,0.78)",
  },

  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF3E9",
    justifyContent: "center",
    alignItems: "center",
  },

  arrowCircleWhite: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  summaryHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 27,
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#202020",
  },

  sectionSub: {
    color: "#999",
    fontSize: 12,
    marginTop: 3,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },

  gridMobile: {
    flexDirection: "column",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    minHeight: 158,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.035,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#FFF2E8",
    justifyContent: "center",
    alignItems: "center",
  },

  cardMiniIcon: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "#FFF7F1",
    justifyContent: "center",
    alignItems: "center",
  },

  cardTitle: {
    color: "#888",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 17,
  },

  cardValue: {
    color: "#171717",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 5,
  },

  cardLine: {
    height: 3,
    borderRadius: 3,
    backgroundColor: "#F7E9DD",
    marginTop: 15,
    overflow: "hidden",
  },

  cardLineFill: {
    width: "38%",
    height: "100%",
    backgroundColor: "#F58220",
    borderRadius: 3,
  },

  statusBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.035,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  statusRow: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F4F4F4",
  },

  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  statusIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#EFF9F3",
    justifyContent: "center",
    alignItems: "center",
  },

  statusIconRefund: {
    backgroundColor: "#FFF0F0",
  },

  statusIconOther: {
    backgroundColor: "#F4F4F4",
  },

  statusInfo: {
    flex: 1,
    marginLeft: 13,
    marginRight: 15,
  },

  statusTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#333",
    marginBottom: 8,
  },

  progressTrack: {
    height: 5,
    backgroundColor: "#F1F1F1",
    borderRadius: 5,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 5,
    minWidth: 2,
  },

  successProgress: {
    backgroundColor: "#2E9B5B",
  },

  refundProgress: {
    backgroundColor: "#D32F2F",
  },

  otherProgress: {
    backgroundColor: "#999",
  },

  statusRight: {
    minWidth: 58,
    alignItems: "flex-end",
  },

  statusCount: {
    fontSize: 16,
    fontWeight: "900",
    color: "#222",
  },

  statusPercent: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },

  countBadge: {
    minWidth: 34,
    height: 30,
    paddingHorizontal: 9,
    borderRadius: 15,
    backgroundColor: "#FFF1E5",
    justifyContent: "center",
    alignItems: "center",
  },

  countBadgeText: {
    color: "#F58220",
    fontWeight: "900",
    fontSize: 12,
  },

  transactionsBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 17,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.035,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  transaction: {
    minHeight: 86,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },

  lastTransaction: {
    borderBottomWidth: 0,
  },

  transactionIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#FFF2E8",
    justifyContent: "center",
    alignItems: "center",
  },

  refundIcon: {
    backgroundColor: "#FFF0F0",
  },

  transactionMain: {
    flex: 1,
    marginLeft: 13,
    marginRight: 10,
  },

  transactionTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#252525",
  },

  transactionDate: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
  },

  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 4,
  },

  small: {
    color: "#888",
    fontSize: 10,
  },

  transactionRight: {
    alignItems: "flex-end",
  },

  amount: {
    fontSize: 14,
    fontWeight: "900",
    color: "#222",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    backgroundColor: "#FFF5EC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  successBadge: {
    backgroundColor: "#EEF9F2",
  },

  refundBadge: {
    backgroundColor: "#FFF0F0",
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#F58220",
    marginRight: 5,
  },

  successDot: {
    backgroundColor: "#2E9B5B",
  },

  refundDot: {
    backgroundColor: "#D32F2F",
  },

  status: {
    color: "#F58220",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  successText: {
    color: "#2E9B5B",
  },

  refundText: {
    color: "#D32F2F",
  },

  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 45,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#FFF1E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#222",
  },

  emptyText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 5,
  },

  bottomSpace: {
    height: 30,
  },
});