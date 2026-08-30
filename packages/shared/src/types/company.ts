/**
 * VeriJob Company Verification Types
 */

export interface DomainWHOISInfo {
  domainName: string;
  registrationDate?: string;
  domainAgeDays?: number;
  registrar?: string;
  isPrivacyProtected?: boolean;
  isSuspiciousTLD?: boolean;
}

export interface CompanyVerificationResult {
  companyName: string;
  domain: string;
  isVerifiedEntity: boolean;
  trustScore: number; // 0 - 100
  whois?: DomainWHOISInfo;
  isFreeMailDomain: boolean;
  matchesCompanyDomain: boolean;
  warnings: string[];
}
