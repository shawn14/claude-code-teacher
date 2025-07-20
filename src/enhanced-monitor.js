import chokidar from 'chokidar';
import { createReadStream } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { TeachingEngine } from './explainer.js';
import { GuidelinesMonitor } from './guidelines-monitor.js';

const execAsync = promisify(exec);

export class EnhancedProjectMonitor {
  constructor(projectPath, options = {}) {
    this.projectPath = projectPath;
    this.options = options;
    this.teachingEngine = new TeachingEngine(options.mode || 'realtime', projectPath);
    this.guidelinesMonitor = new GuidelinesMonitor(projectPath);
    this.recentActions = [];
    this.gitWatcher = null;
    this.testWatcher = null;
    this.displayedLines = 0;
    this.maxDisplayLines = options.maxLines || 50; // Show last 50 lines by default
    this.updateBuffer = [];
  }

  async start() {
    console.log(chalk.bold.blue('\n🔍 Enhanced Project Monitor Starting...\n'));
    
    // Initialize guidelines
    await this.guidelinesMonitor.initialize();
    
    // Start file monitoring
    this.startFileMonitoring();
    
    // Start git monitoring
    this.startGitMonitoring();
    
    // Start test monitoring
    this.startTestMonitoring();
    
    // Start build monitoring
    this.startBuildMonitoring();
    
    console.log(chalk.green('✓ All monitors active. I\'m watching everything!\n'));
    console.log(chalk.gray('(Showing last ' + this.maxDisplayLines + ' lines of activity)\n'));
    console.log(chalk.gray('─'.repeat(60) + '\n'));
  }

  displayUpdate(message) {
    // Clear screen and show only recent updates
    if (this.displayedLines >= this.maxDisplayLines) {
      console.clear();
      console.log(chalk.bold.blue('🔍 Enhanced Project Monitor - Live View\n'));
      console.log(chalk.gray('─'.repeat(60) + '\n'));
      this.displayedLines = 0;
    }
    
    // Count lines in the message
    const lines = message.split('\n').length;
    this.displayedLines += lines;
    
    // Display with timestamp
    const timestamp = new Date().toLocaleTimeString();
    console.log(chalk.gray(`[${timestamp}]`));
    console.log(message);
  }

  startFileMonitoring() {
    const watcher = chokidar.watch(this.projectPath, {
      ignored: [
        /(^|[\/\\])\../,
        /node_modules/,
        /\.git/,
        /dist/,
        /build/
      ],
      persistent: true
    });

    watcher.on('add', (path) => {
      this.handleFileAdded(path);
    });

    watcher.on('change', (path) => {
      this.handleFileChanged(path);
    });

    watcher.on('unlink', (path) => {
      this.handleFileDeleted(path);
    });
  }

  async startGitMonitoring() {
    // Monitor .git directory for changes
    const gitWatcher = chokidar.watch(`${this.projectPath}/.git`, {
      ignored: /index\.lock$/,
      depth: 2
    });

    gitWatcher.on('change', async () => {
      // Check git status
      try {
        const { stdout } = await execAsync('git status --porcelain', { cwd: this.projectPath });
        if (stdout) {
          this.explainGitStatus(stdout);
        }
      } catch (error) {
        // Not a git repo or error
      }
    });

    // Check for recent commits periodically
    setInterval(async () => {
      try {
        const { stdout } = await execAsync('git log -1 --oneline', { cwd: this.projectPath });
        if (stdout && !this.lastCommit || this.lastCommit !== stdout) {
          this.lastCommit = stdout;
          this.explainNewCommit(stdout);
        }
      } catch (error) {
        // Not a git repo
      }
    }, 5000);
  }

  async startTestMonitoring() {
    // Watch for test file patterns
    const testWatcher = chokidar.watch([
      `${this.projectPath}/**/*.test.js`,
      `${this.projectPath}/**/*.spec.js`,
      `${this.projectPath}/**/*.test.ts`,
      `${this.projectPath}/**/*.spec.ts`
    ]);

    testWatcher.on('change', (path) => {
      this.explainTestChange(path);
    });

    // Monitor test execution (look for common test runners)
    const testOutputPatterns = [
      '**/coverage/**',
      '**/.nyc_output/**',
      '**/test-results/**'
    ];

    const testOutputWatcher = chokidar.watch(testOutputPatterns, {
      cwd: this.projectPath
    });

    testOutputWatcher.on('change', () => {
      this.explainTestExecution();
    });
  }

