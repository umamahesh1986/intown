const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../utils/savingsTotals.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
const { getSavingsPeriodTotals } = context.exports;
const transactions = [
  { status: 'SAVED', transactionDate: '2026-11-03T12:00:00+05:30', inTownSavings: '70' },
  { status: 'SAVED', transactionDate: '2026-11-02T12:00:00+05:30', totalPrice: 500, payablePrice: 450 },
  { status: 'SAVED', transactionDate: '2026-10-15T12:00:00+05:30', intownSavings: 20 },
  { status: 'PENDING', transactionDate: '2026-11-03', inTownSavings: 900 },
  { status: 'FAILED', transactionDate: '2026-11-03', inTownSavings: 900 },
  { status: 'SAVED', transactionDate: 'invalid', inTownSavings: 100 },
];
const totals = getSavingsPeriodTotals(transactions, new Date('2026-11-03T13:00:00+05:30'));
assert.equal(totals.today, 70);
assert.equal(totals.thisMonth, 120);
assert.equal(totals.thisYear, 140);
assert.equal(getSavingsPeriodTotals([], new Date()).today, 0);
console.log('Savings periods, recorded amounts, bill-minus-paid fallback and pending/failed exclusions passed.');
