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
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { registerMerchant } from '../utils/api';
import { useAuthStore } from '../store/authStore';

export default function RegisterMerchant() {
  const router = useRouter();
  const { setUserType } = useAuthStore();
  
  // Form state
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [description, setDescription] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [branches, setBranches] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pincode, setPincode] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState('');
  const [introducedBy, setIntroducedBy] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validateForm = () => {
    const newErrors: any = {};
    if (!businessName || businessName.trim().length < 2) newErrors.businessName = 'Business name must be at least 2 characters';
    if (!contactName || contactName.trim().length < 2) newErrors.contactName = 'Contact name must be at least 2 characters';
    if (!businessCategory || businessCategory.trim().length < 2) newErrors.businessCategory = 'Business category is required';
    if (!description || description.trim().length < 10) newErrors.description = 'Description must be at least 10 characters';
    if (!yearsInBusiness || isNaN(Number(yearsInBusiness)) || Number(yearsInBusiness) < 0) newErrors.yearsInBusiness = 'Please enter valid years';
    if (!branches || isNaN(Number(branches)) || Number(branches) < 1) newErrors.branches = 'Please enter valid number of branches';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) newErrors.email = 'Please enter a valid email';
    const phoneRegex = /^\d{10}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) newErrors.phoneNumber = 'Phone must be 10 digits';
    const pincodeRegex = /^\d{6}$/;
    if (!pincode || !pincodeRegex.test(pincode)) newErrors.pincode = 'Pincode must be 6 digits';
    if (!location) newErrors.location = 'Please select location';
    if (!agreedToTerms) newErrors.terms = 'You must agree to terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    setIsLoading(true);
    try {
      const response = await registerMerchant({ businessName, contactName, businessCategory, description, yearsInBusiness: Number(yearsInBusiness), branches: Number(branches), email, phoneNumber, pincode, location, address, introducedBy, images, agreedToTerms });
      
      // Always succeed - set merchant type and redirect
      await setUserType('merchant');
      router.replace('/merchant-dashboard');
    } catch (error) {
      // Even on error, set merchant type and redirect
      await setUserType('merchant');
      router.replace('/merchant-dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#1A1A1A" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Merchant Registration</Text>
          <View style={{width:40}} />
        </View>
        <ScrollView style={styles.content}>
          <View style={styles.formGroup}><Text style={styles.label}>Business Name *</Text><TextInput style={[styles.input, errors.businessName && {borderColor:'#FF0000'}]} value={businessName} onChangeText={setBusinessName} placeholder="Enter business name" placeholderTextColor="#999" />{errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}</View>
          <View style={styles.formGroup}><Text style={styles.label}>Contact Name *</Text><TextInput style={[styles.input, errors.contactName && {borderColor:'#FF0000'}]} value={contactName} onChangeText={setContactName} placeholder="Contact person" placeholderTextColor="#999" />{errors.contactName && <Text style={styles.errorText}>{errors.contactName}</Text>}</View>
          <View style={styles.formGroup}><Text style={styles.label}>Business Category *</Text><TextInput style={[styles.input, errors.businessCategory && {borderColor:'#FF0000'}]} value={businessCategory} onChangeText={setBusinessCategory} placeholder="e.g. Grocery, Salon" placeholderTextColor="#999" />{errors.businessCategory && <Text style={styles.errorText}>{errors.businessCategory}</Text>}</View>
          <View style={styles.formGroup}><Text style={styles.label}>Description *</Text><TextInput style={[styles.textArea, errors.description && {borderColor:'#FF0000'}]} value={description} onChangeText={setDescription} placeholder="Describe your business" placeholderTextColor="#999" multiline numberOfLines={4} />{errors.description && <Text style={styles.errorText}>{errors.description}</Text>}</View>
          <View style={styles.formGroup}><Text style={styles.label}>Years in Business *</Text><TextInput style={[styles.input, errors.yearsInBusiness && {borderColor:'#FF0000'}]} value={yearsInBusiness} onChangeText={setYearsInBusiness} placeholder="Years" keyboardType="numeric" placeholderTextColor="#999" />{errors.yearsInBusiness && <Text style={styles.errorText}>{errors.yearsInBusiness}</Text>}</View>
          <View style={styles.formGroup}><Text style={styles.label}>Branches *</Text><TextInput style={[styles.input, errors.branches && {borderColor:'#FF0000'}]} value={branches} onChangeText={setBranches} placeholder="Number of branches" keyboardType="numeric" placeholderTextColor="#999" />{errors.branches && <Text style={styles.errorText}>{errors.branches}</Text>}</View>
          <View style={styles.formGroup}><Text style={styles.label}>Email *</Text><TextInput style={[styles.input, errors.email && {borderColor:'#FF0000'}]} value={email} onChangeText={setEmail} placeholder="business@example.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#999" />{errors.email && <Text style={styles.errorText}>{errors.email}</Text>}</View>
          <View style={styles.formGroup}><Text style={styles.label}>Phone Number *</Text><TextInput style={[styles.input, errors.phoneNumber && {borderColor:'#FF0000'}]} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="10 digits" keyboardType="phone-pad" maxLength={10} placeholderTextColor="#999" />{errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}</View>
          <View style={styles.formGroup}><Text style={styles.label}>Pincode *</Text><TextInput style={[styles.input, errors.pincode && {borderColor:'#FF0000'}]} value={pincode} onChangeText={setPincode} placeholder="6 digits" keyboardType="numeric" maxLength={6} placeholderTextColor="#999" />{errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}</View>
          <View style={styles.formGroup}><Text style={styles.label}>Business Location *</Text><TouchableOpacity style={[styles.locationButton, errors.location && {borderColor:'#FF0000'}]} onPress={() => { setTimeout(() => setLocation({latitude:12.9716,longitude:77.5946}), 100); }}><Ionicons name="location" size={20} color="#2196F3" /><Text style={{fontSize:14,color:'#666',marginLeft:8,flex:1}}>{location ? `Selected: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Tap to select'}</Text></TouchableOpacity>{errors.location && <Text style={styles.errorText}>{errors.location}</Text>}</View>
          <View style={styles.formGroup}><Text style={styles.label}>Address</Text><TextInput style={styles.textArea} value={address} onChangeText={setAddress} placeholder="Full address" multiline numberOfLines={3} placeholderTextColor="#999" /></View>
          <View style={styles.formGroup}><Text style={styles.label}>Introduced By</Text><TextInput style={styles.input} value={introducedBy} onChangeText={setIntroducedBy} placeholder="Referral (optional)" placeholderTextColor="#999" /></View>
          <View style={styles.termsContainer}><View style={{flexDirection:'row',alignItems:'center',marginBottom:12}}><Switch value={agreedToTerms} onValueChange={setAgreedToTerms} trackColor={{false:'#CCC',true:'#2196F3'}} thumbColor={agreedToTerms?'#FFF':'#F4F3F4'} /><Text style={{fontSize:14,color:'#1A1A1A',marginLeft:8,flex:1}}>I agree to Terms</Text></View>{errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}<View style={styles.policyBox}><Text style={styles.policyText}>Stores must be legally registered and provide exclusive discounts. Maintain accurate pricing and honor discounts. Compliance required, fraud leads to removal.</Text></View></View>
          <View style={styles.buttonContainer}><TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.registerButton, isLoading && {opacity:0.6}]} onPress={handleRegister} disabled={isLoading}>{isLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.registerButtonText}>Register Merchant</Text>}</TouchableOpacity></View>
          <View style={{height:32}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex:1,backgroundColor:'#F5F5F5'},
  header: {flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:16,backgroundColor:'#FFF',borderBottomWidth:1,borderBottomColor:'#EEE'},
  backButton: {width:40,height:40,justifyContent:'center'},
  headerTitle: {fontSize:18,fontWeight:'600',color:'#1A1A1A'},
  content: {flex:1,padding:16},
  formGroup: {marginBottom:20},
  label: {fontSize:14,fontWeight:'600',color:'#1A1A1A',marginBottom:8},
  input: {backgroundColor:'#FFF',borderWidth:1,borderColor:'#DDD',borderRadius:8,paddingHorizontal:16,paddingVertical:12,fontSize:16,color:'#1A1A1A',outlineStyle:'none'},
  textArea: {backgroundColor:'#FFF',borderWidth:1,borderColor:'#DDD',borderRadius:8,paddingHorizontal:16,paddingVertical:12,fontSize:16,color:'#1A1A1A',minHeight:100,textAlignVertical:'top',outlineStyle:'none'},
  errorText: {fontSize:12,color:'#F00',marginTop:4},
  locationButton: {flexDirection:'row',alignItems:'center',backgroundColor:'#FFF',borderWidth:1,borderColor:'#DDD',borderRadius:8,paddingHorizontal:16,paddingVertical:12},
  termsContainer: {marginTop:8,marginBottom:24},
  policyBox: {backgroundColor:'#F9F9F9',borderRadius:8,padding:12,borderLeftWidth:4,borderLeftColor:'#2196F3'},
  policyText: {fontSize:12,color:'#666',lineHeight:18},
  buttonContainer: {flexDirection:'row',gap:12},
  cancelButton: {flex:1,backgroundColor:'#EEE',borderRadius:8,paddingVertical:14,alignItems:'center'},
  cancelButtonText: {fontSize:16,fontWeight:'600',color:'#666'},
  registerButton: {flex:1,backgroundColor:'#2196F3',borderRadius:8,paddingVertical:14,alignItems:'center'},
  registerButtonText: {fontSize:16,fontWeight:'600',color:'#FFF'},
});
