import path from 'path';
import { GuidelinesMonitor } from './guidelines-monitor.js';

export class TeachingEngine {
  constructor(mode = 'realtime', projectPath = process.cwd()) {
    this.mode = mode;
    this.projectPath = projectPath;
    this.guidelinesMonitor = null;
    this.explanationTemplates = {
      realtime: this.realtimeExplanation.bind(this),
      learning: this.learningExplanation.bind(this),
      architecture: this.architectureExplanation.bind(this),
      debug: this.debugExplanation.bind(this)
    };
    
    // Initialize guidelines monitor
    this.initializeGuidelines();
  }
  
  async initializeGuidelines() {
    this.guidelinesMonitor = new GuidelinesMonitor(this.projectPath);
    await this.guidelinesMonitor.initialize();
    
    const rules = this.guidelinesMonitor.getActiveRules();
    if (rules.length > 0) {
      console.log(`\n📖 Loaded ${rules.length} guidelines from project documentation\n`);
    }
  }

  async explainChange(changeData) {
    const { filePath, oldContent, newContent, diff, projectContext } = changeData;
    
    // Detect type of change
    const changeType = this.detectChangeType(oldContent, newContent);
    
    // Get language-specific insights
    const language = this.detectLanguage(filePath);
    
    // Generate explanation based on mode
    const explainFn = this.explanationTemplates[this.mode] || this.realtimeExplanation;
    
    return explainFn({
      changeType,
      language,
      filePath,
      diff,
      oldContent,
      newContent,
      projectContext,
      concepts: this.extractConcepts(newContent, language)
    });
  }

