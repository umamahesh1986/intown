import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Fonts, FontStylesWithFallback } from './fonts';

export const FontTest = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Font Test</Text>
      
      <Text style={styles.sectionTitle}>Inter Font Test:</Text>
      
      <Text style={[styles.testText, { fontFamily: Fonts.regular }]}>
        Regular: Inter_18pt-Regular
      </Text>
      
      <Text style={[styles.testText, { fontFamily: Fonts.medium }]}>
        Medium: Inter_18pt-Medium
      </Text>
      
      <Text style={[styles.testText, { fontFamily: Fonts.semiBold }]}>
        SemiBold: Inter_18pt-SemiBold
      </Text>
      
      <Text style={[styles.testText, { fontFamily: Fonts.bold }]}>
        Bold: Inter_18pt-Bold
      </Text>
      
      <Text style={styles.sectionTitle}>Font Styles Test:</Text>
      
      <Text style={FontStylesWithFallback.h1}>H1 Heading</Text>
      <Text style={FontStylesWithFallback.h2}>H2 Heading</Text>
      <Text style={FontStylesWithFallback.h3}>H3 Heading</Text>
      <Text style={FontStylesWithFallback.body}>Body Text</Text>
      <Text style={FontStylesWithFallback.bodyMedium}>Body Medium Text</Text>
      <Text style={FontStylesWithFallback.button}>Button Text</Text>
      <Text style={FontStylesWithFallback.caption}>Caption Text</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  testText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
});

