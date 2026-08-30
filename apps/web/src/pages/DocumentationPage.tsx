import React, { useState } from 'react';
import {
  PageHeader,
  AnalyticsCard,
  Btn,
  TextInput,
  StatusBadge,
} from '../components/ui';
import {
  Search, BookOpen, Code, Layers, Rocket, Shield, Users,
  Copy, Check, ChevronRight, Terminal, Server, Cpu, ExternalLink
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  category: string;
  snippet?: string;
  content: React.ReactNode;
}

export function DocumentationPage() {
  const [activeTab, setActiveTab] = useState<string>('getting-started');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(id);
    setTimeout(() => {
      setCopiedSnippet(null);
    }, 2000);
  };

  const codeExamples = {
    pythonSdk: `from jobshield import JobShieldClient

# Initialize JobShield SDK
client = JobShieldClient(api_key="js_live_9f823a10b42c449d")

# Analyze a job posting for scam patterns
result = client.analyze_job(
    company="Apex Logistics",
    title="Data Entry Specialist",
    description="Work from home, Telegram interview required, $75/hr check provided.",
    recruiter_email="hiring.apex@gmail.com"
)

print(f"Risk Score: {result.score}/100")
print(f"Scam Verdict: {result.verdict}")
# Output: Risk Score: 89/100 (HIGH RISK)`,

    curlPostScan: `curl -X POST "https://api.jobshield.ai/v1/jobs/scan" \\
  -H "Authorization: Bearer js_live_9f823a10b42c449d" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jobTitle": "Quality Control Inspector",
    "company": "Express Cargo Solutions",
    "description": "Receive packages at personal address and reship to international clients.",
    "recruiterEmail": "recruiter@expresscargo-jobs.net",
    "url": "https://expresscargo-jobs.net/careers"
  }'`,

    jsonResponse: `{
  "status": "success",
  "score": 68,
  "confidence": 91,
  "flagsCount": 3,
  "verdict": "HIGH_RISK",
  "indicators": [
    {
      "name": "Package Reshipping Operation",
      "severity": "danger",
      "description": "Receiving and reshipping packages at personal residence indicates stolen goods mule trafficking."
    },
    {
      "name": "Free Webmail Recruiter Address",
      "severity": "danger",
      "description": "Recruiter domain @expresscargo-jobs.net registered 14 days ago."
    }
  ],
  "timestamp": "2026-08-04T13:30:00Z"
}`,

    dockerCompose: `version: '3.8'
services:
  jobshield-api:
    image: jobshield/core-api:v2.1.0
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis-cache:6379/0
      - DB_URL=postgresql://user:pass@db:5432/jobshield
    depends_on:
      - redis-cache
      - db

  redis-cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"`
  };

  const docSections: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started Quickstart',
      icon: <BookOpen size={20} />,
      category: 'Overview',
      snippet: 'Set up JobShield AI SDK and run your first job scam threat evaluation in under 2 minutes.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              1. Install the SDK / Import REST Client
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
              Install the official JobShield AI Python SDK or invoke our HTTPS REST API directly from your application or Applicant Tracking System (ATS).
            </p>

            <div style={{ background: '#0B1220', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>pip install jobshield-python</span>
                <button
                  onClick={() => handleCopyCode('pip install jobshield-python', 'pip')}
                  style={{ background: 'transparent', border: 'none', color: copiedSnippet === 'pip' ? '#22C55E' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                >
                  {copiedSnippet === 'pip' ? <Check size={14} /> : <Copy size={14} />}
                  {copiedSnippet === 'pip' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 13, color: '#F8FAFC' }}>
                <code>pip install jobshield-python</code>
              </pre>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              2. Python SDK Code Sample
            </h3>
            <div style={{ background: '#0B1220', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>quickstart.py</span>
                <button
                  onClick={() => handleCopyCode(codeExamples.pythonSdk, 'python')}
                  style={{ background: 'transparent', border: 'none', color: copiedSnippet === 'python' ? '#22C55E' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                >
                  {copiedSnippet === 'python' ? <Check size={14} /> : <Copy size={14} />}
                  {copiedSnippet === 'python' ? 'Copied Code!' : 'Copy Code'}
                </button>
              </div>
              <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 13, color: '#CBD5E1', overflowX: 'auto', lineHeight: 1.6 }}>
                <code>{codeExamples.pythonSdk}</code>
              </pre>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'api-reference',
      title: 'REST API Endpoints Reference',
      icon: <Code size={20} />,
      category: 'Developer API',
      snippet: 'HTTPS REST API specifications for job scanning, WHOIS verification, and forensic report generation.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <StatusBadge status="safe" label="POST" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>/api/v1/jobs/scan</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
              Submit raw job posting text, company name, recruiter email, and URL to receive real-time fraud index scoring.
            </p>

            <div style={{ background: '#0B1220', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>cURL Request</span>
                <button
                  onClick={() => handleCopyCode(codeExamples.curlPostScan, 'curl')}
                  style={{ background: 'transparent', border: 'none', color: copiedSnippet === 'curl' ? '#22C55E' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                >
                  {copiedSnippet === 'curl' ? <Check size={14} /> : <Copy size={14} />}
                  {copiedSnippet === 'curl' ? 'Copied!' : 'Copy cURL'}
                </button>
              </div>
              <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 13, color: '#CBD5E1', overflowX: 'auto', lineHeight: 1.5 }}>
                <code>{codeExamples.curlPostScan}</code>
              </pre>
            </div>

            <div style={{ background: '#0B1220', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#22C55E', fontFamily: 'var(--font-mono)' }}>200 OK Response Payload</span>
                <button
                  onClick={() => handleCopyCode(codeExamples.jsonResponse, 'json')}
                  style={{ background: 'transparent', border: 'none', color: copiedSnippet === 'json' ? '#22C55E' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                >
                  {copiedSnippet === 'json' ? <Check size={14} /> : <Copy size={14} />}
                  {copiedSnippet === 'json' ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
              <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 13, color: '#CBD5E1', overflowX: 'auto', lineHeight: 1.5 }}>
                <code>{codeExamples.jsonResponse}</code>
              </pre>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'architecture',
      title: 'ML Pipeline & Architecture',
      icon: <Layers size={20} />,
      category: 'System Design',
      snippet: 'Deep dive into XGBoost feature weights, TF-IDF vectorization, and WHOIS domain age algorithms.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
            JobShield AI combines heuristic domain analysis with a trained XGBoost classifier evaluating over 150,000 historic employment scam datasets.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
              <div style={{ fontWeight: 600, color: '#38BDF8', fontSize: 15, marginBottom: 8 }}>1. TF-IDF Text Vectorizer</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Extracts unigram & bigram features targeting suspicious triggers like "equipment check", "Telegram interview", and "Zelle wire".
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
              <div style={{ fontWeight: 600, color: '#22C55E', fontSize: 15, marginBottom: 8 }}>2. WHOIS & SSL Signal Engine</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Queries registrar age, privacy shields, MX record alignment, and DigiCert/EV SSL status in under 18ms.
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'deployment',
      title: 'Docker Deployment Guide',
      icon: <Rocket size={20} />,
      category: 'Infrastructure',
      snippet: 'Self-host JobShield AI on AWS, GCP, or Azure using Docker Compose container orchestration.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
            Run the entire JobShield AI microservices stack locally or in your corporate VPC using our production `docker-compose.yml` blueprint.
          </p>

          <div style={{ background: '#0B1220', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B', fontFamily: 'var(--font-mono)' }}>docker-compose.yml</span>
              <button
                onClick={() => handleCopyCode(codeExamples.dockerCompose, 'docker')}
                style={{ background: 'transparent', border: 'none', color: copiedSnippet === 'docker' ? '#22C55E' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
              >
                {copiedSnippet === 'docker' ? <Check size={14} /> : <Copy size={14} />}
                {copiedSnippet === 'docker' ? 'Copied!' : 'Copy YAML'}
              </button>
            </div>
            <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 13, color: '#CBD5E1', overflowX: 'auto', lineHeight: 1.5 }}>
              <code>{codeExamples.dockerCompose}</code>
            </pre>
          </div>
        </div>
      )
    }
  ];

  const filteredSections = docSections.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.snippet?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeDoc = docSections.find(doc => doc.id === activeTab) || docSections[0];

  return (
    <div className="animate-slide">
      <PageHeader
        category="Developer Hub"
        title="Documentation & API Portal"
        subtitle="Complete developer guides, REST API specifications, SDK code samples, and architecture blueprints."
      />

      {/* Live Interactive Search Bar */}
      <AnalyticsCard title="Search Developer Knowledge Base" subtitle="Find API endpoints, SDK installation, or deployment guides">
        <TextInput
          placeholder="Search e.g. /v1/jobs/scan, cURL, Python SDK, Docker, XGBoost..."
          icon={<Search size={18} />}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </AnalyticsCard>

      <div style={{ height: '32px' }} />

      {/* Two-Column Documentation Portal */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
        
        {/* Navigation Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 8px 4px' }}>
            Documentation Topics
          </div>

          {filteredSections.map(doc => {
            const active = activeTab === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => setActiveTab(doc.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: '10px', border: 'none',
                  background: active ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-surface)',
                  color: active ? '#38BDF8' : 'var(--text-muted)',
                  cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14,
                  fontWeight: active ? 600 : 500, textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: active ? '0 4px 12px rgba(56, 189, 248, 0.15)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget.style.background = 'var(--bg-hover)');
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget.style.background = 'var(--bg-surface)');
                }}
              >
                <span style={{ color: active ? '#38BDF8' : 'var(--text-dim)' }}>{doc.icon}</span>
                <span style={{ flex: 1 }}>{doc.title}</span>
                <ChevronRight size={14} opacity={active ? 1 : 0.4} />
              </button>
            );
          })}
        </div>

        {/* Active Documentation Content Area */}
        <AnalyticsCard title={activeDoc.title} subtitle={activeDoc.snippet}>
          {activeDoc.content}
        </AnalyticsCard>

      </div>
    </div>
  );
}
