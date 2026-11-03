const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components/SavingsCalculator.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const element = (type, props, ...children) => ({ type, props: children.length ? { ...props, children } : props });
for (const platform of ['web', 'android']) {
  let spend = 10000; let responder;
  const scope = { exports: {}, require: name => {
    if (name === 'react/jsx-runtime') return { jsx: element, jsxs: element };
    if (name === 'react') return {
      createElement: element, useState: () => [spend, value => { spend = typeof value === 'function' ? value(spend) : value; }],
      useMemo: callback => callback(), useRef: value => ({ current: value === null ? { measureInWindow: callback => callback(20, 0, 300) } : value }),
    };
    if (name === '@expo/vector-icons') return { Ionicons: 'Icon' };
    return { View: 'View', Text: 'Text', TextInput: 'Input', Platform: { OS: platform }, StyleSheet: { create: value => value }, PanResponder: { create: value => { responder = value; return { panHandlers: {} }; } } };
  } };
  vm.runInNewContext(source, scope);
  const { SavingsCalculator, calculateEstimatedSavings } = scope.exports;
  assert.equal(calculateEstimatedSavings(10000).monthly, 1500);
  assert.equal(calculateEstimatedSavings(10000).annual, 18000);
  assert.equal(calculateEstimatedSavings(-20).spend, 0);
  assert.equal(calculateEstimatedSavings(Infinity).spend, 0);
  assert.equal(calculateEstimatedSavings(90000).spend, 50000);
  const find = (node, predicate) => {
    if (!node || typeof node !== 'object') return null;
    if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean);
    return predicate(node) ? node : find(node.props?.children, predicate);
  };
  const tree = SavingsCalculator();
  if (platform === 'web') {
    const slider = find(tree, node => node.props?.type === 'range');
    slider.props.onChange({ target: { value: '25000' } });
    assert.equal(spend, 25000);
    const updated = SavingsCalculator();
    assert.ok(find(updated, node => node.props?.type === 'range').props.style.background.includes('50%'));
  } else {
    responder.onPanResponderGrant({ nativeEvent: { pageX: 170 } });
    assert.equal(spend, 25000, 'Touch location maps to 50% of measured track');
    responder.onPanResponderMove({}, { moveX: 600 });
    assert.equal(spend, 50000);
    responder.onPanResponderMove({}, { moveX: -20 });
    assert.equal(spend, 0);
  }
  find(SavingsCalculator(), node => node.type === 'Input').props.onChangeText('12,000');
  assert.equal(spend, 12000);
  assert.equal(calculateEstimatedSavings(spend).annual, 21600);
}
console.log('Savings calculator web slider, progress fill, native drag, input sync, boundaries and 15% savings passed.');
