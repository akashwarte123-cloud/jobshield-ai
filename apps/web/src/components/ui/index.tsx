import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getInitials } from '../../utils/userHelpers';

/* ============================================================
   JobShield Brand Assets — Pure SVG, no bitmap imports
   Three variants:
     'mark'      → shield icon only  (extension popup, favicon, small UI)
     'wordmark'  → horizontal [shield] + JOBSHIELD text  (sidebar, navbar)
     'full'      → shield + stacked JOBSHIELD + tagline  (landing page, hero)
   ============================================================ */

// Faithful recreation of the official JobShield shield mark
// Matches: teal outer shell → dark inner fill (border effect) → dual-bump top notch
//          person figure (head + tie + body + raised arms) → diagonal swoosh ribbon → bottom chevrons
function ShieldMark({ size = 32 }: { size?: number; subtle?: boolean }) {
  const h = Math.round(size * (220 / 200));
  return (
    <img
      src="/branding/jobshield-mark.png"
      alt="JobShield Logo"
      style={{
        width: size,
        height: h,
        objectFit: 'contain',
        flexShrink: 0,
        display: 'block'
      }}
    />
  );
}

interface JobShieldLogoProps {
  size?: number;
  /** 'mark' = shield only, 'wordmark' = shield+name, 'full' = shield+name+tagline */
  variant?: 'mark' | 'wordmark' | 'full';
  /** @deprecated use variant='wordmark' instead */
  showText?: boolean;
  subtle?: boolean;
  theme?: 'dark' | 'light' | 'auto';
}

export function JobShieldLogo({ size = 34, variant, showText, subtle = false, theme = 'auto' }: JobShieldLogoProps) {
  // Backwards-compat: if showText is explicitly passed, use it to derive variant
  const resolvedVariant: 'mark' | 'wordmark' | 'full' = variant ?? (showText === false ? 'mark' : 'wordmark');

  if (resolvedVariant === 'mark') {
    return <ShieldMark size={size} subtle={subtle} />;
  }

  const textSize = Math.round(size * 0.44);
  const taglineSize = Math.round(size * 0.22);

  const jobColor = theme === 'dark' ? '#00E599' : theme === 'light' ? 'var(--primary)' : 'var(--primary)';
  const shieldColor = theme === 'dark' ? '#FFFFFF' : theme === 'light' ? 'var(--text)' : 'var(--text)';

  return (
    <div style={{ display: 'inline-flex', alignItems: resolvedVariant === 'full' ? 'center' : 'center', gap: Math.round(size * 0.3), flexDirection: resolvedVariant === 'full' ? 'column' : 'row' }}>
      <ShieldMark size={size} subtle={subtle} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: resolvedVariant === 'full' ? 4 : 0 }}>
        {/* Wordmark: JOB in teal/green, SHIELD in white/text */}
        <span style={{
          fontSize: resolvedVariant === 'full' ? size * 0.6 : textSize,
          fontWeight: 900,
          letterSpacing: resolvedVariant === 'full' ? '-0.01em' : '0.04em',
          lineHeight: 1.05,
          fontFamily: 'var(--font)',
          textTransform: 'uppercase',
          display: 'block',
          textAlign: resolvedVariant === 'full' ? 'center' : 'left',
        }}>
          <span style={{ color: jobColor }}>JOB</span>
          <span style={{ color: shieldColor }}>SHIELD</span>
        </span>
        {/* Tagline: only shown on 'full' variant */}
        {resolvedVariant === 'full' && (
          <span style={{
            fontSize: taglineSize,
            fontWeight: 500,
            color: 'rgba(180,220,215,0.75)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font)',
            display: 'block',
            textAlign: 'center',
            marginTop: 2,
          }}>
            Protecting Your Professional Future
          </span>
        )}
      </div>
    </div>
  );
}


/* ============================================================
   StatCard — Metric KPI display
   ============================================================ */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subValue?: string;
  theme?: 'primary' | 'success' | 'danger' | 'warning';
}

