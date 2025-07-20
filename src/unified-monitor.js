import { watch } from 'chokidar';
import chalk from 'chalk';
import { readFile } from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';
import { RulesChecker } from './rules-checker.js';
import { SeniorDevAdvisor } from './senior-dev-advisor.js';

export class UnifiedMonitor {
  constructor(projectPath, options = {}) {
    this.projectPath = projectPath;
    this.modes = ['diff', 'rules', 'chat'];
    this.currentModeIndex = 0;
    this.currentMode = this.modes[this.currentModeIndex];
    
    // Shared state
    this.updates = [];
    this.updateCount = 0;
    this.chatHistory = [];
    this.currentContext = null;
    this.isProcessingInput = false;
    this.watcher = null;
    
    // Initialize components
    this.rulesChecker = new RulesChecker(projectPath);
    this.seniorDev = new SeniorDevAdvisor();
    
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
      }
      // Remove the manual character writing - readline handles this
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
      'diff': '🔍 Diff Mode - See code changes with teaching explanations',
      'rules': '📋 Rules Mode - Monitor CLAUDE.md compliance & best practices',
      'chat': '💬 Chat Mode - Interactive Q&A while coding'
    };
    
    console.log('\n' + chalk.bold.green(`✨ Switched to: ${modeInfo[this.currentMode]}`));
    console.log(chalk.gray('Press Shift+Tab to switch modes • Ctrl+C to exit\n'));
  }

  getPrompt() {
    const prompts = {
      'diff': '',
      'rules': '',
      'chat': chalk.cyan('💬 ')
    };
    return prompts[this.currentMode] || '> ';
  }

  async start() {
    // Initialize rules checker
    await this.rulesChecker.initialize();
    
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
    console.log(chalk.bold.cyan('\n🎓 Claude Code Teacher'));
    console.log(chalk.gray('Real-time code monitoring with teaching & analysis'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.yellow('\n🔄 Available Modes:'));
    console.log(chalk.gray('  • Diff - Code changes with teaching explanations'));
    console.log(chalk.gray('  • Rules - Monitor CLAUDE.md compliance'));
    console.log(chalk.gray('  • Chat - Interactive Q&A'));
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
        // In non-chat modes, no input handling
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
            // Not in git or no changes
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
    const maxUpdates = 10;
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
      case 'diff':
        this.displayDiffMode();
        break;
      case 'rules':
        this.displayRulesMode();
        break;
      case 'chat':
        this.displayChatMode();
        break;
    }
  }

  displayDiffMode() {
    console.log(chalk.bold.yellow('🔍 Claude Code Teacher - Diff Mode'));
    console.log(chalk.gray('Showing code changes with teaching explanations'));
    console.log(chalk.gray('─'.repeat(60)));
    
    if (this.updates.length === 0) {
      console.log(chalk.gray('\n   Waiting for changes...\n'));
      return;
    }
    
    // Show updates with diffs and explanations (most recent first)
    this.updates.slice(-5).reverse().forEach(update => {
      console.log('\n' + chalk.bold('═'.repeat(50)));
      console.log(chalk.bold(`📌 UPDATE #${update.number} | ${update.timestamp}`));
      console.log(chalk.bold('═'.repeat(50)));
      
      const icon = update.type === 'added' ? '✅' : update.type === 'modified' ? '📝' : '🗑️';
      console.log(`${icon} ${update.filename}`);
      
      if (update.context.diff) {
        console.log('\n' + chalk.bold('Changes:'));
        console.log(this.formatDiff(update.context.diff));
        
        // Add teaching explanation
        const explanation = this.generateDiffExplanation(update.context);
        if (explanation) {
          console.log('\n' + chalk.bold.cyan('🎓 What this change does:'));
          console.log(chalk.gray(explanation));
        }
      }
    });
  }

  async displayRulesMode() {
    console.log(chalk.bold.green('📋 Claude Code Teacher - Rules Mode'));
    console.log(chalk.gray('Monitoring code compliance with CLAUDE.md & best practices'));
    console.log(chalk.gray('─'.repeat(60)));
    
    if (this.updates.length === 0) {
      console.log(chalk.gray('\n   Waiting for changes...\n'));
      return;
    }
    
    // Show updates with rules checking (most recent first)
    for (const update of this.updates.slice(-5).reverse()) {
      console.log('\n' + chalk.gray('─'.repeat(50)));
      console.log(`${this.getUpdateIcon(update.type)} ${update.filename} ${chalk.gray(update.timestamp)}`);
      
      if (update.context.content && update.type !== 'deleted') {
        // Check against rules
        const checkResult = await this.rulesChecker.checkFile(update.filePath, update.context.content);
        const report = this.rulesChecker.formatReport(checkResult);
        console.log(report);
        
        // Add AI advisor suggestions
        const suggestions = this.seniorDev.analyzeCode(update.context.content, update.filename);
        if (suggestions.length > 0) {
          console.log(this.seniorDev.formatSuggestions(suggestions));
        }
      }
    }
  }

  displayChatMode() {
    console.log(chalk.bold.cyan('🎓 Claude Code Teacher - Chat Mode'));
    console.log(chalk.gray('Ask questions while coding • /help for commands'));
    console.log(chalk.gray('─'.repeat(60)));
    
    // Show compact file updates
    console.log(chalk.bold.yellow('\n📁 Recent Changes:'));
    if (this.updates.length === 0) {
      console.log(chalk.gray('  No changes yet...'));
    } else {
      this.updates.slice(-3).reverse().forEach(update => {
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
    let showCount = 0;
    
    lines.forEach(line => {
      if (showCount > 20) return;
      
      if (line.startsWith('+') && !line.startsWith('+++')) {
        formatted.push(chalk.green(line));
        showCount++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        formatted.push(chalk.red(line));
        showCount++;
      } else if (line.startsWith('@@')) {
        formatted.push(chalk.blue(line));
      }
    });
    
    if (showCount > 20) {
      formatted.push(chalk.gray('... (diff truncated)'));
    }
    
    return formatted.join('\n');
  }

  generateDiffExplanation(context) {
    if (!context.diff) return null;
    
    const { filename, ext, diff } = context;
    const addedLines = (diff.match(/^\+[^+]/gm) || []).length;
    const removedLines = (diff.match(/^-[^-]/gm) || []).length;
    
    // Analyze what changed
    const explanations = [];
    
    if (diff.includes('import') || diff.includes('require')) {
      explanations.push('Added or modified imports/dependencies');
    }
    
    if (diff.includes('function') || diff.includes('=>')) {
      explanations.push('Function implementation changed');
    }
    
    if (diff.includes('class')) {
      explanations.push('Class definition modified');
    }
    
    if (diff.includes('if') || diff.includes('else')) {
      explanations.push('Control flow logic updated');
    }
    
    if (diff.includes('try') || diff.includes('catch')) {
      explanations.push('Error handling added or modified');
    }
    
    // General summary
    let summary = `This change modifies ${filename} with ${addedLines} additions and ${removedLines} deletions. `;
    
    if (explanations.length > 0) {
      summary += `Key changes: ${explanations.join(', ')}.`;
    }
    
    // Add teaching moment
    if (diff.includes('async') || diff.includes('await')) {
      summary += '\n\n💡 Teaching: This uses async/await for handling asynchronous operations, making the code more readable than callbacks or promise chains.';
    } else if (diff.includes('const') || diff.includes('let')) {
      summary += '\n\n💡 Teaching: Using const/let provides block scoping and prevents accidental reassignments, making code more predictable.';
    }
    
    return summary;
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
      if (lowerMessage.includes('what changed') || lowerMessage.includes('last change')) {
        return this.explainLastChange();
      }
    }
    
    // Concept explanations
    if (lowerMessage.includes('what is')) {
      return this.explainConcept(message);
    }
    
    // Code quality questions
    if (lowerMessage.includes('security') || lowerMessage.includes('safe')) {
      return await this.checkSecurity();
    }
    
    // Default helpful response
    return `I can help you with:\n• Recent code changes ("what changed?")\n• Programming concepts ("what is async/await?")\n• Code quality ("any security issues?")\n• Best practices ("how can I improve this?")`;
  }

  explainLastChange() {
    if (!this.currentContext) {
      return "No changes detected yet. Modify a file and I'll explain what changed!";
    }
    
    const { type, filename, diff } = this.currentContext;
    
    if (type === 'modified' && diff) {
      const explanation = this.generateDiffExplanation(this.currentContext);
      return `File ${filename} was modified.\n\n${explanation}`;
    }
    
    return `File ${filename} was ${type}. Make another change and I'll explain it!`;
  }

  explainConcept(question) {
    const concepts = {
      'async': 'Async/await makes asynchronous code look synchronous. It\'s syntactic sugar over promises that makes code easier to read and debug.',
      'closure': 'A closure gives you access to an outer function\'s scope from an inner function. It\'s like a backpack of variables that a function carries around.',
      'promise': 'A Promise represents a value that may be available now, in the future, or never. It\'s like ordering food - you get a receipt (promise) immediately, but the food (value) comes later.',
      'arrow function': 'Arrow functions (=>) provide a concise syntax and lexically bind the \'this\' value. They\'re great for callbacks and functional programming.'
    };
    
    for (const [concept, explanation] of Object.entries(concepts)) {
      if (question.toLowerCase().includes(concept)) {
        return explanation;
      }
    }
    
    return 'That\'s a great question! I can explain concepts like async/await, promises, closures, arrow functions, and more. What would you like to learn about?';
  }

  async checkSecurity() {
    if (!this.currentContext || !this.currentContext.content) {
      return "No recent file changes to analyze. Modify a file and I'll check it for security issues!";
    }
    
    const checkResult = await this.rulesChecker.checkFile(
      this.currentContext.filePath,
      this.currentContext.content
    );
    
    if (checkResult.violations.length > 0) {
      const critical = checkResult.violations.filter(v => v.severity === 'critical');
      if (critical.length > 0) {
        return `⚠️ Found ${critical.length} security issues in ${this.currentContext.filename}:\n${critical.map(v => `• ${v.message}`).join('\n')}`;
      }
    }
    
    return `✅ No major security issues found in ${this.currentContext.filename}. Keep up the good work!`;
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

  showChatHelp() {
    const help = `
${chalk.bold.yellow('💬 Chat Commands:')}
/help - Show this help
/clear - Clear chat history
/quit - Exit

${chalk.bold.yellow('🎯 You can ask about:')}
• Recent changes: "What changed?"
• Concepts: "What is async/await?"
• Security: "Any security issues?"
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