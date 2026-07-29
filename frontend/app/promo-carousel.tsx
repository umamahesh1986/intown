import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  useWindowDimensions,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const PROMO_IMAGES = [
  require('../assets/images/promo/promo-1.jpg'),
  require('../assets/images/promo/promo-2.jpg'),
  require('../assets/images/promo/promo-3.jpg'),
];

// Cap the card to a phone-friendly width on desktop
const MAX_CARD_WIDTH = 420;
// Fixed image slide aspect (portrait-friendly)
const IMAGE_ASPECT = 4 / 3;

export default function PromoCarousel() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { width: windowWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  // Card width sits between ~320 (small phones) and MAX_CARD_WIDTH (desktop)
  const cardWidth = Math.min(Math.max(windowWidth - 32, 300), MAX_CARD_WIDTH);
  // Slide width = card width minus horizontal padding (16 on each side)
  const slideWidth = cardWidth - 32;
  const slideHeight = Math.round(slideWidth * IMAGE_ASPECT);

  const goToLogin = useCallback(() => {
    router.replace('/login');
  }, [router]);

  const isAnimatingRef = useRef(false);

  const settleIndex = useCallback(
    (x: number) => {
      // Ignore intermediate scroll events fired while goToSlide is animating
      if (isAnimatingRef.current) return;
      const idx = Math.round(x / Math.max(slideWidth, 1));
      if (idx !== activeIndex && idx >= 0 && idx < PROMO_IMAGES.length) {
        setActiveIndex(idx);
      }
    },
    [slideWidth, activeIndex],
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      settleIndex(e.nativeEvent.contentOffset.x);
    },
    [settleIndex],
  );

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      settleIndex(e.nativeEvent.contentOffset.x);
    },
    [settleIndex],
  );

  const goToSlide = (idx: number) => {
    isAnimatingRef.current = true;
    setActiveIndex(idx);
    scrollRef.current?.scrollTo({ x: idx * slideWidth, animated: true });
    // Re-enable scroll-based updates after the animation settles (~350ms is safe on web)
    setTimeout(() => {
      isAnimatingRef.current = false;
      setActiveIndex(idx);
    }, 400);
  };

  return (
    <SafeAreaView style={styles.screen} testID="promo-carousel-screen">
      <View style={[styles.card, { width: cardWidth }]}>
        {/* Close button — top right */}
        <TouchableOpacity
          onPress={goToLogin}
          style={styles.closeBtn}
          testID="promo-close-btn"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={22} color="#1A1A1A" />
        </TouchableOpacity>

        {/* Image carousel */}
        <View style={{ width: slideWidth, height: slideHeight, alignSelf: 'center' }}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            onMomentumScrollEnd={onMomentumEnd}
            onScrollEndDrag={onMomentumEnd}
            scrollEventThrottle={16}
            style={{ width: slideWidth, height: slideHeight }}
            testID="promo-carousel-scroll"
          >
            {PROMO_IMAGES.map((src, idx) => (
              <View
                key={idx}
                style={{ width: slideWidth, height: slideHeight, alignItems: 'center', justifyContent: 'center' }}
                testID={`promo-slide-${idx}`}
              >
                <Image
                  source={src}
                  style={{ width: slideWidth, height: slideHeight, borderRadius: 12 }}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Pagination dots */}
        <View style={styles.dotsRow}>
          {PROMO_IMAGES.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => goToSlide(idx)}
              testID={`promo-dot-${idx}`}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <View style={[styles.dot, activeIndex === idx && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={goToLogin}
            testID="promo-explore-btn"
          >
            <Ionicons name="compass-outline" size={18} color="#FF8A00" />
            <Text style={styles.buttonSecondaryText}>Explore</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={goToLogin}
            testID="promo-view-btn"
          >
            <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
            <Text style={styles.buttonPrimaryText}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF5EA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    paddingTop: 24,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 12px 40px rgba(0,0,0,0.10)' } as any
      : {
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }),
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  dotActive: {
    width: 22,
    backgroundColor: '#FF8A00',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonPrimary: {
    backgroundColor: '#FF8A00',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FF8A00',
  },
  buttonSecondaryText: {
    color: '#FF8A00',
    fontSize: 15,
    fontWeight: '800',
  },
});
