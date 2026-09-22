const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Lead = require('../models/Lead');
const Moment = require('../models/Moment');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// ==========================================
// 1. DIRECTORY SETUP & MULTER CONFIGURATION
// ==========================================

// A. Custom Frames Setup
const framesDir = path.join(__dirname, '../uploads/frames');
if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

const frameStorage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, framesDir); },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1000);
    const ext = path.extname(file.originalname) || '.png';
    cb(null, 'frame_' + uniqueSuffix + ext);
  }
});
const frameUpload = multer({ storage: frameStorage });

// B. Event Moments Setup
const momentsDir = path.join(__dirname, '../uploads/moments');
if (!fs.existsSync(momentsDir)) fs.mkdirSync(momentsDir, { recursive: true });

const momentStorage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, momentsDir); },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1000);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'moment_' + uniqueSuffix + ext);
  }
});
const momentUpload = multer({ storage: momentStorage });

// ==========================================
// 2. CORE EVENT ROUTES
// ==========================================

// Get all events
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search,$options: 'i' } },
        { venue: { $regex: search,$options: 'i' } },
        { slug: { $regex: search,$options: 'i' } }
      ];
    }

    const events = await Event.find(query).sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get event by Slug or ID
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
    const event = isObjectId
      ? await Event.findById(identifier)
      : await Event.findOne({ slug: identifier });

    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Event
router.post('/', async (req, res) => {
  try {
    const { name, slug } = req.body;
    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const existing = await Event.findOne({ slug: generatedSlug });
    if (existing) return res.status(400).json({ error: 'Event slug already in use' });

    const event = new Event({ ...req.body, slug: generatedSlug });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update Event
router.put('/:id', async (req, res) => {
  try {
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true
    });
    if (!updated) return res.status(404).json({ error: 'Event not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get Event Leads
router.get('/:id/leads', async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = { event: req.params.id };

    if (role && role !== 'All') query.role = role.toLowerCase();
    if (search) {
      query.$or = [
        { name: { $regex: search,$options: 'i' } },
        { company: { $regex: search,$options: 'i' } },
        { title: { $regex: search,$options: 'i' } }
      ];
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. CUSTOM FRAMES UPLOAD ROUTES
// ==========================================

// Upload Custom Frame
router.post('/:id/frames', frameUpload.single('frameImage'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (!req.file) {
      return res.status(400).json({ error: 'No image file was received by the server' });
    }

    const label = req.body.label || 'Custom Frame';
    const publicUrl = `/api/uploads/frames/${req.file.filename}`; // Clean relative URL

    event.customFrames.push({ url: publicUrl, label });
    await event.save();
    
    res.status(201).json(event.customFrames);
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Custom Frame
router.delete('/:id/frames/:frameId', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const frameToDelete = event.customFrames.find(f => f._id.toString() === req.params.frameId);

    // Physically delete the file from VPS disk
    if (frameToDelete) {
      const filename = frameToDelete.url.split('/').pop();
      const filePath = path.join(__dirname, '../uploads/frames', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // Remove from MongoDB
    event.customFrames = event.customFrames.filter(f => f._id.toString() !== req.params.frameId);
    await event.save();

    res.json({ success: true, customFrames: event.customFrames });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. EVENT MOMENTS (GALLERY) ROUTES
// ==========================================

// Fetch Moments for Gallery
router.get('/:id/moments', async (req, res) => {
  try {
    const moments = await Moment.find({ event: req.params.id }).sort({ createdAt: -1 });
    res.json(moments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload Event Moment
router.post('/:id/moments', momentUpload.single('momentImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file was received by the server' });
    }

    const publicUrl = `/api/uploads/moments/${req.file.filename}`;
    const { title, location, timeString, credit, identifiedPeople } = req.body;

    const moment = new Moment({
      event: req.params.id,
      imageUrl: publicUrl,
      title,
      location,
      timeString,
      credit,
      identifiedPeople
    });

    await moment.save();
    res.status(201).json(moment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Event Moment
router.delete('/:id/moments/:momentId', async (req, res) => {
  try {
    const moment = await Moment.findById(req.params.momentId);
    if (!moment) return res.status(404).json({ error: 'Moment not found' });

    // Physically delete the file from VPS disk
    const filename = moment.imageUrl.split('/').pop();
    const filePath = path.join(__dirname, '../uploads/moments', filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Delete from MongoDB
    await Moment.findByIdAndDelete(req.params.momentId);
    res.json({ success: true, message: 'Moment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;