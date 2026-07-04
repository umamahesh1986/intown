// Example: How to Use Global Styles in Your Components

import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  GlobalStyles, 
  Colors, 
  Typography, 
  Spacing, 
  BorderRadius,
  Shadows,
  getButtonStyle 
} from '../styles/globalStyles';

export default function ExampleScreen() {
  return (
    <SafeAreaView style={GlobalStyles.container}>
      <ScrollView>
        {/* Using Global Container */}
        <View style={[GlobalStyles.paddingMedium]}>
          
          {/* Typography Examples */}
          <Text style={GlobalStyles.heading1}>Heading 1</Text>
          <Text style={GlobalStyles.heading2}>Heading 2</Text>
          <Text style={GlobalStyles.heading3}>Heading 3</Text>
          <Text style={GlobalStyles.bodyText}>
            This is body text with global styling
          </Text>
          <Text style={GlobalStyles.smallText}>Small text example</Text>

          {/* Card Example */}
          <View style={[GlobalStyles.card, GlobalStyles.marginTopMedium]}>
            <Text style={GlobalStyles.heading4}>Card Title</Text>
            <Text style={GlobalStyles.bodyText}>
              This is a card with global card styling
            </Text>
          </View>

          {/* Elevated Card */}
          <View style={[GlobalStyles.cardElevated, GlobalStyles.marginTopMedium]}>
            <Text style={GlobalStyles.heading4}>Elevated Card</Text>
            <Text style={GlobalStyles.bodyText}>
              This card has more shadow
            </Text>
          </View>

          {/* Button Examples */}
          <TouchableOpacity 
            style={[GlobalStyles.button, GlobalStyles.marginTopMedium]}
          >
            <Text style={GlobalStyles.buttonText}>Primary Button</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[GlobalStyles.buttonSecondary, GlobalStyles.marginTopSmall]}
          >
            <Text style={GlobalStyles.buttonText}>Secondary Button</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[GlobalStyles.buttonOutline, GlobalStyles.marginTopSmall]}
          >
            <Text style={GlobalStyles.buttonOutlineText}>Outline Button</Text>
          </TouchableOpacity>

          {/* Input Example */}
          <TextInput
            style={[GlobalStyles.input, GlobalStyles.marginTopMedium]}
            placeholder="Enter text here"
            placeholderTextColor={Colors.placeholder}
          />

          {/* Row Example */}
          <View style={[GlobalStyles.rowSpaceBetween, GlobalStyles.marginTopMedium]}>
            <Text style={GlobalStyles.bodyText}>Label</Text>
            <Text style={GlobalStyles.bodyTextBold}>Value</Text>
          </View>

          {/* Badge Examples */}
          <View style={[GlobalStyles.row, GlobalStyles.marginTopMedium]}>
            <View style={[GlobalStyles.badge, GlobalStyles.badgeSuccess]}>
              <Text style={GlobalStyles.badgeText}>Success</Text>
            </View>
            <View style={[GlobalStyles.badge, GlobalStyles.badgeError, { marginLeft: Spacing.small }]}>
              <Text style={GlobalStyles.badgeText}>Error</Text>
            </View>
            <View style={[GlobalStyles.badge, GlobalStyles.badgeWarning, { marginLeft: Spacing.small }]}>
              <Text style={GlobalStyles.badgeText}>Warning</Text>
            </View>
          </View>

          {/* Using Colors Directly */}
          <View style={{
            backgroundColor: Colors.primary,
            padding: Spacing.medium,
            borderRadius: BorderRadius.medium,
            marginTop: Spacing.medium,
          }}>
            <Text style={{ color: Colors.white, fontSize: Typography.medium }}>
              Custom styled component using Colors, Spacing, BorderRadius
            </Text>
          </View>

          {/* Using Shadows */}
          <View style={{
            backgroundColor: Colors.white,
            padding: Spacing.large,
            borderRadius: BorderRadius.large,
            marginTop: Spacing.medium,
            ...Shadows.large,
          }}>
            <Text style={GlobalStyles.bodyText}>Component with large shadow</Text>
          </View>

          {/* Divider */}
          <View style={GlobalStyles.divider} />

          {/* Error Message */}
          <View style={GlobalStyles.errorContainer}>
            <Text style={GlobalStyles.errorText}>This is an error message</Text>
          </View>

          {/* Success Message */}
          <View style={GlobalStyles.successContainer}>
            <Text style={GlobalStyles.successText}>This is a success message</Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
