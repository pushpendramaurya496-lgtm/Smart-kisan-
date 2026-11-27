import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useChakki } from '../context/ChakkiContext';
import { StatWheat, StatUsers, StatRupee, StatGear } from './illustrations/AppIllustrations';

export const StatGrid = ({ stats = {}, onTodayMillingPress, onTotalCustomersPress, onPendingBalancePress }) => {
  const { t } = useChakki();
  const pisaiKg = stats.todayPisaiKg ?? 0;
  const customers = stats.totalCustomers ?? 0;
  const pendingFormatted = Number(stats.pendingDebt ?? 0).toLocaleString('en-IN');
  const expenseFormatted = Number(stats.totalExpense ?? 0).toLocaleString('en-IN');

  return (
    <View style={styles.grid}>
      {/* CARD 1: Today's Milling (Wheat) -> Value Color: Dark Green */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onTodayMillingPress}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel="Today's Milling"
      >
        <View style={styles.iconContainer}>
          <StatWheat size={38} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{t('todayPisai')}</Text>
          <Text style={[styles.value, styles.greenValue]}>{pisaiKg} kg</Text>
        </View>
      </TouchableOpacity>

      {/* CARD 2: Total Customers (Blue Avatars) -> Value Color: Dark Navy */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onTotalCustomersPress}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel="Total Customers"
      >
        <View style={styles.iconContainer}>
          <StatUsers size={38} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{t('totalCustomers')}</Text>
          <Text style={[styles.value, styles.navyValue]}>{customers}</Text>
        </View>
      </TouchableOpacity>

      {/* CARD 3: Pending Balance (Rupee Coin + Red Warning) -> Value Color: Red */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPendingBalancePress}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel="Pending Balance"
      >
        <View style={styles.iconContainer}>
          <StatRupee size={38} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{t('pendingDebt')}</Text>
          <Text style={[styles.value, styles.redValue]}>₹ {pendingFormatted}</Text>
        </View>
      </TouchableOpacity>

      {/* CARD 4: Total Expense (Blue Gear) -> Value Color: Dark Navy */}
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <StatGear size={38} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{t('totalExpense')}</Text>
          <Text style={[styles.value, styles.navyValue]}>₹ {expenseFormatted}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 10,
  },
  card: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  value: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  greenValue: {
    color: '#0F5132',
  },
  navyValue: {
    color: '#0F172A',
  },
  redValue: {
    color: '#DC2626',
  },
});
export default StatGrid;
