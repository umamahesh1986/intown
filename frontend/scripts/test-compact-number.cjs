const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const scope = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('utils/compactNumber.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText, scope);
for (const [value, expected] of [[0,'0'],[80,'80'],[999,'999'],[1000,'1K'],[2000,'2K'],[1500,'1.5K'],[100000,'1L'],[200000,'2L'],[125000,'1.3L'],[99999,'1L'],[10000000,'1Cr'],[-2000,'-2K']]) assert.equal(scope.exports.compactNumber(value), expected);
console.log('Compact savings labels passed: small values, thousands, lakhs, crores, rounding and negatives.');
