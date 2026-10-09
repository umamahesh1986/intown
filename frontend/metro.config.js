// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require('path');
const { FileStore } = require('metro-cache');

const config = getDefaultConfig(__dirname);

// Use a stable on-disk store (shared across web/android)
const root = process.env.METRO_CACHE_ROOT || path.join(__dirname, '.metro-cache');
config.cacheStores = [
  new FileStore({ root: path.join(root, 'cache') }),
];

// Ensure fonts are properly resolved
config.resolver.assetExts.push('ttf', 'otf');

// Reduce the number of workers to decrease resource usage
config.maxWorkers = 2;

// Block react-native-maps on web platform
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      type: 'empty',
    };
  }
  // Let Metro handle other modules normally
  return context.resolveRequest(context, moduleName, platform);
};

// Override the serializer to inject DOMException polyfill into bundle
const originalCreateModuleIdFactory = config.serializer.createModuleIdFactory;

// Prepend DOMException polyfill to the beginning of the bundle
const domExceptionPolyfill = `
if (typeof globalThis !== 'undefined' && typeof globalThis.DOMException === 'undefined') {
  try {
    class PolyfilledDOMException extends Error {
      constructor(message = '', name = 'Error') {
        super(message);
        this.name = name;
        this.code = 0;
      }
    }
    Object.defineProperty(globalThis, 'DOMException', {
      value: PolyfilledDOMException,
      writable: true,
      configurable: true,
    });
  } catch (e) {
    // Ignore errors during polyfill injection
  }
}
`;

// Store original serializeModules
const originalSerializeModules = config.serializer.serializeModules;

config.serializer.serializeModules = function(modules, options) {
  // Call original serializer
  const result = originalSerializeModules.call(config.serializer, modules, options);
  
  // If we got a string result, prepend the polyfill
  if (typeof result === 'string') {
    return domExceptionPolyfill + '\n' + result;
  }
  
  return result;
};

module.exports = config;
