const { getMcpCount, generateMcpDetailFile } = require('./mcp-detail');

const LINKS = {
  model: 'https://platform.claude.com/docs/en/docs/about-claude/models',
  context: 'https://code.claude.com/docs/en/context-window',
  cost: 'https://platform.claude.com/docs/en/docs/about-claude/pricing',
  cache: 'https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching',
  limits: 'https://platform.claude.com/docs/en/api/rate-limits',
};

function osc8(url, text) {
  if (!url) return text;
  return `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;
}

function formatBar(usedPct) {
  const filled = usedPct != null ? Math.round(usedPct / 5) : 0;
  const empty = 20 - filled;
  return '[' + '\u2588'.repeat(filled) + ' '.repeat(empty) + ']';
}

function formatLimit(label, limitInfo) {
  const pct = limitInfo.usedPct != null ? `${limitInfo.usedPct}%` : '--';
  const rt = limitInfo.resetTime || '--';
  const bar = formatBar(limitInfo.usedPct);
  return `${label}${bar} ${pct}(${rt})`;
}

function formatStatusLine(session, tknCost, monCost, cacheHit, cpu, mem, config) {
  const d = config.display;
  const sep = config.separator;

  // Line 1: Model + rate limits
  const line1Parts = [];
  if (d.showModel) {
    line1Parts.push(osc8(LINKS.model, `Model : ${session.model}`));
  }
  if (d.showLimits) {
    line1Parts.push(osc8(LINKS.limits, formatLimit('5h', session.fiveHour)));
    line1Parts.push(osc8(LINKS.limits, formatLimit('7d', session.sevenDay)));
  }

  // Line 2: TknCost onwards
  const line2Parts = [];
  if (d.showTkncost) {
    line2Parts.push(osc8(LINKS.cost, `TknCost : ${tknCost}`));
  }
  if (d.showMoncost) {
    line2Parts.push(osc8(LINKS.cost, `MonCost : ${monCost}`));
  }
  if (d.showCache) {
    const cacheStr = cacheHit != null ? `${cacheHit}%` : '--';
    line2Parts.push(osc8(LINKS.cache, `CacheHit% : ${cacheStr}`));
  }
  if (d.showContext) {
    const ctxStr = session.contextPercent != null ? `${session.contextPercent}%` : '--';
    line2Parts.push(osc8(LINKS.context, `CtxWindow% : ${ctxStr}`));
  }
  if (d.showMem) {
    const memStr = mem != null ? `${mem}%` : '--';
    line2Parts.push(`MEM : ${memStr}`);
  }
  if (d.showCpu) {
    const cpuStr = cpu != null ? `${cpu}%` : '--';
    line2Parts.push(`CPU : ${cpuStr}`);
  }
  if (d.showMcp) {
    const mcpCount = getMcpCount();
    const mcpFile = generateMcpDetailFile();
    const mcpUrl = mcpFile ? `file://${mcpFile.replace(/\\/g, '/')}` : null;
    line2Parts.push(osc8(mcpUrl, `MCP:${mcpCount}`));
  }

  const lines = [];
  if (line1Parts.length) lines.push(line1Parts.join(sep));
  if (line2Parts.length) lines.push(line2Parts.join(sep));
  return lines;
}

module.exports = { formatStatusLine };
