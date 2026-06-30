const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo config plugin to add UPI payment app package queries to AndroidManifest.xml.
 * Required for Android 11+ (API 30+) package visibility.
 * Without these declarations, the app cannot target specific UPI apps
 * and Android shows a generic app chooser instead.
 */
function withUpiQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest['queries']) {
      manifest['queries'] = [];
    }

    // Add UPI scheme intent query
    const upiSchemes = ['upi', 'phonepe', 'tez', 'paytmmp', 'amazonpay', 'cred', 'iMobile', 'axisbank', 'idfcfirst'];
    const packages = [
      'com.phonepe.app',
      'com.google.android.apps.nbu.paisa.user',
      'net.one97.paytm',
      'in.amazon.mShop.android.shopping',
      'in.org.npci.upiapp',
      'com.dreamplug.androidapp',
      'com.csam.icici.bank.imobile',
      'com.upi.axispay',
      'com.idfcfirstbank.optimus',
    ];

    const queries = manifest['queries'];
    if (!Array.isArray(queries) || queries.length === 0) {
      manifest['queries'] = [{}];
    }

    const queryBlock = manifest['queries'][0] || {};

    // Add intent queries for UPI schemes
    if (!queryBlock['intent']) {
      queryBlock['intent'] = [];
    }

    for (const scheme of upiSchemes) {
      const exists = queryBlock['intent'].some(
        (intent) =>
          intent['data'] &&
          intent['data'].some((d) => d['$'] && d['$']['android:scheme'] === scheme)
      );
      if (!exists) {
        queryBlock['intent'].push({
          action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
          data: [{ $: { 'android:scheme': scheme } }],
        });
      }
    }

    // Add package queries
    if (!queryBlock['package']) {
      queryBlock['package'] = [];
    }

    for (const pkg of packages) {
      const exists = queryBlock['package'].some(
        (p) => p['$'] && p['$']['android:name'] === pkg
      );
      if (!exists) {
        queryBlock['package'].push({ $: { 'android:name': pkg } });
      }
    }

    manifest['queries'][0] = queryBlock;

    return config;
  });
}

module.exports = withUpiQueries;
