import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, Platform, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuthStore } from '../store/authStore';
import { INTOWN_API_BASE, getCategories, getProductsByCategory } from '../utils/api';
import axios from 'axios';

export default function Account() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const { user, updateProfile } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [isMerchant, setIsMerchant] = useState(false);
  const [isDualUser, setIsDualUser] = useState(false);

  // Basic fields
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState((user as any)?.email ?? '');

  // Merchant-specific fields
  const [contactName, setContactName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [description, setDescription] = useState('');
  const [branches, setBranches] = useState('');
  const [fromYears, setFromYears] = useState('');
  const [openAt, setOpenAt] = useState('');
  const [closeAt, setCloseAt] = useState('');
  const [breakStartAt, setBreakStartAt] = useState('');
  const [breakEndAt, setBreakEndAt] = useState('');
  const [weekOff, setWeekOff] = useState('');
  const [offer, setOffer] = useState('');
  const [shopLat, setShopLat] = useState<number | null>(null);
  const [shopLng, setShopLng] = useState<number | null>(null);

  // Profile image
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [pendingImageBase64, setPendingImageBase64] = useState<string | null>(null);
  const [isSavingImage, setIsSavingImage] = useState(false);

  // Time picker
  const [showTimePicker, setShowTimePicker] = useState<string | null>(null);
  const DAYS_OF_WEEK = ['None', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Categories
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Products
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [customProductsList, setCustomProductsList] = useState<string[]>([]);
  const [newProductInput, setNewProductInput] = useState('');

  useEffect(() => {
    loadProfileData();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await getCategories(true);
      setCategories(cats || []);
    } catch (e) {}
  };

  const loadProfileData = async () => {
    try {
      const [storedImage, storedMerchantImage, storedCustomerImage, storedUserType, storedMerchantId, storedUserRole, storedUserData, searchResp] = await Promise.all([
        AsyncStorage.getItem('user_profile_image'),
        AsyncStorage.getItem('merchant_profile_image'),
        AsyncStorage.getItem('customer_profile_image'),
        AsyncStorage.getItem('user_type'),
        AsyncStorage.getItem('merchant_id'),
        AsyncStorage.getItem('user_role'),
        AsyncStorage.getItem('user_data'),
        AsyncStorage.getItem('user_search_response'),
      ]);

      if (storedUserType) setUserType(storedUserType);
      if (storedMerchantId) setMerchantId(storedMerchantId);

      // Detect merchant from ALL available signals
      const lowerType = (storedUserType ?? '').toLowerCase();
      const lowerRole = (storedUserRole ?? '').toLowerCase();
      const fromParam = String(params?.from ?? '').toLowerCase();
      const storedCustomerId = await AsyncStorage.getItem('customer_id');
      let hasMerchantData = false;
      let parsedSearch: any = null;

      if (searchResp) {
        try {
          parsedSearch = JSON.parse(searchResp);
          hasMerchantData = !!(parsedSearch?.merchant?.id);
        } catch {}
      }

      let parsedUserData: any = null;
      if (storedUserData) {
        try { parsedUserData = JSON.parse(storedUserData); } catch {}
      }

      // A user is "dual" if they have BOTH a merchant_id and a customer_id,
      // OR user_type was stored as 'dual', OR `from` param indicates dual context.
      const dualUser =
        lowerType === 'dual' ||
        fromParam.startsWith('dual-') ||
        (!!storedMerchantId && !!storedCustomerId) ||
        (hasMerchantData && !!parsedSearch?.customer?.id);
      setIsDualUser(dualUser);

      // `from` route param wins — let the dashboard explicitly choose which profile to load.
      // Falls back to inferred user-type / role / data signals if no param given.
      let merchantUser: boolean;
      if (fromParam === 'dual-merchant' || fromParam === 'merchant') {
        merchantUser = true;
      } else if (fromParam === 'dual-customer' || fromParam === 'member' || fromParam === 'user') {
        merchantUser = false;
      } else {
        merchantUser =
          lowerType.includes('merchant') ||
          lowerType === 'dual' ||
          lowerType === 'in_merchant' ||
          lowerRole.includes('merchant') ||
          lowerRole === 'dual' ||
          !!storedMerchantId ||
          hasMerchantData ||
          (parsedUserData?.userType === 'merchant');
      }

      setIsMerchant(merchantUser);

      // Profile image — pick context-specific cache so dual users don't see
      // the other side's image. Falls back to the generic `user_profile_image`.
      const contextualImage = merchantUser ? storedMerchantImage : storedCustomerImage;
      const effectiveImage = contextualImage || storedImage || null;
      if (effectiveImage) setProfileImage(effectiveImage);

      // If no merchantId stored but found in search response, save it
      if (!storedMerchantId && parsedSearch?.merchant?.id) {
        const mid = String(parsedSearch.merchant.id);
        setMerchantId(mid);
        await AsyncStorage.setItem('merchant_id', mid);
      }

      // Load merchant fields from search response
      if (merchantUser && parsedSearch?.merchant) {
        const m = parsedSearch.merchant;
        setName(m.shopName || m.businessName || m.contactName || '');
        setContactName(m.contactName || '');
        setEmail(m.email || '');
        setBusinessCategory(m.businessCategory || '');
        setDescription(m.description || '');
        setBranches(m.branchesOfBusiness || '');
        setFromYears(m.fromYears || '');
        setOpenAt(m.openAt || '');
        setCloseAt(m.closeAt || '');
        setBreakStartAt(m.breakStartAt || '');
        setBreakEndAt(m.breakEndAt || '');
        setWeekOff(m.weekOff || '');
        setOffer(m.offer || '');
        setShopLat(m.latitude ?? null);
        setShopLng(m.longitude ?? null);

        if (m.businessCategory) {
          const cat = categories.find(c => c.name === m.businessCategory);
          if (cat) loadProductsForCategory(cat.id);
        }
        // Load existing product names from API
        if (m.productNames && Array.isArray(m.productNames)) {
          setCustomProductsList(m.productNames);
        }
      } else if (parsedSearch?.customer) {
        setName(parsedSearch.customer.contactName || parsedSearch.customer.name || '');
        setEmail(parsedSearch.customer.email || '');
      }

      // Fallback name from user_data
      if (parsedUserData && !name) {
        if (parsedUserData.name) setName(parsedUserData.name);
        if (parsedUserData.email) setEmail(parsedUserData.email);
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    }
  };

  const loadProductsForCategory = async (catId: number) => {
    try {
      const prods = await getProductsByCategory(catId);
      setProducts(prods || []);
    } catch (e) {}
  };

  const onSave = async () => {
    setIsSaving(true);
    try {
      // Update local stores
      updateProfile({ name } as any);
      const storedUserData = await AsyncStorage.getItem('user_data');
      if (storedUserData) {
        const ud = JSON.parse(storedUserData);
        ud.name = name;
        ud.email = email;
        await AsyncStorage.setItem('user_data', JSON.stringify(ud));
      }

      if (isMerchant && merchantId) {
        // Build update payload
        const payload: any = {
          contactName,
          email,
          businessCategory,
          description,
          fromYears,
          branchesOfBusiness: branches,
          openAt,
          closeAt,
          breakStartAt,
          breakEndAt,
          weekOff,
          offer,
          productNames: customProductsList.filter(p => p.trim()),
        };
        if (shopLat && shopLng) {
          payload.latitude = shopLat;
          payload.longitude = shopLng;
        }

        // PUT to merchant update API
        try {
          await axios.put(`${INTOWN_API_BASE}/merchant/${merchantId}`, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
          });
        } catch (e: any) {
          console.warn('[Account] Merchant update API error:', e.message);
        }

        // Update AsyncStorage
        await AsyncStorage.setItem('merchant_shop_name', name);
        await AsyncStorage.setItem('merchant_contact_name', contactName);

        const searchResp = await AsyncStorage.getItem('user_search_response');
        if (searchResp) {
          try {
            const data = JSON.parse(searchResp);
            if (data.merchant) {
              Object.assign(data.merchant, {
                contactName, email, businessCategory, description,
                fromYears, branchesOfBusiness: branches,
                openAt, closeAt, breakStartAt, breakEndAt, weekOff, offer,
                latitude: shopLat, longitude: shopLng,
              });
              await AsyncStorage.setItem('user_search_response', JSON.stringify(data));
            }
          } catch {}
        }
      } else {
        await AsyncStorage.setItem('customer_name', name);
      }

      Alert.alert('Success', 'Your profile has been updated successfully.');
      setEditing(false);
    } catch (e) {
      console.error('Error saving:', e);
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Image functions
  const handleTakePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission required'); return; }
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true });
      if (!result.canceled && result.assets?.length) {
        setPendingImageUri(result.assets[0].uri);
        setPendingImageBase64(result.assets[0].base64 ?? null);
      }
    } catch (e) { Alert.alert('Error', 'Unable to open camera.'); }
  };

  const handlePickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission required'); return; }
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true });
      if (!result.canceled && result.assets?.length) {
        setPendingImageUri(result.assets[0].uri);
        setPendingImageBase64(result.assets[0].base64 ?? null);
      }
    } catch (e) { Alert.alert('Error', 'Unable to open gallery.'); }
  };

  const handleUpdateProfileImage = async () => {
    if (!pendingImageUri) return;
    setIsSavingImage(true);
    try {
      // Resolve effective userType using THREE signals (priority order):
      //   1. `from` route param (e.g. `dual-merchant`, `dual-customer`, `user`, `member`, `merchant`)
      //   2. Stored `user_type` value ('in_Merchant' / 'in_Customer' / 'dual' / 'new_user')
      //   3. Local `isMerchant` flag (derived from search response / merchant_id)
      // NOTE: Backend currently only supports IN_CUSTOMER and IN_MERCHANT — User dashboard
      // uploads are mirrored to IN_CUSTOMER until backend adds an IN_USER endpoint.
      const fromParam = String(params?.from ?? '').toLowerCase();
      const lowerUserType = (userType ?? '').toLowerCase();

      let userTypeParam: 'IN_CUSTOMER' | 'IN_MERCHANT';
      let idKey: 'merchant_id' | 'customer_id';

      if (fromParam === 'dual-merchant' || fromParam === 'merchant') {
        userTypeParam = 'IN_MERCHANT';
        idKey = 'merchant_id';
      } else if (
        fromParam === 'dual-customer' ||
        fromParam === 'member' ||
        fromParam === 'user'   // User dashboard → backend treats as IN_CUSTOMER
      ) {
        userTypeParam = 'IN_CUSTOMER';
        idKey = 'customer_id';
      } else if (lowerUserType === 'in_merchant' || lowerUserType.includes('merchant')) {
        userTypeParam = 'IN_MERCHANT';
        idKey = 'merchant_id';
      } else if (
        lowerUserType === 'in_customer' ||
        lowerUserType.includes('customer') ||
        lowerUserType === 'new_user' ||
        lowerUserType === 'user'
      ) {
        userTypeParam = 'IN_CUSTOMER';
        idKey = 'customer_id';
      } else if (lowerUserType === 'dual') {
        // No explicit `from` param on dual dashboard → fall back to whichever side has data
        userTypeParam = isMerchant ? 'IN_MERCHANT' : 'IN_CUSTOMER';
        idKey = isMerchant ? 'merchant_id' : 'customer_id';
      } else {
        userTypeParam = isMerchant ? 'IN_MERCHANT' : 'IN_CUSTOMER';
        idKey = isMerchant ? 'merchant_id' : 'customer_id';
      }

      const inTownId =
        (userTypeParam === 'IN_MERCHANT'
          ? (merchantId || await AsyncStorage.getItem('merchant_id'))
          : await AsyncStorage.getItem(idKey));

      // No backend id available — store locally so the UI still updates
      if (!inTownId || !/^\d+$/.test(inTownId)) {
        await AsyncStorage.setItem('user_profile_image', pendingImageUri);
        setProfileImage(pendingImageUri);
        setPendingImageUri(null);
        Alert.alert('Saved locally', 'Image saved locally. It will sync when your account is fully set up.');
        return;
      }

      // 1) Upload via the same S3 endpoint used during registration
      const uploadUrl = `${INTOWN_API_BASE}/s3/upload?userType=${userTypeParam}&inTownId=${inTownId}`;
      const fileName = `${userTypeParam.toLowerCase()}_${inTownId}_${Date.now()}.jpg`;
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const r = await fetch(pendingImageUri);
        const blob = await r.blob();
        formData.append('file', blob, fileName);
      } else {
        formData.append('file', { uri: pendingImageUri, name: fileName, type: 'image/jpeg' } as any);
      }

      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });

      if (!uploadRes.ok) {
        const txt = await uploadRes.text();
        console.warn('[Account] s3 upload failed', uploadRes.status, txt);
        Alert.alert('Upload Failed', 'Could not upload the image. Please try again.');
        return;
      }

      // 2) Pull the authoritative image list back from the server so we get the
      // canonical S3 URL (the upload endpoint response shape varies; using
      // /s3?merchantId= matches the registration flow at line 149 of
      // register-merchant.tsx).
      let canonicalUrl: string | null = null;
      try {
        const listUrl =
          userTypeParam === 'IN_MERCHANT'
            ? `${INTOWN_API_BASE}/s3?merchantId=${inTownId}`
            : `${INTOWN_API_BASE}/s3?customerId=${inTownId}`;
        const listRes = await fetch(listUrl);
        if (listRes.ok) {
          const listData = await listRes.json();
          const imgs: any = listData?.s3ImageUrl;
          if (Array.isArray(imgs) && imgs.length > 0) {
            // Latest upload is typically last in the list
            canonicalUrl = String(imgs[imgs.length - 1]);
            // Save full list under the merchant-image AsyncStorage convention
            if (userTypeParam === 'IN_MERCHANT') {
              await AsyncStorage.setItem('merchant_shop_images', JSON.stringify(imgs));
            }
          }
        }
      } catch (e) {
        console.warn('[Account] /s3 list fetch failed:', e);
      }

      // Fallback: try to parse the upload response itself
      if (!canonicalUrl) {
        try {
          const raw = await uploadRes.clone().text();
          const parsed = raw ? JSON.parse(raw) : null;
          if (parsed) {
            if (Array.isArray(parsed?.s3ImageUrl) && parsed.s3ImageUrl.length > 0) {
              canonicalUrl = String(parsed.s3ImageUrl[parsed.s3ImageUrl.length - 1]);
            } else if (typeof parsed?.url === 'string') {
              canonicalUrl = parsed.url;
            } else if (Array.isArray(parsed) && parsed.length > 0) {
              const last = parsed[parsed.length - 1];
              canonicalUrl = last?.url || last?.s3ImageUrl || null;
            }
          }
        } catch {
          // ignore JSON parse failure
        }
      }

      // Persist + reflect everywhere
      const finalUrl = canonicalUrl || pendingImageUri;
      await AsyncStorage.setItem('user_profile_image', finalUrl);
      if (userTypeParam === 'IN_MERCHANT') {
        await AsyncStorage.setItem('merchant_profile_image', finalUrl);
      } else {
        await AsyncStorage.setItem('customer_profile_image', finalUrl);
      }
      setProfileImage(finalUrl);
      setPendingImageUri(null);
      Alert.alert('Success', 'Profile image updated.');
    } catch (e) {
      console.error('[Account] handleUpdateProfileImage error:', e);
      Alert.alert('Error', 'Failed to update image.');
    } finally {
      setIsSavingImage(false);
    }
  };

  // Time picker helpers
  const getTimeValue = (field: string) => {
    if (field === 'openAt') return openAt;
    if (field === 'closeAt') return closeAt;
    if (field === 'breakStartAt') return breakStartAt;
    return breakEndAt;
  };
  const setTimeValue = (field: string, val: string) => {
    if (field === 'openAt') setOpenAt(val);
    else if (field === 'closeAt') setCloseAt(val);
    else if (field === 'breakStartAt') setBreakStartAt(val);
    else setBreakEndAt(val);
  };

  const renderField = (label: string, value: string, setter?: (v: string) => void, opts?: { multiline?: boolean; keyboardType?: string }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      {editing && setter ? (
        <TextInput
          style={[styles.input, opts?.multiline && styles.textArea]}
          value={value}
          onChangeText={setter}
          multiline={opts?.multiline}
          keyboardType={opts?.keyboardType as any}
          placeholderTextColor="#999"
        />
      ) : (
        <Text style={styles.value}>{value || 'Not provided'}</Text>
      )}
    </View>
  );

  const renderTimeField = (label: string, field: string) => (
    <View style={styles.timeFieldHalf}>
      <Text style={styles.label}>{label}</Text>
      {editing ? (
        <TouchableOpacity style={styles.timeBtn} onPress={() => setShowTimePicker(field)}>
          <Ionicons name="time-outline" size={16} color="#FF8A00" />
          <Text style={styles.timeBtnText}>{getTimeValue(field) || 'Select'}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.value}>{getTimeValue(field) || 'N/A'}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>My Account</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Text style={styles.editBtn}>{editing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Dual-user context pill */}
        {isDualUser && (
          <View
            style={[
              styles.contextPillWrap,
              { backgroundColor: isMerchant ? '#FFF3E0' : '#E8F5E9' },
            ]}
            testID="account-context-pill"
          >
            <Ionicons
              name={isMerchant ? 'storefront' : 'person'}
              size={14}
              color={isMerchant ? '#B45309' : '#0C8A4A'}
            />
            <Text
              style={[
                styles.contextPillText,
                { color: isMerchant ? '#B45309' : '#0C8A4A' },
              ]}
            >
              You're editing: {isMerchant ? 'Merchant profile' : 'Customer profile'}
            </Text>
          </View>
        )}

        {/* PROFILE IMAGE */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageWrapper}>
            {pendingImageUri || profileImage ? (
              <Image source={{ uri: pendingImageUri || profileImage! }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Ionicons name="person" size={40} color="#FF8A00" />
              </View>
            )}
          </View>
          <View style={styles.profileActions}>
            <TouchableOpacity style={styles.profileButton} onPress={handleTakePhoto}>
              <Ionicons name="camera" size={16} color="#FF8A00" />
              <Text style={styles.profileButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={handlePickImage}>
              <Ionicons name="image" size={16} color="#FF8A00" />
              <Text style={styles.profileButtonText}>Upload Gallery</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.updateButton, !pendingImageUri && styles.updateButtonDisabled]}
            onPress={handleUpdateProfileImage}
            disabled={!pendingImageUri || isSavingImage}
          >
            <Text style={styles.updateButtonText}>{isSavingImage ? 'Updating...' : 'Update Profile Image'}</Text>
          </TouchableOpacity>
        </View>

        {/* BASIC INFO */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          {renderField('Name', name, setName)}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{user?.phone ?? '-'}</Text>
          </View>

          {renderField('Email', email, setEmail, { keyboardType: 'email-address' })}

          {editing && !isMerchant && (
            <TouchableOpacity style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} onPress={onSave} disabled={isSaving}>
              <Text style={styles.saveText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* MERCHANT-SPECIFIC FIELDS */}
        {isMerchant && (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Business Details</Text>

              {renderField('Contact Name', contactName, setContactName)}

              {/* Business Category */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Business Category</Text>
                {editing ? (
                  <TouchableOpacity style={styles.selectBtn} onPress={() => setShowCategoryModal(true)}>
                    <Text style={styles.selectBtnText}>{businessCategory || 'Select Category'}</Text>
                    <Ionicons name="chevron-down" size={18} color="#666" />
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.value}>{businessCategory || 'Not set'}</Text>
                )}
              </View>

              {/* Products */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Products</Text>

                {/* Existing products list */}
                {customProductsList.length > 0 && (
                  <View style={styles.chipList}>
                    {customProductsList.map((pName, idx) => (
                      <View key={`custom-${idx}`} style={styles.chip}>
                        <Text style={styles.chipText}>{pName}</Text>
                        {editing && (
                          <TouchableOpacity onPress={() => setCustomProductsList(prev => prev.filter((_, i) => i !== idx))}>
                            <Ionicons name="close-circle" size={16} color="#FF5252" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Category products selector */}
                {editing && businessCategory && products.length > 0 && (
                  <TouchableOpacity style={[styles.selectBtn, { marginTop: 8 }]} onPress={() => setShowProductModal(true)}>
                    <Text style={styles.selectBtnText}>Select from Category Products</Text>
                    <Ionicons name="chevron-down" size={18} color="#666" />
                  </TouchableOpacity>
                )}

                {/* Add new product input */}
                {editing && (
                  <View style={styles.addProductRow}>
                    <TextInput
                      style={styles.addProductInput}
                      placeholder="Add new product..."
                      placeholderTextColor="#999"
                      value={newProductInput}
                      onChangeText={setNewProductInput}
                      onSubmitEditing={() => {
                        if (newProductInput.trim()) {
                          setCustomProductsList(prev => [...prev, newProductInput.trim()]);
                          setNewProductInput('');
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={[styles.addProductBtn, !newProductInput.trim() && styles.addProductBtnDisabled]}
                      disabled={!newProductInput.trim()}
                      onPress={() => {
                        if (newProductInput.trim()) {
                          setCustomProductsList(prev => [...prev, newProductInput.trim()]);
                          setNewProductInput('');
                        }
                      }}
                    >
                      <Ionicons name="add" size={22} color={newProductInput.trim() ? '#FFF' : '#CCC'} />
                    </TouchableOpacity>
                  </View>
                )}

                {!editing && customProductsList.length === 0 && (
                  <Text style={styles.value}>No products added</Text>
                )}
              </View>

              {renderField('Description', description, setDescription, { multiline: true })}
              {renderField('Years in Business', fromYears, setFromYears, { keyboardType: 'numeric' })}
              {renderField('Branches', branches, setBranches, { keyboardType: 'numeric' })}
            </View>

            {/* SHOP LOCATION */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Shop Location</Text>
              {shopLat && shopLng ? (
                <View style={styles.locationDisplay}>
                  <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                  <Text style={styles.locationText}>{shopLat.toFixed(4)}, {shopLng.toFixed(4)}</Text>
                </View>
              ) : (
                <Text style={styles.value}>Not set</Text>
              )}
              {editing && (
                <TouchableOpacity style={styles.mapBtn} onPress={() => router.push({ pathname: '/location-picker', params: { returnTo: '/account' } })}>
                  <Ionicons name="map-outline" size={16} color="#FF8A00" />
                  <Text style={styles.mapBtnText}>Change on Map</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* BUSINESS TIMINGS */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Business Timings</Text>
              <View style={styles.timeRow}>
                {renderTimeField('Open', 'openAt')}
                {renderTimeField('Close', 'closeAt')}
              </View>
              <View style={styles.timeRow}>
                {renderTimeField('Break Start', 'breakStartAt')}
                {renderTimeField('Break End', 'breakEndAt')}
              </View>

              {/* Week Off */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Week Off</Text>
                {editing ? (
                  <View style={styles.dayChips}>
                    {DAYS_OF_WEEK.map(day => {
                      const selected = weekOff.split(',').map(d => d.trim()).includes(day);
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[styles.dayChip, selected && styles.dayChipSelected]}
                          onPress={() => {
                            if (day === 'None') {
                              setWeekOff(selected ? '' : 'None');
                            } else {
                              const current = weekOff.split(',').map(d => d.trim()).filter(d => d && d !== 'None');
                              setWeekOff(selected ? current.filter(d => d !== day).join(', ') : [...current, day].join(', '));
                            }
                          }}
                        >
                          <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>{day === 'None' ? 'None' : day.slice(0, 3)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.value}>{weekOff || 'None'}</Text>
                )}
              </View>
            </View>

            {/* OFFER */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Offer</Text>
              {renderField('Current Offer', offer, setOffer, { multiline: true })}
            </View>

            {/* SAVE BUTTON */}
            {editing && (
              <TouchableOpacity style={[styles.saveBtn, styles.saveBtnFull, isSaving && styles.saveBtnDisabled]} onPress={onSave} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Save All Changes</Text>}
              </TouchableOpacity>
            )}
          </>
        )}

        {/* QUICK LINKS */}
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/payment-history')}>
            <View style={styles.menuIconWrap}><Ionicons name="receipt-outline" size={20} color="#FF8A00" /></View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Payment History</Text>
              <Text style={styles.menuSubtitle}>View past transactions and savings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/plans')}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#E8F5E9' }]}><Ionicons name="diamond-outline" size={20} color="#4CAF50" /></View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Subscription Plans</Text>
              <Text style={styles.menuSubtitle}>Manage or upgrade your plan</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/savings')}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#F0F4FF' }]}><Ionicons name="wallet-outline" size={20} color="#2196F3" /></View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>My Savings</Text>
              <Text style={styles.menuSubtitle}>Track your savings breakdown</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* CATEGORY MODAL */}
      <Modal visible={showCategoryModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.modalItem, businessCategory === cat.name && styles.modalItemSelected]}
                  onPress={() => {
                    setBusinessCategory(cat.name);
                    loadProductsForCategory(cat.id);
                    setSelectedProductIds([]);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, businessCategory === cat.name && styles.modalItemTextSelected]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PRODUCT MODAL */}
      <Modal visible={showProductModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Products</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {products.map(p => {
                const selected = selectedProductIds.includes(p.id);
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.modalItem, selected && styles.modalItemSelected]}
                    onPress={() => {
                      if (selected) {
                        setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                        setCustomProductsList(prev => prev.filter(n => n !== p.name));
                      } else {
                        setSelectedProductIds(prev => [...prev, p.id]);
                        if (!customProductsList.includes(p.name)) {
                          setCustomProductsList(prev => [...prev, p.name]);
                        }
                      }
                    }}
                  >
                    <Text style={[styles.modalItemText, selected && styles.modalItemTextSelected]}>{p.name}</Text>
                    {selected && <Ionicons name="checkmark" size={18} color="#FF8A00" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowProductModal(false)}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TIME PICKER MODAL */}
      <Modal visible={!!showTimePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {showTimePicker === 'openAt' ? 'Open Time' : showTimePicker === 'closeAt' ? 'Close Time' : showTimePicker === 'breakStartAt' ? 'Break Start' : 'Break End'}
            </Text>
            <View style={styles.spinnerRow}>
              {/* Hour */}
              <View style={styles.spinnerCol}>
                <TouchableOpacity style={styles.spinnerArrow} onPress={() => {
                  const cv = getTimeValue(showTimePicker!);
                  const h = cv ? parseInt(cv.split(':')[0]) : 9;
                  const parts = cv ? cv.replace(/\s*(AM|PM)$/i, '').split(':') : ['09', '00'];
                  const ampm = cv?.includes('PM') ? 'PM' : 'AM';
                  setTimeValue(showTimePicker!, `${String(h >= 12 ? 1 : h + 1).padStart(2, '0')}:${parts[1] || '00'} ${ampm}`);
                }}>
                  <Ionicons name="chevron-up" size={28} color="#AAA" />
                </TouchableOpacity>
                <View style={styles.spinnerBox}><Text style={styles.spinnerText}>{getTimeValue(showTimePicker!)?.split(':')[0] || '09'}</Text></View>
                <TouchableOpacity style={styles.spinnerArrow} onPress={() => {
                  const cv = getTimeValue(showTimePicker!);
                  const h = cv ? parseInt(cv.split(':')[0]) : 9;
                  const parts = cv ? cv.replace(/\s*(AM|PM)$/i, '').split(':') : ['09', '00'];
                  const ampm = cv?.includes('PM') ? 'PM' : 'AM';
                  setTimeValue(showTimePicker!, `${String(h <= 1 ? 12 : h - 1).padStart(2, '0')}:${parts[1] || '00'} ${ampm}`);
                }}>
                  <Ionicons name="chevron-down" size={28} color="#AAA" />
                </TouchableOpacity>
              </View>
              <Text style={styles.colonText}>:</Text>
              {/* Minute */}
              <View style={styles.spinnerCol}>
                <TouchableOpacity style={styles.spinnerArrow} onPress={() => {
                  const MINS = [0,5,10,15,20,25,30,35,40,45,50,55];
                  const cv = getTimeValue(showTimePicker!);
                  const m = cv ? parseInt(cv.replace(/\s*(AM|PM)$/i, '').split(':')[1]) : 0;
                  const next = MINS[(MINS.indexOf(m) + 1) % MINS.length];
                  const parts = cv ? cv.replace(/\s*(AM|PM)$/i, '').split(':') : ['09', '00'];
                  const ampm = cv?.includes('PM') ? 'PM' : 'AM';
                  setTimeValue(showTimePicker!, `${parts[0] || '09'}:${String(next).padStart(2, '0')} ${ampm}`);
                }}>
                  <Ionicons name="chevron-up" size={28} color="#AAA" />
                </TouchableOpacity>
                <View style={styles.spinnerBox}><Text style={styles.spinnerText}>{(() => { const cv = getTimeValue(showTimePicker!); const parts = cv ? cv.replace(/\s*(AM|PM)$/i, '').split(':') : ['09', '00']; return parts[1] || '00'; })()}</Text></View>
                <TouchableOpacity style={styles.spinnerArrow} onPress={() => {
                  const MINS = [0,5,10,15,20,25,30,35,40,45,50,55];
                  const cv = getTimeValue(showTimePicker!);
                  const m = cv ? parseInt(cv.replace(/\s*(AM|PM)$/i, '').split(':')[1]) : 0;
                  const next = MINS[(MINS.indexOf(m) - 1 + MINS.length) % MINS.length];
                  const parts = cv ? cv.replace(/\s*(AM|PM)$/i, '').split(':') : ['09', '00'];
                  const ampm = cv?.includes('PM') ? 'PM' : 'AM';
                  setTimeValue(showTimePicker!, `${parts[0] || '09'}:${String(next).padStart(2, '0')} ${ampm}`);
                }}>
                  <Ionicons name="chevron-down" size={28} color="#AAA" />
                </TouchableOpacity>
              </View>
              {/* AM/PM */}
              <View style={styles.spinnerCol}>
                <TouchableOpacity style={styles.spinnerArrow} onPress={() => {
                  const cv = getTimeValue(showTimePicker!);
                  const timePart = cv ? cv.replace(/\s*(AM|PM)$/i, '').trim() : '09:00';
                  const current = cv?.includes('PM') ? 'PM' : 'AM';
                  setTimeValue(showTimePicker!, `${timePart} ${current === 'AM' ? 'PM' : 'AM'}`);
                }}>
                  <Ionicons name="chevron-up" size={28} color="#AAA" />
                </TouchableOpacity>
                <View style={styles.spinnerBox}><Text style={styles.spinnerText}>{getTimeValue(showTimePicker!)?.includes('PM') ? 'PM' : 'AM'}</Text></View>
                <TouchableOpacity style={styles.spinnerArrow} onPress={() => {
                  const cv = getTimeValue(showTimePicker!);
                  const timePart = cv ? cv.replace(/\s*(AM|PM)$/i, '').trim() : '09:00';
                  const current = cv?.includes('PM') ? 'PM' : 'AM';
                  setTimeValue(showTimePicker!, `${timePart} ${current === 'AM' ? 'PM' : 'AM'}`);
                }}>
                  <Ionicons name="chevron-down" size={28} color="#AAA" />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowTimePicker(null)}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F5F5F5' },
  contextPillWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  contextPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 32 },
  backButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 22, fontWeight: '700', marginLeft: 8 },
  editBtn: { color: '#FF8A00', fontWeight: '600', fontSize: 16 },
  profileCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center' },
  profileImageWrapper: { width: 96, height: 96, borderRadius: 48, overflow: 'hidden', borderWidth: 2, borderColor: '#FF8A00', marginBottom: 12 },
  profileImage: { width: '100%', height: '100%' },
  profilePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF3E0' },
  profileActions: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  profileButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  profileButtonText: { marginLeft: 6, color: '#FF8A00', fontWeight: '600', fontSize: 12 },
  updateButton: { backgroundColor: '#FF8A00', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  updateButtonDisabled: { backgroundColor: '#F4B183' },
  updateButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 8 },
  fieldGroup: { marginBottom: 12 },
  label: { fontSize: 12, color: '#777', marginBottom: 4 },
  value: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, fontSize: 15, color: '#1A1A1A' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  selectBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12 },
  selectBtnText: { fontSize: 15, color: '#333' },
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', borderRadius: 16, paddingVertical: 4, paddingLeft: 10, paddingRight: 6, gap: 4 },
  chipText: { fontSize: 12, color: '#333', fontWeight: '500' },
  addProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  addProductInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#1A1A1A',
  },
  addProductBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FF8A00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addProductBtnDisabled: {
    backgroundColor: '#E0E0E0',
  },
  locationDisplay: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  mapBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FF8A00', backgroundColor: '#FFF8F0' },
  mapBtnText: { fontSize: 14, fontWeight: '600', color: '#FF8A00' },
  timeRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  timeFieldHalf: { flex: 1 },
  timeBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, gap: 8 },
  timeBtnText: { fontSize: 14, color: '#333' },
  dayChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#DDD', backgroundColor: '#FFF' },
  dayChipSelected: { backgroundColor: '#FF8A00', borderColor: '#FF8A00' },
  dayChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  dayChipTextSelected: { color: '#FFF' },
  saveBtn: { backgroundColor: '#FF8A00', padding: 14, borderRadius: 10, marginTop: 16, alignItems: 'center' },
  saveBtnFull: { marginBottom: 16 },
  saveBtnDisabled: { backgroundColor: '#F4B183' },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  menuCard: { backgroundColor: '#fff', borderRadius: 12, padding: 4, marginTop: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12 },
  menuIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuTextWrap: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  menuSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 12 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  modalItemSelected: { backgroundColor: '#FFF3E0' },
  modalItemText: { fontSize: 15, color: '#333' },
  modalItemTextSelected: { color: '#FF8A00', fontWeight: '600' },
  modalClose: { backgroundColor: '#FF8A00', padding: 14, borderRadius: 10, marginTop: 12, alignItems: 'center' },
  modalCloseText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  // Time Spinner
  spinnerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  spinnerCol: { alignItems: 'center', flex: 1 },
  spinnerArrow: { padding: 8 },
  spinnerBox: { borderWidth: 1, borderColor: '#DDD', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, minWidth: 56, alignItems: 'center', backgroundColor: '#FAFAFA', marginVertical: 4 },
  spinnerText: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  colonText: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginHorizontal: 2 },
});
