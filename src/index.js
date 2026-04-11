const { loadConfig, resolvePlan } = require('./config');
const { parseSession } = require('./parsers/session');
const { calcTokenCost, calcMonthlyCost, calcCacheHitRatio } = require('./parsers/cost');
const { calcMonthlyTokenCost } = require('./parsers/stats');
const { getCpuUsage, getMemUsage } = require('./parsers/system');
const { formatStatusLine } = require('./formatters/statusline');

function main() {
  let inputData = '';

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    inputData += chunk;
  });
  process.stdin.on('end', () => {
    try {
      const config = loadConfig();
      const data = JSON.parse(inputData || '{}');
      config.plan = resolvePlan(config, data);
      const session = parseSession(data);

      // Cost
      const modelId = data?.model?.id || '';
      const tknCostResult = calcTokenCost(session.tokens, modelId, config);
      const tknCost = tknCostResult.display;

      // Monthly cost
      let monCost = calcMonthlyCost(config);
      if (monCost === null) {
        monCost = calcMonthlyTokenCost(config) || '$0.00';
      }

      // Cache hit ratio
      const cacheHit = calcCacheHitRatio(session.tokens);

      // System resources
      const cpu = getCpuUsage();
      const mem = getMemUsage();

      // Format and output as fixed 2 lines - console.log per line for Claude Code multiline
      const lines = formatStatusLine(session, tknCost, monCost, cacheHit, cpu, mem, config);
      lines.forEach(line => console.log(line));
    } catch {
      console.log('StatusLine: error');
    }
  });
}

main();
