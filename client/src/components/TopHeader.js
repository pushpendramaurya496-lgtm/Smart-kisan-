import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useChakki } from '../context/ChakkiContext';

const farmerProfileImg = require('../../assets/icons/farmer_profile.png');

export const TopHeader = ({ onProfilePress }) => {
  const { currentUser } = useChakki();
  const profileImage = currentUser?.profile?.profileImage || null;

  return (
    <View style={styles.container}>
      {/* Left Brand Identity: Leaf Logo + Title + Subtitle */}
      <View style={styles.brandRow}>
        {/* Circular White Leaf Logo */}
        <View style={styles.logoCircle}>
          <Text style={styles.leafEmoji}>🌿</Text>
        </View>

        {/* Typography */}
        <View style={styles.titleColumn}>
          <Text style={styles.mainTitle}>Kisan Sathi</Text>
          <Text style={styles.subtitle}>Empowering Farmers, Enriching India</Text>
        </View>
      </View>

      {/* Right Action Icons: Notification Bell + Farmer Avatar */}
      <View style={styles.rightActions}>
        {/* Notification Bell with Red Dot */}
        <TouchableOpacity activeOpacity={0.8} style={styles.bellButton}>
          <Text style={styles.bellIcon}>🔔</Text>
          <View style={styles.redDot} />
        </TouchableOpacity>

        {/* User Profile Avatar with Green Border Ring */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onProfilePress}
          style={styles.avatarButton}
          accessibilityLabel="View owner profile"
        >
          <Image
            source={profileImage ? { uri: profileImage } : farmerProfileImg}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginBottom: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  leafEmoji: {
    fontSize: 22,
  },
  titleColumn: {
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F5132',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    position: 'relative',
  },
  bellIcon: {
    fontSize: 18,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    position: 'absolute',
    top: 9,
    right: 9,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: '#0F5132',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});
export default TopHeader;
