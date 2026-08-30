import React from 'react';
import {
  PageHeader,
  StatGrid,
  MetricCard,
  AnalyticsCard,
  RiskGauge
} from '../components/ui';
import { Shield, BrainCircuit, Globe, History } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';

const breakdownData = [
  { name: 'Rule Engine', value: 28, color: '#22C55E' },
  { name: 'ML Model', value: 31, color: '#38BDF8' },
  { name: 'WHOIS Analysis', value: 42, color: '#F59E0B' },
  { name: 'Historical Data', value: 18, color: '#22C55E' },
];

export function HybridAIPage() {
  return (
    <div className="animate-slide" style={{ padding: '32px' }}>
      <PageHeader 
        title="Hybrid Analysis Engine" 
        subtitle="Multi-layer fraud detection pipeline results" 
      />

      <div style={{ display: 'flex', justifyContent: 'center', margin: '48px 0' }}>
        <RiskGauge score={34} size={240} label="Overall Risk Assessment" />
      </div>

      <StatGrid columns={4}>
        <MetricCard icon={<Shield size={20} />} label="Rule Engine" value="Score: 28" color="success" />
        <MetricCard icon={<BrainCircuit size={20} />} label="ML Model" value="Score: 31" color="primary" />
        <MetricCard icon={<Globe size={20} />} label="WHOIS Analysis" value="Score: 42" color="warning" />
        <MetricCard icon={<History size={20} />} label="Historical Data" value="Score: 18" color="success" />
      </StatGrid>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '32px' }}>
        <AnalyticsCard title="Analysis Breakdown">
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdownData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} domain={[0, 100]} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                  formatter={(value: any) => [`${value} Points`, 'Risk Contribution']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {breakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Decision Explanation">
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'var(--text)', lineHeight: 1.6 }}>
              The Hybrid Analysis Engine has evaluated this entity across four distinct detection layers, resulting in a composite risk score of <strong>34 (Low/Medium Risk)</strong>.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              <div style={{ padding: '16px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={16} /> Primary Flag: WHOIS Registration
                </h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Domain was registered recently (under 6 months) and utilizes privacy protection services typical of temporary infrastructure, contributing heavily to the risk score.
                </p>
              </div>

              <div style={{ padding: '16px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BrainCircuit size={16} /> ML Anomalies detected
                </h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Natural language processing models flagged the job description for unusual urgency and salary variance outside the 95th percentile for the specified role and region.
                </p>
              </div>

              <div style={{ padding: '16px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#22C55E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={16} /> Mitigating Factors
                </h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Historical data indicates prior legitimate activity associated with the root company entity, and heuristic rule checks found no explicit blacklisted identifiers.
                </p>
              </div>
            </div>
          </div>
        </AnalyticsCard>
      </div>
    </div>
  );
}
