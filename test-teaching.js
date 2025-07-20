#!/usr/bin/env node

import { teach, initializeTeaching } from './src/teaching-hooks.js';
import chalk from 'chalk';

async function demonstrateTeaching() {
  console.log(chalk.bold('Testing Teaching Integration...\n'));
  
  // Initialize connection
  const hooks = await initializeTeaching();
  
  if (hooks && hooks.enabled) {
    console.log(chalk.green('✓ Connected to teaching system!\n'));
    
    // Simulate Claude Code actions
    await teach("Hello! I'm going to create a simple web server");
    
    setTimeout(async () => {
      await teach("Creating file: server.js");
    }, 2000);
    
    setTimeout(async () => {
      await teach("I'm using Express.js because it's simple and widely used");
    }, 4000);
    
    setTimeout(async () => {
      await teach("Adding error handling to make our server more robust");
    }, 6000);
    
  } else {
    console.log(chalk.yellow('Teaching system is not running.'));
    console.log(chalk.gray('Start it with: node start-real-dialogue.js'));
  }
}

demonstrateTeaching();