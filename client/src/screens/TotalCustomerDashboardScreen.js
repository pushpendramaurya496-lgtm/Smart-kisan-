import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
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
import { getCustomerTimestamp, formatArrivalTime } from '../utils/customerTimestampHelper';

const { width } = Dimensions.get('window');

const formatCleanNum = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const num = Math.round(Number(val) * 100) / 100;
  return Number.isInteger(num) ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
};

const normalizeString = (str) => {
  if (!str) return '';
  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ');
};

const getCustomerDedupKey = (c) => {
  if (!c) return '';
  const cleanPhone = (c.phone || '').toString().replace(/\D/g, '');
  if (cleanPhone.length >= 10) {
    return `ph_${cleanPhone.slice(-10)}`;
  }
  const cleanName = normalizeString(c.name || c.customerName);
  const rawVillage = normalizeString(c.village);
  const cleanVillage = rawVillage.replace(/^(ग्राम|गाँव|village)\s*/i, '').trim();

  if (cleanName) {
    const v = (!cleanVillage || cleanVillage === 'ग्राम' || cleanVillage === 'गांव') ? 'default' : cleanVillage;
    return `cust_${cleanName}_${v}`;
  }
  return `id_${String(c.id || c.customerId || c._id || '')}`;
};

// ─── HIGH-DEFINITION ASSETS FROM EXACT REFERENCE ────────────────────────────
const customerLogoImg = require('../../assets/customer/customer_logo.png');
const customerCalBtnImg = require('../../assets/customer/customer_cal_btn.png');
const iconUsersGroupImg = require('../../assets/customer/icon_users_group.png');

