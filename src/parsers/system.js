const os = require('os');
const fs = require('fs');
const path = require('path');

const CPU_CACHE_PATH = path.join(os.tmpdir(), 'claude-statusline-cpu.json');

function getCpuUsage() {
  try {
    const cpus = os.cpus();
    const current = cpus.map(c => {
      const total = Object.values(c.times).reduce((a, b) => a + b, 0);
      return { idle: c.times.idle, total };
    });

    let prev = null;
    try {
      prev = JSON.parse(fs.readFileSync(CPU_CACHE_PATH, 'utf8'));
    } catch {
      // no previous data
    }

    // Save current for next run
    try {
      fs.writeFileSync(CPU_CACHE_PATH, JSON.stringify(current));
    } catch {
      // non-critical
    }

    if (prev && prev.length === current.length) {
      let idleDelta = 0;
      let totalDelta = 0;
      for (let i = 0; i < current.length; i++) {
        idleDelta += current[i].idle - prev[i].idle;
        totalDelta += current[i].total - prev[i].total;
      }
      if (totalDelta > 0) {
        return Math.round((1 - idleDelta / totalDelta) * 100);
      }
    }

    // Fallback: snapshot-based estimate
    let idleTotal = 0;
    let allTotal = 0;
    for (const c of current) {
      idleTotal += c.idle;
      allTotal += c.total;
    }
    if (allTotal > 0) {
      return Math.round((1 - idleTotal / allTotal) * 100);
    }
    return null;
  } catch {
    return null;
  }
}

function getMemUsage() {
  try {
    const total = os.totalmem();
    const free = os.freemem();
    if (total === 0) return null;
    return Math.round((1 - free / total) * 100);
  } catch {
    return null;
  }
}

module.exports = { getCpuUsage, getMemUsage };
