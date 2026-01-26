import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerMember } from '../utils/api';
import { useAuthStore } from '../store/authStore';

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

  const handleSelectLocation = () => {
    router.push({ pathname: '/location-picker', params: { returnTo: '/register-member' } });
  };

  const handlePickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.base64 || asset.uri);
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
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

      if (customerId) {
        await AsyncStorage.setItem('customer_id', String(customerId));
      }
      if (location?.latitude != null && location?.longitude != null) {
        await AsyncStorage.setItem('customer_location_lat', String(location.latitude));
        await AsyncStorage.setItem('customer_location_lng', String(location.longitude));
      }
      
      // Show success message
      const successMessage = `Your customer account has been created successfully!\nCustomer ID: ${
        customerId ?? 'N/A'
      }`;

      Alert.alert('Registration Successful', successMessage, [
        {
          text: 'OK',
          onPress: () => {
            // Set user type
            setUserType('member');
            // Navigate to dashboard with customer id
            router.replace({
              pathname: '/member-dashboard',
              params: customerId ? { customerId: String(customerId) } : {},
            });
          },
        },
      ]);
      
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
            <TouchableOpacity style={styles.uploadButton} onPress={handlePickImages}>
              <Ionicons name="cloud-upload" size={24} color="#FF6600" />
              <Text style={styles.uploadButtonText}>Select Images</Text>
            </TouchableOpacity>
            
            {images.length > 0 && (
              <View style={styles.imagePreviewContainer}>
                {images.map((img, index) => (
                  <View key={index} style={styles.imagePreview}>
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF0000" />
                    </TouchableOpacity>
                    <Text style={styles.imageText}>Image {index + 1}</Text>
                  </View>
                ))}
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FF6600',
    borderRadius: 8,
    borderStyle: 'dashed',
    paddingVertical: 16,
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#FF6600',
    fontWeight: '600',
    marginLeft: 8,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  imagePreview: {
    width: 80,
    height: 80,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  imageText: {
    fontSize: 12,
    color: '#FF6600',
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
});
