const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true
      // e.g. 'CREATE_EVENT', 'UPDATE_EVENT', 'DELETE_EVENT', 'CREATE_LEAD', 'UPDATE_LEAD', 'DELETE_LEAD', 'CREATE_MOMENT', 'DELETE_MOMENT', 'RESTORE_BACKUP', 'CREATE_BACKUP', 'UPDATE_THEME'
    },
    entityType: {
      type: String,
      required: true,
      index: true
      // 'Event', 'Lead', 'Moment', 'User', 'Backup', 'System'
    },
    entityId: {
      type: String,
      default: null,
      index: true
    },
    description: {
      type: String,
      required: true
    },
    performedBy: {
      type: String,
      default: 'Admin'
    },
    previousState: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    newState: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    canUndo: {
      type: Boolean,
      default: true
    },
    isUndone: {
      type: Boolean,
      default: false,
      index: true
    },
    undoneAt: {
      type: Date,
      default: null
    },
    undoneBy: {
      type: String,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);

