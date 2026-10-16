import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CameraTranslator from './components/CameraTranslator';
import TextToSign from './components/TextToSign';
import GestureDictionary from './components/GestureDictionary';
import QuizArena from './components/QuizArena';
import HistoryLog from './components/HistoryLog';
import EngineStatusModal from './components/EngineStatusModal';
import { API_URL } from './apiConfig';

export default function App() {
  const [activeTab, setActiveTab] = useState('camera');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [gesturesList, setGesturesList] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    status: 'connecting',
    pythonEngine: { online: false }
  });
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // Poll system status and fetch gestures
  useEffect(() => {
    const fetchStatusAndGestures = async () => {
      try {
        const statusRes = await fetch(`${API_URL}/api/status`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setSystemStatus(statusData);
        }
      } catch (e) {}

      try {
        const gesturesRes = await fetch(`${API_URL}/api/gestures`);
        if (gesturesRes.ok) {
          const gData = await gesturesRes.json();
          setGesturesList(gData.gestures || []);
        }
      } catch (e) {}
    };

    fetchStatusAndGestures();
    const interval = setInterval(fetchStatusAndGestures, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        engineStatus={systemStatus.pythonEngine || { online: false }}
        voiceEnabled={voiceEnabled}
        setVoiceEnabled={setVoiceEnabled}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
      />

      {/* Main Content Viewport */}
      <main style={{
        flex: 1,
        maxWidth: 1400,
        width: '100%',
        margin: '0 auto',
        padding: '24px 20px',
        boxSizing: 'border-box'
      }}>
        {activeTab === 'camera' && (
          <CameraTranslator
            mode="text"
            voiceEnabled={voiceEnabled}
            onSaveSuccess={() => setHistoryRefreshKey(k => k + 1)}
          />
        )}

        {activeTab === 'calculator' && (
          <CameraTranslator
            mode="calculator"
            voiceEnabled={voiceEnabled}
            onSaveSuccess={() => setHistoryRefreshKey(k => k + 1)}
          />
        )}

        {activeTab === 'text2sign' && (
          <TextToSign gesturesList={gesturesList} />
        )}

        {activeTab === 'dictionary' && (
          <GestureDictionary
            gesturesList={gesturesList}
            voiceEnabled={voiceEnabled}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizArena />
        )}

        {activeTab === 'history' && (
          <HistoryLog
            voiceEnabled={voiceEnabled}
            refreshTrigger={historyRefreshKey}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(10, 15, 29, 0.7)',
        backdropFilter: 'blur(10px)',
        padding: '20px 24px',
        marginTop: 40
      }}>
        <div style={{
          maxWidth: 1400,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
              Indian Sign Language (ISL) Translator Portal
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Built with MERN Stack • Deep Learning Recognition Engine from <a href="https://github.com/harshbg/Sign-Language-Interpreter-using-Deep-Learning" target="_blank" rel="noreferrer" style={{ color: '#818cf8', textDecoration: 'none' }}>harshbg/Sign-Language-Interpreter-using-Deep-Learning</a>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              React 18 • Express • MongoDB • PyTorch CNN
            </span>
          </div>
        </div>
      </footer>

      {/* Engine Architecture & Diagnostics Modal */}
      <EngineStatusModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        systemStatus={systemStatus}
      />
    </div>
  );
}
