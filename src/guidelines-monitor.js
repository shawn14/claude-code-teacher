import fs from 'fs/promises';
import path from 'path';

export class GuidelinesMonitor {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.guidelines = new Map();
    this.rules = [];
  }

  async initialize() {
    // Load CLAUDE.md
    await this.loadGuidelines('CLAUDE.md');
    
    // Load other common guideline files
    const guidelineFiles = [
      'CONTRIBUTING.md',
      'CODE_OF_CONDUCT.md',
      'STYLE_GUIDE.md',
      '.cursorrules',
      '.github/copilot-instructions.md'
    ];
    
    for (const file of guidelineFiles) {
      await this.loadGuidelines(file);
    }
    
    // Parse guidelines into rules
    this.parseRules();
    
    return this;
  }

  async loadGuidelines(filename) {
    try {
      const filePath = path.join(this.projectPath, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      this.guidelines.set(filename, content);
      console.log(`📚 Loaded guidelines from ${filename}`);
    } catch (error) {
      // File doesn't exist, that's okay
    }
  }

  parseRules() {
    // Extract rules from CLAUDE.md
    const claudeMd = this.guidelines.get('CLAUDE.md');
    if (claudeMd) {
      this.extractClaudeRules(claudeMd);
    }
    
    // Extract common patterns from all guidelines
    for (const [filename, content] of this.guidelines) {
      this.extractCommonRules(content, filename);
    }
  }

  extractClaudeRules(content) {
    // Look for common CLAUDE.md patterns
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Commands section
      if (line.includes('npm run') || line.includes('yarn')) {
        const command = line.match(/(npm run|yarn) (\w+)/);
        if (command) {
          this.rules.push({
            type: 'command',
            command: command[0],
            description: `Use '${command[0]}' as documented in CLAUDE.md`
          });
        }
      }
      
      // Architecture patterns
      if (line.toLowerCase().includes('architecture') || line.toLowerCase().includes('structure')) {
        // Extract architecture guidelines
        this.rules.push({
          type: 'architecture',
          pattern: line,
          source: 'CLAUDE.md'
        });
      }
      
      // Don'ts and warnings
      if (line.toLowerCase().includes("don't") || line.toLowerCase().includes("never") || line.toLowerCase().includes("avoid")) {
        this.rules.push({
          type: 'prohibition',
          rule: line.trim(),
          source: 'CLAUDE.md'
        });
      }
      
      // Must/should patterns
      if (line.toLowerCase().includes("must") || line.toLowerCase().includes("should") || line.toLowerCase().includes("always")) {
        this.rules.push({
          type: 'requirement',
          rule: line.trim(),
          source: 'CLAUDE.md'
        });
      }
    }
  }

  extractCommonRules(content, filename) {
    const lines = content.split('\n');
    
    // Look for code style rules
    if (content.includes('indent') || content.includes('spacing')) {
      const indentMatch = content.match(/(\d+) spaces/i);
      if (indentMatch) {
        this.rules.push({
          type: 'style',
          rule: `Use ${indentMatch[1]} spaces for indentation`,
          source: filename
        });
      }
    }
    
    // Security patterns
    if (content.toLowerCase().includes('api key') || content.toLowerCase().includes('secret') || content.toLowerCase().includes('token')) {
      this.rules.push({
        type: 'security',
        rule: 'Never commit API keys, secrets, or tokens',
        source: filename
      });
    }
    
    // Testing requirements
    if (content.includes('test') && (content.includes('must') || content.includes('should'))) {
      this.rules.push({
        type: 'testing',
        rule: 'Write tests for new features',
        source: filename
      });
    }
  }

  checkViolations(code, filePath) {
    const violations = [];
    
    // Check for security violations
    if (this.hasSecurityViolation(code)) {
      violations.push({
        severity: 'high',
        type: 'security',
        message: '🚨 SECURITY WARNING: Possible API key or secret detected!',
        suggestion: 'Use environment variables instead of hardcoding secrets',
        rule: 'Never commit secrets or API keys'
      });
    }
    
    // Check for console.log in production code
    if (code.includes('console.log') && !filePath.includes('test') && !filePath.includes('example')) {
      const hasRule = this.rules.some(r => r.rule && r.rule.toLowerCase().includes('console.log'));
      if (hasRule) {
        violations.push({
          severity: 'medium',
          type: 'code-quality',
          message: '⚠️ Found console.log in production code',
          suggestion: 'Use a proper logging library or remove debug statements',
          rule: 'Avoid console.log in production code'
        });
      }
    }
    
    // Check for TODO comments
    if (code.includes('TODO') || code.includes('FIXME')) {
      violations.push({
        severity: 'low',
        type: 'maintenance',
        message: '📝 Found TODO/FIXME comment',
        suggestion: 'Consider creating an issue to track this work',
        rule: 'Address or track TODO items'
      });
    }
    
    // Check file naming conventions if rules exist
    const fileName = path.basename(filePath);
    if (this.hasNamingViolation(fileName)) {
      violations.push({
        severity: 'low',
        type: 'naming',
        message: '📛 File naming convention violation',
        suggestion: 'Follow project naming conventions (e.g., camelCase, kebab-case)',
        rule: 'Use consistent file naming'
      });
    }
    
    // Check for missing error handling in async functions
    if (code.includes('async') && !code.includes('try') && !code.includes('catch')) {
      violations.push({
        severity: 'medium',
        type: 'error-handling',
        message: '⚡ Async function without error handling',
        suggestion: 'Add try-catch blocks to handle potential errors',
        rule: 'Handle errors in async functions'
      });
    }
    
    return violations;
  }

  hasSecurityViolation(code) {
    // Common patterns for API keys and secrets
    const secretPatterns = [
      /api[_-]?key\s*[:=]\s*["'][^"']{20,}/i,
      /secret\s*[:=]\s*["'][^"']{10,}/i,
      /token\s*[:=]\s*["'][^"']{20,}/i,
      /password\s*[:=]\s*["'][^"']+/i,
      /[a-zA-Z0-9]{40}/, // GitHub token pattern
      /sk-[a-zA-Z0-9]{48}/, // OpenAI API key pattern
    ];
    
    return secretPatterns.some(pattern => pattern.test(code));
  }

  hasNamingViolation(fileName) {
    // Check if there are specific naming rules
    const namingRules = this.rules.filter(r => r.type === 'naming' || r.rule?.includes('naming'));
    
    if (namingRules.length === 0) return false;
    
    // Common violations
    if (fileName.includes(' ')) return true; // No spaces in filenames
    if (fileName !== fileName.toLowerCase() && !fileName.match(/^[A-Z]/)) return true; // Mixed case without proper convention
    
    return false;
  }

  getActiveRules() {
    return this.rules;
  }

  formatViolationReport(violations) {
    if (violations.length === 0) return null;
    
    let report = '\n🔍 **Guidelines Check Results:**\n\n';
    
    // Group by severity
    const high = violations.filter(v => v.severity === 'high');
    const medium = violations.filter(v => v.severity === 'medium');
    const low = violations.filter(v => v.severity === 'low');
    
    if (high.length > 0) {
      report += '**🔴 High Priority Issues:**\n';
      high.forEach(v => {
        report += `- ${v.message}\n`;
        report += `  💡 ${v.suggestion}\n`;
        report += `  📏 Rule: "${v.rule}"\n\n`;
      });
    }
    
    if (medium.length > 0) {
      report += '**🟡 Medium Priority Issues:**\n';
      medium.forEach(v => {
        report += `- ${v.message}\n`;
        report += `  💡 ${v.suggestion}\n\n`;
      });
    }
    
    if (low.length > 0) {
      report += '**🟢 Low Priority Issues:**\n';
      low.forEach(v => {
        report += `- ${v.message}\n`;
        if (v.suggestion) report += `  💡 ${v.suggestion}\n`;
      });
    }
    
    report += '\n💪 **Remember**: Following project guidelines helps maintain code quality and team consistency!';
    
    return report;
  }
}