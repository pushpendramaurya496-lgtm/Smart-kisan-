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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BottomDock } from '../components/BottomDock';
import { useChakki } from '../context/ChakkiContext';
import { SpeechService } from '../services/speechService';
import { DashboardApiService } from '../services/dashboardApiService';
import { StorageService } from '../services/storageService';
import { EntryApiService } from '../services/entryApiService';
import { getCustomerTimestamp, formatArrivalTime } from '../utils/customerTimestampHelper';

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

// Clean number format to eliminate ugly floating-point tails
const formatCleanNum = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const num = Math.round(Number(val) * 100) / 100;
  return Number.isInteger(num) ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
};

// Clean delivery time formatter (guaranteed to include hour:min am/pm)
const getDeliveryTimeStrNow = () => {
  const now = new Date();
  let hr = now.getHours();
  const min = String(now.getMinutes()).padStart(2, '0');
  const ampm = hr >= 12 ? 'pm' : 'am';
  hr = hr % 12 || 12;
  return `आज, ${String(hr).padStart(2, '0')}:${min} ${ampm}`;
};

// Clean text and remove trailing dots or special characters (e.g. "Yes." -> "yes")
const normalizeString = (str) => {
  if (!str) return '';
  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ');
};

// Canonical deduplication key: matches on 10-digit phone OR normalized (name + village)
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

// Detect milling/crop type: तेल, आटा, दर्रा, मसाला
const getCropDisplay = (customer) => {
  const itemStr = (
    customer.lastMilledItem ||
    customer.lastItemMilled ||
    customer.category ||
    customer.itemType ||
    (customer.history && customer.history[0]?.item) ||
    ''
  ).toString().toLowerCase();

  if (itemStr.includes('मटर') || itemStr.includes('matar')) {
    return {
      label: 'मटर बेसन',
      icon: '🟢',
      bg: '#F0FDF4',
      border: '#BBF7D0',
      color: '#166534',
      badgeBg: '#DCFCE7',
    };
  }
  if (itemStr.includes('चना') || itemStr.includes('बेसन') || itemStr.includes('chana') || itemStr.includes('besan')) {
    return {
      label: 'चना बेसन',
      icon: '🧆',
      bg: '#FEFCE8',
      border: '#FEF08A',
      color: '#854D0E',
      badgeBg: '#FEF9C3',
    };
  }
  if (itemStr.includes('धनिया') || itemStr.includes('dhaniya')) {
    return {
      label: 'धनिया पिसाई',
      icon: '🌿',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      color: '#065F46',
      badgeBg: '#D1FAE5',
    };
  }
  if (itemStr.includes('मक्का') || itemStr.includes('makka')) {
    return {
      label: 'मक्का आटा',
      icon: '🌽',
      bg: '#FFFBEB',
      border: '#FDE68A',
      color: '#B45309',
      badgeBg: '#FEF3C7',
    };
  }
  if (itemStr.includes('चावल') || itemStr.includes('धान') || itemStr.includes('chawal')) {
    return {
      label: 'चावल पिसाई',
      icon: '🍚',
      bg: '#F8FAFC',
      border: '#CBD5E1',
      color: '#334155',
      badgeBg: '#E2E8F0',
    };
  }
  if (itemStr.includes('तेल') || itemStr.includes('सरसों') || itemStr.includes('oil') || itemStr.includes('mustard')) {
    return {
      label: 'सरसों (तेल पिराई)',
      icon: '🌻',
      bg: '#FFFBEB',
      border: '#FDE68A',
      color: '#B45309',
      badgeBg: '#FEF3C7',
    };
  }
  if (itemStr.includes('मसाला') || itemStr.includes('मिर्च') || itemStr.includes('हल्दी') || itemStr.includes('masala') || itemStr.includes('haldi')) {
    return {
      label: 'मसाला पिसाई',
      icon: '🌶️',
      bg: '#FEF2F2',
      border: '#FECACA',
      color: '#B91C1C',
      badgeBg: '#FEE2E2',
    };
  }
  if (itemStr.includes('दर्रा') || itemStr.includes('दलिया') || itemStr.includes('darra')) {
    return {
      label: 'दर्रा पिसाई',
      icon: '🥣',
      bg: '#FAF5FF',
      border: '#E9D5FF',
      color: '#7E22CE',
      badgeBg: '#F3E8FF',
    };
  }
  return {
    label: 'गेहूं (आटा पिसाई)',
    icon: '🌾',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    color: '#15803D',
    badgeBg: '#DCFCE7',
  };
};

