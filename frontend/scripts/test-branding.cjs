const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const Jimp = require('jimp-compact'), ts = require('typescript');
const root = path.join(__dirname, '..');
(async () => {
  const original = await Jimp.read(path.join(root, 'assets/branding/intown-logo.jpeg'));
  assert.equal(original.bitmap.width, 1600); assert.equal(original.bitmap.height, 781);
  for (const [file, width, height] of [
    ['assets/branding/icon.png', 1024, 1024], ['assets/branding/adaptive-icon.png', 1024, 1024],
    ['assets/branding/favicon.png', 64, 64], ['public/brand/share-preview.png', 1200, 630],
    ['public/brand/apple-touch-icon.png', 180, 180],
  ]) {
    const image = await Jimp.read(path.join(root, file));
    assert.equal(image.bitmap.width, width, file); assert.equal(image.bitmap.height, height, file);
    if (file.includes('share-preview')) assert.equal(Jimp.intToRGBA(image.getPixelColor(0, 0)).a, 255, 'Preview must have opaque orange margins');
  }
  const config = require('../app.json').expo;
  for (const file of [config.icon, config.web.favicon, config.android.adaptiveIcon.foregroundImage, config.plugins.find(p => Array.isArray(p) && p[0] === 'expo-splash-screen')[1].image]) assert.ok(fs.existsSync(path.join(root, file)));
  const embedded = require('../assets/branding/checkout-logo.json').dataUri;
  assert.ok(embedded.startsWith('data:image/png;base64,'));
  assert.equal((await Jimp.read(Buffer.from(embedded.split(',')[1], 'base64'))).bitmap.width, 256);
  for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
    for (const name of ['ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground']) assert.ok(fs.existsSync(path.join(root, `android/app/src/main/res/mipmap-${density}/${name}.png`)));
  }
  const drawings = [], texts = [];
  const ctx = new Proxy({ measureText: text => ({ width: text.length * 20 }), drawImage: image => drawings.push(image.src), fillText: text => texts.push(text) }, { get: (target, key) => target[key] || (() => {}) });
  const canvas = { getContext: () => ctx, toBlob: done => done(new Blob(['png'], { type: 'image/png' })) };
  class MockImage { set src(value) { this._src = value; queueMicrotask(() => this.onload()); } get src() { return this._src; } }
  const scope = { exports: {}, require: name => name === './branding' ? { CHECKOUT_LOGO: embedded } : {}, document: { createElement: () => canvas }, Image: MockImage, Blob, process: { env: {} }, setTimeout, clearTimeout };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, 'utils/shopShare.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, scope);
  await scope.exports.createShopShareImage({ title: 'Merchant', description: 'Description', offers: [], validTill: '', imageUrl: null, downloadUrl: 'https://intownlocal.com/download' });
  assert.equal(drawings[0], embedded, 'Shared image must draw the new embedded logo');
  assert.ok(texts.includes('Download INtown: https://intownlocal.com/download'));
  console.log('Branding checks passed: supplied artwork, square/adaptive icons, opaque social preview, app config, all Android densities, embedded checkout logo, and logo in canvas share exports.');
})().catch(error => { console.error(error); process.exitCode = 1; });
