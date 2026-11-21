const CustomerService = require('./customer.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const {
  recordDebtPaymentSchema,
  searchCustomerSchema,
  voiceSearchCustomerSchema,
} = require('./customer.validation');

/**
 * 1. Search Customers (Text Query)
 * GET /api/v1/customers
 */
const searchCustomers = asyncHandler(async (req, res) => {
  const { error, value } = searchCustomerSchema.validate(req.query);
  if (error) {
    return ApiResponse.error(res, 400, error.details[0].message);
  }

  const customers = await CustomerService.searchCustomers(req.user._id, value);
  return ApiResponse.success(res, 200, customers, 'ग्राहक सूची लोड हुई');
});

/**
 * 2. Voice Search Customers (बोलकर ग्राहक खोजें)
 * POST /api/v1/customers/voice-search
 */
const voiceSearchCustomers = asyncHandler(async (req, res) => {
  const { error, value } = voiceSearchCustomerSchema.validate(req.body);
  if (error) {
    return ApiResponse.error(res, 400, error.details[0].message);
  }

  const result = await CustomerService.voiceSearchCustomers(req.user._id, value.spokenText);
  return ApiResponse.success(res, 200, result, 'आवाज द्वारा ग्राहक खोज संपन्न हुई');
});

/**
 * 3. Get Customer Detail with Full Khata & Orders History
 * GET /api/v1/customers/:id
 */
const getCustomerDetail = asyncHandler(async (req, res) => {
  const result = await CustomerService.getCustomerDetail(req.user._id, req.params.id);
  return ApiResponse.success(res, 200, result, 'ग्राहक खाता विवरण लोड हुआ');
});

/**
 * 4. Get Comprehensive Customer Dashboard (डैशबोर्ड: पुराना इतिहास, बाकी राशि)
 * GET /api/v1/customers/:id/dashboard
 */
const getCustomerDashboard = asyncHandler(async (req, res) => {
  const result = await CustomerService.getCustomerDashboard(req.user._id, req.params.id);
  return ApiResponse.success(res, 200, result, 'ग्राहक डैशबोर्ड व पिछला रिकॉर्ड लोड हुआ');
});

/**
 * 5. Receive Direct Debt Payment into Customer Khata
 * POST /api/v1/customers/:id/pay-debt
 */
const recordDebtPayment = asyncHandler(async (req, res) => {
  const { error, value } = recordDebtPaymentSchema.validate(req.body);
  if (error) {
    return ApiResponse.error(res, 400, error.details[0].message);
  }

  const result = await CustomerService.recordDebtPayment(req.user._id, req.params.id, value);
  return ApiResponse.success(res, 200, result, result.message);
});

module.exports = {
  searchCustomers,
  voiceSearchCustomers,
  getCustomerDetail,
  getCustomerDashboard,
  recordDebtPayment,
};
