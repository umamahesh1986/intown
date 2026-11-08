const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const file = path.join(__dirname, '../app/register-member.tsx');
const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handlerSource;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'handleSuccessClose') {
    handlerSource = node.initializer.getText(source);
  }
  ts.forEachChild(node, visit);
}
visit(source);
assert.ok(handlerSource);
const js = ts.transpileModule(`const close = ${handlerSource};`, {
  compilerOptions: { target: ts.ScriptTarget.ES2020 },
}).outputText;

async function check(userType, explicitId) {
  const stored = new Map();
  let savedType;
  let route;
  let timerCleared = false;
  const close = vm.runInNewContext(`${js}\nclose`, {
    user: { userType },
    successTimerRef: { current: 123 },
    clearTimeout: () => { timerCleared = true; },
    setShowSuccessPopup: value => assert.equal(value, false),
    setUserType: async value => { await Promise.resolve(); savedType = value; },
    AsyncStorage: { setItem: async (key, value) => stored.set(key, value) },
    successCustomerId: 42,
    router: { replace: value => {
      assert.ok(savedType, 'Persist account role before navigation');
      assert.ok(stored.has('user_role'));
      route = value;
    } },
  });
  await close(explicitId);
  const dual = userType === 'merchant' || userType === 'dual';
  assert.equal(savedType, dual ? 'dual' : 'member');
  assert.equal(stored.get('user_role'), dual ? 'dual' : 'customer');
  assert.equal(stored.get('user_type'), dual ? 'dual' : 'in_Customer');
  assert.equal(route.pathname, dual ? '/dual-dashboard' : '/member-dashboard');
  assert.equal(route.params.customerId, String(explicitId ?? 42));
  assert.ok(timerCleared);
}

(async () => {
  for (const role of ['merchant', 'dual', 'user', 'member', null]) {
    await check(role, 99); // Automatic dismissal passes the new customer ID.
    await check(role, null); // OK uses the ID saved for the popup.
  }
  console.log('Customer registration routing passed for merchant, dual and customer accounts (OK and automatic dismissal).');
})().catch(error => { console.error(error); process.exitCode = 1; });
