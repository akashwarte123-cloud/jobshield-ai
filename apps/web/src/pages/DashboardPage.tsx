import React, { useState, useEffect } from 'react';
import {
  PageHeader,
  SectionHeader,
  StatGrid,
  KPICard,
  AnalyticsCard,
  DataTable,
  StatusBadge,
  Btn,
} from '../components/ui';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Search, ShieldAlert, ShieldCheck, AlertTriangle, ArrowRight, Lightbulb, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { getUserFirstName } from '../utils/userHelpers';

interface DashboardPageProps {
  onNavigate?: (view: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('User');

  const fetchDashboardData = () => {
    setLoading(true);
    setError(null);
    api.get('/dashboard/summary')
      .then(res => {
        if (res.success) {
          setStats(res.data);
        } else {
          setError(res.error?.message || 'Failed to fetch dashboard data.');
        }
      })
      .catch(err => {
        setError(err.message || 'An error occurred while loading telemetry.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    // Get current user first name
    setUserName(getUserFirstName());

    fetchDashboardData();
  }, []);

  const columns = [
    { key: 'title', header: 'Job Title' },
    { key: 'company', header: 'Company' },
    {
      key: 'score',
      header: 'Risk Score',
      render: (val: number) => {
        let status: 'safe' | 'warning' | 'danger' = 'safe';
        if (val > 70) status = 'danger';
        else if (val > 30) status = 'warning';
        return <StatusBadge status={status} label={`${val}/100`} />;
      },
    },
    { key: 'date', header: 'Date Scanned' },
    {
      key: 'status',
      header: 'Verdict',
      render: (val: string) => {
        const statusMap: Record<string, 'safe' | 'warning' | 'danger'> = {
          SAFE: 'safe',
          CAUTION: 'warning',
          'HIGH RISK': 'danger',
        };
        return <StatusBadge status={statusMap[val] || 'safe'} label={val} />;
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
        <RefreshCw size={32} className="spin" color="var(--primary)" />
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Loading security database telemetry...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div style={{ padding: 24, textAlign: 'center', maxWidth: 500, margin: '10vh auto' }}>
        <ShieldAlert size={48} color="var(--danger)" style={{ marginBottom: 16 }} />
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Failed to Load Dashboard</h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>{error || 'Unable to establish secure telemetry connection.'}</p>
        <Btn variant="primary" onClick={fetchDashboardData}>Retry Connection</Btn>
      </div>
    );
  }

  // Map backend stats to UI structures
  const totalScans = stats.total_analyses;
  const safeScans = stats.risk_distribution.low;
  const threatScans = stats.risk_distribution.high + stats.risk_distribution.critical;
  const averageRisk = stats.average_score;

  const chartData = stats.weekly_trends || [];

  const pieData = [
    { name: 'Safe Jobs', value: stats.risk_distribution.low, color: '#22C55E' },
    { name: 'Suspicious (Caution)', value: stats.risk_distribution.medium, color: '#F59E0B' },
    { name: 'Critical Scams', value: stats.risk_distribution.high + stats.risk_distribution.critical, color: '#EF4444' },
  ];

  const recentScansMapped = (stats.recent_analyses || []).map((item: any) => {
    const score = item.analysis.final_score;
    let verdict = 'SAFE';
    if (score >= 60) verdict = 'HIGH RISK';
    else if (score >= 30) verdict = 'CAUTION';

    return {
      title: item.job.title,
      company: item.job.company,
      score: score,
      date: new Date(item.analysis.analyzed_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      status: verdict
    };
  });

  return (
    <div className="animate-slide">
      {/* 1. Page Header */}
      <PageHeader
        category="Security Analytics"
        title={`Welcome back, ${userName}`}
        subtitle={totalScans === 0 ? "Your dashboard is ready. Scan a job description to populate metrics." : `Processed ${totalScans} total job descriptions, identifying ${threatScans} critical threat vectors.`}
        action={
          <Btn variant="primary" icon={<Search size={16} />} onClick={() => onNavigate?.('ANALYZER')}>
            Analyze New Job
          </Btn>
        }
      />

      {/* 2. Overview Metrics Cards */}
      <SectionHeader title="Security Overview Metrics" description="Key performance analytics and scam statistics computed from active user scan history." />
      <StatGrid columns={4}>
        <KPICard
          theme="neutral"
          icon={<Search size={22} />}
          label="Jobs Scanned"
          value={totalScans.toLocaleString()}
          change="Real-time volume"
          changeType="positive"
        />
        <KPICard
          theme="red"
          icon={<ShieldAlert size={22} />}
          label="Threats Detected"
          value={threatScans.toLocaleString()}
          change="Risk analysis HIGH + CRITICAL"
          changeType={threatScans > 0 ? "negative" : "positive"}
        />
        <KPICard
          theme="green"
          icon={<ShieldCheck size={22} />}
          label="Safe Jobs Verified"
          value={safeScans.toLocaleString()}
          change="Risk analysis LOW"
          changeType="positive"
        />
        <KPICard
          theme="amber"
          icon={<AlertTriangle size={22} />}
          label="Average Risk Index"
          value={averageRisk.toFixed(1)}
          change="Combined ML & rule scores"
          changeType="positive"
        />
      </StatGrid>

      {/* 3. Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px', marginTop: '24px' }}>
        <AnalyticsCard
          title="Weekly Scan Activity"
          subtitle="Volume of scanned job postings versus detected scams over the last 7 calendar days"
        >
          {totalScans === 0 ? (
            <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <span>No weekly scan history available yet.</span>
            </div>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      boxShadow: 'var(--shadow-card)',
                      color: 'var(--text)',
                      fontSize: '13px'
                    }}
                  />
                  <Area type="monotone" dataKey="scans" stroke="#0284C7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScans)" name="Jobs Analyzed" isAnimationActive={true} animationDuration={1200} />
                  <Area type="monotone" dataKey="threats" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorThreats)" name="Scams Blocked" isAnimationActive={true} animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </AnalyticsCard>

        <AnalyticsCard
          title="Threat Categories"
          subtitle="Proportion of verified safe, warning, and high-risk listings"
        >
          {totalScans === 0 ? (
            <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <span>No scan classification data.</span>
            </div>
          ) : (
            <>
              {/* Horizontal Legend */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#22C55E' }} />
                  Verified safe
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#F59E0B' }} />
                  Warning
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#EF4444' }} />
                  High-risk
                </div>
              </div>

              <div style={{ width: '100%', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={4}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={1200}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        boxShadow: 'var(--shadow-card)',
                        color: 'var(--text)',
                        fontSize: '13px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                {pieData.map(item => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                      <span>{item.name}</span>
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                      {item.value} ({((item.value / totalScans) * 100).toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </AnalyticsCard>
      </div>

      {/* 4. Recent Scans Table */}
      <div style={{ marginBottom: '32px' }}>
        <AnalyticsCard
          title="Recent Job Postings Scanned"
          subtitle="Real-time stream of employer job descriptions processed by the multi-layer classification pipeline"
          noPad
        >
          {recentScansMapped.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No analyses completed yet.
            </div>
          ) : (
            <DataTable columns={columns} data={recentScansMapped} />
          )}
        </AnalyticsCard>
      </div>

      {/* 5. Threat Recommendations */}
      <AnalyticsCard
        title="Latest AI Threat Recommendations"
        subtitle="Automated security insights based on recent scam cluster detections across active channels"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex', alignItems: 'flex-start', gap: '14px'
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                Active Telegram Check Fraud Campaign
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Ensure scanned postings requesting communications via Telegram are flagged. Automated check deposits are a common financial extraction tactic.
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex', alignItems: 'flex-start', gap: '14px'
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                Active Extension Connection
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Your browser extension is securely connected to the backend threat database. Live scanning is active on job boards.
              </div>
            </div>
          </div>
        </div>
      </AnalyticsCard>
    </div>
  );
}
