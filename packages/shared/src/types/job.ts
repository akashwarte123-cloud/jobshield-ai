/**
 * VeriJob Job Entity & Scan Request DTOs
 */

import { RiskAnalysisResult } from './scam.js';

export interface JobPostingInput {
  title?: string;
  company?: string;
  email?: string;
  url?: string;
  description: string;
  salaryText?: string;
  locationText?: string;
}

export interface JobScanRecord {
  id: string;
  userId?: string;
  timestamp: string;
  jobData: JobPostingInput;
  result: RiskAnalysisResult;
  source: 'WEB_DASHBOARD' | 'CHROME_EXTENSION' | 'API';
}
