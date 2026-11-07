const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const text = fs.readFileSync(path.join(__dirname, '../app/merchant-orders.tsx'), 'utf8');
const source = ts.createSourceFile('merchant-orders.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const expressions = {};
const walk = node => {
  if (ts.isVariableDeclaration(node) && ['filteredOrders', 'countFor'].includes(node.name.getText(source))) expressions[node.name.getText(source)] = node.initializer.getText(source);
  ts.forEachChild(node, walk);
};
walk(source);
const orders = ['PLACED', 'ACCEPTED', 'PICKUP_READY', 'COMPLETED', 'ENDED'].map((status, index) => ({ pickup_id: `order_${index}`, status }));
for (const tab of ['ALL', 'PLACED', 'COMPLETED']) {
  const scope = { orders, activeTab: tab };
  assert.equal(vm.runInNewContext(expressions.filteredOrders, scope).length, tab === 'ALL' ? 5 : 1);
  const count = vm.runInNewContext(ts.transpileModule(`const count = ${expressions.countFor}; count`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText, scope);
  assert.equal(count(tab), tab === 'ALL' ? 5 : 1);
}
let expanded = false;
const jsx = (type, props) => ({ type, props });
const scope = { exports: {}, require: name => {
  if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
  if (name === 'react') return { useState: () => [expanded, next => { expanded = typeof next === 'function' ? next(expanded) : next; }] };
  if (name === 'react-native') return { View: 'View', Text: 'Text', TouchableOpacity: 'Button', StyleSheet: { create: value => value } };
  return {};
} };
vm.runInNewContext(ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText + '\nexports.TestCard = MerchantOrderCard;', scope);
const order = { pickup_id: 'order_42', customerId: 9, merchantId: 2, customerName: 'Customer Name', status: 'COMPLETED', items: [{ productName: 'Rice', quantity: '2 kg' }], createdAt: '2026-11-07T10:00:00Z', completedAt: '2026-11-07T11:00:00Z' };
function flatten(node) {
  if (Array.isArray(node)) return node.flatMap(flatten);
  if (!node || typeof node !== 'object') return [node];
  return [node, ...flatten(node.props?.children)];
}
const render = () => flatten(scope.exports.TestCard({ order }));
const toggle = render().find(node => node?.props?.testID === 'merchant-order-details-order_42');
assert.equal(toggle.props.accessibilityState.expanded, false);
toggle.props.onPress();
const nodes = render();
assert.equal(nodes.find(node => node?.props?.testID === 'merchant-order-details-order_42').props.accessibilityState.expanded, true);
const content = nodes.filter(node => typeof node === 'string').join(' ').replace(/\s+:/g, ':');
for (const value of ['Order ID:', 'order_42', 'Customer Name', 'Rice', '2 kg', 'Completed:', 'Placed:']) assert.ok(content.includes(value), `Missing detail: ${value}`);
console.log('Merchant history all/status filters, counts and expandable order details passed.');
