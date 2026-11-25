import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const MODAL_WIDTH = Math.min(width - 36, 380);

const HINDI_MONTHS = [
  'जनवरी',
  'फ़रवरी',
  'मार्च',
  'अप्रैल',
  'मई',
  'जून',
  'जुलाई',
  'अगस्त',
  'सितंबर',
  'अक्टूबर',
  'नवंबर',
  'दिसंबर',
];

const HINDI_DAYS = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

/**
 * Interactive Visual Monthly Calendar Modal for Atta Chakki App
 * Displays month navigation, 7-column day grid, selected date highlights, and quick presets.
 */
export const ChakkiCalendarModal = ({
  visible,
  onClose,
  onSelectDate,
  initialDate,
  initialPeriod = 'today',
}) => {
  // Reference date: November 23, 2026 (matching app reference date)
  const baseDate = initialDate ? new Date(initialDate) : new Date(2026, 10, 23);

  const [viewYear, setViewYear] = useState(baseDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(baseDate.getMonth()); // 0-indexed (10 = November)
  const [selectedDay, setSelectedDay] = useState(baseDate.getDate());
  const [activePreset, setActivePreset] = useState(initialPeriod);

  // Calculate days in current viewing month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  // Month navigation handlers
  const handlePrevMonth = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Day selection handler
  const handleDayPress = (day) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setSelectedDay(day);
    setActivePreset('custom');
  };

  // Preset chips handler
  const handlePresetPress = (presetKey) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setActivePreset(presetKey);

    if (presetKey === 'today') {
      setViewYear(2026);
      setViewMonth(10);
      setSelectedDay(23);
    } else if (presetKey === 'weekly') {
      setViewYear(2026);
      setViewMonth(10);
      setSelectedDay(23);
    } else if (presetKey === 'monthly') {
      setViewYear(2026);
      setViewMonth(10);
      setSelectedDay(1);
    } else if (presetKey === 'total') {
      setViewYear(2026);
      setViewMonth(10);
      setSelectedDay(23);
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    const chosenDate = new Date(viewYear, viewMonth, selectedDay);
    const dateFormatted = `${selectedDay} ${HINDI_MONTHS[viewMonth]} ${viewYear}`;

    if (onSelectDate) {
      onSelectDate({
        date: chosenDate,
        day: selectedDay,
        month: viewMonth,
        year: viewYear,
        dateFormatted,
        period: activePreset,
      });
    }
    onClose();
  };

  // Build grid cells (empty leading slots + month days)
  const gridCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    gridCells.push({ key: `empty-${i}`, empty: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    gridCells.push({
      key: `day-${d}`,
      day: d,
      empty: false,
      isSelected: d === selectedDay,
      isToday: d === 23 && viewMonth === 10 && viewYear === 2026,
    });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.modalBackdrop}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={styles.calendarCard}
        >
          {/* ── 1. MODAL HEADER (Title & Close Button) ── */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.calendarIconEmoji}>📅</Text>
              <Text style={styles.headerTitle}>कैलेंडर (तारीख चुनें)</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="बंद करें"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── 2. QUICK PRESET CHIPS ── */}
          <View style={styles.presetChipsRow}>
            {[
              { id: 'today', label: 'आज (Today)' },
              { id: 'weekly', label: 'इस हफ्ते' },
              { id: 'monthly', label: 'इस महीने' },
              { id: 'total', label: 'कुल रिकॉर्ड' },
            ].map((p) => {
              const isSelected = activePreset === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.8}
                  onPress={() => handlePresetPress(p.id)}
                  style={[
                    styles.presetChip,
                    isSelected ? styles.presetChipActive : styles.presetChipInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      isSelected ? styles.presetChipTextActive : styles.presetChipTextInactive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── 3. MONTH & YEAR NAVIGATION BAR ── */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePrevMonth}
              style={styles.monthNavArrowBtn}
              accessibilityLabel="पिछला महीना"
            >
              <Text style={styles.monthNavArrowText}>‹</Text>
            </TouchableOpacity>

            <View style={styles.monthTitleWrapper}>
              <Text style={styles.monthTitleText}>
                {HINDI_MONTHS[viewMonth]} {viewYear}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleNextMonth}
              style={styles.monthNavArrowBtn}
              accessibilityLabel="अगला महीना"
            >
              <Text style={styles.monthNavArrowText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* ── 4. DAYS OF WEEK HEADER (रवि, सोम, मंगल...) ── */}
          <View style={styles.daysHeaderRow}>
            {HINDI_DAYS.map((dayName, idx) => (
              <View key={dayName} style={styles.dayHeaderCell}>
                <Text
                  style={[
                    styles.dayHeaderText,
                    idx === 0 && styles.dayHeaderSundayText, // Sunday highlight
                  ]}
                >
                  {dayName}
                </Text>
              </View>
            ))}
          </View>

          {/* ── 5. CALENDAR DAYS GRID (7 Columns) ── */}
          <View style={styles.daysGrid}>
            {gridCells.map((cell) => {
              if (cell.empty) {
                return <View key={cell.key} style={styles.dayCellEmpty} />;
              }

              return (
                <TouchableOpacity
                  key={cell.key}
                  activeOpacity={0.7}
                  onPress={() => handleDayPress(cell.day)}
                  style={styles.dayCellContainer}
                >
                  <View
                    style={[
                      styles.dayNumberCircle,
                      cell.isToday && styles.dayTodayCircle,
                      cell.isSelected && styles.daySelectedCircle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        cell.isToday && styles.dayTodayText,
                        cell.isSelected && styles.daySelectedText,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── 6. SELECTED DATE BANNER ── */}
          <View style={styles.selectedDateBanner}>
            <Text style={styles.selectedDateLabel}>चुनी गई तारीख:</Text>
            <Text style={styles.selectedDateValue}>
              {selectedDay} {HINDI_MONTHS[viewMonth]} {viewYear}
            </Text>
          </View>

          {/* ── 7. ACTION BUTTONS (रद्द करें & चुनें) ── */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={onClose}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>रद्द करें</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleConfirm}
              style={styles.confirmButton}
            >
              <Text style={styles.confirmButtonText}>तारीख चुनें (Select)</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 29, 53, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  calendarCard: {
    width: MODAL_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },

  // 1. Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIconEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#14233B',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },

  // 2. Preset Chips
  presetChipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    gap: 6,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  presetChipActive: {
    backgroundColor: '#0F5132',
    borderColor: '#0F5132',
  },
  presetChipInactive: {
    backgroundColor: '#F8FAF8',
    borderColor: '#C9DED0',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  presetChipTextInactive: {
    color: '#14233B',
  },

  // 3. Month & Year Navigation
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: '#F4FAF4',
    borderRadius: 12,
    marginBottom: 10,
  },
  monthNavArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C9DED0',
  },
  monthNavArrowText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F5132',
    marginTop: -2,
  },
  monthTitleWrapper: {
    alignItems: 'center',
  },
  monthTitleText: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#14233B',
    letterSpacing: -0.2,
  },

  // 4. Days of Week Header
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
    marginBottom: 6,
  },
  dayHeaderCell: {
    width: (MODAL_WIDTH - 32) / 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  dayHeaderSundayText: {
    color: '#D97706', // Subtle amber for Sunday
  },

  // 5. Calendar Days Grid
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCellEmpty: {
    width: (MODAL_WIDTH - 32) / 7,
    height: 38,
  },
  dayCellContainer: {
    width: (MODAL_WIDTH - 32) / 7,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14233B',
  },
  dayTodayCircle: {
    backgroundColor: '#E6F5E8',
    borderWidth: 1.5,
    borderColor: '#28A66F',
  },
  dayTodayText: {
    color: '#0F5132',
    fontWeight: '700',
  },
  daySelectedCircle: {
    backgroundColor: '#0F5132', // Dark green matching reference style
    borderWidth: 0,
    shadowColor: '#0F5132',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  daySelectedText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // 6. Selected Date Banner
  selectedDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF9EF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D4EED8',
  },
  selectedDateLabel: {
    fontSize: 13,
    color: '#14233B',
    marginRight: 6,
  },
  selectedDateValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F5132',
  },

  // 7. Action Buttons
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmButton: {
    flex: 1.5,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#0F5132', // Dark green
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F5132',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ChakkiCalendarModal;

