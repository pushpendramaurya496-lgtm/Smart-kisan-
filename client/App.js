import React, { Component } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
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

          {/* Quick Reload & Retry Button to recover immediately */}
          <TouchableOpacity
            style={styles.retryBtn}
            activeOpacity={0.85}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.retryBtnText}>🔄 पुनः प्रयास करें (Reload & Try Again)</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <ErrorBoundary>
          <ChakkiProvider>
            <AppNavigator />
          </ChakkiProvider>
        </ErrorBoundary>
      </NavigationContainer>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 12,
  },
  scroll: {
    flex: 1,
    maxHeight: 180,
  },
  errorMsg: {
    color: '#FCA5A5',
    fontSize: 15,
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
    elevation: 3,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
