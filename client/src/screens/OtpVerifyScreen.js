import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useChakki } from '../context/ChakkiContext';
import { AuthApiService } from '../services/authApiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 600;

export const OtpVerifyScreen = ({ navigation, route }) => {
  const { phone = '9876543210', devOtp = '1234', mode = 'otp' } = route.params || {};
  const { t } = useChakki();
  const insets = useSafeAreaInsets();

  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // 60-second countdown
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (text, index) => {
    const cleaned = text.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleaned.slice(-1);
    setOtp(newOtp);
    if (errorMsg) setErrorMsg('');

    // Auto-focus to next box
    if (cleaned && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 4) {
      setErrorMsg('कृपया पूरा 4-अंकीय OTP दर्ज करें');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    try {
      const data = await AuthApiService.verifyOtp(phone, fullOtp);
      setLoading(false);

      // If user came via "Forgot PIN", proceed directly to Reset PIN screen
      if (mode === 'reset_pin') {
        navigation.navigate('ResetPin', {
          phone,
          otp: fullOtp,
        });
        return;
      }

      // Save token
      await AuthApiService.saveAuthSession(data.token, data.user);

      // If user profile is already completed -> go to Dashboard (Home)
      // If new user -> go to Profile Setup screen
      if (data.user && data.user.isProfileCompleted) {
        navigation.replace('Home');
      } else {
        navigation.navigate('OwnerProfile', {
          token: data.token,
          phone,
        });
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'गलत OTP! कृपया पुनः प्रयास करें');
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setTimer(60);
    try {
      Haptics.selectionAsync();
      await AuthApiService.sendOtp(phone);
    } catch (e) {}
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top || 0, 40) + 20,
            paddingBottom: Math.max(insets.bottom || 0, 20) + 16,
          },
        ]}
      >
        {/* Top Back/Icon */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Title & Phone summary */}
        <Text style={styles.mainTitle}>{t('otpTitle')}</Text>
        <Text style={styles.subtitle}>{t('otpSubtitle')}</Text>

        <View style={styles.phoneRow}>
          <Text style={styles.phoneText}>+91 {phone}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.editPhone}>बदलें</Text>
          </TouchableOpacity>
        </View>

        {/* Demo Helper Badge */}
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>💡 {t('demoCodeBadge')}</Text>
        </View>

        {/* 4 OTP Digit Input Boxes */}
        <View style={styles.otpBoxesRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={inputRefs[idx]}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Error message */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {/* Resend Timer Row */}
        <View style={styles.timerRow}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              दोबारा OTP मंगाएं ({timer < 10 ? `0${timer}` : timer}s)
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>{t('resendOtp')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ flex: 1, minHeight: 40 }} />

        {/* Action Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleVerify}
          disabled={loading}
          style={[styles.actionButton, loading && styles.actionButtonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.actionButtonText}>{t('verifyOtpBtn')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCF8',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  backArrow: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0E331B',
  },
  mainTitle: {
    fontSize: isTablet ? 30 : 26,
    fontWeight: '900',
    color: '#0E331B',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14.5,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  phoneText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginRight: 10,
  },
  editPhone: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00A844',
    textDecorationLine: 'underline',
  },
  demoBadge: {
    backgroundColor: '#FEF9C3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginBottom: 26,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  demoBadgeText: {
    color: '#854D0E',
    fontSize: 12.5,
    fontWeight: '700',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpBox: {
    width: (SCREEN_WIDTH - 48 - 36) / 4,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    elevation: 2,
    shadowColor: '#004D25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  otpBoxFilled: {
    borderColor: '#00A844',
    backgroundColor: '#F0FDF4',
  },
  errorBox: {
    marginBottom: 14,
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  timerRow: {
    alignItems: 'center',
    marginTop: 10,
  },
  timerText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  resendLink: {
    color: '#00A844',
    fontSize: 15,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  actionButton: {
    backgroundColor: '#004D1E',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 18,
    fontWeight: '800',
  },
});

