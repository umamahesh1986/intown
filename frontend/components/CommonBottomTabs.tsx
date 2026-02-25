import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const INTOWN_ORANGE = '#FF6600'; 

// Step 1: Define the shape of a single Tab
interface TabItem {
  name: string;
  icon: string;
  link: string;
}

// Step 2: Define the props for the component
interface CommonBottomTabsProps {
  tabs: TabItem[];
}

export default function CommonBottomTabs({ tabs }: CommonBottomTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.footerContainer}>
      {tabs.map((tab: TabItem) => {
        // Logic: Check if the current route matches the tab's link
        const isActive = pathname === tab.link;
        
        // Fix: Explicitly cast the icon name to any for Ionicons compatibility
        const iconName = (isActive ? tab.icon : `${tab.icon}-outline`) as any;

        return (
          <TouchableOpacity 
            key={tab.name} 
            style={styles.tabItem} 
            onPress={() => router.push(tab.link as any)}
          >
            <Ionicons 
              name={iconName} 
              size={24} 
              color={isActive ? INTOWN_ORANGE : '#666'} 
            />
            <Text style={[styles.tabLabel, { color: isActive ? INTOWN_ORANGE : '#666' }]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 85 : 65,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabItem: { alignItems: 'center', flex: 1 },
  tabLabel: { fontSize: 10, marginTop: 4, fontWeight: '700' }
});