const express = require('express');
const router = express.Router();
const gesturesList = require('../data/gesturesData');

// Get all gestures with filters
router.get('/', (req, res) => {
  const { category, search } = req.query;
  let results = [...gesturesList];

  if (category) {
    results = results.filter(g => g.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const term = search.toLowerCase();
    results = results.filter(g => 
      g.name.toLowerCase().includes(term) || 
      g.description.toLowerCase().includes(term)
    );
  }

  return res.json({
    success: true,
    total: gesturesList.length,
    count: results.length,
    gestures: results
  });
});

// Get single gesture by ID or name
router.get('/:id', (req, res) => {
  const param = req.params.id;
  const gesture = gesturesList.find(g => 
    g.id.toString() === param || g.name.toLowerCase() === param.toLowerCase()
  );

  if (!gesture) {
    return res.status(404).json({ success: false, error: 'Gesture not found' });
  }

  return res.json({ success: true, gesture });
});

module.exports = router;
