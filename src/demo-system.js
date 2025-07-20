import { WebSocketServer, WebSocket } from 'ws';
import chalk from 'chalk';
import readline from 'readline';

// Simple message relay server
class SimpleMessageServer {
  constructor(port = 4567) {
    this.port = port;
    this.clients = new Map();
    this.messages = [];
  }

  start() {
    this.wss = new WebSocketServer({ port: this.port });
    
    this.wss.on('connection', (ws) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        // Handle registration
        if (message.type === 'register') {
          this.clients.set(message.agentId, {
            ws,
            role: message.role,
            id: message.agentId
          });
          console.log(chalk.green(`✓ ${message.role} connected`));
          return;
        }
        
        // Relay messages to all other clients
        const messageStr = JSON.stringify(message);
        this.messages.push(message);
        
        for (const [id, client] of this.clients) {
          if (client.ws !== ws && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(messageStr);
          }
        }
      });

      ws.on('close', () => {
        // Remove disconnected client
        for (const [id, client] of this.clients) {
          if (client.ws === ws) {
            this.clients.delete(id);
            console.log(chalk.yellow(`${client.role} disconnected`));
            break;
          }
        }
      });
    });

    console.log(chalk.blue(`Message server running on port ${this.port}`));
  }
}

// Simulated Claude Code Agent
class SimulatedClaudeCode {
  constructor() {
    this.ws = null;
    this.agentId = 'claude-code-' + Date.now();
  }

  connect() {
    return new Promise((resolve) => {
      this.ws = new WebSocket('ws://localhost:4567');
      
      this.ws.on('open', () => {
        this.ws.send(JSON.stringify({
          type: 'register',
          agentId: this.agentId,
          role: 'claude-code'
        }));
        
        setTimeout(() => {
          this.sendMessage("Hello! I'm Claude Code. Ready to build something together! 🚀");
          resolve();
        }, 500);
      });

      this.ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'question' && message.fromRole === 'student') {
          // Respond to student questions
          setTimeout(() => {
            this.handleStudentQuestion(message);
          }, 1500);
        }
      });
    });
  }

  sendMessage(content) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'message',
        fromRole: 'claude-code',
        content,
        timestamp: new Date().toISOString()
      }));
    }
  }

  handleStudentQuestion(question) {
    const responses = {
      'async': "I use async/await to handle operations that take time, like API calls. Here's how it works in the code...",
      'error': "Error handling is crucial! I use try-catch blocks to gracefully handle failures...",
      'function': "Functions help organize code into reusable pieces. Let me show you an example...",
      'why': "Great question! The reason I'm doing this is to follow best practices for security and maintainability...",
      'how': "Let me walk you through the process step by step..."
    };

    // Find matching response
    let response = "That's an interesting question! Let me think about that...";
    for (const [key, value] of Object.entries(responses)) {
      if (question.question.toLowerCase().includes(key)) {
        response = value;
        break;
      }
    }

    this.sendMessage(response);
  }

  // Simulate coding actions
  async startCoding() {
    await this.delay(3000);
    this.sendMessage("I'm going to create a user authentication system. Let me start with the main auth module...");
    
    await this.delay(2000);
    this.sendMessage("Creating file: auth.js");
    
    await this.delay(3000);
    this.sendMessage("I've added password hashing using bcrypt. This ensures passwords are never stored in plain text.");
    
    await this.delay(2000);
    this.sendMessage("Now I'm adding JWT token generation for session management...");
    
    await this.delay(3000);
    this.sendMessage("I notice we should add email validation. Should I implement that now?");
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Simulated Teacher Agent
class SimulatedTeacher {
  constructor() {
    this.ws = null;
    this.agentId = 'teacher-' + Date.now();
  }

  connect() {
    return new Promise((resolve) => {
      this.ws = new WebSocket('ws://localhost:4567');
      
      this.ws.on('open', () => {
        this.ws.send(JSON.stringify({
          type: 'register',
          agentId: this.agentId,
          role: 'teacher'
        }));
        
        setTimeout(() => {
          this.sendMessage("Hello! I'm your coding teacher. I'll explain everything as we go. Feel free to ask questions! 👩‍🏫");
          resolve();
        }, 1000);
      });

      this.ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      });
    });
  }

  handleMessage(message) {
    if (message.fromRole === 'claude-code') {
      // Respond to Claude Code's actions
      setTimeout(() => {
        if (message.content.includes('create')) {
          this.sendMessage("Great! Claude is creating a new file. This is a common pattern in software development. Let me explain why we organize code into modules...");
        } else if (message.content.includes('bcrypt')) {
          this.sendMessage("🔐 Security lesson! Bcrypt is a password hashing function. Unlike encryption (which can be reversed), hashing is one-way. This means even if someone steals the database, they can't get the original passwords!");
        } else if (message.content.includes('JWT')) {
          this.sendMessage("📝 JWT (JSON Web Tokens) are like temporary ID cards for users. They contain user info and expire after a set time. This is more secure than storing session data on the server.");
        } else if (message.content.includes('validation')) {
          this.sendMessage("Yes, definitely add email validation! This prevents typos and ensures we have valid contact info. It's a small detail that greatly improves user experience.");
        }
      }, 1000);
    } else if (message.type === 'question' && message.fromRole === 'student') {
      // Answer student questions
      setTimeout(() => {
        this.answerStudentQuestion(message);
      }, 800);
    }
  }

  answerStudentQuestion(question) {
    const q = question.question.toLowerCase();
    let answer = "";

    if (q.includes('what') && q.includes('async')) {
      answer = "Async/await is like ordering food at a restaurant. You place your order (start async operation), get a number (promise), and can do other things while waiting. When ready, they call your number (promise resolves)!";
    } else if (q.includes('why') && q.includes('hash')) {
      answer = "We hash passwords because it's one-way encryption. Even if hackers steal the database, they can't reverse the hash to get the original password. It's like turning a smoothie back into fruit - practically impossible!";
    } else if (q.includes('difference')) {
      answer = "Great question about differences! Let me explain: Hashing is one-way (password → hash, can't go back), while encryption is two-way (data ↔ encrypted data). Hashing for passwords, encryption for data you need to read later.";
    } else if (q.includes('how')) {
      answer = "Let me break down the process: 1) User enters password, 2) We hash it with bcrypt, 3) Store the hash in database, 4) On login, hash their input and compare with stored hash. If they match, password is correct!";
    } else {
      answer = "That's a thoughtful question! " + this.generateGenericAnswer(q);
    }

    this.sendMessage(answer);
  }

  generateGenericAnswer(question) {
    const genericAnswers = [
      "Let me explain this concept in simple terms...",
      "This is an important topic in programming. Here's what you need to know...",
      "Great observation! This relates to best practices in software development...",
      "I'm glad you asked! This is something many developers wonder about..."
    ];
    
    return genericAnswers[Math.floor(Math.random() * genericAnswers.length)];
  }

  sendMessage(content) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'message',
        fromRole: 'teacher',
        content,
        timestamp: new Date().toISOString()
      }));
    }
  }
}

