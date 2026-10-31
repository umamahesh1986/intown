import { useCallback, useRef, useState } from 'react';
import { Animated, Easing, Text, TextProps } from 'react-native';
import { useFocusEffect } from 'expo-router';

export function useAnimatedNumber(value: number | null | undefined, duration = 1100) {
  const animation = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  const target = value != null && Number.isFinite(value) ? value : 0;
  useFocusEffect(useCallback(() => {
    animation.stopAnimation();
    animation.setValue(0);
    setDisplay(0);
    const listener = animation.addListener(({ value: frame }) => setDisplay(frame));
    const count = Animated.timing(animation, {
      toValue: target, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    });
    count.start(({ finished }) => { if (finished) setDisplay(target); });
    return () => { count.stop(); animation.removeListener(listener); };
  }, [animation, target, duration]));
  return display;
}

interface AnimatedNumberProps extends TextProps {
  value: number | null | undefined;
  precision?: number;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  format?: (value: number) => string;
}

export function AnimatedNumber({ value, precision = 0, prefix = '', suffix = '', placeholder = '--', format, ...props }: AnimatedNumberProps) {
  const display = useAnimatedNumber(value);
  const available = value != null && Number.isFinite(value);
  const formatValue = (number: number) => format ? format(number) : number.toLocaleString('en-IN', { maximumFractionDigits: precision });
  const rounded = Math.round(display * 10 ** precision) / 10 ** precision;
  return <Text {...props} accessibilityLabel={props.accessibilityLabel ?? (available ? `${prefix}${formatValue(value)}${suffix}` : placeholder)}>
    {available ? `${prefix}${formatValue(rounded)}${suffix}` : placeholder}
  </Text>;
}
