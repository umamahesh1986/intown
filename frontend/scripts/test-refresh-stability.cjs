const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const compile = source => ts.transpileModule(source, { fileName: 'test.tsx', compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;

const notificationPoller = fs.readFileSync(path.join(root, 'components/OrderNotificationPoller.tsx'), 'utf8');
assert.ok(notificationPoller.includes('const POLL_INTERVAL_MS = 15000;'), 'Frontend order notifications check every 15 seconds');
assert.ok(notificationPoller.includes('setInterval(() => { void tick(); }, POLL_INTERVAL_MS)'), 'Schedule the frontend notification check');
assert.ok(notificationPoller.includes('clearInterval(timer)'), 'Stop notification polling when leaving the page');
assert.ok(notificationPoller.includes('subscription.remove()'), 'Remove the resume listener when leaving the page');

for (const file of ['app/user-dashboard.tsx', 'app/member-dashboard.tsx', 'app/dual-dashboard.tsx']) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = node => {
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'setInterval') {
      assert.ok(!/loadNearbyShops|refreshPoints|fetchCustomerTransactions/.test(node.arguments[0].getText(source)), 'Do not schedule repeated dashboard-wide API reloads');
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

let current = 0; let effect; let cleanup; const starts = [];
const animation = { stopAnimation() {}, addListener() { return 'listener'; }, removeListener() {} };
const context = { exports: {}, require: name => name === 'react' ? {
  useRef: () => ({ current: animation }), useState: () => [current, value => { current = value; }], useEffect: callback => { effect = callback; },
} : { Animated: { Value: function () {}, timing: (_animation, { toValue }) => ({ start: callback => { starts.push({ from: current, to: toValue }); current = toValue; callback({ finished: true }); }, stop() {} }) }, Easing: { cubic: 'cubic', out: value => value } } };
vm.runInNewContext(compile(fs.readFileSync(path.join(root, 'components/AnimatedNumber.tsx'), 'utf8')), context);
context.exports.useAnimatedNumber(102); cleanup = effect(); cleanup();
context.exports.useAnimatedNumber(110); cleanup = effect(); cleanup();
assert.deepEqual(starts, [{ from: 0, to: 102 }, { from: 102, to: 110 }], 'Updated counts animate from the current value instead of resetting to zero');

async function checkRewards() {
  const text = fs.readFileSync(path.join(root, 'app/rewards.tsx'), 'utf8');
  const source = ts.createSourceFile('rewards.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let callback;
  const visit = node => {
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useFocusEffect' && node.arguments[0]?.getText(source).includes('loadCustomerPoints')) callback = node.arguments[0].arguments[0].getText(source);
    ts.forEachChild(node, visit);
  };
  visit(source); assert.ok(callback);
  for (const firstLoad of [true, false]) {
    const calls = []; let fetched = 0;
    const scope = {
      user: { phone: '9876543210', id: '42' }, historyOnly: false,
      loadedAccount: { current: firstLoad ? '' : '9876543210:42:false' },
      setLoading: value => calls.push(['loading', value]), setError() {},
      setCustomerId() {}, setPaymentCustomerId() {},
      setBalance: value => calls.push(['balance', value]), setActivity: value => calls.push(['activity', value]),
      resolveCustomerId: async () => '42', resolvePaymentCustomerId: async () => '42',
      fetchData: async () => { fetched++; }, console,
    };
    const handler = vm.runInNewContext(compile(`const handler = ${callback}; handler;`), scope);
    const dispose = handler(); await new Promise(resolve => setImmediate(resolve)); dispose();
    assert.equal(fetched, 1);
    assert.equal(calls.length, firstLoad ? 3 : 0, 'Returning to rewards must preserve the mounted list, balance and scroll position');
  }
  console.log('Dashboard polling removal, count update continuity and Rewards focus/list retention checks passed.');
}
checkRewards().catch(error => { console.error(error); process.exitCode = 1; });
