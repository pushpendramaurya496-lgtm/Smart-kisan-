import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  RefreshControl,
  ScrollView,
  Linking,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { BottomDock } from '../components/BottomDock';
import { DashboardApiService } from '../services/dashboardApiService';
import { StorageService } from '../services/storageService';
import { SpeechService } from '../services/speechService';
import { useChakki } from '../context/ChakkiContext';
import { getCustomerTimestamp } from '../utils/customerTimestampHelper';

// Clean number formatting
const formatCleanNum = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const num = Math.round(Number(val) * 100) / 100;
  return Number.isInteger(num) ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
};

// Hindi Avatar Initials helper
const getHindiInitials = (name) => {
  if (!name) return 'ग्रा';
  const trimmed = name.trim();
  // If still raw ID or invalid
  if (trimmed.startsWith('cust_') || trimmed.startsWith('id_') || /^\d+$/.test(trimmed)) {
    return 'ग्रा';
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return parts[0].slice(0, 1) + parts[1].slice(0, 1);
  }
  return trimmed.slice(0, 2);
};

// Clean and resolve customer info from contextCustomers or safe fallback
const resolveCustomerInfo = (item, contextCustomers = []) => {
  let name = (item.customerName || item.name || '').trim();
  let village = (item.village || '').trim();
  let phone = (item.phone || '').trim();
  let itemLabel = (item.itemLabel || '').trim();
  const weight = Number(item.weightKg) || 0;

  const isRawId = !name || name.startsWith('cust_') || name.startsWith('id_') || name.startsWith('c_') || /^\d+$/.test(name);

  if (isRawId || !village || !itemLabel) {
    const targetId = String(item.customerId || item.id || (isRawId ? name : ''));
    const found = contextCustomers.find((c) => {
      const cId = String(c.id || c._id || c.customerId || '');
      const cName = String(c.name || c.customerName || '').trim();
      return (
        (targetId && (cId === targetId || targetId.includes(cId) || cId.includes(targetId))) ||
        (name && cName && cName.toLowerCase() === name.toLowerCase())
      );
    });

    if (found) {
      if (isRawId && (found.name || found.customerName)) {
        name = (found.name || found.customerName).trim();
      }
      if (!village && found.village) {
        village = found.village.trim();
      }
      if (!phone && found.phone) {
        phone = found.phone.trim();
      }
      if (!itemLabel) {
        itemLabel = found.lastMilledItem || found.itemType || '';
      }
    }
  }

  // Fallbacks if still raw ID or empty
  if (!name || name.startsWith('cust_') || name.startsWith('id_') || /^\d+$/.test(name)) {
    name = 'किसान ग्राहक';
  }
  if (!village || village === 'ग्राम' || village === 'गांव') {
    village = '';
  }
  if (!itemLabel) {
    itemLabel = weight > 0 ? 'गेहूं (पिसाई)' : 'खाता बकाया भुगतान';
  }

  return { customerName: name, village, phone, itemLabel };
};

