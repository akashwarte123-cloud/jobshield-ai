import React, { useState, useEffect, useRef } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { JobShieldLogo } from '../components/ui';
import { api } from '../services/api';

interface AuthPageProps {
  initialMode?: 'signin' | 'register';
  onAuthSuccess: (role: 'USER' | 'ADMIN') => void;
}

// Side Network Canvas component
function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = 400;
    let height = 600;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: entryWidth, height: entryHeight } = entry.contentRect;
        if (entryWidth > 0 && entryHeight > 0) {
          canvas.width = entryWidth;
          canvas.height = entryHeight;
          width = entryWidth;
          height = entryHeight;
        }
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
      width = canvas.width = canvas.parentElement.clientWidth || 400;
      height = canvas.height = canvas.parentElement.clientHeight || 600;
    }

    const nodes: Array<{ x: number; y: number; vx: number; vy: number; r: number }> = [];
    const count = 30;

    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 2.5
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw network lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw floating nodes
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Subtle center glowing shield shield icon backdrop
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.beginPath();
      // Draw faint shield shape
      ctx.moveTo(0, -40);
      ctx.quadraticCurveTo(35, -40, 35, 5);
      ctx.quadraticCurveTo(35, 45, 0, 60);
      ctx.quadraticCurveTo(-35, 45, -35, 5);
      ctx.quadraticCurveTo(-35, -40, 0, -40);
      ctx.closePath();
      ctx.fillStyle = 'rgba(99, 102, 241, 0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
  );
}

