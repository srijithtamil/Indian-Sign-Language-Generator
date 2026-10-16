const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isConnectedToMongo = false;
const fallbackDataPath = path.join(__dirname, 'data_store.json');

// Initialize fallback JSON store if needed
function initFallbackStore() {
  if (!fs.existsSync(fallbackDataPath)) {
    const initialData = {
      translations: [
        {
          id: 'demo-1',
          source: 'camera_gesture',
          mode: 'text',
          translatedText: 'HELLO WELCOME TO ISL PORTAL',
          gestures: ['H', 'E', 'L', 'L', 'O'],
          confidence: 0.94,
          timestamp: new Date().toISOString()
        },
        {
          id: 'demo-2',
          source: 'calculator',
          mode: 'calculator',
          translatedText: '12 + 8 = 20',
          gestures: ['1', '2', '+', '8', '='],
          confidence: 0.91,
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      practiceSessions: [
        {
          id: 'quiz-1',
          quizType: 'alphabet_recognition',
          score: 9,
          totalQuestions: 10,
          accuracy: 90,
          timestamp: new Date(Date.now() - 7200000).toISOString()
        }
      ],
      settings: {
        voiceEnabled: true,
        speechRate: 1.0,
        confidenceThreshold: 0.70,
        darkTheme: true
      }
    };
    fs.writeFileSync(fallbackDataPath, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

function readFallback() {
  initFallbackStore();
  try {
    const content = fs.readFileSync(fallbackDataPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return { translations: [], practiceSessions: [], settings: {} };
  }
}

function writeFallback(data) {
  try {
    fs.writeFileSync(fallbackDataPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing fallback store:', err);
  }
}

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/isl_portal_db';
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000
    });
    isConnectedToMongo = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (err) {
    isConnectedToMongo = false;
    console.warn(`[Database] MongoDB not reachable at ${mongoURI}. Switching to seamless embedded storage fallback.`);
    initFallbackStore();
  }
};

module.exports = {
  connectDB,
  isMongo: () => isConnectedToMongo,
  readFallback,
  writeFallback
};
