const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    
    // We keep 'name' at the root level because the Canvas renderer relies on it for the big text
    name: { type: String, trim: true, default: 'Anonymous' }, 

    // THE ONLY FIELD THAT MATTERS FOR INPUTS NOW:
    // This will hold exactly and only what you configure in the Admin Panel
    dynamicData: { type: Object, default: {} }, 

    // MEDIA & ANALYTICS (Required for the system to work)
    avatarUrl: { type: String, required: true }, // The raw selfie
    finalBadgeUrl: { type: String, default: null }, // The finished framed poster
    themeStyle: { type: String, default: 'gradient' },
    customFrameUrl: { type: String, default: null },
    platformsShared: { type: [String], default: ['Direct Download'] },
    downloadsCount: { type: Number, default: 1 },
    sharesCount: { type: Number, default: 0 }
  },
  { 
    timestamps: true,
    strict: false // Ensures Mongoose doesn't strip out the dynamicData object keys
  }
);

module.exports = mongoose.model('Lead', leadSchema);