// ─── VECTOR MINI ICONS ──────────────────────────────────────────────────────
const HamburgerMenuIcon = () => (
  <View style={iconStyles.hamburgerContainer}>
    <View style={[iconStyles.hamburgerBar, { width: 20 }]} />
    <View style={[iconStyles.hamburgerBar, { width: 14 }]} />
    <View style={[iconStyles.hamburgerBar, { width: 20 }]} />
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

// ─── TOTAL CUSTOMER DASHBOARD SCREEN COMPONENT ──────────────────────────────
export const TotalCustomerDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topSafePadding = Math.max(insets.top || 0, 42);
  const { stats, customers: contextCustomers } = useChakki();

  const [customers, setCustomers] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({ oil: 0, haldi: 0, darra: 0, atta: 0 });
  const [totalDbCustomers, setTotalDbCustomers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null); // 'oil' | 'haldi' | 'darra' | 'atta' | null
  const [selectedDateKey, setSelectedDateKey] = useState('today');
  const [customDateIso, setCustomDateIso] = useState(null);
  const [customDateLabel, setCustomDateLabel] = useState(null);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState('latest'); // 'latest' (नया ग्राहक सबसे ऊपर) | 'first_come' (पुराने से नया)

  const fetchCustomersData = useCallback(async (period = selectedDateKey, date = customDateIso) => {
    try {
      const data = await DashboardApiService.getCustomers(period, date);
      if (data) {
        setCustomers(data.customers || []);
        if (data.categories) setCategoryCounts(data.categories);
        if (data.totalCustomers !== undefined) setTotalDbCustomers(data.totalCustomers);
      }
    } catch (err) {
      console.warn('Real customers fetch error:', err.message);
    }
  }, [selectedDateKey, customDateIso]);

  useEffect(() => {
    fetchCustomersData(selectedDateKey, customDateIso);
  }, [selectedDateKey, customDateIso, fetchCustomersData, stats?.totalCustomers, stats?.todayAdded, stats?.todayEntries, (contextCustomers || []).length]);

  // Auto-reload on screen focus so newly added customers show immediately
  useEffect(() => {
    const unsub = navigation?.addListener ? navigation.addListener('focus', () => {
      fetchCustomersData(selectedDateKey, customDateIso);
    }) : undefined;
    return unsub;
  }, [navigation, fetchCustomersData, selectedDateKey, customDateIso]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomersData(selectedDateKey, customDateIso);
    setRefreshing(false);
  };

  const handleSelectCalendarDate = (dateObj) => {
    if (dateObj.period === 'weekly') {
      setSelectedDateKey('week');
      setCustomDateLabel(null);
      setCustomDateIso(null);
    } else if (dateObj.period === 'monthly') {
      setSelectedDateKey('month');
      setCustomDateLabel(null);
      setCustomDateIso(null);
    } else {
      setSelectedDateKey('today');
      setCustomDateLabel(dateObj.dateFormatted);
      const y = dateObj.year;
      const m = String(dateObj.month + 1).padStart(2, '0');
      const d = String(dateObj.day).padStart(2, '0');
      setCustomDateIso(`${y}-${m}-${d}`);
    }
  };

  // Resilient live-merged customer list combining contextCustomers and API data
  const custMap = new Map();

  // 1. Context customers (from local AsyncStorage or quick new entries)
  (contextCustomers || []).forEach((c, idx) => {
    const key = getCustomerDedupKey(c);
    const lastMilled = (c.lastItemMilled || (c.history && c.history[0]?.itemLabel) || (c.history && c.history[0]?.item) || '').toString().toLowerCase();
    let catKey = 'atta';
    let catLabel = 'गेहूं (पिसाई)';
    if (lastMilled.includes('तेल') || lastMilled.includes('सरसों') || lastMilled.includes('oil')) {
      catKey = 'oil';
      catLabel = 'सरसों (तेल)';
    } else if (lastMilled.includes('मसाला') || lastMilled.includes('हल्दी') || lastMilled.includes('मिर्च') || lastMilled.includes('masala')) {
      catKey = 'haldi';
      catLabel = 'मसाला (कुटाई)';
    } else if (lastMilled.includes('दर्रा') || lastMilled.includes('दलिया') || lastMilled.includes('darra')) {
      catKey = 'darra';
      catLabel = 'दर्रा / दलिया';
    }

    const wtNum = Number(c.lastMilledWeight || c.totalPisaiKg || c.weightKg || (c.history && c.history[0]?.weight) || 40);
    const pendNum = Number(c.pendingBalance) || 0;
    const paidNum = Number(c.paidAmount || c.paid || 0);
    const totBill = Number(c.totalBill || (pendNum + paidNum));
    const ts = getCustomerTimestamp(c);
    const timeDisplay = formatArrivalTime(c);

    custMap.set(key, {
      id: c.id || c._id,
      customerId: c.id || c._id,
      name: c.name || c.customerName,
      village: c.village || 'ग्राम',
      phone: c.phone || '',
      category: catLabel,
      categoryKey: catKey,
      weight: `${formatCleanNum(wtNum)} KG`,
      weightKg: wtNum,
      amount: pendNum > 0 ? `₹${formatCleanNum(pendNum)} बाकी` : 'चुकाया',
      isPending: pendNum > 0,
      pendingBalance: pendNum,
      paid: paidNum,
      totalBill: totBill,
      totalOrdersCount: c.totalOrdersCount || (c.history ? c.history.length : 1),
      history: c.history || [],
      createdAt: c.createdAt,
      lastVisitDate: c.lastVisitDate,
      timestamp: ts,
      orderIndex: ts,
      timeDisplay,
    });
  });

  // 2. Merge backend API customers
  (customers || []).forEach((c, idx) => {
    const key = getCustomerDedupKey(c);
    const existing = custMap.get(key);
    const ts = getCustomerTimestamp(c);
    const timeDisplay = formatArrivalTime(c);

    if (!existing) {
      custMap.set(key, {
        ...c,
        timestamp: ts,
        orderIndex: ts,
        timeDisplay,
      });
    } else {
      const bestTs = Math.max(existing.timestamp || 0, ts || 0);
      custMap.set(key, {
        ...c,
        ...existing,
        id: c.id || c.customerId || c._id || existing.id,
        customerId: c.customerId || c.id || c._id || existing.customerId || existing.id,
        timestamp: bestTs,
        orderIndex: bestTs,
        timeDisplay: existing.timeDisplay || timeDisplay,
        amount: existing.amount || c.amount,
        isPending: existing.isPending !== undefined ? existing.isPending : c.isPending,
      });
    }
  });

  const effectiveCustomers = Array.from(custMap.values());

  // SORT BY ARRIVAL SEQUENCE:
  // 'latest' (DEFAULT): जो अभी नया आया उसका नाम सबसे ऊपर (#1 Bindo, #2 Jigri...)
  // 'first_come': जो पहले आया वो ऊपर
  effectiveCustomers.sort((a, b) => {
    const timeA = a.timestamp || getCustomerTimestamp(a) || 0;
    const timeB = b.timestamp || getCustomerTimestamp(b) || 0;
    if (sortOrder === 'latest') {
      if (timeA && timeB && timeA !== timeB) return timeB - timeA;
      return (b.orderIndex || 0) - (a.orderIndex || 0);
    } else {
      if (timeA && timeB && timeA !== timeB) return timeA - timeB;
      return (a.orderIndex || 0) - (b.orderIndex || 0);
    }
  });

  // Live real-time category counts strictly matching current customers on screen
  const countOil = effectiveCustomers.filter(c => c.categoryKey === 'oil').length;
  const countHaldi = effectiveCustomers.filter(c => c.categoryKey === 'haldi').length;
  const countDarra = effectiveCustomers.filter(c => c.categoryKey === 'darra').length;
  const countAtta = effectiveCustomers.filter(c => c.categoryKey === 'atta').length;
  const totalCount = effectiveCustomers.length;

  // Filtered customer list
  const filteredCustomers = effectiveCustomers.filter(c => {
    // Category filter
    if (selectedCategory && c.categoryKey !== selectedCategory) {
      return false;
    }
    // Search filter (name or village)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = c.name.toLowerCase().includes(q);
      const matchVillage = c.village.toLowerCase().includes(q);
      const matchCat = c.category.toLowerCase().includes(q);
      return matchName || matchVillage || matchCat;
    }
    return true;
  });

  const handleVoiceSearch = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    SpeechService.speak('ग्राहक का नाम या गाँव बोलें...');
  };

  const handleCategoryPress = (catKey) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    if (selectedCategory === catKey) {
      setSelectedCategory(null); // Toggle off if clicked again
    } else {
      setSelectedCategory(catKey);
    }
  };

  const handleCustomerPress = (customer) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    navigation.navigate('CustomerDashboard', {
      customerId: customer.customerId || customer.id,
      customer: {
        id: customer.customerId || customer.id,
        name: customer.name,
        village: customer.village,
        phone: customer.phone,
        category: customer.category,
        weight: customer.weight,
        weightKg: customer.weightKg || parseFloat(customer.weight) || 0,
        totalBill: customer.totalBill || (customer.isPending ? customer.pendingBalance || 100 : 100),
        totalBilled: Number(customer.totalBill) || (customer.pendingBalance || 0) + (customer.paid || 0) || 100,
        pendingBalance: customer.pendingBalance || (customer.isPending ? 100 : 0),
        paid: customer.paid || 0,
        totalPaid: customer.paid || 0,
        totalWeightMilledKg: customer.weightKg || parseFloat(customer.weight) || 0,
        totalOrdersCount: customer.totalOrdersCount || 1,
      },
    });
  };

  const handleTabPress = (tabId) => {
    if (tabId === 'home') navigation.navigate('Home');
    else if (tabId === 'khata') {
      // Already on customer dashboard, clear filters
      setSelectedCategory(null);
      setSearchQuery('');
    } else if (tabId === 'bill') navigation.navigate('BillPrint', { customerId: 'c1' });
    else if (tabId === 'history') navigation.navigate('DeliveryHistory');
    else if (tabId === 'settings') navigation.navigate('Settings');
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Main Layout Area */}
      <View style={[styles.mainLayout, { paddingTop: topSafePadding }]}>

        {/* ── 1. HEADER (Compact & Perfectly Aligned) ── */}
        <View style={styles.headerRow}>
          {/* Left: Hamburger menu */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={styles.hamburgerButton}
            accessibilityLabel="वापस जाएं"
          >
            <HamburgerMenuIcon />
          </TouchableOpacity>

          {/* Center-Left: Logo & Titles */}
          <View style={styles.headerCenter}>
            <Image
              source={customerLogoImg}
              style={styles.headerLogoImg}
              resizeMode="contain"
            />
            <View style={styles.headerTitleColumn}>
              <Text style={styles.headerMainTitle}>Total Customer</Text>
              <Text style={styles.headerSubtitle}>आज के ग्राहकों का पूरा रिकॉर्ड</Text>
            </View>
          </View>

          {/* Right: Calendar icon inside light green rounded container */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setCalendarModalVisible(true)}
            style={styles.calendarButton}
            accessibilityLabel="तारीख चुनें"
          >
            <Image
              source={customerCalBtnImg}
              style={styles.calendarBtnImg}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content (Single scrollable container) */}
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
          {/* ── 2. SEARCH BOX (Full Width, Name or Village) ── */}
          <View style={styles.searchBoxContainer}>
            <SearchMagnifierIcon />
            <TextInput
              style={styles.searchInput}
              placeholder="नाम या गाँव से ग्राहक खोजें..."
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

          {/* ── 3. TOTAL CUSTOMER CARD (Large White Card) ── */}
          <View style={styles.totalCustomerCard}>
            <View style={styles.totalCardLeft}>
              <Text style={styles.totalCardLabel}>कुल ग्राहक</Text>
              <Text style={styles.totalCardCountLarge}>{totalCount} ग्राहक</Text>
            </View>
            <Image
              source={iconUsersGroupImg}
              style={styles.totalUsersIconImg}
              resizeMode="contain"
            />
          </View>

          {/* ── 4. MILLING CATEGORY SECTION ("पिसाई के अनुसार ग्राहक") ── */}
          <View style={styles.sectionHeadingRow}>
            <View style={styles.verticalGreenBar} />
            <Text style={styles.sectionHeadingTitle}>पिसाई के अनुसार ग्राहक</Text>
          </View>

          {/* 2-Column Grid (4 Category Cards) */}
          <View style={styles.categoryGrid}>
            {/* Row 1: तेल पिराई & हल्दी पिसाई */}
            <View style={styles.categoryRow}>
              {/* Card 1: तेल पिराई */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleCategoryPress('oil')}
                style={[
                  styles.categoryCard,
                  selectedCategory === 'oil' && styles.categoryCardSelected,
                ]}
              >
                <Text style={styles.categoryNameText}>तेल पिराई</Text>
                <Text style={styles.categoryCountNumber}>{countOil}</Text>
                <Text style={styles.categorySubText}>ग्राहक</Text>
                <View style={styles.btnDekheWrapper}>
                  <View style={styles.btnDekhePill}>
                    <Text style={styles.btnDekheText}>
                      {selectedCategory === 'oil' ? 'हटाएं' : 'देखें'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Card 2: हल्दी पिसाई */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleCategoryPress('haldi')}
                style={[
                  styles.categoryCard,
                  selectedCategory === 'haldi' && styles.categoryCardSelected,
                ]}
              >
                <Text style={styles.categoryNameText}>हल्दी पिसाई</Text>
                <Text style={styles.categoryCountNumber}>{countHaldi}</Text>
                <Text style={styles.categorySubText}>ग्राहक</Text>
                <View style={styles.btnDekheWrapper}>
                  <View style={styles.btnDekhePill}>
                    <Text style={styles.btnDekheText}>
                      {selectedCategory === 'haldi' ? 'हटाएं' : 'देखें'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Row 2: दर्रा पिसाई & आटा पिसाई */}
            <View style={styles.categoryRow}>
              {/* Card 3: दर्रा पिसाई */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleCategoryPress('darra')}
                style={[
                  styles.categoryCard,
                  selectedCategory === 'darra' && styles.categoryCardSelected,
                ]}
              >
                <Text style={styles.categoryNameText}>दर्रा पिसाई</Text>
                <Text style={styles.categoryCountNumber}>{countDarra}</Text>
                <Text style={styles.categorySubText}>ग्राहक</Text>
                <View style={styles.btnDekheWrapper}>
                  <View style={styles.btnDekhePill}>
                    <Text style={styles.btnDekheText}>
                      {selectedCategory === 'darra' ? 'हटाएं' : 'देखें'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Card 4: आटा पिसाई */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleCategoryPress('atta')}
                style={[
                  styles.categoryCard,
                  selectedCategory === 'atta' && styles.categoryCardSelected,
                ]}
              >
                <Text style={styles.categoryNameText}>आटा पिसाई</Text>
                <Text style={styles.categoryCountNumber}>{countAtta}</Text>
                <Text style={styles.categorySubText}>ग्राहक</Text>
                <View style={styles.btnDekheWrapper}>
                  <View style={styles.btnDekhePill}>
                    <Text style={styles.btnDekheText}>
                      {selectedCategory === 'atta' ? 'हटाएं' : 'देखें'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── 5. CUSTOMER LIST SECTION ("ग्राहक सूची") ── */}
          <View style={styles.sectionHeadingRow}>
            <View style={styles.sectionHeadingLeft}>
              <View style={styles.verticalGreenBar} />
              <Text style={styles.sectionHeadingTitle}>ग्राहक सूची</Text>
            </View>

            <View style={styles.sectionHeadingActions}>
              {/* 1-Tap Sequence Sort Toggle Button: 'नए पहले (ऊपर)' vs 'पुराने से नया' */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  try { Haptics.selectionAsync(); } catch (e) {}
                  setSortOrder(prev => prev === 'latest' ? 'first_come' : 'latest');
                }}
                style={styles.sortTogglePill}
              >
                <Text style={styles.sortToggleText}>
                  {sortOrder === 'latest' ? '⚡ नए पहले (ऊपर)' : '⏱️ पुराने से नया'}
                </Text>
              </TouchableOpacity>

              {/* Show All Reset Button when filter is active */}
              {selectedCategory && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSelectedCategory(null)}
                  style={styles.resetFilterButton}
                >
                  <Text style={styles.resetFilterText}>सभी (✕)</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Customer Horizontal Cards */}
          <View style={styles.customerListContainer}>
            {filteredCustomers.length === 0 ? (
              <View style={styles.emptyListContainer}>
                <Text style={styles.emptyListText}>कोई ग्राहक रिकॉर्ड नहीं मिला</Text>
              </View>
            ) : (
              filteredCustomers.map((cust, index) => (
                <TouchableOpacity
                  key={cust.id || cust._id || cust.customerId || `cust_${index}`}
                  activeOpacity={0.8}
                  onPress={() => handleCustomerPress(cust)}
                  style={styles.customerCard}
                >
                  {/* Left: Token Badge + Customer Name · गाँव: Village */}
                  <View style={styles.custLeftCol}>
                    <View style={styles.custNameHeaderRow}>
                      <View style={styles.tokenPill}>
                        <Text style={styles.tokenPillText}>#{index + 1}</Text>
                      </View>
                      <Text style={styles.custNameText} numberOfLines={1}>
                        {cust.name}
                        <Text style={styles.custVillageText}> · गाँव: {cust.village}</Text>
                      </Text>
                    </View>
                    {cust.timeDisplay ? (
                      <Text style={styles.custTimeSubText}>🕒 {cust.timeDisplay}</Text>
                    ) : null}
                  </View>

                  {/* Middle: Category · Weight */}
                  <View style={styles.custMidCol}>
                    <Text style={styles.custCategoryText} numberOfLines={1}>
                      {cust.category} · {cust.weight}
                    </Text>
                  </View>

                  {/* Right: Amount or बाकी */}
                  <View style={styles.custRightCol}>
                    <Text
                      style={[
                        styles.custAmountText,
                        cust.isPending && styles.custPendingText,
                      ]}
                    >
                      {cust.amount}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Clean seamless spacing before bottom navigation dock */}
          <View style={{ height: 32 }} />
        </ScrollView>

        {/* ── 6. BOTTOM NAVIGATION DOCK (Home | Customer | Bill | Settings) ── */}
        <BottomDock activeTab="khata" onTabPress={handleTabPress} />
      </View>

      {/* ── INTERACTIVE VISUAL CALENDAR MODAL ── */}
      <ChakkiCalendarModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        onSelectDate={handleSelectCalendarDate}
        initialPeriod={selectedDateKey}
      />
    </View>
  );
};

// ─── STYLESHEET ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F0FAEF', // Very light mint green background (#F0FAEF)
  },
  mainLayout: {
    flex: 1,
    backgroundColor: '#F0FAEF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 16,
  },

  // 1. Header Styles
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0FAEF',
  },
  hamburgerButton: {
    width: 36,
    height: 36,
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
    fontWeight: '700',
    color: '#14233B', // Primary text Dark Navy Blue
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#778294',
    marginTop: 1,
  },
  calendarButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarBtnImg: {
    width: 42,
    height: 42,
  },

  // 2. Search Box Styles
  searchBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F5E8', // Light green background
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C9DED0', // Thin green border
    paddingHorizontal: 14,
    height: 48,
    marginVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#14233B',
    paddingHorizontal: 10,
    height: '100%',
  },
  micButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 3. Total Customer Card Styles (Large White Card)
  totalCustomerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C9DED0',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1.5,
  },
  totalCardLeft: {
    flex: 1,
  },
  totalCardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#14233B',
    marginBottom: 4,
  },
  totalCardCountLarge: {
    fontSize: 32,
    fontWeight: '800',
    color: '#14233B', // Main visual focus
    letterSpacing: -0.5,
  },
  totalUsersIconImg: {
    width: 44,
    height: 36,
  },

  // 4. Section Heading Styles
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 10,
  },
  sectionHeadingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionHeadingActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortTogglePill: {
    backgroundColor: '#E6F5E8',
    borderColor: '#28A66F',
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    marginRight: 6,
  },
  sortToggleText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#159B58',
  },
  verticalGreenBar: {
    width: 3.5,
    height: 18,
    backgroundColor: '#28A66F', // Accent Green
    borderRadius: 2,
    marginRight: 8,
  },
  sectionHeadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#14233B',
    flex: 1,
  },
  resetFilterButton: {
    backgroundColor: '#D1E7D8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#159B58',
  },

  // 5. Category Grid Styles (2-Column Grid)
  categoryGrid: {
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryCard: {
    width: (width - 44) / 2,
    height: 110,
    backgroundColor: '#E6F5E8', // Light mint green card background
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C9DED0',
    padding: 12,
    position: 'relative',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryCardSelected: {
    borderColor: '#28A66F',
    borderWidth: 2,
    backgroundColor: '#DCFCE7',
  },
  categoryNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#14233B',
    marginBottom: 2,
  },
  categoryCountNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#14233B',
  },
  categorySubText: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#778294',
    marginTop: -2,
  },
  btnDekheWrapper: {
    position: 'absolute',
    right: 10,
    bottom: 10,
  },
  btnDekhePill: {
    backgroundColor: '#28A66F', // Accent Green button
    borderRadius: 12,
    paddingVertical: 3.5,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDekheText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // 6. Customer List Styles
  customerListContainer: {
    marginTop: 4,
    marginBottom: 10,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C9DED0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  custLeftCol: {
    flex: 1.3,
  },
  custNameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  tokenPill: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: 5,
    alignSelf: 'center',
  },
  tokenPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1B5E20',
  },
  custNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14233B',
    flexShrink: 1,
  },
  custVillageText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#778294',
  },
  custTimeSubText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#778294',
    marginTop: 2,
    marginLeft: 1,
  },
  custMidCol: {
    flex: 1.1,
    paddingHorizontal: 6,
  },
  custCategoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  custRightCol: {
    width: 65,
    alignItems: 'flex-end',
  },
  custAmountText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#14233B',
  },
  custPendingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#778294', // 'बाकी' in soft grey/amber
  },
  emptyListContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 14,
    color: '#778294',
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
    borderColor: '#C9DED0',
    marginBottom: 8,
  },
  presetRowSelected: {
    backgroundColor: '#E6F5E8',
    borderColor: '#28A66F',
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14233B',
  },
  presetLabelSelected: {
    color: '#28A66F',
    fontWeight: '700',
  },
  presetDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#778294',
  },
  modalDoneButton: {
    backgroundColor: '#28A66F',
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
    backgroundColor: '#28A66F',
  },
  micStand: {
    width: 12,
    height: 5,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: 1.6,
    borderColor: '#28A66F',
    borderTopWidth: 0,
    marginTop: -2,
  },
  micBase: {
    width: 6,
    height: 1.8,
    backgroundColor: '#28A66F',
    borderRadius: 1,
    marginTop: 1,
  },
});

export default TotalCustomerDashboardScreen;

