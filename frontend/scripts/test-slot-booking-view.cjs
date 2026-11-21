const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React } }).outputText;
const apiScope = { exports: {}, require: () => ({}) };
vm.runInNewContext(compile(fs.readFileSync('utils/slotBookings.ts', 'utf8')), apiScope);
const api = apiScope.exports;
let cursor = 0; const state = [];
const react = { createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity) }), useState: initial => { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], value => { state[index] = value; }]; } };
react.default = react;
const rn = new Proxy({ StyleSheet: { create: value => value }, Platform: { OS: 'web' } }, { get: (target, key) => target[key] || key });
const scope = { exports: {}, require: name => name === 'react' ? react : name === 'react-native' ? rn : name.includes('vector-icons') ? { Ionicons: 'Icon' } : api };
vm.runInNewContext(compile(fs.readFileSync('components/SlotBookingView.tsx', 'utf8')), scope);
const date = api.bookingDates().at(-1), events = [];
const makeSlot = (startTime, status = 'AVAILABLE') => ({ startTime, endTime: `${Number(startTime.slice(0, 2)) + 1}:00`, status, availableCapacity: 1, totalCapacity: 1 });
const morning = makeSlot('09:00'), evening = makeSlot('18:00'), pause = makeSlot('12:00', 'BREAK');
const props = { date, data: { businessName: 'Test merchant', businessCategory: 'Restaurants', slots: [morning, evening, pause], slotCapacity: 1 }, slot: null, signedIn: true, onSlot: value => events.push(value), onDate: value => events.push(value), onContinue: () => events.push('continue') };
let tree;
function render() { cursor = 0; tree = scope.exports.default(props); }
function nodes(node = tree) { if (!node || typeof node !== 'object') return []; return [node, ...node.children.filter(child => child && typeof child === 'object').flatMap(child => nodes(child))]; }
function text(node) { return typeof node === 'string' ? node : !node || typeof node !== 'object' ? '' : node.children.map(text).join(''); }
function button(label) { return nodes().find(n => n.type === 'TouchableOpacity' && text(n) === label); }
function slotButtons() { return nodes().filter(n => n.props.accessibilityLabel?.includes(' to ')); }
render();
assert.equal(slotButtons().length, 3);
assert.equal(button('Select a slot to continue').props.disabled, true);
assert.equal(slotButtons().find(n => n.props.accessibilityLabel.includes('Kitchen Break')).props.disabled, true);
slotButtons()[0].props.onPress(); assert.equal(events.at(-1), morning);
props.slot = morning; render(); button('Book Selected Slot (09:00)').props.onPress(); assert.equal(events.at(-1), 'continue');
button('Morning').props.onPress(); render(); assert.equal(slotButtons().length, 1);
button('Evening').props.onPress(); render(); assert.equal(slotButtons().length, 2);
button('Custom Date').props.onPress(); render();
nodes().find(n => n.type === 'TextInput').props.onChangeText('2026-02-31'); render(); button('Show available slots').props.onPress(); render(); assert.ok(text(tree).includes('Enter today or a future date as YYYY-MM-DD.'));
const future = api.bookingDates().at(-1);
nodes().find(n => n.type === 'TextInput').props.onChangeText(future); render(); button('Show available slots').props.onPress(); assert.equal(events.at(-1), future);
props.data = { ...props.data, isWeekOff: true }; render(); assert.equal(slotButtons().length, 0); assert.ok(text(tree).includes('This shop is closed'));
console.log('Slot booking UI passed: selection, continue button, morning/evening filters, unavailable breaks, custom date validation and week-off handling.');
