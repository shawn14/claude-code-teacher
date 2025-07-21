import { watch } from 'chokidar';
import chalk from 'chalk';
import { readFile } from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';
import { RulesChecker } from './rules-checker.js';
import { SeniorDevAdvisor } from './senior-dev-advisor.js';
import { insightEngine } from './insight-engine-unified.js';
import { TypeWriter } from './type-writer.js';
import { themeManager } from './theme-manager.js';
import { tokenAnalyzer } from './token-analyzer.js';

export class UnifiedMonitor {
  constructor(projectPath, options = {}) {
    this.projectPath = projectPath;
    this.modes = ['diff', 'rules', 'theme'];
    this.currentModeIndex = 0;
    this.currentMode = this.modes[this.currentModeIndex];
    this.selectedThemeIndex = 0;
    
    // Shared state
    this.updates = [];
    this.updateCount = 0;
    this.currentContext = null;
    this.isProcessingInput = false;
    this.watcher = null;
    this.lastDisplayedUpdate = null;
    this.updateHistoryPage = 0;
    this.viewingHistory = false;
    
    // Initialize components
    this.rulesChecker = new RulesChecker(projectPath);
    this.seniorDev = new SeniorDevAdvisor();
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
      } else if (this.currentMode === 'diff' && key && key.name === 't') {
        // Press 't' to cycle through insight modes
        const modes = ['basic', 'detailed', 'optimized'];
        const currentMode = insightEngine.getMode();
        const currentIndex = modes.indexOf(currentMode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        insightEngine.setMode(nextMode);
        const colors = themeManager.getColors();
        console.log(colors.info(`\n🔄 Switched to ${nextMode} insights mode\n`));
        await this.updateDisplay();
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
      'theme': '🎨 Theme Mode - Customize your visual experience'
    };
    
    const colors = themeManager.getColors();
    console.log('\n' + colors.success(`✨ Switched to: ${modeInfo[this.currentMode]}`));
    console.log(colors.muted('Press Shift+Tab to switch modes • Ctrl+C to exit\n'));
  }

  getPrompt() {
    const prompts = {
      'diff': '',
      'rules': ''
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
    // No input handling needed for monitoring modes
    this.rl.on('line', async (input) => {
      // Just consume the input without processing
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
    console.log(colors.muted(`  Press 't' to cycle insights (${insightEngine.getMode()})`));
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
      console.log(`${icon} ${colors.highlight(latestUpdate.filename)}`);
      
      if (latestUpdate.context.diff) {
        console.log('\n' + colors.secondary('📝 Code Changes:'));
        console.log(colors.muted('─'.repeat(50)));
        console.log(this.formatDiff(latestUpdate.context.diff));
        console.log(colors.muted('─'.repeat(50)));
        
        // Type out insights for the latest update
        const insights = insightEngine.analyzeChange(latestUpdate.context);
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
    let inHunk = false;
    let contextLines = [];
    
    lines.forEach((line, index) => {
      if (showCount > 30) return;
      
      if (line.startsWith('@@')) {
        // Hunk header - shows line numbers
        formatted.push(chalk.cyan(line));
        inHunk = true;
        contextLines = [];
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        // Added line
        formatted.push(chalk.green(line));
        showCount++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        // Removed line
        formatted.push(chalk.red(line));
        showCount++;
      } else if (line.startsWith('diff --git')) {
        // File header
        formatted.push(chalk.yellow(line));
      } else if (inHunk && !line.startsWith('+') && !line.startsWith('-')) {
        // Context line in hunk
        if (contextLines.length < 2) {
          formatted.push(chalk.gray(line));
          contextLines.push(line);
        }
      }
    });
    
    if (showCount > 30) {
      formatted.push(chalk.gray('\n... (diff truncated for readability)'));
    }
    
    return formatted.join('\n');
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
    console.log(colors.muted(`  Press 't' to cycle insights (${insightEngine.getMode()})`));
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
      console.log('\n' + colors.secondary('📝 Code Changes:'));
      console.log(colors.muted('─'.repeat(50)));
      console.log(this.formatDiff(update.context.diff));
      console.log(colors.muted('─'.repeat(50)));
      
      // Get insights with mentoring
      const insights = insightEngine.analyzeChange(update.context);
      
      if (insights) {
        if (withAnimation) {
          await this.typeWriter.typeOut(insights, 'fast');
        } else {
          console.log(insights);
        }
      }
      
      // Show token usage stats
      const stats = tokenAnalyzer.analyzeOutput(insights);
      const tokenStats = tokenAnalyzer.formatStats(stats, 'Insight');
      console.log(tokenStats);
      
      // If in optimized mode, show savings compared to detailed
      if (insightEngine.getMode() === 'optimized') {
        const currentMode = insightEngine.getMode();
        insightEngine.setMode('detailed');
        const detailedAnalysis = insightEngine.analyzeChange(update.context);
        insightEngine.setMode(currentMode);
        
        const comparison = tokenAnalyzer.compareOutputs(detailedAnalysis, insights);
        if (comparison.savings.percentage > 0) {
          console.log(colors.success(`   💰 Token savings: ${comparison.savings.tokens} tokens (${comparison.savings.percentage}% reduction)\n`));
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