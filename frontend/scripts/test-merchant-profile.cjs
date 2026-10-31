const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../utils/merchantProfile.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const context = { exports: {} };
vm.runInNewContext(compiled, context);
const { merchantRecord, loadMerchantProfile } = context.exports;

(async () => {
  assert.equal(merchantRecord({ data: { merchant: { merchantId: 42, contactName: 'Merchant' } } }).id, 42);
  assert.equal(merchantRecord({ customer: { id: 1 } }), null);
  assert.equal(merchantRecord({ id: 'undefined' }), null);

  let requestedId;
  const profile = await loadMerchantProfile('9999999999', { id: 7 }, '7',
    async () => ({ data: { merchant: { id: 42, offer: 'Offer from search' } } }),
    async id => {
      requestedId = id;
      return { data: { merchant: { merchantId: 42, contactName: 'Merchant', openAt: '09:00', s3ImageUrl: ['shop.jpg'] } } };
    });
  assert.equal(requestedId, '42', 'Fresh search must replace a stale stored ID');
  assert.equal(profile.offer, 'Offer from search', 'Keep search fields omitted by details');
  assert.equal(profile.openAt, '09:00');
  assert.equal(profile.s3ImageUrl[0], 'shop.jpg');

  await assert.rejects(loadMerchantProfile('9999999999', { id: 7 }, '7',
    async () => ({ customer: { id: 7 } }), async () => { throw new Error('Must not fetch stale ID'); }),
    /No merchant profile/);
  await assert.rejects(loadMerchantProfile('', { id: 42 }, null,
    async () => null, async () => ({ id: 42 })), /only a merchant identity/);
  await assert.rejects(loadMerchantProfile('', { id: 42 }, null,
    async () => null, async () => ({ id: 99, contactName: 'Wrong account' })), /invalid merchant profile/);
  await assert.rejects(loadMerchantProfile('9999999999', { id: 42 }, '42',
    async () => { throw new Error('Network failure'); }, async () => ({ id: 42 })), /Network failure/);
  const empty = await loadMerchantProfile('', null, '42', async () => null,
    async () => ({ id: 42, contactName: null, offer: null }));
  assert.equal(empty.contactName, null, 'A successful profile may genuinely have empty fields');
  console.log('Merchant profile regression checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
