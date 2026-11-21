import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 1-to-1 Ultra-HD 8K Splash Image (has all exact typography, logo, chakki, slogan, button & icons)
const splashBg = require('../../assets/images/chakki_splash_screen_hd.jpg');

export const GetStartedScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomSafe = Math.max(insets.bottom || 0, Platform.OS === 'android' ? 12 : 20);

  const handleGetStarted = () => {
    // 1. Immediate navigation to Language Selection screen
    navigation.navigate('LanguageSelect');

    // 2. Non-blocking haptic feedback
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
  };

  const handleFeaturePress = (feature) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}

    if (feature === 'voice') {
      navigation.navigate('VoiceAssistant');
    } else if (feature === 'khata') {
      navigation.navigate('GrahakKhata');
    } else if (feature === 'whatsapp') {
      navigation.navigate('BillPrint', { customerId: 'c1' });
    } else {
      navigation.navigate('Home');
    }
  };

  return (
    <View style={styles.container}>
      {/* Translucent status bar matching 9:41 mobile layout */}
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <ImageBackground
        source={splashBg}
        style={styles.bgImage}
        resizeMode="cover"
      >
        {/* Full-Screen Interactive Touch Layer */}
        <View style={styles.interactiveContainer}>
          {/* 
            Upper Touch Zone:
            If user taps on the chakki or slogan banner, it smoothly leads into Home
          */}
          <TouchableOpacity
            activeOpacity={0.98}
            onPress={handleGetStarted}
            style={styles.upperTapZone}
          />

          {/* 
            Dedicated 'Get Started ➔' Button Touchable Area:
            - Extra-large 70px height + 25px top/bottom hitSlop (120px total vertical touch capture)
            - Positioned right over the green button in the artwork
            - Visible press highlight feedback on touch
          */}
          <TouchableOpacity
            activeOpacity={0.65}
            onPress={handleGetStarted}
            hitSlop={{ top: 25, bottom: 25, left: 20, right: 20 }}
            style={styles.getStartedButtonTouchable}
          >
            <View style={styles.buttonFeedback} />
          </TouchableOpacity>

          {/* 
            Bottom 3 Features Interactive Row:
            - AI Voice (Left)
            - Digital Khata (Center)
            - WhatsApp (Right)
          */}
          <View style={[styles.bottomFeaturesRow, { paddingBottom: bottomSafe }]}>
            {/* 1. AI Voice */}
            <TouchableOpacity
              activeOpacity={0.55}
              onPress={() => handleFeaturePress('voice')}
              hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
              style={styles.featureHitArea}
            />

            {/* 2. Digital Khata */}
            <TouchableOpacity
              activeOpacity={0.55}
              onPress={() => handleFeaturePress('khata')}
              hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
              style={styles.featureHitArea}
            />

            {/* 3. WhatsApp */}
            <TouchableOpacity
              activeOpacity={0.55}
              onPress={() => handleFeaturePress('whatsapp')}
              hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
              style={styles.featureHitArea}
            />
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#123C18',
  },
  bgImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    flex: 1,
  },
  interactiveContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  upperTapZone: {
    flex: 1,
  },

  // Big, responsive, easy-to-tap Get Started button zone
  getStartedButtonTouchable: {
    width: '92%',
    height: 68,
    alignSelf: 'center',
    borderRadius: 34,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  buttonFeedback: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Bottom 3 Feature Hitboxes
  bottomFeaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: 60,
    zIndex: 99,
  },
  featureHitArea: {
    flex: 1,
    height: '100%',
    marginHorizontal: 4,
    borderRadius: 14,
  },
});

export default GetStartedScreen;
