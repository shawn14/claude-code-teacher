import WebSocket from 'ws';
import { WebSocketServer } from 'ws';
import chalk from 'chalk';

// Real integration for Claude Code to communicate
class RealTimeIntegration {
  constructor() {
    this.bridgePort = 4567;
    this.server = null;
    this.clients = new Map();
    this.claudeCodeWs = null;
  }

  async startBridge() {
    // Start WebSocket server
    this.server = new WebSocketServer({ port: this.bridgePort });
    
    this.server.on('connection', (ws, req) => {
      console.log(chalk.green('New connection established'));
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'register') {
          this.clients.set(message.role, ws);
          console.log(chalk.blue(`${message.role} registered`));
          
          // Send acknowledgment
          ws.send(JSON.stringify({
            type: 'registered',
            status: 'connected'
          }));
        } else {
          // Broadcast to all other clients
          this.broadcast(message, ws);
        }
      });
      
      ws.on('close', () => {
        // Remove from clients
        for (const [role, client] of this.clients) {
          if (client === ws) {
            this.clients.delete(role);
            console.log(chalk.yellow(`${role} disconnected`));
            break;
          }
        }
      });
    });
    
    console.log(chalk.bold.green(`\n🌉 Real-time bridge started on port ${this.bridgePort}`));
    console.log(chalk.gray('Waiting for teacher agent to connect...\n'));
    
    // Create Claude Code client connection
    await this.connectAsClaudeCode();
  }
  
  async connectAsClaudeCode() {
    return new Promise((resolve) => {
      this.claudeCodeWs = new WebSocket(`ws://localhost:${this.bridgePort}`);
      
      this.claudeCodeWs.on('open', () => {
        // Register as Claude Code
        this.claudeCodeWs.send(JSON.stringify({
          type: 'register',
          role: 'claude-code-real'
        }));
        
        console.log(chalk.cyan('Claude Code (me) connected to bridge'));
        resolve();
      });
      
      this.claudeCodeWs.on('message', (data) => {
        const message = JSON.parse(data.toString());
        console.log(chalk.magenta(`[Received] ${JSON.stringify(message)}`));
      });
    });
  }
  
  broadcast(message, sender) {
    const messageStr = JSON.stringify(message);
    for (const [role, ws] of this.clients) {
      if (ws !== sender && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    }
  }
  
  // Method for Claude Code to send messages
  sendMessage(content, type = 'message') {
    if (this.claudeCodeWs && this.claudeCodeWs.readyState === WebSocket.OPEN) {
      const message = {
        type,
        role: 'claude-code',
        content,
        timestamp: new Date().toISOString()
      };
      
      this.claudeCodeWs.send(JSON.stringify(message));
      console.log(chalk.cyan(`[Sent] ${content}`));
    }
  }
  
  sendCodeIntent(action, details) {
    this.sendMessage(`I'm about to ${action}: ${JSON.stringify(details)}`, 'code-intent');
  }
  
  sendStatus(status) {
    this.sendMessage(status, 'status');
  }
}

// Global instance for Claude Code to use
export const integration = new RealTimeIntegration();

// Start the integration
export async function startRealIntegration() {
  await integration.startBridge();
  
  // Return methods Claude Code can use
  return {
    sendMessage: (content) => integration.sendMessage(content),
    sendIntent: (action, details) => integration.sendCodeIntent(action, details),
    sendStatus: (status) => integration.sendStatus(status),
    announce: (what) => {
      console.log(chalk.bold.blue(`\n📢 Claude Code Announces: ${what}\n`));
      integration.sendMessage(what);
    }
  };
}