const fs = require('fs');
const path = require('path');

function resolveGitDir(dotGitPath) {
  try {
    const stat = fs.statSync(dotGitPath);
    if (stat.isDirectory()) return dotGitPath;
    // .git is a file (worktree/submodule): `gitdir: <path>`
    const content = fs.readFileSync(dotGitPath, 'utf8').trim();
    const m = content.match(/^gitdir:\s*(.+)$/);
    if (m) return path.resolve(path.dirname(dotGitPath), m[1]);
    return null;
  } catch {
    return null;
  }
}

function getGitBranch(startDir) {
  if (!startDir) return null;
  let dir = startDir;
  while (true) {
    const dotGit = path.join(dir, '.git');
    if (fs.existsSync(dotGit)) {
      const gitDir = resolveGitDir(dotGit);
      if (!gitDir) return null;
      try {
        const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
        const ref = head.match(/^ref:\s*refs\/heads\/(.+)$/);
        if (ref) return ref[1];
        return head.slice(0, 7); // detached HEAD → short sha
      } catch {
        return null;
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

module.exports = { getGitBranch };
