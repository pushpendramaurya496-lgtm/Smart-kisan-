const bcrypt = require('bcryptjs');
const User = require('./auth.model');
const { generateToken } = require('../../services/jwt.service');

class AuthService {
  /**
   * 1. Send OTP to Mobile Number
   */
  static async sendOTP(phone) {
    // Generate real secure 4-digit random OTP (or 1234 for test phone 9876543210)
    const isTestPhone = phone === '9876543210';
    const rawOtp = isTestPhone ? '1234' : Math.floor(1000 + Math.random() * 9000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(rawOtp, salt);

    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Find or create user record
    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      user = new User({
        phone,
        isPhoneVerified: false,
        isProfileCompleted: false,
      });
      isNewUser = true;
    }

    user.otp = {
      code: hashedOtp,
      expiresAt: otpExpiry,
      attempts: 0,
    };

    await user.save();

    console.log(`\n📲 [OTP GENERATED] Phone: ${phone} | OTP: ${rawOtp} (Valid for 5 mins)\n`);

    // Send real OTP SMS via Fast2SMS
    try {
      const SmsService = require('../../services/sms.service');
      const purpose = isNewUser ? 'New Signup' : 'Login / PIN Reset';
      SmsService.sendOTPSMS({
        phone,
        otp: rawOtp,
        purpose,
      }).catch((smsErr) => {
        console.warn('[AuthService] Fast2SMS sendOTPSMS warning:', smsErr.message);
      });
    } catch (err) {
      console.warn('[AuthService] SmsService load error:', err.message);
    }

    return {
      phone: user.phone,
      isNewUser,
      isProfileCompleted: user.isProfileCompleted,
      devOtp: isTestPhone ? rawOtp : undefined,
    };
  }

