/**
 * JobShield AI — Scam & Legitimate Job Posting Dataset Generator
 */

export interface RawJobData {
  id: string;
  title: string;
  company: string;
  description: string;
  isScam: boolean;
  category: 'CHECK_SCAM' | 'TELEGRAM_SCAM' | 'IDENTITY_PHISHING' | 'LEGITIMATE';
}

export class DatasetGenerator {
  public static generateBenchmarkDataset(): RawJobData[] {
    return [
      // --- Scam Dataset Samples ---
      {
        id: 'ds-scam-01',
        title: 'Remote Data Entry & Office Assistant',
        company: 'Apex Global Logistics',
        description: "Urgent hiring! Earn $65/hr ($2,600 weekly). No experience required. Full remote training. All interviews conducted via Telegram chat @ApexHRManager. Deposit cashier's check to purchase home office laptop from vendor.",
        isScam: true,
        category: 'CHECK_SCAM'
      },
      {
        id: 'ds-scam-02',
        title: 'Virtual Administrative Assistant',
        company: 'Vanguard Capital Partners',
        description: "Immediate opening! Pay is $70/hr paid weekly via Zelle or Crypto. Interview over WhatsApp with Mr. David Vance. Must provide SSN, Drivers License copy, and bank routing number for identity verification prior to offer.",
        isScam: true,
        category: 'IDENTITY_PHISHING'
      },
      {
        id: 'ds-scam-03',
        title: 'Package Reshipping & Freight Inspector',
        company: 'FastTrack Logistics Hub',
        description: "Work from home receiving high-value package deliveries. Inspect contents, repackage, and forward to overseas addresses. Earn $3,500 monthly plus bonus per package shipped.",
        isScam: true,
        category: 'CHECK_SCAM'
      },
      {
        id: 'ds-scam-04',
        title: 'Customer Service Representative',
        company: 'Global E-Commerce Solutions',
        description: "Easy remote job! Contact recruiter on Telegram @GlobalHR2026. Deposit $1,500 equipment check and send wire transfer to vendor for software setup.",
        isScam: true,
        category: 'TELEGRAM_SCAM'
      },

      // --- Legitimate Dataset Samples ---
      {
        id: 'ds-legit-01',
        title: 'Senior Frontend Engineer',
        company: 'Stripe, Inc.',
        description: 'Stripe is hiring a Senior Frontend Engineer to build web payment interfaces in React and TypeScript. 5+ years of experience required. Full W2 payroll, health benefits, and competitive equity package.',
        isScam: false,
        category: 'LEGITIMATE'
      },
      {
        id: 'ds-legit-02',
        title: 'Backend Systems Engineer',
        company: 'Vercel Inc.',
        description: 'Join Vercel to architect global edge compute infrastructure. Experience with Go, Rust, microservices, and Node.js runtime environments required. Apply directly through our corporate careers site.',
        isScam: false,
        category: 'LEGITIMATE'
      },
      {
        id: 'ds-legit-03',
        title: 'DevOps & Site Reliability Engineer',
        company: 'Datadog, Inc.',
        description: 'Datadog is seeking a DevOps Engineer to manage Kubernetes clusters and Terraform deployments. Competitive salary, 401k matching, and comprehensive healthcare insurance provided.',
        isScam: false,
        category: 'LEGITIMATE'
      },
      {
        id: 'ds-legit-04',
        title: 'Product Designer',
        company: 'Linear Software',
        description: 'Linear is looking for a Senior Product Designer to craft world-class developer tools. Experience in Figma, design systems, and web accessibility standards mandatory.',
        isScam: false,
        category: 'LEGITIMATE'
      }
    ];
  }
}
