import React, { useEffect, useState } from 'react';
import { Shield, ArrowRight, ShieldCheck, Zap, Lock, Globe, CheckCircle2, MessageSquare, Mail, HelpCircle, ChevronDown, Chrome, Play, Pause, RefreshCw } from 'lucide-react';
import { JobShieldLogo } from '../components/ui';
import { JOBSHIELD_CONTACT_EMAIL, JOBSHIELD_PROJECT_NAME } from '../utils/constants';
interface LandingPageProps {
  onGetStarted: (mode?: 'signin' | 'register') => void;
}

interface TourStep {
  id: string;
  name: string;
  title: string;
  description: string;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // ─── Automated Showcase Tour State ───
  const [isTourActive, setIsTourActive] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps: TourStep[] = [
    {
      id: 'hero',
      name: 'Real-Time Protection',
      title: 'Instant Scam & Fake Job Detection',
      description: 'JobShield AI inspects job postings, recruiter domain age, WHOIS records, and off-platform chat traps in seconds.'
    },
    {
      id: 'browser-preview',
      name: 'Verification Engine',
      title: 'Interactive Risk Diagnostics',
      description: 'Simulates live listing verification with real-time confidence scores, WHOIS domain age checks, and trust ratings.'
    },
    {
      id: 'features',
      name: 'Core Capabilities',
      title: 'Triple-Layer Security Stack',
      description: 'Combines NLP text parsing, WHOIS corporate domain verification, and real-time risk database matching.'
    },
    {
      id: 'how-it-works',
      name: '3-Step Workflow',
      title: 'Simple Ingestion & Analysis',
      description: 'Paste any job posting, execute instant multi-vector AI diagnostics, and receive a downloadable forensic report.'
    },
    {
      id: 'extension',
      name: 'Chrome Extension',
      title: 'In-Browser Guard Overlay',
      description: 'Displays instant trust badges directly on LinkedIn, Indeed, and Naukri as you browse open job positions.'
    },
    {
      id: 'support',
      name: 'Security Desk',
      title: 'Direct Security Analyst Access',
      description: 'Connect with security analysts for custom domain verifications, report reviews, and enterprise setups.'
    },
    {
      id: 'faq',
      name: 'Knowledge Base',
      title: 'Security & Privacy Guarantees',
      description: 'Zero personal data tracking. Only supported job listing text is processed through our secure AI sandbox.'
    }
  ];

