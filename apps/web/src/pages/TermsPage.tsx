import React from 'react';
import { Shield, ArrowLeft, Mail } from 'lucide-react';
import { JOBSHIELD_CONTACT_EMAIL, JOBSHIELD_PROJECT_NAME } from '../utils/constants';

interface TermsPageProps {
  onBack: () => void;
}

export function TermsPage({ onBack }: TermsPageProps) {
  return (
    <div style={{
      minHeight: '100vh',
      color: '#F8FAFC',
      background: '#040712',
      fontFamily: 'var(--font)',
      position: 'relative',
      overflowX: 'hidden',
      padding: '24px 24px'
    }}>
      {/* Grid Overlay */}
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

      <div style={{
        position: 'absolute',
        top: '5%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.05) 0%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Header Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '20px' }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              color: '#F8FAFC',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#38BDF8'; e.currentTarget.style.color = '#38BDF8'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#F8FAFC'; }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={22} color="#38BDF8" />
            <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.015em' }}>JobShield AI</span>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.025em' }}>Terms & Conditions</h1>
          <div style={{ fontSize: '14px', color: '#38BDF8', fontWeight: 700, marginTop: '6px' }}>{JOBSHIELD_PROJECT_NAME}</div>
          <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '4px' }}>Last Updated: August 18, 2026</div>
        </div>

        {/* Content Body */}
        <div style={{
          fontSize: '14.5px',
          color: '#CBD5E1',
          lineHeight: '1.7',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          textAlign: 'left'
        }}>
          
          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>1. Acceptance of Terms</h2>
            <p>These Terms & Conditions ("Terms") govern access to and use of JobShield AI ("JobShield", "we", "us", or "our"). JobShield AI is a student software project developed for educational, development, and demonstration purposes. By creating an account or using JobShield, you acknowledge and agree to these Terms. If you do not agree with these Terms, you should not create an account or use the service.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>2. Description of JobShield</h2>
            <p>JobShield is designed to demonstrate a system for identifying potential risks associated with online job postings. The project may provide: web-based job analysis, job-risk scoring, machine-learning analysis, risk indicators, scan history, saved jobs, browser extension functionality, account management, and support desk features. Features may change as the project develops.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>3. AI-Assisted Risk Assessment</h2>
            <p>JobShield uses automated, machine-learning, and rule-based techniques to evaluate job-posting information. Risk scores, classifications, confidence values, indicators, and explanations are generated by the system. They are estimates and should not be treated as definitive determinations that a job, company, recruiter, or employment opportunity is legitimate or fraudulent.</p>
            <p style={{ marginTop: '8px' }}>JobShield does not guarantee:</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
              <li>That every fraudulent job will be detected.</li>
              <li>That every legitimate job will receive a low-risk classification.</li>
              <li>That recruiter profiles or companies are genuine, or that postings are accurate.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>4. User Responsibility</h2>
            <p>Users are responsible for decisions they make based on information provided by JobShield. Before sending money, providing identity/financial documents, traveling for interviews, or downloading files requested by recruiters, users should independently verify the employer and recruiter. JobShield is a risk-analysis tool and is not a substitute for personal judgment or professional advice.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>5. Acceptable Use</h2>
            <p>Users agree to use JobShield lawfully and responsibly. Users must not attempt to gain unauthorized access, circumvent security, interfere with the application, access another user's account, submit malicious content, abuse APIs, bypass access controls, or reverse engineer the service for unauthorized purposes.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>6. Browser Extension</h2>
            <p>The JobShield browser extension is designed to analyze supported job postings. Users are responsible for using the extension in accordance with the terms and policies of the websites on which it is used. JobShield does not guarantee continued compatibility with third-party websites, as structure changes may affect extension functionality.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>7. Third-Party Websites</h2>
            <p>JobShield operates alongside third-party job platforms including LinkedIn, Indeed, Naukri, Internshala, and Glassdoor. These services have their own terms, policies, content, and availability rules. JobShield is not affiliated with or endorsed by these platforms unless explicitly stated. Users are responsible for complying with third-party terms.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>8. Accounts</h2>
            <p>Users must provide reasonably accurate information when creating a JobShield account, and are responsible for maintaining the security of their credentials. Contact the project administrator if you believe your account has been compromised. Users must not create accounts using another person's identity without authorization.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>9. Passwords</h2>
            <p>Users are responsible for maintaining a secure password. JobShield stores passwords using secure password-hashing mechanisms rather than plaintext storage. Users should avoid reusing their JobShield password on other services.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>10. User Content and Job Data</h2>
            <p>Users should only submit information they are authorized to use. JobShield may process publicly displayed or accessible job-posting information through its extension for analysis. Users should avoid intentionally submitting private, confidential, or unrelated personal information.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>11. Support Tickets</h2>
            <p>Support tickets should contain information relevant to the support request. Users should not submit passwords, authentication tokens, financial credentials, or unnecessary personal info. Project administrators may access support tickets to investigate and resolve issues.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>12. Intellectual Property</h2>
            <p>The JobShield application, original interface designs, software, documentation, branding, and project-specific content are owned by or licensed to the project owner. Users may use JobShield for its intended purpose but may not reproduce or commercially exploit proprietary components. Third-party trademarks and logos remain the property of their respective owners.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>13. Availability</h2>
            <p>JobShield is a student/development project and may be modified, interrupted, or temporarily unavailable due to maintenance, system upgrades, model updates, or technical/security fixes. Continuous or uninterrupted availability is not guaranteed.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>14. Accuracy of Job Information</h2>
            <p>JobShield does not control the content of third-party job postings. Postings may contain inaccurate or outdated details, fraudulent claims, misleading salaries, recruiter impersonations, or malicious links. JobShield's analysis provides an additional risk signal and does not guarantee job posting accuracy.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>15. No Guarantee of Employment</h2>
            <p>JobShield does not guarantee employment, interviews, recruiter responses, job availability, employer legitimacy, salary verification, or successful applications.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>16. Educational and Demonstration Purpose</h2>
            <p>JobShield is developed as a student software project for educational and demonstration purposes. It demonstrates web development, machine learning risk detection, and browser extension orchestration. It should not be interpreted as a certified employment-verification service or professional fraud-investigation tool.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>17. Disclaimer</h2>
            <p>To the extent permitted by applicable law, JobShield is provided on an "as available" basis. The project does not guarantee that every scam is detected, that legitimate jobs receive low risk ratings, or that analysis results are always accurate. Users should independently verify important employment decisions. Nothing in these Terms excludes liability that cannot legally be excluded under applicable law.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>18. Limitation of Liability</h2>
            <p>To the extent permitted by applicable law, the project owner shall not be responsible for losses arising solely from a user's reliance on automated job-risk assessments. Users remain responsible for evaluating opportunities and making their own career decisions.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>19. Account Suspension or Termination</h2>
            <p>Access may be restricted or terminated to protect the application, address security threats, respond to abuse, or enforce these Terms. Users may contact the project administrator regarding account-related concerns.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>20. Account Deletion</h2>
            <p>Users can permanently delete their JobShield account through the available Settings page controls. Account deletion is permanent and removes settings, saved-job relationships, analysis records, and flags. Shared job records referenced by other users remain.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>21. Changes to These Terms</h2>
            <p>These Terms may be updated when the project, its features, or requirements change. The Last Updated date identifies the current version.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>22. Governing Law</h2>
            <p>JobShield is currently a student/development project. Any future commercial deployment should specify the appropriate governing law and jurisdiction after obtaining appropriate legal advice. No specific jurisdiction is claimed by these Terms at the current project stage.</p>
          </section>

          <section style={{ background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.15)', borderRadius: '12px', padding: '20px', marginTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={18} color="#38BDF8" />
              23. Contact
            </h2>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <div><strong>JobShield AI — Student Project</strong></div>
              <div style={{ marginTop: '4px' }}>
                Email:{' '}
                <a
                  href={`mailto:${JOBSHIELD_CONTACT_EMAIL}`}
                  style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'underline' }}
                >
                  {JOBSHIELD_CONTACT_EMAIL}
                </a>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
