import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChakki } from '../context/ChakkiContext';
import { AuthApiService } from '../services/authApiService';
import { SpeechService } from '../services/speechService';

// ==========================================
// 1. CLEAN BLACK OUTLINE VECTOR ICONS
// Matching Reference Screenshot Exactly
// ==========================================

// Back Arrow (←)
const BackArrowIcon = ({ size = 22, color = '#000000' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center' }}>
    <View
      style={{
        width: 14,
        height: 2.2,
        backgroundColor: color,
        borderRadius: 1,
      }}
    />
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 6,
        width: 8,
        height: 8,
        borderLeftWidth: 2.2,
        borderTopWidth: 2.2,
        borderColor: color,
        transform: [{ rotate: '-45deg' }],
      }}
    />
  </View>
);

// Chevron Right (>)
const ChevronRight = ({ color = '#9CA3AF' }) => (
  <Text style={{ fontSize: 17, color, fontWeight: '400', marginLeft: 6 }}>›</Text>
);

// 1. Account / Profile Icon (👤 in circle outline)
const AccountOutlineIcon = ({ size = 24, color = '#111827' }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 1.8,
      borderColor: color,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}
  >
    {/* Head */}
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 1.6,
        borderColor: color,
        marginBottom: 1,
      }}
    />
    {/* Shoulders */}
    <View
      style={{
        width: 15,
        height: 7,
        borderTopLeftRadius: 7.5,
        borderTopRightRadius: 7.5,
        borderWidth: 1.6,
        borderColor: color,
        borderBottomWidth: 0,
      }}
    />
  </View>
);

// 2. Milling Rates Icon (🏷️ price tag outline)
const PriceTagOutlineIcon = ({ size = 24, color = '#111827' }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        width: 17,
        height: 19,
        borderWidth: 1.8,
        borderColor: color,
        borderRadius: 3,
        transform: [{ rotate: '45deg' }],
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 2,
      }}
    >
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
    </View>
  </View>
);

// 3. Microphone Outline Icon (🎙️)
const MicOutlineIcon = ({ size = 24, color = '#111827' }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        width: 9,
        height: 13,
        borderRadius: 4.5,
        borderWidth: 1.8,
        borderColor: color,
      }}
    />
    <View
      style={{
        width: 15,
        height: 7,
        borderBottomLeftRadius: 7.5,
        borderBottomRightRadius: 7.5,
        borderWidth: 1.8,
        borderTopWidth: 0,
        borderColor: color,
        marginTop: -3,
      }}
    />
    <View style={{ width: 1.8, height: 4, backgroundColor: color }} />
    <View style={{ width: 9, height: 1.8, backgroundColor: color }} />
  </View>
);

// 4. Shield Lock Outline Icon (🛡️)
const ShieldLockOutlineIcon = ({ size = 24, color = '#111827' }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        width: 17,
        height: 20,
        borderWidth: 1.8,
        borderColor: color,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          borderWidth: 1.5,
          borderColor: color,
        }}
      />
      <View style={{ width: 1.8, height: 3.5, backgroundColor: color, marginTop: -1 }} />
    </View>
  </View>
);

// 5. Rupee Note Outline Icon (₹)
const RupeeNoteOutlineIcon = ({ size = 24, color = '#111827' }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        width: 22,
        height: 15,
        borderWidth: 1.8,
        borderColor: color,
        borderRadius: 2.5,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: '900', color, marginTop: -1 }}>₹</Text>
    </View>
  </View>
);
const RupeeNoteIcon = RupeeNoteOutlineIcon;

// 6. Star Badge Outline Icon (⭐ / rosette)
const StarBadgeOutlineIcon = ({ size = 24, color = '#111827' }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        width: 18,
        height: 18,
        borderWidth: 1.8,
        borderColor: color,
        borderRadius: 5,
        transform: [{ rotate: '45deg' }],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          borderWidth: 1.4,
          borderColor: color,
        }}
      />
    </View>
  </View>
);

// 7. SMS Outline Icon (💬 with SMS text)
const SmsOutlineIcon = ({ size = 24, color = '#111827' }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        width: 22,
        height: 15,
        borderWidth: 1.8,
        borderColor: color,
        borderRadius: 3.5,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 8, fontWeight: '900', color, letterSpacing: -0.2 }}>SMS</Text>
    </View>
  </View>
);

// 8. Globe Outline Icon (🌐)
const GlobeOutlineIcon = ({ size = 24, color = '#111827' }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        width: 19,
        height: 19,
        borderRadius: 9.5,
        borderWidth: 1.8,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 9,
          height: 19,
          borderRadius: 4.5,
          borderWidth: 1.4,
          borderColor: color,
          borderTopWidth: 0,
          borderBottomWidth: 0,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 19,
          height: 1.4,
          backgroundColor: color,
        }}
      />
    </View>
  </View>
);

