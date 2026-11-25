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
  Alert,
  Linking,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { BottomDock } from '../components/BottomDock';
import { SpeechService } from '../services/speechService';
import { DashboardApiService } from '../services/dashboardApiService';
import { CustomerApiService } from '../services/customerApiService';
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

// ─── HIGH-DEFINITION ASSETS ─────────────────────────────────────────────────
const pendingCalBtnImg = require('../../assets/pending/pending_cal_btn.png');
const pendingBottomWaveImg = require('../../assets/pending/pending_bottom_wave.png');

// ─── VECTOR MINI ICONS ──────────────────────────────────────────────────────
const BackArrowIcon = () => (
  <View style={iconStyles.backArrowWrapper}>
    <View style={iconStyles.arrowStem} />
    <View style={iconStyles.arrowHeadTop} />
    <View style={iconStyles.arrowHeadBottom} />
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

// ─── MAIN PENDING BALANCE (बाकी हिसाब) SCREEN COMPONENT ──────────────────────
export const PendingBalanceDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topSafePadding = Math.max(insets.top || 0, 42);
  const { stats, customers: contextCustomers, recordCustomerPayment, refreshStats } = useChakki();

  const [customerList, setCustomerList] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalPendingAmount: 0,
    totalPendingCustomers: 0,
    todayPendingAmount: 0,
    todayPendingCustomers: 0,
  });
  const [activeFilter, setActiveFilter] = useState('today'); // 'today' | 'week' | 'month'
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Payment Collection Modal State
  const [collectModalVisible, setCollectModalVisible] = useState(false);
  const [selectedCust, setSelectedCust] = useState(null);
  const [payingAmount, setPayingAmount] = useState('');

  const fetchPendingData = useCallback(async () => {
    try {
      const data = await DashboardApiService.getPending();
      if (data) {
        setCustomerList(data.customers || []);
        setSummaryStats({
          totalPendingAmount: data.totalPendingAmount || 0,
          totalPendingCustomers: data.totalPendingCustomers || 0,
          todayPendingAmount: data.todayPendingAmount || 0,
          todayPendingCustomers: data.todayPendingCustomers || 0,
        });
      }
    } catch (err) {
      console.warn('Real pending dues fetch error:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchPendingData();
  }, [fetchPendingData, stats?.pendingDebt]);

  // Auto-reload on screen focus so newly added entries show immediately
  useEffect(() => {
    const unsub = navigation?.addListener ? navigation.addListener('focus', () => {
      fetchPendingData();
    }) : undefined;
    return unsub;
  }, [navigation, fetchPendingData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingData();
    setRefreshing(false);
  };

  // Resilient live-merged debtor list combining contextCustomers and API data
  const map = new Map();

  // 1. Live context customers with pending balance
  (contextCustomers || [])
    .filter((c) => (c.pendingBalance || 0) > 0)
    .forEach((c) => {
      const key = getCustomerDedupKey(c);
      const wt = Number(c.totalPisaiKg || c.weightKg || 40);
      const pend = Number(c.pendingBalance) || 0;
      const pd = Number(c.paidAmount || c.paid || 0);
      const tot = Number(c.totalBill || (pend + pd));
      const ts = getCustomerTimestamp(c);
      const timeStr = formatArrivalTime(c) || 'आज';

      map.set(key, {
        id: c.id || c._id,
        customerId: c.id || c._id,
        name: c.name || c.customerName,
        village: c.village || 'ग्राम',
        phone: c.phone || '',
        category: c.lastItemMilled || 'गेहूं पिसाई',
        weight: `${formatCleanNum(wt)} KG`,
        weightKg: wt,
        dateLabel: timeStr,
        periodKey: 'today',
        totalBill: formatCleanNum(tot),
        paid: pd,
        pending: pend,
        totalOrdersCount: c.totalOrdersCount || (c.history ? c.history.length : 1),
        history: c.history || [],
        timestamp: ts,
        orderIndex: ts,
      });
    });

  // 2. Merge backend API customers
  (customerList || []).forEach((c) => {
    const key = getCustomerDedupKey(c);
    const pend = Number(c.pending || c.pendingBalance || 0);
    if (pend <= 0) return;
    const existing = map.get(key);
    const ts = getCustomerTimestamp(c);
    const timeStr = formatArrivalTime(c) || c.dateLabel || 'आज';

    if (!existing) {
      const wt = Number(c.weightKg || parseFloat(c.weight) || 40);
      const pd = Number(c.paid || c.amountPaid || 0);
      const tot = Number(c.totalBill || c.totalAmount || (pend + pd));
      map.set(key, {
        ...c,
        id: c.id || c.customerId || c._id,
        customerId: c.id || c.customerId || c._id,
        name: c.name || c.customerName,
        village: c.village || 'ग्राम',
        phone: c.phone || '',
        category: c.category || c.itemLabel || 'गेहूं पिसाई',
        weight: c.weight || `${formatCleanNum(wt)} KG`,
        weightKg: wt,
        dateLabel: timeStr,
        totalBill: formatCleanNum(tot),
        paid: pd,
        pending: pend,
        totalOrdersCount: c.totalOrdersCount || 1,
        timestamp: ts,
        orderIndex: ts,
      });
    } else {
      const bestTs = Math.max(existing.timestamp || 0, ts || 0);
      map.set(key, {
        ...c,
        ...existing,
        id: c.id || c.customerId || c._id || existing.id,
        customerId: c.customerId || c.id || c._id || existing.customerId || existing.id,
        weightKg: existing.weightKg || c.weightKg,
        totalBill: existing.totalBill || c.totalBill,
        totalOrdersCount: existing.totalOrdersCount || c.totalOrdersCount,
        dateLabel: existing.dateLabel || timeStr,
        timestamp: bestTs,
        orderIndex: bestTs,
      });
    }
  });

  const effectiveCustomerList = Array.from(map.values());

  // Sort by arrival sequence: latest / newest entries at the top
  effectiveCustomerList.sort((a, b) => {
    const timeA = a.timestamp || getCustomerTimestamp(a) || 0;
    const timeB = b.timestamp || getCustomerTimestamp(b) || 0;
    if (timeA && timeB && timeA !== timeB) return timeB - timeA;
    return (b.orderIndex || 0) - (a.orderIndex || 0);
  });
  const dynamicPendingSum = effectiveCustomerList.reduce((acc, curr) => acc + (Number(curr.pending) || 0), 0);

  // Calculations for Summary Cards with immediate context fallback
  const totalPendingAmount = Math.max(
    Number(summaryStats.totalPendingAmount) || 0,
    Number(stats?.pendingDebt) || 0,
    dynamicPendingSum
  );
  const totalPendingCustomers = Math.max(
    Number(summaryStats.totalPendingCustomers) || 0,
    effectiveCustomerList.length
  );
  const todayPendingAmount = Math.max(
    Number(summaryStats.todayPendingAmount) || 0,
    dynamicPendingSum
  );
  const todayPendingCustomers = Math.max(
    Number(summaryStats.todayPendingCustomers) || 0,
    effectiveCustomerList.length
  );

  // Filtered customer list
  const filteredCustomers = effectiveCustomerList.filter((item) => {
    // 1. Period filter
    if (activeFilter === 'today' && item.periodKey && item.periodKey !== 'today') {
      return false;
    }
    if (activeFilter === 'week' && item.periodKey === 'month') {
      return false;
    }

    // 2. Search query filter (by customer name or village)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (item.name || '').toLowerCase().includes(q);
      const matchVillage = (item.village || '').toLowerCase().includes(q);
      const matchCat = (item.category || '').toLowerCase().includes(q);
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

  const handleOpenKhata = (cust) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    navigation.navigate('CustomerDashboard', {
      customerId: cust.customerId || cust.id,
      customer: {
        id: cust.customerId || cust.id,
        name: cust.name,
        village: cust.village,
        phone: cust.phone,
        category: cust.category,
        weight: cust.weight,
        weightKg: cust.weightKg || parseFloat(cust.weight) || 0,
        totalBill: cust.totalBill || cust.pending,
        totalBilled: Number(cust.totalBill) || (Number(cust.pending) + Number(cust.paid || 0)),
        pendingBalance: Number(cust.pending) || 0,
        paid: Number(cust.paid) || 0,
        totalPaid: Number(cust.paid) || 0,
        totalOrdersCount: cust.totalOrdersCount || 1,
      },
    });
  };

  const handleCall = (cust) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    Linking.openURL(`tel:${cust.phone}`).catch(() => {
      Alert.alert('कॉल करें', `${cust.name} जी का फोन नंबर: ${cust.phone}`);
    });
  };

  const handleWhatsApp = (cust) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    const msg = `नमस्ते ${cust.name} जी! आपकी चक्की पिसाई (${cust.category}) का कुल बाकी हिसाब ₹${cust.pending} है। कृपया समय पर भुगतान करने की कृपा करें। धन्यवाद!`;
    const url = `whatsapp://send?phone=91${cust.phone}&text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Sent', `${cust.name} जी को बाकी हिसाब ₹${cust.pending} का मैसेज भेज दिया गया है।`);
    });
  };

  const openCollectModal = (cust) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    setSelectedCust(cust);
    setPayingAmount(String(cust.pending));
    setCollectModalVisible(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedCust) return;
    const amountNum = parseInt(payingAmount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('गलत राशि', 'कृपया सही जमा राशि दर्ज करें।');
      return;
    }

    // 1. Immediately update ChakkiContext: increases todayEarnings & decreases pendingDebt
    if (recordCustomerPayment) {
      recordCustomerPayment({
        customerId: selectedCust.customerId || selectedCust.id,
        customerName: selectedCust.name,
        amount: amountNum,
        paymentMethod: 'CASH',
      });
    }
    if (refreshStats) {
      refreshStats();
    }

    // 2. Persist debt payment in CustomerApiService / backend
    CustomerApiService.recordDebtPayment(selectedCust.customerId || selectedCust.id, {
      amountPaid: amountNum,
      paymentMethod: 'CASH',
    }).catch((e) => console.warn('PendingScreen debt payment sync warn:', e.message));

    // 3. Immediately update local summary stats
    setSummaryStats((prev) => ({
      ...prev,
      totalPendingAmount: Math.max(0, (Number(prev.totalPendingAmount) || 0) - amountNum),
      todayPendingAmount: Math.max(0, (Number(prev.todayPendingAmount) || 0) - amountNum),
    }));

    // 4. Update customer record in local list & remove if fully settled
    setCustomerList((prev) =>
      prev
        .map((c) => {
          const isMatch =
            String(c.id || c.customerId) === String(selectedCust.id || selectedCust.customerId) ||
            c.name?.toLowerCase() === selectedCust.name?.toLowerCase();
          if (isMatch) {
            const newPaid = (Number(c.paid) || 0) + amountNum;
            const newPending = Math.max(0, (Number(c.pending) || 0) - amountNum);
            return { ...c, paid: newPaid, pending: newPending };
          }
          return c;
        })
        .filter((c) => (Number(c.pending) || 0) > 0)
    );

    setCollectModalVisible(false);
    SpeechService.announceCashReceived(selectedCust.name, amountNum);
    Alert.alert('भुगतान सफल! ✅', `${selectedCust.name} जी से ₹${amountNum} जमा हो गए हैं।`);
  };

  const handleTabPress = (tabId) => {
    if (tabId === 'home') navigation.navigate('Home');
    else if (tabId === 'khata') navigation.navigate('TotalCustomer');
    else if (tabId === 'bill') navigation.navigate('BillPrint', { customerId: 'c1' });
    else if (tabId === 'history') navigation.navigate('DeliveryHistory');
    else if (tabId === 'settings') navigation.navigate('Settings');
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Main Layout Area */}
      <View style={[styles.mainLayout, { paddingTop: topSafePadding }]}>

        {/* ── 1. HEADER SECTION (Back Arrow, Title & Subtitle, Calendar) ── */}
        <View style={styles.headerRow}>
          {/* Left: Back Arrow Icon */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityLabel="वापस जाएं"
          >
            <BackArrowIcon />
          </TouchableOpacity>

          {/* Center: Title & Subtitle */}
          <View style={styles.headerCenter}>
            <Text style={styles.headerMainTitle}>बाकी हिसाब</Text>
            <Text style={styles.headerSubtitle}>उधार और बाकी पैसों का पूरा विवरण</Text>
          </View>

          {/* Right: Calendar Icon inside Light Green Rounded Square */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setCalendarModalVisible(true)}
            style={styles.calendarButton}
            accessibilityLabel="तारीख चुनें"
          >
            <Image
              source={pendingCalBtnImg}
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
          {/* ── 2. SUMMARY CARDS (Two Equal Horizontal Cards) ── */}
          <View style={styles.summaryCardsRow}>
            {/* Card 1: कुल बाकी पैसा */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardLabel}>कुल बाकी पैसा</Text>
              <Text style={styles.summaryCardAmount}>
                ₹{totalPendingAmount.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.summaryCardSubtext}>
                कुल बाकी ग्राहक: {totalPendingCustomers}
              </Text>
            </View>

            {/* Card 2: आज का बाकी */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardLabel}>आज का बाकी</Text>
              <Text style={styles.summaryCardAmount}>
                ₹{todayPendingAmount.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.summaryCardSubtext}>
                आज के ग्राहक: {todayPendingCustomers}
              </Text>
            </View>
          </View>

          {/* ── 3. SEARCH BOX (Search Icon, Placeholder, Voice Mic) ── */}
          <View style={styles.searchBoxContainer}>
            <SearchMagnifierIcon />
            <TextInput
              style={styles.searchInput}
              placeholder="नाम या गाँव से बाकी हिसाब खोजें..."
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

          {/* ── 4. FILTER BUTTONS (आज, इस सप्ताह, इस महीने) ── */}
          <View style={styles.filterButtonsRow}>
            {/* Button 1: आज (Today) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter('today');
              }}
              style={[
                styles.filterPill,
                activeFilter === 'today' ? styles.filterPillActive : styles.filterPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'today'
                    ? styles.filterPillTextActive
                    : styles.filterPillTextInactive,
                ]}
              >
                आज (Today)
              </Text>
            </TouchableOpacity>

            {/* Button 2: इस सप्ताह (Week) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter('week');
              }}
              style={[
                styles.filterPill,
                activeFilter === 'week' ? styles.filterPillActive : styles.filterPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'week'
                    ? styles.filterPillTextActive
                    : styles.filterPillTextInactive,
                ]}
              >
                इस सप्ताह (Week)
              </Text>
            </TouchableOpacity>

            {/* Button 3: इस महीने (Month) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter('month');
              }}
              style={[
                styles.filterPill,
                activeFilter === 'month' ? styles.filterPillActive : styles.filterPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'month'
                    ? styles.filterPillTextActive
                    : styles.filterPillTextInactive,
                ]}
              >
                इस महीने (Month)
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── 5. CUSTOMER LIST SECTION ("ग्राहकों की लिस्ट") ── */}
          <View style={styles.sectionHeadingRow}>
            <View style={styles.verticalGreenBar} />
            <Text style={styles.sectionHeadingTitle}>ग्राहकों की लिस्ट</Text>
          </View>

          {/* Customer Cards List */}
          <View style={styles.customerCardsList}>
            {filteredCustomers.length === 0 ? (
              <View style={styles.emptyCardContainer}>
                <Text style={styles.emptyCardText}>कोई बाकी हिसाब नहीं मिला</Text>
              </View>
            ) : (
              filteredCustomers.map((cust) => (
                <TouchableOpacity
                  key={cust.id || cust.customerId || cust.name}
                  activeOpacity={0.88}
                  onPress={() => handleOpenKhata(cust)}
                  style={styles.customerCard}
                >
                  {/* Line 1: Name · गाँव: Village  |  Category · Weight · Date (Tappable to view Khata Passbook) */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.custNameBold}>
                      {cust.name}
                      <Text style={styles.custVillageText}> · गाँव: {cust.village}</Text>
                    </Text>

                    <Text style={styles.custCategoryWeightText}>
                      {cust.category} · {cust.weight} ·{' '}
                      <Text style={styles.custDateText}>{cust.dateLabel}</Text>
                      {' ❯'}
                    </Text>
                  </View>

                  {/* Line 2: कुल बिल: ₹... | जमा: ₹... | बाकी: ₹... */}
                  <View style={styles.cardBalanceRow}>
                    <Text style={styles.balanceText}>
                      कुल बिल: <Text style={styles.balanceVal}>₹{formatCleanNum(cust.totalBill)}</Text>
                      {'  |  '}
                      जमा: <Text style={styles.balanceVal}>₹{formatCleanNum(cust.paid)}</Text>
                      {'  |  '}
                      बाकी: <Text style={styles.balanceValPending}>₹{formatCleanNum(cust.pending)}</Text>
                    </Text>
                  </View>

                  {/* Line 3: Action Buttons (कॉल | WhatsApp | जमा करें) */}
                  <View style={styles.cardActionsRow}>
                    {/* Call Button */}
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        handleCall(cust);
                      }}
                      style={styles.actionBtnCall}
                    >
                      <Text style={styles.actionBtnCallText}>कॉल</Text>
                    </TouchableOpacity>

                    {/* WhatsApp Button */}
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        handleWhatsApp(cust);
                      }}
                      style={styles.actionBtnWhatsApp}
                    >
                      <Text style={styles.actionBtnWhatsAppText}>WhatsApp</Text>
                    </TouchableOpacity>

                    {/* Bright Red 'जमा करें' Button */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        openCollectModal(cust);
                      }}
                      style={styles.actionBtnCollect}
                    >
                      <Text style={styles.actionBtnCollectText}>जमा करें</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* ── 6. BOTTOM DECORATIVE WAVY DESIGN ── */}
          <View style={styles.waveFooterWrapper}>
            <Image
              source={pendingBottomWaveImg}
              style={styles.bottomWaveImg}
              resizeMode="stretch"
            />
          </View>

          {/* Bottom spacing before bottom dock */}
          <View style={{ height: 16 }} />
        </ScrollView>

        {/* ── 7. BOTTOM NAVIGATION DOCK (Home | Customer | Bill | Settings) ── */}
        <BottomDock activeTab="bill" onTabPress={handleTabPress} />
      </View>

      {/* ── PAYMENT COLLECTION MODAL ('जमा करें') ── */}
      <Modal
        visible={collectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCollectModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setCollectModalVisible(false)}
          style={styles.modalBackdrop}
        >
          <View style={styles.collectModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>💰 बकाया राशि जमा करें</Text>
              <TouchableOpacity onPress={() => setCollectModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedCust && (
              <View style={styles.collectDetailsContainer}>
                <Text style={styles.collectCustName}>
                  ग्राहक: <Text style={{ fontWeight: '700' }}>{selectedCust.name}</Text> (गाँव: {selectedCust.village})
                </Text>
                <Text style={styles.collectPendingText}>
                  कुल बाकी: <Text style={{ fontWeight: '800', color: '#DC2626' }}>₹{selectedCust.pending}</Text>
                </Text>

                <Text style={styles.inputLabel}>जमा की जा रही राशि (₹):</Text>
                <TextInput
                  style={styles.collectInput}
                  keyboardType="numeric"
                  value={payingAmount}
                  onChangeText={setPayingAmount}
                  placeholder="राशि दर्ज करें"
                  placeholderTextColor="#778294"
                  autoFocus
                />

                <TouchableOpacity
                  style={styles.confirmPaymentBtn}
                  onPress={handleConfirmPayment}
                >
                  <Text style={styles.confirmPaymentBtnText}>₹ जमा पुष्टि करें (Confirm)</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── INTERACTIVE VISUAL CALENDAR MODAL ── */}
      <ChakkiCalendarModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        onSelectDate={(dateObj) => {
          if (dateObj.period === 'weekly') setActiveFilter('week');
          else if (dateObj.period === 'monthly') setActiveFilter('month');
          else setActiveFilter('today');
        }}
        initialPeriod={activeFilter === 'week' ? 'weekly' : activeFilter === 'month' ? 'monthly' : 'today'}
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
    paddingBottom: 90,
  },

  // 1. Header Styles
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F0FAEF',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 10,
  },
  headerMainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#14233B', // Dark Navy Blue
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
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

  // 2. Summary Cards Styles (Two Equal Horizontal Cards)
  summaryCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  summaryCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C9DED0',
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryCardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#14233B',
    marginBottom: 4,
  },
  summaryCardAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#14233B',
    letterSpacing: -0.5,
  },
  summaryCardSubtext: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#159B58', // Green subtext
    marginTop: 4,
  },

  // 3. Search Box Styles
  searchBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C9DED0',
    paddingHorizontal: 14,
    height: 48,
    marginVertical: 6,
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

  // 4. Filter Buttons Styles
  filterButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 8,
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#28A66F', // Natural green
    borderColor: '#28A66F',
  },
  filterPillInactive: {
    backgroundColor: '#E6F5E8', // Light mint green
    borderColor: '#C9DED0',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterPillTextInactive: {
    color: '#14233B',
  },

  // 5. Section Heading Styles
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  verticalGreenBar: {
    width: 3.5,
    height: 18,
    backgroundColor: '#28A66F',
    borderRadius: 2,
    marginRight: 8,
  },
  sectionHeadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#14233B',
  },

  // 6. Customer Cards List Styles
  customerCardsList: {
    marginBottom: 10,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#C9DED0',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  custNameBold: {
    fontSize: 15,
    fontWeight: '700',
    color: '#14233B',
  },
  custVillageText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#778294',
  },
  custCategoryWeightText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#14233B',
  },
  custDateText: {
    color: '#159B58',
    fontWeight: '600',
  },
  cardBalanceRow: {
    marginBottom: 12,
  },
  balanceText: {
    fontSize: 13.5,
    color: '#475569',
  },
  balanceVal: {
    fontWeight: '700',
    color: '#14233B',
  },
  balanceValPending: {
    fontWeight: '800',
    color: '#DC2626', // Red color for pending amount
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  actionBtnCall: {
    backgroundColor: '#EEF9EF',
    borderWidth: 1,
    borderColor: '#28A66F',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  actionBtnCallText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#159B58',
  },
  actionBtnWhatsApp: {
    backgroundColor: '#EEF9EF',
    borderWidth: 1,
    borderColor: '#28A66F',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  actionBtnWhatsAppText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#159B58',
  },
  actionBtnCollect: {
    backgroundColor: '#DC2626', // Bright red background strictly as requested
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginLeft: 'auto', // Pushed to the right
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  actionBtnCollectText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyCardContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 14,
    color: '#778294',
  },

  // 7. Bottom Wave
  waveFooterWrapper: {
    width: '100%',
    height: 44,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 6,
  },
  bottomWaveImg: {
    width: '100%',
    height: '100%',
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  collectModalCard: {
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
  calendarModalCard: {
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
  collectDetailsContainer: {
    marginTop: 4,
  },
  collectCustName: {
    fontSize: 15,
    color: '#14233B',
    marginBottom: 4,
  },
  collectPendingText: {
    fontSize: 15,
    color: '#14233B',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  collectInput: {
    backgroundColor: '#F8FAF8',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#28A66F',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#14233B',
    marginBottom: 16,
  },
  confirmPaymentBtn: {
    backgroundColor: '#159B58',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmPaymentBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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
  backArrowWrapper: {
    width: 24,
    height: 24,
    position: 'relative',
    justifyContent: 'center',
  },
  arrowStem: {
    width: 18,
    height: 2.4,
    backgroundColor: '#14233B',
    borderRadius: 1.2,
    marginLeft: 2,
  },
  arrowHeadTop: {
    position: 'absolute',
    left: 2,
    top: 6,
    width: 9,
    height: 2.4,
    backgroundColor: '#14233B',
    borderRadius: 1.2,
    transform: [{ rotate: '-45deg' }],
  },
  arrowHeadBottom: {
    position: 'absolute',
    left: 2,
    bottom: 6,
    width: 9,
    height: 2.4,
    backgroundColor: '#14233B',
    borderRadius: 1.2,
    transform: [{ rotate: '45deg' }],
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

export default PendingBalanceDashboardScreen;

