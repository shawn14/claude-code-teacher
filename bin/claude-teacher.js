#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { startWatcher } from '../src/monitor.js';
import { startMCPServer } from '../src/mcp-server.js';
import { configureClaudeCode } from '../src/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

program
  .name('claude-teacher')
  .description('Real-time teaching agent for Claude Code')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize Claude Code Teacher in current directory')
  .action(async () => {
    const spinner = ora('Initializing Claude Code Teacher...').start();
    
    try {
      // Configure Claude Code settings
      await configureClaudeCode();
      spinner.succeed('Claude Code configuration updated');
      
      // Start MCP server
      spinner.text = 'Starting MCP server...';
      const server = await startMCPServer();
      spinner.succeed(`MCP server running on port ${server.port}`);
      
      console.log(chalk.green('\n✓ Claude Code Teacher initialized!'));
      console.log(chalk.gray('The teaching agent is now ready to explain code changes.'));
      console.log(chalk.blue('\nTo stop the server, press Ctrl+C'));
      
    } catch (error) {
      spinner.fail('Initialization failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('watch [path]')
  .description('Watch a directory for Claude Code activity')
  .option('-m, --mode <mode>', 'explanation mode', 'realtime')
  .action(async (watchPath = '.', options) => {
    const absolutePath = path.resolve(watchPath);
    console.log(chalk.blue(`Watching for changes in: ${absolutePath}`));
    
    const spinner = ora('Starting file watcher...').start();
    
    try {
      await startWatcher(absolutePath, {
        mode: options.mode,
        onExplanation: (explanation) => {
          console.log(chalk.yellow('\n📚 Teaching Moment:'));
          console.log(explanation);
        }
      });
      
      spinner.succeed('File watcher started');
      console.log(chalk.gray('Press Ctrl+C to stop watching'));
      
    } catch (error) {
      spinner.fail('Failed to start watcher');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('serve')
  .description('Start MCP server for Claude Code integration')
  .option('-p, --port <port>', 'server port', '3456')
  .action(async (options) => {
    const spinner = ora('Starting MCP server...').start();
    
    try {
      const server = await startMCPServer({ port: parseInt(options.port) });
      spinner.succeed(`MCP server running on port ${server.port}`);
      
      console.log(chalk.gray('\nAdd this to your Claude Code settings:'));
      console.log(chalk.cyan(JSON.stringify({
        "mcp-servers": {
          "teacher": {
            "command": "npx",
            "args": ["claude-code-teacher", "serve"],
            "name": "Claude Code Teacher"
          }
        }
      }, null, 2)));
      
    } catch (error) {
      spinner.fail('Failed to start MCP server');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Interactive mode when no command specified
if (process.argv.length === 2) {
  (async () => {
    console.log(chalk.bold.blue('Claude Code Teacher'));
    console.log(chalk.gray('Real-time code explanations for learners\n'));
    
    const { mode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'How would you like to use the teacher?',
        choices: [
          { name: '✨ Unified Monitor (NEW! Switch modes with Shift+Tab)', value: 'unified' },
          { name: '💬 Interactive Chat (Chat with AI while coding)', value: 'chat' },
          { name: '🆕 Diff Monitor (Shows exact code changes)', value: 'diff' },
          { name: 'Clean Monitor (Shows recent updates only)', value: 'clean' },
          { name: 'Coding Mentor (friendly explanations)', value: 'realtime' },
          { name: 'Enhanced Monitor (watches everything!)', value: 'enhanced' },
          { name: 'Learning mode (with quizzes)', value: 'learning' },
          { name: 'Architecture overview', value: 'architecture' },
          { name: 'Debug helper', value: 'debug' },
          { name: 'Configure Claude Code', value: 'configure' }
        ]
      }
    ]);
    
    switch (mode) {
      case 'configure':
        program.parse(['', '', 'init']);
        break;
      case 'unified':
        // Use the unified monitoring system with mode switching
        const { UnifiedMonitor } = await import('../src/unified-monitor.js');
        const unifiedMonitor = new UnifiedMonitor(process.cwd());
        await unifiedMonitor.start();
        break;
      case 'chat':
        // Use the interactive chat monitoring system
        const { InteractiveChatMonitor } = await import('../src/interactive-chat-monitor.js');
        const chatMonitor = new InteractiveChatMonitor(process.cwd());
        await chatMonitor.start();
        break;
      case 'diff':
        // Use the diff monitoring system
        const { DiffMonitor } = await import('../src/diff-monitor.js');
        const diffMonitor = new DiffMonitor(process.cwd());
        await diffMonitor.start();
        break;
      case 'clean':
        // Use the clean monitoring system
        const { startCleanMonitor } = await import('../src/clean-monitor.js');
        await startCleanMonitor(process.cwd());
        break;
      case 'realtime':
        program.parse(['', '', 'watch', '.', '--mode', 'realtime']);
        break;
      case 'enhanced':
        // Use the enhanced monitoring system
        const { startEnhancedMonitoring } = await import('../src/enhanced-monitor.js');
        await startEnhancedMonitoring(process.cwd());
        break;
      case 'learning':
        program.parse(['', '', 'watch', '.', '--mode', 'learning']);
        break;
      case 'architecture':
        program.parse(['', '', 'watch', '.', '--mode', 'architecture']);
        break;
      case 'debug':
        program.parse(['', '', 'watch', '.', '--mode', 'debug']);
        break;
    }
  })();
} else {
  program.parse();
}