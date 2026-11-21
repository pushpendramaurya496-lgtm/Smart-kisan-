import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  TileWheatIcon,
  TileOilIcon,
  TileMasalaIcon,
  TileStockIcon,
} from './illustrations/AppIllustrations';

export const ServiceGrid = ({ onTilePress }) => {
  const categories = [
    {
      id: 'pisai',
      type: 'WHEAT',
      IconComponent: TileWheatIcon,
      title: 'Flour',
      subtitle: 'Grain Milling',
      borderColor: '#0D9488', // Teal
      iconBg: '#F0FDFA', // Light Teal
    },
    {
      id: 'tel',
      type: 'OIL',
      IconComponent: TileOilIcon,
      title: 'Oil',
      subtitle: 'Pressing',
      borderColor: '#EA580C', // Orange
      iconBg: '#FFF7ED', // Light Orange
    },
    {
      id: 'masala',
      type: 'MASALA',
      IconComponent: TileMasalaIcon,
      title: 'Spices',
      subtitle: 'Grinding',
      borderColor: '#BE123C', // Red / Brown
      iconBg: '#FEF2F2', // Light Red
    },
    {
      id: 'stock',
      type: 'STOCK',
      IconComponent: TileStockIcon,
      title: 'Stock',
      subtitle: 'Management',
      borderColor: '#7C3AED', // Purple
      iconBg: '#FAF5FF', // Light Purple
    },
  ];

  const handlePress = (id, type) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    if (onTilePress) onTilePress(type || id);
  };

  return (
    <View style={styles.grid}>
      {categories.map((cat) => {
        const Icon = cat.IconComponent;
        return (
          <TouchableOpacity
            key={cat.id}
            activeOpacity={0.86}
            onPress={() => handlePress(cat.id, cat.type)}
            style={[styles.card, { borderColor: cat.borderColor }]}
          >
            {/* Left: Colored Icon inside Light-Colored Rounded Square */}
            <View style={[styles.iconBox, { backgroundColor: cat.iconBg }]}>
              <Icon size={34} />
            </View>

            {/* Right: Bold Title & Subtitle */}
            <View style={styles.textColumn}>
              <Text style={styles.title} numberOfLines={1}>{cat.title}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{cat.subtitle}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
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
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
});
export default ServiceGrid;
