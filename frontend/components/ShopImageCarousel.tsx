import { useEffect, useRef, useState } from 'react';
import { Animated, Image, ImageSourcePropType, StyleSheet } from 'react-native';

interface CarouselSlide {
  key: string;
  image: ImageSourcePropType;
}

// These are full marketing slides with their own text/branding baked in —
// rendered full-bleed with no label or tint overlay. Add more by dropping a
// file in assets/carousel/ and adding a require() entry here.
const SLIDES: CarouselSlide[] = [
  { key: 'everything-within-500m', image: require('../assets/carousel/INtown-ios-1.jpeg') },
  { key: 'buy-local-support-local', image: require('../assets/carousel/INtown-ios-2.jpeg') },
];

const SLIDE_DURATION_MS = 3000;
const FADE_DURATION_MS = 300;

export function ShopImageCarousel() {
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }).start(() => {
        setIndex((prev) => (prev + 1) % SLIDES.length);
        Animated.timing(fade, {
          toValue: 1,
          duration: FADE_DURATION_MS,
          useNativeDriver: true,
        }).start();
      });
    }, SLIDE_DURATION_MS);

    return () => clearInterval(timer);
  }, [fade]);

  const slide = SLIDES[index];

  return (
    <Animated.View style={[styles.slide, { opacity: fade }]}>
      <Image source={slide.image} style={styles.image} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFF6ED',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
