/**
 * CRITICAL: This file MUST be imported first in the app.
 * It polyfills DOMException before ANY other module loads.
 * This runs before expo-router and all dependencies.
 */

// Polyfill DOMException synchronously at module evaluation time
if (typeof globalThis !== 'undefined' && typeof globalThis.DOMException === 'undefined') {
  try {
    // Create polyfilled DOMException class
    class PolyfilledDOMException extends Error {
      name: string = 'Error';
      code: number = 0;

      constructor(message: string = '', name: string = 'Error') {
        super(message);
        this.name = name;
      }
    }

    // Assign to globalThis
    (globalThis as any).DOMException = PolyfilledDOMException;

    // Verify it's set
    if ((globalThis as any).DOMException) {
      console.log('[INIT] DOMException polyfill installed successfully');
    }
  } catch (err) {
    console.warn('[INIT] Failed to install DOMException polyfill:', err);
  }
}

export const initializationDone = true;

