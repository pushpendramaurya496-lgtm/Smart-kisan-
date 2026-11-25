import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { CustomerApiService } from '../services/customerApiService';
import { SpeechService } from '../services/speechService';
import { useChakki } from '../context/ChakkiContext';

const formatCleanNum = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const num = Math.round(Number(val) * 100) / 100;
  return Number.isInteger(num) ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
};

export const CustomerDashboardScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const topSafePadding = Math.max(insets.top || 0, 36) + 4;
  const { recordCustomerPayment, refreshStats } = useChakki();

  const passedCustomer = route?.params?.customer || {};
  const customerId = route?.params?.customerId || passedCustomer.id || 'c1';

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  // Pay Debt Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    loadDashboard();
    if (route?.params?.openPayModal && passedCustomer?.pendingBalance > 0) {
      setPayAmount(String(passedCustomer.pendingBalance));
      setShowPayModal(true);
    }
  }, [customerId]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await CustomerApiService.getCustomerDashboard(customerId, passedCustomer);
      setDashboardData(data);
    } catch (e) {
      console.warn('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const customer = dashboardData?.customer || passedCustomer || {
    name: '',
    village: '',
    phone: '',
    pendingBalance: 0,
  };
  const summary = dashboardData?.financialSummary || {
    pendingBalance: customer.pendingBalance || 0,
    totalBilled: 0,
    totalPaid: 0,
    totalWeightMilledKg: 0,
    totalOrdersCount: 0,
  };
  const history = dashboardData?.history || [];

  // Handle Quick Debt Payment
  const handleRecordPayment = async () => {
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('त्रुटि', 'कृपया सही जमा राशि दर्ज करें');
      return;
    }

    setSubmittingPayment(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    try {
      await CustomerApiService.recordDebtPayment(customer.id || customerId, {
        amountPaid: amt,
        paymentMethod: payMethod,
      });

      // 1. Immediately update ChakkiContext so HomeScreen and other dashboards update live
      if (recordCustomerPayment) {
        recordCustomerPayment({
          customerId: customer.id || customerId,
          customerName: customer.name,
          amount: amt,
          paymentMethod: payMethod,
        });
      }
      if (refreshStats) {
        refreshStats();
      }

      // 2. Immediately update local state in CustomerDashboard
      setDashboardData((prev) => {
        if (!prev) return prev;
        const currentBal = Number(prev.financialSummary?.pendingBalance || prev.customer?.pendingBalance || 0);
        const newBal = Math.max(0, Math.round((currentBal - amt) * 100) / 100);
        const newTotalPaid = Math.round(((Number(prev.financialSummary?.totalPaid) || 0) + amt) * 100) / 100;
        return {
          ...prev,
          customer: {
            ...prev.customer,
            pendingBalance: newBal,
          },
          financialSummary: {
            ...prev.financialSummary,
            pendingBalance: newBal,
            totalPaid: newTotalPaid,
          },
          history: [
            {
              id: 'pay_' + Date.now(),
              date: new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' }),
              type: 'PAYMENT',
              category: `उधार भुगतान (${payMethod === 'UPI' ? 'ऑनलाइन' : 'नकद'})`,
              weightKg: 0,
              totalAmount: 0,
              amountPaid: amt,
              pendingAmount: newBal,
              status: 'जमा हुआ',
            },
            ...(prev.history || []),
          ],
        };
      });

      SpeechService.announceCashReceived(customer.name, amt);

      Alert.alert(
        'भुगतान दर्ज हुआ',
        `₹${amt} सफलतापूर्वक खाते में जमा कर दिए गए।`
      );
      setShowPayModal(false);
      setPayAmount('');
      // Reload fresh records from backend
      loadDashboard();
    } catch (err) {
      Alert.alert('त्रुटि', err.message || 'भुगतान दर्ज करने में विफल');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // WhatsApp Share statement
  const handleShareWhatsApp = async () => {
    const text = `🌾 *किसान साथी | चक्की स्मार्ट AI*\n━━━━━━━━━━━━━━━━━━━━\n👤 *ग्राहक बही-खाता:* ${customer.name} (📍 ${customer.village || 'रामपुर'})\n📱 *मोबाइल:* ${customer.phone || 'उपलब्ध नहीं'}\n\n📊 *खाता विवरण:*\n• कुल पिसाई वजन: ${summary.totalWeightMilledKg} kg\n• कुल बिल राशि: ₹${summary.totalBilled}\n• कुल जमा राशि: ₹${summary.totalPaid}\n${
      summary.pendingBalance > 0
        ? `🔴 *कुल बकाया राशि:* ₹${summary.pendingBalance} (बाकी उधार)`
        : `🟢 *खाता साफ:* कोई बकाया राशि नहीं है`
    }\n━━━━━━━━━━━━━━━━━━━━\nधन्यवाद!`;

    try {
      await Share.share({ message: text });
    } catch (e) {}
  };

  // Make direct phone call
  const handleCall = () => {
    if (customer.phone) {
      Linking.openURL(`tel:${customer.phone.replace(/\s+/g, '')}`);
    } else {
      Alert.alert('मोबाइल नंबर', 'ग्राहक का फोन नंबर उपलब्ध नहीं है');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* 1. TOP HEADER SECTION */}
      <LinearGradient
        colors={['#005A32', '#006B3C', '#007A43']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerContainer, { paddingTop: topSafePadding }]}
      >
        <View style={styles.headerRow}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>◀ वापस</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerMainTitle}>ग्राहक डैशबोर्ड</Text>
            <Text style={styles.headerSubtitle}>खाता बही व पिछला रिकॉर्ड</Text>
          </View>

          {/* Quick Print Icon */}
          <TouchableOpacity
            style={styles.headerPrintBtn}
            onPress={() =>
              navigation.navigate('BillPrint', {
                customerName: customer.name,
                village: customer.village,
                item: 'गेहूं (पिसाई)',
                weightKg: customer.weightKg || 25,
                ratePerKg: 4,
                totalAmount: (customer.weightKg || 25) * 4,
                pendingAmount: summary.pendingBalance,
                status: summary.pendingBalance > 0 ? 'भुगतान बाकी' : 'भुगतान चुकता',
              })
            }
          >
            <Text style={styles.headerPrintIcon}>🧾</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006B3C" />
          <Text style={styles.loadingText}>ग्राहक का रिकॉर्ड लोड हो रहा है...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 2. CUSTOMER IDENTITY CARD */}
          <View style={styles.customerProfileCard}>
            <View style={styles.profileLeftRow}>
              <View
                style={[
                  styles.profileAvatar,
                  { backgroundColor: customer.avatarBg || '#DCFCE7' },
                ]}
              >
                <Text
                  style={[
                    styles.profileAvatarText,
                    { color: customer.avatarColor || '#15803D' },
                  ]}
                >
                  {customer.avatarText || customer.name?.substring(0, 2) || 'रा'}
                </Text>
              </View>

              <View style={styles.profileDetailsCol}>
                <Text style={styles.profileNameText}>{customer.name}</Text>
                <View style={styles.profileVillageRow}>
                  <Text style={styles.profilePin}>📍</Text>
                  <Text style={styles.profileVillageText}>
                    {customer.village || 'रामपुर'}
                  </Text>
                </View>
                <Text style={styles.profilePhoneText}>
                  {customer.phone || '+91 98765 43210'}
                </Text>
              </View>
            </View>

            {/* Quick Actions Row */}
            <View style={styles.profileActionsRow}>
              <TouchableOpacity
                style={styles.profileActionBtnCall}
                onPress={handleCall}
                activeOpacity={0.8}
              >
                <Text style={styles.profileActionBtnText}>📞 कॉल करें</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profileActionBtnWhatsApp}
                onPress={handleShareWhatsApp}
                activeOpacity={0.8}
              >
                <Text style={styles.profileActionBtnText}>💬 WhatsApp हिसाब</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2.5 CUSTOMER STATS HIGHLIGHT GRID (कुल पिसाई फेरे, कुल बिल, कुल वजन, कुल जमा) */}
          <View style={styles.statsSummaryGrid}>
            {/* Card 1: कितनी बार पिसाया (कुल फेरे) */}
            <View style={styles.statTileCard}>
              <View style={[styles.statTileIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Text style={styles.statTileIcon}>🔄</Text>
              </View>
              <View style={styles.statTileContent}>
                <Text style={styles.statTileLabel}>कुल पिसाई फेरे</Text>
                <Text style={styles.statTileValue}>
                  {summary.totalOrdersCount || (history && history.length > 0 ? history.length : 1)} बार
                </Text>
              </View>
            </View>

            {/* Card 2: कुल पिसाई बिल */}
            <View style={styles.statTileCard}>
              <View style={[styles.statTileIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Text style={styles.statTileIcon}>🧾</Text>
              </View>
              <View style={styles.statTileContent}>
                <Text style={styles.statTileLabel}>कुल पिसाई बिल</Text>
                <Text style={[styles.statTileValue, { color: '#006B3C' }]}>
                  ₹{formatCleanNum(summary.totalBilled || ((Number(summary.pendingBalance) || 0) + (Number(summary.totalPaid) || 0)))}
                </Text>
              </View>
            </View>

            {/* Card 3: कुल पिसाई वजन */}
            <View style={styles.statTileCard}>
              <View style={[styles.statTileIconBox, { backgroundColor: '#FFFBEB' }]}>
                <Text style={styles.statTileIcon}>⚖️</Text>
              </View>
              <View style={styles.statTileContent}>
                <Text style={styles.statTileLabel}>कुल पिसाई वजन</Text>
                <Text style={[styles.statTileValue, { color: '#B45309' }]}>
                  {formatCleanNum(summary.totalWeightMilledKg || customer.totalWeightMilledKg || (customer.weightKg || (customer.weight ? parseFloat(customer.weight) : 0)) || 0)} KG
                </Text>
              </View>
            </View>

            {/* Card 4: कुल जमा रकम */}
            <View style={styles.statTileCard}>
              <View style={[styles.statTileIconBox, { backgroundColor: '#F0FDF4' }]}>
                <Text style={styles.statTileIcon}>✅</Text>
              </View>
              <View style={styles.statTileContent}>
                <Text style={styles.statTileLabel}>कुल जमा रकम</Text>
                <Text style={[styles.statTileValue, { color: '#15803D' }]}>
                  ₹{formatCleanNum(summary.totalPaid || 0)}
                </Text>
              </View>
            </View>
          </View>

          {/* 3. FINANCIAL SUMMARY - कितना बाकी है (PENDING ARREARS HERO CARD) */}
          <View
            style={[
              styles.pendingHeroCard,
              summary.pendingBalance > 0
                ? styles.pendingHeroCardRed
                : styles.pendingHeroCardGreen,
            ]}
          >
            <View style={styles.pendingHeroHeaderRow}>
              <View style={styles.pendingBadgeRow}>
                <Text style={styles.pendingBadgeIcon}>
                  {summary.pendingBalance > 0 ? '⚠️' : '✅'}
                </Text>
                <Text
                  style={[
                    styles.pendingBadgeLabel,
                    summary.pendingBalance > 0
                      ? styles.pendingTextRed
                      : styles.pendingTextGreen,
                  ]}
                >
                  {summary.pendingBalance > 0
                    ? 'वर्तमान बकाया राशि (उधारी बाकी)'
                    : 'खाता स्थिति (कोई उधारी नहीं)'}
                </Text>
              </View>

              <View
                style={[
                  styles.statusTag,
                  summary.pendingBalance > 0
                    ? styles.statusTagRed
                    : styles.statusTagGreen,
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    summary.pendingBalance > 0
                      ? styles.statusTagTextRed
                      : styles.statusTagTextGreen,
                  ]}
                >
                  {summary.pendingBalance > 0 ? 'उधार बाकी' : 'खाता चुकता'}
                </Text>
              </View>
            </View>

            {/* Huge Amount Display */}
            <Text
              style={[
                styles.pendingBigAmount,
                summary.pendingBalance > 0
                  ? styles.pendingAmountRed
                  : styles.pendingAmountGreen,
              ]}
            >
              ₹ {formatCleanNum(summary.pendingBalance)}
            </Text>

            <Text style={styles.pendingSubtitle}>
              {summary.pendingBalance > 0
                ? 'यह राशि ग्राहक से अभी लेना बाकी है।'
                : 'ग्राहक का सम्पूर्ण हिसाब चुकता है। कोई उधारी नहीं है।'}
            </Text>

            {/* Quick Settle Button */}
            {summary.pendingBalance > 0 && (
              <TouchableOpacity
                style={styles.settleDebtBtn}
                onPress={() => {
                  setPayAmount(String(summary.pendingBalance));
                  setShowPayModal(true);
                }}
                activeOpacity={0.88}
              >
                <Text style={styles.settleDebtBtnText}>
                  💰 ₹ बकाया जमा करें (Pay Arrears)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 4. PREVIOUS HISTORY RECORDS (पिछला सम्पूर्ण रिकॉर्ड व इतिहास) */}
          <View style={styles.historySectionHeader}>
            <View style={styles.historyHeaderTitleRow}>
              <Text style={styles.historySectionIcon}>📋</Text>
              <Text style={styles.historySectionTitle}>
                पिछला सम्पूर्ण रिकॉर्ड व इतिहास
              </Text>
            </View>
            <View style={styles.historyCountBadge}>
              <Text style={styles.historyCountBadgeText}>
                {history.length} रिकॉर्ड
              </Text>
            </View>
          </View>

          {/* History Records List */}
          {history.length > 0 ? (
            history.map((record, idx) => (
              <View key={record.id || `rec_${idx}`} style={styles.historyRecordCard}>
                <View style={styles.historyRecordTopRow}>
                  <View style={styles.recordTokenBadge}>
                    <Text style={styles.recordTokenText}>
                      टोकन {record.tokenNumber || `#${idx + 1}`}
                    </Text>
                  </View>
                  <Text style={styles.recordDateText}>{record.date}</Text>
                </View>

                <View style={styles.recordDivider} />

                <View style={styles.recordDetailsRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recordItemName}>{record.itemLabel}</Text>
                    <Text style={styles.recordWeightRateText}>
                      वजन: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{record.weightKg} kg</Text> • दर: ₹{record.ratePerKg}/kg
                    </Text>
                  </View>

                  <View style={styles.recordPriceCol}>
                    <Text style={styles.recordTotalPrice}>₹{record.totalAmount}</Text>
                    <View
                      style={[
                        styles.recordStatusPill,
                        record.paymentStatus === 'बाकी'
                          ? styles.statusPillRed
                          : styles.statusPillGreen,
                      ]}
                    >
                      <Text
                        style={[
                          styles.recordStatusText,
                          record.paymentStatus === 'बाकी'
                            ? styles.statusTextRed
                            : styles.statusTextGreen,
                        ]}
                      >
                        {record.paymentStatus === 'बाकी'
                          ? `₹${record.pendingAmount || record.totalAmount} बाकी`
                          : 'चुकाया'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Bottom Delivery note */}
                <View style={styles.recordFooterRow}>
                  <Text style={styles.recordDeliveryNote}>
                    📦 {record.isDelivered ? 'माल सुपुर्द कर दिया गया' : 'तैयार है'}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('BillPrint', {
                        customerName: customer.name,
                        village: customer.village,
                        item: record.itemLabel,
                        weightKg: record.weightKg,
                        ratePerKg: record.ratePerKg,
                        totalAmount: record.totalAmount,
                        pendingAmount: record.pendingAmount,
                        status: record.paymentStatus === 'बाकी' ? 'भुगतान बाकी' : 'भुगतान चुकता',
                        tokenNumber: record.tokenNumber?.replace('#', '') || '1',
                        date: record.date,
                      })
                    }
                  >
                    <Text style={styles.recordPrintLinkText}>रसीद देखें →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyHistoryBox}>
              <Text style={styles.emptyHistoryText}>
                इस ग्राहक का कोई पुराना रिकॉर्ड उपलब्ध नहीं है।
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* 6. PAY DEBT MODAL (बकाया भुगतान दर्ज करें) */}
      <Modal
        visible={showPayModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPayModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPayModal(false)}
        >
          <View style={styles.payModalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.payModalTitle}>💰 पुराना बकाया भुगतान दर्ज करें</Text>
            <Text style={styles.payModalSubtitle}>
              ग्राहक: <Text style={{ fontWeight: '800' }}>{customer.name}</Text> • कुल बाकी:{' '}
              <Text style={{ fontWeight: '800', color: '#DC2626' }}>
                ₹{formatCleanNum(summary.pendingBalance)}
              </Text>
            </Text>

            {/* Amount Input */}
            <Text style={styles.inputLabel}>जमा करने की राशि (₹):</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.rupeePrefix}>₹</Text>
              <TextInput
                style={styles.amountInputField}
                keyboardType="numeric"
                value={payAmount}
                onChangeText={setPayAmount}
                placeholder="राशि दर्ज करें..."
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Quick Pills */}
            <View style={styles.quickPillsRow}>
              <TouchableOpacity
                style={styles.quickPill}
                onPress={() => setPayAmount(String(formatCleanNum(summary.pendingBalance)))}
              >
                <Text style={styles.quickPillText}>
                  पूरा हिसाब चुकता (₹{formatCleanNum(summary.pendingBalance)})
                </Text>
              </TouchableOpacity>
              {summary.pendingBalance > 200 && (
                <TouchableOpacity
                  style={styles.quickPill}
                  onPress={() => setPayAmount('200')}
                >
                  <Text style={styles.quickPillText}>₹200</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Payment Method Selector */}
            <Text style={styles.inputLabel}>भुगतान का माध्यम:</Text>
            <View style={styles.methodRow}>
              <TouchableOpacity
                style={[
                  styles.methodBtn,
                  payMethod === 'CASH' && styles.methodBtnActive,
                ]}
                onPress={() => setPayMethod('CASH')}
              >
                <Text
                  style={[
                    styles.methodText,
                    payMethod === 'CASH' && styles.methodTextActive,
                  ]}
                >
                  💵 नकद (Cash)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodBtn,
                  payMethod === 'UPI' && styles.methodBtnActive,
                ]}
                onPress={() => setPayMethod('UPI')}
              >
                <Text
                  style={[
                    styles.methodText,
                    payMethod === 'UPI' && styles.methodTextActive,
                  ]}
                >
                  📱 UPI / PhonePe
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitPaymentBtn, submittingPayment && { opacity: 0.6 }]}
              onPress={handleRecordPayment}
              disabled={submittingPayment}
              activeOpacity={0.88}
            >
              {submittingPayment ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitPaymentBtnText}>
                  ✅ जमा करें व रसीद अपडेट करें
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelPayBtn}
              onPress={() => setShowPayModal(false)}
            >
              <Text style={styles.cancelPayText}>रद्द करें</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  headerContainer: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 18,
    elevation: 6,
    shadowColor: '#005A32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  headerTitleCol: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerMainTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  headerPrintBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerPrintIcon: {
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 30,
  },

  /* Customer Profile Card */
  customerProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 22,
    fontWeight: '900',
  },
  profileDetailsCol: {
    flex: 1,
    marginLeft: 14,
  },
  profileNameText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#063A1B',
  },
  profileVillageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  profilePin: {
    fontSize: 12,
    marginRight: 4,
    color: '#EF4444',
  },
  profileVillageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  profilePhoneText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  profileActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  profileActionBtnCall: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileActionBtnWhatsApp: {
    flex: 1.3,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  profileActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F5132',
  },

  /* 2.5 Highlight Stats Tiles Grid */
  statsSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 14,
  },
  statTileCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  statTileIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statTileIcon: {
    fontSize: 18,
  },
  statTileContent: {
    flex: 1,
  },
  statTileLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  statTileValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },

  /* Hero Pending Debt Card */
  pendingHeroCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  pendingHeroCardRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  pendingHeroCardGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  pendingHeroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pendingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingBadgeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  pendingBadgeLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  pendingTextRed: {
    color: '#B91C1C',
  },
  pendingTextGreen: {
    color: '#15803D',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagRed: {
    backgroundColor: '#FEE2E2',
  },
  statusTagGreen: {
    backgroundColor: '#DCFCE7',
  },
  statusTagText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  statusTagTextRed: {
    color: '#DC2626',
  },
  statusTagTextGreen: {
    color: '#15803D',
  },
  pendingBigAmount: {
    fontSize: 34,
    fontWeight: '900',
    marginVertical: 4,
  },
  pendingAmountRed: {
    color: '#DC2626',
  },
  pendingAmountGreen: {
    color: '#15803D',
  },
  pendingSubtitle: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 12,
  },
  settleDebtBtn: {
    backgroundColor: '#0F4A2C',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  settleDebtBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '900',
  },

  /* Mini Stats 3 Grid */
  miniStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  miniStatEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  miniStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  miniStatVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },

  /* History Section */
  historySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historySectionIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  historySectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#063A1B',
  },
  historyCountBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  historyCountBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  historyRecordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  historyRecordTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordTokenBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recordTokenText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  recordDateText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  recordDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  recordDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordItemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#063A1B',
  },
  recordWeightRateText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  recordPriceCol: {
    alignItems: 'flex-end',
  },
  recordTotalPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  recordStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginTop: 4,
  },
  statusPillRed: {
    backgroundColor: '#FEE2E2',
  },
  statusPillGreen: {
    backgroundColor: '#DCFCE7',
  },
  recordStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTextRed: {
    color: '#DC2626',
  },
  statusTextGreen: {
    color: '#15803D',
  },
  recordFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  recordDeliveryNote: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  recordPrintLinkText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2563EB',
  },
  emptyHistoryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#64748B',
  },
  newEntryForCustomerBtn: {
    backgroundColor: '#0F4A2C',
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    elevation: 3,
  },
  newEntryBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '900',
  },

  /* Pay Debt Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  payModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    elevation: 10,
  },
  modalHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  payModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  payModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  rupeePrefix: {
    fontSize: 20,
    fontWeight: '900',
    color: '#063A1B',
    marginRight: 6,
  },
  amountInputField: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    paddingVertical: 10,
  },
  quickPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  quickPill: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  methodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  methodBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  methodBtnActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#86EFAC',
  },
  methodText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#64748B',
  },
  methodTextActive: {
    color: '#15803D',
    fontWeight: '900',
  },
  submitPaymentBtn: {
    backgroundColor: '#0F4A2C',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
  },
  submitPaymentBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  cancelPayBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelPayText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
});

