const EntryService = require('./entry.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const {
  createEntrySchema,
  deliverEntrySchema,
  pickupSearchSchema,
} = require('./entry.validation');

/**
 * 1. Create New Milling Entry (Manual / Voice)
 * POST /api/v1/entries
 */
const createEntry = asyncHandler(async (req, res) => {
  const { error, value } = createEntrySchema.validate(req.body);
  if (error) {
    return ApiResponse.error(res, 400, error.details[0].message);
  }

  const result = await EntryService.createEntry(req.user._id, value);
  return ApiResponse.success(res, 201, result, result.message);
});

/**
 * 2. Search Customers & Pending Orders for Pickup / Delivery
 * GET /api/v1/entries/pickup-search
 */
const searchForPickup = asyncHandler(async (req, res) => {
  const { error, value } = pickupSearchSchema.validate(req.query);
  if (error) {
    return ApiResponse.error(res, 400, error.details[0].message);
  }

  const results = await EntryService.searchForPickup(req.user._id, value);
  return ApiResponse.success(res, 200, results, 'सर्च परिणाम प्राप्त हुए');
});

/**
 * 3. Handover / Deliver Milling Order & Settle Payment (Partial or Full)
 * POST /api/v1/entries/:id/deliver
 */
const deliverEntry = asyncHandler(async (req, res) => {
  const { error, value } = deliverEntrySchema.validate(req.body);
  if (error) {
    return ApiResponse.error(res, 400, error.details[0].message);
  }

  const result = await EntryService.deliverEntry(req.user._id, req.params.id, value);
  return ApiResponse.success(res, 200, result, result.message);
});

/**
 * 4. Get Recent Entries
 * GET /api/v1/entries
 */
const getEntries = asyncHandler(async (req, res) => {
  const entries = await EntryService.getEntries(req.user._id, req.query);
  return ApiResponse.success(res, 200, entries, 'पिसाई रिकॉर्ड लोड हुए');
});

module.exports = {
  createEntry,
  searchForPickup,
  deliverEntry,
  getEntries,
};
