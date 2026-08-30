import React, { useState, useEffect } from 'react';
import { PageHeader, Btn } from '../components/ui';
import { ShieldCheck, ShieldAlert, RefreshCw, Server, Database, Cpu, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export function AdminSystemPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const fetchHealth = () => {
    setLoading(true);
    setError(null);
    api.get<any>('/admin/system/health')
      .then(res => {
        if (res.success && res.data) {
          setHealthData(res.data);
          const now = new Date();
          setLastChecked(now.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }));
        } else {
          setError(res.error?.message || 'Failed to retrieve system health payload.');
        }
      })
      .catch(err => {
        setError(err.message || 'Error occurred while communicating with the health endpoint.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const getStatusDisplay = (serviceName: string, serviceObj: any) => {
    const status = serviceObj?.status?.toLowerCase();
    
    // API, DB, and ML display mapping
    if (status === 'ok') {
      return {
        label: 'Operational',
        color: 'var(--success)',
        bg: 'var(--safe-dim)',
        border: 'var(--safe-border)',
        desc: serviceName === 'database' 
          ? 'Primary database connection is active and healthy.' 
          : serviceName === 'ml_service' 
            ? 'Scam detection ML services are operational.' 
            : 'Gateway APIs are routing traffic normally.'
      };
    } else if (status === 'degraded') {
      return {
        label: 'Degraded',
        color: 'var(--warning)',
        bg: 'var(--warning-dim)',
        border: 'var(--warning-border)',
        desc: 'ML analysis service is degraded or offline. Seeker scans will fall back to rule-based engines.'
      };
    } else if (status === 'error' || status === 'unavailable') {
      return {
        label: 'Unavailable',
        color: 'var(--danger)',
        bg: 'var(--danger-dim)',
        border: 'var(--danger-border)',
        desc: serviceName === 'database'
          ? 'Database connection failure. Core platform services are offline.'
          : 'Service is down or unreachable. Contact administrator immediately.'
      };
    } else {
      return {
        label: 'Unknown',
        color: 'var(--text-secondary)',
        bg: 'var(--bg-elevation-2)',
        border: 'var(--border)',
        desc: 'Unable to resolve telemetry status.'
      };
    }
  };

  if (loading && !healthData) {
    return (
      <div className="animate-slide" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <PageHeader 
          title="System Health" 
          subtitle="Loading platform telemetry logs..." 
          category="Telemetry Workspace"
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          <div style={{ height: '110px', borderRadius: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ height: '110px', borderRadius: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ height: '110px', borderRadius: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite ease-in-out' }} />
        </div>
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
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px 0' }}>Telemetry Access Failure</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, maxWidth: '380px' }}>
            {error}
          </p>
        </div>
        <Btn variant="secondary" onClick={fetchHealth} icon={<RefreshCw size={14} />}>
          Retry Connection
        </Btn>
      </div>
    );
  }

  const { api: apiObj, database: dbObj, ml_service: mlObj } = healthData || {};
  const apiStatus = getStatusDisplay('api', apiObj);
  const dbStatus = getStatusDisplay('database', dbObj);
  const mlStatus = getStatusDisplay('ml_service', mlObj);

  return (
    <div className="animate-slide" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader 
        title="System Health" 
        subtitle="Real-time connectivity status of JobShield backend databases and security engines." 
        category="Telemetry Workspace"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {lastChecked && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} /> Last checked: {lastChecked}
              </span>
            )}
            <Btn 
              variant="secondary" 
              size="sm" 
              onClick={fetchHealth} 
              disabled={loading}
              icon={<RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />}
            >
              {loading ? 'Polling...' : 'Refresh'}
            </Btn>
          </div>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* API Health Card */}
        <div style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '24px'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              background: 'var(--primary-dim)', border: '1px solid var(--primary-border)',
              color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <Server size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text)' }}>Application API Gateway</span>
              <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{apiStatus.desc}</span>
            </div>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: apiStatus.bg, color: apiStatus.color, border: `1px solid ${apiStatus.border}`,
            padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800
          }}>
            <span style={{ fontSize: '10px' }}>●</span> {apiStatus.label}
          </span>
        </div>

        {/* Database Health Card */}
        <div style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '24px'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              background: 'var(--primary-dim)', border: '1px solid var(--primary-border)',
              color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <Database size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text)' }}>Primary SQLite Database</span>
              <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{dbStatus.desc}</span>
            </div>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: dbStatus.bg, color: dbStatus.color, border: `1px solid ${dbStatus.border}`,
            padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800
          }}>
            <span style={{ fontSize: '10px' }}>●</span> {dbStatus.label}
          </span>
        </div>

        {/* ML Service Health Card */}
        <div style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '24px'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              background: 'var(--primary-dim)', border: '1px solid var(--primary-border)',
              color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <Cpu size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text)' }}>ML Scam Detection Service</span>
              <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{mlStatus.desc}</span>
            </div>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: mlStatus.bg, color: mlStatus.color, border: `1px solid ${mlStatus.border}`,
            padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800
          }}>
            <span style={{ fontSize: '10px' }}>●</span> {mlStatus.label}
          </span>
        </div>

      </div>

      {/* Infrastructure Telemetry Warning Box */}
      <div style={{ 
        display: 'flex', gap: '12px',
        fontSize: '13px', 
        color: 'var(--text-secondary)', 
        lineHeight: 1.6,
        background: 'rgba(255,255,255,0.01)',
        border: '1px solid var(--border)',
        padding: '20px',
        borderRadius: '12px',
        alignItems: 'flex-start'
      }}>
        <div style={{ color: 'var(--primary)', marginTop: '2px' }}><ShieldCheck size={18} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <strong>Telemetry and Diagnostic Disclosure Policy:</strong>
          <span>This console displays high-level health flags solely for system validation. Connection strings, path names, port configurations, and detailed backend exception messages are withheld on frontend endpoints to ensure strict compliance with JobShield security models.</span>
        </div>
      </div>

    </div>
  );
}
