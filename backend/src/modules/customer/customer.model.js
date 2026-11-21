const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['BILL', 'PAYMENT', 'ADJUSTMENT'],
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entry',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    billedAmount: {
      type: Number,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'CREDIT', 'MIXED'],
      default: 'CASH',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const customerSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'चक्की मालिक की ID आवश्यक है'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'ग्राहक का नाम आवश्यक है'],
      trim: true,
      index: true,
    },
    village: {
      type: String,
      required: [true, 'ग्राहक का गांव आवश्यक है'],
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    // Running Ledger Balance: > 0 means customer owes money (बाकी), < 0 means advance (जमा)
    pendingBalance: {
      type: Number,
      default: 0,
      index: true,
    },
    totalOrdersCount: {
      type: Number,
      default: 0,
    },
    totalWeightMilledKg: {
      type: Number,
      default: 0,
    },
    totalBilledAmount: {
      type: Number,
      default: 0,
    },
    totalPaidAmount: {
      type: Number,
      default: 0,
    },
    lastVisitDate: {
      type: Date,
      default: Date.now,
    },
    ledgerHistory: [ledgerEntrySchema],
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index on ownerId + name + village for instantaneous lookup
customerSchema.index({ ownerId: 1, name: 1, village: 1 });
customerSchema.index({ ownerId: 1, phone: 1 });

module.exports = mongoose.model('Customer', customerSchema);
