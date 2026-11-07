const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const plans = [{ id: 'START', name: 'START', basePrice: 499, features: [] }, { id: 'LAUNCH', name: 'LAUNCH', basePrice: 999, features: [] }];
const helpers = {
  MERCHANT_PLANS: plans,
  merchantPlanRank: id => id === 'LAUNCH' ? 2 : id === 'START' ? 1 : 0,
  merchantPlanTotal: plan => Math.round(plan.basePrice * 1.18),
  merchantPlanGst: plan => Math.round(plan.basePrice * 0.18),
};
const jsx = (type, props) => ({ type, props });
function load(file, activePlan) {
  let index = 0;
  const state = ['100102', {}, activePlan, null, false, ''];
  const context = { exports: {}, require: name => {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react') return { useState: () => [state[index++], () => {}], useEffect() {}, useCallback: callback => callback };
    if (name === 'react-native') return { View: 'View', Text: 'Text', TouchableOpacity: 'Button', StyleSheet: { create: value => value } };
    if (name === 'expo-router') return { useFocusEffect() {} };
    if (name.endsWith('merchantPlans')) return helpers;
    if (name.endsWith('MerchantPlanCard')) return { MerchantPlanCard: 'PlanCard' };
    return {};
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, context);
  return context.exports;
}
function flatten(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(flatten);
  return [node, ...flatten(node.props?.children)];
}
for (const [active, expected] of [[null, ['START', 'LAUNCH']], ['START', ['START', 'LAUNCH']], ['LAUNCH', ['LAUNCH']]]) {
  const { MerchantPlansSection } = load('MerchantPlansSection.tsx', active);
  const tree = flatten(MerchantPlansSection({ showHero: false }));
  assert.deepEqual(tree.filter(node => node.type === 'PlanCard').map(node => node.props.plan.id), expected);
  if (active === null) assert.ok(tree.filter(node => node.type === 'PlanCard').every(node => node.props.status === 'select'), 'Merchants without a recorded pack can select either plan');
}
const { MerchantPlanCard } = load('MerchantPlanCard.tsx');
for (const status of ['active', 'included', 'upgrade', 'select']) {
  const tree = flatten(MerchantPlanCard({ plan: plans[1], status }));
  assert.equal(tree.some(node => node.props?.testID === 'merchant-plan-cta-LAUNCH'), ['upgrade', 'select'].includes(status));
}
console.log('Merchant plan visibility and CTA checks passed: no pack selection, START upgrade and LAUNCH-only views.');
