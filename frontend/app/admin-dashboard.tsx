import React, {
  useCallback,
  useEffect,
  useMemo,
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
import { useRouter } from "expo-router";

import { INTOWN_API_BASE } from "../utils/api";

type FilterType =
  | "All Time"
  | "Today"
  | "This Week"
  | "This Month"
  | "This Year";

export default function AdminDashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isMobile = width <= 768;
  const isTablet = width > 768 && width <= 1100;

  const [customers, setCustomers] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  const [selectedFilter, setSelectedFilter] =
    useState<FilterType>("All Time");

  const load = async () => {
    try {
      const role =
        await AsyncStorage.getItem("userRole");

      if (role !== "ADMIN") {
        setLoading(false);
        return;
      }

      const API =
        INTOWN_API_BASE.replace(/\/$/, "");

      const [
        salesResponse,
        transactionsResponse,
      ] = await Promise.all([
        fetch(`${API}/IN/sales`),
        fetch(`${API}/IN/transactions/`),
      ]);

      if (salesResponse.ok) {
        const data =
          await salesResponse.json();

        setSales(
          Array.isArray(data)
            ? data
            : data?.data ||
              data?.content ||
              []
        );
      }

      if (transactionsResponse.ok) {
        const data =
          await transactionsResponse.json();

        setTransactions(
          Array.isArray(data)
            ? data
            : data?.data ||
              data?.transactions ||
              data?.content ||
              []
        );
      }
    } catch (error) {
      console.log(
        "ADMIN DASHBOARD ERROR:",
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

  const navigate = (route: string) => {
    setMenuOpen(false);
    router.push(route as any);
  };

  const getItemDate = (item: any) => {
    const value =
      item?.date ||
      item?.createdAt ||
      item?.createdDate ||
      item?.saleDate;

    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  const filteredSales = useMemo(() => {
    if (selectedFilter === "All Time") {
      return sales;
    }

    const now = new Date();

    return sales.filter((item) => {
      const itemDate = getItemDate(item);

      if (!itemDate) {
        return false;
      }

      if (selectedFilter === "Today") {
        return (
          itemDate.getFullYear() ===
            now.getFullYear() &&
          itemDate.getMonth() ===
            now.getMonth() &&
          itemDate.getDate() ===
            now.getDate()
        );
      }

      if (selectedFilter === "This Week") {
        const currentDay = now.getDay();

        const startOfWeek = new Date(now);

        startOfWeek.setDate(
          now.getDate() -
            currentDay
        );

        startOfWeek.setHours(
          0,
          0,
          0,
          0
        );

        const endOfWeek = new Date(
          startOfWeek
        );

        endOfWeek.setDate(
          startOfWeek.getDate() + 7
        );

        return (
          itemDate >= startOfWeek &&
          itemDate < endOfWeek
        );
      }

      if (selectedFilter === "This Month") {
        return (
          itemDate.getFullYear() ===
            now.getFullYear() &&
          itemDate.getMonth() ===
            now.getMonth()
        );
      }

      if (selectedFilter === "This Year") {
        return (
          itemDate.getFullYear() ===
          now.getFullYear()
        );
      }

      return true;
    });
  }, [sales, selectedFilter]);

  const filteredTransactions = useMemo(() => {
    if (selectedFilter === "All Time") {
      return transactions;
    }

    const now = new Date();

    return transactions.filter(
      (item) => {
        const itemDate =
          getItemDate(item);

        if (!itemDate) {
          return false;
        }

        if (selectedFilter === "Today") {
          return (
            itemDate.getFullYear() ===
              now.getFullYear() &&
            itemDate.getMonth() ===
              now.getMonth() &&
            itemDate.getDate() ===
              now.getDate()
          );
        }

        if (
          selectedFilter ===
          "This Week"
        ) {
          const currentDay =
            now.getDay();

          const startOfWeek =
            new Date(now);

          startOfWeek.setDate(
            now.getDate() -
              currentDay
          );

          startOfWeek.setHours(
            0,
            0,
            0,
            0
          );

          const endOfWeek =
            new Date(startOfWeek);

          endOfWeek.setDate(
            startOfWeek.getDate() +
              7
          );

          return (
            itemDate >= startOfWeek &&
            itemDate < endOfWeek
          );
        }

        if (
          selectedFilter ===
          "This Month"
        ) {
          return (
            itemDate.getFullYear() ===
              now.getFullYear() &&
            itemDate.getMonth() ===
              now.getMonth()
          );
        }

        if (
          selectedFilter ===
          "This Year"
        ) {
          return (
            itemDate.getFullYear() ===
            now.getFullYear()
          );
        }

        return true;
      }
    );
  }, [
    transactions,
    selectedFilter,
  ]);

  const totalSales =
    filteredSales.reduce(
      (sum, item) =>
        sum +
        Number(
          item?.amount ??
            item?.salesAmount ??
            item?.totalSales ??
            item?.totalAmount ??
            0
        ),
      0
    );

  const totalRevenue =
    filteredTransactions.reduce(
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

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingScreen}
      >
        <View
          style={styles.loadingCircle}
        >
          <ActivityIndicator
            size="large"
            color="#F58220"
          />
        </View>

        <Text
          style={styles.loadingText}
        >
          Loading dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.layout}>

        {!isMobile && (
          <Sidebar
            compact={isTablet}
            navigate={navigate}
          />
        )}

        {isMobile && menuOpen && (
          <>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.overlay}
              onPress={() =>
                setMenuOpen(false)
              }
            />

            <View
              style={styles.mobileDrawer}
            >
              <View
                style={styles.drawerHeader}
              >
                <View
                  style={styles.logo}
                >
                  <Text
                    style={styles.logoText}
                  >
                    IN
                  </Text>
                </View>

                <View>
                  <Text
                    style={
                      styles.drawerBrand
                    }
                  >
                    INtown
                  </Text>

                  <Text
                    style={
                      styles.drawerRole
                    }
                  >
                    ADMIN PANEL
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() =>
                    setMenuOpen(false)
                  }
                >
                  <Text
                    style={styles.closeText}
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              <MobileLinks
                navigate={navigate}
              />
            </View>
          </>
        )}

        <View style={styles.main}>

          <View style={styles.topBar}>
            {isMobile && (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() =>
                  setMenuOpen(true)
                }
              >
                <View
                  style={styles.menuLine}
                />
                <View
                  style={styles.menuLine}
                />
                <View
                  style={styles.menuLine}
                />
              </TouchableOpacity>
            )}

            <View
              style={styles.topTitleArea}
            >
              <Text
                style={styles.topTitle}
              >
                Admin Dashboard
              </Text>

              <Text
                style={styles.topSubtitle}
              >
                Platform overview
              </Text>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() =>
                navigate(
                  "/admin-profile"
                )
              }
            >
              <View
                style={styles.profileAvatar}
              >
                <Text
                  style={styles.avatarText}
                >
                  A
                </Text>
              </View>

              {!isMobile && (
                <View>
                  <Text
                    style={
                      styles.profileName
                    }
                  >
                    Admin
                  </Text>

                  <Text
                    style={
                      styles.profileRole
                    }
                  >
                    Administrator
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={[
              styles.content,
              isMobile &&
                styles.mobileContent,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor="#F58220"
              />
            }
          >

            <View
              style={styles.pageHeader}
            >
              <View>
                <Text
                  style={styles.overline}
                >
                  ADMINISTRATION
                </Text>

                <Text
                  style={styles.title}
                >
                  Dashboard Overview
                </Text>

                <Text
                  style={styles.subtitle}
                >
                  Monitor your platform
                  performance and activity
                </Text>
              </View>
            </View>

            {/* FILTERS */}

            <View
              style={styles.filters}
            >
              {[
                "All Time",
                "Today",
                "This Week",
                "This Month",
                "This Year",
              ].map((item) => {
                const active =
                  selectedFilter ===
                  item;

                return (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.8}
                    onPress={() =>
                      setSelectedFilter(
                        item as FilterType
                      )
                    }
                    style={[
                      styles.filter,
                      active &&
                        styles.activeFilter,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active &&
                          styles.activeFilterText,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* STATS */}

            <View style={styles.grid}>
              <Card
                title="Total Sales"
                value={`₹${totalSales.toFixed(
                  2
                )}`}
                icon="₹"
              />

              <Card
                title="Platform Revenue"
                value={`₹${totalRevenue.toFixed(
                  2
                )}`}
                icon="↗"
              />

              <Card
                title="Total Orders"
                value={String(
                  filteredSales.length
                )}
                icon="◎"
              />

              <Card
                title="Avg Order Value"
                value={
                  filteredSales.length
                    ? `₹${(
                        totalSales /
                        filteredSales.length
                      ).toFixed(2)}`
                    : "₹0"
                }
                icon="◈"
              />

              <Card
                title="Total Merchants"
                value={String(
                  merchants.length
                )}
                icon="♙"
              />

              <Card
                title="Total Customers"
                value={String(
                  customers.length
                )}
                icon="♧"
              />

              <Card
                title="New Customers"
                value="0"
                icon="+"
              />

              <Card
                title="Refund Amount"
                value="₹0"
                icon="↩"
              />
            </View>

            {/* SALES TREND */}

            <SectionTitle
              title="Sales Trend"
              subtitle={`${selectedFilter} sales performance`}
            />

            <View
              style={styles.chartCard}
            >
              <View
                style={styles.chartHeader}
              >
                <View>
                  <Text
                    style={
                      styles.chartValue
                    }
                  >
                    ₹
                    {totalSales.toFixed(
                      2
                    )}
                  </Text>

                  <Text
                    style={
                      styles.chartCaption
                    }
                  >
                    Sales for{" "}
                    {selectedFilter}
                  </Text>
                </View>

                <View
                  style={styles.orangeBadge}
                >
                  <Text
                    style={
                      styles.orangeBadgeText
                    }
                  >
                    {selectedFilter}
                  </Text>
                </View>
              </View>

              <WaveChart
                data={filteredSales}
              />
            </View>

            {/* ORDER STATUS */}

            <SectionTitle
              title="Order Status"
              subtitle="Order distribution"
            />

            <View
              style={styles.statusCardWrap}
            >
              <OrderStatus
                title="Completed"
                value={0}
                total={filteredSales.length}
                symbol="✓"
              />

              <OrderStatus
                title="Pending"
                value={0}
                total={filteredSales.length}
                symbol="◷"
              />

              <OrderStatus
                title="Cancelled"
                value={0}
                total={filteredSales.length}
                symbol="×"
              />

              <OrderStatus
                title="Refunded"
                value={0}
                total={filteredSales.length}
                symbol="↩"
              />
            </View>

            {/* ORDER BREAKDOWN */}

            <SectionTitle
              title="Order Breakdown"
            />

            <View style={styles.box}>
              <EmptyState text="Order breakdown data will appear here." />
            </View>

            {/* PRODUCTS */}

            <SectionTitle
              title="Top Selling Products"
            />

            <View style={styles.box}>
              <EmptyState text="Product sales data will appear here." />
            </View>

            {/* INVENTORY */}

            <SectionTitle
              title="Inventory Status"
            />

            <View
              style={styles.inventoryGrid}
            >
              <InventoryCard
                title="In Stock"
                value="0"
              />

              <InventoryCard
                title="Low Stock"
                value="0"
              />

              <InventoryCard
                title="Out of Stock"
                value="0"
              />
            </View>

            {/* RECENT ORDERS */}

            <SectionTitle
              title="Recent Orders"
              subtitle={`Recent activity for ${selectedFilter}`}
            />

            <View
              style={styles.recentBox}
            >
              <View
                style={styles.tableHeader}
              >
                <Text
                  style={
                    styles.tableHeaderText
                  }
                >
                  Customer
                </Text>

                <Text
                  style={
                    styles.tableHeaderText
                  }
                >
                  Product
                </Text>

                <Text
                  style={
                    styles.tableHeaderText
                  }
                >
                  Amount
                </Text>

                <Text
                  style={
                    styles.tableHeaderText
                  }
                >
                  Status
                </Text>
              </View>

              <View
                style={styles.emptyTable}
              >
                <Text
                  style={styles.emptyIcon}
                >
                  ◎
                </Text>

                <Text
                  style={styles.emptyTitle}
                >
                  No recent orders
                </Text>

                <Text
                  style={styles.emptyText}
                >
                  Recent order activity
                  will appear here.
                </Text>
              </View>
            </View>

          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Sidebar({
  compact,
  navigate,
}: {
  compact: boolean;
  navigate: (route: string) => void;
}) {
  return (
    <View
      style={[
        styles.sidebar,
        compact &&
          styles.compactSidebar,
      ]}
    >
      <View
        style={styles.sidebarBrand}
      >
        <View style={styles.logo}>
          <Text style={styles.logoText}>
            IN
          </Text>
        </View>

        {!compact && (
          <View>
            <Text style={styles.brand}>
              INtown
            </Text>

            <Text
              style={styles.brandRole}
            >
              ADMIN PANEL
            </Text>
          </View>
        )}
      </View>

      <SidebarLinks
        navigate={navigate}
        compact={compact}
      />

      {/* ONLY LOGOUT AT BOTTOM */}

      <TouchableOpacity
        style={styles.logoutSide}
        onPress={() => {
          AsyncStorage.multiRemove([
            "userPhone",
            "userRole",
            "customerId",
            "merchantId",
          ]).then(() =>
            navigate("/admin-login")
          );
        }}
      >
        <Text
          style={styles.logoutSideIcon}
        >
          ↪
        </Text>

        {!compact && (
          <Text
            style={styles.logoutSideText}
          >
            Logout
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function SidebarLinks({
  navigate,
  compact,
}: {
  navigate: (route: string) => void;
  compact: boolean;
}) {
  const links = [
    {
      label: "Dashboard",
      icon: "⌂",
      route: "/admin-dashboard",
    },
    {
      label: "Customers",
      icon: "♧",
      route: "/admin-customer",
    },
    {
      label: "Merchants",
      icon: "♙",
      route: "/admin-merchants",
    },
    {
      label: "Orders",
      icon: "◎",
      route: "/merchant-orders",
    },
    {
      label: "Sales",
      icon: "↗",
      route: "/sales-management",
    },
    {
      label: "Transactions",
      icon: "₹",
      route: "/admin-transactions",
    },
    {
      label: "Profile",
      icon: "◉",
      route: "/admin-profile",
    },
  ];

  return (
    <View style={styles.nav}>
      <Text style={styles.navLabel}>
        MAIN MENU
      </Text>

      {links.map((item) => {
        const active =
          item.label ===
          "Dashboard";

        return (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.navItem,
              active &&
                styles.activeNavItem,
              compact &&
                styles.compactNavItem,
            ]}
            onPress={() =>
              navigate(item.route)
            }
          >
            <Text
              style={[
                styles.navIcon,
                active &&
                  styles.activeNavIcon,
              ]}
            >
              {item.icon}
            </Text>

            {!compact && (
              <Text
                style={[
                  styles.navText,
                  active &&
                    styles.activeNavText,
                ]}
              >
                {item.label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MobileLinks({
  navigate,
}: {
  navigate: (route: string) => void;
}) {
  const links = [
    ["Dashboard", "⌂", "/admin-dashboard"],
    ["Customers", "♧", "/admin-customer"],
    ["Merchants", "♙", "/admin-merchants"],
    ["Orders", "◎", "/merchant-orders"],
    ["Sales", "↗", "/sales-management"],
    ["Transactions", "₹", "/admin-transactions"],
    ["Profile", "◉", "/admin-profile"],
  ];

  return (
    <View style={styles.mobileNav}>
      <Text style={styles.navLabel}>
        MAIN MENU
      </Text>

      {links.map(
        ([label, icon, route]) => (
          <TouchableOpacity
            key={label}
            style={[
              styles.navItem,
              label === "Dashboard" &&
                styles.activeNavItem,
            ]}
            onPress={() =>
              navigate(route)
            }
          >
            <Text
              style={[
                styles.navIcon,
                label === "Dashboard" &&
                  styles.activeNavIcon,
              ]}
            >
              {icon}
            </Text>

            <Text
              style={[
                styles.navText,
                label === "Dashboard" &&
                  styles.activeNavText,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        )
      )}

      <View
        style={styles.mobileLogoutArea}
      >
        <TouchableOpacity
          style={styles.mobileLogout}
          onPress={async () => {
            await AsyncStorage.multiRemove([
              "userPhone",
              "userRole",
              "customerId",
              "merchantId",
            ]);

            navigate("/admin-login");
          }}
        >
          <Text
            style={styles.logoutSideIcon}
          >
            ↪
          </Text>

          <Text
            style={styles.logoutSideText}
          >
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Card({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Text
            style={styles.cardIconText}
          >
            {icon}
          </Text>
        </View>

        <View
          style={styles.cardDot}
        />
      </View>

      <Text style={styles.cardTitle}>
        {title}
      </Text>

      <Text style={styles.cardValue}>
        {value}
      </Text>

      <View
        style={styles.cardLine}
      />
    </View>
  );
}

function WaveChart({
  data,
}: {
  data: any[];
}) {
  const values = data
    .slice(-10)
    .map((item) =>
      Number(
        item?.amount ??
          item?.salesAmount ??
          item?.totalSales ??
          item?.totalAmount ??
          0
      )
    );

  if (values.length === 0) {
    return (
      <View
        style={styles.waveEmpty}
      >
        <Text
          style={styles.waveEmptyText}
        >
          No sales data for this period
        </Text>
      </View>
    );
  }

  const max =
    Math.max(...values, 1);

  return (
    <View
      style={styles.waveContainer}
    >
      <View
        style={styles.waveGrid}
      >
        {[1, 2, 3, 4].map(
          (item) => (
            <View
              key={item}
              style={styles.gridLine}
            />
          )
        )}

        <View
          style={styles.waveArea}
        >
          {values.map(
            (value, index) => {
              const height =
                Math.max(
                  15,
                  (value / max) *
                    135
                );

              return (
                <View
                  key={index}
                  style={
                    styles.wavePointColumn
                  }
                >
                  <View
                    style={[
                      styles.wavePoint,
                      {
                        height,
                      },
                    ]}
                  >
                    <View
                      style={
                        styles.pointDot
                      }
                    />
                  </View>
                </View>
              );
            }
          )}
        </View>
      </View>

      <View
        style={styles.waveBottom}
      >
        {values.map(
          (_, index) => (
            <Text
              key={index}
              style={
                styles.waveLabel
              }
            >
              {index + 1}
            </Text>
          )
        )}
      </View>
    </View>
  );
}

function OrderStatus({
  title,
  value,
  total,
  symbol,
}: {
  title: string;
  value: number;
  total: number;
  symbol: string;
}) {
  const percentage =
    total > 0
      ? Math.round(
          (value / total) * 100
        )
      : 0;

  return (
    <View
      style={styles.orderStatusCard}
    >
      <View
        style={styles.statusRing}
      >
        <View
          style={styles.statusRingInner}
        >
          <Text
            style={styles.statusSymbol}
          >
            {symbol}
          </Text>

          <Text
            style={styles.statusNumber}
          >
            {value}
          </Text>
        </View>
      </View>

      <Text
        style={styles.statusTitle}
      >
        {title}
      </Text>

      <Text
        style={styles.statusPercent}
      >
        {percentage}%
      </Text>
    </View>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View
      style={styles.sectionHeader}
    >
      <View>
        <Text
          style={styles.section}
        >
          {title}
        </Text>

        {subtitle && (
          <Text
            style={
              styles.sectionSubtitle
            }
          >
            {subtitle}
          </Text>
        )}
      </View>

      <View
        style={styles.sectionAccent}
      />
    </View>
  );
}

function InventoryCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <View
      style={styles.inventoryCard}
    >
      <Text
        style={styles.inventoryValue}
      >
        {value}
      </Text>

      <Text
        style={styles.inventoryTitle}
      >
        {title}
      </Text>
    </View>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <View
      style={styles.emptyState}
    >
      <View
        style={styles.emptyCircle}
      >
        <Text
          style={styles.emptyCircleText}
        >
          i
        </Text>
      </View>

      <Text
        style={styles.emptyStateText}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  layout: {
    flex: 1,
    flexDirection: "row",
  },

  sidebar: {
    width: 250,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#ECECEC",
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
  },

  compactSidebar: {
    width: 82,
    paddingHorizontal: 10,
  },

  sidebarBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 6,
    marginBottom: 35,
  },

  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F58220",
    justifyContent: "center",
    alignItems: "center",
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },

  brand: {
    fontSize: 21,
    fontWeight: "900",
    color: "#171717",
  },

  brandRole: {
    color: "#F58220",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 2,
  },

  nav: {
    gap: 5,
  },

  navLabel: {
    color: "#AAAAAA",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 12,
  },

  navItem: {
    height: 48,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    gap: 13,
  },

  compactNavItem: {
    justifyContent: "center",
    paddingHorizontal: 0,
  },

  activeNavItem: {
    backgroundColor: "#FFF1E6",
  },

  navIcon: {
    width: 22,
    textAlign: "center",
    fontSize: 18,
    color: "#858585",
  },

  activeNavIcon: {
    color: "#F58220",
  },

  navText: {
    color: "#606060",
    fontSize: 14,
    fontWeight: "600",
  },

  activeNavText: {
    color: "#F58220",
    fontWeight: "800",
  },

  logoutSide: {
    height: 48,
    borderRadius: 13,
    backgroundColor: "#FFF1E6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    gap: 13,
    marginTop: "auto",
  },

  logoutSideIcon: {
    width: 22,
    textAlign: "center",
    color: "#F58220",
    fontSize: 19,
    fontWeight: "900",
  },

  logoutSideText: {
    color: "#F58220",
    fontSize: 14,
    fontWeight: "800",
  },

  main: {
    flex: 1,
    minWidth: 0,
  },

  topBar: {
    minHeight: 82,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
  },

  topTitleArea: {
    flex: 1,
  },

  topTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#202020",
  },

  topSubtitle: {
    fontSize: 11,
    color: "#999",
    marginTop: 3,
  },

  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 5,
    paddingRight: 10,
    borderRadius: 14,
    backgroundColor: "#FAFAFA",
  },

  profileAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F58220",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  profileName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#222",
  },

  profileRole: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },

  content: {
    padding: 28,
    paddingBottom: 60,
    maxWidth: 1500,
    width: "100%",
    alignSelf: "center",
  },

  mobileContent: {
    padding: 15,
    paddingBottom: 45,
  },

  pageHeader: {
    backgroundColor: "#FFFFFF",
    borderRadius: 23,
    padding: 25,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    marginBottom: 17,
  },

  overline: {
    color: "#F58220",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginBottom: 7,
  },

  title: {
    color: "#202020",
    fontSize: 28,
    fontWeight: "900",
  },

  subtitle: {
    color: "#888",
    fontSize: 13,
    marginTop: 6,
  },

  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },

  filter: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },

  activeFilter: {
    backgroundColor: "#F58220",
    borderColor: "#F58220",
  },

  filterText: {
    color: "#777",
    fontSize: 12,
    fontWeight: "700",
  },

  activeFilterText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 25,
  },

  card: {
    flexGrow: 1,
    flexBasis: 210,
    minWidth: 180,
    backgroundColor: "#FFFFFF",
    padding: 19,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFF1E6",
    justifyContent: "center",
    alignItems: "center",
  },

  cardIconText: {
    color: "#F58220",
    fontSize: 17,
    fontWeight: "900",
  },

  cardDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F58220",
  },

  cardTitle: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 17,
  },

  cardValue: {
    color: "#222",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 5,
  },

  cardLine: {
    width: 32,
    height: 3,
    borderRadius: 3,
    backgroundColor: "#F58220",
    marginTop: 13,
  },

  sectionHeader: {
    marginTop: 12,
    marginBottom: 10,
  },

  section: {
    color: "#202020",
    fontSize: 20,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: "#999",
    fontSize: 11,
    marginTop: 3,
  },

  sectionAccent: {
    width: 30,
    height: 3,
    borderRadius: 3,
    backgroundColor: "#F58220",
    marginTop: 8,
  },

  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    padding: 20,
    marginBottom: 22,
  },

  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  chartValue: {
    color: "#202020",
    fontSize: 24,
    fontWeight: "900",
  },

  chartCaption: {
    color: "#999",
    fontSize: 11,
    marginTop: 3,
  },

  orangeBadge: {
    backgroundColor: "#FFF1E6",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },

  orangeBadgeText: {
    color: "#F58220",
    fontSize: 10,
    fontWeight: "900",
  },

  waveContainer: {
    height: 205,
    marginTop: 5,
  },

  waveGrid: {
    height: 165,
    position: "relative",
    justifyContent: "flex-end",
  },

  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },

  waveArea: {
    height: 150,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    overflow: "hidden",
  },

  wavePointColumn: {
    flex: 1,
    height: 150,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  wavePoint: {
    width: "75%",
    maxWidth: 45,
    minWidth: 10,
    backgroundColor: "#FFE4D0",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: "relative",
  },

  pointDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#F58220",
    position: "absolute",
    top: -4,
    alignSelf: "center",
  },

  waveBottom: {
    height: 35,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },

  waveLabel: {
    color: "#B0B0B0",
    fontSize: 9,
  },

  waveEmpty: {
    height: 165,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFDFC",
    borderRadius: 15,
  },

  waveEmptyText: {
    color: "#999",
    fontSize: 12,
  },

  statusCardWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 13,
    marginBottom: 22,
  },

  orderStatusCard: {
    flexGrow: 1,
    flexBasis: 180,
    minWidth: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    padding: 19,
    alignItems: "center",
  },

  statusRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 7,
    borderColor: "#F58220",
    backgroundColor: "#FFF8F3",
    justifyContent: "center",
    alignItems: "center",
  },

  statusRingInner: {
    alignItems: "center",
    justifyContent: "center",
  },

  statusSymbol: {
    color: "#F58220",
    fontSize: 13,
    fontWeight: "900",
  },

  statusNumber: {
    color: "#222",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 1,
  },

  statusTitle: {
    color: "#444",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 12,
  },

  statusPercent: {
    color: "#F58220",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 3,
  },

  box: {
    backgroundColor: "#FFFFFF",
    padding: 19,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    marginBottom: 22,
  },

  inventoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 13,
    marginBottom: 22,
  },

  inventoryCard: {
    flexGrow: 1,
    flexBasis: 200,
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  inventoryValue: {
    color: "#F58220",
    fontSize: 27,
    fontWeight: "900",
  },

  inventoryTitle: {
    color: "#777",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },

  recentBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    overflow: "hidden",
  },

  tableHeader: {
    minHeight: 55,
    backgroundColor: "#FFF8F3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },

  tableHeaderText: {
    color: "#777",
    fontSize: 11,
    fontWeight: "800",
  },

  emptyTable: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 45,
  },

  emptyIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#FFF1E6",
    color: "#F58220",
    textAlign: "center",
    paddingTop: 11,
    fontSize: 20,
  },

  emptyTitle: {
    color: "#555",
    fontWeight: "800",
    marginTop: 12,
  },

  emptyText: {
    color: "#999",
    fontSize: 11,
    marginTop: 5,
  },

  emptyState: {
    minHeight: 90,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF1E6",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCircleText: {
    color: "#F58220",
    fontWeight: "900",
  },

  emptyStateText: {
    color: "#999",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },

  loadingCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF1E6",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: "#777",
    fontSize: 13,
    fontWeight: "600",
  },

  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFF1E6",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    marginRight: 12,
  },

  menuLine: {
    width: 19,
    height: 2,
    backgroundColor: "#F58220",
    borderRadius: 2,
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 20,
  },

  mobileDrawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 285,
    backgroundColor: "#FFFFFF",
    zIndex: 30,
    paddingHorizontal: 18,
    paddingTop: 25,
    elevation: 20,
  },

  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },

  drawerBrand: {
    color: "#222",
    fontSize: 20,
    fontWeight: "900",
  },

  drawerRole: {
    color: "#F58220",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 2,
  },

  closeButton: {
    marginLeft: "auto",
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFF1E6",
    justifyContent: "center",
    alignItems: "center",
  },

  closeText: {
    color: "#F58220",
    fontSize: 25,
    lineHeight: 27,
  },

  mobileNav: {
    flex: 1,
  },

  mobileLogoutArea: {
    marginTop: "auto",
    paddingBottom: 20,
  },

  mobileLogout: {
    height: 50,
    borderRadius: 13,
    backgroundColor: "#FFF1E6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
  },
});

