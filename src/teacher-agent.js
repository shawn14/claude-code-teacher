import WebSocket from 'ws';
import { MessageTypes } from './communication-bridge.js';
import { TeachingEngine } from './explainer.js';

export class TeacherAgent {
  constructor(bridgeUrl = 'ws://localhost:4567') {
    this.bridgeUrl = bridgeUrl;
    this.ws = null;
    this.agentId = 'teacher-' + Date.now();
    this.connected = false;
    this.teachingEngine = new TeachingEngine('conversational');
    this.currentContext = {
      recentActions: [],
      activeFile: null,
      studentLevel: 'intermediate'
    };
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.bridgeUrl);

      this.ws.on('open', () => {
        console.log('👩‍🏫 Teacher connected to communication bridge');
        this.connected = true;
        
        // Register as teacher agent
        this.send({
          type: MessageTypes.REGISTER,
          agentId: this.agentId,
          role: 'teacher',
          capabilities: [
            'explain-code',
            'answer-questions',
            'provide-suggestions',
            'teach-concepts',
            'review-code'
          ]
        });
        
        // Introduce myself
        setTimeout(() => {
          this.sendMessage("Hello! I'm your coding teacher. I'll explain what's happening as we build together. Feel free to ask questions anytime! 🎓");
        }, 1000);
        
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });

