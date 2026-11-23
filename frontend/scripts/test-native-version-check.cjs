const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('utils/versionCheck.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
async function run(platform, available, app) {
  const calls = [];
  const scope = { exports: {}, console, require: name => {
    if (name === 'react-native') return { Platform: { OS: platform }, NativeModules: { StoreUpdate: { check: async () => available }, Storefront: { country: async () => 'IND' } } };
    if (name === 'expo-application') return { nativeApplicationVersion: '1.3.3', nativeBuildVersion: '69', applicationId: platform === 'android' ? 'com.intown.andriod' : 'com.vinodreddy.intownlocal' };
    if (name === 'axios') return { default: { get: async (...args) => { calls.push(args); return { data: { results: [app] } }; } }, __esModule: true };
    if (name.includes('storefrontCountries')) return { default: { IND: 'IN' }, __esModule: true };
    return {};
  } };
  vm.runInNewContext(source, scope);
  return { result: await scope.exports.checkForUpdate(), compare: scope.exports.compareVersion, calls };
}
(async () => {
  const android = await run('android', true);
  assert.equal(android.result.updateRequired, true); assert.equal(android.calls.length, 0);
  assert.equal(android.compare('1.10', '1.9.9'), 1); assert.equal(android.compare('1.0', '1.0.0'), 0);
  const app = { trackId: 6766092424, bundleId: 'com.vinodreddy.intownlocal', version: '1.4.0', kind: 'software' };
  const ios = await run('ios', false, app);
  assert.equal(ios.result.updateRequired, true); assert.equal(ios.calls[0][1].params.country, 'in');
  const wrong = await run('ios', false, { ...app, bundleId: 'com.other' });
  assert.equal(wrong.result.checked, false); assert.equal(wrong.result.updateRequired, false);
  console.log('Play availability, numeric versions, storefront and app identity checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