// Main demo runner
async function runLiveDemo() {
  console.clear();
  console.log(chalk.bold.cyan(`
╔════════════════════════════════════════════╗
║     Claude Code Teaching System Demo       ║
║         Real-time Agent Dialogue           ║
╚════════════════════════════════════════════╝
  `));

  // Start message server
  const server = new SimpleMessageServer();
  server.start();

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Connect agents
  console.log(chalk.yellow('\nConnecting agents...\n'));
  
  const teacher = new SimulatedTeacher();
  await teacher.connect();
  
  const claudeCode = new SimulatedClaudeCode();
  await claudeCode.connect();

  // Create student interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Connect student
  const studentWs = new WebSocket('ws://localhost:4567');
  let studentReady = false;

  studentWs.on('open', () => {
    studentWs.send(JSON.stringify({
      type: 'register',
      agentId: 'student-' + Date.now(),
      role: 'student'
    }));
    studentReady = true;
  });

  studentWs.on('message', (data) => {
    const message = JSON.parse(data.toString());
    
    // Display messages
    if (message.type === 'message') {
      const roleColors = {
        'teacher': chalk.yellow,
        'claude-code': chalk.cyan,
        'student': chalk.green
      };
      
      const color = roleColors[message.fromRole] || chalk.white;
      const icon = {
        'teacher': '👩‍🏫',
        'claude-code': '🤖',
        'student': '👤'
      }[message.fromRole] || '💬';
      
      console.log(`\n${icon} ${color(message.fromRole)}: ${message.content}`);
    }
  });

  // Wait for connections
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(chalk.green('\n✅ All agents connected! Starting live coding session...\n'));
  console.log(chalk.gray('You can ask questions at any time. Type your question and press Enter.\n'));
  console.log(chalk.gray('Example questions: "What is async/await?", "Why hash passwords?", "How does JWT work?"\n'));

  // Start Claude Code's coding simulation
  claudeCode.startCoding();

  // Handle student input
  rl.on('line', (input) => {
    if (input.trim() && studentReady) {
      studentWs.send(JSON.stringify({
        type: 'question',
        fromRole: 'student',
        question: input,
        timestamp: new Date().toISOString()
      }));
      console.log(chalk.green(`\n👤 You: ${input}`));
    }
  });

  // Keep running
  process.on('SIGINT', () => {
    console.log(chalk.red('\n\nShutting down demo...'));
    process.exit(0);
  });
}

// Run the demo
runLiveDemo().catch(console.error);