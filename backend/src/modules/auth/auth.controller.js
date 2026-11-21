const AuthService = require('./auth.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const {
  sendOtpSchema,
  verifyOtpSchema,
  completeProfileSchema,
  updateProfileSchema,
  loginPinSchema,
  resetPinSchema,
} = require('./auth.validation');

/**
 * 1. Mobile Number Login -> Send OTP
 * POST /api/v1/auth/send-otp
 */
const sendOTP = asyncHandler(async (req, res) => {
  const { error, value } = sendOtpSchema.validate(req.body);
  if (error) {
    return ApiResponse.error(res, 400, error.details[0].message);
  }

  const result = await AuthService.sendOTP(value.phone);
  return ApiResponse.success(res, 200, result, 'OTP सफलतापूर्वक भेजा गया');
});

/**
 * 2. Verify OTP -> Issues JWT Token
 * POST /api/v1/auth/verify-otp
 */
const verifyOTP = asyncHandler(async (req, res) => {
  const { error, value } = verifyOtpSchema.validate(req.body);
  if (error) {
    return ApiResponse.error(res, 400, error.details[0].message);
  }

  const result = await AuthService.verifyOTP(value.phone, value.otp);
  return ApiResponse.success(res, 200, result, 'OTP सफलतापूर्वक सत्यापित हुआ');
});

/**
 * 3. Complete Owner Profile (After OTP verification)
 * POST /api/v1/auth/complete-profile
 */
const completeProfile = asyncHandler(async (req, res) => {
  const { error, value } = completeProfileSchema.validate(req.body);
  if (error) {
    return ApiResponse.error(res, 400, error.details[0].message);
  }

  const result = await AuthService.completeProfile(req.user._id, value);
  return ApiResponse.success(res, 200, result, 'चक्की मालिक की प्रोफाइल सफलतापूर्वक बनाई गई');
});

/**
 * 4. Login With 4-Digit MPIN
 * POST /api/v1/auth/login-pin
 */
const loginWithPIN = asyncHandler(async (req, res) => {
  const { error, value } = loginPinSchema.validate(req.body);
  if (error) {
    return ApiResponse.error(res, 400, error.details[0].message);
  }

  const result = await AuthService.loginWithPIN(value.phone, value.mpin);
  return ApiResponse.success(res, 200, result, 'PIN द्वारा सफलतापूर्वक लॉगिन हुआ');
});

/**
 * 5. Reset / Forget PIN with OTP Verification
 * POST /api/v1/auth/reset-pin
 */
const resetPIN = asyncHandler(async (req, res) => {
  const { error, value } = resetPinSchema.validate(req.body);
  if (error) {
    return ApiResponse.error(res, 400, error.details[0].message);
  }

  const result = await AuthService.resetPIN(value.phone, value.otp, value.newMpin);
  return ApiResponse.success(res, 200, result, 'नया PIN सफलतापूर्वक सेट कर दिया गया');
});

/**
 * 6. Update Owner Profile & Photo
 * PUT /api/v1/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { error, value } = updateProfileSchema.validate(req.body);
  if (error) {
    return ApiResponse.error(res, 400, error.details[0].message);
  }

  const result = await AuthService.updateProfile(req.user._id, value);
  return ApiResponse.success(res, 200, result, 'प्रोफाइल और फोटो सफलतापूर्वक अपडेट हुई');
});

/**
 * 7. Get Current Logged-in User Profile
 * GET /api/v1/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await AuthService.getMe(req.user._id);
  return ApiResponse.success(res, 200, user, 'यूजर प्रोफाइल लोड हुई');
});

/**
 * 8. Get Settings and Activity Data
 * GET /api/v1/auth/settings
 */
const getSettings = asyncHandler(async (req, res) => {
  const settings = await AuthService.getSettings(req.user._id);
  return ApiResponse.success(res, 200, settings, 'सेटिंग्स और गतिविधि डेटा लोड हुआ');
});

/**
 * 9. Update Settings
 * PUT /api/v1/auth/settings
 */
const updateSettings = asyncHandler(async (req, res) => {
  const updated = await AuthService.updateSettings(req.user._id, req.body || {});
  return ApiResponse.success(res, 200, updated, 'सेटिंग्स सफलतापूर्वक अपडेट हुई');
});

/**
 * 10. Logout User
 * POST /api/v1/auth/logout
 */
const logoutUser = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, 200, { loggedOut: true }, 'सफलतापूर्वक लॉगआउट हुआ');
});

module.exports = {
  sendOTP,
  verifyOTP,
  completeProfile,
  updateProfile,
  loginWithPIN,
  resetPIN,
  getMe,
  getSettings,
  updateSettings,
  logoutUser,
};
