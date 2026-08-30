/**
 * VeriJob Domain Constants
 */

export const FREE_EMAIL_DOMAINS: readonly string[] = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'mail.com',
  'protonmail.com',
  'gmx.com',
  'zoho.com',
  'yandex.com'
] as const;

export const SUSPICIOUS_TLDS: readonly string[] = [
  '.xyz',
  '.top',
  '.site',
  '.online',
  '.club',
  '.work',
  '.biz',
  '.tk',
  '.ml',
  '.ga',
  '.cf',
  '.gq'
] as const;
