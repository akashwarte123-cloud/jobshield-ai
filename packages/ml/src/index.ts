/**
 * JobShield AI — Machine Learning & Explainable AI (XAI) Package
 */

export * from './pipeline/dataset.js';
export * from './pipeline/cleaning.js';
export * from './pipeline/tfidf.js';
export * from './pipeline/models.js';
export * from './pipeline/optuna_mlflow.js';
export * from './pipeline/shap.js';
export * from './hybrid/engine.js';
export * from './verification/verifier.js';
export * from './reports/generator.js';

import { HybridAIEngine } from './hybrid/engine.js';
import { JobPostingInput, RiskAnalysisResult, RedFlagDTO } from '@jobshield/shared';

/**
 * Unified Production Scam Classifier Pipeline
 */
export class ScamClassifier {
  public static classify(input: JobPostingInput): RiskAnalysisResult {
    const hybridRes = HybridAIEngine.evaluate(
      input.title || '',
      input.company || '',
      input.email || '',
      input.url || '',
      input.description || ''
    );

    const redFlags: RedFlagDTO[] = [];
    const textLower = (input.description || '').toLowerCase() + ' ' + (input.title || '').toLowerCase() + ' ' + (input.company || '').toLowerCase();

    if (textLower.includes('fee') || textLower.includes('deposit') || /(?:registration|verification|processing|application|training)\s*fee/.test(textLower) || /pay\s+(?:a\s+)?refundable/.test(textLower)) {
      redFlags.push({
        id: 'rf-payment',
        code: 'UPFRONT_FEE_TRAP',
        category: 'FINANCIAL',
        severity: 'CRITICAL',
        title: 'Upfront Registration / Verification Fee Demand',
        explanation: 'Requires job seekers to pay an upfront registration, processing, or verification fee before employment starts.',
        weight: 40
      });
    }

    if (/(?:purchase|buy)\s+(?:.*?\s+)?(?:laptop|equipment|software|package)/.test(textLower) || textLower.includes('designated supplier') || textLower.includes('approved vendor') || textLower.includes('company-approved laptop')) {
      redFlags.push({
        id: 'rf-equipment',
        code: 'MANDATORY_EQUIPMENT_PURCHASE',
        category: 'FINANCIAL',
        severity: 'CRITICAL',
        title: 'Mandatory Equipment / Software Purchase Requirement',
        explanation: 'Directs candidate to purchase equipment or software packages through a designated supplier or vendor.',
        weight: 35
      });
    }

    if (textLower.includes('check') || textLower.includes('wire')) {
      redFlags.push({
        id: 'rf-check',
        code: 'FINANCIAL_WIRE_TRAP',
        category: 'FINANCIAL',
        severity: 'CRITICAL',
        title: 'Fake Check & Upfront Wire Transfer Trap',
        explanation: 'Demands candidate to deposit a certified check and wire funds to a third-party equipment vendor.',
        weight: 35
      });
    }

    if (textLower.includes('telegram') || textLower.includes('whatsapp') || textLower.includes('signal')) {
      redFlags.push({
        id: 'rf-telegram',
        code: 'TELEGRAM_INTERVIEW_PROTOCOL',
        category: 'COMMUNICATION',
        severity: 'HIGH',
        title: 'Unverified Telegram/WhatsApp Interview Protocol',
        explanation: 'Directs candidate to conduct text-only interview over messaging app with no video/phone verification.',
        weight: 25
      });
    }

    if (/(?:\$|₹)\s*(?:[5-9]\d|[1-9]\d{2,})\s*(?:per\s*hour|\/\s*hour|\/\s*hr|per\s*hr)/i.test(input.description || '') || /(?:\$|₹)75\/hour/i.test(input.description || '')) {
      redFlags.push({
        id: 'rf-salary',
        code: 'UNREALISTIC_COMPENSATION_RATE',
        category: 'COMPENSATION',
        severity: 'HIGH',
        title: 'Unrealistically High Entry-Level Hourly Rate',
        explanation: 'Promises compensation far above market norms ($75+/hour) for entry-level tasks requiring no experience.',
        weight: 25
      });
    }

    if (input.email && (input.email.includes('@gmail.com') || input.email.includes('@yahoo.com'))) {
      redFlags.push({
        id: 'rf-freemail',
        code: 'FREE_EMAIL_DISCREPANCY',
        category: 'COMMUNICATION',
        severity: 'HIGH',
        title: `Free Email Domain Discrepancy (@${input.email.split('@')[1]})`,
        explanation: 'Recruiter uses a free public mail provider instead of official corporate domain.',
        weight: 20
      });
    }

    let score = hybridRes.compositeRiskScore;
    
    // Elevate score based on critical red flags to avoid logical contradictions
    let hasCritical = false;
    redFlags.forEach(flag => {
      if (flag.severity === 'CRITICAL') {
        hasCritical = true;
      }
    });

    if (hasCritical) {
      score = Math.max(score, 65);
    }

    let verdict: 'SAFE' | 'CAUTION' | 'DANGER' = 'SAFE';
    let badgeColor: 'safe' | 'caution' | 'danger' = 'safe';

    if (score >= 65) {
      verdict = 'DANGER';
      badgeColor = 'danger';
    } else if (score >= 30) {
      verdict = 'CAUTION';
      badgeColor = 'caution';
    }

    return {
      score,
      verdict,
      badgeColor,
      summaryText: verdict === 'DANGER' 
        ? 'High probability of fraudulent scam scheme detected by Hybrid AI Fusion Engine.'
        : (verdict === 'CAUTION' ? 'Suspicious elements detected in job posting.' : 'Posting matches standard legitimate corporate recruitment patterns.'),
      redFlags,
      breakdown: {
        financial: hybridRes.layerBreakdown.ruleEngine.score,
        communication: hybridRes.layerBreakdown.verificationServices.score,
        identity: hybridRes.layerBreakdown.reputationGraph.score,
        urgency: hybridRes.layerBreakdown.machineLearning.score
      },
      analyzedAt: new Date().toISOString()
    };
  }
}
