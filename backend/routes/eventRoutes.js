const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Lead = require('../models/Lead');
const upload = require('../middleware/upload');
const Moment = require('../models/Moment');

// 1. Get all events
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(query).sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get event by Slug or ID
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

// 3. Create Event
router.post('/', async (req, res) => {
  
  try {
    const { name, slug } = req.body;
    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const existing = await Event.findOne({ slug: generatedSlug });
    if (existing) {
      return res.status(400).json({ error: 'Event slug already in use' });
    }

    const event = new Event({ ...req.body, slug: generatedSlug });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Update Event
router.put('/:id', async (req, res) => {
  try {
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) return res.status(404).json({ error: 'Event not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Admin Upload Custom Frame to Event
router.post('/:id/frames', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const { url, label } = req.body; // 'url' here is the Base64 string from React
    
    // 1. Ensure the uploads directory exists on your VPS
    const framesDir = path.join(__dirname, '../uploads/frames');
    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }

    // 2. Decode the Base64 string
    const matches = url.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 image string' });
    }
    
    const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');
    const filename = `frame_${Date.now()}_${Math.round(Math.random() * 1000)}.${extension}`;
    const filePath = path.join(framesDir, filename);

    // 3. Write the physical file to your VPS disk
    fs.writeFileSync(filePath, imageBuffer);

    // 4. Generate the public URL (e.g., http://localhost:5000/uploads/frames/frame_123.png)
    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/frames/${filename}`;

    // 5. Save the clean URL to MongoDB
    event.customFrames.push({ url: publicUrl, label });
    await event.save();
    
    res.status(201).json(event.customFrames);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Delete Custom Frame
router.delete('/:id/frames/:frameId', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    event.customFrames = event.customFrames.filter(
      (frame) => frame._id.toString() !== req.params.frameId
    );
    await event.save();
    res.json({ message: 'Frame deleted', customFrames: event.customFrames });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Get Event Leads
router.get('/:id/leads', async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = { event: req.params.id };

    if (role && role !== 'All') {
      query.role = role.toLowerCase();
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NEW: Upload an Event Moment
router.post('/:id/moments', async (req, res) => {
  try {
    const moment = new Moment({
      event: req.params.id,
      imageUrl: req.body.imageUrl
    });
    await moment.save();
    res.status(201).json(moment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NEW: Get all Event Moments
router.post('/:id/moments', async (req, res) => {
  try {
    const { imageUrl, title, location, timeString, credit, identifiedPeople } = req.body;
    
    const moment = new Moment({
      event: req.params.id,
      imageUrl,
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

// NEW: Delete an Event Moment
router.delete('/:id/moments/:momentId', async (req, res) => {
  try {
    await Moment.findByIdAndDelete(req.params.momentId);
    res.json({ success: true, message: 'Moment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NEW: Upload a Custom Frame to an Event
router.post('/:id/frames', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const { url, label } = req.body;
    event.customFrames.push({ url, label });
    await event.save();
    
    res.status(201).json(event.customFrames);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NEW: Delete a Custom Frame
router.delete('/:id/frames/:frameId', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Find the frame to delete
    const frameToDelete = event.customFrames.find(f => f._id.toString() === req.params.frameId);
    
    if (frameToDelete) {
      // Extract the filename from the URL and delete the physical file
      const filename = frameToDelete.url.split('/').pop();
      const filePath = path.join(__dirname, '../uploads/frames', filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Remove from MongoDB
    event.customFrames = event.customFrames.filter(f => f._id.toString() !== req.params.frameId);
    await event.save();
    
    res.json({ success: true, customFrames: event.customFrames });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;