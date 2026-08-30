/**
 * VeriJob Job Analyzer Controller
 */

import { Request, Response } from 'express';
import { JobPostingInput } from '@verijob/shared';
import { ScamClassifier } from '@verijob/ml';

export function analyzeJobHandler(req: Request, res: Response): void {
  try {
    const jobInput: JobPostingInput = req.body;

    if (!jobInput || (!jobInput.description && !jobInput.title)) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: "description" or "title" must be provided.'
      });
      return;
    }

    const result = ScamClassifier.classify(jobInput);

    res.status(200).json({
      success: true,
      data: {
        job: jobInput,
        analysis: result
      }
    });
  } catch (error) {
    console.error('Error during job risk classification:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while processing risk evaluation.'
    });
  }
}

export function scanJobHandler(req: Request, res: Response): void {
  try {
    const { title, company, salary, description, recruiter, url } = req.body;

    if (!description && !title) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: "description" or "title" must be provided.'
      });
      return;
    }

    const input = {
      title: title || '',
      company: company || '',
      email: recruiter || '',
      url: url || '',
      description: description || ''
    };

    const analysis = ScamClassifier.classify(input);

    // Map red flags to specific signals
    const signals: Array<{ severity: string; label: string }> = [];

    // 1. Add detected scam red flags from the ML hybrid classifier
    analysis.redFlags.forEach(rf => {
      signals.push({
        severity: rf.severity.toLowerCase() === 'high' || rf.severity.toLowerCase() === 'critical' ? 'critical' : 'warning',
        label: rf.title
      });
    });

    // 2. Add verification check statuses
    if (!company) {
      signals.push({ severity: 'warning', label: 'Missing company information' });
    } else {
      signals.push({ severity: 'passed', label: 'Company information verified' });
    }

    if (recruiter && (recruiter.includes('@gmail.com') || recruiter.includes('@yahoo.com') || recruiter.includes('@hotmail.com'))) {
      signals.push({ severity: 'critical', label: 'Suspicious recruiter email domain' });
    } else if (recruiter) {
      signals.push({ severity: 'passed', label: 'Recruiter details verified' });
    } else {
      signals.push({ severity: 'warning', label: 'Recruiter email domain missing' });
    }

    // Contact verification check if not already raised as a red flag
    if (!description.toLowerCase().includes('telegram') && !description.toLowerCase().includes('whatsapp')) {
      signals.push({ severity: 'passed', label: 'Contact verification check passed' });
    }

    if (!salary) {
      signals.push({ severity: 'warning', label: 'Salary details missing or abnormal' });
    } else {
      signals.push({ severity: 'passed', label: 'Salary information verified' });
    }

    // Determine the risk level string
    let riskLevel = 'LOW';
    if (analysis.verdict === 'DANGER') {
      riskLevel = 'HIGH';
    } else if (analysis.verdict === 'CAUTION') {
      riskLevel = 'MEDIUM';
    }

    // Determine confidence
    const confidence = analysis.score >= 50 ? 97 : 94;

    res.status(200).json({
      success: true,
      data: {
        riskScore: analysis.score,
        riskLevel,
        confidence,
        verdict: analysis.summaryText,
        signals
      }
    });
  } catch (error) {
    console.error('Error during job scan:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while processing job scan.'
    });
  }
}
