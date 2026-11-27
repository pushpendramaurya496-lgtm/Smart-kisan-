import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { SpeechService } from '../services/speechService';
import { useChakki } from '../context/ChakkiContext';

export const BillPrintScreen = ({ navigation, route }) => {
  const { language, currentUser } = useChakki();
  const insets = useSafeAreaInsets();
  const topSafePadding = Math.max(insets.top, 44);

  const params = route?.params || {};
  const entry = params.entry || params;

  // Format today's date if not provided
  const todayFormatted = (() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  })();

  const billData = {
    millName: currentUser?.profile?.chakkiName || entry.millName || 'Chakki Smart AI',
    millTagline: entry.millTagline || 'आटा चक्की एवं मिल',
    millPhone: currentUser?.phone || '',
    customerName: entry.customerName || entry.name || 'ग्राहक',
    item: entry.itemLabel || entry.item || (entry.cropType === 'OIL' ? 'सरसों (तेल)' : entry.cropType === 'MASALA' ? 'मसाला पिसाई' : 'गेहूं (पिसाई)'),
    weightKg: entry.weightKg !== undefined ? entry.weightKg : (entry.weight !== undefined ? entry.weight : 0),
    ratePerKg: entry.ratePerKg !== undefined ? entry.ratePerKg : (entry.rate !== undefined ? entry.rate : 0),
    totalAmount: entry.totalAmount !== undefined ? entry.totalAmount : (entry.total !== undefined ? entry.total : 0),
    pendingAmount: entry.pendingAmount !== undefined ? entry.pendingAmount : (entry.pending !== undefined ? entry.pending : 0),
    date: entry.date || todayFormatted,
    status: entry.status || (entry.pendingAmount > 0 ? 'भुगतान बाकी' : 'भुगतान चुकता'),
  };

  const handleWhatsAppShare = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    SpeechService.speak(`${billData.customerName} को WhatsApp पर बिल भेज दिया गया है।`);
    Alert.alert(
      'WhatsApp Sent!',
      `नमस्ते ${billData.customerName} जी, आपका बिल तैयार है। कुल राशि: ₹${billData.totalAmount} (बाकी)। PDF इनवॉइस भेज दी गई है।`
    );
  };

  const handlePrint = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    SpeechService.speak('प्रिंटर को बिल भेज दिया गया है।');
    Alert.alert(
      'Bluetooth Printer',
      `बिल प्रिंट हो रहा है...\nग्राहक: ${billData.customerName}\nराशि: ₹${billData.totalAmount} (बाकी)`
    );
  };

  const handlePrinterSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'प्रिंटर सेटिंग्स (Printer Settings)',
      '1. ब्लूटूथ थर्मल प्रिंटर (58mm / 80mm) कनेक्टेड है।\n2. स्वतः प्रिंट रसीद चालू है।'
    );
  };

  return (
    <View style={[styles.safeArea, { paddingTop: topSafePadding }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backText}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{language === 'hi' ? 'बिल प्रिंट / शेयर करें' : 'Print / Share Bill'}</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Paper Invoice Receipt (Exact match to Photo 2) */}
        <View style={styles.receiptPaper}>
          <View style={styles.millHeader}>
            <Text style={styles.millLogo}>🌾 {billData.millName}</Text>
            <Text style={styles.millSub}>{billData.millTagline}</Text>
            {Boolean(billData.millPhone) && (
              <Text style={[styles.millSub, { marginTop: 2, fontWeight: '700' }]}>
                📞 मो: +91 {billData.millPhone}
              </Text>
            )}
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.billDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.fieldLabel}>{language === 'hi' ? 'ग्राहक का नाम' : 'Customer Name'}</Text>
              <Text style={styles.fieldValue}>: {billData.customerName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.fieldLabel}>{language === 'hi' ? 'सामान' : 'Item'}</Text>
              <Text style={styles.fieldValue}>: {billData.item}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.fieldLabel}>{language === 'hi' ? 'वजन' : 'Weight'}</Text>
              <Text style={styles.fieldValue}>: {billData.weightKg} kg</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.fieldLabel}>{language === 'hi' ? 'रेट' : 'Rate'}</Text>
              <Text style={styles.fieldValue}>: ₹{billData.ratePerKg} / kg</Text>
            </View>

            <View style={styles.solidDivider} />

            {/* Total Row: 100 in RED with 'बाकी' beside it */}
            <View style={[styles.detailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>{language === 'hi' ? 'कुल राशि' : 'Total Amount'}</Text>
              <Text style={styles.totalValueRed}>
                : ₹{billData.totalAmount} <Text style={styles.baakiBadge}>{language === 'hi' ? '(बाकी)' : '(Due)'}</Text>
              </Text>
            </View>

            <Text style={styles.dateText}>{language === 'hi' ? 'दिनांक' : 'Date'} : {billData.date}</Text>
          </View>

          {/* Official Stamp Box matching Photo 2 */}
          <View style={styles.stampBox}>
            <Text style={styles.stampText}>{billData.status}</Text>
          </View>
        </View>

        {/* Action Buttons matching Photo 2 */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.whatsappBtn}
            activeOpacity={0.88}
            onPress={handleWhatsAppShare}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.whatsappBtnText}>{language === 'hi' ? 'WhatsApp से भेजें' : 'Send via WhatsApp'}</Text>
          </TouchableOpacity>

          <View style={styles.printRow}>
            <TouchableOpacity
              style={styles.printBtn}
              activeOpacity={0.88}
              onPress={handlePrint}
            >
              <Text style={styles.actionIcon}>🖨️</Text>
              <Text style={styles.printBtnText}>{language === 'hi' ? 'प्रिंट करें' : 'Print Bill'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsBtn}
              activeOpacity={0.85}
              onPress={handlePrinterSettings}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.homeBtn}
              activeOpacity={0.88}
              onPress={() => navigation.replace('Home')}
            >
              <Text style={styles.homeBtnText}>🏠 मुख्य पेज (Home)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.newEntryBtn}
              activeOpacity={0.88}
              onPress={() => navigation.replace('NewEntry')}
            >
              <Text style={styles.newEntryBtnText}>🌾 + नई पिसाई</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
  },
  backText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  receiptPaper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    marginVertical: 'auto',
  },
  millHeader: {
    alignItems: 'center',
    marginBottom: 6,
  },
  millLogo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803D',
  },
  millSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 16,
  },
  solidDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  billDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    width: 110,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  totalRow: {
    marginTop: 2,
    marginBottom: 2,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    width: 110,
  },
  totalValueRed: {
    fontSize: 18,
    fontWeight: '900',
    color: '#DC2626', // Red color for 100 as requested
    flex: 1,
  },
  baakiBadge: {
    fontSize: 16,
    fontWeight: '900',
    color: '#DC2626', // 'बाकी' written in RED beside it!
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 6,
  },
  stampBox: {
    alignSelf: 'center',
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: '#F0FDF4',
  },
  stampText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#059669',
  },
  actions: {
    gap: 12,
    paddingTop: 8,
  },
  whatsappBtn: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
    elevation: 3,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  whatsappBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  printRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  printBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
    elevation: 3,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  printBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  settingsBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4B77BE',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  settingsIcon: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  actionIcon: {
    fontSize: 18,
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  homeBtn: {
    flex: 1,
    backgroundColor: '#0F4A2C',
    paddingVertical: 13,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  homeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  newEntryBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#0F4A2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newEntryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F4A2C',
  },
});
