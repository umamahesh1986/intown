const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), path = require('node:path');
const file = path.join(__dirname, '../app/register-merchant.tsx');
const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const expressions = {};
(function visit(node) { if (ts.isVariableDeclaration(node) && ['handlePayJoiningFee', 'handleRegister'].includes(node.name.getText(source))) expressions[node.name.getText(source)] = node.initializer.getText(source); ts.forEachChild(node, visit); })(source);
const handler = (name, scope) => vm.runInNewContext(ts.transpileModule(`const handler = ${expressions[name]};`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText + '\nhandler', scope);
const proof = { razorpayPaymentId: 'pay_test', razorpayOrderId: 'order_test', razorpaySignature: 'signature' };
async function paymentCase(mode) {
  let registrations = 0, completed = false, paymentError = '', resets = 0, orders = 0;
  let release;
  const checkout = new Promise((resolve, reject) => { release = () => mode === 'cancel' ? reject({ code: 'PAYMENT_CANCELLED' }) : resolve({ razorpay_payment_id: proof.razorpayPaymentId, razorpay_order_id: proof.razorpayOrderId, razorpay_signature: proof.razorpaySignature }); });
  const scope = {
    paymentPending: { current: false }, registrationPending: { current: false }, paymentCompleted: false,
    agreedToTerms: true, timingErrors: {}, businessName: 'Shop', businessCategory: 'Grocery', contactName: 'Owner', selectedCategoryId: 1,
    description: 'Local shop', yearsInBusiness: '1', branches: '1', phoneNumber: '9876543210', pincode: '500081',
    location: { latitude: 17, longitude: 78 }, introducedByValid: true, validateForm: () => true,
    INTOWN_API_BASE: 'https://test/IN', CHECKOUT_LOGO: 'data:image/png;base64,test', JOINING_FEE_AMOUNT: 1178.82, selectedPlanId: 'LAUNCH', RAZORPAY_KEY_ID: 'test', email: '',
    Platform: { OS: 'web' }, loadRazorpayWebScript: async () => true, openRazorpayWeb: () => checkout,
    fetch: async url => { if (url.endsWith('create-order')) orders++; return { ok: true, json: async () => url.endsWith('create-order') ? { amount: 1178.82, razorpayOrderId: 'order_test' } : { status: mode === 'verify-fail' ? 'FAILED' : 'SUCCESS' } }; },
    setPaymentError: value => { paymentError = value; }, setIsPaying() {}, setPaymentDetails: value => { if (value === null) resets++; },
    setPaymentCompleted: value => { completed = value; }, Alert: { alert() {} }, console: { error() {}, warn() {} },
    handleRegister: async value => { registrations++; assert.equal(JSON.stringify(value), JSON.stringify(proof)); if (mode === 'register-fail') throw new Error('Server unavailable'); },
  };
  const pay = handler('handlePayJoiningFee', scope);
  const first = pay(); await pay(); // Immediate duplicate taps must not create another order.
  release(); await first;
  assert.equal(orders, 1);
  assert.equal(scope.paymentPending.current, false);
  if (mode === 'success') { assert.equal(registrations, 1); assert.equal(completed, true); assert.equal(paymentError, ''); }
  if (mode === 'cancel' || mode === 'verify-fail') { assert.equal(registrations, 0); assert.equal(completed, false); }
  if (mode === 'register-fail') { assert.equal(completed, true); assert.equal(resets, 0); assert.ok(paymentError.includes('without paying again')); }
}
(async () => {
  for (const mode of ['success', 'cancel', 'verify-fail', 'register-fail']) await paymentCase(mode);
  // Verify the actual registration handler consumes the proof even before React state updates.
  let payload;
  const scope = { registrationPending: { current: false }, validateForm: () => true, paymentCompleted: false, paymentDetails: null,
    setPaymentError() {}, setIsLoading() {}, products: [], customProducts: [], selectedProductIds: [], selectedCategoryId: 1,
    businessName: 'Shop', contactName: 'Owner', businessCategory: 'Grocery', description: 'Local', yearsInBusiness: '1', branches: '1', email: '', phoneNumber: '9876543210', pincode: '500081', location: { latitude: 17, longitude: 78 }, address: '', introducedBy: '', images: [], agreedToTerms: true,
    openAt: '09:00', closeAt: '18:00', breakStartAt: '', breakEndAt: '', weekOff: '', offer: '', isPickupEnabled: true, isSlotBookingEnabled: false, selectedPlanId: 'LAUNCH', JOINING_FEE_AMOUNT: 1178.82,
    registerMerchant: async value => { payload = value; return { id: 42 }; }, AsyncStorage: { setItem: async () => {}, removeItem: async () => {} }, setMerchantPlan: async () => {}, draftKey: 'draft', uploadImagesToS3: async () => {}, fetchMerchantImages: async () => {}, registrationReferralMessage: () => '', setSuccessMessage() {}, useINCoinsStore: { getState: () => ({ clear() {}, refresh: async () => {} }) }, setSuccessMerchantId() {}, setShowSuccessPopup() {}, successTimerRef: { current: null }, setTimeout: () => 1, clearTimeout() {}, console,
    Alert: { alert: () => assert.fail('Verified payment should automatically register without a payment-required alert') },
  };
  await handler('handleRegister', scope)(proof);
  assert.equal(payload.razorpayPaymentId, proof.razorpayPaymentId);
  assert.equal(payload.razorpayOrderId, proof.razorpayOrderId);
  assert.equal(payload.razorpaySignature, proof.razorpaySignature);
  assert.equal(payload.joiningFeePaid, true);
  assert.equal(payload.isPickupEnabled, true);
  assert.equal(payload.isSlotBookingEnabled, false);
  console.log('Automatic merchant registration checks passed: verified checkout, stale React state, duplicate taps, cancellation, failed verification and payment-preserving retry.');
})().catch(error => { console.error(error); process.exitCode = 1; });
