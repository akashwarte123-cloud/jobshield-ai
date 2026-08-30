/**
 * VeriJob Text Feature Extractor (Tokenization, TF-IDF, N-Gram Analysis)
 */

export interface TextFeatures {
  wordCount: number;
  uniqueWordRatio: number;
  capsRatio: number;
  exclamationCount: number;
  hasUrgentKeywords: boolean;
  tfIdfVector: Map<string, number>;
}

export class FeatureExtractor {
  private static STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
    'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with'
  ]);

  /**
   * Tokenize text into normalized lowercase tokens
   */
  public static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s$]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1 && !this.STOP_WORDS.has(token));
  }

  /**
   * Extract features from raw job posting text
   */
  public static extractFeatures(text: string): TextFeatures {
    if (!text || text.trim().length === 0) {
      return {
        wordCount: 0,
        uniqueWordRatio: 0,
        capsRatio: 0,
        exclamationCount: 0,
        hasUrgentKeywords: false,
        tfIdfVector: new Map()
      };
    }

    const tokens = this.tokenize(text);
    const wordCount = tokens.length;
    const uniqueTokens = new Set(tokens);
    const uniqueWordRatio = wordCount > 0 ? uniqueTokens.size / wordCount : 0;

    // Uppercase character ratio
    const upperChars = text.replace(/[^A-Z]/g, '').length;
    const totalChars = text.replace(/\s/g, '').length;
    const capsRatio = totalChars > 0 ? upperChars / totalChars : 0;

    const exclamationCount = (text.match(/!/g) || []).length;
    const hasUrgentKeywords = /(urgent|immediate|hire today|instant|limited)/i.test(text);

    // Compute Term Frequency (TF) Map
    const tfVector = new Map<string, number>();
    tokens.forEach(token => {
      tfVector.set(token, (tfVector.get(token) || 0) + 1 / wordCount);
    });

    return {
      wordCount,
      uniqueWordRatio,
      capsRatio,
      exclamationCount,
      hasUrgentKeywords,
      tfIdfVector: tfVector
    };
  }
}
