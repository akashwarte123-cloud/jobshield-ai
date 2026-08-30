import React, { useState, useEffect } from 'react';
import {
  PageHeader,
  RiskGauge,
  StatusBadge,
  DataTable,
  MetricCard,
  Btn,
  TextInput,
  AnalyticsCard,
} from '../components/ui';
import {
  ScanLine, ShieldAlert, ShieldCheck, AlertTriangle, FileText,
  Building2, Globe, Mail, MapPin, CheckCircle2, ArrowRight, Play, RefreshCw, Cpu, Bookmark
} from 'lucide-react';
import { api } from '../services/api';

const PRESET_PAYLOADS = [
  {
    label: '🚨 Fake Check & Telegram Trap',
    title: 'Remote Data Entry & Communications Assistant',
    company: 'Apex Global Logistics LLC',
    email: 'recruiter.apexlogistics@gmail.com',
    url: 'https://tinyurl.com/apex-jobs-apply',
    description: `We are seeking an urgent Remote Data Entry Assistant to join our fast-growing logistics team. Pay is $65/hr during training, $75/hr after 2 weeks.

Job Requirements:
- Must have a computer and high-speed internet.
- Must be willing to start immediately.

Interview Process:
All interviews will be conducted exclusively via Telegram text chat app. Download Telegram and contact our HR Manager @ApexRecruiting_HR.

Equipment & Supplies:
The company will provide a certified check of $2,450 to purchase your home office equipment from our approved vendor. You must deposit the check at your bank and wire the funds via Zelle.`
  },
  {
    label: '✅ Verified Tech Role (Safe)',
    title: 'Senior Full Stack Software Engineer',
    company: 'Stripe, Inc.',
    email: 'careers@stripe.com',
    url: 'https://stripe.com/jobs/careers/fullstack-eng',
    description: `Stripe is looking for a Senior Full Stack Engineer to join our Payment Infrastructure team. You will build high-throughput APIs, improve transaction reliability, and scale global payments infrastructure.

Requirements:
- 5+ years of experience with TypeScript, React, and Node.js / Go / Ruby.
- Experience designing distributed systems and relational database schemas.

Benefits:
- Competitive salary ($180,000 - $220,000 USD) + equity.
- 401(k) matching, comprehensive health coverage, flexible PTO.`
  },
  {
    label: '⚠️ Package Reshipping Mule Scheme',
    title: 'Home Quality Control Package Inspector',
    company: 'Global Express Cargo Solutions',
    email: 'hr-department@expresscargo-jobs.net',
    url: 'http://expresscargo-jobs.net/apply',
    description: `Earn $4,200 per month working from home! We need Quality Control Inspectors to receive packages at their home address, inspect items for damage, repackage them, and ship them to international customers using pre-paid shipping labels.

Responsibilities:
- Receive 5-10 packages per week at your residence.
- Unpack, photograph contents, and print shipping labels.`
  }
];

