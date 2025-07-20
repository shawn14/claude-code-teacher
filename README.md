# Claude Code Teacher

An AI-powered teaching system that monitors your project and explains code changes, patterns, and best practices in real-time. Features a senior developer advisor that catches security issues, suggests performance improvements, and enforces best practices.

## Quick Start

No installation needed! Just run:

```bash
npx claude-code-teacher
```

Or install globally:

```bash
npm install -g claude-code-teacher
claude-teacher
```

## Features

- 🧙 **AI-Powered Senior Dev Advisor** - Catches security vulnerabilities, performance issues, and suggests best practices
- 👀 **Clean Monitor** - Shows only recent updates with code snippets and detailed explanations
- 🛡️ **Security Analysis** - Detects SQL injection, hardcoded secrets, XSS vulnerabilities
- ⚡ **Performance Insights** - Identifies N+1 queries, synchronous operations, missing indexes
- 🏗️ **Architecture Recommendations** - Suggests better patterns and approaches
- 📚 **Framework-Specific Advice** - Tailored suggestions for Express, React, Mongoose, and more
- 🎓 **Real-time Teaching** - Learn as you code with instant explanations
- 🔍 **Independent Operation** - Works with any editor or tool, not just Claude Code

## Usage

### Interactive Mode (Recommended)

```bash
npx claude-code-teacher
```

Choose from:
- Real-time explanations
- Learning mode (with quizzes)
- Architecture overview
- Debug helper
- Configure Claude Code

### Watch a Directory

```bash
npx claude-code-teacher watch /path/to/project
```

### Start MCP Server

```bash
npx claude-code-teacher serve
```

### Initialize in Current Directory

```bash
npx claude-code-teacher init
```

## How It Works

Claude Code Teacher monitors file changes made by Claude Code and provides contextual explanations:

1. **File Monitoring** - Watches for code changes in your project
2. **Change Analysis** - Detects what type of change was made
3. **Concept Extraction** - Identifies programming concepts being used
4. **Explanation Generation** - Creates appropriate explanations based on mode
5. **Real-time Delivery** - Shows explanations as changes happen

## Explanation Modes

### Enhanced Monitor (NEW! 🚀)
The most powerful mode - monitors EVERYTHING in your project:
- File changes with instant explanations
- Git commits and version control
- Test execution and results
- Build processes
- Automatic guideline checking
- Security warnings

### Coding Mentor Mode
Get friendly, conversational explanations of code changes.

### Learning Mode  
Includes quizzes and exercises to reinforce concepts.

### Architecture Mode
Understand how changes fit into the overall project structure.

### Debug Mode
Get debugging tips and common issue checklists.

## Example Output

```
=================================================
📝 UPDATE #3 | 2:45:32 PM
=================================================

FILE: payment-handler.js (MODIFIED)

CODE SNIPPET:
```javascript
var stripe = require('stripe')('sk_test_123456789'); // Hardcoded API key!

function processPayment(req, res) {
  var amount = req.body.amount;
  // Direct database query with user input
  db.query('INSERT INTO payments VALUES (' + amount + ', "' + cardNumber + '")',
```

EXPLANATION:
Payment processing handler with multiple critical security issues.

🧙 Senior Dev Suggestions:

🚨 CRITICAL SECURITY ISSUES:
   • 🚨 HARDCODED API KEY DETECTED! This is a critical security vulnerability. Move to environment variables immediately!
     Fix: Use parameterized queries: db.query("INSERT INTO payments VALUES (?, ?)", [amount, cardNumber])
   • 🚨 CRITICAL: SQL INJECTION VULNERABILITY! User input is being concatenated directly into SQL!

⚠️  Important considerations:
   • Use const or let instead of var. Var has function scope which can lead to bugs.
   • This looks like callback hell. Consider using async/await for cleaner code.

💡 Suggestions:
   • Synchronous file operations block the event loop. Use async versions.

💪 "Good code is like a good joke - it needs no explanation"
```

## Configuration

The teacher automatically configures itself to work with Claude Code. No manual setup required!

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