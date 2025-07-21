import { themeManager } from './theme-manager.js';

export class TokenAnalyzer {
  constructor() {
    // Approximate token counts based on OpenAI's tokenizer patterns
    this.avgTokensPerChar = 0.25; // ~4 characters per token on average
    this.specialTokenCosts = {
      emoji: 2,
      newline: 1,
      punctuation: 0.5
    };
  }

  analyzeOutput(text) {
    if (!text) return { tokens: 0, characters: 0, lines: 0 };
    
    // Basic metrics
    const characters = text.length;
    const lines = text.split('\n').length;
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    
    // Estimate tokens (rough approximation)
    let tokens = Math.ceil(characters * this.avgTokensPerChar);
    
    // Add extra for special characters
    const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    const newlineCount = (text.match(/\n/g) || []).length;
    
    tokens += emojiCount * this.specialTokenCosts.emoji;
    tokens += newlineCount * this.specialTokenCosts.newline;
    
    return {
      tokens,
      characters,
      lines,
      words,
      efficiency: this.calculateEfficiency(tokens, lines)
    };
  }
  
  calculateEfficiency(tokens, lines) {
    // Efficiency score: information density
    const tokensPerLine = lines > 0 ? tokens / lines : tokens;
    
    if (tokensPerLine < 10) return 'excellent';
    if (tokensPerLine < 20) return 'good';
    if (tokensPerLine < 30) return 'moderate';
    return 'verbose';
  }
  
  compareOutputs(original, optimized) {
    const origStats = this.analyzeOutput(original);
    const optStats = this.analyzeOutput(optimized);
    
    return {
      original: origStats,
      optimized: optStats,
      savings: {
        tokens: origStats.tokens - optStats.tokens,
        percentage: Math.round(((origStats.tokens - optStats.tokens) / origStats.tokens) * 100)
      }
    };
  }
  
  formatStats(stats, label = 'Output') {
    const colors = themeManager.getColors();
    const efficiencyColors = {
      excellent: colors.success,
      good: colors.info,
      moderate: colors.warning,
      verbose: colors.error
    };
    
    let output = colors.muted(`\n📊 ${label} Metrics:\n`);
    output += colors.muted(`   Tokens: ~${stats.tokens} | `);
    output += colors.muted(`Chars: ${stats.characters} | `);
    output += colors.muted(`Lines: ${stats.lines}\n`);
    output += colors.muted(`   Efficiency: `);
    output += efficiencyColors[stats.efficiency](stats.efficiency.toUpperCase());
    
    return output;
  }
  
  suggestOptimizations(text) {
    const suggestions = [];
    const lines = text.split('\n');
    
    // Check for verbose patterns
    lines.forEach(line => {
      if (line.length > 80) {
        suggestions.push('Long lines detected - consider breaking up');
      }
      if (line.includes('      ')) {
        suggestions.push('Deep indentation - consider flattening');
      }
    });
    
    // Check for repetitive content
    const repeatedPhrases = this.findRepeatedPhrases(text);
    if (repeatedPhrases.length > 0) {
      suggestions.push('Repeated phrases found - consider consolidating');
    }
    
    // Check for unnecessary verbosity
    if (text.includes('in order to')) {
      suggestions.push('Replace "in order to" with "to"');
    }
    if (text.includes('it is important to note that')) {
      suggestions.push('Simplify verbose phrases');
    }
    
    return [...new Set(suggestions)]; // Remove duplicates
  }
  
  findRepeatedPhrases(text) {
    const phrases = [];
    const words = text.split(/\s+/);
    const phraseMap = new Map();
    
    // Look for 3-word phrases that repeat
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = `${words[i]} ${words[i+1]} ${words[i+2]}`;
      const count = phraseMap.get(phrase) || 0;
      phraseMap.set(phrase, count + 1);
    }
    
    // Find phrases that appear more than once
    phraseMap.forEach((count, phrase) => {
      if (count > 1 && phrase.length > 10) {
        phrases.push(phrase);
      }
    });
    
    return phrases;
  }
}

export const tokenAnalyzer = new TokenAnalyzer();