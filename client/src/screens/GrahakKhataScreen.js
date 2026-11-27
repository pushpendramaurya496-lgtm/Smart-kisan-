import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useChakki } from '../context/ChakkiContext';
import { BottomDock } from '../components/BottomDock';

const formatCleanNum = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const num = Math.round(Number(val) * 100) / 100;
  return Number.isInteger(num) ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
};

export const GrahakKhataScreen = ({ navigation, route }) => {
  const { customers, language } = useChakki();
  const insets = useSafeAreaInsets();
  const topSafePadding = Math.max(insets.top, 48);

  const { customerId, customerName } = route?.params || {};

  const [activeSubTab, setActiveSubTab] = useState('history');

  const selectedCustomer = (customers || []).find((c) => {
    if (customerId) return String(c.id || c._id || c.customerId) === String(customerId);
    if (customerName) return (c.name || '').toLowerCase() === customerName.toLowerCase();
    return (c.pendingBalance || 0) > 0;
  }) || customers[0] || null;

  return (
    <View style={[styles.safeArea, { paddingTop: topSafePadding }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{language === 'hi' ? 'ग्राहक खाता' : 'Customer Ledger'}</Text>
          <TouchableOpacity
            style={styles.newCustBtn}
            onPress={() => navigation.navigate('NewEntry')}
          >
            <Text style={styles.newCustText}>{language === 'hi' ? '+ नया' : '+ New'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {!selectedCustomer ? (
            <View style={{ padding: 32, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, marginTop: 40, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>📖</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 }}>कोई ग्राहक खाता नहीं मिला</Text>
              <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 20 }}>नई पिसाई दर्ज करने पर ग्राहकों का खाता-बही यहाँ दिखाई देगा।</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#15803D', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24 }}
                onPress={() => navigation.navigate('NewEntry')}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>+ नई पिसाई जोड़ें</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Customer Profile Card */}
              <View style={styles.customerCard}>
                <View style={styles.custLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>👨‍🌾</Text>
                  </View>
                  <View>
                    <Text style={styles.custName}>{selectedCustomer.name}</Text>
                    <Text style={styles.custPhone}>{selectedCustomer.phone}</Text>
                  </View>
                </View>

                <View style={styles.debtBadge}>
                  <Text style={styles.debtText}>
                    उधार बाकी ₹{formatCleanNum(selectedCustomer.pendingBalance)}
                  </Text>
                </View>
              </View>

              {/* 3 Tabs */}
              <View style={styles.tabBar}>
                <TouchableOpacity
                  onPress={() => setActiveSubTab('history')}
                  style={[styles.tab, activeSubTab === 'history' && styles.activeTab]}
                >
                  <Text style={[styles.tabText, activeSubTab === 'history' && styles.activeTabText]}>
                    इतिहास
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveSubTab('pending')}
                  style={[styles.tab, activeSubTab === 'pending' && styles.activeTab]}
                >
                  <Text style={[styles.tabText, activeSubTab === 'pending' && styles.activeTabText]}>
                    बकाया
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveSubTab('payment')}
                  style={[styles.tab, activeSubTab === 'payment' && styles.activeTab]}
                >
                  <Text style={[styles.tabText, activeSubTab === 'payment' && styles.activeTabText]}>
                    पेमेंट
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Transaction Ledger Entries */}
              <View style={styles.entriesList}>
                {(selectedCustomer.history || []).map((entry) => (
                  <View key={entry.id} style={styles.entryRow}>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryItem}>{entry.item}</Text>
                      <Text style={styles.entryDate}>
                        {entry.date} {entry.rate ? `• ₹${entry.rate}/kg` : ''}
                      </Text>
                    </View>

                    <View style={styles.entryPriceBox}>
                      <Text style={styles.entryTotal}>₹ {entry.total}</Text>
                      <View
                        style={[
                          styles.statusPill,
                          entry.status === 'बाकी' ? styles.statusPending : styles.statusPaid,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            entry.status === 'बाकी' ? styles.statusTextPending : styles.statusTextPaid,
                          ]}
                        >
                          {entry.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        {/* Bottom Settle Button */}
        {selectedCustomer && (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.payBtn}
              onPress={() => navigation.navigate('BillPrint', { customerId: selectedCustomer.id })}
            >
              <Text style={styles.payBtnText}>₹ भुगतान दर्ज करें</Text>
            </TouchableOpacity>
          </View>
        )}

        <BottomDock activeTab="khata" onTabPress={(tab) => {
          if (tab === 'home') navigation.navigate('Home');
          else if (tab === 'bill') navigation.navigate('BillPrint');
          else if (tab === 'history') navigation.navigate('DeliveryHistory');
          else if (tab === 'settings') navigation.navigate('Settings');
        }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 6,
  },
  backText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  newCustBtn: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  newCustText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  content: {
    padding: 14,
    gap: 12,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  custLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.goldBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  avatarText: {
    fontSize: 22,
  },
  custName: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  custPhone: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  debtBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
  },
  debtText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  entriesList: {
    gap: 8,
  },
  entryRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  entryInfo: {
    gap: 2,
  },
  entryItem: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  entryDate: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  entryPriceBox: {
    alignItems: 'flex-end',
    gap: 4,
  },
  entryTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: Colors.dangerBg,
  },
  statusPaid: {
    backgroundColor: Colors.primaryBg,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusTextPending: {
    color: Colors.danger,
  },
  statusTextPaid: {
    color: Colors.primary,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  payBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: 18,
    alignItems: 'center',
    elevation: 3,
  },
  payBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
