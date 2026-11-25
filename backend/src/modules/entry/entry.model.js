const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'चक्की मालिक की ID आवश्यक है'],
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'ग्राहक की ID आवश्यक है'],
      index: true,
    },
    tokenNumber: {
      type: String,
      required: [true, 'टोकन / कट्टा नंबर आवश्यक है'],
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'ग्राहक का नाम आवश्यक है'],
      trim: true,
      index: true,
    },
    village: {
      type: String,
      required: [true, 'गांव आवश्यक है'],
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    itemType: {
      type: String,
      enum: ['WHEAT', 'OIL', 'MASALA', 'DARRA', 'OTHER'],
      default: 'WHEAT',
    },
    itemLabel: {
      type: String,
      default: 'गेहूं पिसाई',
    },
    weightKg: {
      type: Number,
      required: [true, 'वजन (किलो) आवश्यक है'],
      min: [0.1, 'वजन 0 से अधिक होना चाहिए'],
    },
    ratePerKg: {
      type: Number,
      required: [true, 'प्रति किलो दर आवश्यक है'],
      min: [0, 'दर 0 या उससे अधिक होनी चाहिए'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PARTIAL', 'PAID'],
      default: 'UNPAID',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'CREDIT', 'PENDING'],
      default: 'PENDING',
    },
    millingStatus: {
      type: String,
      enum: ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'],
      default: 'RECEIVED',
      index: true,
    },
    isDelivered: {
      type: Boolean,
      default: false,
      index: true,
    },
    handoverDate: {
      type: Date,
    },
    source: {
      type: String,
      enum: ['MANUAL', 'VOICE'],
      default: 'MANUAL',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for lightning-fast search on pickup
entrySchema.index({ ownerId: 1, isDelivered: 1, customerName: 1, village: 1 });
entrySchema.index({ ownerId: 1, tokenNumber: 1 });
entrySchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model('Entry', entrySchema);