// 9. Share Nodes Outline Icon (🔗)
const ShareOutlineIcon = ({ size = 24, color = '#111827' }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 18, height: 16 }}>
      {/* 3 nodes */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 6,
          width: 5,
          height: 5,
          borderRadius: 2.5,
          borderWidth: 1.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: 5,
          height: 5,
          borderRadius: 2.5,
          borderWidth: 1.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 5,
          height: 5,
          borderRadius: 2.5,
          borderWidth: 1.5,
          borderColor: color,
        }}
      />
      {/* connecting lines */}
      <View
        style={{
          position: 'absolute',
          left: 4,
          top: 5,
          width: 10,
          height: 1.5,
          backgroundColor: color,
          transform: [{ rotate: '-25deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 4,
          bottom: 5,
          width: 10,
          height: 1.5,
          backgroundColor: color,
          transform: [{ rotate: '25deg' }],
        }}
      />
    </View>
  </View>
);

// 10. Star Outline Icon (☆)
const StarOutlineIcon = ({ size = 24, color = '#111827' }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 20, color, fontWeight: '300', marginTop: -2 }}>☆</Text>
  </View>
);

// 11. Info Circle Outline Icon (ⓘ)
const InfoOutlineIcon = ({ size = 24, color = '#111827' }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1.8,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '800', color, marginTop: -1 }}>i</Text>
    </View>
  </View>
);

// ==========================================
// 2. MAIN SETTINGS AND ACTIVITY COMPONENT
// ==========================================

