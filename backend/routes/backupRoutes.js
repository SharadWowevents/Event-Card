const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const backupService = require('../services/backupService');
const Backup = require('../models/Backup');
const { requireSuperAdmin } = require('../middleware/auth');

// Restrict all Backup & Restore routes to Super Admin only
router.use(requireSuperAdmin);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// 1. Get all backups list
router.get('/', async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    res.json(backups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get auto-backup configuration
router.get('/config', async (req, res) => {
  try {
    const config = await backupService.getConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update auto-backup configuration
router.post('/config', async (req, res) => {
  try {
    const { autoBackupEnabled, frequency } = req.body;
    const config = await backupService.updateConfig({ autoBackupEnabled, frequency });
    res.json({ success: true, config });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Create manual backup
router.post('/create', async (req, res) => {
  try {
    const createdBy = req.body.createdBy || 'Admin';
    const backup = await backupService.createBackup({ type: 'manual', createdBy });
    res.status(201).json({ success: true, backup });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Restore from existing stored backup
router.post('/:id/restore', async (req, res) => {
  try {
    const performedBy = req.body.performedBy || 'Admin';
    const summary = await backupService.restoreBackupById(req.params.id, performedBy);
    res.json({
      success: true,
      message: `Restored successfully: ${summary.updatedCount} records overwritten, ${summary.insertedCount} new records inserted. (Zero existing records deleted)`,
      summary
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Upload a backup JSON file from user PC and restore non-destructively
router.post('/upload-restore', upload.single('backupFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No backup file uploaded' });
    }

    const jsonString = req.file.buffer.toString('utf8');
    const parsedData = JSON.parse(jsonString);

    const performedBy = req.body.performedBy || 'Admin';
    const summary = await backupService.restoreFromData(parsedData, performedBy);

    res.json({
      success: true,
      message: `Uploaded backup restored successfully: ${summary.updatedCount} overwritten, ${summary.insertedCount} inserted. (Zero existing data deleted)`,
      summary
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Invalid backup JSON file' });
  }
});

// 7. Download a backup file
router.get('/:id/download', async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    if (!backup) return res.status(404).json({ error: 'Backup not found' });
    if (!fs.existsSync(backup.filepath)) {
      return res.status(404).json({ error: 'Backup file missing on disk' });
    }

    res.download(backup.filepath, backup.filename);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Delete a backup
router.delete('/:id', async (req, res) => {
  try {
    const result = await backupService.deleteBackup(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

