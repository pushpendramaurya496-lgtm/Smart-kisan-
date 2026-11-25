import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  CUSTOMERS: '@chakki_customers_v5',
  ORDERS: '@chakki_orders',
  RATES: '@chakki_rates',
  DAILY_STATS: '@chakki_daily_stats',
  DELIVERED_IDS: '@chakki_delivered_ids_v1',
  DELIVERED_RECORDS: '@chakki_delivered_records_v1',
};

export const StorageService = {
  /**
   * Get all real customers stored locally
   */
  async getCustomers() {
    try {
      // Clean up legacy dummy key if present
      await AsyncStorage.removeItem('@chakki_customers_v4').catch(() => {});
      
      const data = await AsyncStorage.getItem(KEYS.CUSTOMERS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Exclude any legacy dummy items with static IDs 'c1'..'c15'
          const realCustomers = parsed.filter(
            (c) => c && (!c.id?.startsWith('c') || c.id?.startsWith('cust_') || c._id)
          );
          return realCustomers;
        }
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Persist real customers
   */
  async saveCustomers(customers) {
    try {
      await AsyncStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers || []));
    } catch (err) {
      console.warn('Storage Error:', err);
    }
  },

  /**
   * Clear all customers
   */
  async clearAllCustomers() {
    try {
      await AsyncStorage.removeItem('@chakki_customers_v4');
      await AsyncStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([]));
    } catch (e) {}
  },

  /**
   * Default stats (real zeroes when empty)
   */
  async getDailyStats() {
    return {
      todayEarnings: 0,
      todayPisaiKg: 0,
      totalCustomers: 0,
      todayEntries: 0,
      pendingDebt: 0,
      totalExpense: 0,
      growthPercent: 0,
      todayAdded: 0,
    };
  },

  /**
   * Get all delivered order / customer keys
   */
  async getDeliveredIds() {
    try {
      const data = await AsyncStorage.getItem(KEYS.DELIVERED_IDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Mark customer or order delivered
   */
  async markDelivered(idOrKey, record = null) {
    try {
      if (!idOrKey) return;
      const ids = await this.getDeliveredIds();
      const sKey = String(idOrKey);
      if (!ids.includes(sKey)) {
        ids.push(sKey);
        await AsyncStorage.setItem(KEYS.DELIVERED_IDS, JSON.stringify(ids));
      }
      if (record) {
        const records = await this.getDeliveredRecords();
        const existingIdx = records.findIndex((r) => String(r.id || r.customerId) === sKey);
        if (existingIdx >= 0) {
          records[existingIdx] = { ...records[existingIdx], ...record };
        } else {
          records.unshift(record);
        }
        await AsyncStorage.setItem(KEYS.DELIVERED_RECORDS, JSON.stringify(records));
      }
    } catch (err) {
      console.warn('Storage markDelivered error:', err);
    }
  },

  /**
   * Get all locally delivered records for history
   */
  async getDeliveredRecords() {
    try {
      const data = await AsyncStorage.getItem(KEYS.DELIVERED_RECORDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
};

export default StorageService;
