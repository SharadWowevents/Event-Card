const os = require('os');
const Task = require('../models/Task');
const Lead = require('../models/Lead');
const Event = require('../models/Event');

class TaskQueue {
  constructor() {
    this.workerId = `worker-${process.pid}-${os.hostname()}-${Date.now().toString(36)}`;
    this.handlers = new Map();
    this.isRunning = false;
    this.isStopping = false;
    this.activeWorkers = 0;
    this.concurrency = 2;
    this.pollIntervalMs = 1000;
    this.lockTimeoutMs = 30000; // 30s lock timeout before considered zombie
    this.zombieCheckIntervalMs = 15000; // Recheck for crashed tasks every 15s
    this.pollTimer = null;
    this.reaperTimer = null;
    this.startedAt = null;

    // Register standard default handlers
    this.registerDefaultHandlers();
  }

  /**
   * Register a task handler function for a specific task type.
   * @param {string} type - Task type string (e.g. 'SYNC_CRM_LEADS')
   * @param {Function} handlerFn - async (payload, context) => result
   */
  registerHandler(type, handlerFn) {
    if (typeof handlerFn !== 'function') {
      throw new Error(`Handler for ${type} must be a function`);
    }
    this.handlers.set(type, handlerFn);
    console.log(`[TaskQueue] Registered handler for task type: ${type}`);
  }

  /**
   * Register default system task handlers
   */
  registerDefaultHandlers() {
    // 1. CRM Leads Sync
    this.registerHandler('SYNC_CRM_LEADS', async (payload, ctx) => {
      const { eventId, targetCrm = 'HubSpot / Salesforce' } = payload;
      let leads = [];
      let eventName = 'All Events';

      if (eventId) {
        const event = await Event.findById(eventId);
        if (event) eventName = event.name;
        leads = await Lead.find({ event: eventId });
      } else {
        leads = await Lead.find({});
      }

      // Simulate step progress with heartbeat
      await new Promise(r => setTimeout(r, 600));
      await ctx.heartbeat();

      return {
        eventId: eventId || 'all',
        eventName,
        targetCrm,
        leadsProcessed: leads.length,
        syncedCount: leads.length,
        syncedAt: new Date().toISOString()
      };
    });

    // 2. Badge Composite Generation / Background Processing
    this.registerHandler('PROCESS_BADGE_COMPOSITE', async (payload, ctx) => {
      const { leadId } = payload;
      const lead = await Lead.findById(leadId);
      if (!lead) throw new Error(`Lead ${leadId} not found`);

      await new Promise(r => setTimeout(r, 800));
      await ctx.heartbeat();

      return {
        leadId,
        attendeeName: lead.name,
        processedAt: new Date().toISOString(),
        status: 'composite_ready'
      };
    });

    // 3. Export Event Data
    this.registerHandler('EXPORT_EVENT_DATA', async (payload, ctx) => {
      const { eventId, format = 'json' } = payload;
      const event = await Event.findById(eventId);
      if (!event) throw new Error(`Event ${eventId} not found`);

      const leads = await Lead.find({ event: eventId });
      await new Promise(r => setTimeout(r, 700));
      await ctx.heartbeat();

      return {
        eventId,
        eventName: event.name,
        format,
        totalLeads: leads.length,
        downloadUrl: `/api/events/${eventId}/export?format=${format}`,
        generatedAt: new Date().toISOString()
      };
    });

    // 4. Send Pass Notification
    this.registerHandler('SEND_PASS_NOTIFICATION', async (payload) => {
      const { recipientEmail, eventName } = payload;
      await new Promise(r => setTimeout(r, 500));
      return {
        recipientEmail,
        eventName,
        delivered: true,
        deliveredAt: new Date().toISOString()
      };
    });
  }

  /**
   * CRITICAL: Recover in-flight tasks abandoned during server crash or abrupt shutdown.
   * Runs immediately on startup, and periodically via zombie reaper.
   * Any task left in 'processing' state when the server died is restored to 'pending'.
   */
  async recoverAbandonedTasks(reason = 'Server boot / crash recovery', isBoot = false) {
    try {
      // If boot, recover all in-flight tasks from dead process; otherwise only stale locks older than lockTimeoutMs
      const query = isBoot
        ? { status: 'processing' }
        : {
            status: 'processing',
            lockedAt: { $lt: new Date(Date.now() - this.lockTimeoutMs) }
          };

      const abandonedTasks = await Task.find(query);

      if (abandonedTasks.length === 0) {
        return 0;
      }

      console.warn(`[TaskQueue] ⚠️  Found ${abandonedTasks.length} abandoned/in-flight tasks from prior server crash.`);

      let recoveredCount = 0;
      for (const task of abandonedTasks) {
        // If task has exceeded max attempts, fail it gracefully with crash audit
        if (task.attempts >= task.maxAttempts) {
          task.status = 'failed';
          task.error = {
            message: `Task failed: server crashed during execution and max attempts (${task.maxAttempts}) reached.`,
            failedAt: new Date()
          };
        } else {
          // Re-queue task for immediate execution
          task.status = 'pending';
          task.nextRunAt = new Date();
        }

        task.lockedAt = null;
        task.lockedBy = null;
        task.recoveryCount = (task.recoveryCount || 0) + 1;
        task.recoveryLog.push({
          recoveredAt: new Date(),
          reason,
          recoveredBy: this.workerId
        });

        await task.save();
        recoveredCount++;
        console.log(`[TaskQueue] 🛡️  Successfully recovered task: ${task._id} (${task.type}) -> status: ${task.status}`);
      }

      return recoveredCount;
    } catch (err) {
      console.error('[TaskQueue] Error during task recovery sweep:', err);
      return 0;
    }
  }

