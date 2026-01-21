import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { searchByProductNames } from '../utils/api';
import { getUserLocation } from '../utils/location';

type SearchResult = {
  id?: string;
  name?: string;
  productName?: string;
};

export default function Search() {
  const router = useRouter();

  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categoryResults, setCategoryResults] = useState<any[]>([]);


  // ✅ DEBOUNCE REF (PRODUCTION SAFE)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSearchResults = async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const location = await getUserLocation();
      if (!location) {
        setResults([]);
        return;
      }

      const data = await searchByProductNames(
        text,
        location.latitude,
        location.longitude
      );

      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  const fetchCategorySuggestions = async () => {
  try {
    const res = await fetch(
      'https://devapi.intownlocal.com/IN/categories'
    );
    const json = await res.json();

    const categories = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
      ? json.data
      : [];

    setCategoryResults(categories);
  } catch (error) {
    console.error('Failed to fetch categories', error);
    setCategoryResults([]);
  }
};
useEffect(() => {
  fetchCategorySuggestions();
}, []);



  return (
    <Pressable style={{ flex: 1 }} onPress={() => setShowSuggestions(false)}>
      <View style={styles.container}>
        {/* HEADER WITH BACK ARROW */}
<View style={styles.header}>
  <TouchableOpacity onPress={() => router.back()}>
    <Ionicons name="arrow-back" size={24} color="#000" />
  </TouchableOpacity>
</View>


        {/* SEARCH INPUT */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#666" />
          <TextInput
            placeholder="Search products..."
            value={searchText}
            style={styles.input}
    onChangeText={(text) => {
  setSearchText(text);
  setShowSuggestions(true);

  // ❌ Clear previous timer
  if (debounceTimer.current) {
    clearTimeout(debounceTimer.current);
  }

  // ✅ Call product search API after user stops typing
  debounceTimer.current = setTimeout(() => {
    fetchSearchResults(text);
  }, 500);
}}

onSubmitEditing={() => {
  fetchSearchResults(searchText);
}}

          />
        </View>

        {/* LOADING */}
        {loading && (
          <View style={{ marginTop: 8 }}>
            <ActivityIndicator size="small" color="#FF6600" />
          </View>
        )}

        {/* SUGGESTIONS */}
        {showSuggestions && categoryResults.length > 0 && (

          <View style={styles.suggestionBox}>
            {categoryResults
  .filter(cat =>
    cat.name
      ?.toLowerCase()
      .startsWith(searchText.toLowerCase())
  )
  .map((cat, index) => (
    <TouchableOpacity
      key={cat.id ?? index}
      style={styles.suggestionItem}
      onPress={() => {
        setShowSuggestions(false);
        setSearchText('');

        router.push({
          pathname: '/member-shop-list',
          params: {
            category: cat.name,
          },
        });
      }}
    >
      <Ionicons name="grid" size={16} color="#666" />
      <Text style={styles.suggestionText}>{cat.name}</Text>
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
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
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
  header: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
},

});
