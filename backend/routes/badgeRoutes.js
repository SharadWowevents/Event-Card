const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Event = require('../models/Event');

// CPM Benchmark ($28.50 per 1k impressions, ~115 impressions/share)
const CPM_BENCHMARK = 28.50;
const IMPRESSIONS_PER_SHARE = 115;

// 1. Submit/Generate Attendee Badge
// backend/routes/badgeRoutes.js
// Look for the "Submit/Generate Attendee Badge" route and update the destructured body and Lead object:

router.post('/', async (req, res) => {
  try {
    // 1. Add "role" to the destructured body
    const { eventId, name, email, mobile, title, company, role, customQuote, avatarUrl, themeStyle, customFrameUrl } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const lead = new Lead({
      event: eventId,
      name,
      email,
      mobile,
      title,
      company,
      role, // 2. Pass the role to the Lead model
      customQuote,
      avatarUrl,
      themeStyle,
      customFrameUrl,
      downloadsCount: 1
    });

    await lead.save();

    event.postersCount += 1;
    await event.save();

    res.status(201).json({ success: true, lead });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2. Track Social Share or Download Action
// 2. Track Social Share or Download Action
router.post('/:leadId/track', async (req, res) => {
  try {
    const { action, platform } = req.body; 
    const lead = await Lead.findById(req.params.leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const event = await Event.findById(lead.event);

    if (action === 'download') {
      lead.downloadsCount += 1;
      // Add Direct Download to platforms if not already there
      if (!lead.platformsShared.includes('Direct Download')) {
        lead.platformsShared.push('Direct Download');
      }
    } else if (action === 'share') {
      lead.sharesCount += 1;
      
      // Add the new social platform to the array
      if (platform && !lead.platformsShared.includes(platform)) {
        lead.platformsShared.push(platform);
      }

      if (event) {
        event.sharesCount += 1;
        const estimatedReach = event.sharesCount * 115;
        event.emvValue = Math.round((estimatedReach / 1000) * 28.50);
        await event.save();
      }
    }

    await lead.save();
    res.json({ success: true, lead, emvValue: event ? event.emvValue : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ... (keep your existing POST / and POST /:leadId/track routes) ...

// NEW: Save the finalized composite poster
router.put('/:leadId/composite', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    lead.finalBadgeUrl = req.body.finalBadgeUrl;
    await lead.save();
    
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;