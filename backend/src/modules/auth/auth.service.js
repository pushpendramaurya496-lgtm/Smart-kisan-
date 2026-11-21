const bcrypt = require('bcryptjs');
const User = require('./auth.model');
const { generateToken } = require('../../services/jwt.service');

class AuthService {
  /**
   * 1. Send OTP to Mobile Number
   */
  static async sendOTP(phone) {
    // In dev / test mode, predictable OTP '1234' makes testing instant; otherwise random 4 digits
    const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
    const rawOtp = isDev ? '1234' : Math.floor(1000 + Math.random() * 9000).toString();
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

    console.log(`\n📲 [OTP SENT] Phone: ${phone} | OTP: ${rawOtp} (Valid for 5 mins)\n`);

    return {
      phone: user.phone,
      isNewUser,
      isProfileCompleted: user.isProfileCompleted,
      devOtp: isDev ? rawOtp : undefined,
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
      throw new Error('इस खाते के लिए MPIN सेट नहीं है। कृपया OTP से लॉगिन करके PIN सेट करें');
    }

    const isMatch = await bcrypt.compare(mpin, user.mpin);
    if (!isMatch) {
      throw new Error('गलत सुरक्षा PIN दर्ज किया गया है। कृपया पुनः प्रयास करें');
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
}

module.exports = AuthService;
