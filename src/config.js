import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function configureClaudeCode() {
  const configPaths = [
    // User config
    path.join(os.homedir(), '.config', 'claude-code', 'settings.json'),
    // Project config
    path.join(process.cwd(), '.claude-code', 'settings.json')
  ];

  for (const configPath of configPaths) {
    try {
      await ensureConfigExists(configPath);
      await updateConfig(configPath);
      console.log(`Updated config at: ${configPath}`);
      return true;
    } catch (error) {
      // Try next config location
      continue;
    }
  }

  // If no existing config found, create new one
  const newConfigPath = configPaths[1]; // Use project config
  await createNewConfig(newConfigPath);
  return true;
}

async function ensureConfigExists(configPath) {
  try {
    await fs.access(configPath);
    return true;
  } catch (error) {
    throw new Error(`Config not found at ${configPath}`);
  }
}

async function updateConfig(configPath) {
  // Read existing config
  const configContent = await fs.readFile(configPath, 'utf-8');
  const config = JSON.parse(configContent);

  // Add teacher MCP server
  if (!config['mcp-servers']) {
    config['mcp-servers'] = {};
  }

  config['mcp-servers']['teacher'] = {
    command: 'npx',
    args: ['vibe-code', 'serve'],
    name: 'Vibe Code',
    description: 'Real-time code explanations and learning assistance'
  };

  // Write updated config
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

async function createNewConfig(configPath) {
  const config = {
    'mcp-servers': {
      teacher: {
        command: 'npx',
        args: ['vibe-code', 'serve'],
        name: 'Vibe Code',
        description: 'Real-time code explanations and learning assistance'
      }
    }
  };

  // Ensure directory exists
  const dir = path.dirname(configPath);
  await fs.mkdir(dir, { recursive: true });

  // Write config
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  console.log(`Created new config at: ${configPath}`);
}

export async function detectClaudeCodeProjects() {
  // Look for projects with Claude Code markers
  const markers = [
    '.claude-code',
    'claude-code.json',
    '.claudeignore'
  ];

  const projects = [];
  
  // Search common project directories
  const searchPaths = [
    process.cwd(),
    path.join(os.homedir(), 'projects'),
    path.join(os.homedir(), 'code'),
    path.join(os.homedir(), 'dev')
  ];

  for (const searchPath of searchPaths) {
    try {
      const entries = await fs.readdir(searchPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const projectPath = path.join(searchPath, entry.name);
          
          // Check for Claude Code markers
          for (const marker of markers) {
            try {
              await fs.access(path.join(projectPath, marker));
              projects.push({
                name: entry.name,
                path: projectPath,
                marker
              });
              break;
            } catch {
              // Marker not found, continue
            }
          }
        }
      }
    } catch {
      // Directory not accessible, continue
    }
  }

  return projects;
}