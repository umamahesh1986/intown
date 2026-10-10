import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface StatItem {
  label: string;
  value: number;
}

interface SavingsStatCardsProps {
  items: StatItem[];
  testIDPrefix?: string;
}

const COUNT_DURATION = 1100;

const useCountUp = (target: number) => {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const id = anim.addListener(({ value }) => setDisplay(Math.round(value)));
    Animated.timing(anim, {
      toValue: Math.round(target ?? 0),
      duration: COUNT_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [target, anim]);
  return display;
};

const StatCard = ({ item, testIDPrefix }: { item: StatItem; testIDPrefix: string }) => {
  const key = item.label.toLowerCase();
  const display = useCountUp(item.value);
  return (
    <View style={cardStyles.card} testID={`${testIDPrefix}-card-${key}`}>
      <View style={cardStyles.glowTop} />
      <View style={cardStyles.glowBottom} />
      <Text style={cardStyles.label}>{item.label.toUpperCase()}</Text>
      <View style={cardStyles.valueRow}>
        <Text style={cardStyles.rupee}>₹</Text>
        <Text style={cardStyles.value} testID={`${testIDPrefix}-value-${key}`}>
          {display.toLocaleString('en-IN')}
        </Text>
      </View>
    </View>
  );
};

export const SavingsStatCards = ({ items, testIDPrefix = 'stat' }: SavingsStatCardsProps) => (
  <View style={cardStyles.row} testID={`${testIDPrefix}-cards`}>
    {items.map((item) => (
      <StatCard key={item.label.toLowerCase()} item={item} testIDPrefix={testIDPrefix} />
    ))}
  </View>
);

const cardStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 14,
  },
  card: {
    flex: 1,
    backgroundColor: '#FF7A00',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    overflow: 'hidden',
    shadowColor: '#FF7A00',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  glowTop: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -34,
    left: -16,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,196,120,0.35)',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: 8,
    gap: 2,
  },
  rupee: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  value: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', lineHeight: 30 },
});
