import React, { useState, useEffect } from 'react';
import {
  PageHeader,
  AnalyticsCard,
  MetricCard,
  StatusBadge,
  Btn,
  TextInput,
  UserAvatar,
} from '../components/ui';
import { User, Mail, Shield, Key, Lock, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { getInitials } from '../utils/userHelpers';

export function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then(res => {
        if (res.success && res.data) {
          setProfile(res.data);
        }
      })
      .catch(err => {
        console.error('Error loading profile:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
        <RefreshCw size={32} className="spin" color="var(--primary)" />
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Loading profile data...</div>
      </div>
    );
  }

  const name = profile?.name || 'User';
  const email = profile?.email || '';
  const isSystemAdmin = email.toLowerCase().includes('admin');
  const roleLabel = isSystemAdmin ? 'SYSTEM ADMIN' : 'JOB SEEKER';
  
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'August 2026';

  const initials = getInitials(name);

  return (
    <div className="animate-slide">
      <PageHeader
        category="Account Management"
        title="User Profile & Security"
        subtitle="Manage your personal profile, authentication credentials, and system settings."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '35% 65%', gap: '24px', marginBottom: '32px' }}>
        
        {/* Profile Avatar Card */}
        <AnalyticsCard title="Identity Overview" subtitle="User account credentials summary">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 0' }}>
            <div style={{ marginBottom: 16 }}>
              <UserAvatar avatar={profile?.avatar} name={name} size={80} fontSize={28} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{email}</div>
            <div style={{ marginTop: 12 }}>
              <StatusBadge status={isSystemAdmin ? "danger" : "safe"} label={roleLabel} size="md" />
            </div>

            <div style={{ height: 1, background: 'var(--border)', width: '100%', margin: '20px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', textAlign: 'left', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Organization:</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>JobShield AI</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Member Since:</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{memberSince}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Two-Factor Auth:</span>
                <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={14} /> Enabled (Stub)
                </span>
              </div>
            </div>
          </div>
        </AnalyticsCard>

        {/* Account Details Form */}
        <AnalyticsCard title="Profile Information" subtitle="Your registered account settings">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <TextInput label="Full Name" value={name} icon={<User size={16} />} iconColor="#38BDF8" readOnly />
              <TextInput label="Email Address" value={email} icon={<Mail size={16} />} iconColor="#00D8F6" readOnly />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <TextInput label="Role / Designation" value={roleLabel} icon={<Shield size={16} />} iconColor="#00E599" readOnly />
              <TextInput label="Department" value="Cybersecurity Operations" icon={<Shield size={16} />} iconColor="#F59E0B" readOnly />
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Security Credentials</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <MetricCard label="Password Status" value="Secure hash verified" icon={<Key size={18} />} color="#FB923C" />
              <MetricCard label="API Session Key" value="1 Active Token" icon={<Lock size={18} />} color="#6366F1" />
            </div>
          </div>
        </AnalyticsCard>

      </div>
    </div>
  );
}
