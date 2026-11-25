import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../services/storageService';
import { DefaultRates } from '../constants/defaultRates';
import { SpeechService } from '../services/speechService';
import { AuthApiService } from '../services/authApiService';
import { DashboardApiService } from '../services/dashboardApiService';
import { translations } from '../constants/translations';

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

  useEffect(() => {
    loadInitialData();
  }, []);

  const refreshStats = async () => {
    try {
      const liveStats = await DashboardApiService.getStats();
      if (liveStats) {
        setStats((prev) => ({
          ...liveStats,
          todayPisaiKg: Math.max(Number(liveStats.todayPisaiKg) || 0, Number(prev?.todayPisaiKg) || 0),
          todayEarnings: Math.max(Number(liveStats.todayEarnings) || 0, Number(prev?.todayEarnings) || 0),
          cashReceived: Math.max(Number(liveStats.cashReceived) || 0, Number(prev?.cashReceived) || 0),
          pendingDebt: Math.max(Number(liveStats.pendingDebt) || 0, Number(prev?.pendingDebt) || 0),
          totalCustomers: Math.max(Number(liveStats.totalCustomers) || 0, Number(prev?.totalCustomers) || 0),
          todayAdded: Math.max(Number(liveStats.todayAdded) || 0, Number(prev?.todayAdded) || 0),
          todayEntries: Math.max(Number(liveStats.todayEntries) || 0, Number(prev?.todayEntries) || 0),
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
              isDelivered: false,
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
            isDelivered: false,
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

    // Save delivered record locally so it moves to Delivery History
    await StorageService.markDelivered(sId, {
      id: sId,
      customerId: sId,
      customerName,
      amountPaid: payAmt,
      pendingAmount: 0,
      isPaid: true,
      status: 'ले जा चुके',
      deliveryTimeStr: 'आज, ' + new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
    });

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
            isDelivered: true,
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

    // Re-sync with backend real statistics
    refreshStats();
  };

  // Mark an order as delivered/handed over
  const markOrderDelivered = async ({ customerId, customerName, village = '', weightKg = 0, itemLabel = 'गेहूं पिसाई', amountPaid = 0, pendingAmount = 0 }) => {
    const sId = String(customerId || customerName);
    await StorageService.markDelivered(sId, {
      id: sId,
      customerId: sId,
      customerName,
      village,
      weightKg: Number(weightKg) || 0,
      itemLabel: itemLabel || 'गेहूं पिसाई',
      totalAmount: (Number(amountPaid) || 0) + (Number(pendingAmount) || 0),
      amountPaid: Number(amountPaid) || 0,
      pendingAmount: Number(pendingAmount) || 0,
      isPaid: (Number(pendingAmount) || 0) === 0,
      status: 'ले जा चुके',
      deliveryTimeStr: 'आज, ' + new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
    });

    setCustomers((prevCustomers) => {
      const updated = prevCustomers.map((cust) => {
        const matchById = customerId && String(cust.id || cust._id) === sId;
        const matchByName = !customerId && cust.name?.toLowerCase() === customerName?.toLowerCase();
        if (matchById || matchByName) {
          return {
            ...cust,
            isDelivered: true,
          };
        }
        return cust;
      });
      StorageService.saveCustomers(updated);
      return updated;
    });

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
        updateUserProfile,
      }}
    >
      {children}
    </ChakkiContext.Provider>
  );
};

export const useChakki = () => useContext(ChakkiContext);

