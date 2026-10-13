import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RecentSearchesProps {
  items: string[];
  onSelect: (term: string) => void;
  onClear: () => void;
}

export const RecentSearches = ({ items, onSelect, onClear }: RecentSearchesProps) => {
  if (items.length === 0) return null;
  return (
    <View style={styles.wrap} testID="recent-searches">
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="time-outline" size={15} color="#8A94A6" />
          <Text style={styles.title}>Recent searches</Text>
        </View>
        <TouchableOpacity onPress={onClear} hitSlop={8} testID="recent-searches-clear">
          <Text style={styles.clear}>Clear</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chips}>
        {items.map((term, i) => (
          <TouchableOpacity
            key={term}
            style={styles.chip}
            onPress={() => onSelect(term)}
            testID={`recent-search-chip-${i}`}
          >
            <Ionicons name="search" size={13} color="#FF8A00" />
            <Text style={styles.chipText} numberOfLines={1}>{term}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginTop: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 12, fontWeight: '700', color: '#8A94A6', letterSpacing: 0.6, textTransform: 'uppercase' },
  clear: { fontSize: 12, fontWeight: '700', color: '#FF8A00' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF7EE',
    borderWidth: 1,
    borderColor: '#FFE0BF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: '100%',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#1A1A1A', flexShrink: 1 },
});
