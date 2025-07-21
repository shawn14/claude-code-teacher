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
      performance: /memo|cache|Cache|optimize|debounce|throttle|performance/i,
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
  
  // Optimized mode - token-efficient analysis with mentoring
  optimizedAnalysis(context) {
    const { diff, filename, type } = context;
    const colors = themeManager.getColors();
    const added = (diff.match(/^\+[^+]/gm) || []).length;
    const removed = (diff.match(/^-[^-]/gm) || []).length;
    
    let output = '';
    
    // Change summary with context
    const changeType = type === 'modified' ? 'Modified' : type === 'added' ? 'Created' : 'Deleted';
    output += colors.primary(`\n📊 ${changeType}: ${filename}`);
    if (type === 'modified') {
      output += colors.muted(` (${added} additions, ${removed} deletions)\n`);
    } else {
      output += '\n';
    }
    
    // Analyze the actual changes and provide mentoring
    if (diff) {
      const mentoring = this.generateMentoringExplanation(context);
      if (mentoring) {
        output += colors.accent('\n🎓 Mentoring Insights:\n');
        output += mentoring;
      }
    }
    
    // Key patterns detected
    const patterns = this.detectPatterns(context);
    if (patterns.length > 0) {
      const insights = this.generateOptimizedInsights(patterns, context);
      if (insights.length > 0) {
        output += colors.secondary('\n💡 Best Practices:\n');
        insights.forEach(insight => {
          output += `   ${insight}\n`;
        });
      }
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
  
  generateMentoringExplanation(context) {
    const { diff, filename, ext } = context;
    const colors = themeManager.getColors();
    let explanation = '';
    
    // Analyze what type of changes were made
    const lines = diff.split('\n');
    const addedLines = lines.filter(l => l.startsWith('+') && !l.startsWith('+++'));
    const removedLines = lines.filter(l => l.startsWith('-') && !l.startsWith('---'));
    
    // Look for specific patterns in the changes
    const changedCode = [...addedLines, ...removedLines].map(l => l.substring(1)).join('\n');
    
    // Function changes
    if (changedCode.match(/function|const.*=.*\(|=>|class/)) {
      const isNewFunction = addedLines.some(l => l.match(/function|const.*=.*\(|=>/));
      const isModifiedFunction = removedLines.some(l => l.match(/function|const.*=.*\(|=>/));
      
      if (isNewFunction && !isModifiedFunction) {
        explanation += colors.info('   📝 New function/method added\n');
        explanation += colors.muted('      This introduces new functionality. Consider:\n');
        explanation += colors.muted('      • Does it have clear, descriptive naming?\n');
        explanation += colors.muted('      • Are parameters validated?\n');
        explanation += colors.muted('      • Is error handling in place?\n');
      } else if (isModifiedFunction) {
        explanation += colors.info('   ✏️ Function implementation changed\n');
        explanation += colors.muted('      When modifying functions:\n');
        explanation += colors.muted('      • Ensure backward compatibility\n');
        explanation += colors.muted('      • Update tests if behavior changed\n');
        explanation += colors.muted('      • Check all callers still work correctly\n');
      }
    }
    
    // Import/dependency changes
    if (changedCode.match(/import|require/)) {
      const newImports = addedLines.filter(l => l.match(/import|require/));
      const removedImports = removedLines.filter(l => l.match(/import|require/));
      
      if (newImports.length > removedImports.length) {
        explanation += colors.info('   📦 New dependencies added\n');
        explanation += colors.muted('      • Verify the package is from a trusted source\n');
        explanation += colors.muted('      • Check bundle size impact\n');
        explanation += colors.muted('      • Consider if native solutions exist\n');
      } else if (removedImports.length > 0) {
        explanation += colors.success('   🧹 Dependencies cleaned up\n');
        explanation += colors.muted('      Good practice! Removing unused imports:\n');
        explanation += colors.muted('      • Reduces bundle size\n');
        explanation += colors.muted('      • Improves code clarity\n');
      }
    }
    
    // State management changes
    if (changedCode.match(/setState|useState|state\s*=/)) {
      explanation += colors.info('   🔄 State management modified\n');
      explanation += colors.muted('      State changes can cause re-renders:\n');
      explanation += colors.muted('      • Batch state updates when possible\n');
      explanation += colors.muted('      • Consider using useReducer for complex state\n');
      explanation += colors.muted('      • Verify dependent components handle changes\n');
    }
    
    // API/Network changes
    if (changedCode.match(/fetch|axios|api|http/i)) {
      explanation += colors.warning('   🌐 Network/API code modified\n');
      explanation += colors.muted('      Critical areas to check:\n');
      explanation += colors.muted('      • Error handling for network failures\n');
      explanation += colors.muted('      • Loading states for better UX\n');
      explanation += colors.muted('      • Response validation\n');
      explanation += colors.muted('      • Authentication headers if needed\n');
    }
    
    // Security-sensitive changes
    if (changedCode.match(/password|token|key|secret|auth/i)) {
      explanation += colors.error('   🔐 Security-sensitive code modified\n');
      explanation += colors.muted('      Security checklist:\n');
      explanation += colors.muted('      • Never log sensitive data\n');
      explanation += colors.muted('      • Use environment variables for secrets\n');
      explanation += colors.muted('      • Validate and sanitize all inputs\n');
      explanation += colors.muted('      • Use HTTPS for sensitive operations\n');
    }
    
    // Testing changes
    if (filename.match(/test|spec/) || changedCode.match(/test|expect|describe|it\(/)) {
      explanation += colors.success('   🧪 Test coverage modified\n');
      explanation += colors.muted('      Excellent! Testing best practices:\n');
      explanation += colors.muted('      • Test behavior, not implementation\n');
      explanation += colors.muted('      • Include edge cases\n');
      explanation += colors.muted('      • Keep tests focused and isolated\n');
    }
    
    // Performance-related changes
    if (changedCode.match(/useMemo|useCallback|memo|lazy|Suspense|cache|Cache|performance/i)) {
      explanation += colors.accent('   ⚡ Performance optimization detected\n');
      explanation += colors.muted('      Performance considerations:\n');
      explanation += colors.muted('      • Measure before and after\n');
      explanation += colors.muted('      • Don\'t optimize prematurely\n');
      explanation += colors.muted('      • Consider trade-offs (memory vs speed)\n');
      
      if (changedCode.match(/cache|Cache/)) {
        explanation += colors.muted('      \n');
        explanation += colors.muted('      Cache implementation tips:\n');
        explanation += colors.muted('      • Set appropriate TTL (time to live)\n');
        explanation += colors.muted('      • Implement cache invalidation strategy\n');
        explanation += colors.muted('      • Monitor cache hit/miss rates\n');
        explanation += colors.muted('      • Consider memory limits\n');
      }
    }
    
    // If no specific patterns found, provide general guidance
    if (!explanation) {
      const category = this.detectChangeCategory(context);
      const categoryInfo = this.getCategoryInfo(category);
      
      explanation += colors.info(`   ${categoryInfo.icon} ${categoryInfo.label} detected\n`);
      explanation += colors.muted('      General tips for this change:\n');
      
      switch (category) {
        case 'feature':
          explanation += colors.muted('      • Write tests for new functionality\n');
          explanation += colors.muted('      • Update documentation\n');
          explanation += colors.muted('      • Consider edge cases\n');
          break;
        case 'fix':
          explanation += colors.muted('      • Add regression tests\n');
          explanation += colors.muted('      • Verify the root cause is addressed\n');
          explanation += colors.muted('      • Check for similar issues elsewhere\n');
          break;
        case 'refactor':
          explanation += colors.muted('      • Ensure behavior remains unchanged\n');
          explanation += colors.muted('      • Run existing tests\n');
          explanation += colors.muted('      • Improve code readability\n');
          break;
        default:
          explanation += colors.muted('      • Follow project conventions\n');
          explanation += colors.muted('      • Keep changes focused\n');
          explanation += colors.muted('      • Test thoroughly\n');
      }
    }
    
    return explanation;
  }
}

// Export singleton instance
export const insightEngine = new InsightEngine();