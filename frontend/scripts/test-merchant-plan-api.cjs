const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const path = require('node:path');
function load(file, require, globals = {}) {
  const context = { exports: {}, require, ...globals };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../utils', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
  return context.exports;
}
(async () => {
  const cache = new Map([['merchant_plan', 'LAUNCH'], ['merchant_plan_1', 'START']]);
  let record = { merchantSubscriptionPlan: 'LAUNCH' };
  const plans = load('merchantPlans.ts', name => name === './api' ? { getMerchantDetailsById: async () => record } : { default: {
    getItem: async key => cache.get(key) ?? null,
    multiSet: async pairs => pairs.forEach(([key, value]) => cache.set(key, value)),
    removeItem: async key => cache.delete(key),
  } });
  assert.equal(await plans.getMerchantPlan('1'), 'LAUNCH');
  assert.equal(cache.get('merchant_plan_1'), 'LAUNCH');
  record = { merchantSubscriptionPlan: null };
  assert.equal(await plans.getMerchantPlan('1'), null);
  record = null;
  assert.equal(await plans.getMerchantPlan('2'), null, 'Never use another merchant\'s generic plan');
  cache.set('merchant_plan_2', 'START');
  assert.equal(await plans.getMerchantPlan('2'), 'START', 'Offline uses merchant-specific cache');
  for (const plan of plans.MERCHANT_PLANS) {
    const requests = [];
    const payment = load('merchantPlanPayment.ts', name => {
      if (name === 'react-native') return { Platform: { OS: 'web' } };
      if (name === './api') return { INTOWN_API_BASE: 'https://example.test/IN' };
      if (name === './merchantPlans') return plans;
      return { loadRazorpayWebScript: async () => true, openRazorpayWeb: async () => ({ razorpay_payment_id: 'payment', razorpay_order_id: 'order', razorpay_signature: 'signature' }) };
    }, { fetch: async (url, options) => {
      requests.push(JSON.parse(options.body));
      return { ok: true, json: async () => url.endsWith('create-order') ? { amount: plans.merchantPlanTotal(plan), razorpayOrderId: 'order', merchantPlan: plan.id } : { status: 'SUCCESS' } };
    } });
    await payment.payForMerchantPlan({ plan, mobileNumber: '9876543210' });
    assert.equal(requests[0].merchantPlan, plan.id);
    assert.equal(requests[0].amount, plans.merchantPlanTotal(plan));
    assert.equal(requests.length, 2);
  }
  console.log('Merchant plan API, cache isolation and payment request checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
