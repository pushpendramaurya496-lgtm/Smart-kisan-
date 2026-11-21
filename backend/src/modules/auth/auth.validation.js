const Joi = require('joi');

const sendOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'मान्य 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें (6-9 से शुरू)',
      'any.required': 'मोबाइल नंबर आवश्यक है',
    }),
});

const verifyOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'मान्य 10-अंकीय मोबाइल नंबर दर्ज करें',
      'any.required': 'मोबाइल नंबर आवश्यक है',
    }),
  otp: Joi.string()
    .length(4)
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      'string.length': 'OTP ठीक 4 अंकों का होना चाहिए',
      'any.required': 'OTP दर्ज करना आवश्यक है',
    }),
});

const completeProfileSchema = Joi.object({
  ownerName: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'चक्की मालिक का नाम आवश्यक है',
    'any.required': 'चक्की मालिक का नाम आवश्यक है',
  }),
  chakkiName: Joi.string().trim().min(2).max(60).required().messages({
    'string.empty': 'चक्की/दुकान का नाम आवश्यक है',
    'any.required': 'चक्की का नाम आवश्यक है',
  }),
  village: Joi.string().trim().max(100).allow('').optional(),
  profileImage: Joi.string().allow('').optional(),
  mpin: Joi.string().pattern(/^\d{4}$/).optional().messages({
    'string.pattern.base': 'MPIN ठीक 4 अंकों का होना चाहिए',
  }),
  servicesOffered: Joi.array().items(Joi.string()).optional(),
  defaultRates: Joi.object({
    wheatPisaiPerKg: Joi.number().min(0).optional(),
    oilExtractionPerKg: Joi.number().min(0).optional(),
    masalaGrindingPerKg: Joi.number().min(0).optional(),
  }).optional(),
});

const loginPinSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'मान्य 10-अंकीय मोबाइल नंबर दर्ज करें',
      'any.required': 'मोबाइल नंबर आवश्यक है',
    }),
  mpin: Joi.string()
    .length(4)
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      'string.length': 'MPIN ठीक 4 अंकों का होना चाहिए',
      'any.required': 'MPIN दर्ज करना आवश्यक है',
    }),
});

const resetPinSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'मान्य 10-अंकीय मोबाइल नंबर दर्ज करें',
      'any.required': 'मोबाइल नंबर आवश्यक है',
    }),
  otp: Joi.string()
    .length(4)
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      'string.length': 'OTP ठीक 4 अंकों का होना चाहिए',
      'any.required': 'सत्यापन के लिए OTP आवश्यक है',
    }),
  newMpin: Joi.string()
    .length(4)
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      'string.length': 'नया MPIN ठीक 4 अंकों का होना चाहिए',
      'any.required': 'नया MPIN दर्ज करना आवश्यक है',
    }),
});

const updateProfileSchema = Joi.object({
  ownerName: Joi.string().trim().min(2).max(50).optional(),
  chakkiName: Joi.string().trim().min(2).max(60).optional(),
  village: Joi.string().trim().max(100).allow('').optional(),
  profileImage: Joi.string().allow('').optional(),
  servicesOffered: Joi.array().items(Joi.string()).optional(),
  defaultRates: Joi.object({
    wheatPisaiPerKg: Joi.number().min(0).optional(),
    oilExtractionPerKg: Joi.number().min(0).optional(),
    masalaGrindingPerKg: Joi.number().min(0).optional(),
  }).optional(),
});

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  completeProfileSchema,
  updateProfileSchema,
  loginPinSchema,
  resetPinSchema,
};
