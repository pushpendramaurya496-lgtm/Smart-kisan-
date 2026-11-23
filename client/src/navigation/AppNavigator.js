import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { GetStartedScreen } from '../screens/GetStartedScreen';
import { LanguageSelectScreen } from '../screens/LanguageSelectScreen';
import { LoginPhoneScreen } from '../screens/LoginPhoneScreen';
import { OtpVerifyScreen } from '../screens/OtpVerifyScreen';
import { ResetPinScreen } from '../screens/ResetPinScreen';
import { OwnerProfileScreen } from '../screens/OwnerProfileScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { VoiceAssistantScreen } from '../screens/VoiceAssistantScreen';
import { GrahakKhataScreen } from '../screens/GrahakKhataScreen';
import { BillPrintScreen } from '../screens/BillPrintScreen';
import { NewEntryScreen } from '../screens/NewEntryScreen';
import { PickupDeliveryScreen } from '../screens/PickupDeliveryScreen';
import { CustomerDashboardScreen } from '../screens/CustomerDashboardScreen';
import { SettingsActivityScreen } from '../screens/SettingsActivityScreen';
import { EarningsDashboardScreen } from '../screens/EarningsDashboardScreen';
import { TodayMillingDashboardScreen } from '../screens/TodayMillingDashboardScreen';
import { TotalCustomerDashboardScreen } from '../screens/TotalCustomerDashboardScreen';
import { PendingBalanceDashboardScreen } from '../screens/PendingBalanceDashboardScreen';

export const AppNavigator = () => {
  // App starts on the GetStarted Welcome Screen as requested
  const [history, setHistory] = useState([{ name: 'GetStarted', params: {} }]);

  const current = history[history.length - 1] || { name: 'Home', params: {} };

  const navigation = {
    navigate: (name, params = {}) => {
      setHistory((prev) => [...prev, { name, params }]);
    },
    replace: (name, params = {}) => {
      setHistory([{ name, params }]);
    },
    goBack: () => {
      setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    },
  };

  // Hardware Back Button (Android)
  useEffect(() => {
    const onBackPress = () => {
      if (history.length > 1) {
        navigation.goBack();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [history]);

  const renderScreen = () => {
    switch (current.name) {
      case 'GetStarted':
        return <GetStartedScreen navigation={navigation} route={{ params: current.params }} />;
      case 'LanguageSelect':
        return <LanguageSelectScreen navigation={navigation} route={{ params: current.params }} />;
      case 'LoginPhone':
        return <LoginPhoneScreen navigation={navigation} route={{ params: current.params }} />;
      case 'OtpVerify':
        return <OtpVerifyScreen navigation={navigation} route={{ params: current.params }} />;
      case 'ResetPin':
        return <ResetPinScreen navigation={navigation} route={{ params: current.params }} />;
      case 'OwnerProfile':
        return <OwnerProfileScreen navigation={navigation} route={{ params: current.params }} />;
      case 'Profile':
        return <ProfileScreen navigation={navigation} route={{ params: current.params }} />;
      case 'VoiceAssistant':
        return <VoiceAssistantScreen navigation={navigation} route={{ params: current.params }} />;
      case 'GrahakKhata':
        return <GrahakKhataScreen navigation={navigation} route={{ params: current.params }} />;
      case 'BillPrint':
        return <BillPrintScreen navigation={navigation} route={{ params: current.params }} />;
      case 'NewEntry':
        return <NewEntryScreen navigation={navigation} route={{ params: current.params }} />;
      case 'PickupDelivery':
        return <PickupDeliveryScreen navigation={navigation} route={{ params: current.params }} />;
      case 'CustomerDashboard':
        return <CustomerDashboardScreen navigation={navigation} route={{ params: current.params }} />;
      case 'Settings':
      case 'SettingsActivity':
        return <SettingsActivityScreen navigation={navigation} route={{ params: current.params }} />;
      case 'EarningsDashboard':
        return <EarningsDashboardScreen navigation={navigation} route={{ params: current.params }} />;
      case 'TodayMilling':
      case 'TodayMillingDashboard':
        return <TodayMillingDashboardScreen navigation={navigation} route={{ params: current.params }} />;
      case 'TotalCustomer':
      case 'TotalCustomerDashboard':
        return <TotalCustomerDashboardScreen navigation={navigation} route={{ params: current.params }} />;
      case 'PendingBalance':
      case 'BakiHisab':
      case 'PendingBalanceDashboard':
        return <PendingBalanceDashboardScreen navigation={navigation} route={{ params: current.params }} />;
      case 'Home':
      default:
        return <HomeScreen navigation={navigation} route={{ params: current.params }} />;
    }
  };

  return <View style={styles.container}>{renderScreen()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A2E14',
  },
});
