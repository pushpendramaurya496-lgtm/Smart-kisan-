import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useChakki } from '../context/ChakkiContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 1. High-Definition Portrait of Anish Maurya (Photo 1: Glasses, Blue Suit)
const anishMauryaImg = require('../../assets/images/founder_anish_maurya_hd.png');

// 2. High-Definition Portrait of Ashutosh Mishra (Photo 2: Stylish Hair, Grey Blazer)
const ashutoshMishraImg = require('../../assets/images/founder_ashutosh_mishra_hd.png');

export const AboutFounderScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topSafePadding = Math.max(insets.top || 0, 36) + 4;
  const bottomSafePadding = Math.max(insets.bottom || 0, 16);

  const { language } = useChakki();
  const isHindi = language === 'hi';

  const handleBack = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* ======================================================== */}
      {/* 1. TOP ROYAL BLUE HEADER BAR                             */}
      {/* ======================================================== */}
      <LinearGradient
        colors={['#001A4D', '#002B72', '#0047AB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.topBarContainer, { paddingTop: topSafePadding }]}
      >
        <View style={styles.topBarRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.75}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Text style={styles.backArrowText}>←</Text>
          </TouchableOpacity>

          <View style={styles.topTitleCol}>
            <Text style={styles.topBarTitle}>
              {isHindi ? 'संस्थापक परिचय (Founders)' : 'About Founders'}
            </Text>
            <Text style={styles.topBarSubtitle}>
              {isHindi ? 'चक्की स्मार्ट एआई • नेतृत्व और विज़न' : 'Chakki Smart AI • Leadership & Vision'}
            </Text>
          </View>

          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>

      {/* ======================================================== */}
      {/* 2. SCROLLABLE PROFILES (BOTH FOUNDERS ONE AFTER ANOTHER) */}
      {/* ======================================================== */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomSafePadding + 40 },
        ]}
      >
        {/* ====================================================== */}
        {/* FOUNDER 1: ANISH MAURYA (GLASSES & BLUE SUIT)          */}
        {/* ====================================================== */}
        <View style={styles.founderBlock}>
          {/* Hero Gradient Card */}
          <LinearGradient
            colors={['#001F5C', '#003399', '#0052CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCardGradient}
          >
            <View style={styles.heroRow}>
              {/* Left: HD Portrait */}
              <View style={styles.portraitContainer}>
                <Image
                  source={anishMauryaImg}
                  style={styles.portraitImg}
                  resizeMode="cover"
                />
              </View>

              {/* Right: Info */}
              <View style={styles.heroInfoCol}>
                <View style={styles.aiBadgeRow}>
                  <View style={styles.aiBadgeBox}>
                    <Text style={styles.aiBadgeText}>AI</Text>
                  </View>
                </View>

                <Text style={styles.founderNameText}>Anish Maurya</Text>

                <View style={styles.founderPill}>
                  <Text style={styles.crownEmoji}>👑</Text>
                  <Text style={styles.founderPillText}>Founder</Text>
                </View>

                <View style={styles.roleRow}>
                  <Text style={styles.roleIcon}>⚙️</Text>
                  <Text style={styles.roleText}>Quality Engineer</Text>
                </View>

                <View style={styles.supernovaRow}>
                  <Text style={styles.supernovaStar}>★</Text>
                  <View>
                    <Text style={styles.supernovaTitle}>Supernova</Text>
                    <Text style={styles.supernovaSub}>Works at Supernova</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* White Card: Bio & Details for Anish Maurya */}
          <View style={styles.detailsCardWhite}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIconBox}>
                <Text style={styles.sectionIconText}>👤</Text>
              </View>
              <View>
                <Text style={styles.sectionTitle}>
                  {isHindi ? 'परिचय • Anish Maurya' : 'About Anish Maurya'}
                </Text>
                <View style={styles.blueBar} />
              </View>
            </View>

            <Text style={styles.bioText}>
              <Text style={styles.boldText}>Anish Maurya</Text> is an Engineer and{' '}
              <Text style={styles.highlightText}>Quality Engineer</Text>, passionate about
              technology, innovation, and digital solutions. He is a key Founder of this{' '}
              <Text style={styles.highlightText}>Aata Chakki</Text> platform, and also works at{' '}
              <Text style={styles.boldText}>Supernova</Text>, where he contributes to building
              innovative solutions with the power of{' '}
              <Text style={styles.highlightText}>Technology and AI</Text>.
            </Text>

            {/* 6 Grid items */}
            <View style={styles.gridContainer}>
              <View style={styles.gridCard}>
                <Text style={styles.gridIcon}>👤</Text>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Name</Text>
                  <Text style={styles.gridVal}>Anish Maurya</Text>
                </View>
              </View>

              <View style={styles.gridCard}>
                <Text style={styles.gridIcon}>⭐</Text>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Designation</Text>
                  <Text style={styles.gridVal}>Founder</Text>
                </View>
              </View>

              <View style={styles.gridCard}>
                <Text style={styles.gridIcon}>🎓</Text>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Profession</Text>
                  <Text style={styles.gridVal}>Engineer</Text>
                </View>
              </View>

              <View style={styles.gridCard}>
                <Text style={styles.gridIcon}>📈</Text>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Specialization</Text>
                  <Text style={styles.gridVal}>Quality Engineering</Text>
                </View>
              </View>

              <View style={styles.gridCard}>
                <Text style={styles.gridIcon}>🏢</Text>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Works At</Text>
                  <Text style={styles.gridVal}>Supernova</Text>
                </View>
              </View>

              <View style={styles.gridCard}>
                <Text style={styles.gridIcon}>🔲</Text>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Focus</Text>
                  <Text style={styles.gridVal}>Technology & AI</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Divider Between Founders */}
        <View style={styles.founderDividerRow}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerBadge}>
            <Text style={styles.dividerBadgeText}>✦ CO-LEADERSHIP ✦</Text>
          </View>
          <View style={styles.dividerLine} />
        </View>

        {/* ====================================================== */}
        {/* FOUNDER 2: ASHUTOSH MISHRA (STYLISH HAIR & GREY BLAZER) */}
        {/* ====================================================== */}
        <View style={styles.founderBlock}>
          {/* Hero Gradient Card */}
          <LinearGradient
            colors={['#0B2559', '#083E9E', '#005CE6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCardGradient}
          >
            <View style={styles.heroRow}>
              {/* Left: HD Portrait */}
              <View style={styles.portraitContainer}>
                <Image
                  source={ashutoshMishraImg}
                  style={styles.portraitImg}
                  resizeMode="cover"
                />
              </View>

              {/* Right: Info */}
              <View style={styles.heroInfoCol}>
                <View style={styles.aiBadgeRow}>
                  <View style={styles.aiBadgeBox}>
                    <Text style={styles.aiBadgeText}>AI</Text>
                  </View>
                </View>

                <Text style={styles.founderNameText}>Ashutosh Mishra</Text>

                <View style={styles.founderPill}>
                  <Text style={styles.crownEmoji}>👑</Text>
                  <Text style={styles.founderPillText}>Founder</Text>
                </View>

                <View style={styles.roleRow}>
                  <Text style={styles.roleIcon}>⚙️</Text>
                  <Text style={styles.roleText}>Engineer | Data Analyst</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* White Card: Bio & Details for Ashutosh Mishra */}
          <View style={styles.detailsCardWhite}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIconBox}>
                <Text style={styles.sectionIconText}>👤</Text>
              </View>
              <View>
                <Text style={styles.sectionTitle}>
                  {isHindi ? 'परिचय • Ashutosh Mishra' : 'About Ashutosh Mishra'}
                </Text>
                <View style={styles.blueBar} />
              </View>
            </View>

            <Text style={styles.bioText}>
              <Text style={styles.boldText}>Ashutosh Mishra</Text> is an Engineer and{' '}
              <Text style={styles.highlightText}>Data Analyst</Text>, passionate about
              technology, innovation, and digital solutions. He is the Founder of this{' '}
              <Text style={styles.highlightText}>Aata Chakki</Text> platform, dedicated to building
              innovative solutions with the power of{' '}
              <Text style={styles.highlightText}>Technology and AI</Text>.
            </Text>

            {/* 6 Grid items */}
            <View style={styles.gridContainer}>
              <View style={styles.gridCard}>
                <Text style={styles.gridIcon}>👤</Text>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Name</Text>
                  <Text style={styles.gridVal}>Ashutosh Mishra</Text>
                </View>
              </View>

              <View style={styles.gridCard}>
                <Text style={styles.gridIcon}>⭐</Text>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Designation</Text>
                  <Text style={styles.gridVal}>Founder</Text>
                </View>
              </View>

              <View style={styles.gridCard}>
                <Text style={styles.gridIcon}>🎓</Text>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Profession</Text>
                  <Text style={styles.gridVal}>Engineer</Text>
                </View>
              </View>

              <View style={styles.gridCard}>
                <Text style={styles.gridIcon}>📈</Text>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Specialization</Text>
                  <Text style={styles.gridVal}>Data Analytics</Text>
                </View>
              </View>

              <View style={styles.gridCard}>
                <Text style={styles.gridIcon}>🏢</Text>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Platform</Text>
                  <Text style={styles.gridVal}>Chakki Smart AI</Text>
                </View>
              </View>

              <View style={styles.gridCard}>
                <Text style={styles.gridIcon}>🔲</Text>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Focus</Text>
                  <Text style={styles.gridVal}>Technology & AI</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ====================================================== */}
        {/* SHARED VISION CARD                                     */}
        {/* ====================================================== */}
        <View style={styles.visionCard}>
          <View style={styles.visionIconBox}>
            <Text style={styles.visionBulbEmoji}>💡</Text>
          </View>

          <View style={styles.visionVerticalLine} />

          <View style={styles.visionTextCol}>
            <Text style={styles.visionHeading}>
              {isHindi ? 'हमारा दृष्टिकोण (Our Vision)' : 'Our Shared Vision'}
            </Text>
            <Text style={styles.visionBodyText}>
              To empower traditional Aata Chakki businesses with the power of{' '}
              <Text style={{ fontWeight: '800', color: '#0047AB' }}>Technology and AI</Text>, and
              to build a smarter, more efficient and transparent future.
            </Text>
          </View>
        </View>

        {/* Decorative Bottom Wave */}
        <View style={styles.bottomWaveContainer}>
          <LinearGradient
            colors={['#0052CC', '#003399', '#001A4D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomWaveBar}
          />
        </View>
      </ScrollView>
    </View>
  );
};

