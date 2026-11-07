const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const path = require('node:path');
const calls = [];
const profileCalls = [];
let response = [];
let status = 200;
const context = {
  AbortController, setTimeout, clearTimeout,
  exports: {}, require: () => ({ INTOWN_API_BASE: 'https://test.invalid/IN' }),
  fetch: async (url, options) => {
    if (url.includes('/IN/customer/')) {
      profileCalls.push({ url, options });
      return { ok: true, json: async () => ({ id: 100038, contactName: '  Praveen Kumar  ' }) };
    }
    calls.push({ url, options });
    return { ok: status < 300, json: async () => response };
  },
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../utils/paymentApprovals.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
const { getPendingPayments, approvePayment } = context.exports;
async function check() {
  response = [
    { transactionId: 1, merchantId: 100102, status: 'PENDING_APPROVAL' },
    { transactionId: 2, merchantId: 100102, status: 'COMPLETED' },
    { transactionId: 3, merchantId: 100103, status: 'PENDING_APPROVAL' },
  ];
  const pending = await getPendingPayments(100102, 'merchant-token');
  assert.equal(pending.length, 1);
  assert.equal(pending[0].transactionId, 1);
  assert.equal(calls[0].url, 'https://test.invalid/IN/transactions/merchants/100102/pending');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer merchant-token');
  response = { transactionId: 1, status: 'COMPLETED', pointsEarned: 50 };
  const result = await approvePayment(1, 'merchant-token');
  assert.equal(result.pointsEarned, 50);
  assert.equal(calls[1].url, 'https://test.invalid/IN/transactions/1/merchant-action');
  assert.equal(calls[1].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[1].options.body), { action: 'ACCEPT' });
  assert.ok(calls.every(call => !call.url.includes('/points/credit')), 'Backend approval owns crediting, preventing a duplicate credit');
  status = 400; response = { message: 'Transaction not pending' };
  await assert.rejects(() => approvePayment(1), /Transaction not pending/);
  status = 200; response = { status: 'PENDING_APPROVAL' };
  await assert.rejects(() => approvePayment(1), /has not completed/);
  response = {};
  await assert.rejects(() => getPendingPayments(100102), /Unable to read/);
  response = [
    { transactionId: 10, merchantId: 100102, customerId: 100038, status: 'PENDING_APPROVAL' },
    { transactionId: 11, merchantId: 100102, customerId: 100038, status: 'PENDING_APPROVAL' },
    { transactionId: 12, merchantId: 100102, customerId: 55, customerName: 'Existing Name', status: 'PENDING_APPROVAL' },
  ];
  const named = await getPendingPayments(100102, 'merchant-token');
  assert.equal(named[0].customerName, 'Praveen Kumar');
  assert.equal(named[1].customerName, 'Praveen Kumar');
  assert.equal(named[2].customerName, 'Existing Name');
  assert.equal(profileCalls.length, 1, 'Repeated customer payments share one name lookup');
  assert.equal(profileCalls[0].options.headers.Authorization, 'Bearer merchant-token');
  await getPendingPayments(100102, 'merchant-token');
  assert.equal(profileCalls.length, 1, 'Polling reuses cached customer names');
  response = [{ transactionId: 13, merchantId: 100102, customerId: 100039, status: 'PENDING_APPROVAL' }];
  const mismatch = await getPendingPayments(100102);
  assert.equal(mismatch[0].customerName, '', 'Never show a name from a different customer profile');
  console.log('Pending payment isolation, auth, approval API, server reward response and failed/still-pending approval checks passed.');
}
check().catch(error => { console.error(error); process.exitCode = 1; });
