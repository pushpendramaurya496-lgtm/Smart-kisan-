import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomDock } from '../components/BottomDock';

const { width } = Dimensions.get('window');

// ─── VECTOR / SHAPE MINI ICONS ───────────────────────────────────────────────

// 1. Hamburger Menu Icon (3 clean dark navy rounded bars)
const HamburgerIcon = () => (
  <View style={iconStyles.hamburgerContainer}>
    <View style={iconStyles.hamburgerBar} />
    <View style={[iconStyles.hamburgerBar, { width: 14 }]} />
    <View style={iconStyles.hamburgerBar} />
  </View>
);

// 2. Atta Chakki Hexagon Wheat Logo
const ChakkiLogoBadge = () => (
  <View style={iconStyles.logoHexagon}>
    {/* Stylized geometric wheat seedling */}
    <View style={iconStyles.wheatStem}>
      <View style={[iconStyles.wheatLeaf, iconStyles.wheatLeafLeft, { top: 3 }]} />
      <View style={[iconStyles.wheatLeaf, iconStyles.wheatLeafRight, { top: 3 }]} />
      <View style={[iconStyles.wheatLeaf, iconStyles.wheatLeafLeft, { top: 9 }]} />
      <View style={[iconStyles.wheatLeaf, iconStyles.wheatLeafRight, { top: 9 }]} />
      <View style={[iconStyles.wheatLeaf, iconStyles.wheatLeafCenter, { top: -2 }]} />
    </View>
  </View>
);

// 3. Calendar Icon (Bordered Card with dots)
const CalendarOutlineIcon = ({ color = '#101D35', size = 18 }) => (
  <View style={[iconStyles.calendarBox, { width: size, height: size * 0.95, borderColor: color }]}>
    <View style={[iconStyles.calendarHeader, { backgroundColor: color }]} />
    <View style={iconStyles.calendarDotsRow}>
      <View style={[iconStyles.calendarDot, { backgroundColor: color }]} />
      <View style={[iconStyles.calendarDot, { backgroundColor: color }]} />
      <View style={[iconStyles.calendarDot, { backgroundColor: color }]} />
    </View>
    <View style={iconStyles.calendarDotsRow}>
      <View style={[iconStyles.calendarDot, { backgroundColor: color }]} />
      <View style={[iconStyles.calendarDot, { backgroundColor: color }]} />
      <View style={[iconStyles.calendarDot, { backgroundColor: color }]} />
    </View>
  </View>
);

// 4. Bar Chart Analytics Icon
const BarChartIcon = ({ color = '#334155', size = 16 }) => (
  <View style={[iconStyles.chartContainer, { width: size, height: size }]}>
    <View style={[iconStyles.chartBar, { height: '45%', backgroundColor: color }]} />
    <View style={[iconStyles.chartBar, { height: '70%', backgroundColor: color }]} />
    <View style={[iconStyles.chartBar, { height: '100%', backgroundColor: color }]} />
  </View>
);

// 5. Trophy Award Icon
const TrophyIcon = ({ color = '#334155', size = 16 }) => (
  <View style={[iconStyles.trophyContainer, { width: size, height: size }]}>
    <View style={[iconStyles.trophyCup, { borderColor: color }]}>
      <View style={[iconStyles.trophyHandleLeft, { borderColor: color }]} />
      <View style={[iconStyles.trophyHandleRight, { borderColor: color }]} />
    </View>
    <View style={[iconStyles.trophyStem, { backgroundColor: color }]} />
    <View style={[iconStyles.trophyBase, { backgroundColor: color }]} />
  </View>
);

// 6. Users / Customers Silhouette Icon
const UsersIcon = () => (
  <View style={iconStyles.usersCircleBadge}>
    <View style={iconStyles.userCenter}>
      <View style={iconStyles.userHead} />
      <View style={iconStyles.userBody} />
    </View>
    <View style={iconStyles.userLeft}>
      <View style={[iconStyles.userHead, { width: 6, height: 6 }]} />
      <View style={[iconStyles.userBody, { width: 10, height: 6 }]} />
    </View>
    <View style={iconStyles.userRight}>
      <View style={[iconStyles.userHead, { width: 6, height: 6 }]} />
      <View style={[iconStyles.userBody, { width: 10, height: 6 }]} />
    </View>
  </View>
);

