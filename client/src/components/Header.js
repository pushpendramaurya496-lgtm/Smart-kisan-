import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WheatLogo, OwnerAvatar } from './illustrations/AppIllustrations';

export const Header = () => {
  return (
    <View style={styles.container}>
      <View style={styles.brandContainer}>
        <WheatLogo size={52} />
        <View style={styles.textColumn}>
          <Text style={styles.brandTitle}>Chakki Smart AI</Text>
          <Text style={styles.brandSubtitle}>Smart Mill Management</Text>
        </View>
      </View>

      <OwnerAvatar size={48} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textColumn: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
});
