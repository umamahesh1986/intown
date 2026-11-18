const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { dedupeLauncher } = require('./dedupe-android-launcher.cjs');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'intown-launcher-'));
try {
  for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
    const dir = path.join(temp, `mipmap-${density}`); fs.mkdirSync(dir);
    for (const name of ['ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground']) {
      fs.writeFileSync(path.join(dir, `${name}.png`), 'new-logo');
      fs.writeFileSync(path.join(dir, `${name}.webp`), 'prebuild-logo');
    }
    fs.writeFileSync(path.join(dir, 'unrelated.webp'), 'keep');
  }
  const webpOnly = path.join(temp, 'mipmap-anydpi'); fs.mkdirSync(webpOnly);
  fs.writeFileSync(path.join(webpOnly, 'ic_launcher.webp'), 'keep');
  assert.equal(dedupeLauncher(temp), 15);
  assert.equal(dedupeLauncher(temp), 0);
  assert.ok(fs.existsSync(path.join(webpOnly, 'ic_launcher.webp')));
  assert.ok(fs.existsSync(path.join(temp, 'mipmap-mdpi/unrelated.webp')));
  assert.equal(fs.readFileSync(path.join(temp, 'mipmap-mdpi/ic_launcher.png'), 'utf8'), 'new-logo');
  const scripts = require('../package.json').scripts;
  for (const task of ['prebuild', 'postinstall']) assert.ok(scripts[task].endsWith('node scripts/dedupe-android-launcher.cjs'));
  console.log('Launcher regression passed: all densities, branded PNG preserved, WebP-only/unrelated resources preserved, repeat runs and install/prebuild hooks.');
} finally {
  // Remove only the files/directories created in this test; no recursive delete.
  for (const dir of fs.readdirSync(temp)) {
    for (const file of fs.readdirSync(path.join(temp, dir))) fs.unlinkSync(path.join(temp, dir, file));
    fs.rmdirSync(path.join(temp, dir));
  }
  fs.rmdirSync(temp);
}
