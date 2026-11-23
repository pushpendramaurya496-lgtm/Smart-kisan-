import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { BottomDock } from '../components/BottomDock';
import { SpeechService } from '../services/speechService';

const { width } = Dimensions.get('window');

// ─── HIGH-DEFINITION ASSETS FROM EXACT REFERENCE ────────────────────────────
const logoMillingImg = require('../../assets/milling/milling_logo.png');
const calBtnImg = require('../../assets/milling/milling_cal_btn.png');
const iconUsersGreenImg = require('../../assets/milling/icon_users_green.png');
const iconCoinsGreenImg = require('../../assets/milling/icon_coins_green.png');
const iconCheckGreenImg = require('../../assets/milling/icon_check_green.png');

const iconMillingOilImg = require('../../assets/milling/icon_milling_oil.png');
const iconMillingHaldiImg = require('../../assets/milling/icon_milling_haldi.png');
const iconMillingDarraImg = require('../../assets/milling/icon_milling_darra.png');
const iconMillingAttaImg = require('../../assets/milling/icon_milling_atta.png');
const bottomWaveImg = require('../../assets/milling/milling_bottom_wave.png');

// ─── VECTOR MINI ICONS ──────────────────────────────────────────────────────
const HamburgerMenuIcon = () => (
  <View style={iconStyles.hamburgerContainer}>
    <View style={[iconStyles.hamburgerBar, { width: 18 }]} />
    <View style={[iconStyles.hamburgerBar, { width: 14 }]} />
    <View style={[iconStyles.hamburgerBar, { width: 18 }]} />
  </View>
);

const SearchMagnifierIcon = () => (
  <View style={iconStyles.searchIconWrapper}>
    <View style={iconStyles.searchCircle} />
    <View style={iconStyles.searchHandle} />
  </View>
);

const MicrophoneGreenIcon = () => (
  <View style={iconStyles.micContainer}>
    <View style={iconStyles.micCapsule} />
    <View style={iconStyles.micStand} />
    <View style={iconStyles.micBase} />
  </View>
);

// ─── MILLING DATA PRESETS ───────────────────────────────────────────────────
const MILLING_PRESETS = {
  today: {
    label: 'आज (Today)',
    dateStr: '23 नवंबर 2026',
    totalPisai: '485 KG',
    totalCustomers: '32',
    totalEarnings: '₹4,850',
    totalReceived: '₹4,500',
    details: [
      { id: 'oil', name: 'तेल पिराई', customers: '12 ग्राहक', weight: '150 KG', amount: '₹2,000', img: iconMillingOilImg },
      { id: 'haldi', name: 'हल्दी पिसाई', customers: '10 ग्राहक', weight: '100 KG', amount: '₹1,500', img: iconMillingHaldiImg },
      { id: 'darra', name: 'दर्रा पिसाई', customers: '10 ग्राहक', weight: '135 KG', amount: '₹1,350', img: iconMillingDarraImg },
      { id: 'atta', name: 'आटा पिसाई', customers: '8 ग्राहक', weight: '100 KG', amount: '₹1,000', img: iconMillingAttaImg },
    ],
  },
  yesterday: {
    label: 'कल (Yesterday)',
    dateStr: '22 नवंबर 2026',
    totalPisai: '420 KG',
    totalCustomers: '28',
    totalEarnings: '₹4,100',
    totalReceived: '₹3,900',
    details: [
      { id: 'oil', name: 'तेल पिराई', customers: '10 ग्राहक', weight: '130 KG', amount: '₹1,700', img: iconMillingOilImg },
      { id: 'haldi', name: 'हल्दी पिसाई', customers: '9 ग्राहक', weight: '90 KG', amount: '₹1,350', img: iconMillingHaldiImg },
      { id: 'darra', name: 'दर्रा पिसाई', customers: '8 ग्राहक', weight: '110 KG', amount: '₹1,100', img: iconMillingDarraImg },
      { id: 'atta', name: 'आटा पिसाई', customers: '7 ग्राहक', weight: '90 KG', amount: '₹950', img: iconMillingAttaImg },
    ],
  },
  week: {
    label: 'इस हफ्ते (This Week)',
    dateStr: '17 नवं - 23 नवं 2026',
    totalPisai: '3,240 KG',
    totalCustomers: '214',
    totalEarnings: '₹31,200',
    totalReceived: '₹29,050',
    details: [
      { id: 'oil', name: 'तेल पिराई', customers: '82 ग्राहक', weight: '1,050 KG', amount: '₹12,800', img: iconMillingOilImg },
      { id: 'haldi', name: 'हल्दी पिसाई', customers: '64 ग्राहक', weight: '720 KG', amount: '₹9,200', img: iconMillingHaldiImg },
      { id: 'darra', name: 'दर्रा पिसाई', customers: '38 ग्राहक', weight: '850 KG', amount: '₹5,400', img: iconMillingDarraImg },
      { id: 'atta', name: 'आटा पिसाई', customers: '30 ग्राहक', weight: '620 KG', amount: '₹3,800', img: iconMillingAttaImg },
    ],
  },
};

