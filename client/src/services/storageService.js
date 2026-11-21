import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  CUSTOMERS: '@chakki_customers_v4',
  ORDERS: '@chakki_orders',
  RATES: '@chakki_rates',
  DAILY_STATS: '@chakki_daily_stats',
};

// 15 Dummy entries matching reference screenshot exactly
const INITIAL_CUSTOMERS = [
  {
    id: 'c1',
    name: 'रामलाल',
    village: 'रामपुर',
    phone: '+91 98765 43210',
    weightKg: 25,
    timeStr: 'आज, 12:28 PM',
    avatarText: 'रा',
    avatarBg: '#DCFCE7',
    avatarColor: '#15803D',
    badgeBg: '#F0FDF4',
    badgeBorder: '#BBF7D0',
    totalPisaiKg: 25,
    pendingBalance: 100,
    history: [
      { id: 'h1', date: '20-11-2026', item: 'गेहूं (पिसाई)', weight: 25, rate: 4, total: 100, status: 'बाकी' },
    ],
  },
  {
    id: 'c2',
    name: 'मोहन कुमार',
    village: 'बिजौली',
    phone: '+91 98290 12345',
    weightKg: 40,
    timeStr: 'आज, 12:15 PM',
    avatarText: 'मो',
    avatarBg: '#DBEAFE',
    avatarColor: '#1D4ED8',
    badgeBg: '#EFF6FF',
    badgeBorder: '#BFDBFE',
    totalPisaiKg: 40,
    pendingBalance: 0,
    history: [
      { id: 'h2', date: '20-11-2026', item: 'गेहूं (पिसाई)', weight: 40, rate: 3, total: 120, status: 'चुकाया' },
    ],
  },
  {
    id: 'c3',
    name: 'सुरेश',
    village: 'अलीपुर',
    phone: '+91 99887 76655',
    weightKg: 30,
    timeStr: 'आज, 11:45 AM',
    avatarText: 'सु',
    avatarBg: '#FEF3C7',
    avatarColor: '#D97706',
    badgeBg: '#FEFCE8',
    badgeBorder: '#FEF08A',
    totalPisaiKg: 30,
    pendingBalance: 120,
    history: [
      { id: 'h3', date: '20-11-2026', item: 'मक्का (पिसाई)', weight: 30, rate: 4, total: 120, status: 'बाकी' },
    ],
  },
  {
    id: 'c4',
    name: 'राजेश कुमार',
    village: 'रामपुर',
    phone: '+91 94140 88221',
    weightKg: 20,
    timeStr: 'आज, 11:20 AM',
    avatarText: 'रा',
    avatarBg: '#F3E8FF',
    avatarColor: '#7E22CE',
    badgeBg: '#FAF5FF',
    badgeBorder: '#E9D5FF',
    totalPisaiKg: 20,
    pendingBalance: 0,
    history: [
      { id: 'h4', date: '20-11-2026', item: 'गेहूं (पिसाई)', weight: 20, rate: 3.5, total: 70, status: 'चुकाया' },
    ],
  },
  {
    id: 'c5',
    name: 'मुकेश',
    village: 'बिजौली',
    phone: '+91 97850 44332',
    weightKg: 35,
    timeStr: 'आज, 10:50 AM',
    avatarText: 'मु',
    avatarBg: '#E0F2FE',
    avatarColor: '#0284C7',
    badgeBg: '#F0F9FF',
    badgeBorder: '#BAE6FD',
    totalPisaiKg: 35,
    pendingBalance: 140,
    history: [
      { id: 'h5', date: '20-11-2026', item: 'गेहूं (पिसाई)', weight: 35, rate: 4, total: 140, status: 'बाकी' },
    ],
  },
  {
    id: 'c6',
    name: 'कालूराम',
    village: 'मनोहरपुर',
    phone: '+91 98291 55443',
    weightKg: 50,
    timeStr: 'आज, 10:30 AM',
    avatarText: 'का',
    avatarBg: '#FEE2E2',
    avatarColor: '#DC2626',
    badgeBg: '#FEF2F2',
    badgeBorder: '#FECACA',
    totalPisaiKg: 50,
    pendingBalance: 150,
    history: [
      { id: 'h6', date: '20-11-2026', item: 'गेहूं (पिसाई)', weight: 50, rate: 3, total: 150, status: 'बाकी' },
    ],
  },
  {
    id: 'c7',
    name: 'धर्मेन्द्र',
    village: 'अलीपुर',
    phone: '+91 97821 33445',
    weightKg: 28,
    timeStr: 'आज, 10:15 AM',
    avatarText: 'ध',
    avatarBg: '#ECFDF5',
    avatarColor: '#059669',
    badgeBg: '#F0FDF4',
    badgeBorder: '#A7F3D0',
    totalPisaiKg: 28,
    pendingBalance: 0,
    history: [
      { id: 'h7', date: '20-11-2026', item: 'गेहूं (पिसाई)', weight: 28, rate: 4, total: 112, status: 'चुकाया' },
    ],
  },
  {
    id: 'c8',
    name: 'गोपाल लाल',
    village: 'रामपुर',
    phone: '+91 94142 88776',
    weightKg: 45,
    timeStr: 'आज, 09:55 AM',
    avatarText: 'गो',
    avatarBg: '#FFF7ED',
    avatarColor: '#EA580C',
    badgeBg: '#FFFBEB',
    badgeBorder: '#FED7AA',
    totalPisaiKg: 45,
    pendingBalance: 180,
    history: [
      { id: 'h8', date: '20-11-2026', item: 'चना (दलिया)', weight: 45, rate: 4, total: 180, status: 'बाकी' },
    ],
  },
  {
    id: 'c9',
    name: 'जगदीश',
    village: 'सांगानेर',
    phone: '+91 98280 44556',
    weightKg: 32,
    timeStr: 'आज, 09:40 AM',
    avatarText: 'ज',
    avatarBg: '#EDE9FE',
    avatarColor: '#6D28D9',
    badgeBg: '#F5F3FF',
    badgeBorder: '#DDD6FE',
    totalPisaiKg: 32,
    pendingBalance: 0,
    history: [
      { id: 'h9', date: '20-11-2026', item: 'गेहूं (पिसाई)', weight: 32, rate: 3.5, total: 112, status: 'चुकाया' },
    ],
  },
  {
    id: 'c10',
    name: 'सीताराम',
    village: 'बिजौली',
    phone: '+91 99291 22334',
    weightKg: 60,
    timeStr: 'आज, 09:15 AM',
    avatarText: 'सी',
    avatarBg: '#E0E7FF',
    avatarColor: '#4338CA',
    badgeBg: '#EEF2FF',
    badgeBorder: '#C7D2FE',
    totalPisaiKg: 60,
    pendingBalance: 240,
    history: [
      { id: 'h10', date: '20-11-2026', item: 'गेहूं (पिसाई)', weight: 60, rate: 4, total: 240, status: 'बाकी' },
    ],
  },
  {
    id: 'c11',
    name: 'हनुमान सहाय',
    village: 'अलीपुर',
    phone: '+91 98293 88990',
    weightKg: 22,
    timeStr: 'आज, 08:50 AM',
    avatarText: 'ह',
    avatarBg: '#FEF9C3',
    avatarColor: '#CA8A04',
    badgeBg: '#FEFCE8',
    badgeBorder: '#FDE047',
    totalPisaiKg: 22,
    pendingBalance: 0,
    history: [
      { id: 'h11', date: '20-11-2026', item: 'गेहूं (पिसाई)', weight: 22, rate: 4, total: 88, status: 'चुकाया' },
    ],
  },
  {
    id: 'c12',
    name: 'कैलाश चंद',
    village: 'रामपुर',
    phone: '+91 94145 66778',
    weightKg: 38,
    timeStr: 'आज, 08:30 AM',
    avatarText: 'कै',
    avatarBg: '#CCFBF1',
    avatarColor: '#0D9488',
    badgeBg: '#F0FDFA',
    badgeBorder: '#99F6E4',
    totalPisaiKg: 38,
    pendingBalance: 152,
    history: [
      { id: 'h12', date: '20-11-2026', item: 'मक्का (पिसाई)', weight: 38, rate: 4, total: 152, status: 'बाकी' },
    ],
  },
  {
    id: 'c13',
    name: 'भंवर लाल',
    village: 'किशनगढ़',
    phone: '+91 97852 11223',
    weightKg: 42,
    timeStr: 'आज, 08:15 AM',
    avatarText: 'भं',
    avatarBg: '#FCE7F3',
    avatarColor: '#BE185D',
    badgeBg: '#FDF2F8',
    badgeBorder: '#FBCFE8',
    totalPisaiKg: 42,
    pendingBalance: 0,
    history: [
      { id: 'h13', date: '20-11-2026', item: 'गेहूं (पिसाई)', weight: 42, rate: 3.5, total: 147, status: 'चुकाया' },
    ],
  },
  {
    id: 'c14',
    name: 'गिरधारी',
    village: 'बिजौली',
    phone: '+91 98284 33221',
    weightKg: 26,
    timeStr: 'आज, 07:50 AM',
    avatarText: 'गि',
    avatarBg: '#E0F2FE',
    avatarColor: '#0284C7',
    badgeBg: '#F0F9FF',
    badgeBorder: '#BAE6FD',
    totalPisaiKg: 26,
    pendingBalance: 104,
    history: [
      { id: 'h14', date: '20-11-2026', item: 'गेहूं (पिसाई)', weight: 26, rate: 4, total: 104, status: 'बाकी' },
    ],
  },
  {
    id: 'c15',
    name: 'प्रहलाद',
    village: 'मनोहरपुर',
    phone: '+91 99281 99887',
    weightKg: 35,
    timeStr: 'आज, 07:30 AM',
    avatarText: 'प्र',
    avatarBg: '#F5F3FF',
    avatarColor: '#7C3AED',
    badgeBg: '#FAF5FF',
    badgeBorder: '#E9D5FF',
    totalPisaiKg: 35,
    pendingBalance: 0,
    history: [
      { id: 'h15', date: '20-11-2026', item: 'गेहूं (पिसाई)', weight: 35, rate: 4, total: 140, status: 'चुकाया' },
    ],
  },
];

export const StorageService = {
  async getCustomers() {
    try {
      const data = await AsyncStorage.getItem(KEYS.CUSTOMERS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length >= 10) {
          return parsed;
        }
      }
      await AsyncStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
      return INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  },

  async saveCustomers(customers) {
    try {
      await AsyncStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (err) {
      console.warn('Storage Error:', err);
    }
  },

  async getDailyStats() {
    return {
      todayEarnings: 2850,
      todayPisaiKg: 210,
      totalCustomers: 125,
      todayEntries: 38,
      pendingDebt: 1250,
      totalExpense: 620,
      growthPercent: 12,
      todayAdded: 8,
    };
  },
};
