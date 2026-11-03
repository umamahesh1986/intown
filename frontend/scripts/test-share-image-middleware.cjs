const assert = require('node:assert/strict');
const http = require('node:http');
const { createShareImageMiddleware } = require('../share-image-middleware.cjs');

async function check() {
  let requests = 0;
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aDVkAAAAASUVORK5CYII=', 'base64');
  const middleware = createShareImageMiddleware(async (url, options) => {
    requests++;
    assert.equal(new URL(url).hostname, 'intown-dev.s3.ap-south-1.amazonaws.com');
    assert.equal(options.redirect, 'error');
    // Upstream deliberately has no Access-Control-Allow-Origin header.
    return new Response(png, { headers: { 'Content-Type': 'image/png' } });
  });
  const server = http.createServer((req, res) => middleware(req, res, () => { res.writeHead(404); res.end(); }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/share-image?url=`;
  try {
    const result = await fetch(base + encodeURIComponent('https://intown-dev.s3.ap-south-1.amazonaws.com/photo.png'));
    assert.equal(result.status, 200);
    assert.equal(result.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await result.arrayBuffer()), png);
    for (const url of ['http://127.0.0.1/private', 'https://example.com/x', 'https://intown-dev.s3.ap-south-1.amazonaws.com.evil.test/x', 'https://user:secret@intown-dev.s3.ap-south-1.amazonaws.com/x']) {
      assert.equal((await fetch(base + encodeURIComponent(url))).status, 400);
    }
    assert.equal(requests, 1, 'Unsupported sources never reach the upstream network');
    console.log('Same-origin image bytes and destination restrictions passed.');
  } finally { await new Promise(resolve => server.close(resolve)); }
}
check().catch(error => { console.error(error); process.exitCode = 1; });
