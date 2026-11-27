const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
      index: true,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['OWNER', 'OPERATOR', 'WORKER'],
      default: 'OWNER',
    },
    profile: {
      ownerName: {
        type: String,
        trim: true,
        default: '',
      },
      chakkiName: {
        type: String,
        trim: true,
        default: '',
      },
      village: {
        type: String,
        trim: true,
        default: '',
      },
      profileImage: {
        type: String,
        default: '',
      },
    },
    servicesOffered: {
      type: [String],
      default: ['PISAI', 'OIL', 'MASALA', 'DARRA', 'MATAR_BESAN', 'CHANA_BESAN', 'DHANIYA', 'MAKKA_AATA', 'CHAWAL'],
    },
    defaultRates: {
      wheatPisaiPerKg: { type: Number, default: 3.5 },
      oilExtractionPerKg: { type: Number, default: 15 },
      masalaGrindingPerKg: { type: Number, default: 20 },
      darraPisaiPerKg: { type: Number, default: 4 },
      matarBesanPerKg: { type: Number, default: 6 },
      chanaBesanPerKg: { type: Number, default: 7 },
      dhaniyaPerKg: { type: Number, default: 20 },
      makkaAataPerKg: { type: Number, default: 4.5 },
      chawalPerKg: { type: Number, default: 4 },
    },
    mpin: {
      type: String, // Hashed 4-digit PIN for quick unlocks
      select: false,
    },
    otp: {
      code: {
        type: String,
        select: false,
      },
      expiresAt: {
        type: Date,
        select: false,
      },
      attempts: {
        type: Number,
        default: 0,
        select: false,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
