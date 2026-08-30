/**
 * TF-IDF Feature Vectorizer
 */

export class TFIDFVectorizer {
  private vocabulary: Map<string, number> = new Map();
  private idf: Map<string, number> = new Map();
  private isFitted: boolean = false;

  private VOCAB_SEED = [
    'telegram', 'whatsapp', 'check', 'cashier', 'wire', 'zelle', 'crypto', 'vendor',
    'urgent', 'equipment', 'laptop', 'no experience', 'weekly', 'typing', 'deposit',
    'ssn', 'bank', 'routing', 'reship', 'overseas', 'react', 'typescript', 'w2', 'benefits'
  ];

  public fit(documents: string[][]): void {
    const docCount = documents.length || 1;
    const docFreq: Map<string, number> = new Map();

    // Initialize Vocabulary
    let idx = 0;
    for (const word of this.VOCAB_SEED) {
      if (!this.vocabulary.has(word)) {
        this.vocabulary.set(word, idx++);
      }
    }

    for (const doc of documents) {
      const uniqueWords = new Set(doc);
      for (const word of uniqueWords) {
        docFreq.set(word, (docFreq.get(word) || 0) + 1);
        if (!this.vocabulary.has(word)) {
          this.vocabulary.set(word, idx++);
        }
      }
    }

    // Calculate Inverse Document Frequency (IDF)
    for (const [word] of this.vocabulary.entries()) {
      const df = docFreq.get(word) || 1;
      const idfValue = Math.log((1 + docCount) / (1 + df)) + 1;
      this.idf.set(word, idfValue);
    }

    this.isFitted = true;
  }

  public transform(tokens: string[]): number[] {
    if (!this.isFitted) {
      this.fit([tokens]);
    }

    const vector = new Array(this.vocabulary.size).fill(0);
    const termFreq: Map<string, number> = new Map();

    for (const t of tokens) {
      termFreq.set(t, (termFreq.get(t) || 0) + 1);
    }

    const totalTokens = tokens.length || 1;

    for (const [word, index] of this.vocabulary.entries()) {
      const tf = (termFreq.get(word) || 0) / totalTokens;
      const idfVal = this.idf.get(word) || 1.0;
      vector[index] = parseFloat((tf * idfVal).toFixed(4));
    }

    return vector;
  }
}