      this.ws.on('error', reject);
      this.ws.on('close', () => {
        this.connected = false;
      });
    });
  }

  async handleMessage(message) {
    switch (message.type) {
      case MessageTypes.STATUS:
        await this.handleStatusUpdate(message);
        break;
        
      case MessageTypes.CODE_INTENT:
        await this.handleCodeIntent(message);
        break;
        
      case MessageTypes.CODE_COMPLETE:
        await this.handleCodeComplete(message);
        break;
        
      case MessageTypes.QUESTION:
        await this.handleQuestion(message);
        break;
        
      case MessageTypes.MESSAGE:
        // Handle general messages by displaying them
        console.log(`📨 Message from ${message.role}: ${message.content}`);
        break;
        
      case 'agent-joined':
        if (message.role === 'claude-code') {
          this.sendMessage("Great! Claude Code is here. Let's start building together! 🚀");
        } else if (message.role === 'student') {
          this.sendMessage("Welcome! I'm excited to help you learn. What would you like to explore today?");
        }
        break;
    }
    
    // Update context
    this.updateContext(message);
  }

  async handleStatusUpdate(message) {
    const { action, details } = message;
    
    switch (action) {
      case 'creating-file':
        this.sendMessage(`📄 Claude is creating a new file: \`${details.path}\`. Let me explain what this file will do...`);
        break;
        
      case 'modifying-code':
        this.currentContext.activeFile = details.path;
        this.sendMessage(`✏️ Now modifying \`${details.path}\`. ${details.description}. Watch how this works...`);
        break;
        
      case 'running-tests':
        this.sendMessage(`🧪 Running tests! This is how we make sure our code works correctly. Let's see what happens...`);
        break;
        
      case 'error':
        this.sendMessage(`❌ Oops! We hit an error: "${details.error}". This is a great learning opportunity! Let me explain what went wrong...`);
        await this.explainError(details.error, details.context);
        break;
    }
  }

  async handleCodeIntent(message) {
    const intent = message.content;
    
    // Provide context before Claude Code acts
    if (intent.includes('create')) {
      this.sendMessage(`💡 Claude is planning to ${intent}. This is a common pattern in software development. Let me explain why...`);
    } else if (intent.includes('refactor')) {
      this.sendMessage(`🔧 Refactoring alert! ${intent}. Refactoring means improving code without changing what it does. Here's why it's important...`);
    } else if (intent.includes('test')) {
      this.sendMessage(`✅ Testing time! ${intent}. Good developers always test their code. Let me show you what to look for...`);
    }
  }

  async handleCodeComplete(message) {
    const task = message.content;
    this.sendMessage(`✨ ${task}! Let's review what just happened and why it matters...`);
    
    // Provide a mini-lesson based on what was completed
    if (task.includes('Created file')) {
      this.sendMessage(`📚 **Quick lesson**: Every file in a project has a specific purpose. This one will help with...`);
    }
  }

  async handleQuestion(message) {
    const { question, from, fromRole, context, id } = message;
    
    console.log(`Got question from ${fromRole}: ${question}`);
    
    // Generate appropriate answer based on who's asking
    let answer;
    
    if (fromRole === 'student') {
      // Student questions get detailed, educational answers
      answer = await this.generateStudentAnswer(question, context);
    } else if (fromRole === 'claude-code') {
      // Claude Code questions get technical guidance
      answer = await this.generateTechnicalAnswer(question, context);
    } else {
      answer = await this.generateGeneralAnswer(question, context);
    }
    
    this.send({
      type: MessageTypes.ANSWER,
      questionId: id,
      answer
    });
  }

  async generateStudentAnswer(question, context) {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('what is') || lowerQuestion.includes('what\'s')) {
      return this.explainConcept(question);
    } else if (lowerQuestion.includes('why')) {
      return this.explainReasoning(question);
    } else if (lowerQuestion.includes('how')) {
      return this.explainProcess(question);
    } else if (lowerQuestion.includes('difference between')) {
      return this.explainDifference(question);
    }
    
    return `Great question! ${question}\n\nLet me break this down for you in simple terms...`;
  }

  async generateTechnicalAnswer(question, context) {
    // Provide technical guidance to Claude Code
    if (question.includes('error')) {
      return `For that error, I recommend checking for type mismatches or missing dependencies. Try using try-catch blocks for better error handling.`;
    } else if (question.includes('best way')) {
      return `Based on current best practices, I'd suggest using async/await for cleaner code flow and better error handling.`;
    }
    
    return `From a technical perspective, consider the maintainability and scalability of your approach.`;
  }

  explainConcept(question) {
    // Extract the concept being asked about
    const concepts = {
      'async': 'Async/await is like ordering food at a restaurant. You place your order (start an async operation) and get a number (promise). You can do other things while waiting, and when your food is ready (promise resolves), you get notified!',
      'function': 'A function is like a recipe. It takes ingredients (parameters), follows steps (code), and produces a dish (return value). You can use the same recipe many times!',
      'array': 'An array is like a shopping list. Each item has a position (index starting at 0), and you can add, remove, or change items as needed.',
      'object': 'An object is like a filing cabinet with labeled folders. Each label (key) points to specific information (value) that you can quickly access.',
      'class': 'A class is like a blueprint for a house. You can use the same blueprint to build many houses (instances), each with its own address but the same basic structure.'
    };
    
    for (const [key, explanation] of Object.entries(concepts)) {
      if (question.toLowerCase().includes(key)) {
        return explanation + '\n\nWould you like me to show you an example?';
      }
    }
    
    return 'Let me explain that concept with a simple analogy...';
  }

  explainReasoning(question) {
    return `That's a "why" question - I love those! Understanding the "why" behind code is crucial.\n\nThe reason we do this is for clarity, maintainability, and following established patterns that other developers will recognize. Let me elaborate...`;
  }

  explainProcess(question) {
    return `I'll walk you through the process step by step:\n\n1. First, we...\n2. Then, we...\n3. Finally, we...\n\nEach step is important because...`;
  }

  explainDifference(question) {
    return `Great question about differences! Let me create a comparison:\n\n**Option A**:\n- Pros: ...\n- Cons: ...\n- Use when: ...\n\n**Option B**:\n- Pros: ...\n- Cons: ...\n- Use when: ...\n\nThe key difference is...`;
  }

  async explainError(error, context) {
    const commonErrors = {
      'undefined': 'This usually means we\'re trying to use something that doesn\'t exist yet. Like trying to eat from an empty plate!',
      'null': 'Null is like having an empty box where we expected something. We need to check if the box has something before using it.',
      'syntax': 'Syntax errors are like grammar mistakes in code. The computer doesn\'t understand what we\'re trying to say.',
      'type': 'Type errors happen when we mix incompatible things, like trying to add a number to a word.'
    };
    
    for (const [key, explanation] of Object.entries(commonErrors)) {
      if (error.toLowerCase().includes(key)) {
        this.sendMessage(`🔍 ${explanation}\n\nHere's how we fix it...`);
        return;
      }
    }
    
    this.sendMessage(`🔍 This error teaches us about error handling. Let's debug it together...`);
  }

  updateContext(message) {
    this.currentContext.recentActions.push({
      type: message.type,
      from: message.from,
      timestamp: message.timestamp
    });
    
    // Keep only last 20 actions
    if (this.currentContext.recentActions.length > 20) {
      this.currentContext.recentActions.shift();
    }
  }

  // Proactive teaching methods

  async provideSuggestion(topic, code) {
    this.send({
      type: MessageTypes.SUGGESTION,
      content: `💡 Suggestion: ${topic}`,
      code
    });
  }

  sendMessage(content, to = null) {
    this.send({
      type: MessageTypes.MESSAGE,
      content,
      to
    });
  }

  send(data) {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

// Create a teaching session
export async function startTeachingSession() {
  const teacher = new TeacherAgent();
  await teacher.connect();
  
  console.log('👩‍🏫 Teaching session started!');
  
  return teacher;
}