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

module.exports = config;
