import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Btn } from '../components/ui';

interface ForbiddenPageProps {
  onReturn: () => void;
}

export function ForbiddenPage({ onReturn }: ForbiddenPageProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '24px',
      textAlign: 'center',
      zIndex: 1
    }}>
      <div className="animate-scale" style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-strong)',
        borderRadius: '24px',
        padding: '48px 32px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: 'var(--shadow-xl)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'var(--danger-dim)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.15)'
        }}>
          <ShieldAlert size={32} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            Access Denied
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            This workspace requires administrator credentials. Your account is registered under the <strong>USER</strong> role.
          </p>
        </div>

        <div style={{
          height: '1px',
          background: 'var(--border)',
          width: '100%',
          margin: '8px 0'
        }} />

        <Btn variant="primary" onClick={onReturn}>
          <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Return to Seeker App
        </Btn>
      </div>
    </div>
  );
}
