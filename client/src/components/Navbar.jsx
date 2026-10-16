import React from 'react';
import { 
  Camera, 
  Calculator, 
  BookOpen, 
  GraduationCap, 
  History, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Cpu, 
  Languages 
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  engineStatus, 
  voiceEnabled, 
  setVoiceEnabled,
  onOpenDiagnostics
}) {
  const navItems = [
    { id: 'camera', label: 'Live Translator', icon: Camera },
    { id: 'calculator', label: 'ISL Calculator', icon: Calculator },
    { id: 'text2sign', label: 'Text to Sign', icon: Languages },
    { id: 'dictionary', label: 'ISL Dictionary (44)', icon: BookOpen },
    { id: 'quiz', label: 'Practice Arena', icon: GraduationCap },
    { id: 'history', label: 'History', icon: History }
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(10, 15, 29, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
          }}>
            <Sparkles size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 800, 
                letterSpacing: '-0.02em',
                background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                ISL <span style={{ color: '#6366f1', WebkitTextFillColor: '#818cf8' }}>TRANSLATOR</span>
              </h1>
              <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>Deep Learning</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Indian Sign Language Engine • harshbg Architecture
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'var(--primary-gradient)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Voice Speech Toggle */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            title={voiceEnabled ? "Voice Output Active (Mute)" : "Voice Output Muted (Enable)"}
            className="btn btn-secondary"
            style={{ padding: '8px 12px' }}
          >
            {voiceEnabled ? (
              <>
                <Volume2 size={16} color="var(--accent-emerald)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>TTS Voice On</span>
              </>
            ) : (
              <>
                <VolumeX size={16} color="var(--text-dim)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>TTS Muted</span>
              </>
            )}
          </button>

          {/* Python Engine Status Badge */}
          <button
            onClick={onOpenDiagnostics}
            className="btn btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: engineStatus.online ? '#10b981' : '#f43f5e',
              boxShadow: engineStatus.online ? '0 0 8px #10b981' : '0 0 8px #f43f5e'
            }} />
            <Cpu size={15} />
            <span>{engineStatus.online ? "CNN Engine Ready" : "Engine Standby"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
