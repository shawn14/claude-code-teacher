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

- 🎓 **NEW! Complete Companion Mode** - Your ultimate developer companion with entertainment, productivity, wellness, and learning features!
- 🎮 **Entertainment Hub** - Coding trivia, developer jokes, code golf challenges, fun facts, and ASCII animations
- 🍅 **Pomodoro Timer** - Built-in productivity timer with focus mode and daily goals
- 💪 **Wellness Companion** - Health reminders, exercises, mood tracking, and ergonomic tips
- 🦆 **Rubber Duck Debugging** - Multiple duck personalities to help you solve problems by talking through them
- 🏆 **Gamification** - XP system, achievements, daily streaks, and level progression
- ✨ **Unified Monitor with Mode Switching** - Press Shift+Tab to instantly switch between Chat, Diff, Clean, and Enhanced modes!
- 💬 **Interactive Chat Mode** - Chat with your AI teacher while coding! Ask questions, get explanations, and learn in real-time
- 🧙 **AI-Powered Senior Dev Advisor** - Catches security vulnerabilities, performance issues, and suggests best practices
- 🆕 **Diff Monitor** - Shows exact code changes with git diff integration
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

## Complete Companion Mode (NEW!)

The new Companion Mode transforms Claude Code Teacher into your ultimate developer companion - mentor, entertainer, wellness coach, and productivity partner all in one!

```
╔═══════════════════════════════════════════════════╗
║      🎓 Claude Code Teacher - Companion Mode       ║
║         Your AI Coding Companion & Friend          ║
╚═══════════════════════════════════════════════════╝

Good afternoon, Developer! 👋
Level 12 • 850 XP • 7 day streak

📆 Daily Tip: Regular breaks increase productivity by 40%!

🎯 What would you like to do?

1. 🍅 Pomodoro Timer
2. 🎮 Entertainment
3. 🦆 Rubber Duck Debugging
4. 💪 Wellness Check
5. 📊 Daily Standup
6. 🎯 Focus Mode
7. 📈 View Stats
8. ⚙️  Settings
9. 🚺 Exit

Choice (1-9): 
```

### Entertainment Features:
- **🎯 Coding Trivia**: Test your programming knowledge with fun questions
- **😄 Developer Jokes**: Curated programming humor to brighten your day
- **⛳ Code Golf**: Mini challenges to write the shortest code possible
- **🤓 Fun Facts**: Interesting programming history and trivia
- **🎨 ASCII Animations**: Fun visual elements during breaks

### Productivity Suite:
- **🍅 Pomodoro Timer**: 25-minute focus sessions with smart break reminders
- **🎯 Focus Mode**: Distraction-free environment with helpful tips
- **📊 Daily Standup**: Track what you did, doing, and blockers
- **🔥 Streak Tracking**: Maintain daily coding momentum

### Wellness Companion:
- **💧 Hydration Reminders**: Stay healthy with regular water break alerts
- **👀 Eye Care**: 20-20-20 rule reminders to prevent strain
- **🏃 Exercise Breaks**: Desk exercises and stretches for developers
- **🧘 Mental Health**: Mood tracking and stress relief techniques
- **🤗 Posture Checks**: Ergonomic reminders for better health

### Rubber Duck Debugging:
- **🦆 Multiple Personalities**: Classic, Detective, Zen, Pirate, or Scientist ducks
- **💬 Smart Responses**: Context-aware replies based on your problem description
- **💡 Breakthrough Detection**: Recognizes when you've solved the problem
- **📈 Session Analytics**: Track your debugging effectiveness

### Gamification:
- **🏆 XP System**: Earn experience points for productive activities
- **🏅 Achievements**: Unlock badges for milestones and goals
- **⬆️ Level Progression**: Watch your developer level grow over time
- **🔥 Daily Streaks**: Maintain momentum with streak tracking

## Unified Monitor with Mode Switching

The new unified monitor lets you switch between different monitoring modes on the fly using **Shift+Tab**:

```
🎓 Claude Code Teacher - Unified Monitor
Switch between modes with Shift+Tab
────────────────────────────────────────────────────────────

🔄 Available Modes:
  • Chat - Interactive Q&A while coding
  • Diff - See exact code changes
  • Clean - Recent updates with AI analysis
  • Enhanced - Monitor everything
────────────────────────────────────────────────────────────

✨ Switched to: 💬 Interactive Chat Mode - Ask questions while coding
Press Shift+Tab to switch modes • Ctrl+C to exit
```

### Mode Switching:
- **Shift+Tab** - Cycle through all monitoring modes instantly
- **No restart needed** - Switch modes while keeping your file watch active
- **Context preserved** - Your chat history and file updates stay available

### Available Modes:
1. **Chat Mode** (💬) - Interactive Q&A with your AI teacher
2. **Diff Mode** (🔍) - See exact git diffs for every change
3. **Clean Mode** (📝) - Focused view with AI analysis
4. **Enhanced Mode** (🚀) - Comprehensive monitoring of everything

## Interactive Chat Mode

The new interactive chat mode lets you have real-time conversations with your AI teacher while monitoring code changes:

```
🎓 Claude Code Teacher - Interactive Chat
────────────────────────────────────────────────────────────

📁 Recent File Changes:
  📝 Modified: auth-service.js 2:45:32 PM
  ✅ Created: auth-service.test.js 2:46:15 PM

💬 Chat:
────────────────────────────────────────────────────────────

You (2:46:20 PM): What changed in the auth service?

Teacher: The last change was in auth-service.js:

Here's what changed:
```diff
@@ -15,6 +15,8 @@
       const existingUser = await this.userRepository.findByEmail(userData.email);
       if (existingUser) {
         throw new ValidationError('User already exists');
       }
+      
+      // Add rate limiting check
+      await this.checkRateLimit(userData.email);
```

This change added rate limiting to prevent brute force attacks. It's a security best practice!

You (2:46:45 PM): How does rate limiting work?

Teacher: Rate limiting is like a bouncer at a club - it controls how many requests someone can make in a given time period. Here's how it works:

1. Track requests per user/IP
2. Set a limit (e.g., 5 login attempts per minute)
3. Block or delay requests that exceed the limit
4. Reset the count after the time window

This prevents attackers from trying thousands of passwords quickly!

────────────────────────────────────────────────────────────
Type your question or /help for commands
💬 
```

### Chat Commands:
- `/help` - Show available commands
- `/clear` - Clear chat history
- `/save` - Save conversation to file
- `/context` - Show current file context
- `/quit` - Exit the program

### You can ask about:
- Recent code changes: "What changed in the last update?"
- Code explanations: "Explain this function"
- Best practices: "How can I improve this code?"
- Concepts: "What is async/await?"
- Security: "Are there any security issues?"
- Performance: "How can I optimize this?"

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