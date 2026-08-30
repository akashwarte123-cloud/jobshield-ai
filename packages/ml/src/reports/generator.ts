/**
 * JobShield AI — Forensic Audit Report Generator (PDF, Markdown, JSON)
 */

import { RiskAnalysisResult, CompanyVerificationDTO, RedFlagDTO } from '@jobshield/shared';

export interface ForensicReport {
  id: string;
  title: string;
  company: string;
  recruiterEmail: string;
  generatedAt: string;
  analysis: RiskAnalysisResult;
  verification: CompanyVerificationDTO;
  markdownContent: string;
  htmlPrintTemplate: string;
}

export class ReportGenerator {
  public static generateReport(
    title: string,
    company: string,
    email: string,
    analysis: RiskAnalysisResult,
    verification: CompanyVerificationDTO
  ): ForensicReport {
    const reportId = `RPT-${Math.floor(100000 + Math.random() * 900000)}`;
    const generatedAt = new Date().toISOString();

    // Generate Markdown Report Format
    const markdownContent = `# 🛡️ JobShield AI — Threat Forensic Audit Report
**Report ID**: ${reportId}
**Date & Time**: ${generatedAt}
**Classification**: ${analysis.verdict}

---

## 1. Executive Summary
- **Target Position**: ${title || 'Untitled Listing'}
- **Company Entity**: ${company || 'Unknown Entity'}
- **Recruiter Email**: ${email || 'N/A'}
- **Composite Risk Score**: ${analysis.score} / 100 (${analysis.verdict})
- **Employer Domain Trust Score**: ${verification.trustScore} / 100 (${verification.isVerifiedEmployer ? 'VERIFIED EMPLOYER' : 'UNVERIFIED / SUSPICIOUS'})

---

## 2. Detected Threat Vectors & Red Flags
${analysis.redFlags.length === 0 ? '- No critical red flags detected.' : analysis.redFlags.map((f: RedFlagDTO) => `### [${f.severity}] ${f.title}\n- **Rule Code**: \`${f.code}\`\n- **Details**: ${f.explanation}\n- **Score Weight**: +${f.weight} PTS`).join('\n\n')}

---

## 3. Domain Hygiene & WHOIS Telemetry
- **Domain Age**: ${verification.whoisAgeDays} days
- **Registrant Org**: ${verification.whoisRegistrant}
- **SSL Certificate**: ${verification.hasValidSSL ? `Valid (${verification.sslIssuer})` : 'MISSING / INVALID'}
- **MX Record Status**: ${verification.hasMxRecord ? 'Active Mail Servers' : 'No MX Records Found'}

---
*Generated automatically by JobShield AI v4.2 Security Operations Engine.*`;

    // Generate Printable HTML/PDF Template
    const htmlPrintTemplate = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; line-height: 1.6;">
        <div style="display: flex; justify-content: space-between; items: center; border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px;">
          <div>
            <h1 style="margin: 0; font-size: 24px; color: #0078d4;">JobShield AI Threat Audit</h1>
            <div style="font-size: 12px; color: #666;">Report ID: ${reportId} | ${generatedAt}</div>
          </div>
          <div style="font-weight: bold; font-size: 18px; color: ${analysis.score >= 50 ? '#d9534f' : '#5cb85c'}; border: 2px solid ${analysis.score >= 50 ? '#d9534f' : '#5cb85c'}; padding: 6px 12px; borderRadius: 6px;">
            ${analysis.verdict} (${analysis.score}/100)
          </div>
        </div>

        <h2 style="font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">1. Target Information</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr><td style="padding: 6px; font-weight: bold; width: 180px;">Job Title:</td><td>${title}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Employer Entity:</td><td>${company}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Recruiter Contact:</td><td>${email}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Domain Age:</td><td>${verification.whoisAgeDays} Days Old</td></tr>
        </table>

        <h2 style="font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">2. Detected Red Flags</h2>
        <ul style="padding-left: 20px; margin-bottom: 24px;">
          ${analysis.redFlags.map((f: RedFlagDTO) => `<li style="margin-bottom: 8px;"><strong>[${f.severity}] ${f.title}</strong>: ${f.explanation}</li>`).join('')}
        </ul>

        <div style="font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 12px; margin-top: 40px; text-align: center;">
          Official Consumer Protection Forensic Document • JobShield AI Cybersecurity Operations
        </div>
      </div>
    `;

    return {
      id: reportId,
      title,
      company,
      recruiterEmail: email,
      generatedAt,
      analysis,
      verification,
      markdownContent,
      htmlPrintTemplate
    };
  }
}
