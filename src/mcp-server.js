import { WebSocketServer } from 'ws';
import http from 'http';
import { EventEmitter } from 'events';

export class MCPServer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.port = options.port || 3456;
    this.server = null;
    this.wss = null;
    this.clients = new Set();
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer();
      this.wss = new WebSocketServer({ server: this.server });

      this.wss.on('connection', (ws) => {
        this.clients.add(ws);
        console.log('Claude Code connected to teaching server');

        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message);
            this.handleMessage(ws, data);
          } catch (error) {
            console.error('Invalid message:', error);
          }
        });

        ws.on('close', () => {
          this.clients.delete(ws);
          console.log('Claude Code disconnected');
        });

        // Send initial handshake
        ws.send(JSON.stringify({
          type: 'handshake',
          name: 'Claude Code Teacher',
          version: '1.0.0',
          capabilities: ['explain', 'quiz', 'debug', 'architecture']
        }));
      });

      this.server.listen(this.port, () => {
        console.log(`MCP server listening on port ${this.port}`);
        resolve({ port: this.port });
      });

      this.server.on('error', reject);
    });
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'tool_call':
        this.handleToolCall(ws, data);
        break;
      case 'resource_request':
        this.handleResourceRequest(ws, data);
        break;
      case 'prompt_request':
        this.handlePromptRequest(ws, data);
        break;
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${data.type}`
        }));
    }
  }

  handleToolCall(ws, data) {
    const { tool, parameters, id } = data;

    switch (tool) {
      case 'explain':
        this.explainCode(ws, parameters, id);
        break;
      case 'quiz':
        this.generateQuiz(ws, parameters, id);
        break;
      case 'debug':
        this.debugHelp(ws, parameters, id);
        break;
      case 'architecture':
        this.analyzeArchitecture(ws, parameters, id);
        break;
      default:
        ws.send(JSON.stringify({
          type: 'tool_response',
          id,
          error: `Unknown tool: ${tool}`
        }));
    }
  }

  explainCode(ws, parameters, id) {
    const { code, context, level = 'intermediate' } = parameters;
    
    // Generate explanation based on code and context
    const explanation = this.generateExplanation(code, context, level);
    
    ws.send(JSON.stringify({
      type: 'tool_response',
      id,
      result: {
        explanation,
        concepts: this.extractConcepts(code),
        alternatives: this.suggestAlternatives(code)
      }
    }));
  }

  generateExplanation(code, context, level) {
    // This would integrate with the explanation engine
    const explanations = {
      beginner: `This code creates a function that processes data. Let me break it down step by step...`,
      intermediate: `This implements a pattern commonly used for data transformation. The key concepts are...`,
      advanced: `The implementation leverages functional programming principles. Performance considerations include...`
    };
    
    return explanations[level] || explanations.intermediate;
  }

  extractConcepts(code) {
    // Extract programming concepts from code
    const concepts = [];
    
    if (code.includes('async')) concepts.push('Asynchronous Programming');
    if (code.includes('class')) concepts.push('Object-Oriented Programming');
    if (code.includes('map') || code.includes('filter')) concepts.push('Functional Programming');
    if (code.includes('express')) concepts.push('Web Framework');
    
    return concepts;
  }

  suggestAlternatives(code) {
    // Suggest alternative implementations
    return [
      'Consider using async/await for better readability',
      'This could be simplified using array methods',
      'Error handling could be improved with try-catch blocks'
    ];
  }

  generateQuiz(ws, parameters, id) {
    const { topic, difficulty = 'medium' } = parameters;
    
    const quiz = {
      question: `What is the purpose of ${topic} in this context?`,
      options: [
        'To handle asynchronous operations',
        'To manage state',
        'To validate input',
        'To optimize performance'
      ],
      hint: 'Think about what problem this solves',
      explanation: 'This concept is fundamental to modern JavaScript...'
    };
    
    ws.send(JSON.stringify({
      type: 'tool_response',
      id,
      result: quiz
    }));
  }

  async close() {
    if (this.wss) {
      this.wss.close();
    }
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(resolve);
      });
    }
  }
}

export async function startMCPServer(options = {}) {
  const server = new MCPServer(options);
  await server.start();
  return server;
}

// MCP Protocol Implementation
export const MCPTools = {
  explain: {
    name: 'explain',
    description: 'Explain code changes and concepts',
    parameters: {
      code: { type: 'string', description: 'Code to explain' },
      context: { type: 'string', description: 'Surrounding context' },
      level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] }
    }
  },
  quiz: {
    name: 'quiz',
    description: 'Generate quiz questions about code',
    parameters: {
      topic: { type: 'string', description: 'Topic to quiz on' },
      difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] }
    }
  },
  debug: {
    name: 'debug',
    description: 'Help debug code issues',
    parameters: {
      error: { type: 'string', description: 'Error message' },
      code: { type: 'string', description: 'Code causing the error' }
    }
  },
  architecture: {
    name: 'architecture',
    description: 'Analyze and explain code architecture',
    parameters: {
      projectPath: { type: 'string', description: 'Path to analyze' }
    }
  }
};