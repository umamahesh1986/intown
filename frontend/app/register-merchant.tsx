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
  Image,
  Modal,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerMerchant } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import {
  getCategories,
  getProductsByCategory,
} from '../utils/api';





export default function RegisterMerchant() {
  const DUMMY_CATEGORIES = [
    { id: 1, name: 'Grocery' },
    { id: 2, name: 'Fruits & Vegetables' },
    { id: 3, name: 'Medical Store' },
    { id: 4, name: 'Bakery' },
  ];

  const router = useRouter();
  const params = useLocalSearchParams<{
    latitude?: string;
    longitude?: string;
    returnTo?: string;
  }>();
  const returnTo = params.returnTo ?? '/login';
  const { setUserType, user } = useAuthStore();
  const draftKey = 'register_merchant_draft';

  /* ================= ORIGINAL STATES (UNCHANGED) ================= */

  const [contactName, setContactName] = useState('');
  const [businessName, setBusinessName] = useState('');

  const [businessCategory, setBusinessCategory] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [description, setDescription] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [branches, setBranches] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pincode, setPincode] = useState('');
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: 17.385044,   // Hyderabad default
    longitude: 78.486671,
  });

  const [address, setAddress] = useState('');
  const [introducedBy, setIntroducedBy] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successMerchantId, setSuccessMerchantId] = useState<string | number | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buildImageFormData = async (files: string[], inTownIdValue: string | number) => {
    const formData = new FormData();
    for (let index = 0; index < files.length; index += 1) {
      const img = files[index];
      const fileName = `merchant_${inTownIdValue}_${index + 1}.jpg`;
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
    const url = `https://api.intownlocal.com/IN/s3/upload?userType=IN_MERCHANT&inTownId=${inTownIdValue}`;
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

  const fetchMerchantImages = async (merchantIdValue: string | number) => {
    const res = await fetch(`https://api.intownlocal.com/IN/s3?merchantId=${merchantIdValue}`);
    if (!res.ok) {
      throw new Error(`Image fetch failed: ${res.status}`);
    }
    const data = await res.json();
    const images = Array.isArray(data?.s3ImageUrl) ? data.s3ImageUrl : [];
    if (!images.length) return;
    await AsyncStorage.setItem('merchant_profile_image', images[0]);
    await AsyncStorage.setItem('merchant_shop_images', JSON.stringify(images));
  };
  const addImages = (newImages: string[]) => {
    setImages((prev) => Array.from(new Set([...prev, ...newImages])));
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const getImagePreviewSource = (value: string) => {
    if (!value) return null;
    // Return as-is for URIs
    return { uri: value };
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
        base64: false,
      });

      if (result.canceled) return;
      
      const newImages: string[] = [];
      if (result.assets && result.assets.length > 0) {
        result.assets.forEach((asset: any) => {
          if (asset.uri) {
            newImages.push(asset.uri);
          }
        });
      }
      
      console.log('Selected images:', newImages);
      if (newImages.length > 0) {
        addImages(newImages);
      }
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
        base64: false,
      });

      if (result.canceled) return;
      
      const imageUri = result.assets?.[0]?.uri;
      console.log('Camera image:', imageUri);
      if (imageUri) {
        addImages([imageUri]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Unable to open camera');
    }
  };
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  /* ================= BACKEND CATEGORY FLOW (NEW) ================= */

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const VISIBLE_CATEGORY_COUNT = 9;
  const [showAllCategories, setShowAllCategories] = useState(false);

  const [productsByCategory, setProductsByCategory] = useState<
    Record<number, { id: number; name: string }[]>
  >({});

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);

  const [hasOtherProducts, setHasOtherProducts] = useState(false);
  const [customProductsCsv, setCustomProductsCsv] = useState('');
  const [customProducts, setCustomProducts] =
    useState<{ id: number; name: string }[]>([]);

  /* ================= AUTO-POPULATE PHONE NUMBER ================= */

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

  /* ================= FETCH CATEGORIES ================= */

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();


      let finalCategories: { id: number; name: string }[] = [];

      if (Array.isArray(data) && data.length > 0) {
        finalCategories = data;
      } else if (Array.isArray(data?.data) && data.data.length > 0) {
        finalCategories = data.data;
      } else {
        finalCategories = DUMMY_CATEGORIES;
      }

      setCategories(finalCategories);

    } catch (err) {
      console.warn('Category API failed, using dummy categories');

      setCategories(DUMMY_CATEGORIES);

    }
  };



  /* ================= CATEGORY TOGGLE (BACKEND) ================= */

  const selectCategory = async (cat: { id: number; name: string }) => {
    // If same category clicked again, do nothing
    if (selectedCategoryId === cat.id) return;

    // Set selected category
    setSelectedCategoryId(cat.id);
    setBusinessCategory(cat.name);

    // Clear previously selected products
    setSelectedProductIds([]);
    setProducts([]);
    resetOtherProducts();


    try {
      const prodData = await getProductsByCategory(cat.id);

      if (Array.isArray(prodData)) {
        setProducts(prodData);
      } else if (Array.isArray(prodData?.data)) {
        setProducts(prodData.data);
      } else {
        setProducts([]);
      }

      // ✅ OPEN POPUP ONLY AFTER PRODUCTS ARE READY
      setShowProductModal(true);

    } catch (error) {
      console.error('Failed to fetch products by category', error);
      setProducts([]);

      // ✅ STILL OPEN POPUP FOR CSV ENTRY
      setShowProductModal(true);
    }
  };



  const toggleProduct = (productId: number) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  /* ================= CSV → PRODUCTS (UNCHANGED) ================= */

  /* ================= CSV → PRODUCTS (AUTO SELECT) ================= */

  useEffect(() => {
    if (!hasOtherProducts || !customProductsCsv.trim()) {
      setCustomProducts([]);
      return;
    }

    const csvProducts = customProductsCsv
      .split(',')
      .map(p => p.trim())
      .filter(Boolean)
      .map((name, index) => ({
        id: 9000 + index, // temporary frontend ID
        name,
      }));

    setCustomProducts(csvProducts);

    // ✅ AUTO-SELECT CSV PRODUCTS
    setSelectedProductIds(prev => {
      const csvIds = csvProducts.map(p => p.id);
      return Array.from(new Set([...prev, ...csvIds]));
    });

  }, [customProductsCsv, hasOtherProducts]);

  /* ================= RESET CSV PRODUCTS STATE ================= */

  const resetOtherProducts = () => {
    setHasOtherProducts(false);
    setCustomProductsCsv('');
    setCustomProducts([]);
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

  const saveDraft = async () => {
    try {
      const draft = {
        contactName,
        businessName,
        businessCategory,
        description,
        yearsInBusiness,
        branches,
        email,
        phoneNumber,
        pincode,
        address,
        introducedBy,
        location,
        images,
        agreedToTerms,
        selectedCategoryId,
        selectedProductIds,
        hasOtherProducts,
        customProductsCsv,
      };
      await AsyncStorage.setItem(draftKey, JSON.stringify(draft));
    } catch (error) {
      console.error('Failed to save merchant draft', error);
    }
  };

  const restoreDraft = async () => {
    try {
      const stored = await AsyncStorage.getItem(draftKey);
      if (!stored) return;
      const draft = JSON.parse(stored);
      if (!draft) return;
      setContactName(draft.contactName ?? '');
      setBusinessName(draft.businessName ?? '');
      setBusinessCategory(draft.businessCategory ?? '');
      setDescription(draft.description ?? '');
      setYearsInBusiness(draft.yearsInBusiness ?? '');
      setBranches(draft.branches ?? '');
      setEmail(draft.email ?? '');
      setPhoneNumber(draft.phoneNumber ?? '');
      setPincode(draft.pincode ?? '');
      setAddress(draft.address ?? '');
      setIntroducedBy(draft.introducedBy ?? '');
      if (
        draft.location &&
        Number.isFinite(draft.location.latitude) &&
        Number.isFinite(draft.location.longitude)
      ) {
        setLocation({
          latitude: draft.location.latitude,
          longitude: draft.location.longitude,
        });
      }
      setImages(Array.isArray(draft.images) ? draft.images : []);
      setAgreedToTerms(Boolean(draft.agreedToTerms));
      setSelectedCategoryId(
        typeof draft.selectedCategoryId === 'number' ? draft.selectedCategoryId : null
      );
      setSelectedProductIds(
        Array.isArray(draft.selectedProductIds) ? draft.selectedProductIds : []
      );
      setHasOtherProducts(Boolean(draft.hasOtherProducts));
      setCustomProductsCsv(draft.customProductsCsv ?? '');
    } catch (error) {
      console.error('Failed to restore merchant draft', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadPickedLocation = async () => {
        try {
          await restoreDraft();
          const stored = await AsyncStorage.getItem(
            'location_picker_register_merchant'
          );
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
          await AsyncStorage.removeItem('location_picker_register_merchant');
        } catch (error) {
          console.error('Failed to load picked location', error);
        }
      };

      loadPickedLocation();
    }, [])
  );

  const handleSelectLocation = async () => {
    await saveDraft();
    router.push({ pathname: '/location-picker', params: { returnTo: '/register-merchant' } });
  };

  /* ================= LOCATION PICKER ================= */

  const pickLocation = async () => {
    try {
      // 🌐 WEB HANDLING (IMPORTANT)
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          Alert.alert('Error', 'Geolocation not supported in this browser');
          return;
        }

        navigator.geolocation.getCurrentPosition(
          position => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });

            Alert.alert('Location Set', 'Location captured successfully');
          },
          error => {
            console.error('Web location error:', error);
            Alert.alert('Location Error', 'Please allow location and try again');
          },
          { enableHighAccuracy: true }
        );

        return;
      }

      // 📱 MOBILE HANDLING
      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
        const permission =
          await Location.requestForegroundPermissionsAsync();
        status = permission.status;
      }

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow location permission to continue'
        );
        return;
      }

      // Small delay for first-time permission
      await new Promise(resolve => setTimeout(resolve, 800));

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      Alert.alert('Location Set', 'Location captured successfully');
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Unable to get location');
    }
  };



  /* ================= VALIDATION (UNCHANGED) ================= */

  const validateForm = () => {
    const newErrors: any = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // BUSINESS
    if (!contactName) newErrors.contactName = 'Required';
    if (!businessCategory) newErrors.businessCategory = 'Required';
    if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
      newErrors.location = 'Required';
    }
    // YEARS IN BUSINESS
    if (!yearsInBusiness) {
      newErrors.yearsInBusiness = 'Required';
    } else if (isNaN(Number(yearsInBusiness))) {
      newErrors.yearsInBusiness = 'Must be a number';
    }

    // BRANCHES
    if (!branches) {
      newErrors.branches = 'Required';
    } else if (isNaN(Number(branches))) {
      newErrors.branches = 'Must be a number';
    }



    // EMAIL (optional)
    if (email && !emailRegex.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }


    // PHONE (India – 10 digits)
    if (!phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      newErrors.phoneNumber = 'Enter valid 10-digit mobile number';
    }

    // PINCODE (India – 6 digits)
    if (!pincode) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      newErrors.pincode = 'Enter valid 6-digit pincode';
    }

    // LOCATION (required only on mobile, NOT web)
    if (Platform.OS !== 'web' && !location) {
      newErrors.location = 'Location required';
    }



    // TERMS
    if (!agreedToTerms) newErrors.terms = 'Accept terms';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  /* ================= SUBMIT (UNCHANGED) ================= */

  const handleRegister = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }

    setIsLoading(true);
    // ✅ MERGE EXISTING PRODUCTS + CSV PRODUCTS
    const allProducts = [...products, ...customProducts];

    const productNames = allProducts
      .filter(p => selectedProductIds.includes(p.id))
      .map(p => p.name);



    const payload = {
      businessName,
      contactName,
      businessCategory,
      description,
      fromYears: yearsInBusiness,
      branchesOfBusiness: branches,
      email,
      phoneNumber,
      pincode: Number(pincode),
      userType: 'IN_MERCHANT',
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      address,
      introducedBy,
      images,
      agreedToTerms,
      categoryList: selectedCategoryId ? [selectedCategoryId] : [],
      productIds: selectedProductIds.map(id => id.toString()),
      productNames,
    };

    try {
      const response = await registerMerchant(payload);
      console.log('Merchant registration success:', response);
      const merchantId =
        response?.merchantId ??
        response?.id ??
        response?.data?.merchantId ??
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
      if (merchantId) {
        await AsyncStorage.setItem('merchant_id', String(merchantId));
      }
      if (contactName) {
        await AsyncStorage.setItem('merchant_contact_name', contactName);
      }
      if (businessName) {
        await AsyncStorage.setItem('merchant_shop_name', businessName);
      }
      if (description) {
        await AsyncStorage.setItem('merchant_description', description);
      }
      await AsyncStorage.removeItem(draftKey);
      if (location?.latitude != null && location?.longitude != null) {
        await AsyncStorage.setItem('merchant_location_lat', String(location.latitude));
        await AsyncStorage.setItem('merchant_location_lng', String(location.longitude));
      }
      if (inTownId) {
        try {
          await uploadImagesToS3(inTownId, images);
          await fetchMerchantImages(inTownId);
        } catch (error) {
          console.error('S3 upload failed:', error);
        }
      }

      const popupMessage = `Your merchant account has been created successfully!\nMerchant ID: ${merchantId ?? 'N/A'
        }`;
      setSuccessMessage(popupMessage);
      setSuccessMerchantId(merchantId ?? null);
      setShowSuccessPopup(true);
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      successTimerRef.current = setTimeout(() => {
        handleSuccessClose(merchantId);
      }, 5000);
    } catch (error: any) {
      console.error('Merchant registration error:', error);

      // Show error message with details
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

  const handleSuccessClose = (merchantIdValue?: string | number | null) => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    setShowSuccessPopup(false);
    setUserType('merchant');
    const resolvedId = merchantIdValue ?? successMerchantId;
    router.replace({
      pathname: '/merchant-dashboard',
      params: resolvedId ? { merchantId: String(resolvedId) } : {},
    });
  };

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const displayedCategories = showAllCategories
    ? filteredCategories
    : filteredCategories.slice(0, VISIBLE_CATEGORY_COUNT);



  /* ================= UI (UNCHANGED) ================= */

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(returnTo as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Merchant Registration</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* SHOP NAME */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>


          {/* CONTACT NAME */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Contact Name *</Text>
            <TextInput style={styles.input} value={contactName} onChangeText={setContactName} />
          </View>

          {/* BUSINESS CATEGORY */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Business Category *</Text>
            <TextInput style={styles.input} value={businessCategory} editable={false} />
          </View>

          <Text style={styles.label}>Select Categories</Text>
          <TextInput
            placeholder="Search categories..."
            style={styles.input}
            value={categorySearch}
            onChangeText={setCategorySearch}
          />

          <View style={styles.categoryGrid}>
            {displayedCategories.map(cat => {
              const isSelected = selectedCategoryId === cat.id;


              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    isSelected && styles.categoryCardSelected,

                  ]}
                  onPress={() => selectCategory(cat)}

                >
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}

          </View>
          {filteredCategories.length > VISIBLE_CATEGORY_COUNT && (
            <TouchableOpacity
              onPress={() => setShowAllCategories(prev => !prev)}
              style={{ alignSelf: 'center', marginTop: 8 }}
            >
              <Text style={{ color: '#2196F3', fontWeight: '600' }}>
                {showAllCategories ? 'Show Less' : 'Show More'}
              </Text>
            </TouchableOpacity>
          )}




          {/* DESCRIPTION */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* YEARS IN BUSINESS */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Years in Business *</Text>
            <TextInput
              style={styles.input}
              value={yearsInBusiness}
              onChangeText={setYearsInBusiness}
              keyboardType="numeric"
            />
          </View>

          {/* BRANCHES */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Branches *</Text>
            <TextInput
              style={styles.input}
              value={branches}
              onChangeText={setBranches}
              keyboardType="numeric"
            />
          </View>

          {/* EMAIL */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>


          {/* PHONE NUMBER */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number *</Text>

            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={phoneNumber}
              onChangeText={t =>
                setPhoneNumber(t.replace(/[^0-9]/g, '').slice(0, 10))
              }
              keyboardType="number-pad"
              maxLength={10}
              placeholder="Enter 10-digit mobile number"
              editable={false}
            />

            {/* HELPER TEXT */}
            <Text style={styles.helperText}>
              This is your logged-in phone number
            </Text>

            {/* ERROR TEXT */}
            {errors.phoneNumber && (
              <Text style={styles.errorText}>{errors.phoneNumber}</Text>
            )}
          </View>


          {/* PINCODE */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Pincode *</Text>

            <TextInput
              style={styles.input}
              value={pincode}
              onChangeText={t =>
                setPincode(t.replace(/[^0-9]/g, '').slice(0, 6))
              }
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Enter 6-digit pincode"
            />

            {/* HELPER TEXT */}
            <Text style={styles.helperText}>
              Must be a valid 6-digit Indian pincode
            </Text>

            {/* ERROR TEXT */}
            {errors.pincode && (
              <Text style={styles.errorText}>{errors.pincode}</Text>
            )}
          </View>

          {/* LOCATION */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Shop Location *</Text>

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
          </View>


          {/* ADDRESS */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.textArea}
              value={address}
              onChangeText={setAddress}
              multiline
            />
          </View>

          {/* SHOP IMAGES */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Shop Images</Text>
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
                    <View key={`img-${index}`} style={styles.imageThumbContainer}>
                      <Image
                        source={{ uri: uri }}
                        style={styles.imageThumb}
                        resizeMode="cover"
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
            {images.length > 0 && (
              <Text style={styles.imageCountText}>{images.length} image(s) selected</Text>
            )}
          </View>

          {/* INTRODUCED BY */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Introduced By</Text>
            <TextInput
              style={styles.input}
              value={introducedBy}
              onChangeText={setIntroducedBy}
            />
          </View>

          {/* TERMS */}
          <View style={styles.row}>
            <Switch value={agreedToTerms} onValueChange={setAgreedToTerms} />
            <Text style={{ marginLeft: 8 }}>I agree to terms</Text>
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Register Merchant</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />

        </ScrollView>
      </KeyboardAvoidingView>
      {/* PRODUCT SELECTION POPUP */}
      {showProductModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>

            <Text style={styles.modalTitle}>
              Select Products ({businessCategory})
            </Text>

            <ScrollView style={{ maxHeight: 300 }}>
              {[...products, ...customProducts].map(product => {
                const checked = selectedProductIds.includes(product.id);

                return (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.productRow}
                    onPress={() => toggleProduct(product.id)}
                  >
                    <Ionicons
                      name={checked ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={checked ? '#2196F3' : '#999'}
                    />
                    <Text style={styles.productText}>{product.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>


            {/* OTHER PRODUCTS */}
            <View style={styles.row}>
              <Switch value={hasOtherProducts} onValueChange={setHasOtherProducts} />
              <Text style={{ marginLeft: 8 }}>Add other products</Text>
            </View>

            {hasOtherProducts && (
              <TextInput
                style={styles.input}
                placeholder="Enter products separated by comma"
                value={customProductsCsv}
                onChangeText={setCustomProductsCsv}
              />
            )}

            {/* ACTION BUTTONS */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  resetOtherProducts();
                  setShowProductModal(false);
                }}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>


              <TouchableOpacity
                style={styles.okBtn}
                onPress={() => {
                  resetOtherProducts();
                  setShowProductModal(false);
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>OK</Text>
              </TouchableOpacity>

            </View>

          </View>
        </View>
      )}

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

/* ================= STYLES (UNCHANGED) ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
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
  content: { padding: 16 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  textArea: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  rowText: { marginLeft: 8 },
  submitBtn: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    marginTop: 24,
    alignItems: 'center',
  },
  submitText: { color: '#FFF', fontWeight: '600' },
  helperText: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
    fontStyle: 'italic',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#666666',
  },
  errorText: {
    fontSize: 12,
    color: 'red',
    marginTop: 4,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FFD9B3',
  },
  imageButtonText: {
    marginLeft: 8,
    color: '#FF6600',
    fontWeight: '600',
  },
  imagesPreviewContainer: {
    overflow: 'visible',
    marginTop: 8,
  },
  imagesPreview: {
    paddingTop: 12,
    paddingBottom: 4,
    paddingLeft: 4,
  },
  imagesPreviewContent: {
    paddingRight: 16,
  },
  imageThumbContainer: {
    position: 'relative',
    marginRight: 16,
  },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#EEE',
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
  imageCountText: {
    marginTop: 8,
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
  },
  locationButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  categoryCard: {
    width: '31%',       // 3 columns
    padding: 14,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },

  categoryCardSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },

  categoryText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },

  categoryTextSelected: {
    color: '#2196F3',
    fontWeight: '700',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBox: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },

  productText: {
    marginLeft: 10,
    fontSize: 14,
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  okBtn: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
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


