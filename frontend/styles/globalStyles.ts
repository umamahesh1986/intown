import { StyleSheet } from 'react-native';

// ============= Color Palette =============
export const Colors = {
  // Primary Colors
  primary: '#FF6600',
  primaryDark: '#E55A00',
  primaryLight: '#FF8533',
  
  // Secondary Colors
  secondary: '#2196F3',
  secondaryDark: '#1976D2',
  secondaryLight: '#64B5F6',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  gray: '#666666',
  lightGray: '#CCCCCC',
  darkGray: '#333333',
  background: '#F5F5F5',
  
  // Status Colors
  success: '#4CAF50',
  error: '#FF0000',
  warning: '#FFA500',
  info: '#2196F3',
  
  // UI Elements
  border: '#EEEEEE',
  divider: '#E0E0E0',
  placeholder: '#999999',
  shadow: '#000000',
};

// ============= Typography =============
export const Typography = {
  // Font Sizes
  tiny: 10,
  small: 12,
  regular: 14,
  medium: 16,
  large: 18,
  xlarge: 20,
  xxlarge: 24,
  huge: 32,
  massive: 48,
  
  // Font Weights
  light: '300' as const,
  regular_weight: '400' as const,
  medium_weight: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// ============= Spacing =============
export const Spacing = {
  tiny: 4,
  small: 8,
  regular: 12,
  medium: 16,
  large: 24,
  xlarge: 32,
  xxlarge: 48,
  huge: 64,
};

// ============= Border Radius =============
export const BorderRadius = {
  small: 4,
  regular: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
  round: 999,
};

// ============= Shadows =============
export const Shadows = {
  small: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ============= Global Styles =============
export const GlobalStyles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  
  // Card Styles
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.medium,
    ...Shadows.small,
  },
  
  cardElevated: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.medium,
    ...Shadows.medium,
  },
  
  // Button Styles
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.large,
    borderRadius: BorderRadius.regular,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonText: {
    color: Colors.white,
    fontSize: Typography.medium,
    fontWeight: Typography.semibold,
  },
  
  buttonSecondary: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.large,
    borderRadius: BorderRadius.regular,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.large,
    borderRadius: BorderRadius.regular,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonOutlineText: {
    color: Colors.primary,
    fontSize: Typography.medium,
    fontWeight: Typography.semibold,
  },
  
  // Input Styles
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.regular,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.regular,
    fontSize: Typography.medium,
    color: Colors.black,
    outlineStyle: 'none', // Remove web outline
  },
  
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 1,
    outlineStyle: 'none', // Remove web outline
  },
  
  inputError: {
    borderColor: Colors.error,
    borderWidth: 1,
    outlineStyle: 'none', // Remove web outline
  },
  
  // Text Styles
  heading1: {
    fontSize: Typography.massive,
    fontWeight: Typography.bold,
    color: Colors.black,
    marginBottom: Spacing.regular,
  },
  
  heading2: {
    fontSize: Typography.huge,
    fontWeight: Typography.bold,
    color: Colors.black,
    marginBottom: Spacing.regular,
  },
  
  heading3: {
    fontSize: Typography.xxlarge,
    fontWeight: Typography.semibold,
    color: Colors.black,
    marginBottom: Spacing.small,
  },
  
  heading4: {
    fontSize: Typography.xlarge,
    fontWeight: Typography.semibold,
    color: Colors.black,
    marginBottom: Spacing.small,
  },
  
  bodyText: {
    fontSize: Typography.regular,
    color: Colors.gray,
    lineHeight: 22,
  },
  
  bodyTextBold: {
    fontSize: Typography.regular,
    fontWeight: Typography.semibold,
    color: Colors.black,
  },
  
  smallText: {
    fontSize: Typography.small,
    color: Colors.gray,
  },
  
  caption: {
    fontSize: Typography.tiny,
    color: Colors.lightGray,
  },
  
  // Row & Column
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  column: {
    flexDirection: 'column',
  },
  
  // Spacing Helpers
  marginTopSmall: { marginTop: Spacing.small },
  marginTopMedium: { marginTop: Spacing.medium },
  marginTopLarge: { marginTop: Spacing.large },
  
  marginBottomSmall: { marginBottom: Spacing.small },
  marginBottomMedium: { marginBottom: Spacing.medium },
  marginBottomLarge: { marginBottom: Spacing.large },
  
  paddingSmall: { padding: Spacing.small },
  paddingMedium: { padding: Spacing.medium },
  paddingLarge: { padding: Spacing.large },
  
  // Badge Styles
  badge: {
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.tiny,
    borderRadius: BorderRadius.small,
    alignSelf: 'flex-start',
  },
  
  badgeSuccess: {
    backgroundColor: Colors.success,
  },
  
  badgeError: {
    backgroundColor: Colors.error,
  },
  
  badgeWarning: {
    backgroundColor: Colors.warning,
  },
  
  badgeInfo: {
    backgroundColor: Colors.info,
  },
  
  badgeText: {
    color: Colors.white,
    fontSize: Typography.tiny,
    fontWeight: Typography.semibold,
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.medium,
  },
  
  // Header Styles
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // Footer Styles
  footer: {
    backgroundColor: Colors.darkGray,
    padding: Spacing.large,
    alignItems: 'center',
  },
  
  footerText: {
    color: Colors.lightGray,
    fontSize: Typography.small,
    textAlign: 'center',
  },
  
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  
  // Error Styles
  errorContainer: {
    backgroundColor: Colors.error,
    padding: Spacing.medium,
    borderRadius: BorderRadius.regular,
    marginBottom: Spacing.medium,
  },
  
  errorText: {
    color: Colors.white,
    fontSize: Typography.regular,
    textAlign: 'center',
  },
  
  // Success Styles
  successContainer: {
    backgroundColor: Colors.success,
    padding: Spacing.medium,
    borderRadius: BorderRadius.regular,
    marginBottom: Spacing.medium,
  },
  
  successText: {
    color: Colors.white,
    fontSize: Typography.regular,
    textAlign: 'center',
  },
});

// ============= Helper Functions =============

/**
 * Generate responsive spacing based on screen size
 * @param base - base spacing value
 * @param multiplier - multiplier for larger screens
 */
export const responsiveSpacing = (base: number, multiplier = 1.5) => {
  // You can add logic here based on screen dimensions
  return base * multiplier;
};

/**
 * Get text style based on size
 */
export const getTextStyle = (size: 'small' | 'regular' | 'large' | 'xlarge') => {
  switch (size) {
    case 'small':
      return { fontSize: Typography.small };
    case 'regular':
      return { fontSize: Typography.regular };
    case 'large':
      return { fontSize: Typography.large };
    case 'xlarge':
      return { fontSize: Typography.xlarge };
    default:
      return { fontSize: Typography.regular };
  }
};

/**
 * Get button variant style
 */
export const getButtonStyle = (variant: 'primary' | 'secondary' | 'outline' = 'primary') => {
  switch (variant) {
    case 'primary':
      return GlobalStyles.button;
    case 'secondary':
      return GlobalStyles.buttonSecondary;
    case 'outline':
      return GlobalStyles.buttonOutline;
    default:
      return GlobalStyles.button;
  }
};

export default GlobalStyles;
