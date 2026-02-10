import { View, Text, StyleSheet, Image, TouchableOpacity  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuthStore } from '../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';


export default function MemberCardScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [resolvedCustomerId, setResolvedCustomerId] = useState<string | null>(null);



  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
  id: number;
  name: string;
  contactName?: string;
  validity: string;
  image: string;
} | null>(null);

const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchProfile = async () => {
    try {
      const storedCustomerId = await AsyncStorage.getItem('customer_id');
      const candidateId =
        storedCustomerId ??
        String((user as any)?.customerId ?? (user as any)?.id ?? '').trim();
      const finalId = candidateId ? candidateId : null;
      setResolvedCustomerId(finalId);
      if (!finalId) return;

      const res = await fetch(
        `https://api.intownlocal.com/IN/customer/${finalId}/profile`
      );

      if (!res.ok) {
        throw new Error('Profile API failed');
      }

      const data = await res.json();

      console.log('Profile API response:', data);
      setProfile(data);

      // Check multiple possible image fields: s3ImageUrl array, image, profileImage
      const images = Array.isArray(data?.s3ImageUrl) ? data.s3ImageUrl : [];
      if (images.length > 0) {
        // Use the latest image from s3ImageUrl array
        setPhotoUri(images[images.length - 1]);
      } else if (data.image) {
        setPhotoUri(data.image);
      } else if (data.profileImage) {
        setPhotoUri(data.profileImage);
      } else {
        // Also try to load from AsyncStorage as fallback
        const storedImage = await AsyncStorage.getItem('user_profile_image');
        if (storedImage) {
          setPhotoUri(storedImage);
        }
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      // Try to load profile image from AsyncStorage as fallback
      try {
        const storedImage = await AsyncStorage.getItem('user_profile_image');
        if (storedImage) {
          setPhotoUri(storedImage);
        }
      } catch (storageErr) {
        console.error('AsyncStorage fallback error:', storageErr);
      }
    } finally {
      setLoading(false);
    }
  };

  fetchProfile();
}, [user?.id]);



  const plan =
    (user as any)?.membershipPlan === 'IT Max Plus'
      ? 'IT Max Plus'
      : 'IT Max';

  if (loading) {
  return (
    <SafeAreaView style={styles.container}>
      <Text>Loading customer card...</Text>
    </SafeAreaView>
  );
}

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
  style={styles.backButton}
  onPress={() => router.back()}
>
  <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
</TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.title}>INtown Privilege Access
</Text>

        <View style={styles.avatarWrap}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={36} color="#fff" />
            </View>
          )}
        </View>

        <Text style={styles.name}>
          {profile?.contactName ?? profile?.name ?? (user as any)?.name ?? 'Member'}
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>Customer ID</Text>
          <Text style={styles.value}>{resolvedCustomerId ?? profile?.id ?? '-'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Plan</Text>
          <Text style={styles.value}>INtown Customer</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Valid Till</Text>
          <Text style={styles.value}>
            {profile?.validity
              ? new Date(profile.validity).toDateString()
              : '-'}
          </Text>
</View>

      </View>
    </SafeAreaView>
  );
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    backgroundColor: '#FF6600',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    color: '#f5f6f9',
    fontSize: 14,
    marginBottom: 16,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: '#FF6600',
    marginBottom: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  row: {
    width: '100%',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#f6f6fb',
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  backButton: {
  position: 'absolute',
  top: 12,
  left: 12,
  zIndex: 10,
  padding: 6,
},

});
