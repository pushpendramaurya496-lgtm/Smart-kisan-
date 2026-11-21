import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../services/storageService';
import { DefaultRates } from '../constants/defaultRates';
import { SpeechService } from '../services/speechService';
import { AuthApiService } from '../services/authApiService';
import { translations } from '../constants/translations';

const ChakkiContext = createContext(null);

export const ChakkiProvider = ({ children }) => {
  const [language, setLanguageState] = useState('hi'); // Default Hindi
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    todayEarnings: 2850,
    todayPisaiKg: 210,
    totalCustomers: 125,
    todayEntries: 38,
    pendingDebt: 1250,
    totalExpense: 620,
    growthPercent: 12,
    todayAdded: 8,
  });

  const [customers, setCustomers] = useState([]);
  const [rates, setRates] = useState(DefaultRates);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

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
  const addEntry = ({ customerName, item, weight, rate, isPaid }) => {
    const total = weight * rate;
    const newEntry = {
      id: 'entry_' + Date.now(),
      date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      item,
      weight,
      rate,
      total,
      status: isPaid ? 'चुकाया' : 'बाकी',
    };

    setCustomers((prevCustomers) => {
      let found = false;
      const updated = prevCustomers.map((cust) => {
        if (cust.name.toLowerCase() === customerName.toLowerCase()) {
          found = true;
          return {
            ...cust,
            totalPisaiKg: cust.totalPisaiKg + weight,
            pendingBalance: isPaid ? cust.pendingBalance : cust.pendingBalance + total,
            history: [newEntry, ...cust.history],
          };
        }
        return cust;
      });

      if (!found) {
        updated.unshift({
          id: 'cust_' + Date.now(),
          name: customerName,
          phone: '',
          totalPisaiKg: weight,
          pendingBalance: isPaid ? 0 : total,
          history: [newEntry],
        });
      }

      StorageService.saveCustomers(updated);
      return updated;
    });

    // Update daily stats
    setStats((prev) => ({
      ...prev,
      todayPisaiKg: prev.todayPisaiKg + weight,
      todayEarnings: isPaid ? prev.todayEarnings + total : prev.todayEarnings,
      pendingDebt: isPaid ? prev.pendingDebt : prev.pendingDebt + total,
      totalCustomers: prev.totalCustomers + 1,
    }));

    // Voice announcement
    if (isPaid) {
      SpeechService.announceCashReceived(customerName, total);
    } else {
      SpeechService.announceDebtRecorded(customerName, total);
    }
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
        addEntry,
        updateUserProfile,
      }}
    >
      {children}
    </ChakkiContext.Provider>
  );
};

export const useChakki = () => useContext(ChakkiContext);

