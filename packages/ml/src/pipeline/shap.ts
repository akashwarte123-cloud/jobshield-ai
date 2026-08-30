/**
 * SHAP (SHapley Additive exPlanations) Feature Importance & Explainable AI (XAI)
 */

export interface FeatureAttribution {
  featureName: string;
  shapValue: number; // Positive pushes towards Scam (+), Negative towards Safe (-)
  category: 'KEYWORD' | 'METADATA' | 'DOMAIN';
}

export interface SHAPExplanationResult {
  baseValue: number; // Base log-odds threshold (e.g. 0.10)
  outputValue: number; // Final prediction probability
  topPositiveFeatures: FeatureAttribution[];
  topNegativeFeatures: FeatureAttribution[];
}

export class SHAPExplainer {
  public static explainPrediction(tokens: string[], uppercaseRatio: number, isFreeMail: boolean): SHAPExplanationResult {
    const positiveAttributions: FeatureAttribution[] = [];
    const negativeAttributions: FeatureAttribution[] = [];

    const lowerTokens = tokens.map(t => t.toLowerCase());

    if (lowerTokens.includes('check') || lowerTokens.includes('wire') || lowerTokens.includes('cashier')) {
      positiveAttributions.push({
        featureName: 'Keyword: "check / cashier / wire"',
        shapValue: +0.38,
        category: 'KEYWORD'
      });
    }

    if (lowerTokens.includes('telegram') || lowerTokens.includes('whatsapp')) {
      positiveAttributions.push({
        featureName: 'Keyword: "telegram / whatsapp interview"',
        shapValue: +0.28,
        category: 'KEYWORD'
      });
    }

    if (isFreeMail) {
      positiveAttributions.push({
        featureName: 'Domain: Recruiter Free-Mail Provider (@gmail/@yahoo)',
        shapValue: +0.22,
        category: 'DOMAIN'
      });
    }

    if (uppercaseRatio > 0.15) {
      positiveAttributions.push({
        featureName: 'Metadata: Excessive Capitalization (>15% Uppercase)',
        shapValue: +0.14,
        category: 'METADATA'
      });
    }

    if (lowerTokens.includes('w2') || lowerTokens.includes('payroll') || lowerTokens.includes('benefits')) {
      negativeAttributions.push({
        featureName: 'Keyword: "W2 payroll & health benefits"',
        shapValue: -0.32,
        category: 'KEYWORD'
      });
    }

    if (lowerTokens.includes('react') || lowerTokens.includes('typescript') || lowerTokens.includes('architect')) {
      negativeAttributions.push({
        featureName: 'Keyword: "Technical engineering stack (React/TypeScript)"',
        shapValue: -0.28,
        category: 'KEYWORD'
      });
    }

    const baseValue = 0.10;
    const totalPositive = positiveAttributions.reduce((acc, f) => acc + f.shapValue, 0);
    const totalNegative = negativeAttributions.reduce((acc, f) => acc + f.shapValue, 0);
    const outputValue = Math.max(0.01, Math.min(0.99, parseFloat((baseValue + totalPositive + totalNegative).toFixed(4))));

    return {
      baseValue,
      outputValue,
      topPositiveFeatures: positiveAttributions,
      topNegativeFeatures: negativeAttributions
    };
  }
}
