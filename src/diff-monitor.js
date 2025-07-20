import { watch } from 'chokidar';
import chalk from 'chalk';
import { readFile } from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';
import { SeniorDevAdvisor } from './senior-dev-advisor.js';
import { AIPoweredAdvisor } from './ai-powered-advisor.js';

export class DiffMonitor {
  constructor(projectPath, options = {}) {
    this.projectPath = projectPath;
    this.maxUpdates = options.maxUpdates || 10;
    this.updates = [];
    this.updateCount = 0;
    this.seniorDev = new SeniorDevAdvisor();
    this.aiAdvisor = new AIPoweredAdvisor();
    this.chatEnabled = options.chatEnabled || false;
    this.currentContext = null;
  }

  async start() {
    console.log(chalk.bold.cyan('\n🎓 Claude Code Teacher - Diff Monitor'));
    console.log(chalk.gray('Showing actual code changes with git diff'));
    console.log(chalk.gray('─'.repeat(50)));

    const watcher = watch(this.projectPath, {
      ignored: [
        /node_modules/,
        /\.git/,
        /\.DS_Store/,
        /\.next/,
        /dist/,
        /build/,
        /coverage/,
        /\.cache/,
        /tmp/,
        /temp/
      ],
      persistent: true,
      ignoreInitial: true
    });

    watcher
      .on('add', path => this.handleFileChange('added', path))
      .on('change', path => this.handleFileChange('modified', path))
      .on('unlink', path => this.handleFileChange('deleted', path));
  }

  async handleFileChange(type, filePath) {
    this.updateCount++;
    
    const update = {
      number: this.updateCount,
      timestamp: new Date().toLocaleTimeString(),
      type,
      path: filePath,
      relativePath: path.relative(this.projectPath, filePath)
    };

    // Get the actual changes
    update.message = await this.getChangeMessage(type, filePath);
    
    // Add to updates
    this.updates.push(update);
    if (this.updates.length > this.maxUpdates) {
      this.updates.shift();
    }

    this.displayUpdate();
  }

  async getChangeMessage(type, filePath) {
    const filename = path.basename(filePath);
    const ext = path.extname(filename).slice(1);
    
    let message = '';

    switch (type) {
      case 'added':
        message = chalk.green(`✅ NEW FILE: ${filename}`);
        break;
      case 'modified':
        message = chalk.yellow(`📝 MODIFIED: ${filename}`);
        break;
      case 'deleted':
        message = chalk.red(`🗑️ DELETED: ${filename}`);
        return message;
    }

    // Try to get git diff for modifications
    if (type === 'modified') {
      try {
        const diff = execSync(`git diff HEAD -- "${filePath}"`, {
          encoding: 'utf8',
          maxBuffer: 1024 * 1024,
          cwd: this.projectPath
        });

        if (diff && diff.trim()) {
          message += '\n\n' + chalk.bold('WHAT CHANGED:');
          message += '\n```diff\n' + this.formatDiff(diff) + '\n```';
        }
      } catch (e) {
        // Not in git, show recent content instead
        try {
          const content = await readFile(filePath, 'utf-8');
          const lines = content.split('\n');
          if (lines.length > 0) {
            message += '\n\n' + chalk.bold('RECENT CONTENT:');
            message += '\n```' + ext + '\n';
            message += lines.slice(-10).join('\n');
            message += '\n```';
          }
        } catch (e) {
          // Can't read file
        }
      }
    }

    // For new files, show the beginning
    if (type === 'added') {
      try {
        const content = await readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        if (lines.length > 0) {
          message += '\n\n' + chalk.bold('FILE CONTENT:');
          message += '\n```' + ext + '\n';
          message += lines.slice(0, 15).join('\n');
          if (lines.length > 15) {
            message += '\n// ... ' + (lines.length - 15) + ' more lines';
          }
          message += '\n```';
        }
      } catch (e) {
        // Can't read file
      }
    }

    // Analyze with AI
    try {
      const content = await readFile(filePath, 'utf-8');
      
      // Senior dev analysis
      const suggestions = this.seniorDev.analyzeCode(content, filename);
      if (suggestions.length > 0) {
        message += '\n' + this.seniorDev.formatSuggestions(suggestions);
      }

      // AI analysis for deeper insights
      const aiAnalysis = await this.aiAdvisor.analyzeWithAI(content, filename);
      message += '\n' + this.aiAdvisor.formatAIAnalysis(aiAnalysis);
    } catch (e) {
      // Can't analyze
    }

    return message;
  }

  formatDiff(diff) {
    const lines = diff.split('\n');
    const formatted = [];
    let addedCount = 0;
    let removedCount = 0;

    for (const line of lines) {
      // Skip git headers
      if (line.startsWith('diff --git') || 
          line.startsWith('index ') ||
          line.startsWith('---') ||
          line.startsWith('+++')) {
        continue;
      }

      // Hunk headers - show location
      if (line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@(.*)/);
        if (match) {
          formatted.push(chalk.blue(`\n📍 Line ${match[2]}${match[3] ? ':' + match[3] : ''}`));
        }
        continue;
      }

      // Show changes
      if (line.startsWith('+')) {
        formatted.push(chalk.green(line));
        addedCount++;
      } else if (line.startsWith('-')) {
        formatted.push(chalk.red(line));
        removedCount++;
      } else if (formatted.length < 20) {
        // Context lines
        formatted.push(chalk.gray(line));
      }
    }

    if (formatted.length === 0) {
      return 'No changes detected';
    }

    // Add summary
    formatted.push('');
    formatted.push(chalk.gray(`Summary: ${chalk.green('+' + addedCount)} additions, ${chalk.red('-' + removedCount)} deletions`));

    return formatted.join('\n');
  }

  displayUpdate() {
    console.clear();
    console.log(chalk.bold.cyan('\n🎓 Claude Code Teacher - Diff Monitor'));
    console.log(chalk.gray('Showing actual code changes'));
    console.log(chalk.gray('─'.repeat(50)));

    if (this.updates.length === 0) {
      console.log(chalk.gray('\n   Waiting for changes...\n'));
      return;
    }

    // Show updates in reverse order (newest first)
    for (let i = this.updates.length - 1; i >= 0; i--) {
      const update = this.updates[i];
      
      console.log('\n' + chalk.bold('═'.repeat(50)));
      console.log(chalk.bold(`📌 UPDATE #${update.number} | ${update.timestamp}`));
      console.log(chalk.bold('═'.repeat(50)));
      console.log(chalk.gray(`Path: ${update.relativePath}`));
      console.log('\n' + update.message);
    }

    console.log('\n' + chalk.gray('─'.repeat(50)));
    console.log(chalk.gray('Press Ctrl+C to exit'));
    
    if (this.chatEnabled) {
      console.log(chalk.cyan('\n💬 Quick chat: Press "?" to ask about the last change'));
    }
  }
}