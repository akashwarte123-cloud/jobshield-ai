import React, { useState, useEffect } from 'react';
import {
  Home, Search, Building2, Cpu, FileText,
  Puzzle, Settings, Server, Rocket, TestTube2, BookOpen,
  Bell, PanelLeftClose, PanelLeft, Shield, User, ChevronRight, LogOut, CheckCircle2, AlertTriangle, Key, HelpCircle, LifeBuoy,
  Users, Terminal, BarChart2, Sun, Moon, Laptop, FileCheck, Bookmark, Briefcase, Activity
} from 'lucide-react';
import { JobAnalyzerPage } from './pages/JobAnalyzerPage';
import { CompanyVerificationPage } from './pages/CompanyVerificationPage';
import { MLPipelinePage } from './pages/MLPipelinePage';
import { HybridAIPage } from './pages/HybridAIPage';
import { ReportsPage } from './pages/ReportsPage';
import { ExtensionPlaygroundPage } from './pages/ExtensionPlaygroundPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { SettingsPage } from './pages/SettingsPage';
import { DockerContainerPage } from './pages/DockerContainerPage';
import { PipelineCICDPage } from './pages/PipelineCICDPage';
import { TestingSuitePage } from './pages/TestingSuitePage';
import { DocumentationPage } from './pages/DocumentationPage';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { HelpPage } from './pages/HelpPage';
import { UsersPage } from './pages/UsersPage';
import { LogsPage } from './pages/LogsPage';
import { HomePage } from './pages/HomePage';
import { OfferVerifyPage } from './pages/OfferVerifyPage';
import { SavedJobsPage } from './pages/SavedJobsPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { AdminAnalysesPage } from './pages/AdminAnalysesPage';
import { AdminJobsPage } from './pages/AdminJobsPage';
import { AdminSystemPage } from './pages/AdminSystemPage';
import { AdminSupportTicketsPage } from './pages/AdminSupportTicketsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { JobShieldLogo, Btn, UserAvatar } from './components/ui';
import { getInitials } from './utils/userHelpers';
import './styles/design-system.css';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

// Ambient Background
function BackgroundCanvas() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      background: 'var(--bg-base)',
    }}>
      {/* Right/center warm cream glow matching reference */}
      <div style={{
        position: 'absolute', top: '-5%', right: '2%',
        width: '70vw', height: '70vh',
        background: 'var(--canvas-glow-1)',
        filter: 'blur(60px)',
      }} />
      {/* Left side light theme green tint */}
      <div style={{
        position: 'absolute', top: '8%', left: '2%',
        width: '55vw', height: '65vh',
        background: 'var(--canvas-glow-2)',
        filter: 'blur(70px)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 45%, transparent 68%, var(--bg-base) 100%)',
      }} />
    </div>
  );
}

// Breadcrumbs Map for paths
const breadcrumbsMap: Record<string, { parent: string; page: string }> = {
  '/app/home': { parent: 'Overview', page: 'Home' },
  '/app/analyze': { parent: 'Security Tools', page: 'Analyze Job' },
  '/app/verify-company': { parent: 'Security Tools', page: 'Verify Company' },
  '/app/verify-offer': { parent: 'Security Tools', page: 'Offer Verification' },
  '/app/reports': { parent: 'Logs & History', page: 'Scan History' },
  '/app/saved-jobs': { parent: 'Logs & History', page: 'Saved Jobs' },
  '/app/extension': { parent: 'Platform Integration', page: 'Chrome Extension' },
  '/app/settings': { parent: 'Account Control', page: 'Settings' },
  '/app/profile': { parent: 'Account Control', page: 'User Profile' },
  '/app/help': { parent: 'Support Center', page: 'Help & FAQs' },
  '/admin/dashboard': { parent: 'Admin Overview', page: 'Dashboard' },
  '/admin/users': { parent: 'Management', page: 'Users' },
  '/admin/analyses': { parent: 'Management', page: 'Analyses' },
  '/admin/jobs': { parent: 'Telemetry', page: 'Job Stats' },
  '/admin/system': { parent: 'Telemetry', page: 'System Health' },
};

