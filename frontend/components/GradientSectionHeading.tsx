import { createElement } from 'react';
import { Platform, Text, StyleProp, TextStyle } from 'react-native';

export const SECTION_HEADING_TYPOGRAPHY = { fontSize: 12, fontWeight: '800' as const, lineHeight: 24, textTransform: 'uppercase' as const };

export function GradientSectionHeading({ children, style }: { children: string; style?: StyleProp<TextStyle> }) {
  const characters = Array.from(children);
  return <Text accessibilityRole="header" accessibilityLabel={children}
    style={[{ alignSelf: 'flex-start', color: '#FF7900', flexShrink: 1,
      textShadowColor: 'rgba(126, 49, 0, 0.18)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
    }, style, SECTION_HEADING_TYPOGRAPHY]}>
    {Platform.OS === 'web' ? createElement('span', {
      style: {
        backgroundImage: 'linear-gradient(90deg, #FF8A00 0%, #FF4D00 100%)',
        backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent',
      },
    }, children) : characters.map((character, index) => {
      const position = characters.length > 1 ? index / (characters.length - 1) : 0;
      // Native Text supports nested colors, keeping headings selectable and scalable.
      const green = Math.round(138 + (77 - 138) * position);
      return <Text key={index} style={{ color: `rgb(255, ${green}, 0)` }}>{character}</Text>;
    })}
  </Text>;
}
