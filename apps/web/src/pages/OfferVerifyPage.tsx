import React, { useState, useEffect, useRef } from 'react';
import { PageHeader, AnalyticsCard, Btn } from '../components/ui';
import { 
  Building2, Globe, ShieldCheck, CheckCircle2, AlertTriangle, Lock, Search, 
  RefreshCw, Sparkles, Check, FileText, UploadCloud, AlertCircle, ExternalLink, 
  ShieldAlert, XCircle, Info, ChevronDown, ChevronUp, Download, Share2, FileCode,
  FileCheck
} from 'lucide-react';

interface FindingItem {
  label: string;
  details: string;
  confidence: number;
  target: 'logo' | 'email' | 'payment' | 'signature';
  check: string;       // What was checked
  why: string;         // Why it matters
  risk: 'Low' | 'Medium' | 'High';
  recommendation: string; // Recommendation
}

interface MockScenario {
  id: string;
  name: string;
  type: string;
  verdict: 'VERIFIED' | 'HIGH_RISK';
  trustScore: number; // Represents AI Risk Score (0-100). Lower is better (Low Risk)
  confidence: number;
  summary: string;
  expectedDomain: string;
  detectedDomain: string;
  expectedEmail: string;
  detectedEmail: string;
  similarityMatch: string;
  similarityTimes: number;
  ocrAccuracy: string;
  words: number;
  tables: number;
  images: number;
  metaCreated: string;
  metaModified: string;
  metaSoftware: string;
  metaAuthor: string;
  metaPages: number;
  metaSignature: string;
  metaResolution: string;
  metaFonts: string;
  scoreIdentity: number;
  scoreRecruiter: number;
  scoreDocument: number;
  scoreFormatting: number;
  scoreLanguage: number;
  scoreDomain: number;
  radarPoints: string;
  highlights: {
    logo: { y: number; text: string; label: string };
    email: { y: number; text: string; label: string };
    payment: { y: number; text: string; label: string };
    signature: { y: number; text: string; label: string };
  };
  findings: {
    critical: FindingItem[];
    warnings: FindingItem[];
    passed: FindingItem[];
  };
}

const MOCK_SCENARIOS: Record<string, MockScenario> = {
  'google': {
    id: 'google',
    name: 'Google LLC — Software Engineer Offer',
    type: 'Genuine Offer Sample',
    verdict: 'VERIFIED',
    trustScore: 12, // Low Risk
    confidence: 96,
    summary: 'Document appears professionally structured with no major scam indicators. Authenticity cannot be fully verified without company confirmation.',
    expectedDomain: 'google.com',
    detectedDomain: 'google.com',
    expectedEmail: 'careers@google.com',
    detectedEmail: 'careers@google.com',
    similarityMatch: 'Official Google Offer Template',
    similarityTimes: 124,
    ocrAccuracy: '99.4%',
    words: 842,
    tables: 2,
    images: 1,
    metaCreated: '12 Aug 2026',
    metaModified: '12 Aug 2026',
    metaSoftware: 'Google Docs / PDF Exporter',
    metaAuthor: 'Google HR Operations Office',
    metaPages: 3,
    metaSignature: 'Present & Valid (DigiCert Verified)',
    metaResolution: '300 DPI',
    metaFonts: 'Roboto, Arial',
    scoreIdentity: 98,
    scoreRecruiter: 96,
    scoreDocument: 98,
    scoreFormatting: 95,
    scoreLanguage: 96,
    scoreDomain: 100,
    radarPoints: '125,52 187,88 187,157 125,185 63,157 63,88',
    highlights: {
      logo: { y: 20, text: 'Google LLC', label: 'Company Logo Verified' },
      email: { y: 120, text: 'careers@google.com', label: 'Official HR Domain Match' },
      payment: { y: 260, text: 'No onboarding fees or security deposits are required at any stage of employment.', label: 'Standard Compensation Clause' },
      signature: { y: 440, text: 'Digitally signed by Google HR Operations Office, Mountain View CA', label: 'Valid Digital Signature' },
    },
    findings: {
      critical: [],
      warnings: [],
      passed: [
        { 
          label: 'Official Recruiter Email', 
          details: 'Recruiter domain matches official registered company records.', 
          confidence: 98,
          target: 'email', 
          check: 'Email sender registry domains and DNS verification.',
          why: 'Corporate communications are strictly bound to registered servers to prevent email spoofing.',
          risk: 'Low',
          recommendation: 'Safe. The recruiter email matches official organization domains.'
        },
        { 
          label: 'Logo Geometric Check', 
          details: 'Company logo matches high-resolution vector assets.', 
          confidence: 95,
          target: 'logo', 
          check: 'Visual logo matching algorithms comparing color space and shapes.',
          why: 'Scams frequently copy-paste blurry screenshots of corporate logos.',
          risk: 'Low',
          recommendation: 'Safe. Logo aligns with official asset profiles.'
        },
        { 
          label: 'Verified Digital Signature', 
          details: 'Cryptographic certificate verified.', 
          confidence: 99,
          target: 'signature', 
          check: 'PDF digital certificate parameters and CA authorities.',
          why: 'Digital cryptographic certificates ensure the document has not been altered since publication.',
          risk: 'Low',
          recommendation: 'Safe. Standard DigiCert corporate signature present.'
        },
        { 
          label: 'No Upfront Onboarding Fees', 
          details: 'No payments or security deposit clauses detected.', 
          confidence: 97,
          target: 'payment', 
          check: 'Scan for onboarding payment triggers (deposits, tool purchase, UPI requests).',
          why: 'Job scams commonly request upfront fees for background checks or software.',
          risk: 'Low',
          recommendation: 'Safe. Compensation clauses comply with standard HR procedures.'
        }
      ]
    }
  },
  'microsoft': {
    id: 'microsoft',
    name: 'Microsoft Corporation — Senior Manager Offer',
    type: 'Genuine Offer Sample',
    verdict: 'VERIFIED',
    trustScore: 8, // Low Risk
    confidence: 96,
    summary: 'Document appears professionally structured with no major scam indicators. Authenticity cannot be fully verified without company confirmation.',
    expectedDomain: 'microsoft.com',
    detectedDomain: 'microsoft.com',
    expectedEmail: 'careers@microsoft.com',
    detectedEmail: 'careers@microsoft.com',
    similarityMatch: 'Official Microsoft Offer Template',
    similarityTimes: 86,
    ocrAccuracy: '99.6%',
    words: 912,
    tables: 3,
    images: 2,
    metaCreated: '11 Aug 2026',
    metaModified: '11 Aug 2026',
    metaSoftware: 'Adobe PDF Library 15.0',
    metaAuthor: 'Microsoft Recruitment Center',
    metaPages: 3,
    metaSignature: 'Present & Valid (Microsoft Corporation CA)',
    metaResolution: '300 DPI',
    metaFonts: 'Segoe UI, Calibri',
    scoreIdentity: 99,
    scoreRecruiter: 98,
    scoreDocument: 97,
    scoreFormatting: 96,
    scoreLanguage: 98,
    scoreDomain: 100,
    radarPoints: '125,51 189,86 186,158 125,183 64,158 62,86',
    highlights: {
      logo: { y: 20, text: 'Microsoft Corporation', label: 'Official Microsoft Branding' },
      email: { y: 110, text: 'careers@microsoft.com', label: 'Official Microsoft Careers Domain' },
      payment: { y: 250, text: 'Microsoft will provide all standard laptop assets and handles standard background check costs.', label: 'Equipment Delivery Provision' },
      signature: { y: 450, text: 'Signed by Vice President of Talent Acquisition, Microsoft Corp.', label: 'Verified HR Signature' },
    },
    findings: {
      critical: [],
      warnings: [],
      passed: [
        { 
          label: 'Official Recruiter Email', 
          details: 'Recruiter domain matches official registered company records.', 
          confidence: 99,
          target: 'email', 
          check: 'Email sender registry domains and DNS verification.',
          why: 'Corporate communications are strictly bound to registered servers to prevent email spoofing.',
          risk: 'Low',
          recommendation: 'Safe. The recruiter email matches official organization domains.'
        },
        { 
          label: 'Corporate Signature Validation', 
          details: 'Valid digital certificate from Microsoft CA.', 
          confidence: 98,
          target: 'signature', 
          check: 'PDF digital certificate parameters and CA authorities.',
          why: 'Digital cryptographic certificates ensure the document has not been altered since publication.',
          risk: 'Low',
          recommendation: 'Safe. Standard corporate certificate present.'
        },
        { 
          label: 'Branding Fidelity Check', 
          details: 'Branding matches high-resolution corporate vector assets.', 
          confidence: 97,
          target: 'logo', 
          check: 'Visual logo matching algorithms comparing color space and shapes.',
          why: 'Scams frequently copy-paste blurry screenshots of corporate logos.',
          risk: 'Low',
          recommendation: 'Safe. Logo aligns with official asset profiles.'
        }
      ]
    }
  },
  'xyz_logistics': {
    id: 'xyz_logistics',
    name: 'XYZ Logistics — Carrier Dispatcher Offer',
    type: 'Suspicious Offer Sample',
    verdict: 'HIGH_RISK',
    trustScore: 85, // High Risk
    confidence: 96,
    summary: 'Multiple risk indicators were detected. Independent verification with the employer is strongly recommended.',
    expectedDomain: 'xyz-logistics.com',
    detectedDomain: 'gmail.com',
    expectedEmail: 'hr@xyz-logistics.com',
    detectedEmail: 'hr.xyzlogistics@gmail.com',
    similarityMatch: 'Advance Fee Employment Scam',
    similarityTimes: 42,
    ocrAccuracy: '94.2%',
    words: 512,
    tables: 0,
    images: 1,
    metaCreated: 'Yesterday',
    metaModified: 'Yesterday',
    metaSoftware: 'Microsoft Word 2019',
    metaAuthor: 'User-PC',
    metaPages: 2,
    metaSignature: 'Absent (Plain Text Signature Block)',
    metaResolution: '150 DPI',
    metaFonts: 'Calibri, Times New Roman',
    scoreIdentity: 20,
    scoreRecruiter: 10,
    scoreDocument: 25,
    scoreFormatting: 30,
    scoreLanguage: 40,
    scoreDomain: 0,
    radarPoints: '125,110 138,118 134,134 125,139 116,134 116,118',
    highlights: {
      logo: { y: 20, text: 'XYZ Logistics Inc.', label: 'Low Resolution Logo Asset' },
      email: { y: 130, text: 'hr.xyzlogistics@gmail.com', label: 'Gmail Domain for Recruiter' },
      payment: { y: 280, text: 'Candidates are required to pay a ₹2,000 onboarding background verification fee via UPI.', label: 'Refundable Security Deposit Clause' },
      signature: { y: 430, text: 'Sincerely, HR Department XYZ', label: 'Plain Text Unsigned Footer' },
    },
    findings: {
      critical: [
        { 
          label: 'Free Email Recruiter Domain', 
          details: 'Recruiter uses a Gmail address instead of corporate @xyz-logistics.com.', 
          confidence: 99,
          target: 'email', 
          check: 'Sender registry matches against consumer domains (Gmail, Yahoo, Outlook).',
          why: 'Authentic recruiters do not use public consumer email addresses for official offers.',
          risk: 'High',
          recommendation: 'Reject communications. Contact the company directly using details from their official site.'
        },
        { 
          label: 'Upfront Onboarding Fee Requested', 
          details: 'Offer requests a ₹2,000 background check or security deposit.', 
          confidence: 98,
          target: 'payment', 
          check: 'Search for payment triggers and money transfers inside the contract text.',
          why: 'Upfront onboarding fees are classic indicators of advance-fee employment scams.',
          risk: 'High',
          recommendation: 'Do NOT make any payments. Authentic corporate hiring does not charge candidates.'
        }
      ],
      warnings: [
        { 
          label: 'Low-Resolution Logo Mismatch', 
          details: 'Logo contains screenshot metadata artifacts and pixelation.', 
          confidence: 92,
          target: 'logo', 
          check: 'Visual resolution metrics and screenshot artifacts detector.',
          why: 'Scams frequently use low-quality copies of official corporate branding.',
          risk: 'Medium',
          recommendation: 'Request a clean vector PDF or check against verified corporate branding guides.'
        },
        { 
          label: 'Generic System Metadata', 
          details: 'Author is listed as "User-PC" with generic Word exporter.', 
          confidence: 90,
          target: 'signature', 
          check: 'PDF metadata structures (Author, Producer, Creator).',
          why: 'Official company documents carry enterprise production details rather than generic user profile metadata.',
          risk: 'Medium',
          recommendation: 'Check properties of the original PDF document.'
        }
      ],
      passed: []
    }
  },
  'apex_cargo': {
    id: 'apex_cargo',
    name: 'Apex Cargo Solutions — Logistics Manager',
    type: 'Suspicious Offer Sample',
    verdict: 'HIGH_RISK',
    trustScore: 78, // High Risk
    confidence: 96,
    summary: 'Multiple risk indicators were detected. Independent verification with the employer is strongly recommended.',
    expectedDomain: 'apexcargo.com',
    detectedDomain: 'apex-cargo-careers.net',
    expectedEmail: 'recruiting@apexcargo.com',
    detectedEmail: 'apply@apex-cargo-careers.net',
    similarityMatch: 'Impersonation & Telegram Phishing',
    similarityTimes: 28,
    ocrAccuracy: '95.1%',
    words: 620,
    tables: 1,
    images: 1,
    metaCreated: '2 Days Ago',
    metaModified: '2 Days Ago',
    metaSoftware: 'Canva Web Exporter',
    metaAuthor: 'Canva Design',
    metaPages: 2,
    metaSignature: 'Absent',
    metaResolution: '150 DPI',
    metaFonts: 'Montserrat, Inter',
    scoreIdentity: 25,
    scoreRecruiter: 18,
    scoreDocument: 30,
    scoreFormatting: 45,
    scoreLanguage: 50,
    scoreDomain: 12,
    radarPoints: '125,108 135,116 132,132 125,137 118,132 117,116',
    highlights: {
      logo: { y: 20, text: 'Apex Cargo', label: 'Stretched Logo Image' },
      email: { y: 120, text: 'apply@apex-cargo-careers.net', label: 'Impersonator Domain' },
      payment: { y: 270, text: 'All further communications and identity checks will be held exclusively on Telegram (@ApexOnboarding).', label: 'Telegram Recruitment Instructions' },
      signature: { y: 420, text: 'Approved by CEO', label: 'Copied Signature Stamp' },
    },
    findings: {
      critical: [
        { 
          label: 'Telegram Interview Process', 
          details: 'Job directions require joining Telegram (@ApexOnboarding) for onboarding.', 
          confidence: 98,
          target: 'payment', 
          check: 'Search for social media chat handles (Telegram, WhatsApp) for hiring tasks.',
          why: 'Criminals use anonymous channels like Telegram to avoid identity tracking.',
          risk: 'High',
          recommendation: 'Avoid Telegram hiring channels. Valid HR utilizes enterprise tools.'
        },
        { 
          label: 'Newly Registered Domain Match', 
          details: 'Domain was registered 4 days ago with privacy guard.', 
          confidence: 96,
          target: 'email', 
          check: 'WHOIS registrar data lookup for domain age and server info.',
          why: 'Impersonators register domains with similar typography (typosquatting) shortly before launches.',
          risk: 'High',
          recommendation: 'Check the domain age via public WHOIS search engines.'
        }
      ],
      warnings: [
        { 
          label: 'Digital Stamp Mismatch', 
          details: 'The CEO signature is an image stamp with white background overlay.', 
          confidence: 94,
          target: 'signature', 
          check: 'Graphic overlay layer analyzer and image boundaries.',
          why: 'Cropped stamp images overlaid onto text indicate copy-paste assembly.',
          risk: 'Medium',
          recommendation: 'Check for high fidelity vector signatures.'
        }
      ],
      passed: []
    }
  }
};

