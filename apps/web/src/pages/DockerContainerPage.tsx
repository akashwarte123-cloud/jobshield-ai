import React, { useState, useEffect } from 'react';
import {
  PageHeader,
  StatGrid,
  KPICard,
  AnalyticsCard,
  DataTable,
  StatusBadge,
} from '../components/ui';
import { Server, Cpu, Activity, ShieldCheck, Globe, Database, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

const containers = [
  { service: 'frontend (web)', image: 'nginx:alpine', port: '80:80', status: 'healthy', cpu: '0.8%', memory: '42 MB' },
  { service: 'api (server)', image: 'jobshield/api:v2.4', port: '8000:8000', status: 'healthy', cpu: '2.4%', memory: '185 MB' },
  { service: 'cache (redis)', image: 'redis:7-alpine', port: '6379:6379', status: 'healthy', cpu: '0.4%', memory: '28 MB' },
  { service: 'database (postgres)', image: 'postgres:15', port: '5432:5432', status: 'healthy', cpu: '1.2%', memory: '240 MB' },
  { service: 'async-worker', image: 'jobshield/worker:v2.4', port: 'internal', status: 'healthy', cpu: '1.8%', memory: '160 MB' },
];

const TOPOLOGY_STEPS = [
  {
    id: 0,
    name: 'Client Browser',
    sub: 'Port 443 / 80',
    icon: Globe,
    color: '#00D8F6',
    dim: 'rgba(0, 216, 246, 0.15)',
    border: 'rgba(0, 216, 246, 0.4)',
    glow: '0 0 24px rgba(0, 216, 246, 0.35)',
    log: 'TLS 1.3 Handshake completed. Encrypted payload dispatched.',
    latency: '0.2 ms',
    connectorGradient: 'linear-gradient(90deg, #00D8F6 0%, #00E599 100%)',
  },
  {
    id: 1,
    name: 'Nginx Gateway',
    sub: 'Frontend Assets',
    icon: Server,
    color: '#00E599',
    dim: 'rgba(0, 229, 153, 0.15)',
    border: 'rgba(0, 229, 153, 0.4)',
    glow: '0 0 24px rgba(0, 229, 153, 0.35)',
    log: 'SSL Termination & Reverse Proxy Pass to API Cluster.',
    latency: '0.4 ms',
    connectorGradient: 'linear-gradient(90deg, #00E599 0%, #6366F1 100%)',
  },
  {
    id: 2,
    name: 'FastAPI Engine',
    sub: 'Port 8000',
    icon: Cpu,
    color: '#6366F1',
    dim: 'rgba(99, 102, 241, 0.15)',
    border: 'rgba(99, 102, 241, 0.4)',
    glow: '0 0 24px rgba(99, 102, 241, 0.35)',
    log: 'NLP Transformer neural model scam detection executing...',
    latency: '12.8 ms',
    connectorGradient: 'linear-gradient(90deg, #6366F1 0%, #F59E0B 100%)',
  },
  {
    id: 3,
    name: 'Redis Cache',
    sub: 'Port 6379',
    icon: Activity,
    color: '#F59E0B',
    dim: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
    glow: '0 0 24px rgba(245, 158, 11, 0.35)',
    log: 'L1 In-Memory WHOIS & Domain Reputation HIT verified.',
    latency: '0.3 ms',
    connectorGradient: 'linear-gradient(90deg, #F59E0B 0%, #3B82F6 100%)',
  },
  {
    id: 4,
    name: 'PostgreSQL',
    sub: 'Port 5432',
    icon: Database,
    color: '#3B82F6',
    dim: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.4)',
    glow: '0 0 24px rgba(59, 130, 246, 0.35)',
    log: 'Audit log & forensic signature saved to relational store.',
    latency: '1.1 ms',
    connectorGradient: 'linear-gradient(90deg, #3B82F6 0%, #00E599 100%)',
  },
];

