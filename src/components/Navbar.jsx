import React from 'react';
import { ShieldCheck, Sparkles, BookOpen, Layers, Chrome, History } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, historyCount, toggleHistory }) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      marginBottom: '32px',
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Brand Logo */}
      <div 
        onClick={() => setActiveTab('analyzer')} 
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
      >
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
        }}>
          <ShieldCheck size={26} color="#ffffff" />
        </div>
        <div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Veri<span className="gradient-text">Job</span></span>
            <span style={{
              fontSize: '0.65rem',
              padding: '2px 6px',
              borderRadius: '6px',
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#a5b4fc',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              fontFamily: 'var(--font-mono)'
            }}>AI v2.6</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Job Scam Detector & Risk Analyzer</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('analyzer')}
          className={`btn ${activeTab === 'analyzer' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Sparkles size={16} />
          <span>Job Analyzer</span>
        </button>

        <button
          onClick={() => setActiveTab('presets')}
          className={`btn ${activeTab === 'presets' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Layers size={16} />
          <span>Sample Library</span>
        </button>

        <button
          onClick={() => setActiveTab('education')}
          className={`btn ${activeTab === 'education' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <BookOpen size={16} />
          <span>Scam Guide</span>
        </button>

        <button
          onClick={() => setActiveTab('extension')}
          className={`btn ${activeTab === 'extension' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Chrome size={16} color="#38bdf8" />
          <span>Extension</span>
        </button>
      </nav>

      {/* History Drawer Toggle */}
      <button
        onClick={toggleHistory}
        className="btn btn-secondary"
        style={{ position: 'relative' }}
        title="View Scan History"
      >
        <History size={18} />
        <span>History</span>
        {historyCount > 0 && (
          <span style={{
            background: 'var(--primary)',
            color: '#fff',
            borderRadius: '99px',
            padding: '2px 7px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            {historyCount}
          </span>
        )}
      </button>
    </header>
  );
}
