const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, extra = {}) {
  const context = { exports: {}, Date, setTimeout, clearTimeout, ...extra };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, context);
  return context.exports;
}
const specialOffer = load('utils/specialOffer.ts');
const drawn = [];
let imageLoads = 0;
const context2d = { measureText: text => ({ width: text.length * 22 }), fillRect() {}, save() {}, beginPath() {}, rect() {}, clip() {}, restore() {}, drawImage() { imageLoads++; }, fillText: (text, x, y) => drawn.push({ text, y }) };
const canvas = { width: 0, height: 0, getContext: () => context2d, toBlob: callback => callback(new Blob(['png'], { type: 'image/png' })) };
class ImageMock {
  naturalWidth = 800; naturalHeight = 500;
  set src(value) { assert.equal(this.crossOrigin, 'anonymous'); queueMicrotask(() => this.onload()); }
}
const helpers = load('utils/shopShare.ts', { require: () => specialOffer, document: { createElement: () => canvas }, Image: ImageMock });
const now = new Date(2026, 9, 31, 12).getTime();
const shop = { id: 42, businessName: 'Local Grocery', offer: 'Everyday savings', specialOffers: ['Festival 20% off', 'Free gift'], specialOfferEndDate: '2026-12-31',
  s3ImageUrl: [{ s3ImageUrl: 'https://example.test/special_offer_42.jpg', isPrimary: true }, { s3ImageUrl: 'https://example.test/merchant.jpg', isPrimary: true }],
};
const active = helpers.buildShopShareContent(shop, [], now);
assert.equal(active.title, 'Local Grocery');
assert.equal(active.special, true);
assert.equal(active.offers.length, 2);
assert.equal(active.offers[0], 'Festival 20% off');
assert.equal(active.imageUrl, 'https://example.test/special_offer_42.jpg', 'An active special offer uses its banner first');
assert.equal(helpers.buildShopShareContent({ ...shop, s3ImageUrl: [{ s3ImageUrl: 'https://example.test/profile.jpg', isPrimary: true }] }, [], now).imageUrl, 'https://example.test/profile.jpg', 'Fall back to merchant profile when the special offer has no image');
assert.equal(helpers.buildShopShareContent({ ...shop, s3ImageUrl: [], profileImage: 'https://example.test/profile.jpg' }, [], now).imageUrl, 'https://example.test/profile.jpg', 'Support separately supplied profile image');
assert.equal(helpers.buildShopShareContent({ ...shop, s3ImageUrl: [], images: [{ s3ImageUrl: 'https://example.test/profile.jpg', isPrimary: true }] }, [], now).imageUrl, 'https://example.test/profile.jpg', 'Support merchant images returned by the image endpoint');
assert.ok(!active.caption.includes('Everyday savings'), 'Active special offers take precedence');
assert.ok(active.caption.includes('Valid till'));
assert.ok(active.caption.includes('intown://member-shop-details?shopId=42'));
const expired = helpers.buildShopShareContent({ ...shop, specialOfferEndDate: '2026-10-30' }, [], now);
assert.equal(expired.special, false);
assert.equal(expired.offers[0], 'Everyday savings');
assert.equal(expired.validTill, '');
assert.ok(!expired.caption.includes('Festival'));
assert.equal(expired.imageUrl, 'https://example.test/merchant.jpg', 'Expired special-offer banners are not shared');
const ordinary = helpers.buildShopShareContent({ id: 99, shopName: 'A & B', offer: 'One offer\nSecond offer' }, ['fallback.jpg'], now);
assert.equal(ordinary.offers.length, 2);
assert.equal(ordinary.imageUrl, 'fallback.jpg');
assert.equal(helpers.buildShopShareContent({ businessName: 'No offers' }, [], now).offers.length, 0);

(async () => {
  const blob = await helpers.createShopShareImage(active);
  assert.equal(blob.type, 'image/png');
  assert.equal(canvas.width, 1080);
  assert.ok(canvas.height >= 1080);
  assert.equal(imageLoads, 1);
  assert.ok(drawn.some(item => item.text === 'Local Grocery'));
  assert.ok(drawn.some(item => item.text.includes('Festival 20% off')));
  const footer = drawn.find(item => item.text === 'Find this merchant on the INtown app');
  assert.ok(drawn.filter(item => item !== footer).every(item => item.y < footer.y), 'Content fits above the footer');
  console.log('Shop sharing priority, expiry fallback, merchant image, caption, and PNG export checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
