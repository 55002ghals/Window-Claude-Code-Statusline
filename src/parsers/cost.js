function calcTokenCost(tokens, modelId, config) {
  if (config.plan !== 'api') {
    return { display: '(Sub)', raw: 0 };
  }

  const rates = findRates(modelId, config.pricing);
  if (!rates) {
    return { display: '$?', raw: 0 };
  }

  const cost =
    (tokens.inputTokens / 1e6) * rates.input +
    (tokens.outputTokens / 1e6) * rates.output +
    (tokens.cacheCreation / 1e6) * rates.cacheWrite +
    (tokens.cacheRead / 1e6) * rates.cacheRead;

  return { display: '$' + cost.toFixed(2), raw: cost };
}

function calcMonthlyCost(config) {
  if (config.plan !== 'api') {
    const subCost = config.subscriptionCost[config.plan] || 0;
    const label = config.plan.charAt(0).toUpperCase() + config.plan.slice(1);
    return '$' + subCost + '(' + label + ')';
  }
  return null; // stats.js will provide the monthly cost for API users
}

function findRates(modelId, pricing) {
  if (!modelId) return null;
  const id = modelId.toLowerCase();
  // Direct match
  if (pricing[id]) return pricing[id];
  // Partial match (e.g., "claude-opus-4-6" in "claude-opus-4-6-20260301")
  for (const [key, rates] of Object.entries(pricing)) {
    if (id.includes(key) || key.includes(id)) return rates;
  }
  return null;
}

function calcCacheHitRatio(tokens) {
  const total = tokens.inputTokens + tokens.cacheRead + tokens.cacheCreation;
  if (total === 0) return null;
  return Math.round((tokens.cacheRead / total) * 100);
}

module.exports = { calcTokenCost, calcMonthlyCost, calcCacheHitRatio, findRates };
