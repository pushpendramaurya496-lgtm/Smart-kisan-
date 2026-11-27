import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useChakki } from '../context/ChakkiContext';
import { WheatLogo } from './illustrations/AppIllustrations';

export const ChakkiHeaderCard = ({ onPremiumPress }) => {
  const { t } = useChakki();

  return (
    <View style={styles.card}>
      {/* Left: Circular Wheat Logo + Titles */}
      <View style={styles.leftSection}>
        <View style={styles.logoBadge}>
          <WheatLogo size={42} />
        </View>
        <View style={styles.titleColumn}>
          <Text style={styles.title}>Chakki Smart AI</Text>
          <Text style={styles.subtitle}>{t('smartMill')}</Text>
        </View>
      </View>

      {/* Subtle Vertical Divider */}
      <View style={styles.divider} />

      {/* Right: Premium Badge with Crown Icon */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPremiumPress}
        style={styles.premiumBadge}
      >
        <Text style={styles.crownEmoji}>👑</Text>
        <Text style={styles.premiumText}>{t('premium')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FDE047',
    overflow: 'hidden',
  },
  titleColumn: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDF5EE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  crownEmoji: {
    fontSize: 13,
  },
  premiumText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: 0.2,
  },
});
export default ChakkiHeaderCard;