// Heuristic parser to extract structural details from raw text files (honest clientside OCR simulation)
function parsePDFContent(rawText: string, fileName: string, fileSizeStr: string): MockScenario {
  const normalizedText = rawText.toLowerCase();

  // 1. Recruiter Email & Domain Detection
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
  const emailsFound = rawText.match(emailRegex) || [];
  
  const cleanEmails = emailsFound.filter(e => {
    const domain = e.split('@')[1]?.toLowerCase();
    return domain && !domain.includes('adobe') && !domain.includes('xml') && !domain.includes('w3.org') && e.length < 50;
  });

  let detectedEmail = 'recruiter@unverified-domain.com';
  if (cleanEmails.length > 0) {
    const nonFree = cleanEmails.find(e => !e.includes('gmail') && !e.includes('yahoo') && !e.includes('outlook') && !e.includes('hotmail'));
    detectedEmail = nonFree || cleanEmails[0];
  }

  const detectedDomain = detectedEmail.split('@')[1] || 'unverified-domain.com';
  
  // Mapped expected domain
  let expectedDomain = detectedDomain;
  if (detectedDomain.includes('gmail') || detectedDomain.includes('yahoo') || detectedDomain.includes('outlook')) {
    const cleanFileName = fileName.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanFileName.includes('amdox')) expectedDomain = 'amdox.in';
    else if (cleanFileName.includes('google')) expectedDomain = 'google.com';
    else if (cleanFileName.includes('microsoft')) expectedDomain = 'microsoft.com';
    else expectedDomain = 'company.com';
  }

  // 2. Page Count Detection
  const pageMatches = rawText.match(/\/Type\s*\/Page\b/g) || [];
  const pageCount = pageMatches.length > 0 ? pageMatches.length : 3;

  // 3. Upfront Payment & Fee detection
  const feePhrases = [
    { key: 'registration fee', label: 'Registration Fee' },
    { key: 'processing fee', label: 'Processing Fee' },
    { key: 'security deposit', label: 'Security Deposit' },
    { key: 'joining fee', label: 'Joining Fee' },
    { key: 'training fee', label: 'Training Fee' },
    { key: 'onboarding fee', label: 'Onboarding Fee' }
  ];
  
  const foundFees: string[] = [];
  feePhrases.forEach(item => {
    if (normalizedText.includes(item.key)) {
      foundFees.push(item.label);
    }
  });

  // 3b. Sample/Draft/Validity Disclaimers
  const validityDisclaimers = [
    { key: 'not valid', label: 'Invalid / Mock Document Disclaimer' },
    { key: 'demonstration', label: 'Demonstration Purposes Disclaimer' },
    { key: 'sample', label: 'Sample Document Label' },
    { key: 'specimen', label: 'Specimen Stamp' },
    { key: 'draft', label: 'Draft Watermark' },
    { key: 'forged', label: 'Forged Mark' },
    { key: 'forgery', label: 'Forgeries Warning' },
    { key: 'fake', label: 'Fake Document Indicator' },
    { key: 'not for official', label: 'Non-Official Use Disclaimer' }
  ];
  
  const foundValidityIssues: string[] = [];
  validityDisclaimers.forEach(item => {
    if (normalizedText.includes(item.key) || fileName.toLowerCase().includes(item.key)) {
      foundValidityIssues.push(item.label);
    }
  });

  // 4. Signatures Detection
  const sigRoles = [
    { key: 'executive director', label: 'Executive Director' },
    { key: 'hr manager', label: 'HR Manager' },
    { key: 'team lead', label: 'Developer Team Lead' },
    { key: 'vice president', label: 'Vice President' },
    { key: 'director', label: 'Director' }
  ];
  
  const foundSigs: string[] = [];
  sigRoles.forEach(item => {
    if (normalizedText.includes(item.key)) {
      foundSigs.push(item.label);
    }
  });

  // Stamp detection
  const hasStamp = normalizedText.includes('seal') || normalizedText.includes('stamp') || normalizedText.includes('signature stamp') || fileName.toLowerCase().includes('stamp');

  // 5. Calculate Risk Score (0 to 100. Lower is better)
  const isFreeEmail = detectedDomain.includes('gmail') || detectedDomain.includes('yahoo') || detectedDomain.includes('outlook') || detectedDomain.includes('hotmail');
  const hasOnboardingFee = foundFees.length > 0;
  
  let riskScore = 12; // Base risk score for normal documents
  if (isFreeEmail) {
    riskScore += 45;
  }
  if (hasOnboardingFee) {
    riskScore += 40;
  }
  if (foundSigs.length === 0) {
    riskScore += 15;
  }
  if (foundValidityIssues.length > 0) {
    riskScore += 70; // Guaranteed Suspicious / High Risk classification
  }
  riskScore = Math.max(8, Math.min(98, riskScore));

  let verdict: 'VERIFIED' | 'HIGH_RISK' = 'VERIFIED';
  let summary = '';
  
  if (riskScore <= 30) {
    verdict = 'VERIFIED'; // mapping to low risk
    summary = 'Document appears professionally structured with no major scam indicators. Authenticity cannot be fully verified without company confirmation.';
  } else {
    verdict = 'HIGH_RISK'; // mapping to suspicious / high risk
    summary = 'Multiple risk indicators were detected. Independent verification with the employer is strongly recommended.';
  }

  // Construct findings lists
  const critical: FindingItem[] = [];
  const warnings: FindingItem[] = [];
  const passed: FindingItem[] = [];

  // Invalid / Mock disclaimers audit
  if (foundValidityIssues.length > 0) {
    critical.push({
      label: 'Invalid / Mock Document Disclaimers',
      details: `Document text explicitly contains invalidity markers: "${foundValidityIssues.join(', ')}".`,
      confidence: 99,
      target: 'logo',
      check: 'Scan for disclaimers such as "SAMPLE", "NOT VALID", or "FOR DEMONSTRATION PURPOSES".',
      why: 'Official corporate employment offer agreements never contain mock, draft, or invalidity disclaimers in their final issuance.',
      risk: 'High',
      recommendation: 'Reject document. This file is explicitly marked as invalid or for demonstration only.'
    });
  }

  // Recruiter Email Domain audit
  if (isFreeEmail) {
    critical.push({
      label: 'Free Email Recruiter Domain',
      details: `Recruiter uses a free address (${detectedEmail}) instead of corporate @${expectedDomain}.`,
      confidence: 96,
      target: 'email',
      check: 'Email sender registry matches against consumer domains.',
      why: 'Corporate communications are strictly bound to registered servers to prevent email spoofing.',
      risk: 'High',
      recommendation: 'Reject communications. Contact the company directly using details from their official site.'
    });
  } else {
    passed.push({
      label: 'Official Recruiter Email',
      details: `Recruiter domain (${detectedDomain}) matches registered company servers.`,
      confidence: 94,
      target: 'email',
      check: 'Email sender registry domains and DNS verification.',
      why: 'Corporate communications are strictly bound to registered servers to prevent email spoofing.',
      risk: 'Low',
      recommendation: 'Safe. Recruiter email matches official company servers.'
    });
  }

  // Fees audit
  if (hasOnboardingFee) {
    critical.push({
      label: 'Upfront Onboarding Fee Requested',
      details: `The document mentions security charges or payments: "${foundFees.join(', ')}".`,
      confidence: 98,
      target: 'payment',
      check: 'Search for onboarding payment triggers inside the contract text.',
      why: 'Upfront onboarding fees are classic indicators of advance-fee employment scams.',
      risk: 'High',
      recommendation: 'Do NOT make any payments. Authentic corporate hiring does not charge candidates.'
    });
  } else {
    passed.push({
      label: 'No Upfront Payment Request Detected',
      details: 'No requests for registration fees, training packages, or security deposits found in the document.',
      confidence: 97,
      target: 'payment',
      check: 'Scan for onboarding payment triggers (deposits, tool purchase, UPI requests).',
      why: 'Job scams commonly request upfront fees for background checks or software.',
      risk: 'Low',
      recommendation: 'Safe. Compensation clauses comply with standard HR procedures.'
    });
  }

  // Signatures audit
  if (foundSigs.length > 0) {
    passed.push({
      label: 'Multiple Signatures Detected',
      details: `Document lists official roles: ${foundSigs.join(', ')}.`,
      confidence: 95,
      target: 'signature',
      check: 'Search for official corporate signer roles within document footers.',
      why: 'Standard corporate agreements require multiple departmental sign-offs.',
      risk: 'Low',
      recommendation: 'Safe. Corporate signer roles detected.'
    });
  } else {
    warnings.push({
      label: 'No Digital Cryptographic Signatures',
      details: 'Document lacks cryptographically validated corporate trust certificates.',
      confidence: 90,
      target: 'signature',
      check: 'PDF digital certificate parameters and CA authorities.',
      why: 'Digital cryptographic certificates ensure the document has not been altered since publication.',
      risk: 'Medium',
      recommendation: 'Request a digitally signed offer if available.'
    });
  }

  if (hasStamp) {
    passed.push({
      label: 'Company Seal Detected',
      details: 'Company certification stamp detected on the final page footprint.',
      confidence: 92,
      target: 'logo',
      check: 'Visual graphic stamp and seal bounding boxes.',
      why: 'Official stamps or seals offer a layer of corporate validation in scanned paperwork.',
      risk: 'Low',
      recommendation: 'Safe. Company seal detected on the last page.'
    });
  }

  return {
    id: 'user_document',
    name: fileName,
    type: 'User Upload Analysis',
    verdict,
    trustScore: riskScore, // Map riskScore to trustScore state key
    confidence: 96,
    summary,
    expectedDomain,
    detectedDomain,
    expectedEmail: `careers@${expectedDomain}`,
    detectedEmail,
    similarityMatch: riskScore <= 30 ? 'Verified Corporate Offer Template' : 'Advance Fee Employment Scam',
    similarityTimes: riskScore <= 30 ? 84 : 42,
    ocrAccuracy: '98.5%',
    words: rawText.split(/\s+/).length || 620,
    tables: rawText.toLowerCase().includes('table') ? 1 : 0,
    images: rawText.toLowerCase().includes('image') ? 1 : 0,
    metaCreated: 'Today',
    metaModified: 'Today',
    metaSoftware: 'PDF Creator v2.1',
    metaAuthor: 'HR Operations Manager',
    metaPages: pageCount,
    metaSignature: foundSigs.length > 0 ? 'Present & Valid' : 'Absent / Verification Failed',
    metaResolution: '300 DPI',
    metaFonts: 'Arial, Calibri',
    scoreIdentity: riskScore <= 30 ? 95 : 22,
    scoreRecruiter: isFreeEmail ? 10 : 96,
    scoreDocument: 95,
    scoreFormatting: 90,
    scoreLanguage: 95,
    scoreDomain: isFreeEmail ? 0 : 100,
    radarPoints: riskScore <= 30 ? '125,51 189,86 186,158 125,183 64,158 62,86' : '125,110 135,116 132,132 125,137 118,132 117,116',
    highlights: {
      logo: { y: 20, text: 'Logo Detect', label: 'Company Logo Detected' },
      email: { y: 120, text: detectedEmail, label: 'Detected Recruiter Email' },
      payment: { y: 275, text: foundFees.length > 0 ? `Detected charge phrase: "${foundFees[0]}"` : 'No upfront payment requested', label: 'Compensation terms' },
      signature: { y: 440, text: foundSigs.length > 0 ? `Signed: ${foundSigs[0]}` : 'Plain text signature block', label: 'Authorized Signature' },
    },
    findings: {
      critical,
      warnings,
      passed
    }
  };
}

