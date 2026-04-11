const fs = require('fs');
const path = require('path');
const os = require('os');
const { findRates } = require('./cost');

function calcMonthlyTokenCost(config) {
  if (config.plan !== 'api') return null; // subscription users handled by cost.js

  const statsPath = path.join(os.homedir(), '.claude', 'stats-cache.json');
  let stats;
  try {
    stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  } catch {
    return '$0.00';
  }

  const dailyTokens = stats.dailyModelTokens;
  if (!dailyTokens || typeof dailyTokens !== 'object') return '$0.00';

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `${year}-${month}-`;

  let totalCost = 0;

  for (const [date, models] of Object.entries(dailyTokens)) {
    if (!date.startsWith(prefix)) continue;
    for (const [modelId, usage] of Object.entries(models)) {
      const rates = findRates(modelId, config.pricing);
      if (!rates) continue;

      const input = usage.inputTokens || 0;
      const output = usage.outputTokens || 0;
      const cacheWrite = usage.cacheCreationInputTokens || 0;
      const cacheRead = usage.cacheReadInputTokens || 0;

      totalCost +=
        (input / 1e6) * rates.input +
        (output / 1e6) * rates.output +
        (cacheWrite / 1e6) * rates.cacheWrite +
        (cacheRead / 1e6) * rates.cacheRead;
    }
  }

  return '$' + totalCost.toFixed(2);
}

module.exports = { calcMonthlyTokenCost };
