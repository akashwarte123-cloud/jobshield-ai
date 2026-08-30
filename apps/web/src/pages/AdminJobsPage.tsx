import React, { useState, useEffect } from 'react';
import { PageHeader, StatGrid, KPICard, AnalyticsCard, Btn } from '../components/ui';
import { Briefcase, Bookmark, FileText, RefreshCw, ShieldAlert, Award } from 'lucide-react';
import { api } from '../services/api';

export function AdminJobsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = () => {
    setLoading(true);
    setError(null);
    api.get<any>('/admin/jobs/statistics')
      .then(res => {
        if (res.success && res.data) {
          setStats(res.data);
        } else {
          setError(res.error?.message || 'Failed to retrieve job statistics.');
        }
      })
      .catch(err => {
        setError(err.message || 'An unexpected network error occurred.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="animate-slide" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <PageHeader 
          title="Job Statistics" 
          subtitle="Loading database job telemetry..." 
          category="Telemetry Workspace"
        />
        <StatGrid columns={3}>
          <div style={{ height: '120px', borderRadius: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ height: '120px', borderRadius: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ height: '120px', borderRadius: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite ease-in-out' }} />
        </StatGrid>
        <div style={{ height: '240px', borderRadius: '16px', background: 'var(--bg-glass)', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite ease-in-out' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', gap: '20px', textAlign: 'center'
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px', background: 'var(--danger-dim)',
          color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <ShieldAlert size={26} />
        </div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px 0' }}>Telemetry Load Error</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, maxWidth: '380px' }}>
            {error}
          </p>
        </div>
        <Btn variant="secondary" onClick={fetchStats} icon={<RefreshCw size={14} />}>
          Retry Connection
        </Btn>
      </div>
    );
  }

  const {
    total_jobs = 0,
    total_saved_job_entries = 0,
    jobs_with_analyses = 0
  } = stats || {};

  // Calculate scan coverage ratio
  const coveragePercent = total_jobs > 0 ? Math.round((jobs_with_analyses / total_jobs) * 100) : 0;

  return (
    <div className="animate-slide" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader 
        title="Job Statistics" 
        subtitle="Review global job posting counts, scanned review coverage, and saved job entries." 
        category="Telemetry Workspace"
        action={
          <Btn variant="secondary" size="sm" onClick={fetchStats} icon={<RefreshCw size={13} />}>
            Refresh
          </Btn>
        }
      />

      <StatGrid columns={3}>
        <KPICard 
          icon={<Briefcase size={20} />} 
          label="Total Job Postings" 
          value={total_jobs} 
          theme="blue" 
        />
        <KPICard 
          icon={<FileText size={20} />} 
          label="Jobs With Analyses" 
          value={jobs_with_analyses} 
          theme="cyan" 
        />
        <KPICard 
          icon={<Bookmark size={20} />} 
          label="Saved Job Entries" 
          value={total_saved_job_entries} 
          theme="indigo" 
        />
      </StatGrid>

      {/* Coverage Analytics Card */}
      <AnalyticsCard title="Scanned Coverage Analysis" subtitle="Percentage of unique database job postings evaluated by JobShield engines">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                {coveragePercent}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Scanned Coverage Ratio
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'right' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{jobs_with_analyses}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Evaluated Posts</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'right' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>{total_jobs - jobs_with_analyses}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unevaluated Posts</span>
              </div>
            </div>
          </div>

          {/* Large custom progress indicator */}
          <div style={{
            height: '14px',
            background: 'var(--border)',
            borderRadius: '7px',
            overflow: 'hidden',
            width: '100%',
            position: 'relative'
          }}>
            <div style={{
              height: '100%',
              width: `${coveragePercent}%`,
              background: 'linear-gradient(90deg, var(--primary) 0%, #6366F1 100%)',
              boxShadow: '0 0 10px var(--primary-border)',
              borderRadius: '7px',
              transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
          </div>

          <div style={{ 
            fontSize: '12.5px', 
            color: 'var(--text-secondary)', 
            lineHeight: 1.6,
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid var(--border)',
            padding: '16px',
            borderRadius: '10px'
          }}>
            📋 <strong>Administrative Context:</strong> Saved Job entries represent individual bookmarks set by job seekers. High evaluated post metrics show high platform utility and user scan completion rates. Unevaluated posts will be reviewed as seekers query or analyze them.
          </div>
        </div>
      </AnalyticsCard>
    </div>
  );
}
