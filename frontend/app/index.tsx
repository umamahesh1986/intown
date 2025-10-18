import { View, Text, StyleSheet, Image } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Simulate splash screen for 2 seconds
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        // Redirect based on user type
        const userType = user?.userType;
        if (userType === 'member') {
          router.replace('/dashboard'); // Member dashboard (to be created)
        } else if (userType === 'merchant') {
          router.replace('/dashboard'); // Merchant dashboard (to be created)
        } else {
          router.replace('/user-dashboard'); // User dashboard
        }
      } else {
        router.replace('/location');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>INtown</Text>
        <Text style={styles.tagline}>Local Savings Made Easy</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6600',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
  },
});