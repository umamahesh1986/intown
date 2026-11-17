const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const root = path.join(__dirname, '..');
const compile = text => ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const special = { exports: {} };
vm.runInNewContext(compile(fs.readFileSync(path.join(root, 'utils/specialOffer.ts'), 'utf8')), special);
const util = { exports: {}, require: () => special.exports };
vm.runInNewContext(compile(fs.readFileSync(path.join(root, 'utils/shopShare.ts'), 'utf8')), util);
const shop = { id: 100115, businessName: 'Diya Resto', description: 'Fresh meals and family dining', offer: 'Lunch special', address: 'Hyderabad' };
const content = util.exports.buildShopShareContent(shop, [], Date.now());
assert.ok(content.caption.includes(shop.businessName));
assert.ok(content.caption.includes(shop.description));
assert.ok(content.caption.includes('https://intownlocal.com/download'));
assert.ok(!content.caption.includes('intown://'));
const source = ts.createSourceFile('ShopShareModal.tsx', fs.readFileSync(path.join(root, 'components/ShopShareModal.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let expression;
(function walk(node) { if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'sharePost') expression = node.initializer.getText(source); ts.forEachChild(node, walk); })(source);
assert.ok(expression);
async function run(os, network, nav = {}) {
  const sent = [], opened = [], errors = [], copied = [];
  const scope = {
    busy: false, ready: false, shareShop: shop, images: [], content,
    buildShopShareContent: () => content, Platform: { OS: os },
    setNow() {}, setHint() {}, setBusy() {}, setError: value => { if (value) errors.push(value); },
    Share: { share: async value => sent.push(value) },
    Linking: { openURL: async value => opened.push(value) },
    Clipboard: { setStringAsync: async value => copied.push(value) },
    navigator: nav === null ? {} : { share: async value => sent.push(value) },
    Date, encodeURIComponent,
  };
  const share = vm.runInNewContext(compile(`const sharePost = ${expression};`) + '\nsharePost', scope);
  await share(network);
  return { sent, opened, errors, copied };
}
(async () => {
  for (const os of ['android', 'ios']) {
    const result = await run(os);
    assert.equal(result.sent[0].message, content.caption);
    assert.equal(result.errors.length, 0, 'Text sharing must work even when image is not ready');
  }
  const web = await run('web');
  assert.equal(web.sent[0].text, content.caption);
  assert.equal(web.sent[0].files, undefined, 'Default sharing must not become a file-only post');
  for (const os of ['web', 'android', 'ios']) {
    const result = await run(os, 'WhatsApp');
    assert.equal(new URL(result.opened[0]).searchParams.get('text'), content.caption);
  }
  const fallback = await run('web', undefined, null);
  assert.equal(fallback.copied[0], content.caption);
  console.log('Merchant text sharing passed: name, description, public download link, native iOS/Android payloads, WhatsApp text, browser sharing and clipboard fallback.');
})().catch(error => { console.error(error); process.exitCode = 1; });