// ==========================================
// STYLESHEET
// ==========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* Top Bar */
  topBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#002B66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    zIndex: 10,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrowText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  topTitleCol: {
    alignItems: 'center',
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  topBarSubtitle: {
    color: '#BAE6FD',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  /* Scroll Content */
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },

  /* Founder Block */
  founderBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    marginBottom: 16,
  },

  /* Hero Gradient */
  heroCardGradient: {
    padding: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portraitContainer: {
    width: 120,
    height: 145,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#38BDF8',
    overflow: 'hidden',
    backgroundColor: '#001A4D',
    elevation: 4,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  portraitImg: {
    width: '100%',
    height: '100%',
  },

  heroInfoCol: {
    flex: 1,
    paddingLeft: 14,
  },
  aiBadgeRow: {
    alignItems: 'flex-end',
    marginBottom: 2,
  },
  aiBadgeBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#0284C7',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  founderNameText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  founderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0052CC',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
    marginTop: 4,
    marginBottom: 4,
    gap: 4,
  },
  crownEmoji: {
    fontSize: 11,
  },
  founderPillText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11.5,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  roleIcon: {
    fontSize: 12,
  },
  roleText: {
    color: '#E0F2FE',
    fontSize: 11.5,
    fontWeight: '700',
  },
  supernovaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  supernovaStar: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  supernovaTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  supernovaSub: {
    color: '#BAE6FD',
    fontSize: 9.5,
    fontWeight: '500',
  },

  /* White Card Body */
  detailsCardWhite: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0052CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconText: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  blueBar: {
    width: 22,
    height: 2.2,
    backgroundColor: '#0052CC',
    borderRadius: 2,
    marginTop: 2,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#334155',
    marginTop: 4,
    textAlign: 'justify',
  },
  boldText: {
    fontWeight: '800',
    color: '#0F172A',
  },
  highlightText: {
    fontWeight: '800',
    color: '#0052CC',
  },

  /* Grid Items */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginTop: 12,
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: '#F0F6FF',
    borderWidth: 1,
    borderColor: '#D0E2FF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  gridIcon: {
    fontSize: 13,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 1,
  },
  gridVal: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '800',
  },

  /* Divider Between Founders */
  founderDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    marginBottom: 14,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#CBD5E1',
  },
  dividerBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  dividerBadgeText: {
    color: '#3730A3',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  /* Vision Card */
  visionCard: {
    backgroundColor: '#F0F7FF',
    borderWidth: 1.2,
    borderColor: '#BAE6FD',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  visionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    elevation: 2,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  visionBulbEmoji: {
    fontSize: 22,
  },
  visionVerticalLine: {
    width: 3,
    backgroundColor: '#0066FF',
    borderRadius: 1.5,
    alignSelf: 'stretch',
    marginVertical: 2,
  },
  visionTextCol: {
    flex: 1,
  },
  visionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0047AB',
    marginBottom: 4,
  },
  visionBodyText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#334155',
    fontWeight: '500',
  },

  /* Bottom Wave Bar */
  bottomWaveContainer: {
    marginTop: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  bottomWaveBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
  },
});

export default AboutFounderScreen;