// 7. Weight / Kettlebell "KG" Icon
const WeightKgIcon = () => (
  <View style={iconStyles.kgCircleBadge}>
    <View style={iconStyles.kettlebellHandle} />
    <View style={iconStyles.kettlebellBody}>
      <Text style={iconStyles.kgText}>KG</Text>
    </View>
  </View>
);

// 8. Stack of Banknotes / Cash Icon
const CashStackIcon = () => (
  <View style={iconStyles.cashCircleBadge}>
    {/* Base bill */}
    <View style={iconStyles.cashBase} />
    {/* Front bill */}
    <View style={iconStyles.cashFront}>
      <View style={iconStyles.cashOval} />
      <Text style={iconStyles.cashRupee}>₹</Text>
    </View>
  </View>
);

// 9. Smartphone Online / UPI Rupee Icon
const SmartphoneUpiIcon = () => (
  <View style={iconStyles.upiCircleBadge}>
    <View style={iconStyles.phoneBody}>
      <View style={iconStyles.phoneScreen}>
        <Text style={iconStyles.phoneRupee}>₹</Text>
      </View>
      <View style={iconStyles.phoneNotch} />
    </View>
  </View>
);

// 10. Amber Leather Wallet Icon
const WalletIcon = () => (
  <View style={iconStyles.walletWrapper}>
    <View style={iconStyles.walletBody}>
      <View style={iconStyles.walletFlap} />
      <View style={iconStyles.walletClasp} />
    </View>
  </View>
);

// 11. Emerald Coins Stack Icon
const CoinsStackIcon = () => (
  <View style={iconStyles.coinsWrapper}>
    <View style={[iconStyles.coin, { top: 0, left: 2 }]} />
    <View style={[iconStyles.coin, { top: 5, left: 0 }]} />
    <View style={[iconStyles.coin, { top: 10, left: 1 }]} />
    <View style={[iconStyles.coin, { top: 3, left: 10 }]} />
    <View style={[iconStyles.coin, { top: 8, left: 11 }]} />
  </View>
);

// 12. Grinding Type Icons (Oil, Haldi, Darra, Atta)
const GrindingTypeIcon = ({ type }) => {
  switch (type) {
    case 'oil':
      return (
        <View style={[iconStyles.grindBadge, { backgroundColor: '#FEF3C7' }]}>
          {/* Golden oil drop */}
          <View style={iconStyles.oilDropOuter}>
            <View style={iconStyles.oilDropTip} />
            <View style={iconStyles.oilDropBottom} />
            <View style={iconStyles.oilDropShine} />
          </View>
        </View>
      );
    case 'haldi':
      return (
        <View style={[iconStyles.grindBadge, { backgroundColor: '#FEF9C3' }]}>
          {/* Rustic clay bowl filled with golden turmeric */}
          <View style={iconStyles.haldiBowlOuter}>
            <View style={iconStyles.spicePowderYellow} />
            <View style={iconStyles.clayBowl} />
          </View>
        </View>
      );
    case 'darra':
      return (
        <View style={[iconStyles.grindBadge, { backgroundColor: '#F3E8D0' }]}>
          {/* Bowl filled with grain / daliya */}
          <View style={iconStyles.haldiBowlOuter}>
            <View style={iconStyles.spicePowderGrain} />
            <View style={iconStyles.clayBowl} />
          </View>
        </View>
      );
    case 'atta':
    default:
      return (
        <View style={[iconStyles.grindBadge, { backgroundColor: '#F1F5F9' }]}>
          {/* Bowl filled with pure white wheat flour */}
          <View style={iconStyles.haldiBowlOuter}>
            <View style={iconStyles.spicePowderFlour} />
            <View style={iconStyles.clayBowl} />
          </View>
        </View>
      );
  }
};

