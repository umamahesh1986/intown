# 🎨 Global Styles Guide for IntownLocal App

## ⚠️ Important: React Native Does NOT Use CSS Files!

React Native is **NOT a web framework**. It uses **StyleSheet API** instead of CSS.

This guide shows you how to use **global styles** the React Native way!

---

## 📁 File Structure

```
frontend/
├── styles/
│   ├── globalStyles.ts      # Global styles file
│   ├── EXAMPLE_USAGE.tsx    # Usage examples
│   └── README.md            # This file
```

---

## 🚀 Quick Start

### Step 1: Import Global Styles

```typescript
import { GlobalStyles, Colors, Typography, Spacing } from '../styles/globalStyles';
```

### Step 2: Use in Your Component

```typescript
import { View, Text } from 'react-native';
import { GlobalStyles, Colors } from '../styles/globalStyles';

export default function MyScreen() {
  return (
    <View style={GlobalStyles.container}>
      <Text style={GlobalStyles.heading1}>Welcome!</Text>
      <Text style={GlobalStyles.bodyText}>This uses global styles</Text>
    </View>
  );
}
```

---

## 🎨 What's Available

### 1. **Colors**

All app colors in one place:

```typescript
import { Colors } from '../styles/globalStyles';

// Usage
<View style={{ backgroundColor: Colors.primary }}>
  <Text style={{ color: Colors.white }}>Hello</Text>
</View>
```

**Available Colors:**
- `Colors.primary` - #FF6600 (Orange)
- `Colors.secondary` - #2196F3 (Blue)
- `Colors.success` - #4CAF50 (Green)
- `Colors.error` - #FF0000 (Red)
- `Colors.white` - #FFFFFF
- `Colors.black` - #000000
- `Colors.gray` - #666666
- And many more...

---

### 2. **Typography**

Consistent font sizes and weights:

```typescript
import { Typography } from '../styles/globalStyles';

// Usage
<Text style={{ 
  fontSize: Typography.large,
  fontWeight: Typography.bold 
}}>
  Bold Large Text
</Text>
```

**Font Sizes:**
- `Typography.tiny` - 10
- `Typography.small` - 12
- `Typography.regular` - 14
- `Typography.medium` - 16
- `Typography.large` - 18
- `Typography.xlarge` - 20
- `Typography.xxlarge` - 24
- `Typography.huge` - 32
- `Typography.massive` - 48

**Font Weights:**
- `Typography.light` - '300'
- `Typography.regular_weight` - '400'
- `Typography.medium_weight` - '500'
- `Typography.semibold` - '600'
- `Typography.bold` - '700'
- `Typography.extrabold` - '800'

---

### 3. **Spacing**

Consistent spacing throughout the app:

```typescript
import { Spacing } from '../styles/globalStyles';

// Usage
<View style={{ 
  padding: Spacing.medium,
  marginTop: Spacing.large 
}}>
  ...
</View>
```

**Available Spacing:**
- `Spacing.tiny` - 4
- `Spacing.small` - 8
- `Spacing.regular` - 12
- `Spacing.medium` - 16
- `Spacing.large` - 24
- `Spacing.xlarge` - 32
- `Spacing.xxlarge` - 48
- `Spacing.huge` - 64

---

### 4. **Border Radius**

Consistent rounded corners:

```typescript
import { BorderRadius } from '../styles/globalStyles';

// Usage
<View style={{ borderRadius: BorderRadius.medium }}>
  ...
</View>
```

**Available Radius:**
- `BorderRadius.small` - 4
- `BorderRadius.regular` - 8
- `BorderRadius.medium` - 12
- `BorderRadius.large` - 16
- `BorderRadius.xlarge` - 24
- `BorderRadius.round` - 999 (perfect circle)

---

### 5. **Shadows**

Pre-defined shadow styles:

```typescript
import { Shadows } from '../styles/globalStyles';

// Usage
<View style={{ ...Shadows.medium }}>
  This has a medium shadow
</View>
```

**Available Shadows:**
- `Shadows.small` - Subtle shadow
- `Shadows.medium` - Medium shadow
- `Shadows.large` - Strong shadow

---

### 6. **GlobalStyles**

Pre-made component styles:

```typescript
import { GlobalStyles } from '../styles/globalStyles';
```

---

## 📦 Complete Usage Examples

### Example 1: Container

```typescript
<View style={GlobalStyles.container}>
  {/* Your content */}
</View>

// Or centered
<View style={GlobalStyles.centerContainer}>
  {/* Centered content */}
</View>
```

