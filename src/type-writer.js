import chalk from 'chalk';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

export class TypeWriter {
  constructor(options = {}) {
    this.speeds = {
      instant: 0,
      veryFast: 5,
      fast: 15,
      normal: 30,
      slow: 50,
      dramatic: 80,
      ...options.speeds
    };
    
    this.interrupted = false;
    this.queue = [];
    this.isTyping = false;
  }

  /**
   * Type out text with animation
   * @param {string} text - Text to type
   * @param {string|number} speed - Speed preset or ms per character
   * @param {boolean} preserveFormatting - Whether to preserve chalk formatting
   */
  async typeOut(text, speed = 'normal', preserveFormatting = true) {
    // Add to queue if already typing
    if (this.isTyping) {
      return new Promise((resolve) => {
        this.queue.push({ text, speed, preserveFormatting, resolve });
      });
    }

    this.isTyping = true;
    this.interrupted = false;

    const delay = typeof speed === 'string' ? this.speeds[speed] : speed;
    
    // Handle formatted text by parsing chalk sequences
    if (preserveFormatting && text.includes('\u001b[')) {
      await this.typeFormattedText(text, delay);
    } else {
      await this.typeSimpleText(text, delay);
    }

    this.isTyping = false;

    // Process queue
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      await this.typeOut(next.text, next.speed, next.preserveFormatting);
      next.resolve();
    }
  }

  async typeSimpleText(text, delay) {
    for (let i = 0; i < text.length; i++) {
      if (this.interrupted) break;
      
      process.stdout.write(text[i]);
      
      // Don't delay for newlines or spaces at higher speeds
      if (delay > 0 && text[i] !== '\n' && (delay > 20 || text[i] !== ' ')) {
        await sleep(delay);
      }
    }
  }

  async typeFormattedText(text, delay) {
    // Split text into segments with their formatting
    const segments = this.parseFormattedText(text);
    
    for (const segment of segments) {
      if (this.interrupted) break;
      
      if (segment.formatted) {
        // Output the formatting codes instantly
        process.stdout.write(segment.format);
        
        // Type the content
        for (let i = 0; i < segment.content.length; i++) {
          if (this.interrupted) break;
          
          process.stdout.write(segment.content[i]);
          
          if (delay > 0 && segment.content[i] !== '\n') {
            await sleep(delay);
          }
        }
        
        // Reset formatting if needed
        if (segment.reset) {
          process.stdout.write(segment.reset);
        }
      } else {
        // Plain text
        await this.typeSimpleText(segment.content, delay);
      }
    }
  }

  parseFormattedText(text) {
    const segments = [];
    const ansiRegex = /(\u001b\[[0-9;]*m)/g;
    let lastIndex = 0;
    let match;
    let currentFormat = '';

    while ((match = ansiRegex.exec(text)) !== null) {
      // Add any plain text before this format code
      if (match.index > lastIndex) {
        const content = text.substring(lastIndex, match.index);
        if (content) {
          segments.push({
            content,
            formatted: !!currentFormat,
            format: currentFormat,
            reset: ''
          });
        }
      }

      // Update current format
      if (match[1].includes('[0m')) {
        // Reset code
        currentFormat = '';
      } else {
        currentFormat = match[1];
      }

      lastIndex = match.index + match[0].length;
    }

    // Add any remaining text
    if (lastIndex < text.length) {
      segments.push({
        content: text.substring(lastIndex),
        formatted: !!currentFormat,
        format: currentFormat,
        reset: currentFormat ? '\u001b[0m' : ''
      });
    }

    return segments;
  }

  /**
   * Type with different speeds for different parts
   */
  async typeMessage(parts) {
    for (const part of parts) {
      if (this.interrupted) break;
      await this.typeOut(part.text, part.speed || 'normal', part.preserveFormatting !== false);
    }
  }

  /**
   * Show a typing cursor animation
   */
  async showCursor(duration = 1000) {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    const startTime = Date.now();
    let i = 0;

    while (Date.now() - startTime < duration && !this.interrupted) {
      process.stdout.write(chalk.gray(frames[i % frames.length]));
      await sleep(80);
      process.stdout.write('\b');
      i++;
    }
    
    // Clear cursor
    process.stdout.write(' \b');
  }

  /**
   * Skip current animation
   */
  skip() {
    this.interrupted = true;
  }

  /**
   * Clear the queue
   */
  clearQueue() {
    this.queue = [];
  }

  /**
   * Create formatted message parts for common patterns
   */
  static formatInsight(header, content, suggestions = []) {
    const parts = [];

    // Header with icon
    if (header) {
      parts.push({
        text: header + '\n',
        speed: 'fast'
      });
    }

    // Main content
    if (content) {
      parts.push({
        text: content + '\n',
        speed: 'normal'
      });
    }

    // Suggestions as bullet points
    if (suggestions.length > 0) {
      parts.push({
        text: '\n' + chalk.bold('💡 Suggestions:\n'),
        speed: 'fast'
      });

      suggestions.forEach(suggestion => {
        parts.push({
          text: `  • ${suggestion}\n`,
          speed: 'normal'
        });
      });
    }

    return parts;
  }
}

// Singleton instance for easy access
export const typeWriter = new TypeWriter();

// Listen for keypresses to skip animations
if (process.stdin.isTTY) {
  process.stdin.on('keypress', (str, key) => {
    if (key && key.name === 'space') {
      typeWriter.skip();
    }
  });
}