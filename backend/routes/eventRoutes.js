const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Lead = require('../models/Lead');
const Moment = require('../models/Moment');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// ==========================================
// 1. UTILITIES & DIRECTORY SETUP
// ==========================================

// Utility to escape regex inputs (Prevents ReDoS attacks)
const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

// File filter to ensure ONLY images are uploaded to the server
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPG, PNG, WEBP, GIF) are allowed.'));
  }
};

// Directory Creator Utility
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const framesDir = path.join(__dirname, '../uploads/frames');
const bgDir = path.join(__dirname, '../uploads/backgrounds');
const momentsDir = path.join(__dirname, '../uploads/moments');

ensureDir(framesDir);
ensureDir(bgDir);
ensureDir(momentsDir);

// ==========================================
// 2. MULTER CONFIGURATIONS
// ==========================================

const createStorage = (destinationDir, prefix) => multer.diskStorage({
  destination: function (req, file, cb) { cb(null, destinationDir); },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1000);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${prefix}_${uniqueSuffix}${ext}`);
  }
});

const frameUpload = multer({ storage: createStorage(framesDir, 'frame'), fileFilter: imageFileFilter });
const bgUpload = multer({ storage: createStorage(bgDir, 'bg'), fileFilter: imageFileFilter });
const momentUpload = multer({ storage: createStorage(momentsDir, 'moment'), fileFilter: imageFileFilter });

// ==========================================
// 3. CORE EVENT ROUTES
// ==========================================

// Get all events
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status && status !== 'all') query.status = status;
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: safeSearch,$options: 'i' } },
        { venue: { $regex: safeSearch,$options: 'i' } },
        { slug: { $regex: safeSearch,$options: 'i' } }
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
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
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
      returnDocument: 'after', // Replaced 'returnDocument: after' with standard Mongoose 'new: true'
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
      const safeSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: safeSearch,$options: 'i' } },
        { company: { $regex: safeSearch,$options: 'i' } },
        { title: { $regex: safeSearch,$options: 'i' } }
      ];
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. CUSTOM FRAMES UPLOAD ROUTES
// ==========================================

// Upload Custom Frame
router.post('/:id/frames', frameUpload.single('frameImage'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (!req.file) {
      return res.status(400).json({ error: 'No valid image file was received.' });
    }

    const label = req.body.label || 'Custom Frame';
    const publicUrl = `/api/uploads/frames/${req.file.filename}`;

    event.customFrames.push({ url: publicUrl, label });
    await event.save();
    
    res.status(201).json(event.customFrames);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Custom Frame
router.delete('/:id/frames/:frameId', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const frameToDelete = event.customFrames.find(f => f._id.toString() === req.params.frameId);

    // Physically delete the file safely
    if (frameToDelete && frameToDelete.url) {
      const filename = path.basename(frameToDelete.url); // Safer than split('/').pop()
      const filePath = path.join(framesDir, filename);
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
// 5. EVENT MOMENTS (GALLERY) ROUTES
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
      return res.status(400).json({ error: 'No valid image file was received.' });
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

    // Physically delete the file safely
    if (moment.imageUrl) {
      const filename = path.basename(moment.imageUrl);
      const filePath = path.join(momentsDir, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // Delete from MongoDB
    await Moment.findByIdAndDelete(req.params.momentId);
    res.json({ success: true, message: 'Moment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload Attendee Page Background Image
router.post('/:id/background', bgUpload.single('backgroundImage'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (!req.file) return res.status(400).json({ error: 'No valid image file received' });

    // Prevent Storage Leaks: Delete the old background image if it exists before saving the new one
    if (event.theme && event.theme.backgroundImageUrl) {
      const oldFilename = path.basename(event.theme.backgroundImageUrl);
      const oldFilePath = path.join(bgDir, oldFilename);
      if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
    }

    const publicUrl = `/api/uploads/backgrounds/${req.file.filename}`;

    if (!event.theme) event.theme = {};
    event.theme.backgroundImageUrl = publicUrl;
    event.theme.backgroundType = 'image';

    await event.save();
    res.status(201).json({ url: publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;