export function DockerContainerPage() {
  const [activeStep, setActiveStep] = useState(0);

  // Auto-cycle through request pipeline steps
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % TOPOLOGY_STEPS.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const columns = [
    { key: 'service', header: 'Service Name' },
    { key: 'image', header: 'Docker Image' },
    { key: 'port', header: 'Port Binding' },
    {
      key: 'status',
      header: 'Health Status',
      render: (val: string) => <StatusBadge status="safe" label={val.toUpperCase()} />
    },
    { key: 'cpu', header: 'CPU Usage' },
    { key: 'memory', header: 'Memory Usage' },
  ];

  const currentStep = TOPOLOGY_STEPS[activeStep];

  return (
    <div className="animate-slide" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Dynamic Keyframes for Animated Packet Progress */}
      <style>{`
        @keyframes topologyPulse {
          0% { left: 0%; opacity: 0.2; transform: scale(0.8); }
          20% { opacity: 1; transform: scale(1.3); }
          80% { opacity: 1; transform: scale(1.3); }
          100% { left: 100%; opacity: 0.2; transform: scale(0.8); }
        }
        @keyframes nodeActiveGlow {
          0% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0); }
        }
      `}</style>

      <PageHeader
        category="Infrastructure Status"
        title="Service Architecture & Containers"
        subtitle="Live service mesh topology, container health, and inter-service request routing."
      />

      <StatGrid columns={4}>
        <KPICard theme="green" icon={<Server size={22} />} label="Active Services" value="5 / 5 Healthy" change="All containers online" changeType="positive" />
        <KPICard theme="blue" icon={<Cpu size={22} />} label="Total CPU Usage" value="6.6%" change="Normal load bounds" changeType="positive" />
        <KPICard theme="blue" icon={<Activity size={22} />} label="Memory Allocation" value="655 MB" change="Out of 4.0 GB pool" changeType="positive" />
        <KPICard theme="green" icon={<ShieldCheck size={22} />} label="System Uptime" value="14d 06h" change="Zero downtime restarts" changeType="positive" />
      </StatGrid>

      {/* ══ Animated Request Flow Topology Card ══ */}
      <AnalyticsCard
        title="Live Request Flow Topology"
        subtitle="Real-time request routing animation with step-by-step color progress telemetry"
      >
        <div style={{ padding: '28px 12px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Node Flow Horizontal Pipeline */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {TOPOLOGY_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              const isPast = activeStep > idx;

              return (
                <React.Fragment key={step.id}>
                  {/* Node Card */}
                  <div
                    onClick={() => setActiveStep(idx)}
                    style={{
                      background: isActive ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                      border: isActive
                        ? `2px solid ${step.color}`
                        : isPast
                        ? `1px solid ${step.color}66`
                        : '1px solid var(--border)',
                      borderRadius: 16,
                      padding: '20px 22px',
                      textAlign: 'center',
                      width: '165px',
                      zIndex: 3,
                      cursor: 'pointer',
                      boxShadow: isActive ? step.glow : 'none',
                      transform: isActive ? 'scale(1.04)' : 'scale(1)',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative',
                    }}
                  >
                    {/* Step Number Tag */}
                    <div style={{
                      position: 'absolute', top: -10, right: 12,
                      background: isActive ? step.color : 'var(--border)',
                      color: isActive ? '#030712' : 'var(--text-secondary)',
                      fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10,
                      fontFamily: 'var(--font-mono)',
                    }}>
                      0{idx + 1}
                    </div>

                    {/* Icon Box with Node Specific Color */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: step.dim,
                      color: step.color,
                      border: `1px solid ${step.color}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 12px',
                      boxShadow: isActive ? `0 0 16px ${step.color}55` : 'none',
                      transition: 'all 0.3s ease',
                    }}>
                      <Icon size={22} />
                    </div>

                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>
                      {step.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                      {step.sub}
                    </div>
                  </div>

                  {/* Inter-Node Progress Connector Line */}
                  {idx < TOPOLOGY_STEPS.length - 1 && (
                    <div style={{
                      flex: 1,
                      height: 4,
                      background: isPast
                        ? step.connectorGradient
                        : 'var(--border)',
                      borderRadius: 2,
                      margin: '0 10px',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'background 0.4s ease',
                    }}>
                      {/* Active Color-Specific Traveling Packet Bullets */}
                      {isActive && (
                        <>
                          {/* Animated Progress Fill Bar */}
                          <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%',
                            background: step.connectorGradient,
                            boxShadow: `0 0 10px ${step.color}`,
                          }} />
                          {/* Pulsing Glowing Packet Bullet */}
                          <div style={{
                            position: 'absolute', top: -4, width: 12, height: 12, borderRadius: '50%',
                            background: step.color,
                            boxShadow: `0 0 14px 2px ${step.color}`,
                            animation: 'topologyPulse 1.8s ease-in-out infinite',
                          }} />
                        </>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* ══ Live Step Telemetry Log Footer Bar ══ */}
          <div style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${currentStep.color}35`,
            borderRadius: 12,
            padding: '14px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            marginTop: 8,
            transition: 'border-color 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                background: currentStep.dim,
                color: currentStep.color,
                border: `1px solid ${currentStep.color}55`,
                fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 6,
                fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: currentStep.color, boxShadow: `0 0 8px ${currentStep.color}` }} />
                STEP 0{activeStep + 1} / 05 ACTIVE
              </span>
              <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                {currentStep.log}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                LATENCY: <span style={{ color: currentStep.color, fontWeight: 700 }}>{currentStep.latency}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#00E599', fontWeight: 700, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> HEALTHY
              </div>
            </div>
          </div>

        </div>
      </AnalyticsCard>

      <div style={{ height: '8px' }} />

      {/* Container Health Table */}
      <AnalyticsCard title="Container Orchestration Status" subtitle="Detailed health metrics for Docker Compose stack services" noPad>
        <DataTable columns={columns} data={containers} />
      </AnalyticsCard>
    </div>
  );
}
