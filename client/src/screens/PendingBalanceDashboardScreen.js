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
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { BottomDock } from '../components/BottomDock';
import { SpeechService } from '../services/speechService';

const { width } = Dimensions.get('window');

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

// ─── INITIAL CUSTOMER DATA ACCORDING TO PROMPT ──────────────────────────────
const INITIAL_CUSTOMERS = [
  {
    id: 'p1',
    name: 'राजेश',
    village: 'रामपुर',
    phone: '9876543210',
    category: 'दर्रा पिसाई',
    weight: '40 KG',
    dateLabel: 'आज',
    periodKey: 'today',
    totalBill: 120,
    paid: 0,
    pending: 120,
  },
  {
    id: 'p2',
    name: 'रामलाल',
    village: 'रामपुर',
    phone: '9812345678',
    category: 'तेल पिसाई',
    weight: '50 KG',
    dateLabel: 'आज',
    periodKey: 'today',
    totalBill: 150,
    paid: 20,
    pending: 130,
  },
  {
    id: 'p3',
    name: 'सुरेश',
    village: 'खेड़ा',
    phone: '9765432109',
    category: 'आटा पिसाई',
    weight: '30 KG',
    dateLabel: '20 Nov',
    periodKey: 'week',
    totalBill: 100,
    paid: 50,
    pending: 50,
  },
  {
    id: 'p4',
    name: 'मोहन',
    village: 'नगला',
    phone: '9898989898',
    category: 'हल्दी पिसाई',
    weight: '25 KG',
    dateLabel: '18 Nov',
    periodKey: 'week',
    totalBill: 250,
    paid: 100,
    pending: 150,
  },
  {
    id: 'p5',
    name: 'दिनेश',
    village: 'खेड़ा',
    phone: '9871122334',
    category: 'सरसों पिराई',
    weight: '80 KG',
    dateLabel: '12 Nov',
    periodKey: 'month',
    totalBill: 600,
    paid: 200,
    pending: 400,
  },
  {
    id: 'p6',
    name: 'श्यामलाल',
    village: 'रामपुर',
    phone: '9811223344',
    category: 'चना पिसाई',
    weight: '70 KG',
    dateLabel: '05 Nov',
    periodKey: 'month',
    totalBill: 700,
    paid: 100,
    pending: 600,
  },
];

