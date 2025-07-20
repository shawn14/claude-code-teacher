import chalk from 'chalk';
import WebSocket from 'ws';

// Teaching hooks that can be called directly in Claude Code responses
export class TeachingHooks {
  constructor() {
    this.enabled = false;
    this.ws = null;
    this.messageLog = [];
  }

  async connect() {
    try {
      this.ws = new WebSocket('ws://localhost:4567');
      
      return new Promise((resolve, reject) => {
        this.ws.on('open', () => {
          this.ws.send(JSON.stringify({
            type: 'register',
            role: 'claude-code-live'
          }));
          this.enabled = true;
          console.log(chalk.green('✓ Teaching hooks connected'));
          resolve(true);
        });

        this.ws.on('error', (err) => {
          console.log(chalk.red('✗ Teaching hooks not available'));
          this.enabled = false;
          resolve(false);
        });

        setTimeout(() => {
          if (!this.enabled) {
            console.log(chalk.yellow('⚠ Teaching system not running'));
            resolve(false);
          }
        }, 2000);
      });
    } catch (error) {
      this.enabled = false;
      return false;
    }
  }

  announce(action, details = null) {
    const message = details ? `${action}: ${JSON.stringify(details)}` : action;
    
    // Always log locally
    console.log(chalk.cyan(`\n🤖 Claude Code: ${message}\n`));
    this.messageLog.push({ time: new Date(), message });
    
    // Send to teacher if connected
    if (this.enabled && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'message',
        role: 'claude-code',
        content: message,
        timestamp: new Date().toISOString()
      }));
    }
    
    return this;
  }

  explainIntent(intent) {
    return this.announce(`I'm about to ${intent}`);
  }

  explainComplete(what) {
    return this.announce(`✓ Completed: ${what}`);
  }

  askQuestion(question) {
    return this.announce(`Question: ${question}`);
  }

  // Check if teaching system is available
  static async check() {
    const hooks = new TeachingHooks();
    const connected = await hooks.connect();
    if (connected) {
      hooks.ws.close();
    }
    return connected;
  }
}

// Global instance that Claude Code can use
let globalHooks = null;

export async function initializeTeaching() {
  if (!globalHooks) {
    globalHooks = new TeachingHooks();
    await globalHooks.connect();
  }
  return globalHooks;
}

// Simple function to use in Claude Code responses
export async function teach(message) {
  if (!globalHooks) {
    await initializeTeaching();
  }
  
  if (globalHooks) {
    globalHooks.announce(message);
  } else {
    console.log(chalk.dim(`[Teaching system not connected] ${message}`));
  }
}