const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      index: true
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'retrying'],
      default: 'pending',
      index: true
    },
    priority: {
      type: Number,
      default: 0, // Higher numbers = higher priority
      index: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    backoffMultiplierMs: {
      type: Number,
      default: 2000 // 2s base backoff (2s, 4s, 8s...)
    },
    lockedAt: {
      type: Date,
      default: null,
      index: true
    },
    lockedBy: {
      type: String, // Worker ID / hostname / PID
      default: null
    },
    nextRunAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    error: {
      message: { type: String },
      stack: { type: String },
      failedAt: { type: Date }
    },
    recoveryCount: {
      type: Number,
      default: 0 // Number of times recovered from server crash/timeout
    },
    recoveryLog: [
      {
        recoveredAt: { type: Date, default: Date.now },
        reason: { type: String },
        recoveredBy: { type: String }
      }
    ],
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index for optimal atomic dequeue polling
taskSchema.index({ status: 1, nextRunAt: 1, priority: -1, createdAt: 1 });
// Compound index for dead lock / zombie recovery
taskSchema.index({ status: 1, lockedAt: 1 });

module.exports = mongoose.model('Task', taskSchema);

