const Joi = require('joi');

const recordDebtPaymentSchema = Joi.object({
  amountPaid: Joi.number().min(1).required().messages({
    'number.min': 'जमा राशि कम से कम ₹1 होनी चाहिए',
    'any.required': 'जमा राशि (Amount Paid) आवश्यक है',
  }),
  paymentMethod: Joi.string()
    .valid('CASH', 'UPI')
    .default('CASH'),
  notes: Joi.string().trim().max(200).allow('').optional(),
});

const searchCustomerSchema = Joi.object({
  query: Joi.string().trim().allow('').optional(),
  village: Joi.string().trim().allow('').optional(),
});

const voiceSearchCustomerSchema = Joi.object({
  spokenText: Joi.string().trim().required().messages({
    'any.required': 'बोलकर खोजा गया वाक्य (Spoken Text) आवश्यक है',
  }),
});

module.exports = {
  recordDebtPaymentSchema,
  searchCustomerSchema,
  voiceSearchCustomerSchema,
};
