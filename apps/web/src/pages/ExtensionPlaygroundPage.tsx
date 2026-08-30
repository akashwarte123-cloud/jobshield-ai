import React, { useState, useEffect } from 'react';
import {
  PageHeader,
  AnalyticsCard,
  Btn
} from '../components/ui';
import { ShieldCheck, DownloadCloud, AlertCircle, CheckCircle2, ShieldAlert, Shield, LifeBuoy } from 'lucide-react';

interface ExtensionPlaygroundPageProps {
  onNavigate?: (view: string) => void;
}

export function ExtensionPlaygroundPage({ onNavigate }: ExtensionPlaygroundPageProps) {
  const [activeTab, setActiveTab] = useState<'safe' | 'scam' | 'reship'>('scam');
  const [installedToast, setInstalledToast] = useState(false);
  
  // Extension interactive simulator states
  const [isScanning, setIsScanning] = useState(false);
  const [scanningStep, setScanningStep] = useState(0);
  const [showResult, setShowResult] = useState(true);
  const [currentMode, setCurrentMode] = useState<'main' | 'settings'>('main');
  const [scanSeconds, setScanSeconds] = useState('0.63 s');

  const mockData = {
    safe: {
      url: 'https://linkedin.com/jobs/view/stripe-senior-eng',
      title: 'Senior Infrastructure Engineer',
      company: 'Stripe, Inc.',
      domain: 'stripe.com',
      age: '14 Years (2010)',
      ssl: 'Valid (DigiCert EV)',
      linkedin: '12,400+ Employees',
      salary: '$190,000 - $240,000 / yr',
      type: 'Full-time',
      score: 12,
      verdict: '🟢 SAFE',
      verdictColor: '#00E599',
      status: 'safe' as const,
      checklist: [
        { pass: true, label: '✓ Verified Company' },
        { pass: true, label: '✓ Secure SSL Certificate' },
        { pass: true, label: '✓ Domain Age: 14+ Years' },
        { pass: true, label: '✓ Realistic Salary' },
        { pass: true, label: '✓ No Upfront Payment' },
        { pass: true, label: '✓ No Telegram Interview' }
      ],
      desc: 'Join the Stripe Infrastructure team to scale global payments APIs processing over $1 Trillion annually. Requirements: 5+ years Go/Ruby experience, distributed systems knowledge.'
    },
    scam: {
      url: 'https://indeed.com/viewjob?jk=telegram-scam-trap',
      title: 'Data Entry Representative',
      company: 'Apex Logistics LLC',
      domain: 'apexlogistics-jobs.net',
      age: '14 Days (2026)',
      ssl: 'Free Let\'s Encrypt',
      linkedin: 'Unverified Account',
      salary: '$75.00 / hr (Paid Weekly)',
      type: 'Remote (Immediate Start)',
      score: 89,
      verdict: '🔴 HIGH RISK',
      verdictColor: '#EF4444',
      status: 'danger' as const,
      checklist: [
        { pass: false, label: '❌ Unverified Company' },
        { pass: false, label: '❌ Unregistered Domain (14 Days)' },
        { pass: false, label: '❌ Unrealistic Salary ($75/hr)' },
        { pass: false, label: '❌ Upfront Payment Request' },
        { pass: false, label: '❌ Telegram Interview Pattern' }
      ],
      desc: 'Urgent hiring for Remote Data Entry! No experience needed. Pay is $75/hr. Contact Mr. David on Telegram @ApexRecruiters to begin. We will issue a check to purchase your home office equipment.'
    },
    reship: {
      url: 'https://glassdoor.com/job-listing/expresscargo-inspector',
      title: 'Quality Control Inspector',
      company: 'Express Cargo Solutions',
      domain: 'expresscargo-jobs.net',
      age: '28 Days (2026)',
      ssl: 'Standard DV SSL',
      linkedin: 'No Official Page',
      salary: '$4,200 / month',
      type: 'Work From Home',
      score: 68,
      verdict: '🟡 CAUTION',
      verdictColor: '#F59E0B',
      status: 'warning' as const,
      checklist: [
        { pass: false, label: '❌ Unverified Company' },
        { pass: true, label: '✓ Secure SSL Certificate' },
        { pass: false, label: '❌ Newly Registered Domain (28 Days)' },
        { pass: true, label: '✓ No Upfront Payment' },
        { pass: true, label: '✓ No Telegram Interview' }
      ],
      desc: 'Receive packages at your home address, inspect contents, re-box, and ship to international addresses using pre-paid shipping labels. Earn $4,200/mo.'
    }
  };

  const current = mockData[activeTab];

  const handleDownloadExtension = () => {
    const link = document.createElement('a');
    link.href = '/jobshield-guard-extension.zip';
    link.download = 'jobshield-guard-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setInstalledToast(true);
    setTimeout(() => {
      setInstalledToast(false);
    }, 6000);
  };

  const triggerScan = () => {
    setIsScanning(true);
    setScanningStep(0);
    setShowResult(false);
    const secs = (0.4 + Math.random() * 0.25).toFixed(2) + ' s';
    setScanSeconds(secs);

    // Sequence progress check intervals
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < 4) {
        setScanningStep(currentStep);
      } else {
        clearInterval(interval);
        setIsScanning(false);
        setShowResult(true);
      }
    }, 300);
  };

  // Run initial scan on tab change
  useEffect(() => {
    triggerScan();
    setCurrentMode('main');
  }, [activeTab]);

  const extTheme = {
    bgBase: 'var(--card-bg)',
    bgCard: 'var(--bg-surface)',
    border: 'var(--border)',
    text: 'var(--text)',
    textSecondary: 'var(--text-secondary)',
    textMuted: 'var(--text-muted)',
    primary: 'var(--primary)',
    primaryDim: 'var(--primary-dim)',
    primaryBorder: 'var(--primary-border)',
    btnPrimaryBg: 'var(--btn-primary-bg)',
    btnPrimaryText: 'var(--btn-primary-text)',
    btnPrimaryHoverBg: 'var(--btn-primary-hover-bg)',
    btnSecondaryBg: 'var(--btn-secondary-bg)',
    btnSecondaryText: 'var(--btn-secondary-text)',
    btnSecondaryHoverBg: 'var(--btn-secondary-hover-bg)',
    success: 'var(--safe-text, var(--safe))',
    successDim: 'var(--safe-dim)',
    successBorder: 'var(--safe-border)',
    danger: 'var(--danger-text, var(--danger))',
    dangerDim: 'var(--danger-dim)',
    dangerBorder: 'var(--danger-border)',
    warning: 'var(--warning-text, var(--warning))',
    warningDim: 'var(--warning-dim)',
    warningBorder: 'var(--warning-border)',
  };

  return (
    <div className="animate-slide" style={{ paddingBottom: 40 }}>
      <PageHeader
        category="Integrations"
        title="JobShield AI — Browser Guard"
        subtitle="Real-time job posting threat analysis, floating safety badge injection, and support ticket integration."
      />

      {/* ─── Extension Distribution Banner & 4-Step Quick Install Guide ─── */}
      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: 24,
        boxShadow: 'var(--shadow)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'var(--primary-dim)', border: '1px solid var(--primary-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
              flexShrink: 0
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10 }}>
                JobShield Guard Extension
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                  background: 'var(--primary-dim)', color: 'var(--primary)', border: '1px solid var(--primary-border)',
                  letterSpacing: '0.04em', textTransform: 'uppercase'
                }}>
                  Ready to Download
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                Get the official browser extension package to protect your job applications across LinkedIn, Indeed, Glassdoor, Naukri, and Internshala.
              </p>
            </div>
          </div>

          <Btn variant="primary" icon={<DownloadCloud size={15} />} onClick={handleDownloadExtension}>
            Download Chrome Extension
          </Btn>
        </div>

        {/* Download Feedback Toast */}
        {installedToast && (
          <div className="animate-slide" style={{
            background: 'var(--safe-dim)', border: '1px solid var(--safe-border)',
            borderRadius: '10px', padding: '12px 18px', color: 'var(--safe-text, var(--safe))',
            fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 16, boxShadow: 'var(--shadow-sm)'
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>Downloading <strong>jobshield-guard-extension.zip</strong>! Extract the ZIP and follow the 4-step guide below to activate in Chrome.</span>
          </div>
        )}

        {/* Compact 4-Step Installation Guide */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Installation Guide (Chrome / Brave / Edge)
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 12
          }}>
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Step 1
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Download the extension</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Click <strong>Download Chrome Extension</strong> above to save <code>jobshield-guard-extension.zip</code>.
              </div>
            </div>

            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Step 2
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Extract the ZIP</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Unzip the archive to a convenient folder on your computer.
              </div>
            </div>

            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Step 3
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Open extensions page</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Open <code>chrome://extensions</code> in Chrome, or the equivalent extensions page in Brave/Edge.
              </div>
            </div>

            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Step 4
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Load unpacked folder</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Enable <strong>Developer mode</strong> (top-right) &rarr; click <strong>Load unpacked</strong> &rarr; select the extracted folder.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Target Selector Chips */}
      <AnalyticsCard title="Interactive Simulation Target" subtitle="Select a job posting scenario to preview how the JobShield AI Chrome extension adapts">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { tab: 'scam' as const, label: '🚨 High-Risk Telegram Check Scam', color: 'var(--danger-text, var(--danger))', bg: 'var(--danger-dim)', border: 'var(--danger-border)', icon: <ShieldAlert size={15} /> },
            { tab: 'reship' as const, label: '⚠️ Package Reshipping Mule Trap', color: 'var(--warning-text, var(--warning))', bg: 'var(--warning-dim)', border: 'var(--warning-border)', icon: <AlertCircle size={15} /> },
            { tab: 'safe' as const, label: '✅ Verified Corporate Stripe Role', color: 'var(--safe-text, var(--safe))', bg: 'var(--safe-dim)', border: 'var(--safe-border)', icon: <ShieldCheck size={15} /> },
          ].map(({ tab, label, color, bg, border, icon }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 18px', borderRadius: 10,
                border: `1px solid ${activeTab === tab ? border : 'var(--border)'}`,
                background: activeTab === tab ? bg : 'transparent',
                color: activeTab === tab ? color : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
                transition: 'all 0.18s var(--ease)', display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => {
                if (activeTab !== tab) {
                  e.currentTarget.style.borderColor = color;
                  e.currentTarget.style.color = color;
                  e.currentTarget.style.background = bg;
                }
              }}
              onMouseLeave={e => {
                if (activeTab !== tab) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </AnalyticsCard>

      <div style={{ height: '32px' }} />

      {/* Main Extension Browser + Side Panel Mockup Grid */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: '24px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        
        {/* Browser Page Container */}
        <div style={{
          flex: '1 1 500px',
          background: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          {/* Browser Chrome Header */}
          <div style={{
            background: 'var(--bg-surface)',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22C55E' }}></div>
            </div>
            <div style={{
              flex: 1,
              background: 'var(--card-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              padding: '6px 16px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-mono)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              <Shield size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.url}</span>
            </div>
          </div>

          {/* Simulated Web Page Content */}
          <div style={{ padding: '32px', flex: 1, background: 'var(--bg-base)', position: 'relative' }}>
            
            {/* Floating Safety Badge Overlay (Injected Content Script Badge) */}
            <div style={{
              position: 'absolute', bottom: '24px', right: '24px', zIndex: 10,
              background: 'var(--card-bg)', color: 'var(--text)', padding: '8px 14px', borderRadius: '20px',
              border: `1px solid ${current.score >= 70 ? extTheme.dangerBorder : current.score >= 30 ? extTheme.warningBorder : extTheme.successBorder}`,
              boxShadow: 'var(--shadow)', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer'
            }}>
              <span>{activeTab === 'safe' ? '🟢 Safe' : activeTab === 'scam' ? '🔴 Scam' : '🟡 Caution'}</span>
            </div>

            {/* Posting Card */}
            <div style={{
              background: 'var(--card-bg)',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h2 style={{ color: 'var(--text)', fontSize: '20px', margin: '0 0 6px 0', fontWeight: 700 }}>{current.title}</h2>
              <div style={{ color: 'var(--primary)', fontSize: '14px', marginBottom: '16px', fontWeight: 600 }}>{current.company}</div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <span style={{ background: 'var(--safe-dim)', color: 'var(--safe-text, var(--safe))', border: '1px solid var(--safe-border)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>
                  {current.salary}
                </span>
                <span style={{ background: 'var(--primary-dim)', color: 'var(--primary)', border: '1px solid var(--primary-border)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px' }}>
                  {current.type}
                </span>
              </div>

              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '14px' }}>
                <strong style={{ color: 'var(--text)' }}>Job Description & Instructions:</strong>
                <p style={{ marginTop: 8, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{current.desc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Extension Popup Simulator */}
        <div style={{
          flex: '1 1 360px',
          maxWidth: '380px',
          margin: '0 auto',
          background: extTheme.bgBase,
          borderRadius: '16px',
          border: `1px solid ${extTheme.border}`,
          padding: '18px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-card)',
          fontFamily: 'var(--font)',
          color: extTheme.text,
          boxSizing: 'border-box',
          minHeight: '480px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Top semantic accent strip */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3.5,
            background: extTheme.primary,
            borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit',
          }} />

          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '12px',
            borderBottom: `1px solid ${extTheme.border}`,
            marginBottom: '16px',
            paddingTop: '2px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: extTheme.primaryDim,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: extTheme.primary,
                border: `1px solid ${extTheme.primaryBorder}`,
              }}>
                <Shield size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontStyle: 'normal', fontWeight: 900, fontSize: '15px', color: extTheme.text, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.2 }}>
                  JOB<span style={{ color: extTheme.primary }}>SHIELD</span>
                </span>
                <span style={{ fontSize: '10.5px', color: extTheme.textSecondary, fontWeight: 500, marginTop: '1px' }}>
                  AI Job Security Assistant
                </span>
              </div>
            </div>
            <div>
              <button 
                onClick={() => setCurrentMode(prev => prev === 'settings' ? 'main' : 'settings')}
                title="Settings"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: extTheme.textMuted, display: 'flex', padding: '6px',
                  borderRadius: '6px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = extTheme.text; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = extTheme.textMuted; e.currentTarget.style.background = 'transparent'; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Body content based on active state */}
          {currentMode === 'settings' ? (
            /* Settings View */
            <div className="animate-slide" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: extTheme.text }}>Extension Settings</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: extTheme.textSecondary }}>Show badge on job pages</span>
                <input type="checkbox" defaultChecked style={{ cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: extTheme.textSecondary }}>Ask before analyzing</span>
                <input type="checkbox" defaultChecked style={{ cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${extTheme.border}`, paddingTop: '12px' }}>
                <span style={{ fontSize: '12px', color: extTheme.textSecondary }}>Theme</span>
                <select style={{ background: 'var(--bg-input)', border: `1px solid ${extTheme.border}`, color: extTheme.text, padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                  <option>System</option>
                  <option>Dark</option>
                  <option>Light</option>
                </select>
              </div>

              <div style={{ borderTop: `1px solid ${extTheme.border}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '9px', color: extTheme.textMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Account</div>
                <div style={{ fontSize: '12px', color: extTheme.textSecondary }}>alex@jobshield.ai</div>
              </div>

              <button 
                onClick={() => setCurrentMode('main')}
                style={{
                  marginTop: '8px', width: '100%', padding: '10px 14px',
                  background: 'transparent', border: `1px solid ${extTheme.border}`, borderRadius: '8px',
                  color: extTheme.textSecondary, fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = extTheme.primary; e.currentTarget.style.color = extTheme.text; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = extTheme.border; e.currentTarget.style.color = extTheme.textSecondary; }}
              >
                ← Back to main
              </button>
            </div>
          ) : isScanning ? (
            /* Scanning View */
            <div className="animate-slide" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', padding: '8px 0' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '16px', color: extTheme.primary }}>Analyzing job posting...</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: '8px', gap: '8px' }}>
                {[
                  'Extracting job details...',
                  'Processing description...',
                  'Checking scam indicators...',
                  'Running risk analysis...'
                ].map((step, idx) => {
                  const isDone = idx < scanningStep;
                  const isCurrent = idx === scanningStep;
                  const stepColor = isDone ? extTheme.success : (isCurrent ? extTheme.primary : extTheme.textMuted);
                  const prefix = isDone ? '✓' : (isCurrent ? '→' : '○');
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: stepColor, fontWeight: isCurrent ? 700 : 500 }}>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{prefix}</span>
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : showResult ? (
            /* Result Screen */
            <div className="animate-slide" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* 1. Score section card — semantic tint */}
              <div style={{
                background: current.score >= 70 ? extTheme.dangerDim : current.score >= 30 ? extTheme.warningDim : extTheme.successDim,
                border: `1px solid ${current.score >= 70 ? extTheme.dangerBorder : current.score >= 30 ? extTheme.warningBorder : extTheme.successBorder}`,
                borderRadius: '12px', padding: '16px', textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '13px', fontWeight: 800,
                  color: current.score >= 70 ? extTheme.danger : current.score >= 30 ? extTheme.warning : extTheme.success,
                  letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px'
                }}>
                  {current.score >= 70 ? '🔴 HIGH RISK' : current.score >= 30 ? '🟡 CAUTION' : '🟢 LOW RISK'}
                </div>
                <div style={{ fontSize: '34px', fontWeight: 900, color: extTheme.text, lineHeight: 1, marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                  {current.score} <span style={{ fontSize: '14px', color: extTheme.textMuted, fontWeight: 500 }}>/ 100</span>
                </div>
                <div style={{ fontSize: '11.5px', color: extTheme.textSecondary, fontWeight: 500 }}>
                  AI confidence 96%
                </div>
              </div>

              {/* 2. Job Details Card */}
              <div style={{
                background: extTheme.bgCard, border: `1px solid ${extTheme.border}`,
                borderRadius: '12px', padding: '16px', textAlign: 'left'
              }}>
                <div style={{ fontSize: '9px', color: extTheme.textMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>Job Details</div>
                <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, color: extTheme.text, lineHeight: 1.3 }}>{current.title}</h3>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: extTheme.textSecondary, marginBottom: '4px' }}>{current.company}</div>
                <div style={{ fontSize: '11px', color: extTheme.textMuted, fontWeight: 500 }}>
                  {activeTab === 'safe' ? 'San Francisco, CA' : activeTab === 'scam' ? 'Remote' : 'Work From Home'} · {activeTab === 'safe' ? 'LinkedIn' : activeTab === 'scam' ? 'Indeed' : 'Glassdoor'}
                </div>
              </div>

              {/* 3. Why Flagged / Analysis Summary Card */}
              <div style={{
                background: extTheme.bgCard, border: `1px solid ${extTheme.border}`,
                borderRadius: '12px', padding: '16px', textAlign: 'left'
              }}>
                {current.score >= 30 ? (
                  <>
                    <div style={{ fontSize: '10px', color: current.score >= 70 ? extTheme.danger : extTheme.warning, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⚠️</span> <span>Why this was flagged</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {current.checklist.filter(c => !c.pass).map((sig, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: extTheme.textSecondary, lineHeight: 1.4 }}>
                          <span style={{ fontSize: '12px', lineHeight: 1.2 }}>{current.score >= 70 ? '🔴' : '🟡'}</span>
                          <span style={{ fontWeight: 500 }}>{sig.label.replace('❌ ', '')}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '10px', color: extTheme.success, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontFamily: 'var(--font-mono)' }}>Analysis Summary</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {current.checklist.filter(c => c.pass).slice(0, 3).map((sig, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: extTheme.textSecondary, lineHeight: 1.4 }}>
                          <span style={{ color: extTheme.success, fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.2 }}>✓</span>
                          <span style={{ fontWeight: 500 }}>{sig.label.replace('✓ ', '')}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* 4. Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                <button 
                  onClick={() => onNavigate?.('REPORTS')}
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: extTheme.btnPrimaryBg, border: 'none', borderRadius: '8px',
                    color: extTheme.btnPrimaryText, fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = extTheme.btnPrimaryHoverBg; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = extTheme.btnPrimaryBg; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                >
                  <span>View Full Analysis</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1 }}>→</span>
                </button>
                <button 
                  onClick={triggerScan}
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: extTheme.btnSecondaryBg, border: `1px solid ${extTheme.border}`, borderRadius: '8px',
                    color: extTheme.textSecondary, fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = extTheme.primary; e.currentTarget.style.color = extTheme.text; e.currentTarget.style.background = extTheme.btnSecondaryHoverBg; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = extTheme.border; e.currentTarget.style.color = extTheme.textSecondary; e.currentTarget.style.background = extTheme.btnSecondaryBg; }}
                >
                  Analyze Again
                </button>
              </div>

            </div>
          ) : (
            /* Job Detected state (Ready to Scan) */
            <div className="animate-slide" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '10px', color: extTheme.primary, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Job Detected</div>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: extTheme.text }}>{current.title}</h3>
                <div style={{ fontSize: '13px', color: extTheme.textSecondary, marginBottom: '12px' }}>{current.company}</div>
                <div style={{ fontSize: '12px', color: extTheme.textMuted }}>
                  📍 {activeTab === 'safe' ? 'San Francisco, CA' : activeTab === 'scam' ? 'Remote' : 'Work From Home'}
                </div>
              </div>

              <button 
                onClick={triggerScan}
                style={{
                  width: '100%', padding: '10px 14px',
                  background: extTheme.btnPrimaryBg, border: 'none', borderRadius: '8px',
                  color: extTheme.btnPrimaryText, fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = extTheme.btnPrimaryHoverBg; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = extTheme.btnPrimaryBg; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                Analyze Job
              </button>
            </div>
          )}

          {/* Powered by footer */}
          <div style={{ textAlign: 'center', fontSize: '11px', color: extTheme.textMuted, marginTop: 'auto', paddingTop: '24px' }}>
            <div>Powered by JobShield AI</div>
            <div style={{ marginTop: '2px', fontSize: '10px' }}>Threat Database Updated: 2 mins ago</div>
          </div>
        </div>

      </div>

      <div style={{ height: '40px' }} />

      {/* Feature Highlights Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14.5px', fontWeight: 700, color: 'var(--text)' }}>Real-Time Detection</h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Scans job page DOM elements on LinkedIn, Indeed, Naukri, Internshala, and Glassdoor automatically as you browse.
          </p>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14.5px', fontWeight: 700, color: 'var(--text)' }}>Risk Scoring</h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Computes security vulnerability levels using combined domain forensics, SSL validation, and description analysis.
          </p>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14.5px', fontWeight: 700, color: 'var(--text)' }}>Visual Warnings</h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Injects discrete floating status badges into supported job platforms to warn you directly on the page.
          </p>
        </div>
      </div>
    </div>
  );
}
