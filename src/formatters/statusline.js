const { getMcpCount } = require('./mcp-detail');
const { getGitBranch } = require('../parsers/git');

// ANSI 256-color deep muted palette. Reset to default after each colored section.
// Reference: https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
const COLORS = {
  model: 73,      // deep cyan-teal
  fiveHour: 71,   // deep muted green
  sevenDay: 107,  // deep lime
  tknCost: 173,   // deep peach
  monCost: 179,   // deep gold
  cacheHit: 67,   // deep steel blue
  ctxWindow: 103, // deep lavender (fallback when threshold disabled)
  ctxOk: 108,     // sage green (< 70%)
  ctxWarn: 179,   // gold (70–89%)
  ctxCrit: 167,   // deep red-orange (>= 90%)
  mem: 138,       // deep rose
  cpu: 97,        // deep mauve
  mcp: 72,        // deep teal
  dir: 137,       // tan
  branch: 108,    // sage green
  duration: 144,  // wheat
};
const RESET = '\x1b[0m';

function color(code, text) {
  return `\x1b[38;5;${code}m${text}${RESET}`;
}

function formatBar(usedPct, cells) {
  const n = cells || 20;
  const filled = usedPct != null ? Math.round((usedPct / 100) * n) : 0;
  const empty = n - filled;
  return '[' + '\u2588'.repeat(filled) + ' '.repeat(empty) + ']';
}

function formatLimit(label, limitInfo) {
  const pct = limitInfo.usedPct != null ? `${limitInfo.usedPct}%` : '--';
  const rt = limitInfo.resetTime || '--';
  const bar = formatBar(limitInfo.usedPct, 20);
  return `${label}${bar} ${pct}(${rt})`;
}

function ctxColor(pct) {
  if (pct == null) return COLORS.ctxWindow;
  if (pct >= 90) return COLORS.ctxCrit;
  if (pct >= 70) return COLORS.ctxWarn;
  return COLORS.ctxOk;
}

function formatDuration(ms) {
  const total = !ms || ms < 0 ? 0 : Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = n => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatStatusLine(session, tknCost, monCost, cacheHit, cpu, mem, config) {
  const d = config.display;
  const sep = config.separator;

  // Line 1: Model + dir + branch + rate limits
  const line1Parts = [];
  if (d.showModel) {
    line1Parts.push(color(COLORS.model, `Model : ${session.model}`));
  }
  if (d.showDir && session.dirName) {
    line1Parts.push(color(COLORS.dir, `\uD83D\uDCC1 ${session.dirName}`));
  }
  if (d.showBranch) {
    const branch = getGitBranch(session.currentDir || process.cwd());
    if (branch) line1Parts.push(color(COLORS.branch, `\uD83C\uDF3F ${branch}`));
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
    const pct = session.contextPercent;
    const bar = formatBar(pct, 10);
    const pctStr = pct != null ? `${pct}%` : '--';
    line2Parts.push(color(ctxColor(pct), `CtxWindow${bar} ${pctStr}`));
  }
  if (d.showDuration) {
    line2Parts.push(color(COLORS.duration, `dur: ${formatDuration(session.durationMs)}`));
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
