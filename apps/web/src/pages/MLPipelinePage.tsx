import React from 'react';
import {
  PageHeader,
  StatGrid,
  KPICard,
  AnalyticsCard,
  MetricCard,
  DataTable,
  StatusBadge,
} from '../components/ui';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Cpu, Zap, Layers, Database, ShieldCheck, Activity } from 'lucide-react';

const modelComparisonData = [
  { name: 'XGBoost', accuracy: 0.968, precision: 0.952, recall: 0.941 },
  { name: 'Random Forest', accuracy: 0.942, precision: 0.925, recall: 0.910 },
  { name: 'Neural Net', accuracy: 0.951, precision: 0.938, recall: 0.924 },
  { name: 'Logistic Reg', accuracy: 0.884, precision: 0.862, recall: 0.840 },
];

const rocData = [
  { fpr: 0, tpr: 0, baseline: 0 },
  { fpr: 0.02, tpr: 0.45, baseline: 0.02 },
  { fpr: 0.05, tpr: 0.78, baseline: 0.05 },
  { fpr: 0.1, tpr: 0.91, baseline: 0.1 },
  { fpr: 0.2, tpr: 0.96, baseline: 0.2 },
  { fpr: 0.5, tpr: 0.99, baseline: 0.5 },
  { fpr: 1, tpr: 1, baseline: 1 },
];

const featureImportanceData = [
  { feature: 'Telegram/Signal Mention', importance: 0.28 },
  { feature: 'Check Supply Equipment', importance: 0.22 },
  { feature: 'Free Webmail Recruiter', importance: 0.18 },
  { feature: 'Domain Age < 30 Days', importance: 0.14 },
  { feature: 'Wage Outlier (>2x Market)', importance: 0.09 },
  { feature: 'Package Reshipping Verbiage', importance: 0.05 },
  { feature: 'No Corporate WHOIS Match', importance: 0.04 },
];

const predictionDistributionData = [
  { range: '0-20% (Safe)', count: 2505 },
  { range: '21-50% (Low Risk)', count: 420 },
  { range: '51-75% (Caution)', count: 220 },
  { range: '76-100% (High Scam)', count: 342 },
];

export function MLPipelinePage() {
  return (
    <div className="animate-slide">
      <PageHeader
        category="Model Intelligence"
        title="AI Insights & ML Pipeline"
        subtitle="Detailed model evaluation metrics, feature importance rankings, confusion matrix, and inference benchmarks."
      />

      {/* Top Stat Grid with Semantic Palette */}
      <StatGrid columns={4}>
        <KPICard theme="blue" icon={<Cpu size={22} />} label="Best Model Architecture" value="XGBoost v2" change="Production Active" changeType="positive" />
        <KPICard theme="green" icon={<ShieldCheck size={22} />} label="Model Accuracy" value="96.8%" change="+1.2% retrained" changeType="positive" />
        <KPICard theme="amber" icon={<Zap size={22} />} label="Inference Latency" value="18 ms" change="Avg response time" changeType="neutral" />
        <KPICard theme="blue" icon={<Database size={22} />} label="Training Dataset Size" value="150,000" change="Labeled job listings" changeType="positive" />
      </StatGrid>

      {/* Additional Performance Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <MetricCard label="F1 Score Index" value="0.946" icon={<Activity size={18} />} color="#38BDF8" />
        <MetricCard label="AUC-ROC Score" value="0.982" icon={<Layers size={18} />} color="#22C55E" />
        <MetricCard label="False Positive Rate" value="1.8%" icon={<ShieldCheck size={18} />} color="#22C55E" />
        <MetricCard label="Daily Re-evaluations" value="12,400" icon={<Cpu size={18} />} color="#F59E0B" />
      </div>

      {/* Model Comparison & ROC Curve */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <AnalyticsCard title="Model Architecture Benchmark" subtitle="Comparative accuracy, precision, and recall across trained classifiers">
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} domain={[0.8, 1]} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F8FAFC' }} />
                <Bar dataKey="accuracy" fill="#38BDF8" radius={[4, 4, 0, 0]} name="Accuracy" />
                <Bar dataKey="precision" fill="#22C55E" radius={[4, 4, 0, 0]} name="Precision" />
                <Bar dataKey="recall" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Recall" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="ROC Curve (Receiver Operating Characteristic)" subtitle="True Positive Rate vs False Positive Rate curve (AUC = 0.982)">
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="fpr" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F8FAFC' }} />
                <Line type="monotone" dataKey="tpr" stroke="#38BDF8" strokeWidth={3} dot={{ fill: '#38BDF8' }} name="XGBoost Classifier" />
                <Line type="monotone" dataKey="baseline" stroke="var(--text-muted)" strokeDasharray="5 5" dot={false} name="Random Chance" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>
      </div>

      {/* Feature Importance & Confusion Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Horizontal Bar Chart for Feature Importance */}
        <AnalyticsCard title="Feature Importance Breakdown" subtitle="SHAP feature contribution values to final fraud score prediction">
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={featureImportanceData} margin={{ top: 5, right: 10, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} />
                <YAxis dataKey="feature" type="category" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} width={150} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} formatter={(val: any) => [`${(Number(val) * 100).toFixed(0)}%`, 'Weight']} />
                <Bar dataKey="importance" fill="#F59E0B" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>

        {/* Styled Confusion Matrix */}
        <AnalyticsCard title="Confusion Matrix & Prediction Distribution" subtitle="Validation dataset classification matrix (150,000 samples)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>True Positive (Scam Caught)</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#22C55E', marginTop: 4 }}>4,521</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>False Positive (False Alarm)</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#EF4444', marginTop: 4 }}>89</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>False Negative (Missed)</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#F59E0B', marginTop: 4 }}>142</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>True Negative (Safe Verified)</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#38BDF8', marginTop: 4 }}>3,248</div>
              </div>
            </div>
          </div>
        </AnalyticsCard>

      </div>
    </div>
  );
}
