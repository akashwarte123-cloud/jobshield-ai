import React, { useState, useEffect } from 'react';
import { 
  PageHeader, 
  StatGrid, 
  KPICard, 
  AnalyticsCard, 
  Btn
} from '../components/ui';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Users, Activity, FileText, Briefcase, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

export function AdminPanelPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = () => {
    setLoading(true);
    setError(null);
    api.get<any>('/admin/dashboard/summary')
      .then(res => {
        if (res.success && res.data) {
          setSummary(res.data);
        } else {
          setError(res.error?.message || 'Failed to retrieve dashboard summary.');
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
    fetchSummary();
  }, []);

  const formatDateLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="animate-slide" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <PageHeader 
          title="Admin Dashboard" 
          subtitle="Loading platform metrics..." 
          category="Platform Administration"
        />
        <StatGrid>
          <div style={{ height: '120px', borderRadius: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ height: '120px', borderRadius: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ height: '120px', borderRadius: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ height: '120px', borderRadius: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite ease-in-out' }} />
        </StatGrid>
        <div style={{ height: '360px', borderRadius: '16px', background: 'var(--bg-glass)', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite ease-in-out' }} />
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
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px 0' }}>Dashboard Load Error</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, maxWidth: '380px' }}>
            {error}
          </p>
        </div>
        <Btn variant="secondary" onClick={fetchSummary} icon={<RefreshCw size={14} />}>
          Retry Connection
        </Btn>
      </div>
    );
  }

  const {
    users = { total: 0 },
    analyses = { total: 0, today: 0 },
    jobs = { total: 0 },
    risk_distribution = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
    average_score = 0,
    weekly_trends = []
  } = summary || {};

  // Formatted data for AreaChart
  const chartData = weekly_trends.map((item: any) => ({
    name: formatDateLabel(item.date),
    Scans: item.count
  }));

  // Formatted data for PieChart
  const riskPieData = [
    { name: 'Low', value: risk_distribution.LOW || 0, color: 'var(--success)' },
    { name: 'Medium', value: risk_distribution.MEDIUM || 0, color: 'var(--warning)' },
    { name: 'High', value: risk_distribution.HIGH || 0, color: '#FB923C' }, // Orange
    { name: 'Critical', value: risk_distribution.CRITICAL || 0, color: 'var(--danger)' }
  ].filter(item => item.value > 0);

  const totalRiskCount = (risk_distribution.LOW || 0) + 
                         (risk_distribution.MEDIUM || 0) + 
                         (risk_distribution.HIGH || 0) + 
                         (risk_distribution.CRITICAL || 0);

  return (
    <div className="animate-slide" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader 
        title="Admin Dashboard" 
        subtitle="System-wide JobShield overview and scan telemetry" 
        category="Platform Administration"
        action={
          <Btn variant="secondary" size="sm" onClick={fetchSummary} icon={<RefreshCw size={13} />}>
            Refresh
          </Btn>
        }
      />

      <StatGrid>
        <KPICard 
          icon={<Users size={20} />} 
          label="Total Users" 
          value={users.total} 
          theme="indigo" 
        />
        <KPICard 
          icon={<FileText size={20} />} 
          label="Total Analyses" 
          value={analyses.total} 
          theme="cyan" 
        />
        <KPICard 
          icon={<Briefcase size={20} />} 
          label="Total Jobs" 
          value={jobs.total} 
          theme="blue" 
        />
        <KPICard 
          icon={<Activity size={20} />} 
          label="Average Risk" 
          value={`${average_score}/100`} 
          theme={average_score >= 70 ? 'red' : average_score >= 35 ? 'amber' : 'green'} 
        />
      </StatGrid>

      {/* Weekly Trend Chart Card */}
      <AnalyticsCard title="Weekly Analysis Trend" subtitle="Daily scan request telemetry across the system">
        {chartData.length === 0 ? (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            No analysis activity recorded in the past 7 days.
          </div>
        ) : (
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.22}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text)' }}
                  labelStyle={{ color: 'var(--text-secondary)', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="Scans" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorScans)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </AnalyticsCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', minWidth: 0 }}>
        {/* Risk Distribution Card */}
        <AnalyticsCard title="Risk Distribution" subtitle="Telemetry by categorized threat levels">
          {totalRiskCount === 0 ? (
            <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No threat categories recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', minHeight: '220px' }}>
              <div style={{ width: '160px', height: '160px', flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {riskPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--text)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(level => {
                  const val = risk_distribution[level] || 0;
                  const pct = totalRiskCount > 0 ? ((val / totalRiskCount) * 100).toFixed(0) : '0';
                  const colorMap: Record<string, string> = {
                    LOW: 'var(--success)',
                    MEDIUM: 'var(--warning)',
                    HIGH: '#FB923C',
                    CRITICAL: 'var(--danger)'
                  };
                  return (
                    <div key={level} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 600 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{level}</span>
                        <span style={{ color: 'var(--text)' }}>{val} ({pct}%)</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: colorMap[level], borderRadius: '3px', transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </AnalyticsCard>

        {/* Telemetry Activity Card */}
        <AnalyticsCard title="Today's Activity" subtitle="Telemetry summary for the current UTC day">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Analyses Run Today
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
                  {analyses.today}
                </div>
              </div>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'var(--primary-dim)', border: '1px solid var(--primary-border)',
                color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Activity size={18} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Database connection:</span>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>Active ({summary?.database_type || 'PostgreSQL'})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Role scope limits:</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Authorized Admin Only</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>API Route:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>/admin/dashboard/summary</span>
              </div>
            </div>
          </div>
        </AnalyticsCard>
      </div>
    </div>
  );
}
