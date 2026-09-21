const mongoose = require('mongoose');

const momentSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    imageUrl: { type: String, required: true }, 
    title: { type: String, default: 'Event Moment' },
    location: { type: String, default: 'Main Venue' },
    timeString: { type: String, default: 'Day 1' },
    credit: { type: String, default: 'Event Photography' },
    identifiedPeople: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
  }
);

module.exports = mongoose.model('Moment', momentSchema);