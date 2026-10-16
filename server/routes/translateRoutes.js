const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');
const Translation = require('../models/Translation');

const PYTHON_ENGINE_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:5001';

// Predict frame by calling Python engine
router.post('/predict', async (req, res) => {
  const { image, mode = 'text', roi } = req.body;
  
  if (!image) {
    return res.status(400).json({ success: false, error: 'No image frame provided' });
  }

  try {
    const response = await axios.post(`${PYTHON_ENGINE_URL}/api/predict_frame`, {
      image,
      mode,
      roi
    }, { timeout: 6000 });

    return res.json(response.data);
  } catch (error) {
    // If Python engine is momentarily unreachable or slow, return friendly fallback status
    console.warn('[Translate API] Python engine unavailable:', error.message);
    return res.status(503).json({
      success: false,
      error: `ISL Python Deep Learning Engine is currently unreachable at ${PYTHON_ENGINE_URL}.`,
      details: error.message
    });
  }
});

// Reset engine state (Text or Calculator mode)
router.post('/reset', async (req, res) => {
  const { mode = 'both' } = req.body;
  try {
    const response = await axios.post(`${PYTHON_ENGINE_URL}/api/reset_mode`, { mode }, { timeout: 3000 });
    return res.json(response.data);
  } catch (err) {
    return res.json({ success: true, message: `Local reset for ${mode}` });
  }
});

// Save translation entry
router.post('/save', async (req, res) => {
  const { source, mode, translatedText, gestures, confidence } = req.body;
  if (!translatedText) {
    return res.status(400).json({ success: false, error: 'translatedText is required' });
  }

  try {
    if (db.isMongo()) {
      const entry = new Translation({
        source: source || 'camera_gesture',
        mode: mode || 'text',
        translatedText,
        gestures: gestures || [],
        confidence: confidence || 0.88,
        timestamp: new Date()
      });
      await entry.save();
      return res.json({ success: true, item: entry });
    } else {
      const store = db.readFallback();
      const newItem = {
        id: 'trans-' + Date.now(),
        source: source || 'camera_gesture',
        mode: mode || 'text',
        translatedText,
        gestures: gestures || [],
        confidence: confidence || 0.88,
        timestamp: new Date().toISOString()
      };
      store.translations.unshift(newItem);
      if (store.translations.length > 100) store.translations.pop();
      db.writeFallback(store);
      return res.json({ success: true, item: newItem });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get translation history
router.get('/history', async (req, res) => {
  try {
    if (db.isMongo()) {
      const history = await Translation.find().sort({ timestamp: -1 }).limit(50);
      return res.json({ success: true, count: history.length, history });
    } else {
      const store = db.readFallback();
      return res.json({ success: true, count: store.translations.length, history: store.translations });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Delete history item
router.delete('/history/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (db.isMongo()) {
      await Translation.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Deleted successfully' });
    } else {
      const store = db.readFallback();
      store.translations = store.translations.filter(t => t.id !== id);
      db.writeFallback(store);
      return res.json({ success: true, message: 'Deleted successfully' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Clear all history
router.delete('/history', async (req, res) => {
  try {
    if (db.isMongo()) {
      await Translation.deleteMany({});
      return res.json({ success: true, message: 'History cleared' });
    } else {
      const store = db.readFallback();
      store.translations = [];
      db.writeFallback(store);
      return res.json({ success: true, message: 'History cleared' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