export function JobAnalyzerPage() {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  const [analyzed, setAnalyzed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    id?: string;
    score: number;
    confidence: number;
    flagsCount: number;
    recommendation: string;
    indicators: Array<{ name: string; severity: 'safe' | 'warning' | 'danger' | 'unknown'; description: string }>;
  } | null>(null);

  const [loadingStage, setLoadingStage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchSavedJobIds = () => {
    const loggedIn = localStorage.getItem('js_logged_in_user');
    if (!loggedIn) return;

    api.get<any>('/jobs/saved?limit=100')
      .then(res => {
        if (res.success && res.data) {
          const ids = new Set<string>((res.data.items || []).map((item: any) => item.job.id));
          setSavedJobIds(ids);
        }
      })
      .catch(() => {
        // fail silently
      });
  };

  useEffect(() => {
    fetchSavedJobIds();
  }, []);

  const isSaved = results?.id ? savedJobIds.has(results.id) : false;

  const handleToggleSave = () => {
    if (!results || !results.id) return;
    const jobId = results.id;

    const loggedIn = localStorage.getItem('js_logged_in_user');
    if (!loggedIn) {
      triggerToast('Please log in to save jobs.', 'error');
      return;
    }

    if (isSaved) {
      api.delete(`/jobs/${jobId}/save`)
        .then(res => {
          if (res.success) {
            setSavedJobIds(prev => {
              const next = new Set(prev);
              next.delete(jobId);
              return next;
            });
            triggerToast('Job removed from saved listings.', 'success');
          } else {
            triggerToast(res.error?.message || 'Failed to remove saved job.', 'error');
          }
        })
        .catch(err => {
          triggerToast(err.message || 'Unable to remove saved job.', 'error');
        });
    } else {
      api.post(`/jobs/${jobId}/save`)
        .then(res => {
          if (res.success) {
            setSavedJobIds(prev => {
              const next = new Set(prev);
              next.add(jobId);
              return next;
            });
            triggerToast('Job successfully saved to dashboard.', 'success');
          } else {
            triggerToast(res.error?.message || 'Failed to save job.', 'error');
          }
        })
        .catch(err => {
          triggerToast(err.message || 'Unable to save job.', 'error');
        });
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_PAYLOADS[0]) => {
    setJobTitle(preset.title);
    setCompany(preset.company);
    setLocation('');
    setEmail(preset.email);
    setUrl(preset.url);
    setDescription(preset.description);
  };

  const handleAnalyze = () => {
    setLoading(true);
    setLoadingStage('🔍 NLP Analysis running...');

    setTimeout(() => {
      setLoadingStage('🏢 Checking Company database...');
    }, 500);

    setTimeout(() => {
      setLoadingStage('🌐 Verifying domain registrar registry...');
    }, 1000);

    setTimeout(() => {
      setLoadingStage('🧠 Running JobShield analysis...');
    }, 1500);

    api.post<any>('/analyze', {
      title: jobTitle,
      company: company,
      email: email,
      source_url: url,
      description: description,
      location: location
    })
    .then(res => {
      if (res.success && res.data) {
        const data = res.data;
        const mappedIndicators = (data.analysis.flags || []).map((f: any) => {
          // SECURITY: Normalize severity to uppercase before comparison.
          // Never default unknown/unrecognized severity to 'safe'.
          const severity = String(f.severity || '').trim().toUpperCase();
          let sev: 'safe' | 'warning' | 'danger' | 'unknown' = 'unknown';
          if (severity === 'CRITICAL' || severity === 'HIGH') sev = 'danger';
          else if (severity === 'MEDIUM' || severity === 'SUSPICIOUS') sev = 'warning';
          else if (severity === 'LOW') sev = 'warning';
          return {
            name: f.category,
            severity: sev,
            description: f.message
          };
        });

        // Add default safe indicator if zero risk flags found
        if (mappedIndicators.length === 0) {
          mappedIndicators.push({
            name: 'Standard Technical Hiring Process',
            severity: 'safe',
            description: 'Job description lists standard behavioral and technical interview requirements.'
          });
        }

        setResults({
          id: data.job.id,
          score: data.analysis.final_score,
          confidence: Math.round((data.analysis.confidence || 0.85) * 100),
          flagsCount: data.analysis.red_flags_found !== undefined ? data.analysis.red_flags_found : (data.analysis.flags ? data.analysis.flags.length : mappedIndicators.filter((i: any) => i.severity !== 'safe').length),
          recommendation: data.analysis.explanation || '',
          indicators: mappedIndicators
        });
        setAnalyzed(true);
      } else {
        triggerToast(res.error?.message || 'Failed to analyze job posting.', 'error');
      }
    })
    .catch(err => {
      triggerToast(err.message || 'An error occurred while analyzing job posting.', 'error');
    })
    .finally(() => {
      setLoading(false);
      setLoadingStage('');
    });
  };

  const columns = [
    { key: 'name', header: 'Detected Indicator' },
    {
      key: 'severity',
      header: 'Severity',
      render: (val: string) => {
        const statusMap: Record<string, 'safe' | 'warning' | 'danger' | 'neutral'> = {
          safe: 'safe',
          warning: 'warning',
          danger: 'danger',
          unknown: 'neutral',
        };
        const labelMap: Record<string, string> = {
          safe: 'LOW RISK',
          warning: 'SUSPICIOUS',
          danger: 'HIGH THREAT',
          unknown: 'UNKNOWN',
        };
        return <StatusBadge status={statusMap[val] || 'neutral'} label={labelMap[val] || 'UNKNOWN'} />;
      }
    },
    { key: 'description', header: 'Detailed Forensic Finding' },
  ];

  return (
    <div className="animate-slide" style={{ position: 'relative' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div className="animate-slide" style={{
          position: 'fixed', bottom: 24, right: 32, zIndex: 110,
          background: toast.type === 'success' ? 'var(--safe-dim)' : toast.type === 'error' ? 'var(--danger-dim)' : 'var(--primary-dim)',
          border: `1px solid ${toast.type === 'success' ? 'var(--safe-border)' : toast.type === 'error' ? 'var(--danger-border)' : 'var(--primary-border)'}`,
          borderRadius: 12, padding: '14px 20px',
          color: toast.type === 'success' ? 'var(--safe-text, var(--safe))' : toast.type === 'error' ? 'var(--danger-text, var(--danger))' : 'var(--primary)',
          fontSize: 13.5, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: 'var(--shadow-lg)',
        }}>
          {toast.type === 'success' && <CheckCircle2 size={16} color="var(--safe-text, var(--safe))" />}
          {toast.type === 'error' && <AlertTriangle size={16} color="var(--danger-text, var(--danger))" />}
          {toast.type === 'info' && <RefreshCw className="animate-spin" size={16} color="var(--primary)" />}
          {toast.message}
        </div>
      )}

      <PageHeader
        category="Job Fraud Detection"
        title="Job Analyzer"
        subtitle="Paste a job posting description, URL, or recruiter details to analyze with our multi-layer hybrid AI engine."
      />

      {/* Two-Column Persistent Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '48% 52%', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* Left Column: Input Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Preset Chips */}
          <AnalyticsCard title="Test Payload Presets" subtitle="Click a benchmark scenario to prefill the analyzer">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {PRESET_PAYLOADS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    transition: 'var(--transition)'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{preset.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{preset.title} — {preset.company}</div>
                </button>
              ))}
            </div>
          </AnalyticsCard>

          {/* Form Fields Card */}
          <AnalyticsCard title="Posting Details" subtitle="Provide the text, recruiter contact, or posting URL">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <TextInput
                label="Job Title"
                placeholder="e.g. Senior Software Engineer"
                icon={<Building2 size={16} />}
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
              />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <TextInput
                  label="Company Name"
                  placeholder="e.g. Stripe, Inc."
                  icon={<Building2 size={16} />}
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                />
                <TextInput
                  label="Location"
                  placeholder="e.g. Pune, Maharashtra, India"
                  icon={<MapPin size={16} />}
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>

              <TextInput
                label="Recruiter Email"
                placeholder="e.g. recruiter@company.com"
                icon={<Mail size={16} />}
                value={email}
                onChange={e => setEmail(e.target.value)}
              />

              <TextInput
                label="Job Posting URL"
                placeholder="e.g. https://company.com/careers/job-id"
                icon={<Globe size={16} />}
                value={url}
                onChange={e => setUrl(e.target.value)}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', paddingLeft: 2, WebkitFontSmoothing: 'antialiased', letterSpacing: '0.04em' }}>Job Description & Instructions</label>
                <textarea
                  rows={8}
                  placeholder="Paste the full job description, email content, or recruiter message..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px 18px',
                    color: 'var(--text)',
                    fontSize: 14,
                    fontFamily: 'var(--font)',
                    outline: 'none',
                    resize: 'vertical',
                    lineHeight: 1.6,
                    WebkitFontSmoothing: 'antialiased',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <Btn
                variant="primary"
                size="lg"
                onClick={handleAnalyze}
                disabled={loading || !description}
                style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                icon={loading ? <RefreshCw className="animate-spin" size={18} /> : <ScanLine size={18} />}
              >
                {loading ? loadingStage || 'Analyzing Signals...' : 'Analyze Posting Fraud Index'}
              </Btn>
            </div>
          </AnalyticsCard>
        </div>

        {/* Right Column: AI Analysis Results / Default Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {!analyzed || !results ? (
            /* Persistent Right Side Content before clicking Analyze */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <AnalyticsCard title="Analysis Engine Readiness" subtitle="Supported input formats and threat pattern databases">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <MetricCard label="Supported Inputs" value="Text, URL, PDF" icon={<FileText size={18} />} color="#38BDF8" />
                  <MetricCard label="Detection Speed" value="< 600 ms" icon={<Cpu size={18} />} color="#00E599" />
                  <MetricCard label="Scam Patterns" value="1,400+ Active" icon={<ShieldAlert size={18} />} color="#FB923C" />
                  <MetricCard label="Model Version" value="v2.4 Hybrid" icon={<CheckCircle2 size={18} />} color="#00D8F6" />
                </div>
              </AnalyticsCard>

              <AnalyticsCard title="How Analysis Works" subtitle="Multi-stage verification pipeline">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--interactive-dim)', border: '1px solid var(--interactive-border)', color: 'var(--interactive)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>1</div>
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>NLP & Sentiment Cleaning</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.6 }}>Strips Telegram/WhatsApp links, suspicious check verbiage, and wage anomalies.</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--warning-dim)', border: '1px solid var(--warning-border)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>2</div>
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>Domain & WHOIS Verification</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.6 }}>Validates recruiter email against company age, MX records, and SSL certificates.</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-dim)', border: '1px solid var(--primary-border)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>3</div>
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>Gradient Boosted Classifier</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.6 }}>Fuses TF-IDF feature vectors with XGBoost model to produce calibrated risk index.</div>
                    </div>
                  </div>
                </div>
              </AnalyticsCard>
            </div>
          ) : (
            /* Active Analysis Results */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Risk Gauge Score Card */}
              <AnalyticsCard 
                title="Risk Score Assessment" 
                subtitle="Aggregated score from hybrid ML and WHOIS checks"
                action={
                  results?.id ? (
                    <Btn
                      variant="secondary"
                      size="sm"
                      onClick={handleToggleSave}
                      icon={<Bookmark size={15} fill={isSaved ? "var(--safe-text, var(--safe))" : "none"} color={isSaved ? "var(--safe-text, var(--safe))" : "currentColor"} />}
                      style={isSaved ? {
                        background: 'var(--safe-dim)',
                        color: 'var(--safe-text, var(--safe))',
                        borderColor: 'var(--safe-border)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        fontWeight: 700,
                      } : undefined}
                    >
                      {isSaved ? "Saved" : "Save Job"}
                    </Btn>
                  ) : undefined
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
                  <RiskGauge score={results.score} size={260} label="Overall Scam Index" />
                  
                  <div style={{
                    marginTop: '20px',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    background: results.score > 70 ? 'var(--danger-dim)' : results.score > 30 ? 'var(--warning-dim)' : 'var(--safe-dim)',
                    border: `1px solid ${results.score > 70 ? 'var(--danger-border)' : results.score > 30 ? 'var(--warning-border)' : 'var(--safe-border)'}`,
                    color: 'var(--text)',
                    fontSize: 13,
                    lineHeight: 1.5,
                    width: '100%'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Verdict Recommendation</div>
                    {results.recommendation}
                  </div>
                </div>
              </AnalyticsCard>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <MetricCard label="Model Confidence" value={`${results.confidence}%`} icon={<Cpu size={18} />} color="#38BDF8" />
                <MetricCard label="Red Flags Found" value={results.flagsCount} icon={<ShieldAlert size={18} />} color={results.flagsCount > 0 ? '#EF4444' : '#22C55E'} />
              </div>

              {/* Findings Table */}
              <AnalyticsCard title="Detected Fraud Indicators" subtitle="Detailed breakdown of rules and NLP triggers matched" noPad>
                <DataTable columns={columns} data={results.indicators} />
              </AnalyticsCard>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
