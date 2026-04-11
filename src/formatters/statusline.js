const { getMcpCount } = require('./mcp-detail');

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
    line1Parts.push(`Model : ${session.model}`);
  }
  if (d.showLimits) {
    line1Parts.push(formatLimit('5h', session.fiveHour));
    line1Parts.push(formatLimit('7d', session.sevenDay));
  }

  // Line 2: TknCost onwards
  const line2Parts = [];
  if (d.showTkncost) {
    line2Parts.push(`TknCost : ${tknCost}`);
  }
  if (d.showMoncost) {
    line2Parts.push(`MonCost : ${monCost}`);
  }
  if (d.showCache) {
    const cacheStr = cacheHit != null ? `${cacheHit}%` : '--';
    line2Parts.push(`CacheHit% : ${cacheStr}`);
  }
  if (d.showContext) {
    const ctxStr = session.contextPercent != null ? `${session.contextPercent}%` : '--';
    line2Parts.push(`CtxWindow% : ${ctxStr}`);
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
    line2Parts.push(`MCP:${mcpCount}`);
  }

  const lines = [];
  if (line1Parts.length) lines.push(line1Parts.join(sep));
  if (line2Parts.length) lines.push(line2Parts.join(sep));
  return lines;
}

module.exports = { formatStatusLine };
