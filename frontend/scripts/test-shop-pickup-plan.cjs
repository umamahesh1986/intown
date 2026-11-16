const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const plans = { exports: {}, require: () => ({}) };
vm.runInNewContext(ts.transpileModule(read('utils/merchantPlans.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, plans);
const source = ts.createSourceFile('shop.tsx', read('app/member-shop-details.tsx'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const expressions = {};
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.initializer) expressions[node.name.getText(source)] = node.initializer.getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
for (const plan of ['START', 'LAUNCH', 'launch', null, undefined, 'UNKNOWN']) {
  for (const category of ['Groceries', 'Pharmacy', 'Restaurants', ' restaurants ', 'unsupported', undefined]) {
    const context = {
      shop: { merchantSubscriptionPlan: plan, businessCategory: category },
      getMerchantPlanById: plans.exports.getMerchantPlanById,
      SUPPORTED_ORDER_CATEGORIES: vm.runInNewContext(expressions.SUPPORTED_ORDER_CATEGORIES),
    };
    const code = `const isOrderCategorySupported = ${expressions.isOrderCategorySupported}; const allowed = ${expressions.canPickAtStore};`;
    const js = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
    const actual = vm.runInNewContext(`${js}\nallowed`, context);
    assert.equal(actual, ['LAUNCH', 'launch'].includes(plan) && ['Groceries', 'Pharmacy', 'Restaurants', ' restaurants '].includes(category));
  }
}
console.log('Pickup visibility passed: LAUNCH only, supported categories only, missing/unknown plans hidden.');
