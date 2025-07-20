# Claude Code Teacher

Real-time code monitoring tool that teaches you while you code. Features three powerful modes switchable with Shift+Tab: Diff Mode with teaching explanations, Rules Mode for CLAUDE.md compliance, and Chat Mode for interactive Q&A.

## Quick Start

```bash
npx claude-code-teacher
```

Or install globally:

```bash
npm install -g claude-code-teacher
claude-teacher
```

## Features

### 🎓 One Unified Monitor with Three Modes

Switch between modes instantly using **Shift+Tab**:

#### 1. 🔍 **Diff Mode** - Code Changes with Teaching
- Shows exact git diff for every file change
- Provides AI-powered explanations of what changed
- Teaches programming concepts related to the changes
- Helps you understand the "why" behind code modifications

#### 2. 📋 **Rules Mode** - CLAUDE.md Compliance & Best Practices
- Monitors code against your project's CLAUDE.md guidelines
- Real-time security vulnerability detection
- Performance issue identification
- Best practice enforcement
- Architectural pattern checking

#### 3. 💬 **Chat Mode** - Interactive Q&A
- Ask questions while coding
- Get explanations about recent changes
- Learn programming concepts on demand
- Context-aware responses based on your code

## Usage

### Start Monitoring

```bash
npx claude-code-teacher
```

Choose "Start Monitoring" from the menu, and the unified monitor will begin watching your files.

### Mode Switching

Once monitoring starts, press **Shift+Tab** at any time to cycle through the three modes:

```
🎓 Claude Code Teacher
─────────────────────────────────────────────────
🔄 Available Modes:
  • Diff - Code changes with teaching explanations
  • Rules - Monitor CLAUDE.md compliance
  • Chat - Interactive Q&A
─────────────────────────────────────────────────

✨ Switched to: 🔍 Diff Mode - See code changes with teaching explanations
Press Shift+Tab to switch modes • Ctrl+C to exit
```

### Watch a Specific Directory

```bash
npx claude-code-teacher watch /path/to/project
```

### Initialize for Claude Code Integration

```bash
npx claude-code-teacher init
```

## Mode Examples

### Diff Mode Example

```
🔍 Claude Code Teacher - Diff Mode
══════════════════════════════════════════════════
📌 UPDATE #1 | 2:45:32 PM
══════════════════════════════════════════════════
📝 auth-service.js

Changes:
@@ -15,6 +15,8 @@
   const existingUser = await this.userRepository.findByEmail(email);
   if (existingUser) {
     throw new ValidationError('User already exists');
   }
+  
+  // Add rate limiting
+  await this.checkRateLimit(email);

🎓 What this change does:
This change modifies auth-service.js with 2 additions and 0 deletions. 
Key changes: Function implementation changed.

💡 Teaching: This uses async/await for handling asynchronous operations, 
making the code more readable than callbacks or promise chains.
```

### Rules Mode Example

```
📋 Claude Code Teacher - Rules Mode
─────────────────────────────────────────────────
📝 payment-handler.js 2:46:15 PM

🚨 Rule Violations:
  🚨 Hardcoded secrets detected! Use environment variables instead.
     Line 5
  🚨 SQL injection vulnerability! Use parameterized queries.
     Line 12

💡 Suggestions:
  💡 Use const/let instead of var for better scoping.
  💡 Consider adding "use strict" for safer JavaScript.

🧙 Senior Dev Suggestions:
  ⚠️ Synchronous file operations block the event loop. Use async versions.
```

### Chat Mode Example

```
🎓 Claude Code Teacher - Chat Mode
─────────────────────────────────────────────────
📁 Recent Changes:
  📝 auth-service.js 2:45:32 PM
  ✅ auth-service.test.js 2:46:15 PM

💬 Chat:
─────────────────────────────────────────────────
You: What changed in the auth service?

Teacher: File auth-service.js was modified.

This change modifies auth-service.js with 2 additions and 0 deletions.
Key changes: Function implementation changed.

💡 Teaching: This uses async/await for handling asynchronous operations,
making the code more readable than callbacks or promise chains.

You: What is rate limiting?

Teacher: Rate limiting is like a bouncer at a club - it controls how many 
requests someone can make in a given time period. It prevents attackers 
from trying thousands of passwords quickly!
─────────────────────────────────────────────────
💬 
```

## CLAUDE.md Integration

The Rules Mode automatically reads your project's `CLAUDE.md` file to understand:
- Project-specific commands
- Architecture patterns to enforce
- Security requirements
- Performance guidelines

If no CLAUDE.md exists, it uses sensible defaults for security and best practices.

## Chat Commands

In Chat Mode, you can use these commands:
- `/help` - Show available commands
- `/clear` - Clear chat history
- `/quit` - Exit the program

## Development

```bash
# Clone the repo
git clone https://github.com/yourusername/claude-code-teacher.git
cd claude-code-teacher

# Install dependencies
npm install

# Run locally
npm start
```

## License

MIT