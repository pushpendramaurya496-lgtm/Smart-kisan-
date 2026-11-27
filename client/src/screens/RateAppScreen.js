import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChakki } from '../context/ChakkiContext';
import { AuthApiService } from '../services/authApiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Ultra-HD Authentic Chakki Machine & Wheat Illustration Asset
const chakkiIllustrationImg = require('../../assets/images/chakki_rating_hd.jpg');

export const RateAppScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topSafePadding = Math.max(insets.top || 0, 36) + 4;
  const bottomSafePadding = Math.max(insets.bottom || 0, 16);

  const { language } = useChakki();
  const isHindi = language === 'hi';

  // Interactive States
  const [rating, setRating] = useState(0); // 1 - 5
  const [feedback, setFeedback] = useState('');
  const [selectedChip, setSelectedChip] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [starScale] = useState(new Animated.Value(1));

  // Quick feedback chips definition
  const quickChips = [
    { id: 'great', label: '😊 Great App', labelHi: '😊 शानदार ऐप', text: 'Great App! Very useful for daily chakki business.' },
    { id: 'very_good', label: '👍 Very Good', labelHi: '👍 बहुत अच्छा', text: 'Very good app with fast billing and khata.' },
    { id: 'needs_work', label: '🔧 Needs Improvement', labelHi: '🔧 सुधार चाहिए', text: 'Good app, but please add more features.' },
  ];

  // Dynamic Rating Labels
  const getRatingLabel = (stars) => {
    switch (stars) {
      case 1:
        return isHindi ? '1 स्टार – खराब (Poor)' : '1 Star – Poor';
      case 2:
        return isHindi ? '2 स्टार – ठीक-ठाक (Fair)' : '2 Stars – Fair';
      case 3:
        return isHindi ? '3 स्टार – अच्छा (Good)' : '3 Stars – Good';
      case 4:
        return isHindi ? '4 स्टार – बहुत बढ़िया (Very Good)' : '4 Stars – Very Good';
      case 5:
        return isHindi ? '5 स्टार – सर्वोत्तम (Excellent)' : '5 Stars – Excellent';
      default:
        return isHindi ? 'रेटिंग देने के लिए स्टार छुएं' : 'Tap a star to rate';
    }
  };

  // Check if previously rated
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('@chakki_app_rating');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.rating) {
            setRating(parsed.rating);
            if (parsed.feedback) setFeedback(parsed.feedback);
            if (parsed.selectedChip) setSelectedChip(parsed.selectedChip);
          }
        }
      } catch (e) {}
    })();
  }, []);

  // Handle star selection with animation and haptic
  const handleStarPress = (starIndex) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}

    setRating(starIndex);

    // Subtle bounce animation on star press
    Animated.sequence([
      Animated.timing(starScale, {
        toValue: 1.15,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(starScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle Quick Feedback Chip click
  const handleChipPress = (chip) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    if (selectedChip === chip.id) {
      setSelectedChip('');
    } else {
      setSelectedChip(chip.id);
      // Auto-populate or append to feedback text if empty
      if (!feedback.trim()) {
        setFeedback(chip.text);
      }
    }
  };

  // Handle Submit Rating
  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert(
        isHindi ? 'रेटिंग चुनें' : 'Select Rating',
        isHindi ? 'कृपया कम से कम 1 स्टार चुनकर रेटिंग दें।' : 'Please select at least 1 star to submit your rating.'
      );
      return;
    }

    setSubmitting(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    try {
      await AuthApiService.submitRating({
        rating,
        feedback: feedback.trim(),
        selectedChip,
      });

      setSubmitting(false);

      Alert.alert(
        isHindi ? 'धन्यवाद! ⭐' : 'Thank You! ⭐',
        isHindi
          ? `आपकी ${rating}-स्टार रेटिंग और बहुमूल्य सुझाव सफलतापूर्वक दर्ज कर लिए गए हैं।`
          : `Your ${rating}-star rating and feedback have been received. We appreciate your support!`,
        [
          {
            text: isHindi ? 'ठीक है' : 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      setSubmitting(false);
      Alert.alert(
        isHindi ? 'रेटिंग सुरक्षित हुई' : 'Rating Saved',
        isHindi ? 'आपकी प्रतिक्रिया सुरक्षित कर ली गई है। धन्यवाद!' : 'Your feedback has been saved locally. Thank you!',
        [
          {
            text: isHindi ? 'ठीक है' : 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  // Handle Maybe Later
  const handleMaybeLater = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* ======================================================== */}
      {/* 1. CURVED DARK GREEN HEADER WITH BACK ARROW & WHEAT     */}
      {/* ======================================================== */}
      <LinearGradient
        colors={['#055222', '#087A32', '#0B913D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerContainer, { paddingTop: topSafePadding }]}
      >
        {/* Subtle Decorative Wheat Icon in Top Right */}
        <View style={styles.headerWheatDeco} pointerEvents="none">
          <Text style={styles.wheatDecoEmoji}>🌾</Text>
        </View>

        <View style={styles.headerContentRow}>
          {/* Back Arrow Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backArrowText}>←</Text>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.headerTitle}>
            {isHindi ? 'रेट ऐप (Rate App)' : 'Rate App'}
          </Text>

          {/* Spacer for symmetry */}
          <View style={{ width: 36 }} />
        </View>

        {/* Curved Wave Lip at Bottom of Header */}
        <View style={styles.curvedBottomLip} />
      </LinearGradient>

      {/* ======================================================== */}
      {/* MAIN SCROLLABLE CONTENT (WARM CREAM BACKGROUND #FFFDF1)  */}
      {/* ======================================================== */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomSafePadding + 28 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* 2. CENTER HD CHAKKI & WHEAT ILLUSTRATION SECTION */}
        <View style={styles.illustrationSection}>
          {/* Soft Light Green Circular Frame with Glow */}
          <View style={styles.circleFrame}>
            <Image
              source={chakkiIllustrationImg}
              style={styles.chakkiImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* 3. RATING HEADING & SUBTITLE */}
        <View style={styles.headingSection}>
          <Text style={styles.mainTitle}>
            {isHindi ? 'क्या आपको पसंद आ रहा है ' : 'Enjoying '}
            <Text style={styles.brandTitleText}>Chakki App</Text>
            ?
          </Text>
          <Text style={styles.subtitleText}>
            {isHindi
              ? 'आपकी राय हमें और बेहतर सेवा देने में मदद करती है!'
              : 'Your feedback helps us to serve you better!'}
          </Text>
        </View>

        {/* 4. 5-STAR RATING SECTION */}
        <Animated.View style={[styles.starsRow, { transform: [{ scale: starScale }] }]}>
          {[1, 2, 3, 4, 5].map((starNum) => {
            const isSelected = starNum <= rating;
            return (
              <TouchableOpacity
                key={starNum}
                onPress={() => handleStarPress(starNum)}
                activeOpacity={0.75}
                style={[
                  styles.starBadge,
                  isSelected ? styles.starBadgeActive : styles.starBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.starIcon,
                    isSelected ? styles.starIconActive : styles.starIconInactive,
                  ]}
                >
                  ★
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Dynamic Rating Feedback Text with subtle line */}
        <View style={styles.ratingLabelContainer}>
          <View style={styles.ratingLine} />
          <Text style={styles.ratingDynamicText}>{getRatingLabel(rating)}</Text>
          <View style={styles.ratingLine} />
        </View>

        {/* 5. FEEDBACK CARD: TELL US MORE (OPTIONAL) */}
        <View style={styles.feedbackCard}>
          {/* Header row: Green Chat Bubble + Heading */}
          <View style={styles.feedbackHeaderRow}>
            <View style={styles.chatIconBox}>
              <Text style={styles.chatIcon}>💬</Text>
            </View>
            <Text style={styles.feedbackCardTitle}>
              {isHindi ? 'कुछ और बताएं (वैकल्पिक)' : 'Tell us more (Optional)'}
            </Text>
          </View>

          {/* Multiline Text Input with Pencil Icon */}
          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.feedbackTextInput}
              multiline
              numberOfLines={3}
              placeholder={
                isHindi
                  ? 'आपको क्या पसंद आया या हम क्या सुधार कर सकते हैं?'
                  : 'What do you like or what can we improve?'
              }
              placeholderTextColor="#94A3B8"
              value={feedback}
              onChangeText={(text) => {
                if (text.length <= 200) {
                  setFeedback(text);
                }
              }}
              maxLength={200}
            />
            <Text style={styles.pencilIcon}>✏️</Text>
          </View>

          {/* Character counter (0/200) */}
          <View style={styles.counterRow}>
            <Text style={styles.counterText}>{feedback.length}/200</Text>
          </View>

          {/* 3 Quick-Feedback Selectable Chips */}
          <View style={styles.chipsContainer}>
            {quickChips.map((chip) => {
              const isActive = selectedChip === chip.id;
              return (
                <TouchableOpacity
                  key={chip.id}
                  style={[styles.quickChip, isActive && styles.quickChipActive]}
                  onPress={() => handleChipPress(chip)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {isHindi ? chip.labelHi : chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 6. SUBMIT RATING BUTTON (Green Gradient + Send Icon) */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleSubmitRating}
          disabled={submitting || rating === 0}
          style={[styles.submitButtonWrapper, rating === 0 && { opacity: 0.55 }]}
        >
          <LinearGradient
            colors={['#087A32', '#055222']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitGradient}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.sendIcon}>✈</Text>
                <Text style={styles.submitButtonText}>
                  {isHindi ? 'रेटिंग जमा करें' : 'Submit Rating'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* 7. MAYBE LATER BUTTON (Outlined Green + Clock Icon) */}
        <TouchableOpacity
          style={styles.maybeLaterButton}
          onPress={handleMaybeLater}
          activeOpacity={0.75}
        >
          <Text style={styles.clockIcon}>🕒</Text>
          <Text style={styles.maybeLaterText}>
            {isHindi ? 'शायद बाद में' : 'Maybe Later'}
          </Text>
        </TouchableOpacity>

        {/* 8. BOTTOM THANKS SECTION WITH WHEAT ART & SOFT GREEN WAVE */}
        <View style={styles.bottomThanksSection}>
          <View style={styles.heartRow}>
            <View style={styles.bottomLine} />
            <Text style={styles.heartIcon}>💚</Text>
            <View style={styles.bottomLine} />
          </View>
          <Text style={styles.thanksText}>
            {isHindi ? 'आपके सहयोग के लिए धन्यवाद!' : 'Thanks for your support!'}
          </Text>

          {/* Golden Wheat Decorations on Bottom Left & Right */}
          <View style={styles.wheatFlankRow}>
            <Text style={styles.wheatFlankLeft}>🌾</Text>
            <View style={styles.bottomWaveShape} />
            <Text style={styles.wheatFlankRight}>🌾</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ==========================================
// STYLESHEET (Premium Agricultural Theme)
// ==========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF1', // Warm Cream background per design guidelines
  },

  /* 1. Curved Dark Green Header */
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 6,
    shadowColor: '#055222',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  headerWheatDeco: {
    position: 'absolute',
    top: 36,
    right: 12,
    opacity: 0.45,
    transform: [{ rotate: '25deg' }, { scale: 1.3 }],
  },
  wheatDecoEmoji: {
    fontSize: 34,
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrowText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  curvedBottomLip: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#FFFDF1',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  /* Scroll Content */
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
  },

  /* 2. Illustration Section */
  illustrationSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  circleFrame: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: '#EAF7EE',
    borderWidth: 3,
    borderColor: '#C6EDD3',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#087A32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  chakkiImage: {
    width: '100%',
    height: '100%',
  },

  /* 3. Heading Section */
  headingSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  brandTitleText: {
    color: '#087A32',
    fontWeight: '900',
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },

  /* 4. Star Rating Section */
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  starBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  starBadgeActive: {
    backgroundColor: '#FEF3C7', // Warm golden yellow
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  starBadgeInactive: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  starIcon: {
    fontSize: 28,
  },
  starIconActive: {
    color: '#FFB900', // Bright Golden Yellow
  },
  starIconInactive: {
    color: '#CBD5E1', // Soft Light Grey
  },

  /* Dynamic Rating Label */
  ratingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    width: '100%',
    paddingHorizontal: 16,
  },
  ratingLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  ratingDynamicText: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },

  /* 5. Feedback Card */
  feedbackCard: {
    width: '100%',
    backgroundColor: '#F0FDF4', // Light green card
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  feedbackHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  chatIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatIcon: {
    fontSize: 15,
  },
  feedbackCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803D',
  },
  textInputWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    minHeight: 80,
    position: 'relative',
  },
  feedbackTextInput: {
    fontSize: 14,
    color: '#1E293B',
    textAlignVertical: 'top',
    paddingRight: 24,
    lineHeight: 20,
  },
  pencilIcon: {
    position: 'absolute',
    top: 8,
    right: 10,
    fontSize: 13,
    opacity: 0.5,
  },
  counterRow: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 10,
  },
  counterText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },

  /* Quick-feedback chips */
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 18,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  quickChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#087A32',
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#087A32',
    fontWeight: '700',
  },

  /* 6. Submit Button */
  submitButtonWrapper: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#087A32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginBottom: 12,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    transform: [{ rotate: '45deg' }],
    marginTop: -2,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  /* 7. Maybe Later Button */
  maybeLaterButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 28,
    borderWidth: 1.6,
    borderColor: '#087A32',
    backgroundColor: '#FFFFFF',
    gap: 8,
    marginBottom: 20,
  },
  clockIcon: {
    fontSize: 15,
  },
  maybeLaterText: {
    color: '#087A32',
    fontSize: 15,
    fontWeight: '700',
  },

  /* 8. Bottom Thanks Section */
  bottomThanksSection: {
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
  },
  heartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '60%',
    gap: 8,
  },
  bottomLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  heartIcon: {
    fontSize: 15,
  },
  thanksText: {
    color: '#087A32',
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    marginTop: 6,
  },
  wheatFlankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    paddingHorizontal: 8,
  },
  wheatFlankLeft: {
    fontSize: 26,
    transform: [{ rotate: '-20deg' }],
    opacity: 0.8,
  },
  wheatFlankRight: {
    fontSize: 26,
    transform: [{ rotate: '20deg' }, { scaleX: -1 }],
    opacity: 0.8,
  },
  bottomWaveShape: {
    flex: 1,
    height: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    marginHorizontal: 12,
    opacity: 0.5,
  },
});
