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
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { INTOWN_API_BASE } from "../utils/api";

export default function SalesManagement() {
  const router = useRouter();

  const [sales, setSales] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("sales");

  const { width } = useWindowDimensions();

  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1000;
  const isDesktop = width >= 1000;

  const load = async () => {
    try {
      const role = await AsyncStorage.getItem("userRole");

      if (role !== "ADMIN" && role !== "MERCHANT") {
        setLoading(false);
        return;
      }

      const API = INTOWN_API_BASE.replace(/\/$/, "");

      const [salesResponse, activityResponse] =
        await Promise.all([
          fetch(`${API}/IN/sales`, {
            headers: {
              Accept: "application/json",
            },
          }),

          fetch(`${API}/IN/sales/daily-activity`, {
            headers: {
              Accept: "application/json",
            },
          }),
        ]);

      if (salesResponse.ok) {
        const data = await salesResponse.json();

        setSales(
          Array.isArray(data)
            ? data
            : data?.data ||
                data?.content ||
                data?.items ||
                []
        );
      }

      if (activityResponse.ok) {
        const data = await activityResponse.json();

        setActivity(
          Array.isArray(data)
            ? data
            : data?.data ||
                data?.content ||
                data?.items ||
                []
        );
      }
    } catch (error) {
      console.log("SALES ERROR:", error);
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

  const getAmount = (item: any) => {
    return Number(
      item?.amount ??
        item?.salesAmount ??
        item?.totalSales ??
        item?.totalAmount ??
        0
    );
  };

  const getSaleDate = (item: any) => {
    return (
      item?.date ??
      item?.createdAt ??
      item?.salesDate ??
      item?.transactionDate ??
      item?.paymentDate ??
      null
    );
  };

  const isToday = (item: any) => {
    const value = getSaleDate(item);

    if (!value) return false;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return false;

    const today = new Date();

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isThisMonth = (item: any) => {
    const value = getSaleDate(item);

    if (!value) return false;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return false;

    const today = new Date();

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth()
    );
  };

  const isThisYear = (item: any) => {
    const value = getSaleDate(item);

    if (!value) return false;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return false;

    const today = new Date();

    return date.getFullYear() === today.getFullYear();
  };

  const totalSales = sales.reduce(
    (sum, item) => sum + getAmount(item),
    0
  );

  const todaySales = sales
    .filter(isToday)
    .reduce(
      (sum, item) => sum + getAmount(item),
      0
    );

  const monthlySales = sales
    .filter(isThisMonth)
    .reduce(
      (sum, item) => sum + getAmount(item),
      0
    );

  const yearlySales = sales
    .filter(isThisYear)
    .reduce(
      (sum, item) => sum + getAmount(item),
      0
    );

  const todayCount = sales.filter(isToday).length;
  const monthlyCount = sales.filter(isThisMonth).length;
  const yearlyCount = sales.filter(isThisYear).length;

  const paymentHistory = sales.filter(
    (item) =>
      item?.paymentStatus ||
      item?.paymentMode ||
      item?.transactionId ||
      item?.paymentId
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <View style={styles.loaderCircle}>
          <ActivityIndicator
            size="large"
            color="#F58220"
          />
        </View>

        <Text style={styles.loadingTitle}>
          Loading Sales
        </Text>

        <Text style={styles.loadingText}>
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
              ? 12
              : isTablet
              ? 20
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
            isMobile && styles.mobileHeader,
          ]}
        >
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.headerIcon,
                isMobile &&
                  styles.headerIconMobile,
              ]}
            >
              <Ionicons
                name="trending-up"
                size={26}
                color="#fff"
              />
            </View>

            <View
              style={styles.headerTextContainer}
            >
              <Text
                style={[
                  styles.title,
                  isMobile && styles.mobileTitle,
                ]}
              >
                Sales Management
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  isMobile &&
                    styles.mobileSubtitle,
                ]}
              >
                Track sales, payments, targets,
                achievements and performance
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.refreshButton}
            onPress={refresh}
          >
            <Ionicons
              name="refresh-outline"
              size={19}
              color="#F58220"
            />

            {!isMobile && (
              <Text style={styles.refreshText}>
                Refresh
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* SALES OVERVIEW */}

        <View style={styles.periodSection}>
          <View style={styles.periodHeader}>
            <View>
              <Text style={styles.periodTitle}>
                Sales Overview
              </Text>

              <Text style={styles.periodSubtitle}>
                Today, monthly and yearly sales
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.periodGrid,
              isMobile &&
                styles.periodGridMobile,
            ]}
          >
            <SalesPeriodCard
              title="Today Sales"
              amount={todaySales}
              count={todayCount}
              icon="today-outline"
              highlight
            />

            <SalesPeriodCard
              title="Monthly Sales"
              amount={monthlySales}
              count={monthlyCount}
              icon="calendar-outline"
            />

            <SalesPeriodCard
              title="Yearly Sales"
              amount={yearlySales}
              count={yearlyCount}
              icon="bar-chart-outline"
            />
          </View>
        </View>

        {/* SUMMARY */}

        <View
          style={[
            styles.grid,
            isMobile && styles.gridMobile,
          ]}
        >
          <SummaryCard
            title="Total Sales"
            value={`₹${totalSales.toFixed(2)}`}
            icon="₹"
            highlight
          />

          <SummaryCard
            title="Total Records"
            value={String(sales.length)}
            icon="▣"
          />

          <SummaryCard
            title="Daily Activity"
            value={String(activity.length)}
            icon="◷"
          />

          <SummaryCard
            title="Payments"
            value={String(paymentHistory.length)}
            icon="✓"
          />
        </View>

        {/* PAYMENT PANEL */}

        <View style={styles.paymentPanel}>
          <View style={styles.paymentHeader}>
            <View
              style={styles.paymentHeaderText}
            >
              <Text style={styles.paymentTitle}>
                Payments & Transactions
              </Text>

              <Text
                style={styles.paymentSubtitle}
              >
                Manage payments, payment history
                and admin transactions
              </Text>
            </View>

            <View style={styles.paymentBadge}>
              <Text
                style={styles.paymentBadgeText}
              >
                FINANCE
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.paymentActions,
              isMobile &&
                styles.paymentActionsMobile,
              isTablet &&
                styles.paymentActionsTablet,
            ]}
          >
            {/* PAYMENT */}

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.paymentButton,
                styles.primaryPaymentButton,
              ]}
              onPress={() =>
                router.push("/payment" as any)
              }
            >
              <View style={styles.buttonIcon}>
                <Ionicons
                  name="card-outline"
                  size={22}
                  color="#fff"
                />
              </View>

              <View style={styles.paymentButtonText}>
                <Text
                  style={styles.primaryButtonTitle}
                >
                  Payment
                </Text>

                <Text
                  style={styles.primaryButtonText}
                >
                  Process new payment
                </Text>
              </View>

              <View
                style={styles.arrowCircleWhite}
              >
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="#F58220"
                />
              </View>
            </TouchableOpacity>

            {/* PAYMENT HISTORY */}

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.paymentButton,
                styles.secondaryPaymentButton,
              ]}
              onPress={() =>
                router.push(
                  "/payment-history" as any
                )
              }
            >
              <View style={styles.historyIcon}>
                <Ionicons
                  name="time-outline"
                  size={22}
                  color="#F58220"
                />
              </View>

              <View style={styles.paymentButtonText}>
                <Text
                  style={
                    styles.secondaryButtonTitle
                  }
                >
                  Payment History
                </Text>

                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  View previous payments
                </Text>
              </View>

              <View style={styles.arrowCircle}>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="#F58220"
                />
              </View>
            </TouchableOpacity>

            {/* ADMIN TRANSACTIONS */}

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.paymentButton,
                styles.adminTransactionButton,
              ]}
              onPress={() =>
                router.push(
                  "/admin-transactions" as any
                )
              }
            >
              <View
                style={styles.adminTransactionIcon}
              >
                <Ionicons
                  name="swap-horizontal-outline"
                  size={22}
                  color="#F58220"
                />
              </View>

              <View style={styles.paymentButtonText}>
                <Text
                  style={
                    styles.secondaryButtonTitle
                  }
                >
                  Admin Transactions
                </Text>

                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  Manage all transactions
                </Text>
              </View>

              <View style={styles.arrowCircle}>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="#F58220"
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* TABS */}

        <View style={styles.tabs}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab("sales")}
            style={[
              styles.tab,
              activeTab === "sales" &&
                styles.activeTab,
            ]}
          >
            <Ionicons
              name="receipt-outline"
              size={16}
              color={
                activeTab === "sales"
                  ? "#F58220"
                  : "#777C84"
              }
            />

            <Text
              style={[
                styles.tabText,
                activeTab === "sales" &&
                  styles.activeTabText,
              ]}
            >
              Sales Records
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              setActiveTab("payment-history")
            }
            style={[
              styles.tab,
              activeTab === "payment-history" &&
                styles.activeTab,
            ]}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={
                activeTab === "payment-history"
                  ? "#F58220"
                  : "#777C84"
              }
            />

            <Text
              style={[
                styles.tabText,
                activeTab === "payment-history" &&
                  styles.activeTabText,
              ]}
            >
              Payment History
            </Text>
          </TouchableOpacity>
        </View>

        {/* PAYMENT HISTORY */}

        {activeTab === "payment-history" ? (
          <>
            <SectionHeader
              title="Payment History"
              subtitle="Recent payment transactions"
            />

            {paymentHistory.length === 0 ? (
              <EmptyBox
                icon="₹"
                title="No payment history"
                text="Payment transactions will appear here."
              />
            ) : (
              paymentHistory.map((item, index) => {
                const amount = getAmount(item);

                return (
                  <View
                    key={
                      item?.id ??
                      item?.paymentId ??
                      index
                    }
                    style={
                      styles.paymentHistoryCard
                    }
                  >
                    <View
                      style={styles.transactionIcon}
                    >
                      <Ionicons
                        name="card-outline"
                        size={20}
                        color="#16834A"
                      />
                    </View>

                    <View
                      style={styles.transactionInfo}
                    >
                      <Text
                        style={
                          styles.transactionTitle
                        }
                        numberOfLines={1}
                      >
                        {item?.customerName ||
                          item?.productName ||
                          `Payment ${index + 1}`}
                      </Text>

                      <Text
                        style={
                          styles.transactionDate
                        }
                        numberOfLines={1}
                      >
                        {item?.date ||
                          item?.createdAt ||
                          item?.salesDate ||
                          "-"}
                      </Text>

                      <Text
                        style={
                          styles.transactionMode
                        }
                      >
                        {item?.paymentMode ||
                          "Payment"}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.transactionRight
                      }
                    >
                      <Text
                        style={
                          styles.transactionAmount
                        }
                      >
                        ₹{amount.toFixed(2)}
                      </Text>

                      <View
                        style={
                          styles.successBadge
                        }
                      >
                        <Text
                          style={styles.successText}
                        >
                          {item?.paymentStatus ||
                            "SUCCESS"}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        ) : (
          <>
            {/* EXECUTIVE */}

            <SectionHeader
              title="Sales Executive Management"
              subtitle="Track targets, achievements and team performance"
            />

            <View style={styles.executiveCard}>
              <View style={styles.executiveIcon}>
                <Ionicons
                  name="trending-up-outline"
                  size={23}
                  color="#F58220"
                />
              </View>

              <View
                style={styles.executiveContent}
              >
                <Text
                  style={styles.executiveTitle}
                >
                  Sales Executive Management
                </Text>

                <Text
                  style={styles.executiveText}
                >
                  Executive target and achievement
                  data will appear here.
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.addButton}
                onPress={() =>
                  console.log("Add Executive")
                }
              >
                <Text style={styles.addButtonText}>
                  + Add Executive
                </Text>
              </TouchableOpacity>
            </View>

            {/* SALES RECORDS */}

            <SectionHeader
              title="Sales Records"
              subtitle={`${sales.length} sales records`}
            />

            {sales.length === 0 ? (
              <EmptyBox
                icon="▣"
                title="No sales records"
                text="No sales records found."
              />
            ) : (
              sales.map((item, index) => {
                const amount = getAmount(item);

                return (
                  <View
                    key={
                      item?.id ??
                      item?.salesId ??
                      index
                    }
                    style={styles.row}
                  >
                    <View style={styles.saleIcon}>
                      <Ionicons
                        name="cash-outline"
                        size={21}
                        color="#F58220"
                      />
                    </View>

                    <View
                      style={styles.rowContent}
                    >
                      <Text
                        style={styles.rowTitle}
                        numberOfLines={1}
                      >
                        {item?.productName ||
                          item?.customerName ||
                          item?.merchantName ||
                          `Sale ${index + 1}`}
                      </Text>

                      <Text
                        style={styles.small}
                        numberOfLines={1}
                      >
                        {item?.date ||
                          item?.createdAt ||
                          item?.salesDate ||
                          "-"}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.amountContainer
                      }
                    >
                      <Text style={styles.amount}>
                        ₹{amount.toFixed(2)}
                      </Text>

                      <Text
                        style={styles.completed}
                      >
                        COMPLETED
                      </Text>
                    </View>
                  </View>
                );
              })
            )}

            {/* DAILY ACTIVITY */}

            <SectionHeader
              title="Daily Activity"
              subtitle="Recent sales activity"
            />

            {activity.length === 0 ? (
              <EmptyBox
                icon="◷"
                title="No daily activity"
                text="No daily activity found."
              />
            ) : (
              activity
                .slice(0, 20)
                .map((item, index) => (
                  <View
                    key={index}
                    style={styles.activityRow}
                  >
                    <View
                      style={styles.activityDot}
                    />

                    <View
                      style={styles.activityInfo}
                    >
                      <Text
                        style={
                          styles.activityDate
                        }
                        numberOfLines={1}
                      >
                        {item?.date ||
                          item?.activityDate ||
                          item?.name ||
                          "Activity"}
                      </Text>

                      <Text
                        style={
                          styles.activityLabel
                        }
                      >
                        Sales activity
                      </Text>
                    </View>

                    <View
                      style={styles.activityCount}
                    >
                      <Text
                        style={
                          styles.activityCountText
                        }
                      >
                        {item?.count ??
                          item?.sales ??
                          item?.total ??
                          0}
                      </Text>

                      <Text
                        style={
                          styles.activitySmall
                        }
                      >
                        SALES
                      </Text>
                    </View>
                  </View>
                ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* SALES PERIOD CARD */

function SalesPeriodCard({
  title,
  amount,
  count,
  icon,
  highlight,
}: {
  title: string;
  amount: number;
  count: number;
  icon: any;
  highlight?: boolean;
}) {
  return (
    <View
      style={[
        styles.periodCard,
        highlight &&
          styles.periodCardHighlight,
      ]}
    >
      <View style={styles.periodTop}>
        <View
          style={[
            styles.periodIcon,
            highlight &&
              styles.periodIconHighlight,
          ]}
        >
          <Ionicons
            name={icon}
            size={22}
            color={
              highlight ? "#FFFFFF" : "#F58220"
            }
          />
        </View>

        <View
          style={[
            styles.periodStatus,
            highlight &&
              styles.periodStatusHighlight,
          ]}
        >
          <Ionicons
            name="trending-up"
            size={13}
            color={
              highlight ? "#FFFFFF" : "#F58220"
            }
          />
        </View>
      </View>

      <Text
        style={[
          styles.periodCardTitle,
          highlight &&
            styles.periodCardTitleHighlight,
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.periodAmount,
          highlight &&
            styles.periodAmountHighlight,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        ₹
        {amount.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </Text>

      <View style={styles.periodBottom}>
        <View
          style={[
            styles.countPill,
            highlight &&
              styles.countPillHighlight,
          ]}
        >
          <Text
            style={[
              styles.periodCount,
              highlight &&
                styles.periodCountHighlight,
            ]}
          >
            {count} sales
          </Text>
        </View>

        {highlight && (
          <Text style={styles.currentText}>
            TODAY
          </Text>
        )}
      </View>
    </View>
  );
}

/* SUMMARY CARD */

function SummaryCard({
  title,
  value,
  icon,
  highlight,
}: {
  title: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <View
      style={[
        styles.card,
        highlight && styles.highlightCard,
      ]}
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.cardIcon,
            highlight &&
              styles.highlightCardIcon,
          ]}
        >
          <Text
            style={[
              styles.cardIconText,
              highlight &&
                styles.highlightCardIconText,
            ]}
          >
            {icon}
          </Text>
        </View>

        <View style={styles.cardIndicator} />
      </View>

      <Text style={styles.cardTitle}>
        {title}
      </Text>

      <Text
        style={[
          styles.cardValue,
          highlight &&
            styles.highlightCardValue,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

/* SECTION HEADER */

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.section}>
        {title}
      </Text>

      <Text style={styles.sectionSubtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

/* EMPTY */

function EmptyBox({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>
          {icon}
        </Text>
      </View>

      <Text style={styles.emptyTitle}>
        {title}
      </Text>

      <Text style={styles.emptyText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F6F7F9",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F7F9",
  },

  loaderCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#FFF1E5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  loadingTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#202124",
  },

  loadingText: {
    marginTop: 5,
    color: "#8A8D93",
    fontSize: 13,
  },

  content: {
    paddingTop: 24,
    paddingBottom: 60,
  },

  /* HEADER */

  header: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  mobileHeader: {
    alignItems: "flex-start",
    marginBottom: 20,
  },

  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F58220",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
    shadowColor: "#F58220",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 6,
  },

  headerIconMobile: {
    width: 48,
    height: 48,
    borderRadius: 15,
    marginRight: 11,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#17191C",
    letterSpacing: -0.8,
  },

  mobileTitle: {
    fontSize: 22,
  },

  subtitle: {
    color: "#777C84",
    fontSize: 13,
    marginTop: 5,
    lineHeight: 19,
  },

  mobileSubtitle: {
    fontSize: 11,
    lineHeight: 17,
    paddingRight: 4,
  },

  refreshButton: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECEDEF",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginLeft: 12,
  },

  refreshText: {
    color: "#F58220",
    fontSize: 12,
    fontWeight: "900",
  },

  /* SALES OVERVIEW */

  periodSection: {
    marginBottom: 15,
  },

  periodHeader: {
    marginBottom: 14,
  },

  periodTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#202124",
  },

  periodSubtitle: {
    color: "#858990",
    fontSize: 12,
    marginTop: 4,
  },

  periodGrid: {
    flexDirection: "row",
    gap: 14,
  },

  periodGridMobile: {
    flexDirection: "column",
    gap: 12,
  },

  periodCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 175,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 19,
    borderWidth: 1,
    borderColor: "#E8EAED",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 13,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },

  periodCardHighlight: {
    backgroundColor: "#F58220",
    borderColor: "#F58220",
    shadowColor: "#F58220",
    shadowOpacity: 0.22,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 6,
  },

  periodTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  periodIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "#FFF1E5",
    alignItems: "center",
    justifyContent: "center",
  },

  periodIconHighlight: {
    backgroundColor:
      "rgba(255,255,255,0.18)",
  },

  periodStatus: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFF5EE",
    justifyContent: "center",
    alignItems: "center",
  },

  periodStatusHighlight: {
    backgroundColor:
      "rgba(255,255,255,0.18)",
  },

  periodCardTitle: {
    color: "#70757D",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 17,
  },

  periodCardTitleHighlight: {
    color: "#FFFFFF",
  },

  periodAmount: {
    color: "#17191C",
    fontSize: 27,
    fontWeight: "900",
    marginTop: 5,
    letterSpacing: -0.5,
  },

  periodAmountHighlight: {
    color: "#FFFFFF",
  },

  periodBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },

  countPill: {
    backgroundColor: "#F6F7F8",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
  },

  countPillHighlight: {
    backgroundColor:
      "rgba(255,255,255,0.18)",
  },

  periodCount: {
    fontSize: 10,
    color: "#777C84",
    fontWeight: "800",
  },

  periodCountHighlight: {
    color: "#FFFFFF",
  },

  currentText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  /* SUMMARY */

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 13,
    marginBottom: 10,
  },

  gridMobile: {
    flexDirection: "column",
    flexWrap: "nowrap",
  },

  card: {
    flex: 1,
    minWidth: 170,
    minHeight: 145,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E8EAED",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 11,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 2,
  },

  highlightCard: {
    backgroundColor: "#FFF8F1",
    borderColor: "#FFDDBF",
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#F4F5F7",
    alignItems: "center",
    justifyContent: "center",
  },

  highlightCardIcon: {
    backgroundColor: "#F58220",
  },

  cardIconText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#656970",
  },

  highlightCardIconText: {
    color: "#FFFFFF",
  },

  cardIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#F58220",
  },

  cardTitle: {
    color: "#777C84",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 18,
  },

  cardValue: {
    fontSize: 25,
    fontWeight: "900",
    color: "#202124",
    marginTop: 4,
  },

  highlightCardValue: {
    color: "#F58220",
  },

  /* PAYMENT PANEL */

  paymentPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 23,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E8EAED",
    shadowColor: "#000",
    shadowOpacity: 0.045,
    shadowRadius: 13,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },

  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  paymentHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  paymentTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#202124",
  },

  paymentSubtitle: {
    fontSize: 12,
    color: "#858990",
    marginTop: 4,
    lineHeight: 17,
  },

  paymentBadge: {
    backgroundColor: "#FFF2E6",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    marginLeft: 10,
  },

  paymentBadgeText: {
    color: "#F58220",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  paymentActions: {
    flexDirection: "row",
    gap: 12,
  },

  paymentActionsMobile: {
    flexDirection: "column",
  },

  paymentActionsTablet: {
    flexWrap: "wrap",
  },

  paymentButton: {
    flex: 1,
    minWidth: 210,
    minHeight: 82,
    borderRadius: 18,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  primaryPaymentButton: {
    backgroundColor: "#F58220",
  },

  secondaryPaymentButton: {
    backgroundColor: "#FFF7F0",
    borderWidth: 1,
    borderColor: "#FFD9BA",
  },

  adminTransactionButton: {
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E1E4E7",
  },

  buttonIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor:
      "rgba(255,255,255,0.20)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  adminTransactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFF1E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  paymentButtonText: {
    flex: 1,
    minWidth: 0,
  },

  primaryButtonTitle: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },

  primaryButtonText: {
    color: "#FFF1E5",
    fontSize: 11,
    marginTop: 3,
  },

  secondaryButtonTitle: {
    color: "#202124",
    fontWeight: "900",
    fontSize: 14,
  },

  secondaryButtonText: {
    color: "#888C92",
    fontSize: 11,
    marginTop: 3,
  },

  arrowCircle: {
    width: 33,
    height: 33,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 7,
  },

  arrowCircleWhite: {
    width: 33,
    height: 33,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 7,
  },

  /* TABS */

  tabs: {
    flexDirection: "row",
    backgroundColor: "#E9EBEE",
    borderRadius: 16,
    padding: 4,
    marginTop: 24,
    marginBottom: 8,
  },

  tab: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 11,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 6,
  },

  activeTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#777C84",
  },

  activeTabText: {
    color: "#F58220",
    fontWeight: "900",
  },

  /* SECTIONS */

  sectionHeader: {
    marginTop: 25,
    marginBottom: 12,
  },

  section: {
    fontSize: 20,
    fontWeight: "900",
    color: "#202124",
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#858990",
    marginTop: 4,
  },

  /* EXECUTIVE */

  executiveCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EAED",
    gap: 13,
  },

  executiveIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#FFF1E5",
    alignItems: "center",
    justifyContent: "center",
  },

  executiveContent: {
    flex: 1,
    minWidth: 0,
  },

  executiveTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#202124",
  },

  executiveText: {
    fontSize: 12,
    color: "#858990",
    marginTop: 4,
  },

  addButton: {
    backgroundColor: "#F58220",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  /* SALES */

  row: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 17,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EAED",
  },

  saleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFF3E8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  rowContent: {
    flex: 1,
    minWidth: 0,
  },

  rowTitle: {
    fontWeight: "900",
    fontSize: 14,
    color: "#24262A",
  },

  small: {
    color: "#858990",
    fontSize: 11,
    marginTop: 5,
  },

  amountContainer: {
    alignItems: "flex-end",
    marginLeft: 10,
  },

  amount: {
    fontWeight: "900",
    fontSize: 15,
    color: "#202124",
  },

  completed: {
    fontSize: 8,
    fontWeight: "900",
    color: "#16834A",
    marginTop: 5,
    backgroundColor: "#EAF8F0",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },

  /* ACTIVITY */

  activityRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 15,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EAED",
  },

  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F58220",
    marginRight: 13,
  },

  activityInfo: {
    flex: 1,
    minWidth: 0,
  },

  activityDate: {
    fontWeight: "800",
    color: "#24262A",
    fontSize: 13,
  },

  activityLabel: {
    fontSize: 11,
    color: "#858990",
    marginTop: 4,
  },

  activityCount: {
    alignItems: "flex-end",
    marginLeft: 10,
  },

  activityCountText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#F58220",
  },

  activitySmall: {
    fontSize: 8,
    color: "#858990",
    fontWeight: "900",
    marginTop: 2,
  },

  /* PAYMENT HISTORY */

  paymentHistoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EAED",
  },

  transactionIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#EAF8F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },

  transactionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#202124",
  },

  transactionDate: {
    fontSize: 11,
    color: "#858990",
    marginTop: 4,
  },

  transactionMode: {
    fontSize: 10,
    color: "#F58220",
    fontWeight: "800",
    marginTop: 4,
  },

  transactionRight: {
    alignItems: "flex-end",
    marginLeft: 10,
  },

  transactionAmount: {
    fontSize: 15,
    fontWeight: "900",
    color: "#202124",
  },

  successBadge: {
    marginTop: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: "#EAF8F0",
    borderRadius: 8,
  },

  successText: {
    color: "#16834A",
    fontSize: 8,
    fontWeight: "900",
  },

  /* EMPTY */

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    paddingVertical: 34,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EAED",
  },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#FFF3E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  emptyIconText: {
    color: "#F58220",
    fontSize: 22,
    fontWeight: "900",
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#33363B",
  },

  emptyText: {
    color: "#8A8D93",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
});

