import { watch } from 'chokidar';
import chalk from 'chalk';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';
import { SeniorDevAdvisor } from './senior-dev-advisor.js';
import { AIPoweredAdvisor } from './ai-powered-advisor.js';
import { CleanMonitor } from './clean-monitor.js';
import { DiffMonitor } from './diff-monitor.js';

export class UnifiedMonitor {
  constructor(projectPath, options = {}) {
    this.projectPath = projectPath;
    this.modes = ['chat', 'diff', 'clean', 'enhanced', 'companion'];
    this.currentModeIndex = 0;
    this.currentMode = this.modes[this.currentModeIndex];
    
    // Shared state
    this.updates = [];
    this.updateCount = 0;
    this.chatHistory = [];
    this.currentContext = null;
    this.isProcessingInput = false;
    this.watcher = null;
    
    // AI advisors
    this.seniorDev = new SeniorDevAdvisor();
    this.aiAdvisor = new AIPoweredAdvisor();
    
    // Set up readline with keypress events
    this.setupReadline();
  }

  setupReadline() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.getPrompt(),
      terminal: true
    });

    // Enable keypress events
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    
    readline.emitKeypressEvents(process.stdin, this.rl);
    
    // Handle keypress events
    process.stdin.on('keypress', (str, key) => {
      if (key && key.name === 'tab' && key.shift) {
        this.handleModeSwitch();
      } else if (key && key.ctrl && key.name === 'c') {
        this.handleExit();
      } else if (this.currentMode === 'chat' && str) {
        // In chat mode, handle normal input
        process.stdout.write(str);
      }
    });
  }

  handleModeSwitch() {
    // Clear any pending input
    this.rl.clearLine();
    
    // Switch to next mode
    this.currentModeIndex = (this.currentModeIndex + 1) % this.modes.length;
    this.currentMode = this.modes[this.currentModeIndex];
    
    // Update display
    this.updateDisplay();
    
    // Show mode switch notification
    this.showModeNotification();
    
    // Update prompt
    this.rl.setPrompt(this.getPrompt());
    this.rl.prompt();
  }

  showModeNotification() {
    const modeInfo = {
      'chat': '💬 Interactive Chat Mode - Ask questions while coding',
      'diff': '🔍 Diff Mode - See exact code changes',
      'clean': '📝 Clean Mode - Recent updates with explanations',
      'enhanced': '🚀 Enhanced Mode - Monitor everything',
      'companion': '🎓 Companion Mode - Your complete coding companion'
    };
    
    console.log('\n' + chalk.bold.green(`✨ Switched to: ${modeInfo[this.currentMode]}`));
    console.log(chalk.gray('Press Shift+Tab to switch modes • Ctrl+C to exit\n'));
  }

  getPrompt() {
    const prompts = {
      'chat': chalk.cyan('💬 '),
      'diff': chalk.yellow('🔍 '),
      'clean': chalk.green('📝 '),
      'enhanced': chalk.magenta('🚀 '),
      'companion': chalk.blue('🎓 ')
    };
    return prompts[this.currentMode] || '> ';
  }

  async start() {
    this.clearScreen();
    this.showWelcome();
    
    // Set up file watcher
    this.setupFileWatcher();
    
    // Set up input handling based on mode
    this.setupInputHandling();
    
    // Initial display
    this.updateDisplay();
    
    // Show prompt for chat mode
    if (this.currentMode === 'chat') {
      this.rl.prompt();
    }
  }

  showWelcome() {
    console.log(chalk.bold.cyan('\n🎓 Claude Code Teacher - Unified Monitor'));
    console.log(chalk.gray('Switch between modes with Shift+Tab'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.yellow('\n🔄 Available Modes:'));
    console.log(chalk.gray('  • Chat - Interactive Q&A while coding'));
    console.log(chalk.gray('  • Diff - See exact code changes'));
    console.log(chalk.gray('  • Clean - Recent updates with AI analysis'));
    console.log(chalk.gray('  • Enhanced - Monitor everything'));
    console.log(chalk.gray('  • Companion - Full productivity suite'));
    console.log(chalk.gray('─'.repeat(60)));
    
    this.showModeNotification();
  }

  setupFileWatcher() {
    this.watcher = watch(this.projectPath, {
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

    this.watcher
      .on('add', path => this.handleFileChange('added', path))
      .on('change', path => this.handleFileChange('modified', path))
      .on('unlink', path => this.handleFileChange('deleted', path));
  }

  setupInputHandling() {
    this.rl.on('line', async (input) => {
      if (this.currentMode !== 'chat') {
        // In non-chat modes, handle commands only
        if (input.trim().toLowerCase() === 'q' || input.trim().toLowerCase() === 'quit') {
          this.handleExit();
        } else if (input.trim() === '?') {
          this.showHelp();
        }
        return;
      }
      
      // Chat mode input handling
      if (this.isProcessingInput) return;
      
      this.isProcessingInput = true;
      const trimmedInput = input.trim();
      
      if (!trimmedInput) {
        this.isProcessingInput = false;
        this.rl.prompt();
        return;
      }
      
      // Handle commands
      if (trimmedInput.startsWith('/')) {
        await this.handleChatCommand(trimmedInput);
      } else {
        await this.handleChatMessage(trimmedInput);
      }
      
      this.isProcessingInput = false;
      this.updateDisplay();
      this.rl.prompt();
    });
  }

  async handleFileChange(type, filePath) {
    this.updateCount++;
    
    const filename = path.basename(filePath);
    const ext = path.extname(filename).slice(1);
    
    // Store context
    this.currentContext = {
      type,
      filename,
      filePath,
      ext,
      timestamp: new Date().toLocaleTimeString()
    };
    
    // Get file content and diff for modified files
    if (type !== 'deleted') {
      try {
        this.currentContext.content = await readFile(filePath, 'utf-8');
        
        if (type === 'modified') {
          try {
            const diff = execSync(`git diff HEAD -- "${filePath}"`, {
              encoding: 'utf8',
              maxBuffer: 1024 * 1024,
              cwd: this.projectPath
            });
            if (diff && diff.trim()) {
              this.currentContext.diff = diff;
            }
          } catch (e) {
            // Not in git
          }
        }
      } catch (e) {
        // Can't read file
      }
    }
    
    // Create update object
    const update = {
      number: this.updateCount,
      timestamp: this.currentContext.timestamp,
      type,
      filename,
      filePath,
      context: { ...this.currentContext }
    };
    
    // Add to updates
    this.updates.push(update);
    const maxUpdates = this.currentMode === 'chat' ? 5 : 10;
    if (this.updates.length > maxUpdates) {
      this.updates.shift();
    }
    
    // Update display if not processing input
    if (!this.isProcessingInput) {
      this.updateDisplay();
    }
  }

  updateDisplay() {
    this.clearScreen();
    
    switch (this.currentMode) {
      case 'chat':
        this.displayChatMode();
        break;
      case 'diff':
        this.displayDiffMode();
        break;
      case 'clean':
        this.displayCleanMode();
        break;
      case 'enhanced':
        this.displayEnhancedMode();
        break;
      case 'companion':
        this.displayCompanionMode();
        break;
    }
  }

  displayChatMode() {
    console.log(chalk.bold.cyan('🎓 Claude Code Teacher - Interactive Chat'));
    console.log(chalk.gray('Shift+Tab to switch modes • /help for commands'));
    console.log(chalk.gray('─'.repeat(60)));
    
    // Show compact file updates
    console.log(chalk.bold.yellow('\n📁 Recent Changes:'));
    if (this.updates.length === 0) {
      console.log(chalk.gray('  No changes yet...'));
    } else {
      this.updates.slice(-3).forEach(update => {
        const icon = update.type === 'added' ? '✅' : update.type === 'modified' ? '📝' : '🗑️';
        console.log(`  ${icon} ${update.filename} ${chalk.gray(update.timestamp)}`);
      });
    }
    
    // Show chat
    console.log(chalk.bold.yellow('\n💬 Chat:'));
    console.log(chalk.gray('─'.repeat(60)));
    
    if (this.chatHistory.length === 0) {
      console.log(chalk.gray('  Ask me anything about coding...'));
    } else {
      this.chatHistory.slice(-10).forEach(msg => {
        if (msg.role === 'user') {
          console.log(chalk.cyan(`You: `) + msg.content);
        } else if (msg.role === 'ai') {
          console.log(chalk.green(`Teacher: `) + msg.content);
        }
        console.log('');
      });
    }
    
    console.log(chalk.gray('─'.repeat(60)));
  }

  displayDiffMode() {
    console.log(chalk.bold.yellow('🔍 Claude Code Teacher - Diff Mode'));
    console.log(chalk.gray('Shift+Tab to switch modes • Showing exact changes'));
    console.log(chalk.gray('─'.repeat(60)));
    
    if (this.updates.length === 0) {
      console.log(chalk.gray('\n   Waiting for changes...\n'));
      return;
    }
    
    // Show updates with diffs
    this.updates.slice(-5).forEach(update => {
      console.log('\n' + chalk.bold('═'.repeat(50)));
      console.log(chalk.bold(`📌 UPDATE #${update.number} | ${update.timestamp}`));
      console.log(chalk.bold('═'.repeat(50)));
      
      const icon = update.type === 'added' ? '✅' : update.type === 'modified' ? '📝' : '🗑️';
      console.log(`${icon} ${update.filename}`);
      
      if (update.context.diff) {
        console.log('\n' + chalk.bold('Changes:'));
        console.log(this.formatDiff(update.context.diff));
      }
    });
  }

  displayCleanMode() {
    console.log(chalk.bold.green('📝 Claude Code Teacher - Clean Mode'));
    console.log(chalk.gray('Shift+Tab to switch modes • AI-powered analysis'));
    console.log(chalk.gray('─'.repeat(60)));
    
    if (this.updates.length === 0) {
      console.log(chalk.gray('\n   Waiting for changes...\n'));
      return;
    }
    
    // Show updates with AI analysis
    this.updates.slice(-8).forEach(update => {
      console.log('\n' + chalk.gray('─'.repeat(50)));
      console.log(`${this.getUpdateIcon(update.type)} ${update.filename} ${chalk.gray(update.timestamp)}`);
      
      if (update.context.content) {
        // Show code snippet
        const snippet = this.extractImportantCode(update.context.content, update.context.ext);
        if (snippet) {
          console.log(chalk.gray('\nCode:'));
          console.log(chalk.cyan(snippet));
        }
        
        // Show AI analysis
        const suggestions = this.seniorDev.analyzeCode(update.context.content, update.filename);
        if (suggestions.length > 0) {
          console.log(this.seniorDev.formatSuggestions(suggestions));
        }
      }
    });
  }

  displayEnhancedMode() {
    console.log(chalk.bold.magenta('🚀 Claude Code Teacher - Enhanced Mode'));
    console.log(chalk.gray('Shift+Tab to switch modes • Monitoring everything'));
    console.log(chalk.gray('─'.repeat(60)));
    
    // Show comprehensive information
    console.log(chalk.yellow('\n📊 Project Statistics:'));
    console.log(`  Total changes: ${this.updateCount}`);
    console.log(`  Files modified: ${new Set(this.updates.map(u => u.filename)).size}`);
    
    console.log(chalk.yellow('\n📋 All Recent Activity:'));
    this.updates.forEach(update => {
      console.log(`  ${this.getUpdateIcon(update.type)} ${update.filename} ${chalk.gray(update.timestamp)}`);
    });
    
    if (this.currentContext && this.currentContext.content) {
      console.log(chalk.yellow('\n🔍 Current Focus:'));
      console.log(`  File: ${this.currentContext.filename}`);
      console.log(`  Lines: ${this.currentContext.content.split('\n').length}`);
    }
  }

  displayCompanionMode() {
    console.log(chalk.bold.blue('🎓 Claude Code Teacher - Companion Mode'));
    console.log(chalk.gray('Shift+Tab to switch modes • Your complete coding companion'));
    console.log(chalk.gray('─'.repeat(60)));
    
    // Show companion dashboard
    console.log(chalk.yellow('\n📈 Dashboard:'));
    console.log(`  🔥 Productivity: 4/4 pomodoros today`);
    console.log(`  💪 Wellness: 85/100 score`);
    console.log(`  🎆 Streak: 7 days`);
    console.log(`  ⬆️ Level: 12 (850/1200 XP)`);
    
    console.log(chalk.yellow('\n🎯 Quick Actions:'));
    console.log(chalk.cyan('  P - Start Pomodoro • W - Wellness Check • D - Debug with Duck'));
    console.log(chalk.cyan('  E - Entertainment • F - Focus Mode • S - Stats'));
    
    // Show recent activity if any
    if (this.updates.length > 0) {
      console.log(chalk.yellow('\n📁 Recent Code Activity:'));
      this.updates.slice(-3).forEach(update => {
        console.log(`  ${this.getUpdateIcon(update.type)} ${update.filename} ${chalk.gray(update.timestamp)}`);
      });
    }
    
    // Daily tip
    const tips = [
      "💡 Tip: Regular breaks increase productivity by 40%!",
      "🧠 Tip: Your brain can only focus for 90-120 minutes at a time.",
      "💧 Tip: Staying hydrated improves cognitive function by 14%.",
      "🌱 Tip: Indoor plants can increase productivity by up to 15%."
    ];
    
    const tip = tips[Math.floor(Math.random() * tips.length)];
    console.log(chalk.gray('\n' + tip));
    
    console.log(chalk.gray('\n─'.repeat(60)));
    console.log(chalk.gray('Type commands above or press Enter for full companion menu'));
  }

  getUpdateIcon(type) {
    const icons = {
      'added': chalk.green('✅'),
      'modified': chalk.yellow('📝'),
      'deleted': chalk.red('🗑️')
    };
    return icons[type] || '📄';
  }

  formatDiff(diff) {
    const lines = diff.split('\n');
    const formatted = [];
    
    lines.slice(0, 20).forEach(line => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        formatted.push(chalk.green(line));
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        formatted.push(chalk.red(line));
      } else if (line.startsWith('@@')) {
        formatted.push(chalk.blue(line));
      } else if (!line.startsWith('diff --git') && !line.startsWith('index')) {
        formatted.push(chalk.gray(line));
      }
    });
    
    return formatted.join('\n');
  }

  extractImportantCode(content, ext) {
    const lines = content.split('\n');
    if (lines.length <= 10) return lines.join('\n');
    
    // Extract key parts
    const important = [];
    
    // Get imports
    const imports = lines.filter(line => 
      line.includes('import') || line.includes('require')
    ).slice(0, 3);
    
    if (imports.length > 0) {
      important.push(...imports, '');
    }
    
    // Get function definitions
    const functions = lines.filter(line =>
      line.includes('function') || line.includes('=>') || line.includes('class')
    ).slice(0, 3);
    
    if (functions.length > 0) {
      important.push(...functions);
    }
    
    return important.join('\n');
  }

  async handleChatCommand(command) {
    const cmd = command.toLowerCase();
    
    switch (cmd) {
      case '/help':
        this.showChatHelp();
        break;
      case '/clear':
        this.chatHistory = [];
        this.addChatMessage('system', 'Chat history cleared.');
        break;
      case '/quit':
        this.handleExit();
        break;
      default:
        this.addChatMessage('system', `Unknown command: ${command}`);
    }
  }

  async handleChatMessage(message) {
    this.addChatMessage('user', message);
    
    // Generate AI response
    const response = await this.generateAIResponse(message);
    this.addChatMessage('ai', response);
  }

  async generateAIResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Context-aware responses
    if (this.currentContext) {
      if (lowerMessage.includes('what changed') || lowerMessage.includes('last')) {
        return this.explainLastChange();
      }
    }
    
    // Concept explanations
    if (lowerMessage.includes('what is')) {
      return this.explainConcept(message);
    }
    
    // Default helpful response
    return `I'm here to help you learn! You asked: "${message}"\n\nTry asking about:\n• Recent code changes\n• Programming concepts\n• Best practices\n• Security or performance`;
  }

  explainLastChange() {
    if (!this.currentContext) {
      return "No changes detected yet. Modify a file and I'll explain what changed!";
    }
    
    const { type, filename, diff } = this.currentContext;
    
    if (type === 'modified' && diff) {
      return `The file ${filename} was modified. Here's what changed:\n\n${this.formatDiff(diff).slice(0, 500)}...\n\nThis change appears to be updating the code structure.`;
    }
    
    return `The file ${filename} was ${type}. Make another change and I'll show you the diff!`;
  }

  explainConcept(question) {
    if (question.toLowerCase().includes('async')) {
      return 'Async/await makes asynchronous code look synchronous, making it easier to read and understand. It\'s like waiting in line - you can do other things while waiting!';
    }
    
    return 'That\'s a great question! I can explain concepts like async/await, promises, closures, and more. What would you like to learn about?';
  }

  addChatMessage(role, content) {
    this.chatHistory.push({
      role,
      content,
      timestamp: new Date().toLocaleTimeString()
    });
    
    if (this.chatHistory.length > 50) {
      this.chatHistory.shift();
    }
  }

  showHelp() {
    console.log(chalk.yellow('\n📌 Help:'));
    console.log(chalk.gray('  Shift+Tab - Switch between modes'));
    console.log(chalk.gray('  ? - Show this help'));
    console.log(chalk.gray('  q/quit - Exit'));
    
    if (this.currentMode === 'chat') {
      console.log(chalk.gray('\n  Chat commands:'));
      console.log(chalk.gray('  /help - Show chat help'));
      console.log(chalk.gray('  /clear - Clear chat history'));
    }
  }

  showChatHelp() {
    const help = `
${chalk.bold.yellow('💬 Chat Commands:')}
/help - Show this help
/clear - Clear chat history
/quit - Exit

${chalk.bold.yellow('🎯 You can ask about:')}
• Recent changes: "What changed?"
• Concepts: "What is async/await?"
• Code quality: "Any security issues?"
• Best practices: "How can I improve this?"`;
    
    this.addChatMessage('system', help);
  }

  clearScreen() {
    console.clear();
  }

  handleExit() {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    console.log(chalk.yellow('\n\n👋 Thanks for using Claude Code Teacher!'));
    process.exit(0);
  }
}

export async function startUnifiedMonitor(projectPath) {
  const monitor = new UnifiedMonitor(projectPath);
  await monitor.start();
  return monitor;
}