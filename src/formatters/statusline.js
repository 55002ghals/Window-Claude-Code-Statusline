const { getMcpCount } = require('./mcp-detail');

// ANSI 256-color deep muted palette. Reset to default after each colored section.
// Reference: https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
const COLORS = {
  model: 73,      // deep cyan-teal
  fiveHour: 71,   // deep muted green
  sevenDay: 107,  // deep lime
  tknCost: 173,   // deep peach
  monCost: 179,   // deep gold
  cacheHit: 67,   // deep steel blue
  ctxWindow: 103, // deep lavender
  mem: 138,       // deep rose
  cpu: 97,        // deep mauve
  mcp: 72,        // deep teal
};
const RESET = '\x1b[0m';

function color(code, text) {
  return `\x1b[38;5;${code}m${text}${RESET}`;
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
    line1Parts.push(color(COLORS.model, `Model : ${session.model}`));
  }
  if (d.showLimits) {
    line1Parts.push(color(COLORS.fiveHour, formatLimit('5h', session.fiveHour)));
    line1Parts.push(color(COLORS.sevenDay, formatLimit('7d', session.sevenDay)));
  }

  // Line 2: TknCost onwards
  const line2Parts = [];
  if (d.showTkncost) {
    line2Parts.push(color(COLORS.tknCost, `TknCost : ${tknCost}`));
  }
  if (d.showMoncost) {
    line2Parts.push(color(COLORS.monCost, `MonCost : ${monCost}`));
  }
  if (d.showCache) {
    const cacheStr = cacheHit != null ? `${cacheHit}%` : '--';
    line2Parts.push(color(COLORS.cacheHit, `CacheHit% : ${cacheStr}`));
  }
  if (d.showContext) {
    const ctxStr = session.contextPercent != null ? `${session.contextPercent}%` : '--';
    line2Parts.push(color(COLORS.ctxWindow, `CtxWindow% : ${ctxStr}`));
  }
  if (d.showMem) {
    const memStr = mem != null ? `${mem}%` : '--';
    line2Parts.push(color(COLORS.mem, `MEM : ${memStr}`));
  }
  if (d.showCpu) {
    const cpuStr = cpu != null ? `${cpu}%` : '--';
    line2Parts.push(color(COLORS.cpu, `CPU : ${cpuStr}`));
  }
  if (d.showMcp) {
    const mcpCount = getMcpCount();
    line2Parts.push(color(COLORS.mcp, `MCP:${mcpCount}`));
  }

  const lines = [];
  if (line1Parts.length) lines.push(line1Parts.join(sep));
  if (line2Parts.length) lines.push(line2Parts.join(sep));
  return lines;
}

module.exports = { formatStatusLine };
