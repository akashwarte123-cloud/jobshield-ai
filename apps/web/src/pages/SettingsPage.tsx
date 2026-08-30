import React, { useState, useEffect } from 'react';
import {
  PageHeader,
  AnalyticsCard,
  Btn,
  TextInput,
  TextArea,
  StatusBadge,
  UserAvatar
} from '../components/ui';
import { api } from '../services/api';
import { getInitials } from '../utils/userHelpers';
import {
  User,
  Shield,
  Bell,
  FileText,
  Puzzle,
  Info,
  Lock,
  Trash2,
  Download,
  LogOut,
  Upload,
  RefreshCw,
  ExternalLink,
  Mail,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  FileDown,
  XCircle,
  Bug,
  LifeBuoy,
  Sun,
  Moon,
  Laptop,
  Eye,
  EyeOff
} from 'lucide-react';

interface SettingsPageProps {
  onNavigate?: (view: string) => void;
  theme: 'dark' | 'light' | 'system';
  onThemeChange: (theme: 'dark' | 'light' | 'system') => void;
}

export function SettingsPage({ onNavigate, theme, onThemeChange }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'privacy' | 'notifications' | 'resume' | 'extension' | 'about' | 'appearance'>('account');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // States for Seeker Data
  const [fullName, setFullName] = useState('User');
  const [email, setEmail] = useState('');
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [wipingHistory, setWipingHistory] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [submittingSupport, setSubmittingSupport] = useState(false);
  
  // Toggles
  const [emailOnComplete, setEmailOnComplete] = useState(true);
  const [scamAlerts, setScamAlerts] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);

  // Fetch settings from the backend on load
  useEffect(() => {
    // 1. Get Seeker identity details
    const authStr = localStorage.getItem('js_logged_in_user');
    if (authStr) {
      try {
        const parsed = JSON.parse(authStr);
        if (parsed?.user) {
          setFullName(parsed.user.name);
          setEmail(parsed.user.email);
          setAvatar(parsed.user.avatar || null);
        }
      } catch (e) {}
    }

    // 2. Fetch configurations
    api.get('/settings')
      .then(res => {
        if (res.success && res.data) {
          setEmailOnComplete((res.data as any).email_notifications);
        }
      })
      .catch(err => {
        console.error('Error fetching settings:', err);
      });
  }, []);

  // Extension status simulation
  const [extStatus, setExtStatus] = useState<'connected' | 'disconnected'>('connected');
  const [reconnecting, setReconnecting] = useState(false);

  // Modal dialog states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [showDeleteHistoryModal, setShowDeleteHistoryModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState<'support' | 'bug' | null>(null);

  // Form inputs for modals
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeName(file.name);
      triggerToast(`Resume updated to ${file.name}`, 'success');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate client-side file size to prevent unnecessary large uploads
    if (file.size > 2 * 1024 * 1024) {
      triggerToast('File size exceeds the 2 MB limit.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    api.upload<{ avatar: string }>('/profile/avatar', formData)
      .then(res => {
        if (res.success && res.data?.avatar) {
          const newAvatar = res.data.avatar;
          setAvatar(newAvatar);
          // Sync with local storage
          const authStr = localStorage.getItem('js_logged_in_user');
          if (authStr) {
            try {
              const parsed = JSON.parse(authStr);
              if (parsed?.user) {
                parsed.user.avatar = newAvatar;
                localStorage.setItem('js_logged_in_user', JSON.stringify(parsed));
                window.dispatchEvent(new CustomEvent('js_user_profile_updated'));
              }
            } catch (err) {}
          }
          triggerToast('Profile picture updated successfully!', 'success');
        } else {
          triggerToast(res.error?.message || 'Failed to upload profile picture.', 'error');
        }
      })
      .catch(err => {
        triggerToast(err.message || 'An error occurred during upload.', 'error');
      })
      .finally(() => {
        setUploading(false);
        // Reset file input value
        e.target.value = '';
      });
  };

  const handleRemoveAvatar = () => {
    setUploading(true);
    api.delete<{ avatar: null }>('/profile/avatar')
      .then(res => {
        if (res.success) {
          setAvatar(null);
          // Sync with local storage
          const authStr = localStorage.getItem('js_logged_in_user');
          if (authStr) {
            try {
              const parsed = JSON.parse(authStr);
              if (parsed?.user) {
                parsed.user.avatar = null;
                localStorage.setItem('js_logged_in_user', JSON.stringify(parsed));
                window.dispatchEvent(new CustomEvent('js_user_profile_updated'));
              }
            } catch (err) {}
          }
          triggerToast('Profile picture removed successfully.', 'success');
        } else {
          triggerToast(res.error?.message || 'Failed to remove profile picture.', 'error');
        }
      })
      .catch(err => {
        triggerToast(err.message || 'An error occurred while removing the picture.', 'error');
      })
      .finally(() => {
        setUploading(false);
      });
  };

  const handleReconnectExtension = () => {
    setReconnecting(true);
    setExtStatus('disconnected');
    setTimeout(() => {
      setReconnecting(false);
      setExtStatus('connected');
      triggerToast('Extension reconnected successfully!', 'success');
    }, 1800);
  };

  const handleDownloadHistory = (format: 'pdf' | 'csv') => {
    triggerToast(`Generating ${format.toUpperCase()} scan report...`, 'info');
    api.download(`/analyses/export/${format}`, `jobshield_scan_history.${format}`)
      .then(() => {
        triggerToast(`Download complete: jobshield_scan_history.${format}`, 'success');
      })
      .catch(err => {
        triggerToast(err.message || `Failed to download ${format.toUpperCase()} report.`, 'error');
      });
  };

  const handleDeleteHistory = () => {
    setWipingHistory(true);
    api.delete('/analyses/history')
      .then(res => {
        if (res.success) {
          setShowDeleteHistoryModal(false);
          triggerToast('All analysis scan histories permanently deleted.', 'success');
          window.dispatchEvent(new CustomEvent('js_history_wiped'));
        } else {
          triggerToast(res.error?.message || 'Failed to wipe scan history.', 'error');
        }
      })
      .catch(err => {
        triggerToast(err.message || 'An error occurred while wiping history.', 'error');
      })
      .finally(() => {
        setWipingHistory(false);
      });
  };

  const handleDeleteAccount = () => {
    setDeletingAccount(true);
    api.delete('/auth/account')
      .then(res => {
        if (res.success) {
          setShowDeleteAccountModal(false);
          triggerToast('Account and all associated user data deleted successfully.', 'success');
          setTimeout(() => {
            localStorage.removeItem('js_logged_in_user');
            window.dispatchEvent(new CustomEvent('js_unauthorized'));
          }, 1500);
        } else {
          triggerToast(res.error?.message || 'Failed to delete account.', 'error');
        }
      })
      .catch(err => {
        triggerToast(err.message || 'An error occurred while deleting your account.', 'error');
      })
      .finally(() => {
        setDeletingAccount(false);
      });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) {
      triggerToast('Please fill out all password fields', 'error');
      return;
    }
    if (newPw.length < 8) {
      triggerToast('New password must be at least 8 characters long', 'error');
      return;
    }
    if (newPw !== confirmPw) {
      triggerToast('New passwords do not match', 'error');
      return;
    }

    setUpdatingPassword(true);
    api.put('/auth/password', {
      current_password: currentPw,
      new_password: newPw
    })
    .then(res => {
      if (res.success) {
        setShowPasswordModal(false);
        setCurrentPw('');
        setNewPw('');
        setConfirmPw('');
        setShowNewPassword(false);
        setShowConfirmNewPassword(false);
        triggerToast('Account password updated successfully!', 'success');
      } else {
        triggerToast(res.error?.message || 'Failed to update password.', 'error');
      }
    })
    .catch(err => {
      triggerToast(err.message || 'An error occurred while updating the password.', 'error');
    })
    .finally(() => {
      setUpdatingPassword(false);
    });
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSubject = supportSubject.trim();
    const trimmedMessage = supportMessage.trim();
    if (!trimmedSubject || !trimmedMessage) {
      triggerToast('Please complete all form fields', 'error');
      return;
    }
    setSubmittingSupport(true);
    api.post('/support/tickets', {
      subject: trimmedSubject,
      message: trimmedMessage
    })
    .then(res => {
      if (res.success) {
        const label = showSupportModal === 'bug' ? 'Bug report' : 'Support ticket';
        triggerToast(`${label} submitted successfully!`, 'success');
        setShowSupportModal(null);
        setSupportSubject('');
        setSupportMessage('');
      } else {
        triggerToast(res.error?.message || 'Failed to submit support ticket.', 'error');
      }
    })
    .catch(err => {
      triggerToast(err.message || 'An error occurred during ticket submission.', 'error');
    })
    .finally(() => {
      setSubmittingSupport(false);
    });
  };

  const handleSaveProfile = () => {
    if (!fullName.trim() || !email.trim()) {
      triggerToast('Name and email cannot be empty.', 'error');
      return;
    }
    const authStr = localStorage.getItem('js_logged_in_user');
    if (authStr) {
      try {
        const parsed = JSON.parse(authStr);
        if (parsed?.user) {
          parsed.user.name = fullName.trim();
          parsed.user.email = email.trim();
          localStorage.setItem('js_logged_in_user', JSON.stringify(parsed));
          window.dispatchEvent(new CustomEvent('js_user_profile_updated'));
        }
      } catch (e) {}
    }
    triggerToast('Profile details updated successfully!', 'success');
  };

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: <User size={16} /> },
    { id: 'appearance' as const, label: 'Appearance', icon: <Sun size={16} /> },
    { id: 'privacy' as const, label: 'Privacy & Security', icon: <Shield size={16} /> },
    { id: 'notifications' as const, label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'resume' as const, label: 'Resume', icon: <FileText size={16} /> },
    { id: 'extension' as const, label: 'Browser Extension', icon: <Puzzle size={16} /> },
    { id: 'about' as const, label: 'About', icon: <Info size={16} /> },
  ];

  return (
    <div className="animate-slide" style={{ paddingBottom: 40, position: 'relative' }}>
      
      {/* Dynamic Toast System */}
      {toast && (
        <div className="animate-slide" style={{
          position: 'fixed', bottom: 24, right: 32, zIndex: 110,
          background: toast.type === 'success' ? 'var(--safe-dim)' : toast.type === 'error' ? 'var(--danger-dim)' : 'var(--primary-dim)',
          border: `1px solid ${toast.type === 'success' ? 'var(--safe-border)' : toast.type === 'error' ? 'var(--danger-border)' : 'var(--primary-border)'}`,
          borderRadius: 12, padding: '14px 20px',
          color: toast.type === 'success' ? 'var(--safe-text, var(--safe))' : toast.type === 'error' ? 'var(--danger-text, var(--danger))' : 'var(--primary)',
          fontSize: 13.5, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: 'var(--shadow-lg)'
        }}>
          {toast.type === 'success' && <CheckCircle2 size={16} color="var(--safe-text, var(--safe))" />}
          {toast.type === 'error' && <AlertTriangle size={16} color="var(--danger-text, var(--danger))" />}
          {toast.type === 'info' && <RefreshCw className="animate-spin" size={16} color="var(--primary)" />}
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        category="Preferences"
        title="Security & System Settings"
        subtitle="Manage your profile information, default resume files, security policy constraints, and chrome extension link parameters."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '32px', marginTop: 12 }}>
        
        {/* Settings Navigation Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tabs.map(t => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 10,
                  border: active ? '1px solid var(--primary-border)' : '1px solid transparent',
                  background: active ? 'var(--primary-dim)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: 13.5, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'var(--font)',
                  textAlign: 'left', transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span style={{
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                  transition: 'color 0.18s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{t.icon}</span>
                <span style={{ flex: 1 }}>{t.label}</span>
                <ChevronRight size={14} style={{ opacity: active ? 1 : 0, transition: 'opacity 0.18s ease', color: 'var(--primary)' }} />
              </button>
            );
          })}
        </div>

        {/* Settings Pane Container */}
        <div style={{ minWidth: 0 }}>
          
          {/* TAB: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <AnalyticsCard title="Theme & Visualization Mode" subtitle="Select your preferred application container appearance style">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                    
                    {/* Dark Mode option */}
                    <div
                      onClick={() => { 
                        onThemeChange('dark'); 
                        api.put('/settings', { theme: 'DARK' })
                          .then(res => {
                            if (res.success) triggerToast('Dark theme persisted in profile.', 'success');
                          })
                          .catch(err => console.error('Error saving theme:', err));
                      }}
                      style={{
                        padding: 20, borderRadius: 14, cursor: 'pointer',
                        background: 'linear-gradient(135deg, #0A1220 0%, #060B13 100%)',
                        border: `2px solid ${theme === 'dark' ? '#00E599' : 'rgba(255, 255, 255, 0.12)'}`,
                        boxShadow: theme === 'dark' ? '0 0 16px rgba(0, 229, 153, 0.15)' : 'none',
                        transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: 14
                      }}
                      onMouseEnter={e => {
                        if (theme !== 'dark') e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                      }}
                      onMouseLeave={e => {
                        if (theme !== 'dark') e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Moon size={18} color="#00E599" />
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>Obsidian Navy (Dark)</span>
                        </div>
                        {theme === 'dark' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00E599', boxShadow: '0 0 8px #00E599' }} />}
                      </div>
                      
                      {/* Mini Mock Dashboard */}
                      <div style={{
                        background: '#060B13', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 6,
                        border: '1px solid rgba(255, 255, 255, 0.08)', opacity: 0.95
                      }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <div style={{ width: 24, height: 4, borderRadius: 2, background: 'rgba(255, 255, 255, 0.25)' }} />
                          <div style={{ width: 14, height: 4, borderRadius: 2, background: 'rgba(255, 255, 255, 0.08)' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <div style={{ flex: 1, height: 26, borderRadius: 6, background: '#0B131F', border: '1px solid rgba(0,229,153,0.25)', display: 'flex', alignItems: 'center', padding: '0 6px' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00E599' }} />
                          </div>
                          <div style={{ flex: 1, height: 26, borderRadius: 6, background: '#0B131F', border: '1px solid rgba(255,255,255,0.08)' }} />
                        </div>
                      </div>
                    </div>

                    {/* Light Mode option */}
                    <div
                      onClick={() => { 
                        onThemeChange('light'); 
                        api.put('/settings', { theme: 'LIGHT' })
                          .then(res => {
                            if (res.success) triggerToast('Light theme persisted in profile.', 'success');
                          })
                          .catch(err => console.error('Error saving theme:', err));
                      }}
                      style={{
                        padding: 20, borderRadius: 14, cursor: 'pointer',
                        background: '#FFFFFF',
                        border: `2px solid ${theme === 'light' ? 'var(--primary)' : '#E2E8F0'}`,
                        boxShadow: theme === 'light' ? '0 4px 14px rgba(15, 118, 110, 0.12)' : 'none',
                        transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: 14
                      }}
                      onMouseEnter={e => {
                        if (theme !== 'light') e.currentTarget.style.borderColor = 'var(--border-mid)';
                      }}
                      onMouseLeave={e => {
                        if (theme !== 'light') e.currentTarget.style.borderColor = '#E2E8F0';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Sun size={18} color="var(--primary)" />
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Platinum Slate (Light)</span>
                        </div>
                        {theme === 'light' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px rgba(15, 118, 110, 0.3)' }} />}
                      </div>
                      
                      {/* Mini Mock Dashboard */}
                      <div style={{
                        background: '#F8FAFC', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 6,
                        border: '1px solid #E2E8F0', opacity: 0.95
                      }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <div style={{ width: 24, height: 4, borderRadius: 2, background: '#CBD5E1' }} />
                          <div style={{ width: 14, height: 4, borderRadius: 2, background: '#E2E8F0' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <div style={{ flex: 1, height: 26, borderRadius: 6, background: '#FFFFFF', border: '1px solid #CCFBF1', display: 'flex', alignItems: 'center', padding: '0 6px' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0F766E' }} />
                          </div>
                          <div style={{ flex: 1, height: 26, borderRadius: 6, background: '#FFFFFF', border: '1px solid #E2E8F0' }} />
                        </div>
                      </div>
                    </div>

                    {/* System Default option */}
                    <div
                      onClick={() => { 
                        onThemeChange('system'); 
                        api.put('/settings', { theme: 'SYSTEM' })
                          .then(res => {
                            if (res.success) triggerToast('System theme persisted in profile.', 'success');
                          })
                          .catch(err => console.error('Error saving theme:', err));
                      }}
                      style={{
                        padding: 20, borderRadius: 14, cursor: 'pointer',
                        background: 'var(--bg-surface)',
                        border: `2px solid ${theme === 'system' ? 'var(--primary)' : 'var(--border)'}`,
                        boxShadow: theme === 'system' ? '0 4px 14px var(--shadow-sm)' : 'none',
                        transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: 14
                      }}
                      onMouseEnter={e => {
                        if (theme !== 'system') e.currentTarget.style.borderColor = 'var(--border-hover)';
                      }}
                      onMouseLeave={e => {
                        if (theme !== 'system') e.currentTarget.style.borderColor = 'var(--border)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Laptop size={18} color="var(--text-secondary)" />
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>System Default</span>
                        </div>
                        {theme === 'system' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }} />}
                      </div>
                      
                      {/* Mini Mock Dashboard */}
                      <div style={{
                        background: 'var(--bg-base)', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 6,
                        border: '1px solid var(--border)', opacity: 0.95
                      }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <div style={{ width: 24, height: 4, borderRadius: 2, background: 'var(--border-mid)' }} />
                          <div style={{ width: 14, height: 4, borderRadius: 2, background: 'var(--border)' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <div style={{ flex: 1, height: 26, borderRadius: 6, background: 'var(--card-bg)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', padding: '0 6px' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
                          </div>
                          <div style={{ flex: 1, height: 26, borderRadius: 6, background: 'var(--card-bg)', border: '1px solid var(--border)' }} />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </AnalyticsCard>
            </div>
          )}

          {/* TAB 1: ACCOUNT */}
          {activeTab === 'account' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <AnalyticsCard title="Profile Information" subtitle="Update your system display name and public contact email">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <input
                      type="file"
                      id="avatar-upload-input"
                      accept="image/png, image/jpeg, image/webp"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    <UserAvatar avatar={avatar} name={fullName} size={68} fontSize={24} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Profile Avatar</div>
                      <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>SVG, PNG, JPG or WebP. Max size 2MB.</div>
                      {avatar ? (
                        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                          <Btn variant="primary" size="sm" onClick={() => document.getElementById('avatar-upload-input')?.click()} disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Change Picture'}
                          </Btn>
                          <Btn variant="secondary" size="sm" onClick={handleRemoveAvatar} disabled={uploading}>
                            Remove Picture
                          </Btn>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                          <Btn variant="secondary" size="sm" onClick={() => document.getElementById('avatar-upload-input')?.click()} disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Upload Picture'}
                          </Btn>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ height: 1, background: 'var(--border)' }} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <TextInput
                      label="Full Name"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                    />
                    <TextInput
                      label="Email Address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                    <Btn variant="primary" onClick={handleSaveProfile}>Save Changes</Btn>
                  </div>
                </div>
              </AnalyticsCard>

              <AnalyticsCard title="Account Security" subtitle="Credentials and access settings">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Change Account Password</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>Update the credentials used to log into JobShield AI.</div>
                  </div>
                  <Btn variant="secondary" onClick={() => setShowPasswordModal(true)}>Update Password</Btn>
                </div>
              </AnalyticsCard>
            </div>
          )}

          {/* TAB 2: PRIVACY & SECURITY */}
          {activeTab === 'privacy' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <AnalyticsCard title="Session Control" subtitle="Active sessions and authorization status">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Logout from All Devices</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>Terminates all other browser and extension sessions linked to this account.</div>
                  </div>
                  <Btn variant="danger" onClick={() => setShowLogoutAllModal(true)}>Logout All Devices</Btn>
                </div>
              </AnalyticsCard>

              <AnalyticsCard title="Scan Database & Export" subtitle="Manage your analyzed job database telemetry">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Download Scan History</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>Backup your JobShield AI forensic scan history for record keeping.</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => handleDownloadHistory('pdf')}
                        className="btn-secondary"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                          padding: '8px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 700,
                          cursor: 'pointer', background: 'var(--primary-dim)', border: '1px solid var(--primary-border)',
                          color: 'var(--primary)'
                        }}
                      >
                        <FileDown size={14} /> PDF Format
                      </button>
                      <button
                        onClick={() => handleDownloadHistory('csv')}
                        className="btn-secondary"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                          padding: '8px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 700,
                          cursor: 'pointer', background: 'var(--primary-dim)', border: '1px solid var(--primary-border)',
                          color: 'var(--primary)'
                        }}
                      >
                        <FileText size={14} /> CSV Format
                      </button>
                    </div>
                  </div>

                  <div style={{ height: 1, background: 'var(--border)' }} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Delete Scan History</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>Permanently wipe all analyzed job details, URLs, and risk verdicts. This action is irreversible.</div>
                    </div>
                    <Btn variant="danger" onClick={() => setShowDeleteHistoryModal(true)}>Wipe History</Btn>
                  </div>
                </div>
              </AnalyticsCard>

              <AnalyticsCard title="Danger Zone" subtitle="Critical actions relating to account lifecycle">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#EF4444' }}>Permanently Delete Account</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>Wipe account profile, resumes, scan database, and link states. All access tokens revoked immediately.</div>
                  </div>
                  <button
                    onClick={() => setShowDeleteAccountModal(true)}
                    style={{
                      padding: '10px 22px', fontSize: 13, borderRadius: 10,
                      background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444',
                      border: '1px solid rgba(239,68,68,0.4)', fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.2s ease', fontFamily: 'var(--font)'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#EF4444'; }}
                  >
                    Delete Account
                  </button>
                </div>
              </AnalyticsCard>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="animate-fade-in">
              <AnalyticsCard title="Notification Preferences" subtitle="Configure automated alert parameters and email summaries">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Email Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ maxWidth: '80%' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Email on Scan Completion</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>Receive a forensic digest email including full risk breakdown immediately after a job scan finishes.</div>
                    </div>
                    <label style={{ display: 'inline-flex', cursor: 'pointer', position: 'relative', width: 44, height: 24 }}>
                      <input
                        type="checkbox"
                        checked={emailOnComplete}
                        onChange={() => {
                          const nextVal = !emailOnComplete;
                          setEmailOnComplete(nextVal);
                          api.put('/settings', { email_notifications: nextVal })
                            .then(res => {
                              if (res.success) {
                                triggerToast('Notification preferences persisted.', 'success');
                              }
                            })
                            .catch(err => {
                              setEmailOnComplete(!nextVal);
                              triggerToast('Failed to save preferences: ' + err.message, 'error');
                            });
                        }}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute', inset: 0, borderRadius: 20,
                        background: emailOnComplete ? 'var(--primary)' : 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        <span style={{
                          position: 'absolute', left: emailOnComplete ? 22 : 3, bottom: 3,
                          width: 16, height: 16, borderRadius: '50%',
                          background: emailOnComplete ? '#FFFFFF' : 'var(--text-muted)',
                          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                        }} />
                      </span>
                    </label>
                  </div>

                  <div style={{ height: 1, background: 'var(--border)' }} />

                  {/* Scam Alert Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ maxWidth: '80%' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Scam Alert Push Notifications</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>Allow JobShield AI to trigger high-priority alerts in your browser when a severe scam or phishing page is identified.</div>
                    </div>
                    <label style={{ display: 'inline-flex', cursor: 'pointer', position: 'relative', width: 44, height: 24 }}>
                      <input
                        type="checkbox"
                        checked={scamAlerts}
                        onChange={() => setScamAlerts(!scamAlerts)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute', inset: 0, borderRadius: 20,
                        background: scamAlerts ? 'var(--primary)' : 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        <span style={{
                          position: 'absolute', left: scamAlerts ? 22 : 3, bottom: 3,
                          width: 16, height: 16, borderRadius: '50%',
                          background: scamAlerts ? '#FFFFFF' : 'var(--text-muted)',
                          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                        }} />
                      </span>
                    </label>
                  </div>

                  <div style={{ height: 1, background: 'var(--border)' }} />

                  {/* Product Updates Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ maxWidth: '80%' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Product Updates & Security Bulletins</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>Receive monthly bulletins listing newly detected scam networks, threat intelligence data, and extension enhancements.</div>
                    </div>
                    <label style={{ display: 'inline-flex', cursor: 'pointer', position: 'relative', width: 44, height: 24 }}>
                      <input
                        type="checkbox"
                        checked={productUpdates}
                        onChange={() => setProductUpdates(!productUpdates)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute', inset: 0, borderRadius: 20,
                        background: productUpdates ? 'var(--primary)' : 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        <span style={{
                          position: 'absolute', left: productUpdates ? 22 : 3, bottom: 3,
                          width: 16, height: 16, borderRadius: '50%',
                          background: productUpdates ? '#FFFFFF' : 'var(--text-muted)',
                          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                        }} />
                      </span>
                    </label>
                  </div>

                </div>
              </AnalyticsCard>
            </div>
          )}

          {/* TAB 4: RESUME */}
          {activeTab === 'resume' && (
            <div className="animate-fade-in">
              <AnalyticsCard title="Default Job Seeker Resume" subtitle="Upload a default CV to automatically check matching constraints during job scans">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div 
                    onClick={() => document.getElementById('resume-file-input')?.click()}
                    style={{
                      padding: '28px 24px', borderRadius: 12,
                      border: '2px dashed var(--border-mid)',
                      background: 'var(--bg-surface)', textAlign: 'center',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease', cursor: 'pointer'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.background = 'var(--primary-dim)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-mid)';
                      e.currentTarget.style.background = 'var(--bg-surface)';
                    }}
                  >
                    <div style={{
                      width: 50, height: 50, borderRadius: '50%',
                      background: 'var(--primary-dim)', border: '1px solid var(--primary-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 14, color: 'var(--primary)'
                    }}>
                      <Upload size={24} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                      Drag and drop your primary CV here
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 18 }}>
                      Supports PDF, DOCX, or Plain Text files. Max 5MB.
                    </div>
                    <input
                      type="file"
                      id="resume-file-input"
                      onChange={handleResumeUpload}
                      style={{ display: 'none' }}
                      accept=".pdf,.docx,.txt"
                    />
                    <Btn variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); document.getElementById('resume-file-input')?.click(); }}>
                      Select Local File
                    </Btn>
                  </div>

                  {resumeName ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 18px', borderRadius: 10,
                      background: 'var(--safe-dim)',
                      border: '1px solid var(--safe-border)',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <FileText size={20} color="var(--safe-text, var(--safe))" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {resumeName}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--safe-text, var(--safe))', fontWeight: 600, marginTop: 2 }}>
                            Active Default CV (Used for automated matching checks)
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Btn variant="ghost" size="sm" onClick={() => document.getElementById('resume-file-input')?.click()} style={{ color: 'var(--safe-text, var(--safe))', fontWeight: 700 }}>
                          Replace
                        </Btn>
                        <button
                          onClick={() => { setResumeName(null); triggerToast('Default resume deleted.', 'success'); }}
                          style={{
                            padding: '6px 10px', borderRadius: 6, background: 'transparent',
                            border: '1px solid var(--border)', color: 'var(--danger-text, var(--danger))', cursor: 'pointer', display: 'flex', alignItems: 'center'
                          }}
                          title="Remove Resume"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '12px 18px', borderRadius: 10,
                      background: 'var(--warning-dim)',
                      border: '1px solid var(--warning-border)',
                      color: 'var(--warning-text, var(--warning))',
                      fontSize: 12.5, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 8
                    }}>
                      <AlertTriangle size={15} /> No default resume uploaded. Resume-matching filters will be skipped.
                    </div>
                  )}
                </div>
              </AnalyticsCard>
            </div>
          )}

          {/* TAB 5: BROWSER EXTENSION */}
          {activeTab === 'extension' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <AnalyticsCard title="Extension Link Parameters" subtitle="Verify communication sync with JobShield AI Browser Guard">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Extension Status</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>Verification status of the linked Chrome browser daemon.</div>
                    </div>
                    {reconnecting ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RefreshCw className="animate-spin" size={15} color="var(--primary)" />
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>RECONNECTING...</span>
                      </div>
                    ) : extStatus === 'connected' ? (
                      <StatusBadge status="safe" label="CONNECTED & ONLINE" size="md" />
                    ) : (
                      <StatusBadge status="danger" label="NOT LINKED" size="md" />
                    )}
                  </div>

                  <div style={{ height: 1, background: 'var(--border)' }} />

                  <div style={{ display: 'flex', gap: 12 }}>
                    <Btn variant="primary" onClick={handleReconnectExtension} disabled={reconnecting} icon={<RefreshCw size={14} className={reconnecting ? 'animate-spin' : ''} />}>
                      {reconnecting ? 'Syncing...' : 'Reconnect Extension'}
                    </Btn>
                    <Btn variant="secondary" onClick={() => onNavigate?.('EXTENSION')}>
                      Open Extension Guide
                    </Btn>
                  </div>
                </div>
              </AnalyticsCard>
            </div>
          )}

          {/* TAB 6: ABOUT */}
          {activeTab === 'about' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <AnalyticsCard title="App Metadata" subtitle="System telemetry and environment build detail">
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 14,
                  background: 'var(--bg-surface)', padding: '16px 20px', borderRadius: 10,
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>App Version:</span>
                    <span style={{ color: 'var(--text)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>v1.4.2-stable (Build 2026.08.06)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Engine Core:</span>
                    <span style={{ color: 'var(--text)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>JobShield-Forensics-Engine v4.11</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Model Database:</span>
                    <span style={{ color: 'var(--safe-text, var(--safe))', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Updated 4 hours ago (182,501 signatures)</span>
                  </div>
                </div>
              </AnalyticsCard>

              <AnalyticsCard title="Resources & Policies" subtitle="Legal information and documentation guides">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); window.open('/privacy', '_blank'); }}
                      style={{
                        padding: '12px 18px', borderRadius: 10, background: 'var(--bg-surface)',
                        border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13.5,
                        fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
                        transition: 'all 0.18s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.background = 'var(--primary-dim)';
                        e.currentTarget.style.color = 'var(--primary)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.background = 'var(--bg-surface)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <Shield size={16} color="var(--primary)" />
                      <span>Privacy Policy</span>
                      <ExternalLink size={13} color="var(--text-secondary)" style={{ marginLeft: 'auto', opacity: 0.8 }} />
                    </a>

                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); window.open('/terms', '_blank'); }}
                      style={{
                        padding: '12px 18px', borderRadius: 10, background: 'var(--bg-surface)',
                        border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13.5,
                        fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
                        transition: 'all 0.18s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.background = 'var(--primary-dim)';
                        e.currentTarget.style.color = 'var(--primary)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.background = 'var(--bg-surface)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <FileText size={16} color="var(--primary)" />
                      <span>Terms & Conditions</span>
                      <ExternalLink size={13} color="var(--text-secondary)" style={{ marginLeft: 'auto', opacity: 0.8 }} />
                    </a>
                  </div>

                  <div style={{ height: 1, background: 'var(--border)' }} />

                  <div style={{ display: 'flex', gap: 12 }}>
                    <Btn variant="secondary" onClick={() => setShowSupportModal('support')} icon={<LifeBuoy size={14} />}>
                      Contact Support
                    </Btn>
                    <Btn variant="secondary" onClick={() => setShowSupportModal('bug')} icon={<Bug size={14} />}>
                      Report a Bug
                    </Btn>
                  </div>
                </div>
              </AnalyticsCard>
            </div>
          )}

        </div>
      </div>

      {/* ─── MODAL: UPDATE PASSWORD ─── */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--bg-overlay)',
          backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 24
        }}>
          <div className="animate-scale" style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '18px', padding: '32px', maxWidth: '420px', width: '100%',
            boxShadow: 'var(--shadow-xl)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid var(--primary-border)' }}>
                <Lock size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Update Password</h3>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>Secure credentials config</div>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <TextInput type="password" label="Current Password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required />

              {/* New Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', paddingLeft: 2, WebkitFontSmoothing: 'antialiased', letterSpacing: '0.04em', lineHeight: 1.4 }}>
                  New Password
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-input)',
                  padding: '12px 18px',
                  transition: 'border-color var(--transition-normal), box-shadow var(--transition-normal)',
                  position: 'relative'
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--primary-dim)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    required
                    style={{
                      background: 'transparent', border: 'none', outline: 'none',
                      color: 'var(--text)', fontSize: 13.5, fontFamily: 'var(--font)',
                      width: '100%', fontWeight: 400, paddingLeft: 4,
                      paddingRight: 30,
                      WebkitFontSmoothing: 'antialiased',
                      letterSpacing: '-0.01em', lineHeight: 1.5,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                    style={{
                      position: 'absolute',
                      right: 18,
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      outline: 'none'
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', paddingLeft: 2, WebkitFontSmoothing: 'antialiased', letterSpacing: '0.04em', lineHeight: 1.4 }}>
                  Confirm New Password
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-input)',
                  padding: '12px 18px',
                  transition: 'border-color var(--transition-normal), box-shadow var(--transition-normal)',
                  position: 'relative'
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px var(--primary-dim)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    required
                    style={{
                      background: 'transparent', border: 'none', outline: 'none',
                      color: 'var(--text)', fontSize: 13.5, fontFamily: 'var(--font)',
                      width: '100%', fontWeight: 400, paddingLeft: 4,
                      paddingRight: 30,
                      WebkitFontSmoothing: 'antialiased',
                      letterSpacing: '-0.01em', lineHeight: 1.5,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    aria-label={showConfirmNewPassword ? "Hide password confirmation" : "Show password confirmation"}
                    style={{
                      position: 'absolute',
                      right: 18,
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      outline: 'none'
                    }}
                  >
                    {showConfirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPw('');
                    setNewPw('');
                    setConfirmPw('');
                    setShowNewPassword(false);
                    setShowConfirmNewPassword(false);
                  }}
                  style={{
                    flex: 1, padding: '10px 18px', borderRadius: 9, border: '1px solid var(--border)',
                    background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s ease', fontFamily: 'var(--font)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  Cancel
                </button>
                 <button
                   type="submit"
                   disabled={updatingPassword}
                   style={{
                     flex: 1, padding: '10px 18px', borderRadius: 9, border: 'none',
                     background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)',
                     fontSize: 13.5, fontWeight: 700, cursor: updatingPassword ? 'not-allowed' : 'pointer',
                     transition: 'all 0.18s ease', fontFamily: 'var(--font)',
                     opacity: updatingPassword ? 0.7 : 1
                   }}
                   onMouseEnter={e => { if (!updatingPassword) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,229,153,0.3)'; } }}
                   onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                 >
                   {updatingPassword ? 'Saving...' : 'Confirm Change'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: LOGOUT ALL DEVICES ─── */}
      {showLogoutAllModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--bg-overlay)',
          backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 24
        }}>
          <div className="animate-scale" style={{
            background: 'var(--card-bg)',
            border: '1px solid rgba(239, 68, 68, 0.20)',
            borderRadius: '18px', padding: '32px', maxWidth: 400, width: '100%',
            boxShadow: 'var(--shadow-xl)',
            textAlign: 'center'
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '14px', background: 'rgba(239, 68, 68, 0.12)',
              color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <LogOut size={22} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Logout all devices?</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              This will immediately sign you out from all other web sessions and browser extensions. You will need to re-authenticate on those devices.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowLogoutAllModal(false)}
                style={{
                  flex: 1, padding: '10px 18px', borderRadius: 9, border: '1px solid var(--border)',
                  background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease', fontFamily: 'var(--font)'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLogoutAllModal(false); triggerToast('Logged out from all other devices successfully.', 'success'); }}
                style={{
                  flex: 1, padding: '10px 18px', borderRadius: 9, border: '1px solid rgba(239,68,68,0.5)',
                  background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.18s ease', fontFamily: 'var(--font)'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(239,68,68,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#FCA5A5'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: DELETE HISTORY ─── */}
      {showDeleteHistoryModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--bg-overlay)',
          backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 24
        }}>
          <div className="animate-scale" style={{
            background: 'var(--card-bg)',
            border: '1px solid rgba(239, 68, 68, 0.20)',
            borderRadius: '18px', padding: '32px', maxWidth: 400, width: '100%',
            boxShadow: 'var(--shadow-xl)',
            textAlign: 'center'
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '14px', background: 'rgba(239, 68, 68, 0.12)',
              color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <Trash2 size={22} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Wipe scan history?</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              This will permanently delete all logs, results, and forensic metadata associated with previous analysis reports. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowDeleteHistoryModal(false)}
                style={{
                  flex: 1, padding: '10px 18px', borderRadius: 9, border: '1px solid var(--border)',
                  background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease', fontFamily: 'var(--font)'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteHistory}
                disabled={wipingHistory}
                style={{
                  flex: 1, padding: '10px 18px', borderRadius: 9, border: '1px solid rgba(239,68,68,0.5)',
                  background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', fontSize: 13.5, fontWeight: 700,
                  cursor: wipingHistory ? 'not-allowed' : 'pointer',
                  transition: 'all 0.18s ease', fontFamily: 'var(--font)',
                  opacity: wipingHistory ? 0.7 : 1
                }}
                onMouseEnter={e => { if (!wipingHistory) { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(239,68,68,0.3)'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#FCA5A5'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {wipingHistory ? 'Wiping...' : 'Wipe History'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: DELETE ACCOUNT ─── */}
      {showDeleteAccountModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--bg-overlay)',
          backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 24
        }}>
          <div className="animate-scale" style={{
            background: 'var(--card-bg)',
            border: '1px solid rgba(239, 68, 68, 0.30)',
            borderRadius: '18px', padding: '36px', maxWidth: 420, width: '100%',
            boxShadow: 'var(--shadow-xl)',
            textAlign: 'center'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '16px', background: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <AlertTriangle size={26} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Wipe and delete account?</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              You are about to delete your JobShield AI seeker account. This deletes your profile, analyzed database records, active extension linkage state, and CV profiles immediately. This action cannot be reversed.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                style={{
                  flex: 1, padding: '11px 18px', borderRadius: 9, border: '1px solid var(--border)',
                  background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease', fontFamily: 'var(--font)'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                style={{
                  flex: 1, padding: '11px 18px', borderRadius: 9, border: 'none',
                  background: '#EF4444', color: '#FFFFFF', fontSize: 13.5, fontWeight: 700,
                  cursor: deletingAccount ? 'not-allowed' : 'pointer',
                  transition: 'all 0.18s ease', fontFamily: 'var(--font)',
                  opacity: deletingAccount ? 0.7 : 1
                }}
                onMouseEnter={e => { if (!deletingAccount) { e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,68,68,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {deletingAccount ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CONTACT SUPPORT & BUG REPORT ─── */}
      {showSupportModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--bg-overlay)',
          backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 24
        }}>
          <div className="animate-scale" style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '18px', padding: '32px', maxWidth: '460px', width: '100%',
            boxShadow: 'var(--shadow-xl)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid var(--primary-border)' }}>
                {showSupportModal === 'bug' ? <Bug size={18} /> : <LifeBuoy size={18} />}
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  {showSupportModal === 'bug' ? 'Report a Bug' : 'Contact Customer Support'}
                </h3>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {showSupportModal === 'bug' ? 'Help us improve JobShield forencis engine' : 'Get assistance with scan engine configurations'}
                </div>
              </div>
            </div>

            <form onSubmit={handleSupportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <TextInput
                label={showSupportModal === 'bug' ? 'Issue Subject' : 'Topic Subject'}
                placeholder="e.g. Scan overlay mismatch on LinkedIn postings"
                value={supportSubject}
                onChange={e => setSupportSubject(e.target.value)}
                required
              />

              <TextArea
                label={showSupportModal === 'bug' ? 'Steps to Reproduce & Description' : 'Message details'}
                placeholder={showSupportModal === 'bug' ? 'Please detail what happened, including the job listing link if possible.' : 'Detail your inquiry, question or custom rule configuration requirement.'}
                value={supportMessage}
                onChange={e => setSupportMessage(e.target.value)}
                required
              />

              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => { setShowSupportModal(null); setSupportSubject(''); setSupportMessage(''); }}
                  style={{
                    flex: 1, padding: '10px 18px', borderRadius: 9, border: '1px solid var(--border)',
                    background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s ease', fontFamily: 'var(--font)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  Cancel
                </button>
                 <button
                   type="submit"
                   disabled={submittingSupport}
                   style={{
                     flex: 1, padding: '10px 18px', borderRadius: 9, border: 'none',
                     background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)',
                     fontSize: 13.5, fontWeight: 700, cursor: submittingSupport ? 'not-allowed' : 'pointer',
                     transition: 'all 0.18s ease', fontFamily: 'var(--font)',
                     opacity: submittingSupport ? 0.7 : 1
                   }}
                   onMouseEnter={e => { if (!submittingSupport) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px var(--primary-dim)'; } }}
                   onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                 >
                   {submittingSupport ? 'Submitting...' : 'Submit'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