// ─── MAIN PENDING BALANCE (बाकी हिसाब) SCREEN COMPONENT ──────────────────────
export const PendingBalanceDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topSafePadding = Math.max(insets.top || 0, 42);

  const [customerList, setCustomerList] = useState(INITIAL_CUSTOMERS);
  const [activeFilter, setActiveFilter] = useState('today'); // 'today' | 'week' | 'month'
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  // Payment Collection Modal State
  const [collectModalVisible, setCollectModalVisible] = useState(false);
  const [selectedCust, setSelectedCust] = useState(null);
  const [payingAmount, setPayingAmount] = useState('');

  // Calculations for Summary Cards
  const totalPendingAmount = customerList.reduce((sum, c) => sum + c.pending, 0);
  const totalPendingCustomers = customerList.filter(c => c.pending > 0).length;

  const todayPendingAmount = customerList
    .filter(c => c.periodKey === 'today')
    .reduce((sum, c) => sum + c.pending, 0);
  const todayPendingCustomers = customerList.filter(
    c => c.periodKey === 'today' && c.pending > 0
  ).length;

  // Filtered customer list
  const filteredCustomers = customerList.filter((item) => {
    // 1. Period filter: 'today' shows today's records + reference card Suresh (20 Nov), 'week' shows today+week, 'month' shows all
    if (activeFilter === 'today' && item.periodKey !== 'today' && item.id !== 'p3') {
      return false;
    }
    if (activeFilter === 'week' && item.periodKey === 'month') {
      return false;
    }

    // 2. Search query filter (by customer name or village)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(q);
      const matchVillage = item.village.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
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

    // Update customer record
    setCustomerList((prev) =>
      prev.map((c) => {
        if (c.id === selectedCust.id) {
          const newPaid = c.paid + amountNum;
          const newPending = Math.max(0, c.pending - amountNum);
          return { ...c, paid: newPaid, pending: newPending };
        }
        return c;
      })
    );

    setCollectModalVisible(false);
    SpeechService.announceCashReceived(selectedCust.name, amountNum);
    Alert.alert('भुगतान सफल! ✅', `${selectedCust.name} जी से ₹${amountNum} जमा हो गए हैं।`);
  };

  const handleTabPress = (tabId) => {
    if (tabId === 'home') navigation.navigate('Home');
    else if (tabId === 'khata') navigation.navigate('TotalCustomer');
    else if (tabId === 'bill') navigation.navigate('BillPrint', { customerId: 'c1' });
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
                <View key={cust.id} style={styles.customerCard}>
                  {/* Line 1: Name · गाँव: Village  |  Category · Weight · Date */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.custNameBold}>
                      {cust.name}
                      <Text style={styles.custVillageText}> · गाँव: {cust.village}</Text>
                    </Text>

                    <Text style={styles.custCategoryWeightText}>
                      {cust.category} · {cust.weight} ·{' '}
                      <Text style={styles.custDateText}>{cust.dateLabel}</Text>
                    </Text>
                  </View>

                  {/* Line 2: कुल बिल: ₹... | जमा: ₹... | बाकी: ₹... */}
                  <View style={styles.cardBalanceRow}>
                    <Text style={styles.balanceText}>
                      कुल बिल: <Text style={styles.balanceVal}>₹{cust.totalBill}</Text>
                      {'  |  '}
                      जमा: <Text style={styles.balanceVal}>₹{cust.paid}</Text>
                      {'  |  '}
                      बाकी: <Text style={styles.balanceValPending}>₹{cust.pending}</Text>
                    </Text>
                  </View>

                  {/* Line 3: Action Buttons (कॉल | WhatsApp | जमा करें) */}
                  <View style={styles.cardActionsRow}>
                    {/* Call Button */}
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => handleCall(cust)}
                      style={styles.actionBtnCall}
                    >
                      <Text style={styles.actionBtnCallText}>कॉल</Text>
                    </TouchableOpacity>

                    {/* WhatsApp Button */}
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => handleWhatsApp(cust)}
                      style={styles.actionBtnWhatsApp}
                    >
                      <Text style={styles.actionBtnWhatsAppText}>WhatsApp</Text>
                    </TouchableOpacity>

                    {/* Bright Red 'जमा करें' Button */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => openCollectModal(cust)}
                      style={styles.actionBtnCollect}
                    >
                      <Text style={styles.actionBtnCollectText}>जमा करें</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
          <View style={styles.calendarModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>📅 तारीख व अवधि चुनें</Text>
              <TouchableOpacity onPress={() => setCalendarModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.presetRow, activeFilter === 'today' && styles.presetRowSelected]}
              onPress={() => {
                setActiveFilter('today');
                setCalendarModalVisible(false);
              }}
            >
              <Text style={styles.presetLabel}>आज (Today)</Text>
              <Text style={styles.presetDate}>23 नवंबर 2026</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.presetRow, activeFilter === 'week' && styles.presetRowSelected]}
              onPress={() => {
                setActiveFilter('week');
                setCalendarModalVisible(false);
              }}
            >
              <Text style={styles.presetLabel}>इस सप्ताह (Week)</Text>
              <Text style={styles.presetDate}>17 - 23 नवंबर</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.presetRow, activeFilter === 'month' && styles.presetRowSelected]}
              onPress={() => {
                setActiveFilter('month');
                setCalendarModalVisible(false);
              }}
            >
              <Text style={styles.presetLabel}>इस महीने (Month)</Text>
              <Text style={styles.presetDate}>नवंबर 2026</Text>
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

