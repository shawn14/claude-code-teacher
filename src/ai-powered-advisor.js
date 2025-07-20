import chalk from 'chalk';

export class AIPoweredAdvisor {
  constructor() {
    // Base patterns for quick detection
    this.criticalPatterns = {
      'private_key': /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
      'aws_secret': /aws_secret_access_key.*=.*[A-Za-z0-9/+=]{40}/i,
      'api_key': /(api[_-]?key|apikey|access[_-]?token).*[:=].*['"][A-Za-z0-9-_]{20,}['"]/i,
      'password': /(password|passwd|pwd).*[:=].*['"][^'"]{4,}['"]/i,
      'connection_string': /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/i,
      'jwt_secret': /jwt.*secret.*[:=].*['"][^'"]+['"]/i
    };
  }

  async analyzeWithAI(code, filename) {
    const analysis = {
      security: [],
      performance: [],
      architecture: [],
      bestPractices: []
    };

    // Quick pattern matching for immediate issues
    for (const [name, pattern] of Object.entries(this.criticalPatterns)) {
      if (pattern.test(code)) {
        analysis.security.push({
          severity: 'critical',
          issue: `Exposed ${name.replace('_', ' ')} detected`,
          line: this.findLineNumber(code, pattern),
          suggestion: 'Move all secrets to environment variables'
        });
      }
    }

    // Analyze code context for deeper insights
    const insights = this.getContextualInsights(code, filename);
    
    // Merge insights
    Object.keys(insights).forEach(category => {
      if (insights[category].length > 0) {
        analysis[category].push(...insights[category]);
      }
    });

    return analysis;
  }

  getContextualInsights(code, filename) {
    const insights = {
      security: [],
      performance: [],
      architecture: [],
      bestPractices: []
    };

    // Security insights based on code patterns
    if (code.includes('eval(') || code.includes('new Function(')) {
      insights.security.push({
        severity: 'critical',
        issue: 'Code injection vulnerability - eval() or new Function() with user input',
        suggestion: 'Never use eval() with user input. Parse JSON with JSON.parse() instead'
      });
    }

    if (code.match(/child_process|exec\(|spawn\(/)) {
      insights.security.push({
        severity: 'high',
        issue: 'Command injection risk - executing system commands',
        suggestion: 'Sanitize all inputs and use parameterized commands. Consider using execFile() with fixed commands'
      });
    }

    if (code.includes('innerHTML') && code.includes('req.')) {
      insights.security.push({
        severity: 'high',
        issue: 'XSS vulnerability - using innerHTML with user input',
        suggestion: 'Use textContent for text or sanitize HTML with DOMPurify'
      });
    }

    // Performance insights
    if (code.match(/await.*forEach|for.*await.*in loop/)) {
      insights.performance.push({
        severity: 'medium',
        issue: 'Sequential async operations in loop',
        suggestion: 'Use Promise.all() for parallel execution when operations are independent'
      });
    }

    if (code.includes('JSON.parse') && code.includes('JSON.stringify') && code.length < 500) {
      insights.performance.push({
        severity: 'low',
        issue: 'Unnecessary JSON serialization/deserialization',
        suggestion: 'Consider if you really need to stringify and parse, or if you can work with the object directly'
      });
    }

    // Architecture insights
    const functionLength = this.calculateFunctionLength(code);
    if (functionLength > 50) {
      insights.architecture.push({
        severity: 'medium',
        issue: `Function is ${functionLength} lines long - violates single responsibility principle`,
        suggestion: 'Break into smaller, focused functions. Each function should do one thing well'
      });
    }

    if (code.match(/if.*if.*if.*if/s) || code.match(/else.*else.*else.*else/s)) {
      insights.architecture.push({
        severity: 'medium',
        issue: 'Deep nesting detected - makes code hard to read and test',
        suggestion: 'Consider early returns, guard clauses, or strategy pattern'
      });
    }

    // Framework-specific insights
    if (code.includes('express') || code.includes('app.')) {
      insights.bestPractices.push(...this.getExpressInsights(code));
    }

    if (code.includes('mongoose') || code.includes('Schema')) {
      insights.bestPractices.push(...this.getMongooseInsights(code));
    }

    if (code.includes('react') || code.includes('useState')) {
      insights.bestPractices.push(...this.getReactInsights(code));
    }

    // Testing insights
    if (!filename.includes('test') && !filename.includes('spec')) {
      if (code.includes('class') || code.includes('function')) {
        insights.bestPractices.push({
          severity: 'low',
          issue: 'No corresponding test file detected',
          suggestion: `Create ${filename.replace('.js', '.test.js')} with unit tests`
        });
      }
    }

    return insights;
  }

  getExpressInsights(code) {
    const insights = [];

    if (!code.includes('helmet')) {
      insights.push({
        severity: 'high',
        issue: 'Missing security headers',
        suggestion: 'Add helmet middleware: app.use(helmet()) for basic security headers'
      });
    }

    if (code.includes('app.use') && !code.includes('app.use(express.json({limit')) {
      insights.push({
        severity: 'medium',
        issue: 'No request size limit',
        suggestion: 'Add size limits: app.use(express.json({ limit: "10mb" }))'
      });
    }

    if (!code.includes('catch') && code.includes('async')) {
      insights.push({
        severity: 'high',
        issue: 'Missing error handling middleware',
        suggestion: 'Add error handling middleware at the end of your routes'
      });
    }

    return insights;
  }

  getMongooseInsights(code) {
    const insights = [];

    if (code.includes('.find(') && !code.includes('.limit(')) {
      insights.push({
        severity: 'high',
        issue: 'Unbounded query - could return entire collection',
        suggestion: 'Always use .limit() with find queries to prevent memory issues'
      });
    }

    if (code.includes('password') && !code.includes('select: false')) {
      insights.push({
        severity: 'high',
        issue: 'Password field might be exposed in queries',
        suggestion: 'Add "select: false" to password field in schema'
      });
    }

    return insights;
  }

  getReactInsights(code) {
    const insights = [];

    if (code.match(/useState.*\[\]/) && !code.includes('useCallback')) {
      insights.push({
        severity: 'medium',
        issue: 'Array/object in useState without memoization',
        suggestion: 'Consider useCallback/useMemo to prevent unnecessary re-renders'
      });
    }

    if (code.includes('useEffect') && !code.includes('return')) {
      insights.push({
        severity: 'medium',
        issue: 'useEffect without cleanup',
        suggestion: 'Add cleanup function to prevent memory leaks'
      });
    }

    return insights;
  }

  calculateFunctionLength(code) {
    const functionMatches = code.match(/function.*\{|\=\>.*\{/g);
    if (!functionMatches) return 0;
    
    const lines = code.split('\n');
    let maxLength = 0;
    let currentLength = 0;
    let inFunction = false;

    lines.forEach(line => {
      if (line.includes('function') || line.includes('=>')) {
        inFunction = true;
        currentLength = 0;
      }
      if (inFunction) {
        currentLength++;
        if (line.includes('}')) {
          maxLength = Math.max(maxLength, currentLength);
          inFunction = false;
        }
      }
    });

    return maxLength;
  }

  findLineNumber(code, pattern) {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + 1;
      }
    }
    return null;
  }

  formatAIAnalysis(analysis) {
    let output = '';

    if (analysis.security.length > 0) {
      output += chalk.bold.red('\n\n🛡️ Security Analysis:\n');
      analysis.security.forEach(issue => {
        const icon = issue.severity === 'critical' ? '🚨' : '⚠️';
        output += chalk.red(`${icon} ${issue.issue}\n`);
        if (issue.line) {
          output += chalk.gray(`   Line ${issue.line}: `);
        }
        output += chalk.yellow(`   → ${issue.suggestion}\n`);
      });
    }

    if (analysis.performance.length > 0) {
      output += chalk.bold.blue('\n⚡ Performance Insights:\n');
      analysis.performance.forEach(issue => {
        output += chalk.blue(`• ${issue.issue}\n`);
        output += chalk.cyan(`   → ${issue.suggestion}\n`);
      });
    }

    if (analysis.architecture.length > 0) {
      output += chalk.bold.magenta('\n🏗️ Architecture Recommendations:\n');
      analysis.architecture.forEach(issue => {
        output += chalk.magenta(`• ${issue.issue}\n`);
        output += chalk.yellow(`   → ${issue.suggestion}\n`);
      });
    }

    if (analysis.bestPractices.length > 0) {
      output += chalk.bold.green('\n📚 Best Practices:\n');
      analysis.bestPractices.forEach(issue => {
        const icon = issue.severity === 'high' ? '⚠️' : '💡';
        output += chalk.green(`${icon} ${issue.issue}\n`);
        output += chalk.gray(`   → ${issue.suggestion}\n`);
      });
    }

    // Add contextual wisdom
    if (analysis.security.length > 0) {
      output += chalk.dim('\n🔐 "Security is not a feature, it\'s a requirement"');
    } else if (analysis.performance.length > 0) {
      output += chalk.dim('\n🚀 "Premature optimization is the root of all evil, but that doesn\'t mean we should write slow code"');
    } else if (analysis.architecture.length > 0) {
      output += chalk.dim('\n🎨 "Good architecture makes the code obvious"');
    }

    return output;
  }
}