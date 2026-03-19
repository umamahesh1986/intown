import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
  fallbackText?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('=== ERROR BOUNDARY CAUGHT ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    this.setState({
      errorInfo: errorInfo.componentStack || '',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.state.error?.message || 'Unknown error'}
            </Text>
            <Text style={styles.stack}>
              {this.state.error?.stack?.slice(0, 500) || ''}
            </Text>
            <Text style={styles.info}>
              {this.state.errorInfo?.slice(0, 300) || ''}
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => this.setState({ hasError: false, error: null, errorInfo: '' })}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 24, justifyContent: 'center' },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#D32F2F', marginBottom: 12 },
  message: { fontSize: 14, color: '#333', marginBottom: 8 },
  stack: { fontSize: 10, color: '#666', marginBottom: 8, fontFamily: 'monospace' },
  info: { fontSize: 10, color: '#999', marginBottom: 16 },
  button: { backgroundColor: '#FF8A00', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
