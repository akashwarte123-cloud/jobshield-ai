import React from 'react';
import { X, Trash2, ShieldAlert, ShieldCheck, ArrowRight, History } from 'lucide-react';

export default function HistoryDrawer({ isOpen, onClose, history, onSelectHistory, onClearHistory }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div style={{
        width: '440px',
        maxWidth: '90vw',
        height: '100%',
        background: '#0f172a',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History color="var(--primary)" size={20} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Scan History</h3>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* History Item List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <History size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p>No past scans recorded yet.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Analyzed jobs will automatically save here.</p>
            </div>
          ) : (
            history.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onSelectHistory(item);
                  onClose();
                }}
                className="glass-card glass-card-interactive"
                style={{ padding: '16px', borderLeft: item.result.badgeColor === 'danger' ? '4px solid #ef4444' : item.result.badgeColor === 'caution' ? '4px solid #f59e0b' : '4px solid #10b981' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                    {item.jobData.title || 'Untitled Job'}
                  </span>
                  <span className={`badge ${item.result.badgeColor === 'danger' ? 'badge-danger' : item.result.badgeColor === 'caution' ? 'badge-caution' : 'badge-safe'}`} style={{ fontSize: '0.7rem' }}>
                    {item.result.score}/100 Risk
                  </span>
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {item.jobData.company || 'Unknown Company'} • {new Date(item.timestamp).toLocaleDateString()}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <span>{item.result.redFlags.length} Red Flags</span>
                  <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    View Audit <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Clear Button Footer */}
        {history.length > 0 && (
          <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '16px' }}>
            <button onClick={onClearHistory} className="btn btn-danger btn-sm" style={{ width: '100%' }}>
              <Trash2 size={14} /> Clear All Scan History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
