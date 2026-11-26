import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';

const chakkiLottieAnim = require('../../assets/animations/aata_chakki_scanned_hd_1080p.json');
const deliveryVideoAnim = require('../../assets/animations/chakki_delivery_video_hd.json');

const SCROLL_INTERVAL = 5000; // Auto-scroll every 5 seconds per user specification

const windowWidth = Dimensions.get('window').width;
const defaultBannerWidth = Math.round(Math.max(280, windowWidth - 32));
const defaultBannerHeight = Math.round((defaultBannerWidth * 9) / 16);

export const ChakkiPromoBanner = ({ onPressRate, onPressDelivery }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const [bannerDim, setBannerDim] = useState({
    width: defaultBannerWidth,
    height: defaultBannerHeight,
  });

  const slideAnim = useRef(new Animated.Value(0)).current;

  // Manual navigation to specific slide with smooth easing
  const goToSlide = (slideIndex) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setActiveSlide(slideIndex);
    Animated.timing(slideAnim, {
      toValue: slideIndex,
      duration: 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // Auto-scroll every 5 seconds (5000ms)
  useEffect(() => {
    const scrollTimer = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % 2;
        Animated.timing(slideAnim, {
          toValue: next,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
        return next;
      });
    }, SCROLL_INTERVAL);

    return () => clearInterval(scrollTimer);
  }, [bannerDim.width]);

  const handleBannerLayout = (e) => {
    const rawW = e.nativeEvent.layout.width;
    const rawH = e.nativeEvent.layout.height;
    if (rawH > 0) {
      const h = Math.round(rawH);
      const w = Math.round(rawW || (h * 16) / 9);
      if (Math.abs(h - bannerDim.height) > 2) {
        setBannerDim({ width: w, height: h });
      }
    }
  };

  const handlePressSlide0 = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    if (onPressRate) {
      onPressRate();
    }
  };

  const handlePressSlide1 = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    if (onPressDelivery) {
      onPressDelivery();
    } else if (onPressRate) {
      onPressRate();
    }
  };

  const bannerW = bannerDim.width;
  const bannerH = bannerDim.height;

  return (
    <View
      style={styles.outerContainer}
      onLayout={handleBannerLayout}
    >
      <Animated.View
        style={[
          styles.slidesTrack,
          {
            width: bannerW * 2,
            height: bannerH,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -bannerW],
                }),
              },
            ],
          },
        ]}
      >
        {/* ========================================================= */}
        {/* SLIDE 0: ताज़ा पिसाई (100% Seamless Merged Banner)         */}
        {/* ========================================================= */}
        <TouchableOpacity
          style={[styles.slideContainer, { width: bannerW, height: bannerH, backgroundColor: '#F8F8E9' }]}
          activeOpacity={0.92}
          onPress={handlePressSlide0}
        >
          {/* Right Side: High-Detail Scanned Lottie Animation (Enlarged Full Cover ~235x235) */}
          <View style={[styles.lottieRightContainer, { width: Math.round(bannerW * 0.58), height: bannerH }]}>
            <LottieView
              source={chakkiLottieAnim}
              autoPlay
              loop
              style={styles.lottieAnimation}
              resizeMode="contain"
            />
          </View>

          {/* Left Side: 100% Vector Ultra-HD Native Hindi Text */}
          <View style={styles.leftContentOverlay}>
            <View style={styles.greenBadge}>
              <Text style={styles.greenBadgeText}>ताज़ा पिसाई</Text>
            </View>

            <Text style={styles.mainHeading} numberOfLines={2}>
              शुद्ध और ताज़ा आटा,{'\n'}सीधे आपकी चक्की से!
            </Text>

            <Text style={styles.subtitleText} numberOfLines={2}>
              गेहूँ, बेसन और मसालों की बेहतरीन पिसाई
            </Text>

            <TouchableOpacity
              style={styles.rateButton}
              activeOpacity={0.8}
              onPress={handlePressSlide0}
            >
              <Text style={styles.rateButtonText}>रेट देखें →</Text>
            </TouchableOpacity>

            <Text style={styles.footerNoteText}>
              आपकी चक्की, आपका भरोसा
            </Text>
          </View>
        </TouchableOpacity>

        {/* ========================================================= */}
        {/* SLIDE 1: सुपर फास्ट डिलीवरी (100% Seamless Merged Banner) */}
        {/* ========================================================= */}
        <TouchableOpacity
          style={[styles.slideContainer, { width: bannerW, height: bannerH, backgroundColor: '#D4ECF4' }]}
          activeOpacity={0.92}
          onPress={handlePressSlide1}
        >
          {/* Continuous Unified Canvas Background (Sky + Horizon + Road) */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Sky Background */}
            <View style={{ flex: 1, backgroundColor: '#D4ECF4' }} />
            {/* Horizon Transition Strip */}
            <View style={{ height: Math.round(bannerH * 0.14), backgroundColor: '#C3DDE5' }} />
            {/* Continuous Road Surface across full bottom of card */}
            <View style={{ height: Math.round(bannerH * 0.23), backgroundColor: '#98B8C4' }} />
          </View>

          {/* Right Side: Seamless Merged Delivery Truck Animation (58% width, 100% height) */}
          <View style={styles.deliveryVideoContainer} pointerEvents="none">
            <LottieView
              source={deliveryVideoAnim}
              autoPlay={true}
              loop={true}
              style={styles.deliveryVideo}
              resizeMode="contain"
            />
          </View>

          {/* Left Side: Clearly readable Hindi Text (clean without overlapping) */}
          <View style={styles.leftContentOverlay}>
            <View style={styles.blueBadge}>
              <Text style={styles.blueBadgeText}>एक्सप्रेस 10-20 मिनट</Text>
            </View>

            <Text style={[styles.mainHeading, styles.blueHeading]} numberOfLines={2}>
              सुपर फास्ट{'\n'}आटा डिलीवरी!
            </Text>

            <Text style={[styles.subtitleText, styles.blueSubtitle]} numberOfLines={2}>
              दरवाजे तक त्वरित प्रेषण की गारंटी
            </Text>

            <TouchableOpacity
              style={styles.orderButton}
              activeOpacity={0.8}
              onPress={handlePressSlide1}
            >
              <Text style={styles.orderButtonText}>अभी ऑर्डर करें →</Text>
            </TouchableOpacity>

            <Text style={[styles.footerNoteText, styles.blueFooter]}>
              आपकी चक्की, आपका भरोसा
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Slide Pagination Dots (Interactive + Auto 5s Sync) */}
      <View style={styles.dotsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => goToSlide(0)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.dot, activeSlide === 0 ? styles.activeDotGreen : styles.inactiveDot]}
        />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => goToSlide(1)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.dot, activeSlide === 1 ? styles.activeDotBlue : styles.inactiveDot]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 24, // 24-28px rounded corners
    borderWidth: 1.2,
    borderColor: '#35A66A40',
    overflow: 'hidden',
    marginVertical: 12,
    position: 'relative',
    elevation: 3,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  slidesTrack: {
    flexDirection: 'row',
  },
  slideContainer: {
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  lottieRightContainer: {
    position: 'absolute',
    right: -8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  lottieAnimation: {
    width: 235,
    height: 235,
  },

  /* Slide 1 Delivery Truck HD Video (Right side: position absolute, right 0, bottom 0, width 58%, height 100%) */
  deliveryVideoContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '58%',
    height: '100%',
    overflow: 'hidden',
  },
  deliveryVideo: {
    width: '100%',
    height: '100%',
  },

  /* Left Side Overlay (~45% width, kept clean without overlapping right video) */
  leftContentOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '45%',
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 12,
    justifyContent: 'space-between',
    zIndex: 10,
  },

  /* Badges */
  greenBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#35A66A',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
  },
  greenBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  blueBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
  },
  blueBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  /* Headings */
  mainHeading: {
    fontSize: 15,
    fontWeight: '900',
    color: '#171717',
    lineHeight: 20,
    marginTop: 2,
  },
  blueHeading: {
    color: '#0F2942',
  },

  /* Subtitles */
  subtitleText: {
    fontSize: 10.5,
    color: '#777777',
    fontWeight: '600',
  },
  blueSubtitle: {
    color: '#64748B',
  },

  /* Action Buttons */
  rateButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#35A66A',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 5.5,
    elevation: 2,
    shadowColor: '#35A66A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  rateButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  orderButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 5.5,
    elevation: 2,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  orderButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Footers */
  footerNoteText: {
    fontSize: 9.5,
    color: '#888888',
    fontWeight: '600',
    marginTop: 1,
  },
  blueFooter: {
    color: '#94A3B8',
  },

  /* Pagination Dots */
  dotsRow: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    zIndex: 20,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#00000025',
  },
  activeDotGreen: {
    width: 16,
    backgroundColor: '#35A66A',
  },
  activeDotBlue: {
    width: 16,
    backgroundColor: '#2563EB',
  },
});
