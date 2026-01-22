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

  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('member_photo_uri');
      if (saved) setPhotoUri(saved);
    })();
  }, []);

  const plan =
    (user as any)?.membershipPlan === 'IT Max Plus'
      ? 'IT Max Plus'
      : 'IT Max';

  const memberId = (user as any)?.membershipId || 'ITM-9876-1234';
  const validTill = (user as any)?.membershipValidTill || '31 Dec 2025';

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

        <Text style={styles.name}>{user?.name ?? 'Member'}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Member ID</Text>
          <Text style={styles.value}>{memberId}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Plan</Text>
          <Text style={styles.value}>{plan}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Valid Till</Text>
          <Text style={styles.value}>{validTill}</Text>
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
