import React, { useState, useEffect, useRef } from 'react';
import { PageHeader, AnalyticsCard } from '../components/ui';
import { Terminal, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';

interface LogLine {
  id: string;
  time: string;
  type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  service: string;
  msg: string;
}

export function LogsPage() {
  const [logs, setLogs] = useState<LogLine[]>([
    { id: '1', time: '19:30:12', type: 'INFO', service: 'AUTH_SRV', msg: 'Admin session initiated for akash@jobshield.ai' },
    { id: '2', time: '19:30:15', type: 'SUCCESS', service: 'WHOIS_RESOLVER', msg: 'Domain stripe.com verified successfully (Age: 14 Years)' },
    { id: '3', time: '19:31:02', type: 'WARN', service: 'NLP_MODEL', msg: 'Low confidence scan trigger on expresscargo-jobs.net (Score: 68%)' },
    { id: '4', time: '19:32:44', type: 'ERROR', service: 'API_GATEWAY', msg: 'Unauthorized credentials attempt blocked from IP 198.51.100.42' },
    { id: '5', time: '19:33:01', type: 'INFO', service: 'INFRA_MONITOR', msg: 'Docker container task-729 CPU load stabilized at 4.2%' },
  ]);

  const [isStreaming, setIsStreaming] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  const services = ['AUTH_SRV', 'WHOIS_RESOLVER', 'NLP_MODEL', 'API_GATEWAY', 'INFRA_MONITOR', 'XGBOOST_PIPELINE', 'BROWSER_GUARD'];
  const logMessages = [
    { type: 'INFO' as const, msg: 'API key validation check succeeded for token: *********' },
    { type: 'SUCCESS' as const, msg: 'SSL Certificate verified: google.com (Signature DigiCert)' },
    { type: 'WARN' as const, msg: 'Telegram recruitment trigger pattern identified' },
    { type: 'ERROR' as const, msg: 'Failed connection attempt to database master: timeout' },
    { type: 'SUCCESS' as const, msg: 'XGBoost retraining pipeline successfully finished job run' },
    { type: 'INFO' as const, msg: 'Vite hot-reloading completed in 12ms' },
  ];

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const randomService = services[Math.floor(Math.random() * services.length)];
      const randomMsg = logMessages[Math.floor(Math.random() * logMessages.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      const newLog: LogLine = {
        id: Math.random().toString(),
        time: timeStr,
        type: randomMsg.type,
        service: randomService,
        msg: randomMsg.msg
      };

      setLogs(prev => [...prev.slice(-49), newLog]);
    }, 2800);

    return () => clearInterval(interval);
  }, [isStreaming]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="animate-slide">
      <PageHeader
        category="Admin Workspace"
        title="Live System Logs"
        subtitle="Real-time terminal output logs tracking security evaluations, model pipelines, and system events."
        action={
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8,
                background: isStreaming ? 'var(--interactive-dim)' : 'var(--bg-surface)',
                border: `1px solid ${isStreaming ? 'var(--interactive)' : 'var(--border)'}`,
                color: isStreaming ? 'var(--interactive)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)'
              }}
            >
              <RefreshCw size={14} className={isStreaming ? 'animate-spin' : ''} />
              {isStreaming ? 'Streaming' : 'Paused'}
            </button>
            <button
              onClick={() => setLogs([])}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8,
                background: 'var(--danger-dim)', border: '1px solid var(--danger-border)',
                color: 'var(--danger)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)'
              }}
            >
              <Trash2 size={14} /> Clear Logs
            </button>
          </div>
        }
      />

      <AnalyticsCard title="JobShield AI Log Terminal" noPad>
        <div style={{
          background: '#040811',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          height: '480px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', opacity: 0.7, textAlign: 'center', marginTop: '180px' }}>
              <Terminal size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
              <div>Terminal logs cleared. Waiting for system events...</div>
            </div>
          ) : (
            logs.map(log => {
              let typeColor = 'var(--interactive)';
              if (log.type === 'WARN') typeColor = 'var(--warning)';
              if (log.type === 'ERROR') typeColor = 'var(--danger)';
              if (log.type === 'SUCCESS') typeColor = 'var(--primary)';

              return (
                <div key={log.id} style={{ display: 'flex', gap: '16px', lineHeight: 1.5, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '4px' }}>
                  <span style={{ color: '#64748B', flexShrink: 0 }}>[{log.time}]</span>
                  <span style={{ color: typeColor, fontWeight: 700, minWidth: '70px', flexShrink: 0 }}>{log.type}</span>
                  <span style={{ color: '#818CF8', fontWeight: 600, minWidth: '120px', flexShrink: 0 }}>[{log.service}]</span>
                  <span style={{ color: '#E2E8F0' }}>{log.msg}</span>
                </div>
              );
            })
          )}
          <div ref={logEndRef} />
        </div>
      </AnalyticsCard>
    </div>
  );
}
