import chokidar from 'chokidar';
import chalk from 'chalk';
import { TeachingEngine } from './explainer.js';
import { GuidelinesMonitor } from './guidelines-monitor.js';
import { SeniorDevAdvisor } from './senior-dev-advisor.js';
import { readFile } from 'fs/promises';

export class CleanMonitor {
  constructor(projectPath, options = {}) {
    this.projectPath = projectPath;
    this.teachingEngine = new TeachingEngine('realtime', projectPath);
    this.guidelinesMonitor = new GuidelinesMonitor(projectPath);
    this.seniorDev = new SeniorDevAdvisor();
    this.updateCount = 0;
    this.maxUpdates = options.maxUpdates || 10; // Keep last 10 updates visible
    this.updates = [];
  }

  async start() {
    // Clear screen and show header
    console.clear();
    this.showHeader();
    
    // Initialize guidelines silently
    const originalLog = console.log;
    console.log = () => {}; // Temporarily disable logging
    await this.guidelinesMonitor.initialize();
    console.log = originalLog; // Restore logging
    
    // Start watching
    this.watch();
  }

  showHeader() {
    console.log(chalk.bold.cyan('╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.bold.cyan('║          📚 Claude Code Teacher - Live Monitor             ║'));
    console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════════╝'));
    console.log(chalk.gray(`\nWatching: ${this.projectPath}`));
    console.log(chalk.gray(`Showing last ${this.maxUpdates} updates\n`));
  }

  watch() {
    const watcher = chokidar.watch(this.projectPath, {
      ignored: [/(^|[\/\\])\../, /node_modules/, /build/, /dist/],
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('add', path => this.handleChange('added', path));
    watcher.on('change', path => this.handleChange('modified', path));
    watcher.on('unlink', path => this.handleChange('deleted', path));
  }

  async handleChange(type, path) {
    const update = {
      type,
      path,
      time: new Date().toLocaleTimeString(),
      message: ''
    };

    // Generate appropriate message
    switch (type) {
      case 'added':
        update.icon = '📄';
        update.color = chalk.green;
        update.message = await this.getAddedFileMessage(path);
        break;
      case 'modified':
        update.icon = '✏️';
        update.color = chalk.yellow;
        update.message = await this.getModifiedFileMessage(path);
        break;
      case 'deleted':
        update.icon = '🗑️';
        update.color = chalk.red;
        update.message = `File deleted: ${path}`;
        break;
    }

    // Check guidelines for added/modified files
    if (type !== 'deleted') {
      const violations = await this.checkFile(path);
      if (violations) {
        update.violations = violations;
      }
    }

    // Add to updates array
    this.updates.push(update);
    if (this.updates.length > this.maxUpdates) {
      this.updates.shift();
    }

    // Redraw screen
    this.redraw();
  }

  async getAddedFileMessage(path) {
    const filename = path.split('/').pop();
    const ext = filename.split('.').pop();
    
    // Read file content for snippet
    let codeSnippet = '';
    let explanation = '';
    
    try {
      const content = await readFile(path, 'utf-8');
      const lines = content.split('\n');
      
      // Get important parts of the code
      codeSnippet = this.extractImportantCode(content, ext);
      
      // Generate explanation based on content
      explanation = this.generateExplanation(content, ext, filename);
      
    } catch (error) {
      // Can't read file
    }
    
    let message = `New ${this.getFileType(filename, ext)} file: ${filename}\n`;
    
    if (codeSnippet) {
      message += chalk.gray('\nCode snippet:\n');
      message += chalk.dim('```' + ext + '\n');
      message += chalk.cyan(codeSnippet);
      message += chalk.dim('\n```\n');
    }
    
    if (explanation) {
      message += chalk.yellow('\n📚 ') + explanation;
    }
    
    // Get senior dev advice
    try {
      const content = await readFile(path, 'utf-8');
      const suggestions = this.seniorDev.analyzeCode(content, filename);
      if (suggestions.length > 0) {
        message += this.seniorDev.formatSuggestions(suggestions);
      }
    } catch (error) {
      // Can't analyze
    }
    
    return message;
  }
  
  extractImportantCode(content, ext) {
    const lines = content.split('\n').filter(line => line.trim());
    
    // For long files, extract key parts
    if (lines.length > 15) {
      const important = [];
      
      // Get imports/requires
      const imports = lines.filter(line => 
        line.includes('import') || line.includes('require') || line.includes('from')
      ).slice(0, 3);
      
      if (imports.length > 0) {
        important.push(...imports);
        important.push('');
      }
      
      // Get function/class definitions
      const definitions = lines.filter(line =>
        line.includes('function') || line.includes('class') || 
        line.includes('const') && line.includes('=>') ||
        line.includes('export')
      ).slice(0, 5);
      
      if (definitions.length > 0) {
        important.push(...definitions);
      }
      
      // If we found important parts, return them
      if (important.length > 0) {
        if (lines.length > important.length + 5) {
          important.push('\n// ... ' + (lines.length - important.length) + ' more lines ...');
        }
        return important.join('\n');
      }
    }
    
    // For short files, show all
    if (lines.length <= 15) {
      return content;
    }
    
    // Default: show first 10 lines
    return lines.slice(0, 10).join('\n') + '\n// ... more code below ...';
  }
  
  generateExplanation(content, ext, filename) {
    const explanations = [];
    
    // Check for patterns and explain them
    if (content.includes('async') || content.includes('await')) {
      explanations.push('Uses async/await for handling asynchronous operations');
    }
    
    if (content.includes('class')) {
      explanations.push('Defines a class for object-oriented programming');
    }
    
    if (content.includes('express')) {
      explanations.push('Express.js server setup for handling HTTP requests');
    }
    
    if (content.includes('mongoose') || content.includes('mongodb')) {
      explanations.push('MongoDB database integration for data persistence');
    }
    
    if (content.includes('bcrypt')) {
      explanations.push('Password hashing for secure authentication');
    }
    
    if (content.includes('jwt') || content.includes('jsonwebtoken')) {
      explanations.push('JWT tokens for stateless authentication');
    }
    
    if (content.includes('test') || content.includes('describe') || content.includes('it(')) {
      explanations.push('Test file using testing framework for quality assurance');
    }
    
    if (filename.includes('config')) {
      explanations.push('Configuration file - consider using environment variables for sensitive data');
    }
    
    if (content.includes('API_KEY') || content.includes('SECRET')) {
      explanations.push('⚠️ Contains potential secrets - use environment variables instead!');
    }
    
    return explanations.join('. ');
  }
  
  getFileType(filename, ext) {
    if (filename.includes('test') || filename.includes('spec')) return 'test';
    if (filename.includes('config')) return 'configuration';
    if (filename.includes('component')) return 'component';
    if (filename.includes('service')) return 'service';
    if (filename.includes('model')) return 'model';
    
    const types = {
      js: 'JavaScript',
      ts: 'TypeScript',
      jsx: 'React',
      json: 'JSON',
      md: 'Markdown'
    };
    
    return types[ext] || ext.toUpperCase();
  }

  async getModifiedFileMessage(path) {
    const filename = path.split('/').pop();
    const ext = filename.split('.').pop();
    
    let message = `Modified ${this.getFileType(filename, ext)} file: ${filename}\n`;
    
    // Try to show what changed
    try {
      const content = await readFile(path, 'utf-8');
      
      // For now, show a snippet of the current content
      const snippet = this.extractImportantCode(content, ext);
      
      if (snippet) {
        message += chalk.gray('\nCurrent code:\n');
        message += chalk.dim('```' + ext + '\n');
        message += chalk.cyan(snippet);
        message += chalk.dim('\n```\n');
      }
      
      // Generate explanation
      const explanation = this.generateExplanation(content, ext, filename);
      if (explanation) {
        message += chalk.yellow('\n📚 ') + explanation;
      }
      
      // Special messages for certain files
      if (filename === 'package.json') {
        message += chalk.magenta('\n\n💡 Tip: Run `npm install` if dependencies changed');
      }
      if (filename.includes('.env')) {
        message += chalk.red('\n\n🔐 Security: Never commit .env files!');
      }
      
      // Get senior dev advice
      const suggestions = this.seniorDev.analyzeCode(content, filename);
      if (suggestions.length > 0) {
        message += this.seniorDev.formatSuggestions(suggestions);
      }
      
    } catch (error) {
      // Can't read file
    }
    
    return message;
  }

  async checkFile(path) {
    try {
      const content = await readFile(path, 'utf-8');
      const violations = this.guidelinesMonitor.checkViolations(content, path);
      
      if (violations.length > 0) {
        return this.formatViolations(violations);
      }
    } catch (error) {
      // Can't read file
    }
    return null;
  }

  formatViolations(violations) {
    const high = violations.filter(v => v.severity === 'high');
    const medium = violations.filter(v => v.severity === 'medium');
    
    let message = '';
    if (high.length > 0) {
      message += chalk.red(`  🚨 ${high[0].message}\n`);
    }
    if (medium.length > 0 && !message) {
      message += chalk.yellow(`  ⚠️  ${medium[0].message}\n`);
    }
    
    return message;
  }

  redraw() {
    // Clear and redraw
    console.clear();
    this.showHeader();
    
    // Show updates
    this.updates.forEach((update, index) => {
      // Separator
      if (index > 0) {
        console.log(chalk.gray('─'.repeat(60)));
      }
      
      // Update header
      console.log(
        update.color(`${update.icon} ${update.type.toUpperCase()}`),
        chalk.gray(`[${update.time}]`)
      );
      
      // Message
      console.log(update.message);
      
      // Violations if any
      if (update.violations) {
        console.log(update.violations);
      }
      
      console.log(); // Empty line
    });

    // Footer
    console.log(chalk.gray('\n─'.repeat(60)));
    console.log(chalk.gray('Press Ctrl+C to stop monitoring\n'));
  }
}

// Export function to start clean monitor
export async function startCleanMonitor(projectPath = process.cwd()) {
  const monitor = new CleanMonitor(projectPath, {
    maxUpdates: 8 // Show last 8 updates
  });
  
  await monitor.start();
  
  // Keep running
  process.on('SIGINT', () => {
    console.log(chalk.red('\n\nStopping monitor...'));
    process.exit(0);
  });
}