import React, { useState } from 'react';
import { ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { MerchantPlansSection } from './MerchantPlansSection';

// Privilege page content for merchants / dual users
export const MerchantPlansView = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            setRefreshKey((k) => k + 1);
            setTimeout(() => setRefreshing(false), 600);
          }}
          colors={['#FF8A00']}
        />
      }
      testID="merchant-plans-view"
    >
      <MerchantPlansSection key={refreshKey} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 110 },
});
