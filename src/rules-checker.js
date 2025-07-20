import { readFile } from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

export class RulesChecker {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.rules = null;
    this.claudeMdPath = path.join(projectPath, 'CLAUDE.md');
  }

  async initialize() {
    try {
      const claudeMdContent = await readFile(this.claudeMdPath, 'utf-8');
      this.rules = this.parseClaudeMd(claudeMdContent);
    } catch (error) {
      // If no CLAUDE.md, use default rules
      this.rules = this.getDefaultRules();
    }
  }

  parseClaudeMd(content) {
    const rules = {
      commands: [],
      architecture: [],
      patterns: [],
      security: [],
      performance: []
    };

    // Extract commands section
    const commandsMatch = content.match(/## Development Commands[\s\S]*?(?=##|$)/);
    if (commandsMatch) {
      const commandLines = commandsMatch[0].split('\n');
      commandLines.forEach(line => {
        if (line.includes('npm') || line.includes('npx')) {
          rules.commands.push(line.trim());
        }
      });
    }

    // Extract architecture patterns
    const archMatch = content.match(/## Architecture[\s\S]*?(?=##|$)/);
    if (archMatch) {
      if (archMatch[0].includes('Event-Driven')) {
        rules.patterns.push('event-driven');
      }
      if (archMatch[0].includes('Strategy Pattern')) {
        rules.patterns.push('strategy-pattern');
      }
      if (archMatch[0].includes('Observer Pattern')) {
        rules.patterns.push('observer-pattern');
      }
    }

    // Add security and performance rules from content
    if (content.includes('security')) {
      rules.security.push('no-hardcoded-secrets');
      rules.security.push('validate-input');
    }

    if (content.includes('performance')) {
      rules.performance.push('avoid-sync-operations');
      rules.performance.push('use-caching');
    }

    return rules;
  }

  getDefaultRules() {
    return {
      commands: ['npm start', 'npm test', 'npm run lint'],
      architecture: ['modular', 'event-driven'],
      patterns: ['observer-pattern', 'strategy-pattern'],
      security: [
        'no-hardcoded-secrets',
        'validate-input',
        'sanitize-output',
        'use-https',
        'no-eval'
      ],
      performance: [
        'avoid-sync-operations',
        'use-caching',
        'optimize-loops',
        'lazy-loading'
      ]
    };
  }

  async checkFile(filePath, content) {
    if (!this.rules) {
      await this.initialize();
    }

    const violations = [];
    const suggestions = [];
    const filename = path.basename(filePath);
    const ext = path.extname(filename);

    // Security checks
    if (this.containsHardcodedSecrets(content)) {
      violations.push({
        type: 'security',
        severity: 'critical',
        message: '🚨 Hardcoded secrets detected! Use environment variables instead.',
        line: this.findLineWithSecret(content)
      });
    }

    if (this.containsSQLInjection(content)) {
      violations.push({
        type: 'security',
        severity: 'critical',
        message: '🚨 SQL injection vulnerability! Use parameterized queries.',
        line: this.findSQLInjectionLine(content)
      });
    }

    // Performance checks
    if (this.containsSyncFileOperations(content)) {
      violations.push({
        type: 'performance',
        severity: 'warning',
        message: '⚠️ Synchronous file operations block the event loop. Use async versions.',
        line: this.findSyncOperationLine(content)
      });
    }

    // Architecture checks
    if (this.violatesModularDesign(content, filename)) {
      suggestions.push({
        type: 'architecture',
        message: '💡 Consider splitting this file into smaller modules for better maintainability.'
      });
    }

    // Best practices
    if (content.includes('var ')) {
      suggestions.push({
        type: 'best-practice',
        message: '💡 Use const/let instead of var for better scoping.'
      });
    }

    if (ext === '.js' && !content.includes('use strict')) {
      suggestions.push({
        type: 'best-practice',
        message: '💡 Consider adding "use strict" for safer JavaScript.'
      });
    }

    return { violations, suggestions };
  }

  containsHardcodedSecrets(content) {
    const secretPatterns = [
      /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
      /secret\s*[:=]\s*["'][^"']+["']/i,
      /password\s*[:=]\s*["'][^"']+["']/i,
      /token\s*[:=]\s*["'][^"']+["']/i,
      /sk_test_[a-zA-Z0-9]+/,
      /sk_live_[a-zA-Z0-9]+/
    ];

    return secretPatterns.some(pattern => pattern.test(content));
  }

  containsSQLInjection(content) {
    const sqlPatterns = [
      /query\s*\(\s*["'`].*\+.*["'`]\s*\)/,
      /execute\s*\(\s*["'`].*\$\{.*\}.*["'`]\s*\)/,
      /db\s*\.\s*query\s*\(\s*["'`].*\+.*["'`]\s*\)/
    ];

    return sqlPatterns.some(pattern => pattern.test(content));
  }

  containsSyncFileOperations(content) {
    const syncPatterns = [
      /readFileSync/,
      /writeFileSync/,
      /appendFileSync/,
      /mkdirSync/,
      /rmdirSync/
    ];

    return syncPatterns.some(pattern => pattern.test(content));
  }

  violatesModularDesign(content, filename) {
    const lines = content.split('\n');
    const functionCount = (content.match(/function\s+\w+|=>\s*{|class\s+\w+/g) || []).length;
    
    // If file has more than 300 lines or more than 10 functions, suggest splitting
    return lines.length > 300 || functionCount > 10;
  }

  findLineWithSecret(content) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (/api[_-]?key|secret|password|token/i.test(lines[i])) {
        return i + 1;
      }
    }
    return null;
  }

  findSQLInjectionLine(content) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (/query.*\+|execute.*\$\{/.test(lines[i])) {
        return i + 1;
      }
    }
    return null;
  }

  findSyncOperationLine(content) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (/Sync\(/.test(lines[i])) {
        return i + 1;
      }
    }
    return null;
  }

  formatReport(checkResult) {
    const { violations, suggestions } = checkResult;
    const output = [];

    if (violations.length > 0) {
      output.push(chalk.bold.red('\n🚨 Rule Violations:'));
      violations.forEach(violation => {
        const icon = violation.severity === 'critical' ? '🚨' : '⚠️';
        output.push(`  ${icon} ${violation.message}`);
        if (violation.line) {
          output.push(chalk.gray(`     Line ${violation.line}`));
        }
      });
    }

    if (suggestions.length > 0) {
      output.push(chalk.bold.yellow('\n💡 Suggestions:'));
      suggestions.forEach(suggestion => {
        output.push(`  💡 ${suggestion.message}`);
      });
    }

    if (violations.length === 0 && suggestions.length === 0) {
      output.push(chalk.green('\n✅ All rules passed!'));
    }

    return output.join('\n');
  }
}