---

### Example 2: Cards

```typescript
// Regular card
<View style={GlobalStyles.card}>
  <Text style={GlobalStyles.heading3}>Card Title</Text>
  <Text style={GlobalStyles.bodyText}>Card content</Text>
</View>

// Elevated card (more shadow)
<View style={GlobalStyles.cardElevated}>
  <Text>Elevated card</Text>
</View>
```

---

### Example 3: Buttons

```typescript
// Primary button
<TouchableOpacity style={GlobalStyles.button}>
  <Text style={GlobalStyles.buttonText}>Click Me</Text>
</TouchableOpacity>

// Secondary button
<TouchableOpacity style={GlobalStyles.buttonSecondary}>
  <Text style={GlobalStyles.buttonText}>Secondary</Text>
</TouchableOpacity>

// Outline button
<TouchableOpacity style={GlobalStyles.buttonOutline}>
  <Text style={GlobalStyles.buttonOutlineText}>Outline</Text>
</TouchableOpacity>
```

---

### Example 4: Text Styles

```typescript
<Text style={GlobalStyles.heading1}>Heading 1</Text>
<Text style={GlobalStyles.heading2}>Heading 2</Text>
<Text style={GlobalStyles.heading3}>Heading 3</Text>
<Text style={GlobalStyles.heading4}>Heading 4</Text>
<Text style={GlobalStyles.bodyText}>Body text</Text>
<Text style={GlobalStyles.bodyTextBold}>Bold body text</Text>
<Text style={GlobalStyles.smallText}>Small text</Text>
<Text style={GlobalStyles.caption}>Caption text</Text>
```

---

### Example 5: Inputs

```typescript
<TextInput
  style={GlobalStyles.input}
  placeholder="Enter text"
  placeholderTextColor={Colors.placeholder}
/>

// Focused input
<TextInput style={[GlobalStyles.input, GlobalStyles.inputFocused]} />

// Error input
<TextInput style={[GlobalStyles.input, GlobalStyles.inputError]} />
```

---

### Example 6: Rows and Columns

```typescript
// Row with items centered
<View style={GlobalStyles.row}>
  <Text>Item 1</Text>
  <Text>Item 2</Text>
</View>

// Row with space between
<View style={GlobalStyles.rowSpaceBetween}>
  <Text>Left</Text>
  <Text>Right</Text>
</View>

// Column
<View style={GlobalStyles.column}>
  <Text>Item 1</Text>
  <Text>Item 2</Text>
</View>
```

---

### Example 7: Badges

```typescript
// Success badge
<View style={[GlobalStyles.badge, GlobalStyles.badgeSuccess]}>
  <Text style={GlobalStyles.badgeText}>Active</Text>
</View>

// Error badge
<View style={[GlobalStyles.badge, GlobalStyles.badgeError]}>
  <Text style={GlobalStyles.badgeText}>Failed</Text>
</View>

// Warning badge
<View style={[GlobalStyles.badge, GlobalStyles.badgeWarning]}>
  <Text style={GlobalStyles.badgeText}>Pending</Text>
</View>
```

---

### Example 8: Messages

```typescript
// Error message
<View style={GlobalStyles.errorContainer}>
  <Text style={GlobalStyles.errorText}>Something went wrong!</Text>
</View>

// Success message
<View style={GlobalStyles.successContainer}>
  <Text style={GlobalStyles.successText}>Success!</Text>
</View>
```

---

### Example 9: Spacing Helpers

```typescript
<View style={GlobalStyles.marginTopSmall}>...</View>
<View style={GlobalStyles.marginTopMedium}>...</View>
<View style={GlobalStyles.marginTopLarge}>...</View>

<View style={GlobalStyles.marginBottomSmall}>...</View>
<View style={GlobalStyles.marginBottomMedium}>...</View>
<View style={GlobalStyles.marginBottomLarge}>...</View>

<View style={GlobalStyles.paddingSmall}>...</View>
<View style={GlobalStyles.paddingMedium}>...</View>
<View style={GlobalStyles.paddingLarge}>...</View>
```

---

### Example 10: Combining Styles

```typescript
// Combine multiple styles with array
<View style={[
  GlobalStyles.card,
  GlobalStyles.marginTopMedium,
  { backgroundColor: Colors.primary }
]}>
  <Text style={[
    GlobalStyles.bodyText,
    { color: Colors.white }
  ]}>
    Combined styles
  </Text>
</View>
```

---

## 🔥 Real-World Example

Here's a complete screen using global styles:

