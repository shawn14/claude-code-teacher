import chalk from 'chalk';
import { themeManager } from './theme-manager.js';

/**
 * Unified Insight Engine with three modes:
 * - basic: Original simple insights
 * - detailed: Enhanced educational analysis
 * - optimized: Token-efficient insights
 */
export class InsightEngine {
  constructor() {
    this.mode = 'optimized'; // default mode
    
    // Shared patterns for all modes
    this.patterns = {
      stateManagement: /setState|useState|state\s*=/,
      apiIntegration: /fetch|axios|api|http/i,
      authentication: /auth|login|token|session/i,
      database: /query|select|insert|update|delete|mongoose|sequelize/i,
      errorHandling: /try|catch|error|throw/i,
      validation: /validate|check|verify|sanitize/i,
      performance: /memo|cache|optimize|debounce|throttle/i,
      security: /password|secret|key|encrypt|hash/i,
      async: /async|await|promise|then/i,
      hooks: /use[A-Z]\w+/,
      testing: /test|spec|expect|jest|mocha/i
    };
    
    // Mode-specific configurations
    this.configs = {
      basic: {
        name: 'Basic',
        description: 'Simple, straightforward insights',
        maxInsights: 3,
        includePatterns: true,
        includeSuggestions: true,
        includeTeaching: false
      },
      detailed: {
        name: 'Detailed',
        description: 'Comprehensive educational analysis',
        maxInsights: 10,
        includePatterns: true,
        includeSuggestions: true,
        includeTeaching: true
      },
      optimized: {
        name: 'Optimized',
        description: 'Token-efficient with high value',
        maxInsights: 5,
        includePatterns: true,
        includeSuggestions: true,
        includeTeaching: false
      }
    };
  }
  
  setMode(mode) {
    if (this.configs[mode]) {
      this.mode = mode;
      return true;
    }
    return false;
  }
  
  getMode() {
    return this.mode;
  }
  
  analyzeChange(context) {
    switch (this.mode) {
      case 'basic':
        return this.basicAnalysis(context);
      case 'detailed':
        return this.detailedAnalysis(context);
      case 'optimized':
      default:
        return this.optimizedAnalysis(context);
    }
  }
  
  // Basic mode - original simple analysis
  basicAnalysis(context) {
    const { diff, filename, type } = context;
    const colors = themeManager.getColors();
    const patterns = this.detectPatterns(context);
    
    let output = '';
    
    // Category
    const category = this.detectChangeCategory(context);
    const categoryInfo = this.getCategoryInfo(category);
    output += colors.primary(`\n${categoryInfo.icon} ${categoryInfo.label}\n`);
    
    // Patterns
    if (patterns.length > 0) {
      output += colors.secondary('\n🔍 Patterns: ') + patterns.join(', ') + '\n';
    }
    
    // Simple insights
    const insights = this.generateBasicInsights(context, patterns);
    if (insights.length > 0) {
      output += colors.info('\n💡 Insights:\n');
      insights.forEach(insight => {
        output += `   • ${insight}\n`;
      });
    }
    
    return output;
  }
  
  // Detailed mode - comprehensive educational analysis
  detailedAnalysis(context) {
    const { diff, filename } = context;
    const colors = themeManager.getColors();
    
    let output = '';
    
    // Detailed header
    const category = this.detectChangeCategory(context);
    const categoryInfo = this.getCategoryInfo(category);
    output += colors.header(`\n${categoryInfo.icon} ${categoryInfo.label.toUpperCase()}\n`);
    output += colors.muted('─'.repeat(50)) + '\n';
    
    // Code changes breakdown
    const changes = this.analyzeCodeChanges(diff);
    if (changes.modifications.length > 0) {
      output += colors.accent('\n📝 Modifications:\n');
      changes.modifications.forEach(mod => {
        output += colors.error(`   - ${mod.before}\n`);
        output += colors.success(`   + ${mod.after}\n`);
        output += this.explainModification(mod.type) + '\n';
      });
    }
    
    // Pattern analysis with teaching
    const patterns = this.detectPatterns(context);
    if (patterns.length > 0) {
      output += colors.secondary('\n🎯 Patterns & Best Practices:\n');
      patterns.forEach(pattern => {
        output += this.getPatternTeaching(pattern);
      });
    }
    
    // Contextual learning
    output += this.generateContextualLearning(filename, patterns);
    
    // Recommendations
    const recommendations = this.generateRecommendations(context, patterns);
    if (recommendations.length > 0) {
      output += colors.warning('\n⚡ Recommendations:\n');
      recommendations.forEach(rec => {
        output += `   • ${rec}\n`;
      });
    }
    
    return output;
  }
  
