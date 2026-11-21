import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Pixel-Perfect Vector Icons Matching Reference Screenshot
const HouseIcon = ({ color, size = 22 }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    {/* Roof triangle */}
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 9,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: color,
      }}
    />
    {/* House body with small door cutout */}
    <View
      style={{
        width: 15,
        height: 10,
        backgroundColor: color,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      <View
        style={{
          width: 5,
          height: 5.5,
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 1.5,
          borderTopRightRadius: 1.5,
        }}
      />
    </View>
  </View>
);

const UsersIcon = ({ color, size = 22 }) => (
  <View
    style={{
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      {/* Primary Person */}
      <View style={{ alignItems: 'center', zIndex: 2 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <View
          style={{
            width: 13,
            height: 7,
            borderTopLeftRadius: 6.5,
            borderTopRightRadius: 6.5,
            backgroundColor: color,
            marginTop: 1.5,
          }}
        />
      </View>
      {/* Secondary Person */}
      <View style={{ alignItems: 'center', marginLeft: -4, zIndex: 1, opacity: 0.85 }}>
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }} />
        <View
          style={{
            width: 11,
            height: 6,
            borderTopLeftRadius: 5.5,
            borderTopRightRadius: 5.5,
            backgroundColor: color,
            marginTop: 1.5,
          }}
        />
      </View>
    </View>
  </View>
);

const BillIcon = ({ color, size = 22 }) => (
  <View
    style={{
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <View
      style={{
        width: 15,
        height: 19,
        backgroundColor: color,
        borderRadius: 2.5,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2.5,
      }}
    >
      {/* Document Horizontal Lines */}
      <View style={{ width: 9, height: 2, backgroundColor: '#FFFFFF', borderRadius: 1, marginBottom: 2 }} />
      <View style={{ width: 9, height: 2, backgroundColor: '#FFFFFF', borderRadius: 1, marginBottom: 2 }} />
      <View style={{ width: 6, height: 2, backgroundColor: '#FFFFFF', borderRadius: 1, alignSelf: 'flex-start', marginLeft: 0.5 }} />
    </View>
  </View>
);

const SettingsIcon = ({ color, size = 22 }) => (
  <View
    style={{
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}
  >
    {/* Outer teeth */}
    <View style={{ position: 'absolute', width: 17, height: 3.5, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ position: 'absolute', width: 3.5, height: 17, backgroundColor: color, borderRadius: 1 }} />
    <View
      style={{
        position: 'absolute',
        width: 17,
        height: 3.5,
        backgroundColor: color,
        borderRadius: 1,
        transform: [{ rotate: '45deg' }],
      }}
    />
    <View
      style={{
        position: 'absolute',
        width: 3.5,
        height: 17,
        backgroundColor: color,
        borderRadius: 1,
        transform: [{ rotate: '45deg' }],
      }}
    />
    {/* Inner ring & hole */}
    <View
      style={{
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ width: 5.5, height: 5.5, borderRadius: 2.75, backgroundColor: '#FFFFFF' }} />
    </View>
  </View>
);

export const BottomDock = ({ activeTab = 'home', onTabPress }) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom || 0, 8);

  const tabs = [
    { id: 'home', label: 'Home', icon: HouseIcon },
    { id: 'khata', label: 'Customer', icon: UsersIcon },
    { id: 'bill', label: 'Bill', icon: BillIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <View style={[styles.bottomBar, { paddingBottom: bottomPadding }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const IconComponent = tab.icon;
        const color = isActive ? '#0F5132' : '#64748B';

        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.78}
            onPress={() => onTabPress && onTabPress(tab.id)}
            style={styles.tabItem}
          >
            <View style={styles.iconContainer}>
              <IconComponent color={color} size={22} />
            </View>
            <Text style={[styles.tabLabel, { color, fontWeight: isActive ? '800' : '600' }]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeUnderline} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconContainer: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: -0.2,
  },
  activeUnderline: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#0F5132',
    marginTop: 3,
  },
});
export default BottomDock;
