const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components/MerchantPaymentApprovals.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

async function check(fails) {
  const payment = { transactionId: 42, customerId: 10, merchantId: 20, status: 'PENDING_APPROVAL', pointsEarned: 25, payablePrice: 225, totalPrice: 250 };
  const states = [[payment], false, '', '', null, 0]; let index = 0; let calls = 0; let refreshed = 0;
  let finish;
  const result = new Promise((resolve, reject) => { finish = () => fails ? reject(new Error('Approval denied')) : resolve({ ...payment, status: 'COMPLETED', pointsEarned: 25 }); });
  const jsx = (type, props) => ({ type, props });
  const scope = {
    exports: {}, require: name => {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react') return {
        useCallback: callback => callback, useEffect() {}, useRef: value => ({ current: value }),
        useState: () => { const key = index++; return [states[key], value => { states[key] = typeof value === 'function' ? value(states[key]) : value; }]; },
      };
      if (name === 'react-native') return { StyleSheet: { create: value => value }, View: 'View', Text: 'Text', TouchableOpacity: 'Button', ActivityIndicator: 'Spinner' };
      if (name === '@react-navigation/native') return { useFocusEffect() {} };
      if (name === '@expo/vector-icons') return { Ionicons: 'Icon' };
      return { approvePayment: async id => { assert.equal(id, 42); calls++; return result; } };
    },
  };
  vm.runInNewContext(source, scope);
  const tree = scope.exports.MerchantPaymentApprovals({ merchantId: 20, onApproved: () => { refreshed++; } });
  let button;
  const visit = node => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (node.props?.testID === 'approve-payment-42') button = node;
    visit(node.props?.children);
  };
  visit(tree); assert.ok(button);
  const first = button.props.onPress(); const second = button.props.onPress();
  assert.equal(calls, 1, 'Repeated taps must not send duplicate approvals');
  finish(); await Promise.all([first, second]);
  assert.equal(states[0].length, fails ? 1 : 0, 'Only successful approval removes the payment');
  assert.equal(refreshed, fails ? 0 : 1);
  assert.equal(states[4], null, 'Approval button unlocks after the request');
  assert.ok(fails ? states[2].includes('Approval denied') : states[3].includes('25 INcoins credited'));
}
check(false).then(() => check(true)).then(() => console.log('Approval card success, failure retention, dashboard refresh and duplicate-tap protection passed.')).catch(error => { console.error(error); process.exitCode = 1; });
