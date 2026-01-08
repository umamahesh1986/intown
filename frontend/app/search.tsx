import { View, Text, TextInput, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchByProductNames } from '../utils/api';


const DUMMY_SEARCH_ITEMS: {
  id: string;
  name: string;
  type: 'category' | 'product';
}[] = [
  { id: '1', name: 'Grocery Stores', type: 'category' },
  { id: '2', name: 'Medical Shops', type: 'category' },
  { id: '3', name: 'Restaurants', type: 'category' },
  { id: '4', name: 'Salons & Spas', type: 'category' },
  { id: '5', name: 'Fashion Stores', type: 'category' },

  // products (dummy)
  { id: '6', name: 'Milk', type: 'product' },
  { id: '7', name: 'Potato', type: 'product' },
  { id: '8', name: 'Tomato', type: 'product' },
  { id: '9', name: 'Onion', type: 'product' },
];



export default function Search() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  type SearchResult = {
  id?: string;
  name?: string;
  productName?: string;
};

const [apiResults, setApiResults] = useState<SearchResult[]>([]);



 
    const fetchSearchResults = async (text: string) => {
  if (!text.trim()) {
    setApiResults([]);
    return;
  }

  try {
    // 1️⃣ Get member location (already saved during registration)
    const locationString = await AsyncStorage.getItem('member_location');

    if (!locationString) {
      console.warn('Member location not found');
      return;
    }

    const { latitude, longitude } = JSON.parse(locationString);

    // 2️⃣ Call REAL search API from utils/api.ts
    const data = await searchByProductNames(
      text,
      latitude,
      longitude
    );

    // 3️⃣ Store API response
    setApiResults(data || []);
  } catch (error) {
    console.error('Search API error:', error);
    setApiResults([]);
  }
};

    const filteredDummyResults = DUMMY_SEARCH_ITEMS.filter(item =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const combinedResults = [
    ...apiResults,
    ...filteredDummyResults.filter(
      d => !apiResults.some(a => a.name === d.name)
    ),
  ];



  return (
    <Pressable style={{ flex: 1 }} onPress={() => setShowSuggestions(false)}>
      <View style={styles.container}>
        {/* SEARCH INPUT */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#666" />
          <TextInput
            placeholder="Search shops, categories..."
            value={searchText}
            onChangeText={(text) => {
  setSearchText(text);
  setShowSuggestions(true);
  fetchSearchResults(text);
}}

            style={styles.input}
          />
        </View>

        {/* SUGGESTIONS */}
       {showSuggestions && apiResults.length > 0 && (
  <View style={styles.suggestionBox}>
    {apiResults.map((item, index) => (
      <TouchableOpacity
        key={item.id ?? index}
        style={styles.suggestionItem}
        onPress={() => {
          setSearchText('');
          setShowSuggestions(false);

          router.push({
            pathname: '/member-shop-list',
            params: {
              query: item.name || item.productName,
            },
          });
        }}
      >
        <Ionicons name="search" size={16} color="#666" />
        <Text style={styles.suggestionText}>
          {item.name || item.productName}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
)}


        
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 12,
    zIndex: 20,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },

  input: {
    marginLeft: 8,
    fontSize: 15,
    flex: 1,
  },

  suggestionBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
    zIndex: 30,
  },

  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  suggestionText: {
    marginLeft: 8,
    fontSize: 14,
  },
});
