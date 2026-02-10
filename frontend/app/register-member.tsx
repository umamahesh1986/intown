import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerMember } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { useFocusEffect } from '@react-navigation/native';

export default function RegisterMember() {
  const router = useRouter();
  const params = useLocalSearchParams<{ latitude?: string; longitude?: string }>();
  const { setUserType, user } = useAuthStore();
  
  // Form state
  const [contactName, setContactName] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pincode, setPincode] = useState('');
  const [address, setAddress] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successCustomerId, setSuccessCustomerId] = useState<string | number | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buildImageFormData = async (files: string[], inTownIdValue: string | number) => {
    const formData = new FormData();
    for (let index = 0; index < files.length; index += 1) {
      const img = files[index];
      const fileName = `customer_${inTownIdValue}_${index + 1}.jpg`;
      if (Platform.OS === 'web') {
        const blobSource = img.startsWith('data:')
          ? img
          : img.startsWith('http') || img.startsWith('blob:')
          ? img
          : `data:image/jpeg;base64,${img}`;
        const response = await fetch(blobSource);
        const blob = await response.blob();
        formData.append('file', blob, fileName);
      } else {
        const uriValue = img.startsWith('data:')
          ? img
          : img.startsWith('file:') || img.startsWith('content:')
          ? img
          : `data:image/jpeg;base64,${img}`;
        formData.append(
          'file',
          {
            uri: uriValue,
            name: fileName,
            type: 'image/jpeg',
          } as any
        );
      }
    }
    return formData;
  };

  const uploadImagesToS3 = async (inTownIdValue: string | number, files: string[]) => {
    if (!files.length) return;
    const url = `https://api.intownlocal.com/IN/s3/upload?userType=IN_CUSTOMER&inTownId=${inTownIdValue}`;
    const formData = await buildImageFormData(files, inTownIdValue);

    const res = await fetch(url, {
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
      throw new Error(
        typeof parsed === 'string' ? parsed : JSON.stringify(parsed)
      );
    }
    return parsed;
  };

  const addImages = (newImages: string[]) => {
    setImages((prev) => Array.from(new Set([...prev, ...newImages])));
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const getImagePreviewSource = (value: string) => {
    if (!value) return null;
    if (
      value.startsWith('http') ||
      value.startsWith('file:') ||
      value.startsWith('content:') ||
      value.startsWith('data:') ||
      value.startsWith('blob:')
    ) {
      return { uri: value };
    }
    return { uri: `data:image/jpeg;base64,${value}` };
  };

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<any>({});

  // Auto-populate phone number from logged-in user
  useEffect(() => {
    const loadPhoneNumber = async () => {
      try {
        // Try to get from authStore first
        if (user?.phone) {
          let phone = user.phone;
          // Clean phone number: remove +91 or 91 prefix, keep only 10 digits
          phone = phone.replace(/\D/g, '');
          if (phone.startsWith('91') && phone.length > 10) {
            phone = phone.substring(2);
          }
          if (phone.length === 10) {
            setPhoneNumber(phone);
            return;
          }
        }
        
        // Fallback: get from AsyncStorage
        const userData = await AsyncStorage.getItem('user_data');
        if (userData) {
          const parsed = JSON.parse(userData);
          if (parsed.phone) {
            let phone = parsed.phone;
            // Clean phone number: remove +91 or 91 prefix, keep only 10 digits
            phone = phone.replace(/\D/g, '');
            if (phone.startsWith('91') && phone.length > 10) {
              phone = phone.substring(2);
            }
            if (phone.length === 10) {
              setPhoneNumber(phone);
            }
          }
        }
      } catch (error) {
        console.error('Error loading phone number:', error);
      }
    };

    loadPhoneNumber();
  }, [user]);

  const validateForm = () => {
    const newErrors: any = {};

    // Contact Name validation (min 2 characters)
    if (!contactName || contactName.trim().length < 2) {
      newErrors.contactName = 'Contact name must be at least 2 characters';
    }

    // Location validation
    if (!location) {
      newErrors.location = 'Please select your location';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone number validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
    }

    // Pincode validation (6 digits)
    const pincodeRegex = /^\d{6}$/;
    if (!pincode || !pincodeRegex.test(pincode)) {
      newErrors.pincode = 'Pincode must be exactly 6 digits';
    }

    // Terms validation
    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (params.latitude && params.longitude) {
      const lat = Number(params.latitude);
      const lng = Number(params.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setLocation({ latitude: lat, longitude: lng });
      }
    }
  }, [params.latitude, params.longitude]);

  useFocusEffect(
    useCallback(() => {
      const loadPickedLocation = async () => {
        try {
          const stored = await AsyncStorage.getItem('location_picker_register_member');
          if (!stored) return;
          const parsed = JSON.parse(stored);
          if (
            parsed &&
            Number.isFinite(parsed.latitude) &&
            Number.isFinite(parsed.longitude)
          ) {
            setLocation({
              latitude: parsed.latitude,
              longitude: parsed.longitude,
            });
          }
          await AsyncStorage.removeItem('location_picker_register_member');
        } catch (error) {
          console.error('Failed to load picked location', error);
        }
      };

      loadPickedLocation();
    }, [])
  );

  const handleSelectLocation = () => {
    router.push({ pathname: '/location-picker', params: { returnTo: '/register-member' } });
  };

  const handlePickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Please allow photo library access');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.5,
        base64: true,
      });

      if (result.canceled) return;
      const newImages =
        (result as any).assets?.map((asset: any) => asset.uri || asset.base64) ??
        [];
      if (newImages.length > 0) addImages(newImages);
    } catch (error) {
      console.error('Image pick error:', error);
      Alert.alert('Error', 'Unable to pick images');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Please allow camera access');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.5,
        allowsEditing: true,
        base64: true,
      });

      if (result.canceled) return;
      const imageValue =
        (result as any).assets?.[0]?.uri ??
        (result as any).assets?.[0]?.base64 ??
        null;
      if (imageValue) addImages([imageValue]);
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Unable to open camera');
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields correctly');
      return;
    }

    setIsLoading(true);
    
    try {
      const memberData = {
        contactName,
        location,
        email,
        phoneNumber,
        pincode,
        address,
        images,
        agreedToTerms,
      };

      const response = await registerMember(memberData);
      console.log('Customer registration success:', response);

      const customerId =
        response?.customerId ??
        response?.id ??
        response?.data?.customerId ??
        response?.data?.id ??
        null;
      const inTownId =
        response?.id ??
        response?.data?.id ??
        response?.inTownId ??
        response?.data?.inTownId ??
        response?.intownId ??
        response?.data?.intownId ??
        null;

      if (customerId) {
        await AsyncStorage.setItem('customer_id', String(customerId));
      }
      if (contactName) {
        await AsyncStorage.setItem('customer_contact_name', contactName);
      }
      if (location?.latitude != null && location?.longitude != null) {
        await AsyncStorage.setItem('customer_location_lat', String(location.latitude));
        await AsyncStorage.setItem('customer_location_lng', String(location.longitude));
      }

      if (inTownId) {
        try {
          const uploadResponse = await uploadImagesToS3(inTownId, images);
          const uploadedUrls = Array.isArray(uploadResponse)
            ? uploadResponse.map((item: any) => item?.url).filter(Boolean)
            : [];
          if (uploadedUrls.length > 0) {
            await AsyncStorage.setItem(
              'customer_profile_images',
              JSON.stringify(uploadedUrls)
            );
            await AsyncStorage.setItem('user_profile_image', uploadedUrls[0]);
          }
        } catch (error) {
          console.error('S3 upload failed:', error);
        }
      }
      
      const popupMessage = `Your customer account has been created successfully!\nCustomer ID: ${
        customerId ?? 'N/A'
      }`;
      setSuccessMessage(popupMessage);
      setSuccessCustomerId(customerId ?? null);
      setShowSuccessPopup(true);
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      successTimerRef.current = setTimeout(() => {
        handleSuccessClose(customerId);
      }, 5000);
      
    } catch (error: any) {
      console.error('Customer registration error:', error);
      
      // Show error message
      const errorMessage = error.message || 'Registration failed. Please try again.';
      Alert.alert(
        'Registration Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessClose = (customerId?: string | number | null) => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    setShowSuccessPopup(false);
    setUserType('member');
    const resolvedId = customerId ?? successCustomerId;
    router.replace({
      pathname: '/member-dashboard',
      params: resolvedId ? { customerId: String(resolvedId) } : {},
    });
  };

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customer Registration</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Contact Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Contact Name *</Text>
            <TextInput
              style={[styles.input, errors.contactName && styles.inputError]}
              value={contactName}
              onChangeText={setContactName}
              placeholder="Enter your full name"
              placeholderTextColor="#999999"
            />
            {errors.contactName && <Text style={styles.errorText}>{errors.contactName}</Text>}
          </View>

          {/* Select Location */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Select Customer Location *</Text>
            <TouchableOpacity
              style={[styles.locationButton, errors.location && styles.inputError]}
              onPress={handleSelectLocation}
            >
              <Ionicons name="location" size={20} color="#FF6600" />
              <Text style={styles.locationButtonText}>
                {location
                  ? `Selected: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                  : 'Tap to select location on map'}
              </Text>
            </TouchableOpacity>
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>

          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={email}
              onChangeText={setEmail}
              placeholder="your.email@example.com"
              placeholderTextColor="#999999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Phone Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={[styles.input, errors.phoneNumber && styles.inputError, styles.disabledInput]}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="10-digit phone number"
              placeholderTextColor="#999999"
              keyboardType="phone-pad"
              maxLength={10}
              editable={false}
            />
            <Text style={styles.helperText}>This is your logged-in phone number</Text>
            {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
          </View>

          {/* Pincode */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Pincode *</Text>
            <TextInput
              style={[styles.input, errors.pincode && styles.inputError]}
              value={pincode}
              onChangeText={setPincode}
              placeholder="6-digit pincode"
              placeholderTextColor="#999999"
              keyboardType="numeric"
              maxLength={6}
            />
            {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
          </View>

          {/* Address */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.textArea, errors.address && styles.inputError]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your address"
              placeholderTextColor="#999999"
              multiline
              numberOfLines={3}
            />
            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
          </View>

          {/* Upload Images */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Upload Images</Text>
            <View style={styles.imageActions}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera" size={18} color="#FF6600" />
                <Text style={styles.imageButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={handlePickFromGallery}
              >
                <Ionicons name="images" size={18} color="#FF6600" />
                <Text style={styles.imageButtonText}>Choose Images</Text>
              </TouchableOpacity>
            </View>
            {images.length > 0 && (
              <View style={styles.imagesPreviewContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imagesPreview}
                  contentContainerStyle={styles.imagesPreviewContent}
                >
                  {images.map((uri, index) => (
                    <View key={`${uri}-${index}`} style={styles.imageThumbContainer}>
                      <Image
                        source={getImagePreviewSource(uri) ?? { uri }}
                        style={styles.imageThumb}
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Terms and Conditions */}
          <View style={styles.termsContainer}>
            <View style={styles.termsCheckbox}>
              <Switch
                value={agreedToTerms}
                onValueChange={setAgreedToTerms}
                trackColor={{ false: '#CCCCCC', true: '#FF6600' }}
                thumbColor={agreedToTerms ? '#FFFFFF' : '#F4F3F4'}
              />
              <Text style={styles.termsLabel}>I agree to the Terms & Conditions</Text>
            </View>
            {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

            <View style={styles.policyBox}>
              <Text style={styles.policyText}>
                By registering, you agree to our terms of service and privacy policy. We will use your
                information to provide you with exclusive offers and updates from local merchants. You can
                unsubscribe at any time.
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Register Customer</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showSuccessPopup} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>Registration Successful</Text>
            <Text style={styles.popupMessage}>{successMessage}</Text>
            <TouchableOpacity
              style={styles.popupButton}
              onPress={() => handleSuccessClose(null)}
            >
              <Text style={styles.popupButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  inputError: {
    borderColor: '#FF0000',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#666666',
  },
  helperText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#FF0000',
    marginTop: 4,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationButtonText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6600',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFF5EE',
  },
  imageButtonText: {
    marginLeft: 6,
    color: '#FF6600',
    fontWeight: '600',
    fontSize: 13,
  },
  imagesPreview: {
    marginTop: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  imageThumbContainer: {
    position: 'relative',
    marginRight: 16,
  },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    zIndex: 10,
  },
  termsContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  termsLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    marginLeft: 8,
    flex: 1,
  },
  policyBox: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6600',
  },
  policyText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#EEEEEE',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  registerButton: {
    flex: 1,
    backgroundColor: '#FF6600',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  bottomSpacer: {
    height: 32,
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  popupCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  popupMessage: {
    fontSize: 14,
    color: '#444444',
    marginBottom: 16,
  },
  popupButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF6600',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  popupButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
