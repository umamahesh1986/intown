import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useRouter } from "expo-router";

export default function AdminProfile() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isMobile = width <= 768;

  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const storedPhone =
          await AsyncStorage.getItem("userPhone");

        const storedRole =
          await AsyncStorage.getItem("userRole");

        setPhone(storedPhone || "");
        setRole(storedRole || "ADMIN");
      } catch (error) {
        console.log("PROFILE LOAD ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const navigate = (route: string) => {
    setMenuOpen(false);
    router.push(route as any);
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        "userPhone",
        "userRole",
        "customerId",
        "merchantId",
      ]);

      setPhone("");
      setRole("");
      setMenuOpen(false);

      router.replace("/admin-login");
    } catch (error) {
      console.log("LOGOUT ERROR:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#F58220"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.layout}>

        {!isMobile && (
          <ProfileSidebar
            navigate={navigate}
            logout={logout}
          />
        )}

        {isMobile && menuOpen && (
          <>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.overlay}
              onPress={() => setMenuOpen(false)}
            />

            <View style={styles.drawer}>
              <View style={styles.drawerHeader}>

                <View style={styles.logo}>
                  <Text style={styles.logoText}>
                    IN
                  </Text>
                </View>

                <View style={styles.drawerBrandInfo}>
                  <Text style={styles.brand}>
                    INtown
                  </Text>

                  <Text style={styles.brandRole}>
                    ADMIN PANEL
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.close}
                  onPress={() => setMenuOpen(false)}
                >
                  <Text style={styles.closeText}>
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.drawerScroll}
                contentContainerStyle={
                  styles.drawerScrollContent
                }
                showsVerticalScrollIndicator={false}
              >
                <ProfileLinks
                  navigate={navigate}
                />
              </ScrollView>

              <TouchableOpacity
                style={styles.mobileLogout}
                onPress={logout}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutIcon}>
                  ↪
                </Text>

                <Text style={styles.logoutText}>
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.main}>

          {/* HEADER */}

          <View style={styles.header}>

            {isMobile && (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setMenuOpen(true)}
                activeOpacity={0.8}
              >
                <View style={styles.menuLine} />
                <View style={styles.menuLine} />
                <View style={styles.menuLine} />
              </TouchableOpacity>
            )}

            <View style={styles.headerTitle}>
              <Text style={styles.headerMain}>
                Admin Profile
              </Text>

              <Text style={styles.headerSub}>
                Manage your administrator account
              </Text>
            </View>

            <TouchableOpacity
              style={styles.headerAvatar}
              onPress={() =>
                navigate("/admin-profile")
              }
              activeOpacity={0.8}
            >
              <Text style={styles.headerAvatarText}>
                A
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              styles.pageScrollContent
            }
          >
            <View
              style={[
                styles.content,
                isMobile && styles.mobileContent,
              ]}
            >

              {/* PROFILE HEADER */}

              <View style={styles.profileCard}>

                <View style={styles.profileLeft}>

                  <View style={styles.profileAvatar}>
                    <Text
                      style={styles.profileAvatarText}
                    >
                      A
                    </Text>

                    <View
                      style={styles.onlineIndicator}
                    />
                  </View>

                  <View style={styles.profileInfo}>
                    <Text style={styles.profileLabel}>
                      ADMINISTRATOR
                    </Text>

                    <Text style={styles.profileName}>
                      Admin
                    </Text>

                    <Text
                      style={styles.profileDescription}
                    >
                      INtown Administrator Account
                    </Text>
                  </View>
                </View>

                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />

                  <Text style={styles.statusText}>
                    ACTIVE
                  </Text>
                </View>
              </View>

              {/* ACCOUNT INFORMATION */}

              <Text style={styles.sectionTitle}>
                Account Information
              </Text>

              <View style={styles.accountCard}>

                <InfoRow
                  icon="A"
                  label="Account Role"
                  value={
                    role
                      ? role.toUpperCase()
                      : "ADMIN"
                  }
                />

                <View style={styles.divider} />

                <InfoRow
                  icon="☎"
                  label="Phone Number"
                  value={phone || "-"}
                />

                <View style={styles.divider} />

                <InfoRow
                  icon="✓"
                  label="Account Status"
                  value="Active"
                />
              </View>

              {/* ADMIN ACCESS */}

              <Text style={styles.sectionTitle}>
                Administrator Access
              </Text>

              <View style={styles.accessCard}>

                <View style={styles.accessIcon}>
                  <Text style={styles.accessIconText}>
                    ✓
                  </Text>
                </View>

                <View style={styles.accessContent}>
                  <Text style={styles.accessTitle}>
                    Full Admin Access
                  </Text>

                  <Text
                    style={styles.accessDescription}
                  >
                    You can manage customers,
                    merchants, orders, sales and
                    transactions from the admin
                    dashboard.
                  </Text>
                </View>

                <View style={styles.secureBadge}>
                  <Text style={styles.secureText}>
                    SECURE
                  </Text>
                </View>
              </View>

              {/* ADMIN MODULES */}

              <Text style={styles.sectionTitle}>
                Admin Modules
              </Text>

              <View style={styles.modulesGrid}>

                <ModuleCard
                  icon="♧"
                  title="Customers"
                  description="Manage customers"
                  onPress={() =>
                    navigate("/admin-customer")
                  }
                />

                <ModuleCard
                  icon="♙"
                  title="Merchants"
                  description="Manage merchants"
                  onPress={() =>
                    navigate("/admin-merchant")
                  }
                />

                <ModuleCard
                  icon="◎"
                  title="Orders"
                  description="Manage orders"
                  onPress={() =>
                    navigate("/admin-orders")
                  }
                />

                <ModuleCard
                  icon="↗"
                  title="Sales"
                  description="View sales data"
                  onPress={() =>
                    navigate("/admin-sales")
                  }
                />

                <ModuleCard
                  icon="₹"
                  title="Transactions"
                  description="View transactions"
                  onPress={() =>
                    navigate("/admin-transactions")
                  }
                />

                <ModuleCard
                  icon="⌂"
                  title="Dashboard"
                  description="Open dashboard"
                  onPress={() =>
                    navigate("/admin-dashboard")
                  }
                />

              </View>

              {/* LOGOUT */}

              <Text style={styles.sectionTitle}>
                Account Actions
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.logoutCard}
                onPress={logout}
              >
                <View style={styles.logoutIconBox}>
                  <Text
                    style={styles.logoutIconBig}
                  >
                    ↪
                  </Text>
                </View>

                <View style={styles.logoutCardText}>
                  <Text style={styles.logoutTitle}>
                    Logout
                  </Text>

                  <Text
                    style={styles.logoutDescription}
                  >
                    Sign out from your administrator
                    account
                  </Text>
                </View>

                <Text style={styles.logoutArrow}>
                  →
                </Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* SIDEBAR */

