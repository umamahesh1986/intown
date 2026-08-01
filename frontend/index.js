// CRITICAL: DOMException polyfill MUST run before ANYTHING else
// This must execute synchronously and before any module loading
console.log('[BOOTSTRAP] Starting DOMException polyfill injection...');

// Import the init module first
import './app/init.ts';

// Polyfill DOMException IMMEDIATELY before anything else runs
if (typeof globalThis !== 'undefined' && typeof globalThis.DOMException === 'undefined') {
  console.log('[BOOTSTRAP] DOMException not found, creating polyfill...');
  class PolyfilledDOMException extends Error {
    constructor(message = '', name = 'Error') {
      super(message);
      this.name = name;
      this.code = 0;
    }
  }
  
  try {
    Object.defineProperty(globalThis, 'DOMException', {
      value: PolyfilledDOMException,
      writable: true,
      configurable: true,
    });
    console.log('[BOOTSTRAP] DOMException polyfill installed via Object.defineProperty');
  } catch (e) {
    globalThis.DOMException = PolyfilledDOMException;
    console.log('[BOOTSTRAP] DOMException polyfill installed via direct assignment');
  }
} else {
  console.log('[BOOTSTRAP] DOMException already available');
}

// Now safe to load the rest of the app
console.log('[BOOTSTRAP] Loading expo-router...');
import 'expo-router/entry';
