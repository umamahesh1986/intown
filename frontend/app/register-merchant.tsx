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
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { registerMerchant } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import * as Location from 'expo-location';


export default function RegisterMerchant() {
  const DUMMY_CATEGORIES = [
    { id: 1, name: 'Grocery' },
    { id: 2, name: 'Fruits & Vegetables' },
    { id: 3, name: 'Medical Store' },
    { id: 4, name: 'Bakery' },
  ];

  const router = useRouter();
  const { setUserType } = useAuthStore();

  /* ================= ORIGINAL STATES (UNCHANGED) ================= */

  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  /* ================= BACKEND CATEGORY FLOW (NEW) ================= */

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<
    Record<number, { id: number; name: string }[]>
  >({});

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  const [hasOtherProducts, setHasOtherProducts] = useState(false);
  const [customProductsCsv, setCustomProductsCsv] = useState('');
  const [customProducts, setCustomProducts] =
    useState<{ id: number; name: string }[]>([]);

  /* ================= FETCH CATEGORIES ================= */

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:8080/IN/categories');
      const data = await res.json();

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

    const toggleCategory = async (cat: { id: number; name: string }) => {
      let updatedIds: number[];

      if (selectedCategoryIds.includes(cat.id)) {
        updatedIds = selectedCategoryIds.filter(id => id !== cat.id);
      } else {
        updatedIds = [...selectedCategoryIds, cat.id];

        if (!productsByCategory[cat.id]) {
          try {
            const res = await fetch(
              `http://localhost:8080/IN/products?categoryId=${cat.id}`
            );
            const prodData = await res.json();

            if (Array.isArray(prodData)) {
              setProductsByCategory(prev => ({
                ...prev,
                [cat.id]: prodData,
              }));
            } else if (Array.isArray(prodData?.data)) {
              setProductsByCategory(prev => ({
                ...prev,
                [cat.id]: prodData.data,
              }));
            }
          } catch (err) {
            console.error('Product fetch failed', err);
          }
        }
      }

      setSelectedCategoryIds(updatedIds);

      const categoryNames = categories
        .filter(c => updatedIds.includes(c.id))
        .map(c => c.name)
        .join(', ');
      setBusinessCategory(categoryNames);
      // 🔴 FIX: prevent empty category
      if (updatedIds.length === 0) {
        setBusinessCategory('');
        return;
      }


      const loadedProducts = updatedIds.flatMap(
        id => productsByCategory[id] || []
      );

      setProducts([...loadedProducts, ...customProducts]);
    };

    const toggleProduct = (productId: number) => {
      setSelectedProductIds(prev =>
        prev.includes(productId)
          ? prev.filter(id => id !== productId)
          : [...prev, productId]
      );
    };

    /* ================= CSV → PRODUCTS (UNCHANGED) ================= */

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
          id: 9000 + index,
          name,
        }));

      setCustomProducts(csvProducts);
    }, [customProductsCsv, hasOtherProducts]);

    useEffect(() => {
      const loadedProducts = selectedCategoryIds.flatMap(
        id => productsByCategory[id] || []
      );
      setProducts([...loadedProducts, ...customProducts]);
    }, [customProducts, selectedCategoryIds, productsByCategory]);

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
      if (!businessName) newErrors.businessName = 'Required';
      if (!contactName) newErrors.contactName = 'Required';
      if (!businessCategory) newErrors.businessCategory = 'Required';
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


      // EMAIL
      if (!email) {
        newErrors.email = 'Email is required';
      } else if (!emailRegex.test(email)) {
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

      const payload = {
        businessName,
        contactName,
        businessCategory,
        description,
        yearsInBusiness: Number(yearsInBusiness),
        branches: Number(branches),
        email,
        phoneNumber,
        pincode,
        location,
        address,
        introducedBy,
        images,
        agreedToTerms,
        categoryIds: selectedCategoryIds,
        productIds: selectedProductIds,
        customProducts: customProducts.map(p => p.name),
      };

      try {
        const res = await registerMerchant(payload);
        console.log('REGISTER SUCCESS:', res);

        setUserType('merchant');

        router.replace('/merchant-dashboard');
      } catch (error) {
        console.error('REGISTER FAILED:', error);
        Alert.alert('Registration failed', 'Please try again');
      } finally {
        setIsLoading(false);
      }

    };

    /* ================= UI (UNCHANGED) ================= */

    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView style={styles.content}>

            {/* BUSINESS NAME */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Business Name *</Text>
              <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} />
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
            {categories.map(cat => (
              <TouchableOpacity key={cat.id} style={styles.row} onPress={() => toggleCategory(cat)}>
                <Ionicons
                  name={selectedCategoryIds.includes(cat.id) ? 'checkbox' : 'square-outline'}
                  size={22}
                  color="#2196F3"
                />
                <Text style={styles.rowText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}

            {products.length > 0 && (
              <>
                <Text style={styles.label}>Select Products</Text>
                {products.map(prod => (
                  <TouchableOpacity key={prod.id} style={styles.row} onPress={() => toggleProduct(prod.id)}>
                    <Ionicons
                      name={selectedProductIds.includes(prod.id) ? 'checkbox' : 'square-outline'}
                      size={22}
                      color="#4CAF50"
                    />
                    <Text style={styles.rowText}>{prod.name}</Text>
                  </TouchableOpacity>
                ))}
              </>
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
              <Text style={styles.label}>Email *</Text>
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
    style={styles.input}
    value={phoneNumber}
    onChangeText={t =>
      setPhoneNumber(t.replace(/[^0-9]/g, '').slice(0, 10))
    }
    keyboardType="number-pad"
    maxLength={10}
    placeholder="Enter 10-digit mobile number"
  />

  {/* HELPER TEXT */}
  <Text style={styles.helperText}>
    Must be 10 digits (starts with 6–9)
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
                style={{
                  backgroundColor: '#4CAF50',
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                disabled
              >

                <Text style={{ color: '#FFF', fontWeight: '600' }}>
                  Location Set ✔
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
      </SafeAreaView>
    );
  }

  /* ================= STYLES (UNCHANGED) ================= */

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
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
},

errorText: {
  fontSize: 12,
  color: 'red',
  marginTop: 4,
},

  });