  // Tour Auto-scroll & explanation controller loop
  useEffect(() => {
    if (!isTourActive) return;

    const timer = setInterval(() => {
      setCurrentStep(prev => {
        const next = (prev + 1) % tourSteps.length;
        
        // Scroll to the target element
        const stepId = tourSteps[next].id;
        const element = document.getElementById(stepId);
        
        if (element) {
          const topPos = element.getBoundingClientRect().top + window.pageYOffset - 110;
          window.scrollTo({ top: topPos, behavior: 'smooth' });
        } else if (next === 0) {
          // Fallback to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Expand first FAQ accordion if scrolling to FAQ
        if (stepId === 'faq') {
          setActiveFaq(0);
        } else {
          setActiveFaq(null);
        }

        return next;
      });
    }, 5500); // Shift every 5.5 seconds

    return () => clearInterval(timer);
  }, [isTourActive]);

  const handleManualStep = (index: number) => {
    setCurrentStep(index);
    const stepId = tourSteps[index].id;
    const element = document.getElementById(stepId);
    if (element) {
      const topPos = element.getBoundingClientRect().top + window.pageYOffset - 110;
      window.scrollTo({ top: topPos, behavior: 'smooth' });
    } else if (index === 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "How does the AI verify if a job is fake?",
      a: "Our neural pipeline parses the job description using advanced text classifiers. It matches syntax patterns associated with common employment scams, such as upfront check requests, off-platform chat directives (Telegram/WhatsApp), and packages reshipping instructions."
    },
    {
      q: "Does the Browser Guard scan my personal data?",
      a: "No. JobShield operates under strict privacy guidelines. The extension only reads job posting text content when you actively view supported directories on portals like LinkedIn, Indeed, and Naukri. No session logs or personal files are analyzed."
    },
    {
      q: "What domains are checked during verification?",
      a: "We perform real-time WHOIS registration query lookups, check registrar creation histories, check active MX records, and verify active SSL certificate authority status to determine if the recruiter domain is authentic or newly registered for spoofing."
    },
    {
      q: "Can I generate PDF audits for corporate reviews?",
      a: "Yes. Every verified scan produces an active forensic audit page which can be saved to your local history workspace, exported as a PDF report, or shared directly with recruiters."
    }
  ];

  // Helper styles for highlighting active showcase sections
  const getActiveGlow = (stepId: string, baseShadow: string = 'none') => {
    const isCurrent = tourSteps[currentStep].id === stepId;
    return {
      transform: isCurrent ? 'scale(1.03)' : 'scale(1)',
      borderColor: isCurrent ? '#38BDF8' : 'rgba(255, 255, 255, 0.06)',
      boxShadow: isCurrent ? `0 10px 30px rgba(56, 189, 248, 0.15), ${baseShadow}` : baseShadow,
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    };
  };

  return (
    <div data-theme="dark" style={{
      minHeight: '100vh',
      color: '#F8FAFC',
      background: '#030712',
      fontFamily: 'var(--font)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      
      {/* ─── Faint Tech Grid Background Texture ─── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(to right, rgba(56, 189, 248, 0.015) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(56, 189, 248, 0.015) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* ─── Premium Soft Glowing Gradient Orbs ─── */}
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.07) 0%, transparent 70%)', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '50%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.04) 0%, transparent 75%)', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ─── Navbar ─── */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 64px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(24px)',
        background: 'rgba(3, 7, 18, 0.8)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <JobShieldLogo size={34} theme="dark" />
        </div>



        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => onGetStarted('signin')}
            style={{
              height: '38px',
              padding: '0 20px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              fontFamily: 'var(--font)',
              WebkitFontSmoothing: 'antialiased',
              letterSpacing: '-0.01em',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#38BDF8'; e.currentTarget.style.color = '#38BDF8'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; e.currentTarget.style.color = '#F8FAFC'; }}
          >
            Sign In
          </button>
          <button
            onClick={() => onGetStarted('register')}
            style={{
              height: '38px',
              padding: '0 20px',
              background: '#38BDF8',
              border: '1px solid transparent',
              borderRadius: '8px',
              color: '#030712',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              fontFamily: 'var(--font)',
              WebkitFontSmoothing: 'antialiased',
              letterSpacing: '-0.01em',
              boxShadow: '0 4px 16px rgba(56, 189, 248, 0.3)',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(56, 189, 248, 0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(56, 189, 248, 0.3)'; }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section id="hero" style={{
        padding: '140px 24px 100px',
        textAlign: 'center',
        maxWidth: 1000,
        margin: '0 auto',
        zIndex: 10,
        position: 'relative'
      }}>
        
        {/* Giant Cyber protection hemispheres meeting visual */}
        <div style={{
          position: 'absolute',
          top: '90%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          border: '1px solid rgba(56, 189, 248, 0.15)',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.02) 0%, transparent 80%)',
          pointerEvents: 'none',
          zIndex: -1
        }} />

        <h1 style={{
          fontSize: '72px',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          color: '#FFFFFF',
          marginBottom: '24px'
        }}>
          Detect Fake Job Listings <br/>
          <span style={{
            background: 'linear-gradient(135deg, #38BDF8 30%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>in Seconds.</span>
        </h1>

        <p style={{
          fontSize: '18px',
          color: '#94A3B8',
          lineHeight: 1.6,
          maxWidth: '560px',
          margin: '0 auto 48px'
        }}>
          Analyze descriptions, verify <strong style={{ color: '#38BDF8', fontWeight: 800 }}>corporate registries</strong>, and apply safely using our real-time <strong style={{ color: '#38BDF8', fontWeight: 800 }}>AI security verification</strong> system.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center' }}>
          <button
            onClick={() => onGetStarted('register')}
            style={{
              height: '48px',
              padding: '0 32px',
              borderRadius: '10px',
              border: '1px solid transparent',
              background: '#38BDF8',
              color: '#030712',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxSizing: 'border-box',
              fontFamily: 'var(--font)',
              WebkitFontSmoothing: 'antialiased',
              letterSpacing: '-0.01em',
              boxShadow: '0 4px 20px rgba(56, 189, 248, 0.3)',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(56, 189, 248, 0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(56, 189, 248, 0.3)'; }}
          >
            Analyze Job Listing <ArrowRight size={16} />
          </button>
          <button
            onClick={() => onGetStarted('register')}
            style={{
              height: '48px',
              padding: '0 32px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#F8FAFC',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxSizing: 'border-box',
              fontFamily: 'var(--font)',
              WebkitFontSmoothing: 'antialiased',
              letterSpacing: '-0.01em',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#38BDF8'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            Install Extension
          </button>
        </div>

      </section>

      {/* ─── Browser Mockup illustration centered (Dynamic Glow Card) ─── */}
      <section id="browser-preview" style={{ padding: '0 24px 100px', display: 'flex', justifyContent: 'center', zIndex: 10, position: 'relative' }}>
        <div style={{
          width: '100%',
          maxWidth: 680,
          background: 'linear-gradient(135deg, #0A0F1D 0%, #050811 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
          ...getActiveGlow('browser-preview', '0 32px 80px rgba(0,0,0,0.65)')
        }}>
          {/* Mock Browser Header */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#060A13', padding: '12px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', gap: 6, marginRight: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '4px 16px', fontSize: 10, color: '#64748B', fontFamily: 'monospace' }}>
              https://linkedin.com/jobs/view/software-intern-google
            </div>
          </div>
          
          {/* Mock Browser Content (Clean Safety Status) */}
          <div style={{ padding: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Status</div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: '#F8FAFC', marginTop: 6, margin: 0 }}>🟢 Safe to Apply</h3>
              <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 6, margin: 0 }}>Google Inc • Software Engineer Intern</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#22C55E' }}>2%</div>
                <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', marginTop: 2 }}>Risk Score</div>
              </div>
              <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#38BDF8' }}>98%</div>
                <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', marginTop: 2 }}>Confidence</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Three Clean Features Cards ─── */}
      <section id="features" style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto', zIndex: 10, position: 'relative' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 900, textAlign: 'center', marginBottom: 12, letterSpacing: '-0.02em' }}>Platform Capabilities</h2>
        <p style={{ fontSize: '14px', color: '#94A3B8', textAlign: 'center', marginBottom: 64 }}>Three unified threat shields guarding your search.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          
          <div style={{
            background: 'linear-gradient(135deg, #0A0F1D 0%, #050811 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: 32,
            borderRadius: 16,
            ...getActiveGlow('features')
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(56, 189, 248, 0.08)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Zap size={22} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>AI Scam Detection</h3>
            <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>Parses job descriptions using <strong style={{ color: '#38BDF8', fontWeight: 800 }}>NLP classifiers</strong> to flag advance-fee check frauds or package schemes.</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #0A0F1D 0%, #050811 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: 32,
            borderRadius: 16,
            ...getActiveGlow('features')
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Globe size={22} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Company Verification</h3>
            <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>Queries domain <strong style={{ color: '#38BDF8', fontWeight: 800 }}>WHOIS database</strong> details, registrar age, SSL certificates, and active mail servers.</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #0A0F1D 0%, #050811 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: 32,
            borderRadius: 16,
            ...getActiveGlow('features')
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(34, 197, 94, 0.08)', color: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Chrome size={22} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Browser Extension</h3>
            <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>Integrated <strong style={{ color: '#38BDF8', fontWeight: 800 }}>Chrome Guard</strong> overlay displaying active verification badges on LinkedIn, Indeed, and Naukri.</p>
          </div>

        </div>
      </section>

      {/* ─── How It Works Timeline ─── */}
      <section id="how-it-works" style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto', zIndex: 10, position: 'relative' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 900, textAlign: 'center', marginBottom: 12, letterSpacing: '-0.02em' }}>How it works</h2>
        <p style={{ fontSize: '14px', color: '#94A3B8', textAlign: 'center', marginBottom: 60 }}>Four steps to verify any recruitment process.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          
          <div style={{
            background: 'linear-gradient(135deg, #0A0F1D 0%, #050811 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: 24,
            borderRadius: 12,
            textAlign: 'center',
            ...getActiveGlow('how-it-works')
          }}>
            <div style={{ fontSize: '20px', marginBottom: 12 }}>1️⃣</div>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>Paste Job</h3>
            <p style={{ color: '#94A3B8', fontSize: 12, lineHeight: 1.5 }}>Input the job description or enter the corporate email and URL.</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #0A0F1D 0%, #050811 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: 24,
            borderRadius: 12,
            textAlign: 'center',
            ...getActiveGlow('how-it-works')
          }}>
            <div style={{ fontSize: '20px', marginBottom: 12 }}>2️⃣</div>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>AI Analysis</h3>
            <p style={{ color: '#94A3B8', fontSize: 12, lineHeight: 1.5 }}>Neural models score the post for payment traps and recruitment spoofing.</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #0A0F1D 0%, #050811 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: 24,
            borderRadius: 12,
            textAlign: 'center',
            ...getActiveGlow('how-it-works')
          }}>
            <div style={{ fontSize: '20px', marginBottom: 12 }}>3️⃣</div>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>Risk Score</h3>
            <p style={{ color: '#94A3B8', fontSize: 12, lineHeight: 1.5 }}>Review the forensic breakdown, domain details, and check flags.</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #0A0F1D 0%, #050811 100%)',
            border: '1px solid rgba(34, 197, 94, 0.15)',
            padding: 24,
            borderRadius: 12,
            textAlign: 'center',
            ...getActiveGlow('how-it-works')
          }}>
            <div style={{ fontSize: '20px', marginBottom: 12 }}>4️⃣</div>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>Safe to Apply</h3>
            <p style={{ color: '#94A3B8', fontSize: 12, lineHeight: 1.5 }}>Submit applications confidently knowing your environment is secure.</p>
          </div>

        </div>
      </section>

      {/* ─── Browser Extension Section ─── */}
      <section id="extension" style={{
        padding: '100px 24px',
        background: 'rgba(255, 255, 255, 0.01)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)'
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: 16, letterSpacing: '-0.02em' }}>One-Click Protection.</h2>
            <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Install the Chrome Extension to audit recruiters directly in your browser. Auto-detects job postings on supported boards and highlights threat markers.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle2 size={16} color="#22C55E" /> Real-time active tab HTML auditing</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle2 size={16} color="#22C55E" /> Auto-hides on non-supported sites</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 280,
              background: 'linear-gradient(135deg, #0A0F1D 0%, #050811 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: 20,
              ...getActiveGlow('extension')
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 20, height: 20, borderRadius: 5, background: 'linear-gradient(135deg, #38BDF8, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🛡️</div>
                <span style={{ fontSize: 11, fontWeight: 800 }}>JobShield Guard</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#22C55E' }}>🟢 SAFE</div>
                <div style={{ width: 64, height: 64, borderRadius: '50%', border: '4px solid #22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900 }}>3%</div>
                <div style={{ fontSize: 9, color: '#64748B' }}>Risk Score</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Customer Support Block ─── */}
      <section id="support" style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto', zIndex: 10, position: 'relative' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0A0F1D 0%, #050811 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '20px',
          padding: '48px',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '40px',
          alignItems: 'center',
          ...getActiveGlow('support', '0 20px 48px rgba(0,0,0,0.5)')
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38BDF8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              <ShieldCheck size={14} /> Security Desk
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#F8FAFC', margin: 0, letterSpacing: '-0.02em' }}>Customer support</h2>
            <p style={{ fontSize: '14px', color: '#94A3B8', marginTop: '12px', lineHeight: 1.6, maxWidth: '440px' }}>
              Connect with our in-house team of <strong style={{ color: '#38BDF8', fontWeight: 800 }}>security analysts</strong>. Have questions about a suspicious scan report or custom organization setups? We are online and ready to assist.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button
              onClick={() => onGetStarted('register')}
              style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px',
                borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                color: '#CBD5E1', fontWeight: 700, fontSize: '13px', textAlign: 'left', transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#38BDF8'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><MessageSquare size={16} color="#38BDF8" /> Live Security Chat</span>
              <ArrowRight size={14} color="#64748B" />
            </button>

            <button
              onClick={() => window.location.href = `mailto:${JOBSHIELD_CONTACT_EMAIL}`}
              style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px',
                borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                color: '#CBD5E1', fontWeight: 700, fontSize: '13px', textAlign: 'left', transition: 'all 0.15s ease',
                width: '100%'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Mail size={16} color="#3b82f6" /> {JOBSHIELD_CONTACT_EMAIL}</span>
              <ArrowRight size={14} color="#64748B" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Common Questions Accordions ─── */}
      <section id="faq" style={{ padding: '80px 24px 120px', maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '64px', zIndex: 10, position: 'relative' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38BDF8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            <HelpCircle size={14} /> FAQ
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#F8FAFC', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Common <br/>questions
          </h2>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginTop: '16px', lineHeight: 1.6 }}>
            All the answers you need about our verification engines, browser security sandboxes, and enterprise integrations.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, index) => {
            const active = activeFaq === index;
            const isFaqActiveInShowcase = tourSteps[currentStep].id === 'faq' && active;
            return (
              <div
                key={index}
                style={{
                  background: 'linear-gradient(135deg, #0A0F1D 0%, #050811 100%)',
                  border: `1px solid ${isFaqActiveInShowcase ? '#38BDF8' : (active ? '#38BDF8' : 'rgba(255, 255, 255, 0.05)')}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transform: isFaqActiveInShowcase ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isFaqActiveInShowcase ? '0 10px 20px rgba(56, 189, 248, 0.1)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    color: '#F8FAFC',
                    fontWeight: 700,
                    fontSize: '14px',
                    textAlign: 'left'
                  }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    color="#64748B"
                    style={{ transform: active ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                  />
                </button>
                {active && (
                  <div style={{ padding: '0 24px 20px 24px', fontSize: '13px', color: '#94A3B8', lineHeight: 1.6 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Floating Demo Walkthrough & Showcase Controller ─── */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        background: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: 16,
        padding: 20,
        width: 320,
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.1)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isTourActive ? '#22C55E' : '#64748B',
              boxShadow: isTourActive ? '0 0 8px #22C55E' : 'none'
            }} />
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.04em' }}>
              Showcase Walkthrough
            </span>
          </div>
          <button
            onClick={() => setIsTourActive(!isTourActive)}
            style={{
              background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6,
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#38BDF8'
            }}
          >
            {isTourActive ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        <div>
          <div style={{ fontSize: 10, color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase' }}>
            {tourSteps[currentStep].name}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginTop: 4 }}>
            {tourSteps[currentStep].title}
          </div>
          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 6, margin: 0, lineHeight: 1.5 }}>
            {tourSteps[currentStep].description}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginTop: 4 }}>
          {tourSteps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => handleManualStep(idx)}
              style={{
                height: 6, borderRadius: 3, border: 'none',
                background: currentStep === idx ? '#38BDF8' : 'rgba(255, 255, 255, 0.1)',
                cursor: 'pointer'
              }}
              title={step.name}
            />
          ))}
        </div>
      </div>

      {/* Footer Section */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#050811', padding: '64px 48px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 40, maxWidth: 1100, margin: '0 auto', marginBottom: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Shield size={24} color="#38BDF8" />
              <span style={{ fontSize: 18, fontWeight: 900 }}>JobShield AI</span>
            </div>
            <div style={{ fontSize: 13, color: '#64748B' }}>Made with 🛡️ for safer career searches.</div>
            <div style={{ fontSize: 12.5, color: '#475569', marginTop: 12 }}>
              Project Contact: <a href={`mailto:${JOBSHIELD_CONTACT_EMAIL}`} style={{ color: '#38BDF8', textDecoration: 'underline' }}>{JOBSHIELD_CONTACT_EMAIL}</a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 64, fontSize: 13 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontWeight: 800, color: '#F8FAFC' }}>Platform</span>
              <a href="#features" style={{ color: '#64748B', textDecoration: 'none' }}>Features</a>
              <a href="#how-it-works" style={{ color: '#64748B', textDecoration: 'none' }}>How It Works</a>
              <a href="#extension" style={{ color: '#64748B', textDecoration: 'none' }}>Extension</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontWeight: 800, color: '#F8FAFC' }}>Resources</span>
              <a href="/privacy" style={{ color: '#64748B', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="/terms" style={{ color: '#64748B', textDecoration: 'none' }}>Terms & Conditions</a>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 24, textAlign: 'center', fontSize: 12, color: '#475569' }}>
          &copy; {new Date().getFullYear()} {JOBSHIELD_PROJECT_NAME}. All rights reserved.
        </div>
      </footer>

    </div>
  );
}
