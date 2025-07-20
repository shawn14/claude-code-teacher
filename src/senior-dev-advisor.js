import chalk from 'chalk';

export class SeniorDevAdvisor {
  constructor() {
    this.patterns = this.loadPatterns();
  }

  loadPatterns() {
    return {
      // Code smell patterns
      codeSmells: {
        'sk_test_': {
          severity: 'critical',
          suggestion: '🚨 HARDCODED API KEY DETECTED! This is a critical security vulnerability. Move to environment variables immediately!',
          alternative: `const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);`
        },
        'console.log': {
          severity: 'medium',
          suggestion: 'Consider using a proper logging library like Winston or Pino for production code. Console.log is synchronous and can impact performance.',
          alternative: `const logger = require('winston');\nlogger.info('Your message');`
        },
        'var ': {
          severity: 'high',
          suggestion: 'Use const or let instead of var. Var has function scope which can lead to bugs.',
          alternative: 'const for immutable, let for mutable variables'
        },
        'callback hell': {
          pattern: /callback.*callback.*callback/s,
          severity: 'high',
          suggestion: 'This looks like callback hell. Consider using async/await for cleaner code.',
          alternative: 'Refactor to use Promises and async/await'
        },
        'any': {
          pattern: /: any/,
          severity: 'medium',
          suggestion: 'Avoid using "any" type in TypeScript. It defeats the purpose of type safety.',
          alternative: 'Define proper interfaces or types'
        },
        'hardcoded values': {
          pattern: /localhost|127\.0\.0\.1|3000|8080/,
          severity: 'medium',
          suggestion: 'Hardcoded values should be in environment variables or config files.',
          alternative: 'Use process.env.PORT || 3000'
        }
      },

      // Architecture suggestions
      architecturePatterns: {
        'no error handling': {
          detect: (code) => code.includes('async') && !code.includes('try') && !code.includes('catch'),
          suggestion: '🏗️ Architecture consideration: Add proper error handling. Unhandled promise rejections will crash Node.js in future versions.',
          example: `try {\n  // your async code\n} catch (error) {\n  // handle error properly\n  logger.error('Operation failed:', error);\n  throw new CustomError('User-friendly message');\n}`
        },
        'god function': {
          detect: (code) => {
            const lines = code.split('\n').length;
            const functionMatch = code.match(/function|=>/g);
            return functionMatch && functionMatch.length === 1 && lines > 50;
          },
          suggestion: '🏗️ This function is getting quite large. Consider breaking it into smaller, focused functions following the Single Responsibility Principle.',
          example: 'Split into: validateInput(), processData(), formatResponse()'
        },
        'missing validation': {
          detect: (code) => code.includes('req.body') && !code.includes('validate') && !code.includes('if'),
          suggestion: '⚠️ Security: Always validate user input! Consider using a validation library like Joi or express-validator.',
          example: `const { body, validationResult } = require('express-validator');\n\nrouter.post('/user', [\n  body('email').isEmail(),\n  body('password').isLength({ min: 8 })\n], (req, res) => { ... });`
        },
        'sql injection risk': {
          detect: (code) => code.match(/query.*VALUES.*\+|query.*\+.*req\.|query.*\$\{.*req\.|INSERT.*\+.*\"|DELETE.*\+.*req/),
          suggestion: '🚨 CRITICAL: SQL INJECTION VULNERABILITY! This is one of the most dangerous security flaws. User input is being concatenated directly into SQL!',
          example: 'Use parameterized queries: db.query("INSERT INTO payments VALUES (?, ?)", [amount, cardNumber])'
        }
      },

      // Performance suggestions
      performancePatterns: {
        'n+1 query': {
          detect: (code) => code.includes('forEach') && code.includes('await') && code.includes('find'),
          suggestion: '⚡ Performance: This looks like an N+1 query problem. Consider fetching all data in one query.',
          example: `// Instead of:\nusers.forEach(async user => {\n  const posts = await Post.find({userId: user.id});\n});\n\n// Do:\nconst userIds = users.map(u => u.id);\nconst posts = await Post.find({userId: {$in: userIds}});`
        },
        'synchronous file operations': {
          detect: (code) => code.match(/readFileSync|writeFileSync/),
          suggestion: '⚡ Performance: Synchronous file operations block the event loop. Use async versions.',
          example: 'Use fs.promises.readFile() or fs.readFile() with callbacks'
        },
        'missing indexes': {
          detect: (code) => code.match(/find.*email|find.*username|findOne.*email/),
          suggestion: '💡 Database tip: Make sure you have indexes on fields you query frequently (like email).',
          example: 'db.users.createIndex({ email: 1 })'
        }
      },

      // Best practices
      bestPractices: {
        'missing return types': {
          detect: (code, filename) => filename.includes('.ts') && code.includes('function') && !code.includes('):'),
          suggestion: '📝 TypeScript best practice: Always specify return types for better type safety.',
          example: 'function getName(): string { ... }'
        },
        'mutable exports': {
          detect: (code) => code.includes('let') && code.includes('module.exports'),
          suggestion: '⚠️ Avoid exporting mutable variables. This can lead to unexpected behavior.',
          example: 'Export functions that return values instead of mutable variables'
        },
        'missing tests': {
          detect: (code, filename) => !filename.includes('test') && !filename.includes('spec') && code.includes('function'),
          suggestion: '🧪 Don\'t forget to write tests! Aim for at least 80% code coverage.',
          example: 'Create a parallel test file: auth.test.js'
        }
      }
    };
  }

  analyzeCode(content, filename) {
    const suggestions = [];
    
    // Check code smells
    for (const [name, pattern] of Object.entries(this.patterns.codeSmells)) {
      if (typeof pattern.pattern === 'object' ? pattern.pattern.test(content) : content.includes(name)) {
        suggestions.push({
          type: 'code-smell',
          severity: pattern.severity,
          message: pattern.suggestion,
          alternative: pattern.alternative
        });
      }
    }

    // Check architecture patterns
    for (const [name, pattern] of Object.entries(this.patterns.architecturePatterns)) {
      if (pattern.detect(content)) {
        suggestions.push({
          type: 'architecture',
          severity: 'high',
          message: pattern.suggestion,
          example: pattern.example
        });
      }
    }

    // Check performance patterns
    for (const [name, pattern] of Object.entries(this.patterns.performancePatterns)) {
      if (pattern.detect(content)) {
        suggestions.push({
          type: 'performance',
          severity: 'medium',
          message: pattern.suggestion,
          example: pattern.example
        });
      }
    }

    // Check best practices
    for (const [name, pattern] of Object.entries(this.patterns.bestPractices)) {
      if (pattern.detect(content, filename)) {
        suggestions.push({
          type: 'best-practice',
          severity: 'low',
          message: pattern.suggestion,
          example: pattern.example
        });
      }
    }

    return suggestions;
  }

  formatSuggestions(suggestions) {
    if (suggestions.length === 0) return '';
    
    let output = chalk.bold.magenta('\n\n🧙 Senior Dev Suggestions:\n');
    
    // Group by severity
    const critical = suggestions.filter(s => s.severity === 'critical');
    const high = suggestions.filter(s => s.severity === 'high');
    const medium = suggestions.filter(s => s.severity === 'medium');
    const low = suggestions.filter(s => s.severity === 'low');
    
    if (critical.length > 0) {
      output += chalk.bold.red('\n🚨 CRITICAL SECURITY ISSUES:\n');
      critical.forEach(s => {
        output += chalk.bold.red(`   • ${s.message}\n`);
        if (s.example) {
          output += chalk.gray(`     Fix: ${s.example}\n`);
        }
      });
    }
    
    if (high.length > 0) {
      output += chalk.red('\n⚠️  Important considerations:\n');
      high.forEach(s => {
        output += chalk.red(`   • ${s.message}\n`);
        if (s.example) {
          output += chalk.gray(`     Example: ${s.example.split('\n')[0]}...\n`);
        }
      });
    }
    
    if (medium.length > 0) {
      output += chalk.yellow('\n💡 Suggestions:\n');
      medium.forEach(s => {
        output += chalk.yellow(`   • ${s.message}\n`);
      });
    }
    
    if (low.length > 0) {
      output += chalk.blue('\n📘 Best practices:\n');
      low.forEach(s => {
        output += chalk.blue(`   • ${s.message}\n`);
      });
    }
    
    // Add a motivational note
    const motivations = [
      '\n💪 "Good code is like a good joke - it needs no explanation"',
      '\n🚀 "Make it work, make it right, make it fast - in that order"',
      '\n🎯 "Code for the maintainer, who might be you in 6 months"',
      '\n✨ "Simplicity is the ultimate sophistication"'
    ];
    
    output += chalk.dim(motivations[Math.floor(Math.random() * motivations.length)]);
    
    return output;
  }
}

// Example responses for specific patterns
export const seniorDevComments = {
  authentication: [
    "Consider implementing rate limiting on auth endpoints to prevent brute force attacks",
    "Don't forget to implement password reset functionality with secure tokens",
    "Add 2FA support - it's becoming a standard security requirement"
  ],
  
  database: [
    "Consider using database migrations for schema changes",
    "Implement connection pooling for better performance",
    "Add database query logging in development for debugging"
  ],
  
  api: [
    "Version your API from the start (/api/v1/) to make future changes easier",
    "Implement proper HTTP status codes - not everything is a 200 OK",
    "Consider implementing pagination early - it's hard to add later"
  ],
  
  testing: [
    "Write tests as you code, not after - it influences better design",
    "Don't just test the happy path - test edge cases and error conditions",
    "Consider using test-driven development (TDD) for complex logic"
  ]
};