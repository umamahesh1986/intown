const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
function load(file, require) { const scope = { exports: {}, require }; vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, scope); return scope.exports; }
const sent = [];
const events = load('utils/bookingNotifications.ts', name => name.endsWith('slotBookings') ? { statusStyle: { ACCEPTED: { label: 'Confirmed' }, REJECTED: { label: 'Declined' } } } : name.endsWith('orderPush') ? { send: async p => sent.push(p) } : { searchUserByPhone: async () => ({ customer: { id: 24 } }) });
const push = load('utils/pushNotifications.ts', name => name === 'react-native' ? { Platform: { OS: 'web' } } : {});
(async () => {
  const b = { bookingId: 'SB_1', merchantId: 15, customerPhoneNumber: '9876543210', customerName: 'Customer', merchantName: 'Restaurant', bookingDate: '2026-11-20', startTime: '10:00', endTime: '11:00', status: 'PENDING_APPROVAL' };
  await events.pushBookingEvent(b, true);
  assert.equal(sent[0].toRole, 'merchant'); assert.equal(sent[0].toUserId, 15);
  let item = push.notificationFromPushData(sent[0].data, sent[0].title, sent[0].body);
  assert.equal(item.targetRoute, '/merchant-bookings'); assert.equal(item.bookingDate, b.bookingDate); assert.equal(item.targetTab, 'PENDING_APPROVAL');
  await events.pushBookingEvent({ ...b, status: 'ACCEPTED' }, false);
  assert.equal(sent[1].toRole, 'customer'); assert.equal(sent[1].toUserId, 24); assert.equal(sent[1].title, 'Booking confirmed');
  item = push.notificationFromPushData(sent[1].data, sent[1].title, sent[1].body);
  assert.equal(item.targetRoute, '/my-bookings'); assert.equal(item.pickup_id, b.bookingId); assert.equal(item.bookingDate, b.bookingDate);
  assert.equal(events.bookingNotification({ ...b, status: 'CANCELLED' }, true).kind, 'BOOKING_CANCELLED_MERCHANT');
  assert.ok(events.bookingNotification({ ...b, status: 'REJECTED', merchantActionReason: 'Private event' }, false).body.includes('Private event'));
  const order = push.notificationFromPushData({ type: 'ORDER_RECEIVED_MERCHANT', pickup_id: 'P1', status: 'PLACED' });
  assert.equal(order.targetRoute, '/merchant-orders');
  console.log('Booking notification tests passed: recipients, customer lookup, confirmation, rejection reason, booking-date deep links and existing order routing.');
})().catch(e => { console.error(e); process.exitCode = 1; });