  /**
   * 2. Verify OTP
   */
  static async verifyOTP(phone, otp) {
    const user = await User.findOne({ phone }).select('+otp.code +otp.expiresAt +otp.attempts');

    if (!user || !user.otp || !user.otp.code) {
      throw new Error('कृपया पहले OTP मंगवाएं');
    }

    // Check attempts limit
    if (user.otp.attempts >= 3) {
      throw new Error('गलत OTP के अधिकतम प्रयास पार हो चुके हैं। कृपया 5 मिनट बाद नया OTP मंगवाएं');
    }

    // Check expiry
    if (new Date() > new Date(user.otp.expiresAt)) {
      throw new Error('OTP की समय सीमा समाप्त हो चुकी है। नया OTP मंगवाएं');
    }

    // Match OTP
    const isMatch = await bcrypt.compare(otp, user.otp.code);
    if (!isMatch) {
      user.otp.attempts += 1;
      await user.save();
      throw new Error(`गलत OTP दर्ज किया गया है। (${3 - user.otp.attempts} प्रयास शेष)`);
    }

    // Mark as verified & clear OTP
    user.isPhoneVerified = true;
    user.otp = undefined;
    await user.save();

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      phone: user.phone,
      role: user.role,
      isProfileCompleted: user.isProfileCompleted,
    });

    return {
      user: {
        id: user._id,
        phone: user.phone,
        isPhoneVerified: user.isPhoneVerified,
        isProfileCompleted: user.isProfileCompleted,
        role: user.role,
        profile: user.profile,
      },
      token,
      isNewUser: !user.isProfileCompleted,
    };
  }

  /**
   * 3. Complete Owner Profile
   */
  static async completeProfile(userId, data) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('उपयोगकर्ता नहीं मिला');
    }

    const { ownerName, chakkiName, village, mpin, servicesOffered, defaultRates, profileImage } = data;

    user.profile.ownerName = ownerName;
    user.profile.chakkiName = chakkiName;
    if (village !== undefined) user.profile.village = village;
    if (profileImage !== undefined) user.profile.profileImage = profileImage;

    if (mpin) {
      const salt = await bcrypt.genSalt(10);
      user.mpin = await bcrypt.hash(mpin, salt);
    }

    if (servicesOffered && servicesOffered.length > 0) {
      user.servicesOffered = servicesOffered;
    }

    if (defaultRates) {
      user.defaultRates = { ...user.defaultRates, ...defaultRates };
    }

    user.isProfileCompleted = true;
    await user.save();

    // Fresh token with isProfileCompleted = true
    const token = generateToken({
      id: user._id,
      phone: user.phone,
      role: user.role,
      isProfileCompleted: true,
    });

    return {
      user: {
        id: user._id,
        phone: user.phone,
        role: user.role,
        isProfileCompleted: user.isProfileCompleted,
        profile: user.profile,
        servicesOffered: user.servicesOffered,
        defaultRates: user.defaultRates,
      },
      token,
    };
  }

  /**
   * 4. Login With 4-Digit MPIN
   */
  static async loginWithPIN(phone, mpin) {
    const user = await User.findOne({ phone }).select('+mpin');
    if (!user) {
      throw new Error('उपयोगकर्ता पंजीकृत नहीं है। कृपया पहले मोबाइल नंबर से लॉगिन करें');
    }

    if (!user.mpin) {
      // Auto-set the MPIN to whatever 4-digit PIN the owner entered so they can log in seamlessly
      const salt = await bcrypt.genSalt(10);
      user.mpin = await bcrypt.hash(mpin, salt);
      await user.save();
    } else {
      const isMatch = await bcrypt.compare(mpin, user.mpin);
      if (!isMatch) {
        throw new Error('गलत सुरक्षा PIN दर्ज किया गया है। कृपया सही PIN दर्ज करें');
      }
    }

    const token = generateToken({
      id: user._id,
      phone: user.phone,
      role: user.role,
      isProfileCompleted: user.isProfileCompleted,
    });

    return {
      user: {
        id: user._id,
        phone: user.phone,
        role: user.role,
        isProfileCompleted: user.isProfileCompleted,
        profile: user.profile,
        servicesOffered: user.servicesOffered,
      },
      token,
    };
  }

  /**
   * 5. Reset / Forget PIN with OTP Verification
   */
  static async resetPIN(phone, otp, newMpin) {
    const user = await User.findOne({ phone }).select('+otp.code +otp.expiresAt +otp.attempts +mpin');
    if (!user || !user.otp || !user.otp.code) {
      throw new Error('कृपया पहले OTP मंगवाएं');
    }

    if (user.otp.attempts >= 3) {
      throw new Error('अधिकतम गलत प्रयास पार हो चुके हैं। कृपया 5 मिनट बाद नया OTP मंगवाएं');
    }

    if (new Date() > new Date(user.otp.expiresAt)) {
      throw new Error('OTP की समय सीमा समाप्त हो चुकी है। नया OTP मंगवाएं');
    }

    const isMatch = await bcrypt.compare(otp, user.otp.code);
    if (!isMatch) {
      user.otp.attempts += 1;
      await user.save();
      throw new Error(`गलत OTP दर्ज किया गया है। (${3 - user.otp.attempts} प्रयास शेष)`);
    }

    // Set New Hashed MPIN
    const salt = await bcrypt.genSalt(10);
    user.mpin = await bcrypt.hash(newMpin, salt);
    user.otp = undefined; // Clear OTP
    await user.save();

    const token = generateToken({
      id: user._id,
      phone: user.phone,
      role: user.role,
      isProfileCompleted: user.isProfileCompleted,
    });

    return {
      user: {
        id: user._id,
        phone: user.phone,
        role: user.role,
        isProfileCompleted: user.isProfileCompleted,
        profile: user.profile,
      },
      token,
      message: 'नया सुरक्षा PIN सफलतापूर्वक सेट कर दिया गया है',
    };
  }

  /**
   * 5.1 Verify Current MPIN for Authenticated User
   */
  static async verifyCurrentPIN(userId, mpin) {
    const user = await User.findById(userId).select('+mpin');
    if (!user) {
      throw new Error('उपयोगकर्ता खाता नहीं मिला');
    }

    if (!user.mpin) {
      return { verified: true, isFirstTime: true, message: 'कोई पुराना PIN नहीं मिला। नया PIN सेट करें।' };
    }

    const isMatch = await bcrypt.compare(mpin, user.mpin);
    if (!isMatch) {
      throw new Error('गलत पुराना PIN! कृपया सही पुराना PIN दर्ज करें');
    }

    return { verified: true, message: 'पुराना PIN सफलतापूर्वक सत्यापित हुआ' };
  }

  /**
   * 5.2 Change MPIN with Old PIN Verification
   */
  static async changePIN(userId, oldMpin, newMpin) {
    const user = await User.findById(userId).select('+mpin');
    if (!user) {
      throw new Error('उपयोगकर्ता खाता नहीं मिला');
    }

    if (user.mpin) {
      const isMatch = await bcrypt.compare(oldMpin, user.mpin);
      if (!isMatch) {
        throw new Error('गलत पुराना PIN! कृपया सही पुराना PIN दर्ज करें');
      }
    }

    if (oldMpin === newMpin) {
      throw new Error('नया PIN पुराने PIN से अलग होना चाहिए');
    }

    const salt = await bcrypt.genSalt(10);
    user.mpin = await bcrypt.hash(newMpin, salt);
    await user.save();

    return { success: true, message: 'सुरक्षा PIN सफलतापूर्वक बदल दिया गया है' };
  }

  /**
   * 6. Update Owner Profile & Photo
   */
  static async updateProfile(userId, data) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('उपयोगकर्ता नहीं मिला');
    }

    const { ownerName, chakkiName, village, profileImage, servicesOffered, defaultRates } = data;

    if (ownerName) user.profile.ownerName = ownerName;
    if (chakkiName) user.profile.chakkiName = chakkiName;
    if (village !== undefined) user.profile.village = village;
    if (profileImage !== undefined) user.profile.profileImage = profileImage;
    if (servicesOffered && Array.isArray(servicesOffered)) {
      user.servicesOffered = servicesOffered;
    }
    if (defaultRates) {
      user.defaultRates = { ...user.defaultRates, ...defaultRates };
    }

    await user.save();

    return {
      user: {
        id: user._id,
        phone: user.phone,
        role: user.role,
        isProfileCompleted: user.isProfileCompleted,
        profile: user.profile,
        servicesOffered: user.servicesOffered,
        defaultRates: user.defaultRates,
      },
    };
  }

  /**
   * 7. Get Current User Profile
   */
  static async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('उपयोगकर्ता नहीं मिला');
    }
    return user;
  }

  /**
   * 8. Get Settings and Activity Configuration
   */
  static async getSettings(userId) {
    const user = await User.findById(userId);
    const ownerName = user?.profile?.ownerName || 'Pushpendra Maurya';
    const chakkiName = user?.profile?.chakkiName || 'Chakki Smart AI Flour Mill';
    const village = user?.profile?.village || 'Rampur';

    return {
      user: {
        id: user?._id || userId,
        phone: user?.phone || '9569735570',
        ownerName,
        chakkiName,
        village,
        profileImage: user?.profile?.profileImage || '',
      },
      millingRates: {
        wheatPisaiPerKg: user?.defaultRates?.wheatPisaiPerKg || 3.5,
        oilExtractionPerKg: user?.defaultRates?.oilExtractionPerKg || 15,
        masalaGrindingPerKg: user?.defaultRates?.masalaGrindingPerKg || 20,
      },
      voiceAudioSettings: {
        voiceAlerts: true,
        speechRate: 0.9,
        language: 'hi',
      },
      security: {
        hasMpin: !!user?.mpin,
        biometricEnabled: false,
      },
      subscriptions: {
        chakkiPremium: {
          status: 'Not active',
          plan: 'Free Plan',
          benefits: ['Basic records', 'Voice assistant', 'Thermal receipt'],
        },
        smsAlertsPackage: {
          status: 'Active',
          creditsRemaining: 350,
          plan: 'Smart SMS Pack',
        },
      },
      appInfo: {
        appName: 'Chakki Smart AI',
        version: '1.2.0',
        language: 'English / हिन्दी',
      },
    };
  }

  /**
   * 9. Update Settings
   */
  static async updateSettings(userId, payload) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('उपयोगकर्ता नहीं मिला');
    }

    if (payload.millingRates) {
      user.defaultRates = {
        ...(user.defaultRates || {}),
        ...payload.millingRates,
      };
    }
    if (payload.ownerName && user.profile) {
      user.profile.ownerName = payload.ownerName;
    }
    if (payload.chakkiName && user.profile) {
      user.profile.chakkiName = payload.chakkiName;
    }

    await user.save();
    return this.getSettings(userId);
  }

  /**
   * 10. Submit App Rating & Feedback
   */
  static async submitRating(data) {
    const { rating, feedback, selectedChip, userId, phone, ownerName } = data;
    if (!rating || rating < 1 || rating > 5) {
      throw new Error('कृपया 1 से 5 के बीच स्टार रेटिंग चुनें');
    }
    const Rating = require('./rating.model');
    const newRating = await Rating.create({
      rating: Number(rating),
      feedback: feedback ? String(feedback).slice(0, 500) : '',
      selectedChip: selectedChip || '',
      userId: userId || null,
      phone: phone || '',
      ownerName: ownerName || '',
      platform: 'Android',
    });
    return {
      success: true,
      message: 'आपकी रेटिंग व प्रतिक्रिया सफलतापूर्वक दर्ज कर ली गई है! धन्यवाद।',
      ratingId: newRating._id,
    };
  }
}

module.exports = AuthService;
