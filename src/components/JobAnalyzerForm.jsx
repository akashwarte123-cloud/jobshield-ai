import React, { useState } from 'react';
import { Search, Sparkles, AlertTriangle, Link, Mail, Building, FileText, Zap } from 'lucide-react';
import { SAMPLE_JOBS } from '../data/sampleJobs';

export default function JobAnalyzerForm({ onAnalyze, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    email: '',
    url: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectSample = (sample) => {
    setFormData({
      title: sample.title,
      company: sample.company,
      email: sample.email,
      url: sample.url,
      description: sample.description
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.description.trim() && !formData.title.trim()) {
      alert('Please enter a job title or job description to analyze.');
      return;
    }
    onAnalyze(formData);
  };

  const handleClear = () => {
    setFormData({ title: '', company: '', email: '', url: '', description: '' });
  };

  return (
    <div className="glass-card" style={{ padding: '28px' }}>
      {/* Header & Preset Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles color="var(--primary)" size={22} />
            <span>Job Listing Risk Analyzer</span>
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Paste a job description, email offer, or company contact details below to run multi-factor scam detection.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Try Sample:</span>
          {SAMPLE_JOBS.slice(0, 3).map((sample, idx) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleSelectSample(sample)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              <Zap size={12} color="#f59e0b" />
              <span>Sample #{idx + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit}>
        <div className="grid-2" style={{ marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} color="var(--primary)" /> Job Title
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Optional</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Remote Data Entry Specialist"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={14} color="var(--accent-cyan)" /> Company Name
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Optional</span>
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="e.g. Apex Global Logistics"
              className="form-input"
            />
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} color="var(--accent-purple)" /> Recruiter Email Contact
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Checks Domain Hygiene</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. hr.recruiter@gmail.com"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Link size={14} color="#f59e0b" /> Job Listing URL
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Checks Link Safety</span>
            </label>
            <input
              type="text"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="e.g. https://tinyurl.com/job-apply"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} color="var(--status-safe)" /> Job Description / Email Offer Text *
            </span>
            <span style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>Paste full posting or offer email</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Paste the full job posting description, offer email text, or interview instructions here..."
            className="form-textarea"
            rows={7}
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleClear}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Clear Fields
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ padding: '12px 32px', fontSize: '1.05rem' }}
          >
            <Search size={18} />
            <span>{isLoading ? 'Analyzing Risk Factors...' : 'Run Multi-Factor Risk Scan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