```typescript
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlobalStyles, Colors, Spacing } from '../styles/globalStyles';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={GlobalStyles.container}>
      <ScrollView>
        {/* Header */}
        <View style={GlobalStyles.header}>
          <Text style={GlobalStyles.heading2}>My Profile</Text>
        </View>

        {/* Content */}
        <View style={GlobalStyles.paddingMedium}>
          
          {/* User Card */}
          <View style={GlobalStyles.cardElevated}>
            <View style={GlobalStyles.rowSpaceBetween}>
              <View>
                <Text style={GlobalStyles.heading3}>John Doe</Text>
                <Text style={GlobalStyles.bodyText}>john@example.com</Text>
              </View>
              <View style={[GlobalStyles.badge, GlobalStyles.badgeSuccess]}>
                <Text style={GlobalStyles.badgeText}>Member</Text>
              </View>
            </View>
          </View>

          {/* Form */}
          <Text style={[GlobalStyles.heading4, GlobalStyles.marginTopLarge]}>
            Update Information
          </Text>
          
          <TextInput
            style={[GlobalStyles.input, GlobalStyles.marginTopMedium]}
            placeholder="Full Name"
            placeholderTextColor={Colors.placeholder}
          />
          
          <TextInput
            style={[GlobalStyles.input, GlobalStyles.marginTopSmall]}
            placeholder="Email"
            placeholderTextColor={Colors.placeholder}
          />

          {/* Button */}
          <TouchableOpacity 
            style={[GlobalStyles.button, GlobalStyles.marginTopLarge]}
          >
            <Text style={GlobalStyles.buttonText}>Save Changes</Text>
          </TouchableOpacity>

          {/* Stats */}
          <View style={[GlobalStyles.card, GlobalStyles.marginTopLarge]}>
            <Text style={GlobalStyles.heading4}>Your Savings</Text>
            <View style={GlobalStyles.divider} />
            
            <View style={GlobalStyles.rowSpaceBetween}>
              <Text style={GlobalStyles.bodyText}>This Month:</Text>
              <Text style={[GlobalStyles.bodyTextBold, { color: Colors.success }]}>
                ₹1,200
              </Text>
            </View>
            
            <View style={[GlobalStyles.rowSpaceBetween, GlobalStyles.marginTopSmall]}>
              <Text style={GlobalStyles.bodyText}>This Year:</Text>
              <Text style={[GlobalStyles.bodyTextBold, { color: Colors.success }]}>
                ₹14,400
              </Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## 💡 Best Practices

### ✅ DO:

```typescript
// Use global styles
<Text style={GlobalStyles.heading1}>Title</Text>

// Combine with custom styles
<View style={[GlobalStyles.card, { marginTop: 20 }]}>

// Use Colors, Spacing, etc.
<View style={{ 
  backgroundColor: Colors.primary,
  padding: Spacing.medium 
}}>
```

### ❌ DON'T:

```typescript
// Don't use CSS files
import './styles.css' // ❌ Won't work!

// Don't use className
<div className="container"> // ❌ React Native uses View, not div

// Don't hardcode values everywhere
<View style={{ padding: 16, color: '#FF6600' }}> // ❌ Use Spacing and Colors instead
```

---

## 🎯 How to Update Global Styles

### Change a Color:

Edit `/frontend/styles/globalStyles.ts`:

```typescript
export const Colors = {
  primary: '#FF6600',  // Change this to your new color
  // ...
};
```

All components using `Colors.primary` will update automatically!

### Add New Style:

```typescript
export const GlobalStyles = StyleSheet.create({
  // Existing styles...
  
  // Add your new style
  myCustomCard: {
    backgroundColor: Colors.white,
    padding: Spacing.large,
    borderRadius: BorderRadius.large,
    ...Shadows.medium,
  },
});
```

Then use it:
```typescript
<View style={GlobalStyles.myCustomCard}>
  ...
</View>
```

---

## 🚀 Summary

✅ **Created:** `/frontend/styles/globalStyles.ts`  
✅ **Contains:** Colors, Typography, Spacing, Shadows, BorderRadius, GlobalStyles  
✅ **Usage:** Import and use in any component  
✅ **Benefits:** Consistent styling across entire app  

**No CSS files needed - this is the React Native way!** 🎉

---

## 📚 Need More Help?

- See `EXAMPLE_USAGE.tsx` for complete examples
- Check existing components like `login.tsx`, `member-dashboard.tsx` for real usage
- React Native StyleSheet docs: https://reactnative.dev/docs/stylesheet

---

Happy Styling! 🎨
