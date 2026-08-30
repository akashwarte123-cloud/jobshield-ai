/**
 * VeriJob Company Verification Controller
 */

import { Request, Response } from 'express';
import { CompanyVerifier } from '@verijob/ml';

export async function verifyCompanyHandler(req: Request, res: Response): Promise<void> {
  try {
    const { companyName, domain, email } = req.query;

    const targetCompany = String(companyName || '');
    const targetDomain = String(domain || (email ? String(email).split('@')[1] : ''));

    if (!targetDomain) {
      res.status(400).json({
        success: false,
        error: 'Domain or Email parameter is required for company verification.'
      });
      return;
    }

    // Call the asynchronous verifier to perform real DNS/MX/SSL checks
    const verificationDTO = await CompanyVerifier.verifyCompany(
      targetCompany,
      email ? String(email) : '',
      targetDomain
    );

    res.status(200).json({
      success: true,
      data: verificationDTO
    });
  } catch (error) {
    console.error('Error during company verification:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during company verification.'
    });
  }
}
