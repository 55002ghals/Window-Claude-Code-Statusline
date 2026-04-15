const fs = require('fs');
const path = require('path');
const os = require('os');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function mergeServerMap(target, mcpServers) {
  if (!mcpServers || typeof mcpServers !== 'object') return;
  for (const [name, cfg] of Object.entries(mcpServers)) {
    if (target[name]) continue;
    const c = cfg || {};
    target[name] = {
      type: c.type || (c.command ? 'stdio' : c.url ? 'http' : 'unknown'),
      command: c.command || c.url || '--',
    };
  }
}

function findProjectEntry(projects, cwd) {
  if (!projects || typeof projects !== 'object') return null;
  const normalized = cwd.replace(/\\/g, '/');
  if (projects[normalized]) return projects[normalized];
  if (projects[cwd]) return projects[cwd];
  // Windows paths are case-insensitive; try case-insensitive match
  const lower = normalized.toLowerCase();
  for (const [key, val] of Object.entries(projects)) {
    if (key.toLowerCase() === lower) return val;
  }
  return null;
}

function getMcpServers() {
  const servers = {};
  const home = os.homedir();
  const cwd = process.cwd();

  // 1. User-scope + local-scope from ~/.claude.json
  const userConfig = readJson(path.join(home, '.claude.json'));
  if (userConfig) {
    mergeServerMap(servers, userConfig.mcpServers);
    const projectEntry = findProjectEntry(userConfig.projects, cwd);
    if (projectEntry) mergeServerMap(servers, projectEntry.mcpServers);
  }

  // 2. Project-scope from <cwd>/.mcp.json
  const projectMcp = readJson(path.join(cwd, '.mcp.json'));
  if (projectMcp) mergeServerMap(servers, projectMcp.mcpServers);

  // 3. Managed cloud integrations (claude.ai) — tracked in the auth cache
  const authCache = readJson(path.join(home, '.claude', 'mcp-needs-auth-cache.json'));
  if (authCache && typeof authCache === 'object') {
    for (const name of Object.keys(authCache)) {
      if (!servers[name]) servers[name] = { type: 'http', command: '--' };
    }
  }

  return servers;
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

module.exports = { getMcpCount, getMcpServers, generateMcpDetailFile };
