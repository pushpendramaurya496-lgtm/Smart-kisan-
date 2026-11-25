import { API_BASE_URL } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getAuthHeaders = async () => {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const token = await AsyncStorage.getItem('@chakki_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch (e) {}
  return headers;
};

// Resilient fast fetch wrapper with 8-second timeout for reliable Wi-Fi network requests
const fetchWithTimeout = async (url, options = {}, timeoutMs = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

export const DashboardApiService = {
  /**
   * Overall dashboard stats for HomeScreen
   */
  async getStats() {
    try {
      const headers = await getAuthHeaders();
      const res = await fetchWithTimeout(`${API_BASE_URL}/dashboard/stats`, { headers }, 2000);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (e) {
      // Non-blocking fallback
    }
    return null;
  },

  /**
   * Detailed earnings breakdown for EarningsDashboardScreen
   */
  async getEarnings(period = 'today', date = null) {
    try {
      const headers = await getAuthHeaders();
      let url = `${API_BASE_URL}/dashboard/earnings?period=${period}`;
      if (date) url += `&date=${encodeURIComponent(date)}`;
      const res = await fetchWithTimeout(url, { headers }, 2000);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (e) {
      // Non-blocking fallback
    }
    return null;
  },

  /**
   * Milling breakdown for TodayMillingDashboardScreen
   */
  async getMilling(period = 'today', date = null) {
    try {
      const headers = await getAuthHeaders();
      let url = `${API_BASE_URL}/dashboard/milling?period=${period}`;
      if (date) url += `&date=${encodeURIComponent(date)}`;
      const res = await fetchWithTimeout(url, { headers }, 2000);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (e) {
      // Non-blocking fallback
    }
    return null;
  },

  /**
   * Pending dues breakdown for PendingBalanceDashboardScreen
   */
  async getPending() {
    try {
      const headers = await getAuthHeaders();
      const res = await fetchWithTimeout(`${API_BASE_URL}/dashboard/pending`, { headers }, 2000);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (e) {
      // Non-blocking fallback
    }
    return null;
  },

  /**
   * Customer directory for TotalCustomerDashboardScreen
   */
  async getCustomers(period = 'today', date = null) {
    try {
      const headers = await getAuthHeaders();
      let url = `${API_BASE_URL}/dashboard/customers?period=${period}`;
      if (date) url += `&date=${encodeURIComponent(date)}`;
      const res = await fetchWithTimeout(url, { headers }, 2000);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (e) {
      // Non-blocking fallback
    }
    return null;
  },

  /**
   * Delivery History for DeliveryHistoryScreen
   */
  async getDeliveryHistory(period = 'today', date = null) {
    try {
      const headers = await getAuthHeaders();
      let url = `${API_BASE_URL}/dashboard/deliveries?period=${period}`;
      if (date) url += `&date=${encodeURIComponent(date)}`;
      const res = await fetchWithTimeout(url, { headers }, 2000);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (e) {
      // Non-blocking fallback
    }
    return null;
  },
};

export default DashboardApiService;

