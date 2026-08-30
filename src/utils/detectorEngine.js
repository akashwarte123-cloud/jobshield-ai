/**
 * VeriJob Multi-Factor Job Scam Detection & Risk Analyzer Engine
 */

// Free / Public mail domain list
const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
  'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'gmx.com'
];

// Suspicious Top Level Domains / Free Hosting
const SUSPICIOUS_DOMAINS = [
  '.xyz', '.top', '.site', '.online', '.club', '.work', '.biz',
  'blogspot.com', 'wordpress.com', 'wixsite.com', 'weebly.com', 'tinyurl.com', 'bit.ly'
];

// Known Scam Indicator Patterns with Severity and Descriptions
export const SCAM_PATTERNS = [
  {
    id: 'TELEGRAM_WHATSAPP_INTERVIEW',
    category: 'Communication',
    regex: /(interview\s+via|contact\s+on|reach\s+out\s+on|download)\s*(telegram|whatsapp|signal|wire|text\s+only|chat\s+app)/i,
    severity: 'HIGH',
    weight: 25,
    title: 'Messaging App Interview Requirement',
    explanation: 'Legitimate employers rarely conduct formal job interviews exclusively over Telegram, WhatsApp, or instant messaging apps without a video call or corporate email invitation.'
  },
  {
    id: 'UPFRONT_EQUIPMENT_CHECK',
    category: 'Financial',
    regex: /(send\s+you\s+a\s+check|purchase\s+(home\s+office|equipment|laptop)|buy\s+from\s+our\s+vendor|reimburse\s+you\s+via\s+check|wire\s+funds|deposit\s+check)/i,
    severity: 'CRITICAL',
    weight: 35,
    title: 'Fake Check & Equipment Purchase Trap',
    explanation: 'CRITICAL WARNING: The employer claims they will send you a check to purchase equipment from their "approved vendor". The check will later bounce, leaving you liable for thousands of dollars.'
  },
  {
    id: 'UNREALISTIC_SALARY_ENTRY',
    category: 'Financial',
    regex: /(\$([5-9]\d|[1-9]\d{2})\s*\/\s*hr|\$([3-9]\d|\d{3}),?\d{3}\s*\/\s*yr|\$\d{3,4}\s*weekly|\$\d{3,4}\s*daily).*(entry\s*level|data\s*entry|no\s*experience)/i,
    severity: 'HIGH',
    weight: 25,
    title: 'Unrealistic Pay for Entry-Level Work',
    explanation: 'Offering $60-$100+/hr or thousands per week for simple entry-level data entry or typing is a signature lure used in fake job scams.'
  },
  {
    id: 'PAYMENT_VIA_CRYPTO_ZELLE',
    category: 'Financial',
    regex: /(payment|payout|paid)\s+(via|in|through)\s*(crypto|bitcoin|usdt|zelle|cash\s*app|venmo|gift\s*card)/i,
    severity: 'HIGH',
    weight: 25,
    title: 'Non-Standard / Irreversible Payout Methods',
    explanation: 'Legitimate companies utilize standard payroll (Direct Deposit, ADP, Gusto, W2/1099 contracts), not Zelle, gift cards, or cryptocurrency.'
  },
  {
    id: 'IDENTITY_THEFT_SSN_BEFORE_OFFER',
    category: 'Identity',
    regex: /(ssn|social\s+security\s+number|credit\s+score|credit\s+report\s+check|copy\s+of\s+driver'?s\s+license)\s*(required\s+before|for\s+application|to\s+proceed)/i,
    severity: 'HIGH',
    weight: 20,
    title: 'Premature Personal / Financial Data Collection',
    explanation: 'Demanding SSN, bank credentials, or credit reports before an official in-person/video interview or formal job offer is a major identity theft risk.'
  },
  {
    id: 'RESHIPPING_PACKAGE_MULE',
    category: 'Illegal Activity',
    regex: /(receive\s+packages|inspect\s+and\s+reship|forward\s+packages|package\s+handler\s+at\s+home|quality\s+control\s+inspector)/i,
    severity: 'CRITICAL',
    weight: 35,
    title: 'Package Reshipping / Money Mule Scheme',
    explanation: 'Reshipping packages from home involves handling goods purchased with stolen credit cards, making you an unwitting accomplice in stolen property trafficking.'
  },
  {
    id: 'URGENT_HIRING_PRESSURE',
    category: 'Psychological',
    regex: /(start\s+immediately|must\s+hire\s+today|instant\s+job\s+offer|no\s+interview\s+needed|limited\s+slots\s+left)/i,
    severity: 'MEDIUM',
    weight: 15,
    title: 'High-Pressure Artificial Urgency',
    explanation: 'Scammers rush candidates into accepting offers without proper vetting to prevent them from researching the company or noticing inconsistencies.'
  },
  {
    id: 'VAGUE_DUTIES_GENERIC',
    category: 'Role Specifics',
    regex: /(simple\ catalogue\ work|posting\ ads\ online|just\ typing\ text|no\ special\ skills|work\ 1-2\ hours\ daily)/i,
    severity: 'MEDIUM',
    weight: 12,
    title: 'Vague / Oversimplified Job Scope',
    explanation: 'Extremely generic job descriptions lacking specific technical or organizational responsibilities are common in mass-phishing job templates.'
  }
];

/**
 * Main Analysis Function
 */
export function analyzeJobPosting(jobData) {
  const title = jobData.title || '';
  const company = jobData.company || '';
  const email = jobData.email || '';
  const url = jobData.url || '';
  const description = jobData.description || '';
  const fullText = `${title} ${company} ${description}`;

  let totalRiskWeight = 0;
  const redFlags = [];

  // 1. Text Pattern Matching
  SCAM_PATTERNS.forEach((pattern) => {
    if (pattern.regex.test(fullText)) {
      totalRiskWeight += pattern.weight;
      redFlags.push({
        id: pattern.id,
        category: pattern.category,
        severity: pattern.severity,
        title: pattern.title,
        explanation: pattern.explanation,
        weight: pattern.weight
      });
    }
  });

  // 2. Contact Email Hygiene Analysis
  let contactRisk = 0;
  if (email) {
    const domain = email.split('@')[1]?.toLowerCase() || '';
    if (FREE_EMAIL_DOMAINS.includes(domain)) {
      contactRisk += 25;
      totalRiskWeight += 25;
      redFlags.push({
        id: 'FREE_EMAIL_RECRUITER',
        category: 'Contact',
        severity: 'HIGH',
        title: `Free Email Domain Used (@${domain})`,
        explanation: `The hiring contact is using a free mail provider (@${domain}) rather than an official corporate email domain (e.g., hr@${company.toLowerCase().replace(/\s+/g, '')}.com).`,
        weight: 25
      });
    }

    if (company && domain && !FREE_EMAIL_DOMAINS.includes(domain)) {
      const cleanCompany = company.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanDomain = domain.split('.')[0];
      if (cleanCompany.length > 3 && !cleanDomain.includes(cleanCompany) && !cleanCompany.includes(cleanDomain)) {
        contactRisk += 15;
        totalRiskWeight += 15;
        redFlags.push({
          id: 'DOMAIN_MISMATCH',
          category: 'Contact',
          severity: 'MEDIUM',
          title: 'Email Domain & Company Name Mismatch',
          explanation: `The contact domain (@${domain}) does not appear to match the company name "${company}". Verify the employer's official domain.`,
          weight: 15
        });
      }
    }
  }

  // 3. URL Safety Analysis
  if (url) {
    const isSuspiciousDomain = SUSPICIOUS_DOMAINS.some(d => url.toLowerCase().includes(d));
    if (isSuspiciousDomain) {
      totalRiskWeight += 20;
      redFlags.push({
        id: 'SUSPICIOUS_URL_TLD',
        category: 'URL / Domain',
        severity: 'HIGH',
        title: 'Suspicious Job Link / Domain TLD',
        explanation: 'The provided job link utilizes a URL shortener or low-trust top-level domain commonly associated with malicious redirects.',
        weight: 20
      });
    }
  }

  // Calculate Normalized Risk Index (0 - 100)
  const score = Math.min(Math.round(totalRiskWeight), 100);

  // Determine Risk Category & Verdict
  let verdict = 'VERIFIED_SAFE';
  let badgeColor = 'safe';
  let summaryText = 'Low Risk: No significant fraudulent patterns detected. standard due diligence recommended.';

  if (score >= 50) {
    verdict = 'HIGH_SCAM_DANGER';
    badgeColor = 'danger';
    summaryText = 'CRITICAL RISK: Multiple major scam indicators detected! Do not send money, bank details, or SSN.';
  } else if (score >= 20) {
    verdict = 'MODERATE_CAUTION';
    badgeColor = 'caution';
    summaryText = 'MODERATE CAUTION: Suspect elements found. Perform extra verification on company credentials before proceeding.';
  }

  // Calculate Breakdown Scores per Category
  const textRisk = Math.min(redFlags.filter(r => r.category === 'Financial' || r.category === 'Role Specifics').reduce((acc, r) => acc + r.weight, 0) * 2, 100);
  const commRisk = Math.min(redFlags.filter(r => r.category === 'Communication' || r.category === 'Contact').reduce((acc, r) => acc + r.weight, 0) * 2, 100);
  const identityRisk = Math.min(redFlags.filter(r => r.category === 'Identity' || r.category === 'Illegal Activity').reduce((acc, r) => acc + r.weight, 0) * 2, 100);
  const urgencyRisk = Math.min(redFlags.filter(r => r.category === 'Psychological').reduce((acc, r) => acc + r.weight, 0) * 4, 100);

  // Generate Highlight Snippets for UI
  const highlightedDescription = generateHighlightedText(description, SCAM_PATTERNS);

  return {
    score,
    verdict,
    badgeColor,
    summaryText,
    redFlags,
    breakdown: {
      financial: textRisk,
      communication: commRisk,
      identity: identityRisk,
      urgency: urgencyRisk
    },
    highlightedDescription
  };
}

/**
 * Helper to annotate text with HTML span highlights for detected scam phrases
 */
function generateHighlightedText(text, patterns) {
  if (!text) return '';
  let annotated = text;

  patterns.forEach((pattern) => {
    annotated = annotated.replace(pattern.regex, (match) => {
      const cls = pattern.severity === 'CRITICAL' || pattern.severity === 'HIGH' ? 'highlight-scam' : 'highlight-caution';
      return `<span class="${cls}" title="${pattern.title}: ${pattern.explanation}">${match}</span>`;
    });
  });

  return annotated;
}
