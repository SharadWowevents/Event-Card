const mongoose = require('mongoose');

const backupSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      unique: true
    },
    filepath: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['manual', 'auto'],
      default: 'manual',
      index: true
    },
    sizeBytes: {
      type: Number,
      default: 0
    },
    stats: {
      eventsCount: { type: Number, default: 0 },
      leadsCount: { type: Number, default: 0 },
      momentsCount: { type: Number, default: 0 },
      usersCount: { type: Number, default: 0 },
      tasksCount: { type: Number, default: 0 },
      totalRecords: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: ['completed', 'failed'],
      default: 'completed'
    },
    error: {
      type: String,
      default: null
    },
    createdBy: {
      type: String,
      default: 'Admin'
    }
  },
  {
    timestamps: true
  }
);

backupSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Backup', backupSchema);

