const mongoose = require('mongoose');

const TranslationSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['camera_gesture', 'text_to_sign', 'calculator'],
    default: 'camera_gesture'
  },
  mode: {
    type: String,
    enum: ['text', 'calculator', 'dictionary'],
    default: 'text'
  },
  translatedText: {
    type: String,
    required: true
  },
  gestures: [{
    type: String
  }],
  confidence: {
    type: Number,
    default: 0.85
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Translation', TranslationSchema);
