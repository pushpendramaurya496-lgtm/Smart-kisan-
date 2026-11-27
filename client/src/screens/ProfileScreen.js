import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChakki } from '../context/ChakkiContext';
import { CloudinaryService } from '../services/cloudinaryService';
import { AuthApiService } from '../services/authApiService';

const farmerProfileImg = require('../../assets/icons/farmer_profile.png');

// Preset avatars for instant 1-tap photo change
const PRESET_AVATARS = [
  { id: 'default', label: 'पगड़ी वाले किसान जी', uri: null },
  {
    id: 'avatar_1',
    label: 'स्मार्ट चक्की मालिक',
    uri: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar_2',
    label: 'युवा उद्यमी किसान',
    uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar_3',
    label: 'अनुभवी मिल संचालक',
    uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  },
];

export const ProfileScreen = ({ navigation }) => {
  const { currentUser, updateUserProfile, rates, language, t } = useChakki();
  const insets = useSafeAreaInsets();

  const [isEditingModal, setIsEditingModal] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Profile data from context or reference defaults
  const [ownerName, setOwnerName] = useState(
    currentUser?.profile?.ownerName || 'Pushpendra Maurya'
  );
  const [chakkiName, setChakkiName] = useState(
    currentUser?.profile?.chakkiName || 'श्री गणेश फ्लोर मिल'
  );
  const [village, setVillage] = useState(
    currentUser?.profile?.village || 'चाकसू, जयपुर'
  );
  const [profileImage, setProfileImage] = useState(
    currentUser?.profile?.profileImage || null
  );
  const [activePhone, setActivePhone] = useState(
    currentUser?.phone || ''
  );

  useEffect(() => {
    (async () => {
      try {
        const savedPhone = await AsyncStorage.getItem('@chakki_login_phone');
        const session = await AuthApiService.getAuthSession();
        const p = currentUser?.phone || session?.user?.phone || savedPhone || '';
        if (p && p !== activePhone) {
          setActivePhone(p);
        }
        if (currentUser?.profile?.ownerName && currentUser.profile.ownerName !== ownerName) {
          setOwnerName(currentUser.profile.ownerName);
        }
        if (currentUser?.profile?.chakkiName && currentUser.profile.chakkiName !== chakkiName) {
          setChakkiName(currentUser.profile.chakkiName);
        }
        if (currentUser?.profile?.village && currentUser.profile.village !== village) {
          setVillage(currentUser.profile.village);
        }
      } catch (e) {}
    })();
  }, [currentUser]);

  const displayPhone = activePhone || currentUser?.phone || '9569735570';

  // Rates
  const [wheatRate, setWheatRate] = useState(
    String(currentUser?.defaultRates?.wheatPisaiPerKg || rates?.wheatPisaiPerKg || '3')
  );
  const [oilRate, setOilRate] = useState(
    String(currentUser?.defaultRates?.oilExtractionPerKg || rates?.oilExtractionPerKg || '7')
  );
  const [masalaRate, setMasalaRate] = useState(
    String(currentUser?.defaultRates?.masalaGrindingPerKg || rates?.masalaGrindingPerKg || '15')
  );

  // 1. Pick from Gallery
  const handlePickFromGallery = async () => {
    setPhotoModalVisible(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('अनुमति आवश्यक', 'गैलरी से फोटो चुनने के लिए अनुमति दें');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUri = result.assets[0].uri;
        setProfileImage(newUri);
        await savePhotoDirectly(newUri);
      }
    } catch (err) {
      console.warn('Gallery pick error:', err);
    }
  };

  // 2. Take with Camera
  const handleTakePhoto = async () => {
    setPhotoModalVisible(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('अनुमति आवश्यक', 'फोटो खींचने के लिए कैमरा अनुमति दें');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUri = result.assets[0].uri;
        setProfileImage(newUri);
        await savePhotoDirectly(newUri);
      }
    } catch (err) {
      console.warn('Camera photo error:', err);
    }
  };

  // 3. Select Preset Avatar
  const handleSelectPreset = async (presetUri) => {
    setPhotoModalVisible(false);
    setProfileImage(presetUri);
    await savePhotoDirectly(presetUri);
  };

  const savePhotoDirectly = async (uri) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    let finalUri = uri;
    // Upload local file to Cloudinary if it's a freshly picked photo
    if (uri && (uri.startsWith('file:') || uri.startsWith('content:'))) {
      try {
        const uploadRes = await CloudinaryService.uploadImage(uri, { folder: 'profiles' });
        if (uploadRes.success && uploadRes.url) {
          finalUri = uploadRes.url;
        }
      } catch (uploadErr) {
        console.warn('Cloudinary upload warning:', uploadErr.message);
      }
    }

    await updateUserProfile({
      profile: {
        ownerName,
        chakkiName,
        village,
        profileImage: finalUri,
      },
    });

    setSuccessMsg('फोटो सफलतापूर्वक बदल गई!');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  // 4. Save Profile Changes
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    const cleanPhone = (activePhone || currentUser?.phone || '').trim().replace(/\D/g, '');

    await updateUserProfile({
      phone: cleanPhone,
      profile: {
        ownerName: ownerName.trim() || 'Pushpendra Maurya',
        chakkiName: chakkiName.trim() || 'श्री गणेश फ्लोर मिल',
        village: village.trim() || 'चाकसू, जयपुर',
        profileImage,
      },
      defaultRates: {
        wheatPisaiPerKg: parseFloat(wheatRate) || 3,
        oilExtractionPerKg: parseFloat(oilRate) || 7,
        masalaGrindingPerKg: parseFloat(masalaRate) || 15,
      },
    });

    if (cleanPhone) {
      try {
        await AsyncStorage.setItem('@chakki_login_phone', cleanPhone);
      } catch (e) {}
    }

    setLoading(false);
    setIsEditingModal(false);
    setSuccessMsg('प्रोफाइल विवरण अपडेट हो गया!');
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // 5. Logout
  const handleLogout = () => {
    Alert.alert(
      'लॉगआउट',
      'क्या आप वाकई अपने खाते से लॉगआउट करना चाहते हैं?',
      [
        { text: 'रद्द करें', style: 'cancel' },
        {
          text: 'लॉगआउट करें',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('@chakki_token');
            navigation.replace('LoginPhone');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Light Status Bar Icons on Dark Green Header */}
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom || 0, 16) + 20 },
        ]}
      >
        {/* ========================================================= */}
        {/* 1. GREEN HEADER SECTION                                   */}
        {/* ========================================================= */}
        <LinearGradient
          colors={['#0F4A2C', '#0E482B', '#065F46']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.8 }}
          style={[styles.headerGradient, { paddingTop: Math.max(insets.top || 0, 36) + 8 }]}
        >
          {/* Top Bar Action Row */}
          <View style={styles.headerActionRow}>
            {/* Left: Translucent Back Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerBtn}
              activeOpacity={0.75}
            >
              <Text style={styles.headerBtnText}>{language === 'hi' ? '← वापस' : '← Back'}</Text>
            </TouchableOpacity>

            {/* Center: White Bold Heading */}
            <Text style={styles.headerTitle}>{t('myProfileTitle')}</Text>

            {/* Right: Translucent Edit Button */}
            <TouchableOpacity
              onPress={() => setIsEditingModal(true)}
              style={styles.headerBtn}
              activeOpacity={0.75}
            >
              <Text style={styles.headerBtnText}>{language === 'hi' ? '✏️ बदलाव करें' : '✏️ Edit'}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Success Alert Banner if any */}
        {successMsg ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✅ {successMsg}</Text>
          </View>
        ) : null}

        {/* ========================================================= */}
        {/* 2. FLOATING PROFILE SUMMARY CARD                          */}
        {/* ========================================================= */}
        <View style={styles.profileSummaryCard}>
          {/* Left: Circular Photo with Golden Border + Camera Badge */}
          <View style={styles.avatarWrapper}>
            <View style={styles.goldBorderCircle}>
              <Image
                source={profileImage ? { uri: profileImage } : farmerProfileImg}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>

            {/* Small Dark Green Camera Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setPhotoModalVisible(true)}
              style={styles.cameraBadge}
              accessibilityLabel="Change photo"
            >
              <Text style={styles.cameraIcon}>📷</Text>
            </TouchableOpacity>
          </View>

          {/* Right: Name, Shop, Golden Premium Badge & Verified Pill */}
          <View style={styles.profileSummaryTextCol}>
            {/* Owner Name */}
            <Text style={styles.ownerMainName}>{ownerName}</Text>

            {/* Mill Name & Golden Premium Badge */}
            <View style={styles.shopAndBadgeRow}>
              <Text style={styles.chakkiNameText}>{chakkiName}</Text>
              <View style={styles.premiumBadge}>
                <Text style={styles.crownEmoji}>👑</Text>
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            </View>

            {/* Verified Mobile Pill */}
            <View style={styles.verifiedPill}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
              <Text style={styles.verifiedText}>+91 {displayPhone} (सत्यापित खाता)</Text>
            </View>
          </View>
        </View>

        {/* ========================================================= */}
        {/* 3. MILL OWNER DETAILS CARD                                */}
        {/* ========================================================= */}
        <View style={styles.ownerDetailsCard}>
          {/* Heading Row */}
          <View style={styles.cardHeaderRow}>
            <Text style={styles.headerUserIcon}>👤</Text>
            <Text style={styles.cardHeadingTitle}>चक्की मालिक का विवरण</Text>
          </View>

          <View style={styles.divider} />

          {/* Row 1: मालिक का पूरा नाम */}
          <View style={styles.infoRow}>
            <View style={styles.rowLeftGroup}>
              <View style={styles.rowIconCircle}>
                <Text style={styles.rowIcon}>👤</Text>
              </View>
              <Text style={styles.rowLabel}>मालिक का पूरा नाम</Text>
            </View>
            <Text style={styles.rowValue}>{ownerName}</Text>
          </View>

          {/* Row 2: चक्की / दुकान का नाम */}
          <View style={styles.infoRow}>
            <View style={styles.rowLeftGroup}>
              <View style={styles.rowIconCircle}>
                <Text style={styles.rowIcon}>🏬</Text>
              </View>
              <Text style={styles.rowLabel}>चक्की / दुकान का नाम</Text>
            </View>
            <Text style={styles.rowValue}>{chakkiName}</Text>
          </View>

          {/* Row 3: मोबाइल नंबर */}
          <View style={styles.infoRow}>
            <View style={styles.rowLeftGroup}>
              <View style={styles.rowIconCircle}>
                <Text style={styles.rowIcon}>📞</Text>
              </View>
              <Text style={styles.rowLabel}>मोबाइल नंबर</Text>
            </View>
            <Text style={styles.rowValue}>+91 {displayPhone}</Text>
          </View>

          {/* Row 4: पता (गांव / शहर) */}
          <View style={styles.infoRow}>
            <View style={styles.rowLeftGroup}>
              <View style={styles.rowIconCircle}>
                <Text style={styles.rowIcon}>📍</Text>
              </View>
              <Text style={styles.rowLabel}>पता (गांव / शहर)</Text>
            </View>
            <Text style={styles.rowValue}>{village}</Text>
          </View>
        </View>

        {/* ========================================================= */}
        {/* 4. SERVICES & RATES CARD                                  */}
        {/* ========================================================= */}
        <View style={styles.servicesCard}>
          {/* Heading Row */}
          <View style={styles.cardHeaderRow}>
            <Text style={styles.headerGearIcon}>⚙️</Text>
            <Text style={styles.cardHeadingTitle}>चक्की की सेवाएं व दरें (Services & Rates)</Text>
          </View>

          <View style={styles.divider} />

          {/* 3 Equal Service Cards in a Horizontal Row */}
          <View style={styles.serviceCardsRow}>
            {/* 1. अनाज पिसाई (Pastel Green) */}
            <View style={styles.servicePillGreen}>
              <View style={styles.serviceTitleRow}>
                <Text style={styles.wheatEmoji}>🌾</Text>
                <Text style={styles.serviceTitleGreen}>अनाज पिसाई</Text>
              </View>
              <Text style={styles.serviceCheckmarkGreen}>✓</Text>
              <Text style={styles.servicePriceText}>₹{wheatRate} / kg</Text>
            </View>

            {/* 2. तेल पिसाई (Pastel Golden) */}
            <View style={styles.servicePillYellow}>
              <View style={styles.serviceTitleRow}>
                <Text style={styles.oilEmoji}>💧</Text>
                <Text style={styles.serviceTitleYellow}>तेल पिसाई</Text>
              </View>
              <Text style={styles.serviceCheckmarkYellow}>✓</Text>
              <Text style={styles.servicePriceText}>₹{oilRate} / kg</Text>
            </View>

            {/* 3. मसाला कुटाई (Pastel Pink) */}
            <View style={styles.servicePillPink}>
              <View style={styles.serviceTitleRow}>
                <Text style={styles.chilliEmoji}>🌶️</Text>
                <Text style={styles.serviceTitlePink}>मसाला कुटाई</Text>
              </View>
              <Text style={styles.serviceCheckmarkPink}>✓</Text>
              <Text style={styles.servicePriceText}>₹{masalaRate} / kg</Text>
            </View>
          </View>
        </View>

        {/* ========================================================= */}
        {/* 5. MEMBERSHIP & ACCOUNT STATUS CARD                       */}
        {/* ========================================================= */}
        <View style={styles.membershipCard}>
          {/* Left: Crown + सदस्यता: Premium */}
          <View style={styles.memberLeft}>
            <Text style={styles.memberCrown}>👑</Text>
            <Text style={styles.memberText}>
              सदस्यता: <Text style={styles.memberBold}>Premium</Text>
            </Text>
          </View>

          {/* Right: खाता स्थिति: सक्रिय + Green Indicator */}
          <View style={styles.memberRight}>
            <Text style={styles.statusLabel}>खाता स्थिति: </Text>
            <Text style={styles.statusActive}>सक्रिय</Text>
            <View style={styles.greenStatusDot} />
          </View>
        </View>

        {/* ========================================================= */}
        {/* 6. BOTTOM LOGOUT BUTTON                                   */}
        {/* ========================================================= */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>खाते से लॉगआउट करें (Logout)</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ========================================================= */}
      {/* 7. EDIT DETAILS MODAL                                     */}
      {/* ========================================================= */}
      <Modal
        visible={isEditingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>✏️ प्रोफाइल व दरें बदलें</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>मालिक का नाम</Text>
              <TextInput
                style={styles.modalInput}
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="उदा. रामलाल शर्मा"
              />

              <Text style={styles.modalLabel}>चक्की / दुकान का नाम</Text>
              <TextInput
                style={styles.modalInput}
                value={chakkiName}
                onChangeText={setChakkiName}
                placeholder="उदा. श्री गणेश फ्लोर मिल"
              />

              <Text style={styles.modalLabel}>पता (गांव / शहर)</Text>
              <TextInput
                style={styles.modalInput}
                value={village}
                onChangeText={setVillage}
                placeholder="उदा. चाकसू, जयपुर"
              />

              <Text style={styles.modalLabel}>मोबाइल नंबर (लॉगिन खाता)</Text>
              <TextInput
                style={styles.modalInput}
                value={activePhone}
                onChangeText={setActivePhone}
                placeholder="10 अंकों का मोबाइल नंबर"
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text style={[styles.modalLabel, { marginTop: 12 }]}>
                दरें (Rates in ₹/kg)
              </Text>
              <View style={styles.ratesEditRow}>
                <View style={styles.rateField}>
                  <Text style={styles.rateFieldLabel}>🌾 गेहूं पिसाई</Text>
                  <TextInput
                    style={styles.rateInput}
                    value={wheatRate}
                    onChangeText={setWheatRate}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.rateField}>
                  <Text style={styles.rateFieldLabel}>💧 तेल पिसाई</Text>
                  <TextInput
                    style={styles.rateInput}
                    value={oilRate}
                    onChangeText={setOilRate}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.rateField}>
                  <Text style={styles.rateFieldLabel}>🌶️ मसाला</Text>
                  <TextInput
                    style={styles.rateInput}
                    value={masalaRate}
                    onChangeText={setMasalaRate}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>💾 बदलाव सहेजें</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsEditingModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>रद्द करें</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* 8. CHANGE PHOTO MODAL                                     */}
      {/* ========================================================= */}
      <Modal
        visible={photoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>📷 प्रोफाइल फोटो बदलें</Text>

            <View style={styles.photoActionsRow}>
              <TouchableOpacity
                style={styles.photoActionCard}
                onPress={handleTakePhoto}
              >
                <Text style={styles.photoActionEmoji}>📸</Text>
                <Text style={styles.photoActionTitle}>कैमरा खोलें</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoActionCard}
                onPress={handlePickFromGallery}
              >
                <Text style={styles.photoActionEmoji}>🖼️</Text>
                <Text style={styles.photoActionTitle}>गैलरी से चुनें</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.avatarPickerHeader}>या 1-टच में किसान अवतार चुनें:</Text>
            <View style={styles.avatarList}>
              {PRESET_AVATARS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.avatarChip}
                  onPress={() => handleSelectPreset(item.uri)}
                >
                  <Image
                    source={item.uri ? { uri: item.uri } : farmerProfileImg}
                    style={styles.avatarMiniThumb}
                  />
                  <Text style={styles.avatarChipText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setPhotoModalVisible(false)}
            >
              <Text style={styles.modalCancelBtnText}>रद्द करें</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F6FC', // Exact light blue-grey dashboard background
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // 1. Header Styles
  headerGradient: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 16,
    paddingBottom: 68, // Leaves generous room for floating card overlap
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  headerBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.2,
  },

  successBanner: {
    backgroundColor: '#EDF5EE',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginTop: 10,
    alignItems: 'center',
  },
  successText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '700',
  },

  // 2. Floating Profile Summary Card
  profileSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: -48, // Overlaps the green header!
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  avatarWrapper: {
    position: 'relative',
    width: 82,
    height: 82,
  },
  goldBorderCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2.5,
    borderColor: '#D4AF37', // Golden border
    overflow: 'hidden',
    backgroundColor: '#FEF9C3',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: '#0F4A2C', // Dark green matching header
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  cameraIcon: {
    fontSize: 12,
  },
  profileSummaryTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  ownerMainName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0A2E14',
    letterSpacing: -0.3,
  },
  shopAndBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  chakkiNameText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingVertical: 2.5,
    paddingHorizontal: 7,
  },
  crownEmoji: {
    fontSize: 10.5,
  },
  premiumText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400E',
  },
  verifiedPill: {
    backgroundColor: '#E1F3E8',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  checkCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  verifiedText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#064E3B',
  },

  // 3. Mill Owner Details Card
  ownerDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4.5,
    borderLeftColor: '#0F4A2C', // Thin dark green accent border on left edge
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerUserIcon: {
    fontSize: 18,
    color: '#64748B',
  },
  headerGearIcon: {
    fontSize: 18,
    color: '#64748B',
  },
  cardHeadingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  rowLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIcon: {
    fontSize: 14,
  },
  rowLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
  },
  rowValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
  },

  // 4. Services & Rates Card
  servicesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  serviceCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  servicePillGreen: {
    flex: 1,
    backgroundColor: '#E1F3E8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitleGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: '#064E3B',
  },
  serviceCheckmarkGreen: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
    marginVertical: 4,
  },
  servicePillYellow: {
    flex: 1,
    backgroundColor: '#FFF0D2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitleYellow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  serviceCheckmarkYellow: {
    fontSize: 16,
    fontWeight: '900',
    color: '#D97706',
    marginVertical: 4,
  },
  servicePillPink: {
    flex: 1,
    backgroundColor: '#F9E5E3',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitlePink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
  serviceCheckmarkPink: {
    fontSize: 16,
    fontWeight: '900',
    color: '#DC2626',
    marginVertical: 4,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  wheatEmoji: {
    fontSize: 14,
  },
  oilEmoji: {
    fontSize: 14,
  },
  chilliEmoji: {
    fontSize: 14,
  },
  servicePriceText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },

  // 5. Membership & Status Card
  membershipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberCrown: {
    fontSize: 15,
  },
  memberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberBold: {
    fontWeight: '900',
    color: '#0F172A',
  },
  memberRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusActive: {
    fontSize: 14,
    fontWeight: '900',
    color: '#15803D',
  },
  greenStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginLeft: 4,
  },

  // 6. Bottom Logout Button
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#BE123C', // Thin dark red outline
    borderRadius: 26,
    height: 50,
    marginHorizontal: 16,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 1,
  },
  logoutIcon: {
    fontSize: 16,
  },
  logoutText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#BE123C', // Red Hindi text
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: '88%',
  },
  modalHandle: {
    width: 44,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 5,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  ratesEditRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  rateField: {
    flex: 1,
  },
  rateFieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  rateInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#10B981',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    paddingVertical: 8,
  },
  modalSaveBtn: {
    backgroundColor: '#0F4A2C',
    borderRadius: 22,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalCancelBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoActionCard: {
    flex: 1,
    backgroundColor: '#EDF5EE',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActionEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  photoActionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#065F46',
  },
  avatarPickerHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
  },
  avatarList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  avatarChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  avatarMiniThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  avatarChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
});

export default ProfileScreen;
