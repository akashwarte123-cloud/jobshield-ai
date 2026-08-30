import React, { useState, useEffect } from 'react';
import { Bookmark, Trash2, ArrowRight, Briefcase, Calendar, MapPin, Search, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { PageHeader, StatusBadge, Btn } from '../components/ui';
import { api } from '../services/api';

export function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchSavedJobs = (page = 1) => {
    setLoading(true);
    setError(null);
    api.get<any>(`/jobs/saved?page=${page}&limit=10`)
      .then(res => {
        if (res.success && res.data) {
          setSavedJobs(res.data.items || []);
          setPagination(res.data.pagination);
        } else {
          setError(res.error?.message || 'Failed to fetch saved jobs.');
        }
      })
      .catch(err => {
        setError(err.message || 'An error occurred while loading saved jobs.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const handleUnsave = (jobId: string) => {
    api.delete(`/jobs/${jobId}/save`)
      .then(res => {
        if (res.success) {
          setSavedJobs(prev => prev.filter(item => item.job.id !== jobId));
          setPagination(prev => ({ ...prev, total: prev.total - 1 }));
          triggerToast('Job removed from saved listings.', 'success');
        } else {
          triggerToast(res.error?.message || 'Failed to remove saved job.', 'error');
        }
      })
      .catch(err => {
        triggerToast(err.message || 'Unable to remove saved job.', 'error');
      });
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const filteredJobs = savedJobs.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.job.title.toLowerCase().includes(term) ||
      item.job.company.toLowerCase().includes(term) ||
      (item.job.location && item.job.location.toLowerCase().includes(term))
    );
  });

  return (
    <div className="animate-slide" style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      
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
          boxShadow: 'var(--shadow-lg)'
        }}>
          {toast.type === 'success' && <CheckCircle2 size={16} color="var(--safe-text, var(--safe))" />}
          {toast.type === 'error' && <AlertTriangle size={16} color="var(--danger-text, var(--danger))" />}
          {toast.type === 'info' && <RefreshCw className="animate-spin" size={16} color="var(--primary)" />}
          {toast.message}
        </div>
      )}

      <PageHeader 
        title="Saved Jobs" 
        subtitle="Manage and analyze your marked career opportunities" 
      />

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
        {/* Search */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '8px 14px',
            transition: 'border-color 0.15s ease'
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text"
              placeholder="Filter saved jobs by title, company, or location..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text)',
                fontSize: '13.5px',
                width: '100%'
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className="skeleton"
                style={{
                  height: '84px',
                  borderRadius: '12px',
                  width: '100%'
                }}
              />
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--danger)', fontWeight: 500 }}>
            {error}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 0',
            border: '2px dashed var(--border)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px'
          }}>
            <Bookmark size={40} color="var(--text-dim)" />
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>No saved jobs yet</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '320px', lineHeight: 1.5 }}>
              Save jobs while browsing or analyzing them and they'll appear here.
            </div>
            <div style={{ marginTop: '8px' }}>
              <Btn 
                variant="primary" 
                size="sm"
                onClick={() => {
                  window.history.pushState(null, '', '/app/analyze');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
              >
                Analyze a Job
              </Btn>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredJobs.map(item => {
              const latestAnalysis = item.job.latest_analysis;
              const score = latestAnalysis ? latestAnalysis.final_score : null;
              
              return (
                <div 
                  key={item.job.id} 
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '20px',
                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--primary-border)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'var(--primary-dim)',
                      border: '1px solid var(--primary-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                      flexShrink: 0
                    }}>
                      <Briefcase size={20} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                        {item.job.title}
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{item.job.company}</span>
                        {item.job.location && (
                          <>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <MapPin size={12} /> {item.job.location}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Calendar size={12} /> Saved {formatDate(item.saved_at)}
                        </span>
                      </div>

                      {latestAnalysis && score !== null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontWeight: 500 }}>Safety Score:</span>
                            <span style={{ 
                              color: score >= 70 ? 'var(--danger-text, var(--danger))' : score >= 30 ? 'var(--warning-text, var(--warning))' : 'var(--safe-text, var(--safe))',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)'
                            }}>{100 - score}</span>
                          </span>
                          <StatusBadge 
                            status={score >= 70 ? 'danger' : score >= 30 ? 'warning' : 'safe'}
                            label={score >= 70 ? 'High Risk' : score >= 30 ? 'Suspicious' : 'Verified / Low Risk'} 
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                    {item.job.source_url && (
                      <a 
                        href={item.job.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                      >
                        <Btn variant="secondary" size="sm">
                          View Posting <ArrowRight size={13} style={{ marginLeft: '4px' }} />
                        </Btn>
                      </a>
                    )}
                    <button 
                      onClick={() => handleUnsave(item.job.id)}
                      title="Remove from saved jobs"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--danger-dim)';
                        e.currentTarget.style.borderColor = 'var(--danger)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination controls */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
            <Btn 
              variant="secondary" 
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchSavedJobs(pagination.page - 1)}
            >
              Previous
            </Btn>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: 'var(--text-muted)', padding: '0 10px' }}>
              Page {pagination.page} of {pagination.pages}
            </div>
            <Btn 
              variant="secondary" 
              size="sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() => fetchSavedJobs(pagination.page + 1)}
            >
              Next
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
