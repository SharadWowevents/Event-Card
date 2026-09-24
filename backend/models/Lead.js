const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    
    // 1. LEGACY FIELDS MADE OPTIONAL (Removed required: true to prevent 400 crashes)
    name: { type: String, trim: true, default: 'Attendee' }, 
    email: { type: String, trim: true, lowercase: true, default: '' },
    mobile: { type: String, trim: true, default: '' },
    title: { type: String, default: '' },
    company: { type: String, default: '' },
    role: { type: String, default: 'attendee' }, 
    customQuote: { type: String, default: '' },

    // 2. NEW DYNAMIC FIELD TO CATCH ALL CUSTOM BUILDER DATA
    dynamicData: { type: Object, default: {} }, 

    // MEDIA & ANALYTICS
    avatarUrl: { type: String, required: true }, // The raw selfie
    finalBadgeUrl: { type: String, default: null }, // The finished framed poster
    themeStyle: { type: String, default: 'gradient' },
    customFrameUrl: { type: String, default: null },
    platformsShared: { type: [String], default: ['Direct Download'] },
    downloadsCount: { type: Number, default: 1 },
    sharesCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lead', leadSchema);