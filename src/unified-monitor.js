import { watch } from 'chokidar';
import chalk from 'chalk';
import { readFile } from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';
import { RulesChecker } from './rules-checker.js';
import { SeniorDevAdvisor } from './senior-dev-advisor.js';
import { InsightEngine } from './insight-engine.js';
import { TypeWriter } from './type-writer.js';
import { themeManager } from './theme-manager.js';

export class UnifiedMonitor {
  constructor(projectPath, options = {}) {
    this.projectPath = projectPath;
    this.modes = ['diff', 'rules', 'chat', 'theme'];
    this.currentModeIndex = 0;
    this.currentMode = this.modes[this.currentModeIndex];
    this.selectedThemeIndex = 0;
    
    // Shared state
    this.updates = [];
    this.updateCount = 0;
    this.chatHistory = [];
    this.currentContext = null;
    this.isProcessingInput = false;
    this.watcher = null;
    this.lastDisplayedUpdate = null;
    this.updateHistoryPage = 0;
    this.viewingHistory = false;
    
    // Initialize components
    this.rulesChecker = new RulesChecker(projectPath);
    this.seniorDev = new SeniorDevAdvisor();
    this.insightEngine = new InsightEngine();
    this.typeWriter = new TypeWriter();
    
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
    process.stdin.on('keypress', async (str, key) => {
      if (key && key.name === 'tab' && key.shift) {
        await this.handleModeSwitch();
      } else if (key && key.ctrl && key.name === 'c') {
        this.handleExit();
      } else if (this.currentMode === 'theme') {
        await this.handleThemeKeypress(key);
      } else if (this.currentMode === 'diff' && this.viewingHistory) {
        await this.handleHistoryNavigation(key);
      } else if (this.currentMode === 'diff' && key && key.name === 'h' && !this.viewingHistory) {
        // Press 'h' to view history
        this.viewingHistory = true;
        this.updateHistoryPage = 0;
        await this.displayUpdateHistory();
      }
      // Remove the manual character writing - readline handles this
    });
  }

  async handleModeSwitch() {
    // Clear any pending input
    this.rl.clearLine();
    
    // Switch to next mode
    this.currentModeIndex = (this.currentModeIndex + 1) % this.modes.length;
    this.currentMode = this.modes[this.currentModeIndex];
    
    // Update display
    await this.updateDisplay();
    
    // Show mode switch notification
    this.showModeNotification();
    
    // Update prompt
    this.rl.setPrompt(this.getPrompt());
    this.rl.prompt();
  }

  async handleThemeKeypress(key) {
    if (!key) return;
    
    const themes = themeManager.getAllThemes();
    
    if (key.name === 'up') {
      this.selectedThemeIndex = Math.max(0, this.selectedThemeIndex - 1);
      await this.updateDisplay();
    } else if (key.name === 'down') {
      this.selectedThemeIndex = Math.min(themes.length - 1, this.selectedThemeIndex + 1);
      await this.updateDisplay();
    } else if (key.name === 'return') {
      // Apply selected theme
      const selectedTheme = themes[this.selectedThemeIndex];
      themeManager.setTheme(selectedTheme.key);
      
      // Special effect for Matrix theme
      if (selectedTheme.key === 'matrix') {
        await themeManager.showMatrixRain(1500);
      }
      
      await this.updateDisplay();
    }
  }
  
  async handleHistoryNavigation(key) {
    if (!key) return;
    
    const pageSize = 5;
    const totalPages = Math.ceil(this.updates.length / pageSize);
    
    if (key.name === 'escape' || key.name === 'q') {
      // Return to live mode
      this.viewingHistory = false;
      await this.updateDisplay();
    } else if ((key.name === 'left' || key.name === 'up') && this.updateHistoryPage < totalPages - 1) {
      // Older updates (page increases)
      this.updateHistoryPage++;
      await this.displayUpdateHistory();
    } else if ((key.name === 'right' || key.name === 'down') && this.updateHistoryPage > 0) {
      // Newer updates (page decreases)
      this.updateHistoryPage--;
      await this.displayUpdateHistory();
    }
  }
  
