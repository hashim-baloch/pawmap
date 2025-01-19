const mongoose = require('mongoose');

const volunteerResponseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question1: { type: String, required: true },
  question2: { type: String, required: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model('VolunteerResponse', volunteerResponseSchema);
