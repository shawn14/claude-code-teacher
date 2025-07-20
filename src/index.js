import { startWatcher } from './monitor.js';
import { startMCPServer } from './mcp-server.js';
import { TeachingEngine } from './explainer.js';

export {
  startWatcher,
  startMCPServer,
  TeachingEngine
};

export default class ClaudeCodeTeacher {
  constructor(options = {}) {
    this.mode = options.mode || 'realtime';
    this.projectPath = options.projectPath || process.cwd();
    this.teachingEngine = new TeachingEngine(this.mode);
    this.watchers = [];
  }

  async start() {
    // Start file monitoring
    const watcher = await startWatcher(this.projectPath, {
      mode: this.mode,
      onExplanation: (explanation) => {
        this.emit('explanation', explanation);
      }
    });
    
    this.watchers.push(watcher);
    
    // Start MCP server if requested
    if (this.options.mcp) {
      this.mcpServer = await startMCPServer();
    }
    
    return this;
  }

  async stop() {
    // Clean up watchers
    for (const watcher of this.watchers) {
      await watcher.close();
    }
    
    // Stop MCP server
    if (this.mcpServer) {
      await this.mcpServer.close();
    }
  }

  on(event, handler) {
    // Simple event emitter functionality
    this.handlers = this.handlers || {};
    this.handlers[event] = this.handlers[event] || [];
    this.handlers[event].push(handler);
  }

  emit(event, data) {
    if (this.handlers && this.handlers[event]) {
      for (const handler of this.handlers[event]) {
        handler(data);
      }
    }
  }
}