// ─── DATA PER TAB (TODAY, WEEKLY, MONTHLY, TOTAL) ───────────────────────────
const DASHBOARD_DATA = {
  today: {
    periodTitle: 'आज की कुल कमाई',
    totalEarning: '₹4,850',
    dateLabel: '23 नवंबर 2026',
    stats: {
      customers: '32',
      pisaiKg: '485 KG',
      cash: '₹3,500',
      online: '₹1,000',
    },
    payment: {
      pending: '₹350',
      total: '₹4,850',
    },
    services: [
      { id: 'oil', name: 'तेल पिराई', customers: '12 ग्राहक', amount: '₹2,000', type: 'oil' },
      { id: 'haldi', name: 'हल्दी पिसाई', customers: '10 ग्राहक', amount: '₹1,500', type: 'haldi' },
      { id: 'darra', name: 'दर्रा पिसाई', customers: '10 ग्राहक', amount: '₹1,350', type: 'darra' },
      { id: 'atta', name: 'आटा पिसाई', customers: '8 ग्राहक', amount: '₹1,000', type: 'atta' },
    ],
  },
  weekly: {
    periodTitle: 'इस हफ्ते की कुल कमाई',
    totalEarning: '₹31,200',
    dateLabel: '17 नवं - 23 नवं 2026',
    stats: {
      customers: '214',
      pisaiKg: '3,240 KG',
      cash: '₹23,400',
      online: '₹7,800',
    },
    payment: {
      pending: '₹2,150',
      total: '₹31,200',
    },
    services: [
      { id: 'oil', name: 'तेल पिराई', customers: '82 ग्राहक', amount: '₹12,800', type: 'oil' },
      { id: 'haldi', name: 'हल्दी पिसाई', customers: '64 ग्राहक', amount: '₹9,200', type: 'haldi' },
      { id: 'darra', name: 'दर्रा पिसाई', customers: '38 ग्राहक', amount: '₹5,400', type: 'darra' },
      { id: 'atta', name: 'आटा पिसाई', customers: '30 ग्राहक', amount: '₹3,800', type: 'atta' },
    ],
  },
  monthly: {
    periodTitle: 'इस महीने की कुल कमाई',
    totalEarning: '₹1,28,400',
    dateLabel: '1 नवं - 23 नवं 2026',
    stats: {
      customers: '880',
      pisaiKg: '13,450 KG',
      cash: '₹94,500',
      online: '₹33,900',
    },
    payment: {
      pending: '₹6,800',
      total: '₹1,28,400',
    },
    services: [
      { id: 'oil', name: 'तेल पिराई', customers: '340 ग्राहक', amount: '₹52,000', type: 'oil' },
      { id: 'haldi', name: 'हल्दी पिसाई', customers: '260 ग्राहक', amount: '₹38,000', type: 'haldi' },
      { id: 'darra', name: 'दर्रा पिसाई', customers: '160 ग्राहक', amount: '₹22,400', type: 'darra' },
      { id: 'atta', name: 'आटा पिसाई', customers: '120 ग्राहक', amount: '₹16,000', type: 'atta' },
    ],
  },
  total: {
    periodTitle: 'कुल समग्र कमाई',
    totalEarning: '₹7,45,800',
    dateLabel: 'समग्र रिकॉर्ड (All-Time)',
    stats: {
      customers: '5,120',
      pisaiKg: '78,500 KG',
      cash: '₹5,60,000',
      online: '₹1,85,800',
    },
    payment: {
      pending: '₹14,200',
      total: '₹7,45,800',
    },
    services: [
      { id: 'oil', name: 'तेल पिराई', customers: '1,980 ग्राहक', amount: '₹3,10,000', type: 'oil' },
      { id: 'haldi', name: 'हल्दी पिसाई', customers: '1,420 ग्राहक', amount: '₹2,15,000', type: 'haldi' },
      { id: 'darra', name: 'दर्रा पिसाई', customers: '940 ग्राहक', amount: '₹1,25,000', type: 'darra' },
      { id: 'atta', name: 'आटा पिसाई', customers: '780 ग्राहक', amount: '₹95,800', type: 'atta' },
    ],
  },
};

