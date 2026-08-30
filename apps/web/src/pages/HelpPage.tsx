import React from 'react';
import { JOBSHIELD_CONTACT_EMAIL } from '../utils/constants';
import {
  PageHeader,
  AnalyticsCard,
  Btn,
  TextInput,
} from '../components/ui';
import { BookOpen, Search, HelpCircle, Mail, MessageSquare, ShieldCheck, FileText, ArrowRight } from 'lucide-react';

export function HelpPage() {
  const faqs = [
    {
      q: 'How does the Fraud Detection Index work?',
      a: 'JobShield AI uses a multi-layer pipeline combining NLP keyword extraction, WHOIS domain age checks, SSL validation, and an XGBoost machine learning model trained on over 150,000 job listings.'
    },
    {
      q: 'What should I do if a job requires Telegram interviews?',
      a: 'Telegram or WhatsApp text-only interviews combined with requests to deposit home office equipment checks are a classic 99%+ scam indicator. Do not engage or send money.'
    },
    {
      q: 'How do I install the Chrome Extension?',
      a: 'Navigate to the Chrome Extension tab in the sidebar, download the extension package, open chrome://extensions in developer mode, and click "Load Unpacked".'
    },
    {
      q: 'Can I export forensic PDF reports for enterprise compliance?',
      a: 'Yes! Navigate to the Reports tab to download full forensic whitepaper PDFs containing evidence logs, WHOIS records, and ML model confidence scores.'
    }
  ];

  return (
    <div className="animate-slide">
      <PageHeader
        category="Support & Knowledge Base"
        title="Help & Support"
        subtitle="Search user guides, FAQs, fraud pattern documentation, or contact enterprise security engineers."
      />

      {/* Search Help Articles */}
      <AnalyticsCard title="Search Knowledge Base" subtitle="Type a keyword to find documentation and security answers">
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <TextInput placeholder="Search e.g. Telegram scam, WHOIS check, PDF reports, API keys..." icon={<Search size={18} />} />
          </div>
          <Btn variant="primary" icon={<Search size={16} />}>Search Articles</Btn>
        </div>
      </AnalyticsCard>

      <div style={{ height: '32px' }} />

      {/* Quick Help Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <BookOpen size={22} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>User Guide</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>Complete walkthrough of job scanning, company verification, and extensions.</div>
          <a href="#guide" style={{ color: '#38BDF8', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>Read Guide →</a>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <ShieldCheck size={22} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Fraud Patterns</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>Detailed breakdown of fake check, Telegram, and reshipping mule schemes.</div>
          <a href="#patterns" style={{ color: '#22C55E', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>View Patterns →</a>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <FileText size={22} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>API Reference</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>REST endpoints for integrating job scanning into ATS platforms.</div>
          <a href="#api" style={{ color: '#F59E0B', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>API Specs →</a>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <MessageSquare size={22} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Contact Support</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>Dedicated support for student project configurations.</div>
          <a href={`mailto:${JOBSHIELD_CONTACT_EMAIL}`} style={{ color: '#6366f1', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>Email Support →</a>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <AnalyticsCard title="Frequently Asked Questions" subtitle="Common questions regarding threat detection and accuracy">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {faqs.map((faq, idx) => (
            <div key={idx} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <HelpCircle size={16} color="#38BDF8" />
                {faq.q}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, paddingLeft: 24 }}>
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </AnalyticsCard>
    </div>
  );
}
