const mongoose = require('mongoose');

const customFrameSchema = new mongoose.Schema({
  label: { type: String, required: true },
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const sponsorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tier: { type: String, default: 'Gold' },
  logoText: { type: String }
});

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    tagline: { type: String, default: '' },
    dates: { type: String, default: 'October 14–16, 2026' },
    startDate: { type: Date, default: Date.now }, // Exact kick-off time
    venue: { type: String, default: '' },
    website: { type: String, default: '' },
    status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active' },
    attendeeCount: { type: Number, default: 0 },
    postersCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    emvValue: { type: Number, default: 0 },
    theme: {
      primaryColor: { type: String, default: '#0ea5e9' },
      secondaryColor: { type: String, default: '#10b981' },
      accentColor: { type: String, default: '#0ea5e9' },
      gradient: { type: String, default: 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)' },
      fontFamily: { type: String, default: 'Plus Jakarta Sans' },
      bannerStyle: { type: String, default: 'gradient' },
      backgroundType: { type: String, enum: ['color', 'gradient', 'image'], default: 'gradient' },
      backgroundColor: { type: String, default: '#0f172a' },
      backgroundImageUrl: { type: String, default: '' }
    },
    templateConfig: {
      attendeeHeadline: { type: String, default: "I'M ATTENDING" },
      speakerHeadline: { type: String, default: 'KEYNOTE SPEAKER' },
      exhibitorHeadline: { type: String, default: 'VISIT OUR BOOTH' },
      sponsorHeadline: { type: String, default: 'PROUD SPONSOR' },
      overlayStyle: { type: String, default: 'card' },
      // Inside backend/models/Event.js
      // Find the textPositioning block and update it to look like this:

      textPositioning: {
        alignment: { type: String, default: 'center' },
        showQrCode: { type: Boolean, default: true },
        showVenue: { type: Boolean, default: true },
        showDate: { type: Boolean, default: true },

        // NEW TYPOGRAPHY FIELDS
        nameFontSize: { type: Number, default: 80 },
        nameColor: { type: String, default: '#ffffff' },
        nameUseGradient: { type: Boolean, default: false },
        nameY: { type: Number, default: 1130 },
        subTextFontSize: { type: Number, default: 36 },
        subTextColor: { type: String, default: '#e2e8f0' },
        subTextY: { type: Number, default: 1210 }
      },
      selfiePositioning: {
        shape: { type: String, enum: ['circle', 'square'], default: 'circle' },
        x: { type: Number, default: 540 },
        y: { type: Number, default: 595 },
        size: { type: Number, default: 560 },
        borderRadius: { type: Number, default: 0 }
      },
      // Inside backend/models/Event.js, inside templateConfig:
      formSetup: {
        name: { show: { type: Boolean, default: true }, required: { type: Boolean, default: true } },
        email: { show: { type: Boolean, default: true }, required: { type: Boolean, default: false } },
        mobile: { show: { type: Boolean, default: false }, required: { type: Boolean, default: false } },
        company: { show: { type: Boolean, default: true }, required: { type: Boolean, default: true } },
        title: { show: { type: Boolean, default: false }, required: { type: Boolean, default: false } },
        role: { show: { type: Boolean, default: false }, required: { type: Boolean, default: false } },
        customQuote: { show: { type: Boolean, default: false }, required: { type: Boolean, default: false } }
      },
      formFields: [{
        id: String,
        label: String,
        inputType: String,
        maxLength: Number,
        show: { type: Boolean, default: true },
        required: { type: Boolean, default: false }
      }]
    },
    sponsors: [sponsorSchema],
    customFrames: [customFrameSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);