#!/usr/bin/env node

import { startRealIntegration } from './src/real-integration.js';
import { TeacherAgent } from './src/teacher-agent.js';
import WebSocket from 'ws';
import chalk from 'chalk';
import readline from 'readline';

async function startRealDialogue() {
  console.clear();
  console.log(chalk.bold.cyan(`
╔════════════════════════════════════════════════════╗
║          Claude Code Real-Time Teaching            ║
║                                                    ║
║  This is REAL - I (Claude Code) will communicate   ║
║  with the teacher agent as I write code!           ║
╚════════════════════════════════════════════════════╝
  `));

  // Start the real integration bridge
  console.log(chalk.yellow('\nStarting real-time communication bridge...\n'));
  const claudeApi = await startRealIntegration();
  
  // Give it a moment to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Start teacher agent
  console.log(chalk.yellow('Starting teacher agent...\n'));
  const teacher = new TeacherAgent('ws://localhost:4567');
  await teacher.connect();
  
  // Create student interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green('You (Student)> ')
  });
  
  // Connect as student
  const studentWs = new WebSocket('ws://localhost:4567');
  
  studentWs.on('open', () => {
    studentWs.send(JSON.stringify({
      type: 'register',
      role: 'student'
    }));
  });
  
  studentWs.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'message' && msg.role !== 'student') {
      const icon = msg.role === 'teacher' ? '👩‍🏫' : '🤖';
      const color = msg.role === 'teacher' ? chalk.yellow : chalk.cyan;
      console.log(`\n${icon} ${color(msg.role)}: ${msg.content}`);
      rl.prompt();
    }
  });
  
  // Handle student input
  rl.on('line', (input) => {
    if (input.trim()) {
      studentWs.send(JSON.stringify({
        type: 'message',
        role: 'student',
        content: input
      }));
    }
    rl.prompt();
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(chalk.bold.green('\n✅ System Ready! Claude Code and Teacher are connected.\n'));
  console.log(chalk.gray('I (Claude Code) will announce my actions in real-time as I work.'));
  console.log(chalk.gray('You can ask questions at any time by typing below.\n'));
  
  // Store the API globally so Claude Code can use it
  global.teachingBridge = claudeApi;
  
  // Announce ready
  claudeApi.announce("Hello! I'm Claude Code, ready to build and explain as we go!");
  
  rl.prompt();
  
  // Example of how Claude Code will use this:
  console.log(chalk.dim(`
Example: When I create a file, I'll do:
  global.teachingBridge.announce("Creating a new React component");
  global.teachingBridge.sendIntent("create", {file: "Button.jsx"});
  `));
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log(chalk.red('\n\nShutting down...'));
  process.exit(0);
});

// Start it
startRealDialogue().catch(console.error);