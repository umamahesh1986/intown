const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const calls = [];
let status = 200, result = [];
const scope = { exports: {}, require: () => ({ INTOWN_API_BASE: 'https://test/IN' }), AbortController, setTimeout, clearTimeout, fetch: async (url, options) => { calls.push({ url, options }); return { ok: status < 400, status, json: async () => result }; } };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../utils/slotBookings.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, scope);
const api = scope.exports;
(async () => {
  assert.equal(api.bookingDates('2026-12-28').join(','), '2026-12-28,2026-12-29,2026-12-30,2026-12-31,2027-01-01,2027-01-02,2027-01-03,2027-01-04');
  const start = Date.parse('2026-11-18T10:00:00+05:30');
  const booking = { status: 'ACCEPTED', bookingDate: '2026-11-18', startTime: '10:00' };
  assert.equal(api.slotStart(booking.bookingDate, booking.startTime), start);
  assert.equal(api.canCancel(booking, start - 3600000), true);
  assert.equal(api.canCancel(booking, start - 3599999), false);
  assert.equal(api.canCancel({ ...booking, status: 'PENDING_APPROVAL' }, start), true);
  for (const status of ['CANCELLED', 'EXPIRED', 'REJECTED', 'COMPLETED', 'NO_SHOW']) assert.equal(api.canCancel({ ...booking, status }, start - 7200000), false);
  const slot = { status: 'AVAILABLE', availableCapacity: 2, startTime: '10:00' };
  assert.equal(api.canRequest('2026-11-18', slot, start - 3600000), true);
  assert.equal(api.canRequest('2026-11-18', slot, start - 3599999), false);
  for (const status of ['BOOKED', 'BREAK', 'PAST', 'CLOSED']) assert.equal(api.canRequest('2026-11-18', { ...slot, status }, start - 7200000), false);
  assert.equal(api.canRequest('2026-11-18', { ...slot, availableCapacity: 0 }, start - 7200000), false);
  assert.equal(api.bookingPhone('+91 98765 43210'), '9876543210');
  await assert.rejects(api.slotRequest('/customer/9876543210', null), /sign in/);
  assert.equal(calls.length, 0);
  for (const path of ['/available?merchantId=15&date=2026-11-18', '/customer/9876543210', '/merchant/15?date=2026-11-18']) { await api.slotRequest(path, 'token'); assert.equal(calls.at(-1).url, 'https://test/IN/slots' + path); assert.equal(calls.at(-1).options.method, 'GET'); assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer token'); }
  const body = { merchantId: 15, customerPhoneNumber: '9876543210', customerName: 'Customer', bookingDate: '2026-11-18', startTime: '10:00', numberOfPeople: 4, notes: 'Indoor table' };
  await api.slotRequest('/book', 'token', body);
  assert.equal(calls.at(-1).options.body, JSON.stringify(body));
  for (const action of ['ACCEPT', 'REJECT', 'COMPLETE', 'NO_SHOW']) { await api.slotRequest('/merchant/action', 'token', { bookingId: 'SB_1', action, ...(action === 'REJECT' ? { reason: 'Unavailable' } : {}) }); assert.equal(JSON.parse(calls.at(-1).options.body).action, action); }
  await api.slotRequest('/cancel/SB_1?customerPhone=9876543210', 'token', {}); assert.equal(calls.at(-1).options.method, 'POST');
  for (const code of [400, 401, 403, 409, 500]) { status = code; result = { message: 'Backend explanation' }; await assert.rejects(api.slotRequest('/book', 'token', body), e => e.status === code && e.message === result.message); }
  console.log('Slot booking checks passed: India time, date window, cancellation cutoff, availability, authentication, six API contracts and backend errors.');
})().catch(e => { console.error(e); process.exitCode = 1; });
