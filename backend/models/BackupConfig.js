const mongoose = require('mongoose');

const backupConfigSchema = new mongoose.Schema(
  {
    autoBackupEnabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['1h', '6h', '12h', '24h', 'weekly'],
      default: '6h'
    },
    intervalHours: {
      type: Number,
      default: 6
    },
    lastBackupAt: {
      type: Date,
      default: null
    },
    nextBackupAt: {
      type: Date,
      default: null
    },
    retentionDays: {
      type: Number,
      default: 30
    },
    maxBackupsToKeep: {
      type: Number,
      default: 50
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('BackupConfig', backupConfigSchema);

