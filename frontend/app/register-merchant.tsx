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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerMerchant } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import * as Location from 'expo-location';
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
  const { setUserType, user } = useAuthStore();

  /* ================= ORIGINAL STATES (UNCHANGED) ================= */

  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [shopName, setShopName] = useState('');

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
        shopName,
        businessCategory,
        description,
        fromYears: yearsInBusiness,
        branchesOfBusiness: branches,
        email,
        phoneNumber,
        pincode: Number(pincode),
        userType: 'IN_MERCHANT',
        latitude: location.latitude,
        longitude: location.longitude,
        address,
        introducedBy,
        images,
        agreedToTerms,
        categoryList: selectedCategoryId ? [selectedCategoryId] : [],

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
        if (merchantId) {
          await AsyncStorage.setItem('merchant_id', String(merchantId));
        }
        if (shopName) {
          await AsyncStorage.setItem('merchant_shop_name', shopName);
        }
        if (location?.latitude != null && location?.longitude != null) {
          await AsyncStorage.setItem('merchant_location_lat', String(location.latitude));
          await AsyncStorage.setItem('merchant_location_lng', String(location.longitude));
        }

        // Show success message
        const successMessage = `Your merchant account has been created successfully!\nMerchant ID: ${
          merchantId ?? 'N/A'
        }`;

        Alert.alert('Registration Successful', successMessage, [
          {
            text: 'OK',
            onPress: () => {
              setUserType('merchant');
              router.replace({
                pathname: '/merchant-dashboard',
                params: merchantId ? { merchantId: String(merchantId) } : {},
              });
            },
          },
        ]);
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

    const filteredCategories = categories.filter(cat =>
  cat.name.toLowerCase().includes(categorySearch.toLowerCase())
);

const displayedCategories = showAllCategories
  ? filteredCategories
  : filteredCategories.slice(0, VISIBLE_CATEGORY_COUNT);



    /* ================= UI (UNCHANGED) ================= */

    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Merchant Registration</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

            {/* BUSINESS NAME */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Business Name *</Text>
              <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} />
            </View>
{/* SHOP NAME */}
            <View style={styles.formGroup}>
  <Text style={styles.label}>Shop Name *</Text>
  <TextInput
    style={styles.input}
    value={shopName}
    onChangeText={setShopName}
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



  });
  