export const PickupDeliveryScreen = ({ navigation }) => {
  const { stats, customers: contextCustomers, refreshStats, markOrderDelivered, language } = useChakki();
  const insets = useSafeAreaInsets();
  const topSafePadding = Math.max(insets.top || 0, 36) + 4;

  const getTodayHindiDate = () => {
    const now = new Date();
    return now.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayHindiDate());
  const [showDateModal, setShowDateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'PAID'
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showVoiceSearchModal, setShowVoiceSearchModal] = useState(false);
  const [voiceQueryText, setVoiceQueryText] = useState('');
  const [customerList, setCustomerList] = useState([]);
  const [deliveredKeys, setDeliveredKeys] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const loadRealCustomers = useCallback(async () => {
    try {
      // 0. Load delivered IDs to immediately filter out delivered customers
      const deliveredList = await StorageService.getDeliveredIds();
      const delSet = new Set((deliveredList || []).map((id) => normalizeString(id)));
      setDeliveredKeys(delSet);

      const autoMigrateToHistory = (c) => {
        const isPaidFull = (c.pendingBalance !== undefined && Number(c.pendingBalance) <= 0) || c.isPaid;
        if (isPaidFull) {
          const sId = String(c.id || c.customerId || c._id || c.name);
          const wt = Number(c.weightKg || c.totalPisaiKg || 0);
          const amt = Number(c.totalAmount || c.amountPaid || (wt > 0 ? wt * 3.5 : 0));
          StorageService.markDelivered(sId, {
            id: sId,
            customerId: sId,
            customerName: c.name || c.customerName || 'ग्राहक',
            village: c.village || '',
            phone: c.phone || '',
            weightKg: wt,
            itemLabel: c.lastMilledItem || 'गेहूं पिसाई',
            totalAmount: amt,
            amountPaid: amt,
            pendingAmount: 0,
            isPaid: true,
            status: 'ले जा चुके',
            deliveryTimestamp: getCustomerTimestamp(c) || Date.now(),
            deliveryTimeStr: c.timeStr || getDeliveryTimeStrNow(),
          });
        }
      };

      const isDelivered = (c) => {
        if (!c) return true;
        if (c.isDelivered) return true;
        // User requirement: "पैसे देने के बाद यहाँ से हट जाये और तुरंत हिस्ट्री में ऐड हो जाये"
        const isPaidFull = (c.pendingBalance !== undefined && Number(c.pendingBalance) <= 0) || c.isPaid;
        if (isPaidFull) {
          autoMigrateToHistory(c);
          return true;
        }
        const id1 = normalizeString(c.id);
        const id2 = normalizeString(c.customerId);
        const id3 = normalizeString(c._id);
        const name = normalizeString(c.name || c.customerName);
        const dKey = getCustomerDedupKey(c);
        return (
          (id1 && delSet.has(id1)) ||
          (id2 && delSet.has(id2)) ||
          (id3 && delSet.has(id3)) ||
          (name && delSet.has(name)) ||
          (dKey && delSet.has(dKey))
        );
      };

      // 1. Fetch from backend API
      const apiData = await DashboardApiService.getCustomers('today');
      const dedupMap = new Map();

      if (apiData && Array.isArray(apiData.customers) && apiData.customers.length > 0) {
        apiData.customers.forEach((c) => {
          if (isDelivered(c)) return;
          const key = getCustomerDedupKey(c);
          if (key) {
            dedupMap.set(key, c);
          }
        });
      }

      // 2. Also load from local storage (merge with backend, never duplicate)
      const local = await StorageService.getCustomers();
      if (Array.isArray(local) && local.length > 0) {
        local.forEach((l) => {
          if (isDelivered(l)) return;
          const key = getCustomerDedupKey(l);
          if (key) {
            if (!dedupMap.has(key)) {
              dedupMap.set(key, l);
            } else {
              // Merge: keep best properties
              const existing = dedupMap.get(key);
              dedupMap.set(key, {
                ...l,
                ...existing,
                village: (existing.village && existing.village !== 'ग्राम') ? existing.village : (l.village || 'ग्राम'),
                phone: existing.phone || l.phone || '',
                weightKg: Math.max(Number(existing.weightKg) || 0, Number(l.weightKg) || 0),
                totalPisaiKg: Math.max(Number(existing.totalPisaiKg) || 0, Number(l.totalPisaiKg) || 0),
                pendingBalance: existing.pendingBalance !== undefined ? existing.pendingBalance : l.pendingBalance,
              });
            }
          }
        });
      }

      setCustomerList(Array.from(dedupMap.values()));
    } catch (e) {
      const deliveredList = await StorageService.getDeliveredIds();
      const delSet = new Set((deliveredList || []).map((id) => normalizeString(id)));
      setDeliveredKeys(delSet);
      const local = await StorageService.getCustomers();
      const dedupMap = new Map();
      (local || []).forEach((l) => {
        if (!l || l.isDelivered || (l.pendingBalance !== undefined && Number(l.pendingBalance) <= 0) || l.isPaid) return;
        const id1 = normalizeString(l.id);
        const name = normalizeString(l.name || l.customerName);
        const dKey = getCustomerDedupKey(l);
        if ((id1 && delSet.has(id1)) || (name && delSet.has(name)) || (dKey && delSet.has(dKey))) return;
        if (dKey && !dedupMap.has(dKey)) {
          dedupMap.set(dKey, l);
        }
      });
      setCustomerList(Array.from(dedupMap.values()));
    }
  }, []);

  useEffect(() => {
    loadRealCustomers();
  }, [loadRealCustomers, contextCustomers]);

  // Reload when screen gains focus after payment in CustomerDashboard
  useEffect(() => {
    const unsubscribe = navigation?.addListener ? navigation.addListener('focus', () => {
      loadRealCustomers();
    }) : undefined;
    return unsubscribe;
  }, [navigation, loadRealCustomers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRealCustomers();
    if (refreshStats) {
      await refreshStats();
    }
    setRefreshing(false);
  };

  // Combine live context customers with API customer list (strictly deduplicated & excluding delivered)
  const effectiveCustomerList = (() => {
    const map = new Map();

    const isCustomerDelivered = (c) => {
      if (!c) return true;
      if (c.isDelivered) return true;
      // Per user instruction: "पैसे देने के बाद यहाँ से हट जाये और तुरंत हिस्ट्री में ऐड हो जाये"
      const isPaidFull = (c.pendingBalance !== undefined && Number(c.pendingBalance) <= 0) || c.isPaid;
      if (isPaidFull) return true;
      const id1 = normalizeString(c.id);
      const id2 = normalizeString(c.customerId);
      const id3 = normalizeString(c._id);
      const name = normalizeString(c.name || c.customerName);
      const dKey = getCustomerDedupKey(c);
      return (
        (id1 && deliveredKeys.has(id1)) ||
        (id2 && deliveredKeys.has(id2)) ||
        (id3 && deliveredKeys.has(id3)) ||
        (name && deliveredKeys.has(name)) ||
        (dKey && deliveredKeys.has(dKey))
      );
    };

    // 1. Add context customers (most recent live additions from NewEntryScreen)
    (contextCustomers || []).forEach((c) => {
      const displayName = c.name || c.customerName || '';
      if (!displayName || isCustomerDelivered(c)) return;
      const key = getCustomerDedupKey(c);
      const last = (c.history && c.history[0]) || {};
      const ts = getCustomerTimestamp(c);
      const timeStr = formatArrivalTime(c) || last.date || 'आज';
      const wt = c.lastMilledWeight || last.weight || last.weightKg || c.totalPisaiKg || 0;
      const rate = c.ratePerKg || last.rate || 3.5;
      const totAmt = c.totalAmount || last.total || last.totalAmount || (wt > 0 ? wt * rate : 0) || c.pendingBalance || 0;

      map.set(key, {
        id: c.id || c._id,
        customerId: c.id || c._id,
        name: displayName,
        village: c.village || 'ग्राम',
        phone: c.phone || '',
        totalPisaiKg: c.totalPisaiKg || 0,
        weightKg: wt,
        ratePerKg: rate,
        totalAmount: totAmt,
        pendingBalance: c.pendingBalance || 0,
        isPending: (c.pendingBalance || 0) > 0,
        lastMilledItem: c.lastItemMilled || last.itemLabel || last.item || 'गेहूं पिसाई',
        timeStr,
        history: c.history || [],
        avatarBg: c.avatarBg,
        avatarColor: c.avatarColor,
        createdAt: c.createdAt,
        timestamp: ts,
        orderIndex: ts,
      });
    });

    // 2. Merge backend API customers (deduplicated by getCustomerDedupKey)
    (customerList || []).forEach((c) => {
      const displayName = c.name || c.customerName || '';
      if (!displayName || isCustomerDelivered(c)) return;
      const key = getCustomerDedupKey(c);
      const existing = map.get(key);
      const ts = getCustomerTimestamp(c);
      const timeStr = formatArrivalTime(c) || c.timeStr || 'आज';
      const wt = c.weightKg || c.totalPisaiKg || (parseInt(c.weight) || 0);
      const rate = c.ratePerKg || 3.5;
      const totAmt = c.totalAmount || (wt > 0 ? wt * rate : 0) || c.pendingBalance || 0;

      if (!existing) {
        map.set(key, {
          id: c.id || c.customerId || c._id,
          customerId: c.id || c.customerId || c._id,
          name: displayName,
          village: c.village || 'ग्राम',
          phone: c.phone || '',
          totalPisaiKg: c.totalPisaiKg || c.totalWeightKg || 0,
          weightKg: wt,
          ratePerKg: rate,
          totalAmount: totAmt,
          pendingBalance: c.pendingBalance || 0,
          isPending: (c.pendingBalance || 0) > 0 || c.isPending,
          lastMilledItem: c.lastMilledItem || c.category || 'गेहूं पिसाई',
          timeStr,
          history: c.history || [],
          avatarBg: c.avatarBg,
          avatarColor: c.avatarColor,
          createdAt: c.createdAt,
          timestamp: ts,
          orderIndex: ts,
        });
      } else {
        const bestTs = Math.max(existing.timestamp || 0, ts || 0);
        map.set(key, {
          ...existing,
          id: c.id || c.customerId || c._id || existing.id,
          customerId: c.customerId || c.id || c._id || existing.customerId || existing.id,
          name: displayName || existing.name,
          village: (existing.village && existing.village !== 'ग्राम') ? existing.village : (c.village || 'ग्राम'),
          phone: existing.phone || c.phone || '',
          pendingBalance: c.pendingBalance !== undefined ? c.pendingBalance : existing.pendingBalance,
          weightKg: existing.weightKg || wt,
          ratePerKg: existing.ratePerKg || rate,
          totalAmount: existing.totalAmount || totAmt,
          lastMilledItem: existing.lastMilledItem || c.lastMilledItem || c.category || 'गेहूं पिसाई',
          timeStr: existing.timeStr || timeStr || 'आज',
          timestamp: bestTs,
          orderIndex: bestTs,
        });
      }
    });

    const result = Array.from(map.values());

    // Sort by arrival sequence: First-come first-served (जो ग्राहक पहले आया वो सबसे ऊपर क्रमानुसार #1, #2...)
    result.sort((a, b) => {
      const tokA = a.tokenNumber ? parseInt(a.tokenNumber, 10) : NaN;
      const tokB = b.tokenNumber ? parseInt(b.tokenNumber, 10) : NaN;
      if (!isNaN(tokA) && !isNaN(tokB) && tokA !== tokB) {
        return tokA - tokB;
      }
      const timeA = a.timestamp || getCustomerTimestamp(a) || 0;
      const timeB = b.timestamp || getCustomerTimestamp(b) || 0;
      if (timeA && timeB && timeA !== timeB) return timeA - timeB;
      return (a.orderIndex || 0) - (b.orderIndex || 0);
    });

    return result;
  })();

  const handleApplyVoiceQuery = (queryToApply) => {
    const text = (queryToApply !== undefined ? queryToApply : voiceQueryText).trim();
    if (!text) return;
    try {
      Haptics.selectionAsync();
    } catch (e) { }
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
    else if (tabId === 'history') navigation.navigate('DeliveryHistory');
    else if (tabId === 'settings') navigation.navigate('Settings');
  };

  // Instant filtering on Customer Name, Village & Phone (case-insensitive & lag-free)
  const filteredCustomers = (() => {
    const query = searchQuery.trim().toLowerCase();
    const rawPhone = searchQuery.trim().replace(/\D/g, '');
    return effectiveCustomerList.filter((item) => {
      const nameStr = (item.name || item.customerName || '').toLowerCase();
      const villageStr = (item.village || '').toLowerCase();
      const phoneStr = (item.phone || '').replace(/\D/g, '');

      const matchesName = nameStr.includes(query);
      const matchesVillage = villageStr.includes(query);
      const matchesPhone = rawPhone.length >= 3 && phoneStr.includes(rawPhone);
      const matchesSearch = query === '' || matchesName || matchesVillage || matchesPhone;

      // Filter status
      if (activeFilter === 'PENDING') {
        return matchesSearch && ((item.pendingBalance || 0) > 0 || item.isPending);
      }
      if (activeFilter === 'PAID') {
        return matchesSearch && ((item.pendingBalance || 0) === 0 && !item.isPending);
      }
      return matchesSearch;
    });
  })();

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

  // Action when customer name/card is tapped: If pending, open payment; if already paid, complete delivery
  const handleCustomerPress = (customer) => {
    try {
      Haptics.selectionAsync();
    } catch (e) { }
    const hasPending = (customer.pendingBalance || 0) > 0;
    if (!hasPending) {
      handleDeliverOrder(customer);
      return;
    }
    navigation.navigate('CustomerDashboard', {
      customerId: customer.id || customer.customerId || customer._id,
      customer,
      openPayModal: true,
    });
  };

  // Complete Delivery action (Removes from Pickup Screen and pushes to Delivery History)
  const handleDeliverOrder = async (customer) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) { }

    const sId = String(customer.id || customer.customerId || customer._id || customer.name);
    const custName = customer.name || customer.customerName || 'ग्राहक';

    // Calculate accurate amounts for this delivered order
    const orderWeight = Number(customer.weightKg || customer.totalPisaiKg || 0);
    const orderPending = Number(customer.pendingBalance || 0);
    const orderTotal = Number(
      customer.totalAmount ||
      (customer.history && customer.history[0]?.total) ||
      (customer.history && customer.history[0]?.totalAmount) ||
      (orderWeight > 0 ? (customer.ratePerKg ? orderWeight * customer.ratePerKg : orderWeight * 3.5) : 0) ||
      orderPending ||
      0
    );
    const orderPaid = orderTotal >= orderPending ? (orderTotal - orderPending) : (customer.amountPaid || orderTotal);
    const cropDisplay = getCropDisplay(customer);
    const itemLabel = customer.lastMilledItem || cropDisplay?.label || 'गेहूं पिसाई';

    // 1. Mark in backend if connected
    try {
      await EntryApiService.deliverEntry(customer.id || customer.customerId || customer._id, {
        amountPaid: orderPending,
        paymentMethod: 'CASH',
        notes: 'माल सुपुर्दगी दर्ज',
      });
    } catch (err) { }

    // 2. Mark in Context & Local Storage (Pushes immediately to top of Delivery History)
    if (markOrderDelivered) {
      await markOrderDelivered({
        customerId: sId,
        customerName: custName,
        village: customer.village || '',
        phone: customer.phone || '',
        weightKg: orderWeight,
        itemLabel: itemLabel,
        totalAmount: orderTotal > 0 ? orderTotal : (orderPaid + orderPending),
        amountPaid: orderTotal > 0 ? orderTotal : orderPaid,
        pendingAmount: 0,
      });
    } else {
      await StorageService.markDelivered(sId, {
        id: sId,
        customerId: sId,
        customerName: custName,
        village: customer.village || '',
        phone: customer.phone || '',
        weightKg: orderWeight,
        itemLabel: itemLabel,
        totalAmount: orderTotal > 0 ? orderTotal : (orderPaid + orderPending),
        amountPaid: orderTotal > 0 ? orderTotal : orderPaid,
        pendingAmount: 0,
        isPaid: true,
        status: 'ले जा चुके',
        deliveryTimestamp: Date.now(),
        deliveryTimeStr: getDeliveryTimeStrNow(),
      });
    }

    // 3. Immediately remove customer from Pickup screen (by sId, name, normName, and dedupKey)
    const normName = normalizeString(custName);
    const dedupKey = getCustomerDedupKey(customer);
    setDeliveredKeys((prev) => new Set([...prev, sId, custName, normName, dedupKey]));
    setCustomerList((prev) =>
      prev.filter((c) => {
        const cDedup = getCustomerDedupKey(c);
        const cNorm = normalizeString(c.name || c.customerName);
        const cId = String(c.id || c.customerId || c._id);
        return cDedup !== dedupKey && cNorm !== normName && cId !== sId;
      })
    );

    setSelectedCustomer(null);
    setDeliverySuccessModal(customer);
    SpeechService.speak(`${custName} का माल सुपुर्द कर दिया गया है।`);
  };

  // Render individual customer card
  const renderCustomerItem = ({ item: customer, index }) => {
    const avatarStyle = getAvatarStyle(customer, index);
    const displayName = customer.name || customer.customerName || 'अज्ञात ग्राहक';
    const initials = customer.avatarText || getAvatarInitials(displayName);
    const weightVal = customer.weightKg || customer.totalPisaiKg || (parseInt(customer.weight) || 0);
    const crop = getCropDisplay(customer);
    const hasPending = (customer.pendingBalance || 0) > 0;

    return (
      <TouchableOpacity
        key={customer.id || customer._id || `cust_${index}`}
        style={styles.customerCard}
        activeOpacity={0.82}
        onPress={() => handleCustomerPress(customer)}
      >
        {/* ROW 1: Avatar, Name (Full Width, Never Truncated), Village/Phone, Payment Pill & Chevron */}
        <View style={styles.cardTopRow}>
          {/* Circular Colored Avatar with Initials */}
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

          {/* Customer Name & Village (flex: 1 gives full space to show full name!) */}
          <View style={styles.customerNameCol}>
            <Text style={styles.customerName} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.villageRow}>
              <Text style={styles.pinIcon}>📍</Text>
              <Text style={styles.villageText} numberOfLines={1}>
                {customer.village || 'ग्राम'}
              </Text>
              {customer.phone ? (
                <Text style={styles.cardPhoneText} numberOfLines={1}>
                  {'  '}📞 {customer.phone}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Right: Payment Status Pill & Chevron */}
          <View style={styles.statusAndChevronCol}>
            <View
              style={[
                styles.paymentMiniPill,
                hasPending ? styles.paymentMiniPillRed : styles.paymentMiniPillGreen,
              ]}
            >
              <Text
                style={[
                  styles.paymentMiniText,
                  hasPending ? styles.paymentTextRed : styles.paymentTextGreen,
                ]}
              >
                {hasPending ? `₹${formatCleanNum(customer.pendingBalance)} बाकी` : '✓ चुकता'}
              </Text>
            </View>
            <Text style={styles.chevronIcon}>›</Text>
          </View>
        </View>

        {/* Subtle Horizontal Divider */}
        <View style={styles.cardInnerDivider} />

        {/* ROW 2: Crop Type (आटा, तेल, दर्रा, मसाला) with Icon + Weight in KG + Date & Action */}
        <View style={styles.cardBottomRow}>
          {/* Crop Badge Pill */}
          <View
            style={[
              styles.cropBadgePill,
              { backgroundColor: crop.bg, borderColor: crop.border },
            ]}
          >
            <Text style={styles.cropBadgeIcon}>{crop.icon}</Text>
            <Text style={[styles.cropBadgeLabel, { color: crop.color }]}>
              {crop.label}
            </Text>
            {weightVal > 0 ? (
              <View style={[styles.weightInnerBadge, { backgroundColor: crop.badgeBg }]}>
                <Text style={[styles.weightInnerText, { color: crop.color }]}>
                  {formatCleanNum(weightVal)} kg
                </Text>
              </View>
            ) : null}
          </View>

          {/* Right Action: Date + Handover button */}
          <View style={styles.bottomRowRightAction}>
            <Text style={styles.dateLabelText}>
              📅 {customer.timeStr || (customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('hi-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : 'आज')}
            </Text>
            <TouchableOpacity
              style={styles.cardDeliverBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleDeliverOrder(customer);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.cardDeliverBtnText}>📦 माल दें</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render Empty State
  const renderEmptyState = () => (
    <View style={styles.emptyStateCard}>
      <Text style={styles.emptyStateEmoji}>🌾</Text>
      <Text style={styles.emptyStateTitle}>कोई माल लेने वाला ग्राहक नहीं है</Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery.trim()
          ? `"${searchQuery}" नाम या गाँव से कोई रिकॉर्ड उपलब्ध नहीं है`
          : 'नई पिसाई दर्ज करने पर ग्राहक यहाँ दिखाई देंगे'}
      </Text>
      {searchQuery.trim().length > 0 && (
        <TouchableOpacity
          style={styles.resetSearchBtn}
          onPress={() => setSearchQuery('')}
        >
          <Text style={styles.resetSearchBtnText}>सभी ग्राहक दिखाएं</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Calculate live, non-zero counters for top cards (Always updated!)
  const totalCustomersCount = Math.max(
    Number(stats?.totalCustomers) || 0,
    effectiveCustomerList.length,
    (contextCustomers || []).length
  );

  const todayEntriesCount = Math.max(
    Number(stats?.todayAdded) || 0,
    Number(stats?.todayEntries) || 0,
    effectiveCustomerList.length,
    (contextCustomers || []).length
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
            <Text style={styles.headerMainTitle}>{language === 'hi' ? 'आटा चक्की' : 'Flour Mill'}</Text>
            <Text style={styles.headerSubtitle}>{language === 'hi' ? 'ग्राहक प्रबंधन प्रणाली' : 'Customer Management'}</Text>
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
          {/* First Card: कुल ग्राहक */}
          <View style={styles.statCard}>
            <View style={styles.statCardTopRow}>
              {/* Soft Green Users Icon Box */}
              <View style={styles.statIconBoxGreen}>
                <Text style={styles.statIconGreen}>👥</Text>
              </View>
              {/* Label & Number */}
              <View style={styles.statTextCol}>
                <Text style={styles.statLabel}>{language === 'hi' ? 'कुल ग्राहक' : 'Total Customers'}</Text>
                <Text style={styles.statValueGreen}>
                  {totalCustomersCount}
                </Text>
              </View>
            </View>
            {/* Green Growth Badge Aligned Bottom-Right */}
            {(stats?.growthPercent || 0) > 0 ? (
              <View style={styles.growthBadgeGreen}>
                <Text style={styles.growthBadgeTextGreen}>↗ +{stats.growthPercent}%</Text>
              </View>
            ) : null}
          </View>

          {/* Second Card: आज की एंट्री */}
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
                <Text style={styles.statLabel}>{language === 'hi' ? 'आज की एंट्री' : "Today's Entries"}</Text>
                <Text style={styles.statValueDark}>
                  {todayEntriesCount}
                </Text>
              </View>
            </View>
            {/* Blue Badge Aligned Bottom-Right */}
            {todayEntriesCount > 0 ? (
              <View style={styles.indicatorBadgeBlue}>
                <Text style={styles.indicatorBadgeTextBlue}>+{todayEntriesCount} आज</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* 3. SEARCH BAR (ग्राहक का नाम या गाँव लिखकर खोजें...) with Mic Button */}
        <View style={styles.searchBoxContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={language === 'hi' ? 'ग्राहक का नाम या गाँव लिखकर खोजें...' : 'Search by customer name or village...'}
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
              try { Haptics.selectionAsync(); } catch (e) { }
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
        keyExtractor={(item, index) => item.id || item._id || `cust_${index}`}
        renderItem={renderCustomerItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listScrollContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={renderEmptyState}
        style={styles.customerListWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#006B3C']}
            tintColor="#006B3C"
          />
        }
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
                    {selectedCustomer.avatarText || getAvatarInitials(selectedCustomer.name || selectedCustomer.customerName)}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.deliveryCustName}>
                    {selectedCustomer.name || selectedCustomer.customerName || 'अज्ञात ग्राहक'}
                  </Text>
                  <Text style={styles.deliveryCustVillage}>
                    📍 {selectedCustomer.village || 'ग्राम'}{selectedCustomer.phone ? ` • 📞 ${selectedCustomer.phone}` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.deliveryDivider} />

              {/* Order summary info */}
              <View style={styles.deliverySummaryRow}>
                <View style={styles.deliveryStatBox}>
                  <Text style={styles.deliveryStatLabel}>पिसाई वजन</Text>
                  <Text style={styles.deliveryStatVal}>
                    🌾 {formatCleanNum(selectedCustomer.weightKg || selectedCustomer.totalPisaiKg)} kg
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
                      ? `₹${formatCleanNum(selectedCustomer.pendingBalance)} बाकी`
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
              <View style={styles.successButtonsRow}>
                <TouchableOpacity
                  style={styles.successOkBtn}
                  onPress={() => setDeliverySuccessModal(null)}
                >
                  <Text style={styles.successOkBtnText}>ठीक है</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.successHistoryBtn}
                  onPress={() => {
                    setDeliverySuccessModal(null);
                    navigation.navigate('DeliveryHistory');
                  }}
                >
                  <Text style={styles.successHistoryBtnText}>📜 हिस्ट्री देखें</Text>
                </TouchableOpacity>
              </View>
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
            {(() => {
              const now = new Date();
              const todayStr = `${now.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' })} (आज)`;
              const yest = new Date(now);
              yest.setDate(now.getDate() - 1);
              const yestStr = `${yest.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' })} (कल)`;
              return [todayStr, yestStr, 'इस सप्ताह', 'सभी रिकॉर्ड'];
            })().map((dateOpt) => {
              const cleanDate = dateOpt.includes('(')
                ? dateOpt.split(' ')[0] + ' ' + (dateOpt.split(' ')[1] || '').replace('(', '').replace(')', '')
                : dateOpt;
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
                  } catch (e) { }
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
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '900',
  },
  customerNameCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#063A1B',
  },
  villageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'nowrap',
  },
  pinIcon: {
    fontSize: 12,
    marginRight: 3,
    color: '#EF4444', // Red location pin matching reference
  },
  villageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  cardPhoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  statusAndChevronCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMiniPill: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  paymentMiniPillRed: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  paymentMiniPillGreen: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  paymentMiniText: {
    fontSize: 11,
    fontWeight: '800',
  },
  paymentTextRed: {
    color: '#DC2626',
  },
  paymentTextGreen: {
    color: '#16A34A',
  },
  chevronIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94A3B8',
    marginLeft: 4,
  },
  cardInnerDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 9,
    width: '100%',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  cropBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    gap: 5,
  },
  cropBadgeIcon: {
    fontSize: 13.5,
  },
  cropBadgeLabel: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  weightInnerBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
    marginLeft: 2,
  },
  weightInnerText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  dateLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  bottomRowRightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardDeliverBtn: {
    backgroundColor: '#0F5132',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 10,
    elevation: 1,
  },
  cardDeliverBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
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
  successButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 6,
  },
  successOkBtn: {
    flex: 1,
    backgroundColor: '#0F4A2C',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successOkBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  successHistoryBtn: {
    flex: 1.2,
    backgroundColor: '#E1F5EC',
    borderWidth: 1.5,
    borderColor: '#0F5132',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successHistoryBtnText: {
    color: '#0F5132',
    fontSize: 13.5,
    fontWeight: '800',
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
