const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const compile = file => ts.transpileModule(fs.readFileSync(path.join(__dirname, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 } }).outputText;
const profileScope = { exports: {} };
vm.runInNewContext(compile('../utils/merchantProfile.ts'), profileScope);
async function run(userType, lookup, hydrated = true) {
  const calls = [], errors = []; let screenProps;
  const state = { user: { phone: '9999999999', userType }, token: 'test-token', isAuthenticated: true, isGuest: false, isHydrated: hydrated };
  const auth = Object.assign(() => state, { getState: () => state });
  const react = { default: { createElement: (_type, props) => { if (props?.onAction) screenProps = props; return null; } }, useState: initial => [initial, value => { if (typeof value === 'string' && value.includes('merchant profile')) errors.push(value); }], useCallback: cb => cb, useEffect: () => {}, useRef: value => ({ current: value }) };
  const scope = { exports: {}, Date, setInterval: () => 1, clearInterval() {}, require: name => {
    if (name === 'react') return react;
    if (name === 'react-native') return { Platform: { OS: 'web' } };
    if (name === 'expo-router') return { useLocalSearchParams: () => ({}), useFocusEffect: cb => cb() };
    if (name.includes('authStore')) return { useAuthStore: auth };
    if (name.includes('utils/api')) return { INTOWN_API_BASE: 'https://test/IN', searchUserByPhoneAtBase: async () => lookup };
    if (name.includes('merchantProfile')) return profileScope.exports;
    if (name.includes('merchantBookingHistory')) { const history = { exports: {}, require: () => scope.require('../utils/slotBookings') }; vm.runInNewContext(compile('../utils/merchantBookingHistory.ts'), history); return history.exports; }
    if (name.includes('slotBookings')) return { bookingToday: () => '2026-11-16', bookingDates: () => [], bookingPhone: v => v, slotRequest: async (url, token) => { calls.push({ url, token }); return url === '/merchant/action' ? null : []; } };
    if (name.includes('bookingNotifications')) return { pushBookingEvent: async () => {} };
    if (name.includes('BookingUI')) return { bs: {} };
    return {};
  } };
  vm.runInNewContext(compile('../components/BookingListScreen.tsx'), scope);
  scope.exports.default({ merchant: true });
  await new Promise(resolve => setImmediate(resolve));
  return { calls, errors, screenProps };
}
(async () => {
  for (const role of ['member', 'merchant', 'dual', 'IN_MERCHANT']) {
    const result = await run(role, { data: { merchant: { id: 42 } } });
    assert.equal(result.calls.length, 1, `Server merchant profile must work for cached role ${role}`);
    assert.equal(result.calls[0].url, '/merchant/42?date=2026-11-16');
    assert.equal(result.calls[0].token, 'test-token');
  }
  const actionCase = await run('member', { merchant: { id: 42 } });
  assert.equal(await actionCase.screenProps.onAction({ bookingId: 'SB_42', status: 'PENDING_APPROVAL' }, 'ACCEPT'), true, 'A successful action with no response body must still refresh');
  assert.equal(actionCase.calls[1].url, '/merchant/action');
  assert.equal(actionCase.calls[2].url, '/merchant/42?date=2026-11-16');
  const customer = await run('merchant', { customer: { id: 99 } });
  assert.equal(customer.calls.length, 0, 'A customer-only lookup must never request merchant bookings');
  assert.equal(customer.errors.length, 1);
  assert.equal((await run('dual', { merchant: { id: 42 } }, false)).calls.length, 0, 'Wait for auth hydration');
  console.log('Merchant booking access checks passed: stale member role, dual and merchant roles, server ownership, authenticated requests, customer isolation, and hydration.');
})().catch(error => { console.error(error); process.exitCode = 1; });
