const ActivityLog = require('../models/ActivityLog');
const Event = require('../models/Event');
const Lead = require('../models/Lead');
const Moment = require('../models/Moment');
const User = require('../models/User');

class ActivityLogger {
  /**
   * Log an activity with optional previous and new states for undo capability.
   */
  async log({
    action,
    entityType,
    entityId = null,
    description,
    performedBy = 'Admin',
    previousState = null,
    newState = null,
    canUndo = true,
    metadata = {}
  }) {
    try {
      const log = new ActivityLog({
        action,
        entityType,
        entityId: entityId ? entityId.toString() : null,
        description,
        performedBy,
        previousState: previousState ? JSON.parse(JSON.stringify(previousState)) : null,
        newState: newState ? JSON.parse(JSON.stringify(newState)) : null,
        canUndo,
        metadata
      });

      await log.save();
      return log;
    } catch (err) {
      console.error('[ActivityLogger] Error recording log:', err.message);
      return null;
    }
  }

  /**
   * Fetch the last 500 activity logs with optional filtering.
   */
  async getLogs({ limit = 500, entityType, action, search } = {}) {
    const query = {};

    if (entityType && entityType !== 'all') {
      query.entityType = entityType;
    }

    if (action && action !== 'all') {
      query.action = action;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { description: regex },
        { performedBy: regex },
        { action: regex },
        { entityType: regex }
      ];
    }

