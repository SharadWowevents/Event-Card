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
      bannerStyle: { type: String, default: 'gradient' }
    },
    templateConfig: {
      attendeeHeadline: { type: String, default: "I'M ATTENDING" },
      speakerHeadline: { type: String, default: 'KEYNOTE SPEAKER' },
      exhibitorHeadline: { type: String, default: 'VISIT OUR BOOTH' },
      sponsorHeadline: { type: String, default: 'PROUD SPONSOR' },
      overlayStyle: { type: String, default: 'card' },
      textPositioning: {
        nameY: { type: Number, default: 820 }, titleY: { type: Number, default: 875 },
        companyY: { type: Number, default: 920 }, roleBadgeY: { type: Number, default: 760 },
        textColor: { type: String, default: '#ffffff' }, alignment: { type: String, default: 'center' },
        showQrCode: { type: Boolean, default: true }, showVenue: { type: Boolean, default: true },
        showDate: { type: Boolean, default: true }
      }
    },
    sponsors: [sponsorSchema],
    customFrames: [customFrameSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);