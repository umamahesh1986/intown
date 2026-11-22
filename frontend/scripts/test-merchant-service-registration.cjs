const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('utils/api.ts', 'utf8');
const file = ts.createSourceFile('api.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
let declaration;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(file) === 'registerMerchant') declaration = node.initializer.getText(file);
  ts.forEachChild(node, visit);
}
visit(file);
assert.ok(declaration);
const code = ts.transpileModule(`const registerMerchant = ${declaration};`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
let payload;
const scope = { INTOWN_API_BASE: 'https://example.test/IN', referralNumber: () => null, axios: { post: async (_url, body) => { payload = body; return { data: {} }; } } };
vm.runInNewContext(code, scope);
const register = vm.runInNewContext('registerMerchant', scope);
(async () => {
  await register({ isPickupEnabled: true, isSlotBookingEnabled: false });
  assert.equal(payload.isPickupEnabled, true);
  assert.equal(payload.isSlotBookingEnabled, false);
  await register({ isPickupEnabled: false, isSlotBookingEnabled: true });
  assert.equal(payload.isPickupEnabled, false);
  assert.equal(payload.isSlotBookingEnabled, true);
  console.log('Merchant registration sends both selected service flags.');
})().catch(error => { console.error(error); process.exitCode = 1; });
