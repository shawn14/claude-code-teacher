import chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import * as diff from 'diff';
import { TeachingEngine } from './explainer.js';

export class FileMonitor {
  constructor(projectPath, options = {}) {
    this.projectPath = projectPath;
    this.options = options;
    this.fileContents = new Map();
    this.teachingEngine = new TeachingEngine(options.mode || 'realtime', projectPath);
    this.watcher = null;
  }

  async start() {
    // Initialize watcher
    this.watcher = chokidar.watch(this.projectPath, {
      ignored: [
        /(^|[\/\\])\../,  // Hidden files
        /node_modules/,
        /\.git/,
        /dist/,
        /build/,
        /coverage/
      ],
      persistent: true,
      ignoreInitial: false
    });

    // Cache initial file contents
    this.watcher.on('add', async (filePath) => {
      if (this.shouldMonitor(filePath)) {
        const content = await this.readFile(filePath);
        this.fileContents.set(filePath, content);
      }
    });

    // Monitor changes
    this.watcher.on('change', async (filePath) => {
      console.log('File changed:', filePath);
      if (this.shouldMonitor(filePath)) {
        await this.handleFileChange(filePath);
      }
    });

    // Monitor new files (after initial load)
    let initialLoadComplete = false;
    setTimeout(() => { initialLoadComplete = true; }, 1000);
    
    this.watcher.on('add', async (filePath) => {
      console.log('File added:', filePath);
      if (this.shouldMonitor(filePath)) {
        const content = await this.readFile(filePath);
        if (initialLoadComplete && !this.fileContents.has(filePath)) {
          // This is a genuinely new file, not initial load
          const explanation = await this.teachingEngine.explainNewFile(filePath);
          this.emitExplanation(explanation);
        }
        this.fileContents.set(filePath, content);
      }
    });

    return this;
  }

  shouldMonitor(filePath) {
    const ext = path.extname(filePath);
    const monitoredExtensions = [
      '.js', '.jsx', '.ts', '.tsx',
      '.py', '.java', '.go', '.rs',
      '.html', '.css', '.scss',
      '.json', '.yaml', '.yml',
      '.md', '.txt'
    ];
    
    return monitoredExtensions.includes(ext);
  }

  async handleFileChange(filePath) {
    try {
      const newContent = await this.readFile(filePath);
      const oldContent = this.fileContents.get(filePath) || '';
      
      if (newContent !== oldContent) {
        // Generate diff
        const diffResult = diff.createPatch(filePath, oldContent, newContent);
        
        // Get explanation for the change
        const explanation = await this.teachingEngine.explainChange({
          filePath,
          oldContent,
          newContent,
          diff: diffResult,
          projectContext: await this.getProjectContext()
        });
        
        // Update cache
        this.fileContents.set(filePath, newContent);
        
        // Emit explanation
        this.emitExplanation(explanation);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }

  async readFile(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      return '';
    }
  }

  async getProjectContext() {
    // Gather project context for better explanations
    const context = {
      type: 'unknown',
      framework: null,
      dependencies: []
    };

    // Check for package.json
    try {
      const packagePath = path.join(this.projectPath, 'package.json');
      const packageJson = JSON.parse(await this.readFile(packagePath));
      
      context.dependencies = Object.keys(packageJson.dependencies || {});
      
      // Detect framework
      if (context.dependencies.includes('react')) {
        context.framework = 'react';
        context.type = 'web-app';
      } else if (context.dependencies.includes('express')) {
        context.framework = 'express';
        context.type = 'api';
      } else if (context.dependencies.includes('vue')) {
        context.framework = 'vue';
        context.type = 'web-app';
      }
    } catch (error) {
      // No package.json or error reading it
    }

    return context;
  }

  emitExplanation(explanation) {
    if (this.options.onExplanation) {
      this.options.onExplanation(explanation);
    }
  }

  async close() {
    if (this.watcher) {
      await this.watcher.close();
    }
  }
}

export async function startWatcher(projectPath, options = {}) {
  const monitor = new FileMonitor(projectPath, options);
  await monitor.start();
  return monitor;
}