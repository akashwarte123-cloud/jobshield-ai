/**
 * Text Cleaning & Structural Feature Extraction Pipeline
 */

export interface CleanedTextResult {
  rawText: string;
  cleanedTokens: string[];
  uppercaseRatio: number;
  currencySymbolCount: number;
  urlCount: number;
  urgentPunctuationCount: number;
}

export class CleanTextPipeline {
  private static STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
    'to', 'of', 'in', 'for', 'with', 'on', 'at', 'from', 'by', 'this', 'that'
  ]);

  public static process(text: string): CleanedTextResult {
    if (!text) {
      return {
        rawText: '',
        cleanedTokens: [],
        uppercaseRatio: 0,
        currencySymbolCount: 0,
        urlCount: 0,
        urgentPunctuationCount: 0
      };
    }

    // 1. Compute Structural Metadata Features
    const totalChars = text.length || 1;
    const uppercaseChars = (text.match(/[A-Z]/g) || []).length;
    const uppercaseRatio = parseFloat((uppercaseChars / totalChars).toFixed(4));

    const currencySymbolCount = (text.match(/[\$€£]|USD|cashier|check/gi) || []).length;
    const urlCount = (text.match(/https?:\/\/[^\s]+|bit\.ly|tinyurl/gi) || []).length;
    const urgentPunctuationCount = (text.match(/!{2,}|\?{2,}/g) || []).length;

    // 2. Tokenize & Clean Text
    const normalized = text
      .toLowerCase()
      .replace(/https?:\/\/[^\s]+/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ');

    const tokens = normalized
      .split(/\s+/)
      .filter(t => t.length > 2 && !this.STOP_WORDS.has(t));

    return {
      rawText: text,
      cleanedTokens: tokens,
      uppercaseRatio,
      currencySymbolCount,
      urlCount,
      urgentPunctuationCount
    };
  }
}