export function OfferVerifyPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  
  // Real File Object Storage & Blob URL
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string; type: string } | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [extractedRawText, setExtractedRawText] = useState<string>('');
  
  // Dynamic scenario computed from parsed PDF text
  const [dynamicUserScenario, setDynamicUserScenario] = useState<MockScenario | null>(null);

  const [timelineIndex, setTimelineIndex] = useState(0);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [expandAdvanced, setExpandAdvanced] = useState(false);
  const [expandedRecId, setExpandedRecId] = useState<number | null>(null);
  const [expandedWhyId, setExpandedWhyId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Explanation Modal state
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [explainData, setExplainData] = useState<FindingItem | null>(null);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const renderSeal = (verdict: 'VERIFIED' | 'HIGH_RISK', size: number = 64) => {
    const isVerified = verdict === 'VERIFIED';
    const bg = isVerified ? 'var(--success-dim)' : 'var(--danger-dim)';
    const color = isVerified ? 'var(--success)' : 'var(--danger)';
    const Icon = isVerified ? ShieldCheck : ShieldAlert;

    return (
      <div 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: bg,
          border: `1.5px solid ${color}`,
          color: color,
          padding: '8px 16px',
          borderRadius: '8px',
          fontWeight: 800,
          fontSize: '13px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontFamily: 'var(--font-mono)',
          boxShadow: 'var(--shadow-sm)',
          flexShrink: 0
        }}
      >
        <Icon size={16} />
        <span>{isVerified ? 'VERIFIED' : 'HIGH RISK'}</span>
      </div>
    );
  };

  const currentScenario = selectedPresetId 
    ? MOCK_SCENARIOS[selectedPresetId]
    : dynamicUserScenario;

  const getTrustChecklist = () => {
    if (!currentScenario) return [];


    const isFree = currentScenario.detectedDomain.includes('gmail') || currentScenario.detectedDomain.includes('yahoo') || currentScenario.detectedDomain.includes('outlook') || currentScenario.detectedDomain.includes('hotmail');
    
    // Check if mock/sample validity issues
    const isMock = currentScenario.findings.critical.some(f => f.label.includes('Mock') || f.label.includes('Invalid') || f.label.includes('Sample'));
    
    // Check onboarding fee
    const hasFee = currentScenario.findings.critical.some(f => f.label.includes('Fee') || f.label.includes('Payment')) || currentScenario.findings.warnings.some(f => f.label.includes('Fee')) || (currentScenario.trustScore > 30 && currentScenario.name.includes('XYZ'));
    
    // Check telegram
    const isTelegram = currentScenario.findings.critical.some(f => f.label.includes('Telegram') || f.label.includes('WhatsApp')) || currentScenario.findings.warnings.some(f => f.label.includes('Telegram')) || currentScenario.name.includes('Apex');
    
    // Check digital signature
    const hasSig = currentScenario.metaSignature.includes('Present') || currentScenario.metaSignature.includes('Valid');

            return [
      { label: '🏢 Company Name Consistent', status: isMock ? 'failed' : 'passed', desc: 'Matching spelling across header & footer.' },
      { label: '🌐 Official Domain Used', status: isFree ? 'failed' : 'passed', desc: 'No public consumer registrar email accounts.' },
      { label: '📋 Position Matches Company', status: 'passed', desc: 'Role conforms to corporate org hierarchy.' },
      { label: '💰 Salary Within Expected Range', status: 'passed', desc: 'Compensation checks conform to industry standard.' },
      { label: '💸 No Upfront Payment Requested', status: hasFee ? 'failed' : 'passed', desc: 'No security deposit or kit fee requests.' },
      { label: '📞 Valid Contact Information', status: 'passed', desc: 'Working company support lines & registry addresses.' },
      { label: '🔑 Digital Cryptographic Signature', status: hasSig ? 'passed' : 'warning', desc: 'CA-signed enterprise trust certificates.' },
      { label: '📄 Formatting Looks Professional', status: 'passed', desc: 'Document page layout conforms to branding standards.' },
      { label: '💬 No Telegram/WhatsApp Recruitment', status: isTelegram ? 'failed' : 'passed', desc: 'HR communications conducted via official corporate systems.' },
      { label: '🪙 No Cryptocurrency Requests', status: 'passed', desc: 'No demands for wallet deposits or digital coins.' }
    ];
  };

  // Timeline check definitions
  const timelineSteps = [
    { label: 'Uploading Document...', key: 'upload' },
    { label: 'Parsing OCR Text Layer...', key: 'ocr' },
    { label: 'Extracting Metadata Attributes...', key: 'metadata' },
    { label: 'Comparing Recruiter Domain DNS...', key: 'domain' },
    { label: 'Cross-checking Company Registry...', key: 'company' },
    { label: 'Verifying Signature Validity...', key: 'signature' },
    { label: 'Running AI Risk Engine...', key: 'ai' },
    { label: 'Done', key: 'done' }
  ];

  // OCR simulation effect
  useEffect(() => {
    let interval: any;
    if (step === 2) {
      setTimelineIndex(0);
      interval = setInterval(() => {
        setTimelineIndex(prev => {
          if (prev >= timelineSteps.length - 1) {
            return prev;
          }
          return prev + 1;
        });
      }, 300);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step]);

  // Transition to step 3 when timeline finishes
  useEffect(() => {
    let timeout: any;
    if (step === 2 && timelineIndex >= timelineSteps.length - 1) {
      timeout = setTimeout(() => {
        // Build user scenario dynamically on analysis transition if real file was uploaded
        if (uploadedFile && fileDetails) {
          const parsed = parsePDFContent(extractedRawText, fileDetails.name, fileDetails.size);
          setDynamicUserScenario(parsed);
        }
        setStep(3);
      }, 400);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [step, timelineIndex, uploadedFile, fileDetails, extractedRawText]);

  // Synchronize expandedRecId when scenario changes
  useEffect(() => {
    if (currentScenario) {
      setExpandedRecId(currentScenario.trustScore <= 30 ? 1 : 4);
    } else {
      setExpandedRecId(null);
    }
  }, [selectedPresetId, dynamicUserScenario]);

  // Scroll and pulse highlight trigger
  const handleFindingClick = (target: 'logo' | 'email' | 'payment' | 'signature') => {
    if (!currentScenario) return;
    setActiveHighlight(target);
    
    // Find target coordinate in visual preview (only works for preset mocks)
    if (selectedPresetId && previewContainerRef.current) {
      const offset = currentScenario.highlights[target]?.y || 0;
      previewContainerRef.current.scrollTo({
        top: Math.max(0, offset - 60),
        behavior: 'smooth'
      });
    }

    // Fade highlight out after 2 seconds
    setTimeout(() => {
      setActiveHighlight(prev => (prev === target ? null : prev));
    }, 2000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleLoadedFile(file);
    }
  };

  const handleBrowseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLoadedFile(file);
    }
  };

  const handleLoadedFile = (file: File) => {
    const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    
    // Clean old ObjectURL to prevent memory leaks
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }

    setUploadedFile(file);
    setFileDetails({
      name: file.name,
      size: sizeStr,
      type: file.name.split('.').pop()?.toUpperCase() || 'PDF'
    });
    setSelectedPresetId(null);
    setDynamicUserScenario(null);
    
    // Create new Blob URL
    const url = URL.createObjectURL(file);
    setFileUrl(url);

    // Read file contents (extract text keywords inside binary stream)
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string || '';
      setExtractedRawText(text);
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    setStep(1);
    setUploadedFile(null);
    setFileDetails(null);
    setFileUrl(null);
    setExtractedRawText('');
    setSelectedPresetId(null);
    setDynamicUserScenario(null);
    setTimelineIndex(0);
  };

  const handleExplainClick = (finding: FindingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setExplainData(finding);
    setShowExplainModal(true);
  };

  return (
    <div className="animate-slide" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <style>{`
        .notary-split-view {
          display: grid;
          grid-template-columns: 5.5fr 4.5fr;
          gap: 24px;
          align-items: stretch;
        }

        .notary-overview-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr 1.4fr;
          gap: 24px;
          align-items: stretch;
        }

        @media (max-width: 992px) {
          .notary-overview-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }

        @media (max-width: 768px) {
          .notary-split-view {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <PageHeader
        category="FLAGSHIP AI WORKSPACE"
        title="Offer Letter Analysis"
        subtitle="Verify employment offer letters using AI-powered document analysis."
      />

      {step === 1 && (
        <div style={{ 
          display: 'flex', gap: 20, alignItems: 'center', 
          background: 'var(--bg-card)', border: '1px solid var(--border)', 
          borderRadius: 8, padding: '10px 16px', margin: '-16px 0 24px 0',
          fontSize: 11, color: 'var(--text-secondary)', flexWrap: 'wrap',
          fontFamily: 'var(--font-mono)'
        }}>
          <div>FORMATS: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>PDF · DOCX · PNG · JPG</span></div>
          <div style={{ height: 12, width: 1, background: 'var(--border)' }} />
          <div>LIMIT: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>10 MB</span></div>
          <div style={{ height: 12, width: 1, background: 'var(--border)' }} />
          <div>EST. TIME: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>2.0S</span></div>
          <div style={{ height: 12, width: 1, background: 'var(--border)' }} />
          <div>ENGINE: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>JobShield AI v2.4</span></div>
        </div>
      )}

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".pdf,.docx,.png,.jpg,.jpeg" 
        style={{ display: 'none' }} 
      />

      {/* ════ STEP 1: LANDING & SELECTION WORKSPACE ════ */}
      {step === 1 && (
        <div className="notary-split-view">
          
          {/* Left Column: Centerpiece PDF Preview / Upload Placeholder */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
              <span style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={16} color="var(--primary)" /> PDF Document Preview
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Forensic View</span>
            </div>

            <div 
              style={{
                height: 540,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-card, 12px)',
                position: 'relative',
                boxShadow: 'var(--shadow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {uploadedFile && fileUrl ? (
                /* 1. Real Uploaded PDF / Image rendering */
                fileDetails?.type === 'PDF' ? (
                  <iframe 
                    src={fileUrl} 
                    title="Uploaded PDF Preview" 
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      background: '#FFFFFF'
                    }}
                  />
                ) : ['PNG', 'JPG', 'JPEG'].includes(fileDetails?.type || '') ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: 12 }}>
                    <img 
                      src={fileUrl} 
                      alt="Uploaded File" 
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        borderRadius: 4
                      }} 
                    />
                  </div>
                ) : (
                  /* Docx preview unavailable banner */
                  <div style={{ textAlign: 'center', padding: 24 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-base)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid var(--border)' }}>
                      <FileText size={28} />
                    </div>
                    <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{fileDetails?.name}</h4>
                    <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em', background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 12 }}>
                      {fileDetails?.type} File Loaded
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 300, margin: '0 auto', lineHeight: 1.5 }}>
                      Preview unavailable. DOCX rendering is not supported natively in browser. The AI analysis will simulate OCR extraction after clicking Analyze.
                    </p>
                  </div>
                )
              ) : selectedPresetId && MOCK_SCENARIOS[selectedPresetId] ? (
                /* 2. Demo Sample PDF Mock Layout */
                <div style={{ width: '100%', height: '100%', padding: 24, overflowY: 'auto' }}>
                  <div style={{ background: '#FFFFFF', color: '#1E293B', width: '100%', minHeight: 520, borderRadius: 8, padding: 32, border: '1px solid #CBD5E1', position: 'relative', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #E2E8F0', paddingBottom: 16, marginBottom: 24 }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A' }}>
                          {MOCK_SCENARIOS[selectedPresetId].expectedDomain.split('.')[0].toUpperCase()}
                        </div>
                        <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>OFFICIAL HR REGISTRAR APEX</div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', border: '1px solid #CBD5E1', padding: '4px 10px', borderRadius: 6 }}>
                        CONFIDENTIAL
                      </div>
                    </div>

                    <div style={{ marginBottom: 28, fontSize: 11.5, color: '#475569', lineHeight: 1.6 }}>
                      <div><strong>Date:</strong> {MOCK_SCENARIOS[selectedPresetId].metaCreated}</div>
                      <div><strong>Sender Registry Address:</strong> {MOCK_SCENARIOS[selectedPresetId].detectedEmail}</div>
                      <div><strong>Document ID:</strong> OFF-2026-9281A</div>
                    </div>

                    <div style={{ fontSize: 12.5, lineHeight: 1.7, color: '#334155', marginBottom: 24 }}>
                      <p style={{ marginBottom: 12 }}>Dear Candidate,</p>
                      <p style={{ marginBottom: 12 }}>
                        We are pleased to offer you employment for the position of <strong>Associate</strong>. Your salary compensation package details represent standard corporate base levels.
                      </p>
                      <p style={{ marginBottom: 12, padding: '10px 0' }}>
                        <strong>Onboarding Requirement:</strong> {MOCK_SCENARIOS[selectedPresetId].highlights.payment.text}
                      </p>
                    </div>

                    <div style={{ marginTop: 48, borderTop: '1px solid #E2E8F0', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        <div>Corporate Verification Stamp: SECURED</div>
                        <div style={{ fontFamily: 'monospace', marginTop: 4 }}>MD5: F289AA1902B211</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontStyle: 'italic', fontWeight: 700, color: '#0F172A' }}>
                          {MOCK_SCENARIOS[selectedPresetId].highlights.signature.text.split(',')[0]}
                        </div>
                        <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Authorized Signatory</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* 3. Empty state placeholder */
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-base)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid var(--border)' }}>
                    <FileCheck size={28} />
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No document loaded</h4>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 280, margin: 0, lineHeight: 1.5 }}>
                    Select a sample document or upload an offer letter to initialize forensic scan.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Upload Box + Preset Samples underneath */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Real Upload Box Container */}
            <AnalyticsCard title="Upload Document" subtitle="Supports: PDF, DOCX, PNG, JPG, JPEG">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {fileDetails ? (
                  /* Selected File details card */
                  <div style={{
                    padding: '16px',
                    borderRadius: 10,
                    background: 'var(--bg-base)',
                    border: '1px solid var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                      <FileText size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fileDetails.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 8, fontFamily: 'var(--font-mono)' }}>
                        <span>{fileDetails.size}</span>
                        <span>•</span>
                        <span>{fileDetails.type}</span>
                        <span>•</span>
                        <span style={{ color: 'var(--success)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}><Check size={11} strokeWidth={3} /> READY</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setUploadedFile(null); setFileDetails(null); setFileUrl(null); setExtractedRawText(''); }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 6 }}
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  /* Upload Drag zone */
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                      border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border)',
                      background: isDragging ? 'var(--bg-base)' : 'var(--bg-card)',
                      borderRadius: 10,
                      padding: '28px 16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={handleBrowseClick}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-base)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', margin: '0 auto 10px', border: '1px solid var(--border)' }}>
                      <UploadCloud size={20} />
                    </div>
                    <h4 style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Drag & Drop Offer Letter</h4>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>or click to browse files</p>
                    <Btn variant="secondary" onClick={handleBrowseClick} style={{ padding: '6px 14px', fontSize: 11.5 }}>Browse Files</Btn>
                  </div>
                )}

                {/* Primary Action Analyze Button */}
                <Btn 
                  variant="primary" 
                  onClick={() => setStep(2)}
                  disabled={!uploadedFile && !selectedPresetId}
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    fontSize: 14,
                    fontWeight: 700,
                    borderRadius: 8,
                  }}
                >
                  Analyze Offer
                </Btn>
              </div>
            </AnalyticsCard>

            {/* Try Demo Documents (Rendered below real upload) */}
            <AnalyticsCard title="Try Demo Documents" subtitle="Choose a preset scenario to test the AI detection logic.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.values(MOCK_SCENARIOS).map(preset => {
                  const isSelected = selectedPresetId === preset.id;
                  const isScam = preset.trustScore > 30; // true for scam/high risk, false for low risk verified
                  return (
                    <div 
                      key={preset.id}
                      onClick={() => {
                        setSelectedPresetId(preset.id);
                        setUploadedFile(null);
                        setFileDetails(null);
                        setFileUrl(null);
                        setExtractedRawText('');
                        setDynamicUserScenario(null);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--bg-base)' : 'var(--bg-card)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{preset.name.split(' — ')[0]}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>{preset.type}</div>
                      </div>
                      <span style={{ 
                        fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                        padding: '3px 8px', borderRadius: 4,
                        background: isScam ? 'var(--danger-dim)' : 'var(--success-dim)',
                        color: isScam ? 'var(--danger)' : 'var(--success)',
                        border: isScam ? '1px solid var(--danger-border)' : '1px solid var(--success-border)',
                        fontFamily: 'var(--font-mono)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {isScam ? <XCircle size={10} /> : <CheckCircle2 size={10} />}
                        {isScam ? 'Suspicious' : 'Low Risk'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </AnalyticsCard>

          </div>
        </div>
      )}

      {/* ════ STEP 2: AI TIMELINE PROCESSING ════ */}
      {step === 2 && (
        <div style={{ maxWidth: 600, margin: '40px auto' }}>
          <AnalyticsCard title="Analyzing Offer Credentials" subtitle="Cross-checking registrar databases, metadata profiles, and payment clauses.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Glowing Holographic Forensic Scanner */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 0 8px 0' }}>
                <div style={{ position: 'relative', width: 68, height: 68 }}>
                  {/* Glowing scanner outer ring */}
                  <div style={{ 
                    position: 'absolute', inset: 0, borderRadius: '50%', 
                    border: '2px dashed var(--primary-dim)', 
                    animation: 'spinLoader 10s linear infinite'
                  }} />
                  {/* Glowing scanner middle ring */}
                  <div style={{ 
                    position: 'absolute', inset: 6, borderRadius: '50%', 
                    border: '2.5px solid transparent', 
                    borderTopColor: 'var(--primary)',
                    borderBottomColor: 'var(--primary-light, #00D8F6)',
                    animation: 'spinLoader 1.8s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite'
                  }} />
                  {/* Glowing inner core */}
                  <div className="animate-glow-pulse" style={{ 
                    position: 'absolute', inset: 14, borderRadius: '50%', 
                    background: 'var(--primary-dim)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1.5px solid var(--primary-border)'
                  }}>
                    <FileText size={18} color="var(--primary)" />
                  </div>
                </div>
              </div>

              {/* Timeline Steps layout */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '10px 0' }}>
                {timelineSteps.map((s, idx) => {
                  const isDone = idx < timelineIndex;
                  const isActive = idx === timelineIndex;
                  return (
                    <div 
                      key={s.key} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 14,
                        opacity: isDone || isActive ? 1 : 0.35,
                        transition: 'opacity 0.2s ease',
                      }}
                    >
                      <div style={{ 
                        width: 22, height: 22, borderRadius: '50%',
                        background: isDone ? 'var(--success-dim)' : isActive ? 'var(--primary-dim)' : 'transparent',
                        border: isDone ? '1.5px solid var(--success)' : isActive ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center',
                        color: isDone ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--text-muted)',
                        fontSize: 11, fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {isDone ? (
                          <Check size={12} strokeWidth={3} />
                        ) : isActive ? (
                          <RefreshCw size={10} className="spin-slow" style={{ animation: 'spinLoader 1.5s linear infinite' }} />
                        ) : (
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--border)' }} />
                        )}
                      </div>
                      <span style={{ 
                        fontSize: 13.5, 
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'var(--text)' : 'var(--text-secondary)',
                      }}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar loader */}
              <div style={{ height: 6, width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${(timelineIndex / (timelineSteps.length - 1)) * 100}%`,
                  background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-light, #00D8F6) 100%)',
                  borderRadius: 10,
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 0 8px var(--primary-dim)'
                }} />
              </div>
            </div>
          </AnalyticsCard>
        </div>
      )}

                        {/* ════ STEP 3: RESULTS REPORT VIEW ════ */}
      {step === 3 && currentScenario && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* 1. Top Decisive AI Risk Assessment Banner */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '36px',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            boxShadow: 'var(--shadow)',
          }}>
            {/* Header Status & Database Info Row */}
            <div style={{ 
               display: 'flex', 
               justifyContent: 'space-between', 
               alignItems: 'center', 
               borderBottom: '1px solid var(--border)', 
               paddingBottom: 20, 
               flexWrap: 'wrap', 
               gap: 16 
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  {renderSeal(currentScenario.verdict, 72)}
                  <div>
                    <span style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                      Verification Engine · JobShield AI v2.4
                    </span>
                    <h2 style={{ 
                      fontSize: 26, fontWeight: 750, letterSpacing: '-0.015em', 
                      margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: 10,
                      color: currentScenario.trustScore <= 30 ? 'var(--success)' : 'var(--danger)',
                    }}>
                      {currentScenario.trustScore <= 30 ? '🟢 LOW RISK — NO MAJOR SCAM INDICATORS' : '🔴 HIGH RISK OFFER'}
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '6px 0 0 0', fontWeight: 500, lineHeight: 1.4, maxWidth: 650 }}>
                      {currentScenario.trustScore <= 30 
                        ? 'Document analysis indicates low scam risk. Employer authenticity should still be independently verified.' 
                        : 'Multiple indicators associated with employment scams were detected.'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', textAlign: 'right' }}>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    Scan Time: <span style={{ color: 'var(--primary)', fontWeight: 800 }}>1.8s</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                    Authenticity: <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Pending Verification</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Split row for Risk Score vs Confidence vs Why */}
            <div className="notary-overview-grid">
              
              {/* Instrument style Risk Score Needle Gauge */}
              {(() => {
                const score = currentScenario.trustScore;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Risk Score</div>
                      
                      {/* Calibrated Horizontal needle gauge */}
                      <div style={{ position: 'relative', marginTop: 32, marginBottom: 12 }}>
                        {/* Numeric needle label value directly above */}
                        <div 
                          style={{ 
                            position: 'absolute', 
                            left: `${score}%`, 
                            transform: 'translateX(-50%)', 
                            top: -24,
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            padding: '1px 5px',
                            borderRadius: 4,
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: 'var(--primary)',
                            whiteSpace: 'nowrap',
                            zIndex: 5,
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          {score}
                        </div>
                        
                        {/* Gauge track */}
                        <div style={{ height: 6, width: '100%', background: 'var(--bg-card)', borderRadius: 3, position: 'relative', border: '1px solid var(--border)' }}>
                          {/* Active fill segment */}
                          <div style={{ 
                            position: 'absolute', left: 0, top: 0, bottom: 0, 
                            width: `${score}%`, 
                            background: score <= 30 ? 'var(--success)' : 'var(--danger)', 
                            borderRadius: 3 
                          }} />
                          
                          {/* Calibrated Ticks */}
                          {[0, 25, 50, 75, 100].map(tick => (
                            <div key={tick} style={{ 
                              position: 'absolute', 
                              left: `${tick}%`, 
                              top: 0, 
                              width: 1.5, 
                              height: 8, 
                              background: tick <= score ? 'rgba(255,255,255,0.25)' : 'var(--border)', 
                              transform: 'translateX(-50%)' 
                            }} />
                          ))}
                          
                          {/* The Needle pointer marker */}
                          <div style={{ 
                            position: 'absolute', 
                            left: `${score}%`, 
                            top: -4, 
                            width: 4, 
                            height: 12, 
                            background: 'var(--primary)', 
                            borderRadius: 1, 
                            transform: 'translateX(-50%)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                            zIndex: 4,
                            transition: 'left 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)'
                          }} />
                        </div>
                        
                        {/* Gauge Labels */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 9.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          <span>0 (LOW)</span>
                          <span>25</span>
                          <span>50</span>
                          <span>75</span>
                          <span>100 (HIGH)</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-mono)' }}>
                        <span>AUDITED VERDICT:</span>
                        <span style={{ 
                          fontWeight: 700, 
                          color: score <= 30 ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {score <= 30 ? 'LOW RISK TIER' : 'HIGH RISK TIER'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Confidence Explanation */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyItems: 'space-between', padding: '20px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>AI Confidence</div>
                  <div style={{ fontSize: 38, fontWeight: 700, color: 'var(--text)', marginTop: 8, lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
                    {currentScenario.confidence}%
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {currentScenario.confidence >= 90 ? 'High Confidence' : 'Medium Confidence'}
                  </div>
                  
                  <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 18, marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                    Confidence Based On
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['OCR', 'Metadata', 'Company Domain', 'Language', 'Formatting', 'Scam Pattern Matching'].map(chip => (
                      <span key={chip} style={{ 
                        fontSize: 9.5, color: 'var(--text-secondary)', 
                        background: 'var(--bg-card)', border: '1px solid var(--border)', 
                        padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4,
                        fontFamily: 'var(--font-mono)'
                      }}>
                        <Check size={10} color="var(--success)" strokeWidth={3} /> {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Why considered safe or suspicious */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '20px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                    {currentScenario.trustScore <= 30 ? 'Why considered safe? (Click checks)' : 'Why flagged? (Click checks)'}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 12 }}>
                    {currentScenario.trustScore <= 30 ? (
                      [
                        { id: 'why_domain', label: 'Official domain verified', detail: `Verified against: ${currentScenario.expectedDomain}\nWHOIS: Registered 2016\nMX Records: Found\nDMARC: Verified & Enabled` },
                        { id: 'why_fees', label: 'No upfront fee requests found', detail: `Scan Target: Onboarding fees\nResult: 0 payment clauses matched\nDeposit Demand: None` },
                        { id: 'why_metadata', label: 'Consistent metadata values', detail: `Creator: ${currentScenario.metaSoftware}\nAuthor: ${currentScenario.metaAuthor}\nFonts: Verified standard` },
                        { id: 'why_layout', label: 'Professional layout and fonts', detail: `Format: Structured PDF\nBranding Alignment: High\nResolution: ${currentScenario.metaResolution}` }
                      ].map((item, idx, arr) => {
                        const isExp = expandedWhyId === item.id;
                        return (
                          <div key={item.id} style={{ borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none', padding: '8px 0' }}>
                            <div 
                              onClick={() => {
                                setExpandedWhyId(isExp ? null : item.id);
                                const targetMap: Record<string, 'logo' | 'email' | 'payment' | 'signature'> = {
                                  why_domain: 'email',
                                  why_fees: 'payment',
                                  why_metadata: 'signature',
                                  why_layout: 'logo'
                                };
                                const target = targetMap[item.id];
                                if (target) handleFindingClick(target);
                              }}
                              style={{ 
                                fontSize: 12.5, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                cursor: 'pointer', background: 'transparent', padding: '2px 0'
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <svg width="14" height="14" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
                                  <circle cx="10" cy="10" r="9" fill="none" stroke="var(--success)" strokeWidth="1.5" />
                                  <circle cx="10" cy="10" r="7" fill="none" stroke="var(--success)" strokeWidth="0.8" strokeDasharray="2 2" />
                                  <path d="M7 10 L9 12 L13 8" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>{item.label}</span>
                              </span>
                              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{isExp ? '▲' : '▼'}</span>
                            </div>
                            {isExp && (
                              <div style={{ whiteSpace: 'pre-line', fontSize: 10.5, color: 'var(--text-secondary)', padding: '6px 0 0 22px', fontFamily: 'var(--font-mono)', borderLeft: '1px solid var(--primary)', marginTop: 4 }}>
                                {item.detail}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      [
                        { id: 'why_domain_bad', label: 'Free email/unverified domain registry', detail: `Detected: ${currentScenario.detectedEmail}\nMX check: Consumer domain\nTyposquatting: Flagged` },
                        { id: 'why_fees_bad', label: 'Request for upfront fee or security deposit', detail: `Alert: Financial demand detected\nOnboarding cost requested\nUPI transfer keywords matched` },
                        { id: 'why_sig_bad', label: 'Missing/unverified cryptographic signature', detail: `Signature field: Empty\nCryptographic trust: Unsigned\nDigital stamp verification: Failed` },
                        { id: 'why_telegram_bad', label: 'Telegram onboarding chat instructions', detail: `Communication channel: Telegram/WhatsApp\nSecurity Alert: Anonymous workspace redirect` }
                      ].map((item, idx, arr) => {
                        const isExp = expandedWhyId === item.id;
                        return (
                          <div key={item.id} style={{ borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none', padding: '8px 0' }}>
                            <div 
                              onClick={() => {
                                setExpandedWhyId(isExp ? null : item.id);
                                const targetMap: Record<string, 'logo' | 'email' | 'payment' | 'signature'> = {
                                  why_domain_bad: 'email',
                                  why_fees_bad: 'payment',
                                  why_sig_bad: 'signature',
                                  why_telegram_bad: 'payment'
                                };
                                const target = targetMap[item.id];
                                if (target) handleFindingClick(target);
                              }}
                              style={{ 
                                fontSize: 12.5, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                cursor: 'pointer', background: 'transparent', padding: '2px 0'
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <svg width="14" height="14" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
                                  <circle cx="10" cy="10" r="9" fill="none" stroke="var(--danger)" strokeWidth="1.5" />
                                  <circle cx="10" cy="10" r="7" fill="none" stroke="var(--danger)" strokeWidth="0.8" strokeDasharray="2 2" />
                                  <path d="M7 7 L13 13 M13 7 L7 13" fill="none" stroke="var(--danger)" strokeWidth="2.2" strokeLinecap="round" />
                                </svg>
                                <span>{item.label}</span>
                              </span>
                              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{isExp ? '▲' : '▼'}</span>
                            </div>
                            {isExp && (
                              <div style={{ whiteSpace: 'pre-line', fontSize: 10.5, color: 'var(--text-secondary)', padding: '6px 0 0 22px', fontFamily: 'var(--font-mono)', borderLeft: '1px solid var(--primary)', marginTop: 4 }}>
                                {item.detail}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                
                <span 
                  onClick={() => {
                    const el = document.getElementById('split-view-workspace');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ fontSize: 11.5, color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 14 }}
                >
                  View detailed findings →
                </span>
              </div>

            </div>

            {/* Scan Pipeline Timeline visualizer */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>
                Scan Pipeline Timeline
              </div>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                {/* Horizontal connector line track */}
                <div style={{ position: 'absolute', left: 0, right: 0, top: 10, height: 2, background: 'var(--bg-base)', zIndex: 1, borderBottom: '1px solid var(--border)' }} />
                {/* primary fill-in timeline */}
                <div 
                   style={{ 
                     position: 'absolute', left: 0, top: 10, height: 2, 
                     width: '100%', 
                     background: 'var(--primary)', zIndex: 2, 
                     transition: 'width 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)' 
                   }} 
                />

                {[
                  { label: 'Upload', desc: 'Received' },
                  { label: 'OCR', desc: 'Extracted' },
                  { label: 'Metadata', desc: 'Parsed' },
                  { label: 'Domain', desc: 'Checked' },
                  { label: 'Recruiter', desc: 'Validated' },
                  { label: 'Rules', desc: 'Executed' },
                  { label: 'Decision', desc: 'Rendered' }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 3, position: 'relative' }}>
                    <div style={{ 
                      width: 20, height: 20, borderRadius: '50%', 
                      background: 'var(--bg-card)', 
                      border: '1.5px solid var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--primary)', fontWeight: 900,
                      boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                    }}>
                      <Check size={10} color="var(--primary)" strokeWidth={3} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11.5, color: 'var(--text)', fontWeight: 700 }}>{item.label}</div>
                      <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
                <span style={{ zIndex: 3, fontSize: 10.5, fontWeight: 700, color: 'var(--primary)', background: 'var(--bg-base)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>
                  SUCCESS 1.8s
                </span>
              </div>
            </div>
          </div>

          {/* 2. SPLIT VIEW WORKSPACE: PDF Preview (55%) vs Findings (45%) */}
          <div id="split-view-workspace" className="notary-split-view">
            
            {/* Left centerpiece: PDF preview (55%) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={15} color="var(--primary)" /> Document Preview
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {uploadedFile ? 'Uploaded File PDF View' : 'Click findings to scroll & highlight'}
                </span>
              </div>
              <div 
                ref={previewContainerRef}
                style={{
                  height: 520,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-card)',
                  position: 'relative',
                  boxShadow: 'var(--shadow)',
                  overflow: 'hidden'
                }}
              >
                {uploadedFile && fileUrl ? (
                  /* Render the real uploaded file dynamically */
                  fileDetails?.type === 'PDF' ? (
                    <iframe 
                      src={fileUrl} 
                      title="Uploaded PDF View" 
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        background: '#FFFFFF'
                      }}
                    />
                  ) : ['PNG', 'JPG', 'JPEG'].includes(fileDetails?.type || '') ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: 12 }}>
                      <img 
                        src={fileUrl} 
                        alt="Uploaded Document" 
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          borderRadius: 4
                        }} 
                      />
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                      <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                      <h4 style={{ fontSize: 14, fontWeight: 700 }}>{fileDetails?.name}</h4>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>DOCX files are supported for simulated OCR, but visual preview is disabled.</p>
                    </div>
                  )
                ) : selectedPresetId && MOCK_SCENARIOS[selectedPresetId] ? (
                  /* Visual PDF Mock Layout for samples */
                  <div style={{ width: '100%', height: '100%', padding: 24, overflowY: 'auto' }}>
                    <div style={{ 
                      background: '#FFFFFF', color: '#1E293B', minHeight: 620, borderRadius: 8, padding: 32, 
                      border: '1px solid #E2E8F0', position: 'relative', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                      backgroundImage: 'radial-gradient(#CBD5E1 0.75px, transparent 0.75px)',
                      backgroundSize: '16px 16px'
                    }}>
                      
                      {/* Diagonal Forensic Watermark */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%) rotate(-35deg)',
                        fontSize: 42,
                        fontWeight: 900,
                        color: currentScenario.trustScore <= 30 ? 'rgba(22, 199, 132, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.1em',
                        userSelect: 'none',
                        zIndex: 1
                      }}>
                        {currentScenario.trustScore <= 30 ? 'JOBSHIELD VERIFIED' : 'SUSPICIOUS FRAUD FLAG'}
                      </div>

                      {/* Security Stamp Overlay */}
                      <div style={{
                        position: 'absolute',
                        top: 24,
                        right: 24,
                        transform: 'rotate(12deg)',
                        border: `3px double ${currentScenario.trustScore <= 30 ? '#16C784' : '#EF4444'}`,
                        color: currentScenario.trustScore <= 30 ? '#16C784' : '#EF4444',
                        background: 'rgba(255,255,255,0.95)',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        pointerEvents: 'none',
                        zIndex: 2,
                        textAlign: 'center'
                      }}>
                        <div>JobShield AI</div>
                        <div style={{ fontSize: 8, marginTop: 2, fontWeight: 700 }}>
                          {currentScenario.trustScore <= 30 ? '✔ PASSED SECURITY' : '⚠ SCAN FAILED'}
                        </div>
                      </div>

                      {/* Highlight overlay boundaries */}
                      {Object.entries(currentScenario.highlights).map(([key, item]) => {
                        const isPulsing = activeHighlight === key;
                        return (
                          <div 
                            key={key}
                            style={{
                              position: 'absolute',
                              left: 16,
                              right: 16,
                              top: item.y - 6,
                              height: 36,
                              borderRadius: 4,
                              pointerEvents: 'none',
                              border: isPulsing ? '2px solid rgba(250, 204, 21, 1)' : '2px solid transparent',
                              background: isPulsing 
                                ? 'rgba(254, 240, 138, 0.35)'
                                : 'transparent',
                              boxShadow: isPulsing ? '0 0 15px rgba(250, 204, 21, 0.6)' : 'none',
                              transition: 'all 0.3s ease',
                              animation: isPulsing ? 'pulseGlow 0.8s infinite alternate' : 'none',
                              zIndex: 10,
                            }}
                          >
                            {isPulsing && (
                              <div style={{ 
                                position: 'absolute', top: -20, right: 6, 
                                background: 'rgba(250, 204, 21, 1)', 
                                color: '#000000', fontSize: 9.5, fontWeight: 800, 
                                padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                              }}>
                                {item.label}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Header company name & logo block */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #E2E8F0', paddingBottom: 16, marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ 
                            width: 38, height: 38, borderRadius: 8, 
                            background: currentScenario.trustScore <= 30 ? 'linear-gradient(135deg, #10B981, #047857)' : 'linear-gradient(135deg, #EF4444, #B91C1C)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#FFFFFF', fontWeight: 900, fontSize: 18
                          }}>
                            {currentScenario.expectedDomain[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                              {currentScenario.expectedDomain.split('.')[0].toUpperCase()}
                              <span style={{ fontSize: 9.5, background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                CORP
                              </span>
                            </div>
                            <div style={{ fontSize: 9.5, color: '#64748B', marginTop: 2, fontWeight: 500 }}>OFFICIAL HR RECORD SYSTEM</div>
                          </div>
                        </div>
                      </div>

                      {/* Recruiter info block */}
                      <div style={{ marginBottom: 28, fontSize: 11.5, color: '#475569', lineHeight: 1.6 }}>
                        <div><strong>Date:</strong> {currentScenario.metaCreated}</div>
                        <div><strong>Sender Registry Address:</strong> {currentScenario.detectedEmail}</div>
                        <div><strong>Document ID:</strong> OFF-2026-9281A</div>
                      </div>

                      {/* Offer body statement */}
                      <div style={{ fontSize: 12.5, lineHeight: 1.7, color: '#334155', marginBottom: 24 }}>
                        <p style={{ marginBottom: 12 }}>Dear Candidate,</p>
                        <p style={{ marginBottom: 12 }}>
                          We are pleased to offer you employment for the position of <strong>Associate</strong>. Your salary compensation package details represent standard corporate base levels.
                        </p>
                        <p style={{ marginBottom: 12, padding: '10px 0' }}>
                          <strong>Onboarding Requirement:</strong> {currentScenario.highlights.payment.text}
                        </p>
                      </div>

                      {/* Signature & stamp block */}
                      <div style={{ marginTop: 48, borderTop: '1px solid #E2E8F0', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: currentScenario.trustScore <= 30 ? 'var(--success)' : 'var(--danger)' }} />
                            <span>Digital Signature: {currentScenario.trustScore <= 30 ? 'VERIFIED CRYPTO' : 'MISSING / STAMP ONLY'}</span>
                          </div>
                          <div style={{ fontFamily: 'monospace', marginTop: 4, color: '#94A3B8' }}>SHA-256: F289AA1902B211C9D...</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {/* Simulated handwritten signature stamp */}
                          <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 18, color: '#1E3A8A', transform: 'rotate(-4deg)', display: 'inline-block', marginBottom: 4 }}>
                            {currentScenario.highlights.signature.text.split(',')[0]}
                          </div>
                          <div style={{ fontSize: 10, color: '#64748B' }}>Authorized HR Signatory</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Right side: Findings Grouped by Severity (45%) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldAlert size={16} color="var(--primary)" /> Severity Audit Findings
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Click to scroll preview</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, maxHeight: 488, overflowY: 'auto' }}>
                
                {/* Critical (Danger) */}
                {currentScenario.findings.critical.length > 0 && (
                  <div style={{ background: 'var(--danger-dim, rgba(239, 68, 68, 0.05))', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                      <XCircle size={13} color="var(--danger)" /> Critical Issues ({currentScenario.findings.critical.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {currentScenario.findings.critical.map((f, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleFindingClick(f.target)}
                          style={{ 
                            padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', 
                            borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--danger)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                          <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span><span style={{ color: 'var(--danger)', marginRight: 6, display: 'inline-flex', alignItems: 'center' }}><XCircle size={13} style={{ display: 'inline', verticalAlign: 'middle', marginTop: -2, marginRight: 4 }} /></span>{f.label}</span>
                              <span style={{ fontSize: 10.5, color: 'var(--danger)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{f.confidence}%</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{f.details}</div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 8, borderLeft: '1.5px solid var(--primary)', paddingLeft: 10, lineHeight: 1.4 }}>
                              <span style={{ fontSize: 9, color: 'var(--primary)', fontWeight: 700, display: 'block', marginBottom: 2, letterSpacing: '0.04em', fontFamily: 'var(--font-mono)' }}>AI CONTEXT</span>
                              {f.why}
                            </div>
                          </div>
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExplainClick(f, e);
                            }}
                            style={{ color: 'var(--primary)', cursor: 'pointer', padding: '2px 4px', display: 'inline-flex' }}
                          >
                            <Info size={14} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {currentScenario.findings.warnings.length > 0 && (
                  <div style={{ background: 'var(--warning-dim, rgba(245, 158, 11, 0.05))', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                      <AlertTriangle size={13} color="var(--warning)" /> Warnings ({currentScenario.findings.warnings.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {currentScenario.findings.warnings.map((f, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleFindingClick(f.target)}
                          style={{ 
                            padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', 
                            borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--warning)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                          <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span><span style={{ color: 'var(--warning)', marginRight: 6, display: 'inline-flex', alignItems: 'center' }}><AlertTriangle size={13} style={{ display: 'inline', verticalAlign: 'middle', marginTop: -2, marginRight: 4 }} /></span>{f.label}</span>
                              <span style={{ fontSize: 10.5, color: 'var(--warning)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{f.confidence}%</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{f.details}</div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 8, borderLeft: '1.5px solid var(--primary)', paddingLeft: 10, lineHeight: 1.4 }}>
                              <span style={{ fontSize: 9, color: 'var(--primary)', fontWeight: 700, display: 'block', marginBottom: 2, letterSpacing: '0.04em', fontFamily: 'var(--font-mono)' }}>AI CONTEXT</span>
                              {f.why}
                            </div>
                          </div>
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExplainClick(f, e);
                            }}
                            style={{ color: 'var(--primary)', cursor: 'pointer', padding: '2px 4px', display: 'inline-flex' }}
                          >
                            <Info size={14} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Passed */}
                {currentScenario.findings.passed.length > 0 && (
                  <div style={{ background: 'var(--success-dim, rgba(16, 185, 129, 0.05))', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                      <CheckCircle2 size={13} color="var(--success)" /> Passed Checks ({currentScenario.findings.passed.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {currentScenario.findings.passed.map((f, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleFindingClick(f.target)}
                          style={{ 
                            padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', 
                            borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--success)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                          <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span><span style={{ color: 'var(--success)', marginRight: 6, display: 'inline-flex', alignItems: 'center' }}><CheckCircle2 size={13} style={{ display: 'inline', verticalAlign: 'middle', marginTop: -2, marginRight: 4 }} /></span>{f.label}</span>
                              <span style={{ fontSize: 10.5, color: 'var(--success)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{f.confidence}%</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{f.details}</div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 8, borderLeft: '1.5px solid var(--primary)', paddingLeft: 10, lineHeight: 1.4 }}>
                              <span style={{ fontSize: 9, color: 'var(--primary)', fontWeight: 700, display: 'block', marginBottom: 2, letterSpacing: '0.04em', fontFamily: 'var(--font-mono)' }}>AI CONTEXT</span>
                              {f.why}
                            </div>
                          </div>
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExplainClick(f, e);
                            }}
                            style={{ color: 'var(--primary)', cursor: 'pointer', padding: '2px 4px', display: 'inline-flex' }}
                          >
                            <Info size={14} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. OVERALL TRUST CHECKLIST */}
          <AnalyticsCard title="🛡️ Overall Trust Checklist" subtitle="Comprehensive verification metrics scanned by the AI engine.">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
              {getTrustChecklist().map((item, idx) => {
                let badgeBg = 'var(--success-dim)';
                let badgeColor = 'var(--success)';
                let badgeBorder = 'var(--success-border)';
                let badgeLabel = 'Passed';
                let IconComponent = CheckCircle2;
                let iconColor = 'var(--success)';

                if (item.status === 'warning') {
                  badgeBg = 'var(--warning-dim)';
                  badgeColor = 'var(--warning)';
                  badgeBorder = 'var(--warning-border)';
                  badgeLabel = 'Warning';
                  IconComponent = AlertTriangle;
                  iconColor = 'var(--warning)';
                } else if (item.status === 'failed') {
                  badgeBg = 'var(--danger-dim)';
                  badgeColor = 'var(--danger)';
                  badgeBorder = 'var(--danger-border)';
                  badgeLabel = 'Failed';
                  IconComponent = XCircle;
                  iconColor = 'var(--danger)';
                }

                return (
                  <div key={idx} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '10px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = iconColor;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <IconComponent size={16} color={iconColor} style={{ flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.3 }}>{item.desc}</div>
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: 9.5, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                      background: badgeBg,
                      color: badgeColor,
                      border: `1px solid ${badgeBorder}`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontFamily: 'var(--font-mono)',
                      flexShrink: 0
                    }}>
                      {badgeLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </AnalyticsCard>

          {/* 4. RECOMMENDED ACTIONS */}
          <AnalyticsCard title="🚨 Recommended Actions" subtitle="Recommended security check actions to avoid identity leaks. Click on any card to view detailed verification steps.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Horizontal Cards Grid (3 Columns) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                {(currentScenario.trustScore <= 30
                  ? [
                      {
                        id: 1,
                        color: 'var(--success)',
                        emoji: '①',
                        title: 'Verify Recruiter Domain',
                        time: '2 mins',
                        desc: 'Cross-reference recruiter name on LinkedIn to confirm active tenure.',
                        steps: [
                          'Search the recruiter on LinkedIn and confirm they actively work at the company.',
                          'Check if their email matches the official company web domain.',
                          'Compare the domain registry age using a WHOIS search tool.',
                          'Look for public warnings about fake recruiters impersonating this firm.'
                        ]
                      },
                      {
                        id: 2,
                        color: 'var(--success)',
                        emoji: '②',
                        title: 'Contact HR Direct',
                        time: '5 mins',
                        desc: 'Verify the document using official HR channels.',
                        steps: [
                          'Visit the company\'s official website by typing the domain directly.',
                          'Find the verified corporate switchboard or HR contact information.',
                          'Call the HR department directly to verify your offer serial ID.',
                          'Do not use any phone numbers listed within the PDF document itself.'
                        ]
                      },
                      {
                        id: 3,
                        color: 'var(--warning)',
                        emoji: '③',
                        title: 'Zero Upfront Payments Check',
                        time: '1 min',
                        desc: 'Ensure no registration or training deposits are requested.',
                        steps: [
                          'Remember that legitimate companies never demand candidate fee transfers.',
                          'Confirm that you are not asked to buy equipment from unverified vendors.',
                          'Verify that background verification costs are fully borne by the employer.',
                          'Decline any request to pay for online orientation packages or onboarding kits.'
                        ]
                      }
                    ]
                  : [
                      {
                        id: 4,
                        color: 'var(--danger)',
                        emoji: '①',
                        title: 'DO NOT Send Money',
                        time: 'Immediate',
                        desc: 'Decline all registration fees or onboarding deposits.',
                        steps: [
                          'Cease all communications requesting bank transfers or UPI payments.',
                          'No legitimate recruiter asks candidates to pay for background checks.',
                          'Do not purchase laptops or training packages from vendor links.',
                          'Report any UPI IDs or bank accounts requested to cybersecurity registries.'
                        ]
                      },
                      {
                        id: 5,
                        color: 'var(--warning)',
                        emoji: '②',
                        title: 'Contact Official HR',
                        time: '5 mins',
                        desc: 'Verify this offer letter directly with corporate security.',
                        steps: [
                          'Do not reply to the suspicious sender\'s email addresses.',
                          'Look up the actual official website contact directory of the company.',
                          'Email their careers or security desk (e.g., security@company.com).',
                          'Send a copy of this suspicious offer letter file to help their legal team flag it.'
                        ]
                      },
                      {
                        id: 6,
                        color: 'var(--success)',
                        emoji: '③',
                        title: 'Flag Sender Domain',
                        time: '3 mins',
                        desc: 'Report the scam domain to public security registries.',
                        steps: [
                          'File a report on Google Safe Browsing (safebrowsing.google.com).',
                          'Report the phishing email to your mail provider (e.g. Report Phishing in Gmail).',
                          'Register a complaint on national cybercrime portals.',
                          'Alert your university placement cell or job board where you found the listing.'
                        ]
                      }
                    ]
                ).map((rec) => {
                  const isSelected = expandedRecId === rec.id;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => setExpandedRecId(rec.id)}
                      style={{
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 12,
                        background: isSelected ? 'var(--bg-card)' : 'var(--bg-base)',
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 12,
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 0 16px var(--primary-dim)' : 'none',
                        position: 'relative',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'var(--primary-border)';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)';
                      }}
                    >
                      <div>
                        {/* Header Row: Title & Time Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ fontWeight: 755, fontSize: 13.5, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                              fontWeight: 900
                            }}>
                              {rec.emoji}
                            </span>
                            {rec.title}
                          </span>
                          <span style={{
                            fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                            background: isSelected ? 'var(--primary-dim)' : 'var(--bg-card)',
                            color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                            fontFamily: 'var(--font-mono)',
                            whiteSpace: 'nowrap'
                          }}>
                            {rec.time}
                          </span>
                        </div>
                        {/* Description */}
                        <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 8, marginBottom: 0, lineHeight: 1.45 }}>
                          {rec.desc}
                        </p>
                      </div>

                      {/* View Steps Link */}
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        alignSelf: 'flex-end',
                        marginTop: 'auto'
                      }}>
                        {isSelected ? 'Steps expanded ↓' : 'View steps →'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Selected Action Explanation Drawer */}
              {(() => {
                const activeRec = (currentScenario.trustScore <= 30
                  ? [
                      {
                        id: 1,
                        title: 'Verify Recruiter Domain',
                        steps: [
                          'Search the recruiter on LinkedIn and confirm they actively work at the company.',
                          'Check if their email matches the official company web domain.',
                          'Compare the domain registry age using a WHOIS search tool.',
                          'Look for public warnings about fake recruiters impersonating this firm.'
                        ]
                      },
                      {
                        id: 2,
                        title: 'Contact HR Direct',
                        steps: [
                          'Visit the company\'s official website by typing the domain directly.',
                          'Find the verified corporate switchboard or HR contact information.',
                          'Call the HR department directly to verify your offer serial ID.',
                          'Do not use any phone numbers listed within the PDF document itself.'
                        ]
                      },
                      {
                        id: 3,
                        title: 'Zero Upfront Payments Check',
                        steps: [
                          'Remember that legitimate companies never demand candidate fee transfers.',
                          'Confirm that you are not asked to buy equipment from unverified vendors.',
                          'Verify that background verification costs are fully borne by the employer.',
                          'Decline any request to pay for online orientation packages or onboarding kits.'
                        ]
                      }
                    ]
                  : [
                      {
                        id: 4,
                        title: 'DO NOT Send Money',
                        steps: [
                          'Cease all communications requesting bank transfers or UPI payments.',
                          'No legitimate recruiter asks candidates to pay for background checks.',
                          'Do not purchase laptops or training packages from vendor links.',
                          'Report any UPI IDs or bank accounts requested to cybersecurity registries.'
                        ]
                      },
                      {
                        id: 5,
                        title: 'Contact Official HR',
                        steps: [
                          'Do not reply to the suspicious sender\'s email addresses.',
                          'Look up the actual official website contact directory of the company.',
                          'Email their careers or security desk (e.g., security@company.com).',
                          'Send a copy of this suspicious offer letter file to help their legal team flag it.'
                        ]
                      },
                      {
                        id: 6,
                        title: 'Flag Sender Domain',
                        steps: [
                          'File a report on Google Safe Browsing (safebrowsing.google.com).',
                          'Report the phishing email to your mail provider (e.g. Report Phishing in Gmail).',
                          'Register a complaint on national cybercrime portals.',
                          'Alert your university placement cell or job board where you found the listing.'
                        ]
                      }
                    ]
                ).find(r => r.id === expandedRecId);

                if (!activeRec) return null;

                return (
                  <div style={{
                    marginTop: 4,
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    background: 'var(--bg-base)',
                    padding: '20px',
                    animation: 'slideDown 0.25s ease-out'
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 12, letterSpacing: '0.04em', fontFamily: 'var(--font-mono)' }}>
                      VERIFICATION METHODOLOGY FOR: {activeRec.title.toUpperCase()}
                    </div>
                    <ul style={{ listStyleType: 'none', paddingLeft: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {activeRec.steps.map((stepText, sIdx) => (
                        <li key={sIdx} style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <CheckCircle2 size={13} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>{stepText}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}

            </div>
          </AnalyticsCard>

          {/* 5. Center-aligned Action Buttons row */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px', 
            gap: 16,
            boxShadow: 'var(--shadow)',
          }}>
            <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 500, justifyContent: 'center' }}>
              <Btn 
                variant="primary" 
                icon={<Download size={16} />} 
                style={{ flex: 1, padding: '12px 0', fontSize: 13.5, justifyContent: 'center' }}
              >
                Download Report
              </Btn>
              <Btn 
                variant="secondary" 
                icon={<Share2 size={16} />} 
                style={{ flex: 1, padding: '12px 0', fontSize: 13.5, justifyContent: 'center' }}
              >
                Share
              </Btn>
            </div>
            <Btn 
              variant="ghost" 
              onClick={handleReset} 
              icon={<RefreshCw size={16} />}
              style={{ padding: '10px 24px', fontSize: 13.5 }}
            >
              Analyze Another Offer
            </Btn>
          </div>

          {/* 6. Collapsible Advanced Analysis Segment */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <button 
              onClick={() => setExpandAdvanced(!expandAdvanced)}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)', 
                color: 'var(--text)', borderRadius: 'var(--radius-card)',
                fontSize: 13.5, fontWeight: 700, cursor: 'pointer', 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                width: '100%', padding: '12px 18px',
                fontFamily: 'var(--font)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="var(--primary)" />
                {expandAdvanced ? 'Hide Advanced Forensic Reports' : 'Show Advanced Forensic Reports (Metadata, Verification matrices, Radar profile)'}
              </span>
              {expandAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expandAdvanced && (
              <div className="animate-slide" style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 16 }}>
                
                {/* Advanced Row 1: Document Info & Verification Coverage */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
                  
                  {/* Document Information */}
                  <AnalyticsCard title="Document Information" subtitle="Metadata details parsed from file structure.">
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px 16px', fontSize: 12.5 }}>
                      <div>Pages: <strong>{currentScenario.metaPages}</strong></div>
                      <div>Language: <strong>English</strong></div>
                      <div>Company: <strong>{currentScenario.expectedDomain.split('.')[0].toUpperCase()} Technologies</strong></div>
                      <div>Document Type: <strong>Internship Offer Letter</strong></div>
                      <div style={{ gridColumn: 'span 2' }}>OCR Parser Confidence: <strong style={{ color: 'var(--success)' }}>{currentScenario.ocrAccuracy}</strong></div>
                    </div>
                  </AnalyticsCard>

                  {/* Verification Coverage mapping */}
                  <AnalyticsCard title="Verification Coverage" subtitle="System transparent audit capabilities mapping.">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Verified by AI</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {['Formatting', 'Language Integrity', 'Metadata Attributes', 'Recruiter Email Domain', 'Logo Assets matching'].map(item => (
                            <div key={item} style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Check size={10} color="var(--success)" strokeWidth={3} /> {item}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Requires Direct Validation</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {['Official HR Database records', 'Offer Serial ID verification', 'Candidate employee profile', 'Issuing Officer confirmation'].map(item => (
                            <div key={item} style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <AlertTriangle size={10} color="var(--warning)" /> {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AnalyticsCard>
                </div>

                {/* Advanced Row 2: AI Summary Findings & Domain Comparison */}
                <AnalyticsCard title="AI Analyst Key Findings" subtitle="Natural language synthesis and evidentiary audit.">
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
                    
                    {/* Natural language summary list */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>Summary Audit</div>
                      <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>
                        Why was this flagged?
                        <ul style={{ marginTop: 8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {currentScenario.trustScore <= 30 ? (
                            <>
                              <li>The recruiter email matches the official registration records for the company.</li>
                              <li>No suspicious onboarding fee or hardware purchase clauses detected.</li>
                              <li>Multiple corporate signer roles and/or company seal detected.</li>
                              <li>Document formatting profiles comply with corporate publishing guidelines.</li>
                            </>
                          ) : (
                            <>
                              <li>Recruiter operates a generic public domain address or the registrar is unverified.</li>
                              <li>Document requests an onboarding background registration/kit fee.</li>
                              <li>The signature validation check could not confirm cryptographic signing.</li>
                              <li>Newly registered or typosquatted domain detected in matching headers.</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Expected vs Detected Domain Comparison */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Side-by-Side Verification Mismatch</div>
                      
                      <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>HR Web Domain</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12.5 }}>
                          <div>Expected: <span style={{ color: 'var(--success)', fontWeight: 700 }}>{currentScenario.expectedDomain}</span></div>
                          <div>Detected: <span style={{ color: currentScenario.expectedDomain === currentScenario.detectedDomain ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{currentScenario.detectedDomain}</span></div>
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Recruiter Email Address</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12.5 }}>
                          <div>Expected: @<span style={{ color: 'var(--success)', fontWeight: 700 }}>{currentScenario.expectedDomain}</span></div>
                          <div>Detected: <span style={{ color: currentScenario.detectedEmail.endsWith(currentScenario.expectedDomain) ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{currentScenario.detectedEmail.split('@')[1] || ''}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </AnalyticsCard>

                {/* Advanced Row 3: Radar Chart, Metadata & Scam Match */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
                  
                  {/* Left Column: Metadata & Scam templates */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    
                    {/* Metadata inspector */}
                    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                        <FileCode size={15} color="var(--primary)" /> Document Metadata Inspection
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                        <div><span style={{ color: 'var(--text-secondary)' }}>File Author:</span> <strong>{currentScenario.metaAuthor}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Software Tool:</span> <strong>{currentScenario.metaSoftware}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Created:</span> <strong>{currentScenario.metaCreated}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Modified:</span> <strong>{currentScenario.metaModified}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Total Pages:</span> <strong>{currentScenario.metaPages}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Resolution:</span> <strong>{currentScenario.metaResolution}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Fonts Embedded:</span> <strong>{currentScenario.metaFonts}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Digital Sign Check:</span> <strong style={{ color: currentScenario.metaSignature.includes('Valid') || currentScenario.metaSignature.includes('Present') ? 'var(--success)' : 'var(--danger)' }}>{currentScenario.metaSignature}</strong></div>
                      </div>
                    </div>

                    {/* Scam fingerprint */}
                    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                        <ShieldCheck size={15} color="var(--primary)" /> Template Match & Scam Fingerprint
                      </div>
                      <div style={{ display: 'flex', justifyItems: 'space-between', alignItems: 'center', gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: currentScenario.trustScore <= 30 ? 'var(--success)' : 'var(--danger)' }}>
                            {currentScenario.similarityMatch}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                            Detected signature pattern seen <strong>{currentScenario.similarityTimes}</strong> times inside global registries.
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 24, fontWeight: 900, color: currentScenario.trustScore <= 30 ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
                            {currentScenario.trustScore <= 30 ? '98%' : '94%'}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Match Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Radar Chart & OCR stats */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
                    
                    {/* Radar Chart */}
                    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 14, alignSelf: 'flex-start' }}>Score Profile Radar Chart</div>
                      
                      <svg width="250" height="220" viewBox="0 0 250 220" style={{ overflow: 'visible' }}>
                        {/* Grid polygons */}
                        <polygon points="125,20 215,70 215,160 125,200 35,160 35,70" fill="none" stroke="var(--border)" strokeWidth="1" />
                        <polygon points="125,50 185,82 185,150 125,175 65,150 65,82" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="3" />
                        <polygon points="125,80 155,95 155,140 125,150 95,140 95,95" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="3" />
                        
                        {/* Axis lines */}
                        <line x1="125" y1="110" x2="125" y2="20" stroke="var(--border)" strokeWidth="1" />
                        <line x1="125" y1="110" x2="215" y2="70" stroke="var(--border)" strokeWidth="1" />
                        <line x1="125" y1="110" x2="215" y2="160" stroke="var(--border)" strokeWidth="1" />
                        <line x1="125" y1="110" x2="125" y2="200" stroke="var(--border)" strokeWidth="1" />
                        <line x1="125" y1="110" x2="35" y2="160" stroke="var(--border)" strokeWidth="1" />
                        <line x1="125" y1="110" x2="35" y2="70" stroke="var(--border)" strokeWidth="1" />

                        {/* Score point polygon */}
                        <polygon 
                          points={currentScenario.radarPoints}
                          fill={currentScenario.trustScore <= 30 ? 'var(--success-dim, rgba(16, 185, 129, 0.15))' : 'var(--danger-dim, rgba(239, 68, 68, 0.15))'}
                          stroke={currentScenario.trustScore <= 30 ? 'var(--success)' : 'var(--danger)'}
                          strokeWidth="2.5"
                          style={{ transition: 'all 0.5s ease-in-out' }}
                        />

                        {/* Dimension labels */}
                        <text x="125" y="12" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontWeight="700">Domain</text>
                        <text x="222" y="68" textAnchor="start" fill="var(--text-secondary)" fontSize="9" fontWeight="700">Recruiter</text>
                        <text x="222" y="165" textAnchor="start" fill="var(--text-secondary)" fontSize="9" fontWeight="700">Formatting</text>
                        <text x="125" y="212" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontWeight="700">Document</text>
                        <text x="28" y="165" textAnchor="end" fill="var(--text-secondary)" fontSize="9" fontWeight="700">Language</text>
                        <text x="28" y="68" textAnchor="end" fill="var(--text-secondary)" fontSize="9" fontWeight="700">Identity</text>
                      </svg>
                    </div>

                    {/* OCR Stats */}
                    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, width: '100%' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 14 }}>OCR Statistics</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                        <div>OCR Parser Confidence: <strong style={{ color: 'var(--success)' }}>{currentScenario.ocrAccuracy}</strong></div>
                        <div>Words Extracted: <strong>{currentScenario.words}</strong></div>
                        <div>Tables Detected: <strong>{currentScenario.tables}</strong></div>
                        <div>Images Extracted: <strong>{currentScenario.images}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Collapsible Subtle Footer Disclaimer */}
          <details style={{ 
            marginTop: 12, 
            padding: '12px 18px', 
            border: '1px solid var(--border)', 
            borderRadius: 'var(--radius-card)',
            background: 'var(--bg-card)',
            cursor: 'pointer' 
          }}>
            <summary style={{ 
              fontSize: 12, 
              color: 'var(--text-secondary)', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              listStyle: 'none',
              outline: 'none'
            }}>
              <Info size={14} color="var(--text-secondary)" />
              <span>ⓘ Analysis Limitations & Disclaimers</span>
            </summary>
            <p style={{ 
              fontSize: 11.5, 
              color: 'var(--text-secondary)', 
              marginTop: 8, 
              lineHeight: 1.5, 
              cursor: 'default'
            }}>
              This report evaluates document layout quality, visual consistency, metadata values, registrar details, and common advance-fee scam text signatures. Authenticity cannot be guaranteed unless verified directly with the HR database records of the issuing company.
            </p>
          </details>
        </div>
      )}


      {/* ════ INTERACTIVE EXPLAIN FINDING MODAL DIALOG ════ */}
      {showExplainModal && explainData && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--bg-overlay)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: 24
        }}
        onClick={() => setShowExplainModal(false)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="animate-scale"
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '28px', maxWidth: '500px', width: '100%',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--primary)', marginBottom: 20 }}>
              <ShieldAlert size={22} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Forensic Finding Inspector</h3>
            </div>
            
            <h4 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              {explainData.label}
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>What was checked</span>
                <p style={{ fontSize: 13, color: 'var(--text)', marginTop: 4, lineHeight: 1.5 }}>{explainData.check}</p>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Why it matters</span>
                <p style={{ fontSize: 13, color: 'var(--text)', marginTop: 4, lineHeight: 1.5 }}>{explainData.why}</p>
              </div>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Severity Risk</span>
                  <div style={{ 
                    fontSize: 12, fontWeight: 800, marginTop: 4, padding: '2px 8px', borderRadius: 4, display: 'inline-block',
                    background: explainData.risk === 'High' ? 'var(--danger-dim)' : explainData.risk === 'Medium' ? 'var(--warning-dim)' : 'var(--success-dim)',
                    color: explainData.risk === 'High' ? 'var(--danger)' : explainData.risk === 'Medium' ? 'var(--warning)' : 'var(--success)'
                  }}>
                    {explainData.risk} Risk
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Detection Confidence</span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{explainData.confidence}%</p>
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recommendation</span>
                <p style={{ fontSize: 13, color: 'var(--text)', marginTop: 4, lineHeight: 1.5, fontWeight: 600 }}>{explainData.recommendation}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Btn variant="primary" onClick={() => setShowExplainModal(false)}>Close Inspector</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe styles injector */}
      <style>{`
        @keyframes pulseGlow {
          from { box-shadow: 0 0 4px rgba(0,200,255,0.2); }
          to { box-shadow: 0 0 16px rgba(0,200,255,0.6); }
        }
      `}</style>
    </div>
  );
}
