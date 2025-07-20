# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Run the main application
npm start

# Run specific features
npm run serve        # Start MCP server
npm run dialogue     # Run demo dialogue
npm run bridge       # Start communication bridge

# Run without installation
npx vibe-code

# Watch a directory
npx vibe-code watch /path/to/project

# Initialize in current directory  
npx vibe-code init
```

## Architecture Overview

Vibe Code is a modular AI-powered teaching system that monitors code changes and provides real-time explanations. The architecture consists of:

### Core Components

1. **CLI Entry Point** (`bin/vibe-code.js`): Commander-based CLI that provides interactive menus and command routing. Main commands: init, watch, serve, dialogue, companion.

2. **File Monitoring System** (`src/monitor.js`): Uses chokidar to watch file changes and trigger appropriate actions. Coordinates between different monitor types.

3. **Monitor Variants**: Multiple specialized monitors that can be switched via Shift+Tab:
   - `unified-monitor.js`: Mode-switching monitor allowing real-time transitions
   - `diff-monitor.js`: Shows git diff output for changes
   - `clean-monitor.js`: Focused view with AI analysis
   - `interactive-chat-monitor.js`: Real-time Q&A during coding
   - `enhanced-monitor.js`: Comprehensive monitoring of all project activities

4. **Teaching Engine** (`src/explainer.js`, `src/teacher-agent.js`): Generates contextual explanations based on code changes, concepts detected, and selected teaching mode.

5. **Companion System** (`src/companion-mode.js`): Entertainment, wellness, productivity features including:
   - Pomodoro timer with focus tracking
   - Rubber duck debugging with multiple personalities
   - Gamification with XP and achievements
   - Wellness reminders and exercises

6. **Senior Dev Advisor** (`src/senior-dev-advisor.js`, `src/ai-powered-advisor.js`): Analyzes code for security vulnerabilities, performance issues, and best practices. Provides framework-specific recommendations.

7. **MCP Integration** (`src/mcp-server.js`, `src/claude-code-connector.js`): Model Context Protocol server for Claude Code integration, enabling the teaching system to work as a Claude Code extension.

### Key Design Patterns

- **Event-Driven Architecture**: File changes trigger events that flow through the monitoring system to generate explanations
- **Strategy Pattern**: Different monitor types and teaching modes implement common interfaces
- **Observer Pattern**: Multiple components can listen to file change events
- **Modular Design**: Each feature (monitoring, teaching, companion) is self-contained and can be used independently

### Data Flow

1. File changes detected by chokidar in monitor.js
2. Change events passed to active monitor variant
3. Monitor analyzes changes and extracts concepts
4. Teaching engine generates appropriate explanation
5. Output displayed with formatting and color coding
6. Optional: Senior dev advisor adds security/performance insights

### Integration Points

- **Claude Code**: Via MCP server on port 3000 (configurable)
- **Git**: For diff generation and version control monitoring
- **File System**: Direct file watching and reading
- **Terminal**: Interactive CLI with color output and animations