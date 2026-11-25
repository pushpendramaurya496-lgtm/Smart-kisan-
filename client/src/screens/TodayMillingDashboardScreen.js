import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { BottomDock } from '../components/BottomDock';
import { SpeechService } from '../services/speechService';
import { DashboardApiService } from '../services/dashboardApiService';
import { ChakkiCalendarModal } from '../components/ChakkiCalendarModal';
import { useChakki } from '../context/ChakkiContext';

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

// ─── EMPTY STATE TEMPLATE (REAL ZEROES DEFAULT) ─────────────────────────────
const EMPTY_MILLING = {
  label: 'आज (Today)',
  dateStr: 'आज की तारीख',
  totalPisai: '0 KG',
  totalCustomers: '0',
  totalEarnings: '₹0',
  totalReceived: '₹0',
  details: [
    { id: 'oil', name: 'तेल पिराई', customers: '0 ग्राहक', weight: '0 KG', amount: '₹0', img: iconMillingOilImg },
    { id: 'haldi', name: 'हल्दी पिसाई', customers: '0 ग्राहक', weight: '0 KG', amount: '₹0', img: iconMillingHaldiImg },
    { id: 'darra', name: 'दर्रा पिसाई', customers: '0 ग्राहक', weight: '0 KG', amount: '₹0', img: iconMillingDarraImg },
    { id: 'atta', name: 'आटा पिसाई', customers: '0 ग्राहक', weight: '0 KG', amount: '₹0', img: iconMillingAttaImg },
  ],
};