  showModeNotification() {
    const modeInfo = {
      'diff': '🔍 Diff Mode - See code changes with teaching explanations',
      'rules': '📋 Rules Mode - Monitor CLAUDE.md compliance & best practices',
      'chat': '💬 Chat Mode - Interactive Q&A while coding',
      'theme': '🎨 Theme Mode - Customize your visual experience'
    };
    
    const colors = themeManager.getColors();
    console.log('\n' + colors.success(`✨ Switched to: ${modeInfo[this.currentMode]}`));
    console.log(colors.muted('Press Shift+Tab to switch modes • Ctrl+C to exit\n'));
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
    // Load theme preference
    await themeManager.loadTheme();
    
    this.clearScreen();
    
    // Show initialization sequence
    console.log(themeManager.style('\n🚀 Initializing Vibe Code...\n', 'highlight'));
    
    // Check for CLAUDE.md
    await this.typeWriter.typeOut(chalk.yellow('→ Checking for CLAUDE.md file...'), 'normal');
    await this.typeWriter.showCursor(500);
    const hasClaudeMd = await this.rulesChecker.checkClaudeMdExists();
    if (hasClaudeMd) {
      await this.typeWriter.typeOut(chalk.green('\n  ✓ CLAUDE.md found - will monitor compliance'), 'fast');
    } else {
      await this.typeWriter.typeOut(chalk.gray('\n  ℹ Using default rules (no CLAUDE.md found)'), 'fast');
    }
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Initialize rules checker
    console.log('\n');
    await this.typeWriter.typeOut(chalk.yellow('→ Loading project rules...'), 'normal');
    await this.typeWriter.showCursor(400);
    await this.rulesChecker.initialize();
    await this.typeWriter.typeOut(chalk.green('\n  ✓ Rules engine ready'), 'fast');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Check git status
    console.log('\n');
    await this.typeWriter.typeOut(chalk.yellow('→ Checking git repository...'), 'normal');
    await this.typeWriter.showCursor(400);
    try {
      execSync('git status', { cwd: this.projectPath, stdio: 'ignore' });
      await this.typeWriter.typeOut(chalk.green('\n  ✓ Git repository detected'), 'fast');
    } catch {
      await this.typeWriter.typeOut(chalk.gray('\n  ℹ Not a git repository (diffs limited)'), 'fast');
    }
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Initialize AI engines
    console.log('\n');
    await this.typeWriter.typeOut(chalk.yellow('→ Starting AI insight engine...'), 'normal');
    await this.typeWriter.showCursor(600);
    console.log('');
    await this.typeWriter.typeOut(chalk.green('  ✓ Pattern detection ready\n'), 'fast');
    await new Promise(resolve => setTimeout(resolve, 300));
    await this.typeWriter.typeOut(chalk.green('  ✓ Security scanner ready\n'), 'fast');
    await new Promise(resolve => setTimeout(resolve, 300));
    await this.typeWriter.typeOut(chalk.green('  ✓ Performance analyzer ready'), 'fast');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Project scan
    console.log('\n');
    await this.typeWriter.typeOut(chalk.yellow('→ Scanning project structure...'), 'normal');
    await this.typeWriter.showCursor(600);
    const fileCount = await this.countProjectFiles();
    await this.typeWriter.typeOut(chalk.green(`\n  ✓ Monitoring ${fileCount} files`), 'fast');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n');
    await this.typeWriter.typeOut(chalk.bold.green('✨ All systems ready! Let\'s vibe! ✨'), 'slow');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.clearScreen();
    await this.showWelcome();
    
    // Set up file watcher
    this.setupFileWatcher();
    
    // Set up input handling based on mode
    this.setupInputHandling();
    
    // Initial display
    await this.updateDisplay();
    
    // Show prompt for chat mode
    if (this.currentMode === 'chat') {
      this.rl.prompt();
    }
  }

