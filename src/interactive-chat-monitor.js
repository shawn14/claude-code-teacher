import { watch } from 'chokidar';
import chalk from 'chalk';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';
import { SeniorDevAdvisor } from './senior-dev-advisor.js';
import { AIPoweredAdvisor } from './ai-powered-advisor.js';

export class InteractiveChatMonitor {
  constructor(projectPath, options = {}) {
    this.projectPath = projectPath;
    this.maxUpdates = options.maxUpdates || 5; // Show fewer updates to leave room for chat
    this.updates = [];
    this.updateCount = 0;
    this.chatHistory = [];
    this.seniorDev = new SeniorDevAdvisor();
    this.aiAdvisor = new AIPoweredAdvisor();
    this.currentContext = null;
    this.isProcessingInput = false;
    
    // Set up readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('💬 '),
      terminal: true
    });
    
    // Store original console.log
    this.originalLog = console.log;
  }

  async start() {
    this.clearScreen();
    this.showWelcome();
    
    // Set up file watcher
    const watcher = watch(this.projectPath, {
      ignored: [
        /node_modules/,
        /\.git/,
        /\.DS_Store/,
        /\.next/,
        /dist/,
        /build/,
        /coverage/,
        /\.cache/,
        /tmp/,
        /temp/
      ],
      persistent: true,
      ignoreInitial: true
    });

    watcher
      .on('add', path => this.handleFileChange('added', path))
      .on('change', path => this.handleFileChange('modified', path))
      .on('unlink', path => this.handleFileChange('deleted', path));

    // Set up chat interface
    this.setupChatInterface();
    
    // Show initial display
    this.updateDisplay();
    
    // Show prompt
    this.rl.prompt();
  }

  showWelcome() {
    console.log(chalk.bold.cyan('\n🎓 Claude Code Teacher - Interactive Chat Mode'));
    console.log(chalk.gray('Watch code changes and chat with your AI teacher!'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.yellow('\n📌 Commands:'));
    console.log(chalk.gray('  • Type your question and press Enter'));
    console.log(chalk.gray('  • /help - Show available commands'));
    console.log(chalk.gray('  • /clear - Clear chat history'));
    console.log(chalk.gray('  • /save - Save conversation'));
    console.log(chalk.gray('  • /quit - Exit'));
    console.log(chalk.gray('─'.repeat(60)));
  }

  setupChatInterface() {
    this.rl.on('line', async (input) => {
      if (this.isProcessingInput) return;
      
      this.isProcessingInput = true;
      const trimmedInput = input.trim();
      
      if (!trimmedInput) {
        this.isProcessingInput = false;
        this.rl.prompt();
        return;
      }
      
      // Handle commands
      if (trimmedInput.startsWith('/')) {
        await this.handleCommand(trimmedInput);
      } else {
        // Handle regular chat message
        await this.handleChatMessage(trimmedInput);
      }
      
      this.isProcessingInput = false;
      this.updateDisplay();
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log(chalk.yellow('\n\n👋 Thanks for learning with Claude Code Teacher!'));
      process.exit(0);
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      this.rl.close();
    });
  }

  async handleCommand(command) {
    const cmd = command.toLowerCase();
    
    switch (cmd) {
      case '/help':
        this.showHelp();
        break;
      case '/clear':
        this.chatHistory = [];
        this.addSystemMessage('Chat history cleared.');
        break;
      case '/save':
        await this.saveConversation();
        break;
      case '/quit':
      case '/exit':
        this.rl.close();
        break;
      case '/context':
        this.showContext();
        break;
      default:
        this.addSystemMessage(`Unknown command: ${command}. Type /help for available commands.`);
    }
  }

  showHelp() {
    const helpText = `
${chalk.bold.yellow('🔧 Available Commands:')}

${chalk.cyan('/help')} - Show this help message
${chalk.cyan('/clear')} - Clear chat history
${chalk.cyan('/save')} - Save conversation to file
${chalk.cyan('/context')} - Show current file context
${chalk.cyan('/quit')} - Exit the program

${chalk.bold.yellow('💡 Chat Tips:')}

• Ask about recent code changes: ${chalk.gray('"What changed in the last update?"')}
• Request explanations: ${chalk.gray('"Explain this function to me"')}
• Get suggestions: ${chalk.gray('"How can I improve this code?"')}
• Learn concepts: ${chalk.gray('"What is async/await?"')}
• Security review: ${chalk.gray('"Are there any security issues?"')}
    `;
    
    this.addSystemMessage(helpText);
  }

  async handleChatMessage(message) {
    // Add user message to history
    this.addChatMessage('user', message);
    
    // Generate AI response based on context
    const response = await this.generateAIResponse(message);
    
    // Add AI response to history
    this.addChatMessage('ai', response);
  }

  async generateAIResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Context-aware responses
    if (this.currentContext) {
      if (lowerMessage.includes('what changed') || lowerMessage.includes('last update')) {
        return this.explainLastChange();
      }
      
      if (lowerMessage.includes('explain') && lowerMessage.includes('this')) {
        return this.explainCurrentContext();
      }
    }
    
    // General questions
    if (lowerMessage.includes('what is') || lowerMessage.includes('what\'s')) {
      return this.explainConcept(message);
    }
    
    if (lowerMessage.includes('how do i') || lowerMessage.includes('how can i')) {
      return this.provideGuidance(message);
    }
    
    if (lowerMessage.includes('why')) {
      return this.explainReasoning(message);
    }
    
    if (lowerMessage.includes('security') || lowerMessage.includes('vulnerability')) {
      return this.performSecurityReview();
    }
    
    if (lowerMessage.includes('performance') || lowerMessage.includes('optimize')) {
      return this.providePerformanceAdvice();
    }
    
    // Default response with context awareness
    return this.generateContextualResponse(message);
  }

  explainLastChange() {
    if (!this.currentContext) {
      return "I haven't detected any code changes yet. When you modify a file, I'll explain what changed!";
    }
    
    const { type, filename, diff, content } = this.currentContext;
    
    let explanation = `The last change was in ${chalk.cyan(filename)}:\n\n`;
    
    if (type === 'modified' && diff) {
      explanation += "Here's what changed:\n";
      explanation += chalk.gray('```diff\n' + diff + '\n```\n\n');
      explanation += this.analyzeDiff(diff);
    } else if (type === 'added') {
      explanation += `A new file was created. This appears to be a ${this.identifyFileType(filename)} file.\n`;
      explanation += this.explainFileContent(content, filename);
    } else if (type === 'deleted') {
      explanation += `The file was deleted. This might be part of refactoring or cleanup.`;
    }
    
    return explanation;
  }

  explainCurrentContext() {
    if (!this.currentContext) {
      return "No file context available yet. Make a change to a file and I'll explain it!";
    }
    
    const { filename, content } = this.currentContext;
    return this.explainFileContent(content, filename);
  }

  explainConcept(question) {
    const concepts = {
      'async': 'Async/await is a modern way to handle asynchronous operations in JavaScript. It makes asynchronous code look and behave like synchronous code, making it easier to read and understand.',
      'promise': 'A Promise represents a value that may be available now, in the future, or never. It\'s like ordering food - you get a receipt (promise) and can do other things while waiting.',
      'closure': 'A closure is when a function "remembers" variables from its outer scope even after that scope has finished executing. It\'s like a backpack that carries variables with it.',
      'react hook': 'React Hooks are functions that let you use state and other React features in functional components. useState, useEffect, and useContext are common hooks.',
      'git': 'Git is a version control system that tracks changes in your code over time. It\'s like having a time machine for your code!',
      'api': 'An API (Application Programming Interface) is a set of rules that allows different software applications to communicate with each other.'
    };
    
    for (const [key, explanation] of Object.entries(concepts)) {
      if (question.toLowerCase().includes(key)) {
        return `${explanation}\n\nWould you like me to show you an example or explain more about ${key}?`;
      }
    }
    
    return "That's a great question! Could you be more specific about what concept you'd like me to explain?";
  }

  provideGuidance(question) {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('test')) {
      return `To write tests, you typically:
1. Create a test file (e.g., \`filename.test.js\`)
2. Import your code and test framework
3. Write test cases using \`describe\` and \`it\` blocks
4. Use assertions to verify behavior

Would you like me to show you a specific testing example?`;
    }
    
    if (lowerQuestion.includes('debug')) {
      return `Here are effective debugging strategies:
1. Use \`console.log\` to track variable values
2. Set breakpoints in your debugger
3. Check the error stack trace
4. Isolate the problem by commenting out code
5. Use developer tools in your browser

What specific issue are you trying to debug?`;
    }
    
    return "I'd be happy to guide you! Could you tell me more about what you're trying to accomplish?";
  }

  async performSecurityReview() {
    if (!this.currentContext || !this.currentContext.content) {
      return "No code available to review. Make a change to a file and I'll analyze it for security issues!";
    }
    
    const { content, filename } = this.currentContext;
    const analysis = await this.aiAdvisor.analyzeWithAI(content, filename);
    
    let response = chalk.bold("🔒 Security Review:\n\n");
    
    if (analysis.security.length > 0) {
      response += chalk.red("⚠️ Security Issues Found:\n");
      analysis.security.forEach(issue => {
        response += chalk.red(`• ${issue.issue}\n`);
        response += chalk.yellow(`  → ${issue.suggestion}\n\n`);
      });
    } else {
      response += chalk.green("✅ No obvious security issues detected!\n");
    }
    
    response += "\nAlways remember to:\n";
    response += "• Never commit secrets or API keys\n";
    response += "• Validate all user input\n";
    response += "• Use parameterized queries for databases\n";
    response += "• Keep dependencies updated";
    
    return response;
  }

  analyzeDiff(diff) {
    const lines = diff.split('\n');
    let added = 0, removed = 0;
    const changes = [];
    
    lines.forEach(line => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        added++;
        if (line.includes('function') || line.includes('class') || line.includes('const')) {
          changes.push(`Added: ${line.substring(1).trim()}`);
        }
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        removed++;
      }
    });
    
    let analysis = `This change modified ${added} lines and removed ${removed} lines.\n\n`;
    
    if (changes.length > 0) {
      analysis += "Key changes:\n";
      changes.forEach(change => {
        analysis += `• ${change}\n`;
      });
    }
    
    return analysis;
  }

  addChatMessage(role, content) {
    this.chatHistory.push({
      role,
      content,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Keep chat history manageable
    if (this.chatHistory.length > 20) {
      this.chatHistory.shift();
    }
  }

  addSystemMessage(content) {
    this.addChatMessage('system', content);
  }

  async handleFileChange(type, filePath) {
    this.updateCount++;
    
    const filename = path.basename(filePath);
    const ext = path.extname(filename).slice(1);
    
    // Store context for chat
    this.currentContext = {
      type,
      filename,
      filePath,
      ext
    };
    
    // Get file content and diff
    if (type !== 'deleted') {
      try {
        this.currentContext.content = await readFile(filePath, 'utf-8');
        
        if (type === 'modified') {
          try {
            const diff = execSync(`git diff HEAD -- "${filePath}"`, {
              encoding: 'utf8',
              maxBuffer: 1024 * 1024,
              cwd: this.projectPath
            });
            if (diff && diff.trim()) {
              this.currentContext.diff = this.formatDiff(diff);
            }
          } catch (e) {
            // Not in git
          }
        }
      } catch (e) {
        // Can't read file
      }
    }
    
    // Add update to list
    const update = {
      number: this.updateCount,
      timestamp: new Date().toLocaleTimeString(),
      type,
      filename,
      message: this.getUpdateMessage(type, filename)
    };
    
    this.updates.push(update);
    if (this.updates.length > this.maxUpdates) {
      this.updates.shift();
    }
    
    // Don't update display while processing input
    if (!this.isProcessingInput) {
      this.updateDisplay();
    }
  }

  getUpdateMessage(type, filename) {
    switch (type) {
      case 'added':
        return chalk.green(`✅ Created: ${filename}`);
      case 'modified':
        return chalk.yellow(`📝 Modified: ${filename}`);
      case 'deleted':
        return chalk.red(`🗑️ Deleted: ${filename}`);
    }
  }

  formatDiff(diff) {
    const lines = diff.split('\n');
    const formatted = [];
    
    lines.forEach(line => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        formatted.push(chalk.green(line));
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        formatted.push(chalk.red(line));
      } else if (line.startsWith('@@')) {
        formatted.push(chalk.blue(line));
      } else if (!line.startsWith('diff --git') && !line.startsWith('index')) {
        formatted.push(chalk.gray(line));
      }
    });
    
    return formatted.slice(0, 15).join('\n');
  }

  updateDisplay() {
    this.clearScreen();
    
    // Show header
    console.log(chalk.bold.cyan('🎓 Claude Code Teacher - Interactive Chat'));
    console.log(chalk.gray('─'.repeat(60)));
    
    // Show file updates (compact)
    console.log(chalk.bold.yellow('\n📁 Recent File Changes:'));
    if (this.updates.length === 0) {
      console.log(chalk.gray('  No changes yet...'));
    } else {
      this.updates.forEach(update => {
        console.log(`  ${update.message} ${chalk.gray(update.timestamp)}`);
      });
    }
    
    // Show chat history
    console.log(chalk.bold.yellow('\n💬 Chat:'));
    console.log(chalk.gray('─'.repeat(60)));
    
    if (this.chatHistory.length === 0) {
      console.log(chalk.gray('  Start a conversation! Ask me anything about coding...'));
    } else {
      this.chatHistory.forEach(msg => {
        if (msg.role === 'user') {
          console.log(chalk.cyan(`You ${chalk.gray(msg.timestamp)}: `) + msg.content);
        } else if (msg.role === 'ai') {
          console.log(chalk.green(`Teacher: `) + msg.content);
        } else {
          console.log(chalk.gray(msg.content));
        }
        console.log('');
      });
    }
    
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.gray('Type your question or /help for commands'));
  }

  clearScreen() {
    console.clear();
  }

  identifyFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const types = {
      '.js': 'JavaScript',
      '.jsx': 'React component',
      '.ts': 'TypeScript',
      '.tsx': 'React TypeScript component',
      '.css': 'stylesheet',
      '.json': 'JSON configuration',
      '.md': 'Markdown documentation',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go'
    };
    return types[ext] || 'code';
  }

  explainFileContent(content, filename) {
    const ext = path.extname(filename);
    const fileType = this.identifyFileType(filename);
    
    let explanation = `This is a ${fileType} file. `;
    
    // Analyze imports/dependencies
    const imports = content.match(/import .* from|require\(|from .* import/g);
    if (imports) {
      explanation += `\n\nIt uses these dependencies:\n`;
      imports.slice(0, 5).forEach(imp => {
        explanation += `• ${imp}\n`;
      });
    }
    
    // Analyze main components
    if (content.includes('class')) {
      explanation += '\n\nIt defines classes for object-oriented programming.';
    }
    if (content.includes('function') || content.includes('=>')) {
      explanation += '\n\nIt contains functions that perform specific tasks.';
    }
    if (content.includes('export')) {
      explanation += '\n\nIt exports functionality for use in other files.';
    }
    
    return explanation;
  }

  generateContextualResponse(message) {
    if (this.currentContext) {
      return `I see you're working with ${this.currentContext.filename}. ${message}\n\nWould you like me to explain the recent changes or analyze the code for improvements?`;
    }
    
    return `I'm here to help you learn and improve your coding skills! ${message}\n\nFeel free to ask me about:\n• Code explanations\n• Best practices\n• Security reviews\n• Performance optimization\n• Or any programming concept!`;
  }

  explainReasoning(question) {
    return `That's a great "why" question! Understanding the reasoning behind code decisions is crucial for becoming a better developer.\n\nThe reason often relates to:\n• Code maintainability\n• Performance optimization\n• Security best practices\n• Following established patterns\n• Making code more readable\n\nCould you be more specific about what you'd like to understand?`;
  }

  providePerformanceAdvice() {
    if (!this.currentContext || !this.currentContext.content) {
      return "No code available to analyze. Make a change to a file and I'll check for performance improvements!";
    }
    
    const suggestions = this.seniorDev.analyzeCode(this.currentContext.content, this.currentContext.filename);
    const perfSuggestions = suggestions.filter(s => s.type === 'performance');
    
    let response = chalk.bold("⚡ Performance Analysis:\n\n");
    
    if (perfSuggestions.length > 0) {
      perfSuggestions.forEach(suggestion => {
        response += `• ${suggestion.message}\n`;
        if (suggestion.example) {
          response += chalk.gray(`  Example: ${suggestion.example}\n`);
        }
      });
    } else {
      response += chalk.green("✅ No obvious performance issues found!\n");
    }
    
    response += "\n💡 General performance tips:\n";
    response += "• Use async/await for non-blocking operations\n";
    response += "• Implement caching for expensive computations\n";
    response += "• Optimize database queries with indexes\n";
    response += "• Consider lazy loading for large datasets";
    
    return response;
  }

  showContext() {
    if (!this.currentContext) {
      this.addSystemMessage("No file context available. Make a change to see context!");
      return;
    }
    
    const ctx = this.currentContext;
    let message = chalk.bold("📋 Current Context:\n");
    message += `File: ${chalk.cyan(ctx.filename)}\n`;
    message += `Type: ${ctx.type}\n`;
    message += `Extension: ${ctx.ext}\n`;
    
    if (ctx.content) {
      const lines = ctx.content.split('\n').length;
      message += `Lines: ${lines}\n`;
    }
    
    this.addSystemMessage(message);
  }

  async saveConversation() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `chat-transcript-${timestamp}.md`;
    const filepath = path.join(this.projectPath, filename);
    
    let content = '# Claude Code Teacher - Chat Transcript\n\n';
    content += `Date: ${new Date().toLocaleString()}\n\n`;
    content += '---\n\n';
    
    this.chatHistory.forEach(msg => {
      if (msg.role === 'user') {
        content += `**You** (${msg.timestamp}):\n${msg.content}\n\n`;
      } else if (msg.role === 'ai') {
        content += `**Teacher**:\n${msg.content}\n\n`;
      } else {
        content += `*${msg.content}*\n\n`;
      }
    });
    
    try {
      await writeFile(filepath, content);
      this.addSystemMessage(`✅ Conversation saved to ${filename}`);
    } catch (error) {
      this.addSystemMessage(`❌ Failed to save conversation: ${error.message}`);
    }
  }
}

// Export function to start the monitor
export async function startInteractiveChatMonitor(projectPath) {
  const monitor = new InteractiveChatMonitor(projectPath);
  await monitor.start();
  return monitor;
}