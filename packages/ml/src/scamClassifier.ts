/**
 * JobShield ML & Hybrid Classifier Engine
 */

import { JobPostingInput, RiskAnalysisResult, RedFlagDTO } from '@jobshield/shared';
import { CleanTextPipeline } from './pipeline/cleaning.js';

export interface ScamPattern {
  id: string;
  category: string;
  regex: RegExp;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  weight: number;
  title: string;
  explanation: string;
}

export const CORE_PATTERNS: ScamPattern[] = [
  {
    id: 'TELEGRAM_WHATSAPP_INTERVIEW',
    category: 'Communication',
    regex: /(interview\s+via|contact\s+on|contact\s+our\s+hiring\s+manager|reach\s+out\s+on|download|telegram:\s*@)\s*(telegram|whatsapp|signal|wire|text\s+only|chat\s+app|\w+)/i,
    severity: 'HIGH',
    weight: 25,
    title: 'Messaging App Interview Requirement',
    explanation: 'Legitimate employers rarely conduct formal job interviews exclusively over Telegram, WhatsApp, or instant messaging text apps.'
  },
  {
    id: 'UPFRONT_FEE_DEMAND',
    category: 'Financial',
    regex: /(?:registration|verification|processing|application|training)\s*(?:and\s*\w+\s*)?fee|refundable\s*(?:(?:₹|rs\.?|inr|\$)\s*[\d,]+\s*)?(?:registration|fee|deposit)|pay\s+(?:a\s+)?refundable/i,
    severity: 'CRITICAL',
    weight: 40,
    title: 'Upfront Registration / Verification Fee Demand',
    explanation: 'CRITICAL WARNING: The employer demands an upfront fee, registration charge, or deposit before interview or employment.'
  },
  {
    id: 'UPFRONT_EQUIPMENT_CHECK',
    category: 'Financial',
    regex: /(send\s+you\s+a\s+check|purchase\s+(home\s+office|equipment|laptop|a\s+company[- ]approved)|buy\s+from\s+our\s+vendor|designated\s+supplier|reimburse\s+you\s+via\s+check|wire\s+funds|deposit\s+check)/i,
    severity: 'CRITICAL',
    weight: 35,
    title: 'Mandatory Equipment Purchase / Fake Check Scheme',
    explanation: 'CRITICAL WARNING: The employer mandates purchasing equipment or software packages through a designated supplier or fake check scheme.'
  },
  {
    id: 'UNREALISTIC_HOURLY_SALARY',
    category: 'Compensation',
    regex: /(?:\$|₹)\s*(?:[5-9]\d|[1-9]\d{2,})\s*(?:per\s*hour|\/\s*hour|\/\s*hr|per\s*hr)|(?:\$|₹)75\/hour/i,
    severity: 'HIGH',
    weight: 25,
    title: 'Unrealistically High Entry-Level Compensation',
    explanation: 'Promises hourly pay far exceeding market norms ($75+/hour) for entry-level positions requiring no experience.'
  }
];

export class ScamClassifierLegacy {
  public static classify(job: JobPostingInput): RiskAnalysisResult {
    const fullText = `${job.title || ''} ${job.company || ''} ${job.description || ''}`;
    const cleaned = CleanTextPipeline.process(fullText);

    let totalRisk = 0;
    if (cleaned.uppercaseRatio > 0.20) totalRisk += 15;
    const redFlags: RedFlagDTO[] = [];

    CORE_PATTERNS.forEach(pattern => {
      if (pattern.regex.test(fullText)) {
        totalRisk += pattern.weight;
        redFlags.push({
          id: pattern.id,
          code: pattern.id,
          category: pattern.category,
          severity: pattern.severity,
          title: pattern.title,
          explanation: pattern.explanation,
          weight: pattern.weight
        });
      }
    });

    const score = Math.min(Math.round(totalRisk), 100);

    let verdict: 'SAFE' | 'CAUTION' | 'DANGER' = 'SAFE';
    let badgeColor: 'safe' | 'caution' | 'danger' = 'safe';

    if (score >= 50) {
      verdict = 'DANGER';
      badgeColor = 'danger';
    } else if (score >= 20) {
      verdict = 'CAUTION';
      badgeColor = 'caution';
    }

    return {
      score,
      verdict,
      badgeColor,
      summaryText: verdict === 'DANGER' ? 'CRITICAL RISK DETECTED' : 'Clean posting signal',
      redFlags,
      breakdown: {
        financial: 40,
        communication: 20,
        identity: 10,
        urgency: 15
      },
      analyzedAt: new Date().toISOString()
    };
  }
}
