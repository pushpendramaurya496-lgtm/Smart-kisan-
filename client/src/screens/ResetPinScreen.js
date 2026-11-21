import React, { useState } from 'react';
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
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useChakki } from '../context/ChakkiContext';
import { AuthApiService } from '../services/authApiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 600;

const headerScenicImg = require('../../assets/images/language_header_hd.jpg');

export const ResetPinScreen = ({ navigation, route }) => {
  const { phone = '9876543210', otp = '1234' } = route.params || {};
  const { t } = useChakki();
  const insets = useSafeAreaInsets();

  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleResetPin = async () => {
    const cleanNew = newPin.trim().replace(/\D/g, '');
    const cleanConfirm = confirmPin.trim().replace(/\D/g, '');

    if (cleanNew.length !== 4) {
      setErrorMsg('नया MPIN ठीक 4 अंकों का होना चाहिए');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setErrorMsg(t('pinMismatch') || 'दोनों PIN आपस में मेल नहीं खा रहे हैं');
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
      const data = await AuthApiService.resetPin(phone, otp, cleanNew);
      setLoading(false);
      setSuccessMsg(t('pinSuccessMsg') || 'नया PIN सफलतापूर्वक सेट हो गया!');

      // Save auth token
      if (data.token) {
        await AuthApiService.saveAuthSession(data.token, data.user);
      }

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}

      setTimeout(() => {
        navigation.replace('Home');
      }, 700);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'PIN बदलने में विफल। पुनः प्रयास करें');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Top Scenic Header */}
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
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← वापस जाएं (Back)</Text>
        </TouchableOpacity>

        {/* Title & Subtitle */}
        <Text style={styles.mainTitle}>{t('resetPinTitle') || 'नया सुरक्षा PIN सेट करें'}</Text>
        <Text style={styles.subtitle}>
          {t('resetPinSubtitle') || 'अपने खाते के लिए नया 4-अंकीय MPIN बनाएं'}
        </Text>

        {/* Phone badge */}
        <View style={styles.phoneBadge}>
          <Text style={styles.phoneBadgeText}>
            🔒 मोबाइल: +91 {phone} (सत्यापित)
          </Text>
        </View>

        {/* 1. New PIN Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('newPinLabel') || 'नया 4-अंकीय PIN'}</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder={t('newPinPlaceholder') || '4 अंकों का नया पिन'}
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              value={newPin}
              onChangeText={(txt) => {
                setNewPin(txt);
                if (errorMsg) setErrorMsg('');
              }}
              autoFocus
            />
          </View>
        </View>

        {/* 2. Confirm PIN Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {t('confirmPinLabel') || 'नया PIN दोबारा दर्ज करें'}
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder={t('confirmPinPlaceholder') || 'वही 4 अंकों का पिन दोबारा डालें'}
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              value={confirmPin}
              onChangeText={(txt) => {
                setConfirmPin(txt);
                if (errorMsg) setErrorMsg('');
              }}
            />
          </View>
        </View>

        {/* Success Message */}
        {successMsg ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✅ {successMsg}</Text>
          </View>
        ) : null}

        {/* Error Message */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {/* Action Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleResetPin}
          disabled={loading}
          style={[styles.actionButton, loading && styles.actionButtonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.actionButtonText}>
              {t('resetPinBtn') || 'नया PIN सहेजें और लॉगिन करें →'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFDF9',
  },
  headerContainer: {
    width: '100%',
    height: isTablet ? 250 : 200,
    backgroundColor: '#EAF8EE',
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  mainTitle: {
    fontSize: isTablet ? 26 : 22,
    fontWeight: '800',
    color: '#0A2E14',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  phoneBadge: {
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  phoneBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 4,
  },
  actionButton: {
    backgroundColor: '#0F5132',
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#0F5132',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  successText: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '700',
  },
});

