const mongoose = require('mongoose');

const PracticeSessionSchema = new mongoose.Schema({
  quizType: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  accuracy: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PracticeSession', PracticeSessionSchema);
