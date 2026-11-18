// Expo prebuild creates WebP launcher icons alongside our branded PNG assets.
// Android identifies resources by filename without extension, so keep the PNG
// when both formats exist. Leave WebP-only resources untouched.
const fs = require('node:fs');
const path = require('node:path');
function dedupeLauncher(res) {
  if (!fs.existsSync(res)) return 0;
  let removed = 0;
  for (const entry of fs.readdirSync(res, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith('mipmap-')) continue;
    for (const name of ['ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground']) {
      const base = path.join(res, entry.name, name);
      if (fs.existsSync(`${base}.png`) && fs.existsSync(`${base}.webp`)) {
        fs.unlinkSync(`${base}.webp`);
        removed++;
      }
    }
  }
  return removed;
}
module.exports = { dedupeLauncher };
if (require.main === module) {
  const count = dedupeLauncher(path.resolve(__dirname, '../android/app/src/main/res'));
  console.log(`Android launcher resources checked: removed ${count} duplicate WebP icons.`);
}
