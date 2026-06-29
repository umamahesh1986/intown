# Inter Font Implementation Guide

## Overview
This guide explains how the Inter font family has been implemented across the IntownLocal mobile app.

## Font Configuration

### 1. Font Files
The Inter font family is located in `assets/fonts/Inter/` with the following structure:
- Variable fonts: `Inter-VariableFont_opsz,wght.ttf`, `Inter-Italic-VariableFont_opsz,wght.ttf`
- Static fonts: Multiple weights and sizes (18pt, 24pt, 28pt) in the `static/` folder

### 2. App Configuration
Fonts are registered in `app.json` under the `fonts` array, making them available throughout the app.

### 3. Font Utilities
The font system is centralized in `utils/fonts.ts` with:
- **Fonts**: Font family names for different weights
- **FontWeights**: Numeric weight mappings
- **FontStyles**: Pre-defined text styles for consistent typography

## Usage Examples

### Basic Font Usage
```typescript
import { Fonts, FontStylesWithFallback } from '../utils/fonts';

// Using predefined styles
const styles = StyleSheet.create({
  title: {
    ...FontStylesWithFallback.h1,
    color: '#1A1A1A',
  },
  body: {
    ...FontStylesWithFallback.body,
    color: '#666666',
  },
  button: {
    ...FontStylesWithFallback.button,
    color: '#FFFFFF',
  },
});
```

### Available Font Styles

#### Headings
- `FontStylesWithFallback.h1` - Large heading (32px, Bold)
- `FontStylesWithFallback.h2` - Medium heading (28px, SemiBold)
- `FontStylesWithFallback.h3` - Small heading (24px, Medium)
- `FontStylesWithFallback.h4` - Section title (20px, SemiBold)
- `FontStylesWithFallback.h5` - Subsection title (18px, Medium)
- `FontStylesWithFallback.h6` - Small title (16px, Medium)

#### Body Text
- `FontStylesWithFallback.body` - Regular body text (16px, Regular)
- `FontStylesWithFallback.bodyMedium` - Medium body text (16px, Medium)
- `FontStylesWithFallback.bodySmall` - Small body text (14px, Regular)

#### Buttons
- `FontStylesWithFallback.button` - Regular button text (16px, SemiBold)
- `FontStylesWithFallback.buttonLarge` - Large button text (18px, SemiBold)
- `FontStylesWithFallback.buttonSmall` - Small button text (14px, Medium)

#### Special Text
- `FontStylesWithFallback.caption` - Caption text (12px, Regular)
- `FontStylesWithFallback.overline` - Overline text (10px, Medium, Uppercase)
- `FontStylesWithFallback.logo` - Logo text (48px, Bold)
- `FontStylesWithFallback.logoSmall` - Small logo text (32px, Medium)

### Direct Font Family Usage
```typescript
import { Fonts } from '../utils/fonts';

const styles = StyleSheet.create({
  customText: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: '#1A1A1A',
  },
});
```

## Implementation Status

### ✅ Completed Files
- `login.tsx` - Login screen with Inter fonts
- `index.tsx` - Splash screen with Inter fonts
- `dashboard.tsx` - Main dashboard with Inter fonts (partial)
- `user-dashboard.tsx` - User dashboard with Inter fonts (partial)
- `member-dashboard.tsx` - Member dashboard with Inter fonts (imported)
- `merchant-dashboard.tsx` - Merchant dashboard with Inter fonts (imported)

### 🔄 Next Steps
To complete the font implementation:

1. **Update remaining text styles** in dashboard files:
   ```typescript
   // Replace old font styles with Inter styles
   oldStyle: {
     fontSize: 16,
     fontWeight: '600',
     color: '#1A1A1A',
   }
   
   // With:
   newStyle: {
     ...FontStylesWithFallback.h6,
     color: '#1A1A1A',
   }
   ```

2. **Apply consistent typography** across all screens:
   - Use `FontStylesWithFallback.h1-h6` for headings
   - Use `FontStylesWithFallback.body` for regular text
   - Use `FontStylesWithFallback.button` for buttons
   - Use `FontStylesWithFallback.caption` for small text

3. **Test font loading** on different devices and screen sizes

## Benefits

### 1. **Consistency**
- Unified typography across the entire app
- Consistent font weights and sizes
- Professional appearance

### 2. **Maintainability**
- Centralized font configuration
- Easy to update font styles globally
- Type-safe font usage

### 3. **Performance**
- Optimized font loading
- Reduced bundle size with selective font loading
- Better rendering performance

### 4. **Accessibility**
- Improved readability with Inter font
- Better contrast and spacing
- Enhanced user experience

## Troubleshooting

### Font Not Loading
1. Check if fonts are properly registered in `app.json`
2. Verify font file paths are correct
3. Restart the development server
4. Clear app cache

### Font Not Applying
1. Ensure `FontStyles` is imported
2. Check for style conflicts
3. Verify font family names are correct
4. Test on different platforms

### Performance Issues
1. Use only necessary font weights
2. Avoid loading too many font variants
3. Consider using variable fonts for better performance

## Best Practices

1. **Use predefined styles** from `FontStyles` when possible
2. **Maintain consistency** across similar UI elements
3. **Test on multiple devices** to ensure proper rendering
4. **Keep font hierarchy clear** with proper heading levels
5. **Use appropriate font weights** for different content types

This font system provides a solid foundation for consistent, professional typography throughout your IntownLocal app.
