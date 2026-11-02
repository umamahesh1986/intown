const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, extra = {}) {
  const context = { exports: {}, Date, Map, console: { log() {}, warn() {} }, process: { env: {} }, ...extra };
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, context);
  return context.exports;
}

const offers = load('utils/specialOffer.ts');
const profile = load('utils/merchantProfile.ts');
const now = new Date(2026, 9, 31, 12).getTime();
assert.equal(offers.getActiveSpecialOffers({ specialOffers: ['Festival offer'], specialOfferEndDate: '2026-10-31' }, now).length, 1, 'A date-only end date includes the whole local day');
assert.equal(offers.getActiveSpecialOffers({ specialOffers: ['Festival offer'], specialOfferEndDate: '2026-10-30' }, now).length, 0);
assert.equal(offers.getActiveSpecialOffers({ specialOffers: ['Festival offer'], specialOfferEndDate: new Date(now - 1000).toISOString() }, now).length, 0, 'Stop now hides the offer immediately');
assert.equal(offers.getActiveSpecialOffers({ specialOffers: ['New season'], specialOfferEndDate: '2026-12-31' }, now)[0], 'New season');
assert.equal(offers.getActiveSpecialOffers({ specialOffers: 'First offer\nSecond offer' }, now).length, 2);
assert.equal(offers.getActiveSpecialOffers({ specialOffers: [] }, now).length, 0);

let calls = 0;
let response = { data: { merchant: { id: 42, specialOffers: ['Festival offer'], specialOfferEndDate: '2026-12-31' } } };
const api = load('utils/api.ts', {
  __DEV__: true,
  require(name) {
    if (name === './specialOffer') return offers;
    if (name === './merchantProfile') return profile;
    if (name === 'react-native') return { Platform: { OS: 'web' } };
    if (name === 'axios') return { default: { create: () => ({}) } };
    return { default: {} };
  },
  fetch: async () => { calls++; return { ok: true, json: async () => response }; },
});

(async () => {
  const first = await api.getMerchantDetailsById(42);
  assert.equal(first.specialOffers[0], 'Festival offer', 'Unwrap merchant responses');
  await api.getMerchantDetailsById(42);
  assert.equal(calls, 1, 'Normal detail reads use the cache');
  response = { id: 42, specialOffers: ['Festival offer'], specialOfferEndDate: new Date(now - 1000).toISOString() };
  const stopped = await api.enrichShopsWithMerchantDetails([{ merchantId: 42, specialOfferEndDate: '2027-12-31' }], true);
  assert.equal(stopped[0].id, 42);
  assert.equal(offers.getActiveSpecialOffers(stopped[0], now).length, 0, 'Fresh stopped date replaces stale nearby data');
  api.invalidateMerchantDetails(42);
  response = { id: 42, specialOffers: [], specialOfferEndDate: null };
  const cleared = await api.enrichShopsWithMerchantDetails([{ id: 42, specialOffers: ['Old offer'], specialOfferEndDate: '2026-10-01' }]);
  assert.equal(cleared[0].specialOffers.length, 0);
  assert.equal(cleared[0].specialOfferEndDate, null, 'Explicit cleared values do not revive old expiry dates');
  api.invalidateMerchantDetails(42);
  response = { message: 'Temporarily unavailable' };
  const count = calls;
  assert.equal(await api.getMerchantDetailsById(42), null);
  response = { id: 42, specialOffers: ['Recovered'] };
  assert.equal((await api.getMerchantDetailsById(42)).specialOffers[0], 'Recovered');
  assert.equal(calls, count + 2, 'Failed reads are retried instead of cached for five minutes');
  console.log('Special offer expiry, stop, renewal, cache invalidation, and response regression checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
