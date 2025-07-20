#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import path from 'path';
import { fileURLToPath } from 'url';
import { startMCPServer } from '../src/mcp-server.js';
import { configureClaudeCode } from '../src/config.js';
import { UnifiedMonitor } from '../src/unified-monitor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

program
  .name('claude-teacher')
  .description('Real-time code monitoring with teaching & analysis')
  .version('7.0.0');

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
      console.log(chalk.gray('The teaching agent is now ready to monitor code changes.'));
      console.log(chalk.blue('\nTo stop the server, press Ctrl+C'));
      
    } catch (error) {
      spinner.fail('Initialization failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('watch [path]')
  .description('Start unified monitor with mode switching')
  .action(async (watchPath = '.') => {
    const absolutePath = path.resolve(watchPath);
    console.log(chalk.blue(`Starting monitor in: ${absolutePath}`));
    
    const monitor = new UnifiedMonitor(absolutePath);
    await monitor.start();
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
    console.log(chalk.bold.cyan('🎓 Claude Code Teacher'));
    console.log(chalk.gray('Real-time code monitoring with teaching & analysis\n'));
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '🚀 Start Monitoring (with mode switching)', value: 'monitor' },
          { name: '⚙️  Configure Claude Code', value: 'configure' },
          { name: '🌐 Start MCP Server', value: 'serve' },
          { name: '❌ Exit', value: 'exit' }
        ]
      }
    ]);
    
    switch (action) {
      case 'monitor':
        program.parse(['', '', 'watch']);
        break;
      case 'configure':
        program.parse(['', '', 'init']);
        break;
      case 'serve':
        program.parse(['', '', 'serve']);
        break;
      case 'exit':
        console.log(chalk.yellow('👋 Goodbye!'));
        process.exit(0);
        break;
    }
  })();
} else {
  program.parse();
}