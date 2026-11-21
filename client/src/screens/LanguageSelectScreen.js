import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useChakki } from '../context/ChakkiContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 600;

// Ultra-HD 4K Gemini Generated Top Scenic Header with Glowing Medallion
const headerScenicImg = require('../../assets/images/language_header_hd.jpg');

export const LanguageSelectScreen = ({ navigation }) => {
  const { language, setLanguage, t } = useChakki();
  const insets = useSafeAreaInsets();

  const handleSelectLang = (lang) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setLanguage(lang);
  };

  const handleContinue = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    // Navigate to Mobile Login Screen
    navigation.navigate('LoginPhone');
  };

  return (
    <View style={styles.container}>
      {/* High-contrast dark status bar icons */}
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* 1. Top Scenic Header with Central Glowing Chakki Medallion */}
      <View style={styles.headerContainer}>
        <Image
          source={headerScenicImg}
          style={styles.headerImage}
          resizeMode="cover"
        />
      </View>

      {/* 2. Main Content Card Area */}
      <View style={styles.contentContainer}>
        {/* Title */}
        <Text style={styles.mainTitle}>Choose your language</Text>

        {/* Hindi Subtitle with Horizontal Green Accent Lines */}
        <View style={styles.subtitleRow}>
          <View style={styles.accentLine} />
          <Text style={styles.subtitleHindi}>अपनी पसंदीदा भाषा चुनें</Text>
          <View style={styles.accentLine} />
        </View>

        {/* Change Anytime Pill Badge */}
        <View style={styles.pillBadge}>
          <Text style={styles.pillText}>You can change it anytime from Settings</Text>
        </View>

        {/* Spacing */}
        <View style={{ height: 26 }} />

        {/* 3. Language Options */}
        {/* OPTION 1: English */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handleSelectLang('en')}
          style={[
            styles.langCard,
            language === 'en' ? styles.langCardActive : styles.langCardInactive,
          ]}
        >
          {/* Left "E" Badge */}
          <View style={styles.badgeBox}>
            <Text style={styles.badgeLetter}>E</Text>
          </View>

          {/* Text Information */}
          <View style={styles.langTextCol}>
            <Text style={styles.langTitle}>English</Text>
            <Text style={styles.langSubtitle}>Continue in English</Text>
          </View>

          {/* Selection Circle */}
          <View
            style={[
              styles.radioCircle,
              language === 'en' ? styles.radioSelected : styles.radioUnselected,
            ]}
          >
            {language === 'en' && <Text style={styles.checkmarkIcon}>✓</Text>}
          </View>
        </TouchableOpacity>

        {/* OPTION 2: हिंदी (Hindi) */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handleSelectLang('hi')}
          style={[
            styles.langCard,
            language === 'hi' ? styles.langCardActive : styles.langCardInactive,
          ]}
        >
          {/* Left "अ" Badge */}
          <View style={styles.badgeBox}>
            <Text style={styles.badgeLetter}>अ</Text>
          </View>

          {/* Text Information */}
          <View style={styles.langTextCol}>
            <Text style={styles.langTitle}>हिंदी</Text>
            <Text style={styles.langSubtitle}>हिंदी में जारी रखें</Text>
          </View>

          {/* Selection Circle */}
          <View
            style={[
              styles.radioCircle,
              language === 'hi' ? styles.radioSelected : styles.radioUnselected,
            ]}
          >
            {language === 'hi' && <Text style={styles.checkmarkIcon}>✓</Text>}
          </View>
        </TouchableOpacity>

        {/* Flexible Spacer pushing buttons to bottom */}
        <View style={{ flex: 1, minHeight: 30 }} />

        {/* 4. Continue Action Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleContinue}
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>Continue →</Text>
        </TouchableOpacity>

        {/* 5. Bottom Branding Footer */}
        <View style={[styles.footerRow, { paddingBottom: Math.max(insets.bottom || 0, 16) }]}>
          <View style={styles.footerLine} />
          <Text style={styles.footerBrand}>ChakkiPro</Text>
          <View style={styles.footerLine} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCF8',
  },
  headerContainer: {
    width: '100%',
    height: isTablet ? 340 : 255,
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: '#FAFCF8',
  },
  mainTitle: {
    fontSize: isTablet ? 32 : 26,
    fontWeight: '900',
    color: '#0E331B',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  accentLine: {
    width: 42,
    height: 1.2,
    backgroundColor: '#2D6A4F',
    opacity: 0.7,
  },
  subtitleHindi: {
    fontSize: isTablet ? 20 : 16.5,
    fontWeight: '800',
    color: '#1B4332',
    marginHorizontal: 10,
    letterSpacing: -0.2,
  },
  pillBadge: {
    backgroundColor: '#E2F4E9',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 10,
    alignSelf: 'center',
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1B4332',
    textAlign: 'center',
  },
  langCard: {
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#004D25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  langCardActive: {
    backgroundColor: '#EAF8ED',
    borderWidth: 2,
    borderColor: '#15803D',
  },
  langCardInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
  },
  badgeBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#C8E6C9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLetter: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0E331B',
  },
  langTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  langTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  langSubtitle: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  radioCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: '#15803D',
  },
  radioUnselected: {
    borderWidth: 1.8,
    borderColor: '#4A8B58',
    backgroundColor: '#FFFFFF',
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  continueButton: {
    backgroundColor: '#004D1E',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#004D1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  footerLine: {
    width: 44,
    height: 1,
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F5132',
    marginHorizontal: 12,
  },
});

