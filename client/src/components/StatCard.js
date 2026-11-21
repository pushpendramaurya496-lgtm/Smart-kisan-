import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatWheat, StatUsers, StatRupee, StatGear } from './illustrations/AppIllustrations';

export const StatGrid = ({ stats = {} }) => {
  const pisaiKg = stats.todayPisaiKg || 210;
  const customers = stats.totalCustomers || 48;
  const pendingFormatted = Number(stats.pendingDebt || 1250).toLocaleString('en-IN');
  const expenseFormatted = Number(stats.totalExpense || 620).toLocaleString('en-IN');

  return (
    <View style={styles.grid}>
      {/* CARD 1: Today's Milling (Wheat) -> Value Color: Dark Green */}
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <StatWheat size={38} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Today's Milling</Text>
          <Text style={[styles.value, styles.greenValue]}>{pisaiKg} kg</Text>
        </View>
      </View>

      {/* CARD 2: Total Customers (Blue Avatars) -> Value Color: Dark Navy */}
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <StatUsers size={38} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Total Customers</Text>
          <Text style={[styles.value, styles.navyValue]}>{customers}</Text>
        </View>
      </View>

      {/* CARD 3: Pending Balance (Rupee Coin + Red Warning) -> Value Color: Red */}
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <StatRupee size={38} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Pending Balance</Text>
          <Text style={[styles.value, styles.redValue]}>₹ {pendingFormatted}</Text>
        </View>
      </View>

      {/* CARD 4: Total Expense (Blue Gear) -> Value Color: Dark Navy */}
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <StatGear size={38} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Total Expense</Text>
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
