// app/account.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { FontStylesWithFallback } from '../utils/fonts';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatDob = (date: Date | null) => {
  if (!date) return '';
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear().toString();
  return `${d}/${m}/${y}`;
};

const parseDobString = (value?: string): Date | null => {
  if (!value) return null;
  const trimmed = value.trim();
  let day: number, month: number, year: number;

  if (trimmed.includes('-')) {
    // assume YYYY-MM-DD
    const parts = trimmed.split('-');
    if (parts.length !== 3) return null;
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else {
    // assume DD/MM/YYYY
    const parts = trimmed.split('/');
    if (parts.length !== 3) return null;
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    year = parseInt(parts[2], 10);
  }

  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? null : d;
};

export default function AccountScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore() as any;

  // Local editable state
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  const initialDobDate = parseDobString(user?.dob);
  const [dobDate, setDobDate] = useState<Date | null>(initialDobDate);
  const [dob, setDob] = useState(user?.dob ?? formatDob(initialDobDate || null));
  const [gender, setGender] = useState(user?.gender ?? '');

  const [saving, setSaving] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);

  const [phoneError, setPhoneError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [dobError, setDobError] = useState<string>('');

  const [showDobPicker, setShowDobPicker] = useState(false);

  // ------------ handlers ------------

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);

    if (digits.length === 0) {
      setPhoneError('Mobile number is required');
    } else if (digits.length !== 10) {
      setPhoneError('Mobile number must be 10 digits');
    } else {
      setPhoneError('');
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (!value.trim()) {
      setEmailError('');
      return;
    }
    if (!emailRegex.test(value.trim())) {
      setEmailError('Enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  // Native date picker (Android / iOS)
  const handleDobChangeNative = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowDobPicker(false);
    }

    if (event.type === 'dismissed') {
      return;
    }

    const currentDate = selectedDate || dobDate || new Date(2000, 0, 1);
    setDobDate(currentDate);
    const formatted = formatDob(currentDate);
    setDob(formatted);
    setDobError('');
  };

  // Web <input type="date">
  const handleDobChangeWeb = (value: string) => {
    if (!value) {
      setDob('');
      setDobDate(null);
      setDobError('Please select your date of birth');
      return;
    }

    const picked = new Date(value); // YYYY-MM-DD
    if (isNaN(picked.getTime())) {
      setDobError('Invalid date');
      setDobDate(null);
      return;
    }

    const today = new Date();
    if (picked > today) {
      setDobError('DOB cannot be in the future');
      setDobDate(null);
      return;
    }

    setDobDate(picked);
    setDob(formatDob(picked));
    setDobError('');
  };

  const handleSave = () => {
    setSaving(true);
    setSavedOnce(false);

    let valid = true;

    if (!phone || phone.length !== 10) {
      setPhoneError('Enter a valid 10-digit mobile number');
      valid = false;
    }

    if (email && !emailRegex.test(email.trim())) {
      setEmailError('Enter a valid email address');
      valid = false;
    }

    const today = new Date();
    if (!dobDate) {
      setDobError('Please select your date of birth');
      valid = false;
    } else if (dobDate > today) {
      setDobError('DOB cannot be in the future');
      valid = false;
    }

    if (!valid) {
      setSaving(false);
      return;
    }

    const dobString = formatDob(dobDate);

    try {
      updateUser({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        dob: dobString,
        gender: gender.trim(),
      });
      setSavedOnce(true);
    } finally {
      setSaving(false);
    }
  };

  const renderGenderChip = (value: string, label: string, icon: any) => {
    const active = gender === value;
    return (
      <TouchableOpacity
        style={[styles.genderChip, active && styles.genderChipActive]}
        onPress={() => setGender(value)}
      >
        <Ionicons
          name={icon}
          size={14}
          color={active ? '#fff' : '#FF6600'}
        />
        <Text
          style={[
            styles.genderChipText,
            active && styles.genderChipTextActive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const webDateValue =
    dobDate != null ? dobDate.toISOString().split('T')[0] : '';

  // ------------ UI ------------

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Account</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color="#fff" />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.profileName}>{user?.name ?? 'Guest User'}</Text>
            <Text style={styles.profilePhone}>
              {user?.phone ?? user?.email ?? 'Add your details below'}
            </Text>
          </View>
        </View>

        {/* Form */}
        <Text style={styles.sectionTitle}>Basic Information</Text>

        {/* Name */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <View
            style={[
              styles.inputRow,
              Platform.OS === 'web'
                ? ({ outlineWidth: 0, outlineStyle: 'none', outlineColor: 'transparent' } as any)
                : null,
            ]}
          >
            <Ionicons name="person-outline" size={18} color="#FF6600" />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
              style={[
                styles.input,
                Platform.OS === 'web'
                  ? ({ outlineWidth: 0, outlineStyle: 'none', outlineColor: 'transparent' } as any)
                  : null,
              ]}
            />
          </View>
        </View>

        {/* Mobile */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Mobile Number</Text>
          <View
            style={[
              styles.inputRow,
              phoneError && styles.inputRowError,
              Platform.OS === 'web'
                ? ({ outlineWidth: 0, outlineStyle: 'none', outlineColor: 'transparent' } as any)
                : null,
            ]}
          >
            <Ionicons name="call-outline" size={18} color="#FF6600" />
            <TextInput
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="10-digit mobile number"
              placeholderTextColor="#999"
              style={[
                styles.input,
                Platform.OS === 'web'
                  ? ({ outlineWidth: 0, outlineStyle: 'none', outlineColor: 'transparent' } as any)
                  : null,
              ]}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          {phoneError ? (
            <Text style={styles.errorText}>{phoneError}</Text>
          ) : null}
        </View>

        {/* Email */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Email</Text>
          <View
            style={[
              styles.inputRow,
              emailError && styles.inputRowError,
              Platform.OS === 'web'
                ? ({ outlineWidth: 0, outlineStyle: 'none', outlineColor: 'transparent' } as any)
                : null,
            ]}
          >
            <Ionicons name="mail-outline" size={18} color="#FF6600" />
            <TextInput
              value={email}
              onChangeText={handleEmailChange}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              style={[
                styles.input,
                Platform.OS === 'web'
                  ? ({ outlineWidth: 0, outlineStyle: 'none', outlineColor: 'transparent' } as any)
                  : null,
              ]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {emailError ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : null}
        </View>

        {/* DOB */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Date of Birth</Text>

          {Platform.OS === 'web' ? (
            <View
              style={[
                styles.inputRow,
                dobError && styles.inputRowError,
                ({ outlineWidth: 0, outlineStyle: 'none', outlineColor: 'transparent' } as any),
              ]}
            >
              <Ionicons name="calendar-outline" size={18} color="#FF6600" />
              {/* @ts-ignore web-only element */}
<input
  type="date"
  value={webDateValue}
  onChange={(e: any) => handleDobChangeWeb(e.target.value)}
  style={{
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    paddingTop: 6,
    paddingBottom: 6,
    borderWidth: 0,
    outline: 'none',
    backgroundColor: 'transparent',
  }}
/>

            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowDobPicker(true)}
            >
              <View
                style={[
                  styles.inputRow,
                  dobError && styles.inputRowError,
                ]}
              >
                <Ionicons name="calendar-outline" size={18} color="#FF6600" />
                <Text style={[styles.input, { paddingVertical: 8 }]}>
                  {dob || 'Select your date of birth'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#999" />
              </View>
            </TouchableOpacity>
          )}

          {dobError ? <Text style={styles.errorText}>{dobError}</Text> : null}
        </View>

        {/* Gender */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={styles.genderRow}>
            {renderGenderChip('Male', 'Male', 'male-outline')}
            {renderGenderChip('Female', 'Female', 'female-outline')}
            {renderGenderChip('Other', 'Other', 'help-outline')}
          </View>
        </View>

        {/* Info Note */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color="#FF6600" />
          <Text style={styles.infoText}>
            These details help us personalize your IntownLocal experience and show better
            offers near you.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>

        {savedOnce && !saving && (
          <Text style={styles.savedText}>
            ✅ Profile updated.
          </Text>
        )}
      </ScrollView>

      {/* Native DOB Date Picker (Android / iOS) */}
      {showDobPicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={dobDate || new Date(2000, 0, 1)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={handleDobChangeNative}
        />
      )}
    </SafeAreaView>
  );
}

// -------------------- styles --------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    height: 56,
    backgroundColor: '#fe6f09',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...FontStylesWithFallback.bodyMedium,
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF6600',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    ...FontStylesWithFallback.bodyMedium,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  profilePhone: {
    ...FontStylesWithFallback.caption,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    ...FontStylesWithFallback.h4,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  fieldBlock: {
    marginBottom: 14,
  },
  fieldLabel: {
    ...FontStylesWithFallback.caption,
    fontSize: 13,
    color: '#777',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inputRowError: {
    borderColor: '#D32F2F',
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1A1A1A',
  },
  errorText: {
    marginTop: 4,
    fontSize: 11,
    color: '#D32F2F',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  genderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFCC99',
    backgroundColor: '#FFF7F0',
  },
  genderChipActive: {
    backgroundColor: '#FF6600',
    borderColor: '#FF6600',
  },
  genderChipText: {
    fontSize: 13,
    marginLeft: 4,
    color: '#FF6600',
    fontWeight: '600',
  },
  genderChipTextActive: {
    color: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF7F0',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFE5D1',
  },
  infoText: {
    ...FontStylesWithFallback.caption,
    color: '#444',
    marginLeft: 8,
    flex: 1,
    fontSize: 12,
  },
  saveButton: {
    backgroundColor: '#FF6600',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  saveButtonText: {
    ...FontStylesWithFallback.buttonLarge,
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  savedText: {
    marginTop: 10,
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
  },
});
