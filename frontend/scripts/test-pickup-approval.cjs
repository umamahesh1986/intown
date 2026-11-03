const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function initializer(file, name, globals) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression;
  const visit = node => {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name) expression = node.initializer.getText(source);
    ts.forEachChild(node, visit);
  };
  visit(source); assert.ok(expression, name);
  const js = ts.transpileModule(`const tested = ${expression};`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  return vm.runInNewContext(`${js}\ntested`, globals);
}

async function main() {
  for (const status of [201, 400]) {
    const calls = []; const notices = []; let underReview = false;
    const pay = initializer('components/PaymentModal.tsx', 'handlePayNow', {
      amount: '500', amountValue: 500, intownPrice: 450, intownSavings: 50, finalPaidAmount: 450,
      customerId: '100042', merchantId: '100102', INTOWN_API_BASE: 'https://test.invalid/IN',
      setIsSubmitting() {}, setShowSuccess: value => { underReview = value; },
      Alert: { alert: (...args) => notices.push(args) }, console: { log() {}, error() {} },
      AbortController, setTimeout, clearTimeout,
      fetch: async (url, options) => {
        calls.push({ url, options });
        // An error response containing an ID must never count as payment success.
        return { ok: status === 201, status, json: async () => ({ transactionId: 123 }) };
      },
    });
    await pay();
    assert.equal(calls.length, 1, 'Payment only submits the transaction, never credits INcoins');
    assert.equal(calls[0].url, 'https://test.invalid/IN/transactions/');
    assert.equal(underReview, status === 201);
    assert.equal(notices.length, status === 201 ? 0 : 1);
  }
  const calls = [];
  let ok = true;
  const accept = initializer('utils/api.ts', 'performMerchantOrderAction', {
    INTOWN_API_BASE: 'https://test.invalid/IN',
    fetch: async (url, options) => { calls.push({ url, options }); return { ok, status: ok ? 200 : 400, json: async () => ({ message: 'Rejected request' }) }; },
  });
  await accept(100102, 'pickupOrder_100201', 'ACCEPT');
  assert.equal(calls[0].url, 'https://test.invalid/IN/merchants/100102/pickup-orders/pickupOrder_100201');
  assert.equal(calls[0].options.method, 'PUT');
  assert.deepEqual(JSON.parse(calls[0].options.body), { action: 'ACCEPT' });
  assert.equal(calls.length, 1, 'Merchant acceptance uses the backend approval operation without a duplicate credit call');
  ok = false;
  await assert.rejects(() => accept(100102, 'pickupOrder_100201', 'ACCEPT'), /Rejected request/);
  console.log('Payment pending approval, rejected payment, merchant ACCEPT contract and failed approval checks passed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
