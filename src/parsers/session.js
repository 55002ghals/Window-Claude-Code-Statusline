const path = require('path');

function formatResetTime(resetsAt, short) {
  if (!resetsAt) return '--';
  // Claude Code sends Unix epoch SECONDS per official docs.
  // Accept ISO string as fallback for test fixtures.
  const d = typeof resetsAt === 'number'
    ? new Date(resetsAt * 1000)
    : new Date(resetsAt);
  if (isNaN(d.getTime())) return '--';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (short) return `${hh}:${mm}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
}

function parseLimitEntry(entry, short) {
  if (!entry) return { usedPct: null, resetTime: '--' };
  const usedPct = entry.used_percentage != null ? Math.round(entry.used_percentage) : null;
  const resetTime = formatResetTime(entry.resets_at, short);
  return { usedPct, resetTime };
}

function parseSession(data) {
  const model = data?.model?.display_name || data?.model?.id || '--';

  const ctxUsedPct = data?.context_window?.used_percentage;
  const contextPercent = ctxUsedPct != null ? Math.round(ctxUsedPct) : null;

  const usage = data?.context_window?.current_usage || {};
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  const cacheCreation = usage.cache_creation_input_tokens || 0;
  const cacheRead = usage.cache_read_input_tokens || 0;

  const rateLimits = data?.rate_limits || null;
  const fiveHour = parseLimitEntry(rateLimits?.five_hour, true);
  const sevenDay = parseLimitEntry(rateLimits?.seven_day, false);

  const currentDir = data?.workspace?.current_dir || '';
  const dirName = currentDir ? path.basename(currentDir) : '';
  const durationMs = data?.cost?.total_duration_ms || 0;

  return {
    model,
    contextPercent,
    tokens: { inputTokens, outputTokens, cacheCreation, cacheRead },
    fiveHour,
    sevenDay,
    currentDir,
    dirName,
    durationMs,
  };
}

module.exports = { parseSession };
