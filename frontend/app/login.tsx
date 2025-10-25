import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { sendOTP } from '../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, FontStylesWithFallback } from '../utils/fonts';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Sending OTP to:', phone);
      const response = await sendOTP(phone);
      console.log('OTP Response:', response);
      
      if (response.success) {
        // Direct navigation for testing
        console.log('Navigating to OTP screen with phone:', phone);
        router.push(`/otp?phone=${phone}`);
        
        // Optional: Show alert after navigation
        // Alert.alert('OTP Sent', 'Please check your phone for the OTP');
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >

      <View style={styles.content}>
      <View style={styles.header}>
            <Image 
              source={require('../assets/images/intown-logo.jpg')} 
              style={styles.logo}
              resizeMode="contain"

            />
          </View>
        <View style={styles.mainContentContainer}>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="call" size={20} color="#666666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter mobile number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
                placeholderTextColor="#999999"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.infoText}>
              You will receive a one-time password on this number
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fe6f09',
  },
  bannerContainer: {
    height: 400,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  mainContentContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingTop: 24,
    paddingBottom: 24,
    paddingLeft: 16,
    paddingRight: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
    
  },
  logo: {

    maxWidth: 300,
    height: 120,
    marginBottom: 8,

  },
  subtitle: {
    ...FontStylesWithFallback.h5,
    color: '#666666',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#F9F9F9',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    ...FontStylesWithFallback.body,
    color: '#1A1A1A',
  },
  button: {
    backgroundColor: '#FF6600',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    ...FontStylesWithFallback.buttonLarge,
  },
  infoText: {
    ...FontStylesWithFallback.bodySmall,
    color: '#999999',
    textAlign: 'center',
  },
});