import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { SpeechService } from '../services/speechService';

export const BillPrintScreen = ({ navigation, route }) => {
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

  // Defaults matching Photo 2 reference: Ramlal, 25 kg wheat, ₹4/kg, ₹100
  const billData = {
    millName: entry.millName || 'Chakki Smart AI',
    millTagline: entry.millTagline || 'आटा चक्की एवं मिल',
    customerName: entry.customerName || entry.name || 'रामलाल',
    item: entry.item || (entry.cropType === 'OIL' ? 'सरसों (तेल)' : entry.cropType === 'MASALA' ? 'मसाला (कुटाई)' : 'गेहूं (पिसाई)'),
    weightKg: entry.weightKg !== undefined ? entry.weightKg : (entry.weight !== undefined ? entry.weight : 25),
    ratePerKg: entry.ratePerKg !== undefined ? entry.ratePerKg : (entry.rate !== undefined ? entry.rate : 4),
    totalAmount: entry.totalAmount !== undefined ? entry.totalAmount : (entry.total !== undefined ? entry.total : 100),
    pendingAmount: entry.pendingAmount !== undefined ? entry.pendingAmount : (entry.pending !== undefined ? entry.pending : 100),
    date: entry.date || todayFormatted || '25-04-2025',
    status: entry.status || 'भुगतान बाकी',
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
          <Text style={styles.headerTitle}>बिल प्रिंट / शेयर करें</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Paper Invoice Receipt (Exact match to Photo 2) */}
        <View style={styles.receiptPaper}>
          <View style={styles.millHeader}>
            <Text style={styles.millLogo}>🌾 {billData.millName}</Text>
            <Text style={styles.millSub}>{billData.millTagline}</Text>
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.billDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.fieldLabel}>ग्राहक का नाम</Text>
              <Text style={styles.fieldValue}>: {billData.customerName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.fieldLabel}>सामान</Text>
              <Text style={styles.fieldValue}>: {billData.item}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.fieldLabel}>वजन</Text>
              <Text style={styles.fieldValue}>: {billData.weightKg} kg</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.fieldLabel}>रेट</Text>
              <Text style={styles.fieldValue}>: ₹{billData.ratePerKg} / kg</Text>
            </View>

            <View style={styles.solidDivider} />

            {/* Total Row: 100 in RED with 'बाकी' beside it */}
            <View style={[styles.detailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>कुल राशि</Text>
              <Text style={styles.totalValueRed}>
                : ₹{billData.totalAmount} <Text style={styles.baakiBadge}>(बाकी)</Text>
              </Text>
            </View>

            <Text style={styles.dateText}>दिनांक : {billData.date}</Text>
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
            <Text style={styles.whatsappBtnText}>WhatsApp से भेजें</Text>
          </TouchableOpacity>

          <View style={styles.printRow}>
            <TouchableOpacity
              style={styles.printBtn}
              activeOpacity={0.88}
              onPress={handlePrint}
            >
              <Text style={styles.actionIcon}>🖨️</Text>
              <Text style={styles.printBtnText}>प्रिंट करें</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsBtn}
              activeOpacity={0.85}
              onPress={handlePrinterSettings}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
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
});
