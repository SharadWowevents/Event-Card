const fs = require('fs');
const path = require('path');
const Backup = require('../models/Backup');
const BackupConfig = require('../models/BackupConfig');
const Event = require('../models/Event');
const Lead = require('../models/Lead');
const Moment = require('../models/Moment');
const User = require('../models/User');
const Task = require('../models/Task');
const activityLogger = require('./activityLogger');

const backupsDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

class BackupService {
  constructor() {
    this.schedulerTimer = null;
    this.checkIntervalMs = 60 * 1000; // Check every 60s
  }

  /**
   * Helper to convert frequency string to hours.
   */
  frequencyToHours(freq) {
    switch (freq) {
      case '1h': return 1;
      case '6h': return 6;
      case '12h': return 12;
      case '24h': return 24;
      case 'weekly': return 168;
      default: return 6;
    }
  }

  /**
   * Get or initialize the singleton BackupConfig.
   */
  async getConfig() {
    let config = await BackupConfig.findOne();
    if (!config) {
      const defaultHours = 6;
      config = new BackupConfig({
        autoBackupEnabled: true,
        frequency: '6h',
        intervalHours: defaultHours,
        nextBackupAt: new Date(Date.now() + defaultHours * 60 * 60 * 1000)
      });
      await config.save();
    }
    return config;
  }

  /**
   * Update auto-backup configuration.
   */
  async updateConfig({ autoBackupEnabled, frequency }) {
    const config = await this.getConfig();

    if (autoBackupEnabled !== undefined) {
      config.autoBackupEnabled = Boolean(autoBackupEnabled);
    }

    if (frequency) {
      config.frequency = frequency;
      config.intervalHours = this.frequencyToHours(frequency);
    }

    // Recalculate nextBackupAt
    config.nextBackupAt = new Date(Date.now() + config.intervalHours * 60 * 60 * 1000);
    await config.save();

    await activityLogger.log({
      action: 'UPDATE_BACKUP_CONFIG',
      entityType: 'Backup',
      description: `Updated auto-backup schedule: ${config.autoBackupEnabled ? 'Enabled' : 'Disabled'} (${config.frequency})`,
      performedBy: 'Admin',
      canUndo: false,
      metadata: { frequency: config.frequency, autoBackupEnabled: config.autoBackupEnabled }
    });

    return config;
  }

