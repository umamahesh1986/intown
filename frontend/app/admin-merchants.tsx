import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { INTOWN_API_BASE } from "../utils/api";

const ORANGE = "#F58220";
const DARK = "#171717";
const MUTED = "#777";
const BG = "#F6F7F9";
const BORDER = "#ECECEC";

type Period =
  | "all"
  | "today"
  | "week"
  | "month"
  | "year";

const periods: {
  key: Period;
  label: string;
  icon: any;
}[] = [
  {
    key: "all",
    label: "All Time",
    icon: "infinite-outline",
  },
  {
    key: "today",
    label: "Today",
    icon: "today-outline",
  },
  {
    key: "week",
    label: "This Week",
    icon: "calendar-outline",
  },
  {
    key: "month",
    label: "This Month",
    icon: "calendar-number-outline",
  },
  {
    key: "year",
    label: "This Year",
    icon: "bar-chart-outline",
  },
];

const arr = (value: any): any[] => {
  if (Array.isArray(value)) return value;

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.content)) {
    return value.content;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  if (Array.isArray(value?.transactions)) {
    return value.transactions;
  }

  if (Array.isArray(value?.orders)) {
    return value.orders;
  }

  return [];
};

const num = (...values: any[]) => {
  for (const value of values) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

const text = (...values: any[]) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim()
    ) {
      return String(value);
    }
  }

  return "—";
};

const dateOf = (item: any) =>
  item?.transactionDate ||
  item?.createdAt ||
  item?.createdDate ||
  item?.date ||
  item?.orderDate ||
  item?.timestamp ||
  item?.updatedAt;

const amountOf = (item: any) =>
  num(
    item?.totalSales,
    item?.salesAmount,
    item?.totalAmount,
    item?.amount,
    item?.payablePrice,
    item?.totalPrice
  );

const savingsOf = (item: any) =>
  num(
    item?.intownSavings,
    item?.inTownSavings,
    item?.savings,
    item?.savedAmount,
    item?.savingAmount
  );

const paymentMethodOf = (item: any) =>
  text(
    item?.paymentMethod,
    item?.method,
    item?.paymentType,
    item?.mode
  );

