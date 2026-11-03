const assert = require('node:assert/strict');
const http = require('node:http');
const connect = require('connect');
const config = require('../metro.config.js');

async function check() {
  let passedThrough = 0;
  // Metro invokes next for requests that belong to a later Expo handler.
  const metro = (req, res, next) => { passedThrough++; next(); };
  const app = connect();
  app.use(config.server.enhanceMiddleware(metro, {}));
  app.use((req, res) => { res.writeHead(200); res.end('Expo route reached'); });
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const route of ['/member-shop-details', '/status', '/assets/missing.png']) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200);
      assert.equal(await response.text(), 'Expo route reached');
    }
    assert.equal(passedThrough, 3);
    const unsupported = await fetch(base + '/api/share-image?url=https://example.com/x');
    assert.equal(unsupported.status, 400);
    assert.equal(passedThrough, 3, 'Image route is handled without falling through');
    const response = await fetch(base + '/member-card');
    assert.equal(response.status, 200, 'Server remains healthy after image route request');
    console.log('Metro/Connect next callback, Expo route fallthrough and image routing checks passed.');
  } finally { await new Promise(resolve => server.close(resolve)); }
}
check().catch(error => { console.error(error); process.exitCode = 1; });
