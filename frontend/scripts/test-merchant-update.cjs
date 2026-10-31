const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const context = { exports: {}, Date };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../utils/merchantUpdate.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, context);
const { merchantUpdatePayload } = context.exports;

const original = { id: 42, specialOffers: ['Seasonal offer'], specialOfferEndDate: '2026-12-11T18:29:59.000+00:00', images: [{ s3ImageUrl: 'profile.jpg' }], s3ImageUrl: [{ s3ImageUrl: 'banner.jpg' }], productNames: ['Rice'], openAt: '' };
const payload = merchantUpdatePayload(original);
assert.equal(payload.specialOfferEndDate, '2026-12-11T18:29:59.000Z');
assert.equal(new Date(payload.specialOfferEndDate).getTime(), new Date(original.specialOfferEndDate).getTime(), 'Normalization preserves the selected instant');
assert.equal(payload.specialOffers[0], 'Seasonal offer');
assert.equal(payload.productNames[0], 'Rice');
assert.equal(payload.openAt, '');
assert.ok(!('s3ImageUrl' in payload) && !('images' in payload));
assert.ok('images' in original, 'Do not mutate the cached merchant');
assert.equal(original.specialOfferEndDate, '2026-12-11T18:29:59.000+00:00');
assert.equal(merchantUpdatePayload({ specialOfferEndDate: '2026-12-11T23:59:59+05:30' }).specialOfferEndDate, '2026-12-11T18:29:59.000Z');
assert.equal(merchantUpdatePayload({ specialOfferEndDate: '2026-10-31T17:00:00.000Z' }).specialOfferEndDate, '2026-10-31T17:00:00.000Z', 'Preserve an immediate stop timestamp');
assert.equal(merchantUpdatePayload({ specialOfferEndDate: payload.specialOfferEndDate }).specialOfferEndDate, payload.specialOfferEndDate, 'Repeated saves remain normalized');
assert.ok(!('specialOfferEndDate' in merchantUpdatePayload({ specialOfferEndDate: null })));
assert.throws(() => merchantUpdatePayload({ specialOfferEndDate: 'invalid' }), /valid special-offer end date/);
console.log('Merchant PATCH date normalization, instant preservation, repeated saves, and image-field regression checks passed.');