export function AuthPage({ initialMode, onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode || 'register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [targetRole, setTargetRole] = useState<'USER' | 'ADMIN'>('USER');
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});

  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [registrationConsent, setRegistrationConsent] = useState(false);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    'Initializing neural engines...',
    'Loading threat classifier models...',
    'Establishing secure credentials tunnel...'
  ];

  // Clean up legacy mock-user seed if it was set in a previous session
  useEffect(() => {
    localStorage.removeItem('jobshield_users');
  }, []);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
      // Reset inputs when switching between sign-in and sign-up modes
      if (initialMode === 'signin') {
        setEmail('');
        setPassword('');
      } else {
        setFullName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
      setErrors({});
      setRegistrationConsent(false);
    }
  }, [initialMode]);

  useEffect(() => {
    if (!isLoggingIn) return;

    setProgress(0);
    setLoadingStep(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            sessionStorage.removeItem('js_has_animated_dashboard');
            setIsLoggingIn(false);
            onAuthSuccess(targetRole);
          }, 450);
          return 100;
        }

        const next = prev + 2;

        if (next > 70) {
          setLoadingStep(2);
        } else if (next > 35) {
          setLoadingStep(1);
        }

        return next;
      });
    }, 32);

    return () => clearInterval(interval);
  }, [isLoggingIn, targetRole]);

  const handleModeSwitch = (newMode: 'signin' | 'register') => {
    setMode(newMode);
    setErrors({});
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowRegisterPassword(false);
    setShowRegisterConfirmPassword(false);
    setShowLoginPassword(false);
    setRegistrationConsent(false);
  };

  const handleOpenTerms = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open('/terms', '_blank');
  };

  const handleOpenPrivacy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open('/privacy', '_blank');
  };

  const validateRegister = () => {
    const newErrors: typeof errors = {};
    if (!fullName.trim()) {
      newErrors.fullName = 'Please enter your full name.';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterSubmit = () => {
    if (!registrationConsent) {
      setErrors({ form: 'Please agree to the Terms & Conditions and acknowledge the Privacy Policy.' });
      return;
    }
    if (!validateRegister()) return;

    api.post('/auth/register', {
      name: fullName.trim(),
      email: email.trim(),
      password: password
    })
      .then(() => {
        // Automatically sign in upon successful registration
        return api.post('/auth/login', {
          email: email.trim(),
          password: password
        });
      })
      .then((loginRes) => {
        const { token, user } = loginRes.data as any;
        // Role comes directly from the backend — no heuristics
        const resolvedRole: 'USER' | 'ADMIN' = user.role === 'ADMIN' ? 'ADMIN' : 'USER';

        // Save token & user state in localStorage for the content script/worker
        localStorage.setItem('js_logged_in_user', JSON.stringify({
          token,
          user: { ...user, role: resolvedRole }
        }));

        setTargetRole(resolvedRole);
        setIsLoggingIn(true);
      })
      .catch((err) => {
        setErrors({ form: err.message || 'An error occurred during registration.' });
      });
  };

  const handleSignInSubmit = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    api.post('/auth/login', {
      email: email.trim(),
      password: password
    })
      .then((loginRes) => {
        const { token, user } = loginRes.data as any;
        // Role comes directly from the backend — no heuristics
        const resolvedRole: 'USER' | 'ADMIN' = user.role === 'ADMIN' ? 'ADMIN' : 'USER';

        // Save token & user state in localStorage for the content script/worker
        localStorage.setItem('js_logged_in_user', JSON.stringify({
          token,
          user: { ...user, role: resolvedRole }
        }));

        setTargetRole(resolvedRole);
        setIsLoggingIn(true);
      })
      .catch((err) => {
        setErrors({ form: err.message || 'Invalid email or password.' });
      });
  };

  if (isLoggingIn) {
    const radius = 38;
    const circ = 2 * Math.PI * radius;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#040712',
        padding: 24,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(56, 189, 248, 0.012) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.012) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ position: 'absolute', top: '15%', left: '15%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%)', filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '15%', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{
          position: 'relative',
          width: 90,
          height: 90,
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
          <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
            <circle
              cx="45"
              cy="45"
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="4"
            />
            <circle
              cx="45"
              cy="45"
              r={radius}
              fill="transparent"
              stroke="#38BDF8"
              strokeWidth="4"
              strokeDasharray={circ}
              strokeDashoffset={circ - (progress / 100) * circ}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.05s linear',
                filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.5))'
              }}
            />
          </svg>
          <Shield size={32} color="#38BDF8" style={{ filter: 'drop-shadow(0 0 5px rgba(56,189,248,0.3))' }} />
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', marginBottom: 8, letterSpacing: '-0.01em', zIndex: 10 }}>
          🛡️ Securing Environment ({progress}%)
        </div>
        <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'var(--font-mono)', zIndex: 10 }}>
          {steps[loadingStep]}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 24,
      background: '#040712',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(to right, rgba(56, 189, 248, 0.012) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(56, 189, 248, 0.012) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ position: 'absolute', top: '15%', left: '15%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%)', filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '15%', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ 
        width: '100%', 
        maxWidth: 960,
        backgroundColor: '#0A0F1D',
        border: '1px solid rgba(56, 189, 248, 0.18)',
        borderRadius: '16px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 30px rgba(56, 189, 248, 0.06)',
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        overflow: 'hidden',
        minHeight: 480,
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          background: '#070B16',
          backgroundImage: `
            radial-gradient(circle at center, rgba(56, 189, 248, 0.12) 0%, transparent 65%),
            linear-gradient(to right, rgba(56, 189, 248, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 32px 32px, 32px 32px',
          borderRight: '1px solid rgba(255,255,255,0.04)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 110,
            height: 110,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(99, 102, 241, 0.03) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            boxShadow: '0 0 35px rgba(56, 189, 248, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}>
            <Shield size={36} color="#38BDF8" style={{ filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.4))' }} />
          </div>

          <NetworkCanvas />
          <div style={{ position: 'absolute', inset: 0, padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', pointerEvents: 'none', background: 'linear-gradient(to top, rgba(7,11,22,0.95) 0%, transparent 100%)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#F8FAFC', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              🛡️ JobShield AI Threat Intelligence
            </h3>
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 6, lineHeight: 1.5, margin: '6px 0 0' }}>
              Real-time deep learning filters cross-reference descriptions, corporate registries, and payout trap mechanisms.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: 16 }}>
            <JobShieldLogo size={28} theme="dark" />
          </div>

          {errors.form && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              borderRadius: 8, 
              padding: '10px 14px', 
              color: '#EF4444', 
              fontSize: 12.5, 
              marginBottom: 16,
              textAlign: 'center'
            }}>
              {errors.form}
            </div>
          )}

          {mode === 'register' ? (
            <>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-0.02em' }}>Create your JobShield account</h2>
              <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 6, marginBottom: 16 }}>
                Start protecting yourself from fraudulent job offers.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    style={{
                      background: 'rgba(255,255,255,0.03)', border: errors.fullName ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.08)',
                      padding: '10px 14px', borderRadius: 8, color: '#fff', outline: 'none',
                      fontFamily: 'inherit', fontSize: 13
                    }}
                  />
                  {errors.fullName && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{errors.fullName}</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jane.doe@example.com"
                    style={{
                      background: 'rgba(255,255,255,0.03)', border: errors.email ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.08)',
                      padding: '10px 14px', borderRadius: 8, color: '#fff', outline: 'none',
                      fontFamily: 'inherit', fontSize: 13
                    }}
                  />
                  {errors.email && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{errors.email}</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.03)', border: errors.password ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.08)',
                        padding: '10px 40px 10px 14px', borderRadius: 8, color: '#fff', outline: 'none',
                        fontFamily: 'inherit', fontSize: 13
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                      style={{
                        position: 'absolute',
                        right: 12,
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none'
                      }}
                    >
                      {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{errors.password}</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Confirm Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showRegisterConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.03)', border: errors.confirmPassword ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.08)',
                        padding: '10px 40px 10px 14px', borderRadius: 8, color: '#fff', outline: 'none',
                        fontFamily: 'inherit', fontSize: 13
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                      aria-label={showRegisterConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      style={{
                        position: 'absolute',
                        right: 12,
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none'
                      }}
                    >
                      {showRegisterConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{errors.confirmPassword}</span>}
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    id="registration-consent-checkbox"
                    checked={registrationConsent}
                    onChange={e => setRegistrationConsent(e.target.checked)}
                    style={{ marginTop: 3, cursor: 'pointer', width: 14, height: 14, accentColor: '#38BDF8' }}
                  />
                  <label htmlFor="registration-consent-checkbox" style={{ fontSize: 12.5, color: '#94A3B8', lineHeight: 1.4, cursor: 'pointer', userSelect: 'none' }}>
                    I agree to the{' '}
                    <a
                      href="#"
                      onClick={handleOpenTerms}
                      style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      Terms & Conditions
                    </a>{' '}
                    and acknowledge the{' '}
                    <a
                      href="#"
                      onClick={handleOpenPrivacy}
                      style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      Privacy Policy
                    </a>.
                  </label>
                </div>

                <button
                  onClick={handleRegisterSubmit}
                  disabled={!registrationConsent}
                  style={{
                    padding: '12px',
                    background: registrationConsent ? '#38BDF8' : 'rgba(56, 189, 248, 0.2)',
                    border: 'none', borderRadius: 8,
                    color: registrationConsent ? '#0B1220' : 'rgba(255, 255, 255, 0.35)',
                    fontWeight: 800, fontSize: 13,
                    cursor: registrationConsent ? 'pointer' : 'not-allowed',
                    boxShadow: registrationConsent ? '0 4px 14px rgba(56, 189, 248, 0.3)' : 'none',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit', marginTop: 12,
                    opacity: registrationConsent ? 1 : 0.6
                  }}
                  aria-disabled={!registrationConsent}
                >
                  Create Account
                </button>

                <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#94A3B8' }}>
                  Already have an account?{' '}
                  <button 
                    onClick={() => handleModeSwitch('signin')} 
                    style={{ background: 'none', border: 'none', color: '#38BDF8', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-0.02em' }}>Welcome Back</h2>
              <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 6, marginBottom: 16 }}>
                Protect your career search with real-time AI security checks.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.03)', border: errors.email ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.08)',
                      padding: '10px 14px', borderRadius: 8, color: '#fff', outline: 'none',
                      fontFamily: 'inherit', fontSize: 13
                    }}
                  />
                  {errors.email && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{errors.email}</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.03)', border: errors.password ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.08)',
                        padding: '10px 40px 10px 14px', borderRadius: 8, color: '#fff', outline: 'none',
                        fontFamily: 'inherit', fontSize: 13
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      style={{
                        position: 'absolute',
                        right: 12,
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none'
                      }}
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <span style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{errors.password}</span>}
                </div>

                <button
                  onClick={handleSignInSubmit}
                  style={{
                    padding: '12px', background: '#38BDF8', border: 'none', borderRadius: 8,
                    color: '#0B1220', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)', transition: 'all 0.15s ease',
                    fontFamily: 'inherit', marginTop: 12
                  }}
                >
                  Sign In
                </button>

                <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#94A3B8' }}>
                  Don't have an account?{' '}
                  <button 
                    onClick={() => handleModeSwitch('register')} 
                    style={{ background: 'none', border: 'none', color: '#38BDF8', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}
                  >
                    Register
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
