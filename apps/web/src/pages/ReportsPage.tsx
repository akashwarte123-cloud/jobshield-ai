import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PageHeader, AnalyticsCard, StatusBadge, EmptyState, Btn } from '../components/ui';
import { Search, Eye, RefreshCw, Filter, X, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

interface ReportsPageProps {
  onNavigate?: (view: string) => void;
}

interface HistoryItem {
  id: string;
  title: string;
  company: string;
  domain: string;
  verdict: 'SAFE' | 'SUSPICIOUS' | 'SCAM';
  date: string;
  score: number;
}

const verdictColor = (v: HistoryItem['verdict']) =>
  v === 'SAFE' ? 'var(--safe-text, var(--safe))' : v === 'SCAM' ? 'var(--danger-text, var(--danger))' : 'var(--warning-text, var(--warning))';
const verdictBg = (v: HistoryItem['verdict']) =>
  v === 'SAFE' ? 'var(--safe-dim)' : v === 'SCAM' ? 'var(--danger-dim)' : 'var(--warning-dim)';
const verdictBorder = (v: HistoryItem['verdict']) =>
  v === 'SAFE' ? 'var(--safe-border)' : v === 'SCAM' ? 'var(--danger-border)' : 'var(--warning-border)';
const verdictLabel = (v: HistoryItem['verdict']) =>
  v === 'SAFE' ? 'SAFE' : v === 'SCAM' ? 'HIGH RISK' : 'SUSPICIOUS';

function normalizeFlagSeverity(rawSev: any): 'danger' | 'warning' | 'safe' | 'unknown' {
  const severity = String(rawSev || '').trim().toUpperCase();
  if (severity === 'CRITICAL' || severity === 'HIGH') return 'danger';
  if (severity === 'MEDIUM') return 'warning';
  if (severity === 'LOW') return 'safe';
  return 'unknown';
}

function extractDomain(urlOrEmail?: string | null): string {
  if (!urlOrEmail) return '';
  let cleaned = urlOrEmail.trim();
  if (cleaned.includes('@')) {
    cleaned = cleaned.split('@').pop() || '';
  }
  cleaned = cleaned.replace(/^https?:\/\//i, '');
  cleaned = cleaned.split(/[/?#:]/)[0].trim();
  cleaned = cleaned.replace(/^www\./i, '');
  return cleaned.toLowerCase();
}

function extractSalary(text?: string | null): string {
  if (!text || typeof text !== 'string') return '';
  const clean = text.trim();

  // Tier 1: Check labeled salary line
  const labelMatch = clean.match(/(?:^|[\r\n•\-\*|])\s*(?:base\s*pay|salary\s*offered|salary\s*range|salary|ctc|compensation|remuneration|stipend|pay\s*package|annual\s*package|pay)\s*[:=\-–—]\s*([^\r\n;]+)/i);
  if (labelMatch && labelMatch[1]) {
    let raw = labelMatch[1].trim().replace(/^[•\-\*:\s]+/, '');
    if (raw.length < 100) {
      const subLpa = raw.match(/(?:(?:₹|rs\.?|inr)\s*)?\d+(?:\.\d+)?\s*(?:[-–—]|to)\s*(?:(?:₹|rs\.?|inr)\s*)?\d+(?:\.\d+)?\s*(?:lpa|l\.p\.a\.?|lakhs?(?:\s*(?:per\s*annum|\/year|p\.a\.?|pa))?|lac(?:s)?(?:\s*(?:per\s*annum|\/year|p\.a\.?|pa))?)/i);
      if (subLpa) return subLpa[0].trim();

      const subSingleLpa = raw.match(/(?:(?:₹|rs\.?|inr)\s*)?\d+(?:\.\d+)?\s*(?:lpa|l\.p\.a\.?|lakhs?\s*(?:per\s*annum|\/year|p\.a\.?|pa)|lac(?:s)?\s*(?:per\s*annum|\/year|p\.a\.?|pa))/i);
      if (subSingleLpa) return subSingleLpa[0].trim();

      const subRupee = raw.match(/(?:₹|rs\.?|inr)\s*\d{1,3}(?:,\d{2,3})*(?:\.\d+)?(?:\s*(?:[-–—]|to)\s*(?:(?:₹|rs\.?|inr)\s*)?\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)?\s*(?:\/(?:month|mo|hr|hour|year|yr|annum)|per\s*(?:month|mo|hr|hour|year|yr|annum)|p\.m\.|p\.a\.)/i);
      if (subRupee) return subRupee[0].trim();

      const subWestern = raw.match(/(?:\$|€|£)\s*\d{1,3}(?:,\d{3})*(?:k)?(?:\s*(?:[-–—]|to)\s*(?:\$|€|£)?\s*\d{1,3}(?:,\d{3})*(?:k)?)?\s*(?:\/(?:yr|year|month|mo|hr|hour|wk|week)|per\s*(?:year|yr|month|mo|hr|hour|week|wk)|annually)/i);
      if (subWestern) return subWestern[0].trim();

      if (/(?:₹|rs\.?|inr|\$|€|£|lpa|l\.p\.a|lakh|lac|per\s*(?:month|mo|annum|year)|\/(?:month|mo|hr|yr|year)|p\.m\.|p\.a\.)/i.test(raw)) {
        raw = raw.replace(/[\.\s,;]+$/, '');
        raw = raw.replace(/\s*\([^)]*(?:exp|interview|candidate|do[eE]|performance)[^)]*\)/i, '').trim();
        if (raw) return raw;
      }
    }
  }

  // Tier 2: LPA range
  const lpaMatch = clean.match(/(?:(?:₹|rs\.?|inr)\s*)?\d+(?:\.\d+)?\s*(?:[-–—]|to)\s*(?:(?:₹|rs\.?|inr)\s*)?\d+(?:\.\d+)?\s*(?:lpa|l\.p\.a\.?|lakhs?(?:\s*(?:per\s*annum|\/year|p\.a\.?|pa))?|lac(?:s)?(?:\s*(?:per\s*annum|\/year|p\.a\.?|pa))?)/i);
  if (lpaMatch) return lpaMatch[0].trim();

  // Single LPA
  const singleLpa = clean.match(/(?:(?:₹|rs\.?|inr)\s*)?\d+(?:\.\d+)?\s*(?:lpa|l\.p\.a\.?|lakhs?\s*(?:per\s*annum|\/year|p\.a\.?|pa)|lac(?:s)?\s*(?:per\s*annum|\/year|p\.a\.?|pa))/i);
  if (singleLpa) return singleLpa[0].trim();

  // Currency + lakhs
  const currLakh = clean.match(/(?:₹|rs\.?|inr)\s*\d+(?:\.\d+)?\s*(?:lakhs?|lac(?:s)?)/i);
  if (currLakh) return currLakh[0].trim();

  // Rupee range / single with frequency
  const rupeeMatch = clean.match(/(?:₹|rs\.?|inr)\s*\d{1,3}(?:,\d{2,3})*(?:\.\d+)?(?:\s*(?:[-–—]|to)\s*(?:(?:₹|rs\.?|inr)\s*)?\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)?\s*(?:\/(?:month|mo|hr|hour|year|yr|annum)|per\s*(?:month|mo|hr|hour|year|yr|annum)|p\.m\.|p\.a\.)/i);
  if (rupeeMatch) return rupeeMatch[0].trim();

  // Western currency with frequency
  const westernMatch = clean.match(/(?:\$|€|£)\s*\d{1,3}(?:,\d{3})*(?:k)?(?:\s*(?:[-–—]|to)\s*(?:\$|€|£)?\s*\d{1,3}(?:,\d{3})*(?:k)?)?\s*(?:\/(?:yr|year|month|mo|hr|hour|wk|week)|per\s*(?:year|yr|month|mo|hr|hour|week|wk)|annually)/i);
  if (westernMatch) return westernMatch[0].trim();

  return '';
}

export function ReportsPage({ onNavigate }: ReportsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SAFE' | 'SUSPICIOUS' | 'SCAM'>('ALL');
  
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal States
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [detailedReport, setDetailedReport] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [rescanningId, setRescanningId] = useState<string | null>(null);

  // Export & Toast States
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const handleRescan = (analysisId: string) => {
    if (rescanningId) return;
    setRescanningId(analysisId);
    triggerToast('Re-scanning job listing details...', 'info');

    api.get(`/analyses/${analysisId}`)
      .then(res => {
        const data = res.data as any;
        if (!res.success || !data || !data.job) {
          throw new Error('Could not fetch existing job details for re-scan.');
        }
        const job = data.job;
        const payload = {
          title: job.title || '',
          company: job.company || '',
          location: job.location || '',
          salary: job.salary || '',
          employment_type: job.employment_type || '',
          source: job.source || '',
          source_url: job.source_url || '',
          description: job.description || ''
        };
        return api.post('/analyze', payload);
      })
      .then(res => {
        const data = res.data as any;
        if (res.success && data) {
          triggerToast('✓ Re-scan complete! Updated report loaded.', 'success');
          fetchHistory();
          const newId = String(data.analysis_id || (data.analysis && data.analysis.id) || analysisId);
          handleViewReport(newId);
        } else {
          triggerToast(res.error?.message || 'Re-scan analysis failed.', 'error');
        }
      })
      .catch(err => {
        triggerToast(err.message || 'An error occurred while re-scanning.', 'error');
      })
      .finally(() => {
        setRescanningId(null);
      });
  };

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    if (exporting) return;
    setExporting(format);
    triggerToast(`Generating ${format.toUpperCase()} scan report...`, 'info');
    api.download(`/analyses/export/${format}`, `jobshield_scan_history.${format}`)
      .then(() => {
        triggerToast(`Download complete: jobshield_scan_history.${format}`, 'success');
      })
      .catch(err => {
        triggerToast(err.message || `Failed to download ${format.toUpperCase()} report.`, 'error');
      })
      .finally(() => {
        setExporting(null);
      });
  };

  const fetchHistory = () => {
    setLoading(true);
    setError(null);
    // Request 100 recent items to allow local sorting and filtering
    api.get('/analyses?limit=100')
      .then(res => {
        if (res.success && res.data) {
          const items = ((res.data as any).items || []).map((item: any) => {
            const score = item.analysis.final_score;
            let verdict: 'SAFE' | 'SUSPICIOUS' | 'SCAM' = 'SAFE';
            if (score >= 60) verdict = 'SCAM';
            else if (score >= 30) verdict = 'SUSPICIOUS';

            // Extract domain from backend job/analysis domain, or fallback to source_url extraction
            let domain = item.job?.domain || item.analysis?.domain;
            if (!domain && item.job?.source_url) {
              domain = extractDomain(item.job.source_url);
            }
            if (!domain) {
              domain = 'NOT AVAILABLE';
            }

            return {
              id: item.analysis_id,
              title: item.job.title,
              company: item.job.company,
              domain: domain,
              verdict: verdict,
              date: new Date(item.analysis.analyzed_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }),
              score: score
            };
          });
          setHistoryData(items);
        } else {
          setError(res.error?.message || 'Failed to fetch history.');
        }
      })
      .catch(err => {
        setError(err.message || 'An error occurred while loading scans.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
    const params = new URLSearchParams(window.location.search);
    const analysisIdParam = params.get('analysisId');
    if (analysisIdParam) {
      handleViewReport(analysisIdParam);
    }
  }, []);

  // Lock background body scroll and listen for Escape key when modal is active
  useEffect(() => {
    if (!selectedReportId) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedReportId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedReportId]);

  const handleViewReport = (analysisId: string) => {
    setSelectedReportId(analysisId);
    setLoadingDetail(true);
    setDetailedReport(null);

    api.get(`/analyses/${analysisId}`)
      .then(res => {
        if (res.success) {
          setDetailedReport(res.data);
        }
      })
      .catch(err => {
        console.error('Error loading analysis details:', err);
      })
      .finally(() => {
        setLoadingDetail(false);
      });
  };

  const filteredHistory = historyData.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.verdict === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const safeCount = historyData.filter(i => i.verdict === 'SAFE').length;
  const scamCount = historyData.filter(i => i.verdict === 'SCAM').length;
  const suspCount = historyData.filter(i => i.verdict === 'SUSPICIOUS').length;

  const filterBtn = (label: string, val: typeof statusFilter, color: string, bg: string) => (
    <button
      onClick={() => setStatusFilter(val)}
      style={{
        padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
        border: `1px solid ${statusFilter === val ? color : 'var(--border)'}`,
        background: statusFilter === val ? bg : 'transparent',
        color: statusFilter === val ? color : 'var(--text-secondary)',
        fontFamily: 'var(--font)', transition: 'all 0.18s var(--ease)',
      }}
      onMouseEnter={e => { if (statusFilter !== val) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--text)'; } }}
      onMouseLeave={e => { if (statusFilter !== val) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
    >
      {label}
    </button>
  );

  return (
    <div>
      <PageHeader
        category="Job Verification"
        title="Scan History"
        subtitle="All previously scanned job postings with forensic audit findings. Click any row to view the full report."
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null}
              className="btn-secondary"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 'var(--radius-btn)', fontSize: 12.5, fontWeight: 700,
                cursor: exporting ? 'not-allowed' : 'pointer',
                background: 'var(--primary-dim)', border: '1px solid var(--primary-border)',
                color: 'var(--primary)', opacity: exporting === 'pdf' ? 0.7 : 1,
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={e => { if (!exporting) e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onMouseLeave={e => { if (!exporting) e.currentTarget.style.borderColor = 'var(--primary-border)'; }}
            >
              <FileDown size={14} /> {exporting === 'pdf' ? 'Generating PDF...' : 'Download PDF'}
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting !== null}
              className="btn-secondary"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 'var(--radius-btn)', fontSize: 12.5, fontWeight: 700,
                cursor: exporting ? 'not-allowed' : 'pointer',
                background: 'var(--primary-dim)', border: '1px solid var(--primary-border)',
                color: 'var(--primary)', opacity: exporting === 'csv' ? 0.7 : 1,
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={e => { if (!exporting) e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onMouseLeave={e => { if (!exporting) e.currentTarget.style.borderColor = 'var(--primary-border)'; }}
            >
              <FileText size={14} /> {exporting === 'csv' ? 'Generating CSV...' : 'Download CSV'}
            </button>
          </div>
        }
      />

      {/* ─── Summary Stats Strip ─── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24,
      }}>
        {[
          { label: 'Total Scanned', value: historyData.length, color: 'var(--text)', bg: 'var(--bg-surface)', border: 'var(--border)', icon: <FileText size={16} color="var(--text-secondary)" /> },
          { label: 'Safe Verified', value: safeCount, color: 'var(--safe-text, var(--safe))', bg: 'var(--safe-dim)', border: 'var(--safe-border)', icon: <ShieldCheck size={16} color="var(--safe-text, var(--safe))" /> },
          { label: 'Suspicious', value: suspCount, color: 'var(--warning-text, var(--warning))', bg: 'var(--warning-dim)', border: 'var(--warning-border)', icon: <AlertTriangle size={16} color="var(--warning-text, var(--warning))" /> },
          { label: 'Scams Detected', value: scamCount, color: 'var(--danger-text, var(--danger))', bg: 'var(--danger-dim)', border: 'var(--danger-border)', icon: <ShieldAlert size={16} color="var(--danger-text, var(--danger))" /> },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 14, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
            transition: 'all 0.18s var(--ease)',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1.1, fontFamily: 'var(--font)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Search & Filters Card ─── */}
      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 14, padding: '16px 20px', marginBottom: 20,
        display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          padding: '8px 16px', borderRadius: 10, width: 340,
          transition: 'all 0.18s ease',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <Search size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search company, title, or domain..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)', width: '100%',
              paddingLeft: 4, letterSpacing: '-0.01em',
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <X size={13} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            <Filter size={12} /> Filter
          </span>
          {filterBtn('All', 'ALL', 'var(--primary-text, var(--primary))', 'var(--primary-dim)')}
          {filterBtn('🟢 Safe', 'SAFE', 'var(--safe-text, var(--safe))', 'var(--safe-dim)')}
          {filterBtn('🟡 Suspicious', 'SUSPICIOUS', 'var(--warning-text, var(--warning))', 'var(--warning-dim)')}
          {filterBtn('🔴 Scam', 'SCAM', 'var(--danger-text, var(--danger))', 'var(--danger-dim)')}
        </div>
      </div>

      {/* ─── History List ─── */}
      <AnalyticsCard
        title={`Scanned Job Listings — ${filteredHistory.length} Results`}
        subtitle="Click View Report to read forensic findings. Click Scan Again to re-run a scan."
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 12 }}>
            <RefreshCw size={24} className="spin" color="var(--primary)" />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Loading history records...</span>
          </div>
        ) : error ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--danger)', fontSize: 13 }}>
            ⚠️ {error}
          </div>
        ) : filteredHistory.length === 0 ? (
          <EmptyState
            title="No scans yet. Analyze your first job posting."
            description="Try adjusting your search or filter criteria, or run a new AI threat scan."
            action={
              <Btn onClick={() => onNavigate?.('ANALYZER')} variant="primary">
                Start AI Scan →
              </Btn>
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredHistory.map(item => (
              <div
                key={item.id}
                onClick={() => handleViewReport(item.id)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  padding: '16px 24px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                  transition: 'transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal), background-color var(--transition-normal)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `var(--shadow-lg)`;
                  e.currentTarget.style.borderColor = 'var(--primary-hover)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                {/* Column 1: Company / Job Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 240, flex: '1.5 1 0%' }}>
                  <div style={{ width: 4, height: 36, borderRadius: 4, background: verdictColor(item.verdict), flexShrink: 0, boxShadow: `0 0 10px ${verdictColor(item.verdict)}40` }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.company} / {item.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Job Scam Verification</div>
                  </div>
                </div>

                {/* Column 2: Domain */}
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font)', fontWeight: 500, minWidth: 140, flex: '1 1 0%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.domain}
                </div>

                {/* Column 3: Trust Score / Verdict */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 150, flex: '1 1 0%' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: verdictColor(item.verdict), fontFamily: 'var(--font-mono)' }}>
                    {100 - item.score} Trust
                  </span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                    padding: '2px 8px', borderRadius: 'var(--radius-badge)',
                    color: verdictColor(item.verdict),
                    background: verdictBg(item.verdict),
                    border: `1px solid ${verdictBorder(item.verdict)}`,
                    textTransform: 'uppercase',
                  }}>
                    {verdictLabel(item.verdict)}
                  </span>
                </div>

                {/* Column 4: Scan Date */}
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500, minWidth: 100, flex: '0.8 1 0%' }}>
                  {item.date}
                </div>

                {/* Column 5: Action buttons */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, minWidth: 220, justifyContent: 'flex-end' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleViewReport(item.id); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '8px 14px', borderRadius: 'var(--radius-btn)',
                      background: 'var(--btn-secondary-bg)', border: '1px solid var(--btn-secondary-border)',
                      color: 'var(--btn-secondary-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
                      transition: 'transform var(--transition-normal), background-color var(--transition-normal)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'var(--btn-secondary-hover-bg)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'var(--btn-secondary-bg)'; }}
                  >
                    View Report →
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRescan(item.id); }}
                    disabled={rescanningId === item.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '8px 14px', borderRadius: 'var(--radius-btn)',
                      background: 'var(--interactive-dim)', border: '1px solid var(--interactive-border)',
                      color: 'var(--interactive)', fontSize: 12, fontWeight: 600,
                      cursor: rescanningId === item.id ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font)',
                      opacity: rescanningId === item.id ? 0.7 : 1,
                      transition: 'transform var(--transition-normal), background-color var(--transition-normal)',
                    }}
                    onMouseEnter={e => { if (rescanningId !== item.id) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'var(--interactive)'; e.currentTarget.style.color = '#030712'; } }}
                    onMouseLeave={e => { if (rescanningId !== item.id) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'var(--interactive-dim)'; e.currentTarget.style.color = 'var(--interactive)'; } }}
                  >
                    {rescanningId === item.id ? (
                      <>
                        <RefreshCw size={12} className="spin" /> Scanning...
                      </>
                    ) : (
                      <>
                        Scan Again ↻
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AnalyticsCard>

      {/* ─── Forensic Report Modal ─── */}
      {selectedReportId && createPortal(
        <div
          id="forensic-report-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'var(--bg-overlay)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '24px 16px',
            boxSizing: 'border-box',
            margin: 0,
          }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedReportId(null); }}
        >
          {loadingDetail ? (
            <div
              className="animate-scale"
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 20, padding: '40px 48px', textAlign: 'center',
                boxShadow: 'var(--shadow-xl)',
                maxWidth: 420, width: '100%',
                margin: 'auto',
              }}
            >
              <RefreshCw size={32} className="spin" color="var(--primary)" style={{ marginBottom: 16 }} />
              <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>Loading full forensic breakdown...</div>
            </div>
          ) : detailedReport ? (
            <div
              className="animate-scale"
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${verdictBorder(detailedReport.analysis.risk_level === 'LOW' ? 'SAFE' : detailedReport.analysis.risk_level === 'MEDIUM' ? 'SUSPICIOUS' : 'SCAM')}`,
                borderRadius: 20, padding: '28px 32px', maxWidth: 600, width: 'min(600px, calc(100vw - 32px))',
                boxShadow: 'var(--shadow-xl)',
                position: 'relative', maxHeight: 'min(86vh, 780px)', overflowY: 'auto',
                display: 'flex', flexDirection: 'column',
                margin: 'auto',
              }}
            >
              {/* Close Icon */}
              <button
                onClick={() => setSelectedReportId(null)}
                aria-label="Close Report"
                style={{
                  position: 'absolute', top: 20, right: 20, background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', cursor: 'pointer', width: 32, height: 32, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
              >
                <X size={16} />
              </button>

              {/* Title Section */}
              <div style={{ marginBottom: 20, paddingRight: 32 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Scanned Verification Report
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1.2 }}>
                  {detailedReport.job.company}
                </h2>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  {detailedReport.job.title} — {detailedReport.job.location || 'Remote'}
                </p>
              </div>

              {/* Security Shield Indicator */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 18px', borderRadius: 12,
                background: verdictBg(detailedReport.analysis.risk_level === 'LOW' ? 'SAFE' : detailedReport.analysis.risk_level === 'MEDIUM' ? 'SUSPICIOUS' : 'SCAM'),
                border: `1px solid ${verdictBorder(detailedReport.analysis.risk_level === 'LOW' ? 'SAFE' : detailedReport.analysis.risk_level === 'MEDIUM' ? 'SUSPICIOUS' : 'SCAM')}`,
                marginBottom: 20,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: verdictColor(detailedReport.analysis.risk_level === 'LOW' ? 'SAFE' : detailedReport.analysis.risk_level === 'MEDIUM' ? 'SUSPICIOUS' : 'SCAM'),
                  flexShrink: 0
                }}>
                  {detailedReport.analysis.risk_level === 'LOW' ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: verdictColor(detailedReport.analysis.risk_level === 'LOW' ? 'SAFE' : detailedReport.analysis.risk_level === 'MEDIUM' ? 'SUSPICIOUS' : 'SCAM') }}>
                    {verdictLabel(detailedReport.analysis.risk_level === 'LOW' ? 'SAFE' : detailedReport.analysis.risk_level === 'MEDIUM' ? 'SUSPICIOUS' : 'SCAM')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Threat Score: <strong style={{ color: 'var(--text)' }}>{detailedReport.analysis.final_score}/100</strong> (Confidence: {detailedReport.analysis.ml_score}% ML / {detailedReport.analysis.rule_score}% Rules)
                  </div>
                </div>
              </div>

              {/* Details & Explanation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13, lineHeight: 1.5 }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Forensic Summary</div>
                  <div style={{ color: 'var(--text)', background: 'var(--bg-surface)', padding: 12, borderRadius: 10, border: '1px solid var(--border)', fontSize: 12.5, lineHeight: 1.5 }}>
                    {detailedReport.analysis.explanation || 'No forensic narrative generated.'}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Classification Signpost Flags</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(!detailedReport.analysis.flags || detailedReport.analysis.flags.length === 0) ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>✓ No suspicious indicators found.</div>
                    ) : detailedReport.analysis.flags.map((flag: any, i: number) => {
                      const sev = normalizeFlagSeverity(flag.severity);
                      const flagStyle = {
                        danger: {
                          color: 'var(--danger-text, var(--danger))',
                          bg: 'var(--danger-dim)',
                          border: 'var(--danger-border)',
                          icon: '🔴'
                        },
                        warning: {
                          color: 'var(--warning-text, var(--warning))',
                          bg: 'var(--warning-dim)',
                          border: 'var(--warning-border)',
                          icon: '🟡'
                        },
                        safe: {
                          color: 'var(--safe-text, var(--safe))',
                          bg: 'var(--safe-dim)',
                          border: 'var(--safe-border)',
                          icon: '🟢'
                        },
                        unknown: {
                          color: 'var(--text-secondary)',
                          bg: 'var(--bg-surface)',
                          border: 'var(--border)',
                          icon: '⚪'
                        }
                      }[sev];

                      return (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                          background: flagStyle.bg, border: `1px solid ${flagStyle.border}`,
                          borderRadius: 8, fontSize: 12, color: flagStyle.color
                        }}>
                          <span>{flagStyle.icon}</span>
                          <strong>[{flag.category}]</strong> {flag.message}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Salary Offered</span>
                    <span style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600 }}>{detailedReport.job?.salary || extractSalary(detailedReport.job?.description) || 'Not disclosed'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Employment Type</span>
                    <span style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600 }}>{detailedReport.job.employment_type || 'Full-time'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Domain Origin</span>
                    <span style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {detailedReport.job?.domain || detailedReport.analysis?.domain || (detailedReport.job?.source_url ? extractDomain(detailedReport.job.source_url) : '') || 'NOT AVAILABLE'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Scan Timestamp</span>
                    <span style={{ color: 'var(--text)', fontSize: 12.5, fontWeight: 600 }}>{new Date(detailedReport.analysis.analyzed_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
                <Btn variant="secondary" onClick={() => setSelectedReportId(null)} style={{ flex: 1 }}>Close Report</Btn>
                {detailedReport.job.source_url && (
                  <Btn variant="primary" style={{ flex: 1 }} onClick={() => window.open(detailedReport.job.source_url, '_blank')}>
                    Visit Source Site
                  </Btn>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-scale" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, textAlign: 'center', maxWidth: 420, width: '100%' }}>
              <div style={{ color: 'var(--danger)', fontSize: 14 }}>Failed to load analysis details.</div>
              <Btn variant="secondary" onClick={() => setSelectedReportId(null)} style={{ marginTop: 16 }}>Close</Btn>
            </div>
          )}
        </div>,
        document.body
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
          display: 'flex', alignItems: 'center', gap: 10,
          background: toast.type === 'error' ? 'var(--danger-dim)' : toast.type === 'info' ? 'var(--primary-dim)' : 'var(--safe-dim)',
          border: `1px solid ${toast.type === 'error' ? 'var(--danger-border)' : toast.type === 'info' ? 'var(--primary-border)' : 'var(--safe-border)'}`,
          color: toast.type === 'error' ? 'var(--danger-text)' : toast.type === 'info' ? 'var(--primary-text)' : 'var(--safe-text)',
          padding: '12px 20px', borderRadius: 'var(--radius-input)',
          boxShadow: 'var(--shadow-lg)', fontSize: 13, fontWeight: 600,
          fontFamily: 'var(--font)'
        }}>
          <span>{toast.type === 'error' ? '⚠️' : toast.type === 'info' ? 'ℹ️' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function FileDown({ size = 16, className, color }: { size?: number; className?: string; color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M12 18v-6" />
      <path d="m9 15 3 3 3-3" />
    </svg>
  );
}

// Inline FileText component to ensure lucide compatibility
function FileText({ size, className, color }: { size?: number; className?: string; color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}
