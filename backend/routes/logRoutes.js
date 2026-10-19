const express = require('express');
const router = express.Router();
const activityLogger = require('../services/activityLogger');
const ActivityLog = require('../models/ActivityLog');
const { requireSuperAdmin } = require('../middleware/auth');

// Restrict all Activity Logs routes to Super Admin only
router.use(requireSuperAdmin);

// 1. Fetch the last 500 activity logs (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { limit = 500, entityType, action, search } = req.query;
    const result = await activityLogger.getLogs({ limit, entityType, action, search });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Undo a specific activity log
router.post('/:id/undo', async (req, res) => {
  try {
    const performedBy = req.body.performedBy || 'Admin';
    const result = await activityLogger.undo(req.params.id, performedBy);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Clear logs (keeps recent 50 for safety)
router.post('/clear', async (req, res) => {
  try {
    const total = await ActivityLog.countDocuments();
    if (total > 50) {
      const logsToKeep = await ActivityLog.find().sort({ createdAt: -1 }).limit(50).select('_id');
      const keepIds = logsToKeep.map(l => l._id);
      await ActivityLog.deleteMany({ _id: { $nin: keepIds } });
    }
    res.json({ success: true, message: 'Older activity logs cleared, latest 50 preserved.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

