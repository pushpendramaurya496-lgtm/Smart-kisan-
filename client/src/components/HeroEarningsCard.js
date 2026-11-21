import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Decorative etched wheat stalks artwork on right side of gradient card
const DecorativeWheatArt = () => (
  <View style={styles.wheatArtContainer}>
    {/* Stalk 1 (Center) */}
    <View style={[styles.stalkMain, { height: 74, transform: [{ rotate: '8deg' }] }]}>
      {[...Array(6)].map((_, i) => (
        <React.Fragment key={`c-${i}`}>
          <View style={[styles.grainLeft, { top: i * 10 }]} />
          <View style={[styles.grainRight, { top: i * 10 + 2 }]} />
        </React.Fragment>
      ))}
    </View>

    {/* Stalk 2 (Left leaning) */}
    <View style={[styles.stalkMain, { height: 60, left: -14, top: 12, transform: [{ rotate: '-14deg' }] }]}>
      {[...Array(5)].map((_, i) => (
        <React.Fragment key={`l-${i}`}>
          <View style={[styles.grainLeft, { top: i * 9 }]} />
          <View style={[styles.grainRight, { top: i * 9 + 2 }]} />
        </React.Fragment>
      ))}
    </View>

    {/* Stalk 3 (Right leaning) */}
    <View style={[styles.stalkMain, { height: 62, right: -14, top: 10, transform: [{ rotate: '24deg' }] }]}>
      {[...Array(5)].map((_, i) => (
        <React.Fragment key={`r-${i}`}>
          <View style={[styles.grainLeft, { top: i * 9 }]} />
          <View style={[styles.grainRight, { top: i * 9 + 2 }]} />
        </React.Fragment>
      ))}
    </View>
  </View>
);

export const HeroEarningsCard = ({ earnings = 2850, growthPercent = 12, onPress }) => {
  const formattedEarnings = Number(earnings).toLocaleString('en-IN');

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={styles.cardContainer}
    >
      <LinearGradient
        colors={['#064E3B', '#047857', '#059669', '#15803D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientCard}
      >
        {/* Left Section: Typography & Amount */}
        <View style={styles.leftContent}>
          <Text style={styles.titleText}>Today's Earnings</Text>

          <View style={styles.amountRow}>
            <Text style={styles.amountText}>₹ {formattedEarnings}</Text>

            {/* Pill-shaped light-green growth indicator */}
            <View style={styles.growthBadge}>
              <Text style={styles.growthText}>+ {growthPercent}%</Text>
            </View>
          </View>
        </View>

        {/* Right Section: Decorative Wheat Artwork */}
        <DecorativeWheatArt />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  gradientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    minHeight: 100,
    position: 'relative',
    overflow: 'hidden',
  },
  leftContent: {
    zIndex: 2,
    flex: 1,
  },
  titleText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.88)',
    letterSpacing: 0.2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  growthBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },

  // Decorative Wheat Artwork on Right
  wheatArtContainer: {
    width: 90,
    height: 80,
    position: 'absolute',
    right: 12,
    bottom: 4,
    alignItems: 'center',
    justifyContent: 'flex-end',
    opacity: 0.38,
  },
  stalkMain: {
    position: 'absolute',
    bottom: 0,
    width: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    alignItems: 'center',
  },
  grainLeft: {
    position: 'absolute',
    left: -7,
    width: 7,
    height: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-35deg' }],
  },
  grainRight: {
    position: 'absolute',
    right: -7,
    width: 7,
    height: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '35deg' }],
  },
});
export default HeroEarningsCard;