// ─── MAIN EARNING DASHBOARD COMPONENT ───────────────────────────────────────
export const EarningsDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topSafePadding = Math.max(insets.top || 0, 42);

  const [activeTab, setActiveTab] = useState('today');
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  const currentData = DASHBOARD_DATA[activeTab] || DASHBOARD_DATA.today;

  const handleTabPress = (tabId) => {
    if (tabId === 'home') navigation.navigate('Home');
    else if (tabId === 'khata') navigation.navigate('GrahakKhata');
    else if (tabId === 'bill') navigation.navigate('BillPrint', { customerId: 'c1' });
    else if (tabId === 'settings') navigation.navigate('Settings');
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Main Content Area */}
      <View style={[styles.mainLayout, { paddingTop: topSafePadding }]}>
        
        {/* ── 1. HEADER ── */}
        <View style={styles.headerRow}>
          {/* Left: Hamburger Menu Button (Navigates Back to Home Screen) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={styles.headerIconButton}
            accessibilityLabel="वापस जाएं या मेन्यू"
          >
            <HamburgerIcon />
          </TouchableOpacity>

          {/* Center: Atta Chakki Logo & Titles */}
          <View style={styles.headerCenter}>
            <ChakkiLogoBadge />
            <View style={styles.headerTitleColumn}>
              <Text style={styles.headerBrandTitle}>आटा चक्की</Text>
              <Text style={styles.headerSubtitle}>Earning Dashboard</Text>
            </View>
          </View>

          {/* Right: Calendar Icon Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCalendarModalVisible(true)}
            style={styles.headerIconButton}
            accessibilityLabel="तारीख चुनें"
          >
            <CalendarOutlineIcon color="#101D35" size={20} />
          </TouchableOpacity>
        </View>

        {/* Scrollable View for Dashboard Body */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── 2. EARNING NAVIGATION TABS (One Row, 4 Options) ── */}
          <View style={styles.tabBarContainer}>
            {/* Tab 1: Today */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveTab('today')}
              style={[styles.tabButton, activeTab === 'today' && styles.tabButtonActive]}
            >
              <CalendarOutlineIcon
                color={activeTab === 'today' ? '#FFFFFF' : '#334155'}
                size={14}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'today' && styles.tabButtonTextActive,
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>

            <View style={styles.tabDivider} />

            {/* Tab 2: Weekly */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveTab('weekly')}
              style={[styles.tabButton, activeTab === 'weekly' && styles.tabButtonActive]}
            >
              <BarChartIcon
                color={activeTab === 'weekly' ? '#FFFFFF' : '#334155'}
                size={14}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'weekly' && styles.tabButtonTextActive,
                ]}
              >
                Weekly
              </Text>
            </TouchableOpacity>

            <View style={styles.tabDivider} />

            {/* Tab 3: Monthly */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveTab('monthly')}
              style={[styles.tabButton, activeTab === 'monthly' && styles.tabButtonActive]}
            >
              <CalendarOutlineIcon
                color={activeTab === 'monthly' ? '#FFFFFF' : '#334155'}
                size={14}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'monthly' && styles.tabButtonTextActive,
                ]}
              >
                Monthly
              </Text>
            </TouchableOpacity>

            <View style={styles.tabDivider} />

            {/* Tab 4: Total */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setActiveTab('total')}
              style={[styles.tabButton, activeTab === 'total' && styles.tabButtonActive]}
            >
              <TrophyIcon
                color={activeTab === 'total' ? '#FFFFFF' : '#334155'}
                size={14}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'total' && styles.tabButtonTextActive,
                ]}
              >
                Total
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── 3. MAIN EARNING CARD (Soft Green & Yellow Gradient) ── */}
          <LinearGradient
            colors={['#E6F8EE', '#FEFCE8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainEarningCard}
          >
            <Text style={styles.earningPeriodTitle}>{currentData.periodTitle}</Text>
            <Text style={styles.earningBigAmount}>{currentData.totalEarning}</Text>
            
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setCalendarModalVisible(true)}
              style={styles.earningDateRow}
            >
              <CalendarOutlineIcon color="#101D35" size={15} />
              <Text style={styles.earningDateText}>{currentData.dateLabel}</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* ── 4. STATISTICS CARDS (2x2 Grid) ── */}
          <View style={styles.statGridContainer}>
            {/* Row 1 */}
            <View style={styles.statRow}>
              {/* Card 1: कुल ग्राहक */}
              <View style={styles.statCard}>
                <UsersIcon />
                <View style={styles.statTextColumn}>
                  <Text style={styles.statLabel}>कुल ग्राहक</Text>
                  <Text style={styles.statValue}>{currentData.stats.customers}</Text>
                </View>
              </View>

              {/* Card 2: कुल पिसाई */}
              <View style={styles.statCard}>
                <WeightKgIcon />
                <View style={styles.statTextColumn}>
                  <Text style={styles.statLabel}>कुल पिसाई</Text>
                  <Text style={styles.statValue}>{currentData.stats.pisaiKg}</Text>
                </View>
              </View>
            </View>

            {/* Row 2 */}
            <View style={styles.statRow}>
              {/* Card 3: नकद प्राप्त */}
              <View style={styles.statCard}>
                <CashStackIcon />
                <View style={styles.statTextColumn}>
                  <Text style={styles.statLabel}>नकद प्राप्त</Text>
                  <Text style={styles.statValue}>{currentData.stats.cash}</Text>
                </View>
              </View>

              {/* Card 4: ऑनलाइन प्राप्त */}
              <View style={styles.statCard}>
                <SmartphoneUpiIcon />
                <View style={styles.statTextColumn}>
                  <Text style={styles.statLabel}>ऑनलाइन प्राप्त</Text>
                  <Text style={styles.statValue}>{currentData.stats.online}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── 5. PAYMENT SUMMARY (Single Dual-row Card) ── */}
          <View style={styles.paymentSummaryCard}>
            {/* Top Row: बकाया पैसा (Soft Yellow Background) */}
            <View style={styles.paymentRowYellow}>
              <View style={styles.paymentLeftGroup}>
                <WalletIcon />
                <Text style={styles.paymentLabelText}>बकाया पैसा</Text>
              </View>
              <Text style={styles.paymentAmountPending}>{currentData.payment.pending}</Text>
            </View>

            {/* Divider */}
            <View style={styles.paymentDivider} />

            {/* Bottom Row: कुल कमाई (Soft Light Green Background) */}
            <View style={styles.paymentRowGreen}>
              <View style={styles.paymentLeftGroup}>
                <CoinsStackIcon />
                <Text style={styles.paymentLabelText}>कुल कमाई</Text>
              </View>
              <Text style={styles.paymentAmountTotal}>{currentData.payment.total}</Text>
            </View>
          </View>

          {/* ── 6. पिसाई के हिसाब से कमाई (Grinding Breakdown Section) ── */}
          <View style={styles.grindingSection}>
            {/* Green Header Banner */}
            <View style={styles.grindingHeaderBanner}>
              <View style={styles.grindingHeaderLeft}>
                <Text style={styles.wheatEmoji}>🌾</Text>
                <Text style={styles.grindingHeaderText}>पिसाई के हिसाब से कमाई</Text>
              </View>
              {/* Decorative wave swoosh on right side */}
              <View style={styles.waveRibbonContainer}>
                <View style={styles.waveRibbon1} />
                <View style={styles.waveRibbon2} />
              </View>
            </View>

            {/* 2x2 Grid for the 4 Grinding Types */}
            <View style={styles.grindingGrid}>
              {/* Row 1: तेल पिराई & हल्दी पिसाई */}
              <View style={styles.grindingRow}>
                {/* 1. तेल पिराई */}
                <View style={styles.grindingCard}>
                  <GrindingTypeIcon type="oil" />
                  <View style={styles.grindingMidColumn}>
                    <Text style={styles.grindingName}>
                      {currentData.services[0].name}
                    </Text>
                    <Text style={styles.grindingCustCount}>
                      {currentData.services[0].customers}
                    </Text>
                  </View>
                  <View style={styles.grindingVerticalDivider} />
                  <Text style={styles.grindingAmountText}>
                    {currentData.services[0].amount}
                  </Text>
                </View>

                {/* 2. हल्दी पिसाई */}
                <View style={styles.grindingCard}>
                  <GrindingTypeIcon type="haldi" />
                  <View style={styles.grindingMidColumn}>
                    <Text style={styles.grindingName}>
                      {currentData.services[1].name}
                    </Text>
                    <Text style={styles.grindingCustCount}>
                      {currentData.services[1].customers}
                    </Text>
                  </View>
                  <View style={styles.grindingVerticalDivider} />
                  <Text style={styles.grindingAmountText}>
                    {currentData.services[1].amount}
                  </Text>
                </View>
              </View>

              {/* Row 2: दर्रा पिसाई & आटा पिसाई */}
              <View style={styles.grindingRow}>
                {/* 3. दर्रा पिसाई */}
                <View style={styles.grindingCard}>
                  <GrindingTypeIcon type="darra" />
                  <View style={styles.grindingMidColumn}>
                    <Text style={styles.grindingName}>
                      {currentData.services[2].name}
                    </Text>
                    <Text style={styles.grindingCustCount}>
                      {currentData.services[2].customers}
                    </Text>
                  </View>
                  <View style={styles.grindingVerticalDivider} />
                  <Text style={styles.grindingAmountText}>
                    {currentData.services[2].amount}
                  </Text>
                </View>

                {/* 4. आटा पिसाई */}
                <View style={styles.grindingCard}>
                  <GrindingTypeIcon type="atta" />
                  <View style={styles.grindingMidColumn}>
                    <Text style={styles.grindingName}>
                      {currentData.services[3].name}
                    </Text>
                    <Text style={styles.grindingCustCount}>
                      {currentData.services[3].customers}
                    </Text>
                  </View>
                  <View style={styles.grindingVerticalDivider} />
                  <Text style={styles.grindingAmountText}>
                    {currentData.services[3].amount}
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom green wave accent footer */}
            <View style={styles.grindingFooterWave}>
              <View style={styles.footerWaveCurve} />
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Bottom Navigation Bar: Home | Customer | Bill | Settings */}
        <BottomDock activeTab="home" onTabPress={handleTabPress} />
      </View>

      {/* ── CALENDAR DATE RANGE PICKER MODAL ── */}
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

            {/* Quick Presets */}
            <TouchableOpacity
              style={[styles.presetRow, activeTab === 'today' && styles.presetRowSelected]}
              onPress={() => {
                setActiveTab('today');
                setCalendarModalVisible(false);
              }}
            >
              <Text style={styles.presetLabel}>आज (Today)</Text>
              <Text style={styles.presetDate}>23 नवंबर 2026</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.presetRow, activeTab === 'weekly' && styles.presetRowSelected]}
              onPress={() => {
                setActiveTab('weekly');
                setCalendarModalVisible(false);
              }}
            >
              <Text style={styles.presetLabel}>इस हफ्ते (Weekly)</Text>
              <Text style={styles.presetDate}>17 - 23 नवंबर</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.presetRow, activeTab === 'monthly' && styles.presetRowSelected]}
              onPress={() => {
                setActiveTab('monthly');
                setCalendarModalVisible(false);
              }}
            >
              <Text style={styles.presetLabel}>इस महीने (Monthly)</Text>
              <Text style={styles.presetDate}>1 - 23 नवंबर 2026</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.presetRow, activeTab === 'total' && styles.presetRowSelected]}
              onPress={() => {
                setActiveTab('total');
                setCalendarModalVisible(false);
              }}
            >
              <Text style={styles.presetLabel}>कुल समग्र (Total All-time)</Text>
              <Text style={styles.presetDate}>लाइफटाइम रिकॉर्ड</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setCalendarModalVisible(false)}
            >
              <Text style={styles.modalDoneButtonText}>ठीक है</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ─── MAIN STYLES ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean White Background strictly as requested
  },
  mainLayout: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // 1. Header Styles
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleColumn: {
    marginLeft: 10,
  },
  headerBrandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#101D35', // Dark Navy Blue strictly as requested
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: -1,
  },

  // 2. Tab Bar Styles (One row, 4 options)
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCE4EE', // Slate grey-blue background matching reference
    borderRadius: 14,
    padding: 3,
    marginTop: 6,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 11,
  },
  tabButtonActive: {
    backgroundColor: '#0F4A38', // Dark Forest Green Background for Selected Tab
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 6,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#CBD5E1',
  },

  // 3. Main Earning Card Styles
  mainEarningCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  earningPeriodTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#065F46', // Dark Green
    marginBottom: 2,
  },
  earningBigAmount: {
    fontSize: 44,
    fontWeight: '900',
    color: '#101D35', // Dark Navy Blue in large bold font
    letterSpacing: -1,
    marginVertical: 4,
  },
  earningDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  earningDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 6,
  },

  // 4. Statistics Cards (2x2 Grid)
  statGridContainer: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    width: (width - 34) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.2,
  },
  statTextColumn: {
    marginLeft: 10,
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 21,
    fontWeight: '800',
    color: '#101D35', // Dark Navy Blue
    letterSpacing: -0.3,
  },

  // 5. Payment Summary Card (Dual-row Single Card)
  paymentSummaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.2,
  },
  paymentRowYellow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF9C3', // Soft Yellow Background for Pending Balance
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  paymentRowGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DCFCE7', // Soft Green Background for Total Earnings
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  paymentLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentLabelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101D35', // Dark Navy Blue
    marginLeft: 12,
  },
  paymentAmountPending: {
    fontSize: 22,
    fontWeight: '800',
    color: '#101D35',
  },
  paymentAmountTotal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#065F46', // Dark Green
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  // 6. Grinding Breakdown Section Styles
  grindingSection: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1.5,
  },
  grindingHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0D6846', // Deep Green Header
    paddingHorizontal: 14,
    paddingVertical: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  grindingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  wheatEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  grindingHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  waveRibbonContainer: {
    position: 'absolute',
    right: -10,
    top: 0,
    bottom: 0,
    width: 90,
    overflow: 'hidden',
  },
  waveRibbon1: {
    position: 'absolute',
    right: 12,
    top: -10,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  waveRibbon2: {
    position: 'absolute',
    right: -15,
    top: 2,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(110, 231, 183, 0.28)',
  },
  grindingGrid: {
    padding: 10,
  },
  grindingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  grindingCard: {
    width: (width - 40) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 9,
    paddingHorizontal: 6,
  },
  grindingMidColumn: {
    flex: 1,
    marginLeft: 6,
  },
  grindingName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#101D35',
    letterSpacing: -0.2,
  },
  grindingCustCount: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  grindingVerticalDivider: {
    width: 1,
    height: '65%',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  grindingAmountText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#101D35',
  },
  grindingFooterWave: {
    height: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  footerWaveCurve: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 70,
    height: 24,
    borderTopLeftRadius: 20,
    backgroundColor: 'rgba(13, 104, 70, 0.1)',
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
    color: '#101D35',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748B',
    padding: 4,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  presetRowSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#101D35',
  },
  presetDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  modalDoneButton: {
    backgroundColor: '#0F4A38',
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
  // Hamburger
  hamburgerContainer: {
    width: 18,
    height: 14,
    justifyContent: 'space-between',
  },
  hamburgerBar: {
    width: 18,
    height: 2.2,
    backgroundColor: '#101D35',
    borderRadius: 2,
  },

  // Brand Logo Hexagon
  logoHexagon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0D4734',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  wheatStem: {
    width: 2,
    height: 22,
    backgroundColor: '#FDE047',
    position: 'relative',
    alignItems: 'center',
  },
  wheatLeaf: {
    position: 'absolute',
    width: 6,
    height: 4,
    backgroundColor: '#FDE047',
    borderRadius: 3,
  },
  wheatLeafLeft: {
    left: -7,
    transform: [{ rotate: '-30deg' }],
  },
  wheatLeafRight: {
    right: -7,
    transform: [{ rotate: '30deg' }],
  },
  wheatLeafCenter: {
    width: 4,
    height: 6,
    top: -4,
  },

  // Calendar Box
  calendarBox: {
    borderWidth: 1.5,
    borderRadius: 4,
    padding: 1.5,
    justifyContent: 'space-around',
    overflow: 'hidden',
  },
  calendarHeader: {
    height: 3,
    marginBottom: 1,
    borderRadius: 1,
  },
  calendarDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 0.5,
  },
  calendarDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
  },

  // Bar Chart
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 1,
  },
  chartBar: {
    width: 3.2,
    borderRadius: 1.5,
  },

  // Trophy
  trophyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyCup: {
    width: 10,
    height: 8,
    borderWidth: 1.4,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    position: 'relative',
  },
  trophyHandleLeft: {
    position: 'absolute',
    left: -3,
    top: 1,
    width: 3,
    height: 4,
    borderWidth: 1.2,
    borderRightWidth: 0,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  trophyHandleRight: {
    position: 'absolute',
    right: -3,
    top: 1,
    width: 3,
    height: 4,
    borderWidth: 1.2,
    borderLeftWidth: 0,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  trophyStem: {
    width: 2,
    height: 3,
  },
  trophyBase: {
    width: 8,
    height: 2,
    borderRadius: 1,
  },

  // Users Badge
  usersCircleBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7', // Light green
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  userCenter: {
    alignItems: 'center',
    zIndex: 2,
  },
  userHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#15803D',
  },
  userBody: {
    width: 14,
    height: 8,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    backgroundColor: '#15803D',
    marginTop: 1,
  },
  userLeft: {
    position: 'absolute',
    left: 8,
    bottom: 9,
    alignItems: 'center',
    opacity: 0.8,
  },
  userRight: {
    position: 'absolute',
    right: 8,
    bottom: 9,
    alignItems: 'center',
    opacity: 0.8,
  },

  // Weight KG Badge
  kgCircleBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kettlebellHandle: {
    width: 10,
    height: 5,
    borderWidth: 1.8,
    borderColor: '#1E293B',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomWidth: 0,
    marginBottom: -1,
  },
  kettlebellBody: {
    width: 20,
    height: 18,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kgText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Cash Stack Badge
  cashCircleBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cashBase: {
    position: 'absolute',
    width: 22,
    height: 13,
    backgroundColor: '#86EFAC',
    borderRadius: 2,
    transform: [{ rotate: '-8deg' }],
  },
  cashFront: {
    width: 22,
    height: 13,
    backgroundColor: '#16A34A',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  cashOval: {
    position: 'absolute',
    width: 8,
    height: 6,
    borderRadius: 3,
    borderWidth: 0.8,
    borderColor: '#FFFFFF',
    opacity: 0.6,
  },
  cashRupee: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },

  // Smartphone UPI Badge
  upiCircleBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneBody: {
    width: 14,
    height: 22,
    borderRadius: 3,
    backgroundColor: '#0284C7',
    padding: 1.5,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneScreen: {
    flex: 1,
    width: '100%',
    backgroundColor: '#BAE6FD',
    borderRadius: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneRupee: {
    color: '#0284C7',
    fontSize: 8.5,
    fontWeight: '900',
  },
  phoneNotch: {
    width: 4,
    height: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 0.5,
    marginTop: 1,
  },

  // Wallet
  walletWrapper: {
    width: 32,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletBody: {
    width: 26,
    height: 20,
    backgroundColor: '#D97706',
    borderRadius: 4,
    position: 'relative',
  },
  walletFlap: {
    position: 'absolute',
    right: 0,
    top: 4,
    width: 10,
    height: 12,
    backgroundColor: '#B45309',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  walletClasp: {
    position: 'absolute',
    right: 6,
    top: 8,
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#FEF08A',
  },

  // Coins Stack
  coinsWrapper: {
    width: 32,
    height: 26,
    position: 'relative',
  },
  coin: {
    position: 'absolute',
    width: 13,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#059669',
    borderWidth: 1,
    borderColor: '#34D399',
  },

  // Grinding Type Badges
  grindBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oilDropOuter: {
    alignItems: 'center',
    position: 'relative',
  },
  oilDropTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 7,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#F59E0B',
  },
  oilDropBottom: {
    width: 12,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
    marginTop: -2,
  },
  oilDropShine: {
    position: 'absolute',
    top: 4,
    right: 2,
    width: 2.5,
    height: 3.5,
    borderRadius: 1.5,
    backgroundColor: '#FEF3C7',
  },

  haldiBowlOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 22,
  },
  spicePowderYellow: {
    width: 18,
    height: 10,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    backgroundColor: '#FACC15',
    marginBottom: -2,
  },
  spicePowderGrain: {
    width: 18,
    height: 10,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    backgroundColor: '#D97706',
    marginBottom: -2,
  },
  spicePowderFlour: {
    width: 18,
    height: 10,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    backgroundColor: '#F8FAFC',
    borderWidth: 0.8,
    borderColor: '#E2E8F0',
    marginBottom: -2,
  },
  clayBowl: {
    width: 22,
    height: 9,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: '#92400E',
    borderWidth: 1,
    borderColor: '#78350F',
  },
});
