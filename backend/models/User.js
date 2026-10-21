const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['Superadmin', 'Event Admin', 'Viewer'],
      default: 'Event Admin'
    },
    status: {
      type: String,
      enum: ['Active', 'Invited'],
      default: 'Invited'
    },
    themePreference: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark'
    },
    readNotificationIds: {
      type: [String],
      default: []
    },
    lastNotificationsReadAt: {
      type: Date,
      default: null
    },
    lastActive: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
