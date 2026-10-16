import React, { useState } from 'react';
import { Search, BookOpen, Volume2, Info, Check, Filter } from 'lucide-react';

export default function GestureDictionary({ gesturesList = [], voiceEnabled }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGesture, setSelectedGesture] = useState(null);

  const categories = [
    { id: 'all', label: 'All Signs (44)' },
    { id: 'alphabet', label: 'Alphabets A-Z (26)' },
    { id: 'number', label: 'Numbers 0-9 (10)' },
    { id: 'phrase', label: 'Phrases & Words (8)' }
  ];

  const filteredGestures = gesturesList.filter(g => {
    const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
    const matchesSearch = 
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.tips?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const speakGesture = (gesture) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(`${gesture.name}. ${gesture.description}`);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div>
      {/* Header and Filters Bar */}
      <div className="glass-panel" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 16
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              Indian Sign Language Dictionary
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
              44 Standard Gestures from harshbg SQLite database • Standardized ISL Taxonomy
            </p>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input
              type="text"
              placeholder="Search gesture or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(10, 15, 29, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: '10px 14px 10px 38px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                background: selectedCategory === cat.id ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedCategory === cat.id ? '#ffffff' : 'var(--text-muted)',
                border: '1px solid ' + (selectedCategory === cat.id ? 'transparent' : 'var(--border-subtle)'),
                boxShadow: selectedCategory === cat.id ? '0 4px 12px var(--primary-glow)' : 'none'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Gesture Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 18
      }}>
        {filteredGestures.map(gesture => (
          <div
            key={gesture.id}
            className="glass-panel"
            onClick={() => setSelectedGesture(gesture)}
            style={{
              padding: 20,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'var(--transition)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <div>
              {/* Header: Class ID and Category */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className={`badge ${
                  gesture.category === 'alphabet' ? 'badge-primary' : 
                  gesture.category === 'number' ? 'badge-warning' : 'badge-success'
                }`} style={{ fontSize: '0.65rem' }}>
                  {gesture.category}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  ID #{gesture.id}
                </span>
              </div>

              {/* Big Sign Symbol */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 12
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  fontFamily: 'var(--font-heading)'
                }}>
                  {gesture.name.length <= 3 ? gesture.name : gesture.name[0]}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                    {gesture.name}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Indian Sign Standard
                  </span>
                </div>
              </div>

              {/* Description */}
              <p style={{
                fontSize: '0.825rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                marginBottom: 12
              }}>
                {gesture.description}
              </p>
            </div>

            {/* Footer with Tips and Speech trigger */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              paddingTop: 10,
              marginTop: 6
            }}>
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--text-dim)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 180
              }}>
                {gesture.tips || "Standard posture"}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakGesture(gesture);
                }}
                className="btn btn-secondary"
                style={{ padding: '6px 8px', borderRadius: 8 }}
                title="Speak gesture details"
              >
                <Volume2 size={14} color="#818cf8" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {selectedGesture && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(4, 7, 17, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div className="glass-panel" style={{
            maxWidth: 480,
            width: '100%',
            padding: 30,
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="badge badge-primary">{selectedGesture.category}</span>
              <button
                onClick={() => setSelectedGesture(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 90,
                height: 90,
                borderRadius: 22,
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto',
                fontSize: '2.6rem',
                fontWeight: 800,
                color: '#fff',
                boxShadow: '0 8px 25px var(--primary-glow)'
              }}>
                {selectedGesture.name}
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedGesture.name}</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                Database Class Index: {selectedGesture.id}
              </span>
            </div>

            <div style={{
              background: 'rgba(10, 15, 29, 0.7)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16
            }}>
              <h4 style={{ fontSize: '0.85rem', color: '#a5b4fc', marginBottom: 6 }}>Description & Finger Alignment</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {selectedGesture.description}
              </p>
            </div>

            {selectedGesture.tips && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20
              }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', marginBottom: 6 }}>Execution & Recognition Tips</h4>
                <p style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                  {selectedGesture.tips}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => speakGesture(selectedGesture)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                <Volume2 size={16} />
                <span>Hear Description</span>
              </button>
              <button
                onClick={() => setSelectedGesture(null)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
