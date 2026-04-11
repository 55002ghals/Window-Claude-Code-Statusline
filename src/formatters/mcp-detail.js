const fs = require('fs');
const path = require('path');
const os = require('os');

function getMcpServers() {
  const servers = {};

  // Global settings
  const globalPath = path.join(os.homedir(), '.claude', 'settings.json');
  mergeServers(servers, globalPath);

  // Project-level settings
  const projectPath = path.join(process.cwd(), '.claude', 'settings.json');
  mergeServers(servers, projectPath);

  return servers;
}

function mergeServers(target, filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const mcp = data.mcpServers || {};
    for (const [name, config] of Object.entries(mcp)) {
      target[name] = {
        type: config.type || (config.command ? 'stdio' : 'unknown'),
        command: config.command || config.url || '--',
      };
    }
  } catch {
    // file not found or invalid
  }
}

function getMcpCount() {
  return Object.keys(getMcpServers()).length;
}

function generateMcpDetailFile() {
  const servers = getMcpServers();
  const count = Object.keys(servers).length;
  if (count === 0) return null;

  const lines = ['Claude Code MCP Servers', '=======================', ''];
  for (const [name, info] of Object.entries(servers)) {
    lines.push(`- ${name} (${info.type}): ${info.command}`);
  }

  const tmpPath = path.join(os.tmpdir(), 'claude-statusline-mcp.txt');
  try {
    fs.writeFileSync(tmpPath, lines.join('\n'), 'utf8');
    return tmpPath;
  } catch {
    return null;
  }
}

module.exports = { getMcpCount, generateMcpDetailFile };
