import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';

export class CommunicationBridge extends EventEmitter {
  constructor(port = 4567) {
    super();
    this.port = port;
    this.agents = new Map();
    this.conversations = [];
    this.wss = null;
  }

  async start() {
    this.wss = new WebSocketServer({ port: this.port });
    
    this.wss.on('connection', (ws) => {
      console.log('🔌 New agent connected');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Invalid message:', error);
        }
      });

      ws.on('close', () => {
        this.removeAgent(ws);
      });

      // Request identification
      ws.send(JSON.stringify({
        type: 'identify',
        message: 'Please identify yourself'
      }));
    });

    console.log(`🌉 Communication bridge running on port ${this.port}`);
    return this;
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'register':
        this.registerAgent(ws, data);
        break;
      case 'message':
        this.relayMessage(ws, data);
        break;
      case 'status':
        this.handleStatusUpdate(ws, data);
        break;
      case 'question':
        this.handleQuestion(ws, data);
        break;
      case 'answer':
        this.handleAnswer(ws, data);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  registerAgent(ws, data) {
    const { agentId, role, capabilities } = data;
    
    this.agents.set(agentId, {
      ws,
      id: agentId,
      role, // 'claude-code', 'teacher', 'student'
      capabilities,
      status: 'active'
    });

    console.log(`✅ Agent registered: ${agentId} (${role})`);
    
    // Notify other agents
    this.broadcast({
      type: 'agent-joined',
      agentId,
      role,
      capabilities
    }, agentId);

    // Send current state to new agent
    ws.send(JSON.stringify({
      type: 'state-update',
      agents: Array.from(this.agents.values()).map(a => ({
        id: a.id,
        role: a.role,
        status: a.status
      })),
      recentConversations: this.conversations.slice(-10)
    }));
  }

  removeAgent(ws) {
    for (const [id, agent] of this.agents) {
      if (agent.ws === ws) {
        this.agents.delete(id);
        console.log(`👋 Agent disconnected: ${id}`);
        
        this.broadcast({
          type: 'agent-left',
          agentId: id
        });
        
        break;
      }
    }
  }

  relayMessage(senderWs, data) {
    const sender = this.getAgentByWs(senderWs);
    if (!sender) return;

    const message = {
      type: 'message',
      from: sender.id,
      fromRole: sender.role,
      content: data.content,
      timestamp: new Date().toISOString()
    };

    // Store in conversation history
    this.conversations.push(message);

    // Relay to specific agent or broadcast
    if (data.to) {
      const recipient = this.agents.get(data.to);
      if (recipient) {
        recipient.ws.send(JSON.stringify(message));
      }
    } else {
      this.broadcast(message, sender.id);
    }
  }

  handleStatusUpdate(senderWs, data) {
    const sender = this.getAgentByWs(senderWs);
    if (!sender) return;

    const statusMessage = {
      type: 'status-update',
      from: sender.id,
      fromRole: sender.role,
      action: data.action, // 'creating-file', 'modifying-code', 'running-test', etc.
      details: data.details,
      timestamp: new Date().toISOString()
    };

    // Store important status updates
    if (data.important) {
      this.conversations.push(statusMessage);
    }

    // Always send to teacher for explanation
    const teacher = this.getAgentByRole('teacher');
    if (teacher && sender.role !== 'teacher') {
      teacher.ws.send(JSON.stringify(statusMessage));
    }

    // Broadcast to others
    this.broadcast(statusMessage, sender.id);
  }

  handleQuestion(senderWs, data) {
    const sender = this.getAgentByWs(senderWs);
    if (!sender) return;

    const question = {
      type: 'question',
      id: Date.now().toString(),
      from: sender.id,
      fromRole: sender.role,
      question: data.question,
      context: data.context,
      timestamp: new Date().toISOString()
    };

    this.conversations.push(question);

    // Route questions based on sender
    if (sender.role === 'student') {
      // Student questions go to teacher primarily
      const teacher = this.getAgentByRole('teacher');
      if (teacher) {
        teacher.ws.send(JSON.stringify(question));
      }
      
      // Also notify Claude Code for context
      const claudeCode = this.getAgentByRole('claude-code');
      if (claudeCode) {
        claudeCode.ws.send(JSON.stringify({
          ...question,
          type: 'student-question'
        }));
      }
    } else {
      // Questions from agents go to appropriate recipients
      this.broadcast(question, sender.id);
    }
  }

  handleAnswer(senderWs, data) {
    const sender = this.getAgentByWs(senderWs);
    if (!sender) return;

    const answer = {
      type: 'answer',
      questionId: data.questionId,
      from: sender.id,
      fromRole: sender.role,
      answer: data.answer,
      timestamp: new Date().toISOString()
    };

    this.conversations.push(answer);
    this.broadcast(answer, sender.id);
  }

  getAgentByWs(ws) {
    for (const agent of this.agents.values()) {
      if (agent.ws === ws) {
        return agent;
      }
    }
    return null;
  }

  getAgentByRole(role) {
    for (const agent of this.agents.values()) {
      if (agent.role === role) {
        return agent;
      }
    }
    return null;
  }

  broadcast(message, excludeId = null) {
    const messageStr = JSON.stringify(message);
    
    for (const agent of this.agents.values()) {
      if (agent.id !== excludeId) {
        agent.ws.send(messageStr);
      }
    }
  }

  // Get conversation context for agents
  getConversationContext(limit = 20) {
    return this.conversations.slice(-limit);
  }
}

// Message Protocol Types
export const MessageTypes = {
  // Registration
  REGISTER: 'register',
  IDENTIFY: 'identify',
  
  // Communication
  MESSAGE: 'message',
  STATUS: 'status',
  QUESTION: 'question',
  ANSWER: 'answer',
  
  // State
  STATE_UPDATE: 'state-update',
  AGENT_JOINED: 'agent-joined',
  AGENT_LEFT: 'agent-left',
  
  // Claude Code specific
  CODE_INTENT: 'code-intent', // "I'm about to create a function..."
  CODE_COMPLETE: 'code-complete', // "I finished creating the function"
  
  // Teacher specific
  EXPLANATION: 'explanation',
  CONCEPT: 'concept',
  SUGGESTION: 'suggestion',
  
  // Student specific
  STUDENT_QUESTION: 'student-question',
  REQUEST_CLARIFICATION: 'request-clarification'
};