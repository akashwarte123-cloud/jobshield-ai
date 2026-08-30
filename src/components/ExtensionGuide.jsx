import React, { useState } from 'react';
import { Chrome, Download, CheckCircle2, ShieldCheck, MousePointer, Copy, Layers, ExternalLink } from 'lucide-react';

export default function ExtensionGuide() {
  const [copied, setCopied] = useState(false);

  const handleCopyPath = () => {
    navigator.clipboard.writeText('C:\\Users\\akash\\.gemini\\antigravity\\scratch\\job-scam-detector\\extension');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Banner */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.4)'
          }}>
            <Chrome size={32} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              VeriJob Chrome Extension (Manifest V3)
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Detect job scams live on LinkedIn, Indeed, Glassdoor, and ZipRecruiter with floating safety badges & side panel risk analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid-3">
        <div className="glass-card" style={{ padding: '20px' }}>
          <ShieldCheck size={24} color="var(--status-safe)" style={{ marginBottom: '10px' }} />
          <h4 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '6px' }}>In-Page Safety Badges</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Automatically scans job listings on web job boards and injects a floating risk badge directly beside the job title.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <Layers size={24} color="var(--accent-cyan)" style={{ marginBottom: '10px' }} />
          <h4 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '6px' }}>1-Click Side Panel</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            View the complete multi-factor risk report, red flags, and verification checklist without leaving your current job tab.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <MousePointer size={24} color="var(--accent-purple)" style={{ marginBottom: '10px' }} />
          <h4 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '6px' }}>Right-Click Scanner</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Select any suspicious email text or offer details on any webpage, right-click, and select "Scan with VeriJob".
          </p>
        </div>
      </div>

      {/* Installation Steps */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={20} color="var(--primary)" /> 3-Step Extension Installation Guide
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(10,15,26,0.6)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ background: 'var(--primary)', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>1</span>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.98rem', color: '#ffffff', marginBottom: '4px' }}>Open Chrome Extension Settings</h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                In your Google Chrome or Brave browser address bar, open <code style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>chrome://extensions</code> and enable <strong>Developer mode</strong> in the top right corner.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(10,15,26,0.6)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ background: 'var(--primary)', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>2</span>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.98rem', color: '#ffffff', marginBottom: '4px' }}>Click "Load unpacked"</h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Click the <strong>Load unpacked</strong> button and select the extension directory from your project folder:
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  readOnly
                  value="C:\Users\akash\.gemini\antigravity\scratch\job-scam-detector\extension"
                  className="form-input"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '8px 12px' }}
                />
                <button onClick={handleCopyPath} className="btn btn-secondary btn-sm" style={{ padding: '8px 14px' }}>
                  <Copy size={14} />
                  <span>{copied ? 'Copied!' : 'Copy Path'}</span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(10,15,26,0.6)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ background: 'var(--primary)', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>3</span>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.98rem', color: '#ffffff', marginBottom: '4px' }}>Start Scanning Job Boards</h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                Navigate to LinkedIn, Indeed, or Glassdoor. The VeriJob icon will appear in your Chrome toolbar and automatically evaluate job listings on the page!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