  detectChangeType(oldContent, newContent) {
    const oldLines = oldContent.split('\n').length;
    const newLines = newContent.split('\n').length;
    
    if (oldLines === 0) return 'file_created';
    if (newLines === 0) return 'file_deleted';
    
    const addedLines = newLines - oldLines;
    
    if (addedLines > 10) return 'major_addition';
    if (addedLines > 0) return 'minor_addition';
    if (addedLines < -10) return 'major_deletion';
    if (addedLines < 0) return 'minor_deletion';
    
    return 'modification';
  }

  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'react',
      '.ts': 'typescript',
      '.tsx': 'react-typescript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss'
    };
    
    return languageMap[ext] || 'unknown';
  }

  extractConcepts(content, language) {
    const concepts = [];
    
    // JavaScript/TypeScript concepts
    if (['javascript', 'typescript', 'react', 'react-typescript'].includes(language)) {
      if (content.includes('async') || content.includes('await')) {
        concepts.push({
          name: 'Asynchronous Programming',
          description: 'Using async/await for handling promises'
        });
      }
      
      if (content.includes('useState') || content.includes('useEffect')) {
        concepts.push({
          name: 'React Hooks',
          description: 'Managing state and side effects in functional components'
        });
      }
      
      if (content.match(/class\s+\w+/)) {
        concepts.push({
          name: 'Object-Oriented Programming',
          description: 'Using classes for code organization'
        });
      }
      
      if (content.includes('.map(') || content.includes('.filter(') || content.includes('.reduce(')) {
        concepts.push({
          name: 'Functional Programming',
          description: 'Using array methods for data transformation'
        });
      }
    }
    
    return concepts;
  }

  realtimeExplanation(data) {
    const { changeType, language, filePath, concepts, diff, oldContent, newContent } = data;
    const fileName = path.basename(filePath);
    
    // Conversational greetings
    const greetings = [
      "Hey there! 👋 Let me explain what just happened...",
      "Oh, interesting move! Here's what's going on...",
      "Alright, let's break this down together...",
      "Perfect timing! I was just watching this change...",
      "Great! Let me walk you through this..."
    ];
    
    let explanation = `${greetings[Math.floor(Math.random() * greetings.length)]}\n\n`;
    
    // Show the actual code change
    if (changeType !== 'file_created' && diff) {
      explanation += `📋 **Here's what changed in ${fileName}:**\n\n`;
      
      // For better readability, show the diff in a cleaner format
      const diffLines = diff.split('\n');
      let showingDiff = false;
      let diffContent = '';
      let lineCount = 0;
      
      for (const line of diffLines) {
        if (line.startsWith('@@')) {
          showingDiff = true;
          continue;
        }
        if (showingDiff && lineCount < 20) {
          if (line.startsWith('+') && !line.startsWith('+++')) {
            diffContent += `+ ${line.substring(1)}\n`;
            lineCount++;
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            diffContent += `- ${line.substring(1)}\n`;
            lineCount++;
          } else if (line.length > 0 && !line.startsWith('\\')) {
            diffContent += `  ${line}\n`;
            lineCount++;
          }
        }
      }
      
      if (diffContent) {
        explanation += '```diff\n' + diffContent;
        if (lineCount >= 20) {
          explanation += '// ... more changes below ...\n';
        }
        explanation += '```\n\n';
      }
      
      // Add detailed line-by-line explanation
      explanation += this.generateDetailedCodeExplanation(newContent, language, filePath);
      
    } else if (changeType === 'file_created') {
      explanation += `📄 **New file created: ${fileName}**\n\n`;
      explanation += '```' + language + '\n';
      // Show first 20 lines of new file
      const lines = newContent.split('\n').slice(0, 20);
      explanation += lines.join('\n');
      if (newContent.split('\n').length > 20) {
        explanation += '\n// ... more code below ...';
      }
      explanation += '\n```\n\n';
      
      // Add detailed explanation for new files too
      explanation += this.generateDetailedCodeExplanation(newContent, language, filePath);
    }
    
    // Human-like file change explanations
    switch (changeType) {
      case 'file_created':
        explanation += `So Claude just created a brand new ${language} file called "${fileName}". `;
        explanation += `This is like starting with a blank canvas - exciting! `;
        if (language === 'javascript') {
          explanation += `\n\n💡 **Quick tip**: In JavaScript, every file is its own module. This means variables defined here won't accidentally conflict with other files. Pretty neat, right?`;
        }
        break;
        
      case 'major_addition':
        explanation += `Whoa! Claude just added quite a bit of code to "${fileName}". `;
        explanation += `This looks like a significant feature being implemented. Let me see what's new here... `;
        explanation += `\n\n🤔 **Here's a thought**: When you see big chunks of code being added like this, it's often a complete feature or component. Take a moment to read through it and understand the overall purpose before diving into the details.`;
        break;
        
      case 'minor_addition':
        explanation += `Claude made a small but probably important change to "${fileName}". `;
        explanation += `Sometimes the smallest changes have the biggest impact! `;
        break;
        
      case 'modification':
        explanation += `Claude just tweaked some existing code in "${fileName}". `;
        explanation += `These kinds of modifications usually mean we're refining or fixing something. `;
        break;
    }
    
    // Add conversational concept explanations
    if (concepts.length > 0) {
      explanation += `\n\n🎓 **Teaching moment!** I noticed Claude used some interesting programming concepts here:\n\n`;
      
      concepts.forEach((concept, index) => {
        explanation += `${index + 1}. **${concept.name}** - `;
        
        // Add human-friendly explanations
        const friendlyExplanations = {
          'Asynchronous Programming': `Think of this like ordering food at a restaurant. Instead of standing at the counter waiting (blocking), you get a number and can do other things until your order is ready. That's what async/await does for our code!`,
          
          'React Hooks': `Hooks are like little helpers that give your components superpowers. useState lets you remember things, and useEffect lets you sync with the outside world. It's React's way of making functional components as powerful as class components.`,
          
          'Object-Oriented Programming': `This is like creating a blueprint (class) for building things. Once you have the blueprint, you can create as many instances as you want, each with their own unique properties but sharing the same basic structure.`,
          
          'Functional Programming': `This is all about treating functions like LEGO blocks - you can combine them, pass them around, and build complex things from simple pieces. The map/filter/reduce trio is like having a Swiss Army knife for arrays!`
        };
        
        explanation += friendlyExplanations[concept.name] || concept.description;
        explanation += '\n\n';
      });
      
      // Add a learning suggestion
      const suggestions = [
        "Try modifying this code yourself to see what happens!",
        "Can you think of another way to achieve the same result?",
        "What would happen if you changed one of these values?",
        "This is a great pattern to remember for your own projects.",
        "I'd recommend playing around with this concept in a small test file."
      ];
      
      explanation += `💪 **Your turn**: ${suggestions[Math.floor(Math.random() * suggestions.length)]}`;
    }
    
    // Add encouraging messages
    const encouragements = [
      "\n\n🌟 You're doing great following along!",
      "\n\n🚀 Keep watching - this is how real developers work!",
      "\n\n✨ Every expert was once a beginner. You're on the right path!",
      "\n\n🎯 Understanding these changes is a huge step in your coding journey!",
      "\n\n🔥 This is exactly how you learn - by seeing real code in action!"
    ];
    
    explanation += encouragements[Math.floor(Math.random() * encouragements.length)];
    
    // Check for guideline violations
    if (this.guidelinesMonitor) {
      const violations = this.guidelinesMonitor.checkViolations(newContent, filePath);
      if (violations.length > 0) {
        const violationReport = this.guidelinesMonitor.formatViolationReport(violations);
        explanation += '\n\n' + violationReport;
      }
    }
    
    return explanation;
  }

  learningExplanation(data) {
    const { changeType, language, concepts } = data;
    
    let explanation = this.realtimeExplanation(data);
    
    // Add learning prompts
    explanation += '\n\n**🎓 Learning Moment:**\n';
    
    if (concepts.length > 0) {
      const concept = concepts[0];
      explanation += `\nLet's explore "${concept.name}":\n`;
      explanation += `\n💭 **Quick Quiz**: ${this.generateQuizQuestion(concept)}\n`;
      explanation += `\n💡 **Try This**: ${this.generateExercise(concept)}\n`;
    }
    
    return explanation;
  }

  architectureExplanation(data) {
    const { filePath, projectContext } = data;
    
    let explanation = `🏗️ **Architecture Impact**\n\n`;
    
    explanation += `This change affects: ${path.relative(process.cwd(), filePath)}\n\n`;
    
    if (projectContext.framework) {
      explanation += `**Framework**: ${projectContext.framework}\n`;
      explanation += `**Project Type**: ${projectContext.type}\n\n`;
    }
    
    explanation += this.generateArchitectureInsights(filePath, projectContext);
    
    return explanation;
  }

  debugExplanation(data) {
    const { changeType, language, filePath } = data;
    
    let explanation = `🐛 **Debug Helper**\n\n`;
    
    explanation += `Monitoring: ${path.basename(filePath)}\n\n`;
    
    explanation += '**Common Issues to Check:**\n';
    explanation += this.generateDebugChecklist(language);
    
    return explanation;
  }

  generateQuizQuestion(concept) {
    const quizzes = {
      'Asynchronous Programming': 'What is the main advantage of using async/await over callbacks?',
      'React Hooks': 'When should you use useEffect in a React component?',
      'Object-Oriented Programming': 'What is the difference between a class and an instance?',
      'Functional Programming': 'Why are map/filter/reduce considered "pure" functions?'
    };
    
    return quizzes[concept.name] || 'What did you learn from this code change?';
  }

  generateExercise(concept) {
    const exercises = {
      'Asynchronous Programming': 'Convert a callback-based function to use async/await',
      'React Hooks': 'Create a custom hook that manages form state',
      'Object-Oriented Programming': 'Add a new method to the class that was just created',
      'Functional Programming': 'Rewrite the code using only array methods, no loops'
    };
    
    return exercises[concept.name] || 'Modify the code to add a new feature';
  }

  generateArchitectureInsights(filePath, context) {
    let insights = '';
    
    if (filePath.includes('/components/')) {
      insights += '- This is a UI component, part of the presentation layer\n';
    }
    
    if (filePath.includes('/services/') || filePath.includes('/api/')) {
      insights += '- This handles business logic or external API calls\n';
    }
    
    if (filePath.includes('/models/') || filePath.includes('/schemas/')) {
      insights += '- This defines data structures used throughout the app\n';
    }
    
    if (filePath.includes('/utils/') || filePath.includes('/helpers/')) {
      insights += '- This contains reusable utility functions\n';
    }
    
    return insights || '- Consider how this file fits into the overall architecture\n';
  }

  generateDebugChecklist(language) {
    const checklists = {
      javascript: `- Check for undefined variables
- Verify async functions are awaited
- Look for missing error handling
- Check console for runtime errors\n`,
      python: `- Check indentation (spaces vs tabs)
- Verify imports are correct
- Look for type mismatches
- Check for missing colons\n`,
      default: `- Check syntax errors
- Verify variable names
- Look for logic errors
- Test edge cases\n`
    };
    
    return checklists[language] || checklists.default;
  }

  async explainNewFile(filePath) {
    const language = this.detectLanguage(filePath);
    const fileName = path.basename(filePath);
    
    const intros = [
      `Hey! I see we've got a fresh new file here! 🎉`,
      `Ooh, a blank slate! This is exciting! ✨`,
      `Alright, new file alert! Let's see what we're building... 🚀`,
      `Fresh file coming through! Time to create something awesome! 💫`
    ];
    
    let explanation = `${intros[Math.floor(Math.random() * intros.length)]}\n\n`;
    
    explanation += `Claude just created "${fileName}" - a ${language} file. `;
    
    const purpose = this.guessPurpose(filePath);
    explanation += `Based on the name, this looks like it'll be ${purpose}. `;
    
    if (fileName.includes('test')) {
      explanation += `\n\n🧪 **Testing tip**: Writing tests might seem boring, but think of them as your code's safety net. They catch bugs before your users do! Plus, they're actually pretty fun once you get the hang of it.`;
    } else if (fileName.includes('component')) {
      explanation += `\n\n🧩 **Component wisdom**: Components are like LEGO blocks for your UI. Keep them small, focused, and reusable. Your future self will thank you!`;
    }
    
    explanation += `\n\n📝 **What to expect next**:\n${this.getStarterTips(language)}`;
    
    // Add a fun fact or encouragement
    const funFacts = [
      "\n\n🤓 **Fun fact**: Did you know most developers spend more time reading code than writing it? That's why clear, well-organized files like this are so important!",
      "\n\n💭 **Developer secret**: Even experienced devs start with empty files. The magic happens one line at a time!",
      "\n\n🎨 **Pro tip**: Good file names (like this one) are half the battle. They tell a story about what the code does!",
      "\n\n🌱 **Growth mindset**: Every amazing app started with an empty file just like this one!"
    ];
    
    explanation += funFacts[Math.floor(Math.random() * funFacts.length)];
    
    return explanation;
  }

  guessPurpose(filePath) {
    const filename = path.basename(filePath).toLowerCase();
    
    if (filename.includes('test') || filename.includes('spec')) {
      return 'test cases for validating functionality';
    }
    if (filename.includes('component')) {
      return 'a reusable UI component';
    }
    if (filename.includes('service')) {
      return 'business logic or API integration';
    }
    if (filename.includes('model')) {
      return 'data structure definitions';
    }
    if (filename.includes('config')) {
      return 'configuration settings';
    }
    
    return 'implementation logic';
  }

  generateDetailedCodeExplanation(code, language, filePath) {
    let explanation = '\n📖 **Let me break down this code for you:**\n\n';
    
    // Parse the code into logical sections
    const sections = this.parseCodeSections(code, language);
    
    sections.forEach((section, index) => {
      if (section.type === 'import') {
        explanation += `**Imports Section:**\n`;
        explanation += `${section.content}\n`;
        explanation += `👉 These bring in external functionality:\n`;
        section.details.forEach(detail => {
          explanation += `   - ${detail}\n`;
        });
        explanation += '\n';
      }
      
      if (section.type === 'function') {
        explanation += `**Function: \`${section.name}\`**\n`;
        explanation += '```' + language + '\n' + section.content + '\n```\n';
        explanation += `🔍 What this function does:\n`;
        explanation += `   - **Purpose**: ${section.purpose}\n`;
        explanation += `   - **Parameters**: ${section.parameters}\n`;
        explanation += `   - **Returns**: ${section.returns}\n`;
        
        if (section.keyPoints.length > 0) {
          explanation += `   - **Key points**:\n`;
          section.keyPoints.forEach(point => {
            explanation += `     • ${point}\n`;
          });
        }
        explanation += '\n';
      }
      
      if (section.type === 'class') {
        explanation += `**Class: \`${section.name}\`**\n`;
        explanation += `🏗️ This is a blueprint for creating ${section.purpose}\n`;
        explanation += `   - **Constructor**: ${section.constructor}\n`;
        explanation += `   - **Methods**: ${section.methods.join(', ')}\n`;
        explanation += `   - **Usage**: ${section.usage}\n\n`;
      }
      
      if (section.type === 'variable') {
        explanation += `**Variables & Constants:**\n`;
        section.items.forEach(item => {
          explanation += `   - \`${item.name}\`: ${item.description}\n`;
        });
        explanation += '\n';
      }
    });
    
    // Add code flow explanation
    explanation += this.explainCodeFlow(code, language);
    
    return explanation;
  }

  parseCodeSections(code, language) {
    const sections = [];
    const lines = code.split('\n');
    
    // JavaScript/TypeScript parsing
    if (['javascript', 'typescript', 'react', 'react-typescript'].includes(language)) {
      // Find imports
      const importLines = lines.filter(line => line.trim().startsWith('import') || line.trim().startsWith('const') && line.includes('require'));
      if (importLines.length > 0) {
        const importDetails = importLines.map(line => {
          if (line.includes('react')) return 'React for building UI components';
          if (line.includes('express')) return 'Express web framework for creating servers';
          if (line.includes('fs')) return 'File system module for reading/writing files';
          if (line.includes('./') || line.includes('../')) return 'Local module from this project';
          return 'External dependency';
        });
        
        sections.push({
          type: 'import',
          content: importLines.join('\n'),
          details: importDetails
        });
      }
      
      // Find functions
      const functionRegex = /(async\s+)?function\s+(\w+)|const\s+(\w+)\s*=\s*(async\s*)?\([^)]*\)\s*=>/g;
      let match;
      while ((match = functionRegex.exec(code)) !== null) {
        const functionName = match[2] || match[3];
        const isAsync = !!(match[1] || match[4]);
        
        // Extract function body
        const startIndex = match.index;
        let endIndex = code.indexOf('\n}', startIndex);
        if (endIndex === -1) endIndex = code.indexOf('\n\n', startIndex);
        if (endIndex === -1) endIndex = code.length;
        
        const functionContent = code.substring(startIndex, endIndex + 2);
        
        sections.push({
          type: 'function',
          name: functionName,
          content: functionContent,
          purpose: this.guessFunctionPurpose(functionName, functionContent),
          parameters: this.extractParameters(functionContent),
          returns: this.guessReturnType(functionContent),
          keyPoints: this.extractKeyPoints(functionContent, isAsync)
        });
      }
      
      // Find classes
      const classRegex = /class\s+(\w+)/g;
      while ((match = classRegex.exec(code)) !== null) {
        const className = match[1];
        const classStart = match.index;
        let classEnd = code.indexOf('\n}', classStart);
        const classContent = code.substring(classStart, classEnd + 2);
        
        sections.push({
          type: 'class',
          name: className,
          purpose: this.guessClassPurpose(className),
          constructor: this.hasConstructor(classContent) ? 'Initializes instance properties' : 'No explicit constructor',
          methods: this.extractMethods(classContent),
          usage: `Create instances with: new ${className}()`
        });
      }
      
      // Find top-level variables
      const varRegex = /^(const|let|var)\s+(\w+)\s*=\s*([^;]+);?$/gm;
      const variables = [];
      while ((match = varRegex.exec(code)) !== null) {
        if (!match[0].includes('function') && !match[0].includes('=>')) {
          variables.push({
            name: match[2],
            description: this.guessVariablePurpose(match[2], match[3])
          });
        }
      }
      
      if (variables.length > 0) {
        sections.push({
          type: 'variable',
          items: variables
        });
      }
    }
    
    return sections;
  }

  guessFunctionPurpose(name, content) {
    // Common patterns
    if (name.startsWith('get')) return 'Retrieves or fetches data';
    if (name.startsWith('set')) return 'Sets or updates a value';
    if (name.startsWith('is')) return 'Checks a condition (returns true/false)';
    if (name.startsWith('has')) return 'Checks if something exists';
    if (name.startsWith('create')) return 'Creates a new instance or resource';
    if (name.startsWith('update')) return 'Modifies existing data';
    if (name.startsWith('delete') || name.startsWith('remove')) return 'Removes data or resources';
    if (name.startsWith('validate')) return 'Validates data or inputs';
    if (name.startsWith('calculate')) return 'Performs calculations';
    if (name.startsWith('fetch')) return 'Retrieves data from external source';
    if (name.includes('handle')) return 'Handles events or actions';
    if (content.includes('console.log')) return 'Displays output or debugging info';
    if (content.includes('addEventListener')) return 'Sets up event handling';
    
    return 'Performs specific logic';
  }

  extractParameters(functionContent) {
    const paramMatch = functionContent.match(/\(([^)]*)\)/);
    if (!paramMatch || !paramMatch[1].trim()) return 'No parameters';
    
    const params = paramMatch[1].split(',').map(p => p.trim());
    return params.join(', ') + ' - inputs to the function';
  }

  guessReturnType(functionContent) {
    if (functionContent.includes('return null')) return 'null (nothing)';
    if (functionContent.includes('return true') || functionContent.includes('return false')) return 'boolean (true/false)';
    if (functionContent.includes('return {')) return 'object with data';
    if (functionContent.includes('return [')) return 'array of values';
    if (functionContent.includes('return') && functionContent.match(/return ['"`]/)) return 'string value';
    if (functionContent.includes('return') && functionContent.match(/return \d/)) return 'number value';
    if (!functionContent.includes('return')) return 'nothing (void)';
    
    return 'calculated value';
  }

  extractKeyPoints(functionContent, isAsync) {
    const points = [];
    
    if (isAsync) points.push('Uses async/await for asynchronous operations');
    if (functionContent.includes('try')) points.push('Has error handling with try-catch');
    if (functionContent.includes('if')) points.push('Contains conditional logic');
    if (functionContent.includes('for') || functionContent.includes('while')) points.push('Uses loops for iteration');
    if (functionContent.includes('.map') || functionContent.includes('.filter')) points.push('Uses functional array methods');
    if (functionContent.includes('fetch') || functionContent.includes('axios')) points.push('Makes HTTP requests');
    if (functionContent.includes('setState')) points.push('Updates React component state');
    if (functionContent.includes('setTimeout') || functionContent.includes('setInterval')) points.push('Uses timers for delayed execution');
    
    return points;
  }

  guessClassPurpose(className) {
    if (className.includes('Component')) return 'UI components';
    if (className.includes('Service')) return 'business logic services';
    if (className.includes('Model')) return 'data models';
    if (className.includes('Controller')) return 'request handlers';
    if (className.includes('Manager')) return 'resource management';
    if (className.includes('Helper') || className.includes('Util')) return 'utility functions';
    
    return className.replace(/([A-Z])/g, ' $1').trim().toLowerCase() + ' objects';
  }

  hasConstructor(classContent) {
    return classContent.includes('constructor(');
  }

  extractMethods(classContent) {
    const methods = [];
    const methodRegex = /(\w+)\s*\([^)]*\)\s*{/g;
    let match;
    
    while ((match = methodRegex.exec(classContent)) !== null) {
      if (match[1] !== 'constructor') {
        methods.push(match[1]);
      }
    }
    
    return methods.length > 0 ? methods : ['No methods defined'];
  }

  guessVariablePurpose(name, value) {
    if (name.toUpperCase() === name) return 'Constant value (never changes)';
    if (value.includes('[')) return 'Array to store multiple values';
    if (value.includes('{')) return 'Object to store structured data';
    if (value.includes('true') || value.includes('false')) return 'Boolean flag for conditions';
    if (value.match(/['"`]/)) return 'Text string value';
    if (value.match(/^\d+$/)) return 'Numeric value';
    if (value.includes('new ')) return 'Instance of a class/object';
    if (value.includes('document.')) return 'DOM element reference';
    
    return 'Stores data for later use';
  }

  explainCodeFlow(code, language) {
    let flow = '\n🔄 **How this code flows:**\n\n';
    
    // Identify entry points
    if (code.includes('main()') || code.includes('main(')) {
      flow += '1. **Entry point**: The code starts executing at the `main()` function\n';
    } else if (code.includes('addEventListener')) {
      flow += '1. **Event-driven**: The code waits for user interactions (clicks, key presses, etc.)\n';
    } else if (code.includes('export')) {
      flow += '1. **Module**: This code exports functionality for other files to use\n';
    } else {
      flow += '1. **Top-down execution**: The code runs from top to bottom\n';
    }
    
    // Identify async patterns
    if (code.includes('async') || code.includes('await')) {
      flow += '2. **Asynchronous flow**: Some operations happen in the background without blocking\n';
      flow += '   - The code can do other things while waiting for async operations\n';
      flow += '   - Results come back when ready (like ordering food and getting a notification)\n';
    }
    
    // Identify control flow
    if (code.includes('if') || code.includes('switch')) {
      flow += '3. **Decision making**: The code chooses different paths based on conditions\n';
    }
    
    if (code.includes('for') || code.includes('while') || code.includes('.map') || code.includes('.forEach')) {
      flow += '4. **Repetition**: Some parts repeat for multiple items or until a condition is met\n';
    }
    
    if (code.includes('try') && code.includes('catch')) {
      flow += '5. **Error handling**: If something goes wrong, the code knows how to recover\n';
    }
    
    return flow;
  }

  getStarterTips(language) {
    const tips = {
      javascript: `- Start with 'use strict' for better error catching
- Consider using ES6+ features like const/let, arrow functions
- Add JSDoc comments for better documentation`,
      react: `- Begin with imports (React, components, styles)
- Define your component (functional or class-based)
- Don't forget PropTypes or TypeScript for type safety`,
      python: `- Start with imports grouped by standard/third-party/local
- Add a module docstring explaining the file's purpose
- Follow PEP 8 style guidelines`,
      default: `- Start with necessary imports/includes
- Add comments explaining the file's purpose
- Follow the project's coding conventions`
    };
    
    return tips[language] || tips.default;
  }
}