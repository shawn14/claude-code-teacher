import WebSocket from 'ws';
import { MessageTypes } from './communication-bridge.js';

export class ClaudeCodeConnector {
  constructor(bridgeUrl = 'ws://localhost:4567') {
    this.bridgeUrl = bridgeUrl;
    this.ws = null;
    this.agentId = 'claude-code-' + Date.now();
    this.connected = false;
    this.messageHandlers = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.bridgeUrl);

      this.ws.on('open', () => {
        console.log('🤖 Claude Code connected to communication bridge');
        this.connected = true;
        
        // Register as Claude Code agent
        this.send({
          type: MessageTypes.REGISTER,
          agentId: this.agentId,
          role: 'claude-code',
          capabilities: [
            'code-generation',
            'file-manipulation',
            'testing',
            'debugging',
            'refactoring'
          ]
        });
        
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

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('Disconnected from communication bridge');
        this.connected = false;
      });
    });
  }

  handleMessage(message) {
    // Handle different message types
    switch (message.type) {
      case 'identify':
        // Already handled in connect
        break;
        
      case 'question':
        this.handleQuestion(message);
        break;
        
      case 'suggestion':
        this.handleSuggestion(message);
        break;
        
      case 'student-question':
        this.handleStudentQuestion(message);
        break;
        
      default:
        // Emit to registered handlers
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          handler(message);
        }
    }
  }

  handleQuestion(message) {
    console.log(`❓ Question from ${message.fromRole}: ${message.question}`);
    
    // Claude Code can answer technical questions
    if (message.question.toLowerCase().includes('how') || 
        message.question.toLowerCase().includes('why')) {
      // Simulate thoughtful response
      setTimeout(() => {
        this.send({
          type: MessageTypes.ANSWER,
          questionId: message.id,
          answer: this.generateAnswer(message.question)
        });
      }, 1000);
    }
  }

  handleSuggestion(message) {
    console.log(`💡 Suggestion from teacher: ${message.content}`);
    // Claude Code could incorporate suggestions into its work
  }

  handleStudentQuestion(message) {
    console.log(`👤 Student asked: ${message.question}`);
    // Claude Code is aware of student questions for context
  }

  generateAnswer(question) {
    // Simple answer generation - in real implementation, this would be more sophisticated
    const answers = {
      'why': 'This approach follows best practices for maintainability and security.',
      'how': 'I accomplish this by using modern JavaScript patterns and established libraries.',
      'what': 'This is a common pattern used in production applications.',
      'default': 'That\'s a great question! Let me think about the best way to explain this...'
    };

    const questionWord = question.toLowerCase().split(' ')[0];
    return answers[questionWord] || answers.default;
  }

  // Methods for Claude Code to communicate

  sendStatus(action, details) {
    this.send({
      type: MessageTypes.STATUS,
      action,
      details,
      important: this.isImportantAction(action)
    });
  }

  sendIntent(intent) {
    this.send({
      type: MessageTypes.CODE_INTENT,
      content: intent
    });
  }

  sendComplete(task) {
    this.send({
      type: MessageTypes.CODE_COMPLETE,
      content: task
    });
  }

  sendMessage(content, to = null) {
    this.send({
      type: MessageTypes.MESSAGE,
      content,
      to
    });
  }

  askQuestion(question, context = null) {
    this.send({
      type: MessageTypes.QUESTION,
      question,
      context
    });
  }

  onMessage(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  send(data) {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify(data));
    }
  }

  isImportantAction(action) {
    const importantActions = [
      'creating-file',
      'deleting-file',
      'major-refactor',
      'adding-feature',
      'fixing-bug',
      'running-tests'
    ];
    
    return importantActions.includes(action);
  }
}

// Example usage in Claude Code hooks
export function createClaudeCodeHooks(connector) {
  return {
    beforeFileCreate: async (filePath) => {
      connector.sendIntent(`I'm about to create a new file: ${filePath}`);
      connector.sendStatus('creating-file', { path: filePath });
    },

    afterFileCreate: async (filePath, content) => {
      connector.sendComplete(`Created file: ${filePath}`);
      connector.sendMessage(`New file created with ${content.split('\n').length} lines of code`);
    },

    beforeCodeModification: async (filePath, description) => {
      connector.sendIntent(`I'm going to ${description} in ${filePath}`);
      connector.sendStatus('modifying-code', { path: filePath, description });
    },

    afterCodeModification: async (filePath, changes) => {
      connector.sendComplete(`Modified ${filePath}`);
    },

    onError: async (error, context) => {
      connector.sendStatus('error', { error: error.message, context });
      connector.askQuestion(`I encountered an error: ${error.message}. What's the best way to handle this?`);
    },

    beforeTest: async (testName) => {
      connector.sendIntent(`Running test: ${testName}`);
      connector.sendStatus('running-tests', { test: testName });
    },

    afterTest: async (testName, passed) => {
      connector.sendComplete(`Test ${testName} ${passed ? 'passed' : 'failed'}`);
      if (!passed) {
        connector.askQuestion(`The test ${testName} failed. Should I debug it or continue?`);
      }
    }
  };
}