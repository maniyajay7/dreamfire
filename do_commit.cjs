const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const localIndex = path.join(os.tmpdir(), 'dreamfire_local_git_index');
const env = { ...process.env, GIT_INDEX_FILE: localIndex };

try {
  // If localIndex doesn't exist or is stale, initialize it from HEAD
  if (!fs.existsSync(localIndex) || fs.statSync(localIndex).size === 0) {
    execSync('git -C Z:/dreamfire read-tree HEAD', { env });
  }

  execSync('git -C Z:/dreamfire add -A', { env, stdio: 'inherit' });
  const status = execSync('git -C Z:/dreamfire status -s', { env, encoding: 'utf8' });
  console.log('Status before commit:\n', status);

  if (status.trim().length > 0) {
    execSync('git -C Z:/dreamfire commit -m "feat(ayodhya realism): eradicate bowling pins with anatomical human silhouettes, fix underground camera spawn, and upgrade sandstone photo texture"', { env, stdio: 'inherit' });
    console.log('Committed!');
    execSync('git -C Z:/dreamfire push origin main', { env, stdio: 'inherit' });
    console.log('Pushed to GitHub main!');
  } else {
    console.log('Working tree clean, nothing to commit.');
  }
} catch (e) {
  console.error('Git error:', e.message);
} finally {
  if (fs.existsSync('Z:/dreamfire/do_commit.cjs')) {
    fs.unlinkSync('Z:/dreamfire/do_commit.cjs');
  }
}
