import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuthStore } from '../store/authStore';
import { Picker } from '@react-native-picker/picker';


export default function Account() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [pendingImageBase64, setPendingImageBase64] = useState<string | null>(null);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const [storedImage, storedUserType, storedCustomerImages] = await Promise.all([
          AsyncStorage.getItem('user_profile_image'),
          AsyncStorage.getItem('user_type'),
          AsyncStorage.getItem('customer_profile_images'),
        ]);
        if (storedImage) {
          setProfileImage(storedImage);
        }
        if (storedUserType) {
          setUserType(storedUserType);
        }
        if (storedCustomerImages) {
          try {
            const parsedImages = JSON.parse(storedCustomerImages);
            if (Array.isArray(parsedImages) && parsedImages.length > 0) {
              const latestImage = parsedImages[parsedImages.length - 1];
              setProfileImage(latestImage);
              await AsyncStorage.setItem('user_profile_image', latestImage);
            }
          } catch {
            // ignore parse issues
          }
        }
      } catch (error) {
        console.error('Error loading profile image:', error);
      }
    };

    loadProfileImage();
  }, []);

 

  const onSave = () => {
  updateProfile({ name } as any);
  setEditing(false);
};

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  const requestMediaPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission required', 'Camera permission is required to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setPendingImageUri(asset.uri);
      setPendingImageBase64(asset.base64 ?? null);
    }
  };

  const handlePickImage = async () => {
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) {
      Alert.alert('Permission required', 'Gallery permission is required to pick a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setPendingImageUri(asset.uri);
      setPendingImageBase64(asset.base64 ?? null);
    }
  };

  const fetchLatestProfileImage = async (isMerchant: boolean, inTownId: string | number) => {
    const queryParam = isMerchant ? 'merchantId' : 'customerId';
    const res = await fetch(`https://api.intownlocal.com/IN/s3?${queryParam}=${inTownId}`);
    if (!res.ok) {
      throw new Error(`Image fetch failed: ${res.status}`);
    }
    const data = await res.json();
    const images = Array.isArray(data?.s3ImageUrl) ? data.s3ImageUrl : [];
    if (!images.length) {
      throw new Error('No image URL returned from image fetch.');
    }
    // Use the most recently uploaded image when updating profile
    const latestImage = images[images.length - 1];
    await AsyncStorage.setItem('user_profile_image', latestImage);
    if (isMerchant) {
      await AsyncStorage.setItem('merchant_profile_image', latestImage);
      await AsyncStorage.setItem('merchant_shop_images', JSON.stringify(images));
    }
    setProfileImage(latestImage);
  };

  const buildImageFormData = async (uri: string, fileName: string) => {
    const formData = new FormData();
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('file', blob, fileName);
    } else {
      formData.append(
        'file',
        {
          uri,
          name: fileName,
          type: 'image/jpeg',
        } as any
      );
    }
    return formData;
  };

  const handleUpdateProfileImage = async () => {
    if (!pendingImageUri) return;
    setIsSavingImage(true);
    try {
      const lowerUserType = (userType ?? '').toLowerCase();
      const isMerchant = lowerUserType.includes('merchant');
      const userTypeParam = isMerchant ? 'IN_MERCHANT' : 'IN_CUSTOMER';
      const inTownId =
        (isMerchant
          ? await AsyncStorage.getItem('merchant_id')
          : await AsyncStorage.getItem('customer_id')) ??
        (await AsyncStorage.getItem('customer_id')) ??
        (await AsyncStorage.getItem('merchant_id')) ??
        user?.id ??
        null;

      if (!inTownId) {
        throw new Error('Missing user id for image upload.');
      }

      const uploadUrl = `https://api.intownlocal.com/IN/s3/upload?userType=${userTypeParam}&inTownId=${inTownId}`;
      const fileName = `${isMerchant ? 'merchant' : 'customer'}_${inTownId}_${Date.now()}.jpg`;
      const formData = await buildImageFormData(pendingImageUri, fileName);

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });
      const raw = await res.text();
      let parsed: any = raw;
      try {
        parsed = raw ? JSON.parse(raw) : raw;
      } catch {
        // keep raw string if not JSON
      }
      if (!res.ok) {
        throw new Error(typeof parsed === 'string' ? parsed : JSON.stringify(parsed));
      }
      const uploadedUrl = Array.isArray(parsed)
        ? parsed[parsed.length - 1]?.url
        : parsed?.url;
      const resolvedImage = uploadedUrl || pendingImageUri;
      await AsyncStorage.setItem('user_profile_image', resolvedImage);
      if (isMerchant) {
        await AsyncStorage.setItem('merchant_profile_image', resolvedImage);
      }
      setProfileImage(resolvedImage);
      if (isMerchant) {
        await fetchLatestProfileImage(true, inTownId);
      }
      setPendingImageUri(null);
      setPendingImageBase64(null);
    } catch (error) {
      console.error('Error saving profile image:', error);
      Alert.alert('Upload failed', 'Unable to update profile image. Please try again.');
    } finally {
      setIsSavingImage(false);
    }
  };

  const getProfileImageSource = (value: string | null) => {
    if (!value) return undefined;
    return { uri: value };
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>My Account</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Text style={styles.editBtn}>{editing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileImageWrapper}>
          {pendingImageUri || profileImage ? (
            <Image
              source={getProfileImageSource(pendingImageUri || profileImage) as any}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Ionicons name="person" size={40} color="#FF6600" />
            </View>
          )}
        </View>
        <View style={styles.profileActions}>
          <TouchableOpacity style={styles.profileButton} onPress={handleTakePhoto}>
            <Ionicons name="camera" size={16} color="#FF6600" />
            <Text style={styles.profileButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={handlePickImage}>
            <Ionicons name="image" size={16} color="#FF6600" />
            <Text style={styles.profileButtonText}>Upload Gallery</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.updateButton, !pendingImageUri && styles.updateButtonDisabled]}
          onPress={handleUpdateProfileImage}
          disabled={!pendingImageUri || isSavingImage}
        >
          <Text style={styles.updateButtonText}>
            {isSavingImage ? 'Updating...' : 'Update Profile Image'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {/* NAME */}
        <Text style={styles.label}>Name</Text>
        {editing ? (
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        ) : (
          <Text style={styles.value}>{name || '-'}</Text>
        )}

        {/* PHONE */}
        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{user?.phone ?? '-'}</Text>
        <Text style={styles.label}>Email</Text>
<Text style={styles.value}>
  {(user as any)?.email ?? 'Not provided'}
</Text>






       

        

        {editing && (
          <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
            <Text style={styles.saveText}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 32 },
  backButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 22, fontWeight: '700', marginLeft: 8 },
  editBtn: { color: '#FF6600', fontWeight: '600', fontSize: 16 },

  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  profileImageWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FF6600',
    marginBottom: 12,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  profileButtonText: {
    marginLeft: 6,
    color: '#FF6600',
    fontWeight: '600',
    fontSize: 12,
  },
  updateButton: {
    backgroundColor: '#FF6600',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  updateButtonDisabled: {
    backgroundColor: '#F4B183',
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  label: { fontSize: 12, color: '#777', marginTop: 12 },
  value: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  pickerWrapper: {
  borderWidth: 1,
  borderColor: '#DDD',
  borderRadius: 8,
  marginTop: 6,
  backgroundColor: '#fff',
  overflow: 'hidden',
},


  saveBtn: {
    backgroundColor: '#FF6600',
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700' },
});
