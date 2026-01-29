import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { searchProducts } from '../utils/api';


type SearchResult = {
  id?: string;
  productName?: string;
};

const POPULAR_PRODUCTS = [
  'Rice',
  'Milk',
  'Fruits & Vegetables',
  'Cough Syrup',
  'Sugar',
  'Hair Cut',
  'Custom Stitching of Shirts',
  'Tea & Coffee',
  'IceCream',
  'Gym & Yoga',
  'FootWear',
  'Frames & Lenses',
  'Gold Jewellery',
  'Smart Phones',
  'AC & Refrigerator',
  'Sofas',
  'Pens',
  'Medical Tests'
];

export default function Search() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const source = params.source ?? 'member';

  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<TextInput>(null);

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




  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleChipPress = (value: string) => {
    setSearchText(value);
    setShowSuggestions(true);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    fetchSearchResults(value);
  };

  return (
    <Pressable style={{ flex: 1 }} onPress={() => setShowSuggestions(false)}>
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Search your product</Text>
            <Text style={styles.headerSubtitle}>
              Search your favirote products and get more savings
            </Text>
          </View>
        </View>

        <View style={styles.searchArea}>
          {/* SEARCH INPUT */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#666" />
            <TextInput
              ref={inputRef}
              placeholder="Search products..."
              value={searchText}
              style={[
                styles.input,
                Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
              ]}
              autoFocus
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
                    source,
                  },
                });
              }}
            />
          </View>

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
                        source,
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

        {/* POPULAR CHIPS */}
        <View style={styles.chipsContainer}>
          {POPULAR_PRODUCTS.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.chip}
              onPress={() => handleChipPress(item)}
            >
              <Text style={styles.chipText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LOADING */}
        {loading && (
          <View style={{ marginTop: 8 }}>
            <ActivityIndicator size="small" color="#FF6600" />
          </View>
        )}

      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    marginRight: 12,
    marginTop: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  searchArea: {
    position: 'relative',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  input: {
    marginLeft: 8,
    fontSize: 15,
    flex: 1,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    zIndex: -1,
  },
  chip: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FFCC99',
  },
  chipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  suggestionBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 56,
    borderWidth: 1,
    borderColor: '#eee',
    zIndex: 999,
    elevation: 12,
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
