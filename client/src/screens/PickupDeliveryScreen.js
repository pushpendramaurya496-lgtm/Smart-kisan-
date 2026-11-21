import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BottomDock } from '../components/BottomDock';
import { useChakki } from '../context/ChakkiContext';
import { SpeechService } from '../services/speechService';

// Traditional Stone Chakki + Wheat Stalk Logo Component
const ChakkiLogo = () => (
  <View style={styles.chakkiLogoContainer}>
    {/* Golden Wheat Stalk */}
    <Text style={styles.wheatEmoji}>🌾</Text>
    {/* Traditional Stone Grinder Chakki */}
    <View style={styles.stoneMillWrapper}>
      {/* Wooden handle pin */}
      <View style={styles.millHandlePin} />
      {/* Top Stone */}
      <View style={styles.millTopStone}>
        <View style={styles.millCenterHole} />
      </View>
      {/* Bottom Stone Base */}
      <View style={styles.millBottomStone} />
    </View>
  </View>
);

export const PickupDeliveryScreen = ({ navigation }) => {
  const { stats, customers } = useChakki();
  const insets = useSafeAreaInsets();
  const topSafePadding = Math.max(insets.top || 0, 36) + 4;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('20 नव');
  const [showDateModal, setShowDateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'PAID'
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showVoiceSearchModal, setShowVoiceSearchModal] = useState(false);
  const [voiceQueryText, setVoiceQueryText] = useState('');

  const handleApplyVoiceQuery = (queryToApply) => {
    const text = (queryToApply !== undefined ? queryToApply : voiceQueryText).trim();
    if (!text) return;
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setSearchQuery(text);
    setShowVoiceSearchModal(false);
    SpeechService.speak(`${text} खोजा गया है।`);
  };

  // Customer selected for pickup delivery
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deliverySuccessModal, setDeliverySuccessModal] = useState(null);

  // Navigation handlers for BottomDock
  const handleTabPress = (tabId) => {
    if (tabId === 'home') navigation.navigate('Home');
    else if (tabId === 'khata') navigation.navigate('GrahakKhata');
    else if (tabId === 'bill') navigation.navigate('BillPrint', { customerId: 'c1' });
    else if (tabId === 'settings') navigation.navigate('Profile');
  };

  // Instant filtering on Customer Name & Village (case-insensitive & lag-free)
  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (customers || []).filter((item) => {
      // Name & Village text match
      const nameMatch = (item.name || '').toLowerCase().includes(query);
      const villageMatch = (item.village || '').toLowerCase().includes(query);
      const matchesSearch = query === '' || nameMatch || villageMatch;

      // Filter status
      if (activeFilter === 'PENDING') {
        return matchesSearch && (item.pendingBalance || 0) > 0;
      }
      if (activeFilter === 'PAID') {
        return matchesSearch && (item.pendingBalance || 0) === 0;
      }
      return matchesSearch;
    });
  }, [customers, searchQuery, activeFilter]);

  // Color generator for dynamic customers matching reference pastel scheme
  const getAvatarStyle = (item, index) => {
    if (item.avatarBg && item.avatarColor) {
      return {
        bg: item.avatarBg,
        color: item.avatarColor,
        badgeBg: item.badgeBg || '#F8FAFC',
        badgeBorder: item.badgeBorder || '#E2E8F0',
      };
    }
    const colorPresets = [
      { bg: '#DCFCE7', color: '#15803D', badgeBg: '#F0FDF4', badgeBorder: '#BBF7D0' }, // Mint Green (रामलाल)
      { bg: '#DBEAFE', color: '#1D4ED8', badgeBg: '#EFF6FF', badgeBorder: '#BFDBFE' }, // Soft Blue (मोहन कुमार)
      { bg: '#FEF3C7', color: '#D97706', badgeBg: '#FEFCE8', badgeBorder: '#FEF08A' }, // Soft Amber (सुरेश)
      { bg: '#F3E8FF', color: '#7E22CE', badgeBg: '#FAF5FF', badgeBorder: '#E9D5FF' }, // Soft Lilac (राजेश कुमार)
      { bg: '#E0F2FE', color: '#0284C7', badgeBg: '#F0F9FF', badgeBorder: '#BAE6FD' }, // Soft Cyan (मुकेश)
      { bg: '#FEE2E2', color: '#DC2626', badgeBg: '#FEF2F2', badgeBorder: '#FECACA' }, // Soft Rose
      { bg: '#ECFDF5', color: '#059669', badgeBg: '#F0FDF4', badgeBorder: '#A7F3D0' }, // Soft Emerald
      { bg: '#FFF7ED', color: '#EA580C', badgeBg: '#FFFBEB', badgeBorder: '#FED7AA' }, // Soft Orange
      { bg: '#EDE9FE', color: '#6D28D9', badgeBg: '#F5F3FF', badgeBorder: '#DDD6FE' }, // Soft Violet
      { bg: '#E0E7FF', color: '#4338CA', badgeBg: '#EEF2FF', badgeBorder: '#C7D2FE' }, // Soft Indigo
    ];
    return colorPresets[index % colorPresets.length];
  };

  const getAvatarInitials = (name) => {
    if (!name) return 'ग्र';
    const trimmed = name.trim();
    return trimmed.length > 2 ? trimmed.substring(0, 2) : trimmed;
  };

  // Action when customer name/card is tapped: Open Customer Dashboard
  const handleCustomerPress = (customer) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    navigation.navigate('CustomerDashboard', {
      customerId: customer.id,
      customer,
    });
  };

  // Complete Delivery action
  const handleDeliverOrder = (customer) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    setSelectedCustomer(null);
    setDeliverySuccessModal(customer);
    SpeechService.speak(`${customer.name} का माल सुपुर्द कर दिया गया है।`);
  };

  // Render individual customer card
  const renderCustomerItem = ({ item: customer, index }) => {
    const avatarStyle = getAvatarStyle(customer, index);
    const initials = customer.avatarText || getAvatarInitials(customer.name);
    const weightVal = customer.weightKg || customer.totalPisaiKg || 25;

    return (
      <TouchableOpacity
        key={customer.id || `cust_${index}`}
        style={styles.customerCard}
        activeOpacity={0.82}
        onPress={() => handleCustomerPress(customer)}
      >
        {/* Left: Circular Colored Avatar with Initials */}
        <View
          style={[
            styles.avatarCircle,
            { backgroundColor: avatarStyle.bg },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              { color: avatarStyle.color },
            ]}
          >
            {initials}
          </Text>
        </View>

        {/* Middle: Customer Name & Village with Red Location Pin */}
        <View style={styles.customerMiddleCol}>
          <Text style={styles.customerName} numberOfLines={1}>
            {customer.name}
          </Text>
          <View style={styles.villageRow}>
            <Text style={styles.pinIcon}>📍</Text>
            <Text style={styles.villageText} numberOfLines={1}>
              {customer.village || 'रामपुर'}
            </Text>
          </View>
        </View>

        {/* Right: Weight Badge, Vertical Divider, Time & Chevron */}
        <View style={styles.customerRightCol}>
          {/* Weight Badge with Wheat Icon */}
          <View
            style={[
              styles.weightBadge,
              {
                backgroundColor: avatarStyle.badgeBg,
                borderColor: avatarStyle.badgeBorder,
              },
            ]}
          >
            <Text style={styles.weightWheatIcon}>🌾</Text>
            <Text style={styles.weightText}>{weightVal} kg</Text>
          </View>

          {/* Vertical Divider */}
          <View style={styles.rowVerticalDivider} />

          {/* Entry Time String */}
          <Text style={styles.timeText}>
            {customer.timeStr || 'आज, 12:28 PM'}
          </Text>

          {/* Chevron Right */}
          <Text style={styles.chevronIcon}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render Empty State
  const renderEmptyState = () => (
    <View style={styles.emptyStateCard}>
      <Text style={styles.emptyStateEmoji}>🔍</Text>
      <Text style={styles.emptyStateTitle}>कोई ग्राहक नहीं मिला</Text>
      <Text style={styles.emptyStateSubtitle}>
        "{searchQuery}" नाम या गाँव से कोई रिकॉर्ड उपलब्ध नहीं है
      </Text>
      <TouchableOpacity
        style={styles.resetSearchBtn}
        onPress={() => setSearchQuery('')}
      >
        <Text style={styles.resetSearchBtnText}>सभी ग्राहक दिखाएं</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Light status bar icons on top dark agricultural green */}
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* 1. TOP HEADER SECTION - Deep Agricultural Green (#006B3C) */}
      <LinearGradient
        colors={['#005A32', '#006B3C', '#007A43']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerContainer, { paddingTop: topSafePadding }]}
      >
        {/* Subtle Decorative Wheat Watermark */}
        <View style={styles.watermarkContainer} pointerEvents="none">
          <Text style={styles.watermarkWheat}>🌾</Text>
          <Text style={styles.watermarkWheatSmall}>🌾</Text>
        </View>

        <View style={styles.headerContentRow}>
          {/* Left: Circular Wheat + Chakki Logo (Tap to go back) */}
          <TouchableOpacity
            style={styles.logoMedallion}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <ChakkiLogo />
          </TouchableOpacity>

          {/* Thin Vertical Translucent Divider */}
          <View style={styles.headerDivider} />

          {/* Title & Subtitle */}
          <View style={styles.titleColumn}>
            <Text style={styles.headerMainTitle}>आटा चक्की</Text>
            <Text style={styles.headerSubtitle}>ग्राहक प्रबंधन प्रणाली</Text>
          </View>

          {/* Right: Date Selector Pill */}
          <TouchableOpacity
            style={styles.dateSelectorPill}
            onPress={() => setShowDateModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.calendarIcon}>📅</Text>
            <Text style={styles.dateText}>{selectedDate}</Text>
            <Text style={styles.dateChevron}> ⌵</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* FIXED TOP SECTION (NEVER SCROLLS UP): Summary Cards + Search Bar + Heading */}
      <View style={styles.fixedTopSection}>
        {/* 2. SUMMARY CARDS (2 Cards Side-by-Side) */}
        <View style={styles.statCardsRow}>
          {/* First Card: कुल ग्राहक (125, +12%) */}
          <View style={styles.statCard}>
            <View style={styles.statCardTopRow}>
              {/* Soft Green Users Icon Box */}
              <View style={styles.statIconBoxGreen}>
                <Text style={styles.statIconGreen}>👥</Text>
              </View>
              {/* Label & Number */}
              <View style={styles.statTextCol}>
                <Text style={styles.statLabel}>कुल ग्राहक</Text>
                <Text style={styles.statValueGreen}>
                  {stats?.totalCustomers || 125}
                </Text>
              </View>
            </View>
            {/* Green Growth Badge Aligned Bottom-Right */}
            <View style={styles.growthBadgeGreen}>
              <Text style={styles.growthBadgeTextGreen}>↗ +12%</Text>
            </View>
          </View>

          {/* Second Card: आज की एंट्री (38, +8 आज) */}
          <View style={styles.statCard}>
            <View style={styles.statCardTopRow}>
              {/* Soft Blue Check Icon Box */}
              <View style={styles.statIconBoxBlue}>
                <View style={styles.blueCheckSquare}>
                  <Text style={styles.blueCheckMark}>✓</Text>
                </View>
              </View>
              {/* Label & Number */}
              <View style={styles.statTextCol}>
                <Text style={styles.statLabel}>आज की एंट्री</Text>
                <Text style={styles.statValueDark}>
                  {stats?.todayEntries || 38}
                </Text>
              </View>
            </View>
            {/* Blue Badge Aligned Bottom-Right */}
            <View style={styles.indicatorBadgeBlue}>
              <Text style={styles.indicatorBadgeTextBlue}>+8 आज</Text>
            </View>
          </View>
        </View>

        {/* 3. SEARCH BAR (ग्राहक का नाम या गाँव लिखकर खोजें...) with Mic Button */}
        <View style={styles.searchBoxContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="ग्राहक का नाम या गाँव लिखकर खोजें..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}

          {/* Voice Search Mic Button */}
          <TouchableOpacity
            style={styles.searchMicBtn}
            onPress={() => {
              try { Haptics.selectionAsync(); } catch (e) {}
              setVoiceQueryText(searchQuery);
              setShowVoiceSearchModal(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.searchMicIcon}>🎙️</Text>
          </TouchableOpacity>

          <View style={styles.searchDivider} />

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterIconText}>⊶</Text>
          </TouchableOpacity>
        </View>

        {/* 4. CUSTOMER ENTRY SECTION HEADING */}
        <View style={styles.entriesHeadingRow}>
          <View style={styles.headingTitleGroup}>
            <Text style={styles.headingIcon}>👥</Text>
            <Text style={styles.headingTitle}>सभी ग्राहकों की एंट्री</Text>
          </View>

          {/* Right-Side Green Badge (e.g. 15 मिले) */}
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {filteredCustomers.length} मिले
            </Text>
          </View>
        </View>
      </View>

      {/* 5. SCROLLABLE CUSTOMER LIST ONLY (Search Box stays fixed at the top!) */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item, index) => item.id || `cust_${index}`}
        renderItem={renderCustomerItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listScrollContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={renderEmptyState}
        style={styles.customerListWrapper}
      />

      {/* 6. FIXED BOTTOM NAVIGATION DOCK (Home active in dark green with underline) */}
      <BottomDock activeTab="home" onTabPress={handleTabPress} />

      {/* 7. MODAL: DELIVERY & PAYMENT SETTLEMENT FOR SELECTED CUSTOMER */}
      {selectedCustomer && (
        <Modal
          visible={!!selectedCustomer}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedCustomer(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedCustomer(null)}
          >
            <View style={styles.deliveryModalBox}>
              <View style={styles.modalSheetHandle} />

              <View style={styles.deliveryHeaderRow}>
                <View style={styles.deliveryAvatarBadge}>
                  <Text style={styles.deliveryAvatarText}>
                    {selectedCustomer.avatarText || getAvatarInitials(selectedCustomer.name)}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.deliveryCustName}>
                    {selectedCustomer.name}
                  </Text>
                  <Text style={styles.deliveryCustVillage}>
                    📍 {selectedCustomer.village || 'रामपुर'} • {selectedCustomer.phone || '+91 98765 43210'}
                  </Text>
                </View>
              </View>

              <View style={styles.deliveryDivider} />

              {/* Order summary info */}
              <View style={styles.deliverySummaryRow}>
                <View style={styles.deliveryStatBox}>
                  <Text style={styles.deliveryStatLabel}>पिसाई वजन</Text>
                  <Text style={styles.deliveryStatVal}>
                    🌾 {selectedCustomer.weightKg || selectedCustomer.totalPisaiKg || 25} kg
                  </Text>
                </View>

                <View style={styles.deliveryStatBox}>
                  <Text style={styles.deliveryStatLabel}>खाता स्थिति</Text>
                  <Text
                    style={[
                      styles.deliveryStatVal,
                      selectedCustomer.pendingBalance > 0
                        ? { color: '#DC2626' }
                        : { color: '#16A34A' },
                    ]}
                  >
                    {selectedCustomer.pendingBalance > 0
                      ? `₹${selectedCustomer.pendingBalance} बाकी`
                      : 'चुकता'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.confirmDeliveryBtn}
                onPress={() => handleDeliverOrder(selectedCustomer)}
                activeOpacity={0.88}
              >
                <Text style={styles.confirmDeliveryIcon}>📦</Text>
                <Text style={styles.confirmDeliveryText}>
                  माल सुपुर्द करें व डिलिवरी दर्ज करें
                </Text>
              </TouchableOpacity>

              <View style={styles.modalSecondaryBtnsRow}>
                <TouchableOpacity
                  style={styles.secondaryBillBtn}
                  onPress={() => {
                    const cust = selectedCustomer;
                    setSelectedCustomer(null);
                    navigation.navigate('BillPrint', {
                      customerName: cust.name,
                      village: cust.village || 'रामपुर',
                      item: 'गेहूं (पिसाई)',
                      weightKg: cust.weightKg || 25,
                      ratePerKg: 4,
                      totalAmount: (cust.weightKg || 25) * 4,
                      pendingAmount: cust.pendingBalance || 0,
                      status: cust.pendingBalance > 0 ? 'भुगतान बाकी' : 'भुगतान चुकता',
                    });
                  }}
                >
                  <Text style={styles.secondaryBillBtnText}>🧾 बिल रसीद देखें</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryKhataBtn}
                  onPress={() => {
                    const cust = selectedCustomer;
                    setSelectedCustomer(null);
                    navigation.navigate('GrahakKhata', {
                      customerId: cust.id,
                      customer: cust,
                    });
                  }}
                >
                  <Text style={styles.secondaryKhataBtnText}>📖 खाता बही</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeDeliveryBtn}
                onPress={() => setSelectedCustomer(null)}
              >
                <Text style={styles.closeDeliveryBtnText}>रद्द करें</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* 8. DELIVERY SUCCESS MODAL */}
      {deliverySuccessModal && (
        <Modal
          visible={!!deliverySuccessModal}
          transparent
          animationType="fade"
          onRequestClose={() => setDeliverySuccessModal(null)}
        >
          <View style={styles.modalOverlayCenter}>
            <View style={styles.successModalCard}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={styles.successTitle}>डिलिवरी सफल!</Text>
              <Text style={styles.successSubtitle}>
                {deliverySuccessModal.name} को {deliverySuccessModal.weightKg || 25} kg माल सफलतापूर्वक सौंप दिया गया है।
              </Text>
              <TouchableOpacity
                style={styles.successOkBtn}
                onPress={() => setDeliverySuccessModal(null)}
              >
                <Text style={styles.successOkBtnText}>ठीक है</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* DATE SELECTOR MODAL */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlayCenter}
          activeOpacity={1}
          onPress={() => setShowDateModal(false)}
        >
          <View style={styles.modalContentBox}>
            <Text style={styles.modalTitle}>📅 तारीख चुनें</Text>
            {['20 नव (आज)', '19 नव (कल)', '18 नव', 'सभी रिकॉर्ड'].map((dateOpt) => {
              const cleanDate =
                dateOpt.split(' ')[0] +
                ' ' +
                (dateOpt.split(' ')[1] || '').replace('(', '').replace(')', '');
              return (
                <TouchableOpacity
                  key={dateOpt}
                  style={[
                    styles.modalOptionBtn,
                    selectedDate === cleanDate && styles.modalOptionBtnActive,
                  ]}
                  onPress={() => {
                    setSelectedDate(cleanDate);
                    setShowDateModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedDate === cleanDate && styles.modalOptionTextActive,
                    ]}
                  >
                    {dateOpt}
                  </Text>
                  {selectedDate === cleanDate && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FILTER MODAL */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlayCenter}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalContentBox}>
            <Text style={styles.modalTitle}>⊶ फ़िल्टर विकल्प</Text>
            {[
              { id: 'ALL', label: 'सभी ग्राहक (All)' },
              { id: 'PENDING', label: 'उधार बाकी वाले (Pending Debt)' },
              { id: 'PAID', label: 'पूर्ण भुगतान वाले (Paid in Full)' },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.modalOptionBtn,
                  activeFilter === f.id && styles.modalOptionBtnActive,
                ]}
                onPress={() => {
                  setActiveFilter(f.id);
                  setShowFilterModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    activeFilter === f.id && styles.modalOptionTextActive,
                  ]}
                >
                  {f.label}
                </Text>
                {activeFilter === f.id && (
                  <Text style={styles.checkIcon}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 5. VOICE SEARCH MODAL (माइक से बोलकर खोजें) */}
      <Modal
        visible={showVoiceSearchModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVoiceSearchModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlayCenter}
          activeOpacity={1}
          onPress={() => setShowVoiceSearchModal(false)}
        >
          <View style={styles.voiceSearchModalCard}>
            <View style={styles.voiceMicPulseOuter}>
              <TouchableOpacity
                style={styles.voiceMicPulseInner}
                activeOpacity={0.8}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  } catch (e) {}
                  SpeechService.speak('ग्राहक का नाम या गाँव बोलें');
                }}
              >
                <Text style={styles.voiceMicBigIcon}>🎙️</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.voiceModalTitle}>बोलकर ग्राहक खोजें</Text>
            <Text style={styles.voiceModalSubtitle}>
              माइक पर टैप करके ग्राहक का नाम या गाँव बोलें
            </Text>

            {/* Recognized / Input Text Field */}
            <View style={styles.voiceInputContainer}>
              <TextInput
                style={styles.voiceModalInput}
                placeholder="यहाँ बोलें या टाइप करें..."
                placeholderTextColor="#94A3B8"
                value={voiceQueryText}
                onChangeText={setVoiceQueryText}
                autoFocus={true}
              />
              {voiceQueryText.length > 0 && (
                <TouchableOpacity
                  onPress={() => setVoiceQueryText('')}
                  style={{ padding: 4 }}
                >
                  <Text style={{ fontSize: 16, color: '#94A3B8', fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Voice Suggestion Chips */}
            <Text style={styles.quickChipsTitle}>⚡ तुरंत सुझाव (टैप करें):</Text>
            <View style={styles.quickChipsRow}>
              {['रामलाल', 'मोहन कुमार', 'सुरेश', 'बिजौली', 'रामपुर', 'अलीपुर'].map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={styles.quickChip}
                  onPress={() => {
                    setVoiceQueryText(chip);
                    handleApplyVoiceQuery(chip);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickChipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.voiceModalButtonsRow}>
              <TouchableOpacity
                style={styles.voiceCancelBtn}
                onPress={() => setShowVoiceSearchModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.voiceCancelBtnText}>रद्द करें</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.voiceSubmitBtn}
                onPress={() => handleApplyVoiceQuery()}
                activeOpacity={0.85}
              >
                <Text style={styles.voiceSubmitBtnText}>🔍 खोजें</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FC', // Very light bluish grey per reference
  },

  /* 1. Header Styles - Deep Agricultural Green (#006B3C) */
  headerContainer: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 16,
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#005A32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  watermarkContainer: {
    position: 'absolute',
    right: 12,
    top: 28,
    opacity: 0.12,
    flexDirection: 'row',
  },
  watermarkWheat: {
    fontSize: 56,
  },
  watermarkWheatSmall: {
    fontSize: 34,
    marginTop: 18,
    marginLeft: -14,
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoMedallion: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  chakkiLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheatEmoji: {
    fontSize: 22,
    marginRight: 1,
  },
  stoneMillWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
  },
  millHandlePin: {
    width: 3.5,
    height: 6,
    backgroundColor: '#92400E',
    borderTopLeftRadius: 1.5,
    borderTopRightRadius: 1.5,
    marginBottom: -1,
    zIndex: 3,
  },
  millTopStone: {
    width: 20,
    height: 9,
    backgroundColor: '#64748B',
    borderRadius: 4.5,
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  millCenterHole: {
    width: 4,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#1E293B',
  },
  millBottomStone: {
    width: 22,
    height: 7,
    backgroundColor: '#475569',
    borderRadius: 3.5,
    marginTop: -2,
    zIndex: 1,
  },
  headerDivider: {
    width: 1.5,
    height: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
  },
  titleColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  headerMainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 2,
  },
  dateSelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  calendarIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dateChevron: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* FIXED TOP SECTION (Summary Cards + Search + Heading) */
  fixedTopSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#F4F7FC',
  },

  /* 2. Summary Cards */
  statCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
    minHeight: 104,
  },
  statCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIconBoxGreen: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconGreen: {
    fontSize: 22,
  },
  statIconBoxBlue: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueCheckSquare: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueCheckMark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  statTextCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  statValueGreen: {
    fontSize: 28,
    fontWeight: '900',
    color: '#062E1A',
    marginTop: 2,
  },
  statValueDark: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  growthBadgeGreen: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  growthBadgeTextGreen: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  indicatorBadgeBlue: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  indicatorBadgeTextBlue: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },

  /* 3. Search Bar */
  searchBoxContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
    color: '#334155',
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14.5,
    fontWeight: '500',
    paddingVertical: 4,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748B',
  },
  clearBtnTextMuted: {
    fontSize: 16,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  searchMicBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchMicIcon: {
    fontSize: 17,
  },
  searchDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  filterBtn: {
    padding: 4,
  },
  filterIconText: {
    fontSize: 18,
    color: '#334155',
    fontWeight: '800',
  },

  /* 4. Customer Entries Heading */
  entriesHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headingTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headingIcon: {
    fontSize: 22,
    marginRight: 8,
    color: '#15803D',
  },
  headingTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#063A1B',
  },
  countBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  countBadgeText: {
    color: '#065F46',
    fontWeight: '900',
    fontSize: 13.5,
  },

  /* 5. Customer Scrollable List */
  customerListWrapper: {
    flex: 1,
  },
  listScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
  },
  customerMiddleCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#063A1B',
  },
  villageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  pinIcon: {
    fontSize: 12,
    marginRight: 3,
    color: '#EF4444', // Red location pin matching reference
  },
  villageText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
  },
  customerRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
  },
  weightWheatIcon: {
    fontSize: 13,
  },
  weightText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  rowVerticalDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  timeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  chevronIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 4,
  },

  /* Empty State */
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 12,
  },
  emptyStateEmoji: {
    fontSize: 42,
    marginBottom: 8,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
  },
  resetSearchBtn: {
    backgroundColor: '#0F4A2C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resetSearchBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  /* Delivery Sheet Modal */
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
  deliveryModalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    elevation: 10,
  },
  modalSheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  deliveryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryAvatarBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryAvatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803D',
  },
  deliveryCustName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#063A1B',
  },
  deliveryCustVillage: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  deliveryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  deliverySummaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  deliveryStatBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deliveryStatLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  deliveryStatVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  confirmDeliveryBtn: {
    backgroundColor: '#D97706',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  confirmDeliveryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  confirmDeliveryText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '900',
  },
  modalSecondaryBtnsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  secondaryBillBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  secondaryBillBtnText: {
    color: '#334155',
    fontSize: 13.5,
    fontWeight: '700',
  },
  secondaryKhataBtn: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  secondaryKhataBtnText: {
    color: '#15803D',
    fontSize: 13.5,
    fontWeight: '700',
  },
  closeDeliveryBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeDeliveryBtnText: {
    color: '#64748B',
    fontSize: 13.5,
    fontWeight: '600',
  },

  /* Success Modal */
  successModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 30,
    alignSelf: 'center',
    elevation: 8,
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#063A1B',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13.5,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  successOkBtn: {
    backgroundColor: '#0F4A2C',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  successOkBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },

  /* Date & Filter Modals */
  modalContentBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalOptionBtnActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#86EFAC',
  },
  modalOptionText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#334155',
  },
  modalOptionTextActive: {
    fontWeight: '800',
    color: '#15803D',
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },

  /* 5. Voice Search Modal Styles */
  voiceSearchModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  voiceMicPulseOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  voiceMicPulseInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#006B3C',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  voiceMicBigIcon: {
    fontSize: 28,
  },
  voiceModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#063A1B',
    marginBottom: 4,
  },
  voiceModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  voiceInputContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  voiceModalInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  quickChipsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 18,
  },
  quickChip: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  voiceModalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  voiceCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  voiceCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  voiceSubmitBtn: {
    flex: 1,
    backgroundColor: '#006B3C',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    elevation: 2,
  },
  voiceSubmitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
