/**
 * VeriJob Scam Detection & Risk Assessment Core Types
 */

export type ScamSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ScamCategory = 
  | 'Financial'
  | 'Communication'
  | 'Identity'
  | 'Illegal Activity'
  | 'Psychological'
  | 'Role Specifics'
  | 'Contact'
  | 'URL / Domain';

export type RiskVerdict = 
  | 'VERIFIED_SAFE'
  | 'MODERATE_CAUTION'
  | 'HIGH_SCAM_DANGER';

export interface ScamPattern {
  id: string;
  category: ScamCategory;
  regex: RegExp;
  severity: ScamSeverity;
  weight: number;
  title: string;
  explanation: string;
}

export interface RedFlagItem {
  id: string;
  category: ScamCategory;
  severity: ScamSeverity;
  title: string;
  explanation: string;
  weight: number;
  snippet?: string;
}

export interface RiskBreakdown {
  financial: number;
  communication: number;
  identity: number;
  urgency: number;
}

export interface RiskAnalysisResult {
  score: number; // 0 - 100
  verdict: RiskVerdict;
  badgeColor: 'safe' | 'caution' | 'danger';
  summaryText: string;
  redFlags: RedFlagItem[];
  breakdown: RiskBreakdown;
  highlightedDescription?: string;
  analyzedAt: string;
}
