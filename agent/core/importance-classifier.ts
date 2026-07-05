// ============================================================
// [Q]uantelix — Importance Classifier
// Classifies content importance using heuristics
// ============================================================

export class ImportanceClassifier {
  classify(content: string, source: string = "assistant"): number {
    let score = 0.4; // baseline

    // Source-based adjustments
    if (source === "user") score += 0.15;       // User messages are important
    if (source === "tool") score += 0.05;        // Tool results moderate

    // Content patterns that signal importance
    const patterns: Array<[RegExp, number]> = [
      // High importance
      [/^(fix|bug|error|critical|urgent|important|deploy|launch|release)/i, 0.25],
      [/(decided|decision|chose|picked|selected)/i, 0.20],
      [/(remember|note|always|never|important)/i, 0.15],
      [/(password|secret|key|token|credential)/i, 0.30],
      [/(security|vulnerab|exploit|attack)/i, 0.25],
      [/(todo|fixme|hack|workaround)/i, 0.10],
      [/(api|endpoint|route|schema)/i, 0.05],
      [/(config|setting|preference)/i, 0.08],
      
      // Code-specific
      [/```[\s\S]{20,}```/, 0.15],                 // Code blocks
      [/^import\s|^const\s|^function\s|^class\s/i, 0.10],
      [/(export\s+(default\s+)?function|export\s+class)/i, 0.12],
      
      // Factual
      [/\d+\.\d+\.\d+/, 0.08],                     // Version numbers
      [/https?:\/\//, 0.05],                        // URLs
      [/@\w+\.\w+/, 0.05],                          // Emails
      
      // Low importance
      [/^(ok|yes|no|sure|thanks|thank you|cool|nice|great|got it)/i, -0.15],
      [/^(hello|hi|hey|bye|goodbye)/i, -0.20],
      [/(just checking|quick question|nvm|nevermind)/i, -0.15],
    ];

    for (const [pattern, adjustment] of patterns) {
      if (pattern.test(content)) {
        score += adjustment;
      }
    }

    // Length bonus: longer messages tend to be more substantive
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 50) score += 0.10;
    if (wordCount > 200) score += 0.05;

    // Structure bonus: lists, code, formatting = organized thought
    if (content.includes("\n-") || content.includes("\n1.") || content.includes("```")) {
      score += 0.05;
    }

    return Math.max(0.05, Math.min(1.0, score));
  }

  classifyBatch(items: Array<{ content: string; source: string }>): number[] {
    return items.map((item) => this.classify(item.content, item.source));
  }
}
