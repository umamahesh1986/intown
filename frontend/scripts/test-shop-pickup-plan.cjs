const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const text = fs.readFileSync(path.join(__dirname, '..', 'app/member-shop-details.tsx'), 'utf8');
const source = ts.createSourceFile('shop.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let expression;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'canPickAtStore') expression = node.initializer.getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
assert.ok(expression);
for (const value of [true, false, undefined, null, 'true']) {
  const js = ts.transpileModule(expression, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  assert.equal(vm.runInNewContext(js, { shop: { isPickupEnabled: value } }), value === true);
}
assert.match(text, /isPickupEnabled: details\.isPickupEnabled === true/);
assert.match(text, /\{shop\.isSlotBookingEnabled === true && !isSelfPickup && \(/);
console.log('Shop feature visibility follows the API boolean flags.');