function ProfileSidebar({
  navigate,
  logout,
}: {
  navigate: (route: string) => void;
  logout: () => void;
}) {
  return (
    <View style={styles.sidebar}>

      <View style={styles.sidebarBrand}>

        <View style={styles.logo}>
          <Text style={styles.logoText}>
            IN
          </Text>
        </View>

        <View>
          <Text style={styles.brand}>
            INtown
          </Text>

          <Text style={styles.brandRole}>
            ADMIN PANEL
          </Text>
        </View>
      </View>

      <ProfileLinks
        navigate={navigate}
      />

      <TouchableOpacity
        style={styles.sidebarLogout}
        onPress={logout}
        activeOpacity={0.8}
      >
        <Text style={styles.sidebarLogoutIcon}>
          ↪
        </Text>

        <Text style={styles.sidebarLogoutText}>
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* NAVIGATION */

function ProfileLinks({
  navigate,
}: {
  navigate: (route: string) => void;
}) {
  const links = [
    [
      "Dashboard",
      "⌂",
      "/admin-dashboard",
    ],
    [
      "Customers",
      "♧",
      "/admin-customer",
    ],
    [
      "Merchants",
      "♙",
      "/admin-merchant",
    ],
    [
      "Orders",
      "◎",
      "/admin-orders",
    ],
    [
      "Sales",
      "↗",
      "/admin-sales",
    ],
    [
      "Transactions",
      "₹",
      "/admin-transactions",
    ],
    [
      "Profile",
      "◉",
      "/admin-profile",
    ],
  ];

  return (
    <View style={styles.nav}>

      <Text style={styles.navLabel}>
        MAIN MENU
      </Text>

      {links.map(
        ([label, icon, route]) => {
          const active =
            label === "Profile";

          return (
            <TouchableOpacity
              key={label}
              style={[
                styles.navItem,
                active &&
                  styles.activeNavItem,
              ]}
              onPress={() =>
                navigate(route)
              }
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.navIcon,
                  active &&
                    styles.activeNavIcon,
                ]}
              >
                {icon}
              </Text>

              <Text
                style={[
                  styles.navText,
                  active &&
                    styles.activeNavText,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        }
      )}
    </View>
  );
}

/* INFO ROW */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>

      <View style={styles.infoIcon}>
        <Text style={styles.infoIconText}>
          {icon}
        </Text>
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text style={styles.infoValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

/* MODULE CARD */

function ModuleCard({
  icon,
  title,
  description,
  onPress,
}: {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.moduleCard}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={styles.moduleIcon}>
        <Text style={styles.moduleIconText}>
          {icon}
        </Text>
      </View>

      <View style={styles.moduleContent}>
        <Text style={styles.moduleTitle}>
          {title}
        </Text>

        <Text style={styles.moduleDescription}>
          {description}
        </Text>
      </View>

      <Text style={styles.moduleArrow}>
        →
      </Text>
    </TouchableOpacity>
  );
}

/* STYLES */

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
    borderRightColor: "#EEEEEE",
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
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

  drawerBrandInfo: {
    flex: 1,
    minWidth: 0,
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
    minHeight: 48,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    gap: 13,
  },

  activeNavItem: {
    backgroundColor: "#FFF1E6",
    borderLeftWidth: 3,
    borderLeftColor: "#F58220",
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

  sidebarLogout: {
    marginTop: "auto",
    height: 48,
    borderRadius: 13,
    backgroundColor: "#FFF1E6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    gap: 13,
  },

  sidebarLogoutIcon: {
    color: "#F58220",
    fontSize: 19,
    fontWeight: "900",
    width: 22,
    textAlign: "center",
  },

  sidebarLogoutText: {
    color: "#F58220",
    fontSize: 14,
    fontWeight: "800",
  },

  main: {
    flex: 1,
    minWidth: 0,
  },

  header: {
    minHeight: 82,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
  },

  headerTitle: {
    flex: 1,
  },

  headerMain: {
    color: "#202020",
    fontSize: 18,
    fontWeight: "900",
  },

  headerSub: {
    color: "#999999",
    fontSize: 11,
    marginTop: 3,
  },

  headerAvatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#F58220",
    justifyContent: "center",
    alignItems: "center",
  },

  headerAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
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

  pageScrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  content: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    padding: 28,
    paddingBottom: 60,
  },

  mobileContent: {
    padding: 15,
    paddingBottom: 45,
  },

  /* PROFILE CARD */

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  profileAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#F58220",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  profileAvatarText: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
  },

  onlineIndicator: {
    position: "absolute",
    right: 2,
    bottom: 5,
    width: 18,
    height: 18,
    borderRadius: 10,
    backgroundColor: "#2BB673",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  profileInfo: {
    marginLeft: 18,
    flex: 1,
    minWidth: 0,
  },

  profileLabel: {
    color: "#F58220",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  profileName: {
    color: "#202020",
    fontSize: 27,
    fontWeight: "900",
    marginTop: 4,
  },

  profileDescription: {
    color: "#888888",
    fontSize: 12,
    marginTop: 5,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4FFF8",
    borderWidth: 1,
    borderColor: "#D9F3E4",
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 18,
    marginLeft: 15,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#2BB673",
    marginRight: 7,
  },

  statusText: {
    color: "#27804B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  /* SECTION */

  sectionTitle: {
    color: "#202020",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 27,
    marginBottom: 11,
  },

  /* ACCOUNT */

  accountCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    paddingHorizontal: 19,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 17,
  },

  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#FFF1E6",
    justifyContent: "center",
    alignItems: "center",
  },

  infoIconText: {
    color: "#F58220",
    fontWeight: "900",
    fontSize: 17,
  },

  infoContent: {
    marginLeft: 13,
    flex: 1,
    minWidth: 0,
  },

  infoLabel: {
    color: "#999999",
    fontSize: 11,
  },

  infoValue: {
    color: "#222222",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },

  /* ACCESS */

  accessCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  accessIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FFF1E6",
    justifyContent: "center",
    alignItems: "center",
  },

  accessIconText: {
    color: "#F58220",
    fontSize: 18,
    fontWeight: "900",
  },

  accessContent: {
    flex: 1,
    marginLeft: 14,
    minWidth: 0,
  },

  accessTitle: {
    color: "#303030",
    fontSize: 14,
    fontWeight: "900",
  },

  accessDescription: {
    color: "#999999",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  secureBadge: {
    backgroundColor: "#F4FFF8",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginLeft: 10,
  },

  secureText: {
    color: "#27804B",
    fontSize: 9,
    fontWeight: "900",
  },

  /* MODULES */

  modulesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  moduleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    width: "32%",
    minWidth: 250,
  },

  moduleIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#FFF1E6",
    justifyContent: "center",
    alignItems: "center",
  },

  moduleIconText: {
    color: "#F58220",
    fontSize: 17,
    fontWeight: "900",
  },

  moduleContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },

  moduleTitle: {
    color: "#252525",
    fontSize: 13,
    fontWeight: "900",
  },

  moduleDescription: {
    color: "#999999",
    fontSize: 10,
    marginTop: 4,
  },

  moduleArrow: {
    color: "#F58220",
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 8,
  },

  /* LOGOUT */

  logoutCard: {
    minHeight: 72,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFD9C0",
    marginTop: 2,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  logoutIconBox: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#FFF1E6",
    justifyContent: "center",
    alignItems: "center",
  },

  logoutIconBig: {
    color: "#F58220",
    fontSize: 21,
    fontWeight: "900",
  },

  logoutCardText: {
    flex: 1,
    minWidth: 0,
  },

  logoutTitle: {
    color: "#333333",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 13,
  },

  logoutDescription: {
    color: "#999999",
    fontSize: 10,
    marginTop: 3,
    marginLeft: 13,
  },

  logoutArrow: {
    marginLeft: "auto",
    marginRight: 5,
    color: "#F58220",
    fontSize: 21,
    fontWeight: "800",
  },

  /* CENTER */

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F8FA",
  },

  /* MOBILE */

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 20,
  },

  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 285,
    maxWidth: "86%",
    backgroundColor: "#FFFFFF",
    zIndex: 30,
    paddingHorizontal: 18,
    paddingTop: 25,
    paddingBottom: 0,
    elevation: 20,
    flexDirection: "column",
  },

  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
    flexShrink: 0,
  },

  drawerScroll: {
    flex: 1,
    minHeight: 0,
  },

  drawerScrollContent: {
    paddingTop: 5,
    paddingBottom: 15,
  },

  close: {
    marginLeft: "auto",
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFF1E6",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  closeText: {
    color: "#F58220",
    fontSize: 25,
    lineHeight: 27,
  },

  mobileLogout: {
    height: 50,
    borderRadius: 13,
    backgroundColor: "#FFF1E6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
    flexShrink: 0,
  },

  logoutIcon: {
    color: "#F58220",
    fontSize: 19,
    fontWeight: "900",
  },

  logoutText: {
    color: "#F58220",
    fontSize: 14,
    fontWeight: "800",
  },
});