const inPeriod = (
  dateValue: any,
  period: Period
) => {
  if (period === "all") {
    return true;
  }

  if (!dateValue) {
    return false;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();

  if (period === "today") {
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  if (period === "week") {
    const start = new Date(now);

    const day = start.getDay();

    start.setDate(
      start.getDate() - day
    );

    start.setHours(0, 0, 0, 0);

    return date >= start && date <= now;
  }

  if (period === "month") {
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  if (period === "year") {
    return (
      date.getFullYear() === now.getFullYear()
    );
  }

  return true;
};

const formatDate = (value: any) => {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const getStatus = (item: any) =>
  text(
    item?.status,
    item?.orderStatus
  ).toLowerCase();

async function getJson(path: string) {
  const API = INTOWN_API_BASE.replace(
    /\/$/,
    ""
  );

  const response = await fetch(
    `${API}${path}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `API Error ${response.status}`
    );
  }

  return response.json();
}

export default function AdminMerchants() {
  const { width } = useWindowDimensions();

  const isMobile = width < 650;
  const isTablet =
    width >= 650 && width < 1050;

  const [merchant, setMerchant] =
    useState<any>(null);

  const [orders, setOrders] =
    useState<any[]>([]);

  const [transactions, setTransactions] =
    useState<any[]>([]);

  const [products, setProducts] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [period, setPeriod] =
    useState<Period>("all");

  const [error, setError] =
    useState("");

  const load = useCallback(async () => {
    try {
      setError("");

      const role =
        await AsyncStorage.getItem(
          "userRole"
        );

      if (
        role !== "MERCHANT" &&
        role !== "ADMIN"
      ) {
        setLoading(false);
        return;
      }

      const merchantId =
        await AsyncStorage.getItem(
          "merchantId"
        );

      if (!merchantId) {
        setError(
          "Merchant ID not found in login/session."
        );
        return;
      }

      const results =
        await Promise.allSettled([
          getJson(
            `/IN/merchant/${merchantId}`
          ),

          getJson(
            `/IN/merchants/${merchantId}/pickup-orders`
          ),

          getJson(
            `/IN/transactions/merchants/${merchantId}`
          ),

          getJson(
            `/IN/products/`
          ),
        ]);

      if (
        results[0].status ===
        "fulfilled"
      ) {
        setMerchant(
          results[0].value?.data ??
            results[0].value
        );
      }

      if (
        results[1].status ===
        "fulfilled"
      ) {
        setOrders(
          arr(results[1].value)
        );
      }

      if (
        results[2].status ===
        "fulfilled"
      ) {
        setTransactions(
          arr(results[2].value)
        );
      }

      if (
        results[3].status ===
        "fulfilled"
      ) {
        setProducts(
          arr(results[3].value)
        );
      }
    } catch (error: any) {
      console.log(
        "MERCHANT ERROR:",
        error
      );

      setError(
        error?.message ||
          "Unable to load merchant data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredTransactions =
    useMemo(() => {
      return transactions.filter(
        (item) =>
          inPeriod(
            dateOf(item),
            period
          )
      );
    }, [
      transactions,
      period,
    ]);

  const filteredOrders =
    useMemo(() => {
      return orders.filter(
        (item) =>
          inPeriod(
            dateOf(item),
            period
          )
      );
    }, [
      orders,
      period,
    ]);

  const totalSales =
    filteredTransactions.reduce(
      (sum, item) =>
        sum + amountOf(item),
      0
    );

  const totalSavings =
    filteredTransactions.reduce(
      (sum, item) =>
        sum + savingsOf(item),
      0
    );

  const refundAmount =
    filteredTransactions.reduce(
      (sum, item) =>
        sum +
        num(
          item?.refundAmount,
          item?.refundedAmount
        ),
      0
    );

  const completed =
    filteredOrders.filter(
      (item) =>
        [
          "completed",
          "complete",
          "delivered",
        ].includes(
          getStatus(item)
        )
    ).length;

  const pending =
    filteredOrders.filter(
      (item) =>
        [
          "pending",
          "accepted",
          "accept",
          "pickup_ready",
        ].includes(
          getStatus(item)
        )
    ).length;

  const cancelled =
    filteredOrders.filter(
      (item) =>
        [
          "cancelled",
          "canceled",
          "rejected",
          "reject",
        ].includes(
          getStatus(item)
        )
    ).length;

  const averageOrderValue =
    filteredTransactions.length
      ? totalSales /
        filteredTransactions.length
      : 0;

  const customerIds =
    new Set(
      filteredTransactions
        .map(
          (item) =>
            item?.customerId ||
            item?.customer?.id ||
            item?.customer?.customerId
        )
        .filter(Boolean)
    );

  const inventory = useMemo(() => {
    const total =
      products.length;

    const inStock =
      products.filter(
        (item) =>
          num(
            item?.stock,
            item?.quantity,
            item?.availableQuantity
          ) > 0
      ).length;

    const low =
      products.filter(
        (item) => {
          const stock = num(
            item?.stock,
            item?.quantity,
            item?.availableQuantity
          );

          return (
            stock > 0 &&
            stock <= 5
          );
        }
      ).length;

    const out =
      products.filter(
        (item) =>
          num(
            item?.stock,
            item?.quantity,
            item?.availableQuantity
          ) <= 0
      ).length;

    return {
      total,
      inStock,
      low,
      out,
    };
  }, [products]);

  const periodLabel =
    periods.find(
      (item) =>
        item.key === period
    )?.label || "All Time";

  const todaySales =
    transactions
      .filter((item) =>
        inPeriod(
          dateOf(item),
          "today"
        )
      )
      .reduce(
        (sum, item) =>
          sum + amountOf(item),
        0
      );

  const weekSales =
    transactions
      .filter((item) =>
        inPeriod(
          dateOf(item),
          "week"
        )
      )
      .reduce(
        (sum, item) =>
          sum + amountOf(item),
        0
      );

  const monthSales =
    transactions
      .filter((item) =>
        inPeriod(
          dateOf(item),
          "month"
        )
      )
      .reduce(
        (sum, item) =>
          sum + amountOf(item),
        0
      );

  const yearSales =
    transactions
      .filter((item) =>
        inPeriod(
          dateOf(item),
          "year"
        )
      )
      .reduce(
        (sum, item) =>
          sum + amountOf(item),
        0
      );

  if (loading) {
    return (
      <SafeAreaView
        style={styles.center}
      >
        <View
          style={styles.loadingCircle}
        >
          <ActivityIndicator
            size="large"
            color={ORANGE}
          />
        </View>

        <Text
          style={styles.loadingTitle}
        >
          Loading merchant data
        </Text>

        <Text
          style={styles.loadingText}
        >
          Please wait...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safe}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal:
              isMobile
                ? 14
                : isTablet
                ? 20
                : 28,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={ORANGE}
          />
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={[
            styles.hero,
            isMobile &&
              styles.heroMobile,
          ]}
        >
          <View
            style={styles.heroLeft}
          >
            <View
              style={styles.orangeLine}
            />

            <Text
              style={[
                styles.title,
                isMobile &&
                  styles.mobileTitle,
              ]}
            >
              Merchant Management
            </Text>

            <Text
              style={styles.subtitle}
            >
              Sales performance,
              inventory, customers and
              payments
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              setRefreshing(true);
              load();
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="refresh"
              size={21}
              color={ORANGE}
            />
          </TouchableOpacity>
        </View>

        {error ? (
          <View
            style={styles.errorBox}
          >
            <View
              style={styles.errorIcon}
            >
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color="#D93025"
              />
            </View>

            <View
              style={{ flex: 1 }}
            >
              <Text
                style={styles.errorTitle}
              >
                Something went wrong
              </Text>

              <Text
                style={styles.errorText}
              >
                {error}
              </Text>
            </View>

            <TouchableOpacity
              onPress={load}
            >
              <Text
                style={styles.retry}
              >
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View
          style={styles.filterHeader}
        >
          <View>
            <Text
              style={styles.filterTitle}
            >
              Sales Period
            </Text>

            <Text
              style={styles.filterSub}
            >
              Showing {periodLabel} data
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.filterScroll
          }
        >
          {periods.map((item) => {
            const active =
              period === item.key;

            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.85}
                onPress={() =>
                  setPeriod(
                    item.key
                  )
                }
                style={[
                  styles.filterButton,
                  active &&
                    styles.filterButtonActive,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={
                    active
                      ? "#FFF"
                      : "#666"
                  }
                />

                <Text
                  style={[
                    styles.filterText,
                    active &&
                      styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View
          style={[
            styles.merchantCard,
            isMobile &&
              styles.merchantCardMobile,
          ]}
        >
          <View
            style={styles.storeIcon}
          >
            <Ionicons
              name="storefront-outline"
              size={31}
              color={ORANGE}
            />
          </View>

          <View
            style={{ flex: 1 }}
          >
            <Text
              style={styles.merchantName}
            >
              {text(
                merchant?.businessName,
                merchant?.merchantName,
                merchant?.shopName,
                merchant?.name,
                "Merchant"
              )}
            </Text>

            <View
              style={styles.infoRow}
            >
              <Ionicons
                name="card-outline"
                size={15}
                color={ORANGE}
              />

              <Text
                style={styles.infoText}
              >
                Merchant ID:{" "}
                {text(
                  merchant?.merchantId,
                  merchant?.id
                )}
              </Text>
            </View>

            <View
              style={styles.infoRow}
            >
              <Ionicons
                name="call-outline"
                size={15}
                color={ORANGE}
              />

              <Text
                style={styles.infoText}
              >
                {text(
                  merchant?.phoneNumber,
                  merchant?.phone
                )}
              </Text>
            </View>

            <View
              style={styles.infoRow}
            >
              <Ionicons
                name="mail-outline"
                size={15}
                color={ORANGE}
              />

              <Text
                style={styles.infoText}
              >
                {text(
                  merchant?.email
                )}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.grid,
            isMobile &&
              styles.gridMobile,
          ]}
        >
          <Card
            icon="cash-outline"
            title={`${periodLabel} Sales`}
            value={`₹${totalSales.toFixed(
              2
            )}`}
            accent
          />

          <Card
            icon="today-outline"
            title="Today"
            value={`₹${todaySales.toFixed(
              2
            )}`}
          />

          <Card
            icon="calendar-outline"
            title="This Week"
            value={`₹${weekSales.toFixed(
              2
            )}`}
          />

          <Card
            icon="calendar-number-outline"
            title="This Month"
            value={`₹${monthSales.toFixed(
              2
            )}`}
          />

          <Card
            icon="stats-chart-outline"
            title="This Year"
            value={`₹${yearSales.toFixed(
              2
            )}`}
          />

          <Card
            icon="checkmark-circle-outline"
            title="Completed Orders"
            value={String(
              completed
            )}
          />

          <Card
            icon="time-outline"
            title="Pending Orders"
            value={String(
              pending
            )}
          />

          <Card
            icon="close-circle-outline"
            title="Cancelled Orders"
            value={String(
              cancelled
            )}
          />

          <Card
            icon="return-up-back-outline"
            title="Refund Amount"
            value={`₹${refundAmount.toFixed(
              2
            )}`}
          />

          <Card
            icon="calculator-outline"
            title="Avg Order Value"
            value={`₹${averageOrderValue.toFixed(
              2
            )}`}
          />

          <Card
            icon="cube-outline"
            title="Total Products"
            value={String(
              inventory.total
            )}
          />

          <Card
            icon="people-outline"
            title="Customers"
            value={String(
              customerIds.size
            )}
          />

          <Card
            icon="trending-down-outline"
            title={`${periodLabel} Savings`}
            value={`₹${totalSavings.toFixed(
              2
            )}`}
          />
        </View>

        <SectionHeader
          icon="storefront-outline"
          title="Merchant Information"
          subtitle="Registered merchant details"
        />

        <View
          style={styles.box}
        >
          <View
            style={styles.detailRow}
          >
            <Text
              style={styles.detailLabel}
            >
              Business Name
            </Text>

            <Text
              style={styles.detailValue}
            >
              {text(
                merchant?.businessName,
                merchant?.merchantName,
                merchant?.shopName,
                merchant?.name
              )}
            </Text>
          </View>

          <View
            style={styles.detailRow}
          >
            <Text
              style={styles.detailLabel}
            >
              Merchant ID
            </Text>

            <Text
              style={styles.detailValue}
            >
              {text(
                merchant?.merchantId,
                merchant?.id
              )}
            </Text>
          </View>

          <View
            style={styles.detailRow}
          >
            <Text
              style={styles.detailLabel}
            >
              Phone
            </Text>

            <Text
              style={styles.detailValue}
            >
              {text(
                merchant?.phoneNumber,
                merchant?.phone
              )}
            </Text>
          </View>

          <View
            style={styles.detailRow}
          >
            <Text
              style={styles.detailLabel}
            >
              Email
            </Text>

            <Text
              style={styles.detailValue}
            >
              {text(
                merchant?.email
              )}
            </Text>
          </View>

          <View
            style={[
              styles.detailRow,
              { borderBottomWidth: 0 },
            ]}
          >
            <Text
              style={styles.detailLabel}
            >
              Address
            </Text>

            <Text
              style={[
                styles.detailValue,
                {
                  flex: 1,
                  textAlign:
                    "right",
                  marginLeft: 15,
                },
              ]}
            >
              {text(
                merchant?.address
              )}
            </Text>
          </View>
        </View>

        <SectionHeader
          icon="trending-up-outline"
          title="Sales Trend"
          subtitle={`${periodLabel} transaction activity`}
        />

        <View
          style={styles.box}
        >
          {filteredTransactions.length ===
          0 ? (
            <Empty
              icon="analytics-outline"
              text={`No sales data for ${periodLabel.toLowerCase()}.`}
            />
          ) : (
            filteredTransactions
              .slice()
              .sort(
                (a, b) =>
                  new Date(
                    dateOf(b) || 0
                  ).getTime() -
                  new Date(
                    dateOf(a) || 0
                  ).getTime()
              )
              .slice(0, 12)
              .map(
                (
                  item,
                  index
                ) => (
                  <View
                    key={
                      item?.transactionId ||
                      item?.id ||
                      index
                    }
                    style={[
                      styles.transactionRow,
                      index ===
                        Math.min(
                          filteredTransactions.length,
                          12
                        ) -
                          1 &&
                        styles.lastRow,
                    ]}
                  >
                    <View
                      style={
                        styles.transactionIcon
                      }
                    >
                      <Ionicons
                        name="trending-up"
                        size={18}
                        color={
                          ORANGE
                        }
                      />
                    </View>

                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text
                        style={
                          styles.rowTitle
                        }
                      >
                        {text(
                          item?.productName,
                          item?.businessName,
                          item?.merchantName,
                          "Sale"
                        )}
                      </Text>

                      <Text
                        style={
                          styles.rowSub
                        }
                      >
                        {formatDate(
                          dateOf(
                            item
                          )
                        )}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.rowAmount
                      }
                    >
                      ₹
                      {amountOf(
                        item
                      ).toFixed(2)}
                    </Text>
                  </View>
                )
              )
          )}
        </View>

        <SectionHeader
          icon="pie-chart-outline"
          title="Order Status"
          subtitle={`${periodLabel} order summary`}
        />

        <View
          style={styles.statusGrid}
        >
          <StatusCard
            icon="checkmark-circle"
            title="Completed"
            value={completed}
          />

          <StatusCard
            icon="time"
            title="Pending"
            value={pending}
          />

          <StatusCard
            icon="close-circle"
            title="Cancelled"
            value={cancelled}
          />
        </View>

        <SectionHeader
          icon="cube-outline"
          title="Inventory Alerts"
          subtitle="Current merchant inventory"
        />

        <View
          style={styles.box}
        >
          <InventoryRow
            icon="checkmark-circle-outline"
            title="In Stock"
            value={
              inventory.inStock
            }
          />

          <InventoryRow
            icon="warning-outline"
            title="Low Stock"
            value={
              inventory.low
            }
          />

          <InventoryRow
            icon="close-circle-outline"
            title="Out of Stock"
            value={
              inventory.out
            }
            last
          />
        </View>

        <SectionHeader
          icon="people-outline"
          title="Customer Insights"
          subtitle={`${periodLabel} customer activity`}
        />

        <View
          style={styles.insightGrid}
        >
          <InsightCard
            icon="people-outline"
            title="Customers"
            value={String(
              customerIds.size
            )}
          />

          <InsightCard
            icon="repeat-outline"
            title="Transactions"
            value={String(
              filteredTransactions.length
            )}
          />

          <InsightCard
            icon="heart-outline"
            title="Savings"
            value={`₹${totalSavings.toFixed(
              2
            )}`}
          />
        </View>

        <SectionHeader
          icon="card-outline"
          title="Payment History"
          subtitle={`${periodLabel} payments`}
        />

        <View
          style={styles.box}
        >
          {filteredTransactions.length ===
          0 ? (
            <Empty
              icon="card-outline"
              text={`No payment history for ${periodLabel.toLowerCase()}.`}
            />
          ) : (
            filteredTransactions
              .slice()
              .sort(
                (a, b) =>
                  new Date(
                    dateOf(b) || 0
                  ).getTime() -
                  new Date(
                    dateOf(a) || 0
                  ).getTime()
              )
              .map(
                (
                  item,
                  index
                ) => (
                  <View
                    key={
                      item?.transactionId ||
                      item?.id ||
                      `payment-${index}`
                    }
                    style={[
                      styles.paymentRow,
                      index ===
                        filteredTransactions.length -
                          1 &&
                        styles.lastRow,
                    ]}
                  >
                    <View
                      style={
                        styles.paymentIcon
                      }
                    >
                      <Ionicons
                        name="card"
                        size={18}
                        color={
                          ORANGE
                        }
                      />
                    </View>

                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text
                        style={
                          styles.paymentTitle
                        }
                      >
                        {text(
                          item?.businessName,
                          item?.merchantName,
                          "Payment"
                        )}
                      </Text>

                      <Text
                        style={
                          styles.paymentDate
                        }
                      >
                        Transaction ID:{" "}
                        {text(
                          item?.transactionId,
                          item?.id
                        )}
                      </Text>

                      <Text
                        style={
                          styles.paymentDate
                        }
                      >
                        {formatDate(
                          dateOf(
                            item
                          )
                        )}
                      </Text>

                      <Text
                        style={
                          styles.paymentMethod
                        }
                      >
                        {paymentMethodOf(
                          item
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.paymentRight
                      }
                    >
                      <Text
                        style={
                          styles.paymentAmount
                        }
                      >
                        ₹
                        {amountOf(
                          item
                        ).toFixed(2)}
                      </Text>

                      {savingsOf(
                        item
                      ) > 0 ? (
                        <Text
                          style={
                            styles.savingsText
                          }
                        >
                          Saved ₹
                          {savingsOf(
                            item
                          ).toFixed(
                            2
                          )}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                )
              )
          )}
        </View>

        <SectionHeader
          icon="receipt-outline"
          title="Recent Orders"
          subtitle={`${periodLabel} orders`}
        />

        <View
          style={styles.box}
        >
          {filteredOrders.length ===
          0 ? (
            <Empty
              icon="receipt-outline"
              text={`No orders for ${periodLabel.toLowerCase()}.`}
            />
          ) : (
            filteredOrders
              .slice()
              .reverse()
              .slice(0, 10)
              .map(
                (
                  item,
                  index
                ) => {
                  const status =
                    text(
                      item?.status,
                      item?.orderStatus
                    );

                  return (
                    <View
                      key={
                        item?.orderId ||
                        item?.id ||
                        index
                      }
                      style={[
                        styles.orderRow,
                        index ===
                          Math.min(
                            filteredOrders.length,
                            10
                          ) -
                            1 &&
                          styles.lastRow,
                      ]}
                    >
                      <View
                        style={
                          styles.orderIcon
                        }
                      >
                        <Ionicons
                          name="receipt-outline"
                          size={18}
                          color={
                            ORANGE
                          }
                        />
                      </View>

                      <View
                        style={{
                          flex: 1,
                        }}
                      >
                        <Text
                          style={
                            styles.rowTitle
                          }
                        >
                          {text(
                            item?.customerName,
                            item?.customer?.name,
                            item?.customer?.customerName,
                            "Customer"
                          )}
                        </Text>

                        <Text
                          style={
                            styles.rowSub
                          }
                        >
                          {text(
                            item?.productName,
                            item?.product?.name,
                            "Order"
                          )}
                        </Text>

                        {dateOf(
                          item
                        ) ? (
                          <Text
                            style={
                              styles.rowSub
                            }
                          >
                            {formatDate(
                              dateOf(
                                item
                              )
                            )}
                          </Text>
                        ) : null}
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          getStatus(
                            item
                          ) ===
                            "completed" &&
                            styles.statusCompleted,
                          [
                            "cancelled",
                            "canceled",
                            "rejected",
                          ].includes(
                            getStatus(
                              item
                            )) &&
                            styles.statusCancelled,
                        ]}
                      >
                        <Text
                          style={
                            styles.statusText
                          }
                        >
                          {status}
                        </Text>
                      </View>
                    </View>
                  );
                }
              )
          )}
        </View>

        <SectionHeader
          icon="bar-chart-outline"
          title="Sales Report"
          subtitle={`Summary for ${periodLabel}`}
        />

        <View
          style={styles.reportCard}
        >
          <View
            style={styles.reportHeader}
          >
            <View>
              <Text
                style={
                  styles.reportLabel
                }
              >
                Total Revenue
              </Text>

              <Text
                style={
                  styles.reportValue
                }
              >
                ₹
                {totalSales.toFixed(
                  2
                )}
              </Text>
            </View>

            <View
              style={
                styles.reportIcon
              }
            >
              <Ionicons
                name="cash-outline"
                size={25}
                color="#FFF"
              />
            </View>
          </View>

          <View
            style={styles.reportDivider}
          />

          <View
            style={
              styles.reportStats
            }
          >
            <ReportItem
              label="Orders"
              value={String(
                filteredOrders.length
              )}
            />

            <ReportItem
              label="Payments"
              value={String(
                filteredTransactions.length
              )}
            />

            <ReportItem
              label="Savings"
              value={`₹${totalSavings.toFixed(
                2
              )}`}
            />
          </View>
        </View>

        <View
          style={styles.bottomSpace}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({
  icon,
  title,
  value,
  accent,
}: {
  icon: any;
  title: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View
      style={[
        styles.card,
        accent &&
          styles.cardAccent,
      ]}
    >
      <View
        style={styles.cardTop}
      >
        <View
          style={[
            styles.cardIcon,
            accent &&
              styles.cardIconAccent,
          ]}
        >
          <Ionicons
            name={icon}
            size={19}
            color={
              accent
                ? "#FFF"
                : ORANGE
            }
          />
        </View>

        {accent ? (
          <View
            style={styles.liveDot}
          >
            <View
              style={styles.dot}
            />

            <Text
              style={styles.liveText}
            >
              Active
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        style={[
          styles.cardTitle,
          accent &&
            styles.cardTitleAccent,
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.cardValue,
          accent &&
            styles.cardValueAccent,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: any;
  title: string;
  subtitle: string;
}) {
  return (
    <View
      style={styles.sectionHeader}
    >
      <View
        style={styles.sectionIcon}
      >
        <Ionicons
          name={icon}
          size={20}
          color={ORANGE}
        />
      </View>

      <View>
        <Text
          style={styles.sectionTitle}
        >
          {title}
        </Text>

        <Text
          style={styles.sectionSubtitle}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function StatusCard({
  icon,
  title,
  value,
}: {
  icon: any;
  title: string;
  value: number;
}) {
  return (
    <View
      style={styles.statusCard}
    >
      <View
        style={styles.statusIcon}
      >
        <Ionicons
          name={icon}
          size={21}
          color={ORANGE}
        />
      </View>

      <Text
        style={styles.statusTitle}
      >
        {title}
      </Text>

      <Text
        style={styles.statusValue}
      >
        {value}
      </Text>
    </View>
  );
}

function InventoryRow({
  icon,
  title,
  value,
  last,
}: {
  icon: any;
  title: string;
  value: number;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.inventoryRow,
        last &&
          styles.lastRow,
      ]}
    >
      <View
        style={styles.inventoryLeft}
      >
        <Ionicons
          name={icon}
          size={19}
          color={ORANGE}
        />

        <Text
          style={
            styles.inventoryTitle
          }
        >
          {title}
        </Text>
      </View>

      <Text
        style={styles.inventoryValue}
      >
        {value}
      </Text>
    </View>
  );
}

function InsightCard({
  icon,
  title,
  value,
}: {
  icon: any;
  title: string;
  value: string;
}) {
  return (
    <View
      style={styles.insightCard}
    >
      <View
        style={styles.insightIcon}
      >
        <Ionicons
          name={icon}
          size={20}
          color={ORANGE}
        />
      </View>

      <Text
        style={styles.insightTitle}
      >
        {title}
      </Text>

      <Text
        style={styles.insightValue}
      >
        {value}
      </Text>
    </View>
  );
}

function ReportItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={styles.reportItem}
    >
      <Text
        style={styles.reportItemLabel}
      >
        {label}
      </Text>

      <Text
        style={styles.reportItemValue}
      >
        {value}
      </Text>
    </View>
  );
}

function Empty({
  icon,
  text: message,
}: {
  icon: any;
  text: string;
}) {
  return (
    <View
      style={styles.empty}
    >
      <View
        style={styles.emptyIcon}
      >
        <Ionicons
          name={icon}
          size={25}
          color="#AAA"
        />
      </View>

      <Text
        style={styles.emptyText}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BG,
  },

  loadingCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  loadingTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: DARK,
  },

  loadingText: {
    marginTop: 5,
    color: MUTED,
  },

  content: {
    paddingTop: 22,
    paddingBottom: 40,
  },

  hero: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  heroMobile: {
    alignItems: "flex-start",
  },

  heroLeft: {
    flex: 1,
  },

  orangeLine: {
    width: 42,
    height: 4,
    borderRadius: 10,
    backgroundColor: ORANGE,
    marginBottom: 10,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: DARK,
    letterSpacing: -0.6,
  },

  mobileTitle: {
    fontSize: 24,
  },

  subtitle: {
    color: MUTED,
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },

  refreshButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0E5DC",
    marginLeft: 12,
  },

  errorBox: {
    backgroundColor: "#FFF4F3",
    borderWidth: 1,
    borderColor: "#FFD8D4",
    borderRadius: 17,
    padding: 14,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFE5E2",
    justifyContent: "center",
    alignItems: "center",
  },

  errorTitle: {
    fontWeight: "800",
    color: "#B42318",
  },

  errorText: {
    color: "#777",
    marginTop: 3,
    fontSize: 12,
  },

  retry: {
    color: ORANGE,
    fontWeight: "900",
    paddingHorizontal: 5,
  },

  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  filterTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: DARK,
  },

  filterSub: {
    color: MUTED,
    marginTop: 3,
    fontSize: 12,
  },

  filterScroll: {
    paddingBottom: 18,
    paddingRight: 15,
  },

  filterButton: {
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 22,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginRight: 8,
  },

  filterButtonActive: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },

  filterText: {
    color: "#555",
    fontWeight: "700",
    fontSize: 13,
  },

  filterTextActive: {
    color: "#FFF",
  },

  merchantCard: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 21,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 18,
  },

  merchantCardMobile: {
    padding: 17,
  },

  storeIcon: {
    width: 64,
    height: 64,
    borderRadius: 19,
    backgroundColor: "#FFF2E7",
    justifyContent: "center",
    alignItems: "center",
  },

  merchantName: {
    fontSize: 21,
    fontWeight: "900",
    color: DARK,
    marginBottom: 7,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 7,
  },

  infoText: {
    color: "#666",
    fontSize: 12,
    flexShrink: 1,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 13,
    marginBottom: 4,
  },

  gridMobile: {
    gap: 10,
  },

  card: {
    flexGrow: 1,
    flexBasis: 185,
    minWidth: 160,
    backgroundColor: "#FFF",
    borderRadius: 19,
    padding: 17,
    borderWidth: 1,
    borderColor: BORDER,
    minHeight: 135,
  },

  cardAccent: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 17,
  },

  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFF4EB",
    justifyContent: "center",
    alignItems: "center",
  },

  cardIconAccent: {
    backgroundColor:
      "rgba(255,255,255,0.20)",
  },

  liveDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFF",
  },

  liveText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },

  cardTitle: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
  },

  cardTitleAccent: {
    color: "#FFF",
    opacity: 0.9,
  },

  cardValue: {
    color: DARK,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6,
  },

  cardValueAccent: {
    color: "#FFF",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginTop: 25,
    marginBottom: 11,
  },

  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#FFF1E6",
    justifyContent: "center",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: DARK,
  },

  sectionSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 2,
  },

  box: {
    backgroundColor: "#FFF",
    borderRadius: 19,
    paddingHorizontal: 17,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: BORDER,
  },

  detailRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },

  detailLabel: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
  },

  detailValue: {
    color: DARK,
    fontSize: 13,
    fontWeight: "800",
  },

  transactionRow: {
    minHeight: 67,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },

  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#FFF3E9",
    justifyContent: "center",
    alignItems: "center",
  },

  rowTitle: {
    color: DARK,
    fontSize: 14,
    fontWeight: "800",
  },

  rowSub: {
    color: "#999",
    fontSize: 11,
    marginTop: 3,
  },

  rowAmount: {
    color: DARK,
    fontWeight: "900",
    fontSize: 14,
  },

  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 11,
  },

  statusCard: {
    flex: 1,
    minWidth: 145,
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },

  statusIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#FFF3E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 13,
  },

  statusTitle: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
  },

  statusValue: {
    color: DARK,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 4,
  },

  inventoryRow: {
    minHeight: 55,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },

  inventoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  inventoryTitle: {
    color: "#555",
    fontWeight: "700",
  },

  inventoryValue: {
    color: ORANGE,
    fontSize: 17,
    fontWeight: "900",
  },

  insightGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 11,
  },

  insightCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },

  insightIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#FFF3E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  insightTitle: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
  },

  insightValue: {
    color: DARK,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
  },

  paymentRow: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },

  paymentIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#FFF3E9",
    justifyContent: "center",
    alignItems: "center",
  },

  paymentTitle: {
    color: DARK,
    fontWeight: "900",
    fontSize: 14,
  },

  paymentDate: {
    color: "#999",
    fontSize: 10,
    marginTop: 3,
  },

  paymentMethod: {
    alignSelf: "flex-start",
    backgroundColor: "#F7F7F7",
    color: "#666",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    overflow: "hidden",
    fontSize: 10,
    marginTop: 4,
    fontWeight: "700",
  },

  paymentRight: {
    alignItems: "flex-end",
    marginLeft: 8,
  },

  paymentAmount: {
    color: DARK,
    fontSize: 14,
    fontWeight: "900",
  },

  savingsText: {
    color: "#1B8A45",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 4,
  },

  orderRow: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },

  orderIcon: {
    width: 41,
    height: 41,
    borderRadius: 13,
    backgroundColor: "#FFF3E9",
    justifyContent: "center",
    alignItems: "center",
  },

  statusBadge: {
    backgroundColor: "#FFF3E9",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
  },

  statusCompleted: {
    backgroundColor: "#EAF8EF",
  },

  statusCancelled: {
    backgroundColor: "#FFF0EF",
  },

  statusText: {
    color: ORANGE,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  reportCard: {
    backgroundColor: ORANGE,
    borderRadius: 22,
    padding: 20,
    marginTop: 2,
  },

  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  reportLabel: {
    color: "#FFF",
    opacity: 0.85,
    fontSize: 12,
    fontWeight: "700",
  },

  reportValue: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },

  reportIcon: {
    width: 51,
    height: 51,
    borderRadius: 16,
    backgroundColor:
      "rgba(255,255,255,0.20)",
    justifyContent: "center",
    alignItems: "center",
  },

  reportDivider: {
    height: 1,
    backgroundColor:
      "rgba(255,255,255,0.25)",
    marginVertical: 17,
  },

  reportStats: {
    flexDirection: "row",
    gap: 10,
  },

  reportItem: {
    flex: 1,
  },

  reportItemLabel: {
    color: "#FFF",
    opacity: 0.75,
    fontSize: 10,
  },

  reportItemValue: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4,
  },

  empty: {
    minHeight: 130,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },

  emptyIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 9,
  },

  emptyText: {
    color: "#999",
    fontSize: 12,
    textAlign: "center",
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  bottomSpace: {
    height: 20,
  },
});


