const fs = require('fs');
const path = require('path');

const DEFAULT_PRICING = {
  'claude-opus-4-6': { input: 15.0, output: 75.0, cacheWrite: 18.75, cacheRead: 1.5 },
  'claude-sonnet-4-6': { input: 3.0, output: 15.0, cacheWrite: 3.75, cacheRead: 0.3 },
  'claude-haiku-4-5': { input: 0.8, output: 4.0, cacheWrite: 1.0, cacheRead: 0.08 },
};

const DEFAULT_SUBSCRIPTION_COST = {
  pro: 20,
  max: 100,
  max5x: 200,
};

const DISPLAY_FLAGS = [
  'model', 'context', 'tkncost', 'moncost', 'cache', 'limits', 'cpu', 'mem', 'mcp',
  'dir', 'branch', 'duration',
];

function parseFlags(argv) {
  const display = {};
  for (const flag of DISPLAY_FLAGS) {
    display['show' + flag.charAt(0).toUpperCase() + flag.slice(1)] = true;
  }
  for (const arg of argv) {
    const match = arg.match(/^--no-(\w+)$/);
    if (match) {
      const key = match[1].toLowerCase();
      const propName = 'show' + key.charAt(0).toUpperCase() + key.slice(1);
      if (propName in display) {
        display[propName] = false;
      }
    }
  }
  return display;
}

function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.json');
  let userConfig = {};
  try {
    userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    // config.json not found or invalid, use defaults
  }

  const plan = userConfig.plan || 'auto';
  const separator = userConfig.separator || ' | ';

  const pricing = { ...DEFAULT_PRICING };
  if (userConfig.pricing) {
    for (const [model, rates] of Object.entries(userConfig.pricing)) {
      pricing[model] = { ...(pricing[model] || {}), ...rates };
    }
  }

  const subscriptionCost = { ...DEFAULT_SUBSCRIPTION_COST, ...userConfig.subscriptionCost };
  const display = parseFlags(process.argv);

  return { plan, pricing, subscriptionCost, separator, display };
}

function resolvePlan(config, stdinData) {
  if (config.plan !== 'auto') return config.plan;
  if (stdinData?.rate_limits) return 'pro';
  return 'api';
}

module.exports = { loadConfig, resolvePlan };
