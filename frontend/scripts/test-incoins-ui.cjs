const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const jsx = (type, props) => ({ type, props });
let shared;
let navigation;
const wallet = { balance: { inCoins: 800, lastUpdated: '2026-11-11T13:20:00' }, transactions: [], loading: false, balanceError: '', historyError: '', refresh: async () => {} };
let auth = { user: { phone: '+919876543210', userType: 'dual' }, token: 'token', isAuthenticated: true, isGuest: false, isHydrated: true };
function load(file) {
  const context = { exports: {}, require: name => {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react') return { useCallback: value => value, useState: value => [value, () => {}], useRef: value => ({ current: value }) };
    if (name === 'react-native') return { View: 'View', Text: 'Text', TouchableOpacity: 'Button', ActivityIndicator: 'Spinner', StyleSheet: { create: value => value }, Share: { share: async value => { shared = value.message; } } };
    if (name === 'expo-linear-gradient') return { LinearGradient: 'Gradient' };
    if (name === '@expo/vector-icons') return { Ionicons: 'Icon' };
    if (name === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView' };
    if (name.endsWith('legalContent')) return { LEGAL_CONTENT: { terms: '', privacy: '' } };
    if (name === 'expo-router') return { useFocusEffect() {}, useRouter: () => ({ push: value => { navigation = value; } }) };
    if (name.endsWith('authStore')) return { useAuthStore: () => auth };
    if (name.endsWith('incoinsStore')) return { useINCoinsStore: () => wallet };
    if (name.endsWith('rewardsInsights')) return { computeRewardsInsights: () => ({}) };
    if (name.endsWith('walletStyles')) return { walletStyles: {} };
    if (name.endsWith('incoins')) return { walletPhone: phone => phone.replace(/\D/g, '').slice(-10), DOCUMENTED_REFERRAL_REWARDS: [{ label: 'Customer', coins: 300 }, { label: 'Merchant START', coins: 500 }, { label: 'Merchant LAUNCH', coins: 1000 }], referralShareMessage: phone => `Referred By ${phone.replace(/\D/g, '').slice(-10)}`, transactionTitle: type => type };
    if (name.endsWith('MerchantCardAccent')) return { MerchantCardAccent: 'Accent', merchantCardSurface: {} };
    const component = name.split('/').pop(); return { [component]: component };
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components/incoins', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, context);
  return context.exports;
}
function flatten(node) {
  if (Array.isArray(node)) return node.flatMap(flatten);
  return node && typeof node === 'object' ? [node, ...flatten(node.props?.children)] : [];
}
const { INCoinsWalletCard } = load('INCoinsWalletCard.tsx');
const { INCoinsHistoryList } = load('INCoinsHistoryList.tsx');
const { ReferralRewardsCard } = load('ReferralRewardsCard.tsx');
const { MerchantWalletSummary } = load('MerchantWalletSummary.tsx');
const { CustomerRewardsSummary } = load('CustomerRewardsSummary.tsx');
(async () => {
  for (const role of ['customer']) {
    assert.equal(INCoinsWalletCard({ role }).type, 'CustomerRewardsSummary');
    const card = flatten(CustomerRewardsSummary()).find(node => node.type === 'RewardsCard');
    assert.equal(card.props.stats.balance, 800, 'Restored customer design uses authoritative phone wallet balance');
    assert.equal(card.props.stats.totalEarned, 0, 'Empty history must not replace the wallet balance');
    card.props.onRedeem(); assert.equal(navigation.params.from, role);
    card.props.onHistory(); assert.equal(navigation, '/incoins-history');
  }
  for (const dashboard of ['member-dashboard', 'dual-dashboard']) {
    assert.match(fs.readFileSync(path.join(__dirname, '../app', `${dashboard}.tsx`), 'utf8'), /<INCoinsWalletCard\s+role="customer"\s*\/>/);
  }
  assert.equal(INCoinsWalletCard({ role: 'merchant' }).type, 'MerchantWalletSummary');
  const merchantDashboard = fs.readFileSync(path.join(__dirname, '../app/merchant-dashboard.tsx'), 'utf8');
  assert.match(merchantDashboard, /<INCoinsWalletCard\s+role="merchant"\s*\/>/, 'Merchant dashboard must explicitly select merchant design even for dual accounts');
  const summary = flatten(MerchantWalletSummary());
  assert.equal(summary.find(node => node.props?.testID === 'incoins-wallet-balance').props.children, '800');
  summary.find(node => node.props?.testID === 'merchant-wallet-manage').props.onPress();
  assert.equal(navigation, '/merchant-incoin-wallet');
  await summary.find(node => node.props?.testID === 'merchant-wallet-share').props.onPress();
  assert.ok(shared.includes('9876543210'));
  const { default: MerchantWalletPage } = load('../../app/merchant-incoin-wallet.tsx');
  const page = flatten(MerchantWalletPage());
  assert.equal(page.find(node => node.props?.testID === 'merchant-wallet-page-balance').props.children, '800');
  assert.ok(page.some(node => node.props?.testID === 'merchant-wallet-referrals'));
  assert.ok(page.some(node => node.type === 'Text' && node.props.children === 'Merchant Tools'));
  // Navigation must not fail because the cached role predates merchant registration.
  for (const userType of ['member', 'user', 'IN_MERCHANT', 'merchant', 'dual', null]) {
    auth = { ...auth, user: { ...auth.user, userType } };
    assert.ok(flatten(MerchantWalletPage()).some(node => node.props?.testID === 'merchant-wallet-page-balance'), `Authenticated wallet should render for cached role ${userType}`);
  }
  auth = { ...auth, isHydrated: false };
  assert.ok(flatten(MerchantWalletPage()).some(node => node.type === 'Spinner'), 'Wait for stored authentication before denying access');
  auth = { ...auth, isHydrated: true, isAuthenticated: false };
  assert.ok(!flatten(MerchantWalletPage()).some(node => node.props?.testID === 'merchant-wallet-page-balance'), 'Signed-out users cannot view the private wallet');
  auth = { ...auth, isAuthenticated: true };
  const historyTree = flatten(INCoinsWalletCard({ history: true }));
  assert.equal(historyTree.find(node => node.type === 'INCoinsHistoryList').props.limit, undefined);
  wallet.loading = true;
  assert.equal(INCoinsHistoryList({}).type, 'Spinner');
  wallet.loading = false; wallet.historyError = 'Offline';
  assert.ok(flatten(INCoinsHistoryList({})).some(node => node.type === 'Button'));
  wallet.historyError = '';
  assert.equal(INCoinsHistoryList({}).type, 'Text');
  wallet.transactions = [{ id: 1, coins: 300, transactionType: 'JOINING_BONUS', description: 'Joining bonus', created: null }, { id: 2, coins: -20, transactionType: 'Existing backend type', description: 'Debit', created: null }];
  const activity = flatten(INCoinsHistoryList({}));
  assert.ok(activity.some(node => node.props?.children === 'Joining bonus'));
  assert.ok(activity.some(node => Array.isArray(node.props?.children) && node.props.children.includes('-20.00')));
  const shareButton = flatten(ReferralRewardsCard()).find(node => node.props?.testID === 'share-referral-number');
  await shareButton.props.onPress(); assert.ok(shared.includes('9876543210'));
  auth = { ...auth, isGuest: true };
  assert.equal(flatten(ReferralRewardsCard()).find(node => node.props?.testID === 'share-referral-number').props.disabled, true);
  console.log('Wallet/referral UI checks passed: shared balance, merchant redemption routing, full history, loading, empty, retry, debit and referral sharing.');
})().catch(error => { console.error(error); process.exitCode = 1; });
