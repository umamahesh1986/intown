import { View, Text, StyleSheet, Image } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        const userType = user?.userType;
        if (userType === 'member') {
          router.replace('/member-dashboard');
        } else if (userType === 'merchant') {
          router.replace('/merchant-dashboard');
        } else {
          router.replace('/user-dashboard');
        }
      } else {
        // Go directly to login page, skip location
        router.replace('/login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/images/intown-logo.jpg')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
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
  logoImage: {
    width: 250,
    height: 100,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
  },
});