// ─── MAIN TODAY MILLING DASHBOARD SCREEN ─────────────────────────────────────
export const TodayMillingDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topSafePadding = Math.max(insets.top || 0, 42);

  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  const currentData = MILLING_PRESETS[selectedPeriod] || MILLING_PRESETS.today;

  // Filter details based on search query
  const filteredDetails = currentData.details.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.customers.toLowerCase().includes(q);
  });

  const handleVoiceSearch = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    SpeechService.speak('नाम या गाँव का नाम बोलें...');
  };

  const handleTabPress = (tabId) => {
    if (tabId === 'home') navigation.navigate('Home');
    else if (tabId === 'khata') navigation.navigate('GrahakKhata');
    else if (tabId === 'bill') navigation.navigate('BillPrint', { customerId: 'c1' });
    else if (tabId === 'settings') navigation.navigate('Settings');
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Main Layout Area */}
      <View style={[styles.mainLayout, { paddingTop: topSafePadding }]}>

        {/* ── 1. HEADER (Exact Reference Design) ── */}
        <View style={styles.headerRow}>
          {/* Left: Hamburger Menu Icon */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={styles.hamburgerButton}
            accessibilityLabel="वापस जाएं"
          >
            <HamburgerMenuIcon />
          </TouchableOpacity>

          {/* Center: Medallion Logo + Title + Subtitle */}
          <View style={styles.headerCenter}>
            <Image
              source={logoMillingImg}
              style={styles.headerLogoImg}
              resizeMode="contain"
            />
            <View style={styles.headerTitleColumn}>
              <Text style={styles.headerMainTitle}>Today Milling</Text>
              <Text style={styles.headerSubtitle}>आज की पिसाई का पूरा हिसाब</Text>
            </View>
          </View>

          {/* Right: Calendar Icon Button */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setCalendarModalVisible(true)}
            style={styles.calendarButton}
            accessibilityLabel="तारीख चुनें"
          >
            <Image
              source={calBtnImg}
              style={styles.calendarBtnImg}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── 2. SEARCH BAR (With Magnifier and Green Microphone) ── */}
          <View style={styles.searchBarContainer}>
            <SearchMagnifierIcon />
            <TextInput
              style={styles.searchInput}
              placeholder="नाम या गाँव खोजें..."
              placeholderTextColor="#778294"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleVoiceSearch}
              style={styles.micButton}
              accessibilityLabel="वॉइस सर्च"
            >
              <MicrophoneGreenIcon />
            </TouchableOpacity>
          </View>

          {/* ── 3. SUMMARY CARDS (2x2 Grid) ── */}
          <View style={styles.summaryGrid}>
            {/* Row 1 */}
            <View style={styles.summaryRow}>
              {/* Card 1: आज की कुल पिसाई (Mint Green Background) */}
              <View style={[styles.summaryCard, styles.cardMintBg]}>
                <Text style={styles.cardLabelMint}>आज की कुल पिसाई</Text>
                <Text style={styles.cardValueLarge}>{currentData.totalPisai}</Text>
              </View>

              {/* Card 2: कुल ग्राहक (Light Grey Background with Green Users Icon) */}
              <View style={[styles.summaryCard, styles.cardGreyBg]}>
                <View style={styles.cardTextCol}>
                  <Text style={styles.cardLabelGrey}>कुल ग्राहक</Text>
                  <Text style={styles.cardValueLarge}>{currentData.totalCustomers}</Text>
                </View>
                <Image
                  source={iconUsersGreenImg}
                  style={styles.cardUsersIcon}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Row 2 */}
            <View style={styles.summaryRow}>
              {/* Card 3: कुल कमाई (Light Grey Background with Green Coins Icon) */}
              <View style={[styles.summaryCard, styles.cardGreyBg]}>
                <Image
                  source={iconCoinsGreenImg}
                  style={styles.cardCoinsIcon}
                  resizeMode="contain"
                />
                <View style={[styles.cardTextCol, { marginLeft: 10 }]}>
                  <Text style={styles.cardLabelGrey}>कुल कमाई</Text>
                  <Text style={styles.cardValueSemiBold}>{currentData.totalEarnings}</Text>
                </View>
              </View>

              {/* Card 4: कुल प्राप्त पैसा (Mint Green Background with Green Check Icon) */}
              <View style={[styles.summaryCard, styles.cardMintBg]}>
                <Image
                  source={iconCheckGreenImg}
                  style={styles.cardCheckIcon}
                  resizeMode="contain"
                />
                <View style={[styles.cardTextCol, { marginLeft: 10 }]}>
                  <Text style={styles.cardLabelGrey}>कुल प्राप्त पैसा</Text>
                  <Text style={styles.cardValueSemiBold}>{currentData.totalReceived}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── 4. MILLING DETAILS SECTION ("पिसाई का विवरण") ── */}
          <View style={styles.detailsSectionHeader}>
            <View style={styles.greenAccentBar} />
            <Text style={styles.detailsSectionTitle}>पिसाई का विवरण</Text>
          </View>

          {/* 4 Horizontal Detail Cards */}
          <View style={styles.detailsCardsList}>
            {filteredDetails.map((item) => (
              <View key={item.id} style={styles.millingDetailCard}>
                {/* Category Icon */}
                <Image
                  source={item.img}
                  style={styles.millingCategoryImg}
                  resizeMode="contain"
                />

                {/* Name & Customer Count */}
                <View style={styles.millingNameCol}>
                  <Text style={styles.millingNameText}>{item.name}</Text>
                  <Text style={styles.millingCustText}>{item.customers}</Text>
                </View>

                {/* Thin Vertical Divider */}
                <View style={styles.verticalDivider} />

                {/* Quantity in KG */}
                <View style={styles.millingWeightCol}>
                  <Text style={styles.millingWeightText}>{item.weight}</Text>
                </View>

                {/* Amount on Right */}
                <Text style={styles.millingAmountText}>{item.amount}</Text>
              </View>
            ))}
          </View>

          {/* ── 5. CAROUSEL DOTS INDICATOR & BOTTOM WAVE ACCENT ── */}
          <View style={styles.dotsIndicatorRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          {/* Decorative Bottom Wave */}
          <View style={styles.waveFooterWrapper}>
            <Image
              source={bottomWaveImg}
              style={styles.bottomWaveImg}
              resizeMode="stretch"
            />
          </View>

          {/* Bottom spacing before bottom dock */}
          <View style={{ height: 16 }} />
        </ScrollView>

        {/* ── 6. BOTTOM NAVIGATION DOCK (Home | Customer | Bill | Settings) ── */}
        <BottomDock activeTab="home" onTabPress={handleTabPress} />
      </View>

      {/* ── CALENDAR DATE PICKER MODAL ── */}
      <Modal
        visible={calendarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setCalendarModalVisible(false)}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>📅 तारीख व अवधि चुनें</Text>
              <TouchableOpacity onPress={() => setCalendarModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Date Presets */}
            {Object.keys(MILLING_PRESETS).map((key) => {
              const preset = MILLING_PRESETS[key];
              const isSelected = selectedPeriod === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.presetRow, isSelected && styles.presetRowSelected]}
                  onPress={() => {
                    setSelectedPeriod(key);
                    setCalendarModalVisible(false);
                  }}
                >
                  <Text style={[styles.presetLabel, isSelected && styles.presetLabelSelected]}>
                    {preset.label}
                  </Text>
                  <Text style={styles.presetDate}>{preset.dateStr}</Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setCalendarModalVisible(false)}
            >
              <Text style={styles.modalDoneButtonText}>चुनें (Select)</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ─── STYLESHEET ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure White (#FFFFFF)
  },
  mainLayout: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },

  // 1. Header Styles
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  hamburgerButton: {
    width: 38,
    height: 38,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoImg: {
    width: 44,
    height: 44,
    marginRight: 10,
  },
  headerTitleColumn: {
    justifyContent: 'center',
  },
  headerMainTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#14233B', // Primary text Dark Navy Blue
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#778294', // Secondary text Soft Grey
    marginTop: 1,
  },
  calendarButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarBtnImg: {
    width: 44,
    height: 44,
  },

  // 2. Search Bar Styles
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC', // Light grey background
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
    marginVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#14233B',
    paddingHorizontal: 10,
    height: '100%',
  },
  micButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 3. Summary Cards Styles (2x2 Grid)
  summaryGrid: {
    marginVertical: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardMintBg: {
    backgroundColor: '#EEF9EF', // Light Green background (#EEF9EF)
    borderColor: '#D4EED8',
  },
  cardGreyBg: {
    backgroundColor: '#FFFFFF', // Card background: White with very light grey borders
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTextCol: {
    flex: 1,
  },
  cardLabelMint: {
    fontSize: 13,
    fontWeight: '500',
    color: '#159B58', // Accent color Natural Green
    marginBottom: 4,
  },
  cardLabelGrey: {
    fontSize: 13,
    fontWeight: '500',
    color: '#778294', // Soft Grey
    marginBottom: 4,
  },
  cardValueLarge: {
    fontSize: 26,
    fontWeight: '700',
    color: '#14233B', // Dark Navy Blue
    letterSpacing: -0.5,
  },
  cardValueSemiBold: {
    fontSize: 21,
    fontWeight: '700',
    color: '#14233B',
    letterSpacing: -0.3,
  },
  cardUsersIcon: {
    width: 36,
    height: 30,
    marginLeft: 6,
  },
  cardCoinsIcon: {
    width: 34,
    height: 34,
  },
  cardCheckIcon: {
    width: 34,
    height: 34,
  },

  // 4. Milling Details Section Styles
  detailsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 12,
  },
  greenAccentBar: {
    width: 4,
    height: 18,
    backgroundColor: '#159B58', // Natural Green Accent
    borderRadius: 2,
    marginRight: 8,
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#14233B', // Dark Navy Blue
  },
  detailsCardsList: {
    marginBottom: 10,
  },
  millingDetailCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  millingCategoryImg: {
    width: 44,
    height: 44,
  },
  millingNameCol: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  millingNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#14233B',
    letterSpacing: -0.2,
  },
  millingCustText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#778294',
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  millingWeightCol: {
    width: 75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  millingWeightText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  millingAmountText: {
    width: 80,
    textAlign: 'right',
    fontSize: 18,
    fontWeight: '700',
    color: '#14233B',
  },

  // 5. Carousel Dots & Bottom Wave
  dotsIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 3.5,
  },
  dotActive: {
    width: 16,
    backgroundColor: '#159B58',
  },
  waveFooterWrapper: {
    width: '100%',
    height: 38,
    overflow: 'hidden',
    marginTop: 4,
  },
  bottomWaveImg: {
    width: '100%',
    height: '100%',
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#14233B',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#778294',
    padding: 4,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  presetRowSelected: {
    backgroundColor: '#EEF9EF',
    borderColor: '#159B58',
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14233B',
  },
  presetLabelSelected: {
    color: '#159B58',
    fontWeight: '700',
  },
  presetDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#778294',
  },
  modalDoneButton: {
    backgroundColor: '#159B58',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  modalDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

// ─── ICON STYLES ────────────────────────────────────────────────────────────
const iconStyles = StyleSheet.create({
  hamburgerContainer: {
    width: 22,
    height: 14,
    justifyContent: 'space-between',
  },
  hamburgerBar: {
    height: 2.4,
    backgroundColor: '#14233B',
    borderRadius: 2,
  },

  searchIconWrapper: {
    width: 20,
    height: 20,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCircle: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2,
    borderColor: '#778294',
  },
  searchHandle: {
    position: 'absolute',
    right: 1,
    bottom: 2,
    width: 5,
    height: 2,
    backgroundColor: '#778294',
    transform: [{ rotate: '45deg' }],
  },

  micContainer: {
    width: 18,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micCapsule: {
    width: 8,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#159B58',
  },
  micStand: {
    width: 12,
    height: 5,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: 1.6,
    borderColor: '#159B58',
    borderTopWidth: 0,
    marginTop: -2,
  },
  micBase: {
    width: 6,
    height: 1.8,
    backgroundColor: '#159B58',
    borderRadius: 1,
    marginTop: 1,
  },
});
export default TodayMillingDashboardScreen;

