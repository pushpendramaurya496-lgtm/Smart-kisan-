import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChakki } from '../context/ChakkiContext';
import { AuthApiService } from '../services/authApiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 600;

// High-resolution branding header
const headerScenicImg = require('../../assets/images/language_header_hd.jpg');

export const LoginPhoneScreen = ({ navigation }) => {
  const { t, syncLoggedInUser } = useChakki();
  const insets = useSafeAreaInsets();

  // Mode: 'otp' | 'pin'
  const [authMode, setAuthMode] = useState('otp');
  const [phone, setPhone] = useState('');
  const [mpin, setMpin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Send OTP (For OTP Login or Forgot PIN)
  const handleSendOtp = async (targetMode = 'otp') => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg(
        t('language') === 'en'
          ? 'Please enter a valid 10-digit mobile number'
          : 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें'
      );
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
      return;
    }

    // Save login phone immediately
    try {
      await AsyncStorage.setItem('@chakki_login_phone', cleanPhone);
    } catch (e) {}

    setErrorMsg('');
    setLoading(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    try {
      const data = await AuthApiService.sendOtp(cleanPhone);
      setLoading(false);

      // Navigate to OTP Verification Screen
      navigation.navigate('OtpVerify', {
        phone: cleanPhone,
        devOtp: data.devOtp || '1234',
        isNewUser: data.isNewUser,
        mode: targetMode, // 'otp' or 'reset_pin'
      });
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'OTP भेजने में त्रुटि हुई');
    }
  };

  // 2. Direct PIN Login
  const handleLoginWithPin = async () => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanPin = mpin.trim().replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      setErrorMsg('कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
      return;
    }

    if (cleanPin.length !== 4) {
      setErrorMsg('सुरक्षा PIN ठीक 4 अंकों का होना चाहिए');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    try {
      const data = await AuthApiService.loginWithPin(cleanPhone, cleanPin);
      setLoading(false);

      if (data.token) {
        await AuthApiService.saveAuthSession(data.token, data.user, cleanPhone);
        if (syncLoggedInUser) {
          await syncLoggedInUser(data.user, data.token, cleanPhone);
        }
      }

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}

      navigation.replace('Home');
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'गलत PIN! कृपया पुनः प्रयास करें');
    }
  };

  // 3. User taps "Forgot PIN?"
  const handleForgotPinPress = () => {
    handleSendOtp('reset_pin');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* 1. Top Scenic Branding Header */}
      <View style={styles.headerContainer}>
        <Image source={headerScenicImg} style={styles.headerImage} resizeMode="cover" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom || 0, 20) + 16 },
        ]}
      >
        {/* 2. Login Mode Tabs (OTP vs PIN) */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setAuthMode('otp');
              setErrorMsg('');
            }}
            style={[styles.tabButton, authMode === 'otp' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, authMode === 'otp' && styles.tabTextActive]}>
              📲 {t('loginWithOtpTab') || 'OTP से लॉगिन'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setAuthMode('pin');
              setErrorMsg('');
            }}
            style={[styles.tabButton, authMode === 'pin' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, authMode === 'pin' && styles.tabTextActive]}>
              🔑 {t('loginWithPinTab') || 'PIN से लॉगिन'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Title & Subtitle */}
        <Text style={styles.mainTitle}>
          {authMode === 'pin' ? (t('loginWithPinTab') || 'PIN से लॉगिन करें') : t('loginTitle')}
        </Text>
        <Text style={styles.subtitle}>
          {authMode === 'pin'
            ? 'अपना मोबाइल नंबर और 4-अंकीय सुरक्षा PIN दर्ज करें'
            : t('loginSubtitle')}
        </Text>

        {/* 4. Phone Number Input Box */}
        <Text style={styles.fieldLabel}>मोबाइल नंबर (Mobile Number)</Text>
        <View style={styles.inputWrapper}>
          <View style={styles.countryBadge}>
            <Text style={styles.flagEmoji}>🇮🇳</Text>
            <Text style={styles.countryCode}>+91</Text>
            <View style={styles.verticalDivider} />
          </View>

          <TextInput
            style={styles.textInput}
            placeholder={t('phonePlaceholder')}
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (errorMsg) setErrorMsg('');
            }}
            autoFocus={authMode === 'otp'}
          />
        </View>

        {/* 5. MPIN Input Box (When PIN mode is active) */}
        {authMode === 'pin' && (
          <View style={styles.pinSection}>
            <View style={styles.pinLabelRow}>
              <Text style={styles.fieldLabel}>
                {t('enterPinLabel') || '4-अंकीय सुरक्षा PIN'}
              </Text>

              {/* Forgot PIN Link */}
              <TouchableOpacity
                onPress={handleForgotPinPress}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.forgotPinLink}>
                  {t('forgotPinLink') || 'पिन भूल गए? (Forgot PIN)'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pinInputWrapper}>
              <TextInput
                style={styles.pinTextInput}
                placeholder={t('enterPinPlaceholder') || 'उदा. 1234'}
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                value={mpin}
                onChangeText={(text) => {
                  setMpin(text);
                  if (errorMsg) setErrorMsg('');
                }}
              />
            </View>
          </View>
        )}

        {/* Error Message */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {/* 6. Action Button */}
        {authMode === 'otp' ? (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => handleSendOtp('otp')}
            disabled={loading}
            style={[styles.actionButton, loading && styles.actionButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.actionButtonText}>{t('sendOtpBtn')}</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleLoginWithPin}
            disabled={loading}
            style={[styles.actionButton, loading && styles.actionButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.actionButtonText}>
                {t('loginWithPinBtn') || 'सुरक्षित PIN से लॉगिन करें →'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Bottom Helper for Forgot PIN when in OTP mode */}
        {authMode === 'otp' && (
          <TouchableOpacity
            style={styles.bottomForgotLink}
            onPress={handleForgotPinPress}
            activeOpacity={0.7}
          >
            <Text style={styles.bottomForgotText}>
              🔑 {t('forgotPinLink') || 'पिन भूल गए? नया PIN बनाएं'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Terms Notice */}
        <Text style={styles.termsText}>{t('termsNotice')}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCF8',
  },
  headerContainer: {
    width: '100%',
    height: isTablet ? 260 : 205,
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDF5EE',
    borderRadius: 24,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: '#0F5132',
    elevation: 2,
    shadowColor: '#0F5132',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  mainTitle: {
    fontSize: isTablet ? 26 : 22,
    fontWeight: '900',
    color: '#0E331B',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: isTablet ? 15 : 13.5,
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 19,
    fontWeight: '500',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#00A844',
    paddingHorizontal: 14,
    height: 56,
    elevation: 2,
    shadowColor: '#004D25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    marginBottom: 14,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginRight: 8,
  },
  verticalDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#CBD5E1',
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1.5,
  },
  pinSection: {
    marginBottom: 14,
  },
  pinLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPinLink: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
    textDecorationLine: 'underline',
  },
  pinInputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#00A844',
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#004D25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  pinTextInput: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 6,
  },
  errorBox: {
    marginBottom: 12,
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#004D1E',
    borderRadius: 28,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 4,
    shadowColor: '#004D1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '800',
  },
  bottomForgotLink: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  bottomForgotText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F5132',
    textDecorationLine: 'underline',
  },
  termsText: {
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 18,
  },
});
