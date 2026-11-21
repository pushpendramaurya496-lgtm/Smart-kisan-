import React, { useState, useEffect, useMemo } from 'react';
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

  const { currentUser, logoutUser, language, setLanguage, rates, updateUserProfile } = useChakki();

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Active modal sheets for clicked rows
  const [activeModal, setActiveModal] = useState(null); // 'RATES' | 'VOICE' | 'SECURITY' | 'PREMIUM' | 'SMS' | 'LANGUAGE' | 'ABOUT'

  // Editable Rates State
  const [wheatRate, setWheatRate] = useState(String(rates?.wheatPisaiPerKg || '3.5'));
  const [oilRate, setOilRate] = useState(String(rates?.oilExtractionPerKg || '15'));
  const [masalaRate, setMasalaRate] = useState(String(rates?.masalaGrindingPerKg || '20'));

  // Voice State
  const [voiceAlertsOn, setVoiceAlertsOn] = useState(true);

  // Security MPIN State
  const [newPin, setNewPin] = useState('');

  // Determine user login state
  const isLoggedIn = Boolean(currentUser && (currentUser.phone || currentUser.profile?.ownerName));
  const ownerDisplayName = currentUser?.profile?.ownerName || 'Pushpendra Maurya';

  // Real-time filtering definition
  const allMenuItems = [
    {
      id: 'profile',
      section: 'account',
      title: 'Chakki Owner Profile',
      subtitle: 'Personal details, business info, credentials, security',
      icon: AccountOutlineIcon,
      action: () => navigation.navigate('Profile'),
      keywords: 'profile owner name business credentials pushpendra maurya chakki account',
    },
    {
      id: 'rates',
      section: 'milling',
      title: 'Milling rates pricing',
      icon: PriceTagOutlineIcon,
      action: () => setActiveModal('RATES'),
      keywords: 'rates pricing wheat pisai mustard oil masala per kg rate bhav kimat daam',
    },
    {
      id: 'voice',
      section: 'milling',
      title: 'Voice and audio settings',
      icon: MicOutlineIcon,
      action: () => setActiveModal('VOICE'),
      keywords: 'voice audio sound soundbox mic speech alerts announcement bolkar',
    },
    {
      id: 'security',
      section: 'milling',
      title: 'Security and app',
      icon: ShieldLockOutlineIcon,
      action: () => setActiveModal('SECURITY'),
      keywords: 'security app pin mpin password lock privacy suraksha',
    },
    {
      id: 'khata',
      section: 'milling',
      title: 'Transactions & khata',
      icon: RupeeNoteIcon,
      action: () => navigation.navigate('GrahakKhata'),
      keywords: 'transactions khata balance ledger bahikhata payment udhari hisaab',
    },
    {
      id: 'premium',
      section: 'subscriptions',
      title: 'Chakki Premium',
      rightText: 'Not active',
      icon: StarBadgeOutlineIcon,
      action: () => setActiveModal('PREMIUM'),
      keywords: 'chakki premium subscription vip cloud backup plan membership',
    },
    {
      id: 'sms',
      section: 'subscriptions',
      title: 'SMS alerts package',
      rightText: 'Active',
      rightTextColor: '#16A34A',
      icon: SmsOutlineIcon,
      action: () => setActiveModal('SMS'),
      keywords: 'sms alerts package message recharge balance credits customer update',
    },
    {
      id: 'language',
      section: 'support',
      title: 'Language',
      rightText: language === 'hi' ? 'हिन्दी / English' : 'English / हिन्दी',
      icon: GlobeOutlineIcon,
      action: () => setActiveModal('LANGUAGE'),
      keywords: 'language bhasha hindi english bhashayein',
    },
    {
      id: 'share',
      section: 'support',
      title: 'Share app',
      icon: ShareOutlineIcon,
      action: () => handleShareApp(),
      keywords: 'share app invite whatsapp dost link',
    },
    {
      id: 'rate_app',
      section: 'support',
      title: 'Rate app',
      icon: StarOutlineIcon,
      action: () => handleRateApp(),
      keywords: 'rate app star review play store feedback',
    },
    {
      id: 'about',
      section: 'support',
      title: 'About',
      icon: InfoOutlineIcon,
      action: () => setActiveModal('ABOUT'),
      keywords: 'about info version chakki smart ai kisan sathi',
    },
  ];

  // Search filter
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allMenuItems;
    return allMenuItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.keywords.includes(q)
    );
  }, [searchQuery, allMenuItems]);

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
      '⭐ ऐप रेटिंग',
      'चक्की स्मार्ट AI का उपयोग करने के लिए धन्यवाद! आपकी 5-स्टार रेटिंग हमें और बेहतर सुविधाएँ लाने में मदद करती है।'
    );
  };

  // Handle Save Rates
  const handleSaveRates = async () => {
    const w = parseFloat(wheatRate) || 3.5;
    const o = parseFloat(oilRate) || 15;
    const m = parseFloat(masalaRate) || 20;

    await updateUserProfile({
      defaultRates: {
        wheatPisaiPerKg: w,
        oilExtractionPerKg: o,
        masalaGrindingPerKg: m,
      },
    });

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    Alert.alert('दरें अपडेट हुईं', `गेहूं: ₹${w}/kg, सरसों: ₹${o}/kg, मसाला: ₹${m}/kg`);
    setActiveModal(null);
  };

  // Handle Save PIN
  const handleSavePin = async () => {
    if (newPin.length !== 4) {
      Alert.alert('त्रुटि', 'कृपया 4 अंकों का सुरक्षा PIN दर्ज करें');
      return;
    }
    await updateUserProfile({ mpin: newPin });
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    Alert.alert('सुरक्षा PIN', 'नया 4-अंकीय MPIN सफलतापूर्वक सेट कर दिया गया है');
    setNewPin('');
    setActiveModal(null);
  };

  // Handle Logout Confirmation (Requirement 7)
  const handleLogoutPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
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

        <Text style={styles.headerTitle}>Settings and activity</Text>
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
            placeholder="Search"
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
            <Text style={styles.sectionHeading}>Your account</Text>
            {accountItems.map(renderItemRow)}
          </View>
        )}

        {/* GREY SECTION SEPARATOR */}
        {accountItems.length > 0 && <View style={styles.sectionDividerBand} />}

        {/* 4. MILLING AND FINANCE SECTION */}
        {millingItems.length > 0 && (
          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionHeading}>Milling and finance</Text>
            {millingItems.map(renderItemRow)}
          </View>
        )}

        {/* GREY SECTION SEPARATOR */}
        {millingItems.length > 0 && <View style={styles.sectionDividerBand} />}

        {/* 5. SUBSCRIPTIONS SECTION */}
        {subscriptionItems.length > 0 && (
          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionHeading}>Subscriptions</Text>
            {subscriptionItems.map(renderItemRow)}
          </View>
        )}

        {/* GREY SECTION SEPARATOR */}
        {subscriptionItems.length > 0 && <View style={styles.sectionDividerBand} />}

        {/* 6. MORE INFO AND SUPPORT SECTION */}
        {supportItems.length > 0 && (
          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionHeading}>More info and support</Text>
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
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('LoginPhone')}
              activeOpacity={0.88}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.appVersionFooter}>
            Chakki Smart AI • Version 1.2.0 (Build 42)
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
            <Text style={styles.modalTitle}>🏷️ Milling Rates Pricing</Text>
            <Text style={styles.modalSubtitle}>प्रति किलो पिसाई व पिराई दरें सेट करें</Text>

            {/* Wheat Rate */}
            <Text style={styles.rateLabel}>गेहूं पिसाई दर (₹ / kg):</Text>
            <View style={styles.rateInputRow}>
              <Text style={styles.rupeeTag}>₹</Text>
              <TextInput
                style={styles.rateInputField}
                keyboardType="numeric"
                value={wheatRate}
                onChangeText={setWheatRate}
              />
              <Text style={styles.unitTag}>/ kg</Text>
            </View>

            {/* Oil Rate */}
            <Text style={styles.rateLabel}>सरसों तेल पिराई दर (₹ / kg):</Text>
            <View style={styles.rateInputRow}>
              <Text style={styles.rupeeTag}>₹</Text>
              <TextInput
                style={styles.rateInputField}
                keyboardType="numeric"
                value={oilRate}
                onChangeText={setOilRate}
              />
              <Text style={styles.unitTag}>/ kg</Text>
            </View>

            {/* Masala Rate */}
            <Text style={styles.rateLabel}>मसाला पिसाई दर (₹ / kg):</Text>
            <View style={styles.rateInputRow}>
              <Text style={styles.rupeeTag}>₹</Text>
              <TextInput
                style={styles.rateInputField}
                keyboardType="numeric"
                value={masalaRate}
                onChangeText={setMasalaRate}
              />
              <Text style={styles.unitTag}>/ kg</Text>
            </View>

            <TouchableOpacity style={styles.saveRateBtn} onPress={handleSaveRates}>
              <Text style={styles.saveRateBtnText}>दरें सुरक्षित करें (Save Rates)</Text>
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
            <Text style={styles.modalTitle}>🎙️ Voice and Audio Settings</Text>
            <Text style={styles.modalSubtitle}>चक्की साउंड बॉक्स व आवाज अलर्ट</Text>

            <View style={styles.voiceToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.voiceToggleLabel}>आवाज से भुगतान अलर्ट</Text>
                <Text style={styles.voiceToggleSub}>नकद या उधार पर आवाज में बोलना</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.togglePill,
                  voiceAlertsOn ? styles.togglePillOn : styles.togglePillOff,
                ]}
                onPress={() => setVoiceAlertsOn(!voiceAlertsOn)}
              >
                <Text style={styles.togglePillText}>{voiceAlertsOn ? 'चालू' : 'बंद'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.testVoiceBtn}
              onPress={() => SpeechService.speak('रामलाल से 100 रुपये नकद प्राप्त हुए।')}
            >
              <Text style={styles.testVoiceBtnText}>🔊 आवाज चेक करें (Test Sound)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalCloseBtnText}>बंद करें</Text>
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
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>🛡️ Security & App MPIN</Text>
            <Text style={styles.modalSubtitle}>4-अंकीय सुरक्षा पिन सेट करें</Text>

            <Text style={styles.rateLabel}>नया 4-अंकीय PIN दर्ज करें:</Text>
            <TextInput
              style={styles.pinInputField}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              placeholder="••••"
              placeholderTextColor="#94A3B8"
              value={newPin}
              onChangeText={setNewPin}
            />

            <TouchableOpacity style={styles.saveRateBtn} onPress={handleSavePin}>
              <Text style={styles.saveRateBtnText}>PIN सुरक्षित करें (Save PIN)</Text>
            </TouchableOpacity>
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
            <Text style={styles.modalTitle}>⭐ Chakki Premium</Text>
            <Text style={styles.modalSubtitle}>स्मार्ट चक्की वीआईपी फीचर्स</Text>

            <View style={styles.planCard}>
              <Text style={styles.planBadge}>वर्तमान स्थिति: निःशुल्क (Free Plan)</Text>
              <Text style={styles.planFeatureText}>• असीमित ग्राहक बही-खाता</Text>
              <Text style={styles.planFeatureText}>• ऑटोमैटिक WhatsApp रसीद</Text>
              <Text style={styles.planFeatureText}>• AI वॉइस सर्च व साउंड अलर्ट</Text>
              <Text style={styles.planFeatureText}>• ब्लूटूथ थर्मल प्रिंटर सपोर्ट</Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalCloseBtnText}>ठीक है</Text>
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
            <Text style={styles.modalTitle}>💬 SMS Alerts Package</Text>
            <Text style={styles.modalSubtitle}>ग्राहकों को ऑटो SMS सूचना</Text>

            <View style={[styles.planCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
              <Text style={[styles.planBadge, { color: '#16A34A' }]}>
                पैकेज स्थिति: सक्रिय (Active)
              </Text>
              <Text style={styles.planFeatureText}>• शेष SMS क्रेडिट: 350 SMS</Text>
              <Text style={styles.planFeatureText}>• पिसाई तैयार होने पर ऑटो SMS</Text>
              <Text style={styles.planFeatureText}>• उधारी तकादा SMS अलर्ट</Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalCloseBtnText}>बंद करें</Text>
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
            <Text style={styles.modalTitle}>🌐 भाषा चुनें (Select Language)</Text>

            <TouchableOpacity
              style={[styles.langOptionBtn, language === 'hi' && styles.langOptionActive]}
              onPress={() => {
                setLanguage('hi');
                setActiveModal(null);
              }}
            >
              <Text style={[styles.langText, language === 'hi' && styles.langTextActive]}>
                हिंदी (Hindi)
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
                English (अंग्रेजी)
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
            <Text style={styles.modalTitle}>ℹ️ About Chakki Smart AI</Text>
            <Text style={styles.modalSubtitle}>किसान साथी • चक्की प्रबंधन प्रणाली</Text>

            <View style={{ marginVertical: 12 }}>
              <Text style={styles.aboutRow}>• ऐप वर्जन: 1.2.0 (Stable Release)</Text>
              <Text style={styles.aboutRow}>• चक्की: {currentUser?.profile?.chakkiName || 'Chakki Smart AI'}</Text>
              <Text style={styles.aboutRow}>• संचालक: {ownerDisplayName}</Text>
              <Text style={styles.aboutRow}>• बैकएंड: Node.js Express & MongoDB</Text>
              <Text style={styles.aboutRow}>• भारत में निर्मित 🇮🇳</Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalCloseBtnText}>बंद करें</Text>
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
