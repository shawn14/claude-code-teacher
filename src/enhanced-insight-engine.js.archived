import chalk from 'chalk';
import { themeManager } from './theme-manager.js';

export class EnhancedInsightEngine {
  constructor() {
    this.codePatterns = {
      // Language constructs
      async: /async\s+function|async\s*\(|async\s*\w+\s*=>/,
      arrow: /=>/,
      destructuring: /const\s*\{[^}]+\}|const\s*\[[^\]]+\]/,
      spread: /\.\.\./,
      template: /`[^`]*\${[^}]+}[^`]*`/,
      
      // React patterns
      useState: /useState\s*\(/,
      useEffect: /useEffect\s*\(/,
      useContext: /useContext\s*\(/,
      useMemo: /useMemo\s*\(/,
      useCallback: /useCallback\s*\(/,
      jsx: /<[A-Z]\w*|<\/[A-Z]\w*>/,
      
      // API patterns
      fetch: /fetch\s*\(/,
      axios: /axios\./,
      promise: /new\s+Promise|\.then\(|\.catch\(/,
      
      // Error handling
      tryCatch: /try\s*\{[\s\S]*?\}\s*catch/,
      throw: /throw\s+new\s+\w*Error/,
      
      // Testing
      test: /test\s*\(|it\s*\(|describe\s*\(/,
      expect: /expect\s*\(/,
      
      // Security concerns
      eval: /eval\s*\(/,
      innerHTML: /innerHTML\s*=/,
      dangerouslySetHTML: /dangerouslySetInnerHTML/,
      localStorage: /localStorage\.(set|get)Item/,
      
      // Performance
      memo: /React\.memo|useMemo|useCallback/,
      debounce: /debounce|throttle/,
      lazyLoad: /React\.lazy|lazy\s*\(/
    };
  }

  analyzeSpecificChange(context) {
    const { diff, filename, type } = context;
    const colors = themeManager.getColors();
    
    // Extract actual code changes
    const addedLines = this.extractAddedLines(diff);
    const removedLines = this.extractRemovedLines(diff);
    const changedCode = this.identifyChangedCode(addedLines, removedLines);
    
    let output = '';
    
    // Analyze what specifically changed
    output += colors.header.bold('\n🔬 DETAILED CHANGE ANALYSIS\n');
    output += colors.muted('─'.repeat(50)) + '\n';
    
    // Show exact changes
    if (changedCode.modifications.length > 0) {
      output += colors.accent.bold('\n📝 Code Modifications:\n');
      changedCode.modifications.forEach(mod => {
        output += colors.error(`   - ${mod.removed}\n`);
        output += colors.success(`   + ${mod.added}\n`);
        output += this.explainModification(mod);
      });
    }
    
    if (changedCode.additions.length > 0) {
      output += colors.accent.bold('\n✨ New Code Added:\n');
      changedCode.additions.forEach(addition => {
        output += colors.success(`   + ${addition.trim()}\n`);
        output += this.explainAddition(addition);
      });
    }
    
    if (changedCode.deletions.length > 0) {
      output += colors.accent.bold('\n🗑️  Code Removed:\n');
      changedCode.deletions.forEach(deletion => {
        output += colors.error(`   - ${deletion.trim()}\n`);
        output += this.explainDeletion(deletion);
      });
    }
    
    // Analyze patterns in the changes
    const detectedPatterns = this.detectPatternsInCode(addedLines.join('\n'));
    if (detectedPatterns.length > 0) {
      output += colors.secondary.bold('\n🎯 Patterns & Techniques Used:\n');
      detectedPatterns.forEach(pattern => {
        output += this.explainPattern(pattern);
      });
    }
    
    // Provide context-specific teaching
    output += this.generateContextualTeaching(changedCode, filename);
    
    // Suggest best practices based on the specific changes
    output += this.suggestBestPractices(changedCode, detectedPatterns);
    
    return output;
  }
  
  extractAddedLines(diff) {
    return diff.split('\n')
      .filter(line => line.startsWith('+') && !line.startsWith('+++'))
      .map(line => line.substring(1));
  }
  
  extractRemovedLines(diff) {
    return diff.split('\n')
      .filter(line => line.startsWith('-') && !line.startsWith('---'))
      .map(line => line.substring(1));
  }
  
  identifyChangedCode(addedLines, removedLines) {
    const modifications = [];
    const additions = [];
    const deletions = [];
    
    // Match similar lines to find modifications
    removedLines.forEach(removed => {
      const trimmedRemoved = removed.trim();
      const matchingAdded = addedLines.find(added => {
        const trimmedAdded = added.trim();
        // Check if lines are similar (share common parts)
        return this.calculateSimilarity(trimmedRemoved, trimmedAdded) > 0.5;
      });
      
      if (matchingAdded) {
        modifications.push({
          removed: removed.trim(),
          added: matchingAdded.trim(),
          type: this.identifyModificationType(removed, matchingAdded)
        });
        // Remove from arrays to avoid duplicates
        addedLines = addedLines.filter(line => line !== matchingAdded);
      } else {
        deletions.push(removed);
      }
    });
    
    // Remaining added lines are pure additions
    additions.push(...addedLines);
    
    return { modifications, additions, deletions };
  }
  
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }
  
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  identifyModificationType(removed, added) {
    if (added.includes(removed.replace(/['"]/, '').replace(/['"]/, ''))) {
      return 'string_change';
    }
    if (removed.includes('var ') && added.includes('const ')) {
      return 'modernization';
    }
    if (removed.includes('function') && added.includes('=>')) {
      return 'arrow_conversion';
    }
    if (added.includes('async') && !removed.includes('async')) {
      return 'async_addition';
    }
    if (added.length > removed.length + 10) {
      return 'expansion';
    }
    if (added.length < removed.length - 10) {
      return 'simplification';
    }
    return 'modification';
  }
  
  explainModification(mod) {
    const colors = themeManager.getColors();
    const explanations = {
      string_change: colors.info('      → String or property name updated\n'),
      modernization: colors.success('      → Code modernized to use ES6+ syntax (const/let instead of var)\n'),
      arrow_conversion: colors.success('      → Converted to arrow function for cleaner syntax\n'),
      async_addition: colors.warning('      → Made asynchronous - remember to handle promises/await\n'),
      expansion: colors.info('      → Code expanded with additional logic\n'),
      simplification: colors.success('      → Code simplified for better readability\n'),
      modification: colors.info('      → Logic or structure modified\n')
    };
    
    return explanations[mod.type] || '';
  }
  
  explainAddition(addition) {
    const colors = themeManager.getColors();
    const trimmed = addition.trim();
    
    if (trimmed.includes('import')) {
      return colors.info('      → New dependency imported - ensure it\'s installed\n');
    }
    if (trimmed.includes('export')) {
      return colors.info('      → New export added - this makes code available to other modules\n');
    }
    if (trimmed.includes('useState')) {
      return colors.accent('      → React state hook added - component now has stateful logic\n');
    }
    if (trimmed.includes('useEffect')) {
      return colors.accent('      → Effect hook added - runs side effects after render\n');
    }
    if (trimmed.includes('try')) {
      return colors.success('      → Error handling added - great for robustness!\n');
    }
    if (trimmed.includes('console.log')) {
      return colors.warning('      → Debug logging added - remember to remove before production\n');
    }
    return '';
  }
  
  explainDeletion(deletion) {
    const colors = themeManager.getColors();
    const trimmed = deletion.trim();
    
    if (trimmed.includes('console.log')) {
      return colors.success('      → Debug logging removed - good for production!\n');
    }
    if (trimmed.includes('// TODO') || trimmed.includes('// FIXME')) {
      return colors.info('      → TODO/FIXME resolved - task completed!\n');
    }
    return '';
  }
  
  detectPatternsInCode(code) {
    const detected = [];
    
    for (const [pattern, regex] of Object.entries(this.codePatterns)) {
      if (regex.test(code)) {
        detected.push(pattern);
      }
    }
    
    return detected;
  }
  
  explainPattern(pattern) {
    const colors = themeManager.getColors();
    const explanations = {
      async: colors.accent('   🔄 Async/Await: Modern asynchronous programming\n') +
             colors.muted('      • Makes async code look synchronous and easier to read\n') +
             colors.muted('      • Always use try-catch for error handling\n') +
             colors.muted('      • Remember: await only works inside async functions\n'),
             
      arrow: colors.accent('   ➡️  Arrow Functions: Concise function syntax\n') +
             colors.muted('      • Lexically binds "this" - great for callbacks\n') +
             colors.muted('      • Implicit return for single expressions\n') +
             colors.muted('      • Cannot be used as constructors\n'),
             
      destructuring: colors.accent('   📦 Destructuring: Extract values elegantly\n') +
                     colors.muted('      • Cleaner than multiple variable assignments\n') +
                     colors.muted('      • Works with objects and arrays\n') +
                     colors.muted('      • Can provide default values\n'),
                     
      useState: colors.accent('   🎣 useState Hook: React state management\n') +
                colors.muted('      • Returns [value, setter] pair\n') +
                colors.muted('      • State updates trigger re-renders\n') +
                colors.muted('      • Updates are batched for performance\n'),
                
      useEffect: colors.accent('   🎬 useEffect Hook: Side effects in React\n') +
                 colors.muted('      • Runs after render by default\n') +
                 colors.muted('      • Cleanup function prevents memory leaks\n') +
                 colors.muted('      • Dependency array controls when it runs\n'),
                 
      tryCatch: colors.accent('   🛡️  Try-Catch: Error handling\n') +
                colors.muted('      • Prevents app crashes from errors\n') +
                colors.muted('      • Always log errors for debugging\n') +
                colors.muted('      • Consider user-friendly error messages\n'),
                
      fetch: colors.accent('   🌐 Fetch API: HTTP requests\n') +
             colors.muted('      • Returns a Promise - use async/await\n') +
             colors.muted('      • Check response.ok for HTTP errors\n') +
             colors.muted('      • Don\'t forget to parse JSON response\n')
    };
    
    return explanations[pattern] || '';
  }
  
  generateContextualTeaching(changedCode, filename) {
    const colors = themeManager.getColors();
    let output = colors.header.bold('\n📚 CONTEXTUAL LEARNING\n');
    output += colors.muted('─'.repeat(50)) + '\n';
    
    // File type specific teaching
    if (filename.includes('.test.') || filename.includes('.spec.')) {
      output += colors.info('\n🧪 Test File Best Practices:\n');
      output += colors.muted('   • Each test should test one specific behavior\n');
      output += colors.muted('   • Use descriptive test names that explain what and why\n');
      output += colors.muted('   • Follow AAA pattern: Arrange, Act, Assert\n');
    } else if (filename.includes('component')) {
      output += colors.info('\n🧩 Component Development:\n');
      output += colors.muted('   • Keep components focused on a single responsibility\n');
      output += colors.muted('   • Extract complex logic into custom hooks\n');
      output += colors.muted('   • Memoize expensive computations\n');
    } else if (filename.includes('api') || filename.includes('service')) {
      output += colors.info('\n🔌 API/Service Layer:\n');
      output += colors.muted('   • Centralize API calls for consistency\n');
      output += colors.muted('   • Implement retry logic for network failures\n');
      output += colors.muted('   • Use interceptors for common headers/auth\n');
    }
    
    return output;
  }
  
  suggestBestPractices(changedCode, patterns) {
    const colors = themeManager.getColors();
    let output = colors.header.bold('\n💡 SPECIFIC RECOMMENDATIONS\n');
    output += colors.muted('─'.repeat(50)) + '\n';
    
    const suggestions = [];
    
    // Check for specific anti-patterns or improvements
    changedCode.additions.forEach(line => {
      if (line.includes('var ')) {
        suggestions.push('Consider using const/let instead of var for block scoping');
      }
      if (line.includes('==') && !line.includes('===')) {
        suggestions.push('Use === for strict equality checks to avoid type coercion');
      }
      if (line.includes('setTimeout') && !line.includes('clearTimeout')) {
        suggestions.push('Store timeout ID and clear it on cleanup to prevent memory leaks');
      }
    });
    
    if (patterns.includes('useState') && !patterns.includes('useCallback')) {
      suggestions.push('Consider useCallback for functions passed to child components');
    }
    
    if (patterns.includes('fetch') && !patterns.includes('tryCatch')) {
      suggestions.push('Add error handling for network requests');
    }
    
    suggestions.forEach(suggestion => {
      output += colors.warning(`   ⚡ ${suggestion}\n`);
    });
    
    if (suggestions.length === 0) {
      output += colors.success('   ✅ Code follows best practices!\n');
    }
    
    return output;
  }
}

// Export singleton instance
export const enhancedInsightEngine = new EnhancedInsightEngine();