  // Optimized mode - token-efficient analysis
  optimizedAnalysis(context) {
    const { diff, filename } = context;
    const colors = themeManager.getColors();
    const added = (diff.match(/^\+[^+]/gm) || []).length;
    const removed = (diff.match(/^-[^-]/gm) || []).length;
    
    let output = '';
    
    // Compact header
    output += colors.primary(`\n📊 ${added}+ ${removed}- in ${filename}\n`);
    
    // Key changes only
    const keyChanges = this.identifyKeyChanges(diff);
    if (keyChanges.length > 0) {
      output += colors.accent('\n🔍 Changes:\n');
      keyChanges.forEach(change => {
        output += `   ${change}\n`;
      });
    }
    
    // Concise insights
    const patterns = this.detectPatterns(context);
    const insights = this.generateOptimizedInsights(patterns, context);
    if (insights.length > 0) {
      output += colors.secondary('\n💡 Tips:\n');
      insights.forEach(insight => {
        output += `   ${insight}\n`;
      });
    }
    
    return output;
  }
  
  // Shared utility methods
  detectPatterns(context) {
    const { diff, content } = context;
    const detected = [];
    const searchText = diff || content || '';
    
    for (const [name, pattern] of Object.entries(this.patterns)) {
      if (pattern.test(searchText)) {
        detected.push(name);
      }
    }
    
    return detected;
  }
  
  detectChangeCategory(context) {
    const { diff, type, filename } = context;
    
    if (type === 'added') return 'feature';
    if (type === 'deleted') return 'cleanup';
    
    if (filename.includes('test') || filename.includes('spec')) return 'test';
    if (filename.includes('.md')) return 'docs';
    if (diff && diff.includes('fix')) return 'fix';
    if (diff && diff.includes('perf')) return 'performance';
    if (diff && diff.includes('security')) return 'security';
    
    return 'refactor';
  }
  
  getCategoryInfo(category) {
    const categories = {
      feature: { icon: '✨', label: 'New Feature', color: 'green' },
      fix: { icon: '🐛', label: 'Bug Fix', color: 'red' },
      refactor: { icon: '♻️', label: 'Refactoring', color: 'blue' },
      performance: { icon: '⚡', label: 'Performance', color: 'yellow' },
      security: { icon: '🔒', label: 'Security', color: 'red' },
      docs: { icon: '📝', label: 'Documentation', color: 'gray' },
      test: { icon: '🧪', label: 'Testing', color: 'cyan' },
      cleanup: { icon: '🧹', label: 'Cleanup', color: 'gray' }
    };
    
    return categories[category] || { icon: '📦', label: 'Change', color: 'white' };
  }
  
  // Basic mode helpers
  generateBasicInsights(context, patterns) {
    const insights = [];
    const { category } = context;
    
    // Category insights
    const categoryInsights = {
      feature: 'New functionality added - remember to test edge cases',
      fix: 'Bug resolved - consider adding regression tests',
      refactor: 'Code improved without changing behavior',
      performance: 'Performance optimized - measure the improvement',
      security: 'Security enhanced - get a security review'
    };
    
    if (categoryInsights[category]) {
      insights.push(categoryInsights[category]);
    }
    
    // Pattern insights
    if (patterns.includes('async')) {
      insights.push('Async code - handle errors with try-catch');
    }
    if (patterns.includes('apiIntegration')) {
      insights.push('API integration - check response status');
    }
    
    return insights.slice(0, this.configs.basic.maxInsights);
  }
  
