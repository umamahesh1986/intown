// Same-origin image access for canvas export. Never proxy arbitrary destinations.
const IMAGE_HOSTS = new Set([
  'intown-dev.s3.ap-south-1.amazonaws.com',
  ...String(process.env.SHARE_IMAGE_HOSTS || '').split(',').map(value => value.trim()).filter(Boolean),
]);
const LIMIT = 15 * 1024 * 1024;

function createShareImageMiddleware(fetchImage = fetch) {
  return async function shareImage(req, res, next) {
    const request = new URL(req.url, 'http://localhost');
    if (request.pathname !== '/api/share-image') return next();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }
    let source;
    try { source = new URL(request.searchParams.get('url')); } catch { /* rejected below */ }
    if (!source || source.protocol !== 'https:' || source.port || source.username || source.password || !IMAGE_HOSTS.has(source.hostname)) {
      res.writeHead(400); res.end('Unsupported merchant image source.'); return;
    }
    try {
      const upstream = await fetchImage(source.href, { redirect: 'error', signal: AbortSignal.timeout(15000) });
      const type = (upstream.headers.get('content-type') || '').split(';')[0];
      if (!upstream.ok || !/^image\/(png|jpeg|webp|gif|avif)$/.test(type) || !upstream.body) throw new Error('Invalid image');
      const reader = upstream.body.getReader();
      const chunks = []; let size = 0;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > LIMIT) throw new Error('Image too large');
          chunks.push(Buffer.from(value));
        }
      } finally { await reader.cancel(); }
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': size });
      res.end(Buffer.concat(chunks));
    } catch {
      res.writeHead(502); res.end('Merchant image could not be loaded. Please retry.');
    }
  };
}

module.exports = { createShareImageMiddleware };