  /**
   * Enqueue a new persistent task.
   * Immediately persisted to MongoDB to guarantee NO DATA LOSS on server crash.
   */
  async enqueue(type, payload = {}, options = {}) {
    const {
      priority = 0,
      maxAttempts = 3,
      delayMs = 0,
      backoffMultiplierMs = 2000
    } = options;

    const nextRunAt = new Date(Date.now() + Math.max(0, delayMs));

    const task = new Task({
      type,
      payload,
      priority,
      maxAttempts,
      backoffMultiplierMs,
      nextRunAt,
      status: 'pending'
    });

    await task.save();
    console.log(`[TaskQueue] Enqueued task: ${task._id} [${type}] (Priority: ${priority})`);

    // Wake up worker loop immediately
    this.scheduleNextPoll(0);

    return task;
  }

  /**
   * Atomically fetch and lock the highest priority pending task.
   * Concurrency-safe: MongoDB findOneAndUpdate prevents race conditions across workers.
   */
  async claimNextTask() {
    const now = new Date();

    const claimedTask = await Task.findOneAndUpdate(
      {
        status: { $in: ['pending', 'retrying'] },
        nextRunAt: { $lte: now },
        $or: [
          { lockedAt: null },
          { lockedAt: { $lt: new Date(now.getTime() - this.lockTimeoutMs) } }
        ]
      },
      {
        $set: {
          status: 'processing',
          lockedAt: now,
          lockedBy: this.workerId,
          startedAt: now
        },
        $inc: { attempts: 1 }
      },
      {
        sort: { priority: -1, nextRunAt: 1, createdAt: 1 },
        returnDocument: 'after'
      }
    );

    return claimedTask;
  }

  /**
   * Process a single task with error handling, exponential backoff, and state tracking.
   */
  async processTask(task) {
    const handler = this.handlers.get(task.type);

    if (!handler) {
      task.status = 'failed';
      task.error = {
        message: `No handler registered for task type: ${task.type}`,
        failedAt: new Date()
      };
      task.lockedAt = null;
      task.lockedBy = null;
      await task.save();
      console.error(`[TaskQueue] No handler for type ${task.type}`);
      return;
    }

    const context = {
      task,
      heartbeat: async () => {
        await Task.updateOne(
          { _id: task._id, status: 'processing' },
          { $set: { lockedAt: new Date() } }
        );
      }
    };

    try {
      console.log(`[TaskQueue] 🚀 Worker ${this.workerId} processing task ${task._id} (${task.type}), attempt ${task.attempts}/${task.maxAttempts}`);
      const result = await handler(task.payload, context);

      // Task succeeded
      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date();
      task.lockedAt = null;
      task.lockedBy = null;
      await task.save();

      console.log(`[TaskQueue] ✅ Completed task ${task._id} (${task.type})`);
    } catch (err) {
      console.error(`[TaskQueue] ❌ Failed task ${task._id} (${task.type}) attempt ${task.attempts}:`, err.message);

      const hasRetriesLeft = task.attempts < task.maxAttempts;

      if (hasRetriesLeft) {
        task.status = 'retrying';
        // Exponential backoff: base * 2^(attempts - 1)
        const backoffDelay = (task.backoffMultiplierMs || 2000) * Math.pow(2, task.attempts - 1);
        task.nextRunAt = new Date(Date.now() + backoffDelay);
        console.log(`[TaskQueue] ⏳ Retrying task ${task._id} in ${backoffDelay}ms`);
      } else {
        task.status = 'failed';
        console.warn(`[TaskQueue] 🛑 Task ${task._id} permanently failed after ${task.attempts} attempts`);
      }

      task.error = {
        message: err.message,
        stack: err.stack,
        failedAt: new Date()
      };
      task.lockedAt = null;
      task.lockedBy = null;
      await task.save();
    }
  }

  /**
   * Main worker poll step
   */
  async poll() {
    if (!this.isRunning || this.isStopping) return;

    if (this.activeWorkers >= this.concurrency) {
      this.scheduleNextPoll(this.pollIntervalMs);
      return;
    }

    try {
      while (this.activeWorkers < this.concurrency && this.isRunning && !this.isStopping) {
        const task = await this.claimNextTask();
        if (!task) break;

        this.activeWorkers++;
        this.processTask(task)
          .catch((err) => {
            console.error('[TaskQueue] Unexpected worker execution error:', err);
          })
          .finally(() => {
            this.activeWorkers--;
            // Check immediately for more tasks
            if (this.isRunning && !this.isStopping) {
              this.scheduleNextPoll(0);
            }
          });
      }
    } catch (err) {
      console.error('[TaskQueue] Error in poll cycle:', err);
    }

    this.scheduleNextPoll(this.pollIntervalMs);
  }

