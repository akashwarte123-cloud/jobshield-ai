/**
 * JobShield AI Shared Core Type Definitions
 */

export type UserRole = 'USER' | 'ANALYST' | 'ADMIN';

export type RiskVerdict = 'SAFE' | 'CAUTION' | 'DANGER';

export type ScamSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthTokensDTO {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthResponseDTO {
  user: UserDTO;
  tokens: AuthTokensDTO;
}

export interface LoginRequestDTO {
  email: string;
  password?: string;
  provider?: 'LOCAL' | 'GOOGLE' | 'GITHUB';
  oauthCode?: string;
}

export interface RegisterRequestDTO {
  email: string;
  password: string;
  fullName: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  resetToken: string;
  newPassword: string;
}

export interface JobScanRequestDTO {
  title?: string;
  company?: string;
  email?: string;
  url?: string;
  description: string;
}

export type JobPostingInput = JobScanRequestDTO;

export interface RedFlagDTO {
  id: string;
  code: string;
  category: string;
  severity: ScamSeverity;
  title: string;
  explanation: string;
  weight: number;
}

export type RedFlag = RedFlagDTO;
export type RedFlagItem = RedFlagDTO;

export interface RiskAnalysisResponseDTO {
  score: number; // 0 - 100
  verdict: RiskVerdict;
  badgeColor?: 'safe' | 'caution' | 'danger';
  summaryText: string;
  redFlags: RedFlagDTO[];
  breakdown: {
    financial: number;
    communication: number;
    identity: number;
    urgency: number;
  };
  analyzedAt: string;
}

export type RiskAnalysisResult = RiskAnalysisResponseDTO;

export interface CompanyVerificationDTO {
  companyName: string;
  domain: string;
  recruiterEmail: string;
  isVerifiedEmployer: boolean;
  trustScore: number;
  whoisAgeDays: number;
  whoisRegistrant: string;
  hasValidSSL: boolean;
  sslIssuer: string;
  hasMxRecord: boolean;
  mxServers: string[];
  linkedInStatus: 'VERIFIED_ORGANIZATION' | 'UNLINKED' | 'NOT_FOUND';
  linkedInFollowers?: number;
  isFreeMail: boolean;
  isDomainMatch: boolean;
  warnings: string[];
  analyzedAt: string;
}

export interface CompanyVerificationResult {
  companyName: string;
  domain: string;
  isVerifiedEntity: boolean;
  trustScore: number;
  isFreeMailDomain: boolean;
  matchesCompanyDomain: boolean;
  warnings: string[];
}
