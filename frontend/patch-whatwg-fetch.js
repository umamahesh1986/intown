#!/usr/bin/env node

/**
 * Post-install script to patch DOMException references for React Native compatibility.
 * Multiple fetch polyfills try to access the global DOMException without checking if it exists,
 * causing ReferenceError on iOS with Hermes/JSC engines.
 */

const fs = require('fs');
const path = require('path');

const patches = [
  {
    path: 'node_modules/whatwg-fetch/fetch.js',
    original: `export var DOMException = g.DOMException
try {
  new DOMException()
} catch (err) {`,
    patched: `// Safely check for global DOMException with fallback
export var DOMException = (typeof g !== 'undefined' && typeof g.DOMException !== 'undefined') ? g.DOMException : null
try {
  if (DOMException) {
    new DOMException()
  }
} catch (err) {`
  },
  {
    path: 'node_modules/cross-fetch/dist/browser-polyfill.js',
    original: `  exports.DOMException = g.DOMException;
  try {
    new exports.DOMException();`,
    patched: `  // Safely check for global DOMException with fallback
  if (typeof g !== 'undefined' && typeof g.DOMException !== 'undefined') {
    exports.DOMException = g.DOMException;
  }
  try {
    if (exports.DOMException) {
      new exports.DOMException();`
  },
  {
    path: 'node_modules/cross-fetch/dist/browser-ponyfill.js',
    original: `this.DOMException = __global__.DOMException`,
    patched: `this.DOMException = (typeof __global__ !== 'undefined' && __global__.DOMException) || null`
  }
];

patches.forEach(({path: filePath, original, patched}) => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠ File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  if (content.includes(original)) {
    content = content.replace(original, patched);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Patched ${filePath}`);
  } else {
    console.log(`✓ ${filePath} already patched or no changes needed`);
  }
});