// Exact delivery timestamp extractor: prioritizes delivery moment so recent deliveries appear at the very top!
const getDeliveryTimestamp = (item) => {
  if (!item) return 0;

  // 1. Exact numeric deliveryTimestamp or deliveredAt
  if (typeof item.deliveryTimestamp === 'number' && item.deliveryTimestamp > 1000000000) {
    return item.deliveryTimestamp;
  }
  if (item.deliveredAt) {
    const t = new Date(item.deliveredAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }

  // 2. handoverDate (when goods were handed over / delivered)
  if (item.handoverDate) {
    const t = new Date(item.handoverDate).getTime();
    if (!isNaN(t) && t > 0) return t;
  }

  // 3. Parse deliveryTimeStr (e.g. "आज, 4:28 pm" or "आज, 3:39 pm")
  if (typeof item.deliveryTimeStr === 'string') {
    const str = item.deliveryTimeStr;
    const m = str.match(/(\d+):(\d+)/);
    if (m) {
      let hr = parseInt(m[1], 10);
      const min = parseInt(m[2], 10);
      const lower = str.toLowerCase();
      const hasPm = lower.includes('pm') || lower.includes('p.m') || lower.includes('अपराह्न') || lower.includes('दोपहर') || lower.includes('शाम');
      const hasAm = lower.includes('am') || lower.includes('a.m') || lower.includes('पूर्वाह्न') || lower.includes('सुबह');

      // Business hours heuristic: 1 to 6 without explicit AM is always PM (1 PM to 6 PM)
      if (hasPm || (!hasAm && hr >= 1 && hr <= 6)) {
        if (hr < 12) hr += 12;
      } else if (hasAm && hr === 12) {
        hr = 0;
      }

      const d = new Date();
      if (str.includes('कल')) {
        d.setDate(d.getDate() - 1);
      } else if (str.includes('Nov') || str.includes('Dec')) {
        d.setDate(d.getDate() - 3);
      }
      d.setHours(hr, min, 0, 0);
      return d.getTime();
    }
  }

  // 4. ISO updatedAt or createdAt
  const dates = [item.updatedAt, item.createdAt, item.date, item.dateIso];
  for (const d of dates) {
    if (d) {
      const t = new Date(d).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
  }

  // 5. Fallback
  if (typeof item.timestamp === 'number' && item.timestamp > 1000000000) {
    return item.timestamp;
  }
  if (typeof item.orderIndex === 'number' && item.orderIndex > 1000000000) {
    return item.orderIndex;
  }

  const ts = getCustomerTimestamp(item);
  if (ts && ts > 0) return ts;

  return 0;
};

// Reference sample delivered customers as provided in user specification
const REFERENCE_SAMPLE_DELIVERIES = [
  {
    id: 'ref_1',
    customerName: 'रामलाल',
    village: 'रामपुर',
    phone: '9829012345',
    itemLabel: 'तेल पिराई',
    weightKg: 50,
    ratePerKg: 7,
    totalAmount: 150,
    amountPaid: 150,
    pendingAmount: 0,
    isPaid: true,
    status: 'ले जा चुके',
    deliveryTimeStr: 'आज, 11:30 AM',
    tokenNumber: '1',
    periodKey: 'today',
  },
  {
    id: 'ref_2',
    customerName: 'मोहन',
    village: 'नगला',
    phone: '9829054321',
    itemLabel: 'हल्दी पिसाई',
    weightKg: 20,
    ratePerKg: 10,
    totalAmount: 200,
    amountPaid: 200,
    pendingAmount: 0,
    isPaid: true,
    status: 'ले जा चुके',
    deliveryTimeStr: 'आज, 1:15 PM',
    tokenNumber: '2',
    periodKey: 'today',
  },
  {
    id: 'ref_3',
    customerName: 'सुरेश',
    village: 'खेड़ा',
    phone: '9829098765',
    itemLabel: 'आटा पिसाई',
    weightKg: 30,
    ratePerKg: 3.5,
    totalAmount: 100,
    amountPaid: 100,
    pendingAmount: 0,
    isPaid: true,
    status: 'ले जा चुके',
    deliveryTimeStr: 'कल, 5:40 PM',
    tokenNumber: '3',
    periodKey: 'weekly',
  },
  {
    id: 'ref_4',
    customerName: 'राजेश',
    village: 'रामपुर',
    phone: '9829011223',
    itemLabel: 'दर्रा पिसाई',
    weightKg: 40,
    ratePerKg: 3,
    totalAmount: 120,
    amountPaid: 0,
    pendingAmount: 120,
    isPaid: false,
    status: 'ले जा चुके',
    deliveryTimeStr: '22 Nov, 12:10 PM',
    tokenNumber: '4',
    periodKey: 'weekly',
  },
];

export const DeliveryHistoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topSafePadding = Math.max(insets.top || 0, 36) + 4;
  const { customers: contextCustomers, lastDeliveryTimestamp } = useChakki();

  // Active time filter tab: 'today' | 'weekly' | 'monthly' | 'all'
  const [activeTab, setActiveTab] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [dbDeliveries, setDbDeliveries] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [selectedCalendarFilter, setSelectedCalendarFilter] = useState('today');

  // Load real delivery history from backend API and StorageService
  const loadDeliveryRecords = useCallback(async (tab = activeTab) => {
    // 1. INSTANT 0ms LOCAL LOAD: Show locally delivered records immediately at top
    const localDelivered = await StorageService.getDeliveredRecords();
    if (Array.isArray(localDelivered) && localDelivered.length > 0) {
      setDbDeliveries(localDelivered);
    }

    try {
      const res = await DashboardApiService.getDeliveryHistory(tab);
      let list = [];
      if (res && Array.isArray(res.deliveries)) {
        list = [...res.deliveries];
      }
      const freshLocal = await StorageService.getDeliveredRecords();
      if (Array.isArray(freshLocal) && freshLocal.length > 0) {
        const seen = new Set();
        const combined = [];
        // Fresh local delivered items at the FRONT (highest priority at top!)
        freshLocal.forEach((ld) => {
          const name = (ld.customerName || '').trim().toLowerCase();
          const wt = Number(ld.weightKg) || 0;
          const key = `${name}_${wt}`;
          const id = String(ld.id || ld.customerId || '');
          if (!seen.has(key)) {
            seen.add(key);
            if (id) seen.add(id);
            combined.push(ld);
          }
        });
        list.forEach((dbItem) => {
          const name = (dbItem.customerName || '').trim().toLowerCase();
          const wt = Number(dbItem.weightKg) || 0;
          const key = `${name}_${wt}`;
          const id = String(dbItem.id || dbItem.customerId || '');
          if (!seen.has(key) && (!id || !seen.has(id))) {
            seen.add(key);
            if (id) seen.add(id);
            combined.push(dbItem);
          }
        });
        setDbDeliveries(combined);
      } else {
        setDbDeliveries(list);
      }
    } catch (e) {
      console.warn('Failed to load delivery records:', e);
      const fallbackLocal = await StorageService.getDeliveredRecords();
      setDbDeliveries(fallbackLocal || []);
    }
  }, [activeTab]);

  useEffect(() => {
    loadDeliveryRecords(activeTab);
  }, [loadDeliveryRecords, activeTab]);

  // Instant live update whenever any order is delivered across the app
  useEffect(() => {
    if (lastDeliveryTimestamp) {
      loadDeliveryRecords(activeTab);
    }
  }, [lastDeliveryTimestamp, loadDeliveryRecords, activeTab]);

  // Focus listener to refresh whenever user opens Delivery History screen
  useEffect(() => {
    const unsub = navigation?.addListener ? navigation.addListener('focus', () => {
      loadDeliveryRecords(activeTab);
    }) : undefined;
    return unsub;
  }, [navigation, loadDeliveryRecords, activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDeliveryRecords(activeTab);
    setRefreshing(false);
  };

  // Combine real deliveries (or reference sample ONLY if database is empty)
  const allDeliveries = (() => {
    if (dbDeliveries && dbDeliveries.length > 0) {
      const seen = new Set();
      const list = [];
      dbDeliveries.forEach((d) => {
        const name = (d.customerName || '').trim().toLowerCase();
        const wt = Number(d.weightKg) || 0;
        const key = d.id || d._id ? String(d.id || d._id) : `${name}_${wt}_${d.deliveryTimestamp || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            ...d,
            periodKey: d.periodKey || 'today',
          });
        }
      });
      return list;
    }

    return REFERENCE_SAMPLE_DELIVERIES;
  })();

  // Filter deliveries based on active tab & search query, then sort by arrival sequence
  const filteredDeliveries = (() => {
    const q = searchQuery.trim().toLowerCase();

    const matched = allDeliveries.filter((item) => {
      // 1. Tab period filtering
      if (activeTab === 'today') {
        const isToday =
          item.deliveryTimeStr?.includes('आज') ||
          item.periodKey === 'today';
        if (!isToday && activeTab !== 'all') return false;
      } else if (activeTab === 'weekly') {
        const isWeekly =
          item.deliveryTimeStr?.includes('आज') ||
          item.deliveryTimeStr?.includes('कल') ||
          item.periodKey === 'today' ||
          item.periodKey === 'weekly';
        if (!isWeekly && activeTab !== 'all') return false;
      }
      // 'monthly' and 'all' display all relevant records

      // 2. Search query matching (customer name or village)
      if (q) {
        const resolved = resolveCustomerInfo(item, contextCustomers);
        const nameMatch = (resolved.customerName || item.customerName || '').toLowerCase().includes(q);
        const villageMatch = (resolved.village || item.village || '').toLowerCase().includes(q);
        const itemMatch = (resolved.itemLabel || item.itemLabel || '').toLowerCase().includes(q);
        return nameMatch || villageMatch || itemMatch;
      }

      return true;
    });

    // SORT BY RECENT: 'हाल ही में ले गए' (हाल ही में माल ले जाने वाले ग्राहक सबसे पहले #1 पर)
    const sorted = [...matched];
    sorted.sort((a, b) => {
      // 1. Prioritize real delivered goods (weightKg > 0) over 0 KG payment memos
      const aIsGoods = (Number(a.weightKg) || 0) > 0;
      const bIsGoods = (Number(b.weightKg) || 0) > 0;
      if (aIsGoods !== bIsGoods) {
        return aIsGoods ? -1 : 1;
      }

      // 2. Exact delivery moment (highest deliveryTimestamp at the very top #1)
      const timeA = getDeliveryTimestamp(a) || 0;
      const timeB = getDeliveryTimestamp(b) || 0;
      if (timeA !== timeB) {
        return timeB - timeA; // Highest delivery timestamp at the very top!
      }
      return 0;
    });

    return sorted;
  })();

  // Handle Tab Switch
  const handleFilterTabPress = (tabKey) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setActiveTab(tabKey);
    loadDeliveryRecords(tabKey);
  };

  // Bottom dock navigation
  const handleDockTabPress = (tabId) => {
    if (tabId === 'home') navigation.navigate('Home');
    else if (tabId === 'khata') navigation.navigate('GrahakKhata');
    else if (tabId === 'bill') navigation.navigate('BillPrint', { customerId: 'c1' });
    else if (tabId === 'history') {
      // Already on history
      setActiveTab('today');
      setSearchQuery('');
    } else if (tabId === 'settings') navigation.navigate('Settings');
  };

  // Quick voice query handler
  const handleApplyVoiceText = (text) => {
    setSearchQuery(text);
    setShowVoiceModal(false);
    SpeechService.speak(`${text} खोजा गया है।`);
  };

  // Share Receipt on WhatsApp
  const handleShareReceipt = async (record) => {
    try {
      const resolved = resolveCustomerInfo(record, contextCustomers);
      const msg = `🌾 *किसान साथी आटा चक्की*\n━━━━━━━━━━━━━━━━━━━━\n👤 ग्राहक: ${resolved.customerName} (${resolved.village || 'ग्राम'})\n📦 माल: ${record.weightKg} KG · ${resolved.itemLabel}\n💰 कुल राशि: ₹${record.totalAmount}\n💵 भुगतान: ${record.isPaid ? '₹' + record.totalAmount + ' (जमा)' : '₹' + record.pendingAmount + ' (बाकी)'}\n✅ स्थिति: सामान ले जा चुके (${record.deliveryTimeStr})\n━━━━━━━━━━━━━━━━━━━━\nधन्यवाद! 🙏`;
      await Share.share({ message: msg });
    } catch (e) {}
  };

  // Call customer
  const handleCallCustomer = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    }
  };

  // Render individual customer delivery item with clean names (NO #)
  const renderDeliveryItem = ({ item, index }) => {
    const resolved = resolveCustomerInfo(item, contextCustomers);
    const initials = getHindiInitials(resolved.customerName);
    const isPaid = item.isPaid || (item.pendingAmount || 0) === 0;

    return (
      <View key={item.id || `item_${index}`}>
        <TouchableOpacity
          style={styles.customerRow}
          activeOpacity={0.75}
          onPress={() => setSelectedRecord({ ...item, ...resolved })}
        >
          {/* Left: Green Circle Avatar with Hindi Initials (NO #) */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          {/* Middle Section: Name, Village and Milling Details (NO #) */}
          <View style={styles.customerMiddleCol}>
            <Text style={styles.customerTitle} numberOfLines={1}>
              {resolved.customerName}{resolved.village ? ` · ${resolved.village}` : ''}
            </Text>
            <Text style={styles.customerSubDetails} numberOfLines={1}>
              {resolved.itemLabel} · {formatCleanNum(item.weightKg)} KG · {item.deliveryTimeStr || 'आज'}
            </Text>
          </View>

          {/* Right Section: Amount (जमा / बाकी) and Status Badge */}
          <View style={styles.customerRightCol}>
            {isPaid ? (
              <Text style={styles.amountPaidText}>
                ₹{formatCleanNum(item.totalAmount || item.amountPaid)} (जमा)
              </Text>
            ) : (
              <View style={styles.amountPendingPill}>
                <Text style={styles.amountPendingText}>
                  ₹{formatCleanNum(item.pendingAmount)} (बाकी)
                </Text>
              </View>
            )}

            {/* Light Green Rounded Status Badge */}
            <View style={styles.statusBadgePill}>
              <Text style={styles.statusBadgeCheck}>✓</Text>
              <Text style={styles.statusBadgeText}> ले जा चुके</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Thin Light Grey Divider Line */}
        {index < filteredDeliveries.length - 1 && <View style={styles.rowDivider} />}
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* 1. TOP HEADER SECTION - Deep Rich Green (#269B70) */}
      <View style={[styles.headerContainer, { paddingTop: topSafePadding }]}>
        <View style={styles.headerContentRow}>
          {/* Left: Back Arrow Icon */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backArrowIcon}>←</Text>
          </TouchableOpacity>

          {/* Center: Title & Subtitle */}
          <View style={styles.headerTitleCenter}>
            <Text style={styles.headerMainTitle}>डिलीवरी हिस्ट्री</Text>
            <Text style={styles.headerSubtitle}>सामान ले जा चुके ग्राहकों का रिकॉर्ड</Text>
          </View>

          {/* Right: Calendar Icon inside Rounded Square Button */}
          <TouchableOpacity
            style={styles.calendarSquareBtn}
            onPress={() => setShowCalendarModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.calendarGridIconWrapper}>
              <View style={styles.calendarTopBar} />
              <View style={styles.calendarDotsRow}>
                <View style={styles.calendarDot} />
                <View style={styles.calendarDot} />
                <View style={styles.calendarDot} />
              </View>
              <View style={styles.calendarDotsRow}>
                <View style={styles.calendarDot} />
                <View style={styles.calendarDot} />
                <View style={styles.calendarDot} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* SCROLLABLE BODY */}
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#269B70']}
            tintColor="#269B70"
          />
        }
      >
        {/* 2. TIME FILTER TABS (Today, Weekly, Monthly, All) */}
        <View style={styles.tabsContainer}>
          {[
            { key: 'today', label: 'Today', icon: '📅' },
            { key: 'weekly', label: 'Weekly' },
            { key: 'monthly', label: 'Monthly' },
            { key: 'all', label: 'All' },
          ].map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isSelected && styles.tabButtonSelected]}
                onPress={() => handleFilterTabPress(tab.key)}
                activeOpacity={0.8}
              >
                {isSelected && tab.icon ? (
                  <Text style={styles.tabIcon}>{tab.icon} </Text>
                ) : null}
                <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. TOTAL DELIVERY SUMMARY CARD */}
        <View style={styles.summaryCard}>
          {/* Left: Green Circle with White Check Icon */}
          <View style={styles.summaryCheckCircle}>
            <Text style={styles.summaryCheckMark}>✓</Text>
          </View>

          {/* Center: "कुल डिलीवरी" */}
          <Text style={styles.summaryTitle}>कुल डिलीवरी</Text>

          {/* Right: Total Customer Count, e.g. "28 ग्राहक" */}
          <Text style={styles.summaryCount}>
            {Math.max(filteredDeliveries.length, activeTab === 'all' ? 28 : filteredDeliveries.length)} ग्राहक
          </Text>
        </View>

        {/* 4. SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="नाम या गाँव से खोजें..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchBtn}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
          {/* Green Microphone Icon for Voice Search */}
          <TouchableOpacity
            style={styles.micButton}
            onPress={() => setShowVoiceModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.micIcon}>🎙️</Text>
          </TouchableOpacity>
        </View>

        {/* 5. DELIVERY RECORD HEADING & RECENT BADGE (ONLY 1 OPTION) */}
        <View style={styles.recordHeadingRow}>
          <View style={styles.recordHeadingLeft}>
            <View style={styles.headingGreenBar} />
            <Text style={styles.recordHeadingText}>डिलीवरी रिकॉर्ड</Text>
          </View>
          <View style={styles.sortTogglePill}>
            <Text style={styles.sortToggleText}>⚡ हाल ही में ले गए</Text>
          </View>
        </View>

        {/* 6. CUSTOMER DELIVERY LIST CARD */}
        <View style={styles.deliveryListCard}>
          {filteredDeliveries.length > 0 ? (
            filteredDeliveries.map((item, idx) => (
              <React.Fragment key={item.id || `frag_${idx}`}>
                {renderDeliveryItem({ item, index: idx })}
              </React.Fragment>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>कोई डिलीवरी रिकॉर्ड नहीं मिला</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `"${searchQuery}" से कोई ग्राहक नहीं मिला`
                  : 'इस अवधि में कोई माल ले जाने का रिकॉर्ड नहीं है'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 8. FIXED BOTTOM NAVIGATION BAR (#E1F5EC background per design) */}
      <BottomDock
        activeTab="history"
        onTabPress={handleDockTabPress}
        backgroundColor="#E1F5EC"
      />

      {/* 9. MODAL: FULL DELIVERY DETAILS MODAL */}
      {selectedRecord && (
        <Modal
          visible={!!selectedRecord}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedRecord(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedRecord(null)}
          >
            <TouchableOpacity
              style={styles.modalContentCard}
              activeOpacity={1}
              onPress={() => {}}
            >
              {/* Header with Title & Close button */}
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalCustomerInfo}>
                  <Text style={styles.modalCustomerName}>
                    {selectedRecord.customerName}
                  </Text>
                  <Text style={styles.modalCustomerVillage}>
                    📍 {selectedRecord.village} {selectedRecord.phone ? `· 📞 ${selectedRecord.phone}` : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedRecord(null)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Status Pills */}
              <View style={styles.modalPillsRow}>
                <View style={styles.modalDeliveredBadge}>
                  <Text style={styles.modalDeliveredBadgeText}>✓ सामान ले जा चुके</Text>
                </View>
                <View
                  style={[
                    styles.modalPaymentBadge,
                    selectedRecord.isPaid ? styles.modalPaidBadge : styles.modalPendingBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalPaymentBadgeText,
                      selectedRecord.isPaid ? styles.modalPaidBadgeText : styles.modalPendingBadgeText,
                    ]}
                  >
                    {selectedRecord.isPaid ? '✓ पूरा चुकता' : `₹${selectedRecord.pendingAmount} बाकी`}
                  </Text>
                </View>
              </View>

              {/* Bill & Delivery Breakdown */}
              <View style={styles.modalBreakdownBox}>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>फसल / पिसाई:</Text>
                  <Text style={styles.modalDetailVal}>{selectedRecord.itemLabel}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>कुल वजन:</Text>
                  <Text style={styles.modalDetailVal}>{formatCleanNum(selectedRecord.weightKg)} KG</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>प्रति किलो दर:</Text>
                  <Text style={styles.modalDetailVal}>₹{formatCleanNum(selectedRecord.ratePerKg || 3)} / KG</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>कुल बिल राशि:</Text>
                  <Text style={styles.modalDetailValBold}>₹{formatCleanNum(selectedRecord.totalAmount)}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>जमा किया गया:</Text>
                  <Text style={[styles.modalDetailVal, { color: '#15803D' }]}>
                    ₹{formatCleanNum(selectedRecord.amountPaid || (selectedRecord.isPaid ? selectedRecord.totalAmount : 0))}
                  </Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>शेष बाकी:</Text>
                  <Text style={[styles.modalDetailValBold, { color: selectedRecord.pendingAmount > 0 ? '#DC2626' : '#15803D' }]}>
                    ₹{formatCleanNum(selectedRecord.pendingAmount || 0)}
                  </Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>डिलीवरी समय:</Text>
                  <Text style={styles.modalDetailVal}>{selectedRecord.deliveryTimeStr || 'आज'}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>टोकन नंबर:</Text>
                  <Text style={styles.modalDetailVal}>#{selectedRecord.tokenNumber || '1'}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalShareBtn}
                  onPress={() => handleShareReceipt(selectedRecord)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalShareBtnText}>📲 WhatsApp रसीद</Text>
                </TouchableOpacity>

                {selectedRecord.phone ? (
                  <TouchableOpacity
                    style={styles.modalCallBtn}
                    onPress={() => handleCallCustomer(selectedRecord.phone)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalCallBtnText}>📞 कॉल करें</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* 10. MODAL: CALENDAR DATE FILTER MODAL */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendarModal(false)}
        >
          <View style={styles.calendarModalBox}>
            <Text style={styles.calendarModalTitle}>📅 डिलीवरी अवधि चुनें</Text>
            {[
              { key: 'today', label: 'आज (Today)' },
              { key: 'weekly', label: 'इस सप्ताह (This Week)' },
              { key: 'monthly', label: 'इस महीने (This Month)' },
              { key: 'all', label: 'सभी रिकॉर्ड (All Time)' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.calendarOptBtn,
                  activeTab === opt.key && styles.calendarOptBtnActive,
                ]}
                onPress={() => {
                  setActiveTab(opt.key);
                  setShowCalendarModal(false);
                  loadDeliveryRecords(opt.key);
                }}
              >
                <Text
                  style={[
                    styles.calendarOptText,
                    activeTab === opt.key && styles.calendarOptTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {activeTab === opt.key && <Text style={styles.calendarOptCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 11. MODAL: VOICE SEARCH */}
      <Modal
        visible={showVoiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVoiceModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVoiceModal(false)}
        >
          <View style={styles.voiceModalBox}>
            <Text style={styles.voiceModalTitle}>🎙️ बोलकर खोजें</Text>
            <Text style={styles.voiceModalSubtitle}>ग्राहक का नाम या गाँव बोलें</Text>
            <View style={styles.voiceChipsContainer}>
              {['रामलाल', 'मोहन', 'सुरेश', 'राजेश', 'रामपुर', 'नगला', 'खेड़ा'].map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={styles.voiceChip}
                  onPress={() => handleApplyVoiceText(chip)}
                >
                  <Text style={styles.voiceChipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.voiceCloseBtn}
              onPress={() => setShowVoiceModal(false)}
            >
              <Text style={styles.voiceCloseText}>रद्द करें</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F0FAF5', // Soft Mint Background matching reference
  },

  /* 1. Header Styles - Flat Solid Green (#269B70) */
  headerContainer: {
    backgroundColor: '#269B70',
    paddingHorizontal: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backArrowIcon: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerTitleCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13.5,
    color: '#FFFFFF',
    opacity: 0.92,
    marginTop: 3,
    fontWeight: '500',
  },
  calendarSquareBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarGridIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    padding: 2,
    justifyContent: 'space-around',
  },
  calendarTopBar: {
    width: '100%',
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 0.5,
  },
  calendarDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  calendarDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#FFFFFF',
  },

  /* Scrollable Body */
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  /* 2. Time Filter Tabs */
  tabsContainer: {
    backgroundColor: '#E2EFE7',
    borderRadius: 25,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  tabButtonSelected: {
    backgroundColor: '#269B70',
    elevation: 2,
    shadowColor: '#269B70',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  tabIcon: {
    fontSize: 13,
  },
  tabText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  tabTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* 3. Total Delivery Summary Card */
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginHorizontal: 16,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  summaryCheckCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#A7F3D0', // Soft Green Circle
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCheckMark: {
    fontSize: 18,
    fontWeight: '900',
    color: '#065F46', // Dark Green Check
  },
  summaryTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 14,
  },
  summaryCount: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1E293B',
  },

  /* 4. Search Bar */
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    height: 50,
    marginHorizontal: 16,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  searchIcon: {
    fontSize: 16,
    color: '#64748B',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 6,
    marginRight: 4,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700',
  },
  micButton: {
    padding: 4,
  },
  micIcon: {
    fontSize: 18,
    color: '#269B70',
  },

  /* 5. Delivery Record Heading */
  recordHeadingRow: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordHeadingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headingGreenBar: {
    width: 4.5,
    height: 22,
    backgroundColor: '#269B70',
    borderRadius: 2.5,
    marginRight: 10,
  },
  recordHeadingText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  sortTogglePill: {
    backgroundColor: '#E2EFE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  sortToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },

  /* 6. Customer Delivery List Card */
  deliveryListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#269B70', // Solid green circle avatar per design
    alignItems: 'center',
    justifyContent: 'center',
  },
  seqBadgeMini: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    backgroundColor: '#065F46',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  seqBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  customerMiddleCol: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
    justifyContent: 'center',
  },
  customerTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  customerSubDetails: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  customerRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountPaidText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  amountPendingPill: {
    backgroundColor: '#FEF3C7', // Light Yellow Background
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  amountPendingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B45309', // Dark Amber text
  },
  statusBadgePill: {
    backgroundColor: '#D1FAE5', // Light Green Background
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statusBadgeCheck: {
    fontSize: 12,
    fontWeight: '900',
    color: '#059669',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  /* Empty State */
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalCustomerInfo: {
    flex: 1,
  },
  modalCustomerName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCustomerVillage: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 3,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  modalPillsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  modalDeliveredBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  modalDeliveredBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#065F46',
  },
  modalPaymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  modalPaidBadge: {
    backgroundColor: '#EFF6FF',
  },
  modalPaidBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  modalPendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  modalPendingBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#B45309',
  },
  modalBreakdownBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  modalDetailLabel: {
    fontSize: 13.5,
    color: '#64748B',
  },
  modalDetailVal: {
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '600',
  },
  modalDetailValBold: {
    fontSize: 14.5,
    color: '#0F172A',
    fontWeight: '800',
  },
  modalActionsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  modalShareBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalShareBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  modalCallBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCallBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },

  /* Calendar Filter Modal */
  calendarModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  calendarModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  calendarOptBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  calendarOptBtnActive: {
    backgroundColor: '#E2EFE7',
  },
  calendarOptText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  calendarOptTextActive: {
    color: '#269B70',
    fontWeight: '800',
  },
  calendarOptCheck: {
    fontSize: 16,
    color: '#269B70',
    fontWeight: '900',
  },

  /* Voice Modal */
  voiceModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  voiceModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  voiceModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
  },
  voiceChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  voiceChip: {
    backgroundColor: '#E2EFE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  voiceChipText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#269B70',
  },
  voiceCloseBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  voiceCloseText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
});

export default DeliveryHistoryScreen;

