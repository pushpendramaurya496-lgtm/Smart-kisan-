const Joi = require('joi');

const createEntrySchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).required().messages({
    'string.empty': 'ग्राहक का नाम आवश्यक है',
    'any.required': 'ग्राहक का नाम आवश्यक है',
  }),
  village: Joi.string().trim().min(2).max(60).required().messages({
    'string.empty': 'गांव का नाम आवश्यक है',
    'any.required': 'गांव का नाम आवश्यक है',
  }),
  weightKg: Joi.number().min(0.1).max(10000).required().messages({
    'number.min': 'वजन कम से कम 0.1 किलो होना चाहिए',
    'any.required': 'वजन दर्ज करना आवश्यक है',
  }),
  phone: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'मान्य 10-अंकीय मोबाइल नंबर दर्ज करें',
    }),
  itemType: Joi.string()
    .valid('WHEAT', 'OIL', 'MASALA', 'DARRA', 'OTHER')
    .default('WHEAT'),
  itemLabel: Joi.string().trim().max(50).optional(),
  ratePerKg: Joi.number().min(0).optional(),
  amountPaid: Joi.number().min(0).default(0),
  paymentMethod: Joi.string().valid('CASH', 'UPI', 'CREDIT', 'PENDING').default('PENDING'),
  source: Joi.string().valid('MANUAL', 'VOICE').default('MANUAL'),
  notes: Joi.string().trim().max(200).allow('').optional(),
  customerId: Joi.string().allow('', null).optional(),
  createNewCustomer: Joi.boolean().optional(),
});

const deliverEntrySchema = Joi.object({
  amountPaid: Joi.number().min(0).required().messages({
    'any.required': 'प्राप्त राशि (Amount Paid) दर्ज करना आवश्यक है (0 यदि पूरा उधार हो)',
  }),
  paymentMethod: Joi.string()
    .valid('CASH', 'UPI', 'CREDIT')
    .default('CASH'),
  notes: Joi.string().trim().max(200).allow('').optional(),
});

const pickupSearchSchema = Joi.object({
  name: Joi.string().trim().allow('').optional(),
  village: Joi.string().trim().allow('').optional(),
  token: Joi.string().trim().allow('').optional(),
  phone: Joi.string().trim().allow('').optional(),
});

module.exports = {
  createEntrySchema,
  deliverEntrySchema,
  pickupSearchSchema,
};
