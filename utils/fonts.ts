// Font configuration for the app
export const Fonts = {
  // Inter font family with different weights - using exact file names
  regular: 'Inter_18pt-Regular',
  medium: 'Inter_18pt-Medium',
  semiBold: 'Inter_18pt-SemiBold',
  bold: 'Inter_18pt-Bold',
  
  // Fallback to system fonts if Inter doesn't load
  fallback: 'System',
} as const;

// Font weight mappings
export const FontWeights = {
  thin: '100',
  extraLight: '200',
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
  black: '900',
} as const;

// Common font styles for the app
export const FontStyles = {
  // Body text styles
  body: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Heading styles
  h1: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: Fonts.semiBold,
    fontSize: 28,
    lineHeight: 36,
  },
  h3: {
    fontFamily: Fonts.medium,
    fontSize: 24,
    lineHeight: 32,
  },
  h4: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  h5: {
    fontFamily: Fonts.medium,
    fontSize: 18,
    lineHeight: 26,
  },
  h6: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  
  // Button styles
  button: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  buttonLarge: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    lineHeight: 26,
  },
  buttonSmall: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Caption and small text
  caption: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  overline: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },
  
  // Logo styles
  logo: {
    fontFamily: Fonts.bold,
    fontSize: 48,
    lineHeight: 56,
  },
  logoSmall: {
    fontFamily: Fonts.medium,
    fontSize: 32,
    lineHeight: 40,
  },
} as const;

// Alternative font styles with fallbacks for better compatibility
export const FontStylesWithFallback = {
  // Body text styles with fallback
  body: {
    fontFamily: `${Fonts.regular}, ${Fonts.fallback}`,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: `${Fonts.medium}, ${Fonts.fallback}`,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: `${Fonts.regular}, ${Fonts.fallback}`,
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Heading styles with fallback
  h1: {
    fontFamily: `${Fonts.bold}, ${Fonts.fallback}`,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
  },
  h2: {
    fontFamily: `${Fonts.semiBold}, ${Fonts.fallback}`,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600' as const,
  },
  h3: {
    fontFamily: `${Fonts.medium}, ${Fonts.fallback}`,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '500' as const,
  },
  h4: {
    fontFamily: `${Fonts.semiBold}, ${Fonts.fallback}`,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  h5: {
    fontFamily: `${Fonts.medium}, ${Fonts.fallback}`,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500' as const,
  },
  h6: {
    fontFamily: `${Fonts.medium}, ${Fonts.fallback}`,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
  },
  
  // Button styles with fallback
  button: {
    fontFamily: `${Fonts.semiBold}, ${Fonts.fallback}`,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  buttonLarge: {
    fontFamily: `${Fonts.semiBold}, ${Fonts.fallback}`,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600' as const,
  },
  buttonSmall: {
    fontFamily: `${Fonts.medium}, ${Fonts.fallback}`,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  
  // Caption and small text with fallback
  caption: {
    fontFamily: `${Fonts.regular}, ${Fonts.fallback}`,
    fontSize: 12,
    lineHeight: 16,
  },
  overline: {
    fontFamily: `${Fonts.medium}, ${Fonts.fallback}`,
    fontSize: 10,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
    fontWeight: '500' as const,
  },
  
  // Logo styles with fallback
  logo: {
    fontFamily: `${Fonts.bold}, ${Fonts.fallback}`,
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700' as const,
  },
  logoSmall: {
    fontFamily: `${Fonts.medium}, ${Fonts.fallback}`,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '500' as const,
  },
} as const;