  scheduleNextPoll(delayMs = 1000) {
    if (this.pollTimer) clearTimeout(this.pollTimer);
    if (!this.isRunning || this.isStopping) return;

    this.pollTimer = setTimeout(() => {
      this.poll();
    }, delayMs);
  }

  /**
   * Start the task queue engine.
   * Performs crash recovery immediately before processing new tasks.
   */
  async start(options = {}) {
    if (this.isRunning) return;

    if (options.concurrency) this.concurrency = options.concurrency;
    if (options.pollIntervalMs) this.pollIntervalMs = options.pollIntervalMs;
    if (options.lockTimeoutMs) this.lockTimeoutMs = options.lockTimeoutMs;

    this.isRunning = true;
    this.isStopping = false;
    this.startedAt = new Date();

    console.log(`[TaskQueue] Starting Task Queue engine [Worker: ${this.workerId}]`);

    // 1. Immediately recover any tasks left hanging by a crash or restart
    const recovered = await this.recoverAbandonedTasks('Server boot crash recovery', true);
    if (recovered > 0) {
      console.log(`[TaskQueue] 🛡️ Restored ${recovered} task(s) from previous server crash. Zero task loss guaranteed!`);
    }

    // 2. Start polling
    this.scheduleNextPoll(100);

    // 3. Start zombie reaper timer
    this.reaperTimer = setInterval(() => {
      this.recoverAbandonedTasks('Periodic zombie lock lease reaper', false);
    }, this.zombieCheckIntervalMs);

    // 4. Attach graceful shutdown handlers
    this.attachShutdownHandlers();
  }

  /**
   * Graceful shutdown:
   * Stop claiming tasks, release active locks back to 'pending' so next server boot or peer node picks them up.
   */
  async stop(timeoutMs = 4000) {
    if (!this.isRunning || this.isStopping) return;
    this.isStopping = true;
    console.log(`[TaskQueue] Stopping task queue engine gracefully...`);

    if (this.pollTimer) clearTimeout(this.pollTimer);
    if (this.reaperTimer) clearInterval(this.reaperTimer);

    // Wait for in-flight tasks or timeout
    const startTime = Date.now();
    while (this.activeWorkers > 0 && (Date.now() - startTime) < timeoutMs) {
      await new Promise(r => setTimeout(r, 200));
    }

    // Release any tasks still locked by this worker back to pending
    try {
      const resetResult = await Task.updateMany(
        { status: 'processing', lockedBy: this.workerId },
        {
          $set: {
            status: 'pending',
            lockedAt: null,
            lockedBy: null,
            nextRunAt: new Date()
          },
          $push: {
            recoveryLog: {
              recoveredAt: new Date(),
              reason: 'Graceful worker shutdown reset',
              recoveredBy: this.workerId
            }
          }
        }
      );
      if (resetResult.modifiedCount > 0) {
        console.log(`[TaskQueue] Released ${resetResult.modifiedCount} in-flight tasks back to pending on shutdown.`);
      }
    } catch (err) {
      console.error('[TaskQueue] Error releasing locks during shutdown:', err);
    }

    this.isRunning = false;
    this.isStopping = false;
    console.log(`[TaskQueue] Task Queue stopped cleanly.`);
  }

  attachShutdownHandlers() {
    const handleSignal = async (signal) => {
      console.log(`[TaskQueue] Received ${signal}. Initiating shutdown...`);
      await this.stop();
    };

    process.once('SIGINT', () => handleSignal('SIGINT'));
    process.once('SIGTERM', () => handleSignal('SIGTERM'));
  }

  /**
   * Get queue statistics and health metrics
   */
  async getStats() {
    const counts = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsMap = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      retrying: 0
    };

    counts.forEach(c => {
      if (statsMap[c._id] !== undefined) {
        statsMap[c._id] = c.count;
      }
    });

    const totalRecoveredAgg = await Task.aggregate([
      { $group: { _id: null, totalRecoveries: { $sum: '$recoveryCount' } } }
    ]);
    const totalRecoveries = totalRecoveredAgg[0] ? totalRecoveredAgg[0].totalRecoveries : 0;

    const totalTasks = Object.values(statsMap).reduce((a, b) => a + b, 0);

    return {
      status: this.isRunning ? 'running' : 'stopped',
      workerId: this.workerId,
      concurrency: this.concurrency,
      activeWorkers: this.activeWorkers,
      uptimeSeconds: this.startedAt ? Math.round((Date.now() - this.startedAt.getTime()) / 1000) : 0,
      stats: {
        ...statsMap,
        total: totalTasks,
        totalRecoveries
      }
    };
  }
}

// Singleton instance
const taskQueue = new TaskQueue();

module.exports = taskQueue;
