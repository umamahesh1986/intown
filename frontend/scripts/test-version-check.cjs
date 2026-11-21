// Verifies store lookups + parsing used by utils/versionCheck.ts against live stores.
// Run: node scripts/test-version-check.cjs
const Module = require('module');
const axios = require('axios');

const platform = { OS: process.env.TEST_PLATFORM || 'ios' };
const installed = process.env.TEST_INSTALLED || '1.0.0';
const origLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === 'react-native') return { Platform: platform };
  if (request === 'expo-application') return { nativeApplicationVersion: installed };
  if (request === './api') return { IS_PRODUCTION_API: process.env.TEST_ENV !== 'dev' };
  return origLoad.call(this, request, ...rest);
};

const vc = (() => {
  const path = require('path');
  const file = path.join(__dirname, '../utils/versionCheck.ts');
  const { code } = require('@babel/core').transformFileSync(file, {
    filename: file, babelrc: false, configFile: false,
    presets: ['@babel/preset-typescript'], plugins: ['@babel/plugin-transform-modules-commonjs'],
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', code)(m, m.exports, require);
  return m.exports;
})();
const assert = (c, msg) => { console.log((c ? 'PASS' : 'FAIL') + ' - ' + msg); if (!c) process.exitCode = 1; };

(async () => {
  assert(vc.compareVersion('1.3.3', '1.3.3') === 0, 'equal versions → no update');
  assert(vc.compareVersion('1.3.3', '1.3.4') < 0, '1.3.3 < 1.3.4 → update');
  assert(vc.compareVersion('1.3.3', '2.0.0') < 0, '1.3.3 < 2.0.0 → update');
  assert(vc.compareVersion('1.3', '1.3.0') === 0, '1.3 == 1.3.0');
  assert(vc.compareVersion('1.10.0', '1.9.9') > 0, '1.10.0 > 1.9.9 → no update');
  assert(vc.pickItunesApp([{ bundleId: 'com.other', trackId: 1, version: '9.9' }]) === null, 'unrelated app is ignored');

  if (process.env.TEST_ENV === 'dev') {
    platform.OS = 'android';
    const r = await vc.checkForUpdate();
    assert(r.updateRequired === false && r.storeVersion === null, 'dev/preview build never shows popup');
    assert(vc.IS_UPDATE_CHECK_ENABLED === false, 'dev/preview build: update check disabled');
    return;
  }
  const play = await axios.get('https://play.google.com/store/apps/details?id=com.intown.andriod&hl=en_IN&gl=IN', { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' }, timeout: 15000 });
  const playVersion = vc.parsePlayStoreVersion(play.data);
  assert(/^\d+(\.\d+)+$/.test(playVersion || ''), `Play Store version parsed: ${playVersion}`);

  platform.OS = 'ios';
  const ios = await vc.checkForUpdate();
  assert(ios.storeVersion && /^\d+(\.\d+)+$/.test(ios.storeVersion), `iOS checkForUpdate store=${ios.storeVersion} url=${ios.storeUrl}`);
  assert(ios.updateRequired === (vc.compareVersion(installed, ios.storeVersion) < 0), `iOS updateRequired=${ios.updateRequired} for installed ${installed}`);

  platform.OS = 'android';
  const android = await vc.checkForUpdate();
  assert(android.storeVersion && /^\d+(\.\d+)+$/.test(android.storeVersion), `Android checkForUpdate store=${android.storeVersion} url=${android.storeUrl}`);
  assert(android.updateRequired === (vc.compareVersion(installed, android.storeVersion) < 0), `Android updateRequired=${android.updateRequired} for installed ${installed}`);

  assert(vc.IS_UPDATE_CHECK_ENABLED === true, 'production build: update check enabled');
  platform.OS = 'web';
  const web = await vc.checkForUpdate();
  assert(web.updateRequired === false && web.storeVersion === null, 'web never shows update popup');
})().catch((e) => { console.log('FAIL - ' + e.message); process.exitCode = 1; });
