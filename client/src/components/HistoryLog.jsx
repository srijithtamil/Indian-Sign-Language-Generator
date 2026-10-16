import React, { useState, useEffect } from 'react';
import { 
  History, 
  Trash2, 
  Copy, 
  Check, 
  Volume2, 
  Download, 
  RefreshCw, 
  Calendar,
  Layers,
  Calculator,
  Type
} from 'lucide-react';
import { API_URL } from '../apiConfig';

export default function HistoryLog({ voiceEnabled, refreshTrigger }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/translate/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (e) {
      console.error("Failed to fetch history:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  const handleDeleteItem = async (id) => {
    try {
      await fetch(`${API_URL}/api/translate/history/${id}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(item => (item._id || item.id) !== id));
    } catch (e) {}
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all translation history?")) return;
    try {
      await fetch(`${API_URL}/api/translate/history`, { method: 'DELETE' });
      setHistory([]);
    } catch (e) {}
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `isl_translation_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              Translation & Gesture History
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
              Stored in Database (MongoDB / Fallback JSON Store) • {history.length} Saved Records
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleExportJSON}
              disabled={history.length === 0}
              className="btn btn-secondary"
              style={{ padding: '8px 14px' }}
            >
              <Download size={15} />
              <span>Export JSON</span>
            </button>

            <button
              onClick={fetchHistory}
              className="btn btn-secondary"
              style={{ padding: '8px 14px' }}
            >
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleClearAll}
              disabled={history.length === 0}
              className="btn btn-danger"
              style={{ padding: '8px 14px' }}
            >
              <Trash2 size={15} />
              <span>Clear All</span>
            </button>
          </div>
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          Loading saved history...
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: 48, color: 'var(--text-dim)' }}>
          <History size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: 6 }}>No Translations Yet</h3>
          <p style={{ fontSize: '0.85rem' }}>
            Translations created in Text Mode or Calculator Mode will appear here once saved.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {history.map(item => {
            const itemId = item._id || item.id;
            const isCalc = item.mode === 'calculator' || item.source === 'calculator';
            const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recent';

            return (
              <div
                key={itemId}
                className="glass-panel"
                style={{
                  padding: 18,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span className={`badge ${isCalc ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '0.65rem' }}>
                      {isCalc ? <><Calculator size={12} /> Calculator</> : <><Type size={12} /> ISL Gesture</>}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} /> {dateStr}
                    </span>
                    {item.confidence && (
                      <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                        {Math.round(item.confidence * 100)}% Conf
                      </span>
                    )}
                  </div>

                  <div style={{
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    fontFamily: isCalc ? 'var(--font-mono)' : 'var(--font-body)',
                    marginBottom: 4
                  }}>
                    {item.translatedText}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => handleSpeak(item.translatedText)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 10px' }}
                    title="Speak text"
                  >
                    <Volume2 size={16} />
                  </button>

                  <button
                    onClick={() => handleCopy(itemId, item.translatedText)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 10px' }}
                    title="Copy text"
                  >
                    {copiedId === itemId ? <Check size={16} color="var(--accent-emerald)" /> : <Copy size={16} />}
                  </button>

                  <button
                    onClick={() => handleDeleteItem(itemId)}
                    className="btn btn-danger"
                    style={{ padding: '8px 10px' }}
                    title="Delete item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
