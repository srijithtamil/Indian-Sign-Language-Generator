const express = require('express');
const router = express.Router();
const gesturesList = require('../data/gesturesData');
const db = require('../db');
const PracticeSession = require('../models/PracticeSession');

// Generate randomized quiz questions
router.get('/questions', (req, res) => {
  const count = parseInt(req.query.count) || 5;
  const category = req.query.category || 'all';

  let pool = [...gesturesList];
  if (category !== 'all') {
    pool = pool.filter(g => g.category === category);
  }

  // Shuffle pool
  const shuffled = pool.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(count, pool.length));

  const questions = selected.map((item, idx) => {
    // Generate 3 wrong options
    const otherOptions = pool
      .filter(g => g.id !== item.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(g => g.name);

    const options = [...otherOptions, item.name].sort(() => 0.5 - Math.random());

    return {
      questionId: idx + 1,
      targetGesture: item,
      prompt: `Which ISL sign corresponds to: "${item.name}"?`,
      descriptionHint: item.description,
      correctAnswer: item.name,
      options
    };
  });

  return res.json({
    success: true,
    total: questions.length,
    questions
  });
});

// Submit quiz score
router.post('/submit', async (req, res) => {
  const { quizType = 'general', score, totalQuestions, accuracy } = req.body;

  try {
    if (db.isMongo()) {
      const session = new PracticeSession({
        quizType,
        score: score || 0,
        totalQuestions: totalQuestions || 5,
        accuracy: accuracy || Math.round((score / totalQuestions) * 100),
        timestamp: new Date()
      });
      await session.save();
      return res.json({ success: true, result: session });
    } else {
      const store = db.readFallback();
      const newSession = {
        id: 'quiz-' + Date.now(),
        quizType,
        score: score || 0,
        totalQuestions: totalQuestions || 5,
        accuracy: accuracy || Math.round((score / totalQuestions) * 100),
        timestamp: new Date().toISOString()
      };
      store.practiceSessions.unshift(newSession);
      if (store.practiceSessions.length > 50) store.practiceSessions.pop();
      db.writeFallback(store);
      return res.json({ success: true, result: newSession });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get practice statistics
router.get('/stats', async (req, res) => {
  try {
    let sessions = [];
    if (db.isMongo()) {
      sessions = await PracticeSession.find().sort({ timestamp: -1 }).limit(20);
    } else {
      const store = db.readFallback();
      sessions = store.practiceSessions || [];
    }

    const totalQuizzes = sessions.length;
    const avgAccuracy = totalQuizzes > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.accuracy, 0) / totalQuizzes)
      : 0;

    return res.json({
      success: true,
      stats: {
        totalQuizzes,
        avgAccuracy,
        recentSessions: sessions.slice(0, 5)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
