import chalk from 'chalk';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import os from 'os';

export class ThemeManager {
  constructor() {
    this.themes = {
      dark: {
        name: 'Dark Mode',
        description: 'Classic dark theme (default)',
        preview: '🌙 Dark background with vibrant colors',
        colors: {
          primary: chalk.cyan,
          secondary: chalk.yellow,
          success: chalk.green,
          error: chalk.red,
          warning: chalk.magenta,
          info: chalk.blue,
          muted: chalk.gray,
          highlight: chalk.bold.cyan,
          header: chalk.bold.yellow,
          accent: chalk.magenta
        }
      },
      light: {
        name: 'Light Mode',
        description: 'Bright theme for well-lit environments',
        preview: '☀️ Light background with dark text',
        colors: {
          primary: chalk.blue,
          secondary: chalk.magenta,
          success: chalk.green,
          error: chalk.red,
          warning: chalk.yellow,
          info: chalk.cyan,
          muted: chalk.gray,
          highlight: chalk.bold.blue,
          header: chalk.bold.magenta,
          accent: chalk.cyan
        }
      },
      matrix: {
        name: 'Matrix Mode',
        description: 'Enter the Matrix with green cascading text',
        preview: '💊 Green text on black, hacker style',
        colors: {
          primary: chalk.green,
          secondary: chalk.greenBright,
          success: chalk.greenBright,
          error: chalk.green,
          warning: chalk.greenBright,
          info: chalk.green,
          muted: chalk.green.dim,
          highlight: chalk.bold.greenBright,
          header: chalk.bold.green,
          accent: chalk.greenBright
        }
      },
      cyberpunk: {
        name: 'Cyberpunk 2077',
        description: 'Neon colors for night city vibes',
        preview: '🌃 Hot pink and electric blue neons',
        colors: {
          primary: chalk.hex('#FF2E63'),
          secondary: chalk.hex('#00D9FF'),
          success: chalk.hex('#00FF88'),
          error: chalk.hex('#FF0080'),
          warning: chalk.hex('#FFB800'),
          info: chalk.hex('#00D9FF'),
          muted: chalk.hex('#7B2FFF'),
          highlight: chalk.bold.hex('#FF2E63'),
          header: chalk.bold.hex('#00D9FF'),
          accent: chalk.hex('#7B2FFF')
        }
      },
      solarized: {
        name: 'Solarized',
        description: 'Popular color scheme for developers',
        preview: '🎨 Carefully chosen colors for reduced eye strain',
        colors: {
          primary: chalk.hex('#268BD2'),
          secondary: chalk.hex('#CB4B16'),
          success: chalk.hex('#859900'),
          error: chalk.hex('#DC322F'),
          warning: chalk.hex('#B58900'),
          info: chalk.hex('#2AA198'),
          muted: chalk.hex('#586E75'),
          highlight: chalk.bold.hex('#268BD2'),
          header: chalk.bold.hex('#CB4B16'),
          accent: chalk.hex('#6C71C4')
        }
      },
      minimal: {
        name: 'Minimal',
        description: 'Clean monochrome theme',
        preview: '⚪ Black, white, and shades of gray',
        colors: {
          primary: chalk.white,
          secondary: chalk.gray,
          success: chalk.white,
          error: chalk.whiteBright,
          warning: chalk.gray,
          info: chalk.white,
          muted: chalk.gray,
          highlight: chalk.bold.white,
          header: chalk.bold.whiteBright,
          accent: chalk.gray
        }
      }
    };
    
    this.currentTheme = 'dark';
    this.themePath = path.join(os.homedir(), '.vibe-theme');
  }
  
  async loadTheme() {
    try {
      const savedTheme = await readFile(this.themePath, 'utf-8');
      const trimmedTheme = savedTheme.trim();
      
      if (this.themes[trimmedTheme]) {
        this.currentTheme = trimmedTheme;
        console.log(`Loaded theme: ${trimmedTheme}`);
      }
    } catch (error) {
      // No saved theme, use default
      console.log('Using default theme: dark');
      // Initialize with default theme
    }
  }
  
  async saveTheme() {
    try {
      await writeFile(this.themePath, this.currentTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }
  
  setTheme(themeName) {
    if (this.themes[themeName]) {
      this.currentTheme = themeName;
      this.saveTheme();
      return true;
    }
    return false;
  }
  
  getTheme() {
    return this.themes[this.currentTheme];
  }
  
  getColors() {
    return this.themes[this.currentTheme].colors;
  }
  
  getAllThemes() {
    return Object.entries(this.themes).map(([key, theme]) => ({
      key,
      ...theme,
      active: key === this.currentTheme
    }));
  }
  
  // Special effects for Matrix theme
  async showMatrixRain(duration = 2000) {
    if (this.currentTheme !== 'matrix') return;
    
    const cols = process.stdout.columns;
    const rows = process.stdout.rows;
    const streams = Array(Math.floor(cols / 2)).fill(0);
    const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ01';
    
    console.clear();
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      if (Date.now() - startTime > duration) {
        clearInterval(interval);
        console.clear();
        return;
      }
      
      // Move cursor to random position
      streams.forEach((y, x) => {
        if (Math.random() > 0.98 || y > rows) {
          streams[x] = 0;
        }
        
        const char = chars[Math.floor(Math.random() * chars.length)];
        process.stdout.cursorTo(x * 2, y);
        
        if (y === streams[x]) {
          process.stdout.write(chalk.greenBright(char));
        } else {
          process.stdout.write(chalk.green.dim(char));
        }
        
        if (streams[x] < rows) streams[x]++;
      });
    }, 50);
  }
  
  // Apply theme to text
  style(text, colorType = 'primary') {
    const colors = this.getColors();
    return colors[colorType] ? colors[colorType](text) : text;
  }
}

// Singleton instance
export const themeManager = new ThemeManager();