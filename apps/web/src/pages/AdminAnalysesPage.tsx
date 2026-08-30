import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, StatusBadge, Btn, DataTable } from '../components/ui';
import { FileText, ShieldAlert, Shield, X, Calendar, Activity, AlertTriangle, User, RefreshCw, Cpu, Award } from 'lucide-react';
import { api } from '../services/api';

export function AdminAnalysesPage() {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAnalyses, setTotalAnalyses] = useState(0);

  // Selected Analysis Details state
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);

  const fetchAnalyses = useCallback(() => {
    setLoading(true);
    setError(null);
    
    let url = `/admin/analyses?page=${page}&limit=15`;
    if (riskFilter !== 'ALL') {
      url += `&risk_level=${riskFilter}`;
    }

    api.get<any>(url)
      .then(res => {
        if (res.success && res.data) {
          setAnalyses(res.data.analyses || []);
          setTotalPages(res.data.pages || 1);
          setTotalAnalyses(res.data.total || 0);
        } else {
          setError(res.error?.message || 'Failed to fetch scan directory.');
        }
      })
      .catch(err => {
        setError(err.message || 'An error occurred while communicating with the server.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, riskFilter]);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Safe table column definitions
  const columns = [
    { 
      key: 'job_title', 
      header: 'Job Posting',
      render: (_: any, row: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>{row.job_title}</span>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{row.company}</span>
        </div>
      )
    },
    { 
      key: 'user_name', 
      header: 'Scanned By',
      render: (val: string) => val || 'Anonymous Seeker'
    },
    { 
      key: 'final_score', 
      header: 'Risk Score',
      render: (val: number) => {
        let status: 'safe' | 'warning' | 'danger' = 'safe';
        if (val >= 70) status = 'danger';
        else if (val >= 35) status = 'warning';
        return <StatusBadge status={status} label={`${val}/100`} />;
      }
    },
    { 
      key: 'risk_level', 
      header: 'Threat Level', 
      render: (val: string) => {
        const statusMap: Record<string, 'safe' | 'warning' | 'danger' | 'neutral'> = {
          LOW: 'safe',
          MEDIUM: 'warning',
          HIGH: 'danger',
          CRITICAL: 'danger'
        };
        return (
          <StatusBadge 
            status={statusMap[val] || 'neutral'} 
            label={val} 
          />
        );
      }
    },
    { 
      key: 'analyzed_at', 
      header: 'Timestamp',
      render: (val: string) => formatDate(val)
    },
    {
      key: 'actions',
      header: '',
      render: (_: any, row: any) => (
        <Btn variant="secondary" size="sm" onClick={() => setSelectedAnalysis(row)}>
          Forensics
        </Btn>
      )
    }
  ];

  return (
    <div className="animate-slide" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        category="Admin Workspace"
        title="Forensic Analyses"
        subtitle="Review scan requests and access detailed scoring diagnostics from the JobShield analysis engines."
      />

      {/* Main card */}
      <div style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '24px',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Controls Block */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--primary)" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Scan Records Directory</span>
          </div>

          {/* Risk Level Filters */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '4px' }}>Threat Filter:</span>
            {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(r => (
              <button
                key={r}
                onClick={() => { setRiskFilter(r); setPage(1); }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid ' + (riskFilter === r ? 'var(--primary-border)' : 'var(--border)'),
                  background: riskFilter === r ? 'var(--primary-dim)' : 'transparent',
                  color: riskFilter === r ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* List Area */}
        {loading ? (
          <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Retrieving scan records...</span>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ color: 'var(--danger)' }}><ShieldAlert size={32} /></div>
            <div style={{ fontSize: '14px', color: 'var(--danger)', fontWeight: 600 }}>{error}</div>
            <Btn variant="secondary" onClick={fetchAnalyses} icon={<RefreshCw size={12} />}>
              Retry Query
            </Btn>
          </div>
        ) : analyses.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 0',
            border: '2px dashed var(--border)',
            borderRadius: '12px',
            color: 'var(--text-muted)'
          }}>
            {riskFilter !== 'ALL' 
              ? 'No analyses match this risk filter.' 
              : 'No analyses found.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <DataTable columns={columns} data={analyses} emptyMessage="No analysis records returned." />
          </div>
        )}

        {/* Pagination controls */}
        {!loading && !error && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Showing {analyses.length} of {totalAnalyses} completed security reviews
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Btn 
                variant="secondary" 
                size="sm" 
                disabled={page <= 1} 
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </Btn>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages}
              </div>
              <Btn 
                variant="secondary" 
                size="sm" 
                disabled={page >= totalPages} 
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next
              </Btn>
            </div>
          </div>
        )}
      </div>

      {/* Forensic Detail Drawer Modal */}
      {selectedAnalysis && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(5, 6, 12, 0.75)',
          backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}
        onClick={() => setSelectedAnalysis(null)}
        >
          <div 
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-strong)',
              borderRadius: '20px',
              padding: '30px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              position: 'relative',
              animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setSelectedAnalysis(null)}
              style={{
                position: 'absolute', top: '20px', right: '20px',
                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px', borderRadius: '50%'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <X size={18} />
            </button>

            {/* Title block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                <Activity size={12} /> Threat Analysis Diagnostics
              </div>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                {selectedAnalysis.job_title}
              </h3>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedAnalysis.company}</span>
            </div>

            {/* Forensic parameters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><User size={13} /> Seeker Identity:</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                  {selectedAnalysis.user_name || 'Anonymous Seeker'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={13} /> Timestamp:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{formatDate(selectedAnalysis.analyzed_at)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Shield size={13} /> Threat Verdict:</span>
                <span style={{
                  fontWeight: 700,
                  color: selectedAnalysis.risk_level === 'CRITICAL' || selectedAnalysis.risk_level === 'HIGH' ? 'var(--danger)' : selectedAnalysis.risk_level === 'MEDIUM' ? 'var(--warning)' : 'var(--success)'
                }}>{selectedAnalysis.risk_level}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Award size={13} /> ML Prediction:</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{selectedAnalysis.prediction}</span>
              </div>
            </div>

            {/* Diagnostic Scores Grid */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Engine Score Breakdown
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--primary)', marginBottom: '4px', display: 'flex', justifyContent: 'center' }}><Cpu size={14} /></div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                    {selectedAnalysis.ml_score}/100
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 700, textTransform: 'uppercase' }}>ML Classifier</div>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--primary)', marginBottom: '4px', display: 'flex', justifyContent: 'center' }}><Shield size={14} /></div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                    {selectedAnalysis.rule_score}/100
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 700, textTransform: 'uppercase' }}>Heuristics</div>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--primary)', marginBottom: '4px', display: 'flex', justifyContent: 'center' }}><AlertTriangle size={14} /></div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                    {selectedAnalysis.final_score}/100
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 700, textTransform: 'uppercase' }}>Final Weighted</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <Btn variant="secondary" onClick={() => setSelectedAnalysis(null)}>
                Dismiss Diagnostics
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
