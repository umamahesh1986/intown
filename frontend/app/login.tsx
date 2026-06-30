import React, { useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { sendOtpApi } from '../utils/api';

const CARD_WIDTH = 520;
const RADIUS = 12;
const VIDEO_URL =
  'https://intown-dev.s3.ap-south-1.amazonaws.com/LoginBackgroundVideo/INtownVideo.mp4';

const BackgroundContent = React.memo(() => {
  if (Platform.OS === 'web') {
    return (
      <video
        src={VIDEO_URL}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          top: 0,
          left: 0,
          zIndex: -1,
        }}
      />
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Video
        source={{ uri: VIDEO_URL }}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
    </View>
  );
});


export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const handleSendOTP = async () => {
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }
    setPhoneError('');

    setIsLoading(true);
    try {
      const mobileNumber = `91${phone.replace(/\D/g, '').slice(-10)}`;
      await sendOtpApi(mobileNumber);
      router.push(`/otp?phone=${phone}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputWebStyle: any =
    Platform.OS === 'web'
      ? {
          outlineStyle: 'none',
          outlineWidth: 0,
          outlineColor: 'transparent',
        }
      : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BackgroundContent />

      <View style={styles.overlay}>
        <View style={styles.centerWrap}>
          <View style={styles.headerCard}>
            <View style={styles.logoBox}>
              <Image
                source={{uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/app_logo/intown-logo.jpg'}}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.formWrap}>
            <View style={styles.formCard}>
              <View style={styles.inputRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="call" size={18} color="#666" />
                </View>
                <TextInput
                  style={[styles.input, inputWebStyle]}
                  placeholder="Enter mobile number"
                  placeholderTextColor="#9b9b9b"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(v) => { setPhone(v); setPhoneError(''); }}
                  maxLength={10}
                />
              </View>

              {phoneError ? (
                <Text style={styles.errorText}>{phoneError}</Text>
              ) : null}

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.buttonText}> Sending OTP...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Get OTP</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.smallNote}>
                You will receive a one-time password on this number
              </Text>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  headerCard: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'center',
    backgroundColor: '#fe6f09',
    marginVertical: 0,
    marginHorizontal: 32,
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },

  logoBox: {
    backgroundColor: '#fe6f09',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'center',
  },

  logo: {
    width: 220,
    height: 48,
  },

  formWrap: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'center',
    marginTop: -18,
  },

  formCard: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'center',
    backgroundColor: '#fe6f09',
    marginVertical: 0,
    marginHorizontal: 32,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
    paddingVertical: 20,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    height: 56,
    paddingHorizontal: 12,
    marginBottom: 18,
    borderColor: '#ececec',
    borderWidth: 1,
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    height: '100%',
  },

  button: {
    backgroundColor: '#E85B1A',
    height: 54,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  buttonDisabled: { opacity: 0.65 },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  errorText: {
    color: '#FFE0CC',
    fontSize: 13,
    marginBottom: 12,
    marginTop: -8,
  },

  smallNote: {
    color: '#FFE0CC',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
});
