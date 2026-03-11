import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INTOWN_ORANGE = '#FF8A00'; 

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

// Define dashboard routes for each user type
const HOME_ROUTES: Record<string, string> = {
  user: '/user-dashboard',
  member: '/member-dashboard',
  merchant: '/merchant-dashboard',
  dual: '/dual-dashboard',
};

// All dashboard paths for checking if Home is active
const DASHBOARD_PATHS = [
  '/user-dashboard',
  '/member-dashboard',
  '/merchant-dashboard',
  '/dual-dashboard',
];

const LAST_DASHBOARD_KEY = 'last_visited_dashboard';

export default function CommonBottomTabs({ tabs }: CommonBottomTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [lastDashboard, setLastDashboard] = useState<string | null>(null);

  // Load last visited dashboard on mount
  useEffect(() => {
    const loadLastDashboard = async () => {
      try {
        const saved = await AsyncStorage.getItem(LAST_DASHBOARD_KEY);
        if (saved) {
          setLastDashboard(saved);
        }
      } catch (error) {
        console.error('Error loading last dashboard:', error);
      }
    };
    loadLastDashboard();
  }, []);

  // Save current dashboard when on a dashboard page
  useEffect(() => {
    if (DASHBOARD_PATHS.includes(pathname)) {
      const saveDashboard = async () => {
        try {
          await AsyncStorage.setItem(LAST_DASHBOARD_KEY, pathname);
          setLastDashboard(pathname);
        } catch (error) {
          console.error('Error saving dashboard:', error);
        }
      };
      saveDashboard();
    }
  }, [pathname]);

  // Get the appropriate home route based on user type or last visited dashboard
  const getHomeRoute = (): string => {
    // First check if we have a last visited dashboard
    if (lastDashboard && DASHBOARD_PATHS.includes(lastDashboard)) {
      return lastDashboard;
    }

    // Check user type from auth store
    const userType = user?.userType?.toLowerCase();
    
    // Handle different user type variations
    if (userType === 'dual' || userType === 'in_dual' || userType === 'dual_user') {
      return '/dual-dashboard';
    }
    if (userType === 'merchant' || userType === 'in_merchant') {
      return '/merchant-dashboard';
    }
    if (userType === 'member' || userType === 'in_member' || userType === 'customer' || userType === 'in_customer') {
      return '/member-dashboard';
    }
    
    // Default to user-dashboard
    return '/user-dashboard';
  };

  // Check if current path is any dashboard (for Home tab active state)
  const isOnDashboard = DASHBOARD_PATHS.includes(pathname);

  const handleTabPress = (tab: TabItem) => {
    if (tab.name === 'Home') {
      // For Home tab, route based on user type
      const homeRoute = getHomeRoute();
      router.push(homeRoute as any);
    } else {
      // For other tabs, use the defined link
      router.push(tab.link as any);
    }
  };

  const isTabActive = (tab: TabItem): boolean => {
    if (tab.name === 'Home') {
      // Home is active if we're on any dashboard
      return isOnDashboard;
    }
    return pathname === tab.link;
  };

  return (
    <View style={styles.footerContainer}>
      {tabs.map((tab: TabItem) => {
        const isActive = isTabActive(tab);
        
        // Fix: Explicitly cast the icon name to any for Ionicons compatibility
        const iconName = (isActive ? tab.icon : `${tab.icon}-outline`) as any;

        return (
          <TouchableOpacity 
            key={tab.name} 
            style={styles.tabItem} 
            onPress={() => handleTabPress(tab)}
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