export default function App() {
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const shortcutText = isMac ? '⌘K' : 'Ctrl K';

  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER'); 
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string; avatar?: string | null } | null>(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('register');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(() => {
    return (localStorage.getItem('jobshield_theme') as 'dark' | 'light' | 'system') || 'dark';
  });

  // Simple clean router function
  const navigate = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  };

  // Sync state routing with path pop events (Back/Forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Restore session and listen for unauthorized events
  useEffect(() => {
    const checkAuth = () => {
      const authStr = localStorage.getItem('js_logged_in_user');
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const hasAnalysisId = params.has('analysisId');

      if (authStr) {
        try {
          const parsed = JSON.parse(authStr);
          if (parsed && parsed.user) {
            setCurrentUser(parsed.user);
            const userRole = parsed.user.role === 'ADMIN' ? 'ADMIN' : 'USER';
            setRole(userRole);
            
            // Redirect to matching role boundary if at base/root
            if (window.location.pathname === '/' || window.location.pathname === '/login') {
              if (viewParam === 'REPORTS' || hasAnalysisId) {
                navigate('/app/reports' + window.location.search);
              } else {
                navigate(userRole === 'ADMIN' ? '/admin/dashboard' : '/app/home');
              }
            }
          }
        } catch (e) {
          // ignore
        }
      } else {
        // Not logged in -> if viewing REPORTS or analysisId, route to login or reports
        if (viewParam === 'REPORTS' || hasAnalysisId) {
          if (window.location.pathname === '/' || window.location.pathname === '/login') {
            navigate('/app/reports' + window.location.search);
          }
        } else if (
          window.location.pathname !== '/' &&
          window.location.pathname !== '/login' &&
          window.location.pathname !== '/privacy' &&
          window.location.pathname !== '/terms' &&
          !window.location.pathname.startsWith('/app/reports')
        ) {
          navigate('/');
        }
      }
    };
    checkAuth();

    const handleUnauthorized = () => {
      setCurrentUser(null);
      navigate('/');
    };
    const handleProfileUpdate = () => {
      const authStr = localStorage.getItem('js_logged_in_user');
      if (authStr) {
        try {
          const parsed = JSON.parse(authStr);
          if (parsed && parsed.user) {
            setCurrentUser(parsed.user);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('js_unauthorized', handleUnauthorized);
    window.addEventListener('js_user_profile_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('js_unauthorized', handleUnauthorized);
      window.removeEventListener('js_user_profile_updated', handleProfileUpdate);
    };
  }, []);

  // Apply Theme effects
  useEffect(() => {
    localStorage.setItem('jobshield_theme', theme);
    const applyTheme = (t: 'dark' | 'light' | 'system') => {
      let resolved: 'dark' | 'light' = 'dark';
      if (t === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = t;
      }
      document.documentElement.setAttribute('data-theme', resolved);
    };
    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
    return () => {};
  }, [theme]);

  // Sync report data from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const reportDataParam = params.get('reportData');

    if (viewParam === 'REPORTS' && reportDataParam) {
      try {
        const report = JSON.parse(decodeURIComponent(reportDataParam));
        const existing = localStorage.getItem('jobshield_history');
        const history = existing ? JSON.parse(existing) : [];
        if (!history.some((h: any) => h.id === report.id)) {
          history.unshift(report);
          localStorage.setItem('jobshield_history', JSON.stringify(history));
        }
        navigate('/app/reports');
        // Clear query parameters from URL without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error('Error importing report data from URL:', e);
      }
    }
  }, []);

  // Dropdown & Modal states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);

  // Global key listener for Command Palette (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        setCommandSearch('');
        setActiveCommandIndex(0);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Navigations definitions
  const seekerNav: NavItem[] = [
    { path: '/app/home', label: 'Home', icon: <Home size={15} />, color: '#00D8F6' },
    { path: '/app/analyze', label: 'Analyze Job', icon: <Search size={15} />, color: '#00D8F6' },
    { path: '/app/verify-company', label: 'Verify Company', icon: <Building2 size={15} />, color: '#00D8F6' },
    { path: '/app/verify-offer', label: 'Verify Offer', icon: <FileCheck size={15} />, color: '#00D8F6' },
    { path: '/app/reports', label: 'Scan History', icon: <FileText size={15} />, color: '#00D8F6' },
    { path: '/app/saved-jobs', label: 'Saved Jobs', icon: <Bookmark size={15} />, color: '#00D8F6' },
    { path: '/app/extension', label: 'Browser Extension', icon: <Puzzle size={15} />, color: '#00D8F6' },
    { path: '/app/settings', label: 'Settings', icon: <Settings size={15} />, color: '#00D8F6' },
  ];

  const adminNav: NavItem[] = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <BarChart2 size={15} />, color: '#00D8F6' },
    { path: '/admin/users', label: 'Users', icon: <Users size={15} />, color: '#00D8F6' },
    { path: '/admin/analyses', label: 'Analyses', icon: <FileText size={15} />, color: '#00D8F6' },
    { path: '/admin/jobs', label: 'Job Stats', icon: <Briefcase size={15} />, color: '#00D8F6' },
    { path: '/admin/system', label: 'System Health', icon: <Activity size={15} />, color: '#00D8F6' },
    { path: '/admin/support', label: 'Support Tickets', icon: <LifeBuoy size={15} />, color: '#00D8F6' },
  ];

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (role === 'ADMIN') {
        if (q.includes('user')) navigate('/admin/users');
        else if (q.includes('anal')) navigate('/admin/analyses');
        else if (q.includes('job') || q.includes('stat')) navigate('/admin/jobs');
        else if (q.includes('health') || q.includes('system')) navigate('/admin/system');
        else navigate('/admin/dashboard');
      } else {
        if (q.includes('stripe') || q.includes('company') || q.includes('verify')) navigate('/app/verify-company');
        else if (q.includes('offer') || q.includes('letter')) navigate('/app/verify-offer');
        else if (q.includes('analyze') || q.includes('scam')) navigate('/app/analyze');
        else if (q.includes('report') || q.includes('history')) navigate('/app/reports');
        else if (q.includes('save') || q.includes('bookmark')) navigate('/app/saved-jobs');
        else if (q.includes('setting')) navigate('/app/settings');
        else if (q.includes('profile')) navigate('/app/profile');
        else if (q.includes('help')) navigate('/app/help');
      }
    }
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const active = currentPath === item.path;
    return (
      <button
        onClick={() => navigate(item.path)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', minHeight: 38, height: 'auto',
          padding: sidebarCollapsed ? '6px 0' : '7px 12px',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          borderRadius: 10,
          border: active ? '1px solid var(--sidebar-active-border)' : '1px solid transparent',
          cursor: 'pointer',
          background: active ? 'var(--sidebar-active-bg)' : 'transparent',
          color: active ? 'var(--text)' : 'var(--sidebar-inactive-text, var(--text-secondary))',
          fontFamily: 'var(--font)', fontSize: 12.5, fontWeight: active ? 700 : 500,
          textAlign: 'left',
          transition: 'border-color var(--transition-normal), background-color var(--transition-normal), color var(--transition-normal), box-shadow var(--transition-normal)',
          position: 'relative',
          letterSpacing: '-0.005em',
          boxShadow: active ? 'var(--sidebar-active-glow)' : 'none',
        }}
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
            e.currentTarget.style.color = 'var(--text)';
            const iconEl = e.currentTarget.querySelector('.nav-icon-box') as HTMLElement;
            if (iconEl) {
              iconEl.style.background = 'var(--sidebar-hover-icon-bg)';
              iconEl.style.borderColor = 'var(--sidebar-hover-icon-border)';
              iconEl.style.color = 'var(--sidebar-hover-icon-color)';
              iconEl.style.transform = 'translateX(2px)';
            }
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--sidebar-inactive-text, var(--text-secondary))';
            const iconEl = e.currentTarget.querySelector('.nav-icon-box') as HTMLElement;
            if (iconEl) {
              iconEl.style.background = 'var(--sidebar-inactive-icon-bg)';
              iconEl.style.borderColor = 'var(--sidebar-inactive-icon-border)';
              iconEl.style.color = 'var(--sidebar-inactive-icon-color)';
              iconEl.style.transform = 'translateX(0)';
            }
          }
        }}
      >
        {active && !sidebarCollapsed && (
          <span style={{
            position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
            width: 3, height: 18, borderRadius: '0 4px 4px 0',
            background: 'var(--sidebar-dot-color)', boxShadow: '0 0 8px var(--sidebar-dot-color)',
          }} />
        )}
        <span style={{
          display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 8,
          background: active ? 'var(--sidebar-active-icon-bg)' : 'var(--sidebar-inactive-icon-bg)',
          color: active ? 'var(--sidebar-active-icon-color)' : 'var(--sidebar-inactive-icon-color)',
          border: active ? '1px solid var(--sidebar-active-icon-border)' : '1px solid var(--sidebar-inactive-icon-border)',
          transition: 'transform var(--transition-normal), background-color var(--transition-normal), border-color var(--transition-normal), color var(--transition-normal)',
          position: 'relative',
        }} className="nav-icon-box">
          {item.icon}
          {item.path.includes('extension') && sidebarCollapsed && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--sidebar-dot-color)', boxShadow: '0 0 6px var(--sidebar-dot-color)',
              border: '1px solid var(--bg-sidebar)',
            }} />
          )}
        </span>
        {!sidebarCollapsed && <span style={{ color: active ? 'var(--text)' : 'var(--sidebar-inactive-text, var(--text-secondary))', fontWeight: active ? 700 : 500 }}>{item.label}</span>}
        
        {item.path.includes('extension') && !sidebarCollapsed && (
          <span style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 9,
            fontWeight: 700,
            color: 'var(--sidebar-dot-color)',
            background: 'var(--primary-dim)',
            padding: '2px 6px',
            borderRadius: 10,
            border: '1px solid var(--primary-border)',
            fontFamily: 'var(--font)',
            flexShrink: 0,
          }}>
            <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: 'var(--sidebar-dot-color)', boxShadow: '0 0 5px var(--sidebar-dot-color)' }} />
            Online
          </span>
        )}

        {active && !item.path.includes('extension') && !sidebarCollapsed && (
          <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--sidebar-dot-color)', boxShadow: '0 0 8px var(--sidebar-dot-color)' }} />
        )}
      </button>
    );
  };

  const commands = [
    { id: 'analyzer', name: 'Analyze Job posting', category: 'Actions', shortcut: 'A', action: () => navigate('/app/analyze') },
    { id: 'verify', name: 'Verify Company credibility', category: 'Actions', shortcut: 'V', action: () => navigate('/app/verify-company') },
    { id: 'offer-verify', name: 'Offer Letter Analysis', category: 'Actions', shortcut: 'O', action: () => navigate('/app/verify-offer') },
    { id: 'history', name: 'View Scan History & reports', category: 'Navigation', shortcut: 'H', action: () => navigate('/app/reports') },
    { id: 'saved-jobs', name: 'Saved Opportunities', category: 'Navigation', shortcut: 'J', action: () => navigate('/app/saved-jobs') },
    { id: 'settings', name: 'Settings & account preferences', category: 'Navigation', shortcut: 'S', action: () => navigate('/app/settings') },
    { id: 'theme', name: 'Toggle Dark / Light / System Theme', category: 'Preferences', shortcut: 'T', action: () => setTheme(prev => prev === 'dark' ? 'light' : prev === 'light' ? 'system' : 'dark') },
  ];

  const mockPreviousScans = [
    { name: 'Google LLC - Software Engineer', company: 'Google LLC', action: () => { navigate('/app/reports'); setSearchQuery('Google'); } },
    { name: 'Stripe - Frontend Engineer', company: 'Stripe', action: () => { navigate('/app/reports'); setSearchQuery('Stripe'); } },
    { name: 'Amazon - AWS Support Associate', company: 'Amazon', action: () => { navigate('/app/reports'); setSearchQuery('Amazon'); } },
    { name: 'Netflix - Security Engineer', company: 'Netflix', action: () => { navigate('/app/reports'); setSearchQuery('Netflix'); } },
  ];

  const filteredCommands = commands.filter(c =>
    c.name.toLowerCase().includes(commandSearch.toLowerCase()) ||
    c.category.toLowerCase().includes(commandSearch.toLowerCase())
  );

  const filteredScans = commandSearch.trim() ? mockPreviousScans.filter(s =>
    s.name.toLowerCase().includes(commandSearch.toLowerCase())
  ) : [];

  const allOptions = [
    ...filteredCommands.map(c => ({ id: c.id, name: c.name, category: c.category, shortcut: c.shortcut, action: c.action })),
    ...filteredScans.map((s, idx) => ({ id: `scan-${idx}`, name: `Search Report: ${s.name}`, category: 'Previous Scans', shortcut: 'Enter', action: s.action })),
  ];

  const handlePaletteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveCommandIndex(prev => (prev + 1) % allOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveCommandIndex(prev => (prev - 1 + allOptions.length) % allOptions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allOptions[activeCommandIndex]) {
        allOptions[activeCommandIndex].action();
        setShowCommandPalette(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowCommandPalette(false);
    }
  };

  // Base routing check logic
  const isLogged = !!currentUser;
  const isAuthPath = currentPath === '/login';
  const isLandingPath = currentPath === '/';

  // 0. Public Legal Routes (no authentication required)
  if (currentPath === '/privacy') {
    return <PrivacyPolicyPage onBack={() => navigate(isLogged ? (role === 'ADMIN' ? '/admin/dashboard' : '/app/settings') : '/')} />;
  }
  if (currentPath === '/terms') {
    return <TermsPage onBack={() => navigate(isLogged ? (role === 'ADMIN' ? '/admin/dashboard' : '/app/settings') : '/')} />;
  }

  // 1. Unauthenticated views
  if (!isLogged) {
    if (isAuthPath) {
      return (
        <AuthPage 
          initialMode={authMode} 
          onAuthSuccess={(userRole) => {
            const authStr = localStorage.getItem('js_logged_in_user');
            if (authStr) {
              try {
                const parsed = JSON.parse(authStr);
                if (parsed && parsed.user) {
                  setCurrentUser(parsed.user);
                }
              } catch(e) {}
            }
            const activeRole = userRole === 'ADMIN' ? 'ADMIN' : 'USER';
            setRole(activeRole);
            navigate(activeRole === 'ADMIN' ? '/admin/dashboard' : '/app/home');
          }} 
        />
      );
    }
    // Default to Landing for all other unauthenticated requests
    return (
      <LandingPage 
        onGetStarted={(mode) => {
          setAuthMode(mode || 'register');
          navigate('/login');
        }} 
      />
    );
  }

  // 2. Access control guard: User tries to enter admin panel
  const isAdminPath = currentPath.startsWith('/admin');
  if (role === 'USER' && isAdminPath) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', background: 'var(--bg-base)' }}>
        <BackgroundCanvas />
        <ForbiddenPage onReturn={() => navigate('/app/home')} />
      </div>
    );
  }

  // 3. Access control guard: Admin tries to enter seeker app
  const isUserPath = currentPath.startsWith('/app');
  if (role === 'ADMIN' && (isUserPath || isLandingPath || isAuthPath)) {
    navigate('/admin/dashboard');
    return null;
  }

  // Ensure default routing path matching if logged in
  if (role === 'USER' && (isLandingPath || isAuthPath || currentPath === '/app' || currentPath === '/app/dashboard')) {
    navigate('/app/home');
    return null;
  }

  const sidebarWidth = sidebarCollapsed ? 72 : 230;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', background: 'var(--bg-base)' }}>
      <BackgroundCanvas />

      {/* Logout Modal */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--bg-overlay)',
          backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 24
        }}>
          <div className="animate-scale" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '18px', padding: '32px', maxWidth: '400px', width: '100%',
            boxShadow: 'var(--shadow-xl)',
            backdropFilter: 'blur(24px)',
            textAlign: 'center'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '16px', background: 'var(--danger-dim)',
              color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <LogOut size={26} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Confirm Sign Out</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Are you sure you want to sign out? Your session telemetry will be secured.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Btn variant="secondary" onClick={() => setShowLogoutModal(false)} style={{ flex: 1 }}>
                Cancel
              </Btn>
              <button
                onClick={() => {
                  localStorage.removeItem('js_logged_in_user');
                  window.dispatchEvent(new CustomEvent('js_unauthorized'));
                  setCurrentUser(null);
                  setShowLogoutModal(false);
                  navigate('/');
                }}
                style={{
                  flex: 1, padding: '10px 18px', borderRadius: 9, border: '1px solid var(--danger)',
                  background: 'var(--danger-dim)', color: 'var(--danger)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font)', transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--danger-dim)'; e.currentTarget.style.color = 'var(--danger)'; }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside style={{
        width: sidebarWidth, minWidth: sidebarWidth,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--sidebar-border, var(--border))',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s var(--ease), min-width 0.25s var(--ease), background 250ms ease',
        position: 'sticky', top: 0, height: '100vh',
        overflow: 'hidden', zIndex: 50,
      }}>
        {/* Brand logo */}
        <div style={{
          height: 60, minHeight: 60,
          padding: sidebarCollapsed ? '0 12px' : '0 16px',
          display: 'flex', alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid var(--sidebar-border, var(--border))',
        }}>
          <JobShieldLogo size={32} showText={!sidebarCollapsed} />
        </div>

        {/* Navigation list */}
        <div style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          {role === 'USER' ? (
            <>
              {!sidebarCollapsed && (
                <div style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--sidebar-category-text, var(--text-muted))', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '6px 8px 5px', fontFamily: 'var(--font)' }}>Main</div>
              )}
              <NavButton item={seekerNav[0]} /> {/* Home */}
              <NavButton item={seekerNav[1]} /> {/* Analyze Job */}
              <NavButton item={seekerNav[2]} /> {/* Verify Company */}
              <NavButton item={seekerNav[3]} /> {/* Verify Offer */}
              <NavButton item={seekerNav[4]} /> {/* Scan History */}
              <NavButton item={seekerNav[5]} /> {/* Saved Jobs */}
              
              <div style={{ height: '1px', background: 'var(--sidebar-border, var(--border))', margin: '18px 4px 10px' }} />
              {!sidebarCollapsed && (
                <div style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--sidebar-category-text, var(--text-muted))', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0px 8px 5px', fontFamily: 'var(--font)' }}>Integration</div>
              )}
              <NavButton item={seekerNav[6]} /> {/* Extension */}
              
              <div style={{ height: '1px', background: 'var(--sidebar-border, var(--border))', margin: '18px 4px 10px' }} />
              <NavButton item={seekerNav[7]} /> {/* Settings */}
            </>
          ) : (
            <>
              {!sidebarCollapsed && (
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--sidebar-category-text, var(--text-muted))', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '6px 8px 5px' }}>Administration</div>
              )}
              {adminNav.map(item => <NavButton key={item.path} item={item} />)}
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid var(--sidebar-border, var(--border))', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            width: '100%', height: 30, padding: '0 8px',
            borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--sidebar-category-text, var(--text-dim))',
            fontFamily: 'var(--font)', fontSize: 11, transition: 'all 0.15s ease',
          }}>
            {sidebarCollapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
          
          <div onClick={() => setShowProfileMenu(!showProfileMenu)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: sidebarCollapsed ? '5px 0' : '5px 8px',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            borderRadius: 10, cursor: 'pointer',
            background: 'var(--bg-card)',
            border: '1px solid var(--sidebar-border, var(--border))',
            boxShadow: 'var(--shadow-sm)',
            transition: 'background 0.15s ease',
          }}>
            <UserAvatar avatar={currentUser?.avatar} name={currentUser?.name} size={27} fontSize={10} />
            {!sidebarCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.name || 'User'}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>{role === 'ADMIN' ? 'SYSTEM ADMIN' : 'JOB SEEKER'}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main body */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <header style={{
          height: 60, minHeight: 60,
          background: 'var(--bg-header-gradient, var(--bg-header))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-header, var(--border))',
          boxShadow: 'var(--header-shadow, none)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px',
          position: 'sticky', top: 0, zIndex: 40,
        }}>
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 10, height: 2, background: 'var(--primary)' }} />
            <button onClick={() => navigate(role === 'ADMIN' ? '/admin/dashboard' : '/app/home')} style={{
              background: 'transparent', border: 'none', color: 'var(--sidebar-category-text, var(--text-secondary))',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0,
              fontFamily: 'var(--font)', transition: 'color 0.15s ease',
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--sidebar-category-text, var(--text-secondary))')}
            >
              {breadcrumbsMap[currentPath]?.parent || (role === 'ADMIN' ? 'Admin workspace' : 'Seeker App')}
            </button>
            <ChevronRight size={11} color="var(--text-muted)" />
            <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 12.5, letterSpacing: '-0.01em' }}>
              {breadcrumbsMap[currentPath]?.page || 'Overview'}
            </span>
          </div>

          {/* Right Actions Cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-header, var(--border))',
              boxShadow: 'var(--shadow-sm)',
              padding: '0 16px', height: 38, borderRadius: 20, width: 320,
              transition: 'border-color var(--transition-normal), box-shadow var(--transition-normal)',
              cursor: 'pointer',
            }}
            onClick={() => { setShowCommandPalette(true); setCommandSearch(''); setActiveCommandIndex(0); }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-header, var(--border))'; }}
            >
              <Search size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
              <div
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--text-secondary)', fontSize: 12.5, fontFamily: 'var(--font)',
                  width: '100%', letterSpacing: '-0.01em', paddingLeft: 4,
                }}
              >
                Search command...
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-header, var(--border))',
                borderRadius: 4,
                padding: '2px 6px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap',
              }}>
                {shortcutText}
              </span>
            </div>

            {/* Notifications panel */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                title="Notifications"
                style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: showNotifications ? 'var(--bg-active)' : 'var(--bg-card)',
                  border: `1px solid ${showNotifications ? 'var(--primary)' : 'var(--border-header, var(--border))'}`,
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: showNotifications ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', position: 'relative',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseLeave={e => { if (!showNotifications) e.currentTarget.style.borderColor = 'var(--border-header, var(--border))'; }}
              >
                <Bell size={16} />
              </button>

              {showNotifications && (
                <div className="animate-scale" style={{
                  position: 'absolute', top: 48, right: 0, width: 300,
                  background: 'var(--bg-glass)', border: '1px solid var(--border-strong)',
                  borderRadius: '14px', boxShadow: 'var(--shadow-lg)',
                  padding: '16px', zIndex: 100
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>🔔 Security Center</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'center', padding: '16px 8px' }}>
                    <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>🛡️</span>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>Status Check Passed</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>Security filters are operational. No threats detected on user database logs.</div>
                  </div>
                </div>
              )}
            </div>

            {/* Theme selector */}
            <button
              onClick={() => {
                setTheme(prev => prev === 'dark' ? 'light' : prev === 'light' ? 'system' : 'dark');
              }}
              title={`Theme: ${theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System Default'}`}
              style={{
                width: 36, height: 36, borderRadius: 9,
                background: 'var(--bg-card)', border: '1px solid var(--border-header, var(--border))',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', cursor: 'pointer', transition: 'var(--transition)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-header, var(--border))'; }}
            >
              {theme === 'dark' ? <Moon size={16} /> : theme === 'light' ? <Sun size={16} /> : <Laptop size={16} />}
            </button>

            {/* Profile Avatar */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', borderRadius: '50%',
                }}
              >
                <UserAvatar
                  avatar={currentUser?.avatar}
                  name={currentUser?.name}
                  size={36}
                  fontSize={12}
                  style={{
                    border: showProfileMenu ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                  }}
                />
              </div>

              {showProfileMenu && (
                <div className="animate-scale" style={{
                  position: 'absolute', top: 44, right: 0, width: 210,
                  background: 'var(--bg-glass)', border: '1px solid var(--border-strong)',
                  borderRadius: '12px', boxShadow: 'var(--shadow-lg)',
                  padding: '10px', zIndex: 100
                }}>
                  <div style={{ padding: '8px 8px 10px 8px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{currentUser?.name || 'User'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{currentUser?.email || 'user@jobshield.ai'}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                      {role === 'ADMIN' ? 'SYSTEM ADMIN' : 'JOB SEEKER'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}>
                    {role === 'USER' ? (
                      <>
                        <button
                          onClick={() => { navigate('/app/profile'); setShowProfileMenu(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: '6px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', textAlign: 'left', fontWeight: 500 }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <User size={13} color="var(--primary)" /> Profile
                        </button>
                        <button
                          onClick={() => { navigate('/app/settings'); setShowProfileMenu(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: '6px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', textAlign: 'left', fontWeight: 500 }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Settings size={13} color="var(--primary)" /> Settings
                        </button>
                        <button
                          onClick={() => { navigate('/app/help'); setShowProfileMenu(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: '6px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', textAlign: 'left', fontWeight: 500 }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <HelpCircle size={13} color="var(--primary)" /> Help
                        </button>
                      </>
                    ) : null}
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                    <button
                      onClick={() => { setShowProfileMenu(false); setShowLogoutModal(true); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: '6px', background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: 12, cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-dim)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <LogOut size={13} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content layout */}
        <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', minWidth: 0 }}>
          <div key={currentPath} className="page-enter" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
            {/* Seeker Pages */}
            {role === 'USER' && (
              <>
                {currentPath === '/app/home' && <HomePage onNavigate={(v) => {
                  if (v === 'REPORTS') navigate('/app/reports');
                  else if (v === 'ANALYZER') navigate('/app/analyze');
                  else if (v === 'COMPANY_VERIFY') navigate('/app/verify-company');
                  else if (v === 'OFFER_VERIFY') navigate('/app/verify-offer');
                  else if (v === 'ADMIN') navigate('/app/settings');
                  else navigate('/app/home');
                }} />}
                {currentPath === '/app/analyze' && <JobAnalyzerPage />}
                {currentPath === '/app/verify-company' && <CompanyVerificationPage />}
                {currentPath === '/app/verify-offer' && <OfferVerifyPage />}
                {currentPath === '/app/reports' && <ReportsPage onNavigate={(v) => navigate('/app/home')} />}
                {currentPath === '/app/saved-jobs' && <SavedJobsPage />}
                {currentPath === '/app/extension' && <ExtensionPlaygroundPage onNavigate={(v) => navigate('/app/home')} />}
                {currentPath === '/app/settings' && (
                  <SettingsPage
                    onNavigate={(v) => {
                      if (v === 'PROFILE') navigate('/app/profile');
                      else if (v === 'EXTENSION') navigate('/app/extension');
                      else navigate('/app/home');
                    }}
                    theme={theme}
                    onThemeChange={setTheme}
                  />
                )}
                {currentPath === '/app/profile' && <ProfilePage />}
                {currentPath === '/app/help' && <HelpPage />}
              </>
            )}

            {/* Admin Pages */}
            {role === 'ADMIN' && (
              <>
                {currentPath === '/admin/dashboard' && <AdminPanelPage />}
                {currentPath === '/admin/users' && <UsersPage />}
                {currentPath === '/admin/analyses' && <AdminAnalysesPage />}
                {currentPath === '/admin/jobs' && <AdminJobsPage />}
                {currentPath === '/admin/system' && <AdminSystemPage />}
                {currentPath === '/admin/support' && <AdminSupportTicketsPage />}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Command Palette */}
      {showCommandPalette && (
        <div
          onClick={() => setShowCommandPalette(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-overlay)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '10vh',
            zIndex: 1000,
            animation: 'fadeIn var(--transition-fast) both',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="animate-scale"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              width: '100%',
              maxWidth: 540,
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevation-0)' }}>
              <Search size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
              <input
                autoFocus
                type="text"
                placeholder="Type a command..."
                value={commandSearch}
                onChange={e => {
                  setCommandSearch(e.target.value);
                  setActiveCommandIndex(0);
                }}
                onKeyDown={handlePaletteKeyDown}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text)',
                  fontSize: 14,
                  fontFamily: 'var(--font)',
                  width: '100%',
                  WebkitFontSmoothing: 'antialiased',
                }}
              />
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                background: 'var(--bg-elevation-2)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '2px 6px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap',
              }}>
                ESC
              </span>
            </div>

            <div style={{ maxHeight: 320, overflowY: 'auto', padding: '8px 0', background: 'var(--bg-card)' }}>
              {allOptions.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                  No results found for "{commandSearch}"
                </div>
              ) : (
                allOptions.map((opt, index) => {
                  const isActive = index === activeCommandIndex;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        opt.action();
                        setShowCommandPalette(false);
                      }}
                      onMouseEnter={() => setActiveCommandIndex(index)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        cursor: 'pointer',
                        background: isActive ? 'var(--bg-hover)' : 'transparent',
                        transition: 'background var(--transition-fast) ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                          background: isActive ? 'var(--primary-dim)' : 'var(--bg-elevation-1)',
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontFamily: 'var(--font-mono)',
                          textTransform: 'uppercase',
                        }}>
                          {opt.category}
                        </span>
                        <span style={{
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? 'var(--text)' : 'var(--text-secondary)',
                        }}>
                          {opt.name}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: isActive ? 'var(--primary-dim)' : 'var(--bg-elevation-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        padding: '2px 6px',
                        color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {opt.shortcut}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              background: 'var(--bg-elevation-0)',
              borderTop: '1px solid var(--border)',
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}>
              <span>Use ↑↓ keys to navigate</span>
              <span>Enter to select</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
