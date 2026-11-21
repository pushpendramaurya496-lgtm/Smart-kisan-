import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { useChakki } from '../context/ChakkiContext';
import { SpeechService } from '../services/speechService';

export const VoiceAssistantScreen = ({ navigation }) => {
  const { addEntry } = useChakki();
  const insets = useSafeAreaInsets();
  const topSafePadding = Math.max(insets.top, 48);

  const [spokenText, setSpokenText] = useState('रामलाल का 30 किलो गेहूं 4 रुपये किलो से जोड़ दो');
  const [isRecognized, setIsRecognized] = useState(true);

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addEntry({
      customerName: 'रामलाल',
      item: 'गेहूं (पिसाई)',
      weight: 30,
      rate: 4,
      isPaid: false,
    });
    navigation.navigate('GrahakKhata');
  };

  const handleMicTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    SpeechService.speak('बोलिए, मैं सुन रहा हूँ...');
  };

  return (
    <View style={[styles.safeArea, { paddingTop: topSafePadding }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voice Assistant</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Top Equalizer Waveform */}
        <View style={styles.waveContainer}>
          <View style={[styles.waveLine, { height: 12 }]} />
          <View style={[styles.waveLine, { height: 22 }]} />
          <View style={[styles.waveLine, { height: 16 }]} />
          <View style={[styles.waveLine, { height: 26 }]} />
          <View style={[styles.waveLine, { height: 14 }]} />
          <View style={[styles.waveLine, { height: 20 }]} />
          <View style={[styles.waveLine, { height: 10 }]} />
        </View>

        {/* Center Glowing Neon Mic */}
        <View style={styles.micStage}>
          <View style={styles.outerRing}>
            <View style={styles.midRing}>
              <TouchableOpacity activeOpacity={0.8} onPress={handleMicTap}>
                <LinearGradient
                  colors={['#06B6D4', '#10B981', '#059669']}
                  style={styles.micCircle}
                >
                  <Text style={styles.micIcon}>🎙️</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Speech Card */}
        <View style={styles.speechBox}>
          <Text style={styles.heardLabel}>पहचानी गई आवाज़:</Text>
          <View style={styles.quoteCard}>
            <Text style={styles.speechText}>"{spokenText}"</Text>
          </View>

          {isRecognized && (
            <View style={styles.successPill}>
              <Text style={styles.successText}>✔ रिकॉर्ड जुड़ गया!</Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleConfirm}
          style={styles.confirmBtn}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.btnGradient}
          >
            <Text style={styles.btnText}>ठीक है ✔</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
    paddingHorizontal: 20,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#1E293B',
  },
  backBtn: {
    padding: 6,
  },
  backText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  waveContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginVertical: 16,
  },
  waveLine: {
    width: 3.5,
    backgroundColor: Colors.neonCyan,
    borderRadius: 3,
  },
  micStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  outerRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  midRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 12,
    shadowColor: Colors.neonCyan,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  micIcon: {
    fontSize: 42,
  },
  speechBox: {
    backgroundColor: '#0F1E2E',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    gap: 10,
  },
  heardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  quoteCard: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 14,
    padding: 12,
  },
  speechText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FDE68A',
    lineHeight: 20,
    textAlign: 'center',
  },
  successPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    alignItems: 'center',
  },
  successText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34D399',
  },
  confirmBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
  },
  btnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
