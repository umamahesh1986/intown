import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../store/authStore';
import { Picker } from '@react-native-picker/picker';


export default function Account() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [gender, setGender] = useState((user as any)?.gender ?? '');

 

  const onSave = () => {
  updateProfile({ name, gender });
  setEditing(false);
};


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>My Account</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Text style={styles.editBtn}>{editing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {/* NAME */}
        <Text style={styles.label}>Name</Text>
        {editing ? (
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        ) : (
          <Text style={styles.value}>{name || '-'}</Text>
        )}

        {/* PHONE */}
        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{user?.phone ?? '-'}</Text>
        <Text style={styles.label}>Email</Text>
<Text style={styles.value}>
  {(user as any)?.email ?? 'Not provided'}
</Text>
{/* GENDER */}
<Text style={styles.label}>Gender</Text>

{editing ? (
  <View style={styles.pickerWrapper}>
    <Picker
      selectedValue={gender}
      onValueChange={(value) => setGender(value)}
    >
      <Picker.Item label="Select Gender" value="" />
      <Picker.Item label="Male" value="Male" />
      <Picker.Item label="Female" value="Female" />
      <Picker.Item label="Other" value="Other" />
    </Picker>
  </View>
) : (
  <Text style={styles.value}>{gender || 'Not specified'}</Text>
)}



       

        

        {editing && (
          <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
            <Text style={styles.saveText}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 22, fontWeight: '700', marginLeft: 8 },
  editBtn: { color: '#FF6600', fontWeight: '600', fontSize: 16 },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  label: { fontSize: 12, color: '#777', marginTop: 12 },
  value: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  pickerWrapper: {
  borderWidth: 1,
  borderColor: '#DDD',
  borderRadius: 8,
  marginTop: 6,
  backgroundColor: '#fff',
  overflow: 'hidden',
},


  saveBtn: {
    backgroundColor: '#FF6600',
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700' },
});