  async startBuildMonitoring() {
    // Monitor build output directories
    const buildWatcher = chokidar.watch([
      `${this.projectPath}/dist`,
      `${this.projectPath}/build`,
      `${this.projectPath}/.next`,
      `${this.projectPath}/out`
    ], {
      ignoreInitial: true
    });

    buildWatcher.on('all', (event, path) => {
      if (event === 'add' || event === 'change') {
        this.explainBuildActivity();
      }
    });
  }

  // Teaching explanations

  async handleFileAdded(path) {
    const explanation = await this.teachingEngine.explainNewFile(path);
    const output = chalk.green('📄 New File Created:') + '\n' + explanation;
    
    this.displayUpdate(output);
    
    // Check guidelines
    await this.checkGuidelines(path);
    console.log(chalk.gray('\n' + '─'.repeat(60) + '\n'));
  }

  async handleFileChanged(path) {
    console.log(chalk.yellow(`\n✏️  File Modified: ${path}`));
    
    // Add intelligent detection of what changed
    if (path.includes('package.json')) {
      console.log(chalk.cyan('📦 Package.json changed - dependencies might have been added/removed'));
      console.log(chalk.gray('💡 Tip: Run "npm install" if new dependencies were added'));
    } else if (path.includes('.env')) {
      console.log(chalk.red('🔐 Environment file changed - make sure not to commit secrets!'));
    } else if (path.includes('test') || path.includes('spec')) {
      console.log(chalk.green('🧪 Test file modified - good practice to update tests with code!'));
    }
    
    await this.checkGuidelines(path);
  }

  handleFileDeleted(path) {
    console.log(chalk.red(`\n🗑️  File Deleted: ${path}`));
    console.log(chalk.gray('💡 Make sure this deletion doesn\'t break any imports'));
  }

  explainGitStatus(status) {
    const lines = status.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      console.log(chalk.magenta('\n📊 Git Status Update:'));
      
      const staged = lines.filter(l => l.startsWith('A') || l.startsWith('M'));
      const unstaged = lines.filter(l => l.startsWith(' M') || l.startsWith('??'));
      
      if (staged.length > 0) {
        console.log(chalk.green(`  ✓ ${staged.length} files staged for commit`));
      }
      if (unstaged.length > 0) {
        console.log(chalk.yellow(`  ⚠ ${unstaged.length} files with unstaged changes`));
      }
    }
  }

  explainNewCommit(commit) {
    console.log(chalk.blue('\n🎉 New Commit Detected:'));
    console.log(chalk.gray(`  ${commit}`));
    console.log(chalk.cyan('  💡 Good job keeping your work versioned!'));
  }

  explainTestChange(path) {
    console.log(chalk.green(`\n🧪 Test File Updated: ${path}`));
    console.log(chalk.cyan('  💡 Great practice! Tests help catch bugs before they reach users'));
  }

  explainTestExecution() {
    console.log(chalk.green('\n✅ Tests are running...'));
    console.log(chalk.gray('  💡 Automated tests give confidence that your code works correctly'));
  }

  explainBuildActivity() {
    if (!this.recentBuildNotification) {
      console.log(chalk.blue('\n🔨 Build process detected'));
      console.log(chalk.gray('  💡 The build process is converting your code for production use'));
      
      this.recentBuildNotification = true;
      setTimeout(() => {
        this.recentBuildNotification = false;
      }, 30000); // Don't spam build notifications
    }
  }

  async checkGuidelines(path) {
    try {
      const { readFile } = await import('fs/promises');
      const content = await readFile(path, 'utf-8');
      const violations = this.guidelinesMonitor.checkViolations(content, path);
      
      if (violations.length > 0) {
        const report = this.guidelinesMonitor.formatViolationReport(violations);
        console.log(report);
      }
    } catch (error) {
      // Unable to read file
    }
  }
}

// Enhanced CLI command
export async function startEnhancedMonitoring(projectPath = process.cwd()) {
  const monitor = new EnhancedProjectMonitor(projectPath, {
    mode: 'realtime'
  });
  
  await monitor.start();
  
  console.log(chalk.bold.green('👀 Watching for all changes in your project...'));
  console.log(chalk.gray('Press Ctrl+C to stop\n'));
  
  // Keep running
  process.on('SIGINT', () => {
    console.log(chalk.red('\n\nStopping monitor...'));
    process.exit(0);
  });
}