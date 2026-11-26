import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../services/storageService';
import { DefaultRates } from '../constants/defaultRates';
import { SpeechService } from '../services/speechService';
import { AuthApiService } from '../services/authApiService';
import { DashboardApiService } from '../services/dashboardApiService';
import { translations } from '../constants/translations';

// Clean delivery time formatter (guaranteed to include hour:min am/pm)
const getDeliveryTimeStrNow = () => {
  const now = new Date();
  let hr = now.getHours();
  const min = String(now.getMinutes()).padStart(2, '0');
  const ampm = hr >= 12 ? 'pm' : 'am';
  hr = hr % 12 || 12;
  return `आज, ${String(hr).padStart(2, '0')}:${min} ${ampm}`;
};

const ChakkiContext = createContext(null);

export const ChakkiProvider = ({ children }) => {
  const [language, setLanguageState] = useState('hi'); // Default Hindi
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    todayEarnings: 0,
    todayPisaiKg: 0,
    totalCustomers: 0,
    todayEntries: 0,
    pendingDebt: 0,
    totalExpense: 0,
    growthPercent: 0,
    todayAdded: 0,
  });

  const [customers, setCustomers] = useState([]);
  const [rates, setRates] = useState(DefaultRates);
  const [loading, setLoading] = useState(true);
  const [lastDeliveryTimestamp, setLastDeliveryTimestamp] = useState(Date.now());

  useEffect(() => {
    loadInitialData();
  }, []);

  const refreshStats = async () => {
    try {
      const liveStats = await DashboardApiService.getStats();
      if (liveStats) {
        setStats((prev) => ({
          ...prev,
          ...liveStats,
          todayPisaiKg: Number(liveStats.todayPisaiKg) !== undefined ? Number(liveStats.todayPisaiKg) : (prev?.todayPisaiKg || 0),
          todayEarnings: Number(liveStats.todayEarnings) !== undefined ? Number(liveStats.todayEarnings) : (prev?.todayEarnings || 0),
          cashReceived: Number(liveStats.cashReceived) !== undefined ? Number(liveStats.cashReceived) : (prev?.cashReceived || 0),
          pendingDebt: Number(liveStats.pendingDebt) !== undefined ? Number(liveStats.pendingDebt) : (prev?.pendingDebt || 0),
          totalCustomers: Number(liveStats.totalCustomers) !== undefined ? Number(liveStats.totalCustomers) : (prev?.totalCustomers || 0),
          todayAdded: Number(liveStats.todayAdded) !== undefined ? Number(liveStats.todayAdded) : (prev?.todayAdded || 0),
          todayEntries: Number(liveStats.todayEntries) !== undefined ? Number(liveStats.todayEntries) : (prev?.todayEntries || 0),
        }));
      }
    } catch (e) {}
  };

  const loadInitialData = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('@chakki_language');
      if (savedLang === 'en' || savedLang === 'hi') {
        setLanguageState(savedLang);
      }
      const savedUserStr = await AsyncStorage.getItem('@chakki_user');
      if (savedUserStr) {
        setCurrentUser(JSON.parse(savedUserStr));
      }
    } catch (e) {}

    const loadedCustomers = await StorageService.getCustomers();
    setCustomers(loadedCustomers);
    await refreshStats();
    setLoading(false);
  };

  const setLanguage = async (lang) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('@chakki_language', lang);
    } catch (e) {}
  };

  // Update user profile and persist
  const updateUserProfile = async (updatedFields) => {
    try {
      const mergedUser = {
        ...(currentUser || {}),
        ...updatedFields,
        phone: updatedFields.phone || currentUser?.phone || '9876543210',
        profile: {
          ...(currentUser?.profile || {}),
          ...(updatedFields.profile || {}),
        },
        servicesOffered: updatedFields.servicesOffered || currentUser?.servicesOffered || ['PISAI', 'OIL', 'MASALA'],
        defaultRates: {
          ...(currentUser?.defaultRates || {}),
          ...(updatedFields.defaultRates || {}),
        },
      };
      setCurrentUser(mergedUser);
      await AsyncStorage.setItem('@chakki_user', JSON.stringify(mergedUser));

      if (updatedFields.defaultRates) {
        setRates((prev) => ({ ...prev, ...updatedFields.defaultRates }));
      }

      // Also sync to backend API if token is present
      try {
        const token = await AsyncStorage.getItem('@chakki_token');
        if (token) {
          AuthApiService.updateProfile(token, {
            ownerName: mergedUser.profile?.ownerName,
            chakkiName: mergedUser.profile?.chakkiName,
            village: mergedUser.profile?.village,
            profileImage: mergedUser.profile?.profileImage,
            servicesOffered: mergedUser.servicesOffered,
            defaultRates: mergedUser.defaultRates,
          }).catch(() => {});
        }
      } catch (err) {}

      return mergedUser;
    } catch (e) {
      console.warn('Failed to update user profile in context:', e);
    }
  };

  // Instant translation helper
  const t = (key) => {
    return translations[language]?.[key] || translations['hi']?.[key] || key;
  };

  // Add a new grinding / pressing entry
  const addEntry = ({
    customerId = null,
    customerName,
    village = '',
    phone = '',
    item,
    weight,
    rate,
    isPaid = false,
    amountPaid = 0,
    totalAmount = null,
    pendingAmount = null,
    createNew = false,
    skipVoice = false,
  }) => {
    const wt = parseFloat(weight) || 0;
    const rt = parseFloat(rate) || 0;
    const calcTotal = totalAmount !== null && totalAmount !== undefined ? parseFloat(totalAmount) : Math.round(wt * rt * 100) / 100;
    const paid = parseFloat(amountPaid) || (isPaid ? calcTotal : 0);
    const pending = pendingAmount !== null && pendingAmount !== undefined ? parseFloat(pendingAmount) : Math.max(0, Math.round((calcTotal - paid) * 100) / 100);

    const newEntry = {
      id: 'entry_' + Date.now(),
      date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      item,
      weight: wt,
      rate: rt,
      total: calcTotal,
      amountPaid: paid,
      pendingAmount: pending,
      status: pending === 0 ? 'चुकाया' : 'बाकी',
    };

    let isExistingCustomer = false;

    setCustomers((prevCustomers) => {
      let found = false;
      let updated = prevCustomers;

      if (!createNew) {
        let matchedItem = null;
        const otherCustomers = [];

        for (const cust of prevCustomers) {
          const matchById = customerId && (
            String(cust.id) === String(customerId) ||
            String(cust._id) === String(customerId) ||
            String(cust.customerId) === String(customerId)
          );
          const cleanCustName = (cust.name || cust.customerName || '').trim().toLowerCase();
          const cleanTargetName = (customerName || '').trim().toLowerCase();
          const cleanCustVillage = (cust.village || '').trim().toLowerCase();
          const cleanTargetVillage = (village || '').trim().toLowerCase();

          // Match by name (and village if provided)
          const matchByName = cleanCustName && cleanCustName === cleanTargetName && (
            !cleanTargetVillage || !cleanCustVillage || cleanCustVillage === cleanTargetVillage
          );

          // Match by phone if phone numbers exist and match
          const cleanCustPhone = (cust.phone || '').replace(/\D/g, '');
          const cleanTargetPhone = (phone || '').replace(/\D/g, '');
          const matchByPhone = cleanTargetPhone.length >= 10 && cleanCustPhone === cleanTargetPhone;

          if (!matchedItem && (matchById || matchByName || matchByPhone)) {
            found = true;
            isExistingCustomer = true;
            const prevPending = Number(cust.pendingBalance) || 0;
            const newPending = Math.round((prevPending + pending) * 100) / 100;
            matchedItem = {
              ...cust,
              village: village || cust.village || '',
              phone: phone || cust.phone || '',
              totalPisaiKg: Math.round(((Number(cust.totalPisaiKg) || 0) + wt) * 100) / 100,
              pendingBalance: newPending,
              isPending: newPending > 0,
              isDelivered: newPending === 0,
              history: [newEntry, ...(cust.history || [])],
              lastItemMilled: item,
              lastMilledWeight: wt,
              lastMilledDate: newEntry.date,
              createdAt: new Date().toISOString(),
              lastVisitDate: new Date().toISOString(),
              orderIndex: Date.now(),
            };
          } else {
            otherCustomers.push(cust);
          }
        }

        if (found && matchedItem) {
          // Customer who made entry is placed at the VERY TOP of sequence
          updated = [matchedItem, ...otherCustomers];
        }
      }

      if (!found || createNew) {
        updated = [
          {
            id: customerId || 'cust_' + Date.now(),
            name: customerName,
            village: village || '',
            phone: phone || '',
            totalPisaiKg: wt,
            pendingBalance: pending,
            isPending: pending > 0,
            isDelivered: pending === 0,
            history: [newEntry],
            lastItemMilled: item,
            lastMilledWeight: wt,
            lastMilledDate: newEntry.date,
            createdAt: new Date().toISOString(),
            lastVisitDate: new Date().toISOString(),
            orderIndex: Date.now(),
          },
          ...prevCustomers,
        ];
      }

      StorageService.saveCustomers(updated);

      // If fully paid, add directly to delivery history so they don't linger in pickup screen
      if (pending === 0) {
        const sId = String(customerId || 'cust_' + Date.now());
        StorageService.markDelivered(sId, {
          id: sId,
          customerId: sId,
          customerName: customerName,
          village: village || '',
          phone: phone || '',
          weightKg: wt,
          itemLabel: item,
          totalAmount: calcTotal,
          amountPaid: paid,
          pendingAmount: 0,
          isPaid: true,
          status: 'ले जा चुके',
          deliveryTimestamp: Date.now(),
          deliveryTimeStr: getDeliveryTimeStrNow(),
        });
        setLastDeliveryTimestamp(Date.now());
      }

      return updated;
    });

    // Update daily stats locally with exact amounts immediately
    setStats((prev) => ({
      ...prev,
      todayPisaiKg: Math.round(((prev?.todayPisaiKg || 0) + wt) * 100) / 100,
      todayEarnings: Math.round(((prev?.todayEarnings || 0) + paid) * 100) / 100,
      cashReceived: Math.round(((prev?.cashReceived || 0) + paid) * 100) / 100,
      pendingDebt: Math.round(((prev?.pendingDebt || 0) + pending) * 100) / 100,
      totalCustomers: (prev?.totalCustomers || 0) + 1,
      todayAdded: (prev?.todayAdded || 0) + 1,
      todayEntries: (prev?.todayEntries || 0) + 1,
    }));

    // Re-sync with backend real statistics in background without blocking
    setTimeout(() => {
      refreshStats();
    }, 600);

    // Voice announcement if not handled by caller
    if (!skipVoice) {
      if (paid > 0 && pending === 0) {
        SpeechService.announceCashReceived(customerName, paid);
      } else if (paid > 0 && pending > 0) {
        SpeechService.speak(`${customerName} से ${paid} रुपए प्राप्त हुए, और ${pending} रुपए बाकी दर्ज किए गए।`);
      } else {
        SpeechService.announceDebtRecorded(customerName, pending);
      }
    }
  };

  // Settle or pay pending debt for customer
  const recordCustomerPayment = async ({ customerId, customerName, amount, paymentMethod = 'CASH' }) => {
    const payAmt = parseFloat(amount) || 0;
    if (payAmt <= 0) return;

    const sId = String(customerId || customerName);

    // Resolve real customer info if customerName is missing or looks like an ID
    let realName = customerName;
    let realVillage = '';
    let realItem = 'खाता बकाया भुगतान';
    const found = customers.find((c) => {
      const cId = String(c.id || c._id || c.customerId || '');
      const cName = String(c.name || c.customerName || '').trim();
      return (
        (sId && (cId === sId || sId.includes(cId) || cId.includes(sId))) ||
        (customerName && cName && cName.toLowerCase() === String(customerName).toLowerCase())
      );
    });
    if (found) {
      if (!realName || realName.startsWith('cust_') || realName.startsWith('id_')) {
        realName = found.name || found.customerName || realName;
      }
      realVillage = found.village || '';
      realItem = found.lastMilledItem || found.itemType || realItem;
    }
    if (!realName || realName.startsWith('cust_') || realName.startsWith('id_')) {
      realName = 'किसान ग्राहक';
    }

    // Settle ledger debt only (Do NOT create dummy 0 KG delivery items in delivery history)
    setCustomers((prevCustomers) => {
      const updated = prevCustomers.map((cust) => {
        const matchById = customerId && (
          String(cust.id) === String(customerId) ||
          String(cust._id) === String(customerId) ||
          String(cust.customerId) === String(customerId)
        );
        const cleanCustName = (cust.name || cust.customerName || '').trim().toLowerCase();
        const cleanTargetName = (customerName || '').trim().toLowerCase();
        const matchByName = cleanCustName && cleanCustName === cleanTargetName;
        if (matchById || matchByName) {
          const currentBal = Number(cust.pendingBalance) || 0;
          const newBal = Math.max(0, Math.round((currentBal - payAmt) * 100) / 100);
          return {
            ...cust,
            pendingBalance: newBal,
            isPending: newBal > 0,
            lastPaymentDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
          };
        }
        return cust;
      });
      StorageService.saveCustomers(updated);
      return updated;
    });

    // Update daily stats locally immediately
    setStats((prev) => ({
      ...prev,
      todayEarnings: Math.round(((prev?.todayEarnings || 0) + payAmt) * 100) / 100,
      cashReceived: paymentMethod === 'CASH'
        ? Math.round(((prev?.cashReceived || 0) + payAmt) * 100) / 100
        : (prev?.cashReceived || 0),
      onlineReceived: paymentMethod === 'UPI'
        ? Math.round(((prev?.onlineReceived || 0) + payAmt) * 100) / 100
        : (prev?.onlineReceived || 0),
      pendingDebt: Math.max(0, Math.round(((prev?.pendingDebt || 0) - payAmt) * 100) / 100),
    }));

    setLastDeliveryTimestamp(Date.now());
    // Re-sync with backend real statistics
    refreshStats();
  };

  // Mark an order as delivered/handed over
  const markOrderDelivered = async ({
    customerId,
    customerName,
    village = '',
    phone = '',
    weightKg = 0,
    itemLabel = 'गेहूं पिसाई',
    amountPaid = 0,
    pendingAmount = 0,
    totalAmount = 0,
  }) => {
    const sId = String(customerId || customerName);
    const paid = Number(amountPaid) || 0;
    const pend = Number(pendingAmount) || 0;
    const wt = Number(weightKg) || 0;
    const tot = Number(totalAmount) || (paid + pend);

    // Resolve real customer info if customerName is missing or looks like an ID
    let realName = customerName;
    let realVillage = village || '';
    let realPhone = phone || '';
    let realItem = itemLabel || 'गेहूं पिसाई';
    const found = customers.find((c) => {
      const cId = String(c.id || c._id || c.customerId || '');
      const cName = String(c.name || c.customerName || '').trim();
      return (
        (sId && (cId === sId || sId.includes(cId) || cId.includes(sId))) ||
        (customerName && cName && cName.toLowerCase() === String(customerName).toLowerCase())
      );
    });
    if (found) {
      if (!realName || realName.startsWith('cust_') || realName.startsWith('id_')) {
        realName = found.name || found.customerName || realName;
      }
      if (!realVillage && found.village) realVillage = found.village;
      if (!realPhone && found.phone) realPhone = found.phone;
      if (!realItem && (found.lastMilledItem || found.itemType)) realItem = found.lastMilledItem || found.itemType;
    }
    if (!realName || realName.startsWith('cust_') || realName.startsWith('id_')) {
      realName = 'किसान ग्राहक';
    }

    const nowMs = Date.now();
    const timeStr = getDeliveryTimeStrNow();

    await StorageService.markDelivered(sId, {
      id: sId,
      customerId: sId,
      customerName: realName,
      village: realVillage,
      phone: realPhone,
      weightKg: wt,
      itemLabel: realItem,
      totalAmount: tot > 0 ? tot : (paid > 0 ? paid : 0),
      amountPaid: paid > 0 ? paid : (tot > 0 ? tot : 0),
      pendingAmount: pend,
      isPaid: pend === 0,
      status: 'ले जा चुके',
      deliveryTimestamp: nowMs,
      deliveryTimeStr: timeStr,
      deliveredAt: new Date(nowMs).toISOString(),
      handoverDate: new Date(nowMs).toISOString(),
    });

    let settledDebt = 0;
    setCustomers((prevCustomers) => {
      const updated = prevCustomers.map((cust) => {
        const matchById = customerId && (String(cust.id) === sId || String(cust._id) === sId || String(cust.customerId) === sId);
        const matchByName = cust.name?.trim().toLowerCase() === customerName?.trim().toLowerCase();
        if (matchById || matchByName) {
          const currentBal = Number(cust.pendingBalance) || 0;
          const newBal = pend > 0 ? pend : Math.max(0, Math.round((currentBal - paid) * 100) / 100);
          settledDebt = Math.max(0, Math.round((currentBal - newBal) * 100) / 100);
          return {
            ...cust,
            pendingBalance: newBal,
            isPending: newBal > 0,
            isDelivered: true,
          };
        }
        return cust;
      });
      StorageService.saveCustomers(updated);
      return updated;
    });

    if (settledDebt > 0) {
      setStats((prev) => ({
        ...prev,
        todayEarnings: Math.round(((prev?.todayEarnings || 0) + settledDebt) * 100) / 100,
        cashReceived: Math.round(((prev?.cashReceived || 0) + settledDebt) * 100) / 100,
        pendingDebt: Math.max(0, Math.round(((prev?.pendingDebt || 0) - settledDebt) * 100) / 100),
      }));
    }

    setLastDeliveryTimestamp(nowMs);
    refreshStats();
  };

  // Logout user and clear local session
  const logoutUser = async () => {
    try {
      await AuthApiService.logout();
      setCurrentUser(null);
    } catch (e) {
      console.warn('Logout error in context:', e);
    }
  };

  return (
    <ChakkiContext.Provider
      value={{
        language,
        setLanguage,
        currentUser,
        setCurrentUser,
        logoutUser,
        t,
        stats,
        customers,
        rates,
        loading,
        refreshStats,
        addEntry,
        recordCustomerPayment,
        markOrderDelivered,
        lastDeliveryTimestamp,
        updateUserProfile,
      }}
    >
      {children}
    </ChakkiContext.Provider>
  );
};

export const useChakki = () => useContext(ChakkiContext);

