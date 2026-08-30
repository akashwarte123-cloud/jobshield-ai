import React from 'react';
import { 
  PageHeader, 
  StatGrid, 
  KPICard, 
  AnalyticsCard, 
  StatusBadge 
} from '../components/ui';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { GitCommit, Play, CheckCircle, Clock } from 'lucide-react';

export function PipelineCICDPage() {
  const buildData = [
    { run: '#225', duration: 180, status: 'pass' },
    { run: '#226', duration: 195, status: 'pass' },
    { run: '#227', duration: 210, status: 'pass' },
    { run: '#228', duration: 420, status: 'fail' },
    { run: '#229', duration: 185, status: 'pass' },
    { run: '#230', duration: 190, status: 'pass' },
    { run: '#231', duration: 205, status: 'pass' },
    { run: '#232', duration: 215, status: 'pass' },
    { run: '#233', duration: 195, status: 'pass' },
    { run: '#234', duration: 200, status: 'pass' },
  ];

  const pipelineRuns = [
    { hash: '#a3f2c1', branch: 'main', message: 'feat: add rate limiting to API', time: '15 mins ago', duration: '3m 24s', status: 'safe' },
    { hash: '#b7e4d2', branch: 'main', message: 'fix: resolving CORS issue on staging', time: '2 hours ago', duration: '3m 15s', status: 'safe' },
    { hash: '#c8a1b9', branch: 'feature/new-models', message: 'model: update phishing detector weights', time: '5 hours ago', duration: '4m 10s', status: 'safe' },
    { hash: '#d9f0e1', branch: 'main', message: 'chore: update dependencies', time: '1 day ago', duration: '7m 05s', status: 'danger' },
    { hash: '#e2c5a8', branch: 'main', message: 'docs: update API reference', time: '2 days ago', duration: '2m 50s', status: 'safe' },
  ];

  const steps = ['Lint', 'Test', 'Security', 'Build', 'Deploy'];

  return (
    <div className="animate-slide">
      <PageHeader 
        title="CI/CD Pipeline" 
        subtitle="Continuous integration and deployment status" 
      />
      
      <div style={{ marginBottom: '32px' }}>
        <StatGrid>
          <KPICard icon={<Play size={20} />} label="Total Runs" value="234" />
          <KPICard icon={<CheckCircle size={20} />} label="Success Rate" value="97.4%" />
          <KPICard icon={<Clock size={20} />} label="Avg Duration" value="3m 42s" />
          <KPICard icon={<GitCommit size={20} />} label="Last Deploy" value="2h ago" />
        </StatGrid>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        <AnalyticsCard title="Build History (Last 10 Runs)">
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buildData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="run" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
                <Bar dataKey="duration" radius={[4, 4, 0, 0]}>
                  {buildData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.status === 'pass' ? '#22C55E' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Pipeline Runs">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pipelineRuns.map((run, i) => (
              <div key={i} style={{
                background: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 600 }}>{run.hash}</span>
                      <StatusBadge status="neutral" label={run.branch} />
                      <span style={{ color: 'var(--text)', fontWeight: 500 }}>{run.message}</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'flex', gap: '16px' }}>
                      <span>Started {run.time}</span>
                      <span>Duration: {run.duration}</span>
                    </div>
                  </div>
                  <StatusBadge status={run.status as any} label={run.status === 'safe' ? 'Success' : 'Failed'} />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {steps.map((step, idx) => {
                    const isFailed = run.status === 'danger' && idx === 3;
                    const isPending = run.status === 'danger' && idx > 3;
                    const icon = isFailed ? '✗' : isPending ? '○' : '✓';
                    const color = isFailed ? 'var(--danger)' : isPending ? 'var(--text-muted)' : 'var(--success)';

                    return (
                      <React.Fragment key={idx}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '24px', height: '24px', borderRadius: '50%', 
                            backgroundColor: isPending ? 'transparent' : `${color}20`,
                            border: `2px solid ${color}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: color, fontSize: '12px', fontWeight: 'bold'
                          }}>
                            {icon}
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{step}</span>
                        </div>
                        {idx < steps.length - 1 && (
                          <div style={{ 
                            flex: 1, 
                            height: '2px', 
                            backgroundColor: isPending || (isFailed && idx === 3) ? 'rgba(255,255,255,0.1)' : 'var(--success)',
                            margin: '0 16px',
                            transform: 'translateY(-12px)'
                          }}></div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </AnalyticsCard>
      </div>
    </div>
  );
}
