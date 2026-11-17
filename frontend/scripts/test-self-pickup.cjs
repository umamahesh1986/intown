const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const root = path.join(__dirname, '..');
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const scope = { exports: {} };
vm.runInNewContext(compile(fs.readFileSync(path.join(root, 'utils/selfPickup.ts'), 'utf8')), scope);
const same = scope.exports.isSelfPickup;
assert.equal(same('9346685674', '+91 93466 85674'), true);
assert.equal(same('+919346685674', '9346685674'), true);
assert.equal(same('9346685674', '7386198695'), false);
for (const value of [null, undefined, '', 'bad', '123']) assert.equal(same(value, value), false, 'Missing or invalid numbers must not match');
const file = 'member-shop-details.tsx';
const source = ts.createSourceFile(file, fs.readFileSync(path.join(root, 'app', file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const handlers = {};
(function visit(node) {
  if (ts.isVariableDeclaration(node) && ['openOrderModal', 'handleSubmitOrder'].includes(node.name.getText(source))) handlers[node.name.getText(source)] = node.initializer.getText(source);
  if (ts.isJsxOpeningElement(node)) {
    const attrs = node.attributes.properties;
    const id = attrs.find(a => a.name?.getText(source) === 'testID')?.initializer;
    if (id && ['book-slot-btn', 'shop-navigate-btn', 'shop-payment-btn'].includes(id.text)) {
      const disabled = attrs.find(a => a.name?.getText(source) === 'disabled');
      assert.equal(disabled?.initializer?.expression?.getText(source), 'isSelfPickup');
      const press = attrs.find(a => a.name?.getText(source) === 'onPress');
      handlers[id.text] = press.initializer.expression.getText(source);
    }
  }
  ts.forEachChild(node, visit);
})(source);
(async () => {
  for (const name of ['openOrderModal', 'handleSubmitOrder', 'book-slot-btn', 'shop-navigate-btn', 'shop-payment-btn']) {
    assert.ok(handlers[name]);
    const handler = vm.runInNewContext(compile(`const handler = ${handlers[name]};`) + '\nhandler', { canPickAtStore: true, isSelfPickup: true });
    await handler(); // Any access beyond the guard fails because state/API dependencies are absent.
  }
  console.log('Self-pickup checks passed: matching phones, +91 normalization, other stores, missing phones, and disabled pickup, booking, navigation and payment handlers.');
})().catch(error => { console.error(error); process.exitCode = 1; });
