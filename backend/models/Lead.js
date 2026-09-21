const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, required: true },
    mobile: { type: String, trim: true, required: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    role: { type: String, enum: ['attendee', 'speaker', 'exhibitor', 'sponsor'], default: 'attendee' },
    customQuote: { type: String, default: '' },
    avatarUrl: { type: String, required: true }, // The raw selfie
    finalBadgeUrl: { type: String, default: null }, // NEW: The finished framed poster
    themeStyle: { type: String, default: 'gradient' },
    customFrameUrl: { type: String, default: null },
    platformsShared: { type: [String], default: ['Direct Download'] },
    downloadsCount: { type: Number, default: 1 },
    sharesCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lead', leadSchema);