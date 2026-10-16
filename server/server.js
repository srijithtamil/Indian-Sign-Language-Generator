require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios');
const { connectDB, isMongo } = require('./db');

const translateRoutes = require('./routes/translateRoutes');
const gestureRoutes = require('./routes/gestureRoutes');
const quizRoutes = require('./routes/quizRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const PYTHON_ENGINE_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:5001';

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
// Base64 image payload support
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Database connection
connectDB();

// API Routes
app.use('/api/translate', translateRoutes);
app.use('/api/gestures', gestureRoutes);
app.use('/api/quiz', quizRoutes);

// Health & System Status
app.get('/api/status', async (req, res) => {
  let engineOnline = false;
  let engineData = null;

  try {
    const resp = await axios.get(`${PYTHON_ENGINE_URL}/health`, { timeout: 2000 });
    engineOnline = true;
    engineData = resp.data;
  } catch (err) {
    engineOnline = false;
  }

  return res.json({
    status: 'online',
    serverPort: PORT,
    database: isMongo() ? 'MongoDB (Connected)' : 'Embedded JSON Store (Active)',
    pythonEngine: {
      online: engineOnline,
      url: PYTHON_ENGINE_URL,
      details: engineData
    },
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  ISL MERN Server running on http://localhost:${PORT}`);
  console.log(`  Proxying Deep Learning requests to: ${PYTHON_ENGINE_URL}`);
  console.log(`=================================================`);
});