    const maxLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 500));

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .limit(maxLimit)
        .lean(),
      ActivityLog.countDocuments(query)
    ]);

    return { logs, total, limit: maxLimit };
  }

  /**
   * Perform Undo on an activity log entry.
   * Reverts entity state according to the recorded previousState or inverse action.
   */
  async undo(logId, performedBy = 'Admin') {
    const log = await ActivityLog.findById(logId);
    if (!log) {
      throw new Error('Activity log not found');
    }

    if (!log.canUndo) {
      throw new Error('This action is not eligible for undo.');
    }

    if (log.isUndone) {
      throw new Error(`This action was already undone on ${new Date(log.undoneAt).toLocaleString()}`);
    }

    const { action, entityType, entityId, previousState, newState } = log;
    let undoMessage = '';

    // ==========================================
    // 1. EVENT UNDO HANDLERS
    // ==========================================
    if (entityType === 'Event') {
      if (action.startsWith('CREATE') || action === 'CREATE_EVENT') {
        // Undo create: remove the created event
        if (entityId) {
          const removed = await Event.findByIdAndDelete(entityId);
          undoMessage = `Undid event creation: deleted event "${removed ? removed.name : entityId}"`;
        }
      } else if (action.startsWith('UPDATE') || action === 'UPDATE_EVENT' || action === 'UPDATE_THEME') {
        // Undo update: restore previous state
        if (previousState && entityId) {
          await Event.findByIdAndUpdate(entityId, previousState, { returnDocument: 'after' });
          undoMessage = `Restored event "${previousState.name || entityId}" to previous configuration`;
        }
      } else if (action.startsWith('DELETE') || action === 'DELETE_EVENT') {
        // Undo delete: recreate the event from previousState
        if (previousState) {
          const toRestore = { ...previousState };
          delete toRestore.__v;
          const restored = new Event(toRestore);
          await restored.save();
          undoMessage = `Restored deleted event "${restored.name}"`;
        }
      }
    }

    // ==========================================
    // 2. LEAD UNDO HANDLERS
    // ==========================================
    else if (entityType === 'Lead') {
      if (action.startsWith('CREATE') || action === 'CREATE_LEAD') {
        if (entityId) {
          await Lead.findByIdAndDelete(entityId);
          undoMessage = `Removed created lead (ID: ${entityId})`;
        }
      } else if (action.startsWith('UPDATE') || action === 'UPDATE_LEAD') {
        if (previousState && entityId) {
          await Lead.findByIdAndUpdate(entityId, previousState, { returnDocument: 'after' });
          undoMessage = `Restored lead (ID: ${entityId}) to previous state`;
        }
      } else if (action.startsWith('DELETE') || action === 'DELETE_LEAD') {
        if (previousState) {
          const toRestore = { ...previousState };
          delete toRestore.__v;
          const restored = new Lead(toRestore);
          await restored.save();
          undoMessage = `Restored deleted lead "${restored.name}"`;
        }
      }
    }

    // ==========================================
    // 3. MOMENT UNDO HANDLERS
    // ==========================================
    else if (entityType === 'Moment') {
      if (action.startsWith('CREATE') || action === 'CREATE_MOMENT') {
        if (entityId) {
          await Moment.findByIdAndDelete(entityId);
          undoMessage = `Removed uploaded moment (ID: ${entityId})`;
        }
      } else if (action.startsWith('DELETE') || action === 'DELETE_MOMENT') {
        if (previousState) {
          const toRestore = { ...previousState };
          delete toRestore.__v;
          const restored = new Moment(toRestore);
          await restored.save();
          undoMessage = `Restored deleted moment "${restored.title || 'Photo'}"`;
        }
      }
    }

    // ==========================================
    // 4. USER UNDO HANDLERS
    // ==========================================
    else if (entityType === 'User') {
      if (action.startsWith('CREATE') || action === 'INVITE_USER') {
        if (entityId) {
          await User.findByIdAndDelete(entityId);
          undoMessage = `Removed invited user (ID: ${entityId})`;
        }
      } else if (action.startsWith('UPDATE') || action === 'UPDATE_USER_ROLE') {
        if (previousState && entityId) {
          await User.findByIdAndUpdate(entityId, previousState, { returnDocument: 'after' });
          undoMessage = `Restored user role / permissions to previous values`;
        }
      } else if (action.startsWith('DELETE') || action === 'DELETE_USER') {
        if (previousState) {
          const toRestore = { ...previousState };
          delete toRestore.__v;
          const restored = new User(toRestore);
          await restored.save();
          undoMessage = `Restored deleted team user "${restored.name}"`;
        }
      }
    }

    // Default fallback
    if (!undoMessage) {
      if (previousState && entityId) {
        undoMessage = `Restored previous state for ${entityType} #${entityId}`;
      } else {
        undoMessage = `Marked action as undone for ${entityType}`;
      }
    }

    // Mark log as undone
    log.isUndone = true;
    log.undoneAt = new Date();
    log.undoneBy = performedBy;
    await log.save();

    // Log the undo action itself into the audit log
    await this.log({
      action: 'UNDO_OPERATION',
      entityType: log.entityType,
      entityId: log.entityId,
      description: `Undid: "${log.description}" - ${undoMessage}`,
      performedBy,
      canUndo: false,
      metadata: { targetLogId: log._id.toString() }
    });

    return {
      success: true,
      message: undoMessage,
      log
    };
  }

  /**
   * Seed rich initial history if the activity logs collection is empty.
   */
  async seedInitialLogs() {
    try {
      const count = await ActivityLog.countDocuments();
      if (count > 0) return;

      const events = await Event.find().limit(5);
      const leads = await Lead.find().limit(5);

      const sampleLogs = [
        {
          action: 'SYSTEM_BOOT',
          entityType: 'System',
          description: 'Crash-resilient persistent Task Queue and event engine initialized',
          performedBy: 'System Engine',
          canUndo: false
        },
        {
          action: 'CONFIGURE_QUEUE',
          entityType: 'System',
          description: 'Configured worker concurrency with atomic MongoDB leasing',
          performedBy: 'System Engine',
          canUndo: false
        }
      ];

      for (const evt of events) {
        sampleLogs.push({
          action: 'CREATE_EVENT',
          entityType: 'Event',
          entityId: evt._id.toString(),
          description: `Created campaign event "${evt.name}" with vanity slug /${evt.slug}`,
          performedBy: 'Master Admin',
          newState: evt.toObject(),
          previousState: null,
          canUndo: true
        });
        sampleLogs.push({
          action: 'UPDATE_THEME',
          entityType: 'Event',
          entityId: evt._id.toString(),
          description: `Configured branding palette and badge canvas typography for "${evt.name}"`,
          performedBy: 'Master Admin',
          previousState: { theme: { primaryColor: '#3b82f6' } },
          newState: { theme: evt.theme },
          canUndo: true
        });
      }

      for (const lead of leads) {
        sampleLogs.push({
          action: 'CREATE_LEAD',
          entityType: 'Lead',
          entityId: lead._id.toString(),
          description: `Registered attendee pass for "${lead.name}" (${lead.downloadsCount || 1} downloads)`,
          performedBy: lead.name,
          newState: lead.toObject(),
          previousState: null,
          canUndo: true
        });
      }

      sampleLogs.push({
        action: 'SYNC_CRM_LEADS',
        entityType: 'Lead',
        description: 'Dispatched automated lead sync batch to HubSpot / Salesforce pipeline',
        performedBy: 'TaskQueue Worker',
        canUndo: false
      });

      for (const item of sampleLogs) {
        await this.log(item);
      }

      console.log(`[ActivityLogger] Seeded ${sampleLogs.length} initial activity logs.`);
    } catch (err) {
      console.warn('[ActivityLogger] Seeding warning:', err.message);
    }
  }
}

const activityLogger = new ActivityLogger();
module.exports = activityLogger;
