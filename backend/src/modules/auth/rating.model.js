const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    phone: {
      type: String,
      default: '',
    },
    ownerName: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      default: '',
      maxlength: 500,
    },
    selectedChip: {
      type: String,
      default: '',
    },
    platform: {
      type: String,
      default: 'Android',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Rating', ratingSchema);
