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

export default function AdminMerchants() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMerchants = async () => {
    try {
      const response = await fetch(`${API}/IN/merchant/`);
      const data = await response.json();

      console.log("MERCHANTS:", data);

      const list = Array.isArray(data)
        ? data
        : data?.content ||
          data?.data ||
          data?.merchants ||
          [];

      setMerchants(list);
    } catch (error) {
      console.log("MERCHANT ERROR:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMerchants();
  }, []);

  const activeMerchants = merchants.filter(
    (merchant) => merchant.active !== false
  ).length;

  const inactiveMerchants =
    merchants.length - activeMerchants;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#f58220" />
        <Text>Loading merchants...</Text>
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
            loadMerchants();
          }}
        />
      }
    >
      <Text style={styles.title}>
        Merchant Management
      </Text>

      <View style={styles.grid}>
        <Stat
          title="Total Shops"
          value={merchants.length}
        />

        <Stat
          title="Active Shops"
          value={activeMerchants}
        />

        <Stat
          title="Inactive Shops"
          value={inactiveMerchants}
        />
      </View>

      {merchants.length === 0 ? (
        <View style={styles.empty}>
          <Text>No merchants found</Text>
        </View>
      ) : (
        merchants.map((merchant, index) => (
          <View
            style={styles.card}
            key={String(merchant.id || index)}
          >
            <View style={styles.shopIcon}>
              <Text style={styles.shopIconText}>
                🏪
              </Text>
            </View>

            <View style={styles.info}>
              <Text style={styles.name}>
                {merchant.shopName ||
                  merchant.businessName ||
                  merchant.contactName ||
                  "Merchant"}
              </Text>

              <Text style={styles.detail}>
                ID: {merchant.id || "-"}
              </Text>

              <Text style={styles.detail}>
                Phone:{" "}
                {merchant.phoneNumber ||
                  merchant.phone ||
                  "-"}
              </Text>

              <Text style={styles.detail}>
                Email: {merchant.email || "-"}
              </Text>

              <Text style={styles.detail}>
                Address:{" "}
                {merchant.address || "-"}
              </Text>
            </View>

            <View
              style={[
                styles.status,
                {
                  backgroundColor:
                    merchant.active === false
                      ? "#ffdddd"
                      : "#ddf7e5",
                },
              ]}
            >
              <Text
                style={{
                  color:
                    merchant.active === false
                      ? "#c62828"
                      : "#168a3b",
                  fontWeight: "700",
                  fontSize: 11,
                }}
              >
                {merchant.active === false
                  ? "INACTIVE"
                  : "ACTIVE"}
              </Text>
            </View>
          </View>
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
      <Text style={styles.statTitle}>{title}</Text>
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

  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 15,
  },

  stat: {
    width: "31%",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
  },

  statTitle: {
    color: "#777",
    fontSize: 12,
  },

  statValue: {
    fontSize: 23,
    fontWeight: "700",
    color: "#f58220",
    marginTop: 5,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: "row",
  },

  shopIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#fff1e5",
    justifyContent: "center",
    alignItems: "center",
  },

  shopIconText: {
    fontSize: 23,
  },

  info: {
    flex: 1,
    marginLeft: 12,
  },

  name: {
    fontSize: 17,
    fontWeight: "700",
  },

  detail: {
    color: "#777",
    marginTop: 4,
  },

  status: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 10,
  },

  empty: {
    backgroundColor: "#fff",
    padding: 30,
    alignItems: "center",
    borderRadius: 12,
  },
});

