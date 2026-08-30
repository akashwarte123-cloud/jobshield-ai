import React from 'react';
import { 
  PageHeader, 
  StatGrid, 
  KPICard, 
  AnalyticsCard, 
  DataTable, 
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
  AreaChart,
  Area
} from 'recharts';
import { CheckSquare, XSquare, ShieldAlert, Activity } from 'lucide-react';

export function TestingSuitePage() {
  const coverageData = [
    { module: 'Core', coverage: 94 },
    { module: 'API', coverage: 88 },
    { module: 'ML', coverage: 85 },
    { module: 'UI', coverage: 78 },
  ];

  const historyData = [
    { day: 'Mon', tests: 110 },
    { day: 'Tue', tests: 115 },
    { day: 'Wed', tests: 118 },
    { day: 'Thu', tests: 120 },
    { day: 'Fri', tests: 124 },
    { day: 'Sat', tests: 127 },
    { day: 'Sun', tests: 127 },
  ];

  const testColumns = [
    { key: 'name', header: 'Test Name' },
    { 
      key: 'suite', 
      header: 'Suite',
      render: (val: string) => (
        <StatusBadge 
          status={val === 'Unit' ? 'info' : val === 'Integration' ? 'warning' : 'neutral'} 
          label={val} 
        />
      )
    },
    { key: 'duration', header: 'Duration' },
    { 
      key: 'status', 
      header: 'Status',
      render: (val: string) => (
        <StatusBadge status={val === 'Pass' ? 'safe' : 'danger'} label={val} />
      )
    },
  ];

  const testData = [
    { name: 'test_auth_token_generation', suite: 'Unit', duration: '45ms', status: 'Pass' },
    { name: 'test_user_registration_flow', suite: 'Integration', duration: '1.2s', status: 'Pass' },
    { name: 'test_job_scan_classification', suite: 'Unit', duration: '120ms', status: 'Pass' },
    { name: 'test_company_verification_api', suite: 'Integration', duration: '850ms', status: 'Pass' },
    { name: 'test_rate_limit_exceeded', suite: 'E2E', duration: '2.4s', status: 'Fail' },
    { name: 'test_model_inference_latency', suite: 'Unit', duration: '89ms', status: 'Pass' },
    { name: 'test_db_connection_pool', suite: 'Integration', duration: '400ms', status: 'Pass' },
    { name: 'test_report_generation_pdf', suite: 'Unit', duration: '350ms', status: 'Pass' },
    { name: 'test_webhook_delivery_retry', suite: 'Integration', duration: '1.5s', status: 'Fail' },
    { name: 'test_dashboard_metrics_cache', suite: 'Unit', duration: '25ms', status: 'Pass' },
    { name: 'test_payment_subscription_flow', suite: 'E2E', duration: '3.1s', status: 'Fail' },
    { name: 'test_malicious_payload_rejection', suite: 'Unit', duration: '15ms', status: 'Pass' },
  ];

  return (
    <div className="animate-slide">
      <PageHeader 
        title="Testing" 
        subtitle="Automated test suite results and code coverage" 
      />
      
      <div style={{ marginBottom: '32px' }}>
        <StatGrid>
          <KPICard icon={<Activity size={20} />} label="Total Tests" value="127" />
          <KPICard icon={<CheckSquare size={20} />} label="Passing" value="124" />
          <KPICard icon={<XSquare size={20} />} label="Failing" value="3" change="+1" changeType="negative" />
          <KPICard icon={<ShieldAlert size={20} />} label="Coverage" value="89.2%" />
        </StatGrid>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <AnalyticsCard title="Test Results" noPad>
          <DataTable columns={testColumns} data={testData} />
        </AnalyticsCard>

        <AnalyticsCard title="Coverage by Module">
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coverageData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="module" type="category" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
                <Bar dataKey="coverage" fill="#38BDF8" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>
      </div>

      <AnalyticsCard title="Test Execution History" subtitle="Last 7 days">
        <div style={{ height: '250px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
              />
              <Area type="monotone" dataKey="tests" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#colorTests)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </AnalyticsCard>
    </div>
  );
}
