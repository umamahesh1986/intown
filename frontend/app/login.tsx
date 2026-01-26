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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

const CARD_WIDTH = 520;
const RADIUS = 12;

const BackgroundContent = React.memo(() => {
  if (Platform.OS === 'web') {
    return (
      <video
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
      >
        <source src="/videos/intown-video.mp4" type="video/mp4" />
      </video>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Video
        source={require('../assets/videos/intown-video.mp4')}
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

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }
    router.push(`/otp?phone=${phone}`);
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
                source={require('../assets/images/intown-logo.jpg')}
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
                  onChangeText={setPhone}
                  maxLength={10}
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

  /* HEADER (orange) */
  headerCard: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'center',
    backgroundColor: '#fe6f09',

    marginVertical: 0,     // top & bottom = 0
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

  tagline: {
    color: '#fff',
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.95,
  },

  /* WRAP FOR FORM (no padding so widths match) */
  formWrap: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'center',
    marginTop: -18, // slight overlap; adjust if you want a gap
  },

  /* WHITE FORM CARD */
  formCard: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'center',
    backgroundColor:  '#fe6f09',
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

  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  smallNote: {
    color: '#FFE0CC',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
});
