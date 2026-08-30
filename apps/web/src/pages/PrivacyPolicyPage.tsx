import React from 'react';
import { Shield, ArrowLeft, Mail } from 'lucide-react';
import { JOBSHIELD_CONTACT_EMAIL, JOBSHIELD_PROJECT_NAME } from '../utils/constants';

interface PrivacyPolicyPageProps {
  onBack: () => void;
}

export function PrivacyPolicyPage({ onBack }: PrivacyPolicyPageProps) {
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
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.025em' }}>Privacy Policy</h1>
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
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>1. Introduction</h2>
            <p>JobShield AI is a student software project developed to demonstrate an AI-assisted job-posting risk analysis system. JobShield is designed to help users identify potentially fraudulent, suspicious, or high-risk employment opportunities through a web application and browser extension. This Privacy Policy explains what information the JobShield project may process, how that information is used, how it is stored, and the choices available to users. By creating an account or using JobShield, you acknowledge the practices described in this Privacy Policy.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>2. Information We Collect</h2>
            <p>Depending on how you use JobShield, the application may process the following categories of information.</p>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#38BDF8', marginTop: '12px', marginBottom: '6px' }}>2.1 Account Information</h3>
            <p>When you create a JobShield account, the application may store:</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
              <li>Full name</li>
              <li>Email address</li>
              <li>Account identifier</li>
              <li>Account role</li>
              <li>Account creation date</li>
              <li>Password information in the form of a securely hashed password</li>
            </ul>
            <p style={{ marginTop: '8px' }}>JobShield does not store account passwords in plaintext.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>3. Information Accessed by the Browser Extension</h2>
            <p>When the JobShield browser extension is used on a supported job-posting website, it may access information associated with the job posting currently being viewed. Depending on what is available on the website, this may include:</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
              <li>Job title and company name</li>
              <li>Job description and posting URL</li>
              <li>Salary or compensation details, job location, and employment type</li>
              <li>Experience requirements and recruiter details where present</li>
            </ul>
            <p style={{ marginTop: '8px' }}>The extension is designed to process information related to job postings. It is not designed to collect a user's entire browsing history or unrelated browsing activity.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>4. Supported Job Platforms</h2>
            <p>The current JobShield browser extension supports job analysis on: LinkedIn, Indeed, Naukri, Internshala, and Glassdoor. These platforms are independent third-party services. JobShield is not owned or operated by these services and does not control their content, availability, privacy practices, or terms.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>5. How We Use Information</h2>
            <p>Information processed by JobShield may be used to create and maintain user accounts, authenticate users, analyze job postings, generate job-risk assessments/scores, display analysis results, maintain scan history and saved jobs, provide support ticket functionality, diagnose technical problems, and protect the application from unauthorized access.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>6. Job Analysis and Machine Learning</h2>
            <p>JobShield uses automated, machine-learning, and rule-based techniques to evaluate job-posting information. The analysis may consider descriptions, compensation details, company history, and registration signals to produce a risk classification, risk score, confidence index, and indicator explanations. JobShield's analysis is an automated risk assessment and should not be considered a guarantee. A job classified as low risk is not guaranteed to be legitimate, and a job classified as high risk is not automatically proven to be fraudulent. Users should independently verify opportunities before providing money, documents, or accepting employment.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>7. Where Analysis Is Performed</h2>
            <p>JobShield's current analysis pipeline uses its backend and machine-learning/rule-based services to process job-posting information. The project is designed around its own analysis pipeline and does not intentionally provide job-posting information to external generative-AI providers for the purpose of performing the JobShield risk analysis.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>8. Scan History</h2>
            <p>When an authenticated user analyzes a job, JobShield may store information associated with that analysis, including job details, risk scores, indicators, and timestamps in relation to the user's account. Users can use "Wipe Scan History" to remove their history. Deleting analysis history does not delete a job record that remains referenced by another user's analysis or saved job.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>9. Saved Jobs</h2>
            <p>If you save a job using JobShield, information associated with that saved job is stored in your account so it remains available across sessions. Wiping scan history does not automatically remove saved jobs, but they can be manually deleted through the application's available controls.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>10. Support Tickets</h2>
            <p>When you submit a support ticket, JobShield may store your account ID, subject, message, status, and timestamps. Authorized administrators may access support tickets to respond to requests. Users should avoid including passwords, credentials, or financial information in support tickets.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>11. Profile Information</h2>
            <p>JobShield may store profile information including name, email address, profile avatar image, and account settings. This information is directly associated with the user's account.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>12. Authentication and Session Information</h2>
            <p>JobShield uses authentication tokens to maintain authenticated sessions and authorize API requests. The web application stores session tokens in local browser storage. Users are responsible for protecting access to their browser and credentials.</p>
            <p style={{ marginTop: '8px', color: '#F87171' }}>
              <strong>Current Authentication Limitation:</strong> The current project uses stateless JWT-based authentication and does not maintain a server-side session blacklist for immediately invalidating all previously issued tokens. As a result, the current "Logout from All Devices" functionality does not provide server-side invalidation of every previously issued authentication token.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>13. Data Storage</h2>
            <p>Depending on how JobShield is used, the backend database stores account details, hashed passwords, user settings, job metadata, analysis logs, saved jobs, and support tickets. Reasonable technical measures are used to protect stored information, but no internet-connected application can guarantee absolute security.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>14. Data Retention</h2>
            <p>JobShield retains information for as long as necessary for the application's functionality. The project does not use a single fixed automatic deletion period for every category of data. Users can manually delete scan histories, saved jobs, and their accounts. When an account is deleted, the application removes the account and associated user-owned data. Some shared job records may remain where referenced by other active users.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>15. Account Deletion</h2>
            <p>Users can permanently delete their account through Settings → Account → Delete Account. This removes the account, settings, saved-job associations, analysis records, and flags. Shared job records referenced by other users remain.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>16. Data Sharing</h2>
            <p>JobShield does not sell user account information or job-analysis information. Information may be accessible to project administrators for support, technical infrastructure providers, or where disclosure is required by law. The project does not intentionally provide job-posting information to external generative-AI providers for the purpose of performing JobShield's analysis.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>17. Third-Party Websites</h2>
            <p>The JobShield browser extension operates alongside third-party job platforms. These platforms collect and process information according to their own privacy policies. JobShield does not control third-party website availability, content, or privacy practices. Users should review the policies of third-party platforms they use.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>18. Your Choices</h2>
            <p>Users can update profile details, change passwords, upload/remove avatars, delete saved jobs, wipe scan history, submit support tickets, delete their accounts, or uninstall the browser extension at any time.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>19. Privacy Questions and Requests</h2>
            <p>If you have questions about this Privacy Policy or how JobShield handles information, contact the project team at the contact details below.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>20. Changes to This Privacy Policy</h2>
            <p>This Privacy Policy may be updated if the project, its functionality, or its data practices change. The Last Updated date identifies the current version.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>21. Children's Privacy</h2>
            <p>JobShield is a general-purpose job-analysis project and is not specifically designed for children. Users should not provide personal information belonging to another person without appropriate authorization.</p>
          </section>

          <section style={{ background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.15)', borderRadius: '12px', padding: '20px', marginTop: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={18} color="#38BDF8" />
              22. Contact
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
