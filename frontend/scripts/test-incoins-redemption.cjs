const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const calls = [];
let profile = { id: 42, contactName: 'Uma & Rao', phoneNumber: '9876543210', email: 'uma@example.test', address: 'Hyderabad', latitude: 17.4, longitude: 78.4 };
const scope = {
  exports: {}, AbortController, setTimeout, clearTimeout,
  require: name => name.includes('async-storage') ? { default: { getItem: async key => key === 'merchant_id' ? '43' : '42' } } : { INTOWN_API_BASE: 'https://test.invalid/IN' },
  fetch: async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => profile }; },
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../utils/incoinsRedemption.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, scope);
async function check() {
  const { loadRedemptionProfile, buildRedemptionWhatsAppUrl } = scope.exports;
  const customer = await loadRedemptionProfile('customer', 'token');
  assert.equal(calls[0].url, 'https://test.invalid/IN/customer/42');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer token');
  const url = new URL(buildRedemptionWhatsAppUrl(customer, 70));
  assert.equal(url.hostname, 'wa.me'); assert.equal(url.pathname, '/919052263555');
  const message = url.searchParams.get('text');
  for (const value of ['Customer', 'Uma & Rao', '9876543210', 'uma@example.test', 'Hyderabad', 'Available INcoins: 70', '17.4,78.4']) assert.ok(message.includes(value));
  profile = { ...profile, id: 43, contactName: 'Merchant Name' };
  const merchant = await loadRedemptionProfile('merchant');
  assert.equal(calls[1].url, 'https://test.invalid/IN/merchant/43');
  const merchantUrl = new URL(buildRedemptionWhatsAppUrl(merchant, 25, { fullAddress: 'Current location', latitude: 18, longitude: 79 }));
  assert.ok(merchantUrl.searchParams.get('text').includes('Account type: Merchant'));
  assert.ok(merchantUrl.searchParams.get('text').includes('Current location: Current location'));
  assert.ok(merchantUrl.searchParams.get('text').includes('18,79'));
  assert.ok(new URL(buildRedemptionWhatsAppUrl(customer, 0)).searchParams.get('text').includes('Available INcoins: 0'), 'Zero balance still allows a WhatsApp request with the accurate balance');
  for (const balance of [-1, NaN, Infinity]) assert.throws(() => buildRedemptionWhatsAppUrl(customer, balance), /available INcoins/);
  await assert.rejects(() => loadRedemptionProfile('customer'), /could not be verified/);
  assert.ok(calls.every(call => !call.options.method || call.options.method === 'GET'), 'Preparing redemption must not credit or deduct points');
  console.log('WhatsApp redemption recipient, customer/merchant identity, personal details, location, balance and no-deduction checks passed.');
}
check().catch(error => { console.error(error); process.exitCode = 1; });
