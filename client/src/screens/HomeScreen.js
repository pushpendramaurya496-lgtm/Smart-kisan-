import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { TopHeader } from '../components/TopHeader';
import { ChakkiHeaderCard } from '../components/ChakkiHeaderCard';
import { HeroEarningsCard } from '../components/HeroEarningsCard';
import { StatGrid } from '../components/StatCard';
import { ChakkiPromoBanner } from '../components/ChakkiPromoBanner';
import { ServiceGrid } from '../components/ServiceTile';
import { BottomDock } from '../components/BottomDock';
import { useChakki } from '../context/ChakkiContext';

export const HomeScreen = ({ navigation }) => {
  const { stats } = useChakki();
  const insets = useSafeAreaInsets();

  // Safe padding to clear status bar cleanly
  const topSafePadding = Math.max(insets.top || 0, 42) + 2;

  const handleTilePress = (tileId) => {
    if (tileId === 'whatsapp' || tileId === 'reports') {
      navigation.navigate('BillPrint', { customerId: 'c1' });
    } else {
      navigation.navigate('NewEntry', { defaultType: tileId });
    }
  };

  const handleTabPress = (tabId) => {
    if (tabId === 'khata') navigation.navigate('GrahakKhata');
    else if (tabId === 'bill') navigation.navigate('BillPrint', { customerId: 'c1' });
    else if (tabId === 'settings') navigation.navigate('Settings');
  };

  return (
    <View style={styles.container}>
      {/* High-contrast dark status bar icons on clean light background */}
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Main Screen Layout on Clean #F2F6FC Background */}
      <View style={[styles.mainWrapper, { paddingTop: topSafePadding }]}>
        {/* 1. Fixed / Sticky Header: Kisan Sathi title, logo, bell & profile (stays fixed when scrolling) */}
        <View style={styles.fixedHeaderContainer}>
          <TopHeader onProfilePress={() => navigation.navigate('Profile')} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 2. Chakki Smart AI Card with Wheat Medallion & Crown Premium badge */}
          <ChakkiHeaderCard
            onPremiumPress={() => navigation.navigate('BillPrint', { customerId: 'c1' })}
          />

          {/* 3. Today's Earnings Green Gradient Card with Decorative Wheat Stalks */}
          <HeroEarningsCard
            earnings={stats?.todayEarnings || 2850}
            growthPercent={stats?.growthPercent || 12}
            onPress={() => navigation.navigate('EarningsDashboard')}
          />

          {/* 4. Main Action Buttons: 1. + नई पिसाई (Dark Green) | 2. माल लेने आए (Orange) */}
          <View style={styles.actionCardsRow}>
            {/* Left Button: + नई पिसाई */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => navigation.navigate('NewEntry')}
              style={styles.actionCardLeft}
            >
              <View style={styles.actionIconCircle}>
                <Text style={styles.actionIcon}>🌾</Text>
              </View>
              <View style={styles.actionTextColumn}>
                <Text style={styles.actionMainTitle}>+ नई पिसाई</Text>
                <Text style={styles.actionSubtitle}>माल जमा / टोकन</Text>
              </View>
            </TouchableOpacity>

            {/* Right Button: माल लेने आए */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => navigation.navigate('PickupDelivery')}
              style={styles.actionCardRight}
            >
              <View style={styles.actionIconCircleAmber}>
                <Text style={styles.actionIcon}>📦</Text>
              </View>
              <View style={styles.actionTextColumn}>
                <Text style={styles.actionMainTitle}>माल लेने आए</Text>
                <Text style={styles.actionSubtitle}>डिलिवरी व भुगतान</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 5. Statistics Cards (4 Cards in 2x2 Grid) */}
          <StatGrid
            stats={stats}
            onTodayMillingPress={() => navigation.navigate('TodayMilling')}
            onTotalCustomersPress={() => navigation.navigate('TotalCustomer')}
            onPendingBalancePress={() => navigation.navigate('PendingBalance')}
          />

          {/* 6. Promotional Banner: 16:9 Auto-scrolling Dual Promotional Banner */}
          <ChakkiPromoBanner
            onPressRate={() => navigation.navigate('Settings')}
            onPressDelivery={() => navigation.navigate('PickupDelivery')}
          />

          {/* 7. Business Category Cards: Flour, Oil, Spices, Stock (2x2 Grid) */}
          <ServiceGrid onTilePress={handleTilePress} />

          {/* Bottom spacing before bottom nav */}
          <View style={{ height: 14 }} />
        </ScrollView>

        {/* 8. Fixed Bottom Navigation Bar */}
        <BottomDock activeTab="home" onTabPress={handleTabPress} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F6FC', // Clean light blue-grey per design specification
  },
  mainWrapper: {
    flex: 1,
  },
  fixedHeaderContainer: {
    paddingHorizontal: 16,
    backgroundColor: '#F2F6FC',
    zIndex: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  actionCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionCardLeft: {
    flex: 1,
    backgroundColor: '#0F4A2C', // Solid dark forest green matching screenshot
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#0F4A2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  actionCardRight: {
    flex: 1,
    backgroundColor: '#D97706', // Solid warm orange matching screenshot
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconCircleAmber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 20,
  },
  actionTextColumn: {
    flex: 1,
  },
  actionMainTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.88)',
    fontWeight: '500',
    marginTop: 1,
  },
});
export default HomeScreen;
