import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { KisanAiRobot } from './illustrations/AppIllustrations';

export const VoiceWaveformButton = ({ onPress }) => {
  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    if (onPress) onPress();
  };

  // Soundwave heights matching the reference image: | | | | |
  const waveBarsLeft = [6, 12, 20, 14, 24, 16, 8];
  const waveBarsRight = [8, 16, 24, 14, 20, 12, 6];

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handlePress}
      style={styles.wrapper}
    >
      <LinearGradient
        colors={['#064E3B', '#065F46', '#047857', '#059669', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.9 }}
        style={styles.container}
      >
        {/* Upper Row: Robot on Left + Center Waves & Prominent Mic */}
        <View style={styles.topRow}>
          {/* Left: 3D AI Robot illustration */}
          <View style={styles.robotContainer}>
            <KisanAiRobot size={66} />
          </View>

          {/* Center Area: Sound Waves + Circular Mic */}
          <View style={styles.micWaveRow}>
            {/* Left Sound Wave Bars */}
            <View style={styles.waveGroup}>
              {waveBarsLeft.map((height, idx) => (
                <View key={`wl-${idx}`} style={[styles.waveBar, { height }]} />
              ))}
            </View>

            {/* Prominent Circular Microphone Button with Glow */}
            <View style={styles.outerGlow}>
              <View style={styles.innerWhiteCircle}>
                <Text style={styles.micEmoji}>🎙️</Text>
              </View>
            </View>

            {/* Right Sound Wave Bars */}
            <View style={styles.waveGroup}>
              {waveBarsRight.map((height, idx) => (
                <View key={`wr-${idx}`} style={[styles.waveBar, { height }]} />
              ))}
            </View>
          </View>
        </View>

        {/* Lower Section: Heading & Example */}
        <View style={styles.textSection}>
          <Text style={styles.mainHeading}>Add Entry by Voice</Text>
          <Text style={styles.exampleText}>e.g. , Add 25 kg wheat for Ramlal</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  container: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  robotContainer: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micWaveRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  waveGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveBar: {
    width: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 2,
  },
  outerGlow: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  innerWhiteCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  micEmoji: {
    fontSize: 22,
  },
  textSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  mainHeading: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  exampleText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 2,
  },
});
export default VoiceWaveformButton;
