import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Mic, 
  MicOff, 
  Sparkles, 
  Volume2, 
  Layers, 
  BookOpen 
} from 'lucide-react';

export default function TextToSign({ gesturesList = [] }) {
  const [inputText, setInputText] = useState('WELCOME TO ISL');
  const [sequence, setSequence] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1200); // ms per sign
  const [isListening, setIsListening] = useState(false);
  const timerRef = useRef(null);

  // Convert text into gesture tokens
  useEffect(() => {
    if (!inputText.trim()) {
      setSequence([]);
      setCurrentIndex(0);
      return;
    }

    const clean = inputText.trim().toUpperCase();
    const tokens = [];

    // Check for special phrase tokens first (e.g. "I LOVE YOU", "BEST OF LUCK", "LIKE", "REMEMBER")
    const words = clean.split(/\s+/);
    let i = 0;
    while (i < words.length) {
      const phrase3 = words.slice(i, i + 3).join(' ');
      const phrase2 = words.slice(i, i + 2).join(' ');
      const single = words[i];

      const match3 = gesturesList.find(g => g.name.toUpperCase() === phrase3);
      const match2 = gesturesList.find(g => g.name.toUpperCase() === phrase2);
      const match1 = gesturesList.find(g => g.name.toUpperCase() === single);

      if (match3) {
        tokens.push(match3);
        i += 3;
      } else if (match2) {
        tokens.push(match2);
        i += 2;
      } else if (match1 && match1.category === 'phrase') {
        tokens.push(match1);
        i += 1;
      } else {
        // Spell out letters or numbers
        for (let char of single) {
          const matchChar = gesturesList.find(g => g.name.toUpperCase() === char);
          if (matchChar) {
            tokens.push(matchChar);
          } else {
            tokens.push({ id: -1, name: char, category: 'other', description: `Character ${char}` });
          }
        }
        tokens.push({ id: -99, name: '␣', category: 'space', description: 'Word Pause / Space' });
        i += 1;
      }
    }

    // Remove trailing space token
    if (tokens.length > 0 && tokens[tokens.length - 1].category === 'space') {
      tokens.pop();
    }

    setSequence(tokens);
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [inputText, gesturesList]);

  // Playback timer
  useEffect(() => {
    if (isPlaying && sequence.length > 0) {
      timerRef.current = setTimeout(() => {
        setCurrentIndex(prev => {
          if (prev >= sequence.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentIndex, sequence, playbackSpeed]);

  // Speech to Text (Microphone)
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isListening) {
      setIsListening(true);
      recognition.start();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      recognition.stop();
      setIsListening(false);
    }
  };

  const currentToken = sequence[currentIndex] || null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 24 }}>
      {/* LEFT: Input & Controls */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Text & Voice to ISL Synthesizer
            </h2>
          </div>
          <span className="badge badge-cyan">Speech-to-Sign</span>
        </div>

        {/* Text Input with Microphone button */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type any English/Hindi words or numbers to see ISL sign animation..."
            rows={4}
            style={{
              width: '100%',
              background: 'rgba(10, 15, 29, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 14,
              padding: '16px 50px 16px 16px',
              color: '#ffffff',
              fontSize: '1.1rem',
              fontFamily: 'var(--font-body)',
              resize: 'none',
              outline: 'none'
            }}
          />
          <button
            onClick={toggleSpeechRecognition}
            className="btn btn-secondary"
            title={isListening ? "Listening to microphone..." : "Speak via Microphone"}
            style={{
              position: 'absolute',
              right: 12,
              bottom: 16,
              borderRadius: '50%',
              width: 38,
              height: 38,
              padding: 0,
              background: isListening ? 'var(--accent-rose)' : 'rgba(255, 255, 255, 0.08)'
            }}
          >
            {isListening ? <MicOff size={18} color="#fff" /> : <Mic size={18} color="#a5b4fc" />}
          </button>
        </div>

        {/* Quick Sample Prompts */}
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 8, display: 'block' }}>
            Quick Practice Phrases:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              "HELLO",
              "BEST OF LUCK",
              "I LOVE YOU",
              "REMEMBER",
              "INDIA 2026",
              "1 2 3 4"
            ].map(phrase => (
              <button
                key={phrase}
                onClick={() => setInputText(phrase)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '4px 10px',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>

        {/* Gesture Sequence Ribbon */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Sign Progression ({sequence.length} Steps)
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Step {sequence.length > 0 ? currentIndex + 1 : 0} of {sequence.length}
            </span>
          </div>

          <div style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 8,
            scrollbarWidth: 'thin'
          }}>
            {sequence.map((item, idx) => {
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setIsPlaying(false);
                  }}
                  style={{
                    minWidth: 44,
                    height: 52,
                    borderRadius: 10,
                    border: isCurrent ? '2px solid #818cf8' : '1px solid var(--border-subtle)',
                    background: isCurrent ? 'var(--primary-gradient)' : 'rgba(15, 23, 42, 0.6)',
                    color: isCurrent ? '#ffffff' : 'var(--text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: isCurrent ? '0 4px 14px var(--primary-glow)' : 'none',
                    transition: 'var(--transition)'
                  }}
                >
                  <span style={{ fontSize: '1rem', fontWeight: 700 }}>
                    {item.name}
                  </span>
                  <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>
                    #{idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Playback Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(10, 15, 29, 0.6)',
          padding: 14,
          borderRadius: 12,
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                if (currentIndex >= sequence.length - 1) setCurrentIndex(0);
                setIsPlaying(!isPlaying);
              }}
              className="btn btn-primary"
              style={{ padding: '8px 16px' }}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span>{isPlaying ? "Pause" : "Play Sign Sequence"}</span>
            </button>

            <button
              onClick={() => {
                setCurrentIndex(prev => Math.min(sequence.length - 1, prev + 1));
                setIsPlaying(false);
              }}
              className="btn btn-secondary"
              style={{ padding: '8px 12px' }}
            >
              <SkipForward size={16} />
              <span>Next</span>
            </button>

            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsPlaying(false);
              }}
              className="btn btn-secondary"
              style={{ padding: '8px 12px' }}
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
          </div>

          {/* Speed Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Speed:</span>
            {[
              { label: '0.5x', speed: 2000 },
              { label: '1x', speed: 1200 },
              { label: '2x', speed: 600 }
            ].map(s => (
              <button
                key={s.label}
                onClick={() => setPlaybackSpeed(s.speed)}
                style={{
                  background: playbackSpeed === s.speed ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 8px',
                  color: '#fff',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Active Sign Card Visualizer */}
      <div className="glass-panel" style={{
        padding: 30,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(18, 26, 47, 0.85) 0%, rgba(30, 41, 69, 0.85) 100%)'
      }}>
        {currentToken ? (
          <div style={{ width: '100%', maxWidth: 360 }}>
            {/* Category Tag */}
            <div style={{ marginBottom: 16 }}>
              <span className={`badge ${
                currentToken.category === 'alphabet' ? 'badge-primary' : 
                currentToken.category === 'number' ? 'badge-warning' : 'badge-success'
              }`}>
                {currentToken.category} Gesture
              </span>
            </div>

            {/* Huge Sign Graphic Avatar */}
            <div style={{
              width: 160,
              height: 160,
              margin: '0 auto 20px auto',
              borderRadius: 28,
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
              border: '2px solid rgba(129, 140, 248, 0.4)',
              boxShadow: '0 0 30px rgba(99, 102, 241, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <span style={{
                fontSize: '4.5rem',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                background: 'linear-gradient(135deg, #ffffff 0%, #818cf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {currentToken.name}
              </span>
            </div>

            {/* Sign Title */}
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
              {currentToken.name}
            </h3>

            {/* Description */}
            <p style={{
              fontSize: '0.95rem',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              marginBottom: 16
            }}>
              {currentToken.description || "Indian Sign Language standard posture"}
            </p>

            {/* Performance Tip */}
            {currentToken.tips && (
              <div style={{
                background: 'rgba(10, 15, 29, 0.7)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: '12px 16px',
                textAlign: 'left'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Pro Execution Tip:
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  {currentToken.tips}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
            <Layers size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>Type words above to display animated ISL sign</p>
          </div>
        )}
      </div>
    </div>
  );
}
