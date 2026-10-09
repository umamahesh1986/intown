import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getOfferAnalytics, OfferAnalytics } from '../utils/offerAnalytics';

interface Props {
  merchantId: string | null;
  refreshKey?: string | number;
}

// "This week" special-offer stats for the merchant (views, taps, unique customers) + 7-day mini bars.
export const OfferAnalyticsCard = ({ merchantId, refreshKey }: Props) => {
  const [data, setData] = useState<OfferAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantId) return;
    let alive = true;
    setLoading(true);
    getOfferAnalytics(merchantId, 7).then((d) => {
      if (!alive) return;
      setData(d);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [merchantId, refreshKey]);

  if (!merchantId) return null;

  const maxBar = Math.max(1, ...(data?.byDay || []).map((d) => d.views + d.taps));
  const stat = (icon: any, value: number, label: string, testID: string) => (
    <View style={styles.stat}>
      <Ionicons name={icon} size={16} color="#2E7D32" />
      <Text style={styles.statValue} testID={testID}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.box} testID="offer-analytics-card">
      <View style={styles.headerRow}>
        <Text style={styles.title}>This week</Text>
        <Text style={styles.sub}>Special offer performance · last 7 days</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color="#2E7D32" style={{ marginVertical: 12 }} />
      ) : !data ? (
        <Text style={styles.unavailable} testID="offer-analytics-unavailable">Analytics unavailable right now.</Text>
      ) : (
        <>
          <View style={styles.statsRow}>
            {stat('eye-outline', data.views, 'Views', 'offer-analytics-views')}
            {stat('hand-left-outline', data.taps, 'Taps', 'offer-analytics-taps')}
            {stat('people-outline', data.uniqueViewers, 'Customers', 'offer-analytics-customers')}
          </View>
          <View style={styles.bars}>
            {data.byDay.map((d) => {
              const total = d.views + d.taps;
              const h = Math.max(3, Math.round((total / maxBar) * 36));
              const day = new Date(`${d.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'narrow' });
              return (
                <View key={d.date} style={styles.barCol}>
                  <View style={[styles.bar, { height: h, opacity: total ? 1 : 0.25 }]} />
                  <Text style={styles.barLabel}>{day}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  box: { backgroundColor: '#F1F8E9', borderRadius: 12, padding: 14, marginTop: 10 },
  headerRow: { marginBottom: 10 },
  title: { fontSize: 14, fontWeight: '800', color: '#1B5E20' },
  sub: { fontSize: 11, color: '#558B2F', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: '#FFF', borderRadius: 10, paddingVertical: 10, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  statLabel: { fontSize: 11, color: '#777' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 4 },
  barCol: { alignItems: 'center', gap: 4, flex: 1 },
  bar: { width: 14, borderRadius: 4, backgroundColor: '#FF8A00' },
  barLabel: { fontSize: 10, color: '#888' },
  unavailable: { fontSize: 12, color: '#777', paddingVertical: 8 },
});
