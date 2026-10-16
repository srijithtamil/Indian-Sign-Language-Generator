import React from 'react';
import { Cpu, Database, Server, CheckCircle2, XCircle, Info, ExternalLink } from 'lucide-react';

export default function EngineStatusModal({ isOpen, onClose, systemStatus }) {
  if (!isOpen) return null;

  return (
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
        maxWidth: 620,
        width: '100%',
        padding: 28,
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cpu size={24} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>System Architecture & Status</h2>
          </div>
          <button
            onClick={onClose}
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

        {/* Components Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {/* Python Deep Learning Engine */}
          <div style={{
            background: 'rgba(10, 15, 29, 0.7)',
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
            padding: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Cpu size={20} color="#818cf8" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Python Recognition Engine</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  harshbg repo • CNN (3 Conv Layers, 44 Classes) • HSV Hist Backprojection
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {systemStatus?.pythonEngine?.online ? (
                <>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>Active (Port 5001)</span>
                </>
              ) : (
                <>
                  <XCircle size={16} color="var(--accent-rose)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-rose)', fontWeight: 600 }}>Engine Standby</span>
                </>
              )}
            </div>
          </div>

          {/* Express Node.js Server */}
          <div style={{
            background: 'rgba(10, 15, 29, 0.7)',
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
            padding: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Server size={20} color="#34d399" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Express API Gateway</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Node.js • REST Endpoints • Frame Proxy • CORS & Morgan
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>Online (Port 5000)</span>
            </div>
          </div>

          {/* Database */}
          <div style={{
            background: 'rgba(10, 15, 29, 0.7)',
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
            padding: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Database size={20} color="#fbbf24" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Database Store</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {systemStatus?.database || "MongoDB / Embedded Store Active"}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>Connected</span>
            </div>
          </div>
        </div>

        {/* Engine Specs Box */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20
        }}>
          <h4 style={{ fontSize: '0.85rem', color: '#a5b4fc', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Info size={16} /> Harshbg DL Pipeline Specs
          </h4>
          <ul style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            paddingLeft: 18
          }}>
            <li><strong>Input Size:</strong> 50 x 50 Grayscale Bounding Box with Square Aspect Ratio Padding</li>
            <li><strong>Segmentation:</strong> HSV Skin Backprojection using <code>hist</code> + Otsu Adaptive Thresholding</li>
            <li><strong>Gesture Classes:</strong> 44 Standard Sign Language Classes (from <code>gesture_db.db</code>)</li>
            <li><strong>Supported Modes:</strong> Text Mode (Sentence Builder) & Smart Calculator Mode</li>
          </ul>
        </div>

        <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
          Dismiss Diagnostics
        </button>
      </div>
    </div>
  );
}
