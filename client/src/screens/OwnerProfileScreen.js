import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { FarmerAvatar } from '../components/illustrations/AppIllustrations';
import { useChakki } from '../context/ChakkiContext';
import { AuthApiService } from '../services/authApiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 600;

export const OwnerProfileScreen = ({ navigation, route }) => {
  const { token, phone = '' } = route.params || {};
  const { t, syncLoggedInUser } = useChakki();
  const insets = useSafeAreaInsets();

  const [ownerName, setOwnerName] = useState('');
  const [chakkiName, setChakkiName] = useState('');
  const [village, setVillage] = useState('');
  const [mpin, setMpin] = useState('');
  const [selectedServices, setSelectedServices] = useState(['PISAI', 'OIL', 'MASALA']);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const servicesList = [
    { id: 'PISAI', label: '🌾 अनाज पिसाई' },
    { id: 'OIL', label: '🌻 तेल पिसाई' },
    { id: 'MASALA', label: '🌶️ मसाला कुटाई' },
  ];

  const toggleService = (id) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    if (selectedServices.includes(id)) {
      if (selectedServices.length === 1) return; // Keep at least one
      setSelectedServices(selectedServices.filter((s) => s !== id));
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  const handleSaveProfile = async () => {
    if (!ownerName.trim()) {
      setErrorMsg('कृपया चक्की मालिक का नाम दर्ज करें');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
      return;
    }

    if (!chakkiName.trim()) {
      setErrorMsg('कृपया चक्की/दुकान का नाम दर्ज करें');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    try {
      const result = await AuthApiService.completeProfile(token, {
        phone,
        ownerName: ownerName.trim(),
        chakkiName: chakkiName.trim(),
        village: village.trim(),
        mpin: mpin.trim() || '1234',
        servicesOffered: selectedServices,
      });

      // Save complete session & sync to context
      await AuthApiService.saveAuthSession(result.token || token, result.user, phone);
      if (syncLoggedInUser) {
        await syncLoggedInUser(result.user, result.token || token, phone);
      }

      setLoading(false);
      // Navigate straight to Main Dashboard!
      navigation.replace('Home');
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'प्रोफाइल सहेजने में विफल');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top || 0, 40) + 14,
            paddingBottom: Math.max(insets.bottom || 0, 20) + 20,
          },
        ]}
      >
        {/* Title Header */}
        <Text style={styles.mainTitle}>{t('profileTitle')}</Text>
        <Text style={styles.subtitle}>{t('profileSubtitle')}</Text>

        {/* Avatar Section */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarBorder}>
            <FarmerAvatar size={74} />
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </View>
        </View>

        {/* Field 1: Owner Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('ownerNameLabel')} *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('ownerNamePlaceholder')}
            placeholderTextColor="#94A3B8"
            value={ownerName}
            onChangeText={(text) => {
              setOwnerName(text);
              if (errorMsg) setErrorMsg('');
            }}
          />
        </View>

        {/* Field 2: Chakki Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('chakkiNameLabel')} *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('chakkiNamePlaceholder')}
            placeholderTextColor="#94A3B8"
            value={chakkiName}
            onChangeText={(text) => {
              setChakkiName(text);
              if (errorMsg) setErrorMsg('');
            }}
          />
        </View>

        {/* Field 3: Village / City */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('villageLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('villagePlaceholder')}
            placeholderTextColor="#94A3B8"
            value={village}
            onChangeText={setVillage}
          />
        </View>

        {/* Field 4: Services Offered */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('servicesLabel')}</Text>
          <View style={styles.servicesRow}>
            {servicesList.map((item) => {
              const active = selectedServices.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => toggleService(item.id)}
                  style={[styles.serviceChip, active ? styles.serviceChipActive : null]}
                >
                  <Text style={[styles.serviceChipText, active ? styles.serviceTextActive : null]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Field 5: 4-digit MPIN */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('mpinLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('mpinPlaceholder')}
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            maxLength={4}
            value={mpin}
            onChangeText={setMpin}
          />
        </View>

        {/* Error message */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {/* Action Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleSaveProfile}
          disabled={loading}
          style={[styles.actionButton, loading && styles.actionButtonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.actionButtonText}>{t('completeProfileBtn')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCF8',
  },
  content: {
    paddingHorizontal: 22,
  },
  mainTitle: {
    fontSize: isTablet ? 30 : 25,
    fontWeight: '900',
    color: '#0E331B',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: isTablet ? 16 : 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    fontWeight: '500',
  },
  avatarRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarBorder: {
    position: 'relative',
    padding: 3,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#004D25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00A844',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cameraIcon: {
    fontSize: 13,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15.5,
    fontWeight: '600',
    color: '#0F172A',
    elevation: 1,
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  serviceChipActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#00A844',
  },
  serviceChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  serviceTextActive: {
    color: '#007A38',
    fontWeight: '800',
  },
  errorBox: {
    marginBottom: 14,
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#004D1E',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#004D1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
});

