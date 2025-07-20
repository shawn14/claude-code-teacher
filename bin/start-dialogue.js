#!/usr/bin/env node

import { CommunicationBridge } from '../src/communication-bridge.js';
import { TeacherAgent } from '../src/teacher-agent.js';
import { ClaudeCodeConnector, createClaudeCodeHooks } from '../src/claude-code-connector.js';
import chalk from 'chalk';
import readline from 'readline';

// Create readline interface for student input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: chalk.green('Student> ')
});

async function startDialogueSystem() {
  console.log(chalk.bold.blue('🎓 Claude Code Teaching Dialogue System'));
  console.log(chalk.gray('Starting communication bridge...\n'));

  // Start communication bridge
  const bridge = new CommunicationBridge();
  await bridge.start();

  // Start teacher agent
  console.log(chalk.yellow('Starting teacher agent...'));
  const teacher = new TeacherAgent();
  await teacher.connect();

  // Start Claude Code connector (simulated)
  console.log(chalk.cyan('Starting Claude Code agent...'));
  const claudeCode = new ClaudeCodeConnector();
  await claudeCode.connect();

  // Create hooks for Claude Code
  const hooks = createClaudeCodeHooks(claudeCode);

  // Student WebSocket connection
  const studentWs = new WebSocket('ws://localhost:4567');
  let studentConnected = false;

  studentWs.on('open', () => {
    studentConnected = true;
    studentWs.send(JSON.stringify({
      type: 'register',
      agentId: 'student-' + Date.now(),
      role: 'student',
      capabilities: ['ask-questions', 'request-explanations']
    }));
  });

  studentWs.on('message', (data) => {
    const message = JSON.parse(data);
    
    // Display messages in the console
    if (message.type === 'message') {
      const roleColor = {
        'teacher': chalk.yellow,
        'claude-code': chalk.cyan,
        'student': chalk.green
      };
      
      const color = roleColor[message.fromRole] || chalk.white;
      console.log(color(`\n${message.fromRole}: ${message.content}`));
      rl.prompt();
    } else if (message.type === 'answer' && message.fromRole !== 'student') {
      console.log(chalk.yellow(`\n${message.fromRole} answered: ${message.answer}`));
      rl.prompt();
    }
  });

  // Simulate Claude Code actions
  console.log(chalk.bold('\n📺 Live Coding Session Started!\n'));

  setTimeout(async () => {
    // Claude Code starts creating a user authentication system
    await hooks.beforeFileCreate('auth.js');
    
    setTimeout(async () => {
      const authCode = `
// User authentication module
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function createUser(email, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  // Save user to database
  return { email, password: hashedPassword };
}

export async function loginUser(email, password) {
  // Fetch user from database
  const user = await findUserByEmail(email);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const validPassword = await bcrypt.compare(password, user.password);
  
  if (!validPassword) {
    throw new Error('Invalid password');
  }
  
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  return { token, user };
}
`;
      await hooks.afterFileCreate('auth.js', authCode);
      
      // Simulate finding an issue
      setTimeout(() => {
        claudeCode.sendMessage("I notice we're not validating the email format. Should I add email validation?");
      }, 2000);
      
    }, 2000);
  }, 3000);

  // Handle student input
  rl.on('line', (input) => {
    if (studentConnected) {
      studentWs.send(JSON.stringify({
        type: 'question',
        question: input,
        context: 'Live coding session'
      }));
    }
    rl.prompt();
  });

  console.log(chalk.green('\n💬 You can now ask questions as a student! Type your questions below:\n'));
  rl.prompt();
}

// Handle exit
process.on('SIGINT', () => {
  console.log(chalk.red('\n\nShutting down dialogue system...'));
  process.exit(0);
});

// Start the system
import WebSocket from 'ws';
startDialogueSystem().catch(console.error);