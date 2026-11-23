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
const customerLogoImg = require('../../assets/customer/customer_logo.png');
const customerCalBtnImg = require('../../assets/customer/customer_cal_btn.png');
const iconUsersGroupImg = require('../../assets/customer/icon_users_group.png');
const customerBottomWaveImg = require('../../assets/customer/customer_bottom_wave.png');

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

// ─── SAMPLE DYNAMIC CUSTOMER RECORDS ────────────────────────────────────────
const INITIAL_CUSTOMERS = [
  {
    id: 'c1',
    name: 'रामलाल',
    village: 'रामपुर',
    category: 'तेल पिराई',
    categoryKey: 'oil',
    weight: '50 KG',
    amount: '₹150',
    isPending: false,
  },
  {
    id: 'c2',
    name: 'मोहन',
    village: 'नगला',
    category: 'हल्दी पिसाई',
    categoryKey: 'haldi',
    weight: '20 KG',
    amount: '₹200',
    isPending: false,
  },
  {
    id: 'c3',
    name: 'सुरेश',
    village: 'खेड़ा',
    category: 'आटा पिसाई',
    categoryKey: 'atta',
    weight: '30 KG',
    amount: '₹100',
    isPending: false,
  },
  {
    id: 'c4',
    name: 'राजेश',
    village: 'रामपुर',
    category: 'दर्रा पिसाई',
    categoryKey: 'darra',
    weight: '40 KG',
    amount: 'बाकी',
    isPending: true,
  },
];

// ─── DATE PRESETS ───────────────────────────────────────────────────────────
const DATE_PRESETS = [
  { key: 'today', label: 'आज (Today)', dateStr: '23 नवंबर 2026' },
  { key: 'yesterday', label: 'कल (Yesterday)', dateStr: '22 नवंबर 2026' },
  { key: 'week', label: 'पिछले 7 दिन (Last 7 Days)', dateStr: '17 - 23 नवंबर' },
  { key: 'month', label: 'इस महीने (November 2026)', dateStr: '1 - 23 नवंबर' },
];

// ─── TOTAL CUSTOMER DASHBOARD SCREEN COMPONENT ──────────────────────────────
export const TotalCustomerDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topSafePadding = Math.max(insets.top || 0, 42);

  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null); // 'oil' | 'haldi' | 'darra' | 'atta' | null
  const [selectedDateKey, setSelectedDateKey] = useState('today');
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  // Dynamic counts per category
  const countOil = customers.filter(c => c.categoryKey === 'oil').length;
  const countHaldi = customers.filter(c => c.categoryKey === 'haldi').length;
  const countDarra = customers.filter(c => c.categoryKey === 'darra').length;
  const countAtta = customers.filter(c => c.categoryKey === 'atta').length;
  const totalCount = customers.length;

  // Filtered customer list
  const filteredCustomers = customers.filter(c => {
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
    navigation.navigate('BillPrint', {
      customerId: customer.id,
      customerName: customer.name,
      item: customer.category,
      weightKg: parseInt(customer.weight) || 25,
      totalAmount: customer.amount === 'बाकी' ? 120 : parseInt(customer.amount.replace('₹', '')) || 100,
    });
  };

  const handleTabPress = (tabId) => {
    if (tabId === 'home') navigation.navigate('Home');
    else if (tabId === 'khata') {
      // Already on customer dashboard, clear filters
      setSelectedCategory(null);
      setSearchQuery('');
    } else if (tabId === 'bill') navigation.navigate('BillPrint', { customerId: 'c1' });
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
            <View style={styles.verticalGreenBar} />
            <Text style={styles.sectionHeadingTitle}>ग्राहक सूची</Text>

            {/* Show All Reset Button when filter is active */}
            {selectedCategory && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedCategory(null)}
                style={styles.resetFilterButton}
              >
                <Text style={styles.resetFilterText}>सभी दिखाएं (✕)</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Customer Horizontal Cards */}
          <View style={styles.customerListContainer}>
            {filteredCustomers.length === 0 ? (
              <View style={styles.emptyListContainer}>
                <Text style={styles.emptyListText}>कोई ग्राहक रिकॉर्ड नहीं मिला</Text>
              </View>
            ) : (
              filteredCustomers.map((cust) => (
                <TouchableOpacity
                  key={cust.id}
                  activeOpacity={0.8}
                  onPress={() => handleCustomerPress(cust)}
                  style={styles.customerCard}
                >
                  {/* Left: Customer Name · गाँव: Village */}
                  <View style={styles.custLeftCol}>
                    <Text style={styles.custNameText} numberOfLines={1}>
                      {cust.name}
                      <Text style={styles.custVillageText}> · गाँव: {cust.village}</Text>
                    </Text>
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

          {/* Decorative Bottom Wave */}
          <View style={styles.waveFooterWrapper}>
            <Image
              source={customerBottomWaveImg}
              style={styles.bottomWaveImg}
              resizeMode="stretch"
            />
          </View>

          {/* Spacing before bottom dock */}
          <View style={{ height: 16 }} />
        </ScrollView>

        {/* ── 6. BOTTOM NAVIGATION DOCK (Home | Customer | Bill | Settings) ── */}
        <BottomDock activeTab="khata" onTabPress={handleTabPress} />
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

            {DATE_PRESETS.map((preset) => {
              const isSelected = selectedDateKey === preset.key;
              return (
                <TouchableOpacity
                  key={preset.key}
                  style={[styles.presetRow, isSelected && styles.presetRowSelected]}
                  onPress={() => {
                    setSelectedDateKey(preset.key);
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
    flex: 1.2,
  },
  custNameText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#14233B',
  },
  custVillageText: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#778294',
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

  // 7. Bottom Wave
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

