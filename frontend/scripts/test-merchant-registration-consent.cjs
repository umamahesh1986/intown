const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const ts = require('typescript');
const file = path.join(__dirname, '../app/register-merchant.tsx');
const text = fs.readFileSync(file, 'utf8');
const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function expression(name) {
  let value;
  const walk = node => { if (ts.isVariableDeclaration(node) && node.name.getText(source) === name) value = node.initializer.getText(source); ts.forEachChild(node, walk); };
  walk(source); assert.ok(value, name); return value;
}
const base = {
  businessName: 'Local shop', contactName: 'Merchant', selectedCategoryId: 1,
  description: 'Shop', yearsInBusiness: '2', branches: '1', pincode: '500081',
  location: { latitude: 17, longitude: 78 }, introducedByValid: true,
  timingErrors: {}, paymentCompleted: false, isPaying: false, agreedToTerms: false,
};
const evaluate = (name, overrides) => vm.runInNewContext(expression(name), { ...base, ...overrides });
assert.equal(evaluate('canInitiatePayment', {}), false);
assert.equal(evaluate('canInitiatePayment', { agreedToTerms: true }), true);
assert.equal(evaluate('canInitiatePayment', { agreedToTerms: true, isPaying: true }), false);
assert.equal(evaluate('canInitiatePayment', { agreedToTerms: true, paymentCompleted: true }), false);
assert.equal(evaluate('isFormValid', { agreedToTerms: true }), false);
assert.equal(evaluate('isFormValid', { agreedToTerms: true, paymentCompleted: true }), true);
assert.equal(evaluate('isFormValid', { paymentCompleted: true }), false);
assert.equal(evaluate('isFormValid', { agreedToTerms: true, paymentCompleted: true, timingErrors: { breakEndAt: 'Invalid' } }), false);
assert.ok(text.indexOf('{/* TERMS */}') < text.indexOf('{/* JOINING FEE PAYMENT'));
async function check() {
  let message = '';
  const js = ts.transpileModule(`const pay = ${expression('handlePayJoiningFee')};`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  const handler = vm.runInNewContext(`${js}\npay`, { agreedToTerms: false, setPaymentError: value => { message = value; } });
  await handler();
  assert.ok(message.includes('accept the Terms & Conditions'));
  console.log('Consent-before-payment, payment-before-registration, timing validation and checkout guards passed.');
}
check().catch(error => { console.error(error); process.exitCode = 1; });
