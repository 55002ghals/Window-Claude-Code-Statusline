const fs = require('fs');
const path = require('path');
const os = require('os');

const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
const indexPath = path.join(__dirname, 'src', 'index.js').replace(/\\/g, '/');

function install() {
  let settings = {};

  // Read existing settings
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch {
    // File doesn't exist or is invalid, start fresh
  }

  // Backup existing settings
  if (Object.keys(settings).length > 0) {
    const backupPath = settingsPath + '.backup-' + Date.now();
    try {
      fs.writeFileSync(backupPath, JSON.stringify(settings, null, 2));
      console.log('Backup created:', backupPath);
    } catch (e) {
      console.error('Failed to create backup:', e.message);
      return;
    }
  }

  // Insert or update statusLine
  settings.statusLine = {
    type: 'command',
    command: `node ${indexPath}`,
  };

  // Ensure .claude directory exists
  const claudeDir = path.dirname(settingsPath);
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log('StatusLine configured in:', settingsPath);
  console.log('Command:', settings.statusLine.command);
  console.log('\nTo customize, add flags like --no-cpu --no-mem to the command string.');
}

install();