  // Detailed mode helpers
  analyzeCodeChanges(diff) {
    const added = diff.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));
    const removed = diff.split('\n').filter(l => l.startsWith('-') && !l.startsWith('---'));
    
    const modifications = [];
    const additions = added.filter(line => {
      const trimmed = line.substring(1).trim();
      const similar = removed.find(rem => {
        const remTrimmed = rem.substring(1).trim();
        return this.areSimilar(trimmed, remTrimmed);
      });
      
      if (similar) {
        modifications.push({
          before: similar.substring(1).trim(),
          after: trimmed,
          type: this.getModificationType(similar.substring(1), line.substring(1))
        });
        return false;
      }
      return true;
    });
    
    return { modifications, additions: additions.map(l => l.substring(1)) };
  }
  
  areSimilar(str1, str2) {
    // Simple similarity check - could be enhanced
    const commonWords = str1.split(/\s+/).filter(w => str2.includes(w));
    return commonWords.length > str1.split(/\s+/).length * 0.5;
  }
  
  getModificationType(before, after) {
    if (before.includes('var') && after.includes('const')) return 'modernization';
    if (after.includes('async') && !before.includes('async')) return 'async_conversion';
    if (after.length < before.length * 0.8) return 'simplification';
    return 'modification';
  }
  
  explainModification(type) {
    const colors = themeManager.getColors();
    const explanations = {
      modernization: colors.success('      → Modernized to ES6+ syntax'),
      async_conversion: colors.info('      → Made asynchronous'),
      simplification: colors.success('      → Simplified code'),
      modification: colors.info('      → Logic updated')
    };
    return explanations[type] || '';
  }
  
  getPatternTeaching(pattern) {
    const colors = themeManager.getColors();
    const teachings = {
      async: colors.accent('   🔄 Async/Await:\n') +
             colors.muted('      • Always use try-catch for error handling\n') +
             colors.muted('      • Remember await only works in async functions\n'),
      hooks: colors.accent('   🎣 React Hooks:\n') +
             colors.muted('      • Hooks must be called at the top level\n') +
             colors.muted('      • Use dependency arrays correctly\n'),
      apiIntegration: colors.accent('   🌐 API Calls:\n') +
                      colors.muted('      • Check response.ok before parsing\n') +
                      colors.muted('      • Handle network errors gracefully\n')
    };
    return teachings[pattern] || '';
  }
  
  generateContextualLearning(filename, patterns) {
    const colors = themeManager.getColors();
    let output = '';
    
    if (filename.includes('component')) {
      output += colors.info('\n📚 Component Best Practices:\n');
      output += colors.muted('   • Keep components focused and small\n');
      output += colors.muted('   • Extract logic into custom hooks\n');
    } else if (filename.includes('api') || filename.includes('service')) {
      output += colors.info('\n📚 Service Layer Tips:\n');
      output += colors.muted('   • Centralize error handling\n');
      output += colors.muted('   • Use consistent response formats\n');
    }
    
    return output;
  }
  
  generateRecommendations(context, patterns) {
    const recommendations = [];
    const { diff } = context;
    
    if (patterns.includes('async') && !patterns.includes('errorHandling')) {
      recommendations.push('Add try-catch for async operations');
    }
    if (diff && diff.includes('console.log')) {
      recommendations.push('Remove console.log before production');
    }
    if (patterns.includes('apiIntegration') && !diff.includes('.ok')) {
      recommendations.push('Check response.ok for HTTP errors');
    }
    
    return recommendations;
  }
  
  // Optimized mode helpers
  identifyKeyChanges(diff) {
    const changes = [];
    const lines = diff.split('\n');
    
    lines.forEach(line => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        const content = line.substring(1).trim();
        if (content.includes('async')) changes.push('🔄 Made async');
        if (content.includes('try')) changes.push('🛡️ Added error handling');
        if (content.includes('console.')) changes.push('⚠️ Debug logging');
        if (content.includes('TODO')) changes.push('📝 TODO added');
      }
    });
    
    return [...new Set(changes)];
  }
  
  generateOptimizedInsights(patterns, context) {
    const insights = [];
    
    // Ultra-concise pattern insights
    if (patterns.includes('async')) {
      insights.push('🔄 Use try-catch with async');
    }
    if (patterns.includes('hooks')) {
      insights.push('🎣 Check hook dependencies');
    }
    if (patterns.includes('apiIntegration')) {
      insights.push('🌐 Validate API responses');
    }
    
    // Context-specific tips
    if (context.filename.includes('test')) {
      insights.push('🧪 Test edge cases');
    }
    
    return insights.slice(0, this.configs.optimized.maxInsights);
  }
}

// Export singleton instance
export const insightEngine = new InsightEngine();