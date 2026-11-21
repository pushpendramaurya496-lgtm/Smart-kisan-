import React, { Component } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ChakkiProvider } from './src/context/ChakkiContext';
import { AppNavigator } from './src/navigation/AppNavigator';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Caught Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ कुछ गड़बड़ हुई:</Text>
          <ScrollView style={styles.scroll}>
            <Text style={styles.errorMsg}>{String(this.state.error?.message || this.state.error)}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ChakkiProvider>
          <AppNavigator />
        </ChakkiProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 24,
    paddingTop: 80,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  errorMsg: {
    color: '#FCA5A5',
    fontSize: 14,
    lineHeight: 22,
  },
});