// ─── MAIN TODAY MILLING DASHBOARD SCREEN ─────────────────────────────────────
export const TodayMillingDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topSafePadding = Math.max(insets.top || 0, 42);
  const { stats, customers: contextCustomers } = useChakki();

  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [customDateIso, setCustomDateIso] = useState(null);
  const [customDateLabel, setCustomDateLabel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMillingData = useCallback(async (period = selectedPeriod, date = customDateIso) => {
    try {
      const data = await DashboardApiService.getMilling(period, date);
      if (data) {
        const detailsWithIcons = (data.details || []).map(d => {
          let img = iconMillingAttaImg;
          if (d.id === 'oil') img = iconMillingOilImg;
          else if (d.id === 'haldi') img = iconMillingHaldiImg;
          else if (d.id === 'darra') img = iconMillingDarraImg;
          return { ...d, img };
        });
        setLiveData({
          ...data,
          label: period === 'yesterday' ? 'कल (Yesterday)' : period === 'week' ? 'इस हफ्ते (This Week)' : 'आज (Today)',
          details: detailsWithIcons,
        });
      }
    } catch (err) {
      console.warn('Real milling fetch error:', err.message);
    }
  }, [selectedPeriod, customDateIso]);

  useEffect(() => {
    fetchMillingData(selectedPeriod, customDateIso);
  }, [selectedPeriod, customDateIso, fetchMillingData, stats?.todayPisaiKg, stats?.totalCustomers, stats?.todayEarnings, stats?.cashReceived, stats?.pendingDebt, (contextCustomers || []).length]);

  // Auto-reload on screen focus so new entries reflect immediately
  useEffect(() => {
    const unsub = navigation?.addListener ? navigation.addListener('focus', () => {
      fetchMillingData(selectedPeriod, customDateIso);
    }) : undefined;
    return unsub;
  }, [navigation, fetchMillingData, selectedPeriod, customDateIso]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMillingData(selectedPeriod, customDateIso);
    setRefreshing(false);
  };

  const handleSelectCalendarDate = (dateObj) => {
    if (dateObj.period === 'weekly') {
      setSelectedPeriod('week');
      setCustomDateLabel(null);
      setCustomDateIso(null);
    } else if (dateObj.period === 'monthly') {
      setSelectedPeriod('month');
      setCustomDateLabel(null);
      setCustomDateIso(null);
    } else {
      setSelectedPeriod('today');
      setCustomDateLabel(dateObj.dateFormatted);
      const y = dateObj.year;
      const m = String(dateObj.month + 1).padStart(2, '0');
      const d = String(dateObj.day).padStart(2, '0');
      setCustomDateIso(`${y}-${m}-${d}`);
    }
  };

  // ─── RESILIENT LOCAL FALLBACK (Only for TODAY's entries when API is offline) ───
  const dNow = new Date();
  const dayStr = String(dNow.getDate()).padStart(2, '0');
  const monthStr = String(dNow.getMonth() + 1).padStart(2, '0');
  const yearStr = dNow.getFullYear();
  const todayDateStr = `${dayStr}-${monthStr}-${yearStr}`;
  const startOfDayTs = new Date(dNow.getFullYear(), dNow.getMonth(), dNow.getDate()).getTime();

  const isEntryToday = (c) => {
    if (!c) return false;
    const lastDate = c.lastMilledDate || (c.history && c.history[0]?.date);
    if (lastDate && (lastDate === todayDateStr || lastDate === `${dNow.getDate()}/${dNow.getMonth() + 1}/${yearStr}`)) return true;
    if (c.createdAt) {
      const ts = new Date(c.createdAt).getTime();
      if (!isNaN(ts) && ts >= startOfDayTs) return true;
    }
    return false;
  };

  const todayContextCustomers = (contextCustomers || []).filter(isEntryToday);

  const fallbackCategoryBreakdown = {
    oil: { customers: 0, weight: 0, amount: 0 },
    haldi: { customers: 0, weight: 0, amount: 0 },
    darra: { customers: 0, weight: 0, amount: 0 },
    atta: { customers: 0, weight: 0, amount: 0 },
  };

  todayContextCustomers.forEach((c) => {
    const itemStr = (
      c.lastItemMilled ||
      (c.history && c.history[0]?.itemLabel) ||
      (c.history && c.history[0]?.item) ||
      ''
    ).toString().toLowerCase();

    let cat = 'atta';
    if (itemStr.includes('तेल') || itemStr.includes('सरसों') || itemStr.includes('oil')) {
      cat = 'oil';
    } else if (itemStr.includes('मसाला') || itemStr.includes('हल्दी') || itemStr.includes('मिर्च') || itemStr.includes('masala')) {
      cat = 'haldi';
    } else if (itemStr.includes('दर्रा') || itemStr.includes('दलिया') || itemStr.includes('darra')) {
      cat = 'darra';
    }

    const wt = Math.round((Number(c.lastMilledWeight || c.totalPisaiKg || c.weightKg || (c.history && c.history[0]?.weight) || 0)) * 10) / 10;
    const paid = Number(c.paidAmount || c.paid || 0);
    const pend = Number(c.pendingBalance || 0);
    const amt = Math.round((Number(c.totalBill || (paid + pend) || (c.history && c.history[0]?.total) || 0)) * 100) / 100;

    fallbackCategoryBreakdown[cat].customers += 1;
    fallbackCategoryBreakdown[cat].weight = Math.round((fallbackCategoryBreakdown[cat].weight + wt) * 10) / 10;
    fallbackCategoryBreakdown[cat].amount = Math.round((fallbackCategoryBreakdown[cat].amount + amt) * 100) / 100;
  });

  // Seamlessly merge liveData from backend API with local todayContext additions (0ms instant optimistic sync!)
  const oilLive = liveData?.details?.find((d) => d.id === 'oil');
  const haldiLive = liveData?.details?.find((d) => d.id === 'haldi');
  const darraLive = liveData?.details?.find((d) => d.id === 'darra');
  const attaLive = liveData?.details?.find((d) => d.id === 'atta');

  const oilCust = Math.max(parseInt(oilLive?.customers) || 0, fallbackCategoryBreakdown.oil.customers);
  const oilWt = Math.max(parseFloat(oilLive?.weight) || 0, fallbackCategoryBreakdown.oil.weight);
  const oilAmt = Math.max(parseFloat(String(oilLive?.amount || '0').replace(/[^\d.]/g, '')) || 0, fallbackCategoryBreakdown.oil.amount);

  const haldiCust = Math.max(parseInt(haldiLive?.customers) || 0, fallbackCategoryBreakdown.haldi.customers);
  const haldiWt = Math.max(parseFloat(haldiLive?.weight) || 0, fallbackCategoryBreakdown.haldi.weight);
  const haldiAmt = Math.max(parseFloat(String(haldiLive?.amount || '0').replace(/[^\d.]/g, '')) || 0, fallbackCategoryBreakdown.haldi.amount);

  const darraCust = Math.max(parseInt(darraLive?.customers) || 0, fallbackCategoryBreakdown.darra.customers);
  const darraWt = Math.max(parseFloat(darraLive?.weight) || 0, fallbackCategoryBreakdown.darra.weight);
  const darraAmt = Math.max(parseFloat(String(darraLive?.amount || '0').replace(/[^\d.]/g, '')) || 0, fallbackCategoryBreakdown.darra.amount);

  const attaCust = Math.max(parseInt(attaLive?.customers) || 0, fallbackCategoryBreakdown.atta.customers);
  const attaWt = Math.max(parseFloat(attaLive?.weight) || 0, fallbackCategoryBreakdown.atta.weight);
  const attaAmt = Math.max(parseFloat(String(attaLive?.amount || '0').replace(/[^\d.]/g, '')) || 0, fallbackCategoryBreakdown.atta.amount);

  // Exact sum of the 4 categories
  const finalWeightKg = Math.round((oilWt + haldiWt + darraWt + attaWt) * 10) / 10;
  const finalCustCount = oilCust + haldiCust + darraCust + attaCust;
  const finalEarnings = Math.round((oilAmt + haldiAmt + darraAmt + attaAmt) * 100) / 100;
  const liveRecvNum = Number(liveData?.totalReceived ? String(liveData.totalReceived).replace(/[^\d.]/g, '') : 0);
  const finalReceived = Math.max(liveRecvNum, Number(stats?.cashReceived || 0));

  const formatCleanCurrency = (val) => {
    const num = Math.round((Number(val) || 0) * 100) / 100;
    return Number.isInteger(num) ? num.toLocaleString('en-IN') : num.toFixed(2);
  };

  const currentData = {
    period: selectedPeriod,
    label: selectedPeriod === 'yesterday' ? 'कल (Yesterday)' : selectedPeriod === 'week' ? 'इस हफ्ते (This Week)' : 'आज (Today)',
    dateStr: customDateLabel || liveData?.dateStr || (selectedPeriod === 'yesterday' ? 'कल की तारीख' : selectedPeriod === 'week' ? 'इस सप्ताह' : 'आज की तारीख'),
    totalPisai: `${finalWeightKg} KG`,
    totalWeightKg: finalWeightKg,
    totalCustomers: String(finalCustCount),
    totalEarnings: `₹${formatCleanCurrency(finalEarnings)}`,
    totalReceived: `₹${formatCleanCurrency(finalReceived)}`,
    details: [
      {
        id: 'oil',
        name: 'तेल पिराई',
        customers: `${oilCust} ग्राहक`,
        weight: `${oilWt} KG`,
        amount: `₹${formatCleanCurrency(oilAmt)}`,
        img: iconMillingOilImg,
      },
      {
        id: 'haldi',
        name: 'हल्दी पिसाई',
        customers: `${haldiCust} ग्राहक`,
        weight: `${haldiWt} KG`,
        amount: `₹${formatCleanCurrency(haldiAmt)}`,
        img: iconMillingHaldiImg,
      },
      {
        id: 'darra',
        name: 'दर्रा पिसाई',
        customers: `${darraCust} ग्राहक`,
        weight: `${darraWt} KG`,
        amount: `₹${formatCleanCurrency(darraAmt)}`,
        img: iconMillingDarraImg,
      },
      {
        id: 'atta',
        name: 'आटा पिसाई',
        customers: `${attaCust} ग्राहक`,
        weight: `${attaWt} KG`,
        amount: `₹${formatCleanCurrency(attaAmt)}`,
        img: iconMillingAttaImg,
      },
    ],
  };

  // Filter details based on search query
  const filteredDetails = (currentData.details || []).filter(item => {
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
    else if (tabId === 'history') navigation.navigate('DeliveryHistory');
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#15803D']}
              tintColor="#15803D"
            />
          }
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

      {/* ── INTERACTIVE VISUAL CALENDAR MODAL ── */}
      <ChakkiCalendarModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        onSelectDate={handleSelectCalendarDate}
        initialPeriod={selectedPeriod}
      />
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