export function StatCard({ label, value, icon, trend, change, changeType = 'neutral', subValue, theme = 'primary' }: StatCardProps) {
  const themes = {
    primary: { bg: 'var(--primary-dim)', border: 'var(--primary-border)', color: 'var(--primary-text, var(--primary))', shadow: 'none' },
    success: { bg: 'var(--safe-dim)', border: 'var(--safe-border)', color: 'var(--safe-text, var(--safe))', shadow: 'none' },
    danger:  { bg: 'var(--danger-dim)', border: 'var(--danger-border)', color: 'var(--danger-text, var(--danger))', shadow: 'none' },
    warning: { bg: 'var(--warning-dim)', border: 'var(--warning-border)', color: 'var(--warning-text, var(--warning))', shadow: 'none' },
  };

  const t = themes[theme];
  const changeColor = changeType === 'positive' ? 'var(--safe-text, var(--safe))' : changeType === 'negative' ? 'var(--danger-text, var(--danger))' : 'var(--text-secondary)';
  const ChangeIcon = changeType === 'positive' ? TrendingUp : changeType === 'negative' ? TrendingDown : Minus;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border)`,
        borderRadius: 'var(--radius-card)',
        padding: '24px',
        position: 'relative',
        isolation: 'isolate',
        boxShadow: 'var(--shadow)',
        transition: 'transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal)',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--border-mid)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0px)';
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'var(--shadow)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: t.bg, border: `1px solid ${t.border}`,
          color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        {change && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: changeColor, fontFamily: 'var(--font-mono)' }}>
            <ChangeIcon size={14} />
            {change}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
        <div style={{ fontSize: 38, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.2, fontFamily: 'var(--font-mono)' }}>
          {value}
        </div>
        {trend && (
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: changeType === 'positive' ? 'var(--safe-text, var(--safe))' : changeType === 'negative' ? 'var(--danger-text, var(--danger))' : 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}>
            {trend}
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginTop: '8px', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', WebkitFontSmoothing: 'antialiased' }}>
        {label}
      </div>
      {subValue && (
        <div style={{ fontSize: 11, fontWeight: 600, color: changeColor, marginTop: 6, fontFamily: 'var(--font)' }}>
          {subValue}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   KPICard — Top-level metric card with semantic colors
   ============================================================ */
export type KPITheme = 'blue' | 'green' | 'amber' | 'orange' | 'red' | 'cyan' | 'indigo' | 'neutral';

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  theme?: KPITheme;
  subValue?: string;
  trend?: string;
  onClick?: () => void;
}

export function KPICard({
  icon,
  label,
  value,
  change,
  changeType = 'neutral',
  theme = 'blue',
  subValue,
  trend,
  onClick,
}: KPICardProps) {
  const changeColor =
    changeType === 'positive'
      ? 'var(--safe-text, var(--safe))'
      : changeType === 'negative'
      ? 'var(--danger-text, var(--danger))'
      : 'var(--text-muted)';

  const themeMap = {
    green:   { color: 'var(--safe-text, var(--safe))', bg: 'var(--safe-dim)', border: 'var(--safe-border)', accent: 'var(--safe)' },
    cyan:    { color: 'var(--primary-text, var(--primary))', bg: 'var(--primary-dim)', border: 'var(--primary-border)', accent: 'var(--primary)' },
    blue:    { color: 'var(--primary-text, var(--primary))', bg: 'var(--primary-dim)', border: 'var(--primary-border)', accent: 'var(--primary)' },
    orange:  { color: 'var(--warning-text, var(--warning))', bg: 'var(--warning-dim)', border: 'var(--warning-border)', accent: 'var(--warning)' },
    indigo:  { color: 'var(--primary)', bg: 'var(--primary-dim)', border: 'var(--primary-border)', accent: 'var(--primary)' },
    purple:  { color: 'var(--primary)', bg: 'var(--primary-dim)', border: 'var(--primary-border)', accent: 'var(--primary)' },
    amber:   { color: 'var(--warning-text, var(--warning))', bg: 'var(--warning-dim)', border: 'var(--warning-border)', accent: 'var(--warning)' },
    red:     { color: 'var(--danger-text, var(--danger))', bg: 'var(--danger-dim)',  border: 'var(--danger-border)', accent: 'var(--danger)' },
    neutral: { color: 'var(--primary)', bg: 'var(--primary-dim)', border: 'var(--primary-border)', accent: 'var(--primary)' },
  };

  const t = themeMap[theme] || themeMap.blue;
  const ChangeIcon = changeType === 'positive' ? TrendingUp : changeType === 'negative' ? TrendingDown : Minus;

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border)`,
        borderRadius: 'var(--radius-card)',
        padding: '24px',
        position: 'relative',
        isolation: 'isolate',
        boxShadow: 'var(--shadow-card)',
        transition: 'transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal)',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--border-mid)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0px)';
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
    >
      {/* Top semantic accent strip */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 3.5,
        background: t.accent,
        borderTopLeftRadius: 'inherit',
        borderTopRightRadius: 'inherit',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: t.bg, border: `1px solid ${t.border}`,
          color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        {change && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: changeColor, fontFamily: 'var(--font-mono)' }}>
            <ChangeIcon size={14} />
            {change}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
        <div style={{ fontSize: 38, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.2, fontFamily: 'var(--font-mono)' }}>
          {value}
        </div>
        {trend && (
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: changeType === 'positive' ? 'var(--success)' : changeType === 'negative' ? 'var(--danger)' : 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}>
            {trend}
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginTop: '8px', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', WebkitFontSmoothing: 'antialiased' }}>
        {label}
      </div>
      {subValue && (
        <div style={{ fontSize: 11, fontWeight: 600, color: changeColor, marginTop: 6, fontFamily: 'var(--font)' }}>
          {subValue}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   PageHeader — Prominent header with category & description
   ============================================================ */
interface PageHeaderProps {
  title: string;
  category?: string;
  subtitle?: string;
  action?: React.ReactNode;
  align?: 'center' | 'flex-start' | 'flex-end';
}

export function PageHeader({ title, category = 'Security Analytics', subtitle, action, align = 'center' }: PageHeaderProps) {
  return (
    <div style={{
      display: 'flex', alignItems: align, justifyContent: 'space-between',
      marginBottom: '32px', gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 280 }}>
        {category && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            <span style={{ display: 'inline-block', width: 14, height: 2, background: 'var(--primary)', borderRadius: 1 }} />
            {category}
          </div>
        )}
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1.3, letterSpacing: '-0.025em' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '8px 0 0 0', fontWeight: 400, maxWidth: 640, lineHeight: 1.65 }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

/* ============================================================
   SectionHeader — Section title with optional description
   ============================================================ */
interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: '16px',
    }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
          {title}
        </h2>
        {description && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '3px 0 0 0', fontWeight: 400, lineHeight: 1.5 }}>
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ============================================================
   StatusBadge — Colored status indicator
   ============================================================ */
interface StatusBadgeProps {
  status: 'safe' | 'warning' | 'danger' | 'neutral' | 'info';
  label: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, label, size = 'sm' }: StatusBadgeProps) {
  const colors: Record<string, { bg: string; border: string; text: string; emoji: string }> = {
    safe:    { bg: 'var(--safe-dim)', border: 'var(--safe-border)', text: 'var(--safe-text, var(--safe))', emoji: '🟢' },
    warning: { bg: 'var(--warning-dim)', border: 'var(--warning-border)', text: 'var(--warning-text, var(--warning))', emoji: '🟡' },
    danger:  { bg: 'var(--danger-dim)', border: 'var(--danger-border)', text: 'var(--danger-text, var(--danger))', emoji: '🔴' },
    neutral: { bg: 'var(--neutral-bg)', border: 'var(--border)', text: 'var(--text-secondary)', emoji: '⚪' },
    info:    { bg: 'var(--primary-dim)', border: 'var(--primary-border)', text: 'var(--primary-text, var(--primary))', emoji: '🔵' },
  };
  const c = colors[status] || colors.neutral;
  const pad = size === 'sm' ? '5px 12px' : '7px 16px';
  const fs = size === 'sm' ? 11.5 : 12.5;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      padding: pad, borderRadius: 20,
      fontSize: fs, fontWeight: 800, lineHeight: 1.2,
      fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
      WebkitFontSmoothing: 'antialiased',
    }}>
      <span style={{ fontSize: fs }}>{c.emoji}</span>
      {label}
    </span>
  );
}

