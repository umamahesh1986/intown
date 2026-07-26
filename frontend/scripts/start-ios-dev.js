#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const iosDir = path.join(root, 'ios');
const workspace = path.join(iosDir, 'Intown.xcworkspace');
const metroPort = 8081;

function checkMetroRunning() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${metroPort}/status`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function ensureIosProject() {
  if (!fs.existsSync(workspace)) {
    console.log('iOS project not found. Running expo prebuild...');
    execSync('npx expo prebuild --platform ios --no-install', {
      cwd: root,
      stdio: 'inherit',
    });
    execSync('pod install', { cwd: iosDir, stdio: 'inherit' });
  }
}

async function main() {
  ensureIosProject();

  const metroRunning = await checkMetroRunning();
  if (!metroRunning) {
    console.log('Starting Metro bundler (required for Expo dev client)...');
    const metro = spawn('npx', ['expo', 'start', '--dev-client'], {
      cwd: root,
      detached: true,
      stdio: 'ignore',
    });
    metro.unref();

    for (let i = 0; i < 30; i += 1) {
      await new Promise((r) => setTimeout(r, 1000));
      if (await checkMetroRunning()) {
        console.log('Metro is ready on http://localhost:8081');
        break;
      }
    }
  } else {
    console.log('Metro already running on http://localhost:8081');
  }

  console.log('Opening Xcode...');
  console.log('In Xcode: select iPhone 17 simulator, then press Run (⌘R).');
  execSync(`open "${workspace}"`, { stdio: 'inherit' });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
