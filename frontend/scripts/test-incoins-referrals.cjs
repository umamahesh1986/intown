const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { create } = require('zustand');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function load(file, require, globals = {}) {
  const context = { exports: {}, require, AbortController, setTimeout, clearTimeout, ...globals };
  vm.runInNewContext(ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, context);
  return context.exports;
}
function expression(file, name) {
  const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let value;
  function walk(node) { if (ts.isVariableDeclaration(node) && node.name.getText(source) === name) value = node.initializer.getText(source); ts.forEachChild(node, walk); }
  walk(source); assert.ok(value, name); return value;
}
function handler(file, name, globals) {
  const js = ts.transpileModule(`const handler = ${expression(file, name)};`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  return vm.runInNewContext(`${js}\nhandler`, { ...globals });
}
const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

(async () => {
  const calls = [];
  const { intownApiBaseUrl } = load('utils/apiBaseUrl.ts', () => ({}));
  for (const base of ['https://test', 'https://test/', 'https://test/IN', 'https://test/IN/', 'https://test/IN/IN']) {
    assert.equal(intownApiBaseUrl(base), 'https://test/IN');
  }
  let next = response({ inCoins: 800, phoneNumber: '9876543210', lastUpdated: '2026-11-11T13:20:00' });
  const service = load('utils/incoins.ts', () => ({ INPOINTS_API_BASE: 'https://test/IN' }), {
    console: { warn() {} },
    fetch: async (url, options) => { calls.push({ url, options }); return typeof next === 'function' ? next(url) : next; },
  });
  assert.equal(service.walletPhone('+91 98765 43210'), '9876543210');
  assert.throws(() => service.walletPhone('1234'));
  assert.equal((await service.getINCoinsBalanceByPhone('+919876543210', 'token')).inCoins, 800);
  assert.equal(calls[0].url, 'https://test/IN/coins/phone/9876543210');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer token');
  next = response({ transactions: [
    { id: 3, coins: -20, transactionType: 'REDEMPTION', description: 'Debit', created: '2026-11-11' },
    { id: 1, coins: 500, transactionType: 'REFERRAL_BONUS', description: 'Merchant START referral' },
    { id: 2, coins: 300, transactionType: 'JOINING_BONUS' },
    { id: 4, points: 10, merchantName: 'Cashback shop' },
  ], totalCoins: 790 });
  const history = await service.getINCoinsHistoryByPhone('9876543210', 'token');
  assert.equal(history.transactions[0].coins, -20);
  assert.equal(history.transactions[1].description, 'Merchant START referral');
  assert.equal(history.transactions[3].coins, 10);
  assert.deepEqual(Array.from(history.transactions, item => item.id), [3, 1, 2, 4]);
  assert.equal(service.transactionTitle('REFERRAL_BONUS'), 'Referral Bonus');
  next = url => url.includes('/coins/') ? response({}, 404) : response({ inPoints: 23 });
  assert.equal((await service.getINCoinsBalanceByPhone('9876543210', 'token')).inCoins, 23);
  assert.ok(calls.at(-1).url.includes('/points/phone/'));
  next = response({}, 404);
  await assert.rejects(service.getINCoinsBalanceByPhone('9876543210', 'token'), /unavailable on this server/);
  for (const status of [401, 403, 500]) {
    next = response({}, status); const before = calls.length;
    await assert.rejects(service.getINCoinsBalanceByPhone('9876543210', 'token'));
    assert.equal(calls.length, before + 1, 'Never bypass authorization or server failures with a legacy retry');
  }
  next = response({ inCoins: 123, phoneNumber: '9123456789' });
  await assert.rejects(service.getINCoinsBalanceByPhone('9876543210', 'token'), /identity/);
  next = response({ totalCoins: 999, transactions: [] });
  await assert.rejects(service.getINCoinsBalanceByPhone('9876543210', 'token'), /Invalid/);

  const auth = create(() => ({ user: { id: '1', phone: '9876543210', userType: 'member' }, token: 'A', isAuthenticated: true, isGuest: false }));
  let balanceCalls = 0;
  let balanceWork = async () => ({ inCoins: 800, phoneNumber: '9876543210' });
  const { useINCoinsStore: wallet } = load('store/incoinsStore.ts', name => {
    if (name === 'zustand') return { create };
    if (name === './authStore') return { useAuthStore: auth };
    return { ...service, getINCoinsBalanceByPhone: () => { balanceCalls++; return balanceWork(); }, getINCoinsHistoryByPhone: async () => ({ transactions: history.transactions }) };
  });
  const first = wallet.getState().refresh();
  assert.equal(wallet.getState().refresh(), first, 'Deduplicate simultaneous dashboard requests');
  await first;
  assert.equal(wallet.getState().balance.inCoins, 800, 'Balance comes from balance endpoint, not transaction sum');
  for (const role of ['merchant', 'dual', 'member']) {
    auth.setState({ user: { ...auth.getState().user, userType: role } });
    assert.equal(wallet.getState().balance.inCoins, 800, 'Role switches preserve the phone wallet');
  }
  const slow = deferred(); balanceWork = () => slow.promise;
  const oldRequest = wallet.getState().refresh();
  auth.setState({ user: { id: '2', phone: '9123456789' }, token: 'B' });
  assert.equal(wallet.getState().balance, null);
  balanceWork = async () => ({ inCoins: 12, phoneNumber: '9123456789' });
  await wallet.getState().refresh();
  slow.resolve({ inCoins: 99999 }); await oldRequest;
  assert.equal(wallet.getState().balance.inCoins, 12, 'Late previous-account results cannot overwrite new wallet');
  auth.setState({ user: null, token: null, isAuthenticated: false });
  assert.equal(wallet.getState().balance, null);
  assert.equal(wallet.getState().transactions.length, 0);
  const before = balanceCalls; await wallet.getState().refresh(); assert.equal(balanceCalls, before);
  auth.setState({ user: { id: '1', phone: '9876543210' }, token: 'A', isAuthenticated: true });
  balanceWork = async () => { throw new Error('Offline'); };
  await wallet.getState().refresh(); assert.equal(wallet.getState().balanceError, 'Offline');
  balanceWork = async () => ({ inCoins: 22 });
  await wallet.getState().refresh(); assert.equal(wallet.getState().balance.inCoins, 22);

  const memory = new Map();
  const referral = load('utils/referralRegistration.ts', () => ({ default: { getItem: async key => memory.get(key), setItem: async (key, value) => memory.set(key, value) } }));
  assert.equal(await referral.registrationDeviceId(), await referral.registrationDeviceId());
  assert.equal(referral.referralNumber(' 9123456789 '), '9123456789');
  assert.equal(referral.referralNumber(''), '');
  assert.throws(() => referral.referralNumber('123'));
  assert.equal(referral.registrationReferralMessage({}), '');
  const requests = [];
  let registrationResponse = {};
  const apiGlobals = { ...referral, INTOWN_API_BASE: 'https://test/IN', axios: { post: async (url, payload) => { requests.push({ url, payload }); return { data: registrationResponse }; } } };
  const registerCustomer = handler('utils/api.ts', 'registerMember', apiGlobals);
  const registerMerchant = handler('utils/api.ts', 'registerMerchant', apiGlobals);
  for (const referrerRole of ['Customer', 'Merchant']) {
    for (const [kind, reward] of [['Customer', 300], ['START', 500], ['LAUNCH', 1000]]) {
      registrationResponse = { referralMessage: `${reward} INCoins credited by backend` };
      const data = { contactName: 'Test', businessName: 'Test shop', phoneNumber: '+919876543210', location: { latitude: 17, longitude: 78 }, referredBy: '9123456789', subscriptionPlan: kind, categoryList: [1, 2], openAt: '09:00', closeAt: '18:00' };
      const result = await (kind === 'Customer' ? registerCustomer(data) : registerMerchant(data));
      assert.equal(referral.registrationReferralMessage(result), registrationResponse.referralMessage);
      assert.equal(requests.at(-1).payload.referredBy, '9123456789', referrerRole);
      assert.equal(requests.at(-1).payload.phoneNumber, '9876543210');
      if (kind !== 'Customer') { assert.equal(requests.at(-1).payload.subscriptionPlan, kind); assert.equal(requests.at(-1).payload.openAt, '09:00'); }
      else assert.ok(requests.at(-1).payload.deviceId);
    }
  }
  const warning = "Referrer phone number is not registered with INtown. You won't receive referral INCoins.";
  registrationResponse = { id: 1, referralMessage: warning };
  assert.equal(referral.registrationReferralMessage(await registerCustomer({ phoneNumber: '9876543210', referredBy: '9000000000' })), warning);
  registrationResponse = { id: 2 };
  assert.equal(referral.registrationReferralMessage(await registerMerchant({ phoneNumber: '9876543210' })), '');
  assert.equal(requests.at(-1).payload.referredBy, '');
  assert.ok(requests.some(item => item.url.endsWith('/customers/register')));
  assert.ok(requests.some(item => item.url.endsWith('/merchants/register')));
  assert.ok(service.referralShareMessage('+919876543210').includes('9876543210'));
  assert.ok(!service.referralShareMessage('9876543210').includes('http'));
  // Exercise each form's actual submission handler twice while registration is pending.
  for (const kind of ['member', 'merchant']) {
    let submissions = 0;
    let successMessage = '';
    const wait = deferred();
    const fields = {
      contactName: 'Test', businessName: 'Test shop', businessCategory: 'Restaurants', description: 'Test',
      yearsInBusiness: '1', branches: '1', email: 'test@example.test', phoneNumber: '9876543210',
      location: { latitude: 17, longitude: 78 }, pincode: '500081', address: '', images: [],
      referredBy: '9000000000', introducedBy: '9000000000', agreedToTerms: true,
      products: [], customProducts: [], selectedProductIds: [], selectedCategoryId: 1,
      openAt: '09:00', closeAt: '18:00', breakStartAt: '', breakEndAt: '', weekOff: '', offer: '',
      selectedPlan: { name: 'START' }, selectedPlanId: 'START', paymentCompleted: true,
      paymentDetails: { razorpayPaymentId: 'paid' }, JOINING_FEE_AMOUNT: 499, draftKey: 'draft',
      validateForm: () => true, registrationPending: { current: false },
      setIsLoading() {}, Alert: { alert: () => assert.fail('Successful referral warnings must not show registration failure') },
      registerMember: async () => { submissions++; return wait.promise; },
      registerMerchant: async () => { submissions++; return wait.promise; },
      AsyncStorage: { setItem: async () => {}, removeItem: async () => {} },
      uploadImagesToS3: async () => [], fetchMerchantImages: async () => {}, setMerchantPlan: async () => {},
      registrationReferralMessage: referral.registrationReferralMessage,
      setSuccessMessage: value => { successMessage = value; }, setSuccessCustomerId() {}, setSuccessMerchantId() {}, setShowSuccessPopup() {},
      useINCoinsStore: { getState: () => ({ clear() {}, refresh: async () => {} }) },
      successTimerRef: { current: null }, setTimeout: () => 1, clearTimeout() {}, console,
    };
    const register = handler(`app/register-${kind}.tsx`, 'handleRegister', fields);
    const pendingRegistration = register(); await register();
    assert.equal(submissions, 1, 'Ignore duplicate taps until request completes');
    wait.resolve({ id: 123, referralMessage: warning }); await pendingRegistration;
    assert.ok(successMessage.includes(warning), 'Show backend warning inside registration success popup');
    assert.equal(fields.registrationPending.current, false);
  }
  console.log('Mocked INCoins API, referral registration, shared wallet, legacy aliases, account isolation, stale-response guards, logout and retry checks passed. Backend crediting is not tested live.');
})().catch(error => { console.error(error); process.exitCode = 1; });
