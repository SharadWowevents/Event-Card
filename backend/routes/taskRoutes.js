const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const taskQueue = require('../services/taskQueue');

// 1. Get Task Queue Health and Statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await taskQueue.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. List Tasks with Filters & Pagination
router.get('/', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Task.countDocuments(query)
    ]);

    res.json({
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Single Task Details
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Enqueue a New Persistent Task
router.post('/enqueue', async (req, res) => {
  try {
    const { type, payload = {}, priority = 0, maxAttempts = 3, delayMs = 0 } = req.body;

    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: 'Field "type" is required.' });
    }

    const task = await taskQueue.enqueue(type, payload, {
      priority: Number(priority) || 0,
      maxAttempts: Number(maxAttempts) || 3,
      delayMs: Number(delayMs) || 0
    });

    res.status(201).json({
      success: true,
      message: 'Task persisted and enqueued successfully. Zero loss on crash guaranteed.',
      task
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Retry a Failed or Stalled Task
router.post('/:id/retry', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.status = 'pending';
    task.attempts = 0;
    task.nextRunAt = new Date();
    task.lockedAt = null;
    task.lockedBy = null;
    task.error = undefined;
    task.startedAt = null;
    task.completedAt = null;
    task.recoveryLog.push({
      recoveredAt: new Date(),
      reason: 'Manual user retry requested',
      recoveredBy: 'API'
    });

    await task.save();
    taskQueue.scheduleNextPoll(0);

    res.json({ success: true, message: 'Task re-queued for execution', task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Trigger Crash Recovery Sweep On-Demand
router.post('/recover', async (req, res) => {
  try {
    const recoveredCount = await taskQueue.recoverAbandonedTasks('Manual API recovery trigger');
    res.json({
      success: true,
      recoveredCount,
      message: `Crash recovery complete: ${recoveredCount} abandoned task(s) restored.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Delete Task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Clear Completed Tasks
router.post('/clear-completed', async (req, res) => {
  try {
    const result = await Task.deleteMany({ status: 'completed' });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