export const SettingsActivityScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topSafePadding = Math.max(insets.top || 0, 36) + 4;

  const { currentUser, logoutUser, language, setLanguage, rates, updateUserProfile, t } = useChakki();

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Active modal sheets for clicked rows
  const [activeModal, setActiveModal] = useState(null); // 'RATES' | 'VOICE' | 'SECURITY' | 'PREMIUM' | 'SMS' | 'LANGUAGE' | 'ABOUT'

  // Editable Rates State
  const [wheatRate, setWheatRate] = useState(String(rates?.wheatPisaiPerKg || '3.5'));
  const [oilRate, setOilRate] = useState(String(rates?.oilExtractionPerKg || '15'));
  const [masalaRate, setMasalaRate] = useState(String(rates?.masalaGrindingPerKg || '20'));
  const [darraRate, setDarraRate] = useState(String(rates?.darraPisaiPerKg || '4'));
  const [matarBesanRate, setMatarBesanRate] = useState(String(rates?.matarBesanPerKg || '6'));
  const [chanaBesanRate, setChanaBesanRate] = useState(String(rates?.chanaBesanPerKg || '7'));
  const [dhaniyaRate, setDhaniyaRate] = useState(String(rates?.dhaniyaPerKg || '20'));
  const [makkaAataRate, setMakkaAataRate] = useState(String(rates?.makkaAataPerKg || '4.5'));
  const [chawalRate, setChawalRate] = useState(String(rates?.chawalPerKg || '4'));

  useEffect(() => {
    if (rates) {
      if (rates.wheatPisaiPerKg !== undefined) setWheatRate(String(rates.wheatPisaiPerKg));
      if (rates.oilExtractionPerKg !== undefined) setOilRate(String(rates.oilExtractionPerKg));
      if (rates.masalaGrindingPerKg !== undefined) setMasalaRate(String(rates.masalaGrindingPerKg));
      if (rates.darraPisaiPerKg !== undefined) setDarraRate(String(rates.darraPisaiPerKg));
      if (rates.matarBesanPerKg !== undefined) setMatarBesanRate(String(rates.matarBesanPerKg));
      if (rates.chanaBesanPerKg !== undefined) setChanaBesanRate(String(rates.chanaBesanPerKg));
      if (rates.dhaniyaPerKg !== undefined) setDhaniyaRate(String(rates.dhaniyaPerKg));
      if (rates.makkaAataPerKg !== undefined) setMakkaAataRate(String(rates.makkaAataPerKg));
      if (rates.chawalPerKg !== undefined) setChawalRate(String(rates.chawalPerKg));
    }
  }, [rates]);

  // Voice State
  const [voiceAlertsOn, setVoiceAlertsOn] = useState(true);

  // Security MPIN State (2-step: 'OLD_PIN' -> 'NEW_PIN')
  const [pinStep, setPinStep] = useState('OLD_PIN'); // 'OLD_PIN' | 'NEW_PIN'
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');

  // Determine user login state
  const isLoggedIn = Boolean(currentUser && (currentUser.phone || currentUser.profile?.ownerName));
  const ownerDisplayName = currentUser?.profile?.ownerName || 'Pushpendra Maurya';
  const ownerPhone = currentUser?.phone || '';
  const profileSubtitle = ownerPhone
    ? `+91 ${ownerPhone} • ${t('menuProfileSub')}`
    : t('menuProfileSub');

  // Real-time filtering definition (dynamically translated based on language)
  const allMenuItems = [
    {
      id: 'profile',
      section: 'account',
      title: t('menuProfile'),
      subtitle: profileSubtitle,
      icon: AccountOutlineIcon,
      action: () => navigation.navigate('Profile'),
      keywords: 'profile owner name business credentials pushpendra maurya chakki account malik phone mobile',
    },
    {
      id: 'rates',
      section: 'milling',
      title: t('menuRates'),
      subtitle: t('menuRatesSub'),
      icon: PriceTagOutlineIcon,
      action: () => setActiveModal('RATES'),
      keywords: 'rates pricing wheat pisai mustard oil masala per kg rate bhav kimat daam dar',
    },
    {
      id: 'voice',
      section: 'milling',
      title: t('menuVoice'),
      subtitle: t('menuVoiceSub'),
      icon: MicOutlineIcon,
      action: () => setActiveModal('VOICE'),
      keywords: 'voice audio sound soundbox mic speech alerts announcement bolkar awaz',
    },
    {
      id: 'security',
      section: 'milling',
      title: t('menuSecurity'),
      subtitle: t('menuSecuritySub'),
      icon: ShieldLockOutlineIcon,
      action: () => {
        setPinStep('OLD_PIN');
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
        setPinError('');
        setPinLoading(false);
        setActiveModal('SECURITY');
      },
      keywords: 'security app pin mpin password lock privacy suraksha',
    },
    {
      id: 'khata',
      section: 'milling',
      title: t('menuKhata'),
      subtitle: t('menuKhataSub'),
      icon: RupeeNoteOutlineIcon,
      action: () => navigation.navigate('GrahakKhata'),
      keywords: 'transactions khata balance ledger bahikhata payment udhari hisaab',
    },
    {
      id: 'premium',
      section: 'subscriptions',
      title: t('menuPremium'),
      subtitle: t('menuPremiumSub'),
      rightText: t('notActiveBadge'),
      icon: StarBadgeOutlineIcon,
      action: () => setActiveModal('PREMIUM'),
      keywords: 'chakki premium subscription vip cloud backup plan membership',
    },
    {
      id: 'sms',
      section: 'subscriptions',
      title: t('menuSms'),
      subtitle: t('menuSmsSub'),
      rightText: t('activeBadge'),
      rightTextColor: '#16A34A',
      icon: SmsOutlineIcon,
      action: () => setActiveModal('SMS'),
      keywords: 'sms alerts package message recharge balance credits customer update',
    },
    {
      id: 'language',
      section: 'support',
      title: t('menuLanguage'),
      rightText: language === 'hi' ? 'हिंदी (Hindi)' : 'English (अंग्रेजी)',
      icon: GlobeOutlineIcon,
      action: () => setActiveModal('LANGUAGE'),
      keywords: 'language bhasha hindi english bhashayein angreji',
    },
    {
      id: 'share',
      section: 'support',
      title: t('menuShare'),
      subtitle: t('menuShareSub'),
      icon: ShareOutlineIcon,
      action: () => handleShareApp(),
      keywords: 'share app invite whatsapp dost link bheje',
    },
    {
      id: 'rate_app',
      section: 'support',
      title: t('menuRateApp'),
      subtitle: t('menuRateAppSub'),
      icon: StarOutlineIcon,
      action: () => navigation.navigate('RateApp'),
      keywords: 'rate app star review play store feedback rating',
    },
    {
      id: 'about',
      section: 'support',
      title: t('menuAbout'),
      subtitle: t('menuAboutSub'),
      icon: InfoOutlineIcon,
      action: () => navigation.navigate('AboutFounder'),
      keywords: 'about info version chakki smart ai kisan sathi bare me jankari founder anish maurya ashutosh mishra',
    },
  ];

  // Search filter
  const filteredItems = (() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allMenuItems;
    return allMenuItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.keywords.includes(q)
    );
  })();

  // Handle Share App
  const handleShareApp = async () => {
    try {
      Haptics.selectionAsync();
      await Share.share({
        message:
          '🌾 *चक्की स्मार्ट AI (Kisan Sathi)* - आटा चक्की व मिल के लिए भारत का नंबर 1 ग्राहक व बही-खाता ऐप!\nडाउनलोड करें: https://github.com/pushpendramaurya496-lgtm/Smart-kisan-',
      });
    } catch (e) {}
  };

  // Handle Rate App
  const handleRateApp = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      language === 'hi' ? '⭐ ऐप रेटिंग' : '⭐ Rate App',
      language === 'hi'
        ? 'चक्की स्मार्ट AI का उपयोग करने के लिए धन्यवाद! आपकी 5-स्टार रेटिंग हमें और बेहतर सुविधाएँ लाने में मदद करती है।'
        : 'Thank you for using Chakki Smart AI! Your 5-star rating helps us bring even better features.'
    );
  };

  // Handle Save Rates
  const handleSaveRates = async () => {
    const w = parseFloat(wheatRate) || 3.5;
    const o = parseFloat(oilRate) || 15;
    const m = parseFloat(masalaRate) || 20;
    const d = parseFloat(darraRate) || 4;
    const mb = parseFloat(matarBesanRate) || 6;
    const cb = parseFloat(chanaBesanRate) || 7;
    const dh = parseFloat(dhaniyaRate) || 20;
    const ma = parseFloat(makkaAataRate) || 4.5;
    const ch = parseFloat(chawalRate) || 4;

    await updateUserProfile({
      defaultRates: {
        wheatPisaiPerKg: w,
        oilExtractionPerKg: o,
        masalaGrindingPerKg: m,
        darraPisaiPerKg: d,
        matarBesanPerKg: mb,
        chanaBesanPerKg: cb,
        dhaniyaPerKg: dh,
        makkaAataPerKg: ma,
        chawalPerKg: ch,
      },
    });

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    Alert.alert(t('ratesSavedTitle'), t('ratesSavedMsg'));
    setActiveModal(null);
  };

  // 1. Verify Old PIN (Step 1)
  const handleVerifyOldPin = async () => {
    const cleanOldPin = oldPin.trim().replace(/\D/g, '');
    if (cleanOldPin.length !== 4) {
      setPinError(t('oldPinLenErr'));
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
      return;
    }

    setPinError('');
    setPinLoading(true);

    try {
      const token = (await AsyncStorage.getItem('@chakki_token')) || currentUser?.token;
      if (!token) {
        throw new Error(t('sessionExpiredErr'));
      }
      await AuthApiService.verifyCurrentPin(token, cleanOldPin);
      setPinLoading(false);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      setPinStep('NEW_PIN');
    } catch (err) {
      setPinLoading(false);
      setPinError(err.message || t('oldPinWrongErr'));
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
    }
  };

  // 2. Save New PIN (Step 2)
  const handleSaveNewPin = async () => {
    const cleanNewPin = newPin.trim().replace(/\D/g, '');
    const cleanConfirmPin = confirmPin.trim().replace(/\D/g, '');

    if (cleanNewPin.length !== 4) {
      setPinError(t('pinLenErr'));
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
      return;
    }

    if (cleanNewPin !== cleanConfirmPin) {
      setPinError(t('pinMismatchErr'));
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
      return;
    }

    if (cleanNewPin === oldPin) {
      setPinError(language === 'hi' ? 'नया PIN पुराने PIN से अलग होना चाहिए' : 'New PIN must be different from old PIN');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
      return;
    }

    setPinError('');
    setPinLoading(true);

    try {
      const token = (await AsyncStorage.getItem('@chakki_token')) || currentUser?.token;
      if (!token) {
        throw new Error(t('sessionExpiredErr'));
      }
      await AuthApiService.changePin(token, oldPin, cleanNewPin);
      await updateUserProfile({ mpin: cleanNewPin });

      setPinLoading(false);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}

      Alert.alert(
        t('pinSavedTitle'),
        t('pinSavedSuccessMsg')
      );
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      setPinStep('OLD_PIN');
      setActiveModal(null);
    } catch (err) {
      setPinLoading(false);
      setPinError(err.message || (language === 'hi' ? 'PIN सुरक्षित करने में त्रुटि हुई' : 'Failed to save PIN'));
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
    }
  };

  // 3. Forgot Old PIN option
  const handleForgotOldPin = () => {
    setActiveModal(null);
    Alert.alert(
      language === 'hi' ? 'सुरक्षा PIN भूल गए?' : 'Forgot Security PIN?',
      language === 'hi'
        ? 'क्या आप अपने पंजीकृत मोबाइल नंबर पर OTP प्राप्त करके PIN रीसेट करना चाहते हैं?'
        : 'Do you want to reset your PIN via OTP on your registered mobile number?',
      [
        { text: language === 'hi' ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        {
          text: language === 'hi' ? 'OTP से बदलें' : 'Reset via OTP',
          onPress: () => {
            navigation.navigate('LoginPhone');
          },
        },
      ]
    );
  };

  // Handle Logout Confirmation (Requirement 7)
  const handleLogoutPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    Alert.alert(
      language === 'hi' ? 'लॉगआउट' : 'Logout',
      language === 'hi' ? 'क्या आप वाकई लॉगआउट करना चाहते हैं?' : 'Are you sure you want to logout?',
      [
        {
          text: language === 'hi' ? 'रद्द करें' : 'Cancel',
          style: 'cancel',
        },
        {
          text: language === 'hi' ? 'लॉगआउट' : 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutUser();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {}
            // Navigate to Login screen after clearing authenticated session securely
            navigation.replace('LoginPhone');
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Helper to render an item row
  const renderItemRow = (item) => {
    const IconCmp = item.icon;
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingRow}
        onPress={() => {
          try {
            Haptics.selectionAsync();
          } catch (e) {}
          item.action && item.action();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.iconCell}>
          <IconCmp size={22} color="#111827" />
        </View>

        <View style={styles.rowMiddleCol}>
          <Text style={styles.rowTitleText}>{item.title}</Text>
          {item.subtitle && <Text style={styles.rowSubtitleText}>{item.subtitle}</Text>}
        </View>

        <View style={styles.rowRightCol}>
          {item.rightText && (
            <Text
              style={[
                styles.rightBadgeText,
                item.rightTextColor ? { color: item.rightTextColor } : {},
              ]}
            >
              {item.rightText}
            </Text>
          )}
          <ChevronRight />
        </View>
      </TouchableOpacity>
    );
  };

  // Group filtered items by section
  const accountItems = filteredItems.filter((i) => i.section === 'account');
  const millingItems = filteredItems.filter((i) => i.section === 'milling');
  const subscriptionItems = filteredItems.filter((i) => i.section === 'subscriptions');
  const supportItems = filteredItems.filter((i) => i.section === 'support');

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* 1. HEADER (Pure White background, Back arrow, Title: Settings and activity) */}
      <View style={[styles.headerContainer, { paddingTop: topSafePadding }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <BackArrowIcon size={22} color="#000000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('settingsTitle')}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 2. SEARCH BAR (Light grey rounded search box) */}
        <View style={styles.searchBoxWrapper}>
          <Text style={styles.searchMagnifierIcon}>🔍</Text>
          <TextInput
            style={styles.searchTextInput}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <Text style={styles.clearSearchIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 3. YOUR ACCOUNT SECTION */}
        {accountItems.length > 0 && (
          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionHeading}>{t('sectionAccount')}</Text>
            {accountItems.map(renderItemRow)}
          </View>
        )}

        {/* GREY SECTION SEPARATOR */}
        {accountItems.length > 0 && <View style={styles.sectionDividerBand} />}

        {/* 4. MILLING AND FINANCE SECTION */}
        {millingItems.length > 0 && (
          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionHeading}>{t('sectionMilling')}</Text>
            {millingItems.map(renderItemRow)}
          </View>
        )}

        {/* GREY SECTION SEPARATOR */}
        {millingItems.length > 0 && <View style={styles.sectionDividerBand} />}

        {/* 5. SUBSCRIPTIONS SECTION */}
        {subscriptionItems.length > 0 && (
          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionHeading}>{t('sectionSubscriptions')}</Text>
            {subscriptionItems.map(renderItemRow)}
          </View>
        )}

        {/* GREY SECTION SEPARATOR */}
        {subscriptionItems.length > 0 && <View style={styles.sectionDividerBand} />}

        {/* 6. MORE INFO AND SUPPORT SECTION */}
        {supportItems.length > 0 && (
          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionHeading}>{t('sectionSupport')}</Text>
            {supportItems.map(renderItemRow)}
          </View>
        )}

        {/* GREY SECTION SEPARATOR */}
        <View style={styles.sectionDividerBand} />

        {/* 7. LOGIN AND LOGOUT SECTION (Requirement 7) */}
        <View style={styles.logoutSectionWrapper}>
          {isLoggedIn ? (
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogoutPress}
              activeOpacity={0.88}
            >
              <Text style={styles.logoutButtonIcon}>🚪</Text>
              <Text style={styles.logoutButtonText}>{t('logoutBtn')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('LoginPhone')}
              activeOpacity={0.88}
            >
              <Text style={styles.loginButtonText}>{t('loginBtn')}</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.appVersionFooter}>
            {t('appVersion')}
          </Text>
        </View>

        <View style={{ height: 36 }} />
      </ScrollView>

      {/* ======================================================== */}
      {/* INTERACTIVE MODALS FOR POP-UP ACTIONS                   */}
      {/* ======================================================== */}

      {/* MODAL 1: MILLING RATES PRICING */}
      <Modal
        visible={activeModal === 'RATES'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('ratesModalTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('ratesModalSub')}</Text>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Wheat Rate */}
              <Text style={styles.rateLabel}>{t('wheatRateLabel')}</Text>
              <View style={styles.rateInputRow}>
                <Text style={styles.rupeeTag}>₹</Text>
                <TextInput
                  style={styles.rateInputField}
                  keyboardType="numeric"
                  value={wheatRate}
                  onChangeText={setWheatRate}
                />
                <Text style={styles.unitTag}>{t('perKgUnit')}</Text>
              </View>

              {/* Darra Rate */}
              <Text style={styles.rateLabel}>{t('darraRateLabel')}</Text>
              <View style={styles.rateInputRow}>
                <Text style={styles.rupeeTag}>₹</Text>
                <TextInput
                  style={styles.rateInputField}
                  keyboardType="numeric"
                  value={darraRate}
                  onChangeText={setDarraRate}
                />
                <Text style={styles.unitTag}>{t('perKgUnit')}</Text>
              </View>

              {/* Matar Besan Rate */}
              <Text style={styles.rateLabel}>{t('matarBesanRateLabel')}</Text>
              <View style={styles.rateInputRow}>
                <Text style={styles.rupeeTag}>₹</Text>
                <TextInput
                  style={styles.rateInputField}
                  keyboardType="numeric"
                  value={matarBesanRate}
                  onChangeText={setMatarBesanRate}
                />
                <Text style={styles.unitTag}>{t('perKgUnit')}</Text>
              </View>

              {/* Chana Besan Rate */}
              <Text style={styles.rateLabel}>{t('chanaBesanRateLabel')}</Text>
              <View style={styles.rateInputRow}>
                <Text style={styles.rupeeTag}>₹</Text>
                <TextInput
                  style={styles.rateInputField}
                  keyboardType="numeric"
                  value={chanaBesanRate}
                  onChangeText={setChanaBesanRate}
                />
                <Text style={styles.unitTag}>{t('perKgUnit')}</Text>
              </View>

              {/* Dhaniya Rate */}
              <Text style={styles.rateLabel}>{t('dhaniyaRateLabel')}</Text>
              <View style={styles.rateInputRow}>
                <Text style={styles.rupeeTag}>₹</Text>
                <TextInput
                  style={styles.rateInputField}
                  keyboardType="numeric"
                  value={dhaniyaRate}
                  onChangeText={setDhaniyaRate}
                />
                <Text style={styles.unitTag}>{t('perKgUnit')}</Text>
              </View>

              {/* Makka Aata Rate */}
              <Text style={styles.rateLabel}>{t('makkaAataRateLabel')}</Text>
              <View style={styles.rateInputRow}>
                <Text style={styles.rupeeTag}>₹</Text>
                <TextInput
                  style={styles.rateInputField}
                  keyboardType="numeric"
                  value={makkaAataRate}
                  onChangeText={setMakkaAataRate}
                />
                <Text style={styles.unitTag}>{t('perKgUnit')}</Text>
              </View>

              {/* Chawal Rate */}
              <Text style={styles.rateLabel}>{t('chawalRateLabel')}</Text>
              <View style={styles.rateInputRow}>
                <Text style={styles.rupeeTag}>₹</Text>
                <TextInput
                  style={styles.rateInputField}
                  keyboardType="numeric"
                  value={chawalRate}
                  onChangeText={setChawalRate}
                />
                <Text style={styles.unitTag}>{t('perKgUnit')}</Text>
              </View>

              {/* Oil Rate */}
              <Text style={styles.rateLabel}>{t('oilRateLabel')}</Text>
              <View style={styles.rateInputRow}>
                <Text style={styles.rupeeTag}>₹</Text>
                <TextInput
                  style={styles.rateInputField}
                  keyboardType="numeric"
                  value={oilRate}
                  onChangeText={setOilRate}
                />
                <Text style={styles.unitTag}>{t('perKgUnit')}</Text>
              </View>

              {/* Masala Rate */}
              <Text style={styles.rateLabel}>{t('masalaRateLabel')}</Text>
              <View style={styles.rateInputRow}>
                <Text style={styles.rupeeTag}>₹</Text>
                <TextInput
                  style={styles.rateInputField}
                  keyboardType="numeric"
                  value={masalaRate}
                  onChangeText={setMasalaRate}
                />
                <Text style={styles.unitTag}>{t('perKgUnit')}</Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveRateBtn} onPress={handleSaveRates}>
              <Text style={styles.saveRateBtnText}>{t('saveRatesBtn')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL 2: VOICE AND AUDIO SETTINGS */}
      <Modal
        visible={activeModal === 'VOICE'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlayCenter}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <View style={styles.modalCardCenter}>
            <Text style={styles.modalTitle}>{t('voiceModalTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('voiceModalSub')}</Text>

            <View style={styles.voiceToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.voiceToggleLabel}>
                  {language === 'hi' ? 'आवाज से भुगतान अलर्ट' : 'Voice Payment Alerts'}
                </Text>
                <Text style={styles.voiceToggleSub}>
                  {language === 'hi' ? 'नकद या उधार पर आवाज में बोलना' : 'Voice announcements on cash or credit'}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.togglePill,
                  voiceAlertsOn ? styles.togglePillOn : styles.togglePillOff,
                ]}
                onPress={() => setVoiceAlertsOn(!voiceAlertsOn)}
              >
                <Text style={styles.togglePillText}>
                  {voiceAlertsOn ? (language === 'hi' ? 'चालू' : 'ON') : (language === 'hi' ? 'बंद' : 'OFF')}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.testVoiceBtn}
              onPress={() => SpeechService.speak(language === 'hi' ? 'रामलाल से 100 रुपये नकद प्राप्त हुए।' : 'Received 100 rupees cash from Ramlal.')}
            >
              <Text style={styles.testVoiceBtnText}>{t('testSoundBtn')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalCloseBtnText}>{t('closeBtn')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL 3: SECURITY AND APP */}
      <Modal
        visible={activeModal === 'SECURITY'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('securityModalTitle')}</Text>
            <Text style={styles.modalSubtitle}>
              {pinStep === 'OLD_PIN'
                ? (language === 'hi' ? 'सुरक्षा PIN बदलें (स्टेप 1: पुराना PIN सत्यापन)' : 'Change Security PIN (Step 1: Old PIN)')
                : (language === 'hi' ? 'नया सुरक्षा PIN सेट करें (स्टेप 2)' : 'Set New Security PIN (Step 2)')}
            </Text>

            {/* Error Message Banner */}
            {pinError ? (
              <View style={styles.pinErrorBanner}>
                <Text style={styles.pinErrorText}>⚠️ {pinError}</Text>
              </View>
            ) : null}

            {pinStep === 'OLD_PIN' ? (
              /* ================= STEP 1: VERIFY OLD PIN ================= */
              <View>
                <View style={styles.pinStepBadgeRow}>
                  <View style={[styles.stepDot, styles.stepDotActive]} />
                  <Text style={styles.stepBadgeText}>
                    {language === 'hi' ? 'चरण 1 / 2 (पुराना PIN)' : 'Step 1 / 2 (Old PIN)'}
                  </Text>
                  <View style={[styles.stepDot, styles.stepDotInactive]} />
                </View>

                <Text style={styles.rateLabel}>{t('verifyOldPinStep')}</Text>
                <TextInput
                  style={[styles.pinInputField, pinError ? styles.pinInputFieldError : null]}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  placeholder="••••"
                  placeholderTextColor="#94A3B8"
                  value={oldPin}
                  onChangeText={(val) => {
                    setOldPin(val);
                    if (pinError) setPinError('');
                  }}
                  autoFocus
                />

                <TouchableOpacity
                  style={styles.forgotPinLink}
                  onPress={handleForgotOldPin}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPinLinkText}>
                    {language === 'hi' ? '🔑 पुराना PIN याद नहीं? OTP द्वारा बदलें' : '🔑 Forgot PIN? Reset via OTP'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveRateBtn, pinLoading && { opacity: 0.7 }]}
                  onPress={handleVerifyOldPin}
                  disabled={pinLoading}
                >
                  {pinLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveRateBtnText}>{t('verifyOldPinBtn')} ➔</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* ================= STEP 2: SET NEW PIN ================= */
              <View>
                <View style={styles.pinStepBadgeRow}>
                  <View style={[styles.stepDot, styles.stepDotDone]} />
                  <Text style={[styles.stepBadgeText, { color: '#059669' }]}>
                    {t('oldPinVerifiedBadge')}
                  </Text>
                  <View style={[styles.stepDot, styles.stepDotActive]} />
                </View>

                <Text style={styles.rateLabel}>{t('enterNewPinStep')}</Text>
                <TextInput
                  style={styles.pinInputField}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  placeholder="••••"
                  placeholderTextColor="#94A3B8"
                  value={newPin}
                  onChangeText={(val) => {
                    setNewPin(val);
                    if (pinError) setPinError('');
                  }}
                  autoFocus
                />

                <Text style={[styles.rateLabel, { marginTop: 12 }]}>
                  {t('confirmNewPinStep')}
                </Text>
                <TextInput
                  style={styles.pinInputField}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  placeholder="••••"
                  placeholderTextColor="#94A3B8"
                  value={confirmPin}
                  onChangeText={(val) => {
                    setConfirmPin(val);
                    if (pinError) setPinError('');
                  }}
                />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.saveRateBtn, { flex: 1, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' }]}
                    onPress={() => {
                      setPinStep('OLD_PIN');
                      setPinError('');
                    }}
                    disabled={pinLoading}
                  >
                    <Text style={[styles.saveRateBtnText, { color: '#475569' }]}>{t('backBtn')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveRateBtn, { flex: 2 }, pinLoading && { opacity: 0.7 }]}
                    onPress={handleSaveNewPin}
                    disabled={pinLoading}
                  >
                    {pinLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.saveRateBtnText}>{t('savePinBtn')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL 4: CHAKKI PREMIUM */}
      <Modal
        visible={activeModal === 'PREMIUM'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlayCenter}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <View style={styles.modalCardCenter}>
            <Text style={styles.modalTitle}>{t('premiumModalTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('premiumModalSub')}</Text>

            <View style={styles.planCard}>
              <Text style={styles.planBadge}>{t('currentPlanBadge')}</Text>
              <Text style={styles.planFeatureText}>{t('premiumF1')}</Text>
              <Text style={styles.planFeatureText}>{t('premiumF2')}</Text>
              <Text style={styles.planFeatureText}>{t('premiumF3')}</Text>
              <Text style={styles.planFeatureText}>{t('premiumF4')}</Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalCloseBtnText}>{t('okBtn')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL 5: SMS ALERTS PACKAGE */}
      <Modal
        visible={activeModal === 'SMS'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlayCenter}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <View style={styles.modalCardCenter}>
            <Text style={styles.modalTitle}>{t('smsModalTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('smsModalSub')}</Text>

            <View style={[styles.planCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
              <Text style={[styles.planBadge, { color: '#16A34A' }]}>
                {t('smsPackageStatus')}
              </Text>
              <Text style={styles.planFeatureText}>{t('smsRemainingCredits')}</Text>
              <Text style={styles.planFeatureText}>{t('smsF1')}</Text>
              <Text style={styles.planFeatureText}>{t('smsF2')}</Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalCloseBtnText}>{t('closeBtn')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL 6: LANGUAGE SELECTOR */}
      <Modal
        visible={activeModal === 'LANGUAGE'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlayCenter}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <View style={styles.modalCardCenter}>
            <Text style={styles.modalTitle}>{t('selectLanguageModalTitle')}</Text>

            <TouchableOpacity
              style={[styles.langOptionBtn, language === 'hi' && styles.langOptionActive]}
              onPress={() => {
                setLanguage('hi');
                setActiveModal(null);
              }}
            >
              <Text style={[styles.langText, language === 'hi' && styles.langTextActive]}>
                {t('langHindi')}
              </Text>
              {language === 'hi' && <Text style={styles.langCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langOptionBtn, language === 'en' && styles.langOptionActive]}
              onPress={() => {
                setLanguage('en');
                setActiveModal(null);
              }}
            >
              <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>
                {t('langEnglish')}
              </Text>
              {language === 'en' && <Text style={styles.langCheck}>✓</Text>}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL 7: ABOUT */}
      <Modal
        visible={activeModal === 'ABOUT'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlayCenter}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <View style={styles.modalCardCenter}>
            <Text style={styles.modalTitle}>{t('aboutModalTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('aboutModalSub')}</Text>

            <View style={{ marginVertical: 12 }}>
              <Text style={styles.aboutRow}>{t('aboutVersionRow')}</Text>
              <Text style={styles.aboutRow}>{t('aboutMillRow')} {currentUser?.profile?.chakkiName || 'Chakki Smart AI'}</Text>
              <Text style={styles.aboutRow}>{t('aboutOperatorRow')} {ownerDisplayName}</Text>
              <Text style={styles.aboutRow}>{t('aboutBackendRow')}</Text>
              <Text style={styles.aboutRow}>{t('aboutMadeInIndia')}</Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalCloseBtnText}>{t('closeBtn')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ==========================================
// 3. STYLESHEET (Clean Pure White Theme)
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure white background per reference
  },

  /* 1. Header Styles */
  headerContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    paddingVertical: 6,
    paddingRight: 16,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.2,
  },

  /* Scroll Content */
  scrollContent: {
    paddingBottom: 24,
  },

  /* 2. Search Bar */
  searchBoxWrapper: {
    backgroundColor: '#F1F3F5',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchMagnifierIcon: {
    fontSize: 15,
    marginRight: 10,
    color: '#8E8E93',
  },
  searchTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
  clearSearchIcon: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: 'bold',
  },

  /* Section Styling */
  sectionWrapper: {
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },

  /* Grey Section Separator Band (height: 7-8px) */
  sectionDividerBand: {
    height: 8,
    backgroundColor: '#F4F5F7',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EAECEF',
  },

  /* Individual Row */
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 52,
  },
  iconCell: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rowMiddleCol: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  rowTitleText: {
    fontSize: 15.5,
    fontWeight: '500',
    color: '#111827',
  },
  rowSubtitleText: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '400',
  },
  rowRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightBadgeText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '400',
  },

  /* 7. Logout Section */
  logoutSectionWrapper: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  logoutButton: {
    width: '100%',
    backgroundColor: '#DC2626', // Professional red per requirement
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoutButtonIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    marginRight: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#16A34A', // Green login button
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  appVersionFooter: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 14,
    fontWeight: '500',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: '90%',
    elevation: 10,
  },
  modalCardCenter: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    elevation: 8,
  },
  modalHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 18,
    textAlign: 'center',
  },

  /* Rates Modal */
  rateLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  rateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rupeeTag: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 6,
  },
  rateInputField: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 4,
  },
  unitTag: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  saveRateBtn: {
    backgroundColor: '#0F5132',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveRateBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },

  /* Voice Modal */
  voiceToggleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  voiceToggleLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  voiceToggleSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  togglePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  togglePillOn: {
    backgroundColor: '#DCFCE7',
  },
  togglePillOff: {
    backgroundColor: '#F1F5F9',
  },
  togglePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  testVoiceBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  testVoiceBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
  },
  modalCloseBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },

  /* PIN Modal */
  pinInputField: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 10,
    paddingVertical: 10,
    fontWeight: '900',
    color: '#0F172A',
  },
  pinInputFieldError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
  },
  pinErrorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  pinErrorText: {
    color: '#DC2626',
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  pinStepBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepDotActive: {
    backgroundColor: '#0F5132',
  },
  stepDotInactive: {
    backgroundColor: '#CBD5E1',
  },
  stepDotDone: {
    backgroundColor: '#059669',
  },
  stepBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F5132',
  },
  forgotPinLink: {
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  forgotPinLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0284C7',
    textDecorationLine: 'underline',
  },

  /* Plan Card */
  planCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  planBadge: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  planFeatureText: {
    fontSize: 13,
    color: '#475569',
    marginVertical: 3,
    fontWeight: '500',
  },

  /* Language Modal */
  langOptionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  langOptionActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  langText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  langTextActive: {
    color: '#15803D',
    fontWeight: '800',
  },
  langCheck: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },

  aboutRow: {
    fontSize: 13.5,
    color: '#334155',
    marginVertical: 3,
    fontWeight: '500',
  },
});

