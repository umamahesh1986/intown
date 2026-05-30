import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { searchProducts } from '../utils/api';
import { useLocationStore } from '../store/locationStore';

const VOICE_LANG_STORAGE_KEY = 'voice_search_lang';


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
  const params = useLocalSearchParams<{ source?: string; voice?: string }>();
  const source = params.source ?? 'member';
  const shouldAutoStartVoice = params.voice === '1';

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

  /* ===============================
     VOICE SEARCH (native on-device)
  ================================ */
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [voiceLang, setVoiceLang] = useState<string>('en-IN');
  const partialDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ripple animations around the mic while listening
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;
  const rippleLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Load persisted language on mount
  useEffect(() => {
    AsyncStorage.getItem(VOICE_LANG_STORAGE_KEY)
      .then((stored) => {
        if (stored && typeof stored === 'string') {
          setVoiceLang(stored);
        }
      })
      .catch(() => {});
  }, []);

  // Persist + update language together
  const updateVoiceLang = (code: string) => {
    setVoiceLang(code);
    AsyncStorage.setItem(VOICE_LANG_STORAGE_KEY, code).catch(() => {});
  };

  const SUPPORTED_LANGS: Array<{ code: string; label: string }> = [
    { code: 'en-IN', label: 'English (India)' },
    { code: 'en-US', label: 'English (US)' },
    { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
    { code: 'te-IN', label: 'తెలుగు (Telugu)' },
    { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
    { code: 'kn-IN', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'ml-IN', label: 'മലയാളം (Malayalam)' },
    { code: 'mr-IN', label: 'मराठी (Marathi)' },
    { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)' },
    { code: 'bn-IN', label: 'বাংলা (Bengali)' },
  ];

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setVoiceError(null);
  });
  useSpeechRecognitionEvent('end', () => setIsListening(false));
  useSpeechRecognitionEvent('error', (event: any) => {
    setIsListening(false);
    const code = event?.error ?? 'unknown';
    if (code === 'no-speech') {
      setVoiceError("Didn't catch that. Tap the mic and try again.");
    } else if (code === 'not-allowed' || code === 'service-not-allowed') {
      setVoiceError('Microphone permission denied.');
    } else {
      setVoiceError('Voice recognition failed. Please try again.');
    }
  });
  useSpeechRecognitionEvent('result', (event: any) => {
    const transcript: string | undefined = event?.results?.[0]?.transcript;
    if (!transcript) return;
    setSearchText(transcript);
    setShowSuggestions(true);
    // Debounce so partial results don't overload the API
    if (partialDebounceRef.current) clearTimeout(partialDebounceRef.current);
    partialDebounceRef.current = setTimeout(() => {
      fetchSearchResults(transcript);
    }, 400);

    // Final result: navigate to results immediately
    if (event?.isFinal) {
      const finalText = transcript.trim();
      if (finalText.length > 0) {
        setTimeout(() => {
          const loc = useLocationStore.getState().location;
          router.push({
            pathname: '/member-shop-list',
            params: {
              query: finalText,
              source,
              lat: loc?.latitude ? String(loc.latitude) : '',
              lng: loc?.longitude ? String(loc.longitude) : '',
            },
          });
        }, 250);
      }
    }
  });

  const handleVoicePress = async () => {
    if (isListening) {
      try { ExpoSpeechRecognitionModule.stop(); } catch {}
      return;
    }
    setVoiceError(null);
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Microphone permission required',
          'Please enable microphone access in your phone settings to use voice search.',
        );
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: voiceLang,
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
      });
    } catch (e: any) {
      setVoiceError(e?.message || 'Voice search unavailable on this device.');
    }
  };

  useEffect(() => {
    return () => {
      try { ExpoSpeechRecognitionModule.stop(); } catch {}
    };
  }, []);

  // Ripple animation — pulses 2 staggered circles around the mic while listening
  useEffect(() => {
    if (!isListening) {
      if (rippleLoopRef.current) {
        rippleLoopRef.current.stop();
        rippleLoopRef.current = null;
      }
      ripple1.setValue(0);
      ripple2.setValue(0);
      return;
    }
    const makePulse = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
    const loop = Animated.parallel([
      makePulse(ripple1, 0),
      makePulse(ripple2, 600),
    ]);
    rippleLoopRef.current = loop;
    loop.start();
    return () => {
      loop.stop();
    };
  }, [isListening, ripple1, ripple2]);

  // Auto-start voice when navigated with ?voice=1 (e.g. from dashboard mic icons)
  useEffect(() => {
    if (!shouldAutoStartVoice) return;
    const t = setTimeout(() => {
      handleVoicePress();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoStartVoice]);

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
                    lat: useLocationStore.getState().location?.latitude ? String(useLocationStore.getState().location!.latitude) : '',
                    lng: useLocationStore.getState().location?.longitude ? String(useLocationStore.getState().location!.longitude) : '',
                  },
                });
              }}
            />
            {/* Language quick-switcher */}
            <TouchableOpacity
              onPress={() => setShowLangPicker(true)}
              style={styles.langPill}
              testID="search-voice-lang-btn"
            >
              <Text style={styles.langPillText}>
                {voiceLang.split('-')[0].toUpperCase()}
              </Text>
            </TouchableOpacity>
            {/* Voice / Mic button (with ripple while listening) */}
            <View style={styles.micWrapper}>
              {isListening && (
                <>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.micRipple,
                      {
                        opacity: ripple1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.45, 0],
                        }),
                        transform: [
                          {
                            scale: ripple1.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 2.2],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.micRipple,
                      {
                        opacity: ripple2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.35, 0],
                        }),
                        transform: [
                          {
                            scale: ripple2.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 2.6],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                </>
              )}
              <TouchableOpacity
                onPress={handleVoicePress}
                style={[styles.micBtn, isListening && styles.micBtnActive]}
                testID="search-voice-mic-btn"
                accessibilityLabel={isListening ? 'Stop listening' : 'Search by voice'}
              >
                {isListening ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="mic" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {isListening && (
            <View style={styles.listeningRow}>
              <View style={styles.listeningDot} />
              <Text style={styles.listeningText}>
                Listening{voiceLang ? ` · ${voiceLang}` : ''}…
              </Text>
              <TouchableOpacity onPress={handleVoicePress} hitSlop={10}>
                <Text style={styles.listeningStopText}>Stop</Text>
              </TouchableOpacity>
            </View>
          )}
          {!isListening && voiceError && (
            <View style={styles.voiceErrorRow}>
              <Ionicons name="alert-circle" size={14} color="#D32F2F" />
              <Text style={styles.voiceErrorText} numberOfLines={2}>
                {voiceError}
              </Text>
              <TouchableOpacity onPress={handleVoicePress} hitSlop={10}>
                <Text style={styles.voiceRetryText}>Retry</Text>
              </TouchableOpacity>
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
                        source,
                        lat: useLocationStore.getState().location?.latitude ? String(useLocationStore.getState().location!.latitude) : '',
                        lng: useLocationStore.getState().location?.longitude ? String(useLocationStore.getState().location!.longitude) : '',
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
        {/* <View style={styles.chipsContainer}>
          {POPULAR_PRODUCTS.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.chip}
              onPress={() => handleChipPress(item)}
            >
              <Text style={styles.chipText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View> */}

        {/* LOADING */}
        {loading && (
          <View style={{ marginTop: 8 }}>
            <ActivityIndicator size="small" color="#FF8A00" />
          </View>
        )}

      </View>

      {/* LANGUAGE PICKER MODAL */}
      <Modal
        visible={showLangPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLangPicker(false)}
      >
        <Pressable
          style={styles.langModalOverlay}
          onPress={() => setShowLangPicker(false)}
        >
          <Pressable
            style={styles.langModalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.langModalHeader}>
              <Text style={styles.langModalTitle}>Choose voice language</Text>
              <TouchableOpacity
                onPress={() => setShowLangPicker(false)}
                hitSlop={10}
              >
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>
            {SUPPORTED_LANGS.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={styles.langOption}
                onPress={() => {
                  updateVoiceLang(l.code);
                  setShowLangPicker(false);
                }}
              >
                <Text style={styles.langOptionText}>{l.label}</Text>
                {voiceLang === l.code && (
                  <Ionicons name="checkmark" size={18} color="#FF8A00" />
                )}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
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

  // Voice search
  langPill: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF8A00',
    letterSpacing: 0.4,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF8A00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: '#D32F2F',
  },
  micWrapper: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  micRipple: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D32F2F',
  },
  listeningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D32F2F',
  },
  listeningText: {
    flex: 1,
    fontSize: 13,
    color: '#444',
    fontWeight: '600',
  },
  listeningStopText: {
    color: '#D32F2F',
    fontWeight: '700',
    fontSize: 13,
  },
  voiceErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  voiceErrorText: {
    flex: 1,
    fontSize: 12,
    color: '#D32F2F',
  },
  voiceRetryText: {
    color: '#D32F2F',
    fontWeight: '700',
    fontSize: 13,
  },
  langModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  langModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    maxHeight: '80%',
  },
  langModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  langModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  langOptionText: {
    fontSize: 15,
    color: '#1A1A1A',
  },
});
