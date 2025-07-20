import chalk from 'chalk';

export class InsightEngine {
  constructor() {
    this.patterns = {
      // Architecture patterns
      stateManagement: /useState|setState|redux|store|dispatch|reducer|action/i,
      apiIntegration: /fetch|axios|api|endpoint|request|response|async.*await/i,
      authentication: /auth|login|logout|token|session|jwt|oauth/i,
      database: /query|insert|update|delete|select|join|table|schema/i,
      
      // Code quality patterns
      errorHandling: /try|catch|finally|throw|error|exception/i,
      validation: /validate|check|verify|assert|require|test/i,
      performance: /memo|useMemo|useCallback|lazy|optimize|cache/i,
      security: /sanitize|escape|encrypt|hash|password|secret|key/i,
      
      // Refactoring patterns
      extraction: /function.*\{|const.*=.*\(|class.*\{/,
      simplification: /\|\||&&|ternary|\?:|switch|if.*else/,
      modernization: /var\s+\w+|function\s*\(|\.then\(|callback/,
      
      // Framework specific
      react: /import.*react|jsx|component|props|state|hook/i,
      vue: /v-if|v-for|v-model|computed|watch|mounted/i,
      angular: /@Component|@Injectable|ngOnInit|Observable/i,
      node: /require\(|module\.exports|process\.|__dirname/i
    };
    
    this.changeCategories = {
      feature: { icon: '✨', color: 'green', label: 'New Feature' },
      fix: { icon: '🐛', color: 'red', label: 'Bug Fix' },
      refactor: { icon: '♻️', color: 'blue', label: 'Refactoring' },
      performance: { icon: '⚡', color: 'yellow', label: 'Performance' },
      security: { icon: '🔒', color: 'magenta', label: 'Security' },
      style: { icon: '💅', color: 'cyan', label: 'Style' },
      docs: { icon: '📚', color: 'gray', label: 'Documentation' },
      test: { icon: '🧪', color: 'white', label: 'Testing' }
    };
  }

  analyzeChange(context) {
    if (!context.diff) return null;
    
    const analysis = {
      category: this.detectChangeCategory(context),
      patterns: this.detectPatterns(context),
      complexity: this.calculateComplexity(context),
      impact: this.assessImpact(context),
      suggestions: this.generateSuggestions(context),
      insights: this.generateInsights(context)
    };
    
    return this.formatAnalysis(analysis, context);
  }
  
  detectChangeCategory(context) {
    const { diff, filename } = context;
    
    // Check filename patterns
    if (filename.includes('.test.') || filename.includes('.spec.')) {
      return 'test';
    }
    if (filename.includes('.md') || filename.includes('README')) {
      return 'docs';
    }
    if (filename.includes('.css') || filename.includes('.scss')) {
      return 'style';
    }
    
    // Analyze diff content
    if (diff.match(/fix|bug|issue|problem|error/i)) {
      return 'fix';
    }
    if (diff.match(/add|new|create|implement/i)) {
      return 'feature';
    }
    if (diff.match(/refactor|clean|improve|optimize/i)) {
      return 'refactor';
    }
    if (diff.match(/security|auth|encrypt|sanitize/i)) {
      return 'security';
    }
    if (diff.match(/performance|speed|fast|optimize|cache/i)) {
      return 'performance';
    }
    
    return 'refactor';
  }
  
  detectPatterns(context) {
    const { diff, content } = context;
    const detected = [];
    
    for (const [name, pattern] of Object.entries(this.patterns)) {
      if (pattern.test(diff) || (content && pattern.test(content))) {
        detected.push(name);
      }
    }
    
    return detected;
  }
  
  calculateComplexity(context) {
    const { diff } = context;
    const addedLines = (diff.match(/^\+[^+]/gm) || []).length;
    const removedLines = (diff.match(/^-[^-]/gm) || []).length;
    const totalChanges = addedLines + removedLines;
    
    if (totalChanges < 10) return 'low';
    if (totalChanges < 50) return 'medium';
    return 'high';
  }
  
  assessImpact(context) {
    const { filename, patterns } = context;
    const impacts = [];
    
    // High impact patterns
    if (patterns.includes('authentication') || patterns.includes('security')) {
      impacts.push({ level: 'high', area: 'security', message: 'Changes affect security-sensitive code' });
    }
    if (patterns.includes('database')) {
      impacts.push({ level: 'high', area: 'data', message: 'Database operations modified' });
    }
    if (patterns.includes('apiIntegration')) {
      impacts.push({ level: 'medium', area: 'integration', message: 'External API interactions changed' });
    }
    if (patterns.includes('stateManagement')) {
      impacts.push({ level: 'medium', area: 'state', message: 'Application state logic updated' });
    }
    
    // File-based impacts
    if (filename.includes('config') || filename.includes('.env')) {
      impacts.push({ level: 'high', area: 'configuration', message: 'Configuration changes may affect deployment' });
    }
    if (filename.includes('package.json')) {
      impacts.push({ level: 'high', area: 'dependencies', message: 'Dependency changes require npm install' });
    }
    
    return impacts;
  }
  
  generateSuggestions(context) {
    const suggestions = [];
    const { diff, patterns } = context;
    
    // Pattern-based suggestions
    if (patterns.includes('errorHandling')) {
      suggestions.push('Consider logging errors for debugging in production');
    }
    if (patterns.includes('performance')) {
      suggestions.push('Profile this change to verify performance improvements');
    }
    if (patterns.includes('security')) {
      suggestions.push('Ensure all user inputs are properly sanitized');
    }
    
    // Code quality suggestions
    if (diff.includes('console.log')) {
      suggestions.push('Remove console.log statements before committing');
    }
    if (diff.includes('TODO') || diff.includes('FIXME')) {
      suggestions.push('Address TODO/FIXME comments or create issues for them');
    }
    if (diff.match(/password|secret|key/i) && !diff.match(/env|config/i)) {
      suggestions.push('⚠️ Avoid hardcoding sensitive information');
    }
    
    return suggestions;
  }
  
  generateInsights(context) {
    const insights = [];
    const { patterns, complexity, category } = context;
    
    // Category insights
    const categoryInsights = {
      feature: 'This adds new functionality. Consider adding tests and documentation.',
      fix: 'Bug fix detected. Verify the issue is fully resolved and add regression tests.',
      refactor: 'Code improvement without changing functionality. Great for maintainability!',
      performance: 'Performance optimization. Consider benchmarking before and after.',
      security: 'Security improvement. Ensure thorough testing and review.',
      style: 'Visual/formatting changes. Verify cross-browser compatibility.',
      docs: 'Documentation update. Clear docs save future debugging time!',
      test: 'Test coverage improved. Well-tested code is confident code!'
    };
    
    insights.push(categoryInsights[category] || 'Code change detected.');
    
    // Pattern insights
    if (patterns.includes('react') && patterns.includes('stateManagement')) {
      insights.push('React state update: Remember that state updates may be asynchronous.');
    }
    if (patterns.includes('apiIntegration') && !patterns.includes('errorHandling')) {
      insights.push('API call without error handling. Consider adding try-catch or .catch().');
    }
    if (patterns.includes('authentication')) {
      insights.push('Auth changes require careful testing. Verify all user flows.');
    }
    
    // Complexity insights
    if (complexity === 'high') {
      insights.push('Large change detected. Consider breaking into smaller commits.');
    }
    
    return insights;
  }
  
  formatAnalysis(analysis, context) {
    const { category, patterns, complexity, impact, suggestions, insights } = analysis;
    const { filename, diff } = context;
    const cat = this.changeCategories[category];
    
    const addedLines = (diff.match(/^\+[^+]/gm) || []).length;
    const removedLines = (diff.match(/^-[^-]/gm) || []).length;
    
    let output = '';
    
    // Header with category
    output += chalk[cat.color].bold(`\n${cat.icon} ${cat.label}: `) + chalk.white(`${addedLines} additions, ${removedLines} deletions\n`);
    
    // Detected patterns
    if (patterns.length > 0) {
      output += chalk.gray('\n🔍 Patterns detected: ') + patterns.map(p => chalk.cyan(this.humanizePattern(p))).join(', ') + '\n';
    }
    
    // Main insight
    if (insights.length > 0) {
      output += '\n' + chalk.bold.yellow('💡 Vibe Insight:\n');
      insights.forEach(insight => {
        output += chalk.white(`   ${insight}\n`);
      });
    }
    
    // Impact assessment
    if (impact.length > 0) {
      output += chalk.bold.red('\n⚡ Impact:\n');
      impact.forEach(imp => {
        const icon = imp.level === 'high' ? '🔴' : '🟡';
        output += `   ${icon} ${imp.message}\n`;
      });
    }
    
    // Suggestions
    if (suggestions.length > 0) {
      output += chalk.bold.green('\n✨ Suggestions:\n');
      suggestions.forEach(suggestion => {
        output += chalk.gray(`   • ${suggestion}\n`);
      });
    }
    
    // Complexity indicator
    const complexityColors = { low: 'green', medium: 'yellow', high: 'red' };
    output += chalk[complexityColors[complexity]](`\n📊 Complexity: ${complexity}\n`);
    
    return output;
  }
  
  humanizePattern(pattern) {
    const humanNames = {
      stateManagement: 'State Management',
      apiIntegration: 'API Integration',
      authentication: 'Authentication',
      database: 'Database Operations',
      errorHandling: 'Error Handling',
      validation: 'Input Validation',
      performance: 'Performance',
      security: 'Security',
      extraction: 'Code Extraction',
      simplification: 'Logic Simplification',
      modernization: 'Code Modernization',
      react: 'React',
      vue: 'Vue',
      angular: 'Angular',
      node: 'Node.js'
    };
    
    return humanNames[pattern] || pattern;
  }
}