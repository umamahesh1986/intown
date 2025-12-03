// app/addresses.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

interface Address {
  id: string;
  title: string;
  fullAddress: string;
  landmark?: string;
  phone?: string;
  tag: 'Home' | 'Work' | 'Other';
  isDefault: boolean;
}

const STORAGE_KEY = 'user_addresses';

export default function AddressesScreen() {
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [phone, setPhone] = useState('');
  const [tag, setTag] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [isDefault, setIsDefault] = useState(false);

  const [phoneError, setPhoneError] = useState('');
  const [addressError, setAddressError] = useState('');

  // ---------- LOAD / SAVE ----------
  const loadAddresses = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Address[] = JSON.parse(raw);
        setAddresses(parsed);
      }
    } catch (err) {
      console.error('Error loading addresses', err);
    }
  };

  const persistAddresses = async (next: Address[]) => {
    setAddresses(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error('Error saving addresses', err);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  // ---------- helpers ----------
  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setFullAddress('');
    setLandmark('');
    setPhone('');
    setTag('Home');
    setIsDefault(false);
    setPhoneError('');
    setAddressError('');
  };

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
    if (digits && digits.length !== 10) setPhoneError('Phone must be 10 digits');
    else setPhoneError('');
  };

  const handleSaveAddress = () => {
    let valid = true;

    if (!fullAddress.trim()) {
      setAddressError('Address is required');
      valid = false;
    } else setAddressError('');

    if (phone && phone.length !== 10) {
      setPhoneError('Phone must be 10 digits');
      valid = false;
    }

    if (!valid) return;

    const id = editingId ?? Date.now().toString();

    let next: Address[];

    if (isDefault) {
      next =
        editingId != null
          ? addresses.map(a =>
              a.id === editingId
                ? {
                    ...a,
                    title: title || a.title,
                    fullAddress: fullAddress.trim(),
                    landmark: landmark.trim(),
                    phone: phone.trim(),
                    tag,
                    isDefault: true,
                  }
                : { ...a, isDefault: false }
            )
          : [
              ...addresses.map(a => ({ ...a, isDefault: false })),
              {
                id,
                title: title || tag,
                fullAddress: fullAddress.trim(),
                landmark: landmark.trim(),
                phone: phone.trim(),
                tag,
                isDefault: true,
              },
            ];
    } else {
      if (editingId != null) {
        next = addresses.map(a =>
          a.id === editingId
            ? {
                ...a,
                title: title || a.title,
                fullAddress: fullAddress.trim(),
                landmark: landmark.trim(),
                phone: phone.trim(),
                tag,
              }
            : a
        );
      } else {
        next = [
          ...addresses,
          {
            id,
            title: title || tag,
            fullAddress: fullAddress.trim(),
            landmark: landmark.trim(),
            phone: phone.trim(),
            tag,
            isDefault: addresses.length === 0,
          },
        ];
      }
    }

    persistAddresses(next);
    resetForm();
  };

  const handleEdit = (addr: Address) => {
    setEditingId(addr.id);
    setTitle(addr.title);
    setFullAddress(addr.fullAddress);
    setLandmark(addr.landmark ?? '');
    setPhone(addr.phone ?? '');
    setTag(addr.tag);
    setIsDefault(addr.isDefault);
    setPhoneError('');
    setAddressError('');
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete?', 'This cannot be undone', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const next = addresses.filter(a => a.id !== id);
          if (!next.some(a => a.isDefault) && next.length > 0) {
            next[0].isDefault = true;
          }
          persistAddresses(next);
          if (editingId === id) resetForm();
        },
      },
    ]);
  };

  const handleSetDefault = (id: string) => {
    const next = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    persistAddresses(next);
  };

  const renderTagChip = (value: 'Home' | 'Work' | 'Other') => {
    const active = tag === value;
    const icon =
      value === 'Home'
        ? 'home-outline'
        : value === 'Work'
        ? 'briefcase-outline'
        : 'location-outline';

    return (
      <TouchableOpacity
        style={[styles.tagChip, active && styles.tagChipActive]}
        onPress={() => setTag(value)}
      >
        <Ionicons
          name={icon as any}
          size={14}
          color={active ? '#fff' : '#FF6600'}
        />
        <Text
          style={[
            styles.tagChipText,
            active && styles.tagChipTextActive,
          ]}
        >
          {value}
        </Text>
      </TouchableOpacity>
    );
  };

  // ---------- UI ----------
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Addresses</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Saved Addresses */}
        <Text style={styles.sectionTitle}>Saved Addresses</Text>

        {addresses.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="location-outline" size={26} color="#FF6600" />
            <Text style={styles.emptyText}>No addresses saved yet.</Text>
            <Text style={styles.emptySubText}>
              Add your home or work address below.
            </Text>
          </View>
        ) : (
          addresses.map(addr => (
            <View key={addr.id} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={
                      addr.tag === 'Home'
                        ? 'home'
                        : addr.tag === 'Work'
                        ? 'briefcase'
                        : 'location'
                    }
                    size={18}
                    color="#FF6600"
                  />
                  <Text style={styles.addressTitle}>{addr.title}</Text>
                  {addr.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => handleEdit(addr)}
                    style={styles.iconBtn}
                  >
                    <Ionicons name="create-outline" size={18} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(addr.id)}
                    style={styles.iconBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color="#C62828" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.addressText}>{addr.fullAddress}</Text>
              {addr.landmark ? (
                <Text style={styles.addressSubText}>
                  Landmark: {addr.landmark}
                </Text>
              ) : null}
              {addr.phone ? (
                <Text style={styles.addressSubText}>Phone: {addr.phone}</Text>
              ) : null}

              {!addr.isDefault && (
                <TouchableOpacity
                  style={styles.setDefaultRow}
                  onPress={() => handleSetDefault(addr.id)}
                >
                  <Ionicons
                    name="radio-button-off-outline"
                    size={16}
                    color="#FF6600"
                  />
                  <Text style={styles.setDefaultText}>Set as default</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Form */}
        <Text style={styles.sectionTitle}>
          {editingId ? 'Edit Address' : 'Add New Address'}
        </Text>

        {/* Tag chips */}
        <View style={styles.tagRow}>
          {renderTagChip('Home')}
          {renderTagChip('Work')}
          {renderTagChip('Other')}
        </View>

        {/* Title */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Address Title</Text>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="E.g. Home, Parents"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />
          </View>
        </View>

        {/* Full Address */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Full Address</Text>
          <View
            style={[
              styles.inputRow,
              addressError ? styles.inputRowError : null,
            ]}
          >
            <TextInput
              placeholder="Flat / Street / Area / City / Pincode"
              placeholderTextColor="#999"
              value={fullAddress}
              onChangeText={setFullAddress}
              style={[styles.input, { minHeight: 60 }]}
              multiline
            />
          </View>
          {addressError ? (
            <Text style={styles.errorText}>{addressError}</Text>
          ) : null}
        </View>

        {/* Landmark */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Nearby Landmark (Optional)</Text>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="E.g. Near Bus Stop"
              placeholderTextColor="#999"
              value={landmark}
              onChangeText={setLandmark}
              style={styles.input}
            />
          </View>
        </View>

        {/* Phone */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Contact Number (Optional)</Text>
          <View
            style={[
              styles.inputRow,
              phoneError ? styles.inputRowError : null,
            ]}
          >
            <TextInput
              placeholder="10-digit phone number"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={handlePhoneChange}
              style={styles.input}
              maxLength={10}
              keyboardType="phone-pad"
            />
          </View>
          {phoneError ? (
            <Text style={styles.errorText}>{phoneError}</Text>
          ) : null}
        </View>

        {/* Default toggle */}
        <TouchableOpacity
          style={styles.defaultRow}
          onPress={() => setIsDefault(prev => !prev)}
        >
          <Ionicons
            name={isDefault ? 'checkbox-outline' : 'square-outline'}
            size={20}
            color="#FF6600"
          />
          <Text style={styles.defaultRowText}>Set as default address</Text>
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddress}>
          <Text style={styles.saveButtonText}>
            {editingId ? 'Update Address' : 'Save Address'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------- STYLE ----------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },

  header: {
    height: 56,
    backgroundColor: '#fe6f09',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  content: { padding: 16, paddingBottom: 32 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },

  emptyBox: {
    backgroundColor: '#FFF7F0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: { marginTop: 6, fontSize: 14, color: '#333' },
  emptySubText: { marginTop: 2, fontSize: 12, color: '#777', textAlign: 'center' },

  addressCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 12,
  },

  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  addressTitle: { marginLeft: 6, fontSize: 14, fontWeight: '700' },

  defaultBadge: {
    marginLeft: 8,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },

  defaultBadgeText: { fontSize: 10, color: '#1976D2', fontWeight: '700' },

  cardActions: { flexDirection: 'row' },
  iconBtn: { marginLeft: 8, padding: 4 },

  addressText: { fontSize: 13, color: '#333' },
  addressSubText: { fontSize: 12, color: '#777', marginTop: 2 },

  setDefaultRow: { flexDirection: 'row', marginTop: 8 },
  setDefaultText: { marginLeft: 4, color: '#FF6600', fontWeight: '600' },

  divider: { height: 1, backgroundColor: '#DDD', marginVertical: 16 },

  tagRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFCC99',
    backgroundColor: '#FFF7F0',
    marginRight: 8,
  },
  tagChipActive: {
    backgroundColor: '#FF6600',
    borderColor: '#FF6600',
  },
  tagChipText: {
    fontSize: 13,
    marginLeft: 4,
    color: '#FF6600',
    fontWeight: '600',
  },
  tagChipTextActive: { color: '#fff' },

  fieldBlock: { marginBottom: 12 },

  fieldLabel: { color: '#555', fontSize: 13, marginBottom: 4 },

  inputRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    ...(Platform.OS === 'web'
      ? ({
          outlineWidth: 0,
          outlineStyle: 'none',
          outlineColor: 'transparent',
        } as any)
      : {}),
  },

  inputRowError: { borderColor: '#D32F2F' },

  input: {
    flex: 1,
    fontSize: 14,
    color: '#222',
    ...(Platform.OS === 'web'
      ? ({
          outlineWidth: 0,
          outlineStyle: 'none',
          outlineColor: 'transparent',
        } as any)
      : {}),
  },

  errorText: {
    marginTop: 4,
    fontSize: 11,
    color: '#D32F2F',
  },

  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  defaultRowText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#444',
  },

  saveButton: {
    backgroundColor: '#FF6600',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
