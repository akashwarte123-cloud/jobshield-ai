import React, { useState } from 'react';
import { BookOpen, ShieldAlert, AlertTriangle, ExternalLink, HelpCircle, Chrome, Check } from 'lucide-react';
import { SCAM_GUIDES, REGULATORY_LINKS } from '../data/scamGuides';

export default function ScamEducation() {
  const [selectedGuide, setSelectedGuide] = useState(SCAM_GUIDES[0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Banner */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen color="var(--accent-purple)" size={24} />
          <span>Job Scam Mechanics & Prevention Encyclopedia</span>
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Learn how cybercriminals execute job scams, what warning signs to watch out for, and how to report fraudulent listings to federal regulatory agencies.
        </p>
      </div>

      {/* Grid: Scam Guides */}
      <div className="grid-2">
        {/* Guide Selector List */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Top Scam Archetypes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {SCAM_GUIDES.map((guide) => (
              <div
                key={guide.id}
                onClick={() => setSelectedGuide(guide)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: selectedGuide.id === guide.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(10, 15, 26, 0.5)',
                  border: selectedGuide.id === guide.id ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{guide.icon}</span>
                    <span>{guide.title}</span>
                  </span>
                  <span className={`badge ${guide.severity === 'CRITICAL' ? 'badge-danger' : 'badge-caution'}`}>
                    {guide.severity}
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  {guide.summary}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Guide Details */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '2rem' }}>{selectedGuide.icon}</span>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedGuide.title}</h3>
              <span className={`badge ${selectedGuide.severity === 'CRITICAL' ? 'badge-danger' : 'badge-caution'}`}>
                {selectedGuide.severity} Threat Level
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              How the Scam Operates:
            </h4>
            <div style={{
              background: 'rgba(10, 15, 26, 0.8)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.88rem',
              color: 'var(--text-main)',
              whiteSpace: 'pre-line',
              lineHeight: 1.6
            }}>
              {selectedGuide.mechanics}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--status-safe)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Prevention Strategy:
            </h4>
            <div style={{
              background: 'var(--status-safe-bg)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '0.88rem',
              color: '#a7f3d0',
              lineHeight: 1.6
            }}>
              {selectedGuide.prevention}
            </div>
          </div>
        </div>
      </div>

      {/* Federal Reporting Agencies */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} color="#ef4444" /> Official Regulatory Reporting Portals
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          If you have been targeted by a job scam or lost money/information to a fraudulent employer, report the incident to consumer safety authorities:
        </p>

        <div className="grid-3">
          <a href={REGULATORY_LINKS.ftc} target="_blank" rel="noreferrer" className="glass-card glass-card-interactive" style={{ padding: '16px', textDecoration: 'none' }}>
            <h4 style={{ fontSize: '0.95rem', color: '#ffffff', marginBottom: '4px' }}>FTC Fraud Reporting</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Federal Trade Commission official scam filing portal.</p>
            <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              reportfraud.ftc.gov <ExternalLink size={12} />
            </span>
          </a>

          <a href={REGULATORY_LINKS.ic3} target="_blank" rel="noreferrer" className="glass-card glass-card-interactive" style={{ padding: '16px', textDecoration: 'none' }}>
            <h4 style={{ fontSize: '0.95rem', color: '#ffffff', marginBottom: '4px' }}>FBI IC3 Cyber Center</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Internet Crime Complaint Center for cyber fraud.</p>
            <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              ic3.gov <ExternalLink size={12} />
            </span>
          </a>

          <a href={REGULATORY_LINKS.eoc} target="_blank" rel="noreferrer" className="glass-card glass-card-interactive" style={{ padding: '16px', textDecoration: 'none' }}>
            <h4 style={{ fontSize: '0.95rem', color: '#ffffff', marginBottom: '4px' }}>EEOC Portal</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Equal Employment Opportunity Commission portal.</p>
            <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              eeoc.gov <ExternalLink size={12} />
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