  /**
   * Create a database backup snapshot (manual or auto).
   */
  async createBackup({ type = 'manual', createdBy = 'Admin' } = {}) {
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${type}-${dateStr}.json`;
    const filepath = path.join(backupsDir, filename);

    try {
      // Gather data across all core collections
      const [events, leads, moments, users, tasks] = await Promise.all([
        Event.find().lean(),
        Lead.find().lean(),
        Moment.find().lean(),
        User.find().select('-password').lean(),
        Task.find().limit(200).lean()
      ]);

      const stats = {
        eventsCount: events.length,
        leadsCount: leads.length,
        momentsCount: moments.length,
        usersCount: users.length,
        tasksCount: tasks.length,
        totalRecords: events.length + leads.length + moments.length + users.length + tasks.length
      };

      const backupData = {
        version: '1.0',
        type,
        createdAt: timestamp.toISOString(),
        createdBy,
        stats,
        data: {
          events,
          leads,
          moments,
          users,
          tasks
        }
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      fs.writeFileSync(filepath, jsonStr, 'utf8');
      const sizeBytes = Buffer.byteLength(jsonStr, 'utf8');

      // Save record in MongoDB
      const backupDoc = new Backup({
        filename,
        filepath,
        type,
        sizeBytes,
        stats,
        status: 'completed',
        createdBy
      });
      await backupDoc.save();

      // Update next backup time on config if auto or manual
      const config = await this.getConfig();
      config.lastBackupAt = timestamp;
      if (type === 'auto') {
        config.nextBackupAt = new Date(Date.now() + config.intervalHours * 60 * 60 * 1000);
      }
      await config.save();

      // Log in ActivityLog
      await activityLogger.log({
        action: 'CREATE_BACKUP',
        entityType: 'Backup',
        entityId: backupDoc._id.toString(),
        description: `Created ${type.toUpperCase()} snapshot "${filename}" (${stats.totalRecords} records, ${(sizeBytes / 1024).toFixed(1)} KB)`,
        performedBy: createdBy,
        canUndo: false,
        metadata: { filename, stats, sizeBytes }
      });

      console.log(`[BackupService] ✅ Created ${type} backup: ${filename} (${stats.totalRecords} records)`);
      return backupDoc;
    } catch (err) {
      console.error('[BackupService] ❌ Backup creation failed:', err);

      const failedDoc = new Backup({
        filename,
        filepath,
        type,
        status: 'failed',
        error: err.message,
        createdBy
      });
      await failedDoc.save();
      throw err;
    }
  }

  /**
   * CRITICAL RESTORE METHOD:
   * Rule: "when user restore any backup then old data should NOT be removed or deleted but CAN overwrite."
   *
   * Upserts/merges records matching the backup, while leaving existing unreferenced records untouched!
   */
  async restoreFromData(backupJson, performedBy = 'Admin') {
    if (!backupJson || !backupJson.data) {
      throw new Error('Invalid backup file structure: missing data payload');
    }

    const { events = [], leads = [], moments = [], users = [], tasks = [] } = backupJson.data;

    let updatedCount = 0;
    let insertedCount = 0;

    // 1. Restore / Overwrite Events
    for (const evt of events) {
      const id = evt._id;
      delete evt.__v;

      const existing = await Event.findById(id);
      if (existing) {
        await Event.findByIdAndUpdate(id, evt, { returnDocument: 'after' });
        updatedCount++;
      } else {
        const newEvt = new Event(evt);
        await newEvt.save();
        insertedCount++;
      }
    }

    // 2. Restore / Overwrite Leads
    for (const lead of leads) {
      const id = lead._id;
      delete lead.__v;

      const existing = await Lead.findById(id);
      if (existing) {
        await Lead.findByIdAndUpdate(id, lead, { returnDocument: 'after' });
        updatedCount++;
      } else {
        const newLead = new Lead(lead);
        await newLead.save();
        insertedCount++;
      }
    }

    // 3. Restore / Overwrite Moments
    for (const moment of moments) {
      const id = moment._id;
      delete moment.__v;

      const existing = await Moment.findById(id);
      if (existing) {
        await Moment.findByIdAndUpdate(id, moment, { returnDocument: 'after' });
        updatedCount++;
      } else {
        const newMoment = new Moment(moment);
        await newMoment.save();
        insertedCount++;
      }
    }

    // 4. Restore / Overwrite Team Users (Safely merge)
    for (const user of users) {
      const id = user._id;
      delete user.__v;

      const existing = await User.findById(id) || await User.findOne({ email: user.email });
      if (existing) {
        // Keep existing password hash if backup omitted it
        if (!user.password) {
          user.password = existing.password;
        }
        await User.findByIdAndUpdate(existing._id, user, { returnDocument: 'after' });
        updatedCount++;
      } else {
        if (user.password) {
          const newUser = new User(user);
          await newUser.save();
          insertedCount++;
        }
      }
    }

    const summary = {
      eventsProcessed: events.length,
      leadsProcessed: leads.length,
      momentsProcessed: moments.length,
      usersProcessed: users.length,
      updatedCount,
      insertedCount,
      totalRestored: updatedCount + insertedCount
    };

    // Log the restore event
    await activityLogger.log({
      action: 'RESTORE_BACKUP',
      entityType: 'Backup',
      description: `Restored snapshot non-destructively: ${updatedCount} records overwritten, ${insertedCount} new records inserted. (Zero existing data deleted)`,
      performedBy,
      canUndo: false,
      metadata: summary
    });

    console.log(`[BackupService] 🔄 Non-destructive restore complete: ${updatedCount} overwritten, ${insertedCount} inserted`);
    return summary;
  }

  /**
   * Restore from an existing stored backup ID.
   */
  async restoreBackupById(backupId, performedBy = 'Admin') {
    const backup = await Backup.findById(backupId);
    if (!backup) throw new Error('Backup record not found');
    if (!fs.existsSync(backup.filepath)) {
      throw new Error(`Backup file "${backup.filename}" not found on disk`);
    }

    const fileContent = fs.readFileSync(backup.filepath, 'utf8');
    const parsed = JSON.parse(fileContent);

    return await this.restoreFromData(parsed, performedBy);
  }

  /**
   * Initialize auto-backup background timer loop.
   */
  async initScheduler() {
    if (this.schedulerTimer) clearInterval(this.schedulerTimer);

    console.log('[BackupService] Initializing auto-backup scheduler...');
    const config = await this.getConfig();
    console.log(`[BackupService] Auto-backup is ${config.autoBackupEnabled ? 'ENABLED' : 'DISABLED'} (Frequency: ${config.frequency}, Next: ${config.nextBackupAt ? new Date(config.nextBackupAt).toLocaleTimeString() : 'N/A'})`);

    this.schedulerTimer = setInterval(async () => {
      try {
        const currentConfig = await this.getConfig();
        if (!currentConfig.autoBackupEnabled) return;

        const now = new Date();
        if (currentConfig.nextBackupAt && now >= new Date(currentConfig.nextBackupAt)) {
          console.log('[BackupService] ⏰ Auto-backup scheduled interval reached. Executing automated snapshot...');
          await this.createBackup({ type: 'auto', createdBy: 'Auto-Scheduler' });
        }
      } catch (err) {
        console.error('[BackupService] Error in auto-backup scheduler cycle:', err);
      }
    }, this.checkIntervalMs);
  }

  /**
   * List all stored backups.
   */
  async listBackups() {
    return await Backup.find().sort({ createdAt: -1 });
  }

  /**
   * Delete a backup file and record.
   */
  async deleteBackup(backupId) {
    const backup = await Backup.findById(backupId);
    if (!backup) throw new Error('Backup not found');

    if (fs.existsSync(backup.filepath)) {
      try {
        fs.unlinkSync(backup.filepath);
      } catch (e) {
        console.warn('Could not remove physical backup file:', e.message);
      }
    }

    await Backup.findByIdAndDelete(backupId);
    return { success: true, message: `Backup "${backup.filename}" removed.` };
  }
}

const backupService = new BackupService();
module.exports = backupService;