/* ============================================================
   StatGrid — Grid for KPI cards with 24px gap
   ============================================================ */
interface StatGridProps {
  columns?: number;
  children: React.ReactNode;
}

export function StatGrid({ columns = 4, children }: StatGridProps) {
  return (
    <div className="stagger" style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '24px',
      marginBottom: '32px',
    }}>
      {children}
    </div>
  );
}

/* ============================================================
   AnalyticsCard — Wrapper card for charts and sections (28px padding)
   ============================================================ */
interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  noPad?: boolean;
  style?: React.CSSProperties;
}

export function AnalyticsCard({ title, subtitle, children, action, noPad, style }: AnalyticsCardProps) {
  return (
    <div className="card" style={{
      padding: 0,
      isolation: 'isolate',
      ...style
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 30px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em', WebkitFontSmoothing: 'antialiased' }}>{title}</h3>
          {subtitle && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0', fontWeight: 400, WebkitFontSmoothing: 'antialiased', lineHeight: 1.5 }}>{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div style={{ padding: noPad ? 0 : '26px 30px' }}>
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   MetricCard — Inline stat with label/value
   ============================================================ */
interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

export function MetricCard({ label, value, icon, color = 'var(--primary)' }: MetricCardProps) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, var(--bg-surface) 0%, ${color}08 100%)`,
        border: `1px solid var(--border)`,
        borderRadius: '14px',
        padding: '20px 22px',
        display: 'flex', alignItems: 'center', gap: '16px',
        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'default',
        minWidth: 0,
        maxWidth: '100%',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={e => { 
        e.currentTarget.style.transform = 'translateY(-2px)'; 
        e.currentTarget.style.borderColor = 'var(--border-mid)'; 
        e.currentTarget.style.boxShadow = 'var(--shadow)'; 
      }}
      onMouseLeave={e => { 
        e.currentTarget.style.transform = 'translateY(0)'; 
        e.currentTarget.style.borderColor = 'var(--border)'; 
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; 
      }}
    >
      {icon && (
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: `${color}14`, border: `1px solid ${color}30`,
          color: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{label}</div>
        <div style={{ 
          fontSize: 22, fontWeight: 800, color: 'var(--text)', marginTop: 4, 
          letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)', lineHeight: 1.2,
          overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'normal',
          minWidth: 0, maxWidth: '100%'
        }}>{value}</div>
      </div>
    </div>
  );
}

/* ============================================================
   EmptyState — Placeholder when no data
   ============================================================ */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const fallbackIcon = icon || (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '64px 32px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: 'var(--radius-btn)',
        background: 'var(--primary-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--primary)', marginBottom: '20px',
        border: '1px solid var(--primary-border)',
      }}>
        {fallbackIcon}
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: '0 0 8px 0' }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, maxWidth: 420, fontWeight: 400, lineHeight: 1.6 }}>{description}</p>
      {action && <div style={{ marginTop: '24px' }}>{action}</div>}
    </div>
  );
}

/* ============================================================
   RiskGauge — Semi-circle gauge (Support larger sizes e.g. 260px)
   ============================================================ */
interface RiskGaugeProps {
  score: number;
  size?: number;
  label?: string;
  mode?: 'risk' | 'trust';
}

export function RiskGauge({ score, size = 240, label, mode = 'risk' }: RiskGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const angle = (clampedScore / 100) * 180;

  let color = 'var(--success)';
  let statusLabel = 'LOW RISK';

  if (mode === 'trust') {
    if (clampedScore >= 80) {
      color = 'var(--success)';
      statusLabel = 'VERIFIED TRUST';
    } else if (clampedScore >= 50) {
      color = 'var(--warning)';
      statusLabel = 'MODERATE TRUST';
    } else {
      color = 'var(--danger)';
      statusLabel = 'HIGH RISK / UNVERIFIED';
    }
  } else {
    if (clampedScore >= 70) {
      color = 'var(--danger)';
      statusLabel = 'HIGH RISK';
    } else if (clampedScore >= 30) {
      color = 'var(--warning)';
      statusLabel = 'MEDIUM RISK';
    } else {
      color = 'var(--success)';
      statusLabel = 'LOW RISK';
    }
  }

  const r = (size - 30) / 2;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const circumference = Math.PI * r;
  const dashOffset = circumference - (angle / 180) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size / 2 + 35} viewBox={`0 0 ${size} ${size / 2 + 35}`}>
        {/* Background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="var(--border)" strokeWidth="12" strokeLinecap="round"
        />
        {/* Active arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.8s var(--ease), stroke 0.4s ease' }}
        />
        <text x={cx} y={cy - 24} textAnchor="middle" fill="var(--text)" fontSize={size >= 240 ? "44" : "32"} fontWeight="700" fontFamily="var(--font)">
          {clampedScore}
        </text>
        <text x={cx} y={cy + 4} textAnchor="middle" fill={color} fontSize={size >= 240 ? "14" : "12"} fontWeight="700" letterSpacing="0.06em" fontFamily="var(--font)">
          {statusLabel}
        </text>
      </svg>
      {label && (
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, marginTop: '8px' }}>{label}</span>
      )}
    </div>
  );
}

/* ============================================================
   Btn — Button component
   ============================================================ */
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Btn({ variant = 'primary', size = 'md', icon, children, style, ...props }: BtnProps) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--btn-primary-bg)',
      color: 'var(--btn-primary-text)', fontWeight: 700,
      border: 'none',
      boxShadow: '0 2px 6px -1px rgba(15, 118, 110, 0.22)',
    },
    secondary: {
      background: 'var(--btn-secondary-bg)', color: 'var(--btn-secondary-text)',
      border: '1px solid var(--btn-secondary-border)',
      fontWeight: 700,
      boxShadow: 'var(--shadow-sm)',
    },
    danger: {
      background: 'var(--danger-dim)', color: 'var(--danger-text, var(--danger))',
      border: '1px solid var(--danger-border)',
      fontWeight: 700,
    },
    ghost: {
      background: 'transparent', color: 'var(--text-secondary)',
      border: 'none',
    },
  };
  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '7px 16px', fontSize: 12, borderRadius: 'var(--radius-btn)' },
    md: { padding: '10px 22px', fontSize: 13, borderRadius: 'var(--radius-btn)' },
    lg: { padding: '13px 28px', fontSize: 14, borderRadius: 'var(--radius-btn)' },
  };

  const hoverHandlers: Record<string, { enter: (e: React.MouseEvent<HTMLButtonElement>) => void; leave: (e: React.MouseEvent<HTMLButtonElement>) => void }> = {
    primary: {
      enter: e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = 'var(--btn-primary-hover-bg)'; e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(15, 118, 110, 0.32)'; },
      leave: e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'var(--btn-primary-bg)'; e.currentTarget.style.boxShadow = '0 2px 6px -1px rgba(15, 118, 110, 0.22)'; },
    },
    secondary: {
      enter: e => { e.currentTarget.style.background = 'var(--btn-secondary-hover-bg)'; e.currentTarget.style.borderColor = 'var(--btn-secondary-hover-border)'; e.currentTarget.style.transform = 'translateY(-1px)'; },
      leave: e => { e.currentTarget.style.background = 'var(--btn-secondary-bg)'; e.currentTarget.style.borderColor = 'var(--btn-secondary-border)'; e.currentTarget.style.transform = 'translateY(0)'; },
    },
    danger: {
      enter: e => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.16)'; e.currentTarget.style.transform = 'translateY(-1px)'; },
      leave: e => { e.currentTarget.style.background = 'var(--danger-dim)'; e.currentTarget.style.transform = 'translateY(0)'; },
    },
    ghost: {
      enter: e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--bg-surface)'; },
      leave: e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; },
    },
  };
  const h = hoverHandlers[variant];

  return (
    <button
      {...props}
      onMouseEnter={h.enter}
      onMouseLeave={h.leave}
      style={{
        ...styles[variant], ...sizes[size],
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: 'pointer', fontFamily: 'var(--font)',
        transition: 'transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal), background-color var(--transition-normal)',
        WebkitFontSmoothing: 'antialiased',
        lineHeight: 1.3,
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

/* ============================================================
   TextInput — Input field
   ============================================================ */
interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  iconColor?: string;
}

export function TextInput({ label, icon, iconColor = 'var(--primary)', style, ...props }: TextInputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', paddingLeft: 2, WebkitFontSmoothing: 'antialiased', letterSpacing: '0.04em', lineHeight: 1.4 }}>{label}</label>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--bg-input)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-input)',
        padding: '12px 18px',
        transition: 'border-color var(--transition-normal), box-shadow var(--transition-normal)',
        minWidth: 0,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--primary-dim)'; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        {icon && <span style={{ color: iconColor, display: 'flex', flexShrink: 0 }}>{icon}</span>}
        <input
          {...props}
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text)', fontSize: 13.5, fontFamily: 'var(--font)',
            width: '100%', fontWeight: 400, paddingLeft: 4,
            WebkitFontSmoothing: 'antialiased',
            letterSpacing: '-0.01em', lineHeight: 1.5,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            ...style,
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   TextArea — Multiline input field
   ============================================================ */
export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  wrapperStyle?: React.CSSProperties;
}

export function TextArea({ label, style, wrapperStyle, onFocus, onBlur, ...props }: TextAreaProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...wrapperStyle }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', paddingLeft: 2, WebkitFontSmoothing: 'antialiased', letterSpacing: '0.04em', lineHeight: 1.4 }}>
          {label}
        </label>
      )}
      <textarea
        {...props}
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-input)',
          padding: '12px 18px',
          minHeight: 110,
          color: 'var(--text)',
          fontSize: 13.5,
          fontFamily: 'var(--font)',
          outline: 'none',
          resize: 'vertical',
          width: '100%',
          boxSizing: 'border-box',
          WebkitFontSmoothing: 'antialiased',
          lineHeight: 1.5,
          letterSpacing: '-0.01em',
          transition: 'border-color var(--transition-normal), box-shadow var(--transition-normal), background-color var(--transition-normal)',
          ...style,
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'var(--primary)';
          e.currentTarget.style.boxShadow = '0 0 0 4px var(--primary-dim)';
          onFocus?.(e);
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.boxShadow = 'none';
          onBlur?.(e);
        }}
      />
    </div>
  );
}

/* ============================================================
   DataTable — Table wrapper
   ============================================================ */
interface Column<T> {
  key: string;
  header: string;
  render?: (value: any, row?: any) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({ columns, data, emptyMessage = 'No data available' }: DataTableProps<T>) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-table)',
      overflowX: 'auto',
    }}>
      <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{ width: col.width }}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   UserAvatar — Unified profile avatar across all surfaces
   ============================================================ */
export interface UserAvatarProps {
  avatar?: string | null;
  name?: string | null;
  size?: number;
  fontSize?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function UserAvatar({ avatar, name = 'User', size = 36, fontSize, style, onClick }: UserAvatarProps) {
  const initials = getInitials(name);
  const calculatedFontSize = fontSize || Math.round(size * 0.38);

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--avatar-bg)',
        color: 'var(--avatar-text)',
        border: '1px solid var(--avatar-border)',
        boxShadow: 'var(--avatar-shadow)',
        flexShrink: 0,
        fontWeight: 800,
        fontSize: calculatedFontSize,
        fontFamily: 'var(--font)',
        letterSpacing: '0.02em',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        ...style,
      }}
    >
      {avatar ? (
        <img src={avatar} alt={name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

