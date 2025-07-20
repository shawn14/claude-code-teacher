import { CommunicationBridge } from './src/communication-bridge.js';
import { TeacherAgent } from './src/teacher-agent.js';
import { ClaudeCodeConnector, createClaudeCodeHooks } from './src/claude-code-connector.js';
import chalk from 'chalk';

async function demonstrateDialogue() {
  console.log(chalk.bold.blue('\n🎭 Agent Dialogue Demonstration\n'));

  // Start communication bridge
  const bridge = new CommunicationBridge();
  await bridge.start();

  // Start teacher
  const teacher = new TeacherAgent();
  await teacher.connect();

  // Start Claude Code
  const claudeCode = new ClaudeCodeConnector();
  await claudeCode.connect();
  const hooks = createClaudeCodeHooks(claudeCode);

  // Wait for connection
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(chalk.bold('\n--- Dialogue Begins ---\n'));

  // Scenario 1: Claude Code creates a file
  console.log(chalk.gray('\n[Claude Code starts creating a new feature...]\n'));
  await hooks.beforeFileCreate('user-profile.js');
  
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Claude Code asks a question
  claudeCode.askQuestion('Should I use a class or functional approach for the user profile component?');

  await new Promise(resolve => setTimeout(resolve, 3000));

  // Scenario 2: Error occurs
  console.log(chalk.gray('\n[Claude Code encounters an error...]\n'));
  await hooks.onError(new Error('Cannot read property "name" of undefined'), 'user-profile.js:15');

  await new Promise(resolve => setTimeout(resolve, 3000));

  // Scenario 3: Student asks a question
  console.log(chalk.gray('\n[Student joins and asks a question...]\n'));
  
  // Simulate student
  const WebSocket = (await import('ws')).default;
  const studentWs = new WebSocket('ws://localhost:4567');
  
  studentWs.on('open', () => {
    studentWs.send(JSON.stringify({
      type: 'register',
      agentId: 'student-demo',
      role: 'student',
      capabilities: ['ask-questions']
    }));

    setTimeout(() => {
      studentWs.send(JSON.stringify({
        type: 'question',
        question: 'What is the difference between hashing and encryption?',
        context: 'We just created authentication code'
      }));
    }, 1000);
  });

  // Listen for messages
  bridge.wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      if (message.type === 'message' || message.type === 'answer') {
        const roleEmoji = {
          'teacher': '👩‍🏫',
          'claude-code': '🤖',
          'student': '👤'
        };
        
        console.log(`${roleEmoji[message.fromRole] || '💬'} ${chalk.bold(message.fromRole)}: ${message.content || message.answer}`);
      }
    });
  });

  // Keep running for demo
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  console.log(chalk.gray('\n--- End of Demonstration ---\n'));
  process.exit(0);
}

demonstrateDialogue().catch(console.error);