import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { searchProducts } from '../utils/api';

import { getUserLocation } from '../utils/location';

type SearchResult = {
  id?: string;
  productName?: string;
};

export default function Search() {
  const router = useRouter();

  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ✅ DEBOUNCE
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSearchResults = async (text: string) => {
  if (!text.trim()) {
    setResults([]);
    return;
  }

  setLoading(true);

  try {
    const data = await searchProducts(text);
    setResults(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Product search failed', error);
    setResults([]);
  } finally {
    setLoading(false);
  }
};


    

  return (
    <Pressable style={{ flex: 1 }} onPress={() => setShowSuggestions(false)}>
      <View style={styles.container}>

        {/* HEADER */}
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

              if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
              }

              debounceTimer.current = setTimeout(() => {
                fetchSearchResults(text);
              }, 500);
            }}
            onSubmitEditing={() => {
              if (!searchText.trim()) return;

              setShowSuggestions(false);

              router.push({
                pathname: '/member-shop-list',
                params: {
                  query: searchText,
                  source: 'free-text',
                },
              });
            }}
          />
        </View>

        {/* LOADING */}
        {loading && (
          <View style={{ marginTop: 8 }}>
            <ActivityIndicator size="small" color="#FF6600" />
          </View>
        )}

        {/* PRODUCT SUGGESTIONS */}
        {showSuggestions && results.length > 0 && (
          <View style={styles.suggestionBox}>
            {results.map((item, index) => (
              <TouchableOpacity
                key={item.id ?? index}
                style={styles.suggestionItem}
              onPress={() => {
  const value =
    item.productName ||
    (item as any).name ||
    '';

  setSearchText(value);
  setShowSuggestions(false);

  router.push({
    pathname: '/member-shop-list',
    params: {
      query: value,
      source: 'product',
    },
  });
}}

              >
                <Ionicons name="search" size={16} color="#666" />
                <Text style={styles.suggestionText}>
  {item.productName || (item as any).name}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
});
