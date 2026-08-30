import React from 'react';
import { Layers, Zap, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { SAMPLE_JOBS } from '../data/sampleJobs';

export default function PresetLibrary({ onSelectSample }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers color="var(--primary)" size={24} />
          <span>Sample Job Postings & Benchmark Dataset</span>
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Click any pre-loaded test case below to evaluate how VeriJob's multi-factor detection engine analyzes real vs fraudulent job postings.
        </p>
      </div>

      <div className="grid-2">
        {SAMPLE_JOBS.map((job) => (
          <div
            key={job.id}
            className="glass-card glass-card-interactive"
            style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            onClick={() => onSelectSample(job)}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                  {job.company}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {job.email ? `@${job.email.split('@')[1]}` : 'No Email'}
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>
                {job.title}
              </h3>

              <p style={{
                fontSize: '0.86rem',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                marginBottom: '16px',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {job.description}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={14} /> Click to Run Risk Scan
              </span>
              <button className="btn btn-primary btn-sm">
                Analyze Job
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