  async showWelcome() {
    const colors = themeManager.getColors();
    
    // ASCII art logo
    const logo = colors.primary(`
    ╦  ╦╦╔╗ ╔═╗  ╔═╗╔═╗╔╦╗╔═╗
    ╚╗╔╝║╠╩╗║╣   ║  ║ ║ ║║║╣ 
     ╚╝ ╩╚═╝╚═╝  ╚═╝╚═╝═╩╝╚═╝
    `);
    console.log(logo);
    
    await this.typeWriter.typeOut(colors.muted('Real-time code monitoring with teaching & analysis'), 'fast');
    console.log('\n' + colors.muted('─'.repeat(60)));
    
    // Add a fun welcome animation with emoji wave
    const vibeMessages = [
      '✨ Welcome to the vibe zone! ✨',
      '🎵 Let the good vibes flow... 🎵',
      '🚀 Ready to level up your code! 🚀'
    ];
    const randomMessage = vibeMessages[Math.floor(Math.random() * vibeMessages.length)];
    await this.typeWriter.typeOut(colors.accent('\n' + randomMessage + '\n'), 'slow');
    
    console.log(colors.secondary('\n🔄 Available Modes:'));
    await this.typeWriter.typeOut(colors.muted('  • Diff - Code changes with teaching explanations\n'), 'fast');
    await this.typeWriter.typeOut(colors.muted('  • Rules - Monitor CLAUDE.md compliance\n'), 'fast');
    await this.typeWriter.typeOut(colors.muted('  • Chat - Interactive Q&A\n'), 'fast');
    await this.typeWriter.typeOut(colors.muted('  • Theme - Customize your visual experience\n'), 'fast');
    console.log(colors.muted('─'.repeat(60)));
    
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
      await this.updateDisplay();
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
    
    // Create update object with proper timestamp for sorting
    const update = {
      number: this.updateCount,
      timestamp: this.currentContext.timestamp,
      sortTimestamp: Date.now(), // Add numeric timestamp for accurate sorting
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
    if (!this.isProcessingInput && this.currentMode === 'diff') {
      // For diff mode, show the new update immediately at the top
      await this.showNewUpdate(update);
    } else if (!this.isProcessingInput) {
      await this.updateDisplay();
    }
  }

  async updateDisplay() {
    this.clearScreen();
    
    switch (this.currentMode) {
      case 'diff':
        await this.displayDiffMode();
        break;
      case 'rules':
        await this.displayRulesMode();
        break;
      case 'chat':
        await this.displayChatMode();
        break;
      case 'theme':
        await this.displayThemeMode();
        break;
    }
  }

  async displayDiffMode() {
    if (this.viewingHistory) {
      await this.displayUpdateHistory();
      return;
    }
    
    const colors = themeManager.getColors();
    // Fixed header
    console.log(colors.header('🔍 Vibe Code - Diff Mode'));
    console.log(colors.muted('Showing code changes with teaching explanations'));
    console.log(colors.muted('─'.repeat(60)));
    
    if (this.updates.length === 0) {
      console.log(colors.info('\n📝 Monitoring for changes...'));
      await this.typeWriter.typeOut(colors.muted('   Make a change to see insights...'), 'slow');
      console.log('\n');
      return;
    }
    
    // Show controls
    console.log(colors.secondary('\n🎮 Controls:'));
    console.log(colors.muted(`  Press 'h' for history (${this.updates.length} total updates)`));
    console.log(colors.muted('  Shift+Tab to switch modes\n'));
    
    // Get the most recent update for typing animation
    const latestUpdate = this.updates[this.updates.length - 1];
    const isNewUpdate = !this.lastDisplayedUpdate || this.lastDisplayedUpdate.sortTimestamp < latestUpdate.sortTimestamp;
    
    // Display the latest update with typing animation if it's new
    if (isNewUpdate) {
      console.log(chalk.green.bold('\n🆕 LATEST UPDATE'));
      console.log(chalk.bold('═'.repeat(50)));
      console.log(chalk.bold(`📌 UPDATE #${latestUpdate.number} | ${latestUpdate.timestamp}`));
      console.log(chalk.bold('═'.repeat(50)));
      
      const icon = latestUpdate.type === 'added' ? '✅' : latestUpdate.type === 'modified' ? '📝' : '🗑️';
      console.log(`${icon} ${latestUpdate.filename}`);
      
      if (latestUpdate.context.diff) {
        console.log('\n' + chalk.bold('Changes:'));
        console.log(this.formatDiff(latestUpdate.context.diff));
        
        // Type out insights for the latest update
        const analysisContext = {
          ...latestUpdate.context,
          patterns: this.insightEngine.detectPatterns(latestUpdate.context),
          category: this.insightEngine.detectChangeCategory(latestUpdate.context),
          complexity: this.insightEngine.calculateComplexity(latestUpdate.context)
        };
        const insights = this.insightEngine.analyzeChange(analysisContext);
        if (insights) {
          await this.typeWriter.typeOut(insights, 'normal');
        }
      }
      
      this.lastDisplayedUpdate = latestUpdate;
      console.log(chalk.gray('\n' + '─'.repeat(50) + '\n'));
    }
    
    // Show last 3 updates (excluding the latest if just displayed)
    const displayUpdates = isNewUpdate ? this.updates.slice(-4, -1) : this.updates.slice(-3);
    if (displayUpdates.length > 0) {
      console.log(colors.header('\n📌 Recent Updates:'));
      console.log(colors.muted('─'.repeat(50)));
      
      const recentUpdates = displayUpdates.slice(-3);
      recentUpdates.sort((a, b) => b.sortTimestamp - a.sortTimestamp);
      
      for (const update of recentUpdates) {
        console.log('');
        await this.displaySingleUpdate(update, false);
        console.log(colors.muted('\n' + '─'.repeat(50)));
      }
    }
  }

  async displayRulesMode() {
    console.log(chalk.bold.green('📋 Vibe Code - Rules Mode'));
    console.log(chalk.gray('Monitoring code compliance with CLAUDE.md & best practices'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.gray('\nMost recent changes appear at the top\n'));
    
    if (this.updates.length === 0) {
      await this.typeWriter.typeOut(chalk.gray('   Waiting for changes...'), 'slow');
      console.log('\n');
      return;
    }
    
    // Show updates with rules checking (most recent first)
    const recentUpdates = this.updates.slice(-5);
    recentUpdates.sort((a, b) => b.sortTimestamp - a.sortTimestamp);
    
    for (const update of recentUpdates) {
      console.log('\n' + chalk.gray('─'.repeat(50)));
      console.log(`${this.getUpdateIcon(update.type)} ${update.filename} ${chalk.gray(update.timestamp)}`);
      
      if (update.context.content && update.type !== 'deleted') {
        // Check against rules
        const checkResult = await this.rulesChecker.checkFile(update.filePath, update.context.content);
        const report = this.rulesChecker.formatReport(checkResult);
        await this.typeWriter.typeOut(report, 'fast');
        
        // Add AI advisor suggestions
        const suggestions = this.seniorDev.analyzeCode(update.context.content, update.filename);
        if (suggestions.length > 0) {
          const formattedSuggestions = this.seniorDev.formatSuggestions(suggestions);
          await this.typeWriter.typeOut(formattedSuggestions, 'normal');
        }
      }
    }
  }

  async displayChatMode() {
    console.log(chalk.bold.cyan('🎓 Vibe Code - Chat Mode'));
    console.log(chalk.gray('Ask questions while coding • /help for commands'));
    console.log(chalk.gray('─'.repeat(60)));
    
    // Show compact file updates
    console.log(chalk.bold.yellow('\n📁 Recent Changes:'));
    if (this.updates.length === 0) {
      console.log(chalk.gray('  No changes yet...'));
    } else {
      const recentUpdates = this.updates.slice(-3);
      recentUpdates.sort((a, b) => b.sortTimestamp - a.sortTimestamp);
      recentUpdates.forEach(update => {
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
    
    // Show typing indicator
    await this.updateDisplay();
    console.log(chalk.gray('\nThinking...'));
    await this.typeWriter.showCursor(500);
    
    // Generate AI response
    const response = await this.generateAIResponse(message);
    
    // Clear and update display before typing response
    await this.updateDisplay();
    
    // Type out the AI response
    console.log(chalk.green('\nTeacher: '));
    await this.typeWriter.typeOut(response, 'normal');
    console.log('\n');
    
    // Add to history after typing
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
      const analysisContext = {
        ...this.currentContext,
        patterns: this.insightEngine.detectPatterns(this.currentContext),
        category: this.insightEngine.detectChangeCategory(this.currentContext),
        complexity: this.insightEngine.calculateComplexity(this.currentContext)
      };
      const insights = this.insightEngine.analyzeChange(analysisContext);
      return `File ${filename} was modified.\n${insights}`;
    }
    
    return `File ${filename} was ${type}. Make another change and I'll explain it!`;
  }

  explainConcept(question) {
    const concepts = {
      'async': `🎯 **Async/Await** - The modern way to handle asynchronous operations!
      
Think of it like this: You're at a coffee shop. Without async/await, you'd have to stand at the counter until your coffee is ready (blocking). With async/await, you can sit down and work on your laptop (non-blocking) - the barista will call you when it's ready!

\`\`\`javascript
// Old way (callback hell)
getData(function(a) {
  getMoreData(a, function(b) {
    getMoreData(b, function(c) {
      console.log(c);
    });
  });
});

// Modern way (async/await)
const a = await getData();
const b = await getMoreData(a);
const c = await getMoreData(b);
console.log(c);
\`\`\`

Pro tip: Always wrap await in try-catch for error handling!`,
      
      'closure': `🎒 **Closures** - Functions with memory!
      
Imagine a function as a backpack. A closure is when that backpack contains not just the function's own stuff, but also remembers variables from where it was created.

\`\`\`javascript
function createCounter() {
  let count = 0;  // This variable is "enclosed"
  
  return function() {
    count++;      // Inner function remembers count!
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2 (It remembers!)
\`\`\`

Real-world use: React hooks, event handlers, and private variables!`,
      
      'promise': `⏳ **Promises** - Handling future values elegantly!
      
A Promise is like a food delivery app. When you order (create a promise), you get a tracking number immediately. The food (actual value) comes later, and the app tells you if it arrived successfully or if there was a problem.

\`\`\`javascript
const myPromise = new Promise((resolve, reject) => {
  // Async operation here
  if (success) {
    resolve(data);  // Order delivered! 
  } else {
    reject(error);  // Order failed!
  }
});

myPromise
  .then(data => console.log('Success:', data))
  .catch(error => console.log('Error:', error));
\`\`\`

States: Pending → Fulfilled ✅ OR Rejected ❌`,
      
      'arrow function': `➡️ **Arrow Functions** - Concise and powerful!
      
Arrow functions are the sleek sports cars of JavaScript functions. They're faster to write and automatically inherit 'this' from their surroundings.

\`\`\`javascript
// Traditional function
function add(a, b) {
  return a + b;
}

// Arrow function
const add = (a, b) => a + b;

// Great for array methods!
const doubled = numbers.map(n => n * 2);

// Lexical 'this' binding
class Timer {
  constructor() {
    this.seconds = 0;
    setInterval(() => {
      this.seconds++; // 'this' works correctly!
    }, 1000);
  }
}
\`\`\`

When NOT to use: As methods, constructors, or when you need 'arguments' object.`,

      'hook': `🪝 **React Hooks** - Stateful logic in functional components!
      
Hooks let you "hook into" React features without writing a class. They're like special tools that give your functional components superpowers!

\`\`\`javascript
import { useState, useEffect } from 'react';

function VibeCounter() {
  // useState hook for state management
  const [count, setCount] = useState(0);
  
  // useEffect hook for side effects
  useEffect(() => {
    document.title = \`Vibes: \${count}\`;
  }, [count]); // Only runs when count changes
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Increase vibes: {count}
    </button>
  );
}
\`\`\`

Common hooks: useState, useEffect, useContext, useMemo, useCallback`,

      'state': `🎮 **State Management** - Your app's memory!
      
State is like your app's brain - it remembers things! In React, state is data that can change over time and causes your UI to re-render when it does.

\`\`\`javascript
// Local state (component level)
const [user, setUser] = useState(null);

// Global state (app level) - Redux example
const state = {
  user: { name: 'Vibe Coder', level: 42 },
  theme: 'dark',
  notifications: []
};

// State update triggers re-render
setUser({ name: 'New Vibe Coder' }); // UI updates!
\`\`\`

Best practices:
- Keep state minimal
- Derive what you can
- Lift state up when needed
- Consider context or Redux for global state`
    };
    
    // Check for concept matches
    for (const [concept, explanation] of Object.entries(concepts)) {
      if (question.toLowerCase().includes(concept)) {
        return explanation;
      }
    }
    
    // Enhanced default response
    return `🤔 **That's a great question!**
    
I can explain many programming concepts with examples:
• **async/await** - Modern asynchronous programming
• **promises** - Handling future values
• **closures** - Functions with memory
• **arrow functions** - Concise function syntax
• **hooks** - React's functional superpowers
• **state** - Managing data that changes

Just ask "what is [concept]?" and I'll break it down with real examples!`;
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

  async displayThemeMode() {
    const colors = themeManager.getColors();
    console.log(colors.header('🎨 Vibe Code - Theme Selector'));
    console.log(colors.muted('Choose your vibe with arrow keys, press Enter to apply'));
    console.log(colors.muted('─'.repeat(60)));
    
    const themes = themeManager.getAllThemes();
    
    console.log(colors.secondary('\n📋 Available Themes:\n'));
    
    themes.forEach((theme, index) => {
      const isSelected = index === this.selectedThemeIndex;
      const isCurrent = theme.active;
      
      const prefix = isSelected ? colors.accent('→ ') : '  ';
      const suffix = isCurrent ? colors.success(' ✓ (current)') : '';
      const name = isSelected ? colors.highlight(theme.name) : colors.primary(theme.name);
      
      console.log(`${prefix}${name}${suffix}`);
      console.log(colors.muted(`  ${theme.description}`));
      console.log(colors.info(`  ${theme.preview}\n`));
    });
    
    console.log(colors.muted('─'.repeat(60)));
    console.log(colors.secondary('\n🎯 Controls:'));
    console.log(colors.muted('  ↑/↓ - Navigate themes'));
    console.log(colors.muted('  Enter - Apply theme'));
    console.log(colors.muted('  Shift+Tab - Switch modes'));
    
    // Show preview of selected theme
    const selectedTheme = themes[this.selectedThemeIndex];
    if (!selectedTheme.active) {
      console.log(colors.secondary('\n✨ Preview:'));
      console.log(colors.muted(`  This text would appear in ${selectedTheme.name}`));
    }
  }
  
  clearScreen() {
    // Clear screen and move cursor to top
    console.clear();
    process.stdout.write('\x1B[H');
  }
  
  async showNewUpdate(update) {
    const colors = themeManager.getColors();
    
    // Clear screen for clean display
    this.clearScreen();
    
    // Fixed header
    console.log(colors.header('🔍 Vibe Code - Diff Mode'));
    console.log(colors.muted('Showing code changes with teaching explanations'));
    console.log(colors.muted('─'.repeat(60)));
    
    // Show controls
    console.log(colors.secondary('\n🎮 Controls:'));
    console.log(colors.muted(`  Press 'h' for history (${this.updates.length} total updates)`));
    console.log(colors.muted('  Shift+Tab to switch modes\n'));
    
    // Show the new update with animation
    console.log(colors.accent('═'.repeat(60)));
    console.log(colors.success.bold('🆕 NEW UPDATE'));
    console.log(colors.accent('═'.repeat(60)));
    
    await this.displaySingleUpdate(update, true);
    console.log(colors.muted('\n' + '─'.repeat(60)));
    
    // Show previous updates (last 2 if we have them)
    const previousUpdates = this.updates.slice(-3, -1);
    if (previousUpdates.length > 0) {
      console.log(colors.header('\n📌 Previous Updates:'));
      console.log(colors.muted('─'.repeat(50)));
      
      previousUpdates.sort((a, b) => b.sortTimestamp - a.sortTimestamp);
      
      for (const prevUpdate of previousUpdates) {
        console.log('');
        await this.displaySingleUpdate(prevUpdate, false);
        console.log(colors.muted('\n' + '─'.repeat(50)));
      }
    }
    
    // Update the last displayed update
    this.lastDisplayedUpdate = update;
  }
  
  async displaySingleUpdate(update, withAnimation = false) {
    const colors = themeManager.getColors();
    
    console.log(colors.header(`📌 UPDATE #${update.number} | ${update.timestamp}`));
    console.log(colors.muted('═'.repeat(50)));
    
    const icon = update.type === 'added' ? '✅' : update.type === 'modified' ? '📝' : '🗑️';
    console.log(`${icon} ${colors.primary(update.filename)}`);
    
    if (update.context.diff) {
      console.log('\n' + colors.secondary('Changes:'));
      console.log(this.formatDiff(update.context.diff));
      
      // Get insights
      const analysisContext = {
        ...update.context,
        patterns: this.insightEngine.detectPatterns(update.context),
        category: this.insightEngine.detectChangeCategory(update.context),
        complexity: this.insightEngine.calculateComplexity(update.context)
      };
      const insights = this.insightEngine.analyzeChange(analysisContext);
      
      if (insights) {
        if (withAnimation) {
          await this.typeWriter.typeOut(insights, 'normal');
        } else {
          console.log(insights);
        }
      }
    }
  }
  
  async displayUpdateHistory() {
    const colors = themeManager.getColors();
    this.clearScreen();
    
    console.log(colors.header('📚 Update History'));
    console.log(colors.muted('Navigate with arrow keys • Press ESC or Q to return to live mode'));
    console.log(colors.muted('─'.repeat(60)));
    
    const pageSize = 5;
    const totalPages = Math.ceil(this.updates.length / pageSize);
    const currentPage = totalPages - this.updateHistoryPage - 1;
    
    // Calculate indices for reverse pagination (newest first)
    const startIdx = currentPage * pageSize;
    const endIdx = Math.min(startIdx + pageSize, this.updates.length);
    
    // Get updates for this page and sort newest first
    const pageUpdates = this.updates.slice(startIdx, endIdx);
    pageUpdates.sort((a, b) => b.sortTimestamp - a.sortTimestamp);
    
    console.log(colors.info(`\nPage ${this.updateHistoryPage + 1} of ${totalPages} (Updates ${this.updates.length - endIdx + 1}-${this.updates.length - startIdx})\n`));
    
    for (const update of pageUpdates) {
      await this.displaySingleUpdate(update, false);
      console.log(colors.muted('\n' + '─'.repeat(50) + '\n'));
    }
    
    // Navigation footer
    const hasOlder = this.updateHistoryPage < totalPages - 1;
    const hasNewer = this.updateHistoryPage > 0;
    
    console.log(colors.secondary('\n🎮 Navigation:'));
    if (hasNewer) console.log(colors.muted('  ← or ↓ - Newer updates'));
    if (hasOlder) console.log(colors.muted('  → or ↑ - Older updates'));
    console.log(colors.muted('  ESC or Q - Return to live mode'));
  }
  
  async countProjectFiles() {
    // Simple file count - in real implementation could be more sophisticated
    try {
      const { execSync } = await import('child_process');
      const count = execSync(
        `find ${this.projectPath} -type f -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" | grep -v node_modules | wc -l`,
        { encoding: 'utf8', stdio: 'pipe' }
      ).trim();
      return parseInt(count) || 0;
    } catch {
      // Fallback for Windows or if find command fails
      return 'multiple';
    }
  }

  handleExit() {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    console.log(chalk.yellow('\n\n👋 Thanks for using Vibe Code!'));
    process.exit(0);
  }
}

export async function startUnifiedMonitor(projectPath) {
  const monitor = new UnifiedMonitor(projectPath);
  await monitor.start();
  return monitor;
}