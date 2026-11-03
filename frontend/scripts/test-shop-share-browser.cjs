// Real Chromium canvas export regression. --live uses a public merchant photo.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const ts = require('typescript');
const { createShareImageMiddleware } = require('../share-image-middleware.cjs');
const root = path.join(__dirname, '..');
const live = process.argv.includes('--live');
const compile = file => ts.transpileModule(fs.readFileSync(path.join(root, 'utils', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  let imageUrl = 'https://intown-dev.s3.ap-south-1.amazonaws.com/test.png';
  if (live) {
    const response = await fetch(`https://devapi.intownlocal.com/IN/s3?merchantId=${process.env.TEST_MERCHANT_ID || '100106'}`);
    assert.equal(response.ok, true);
    const urls = [];
    const walk = value => {
      if (typeof value === 'string' && value.startsWith('https://')) urls.push(value);
      else if (value && typeof value === 'object') Object.values(value).forEach(walk);
    };
    walk(await response.json());
    assert.ok(urls.length, 'Merchant has a photo'); imageUrl = urls[0];
  }
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aDVkAAAAASUVORK5CYII=', 'base64');
  const upstream = process.argv.includes('--metro')
    ? url => fetch(`http://localhost:8081/api/share-image?url=${encodeURIComponent(url)}`)
    : live ? fetch : async () => new Response(pixel, { headers: { 'Content-Type': 'image/png' } });
  const middleware = createShareImageMiddleware(upstream);
  const html = `<html><body><script>
    var exports = {}; ${compile('specialOffer.ts')}
    var special = exports; exports = {}; var require = () => special;
    var process = {env: {}}; ${compile('shopShare.ts')}
    window.renderPost = exports.createShopShareImage;
  </script></body></html>`;
  const server = http.createServer((req, res) => middleware(req, res, () => { res.setHeader('Content-Type', 'text/html'); res.end(html); }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const profile = fs.mkdtempSync(path.join(root, '.expo', 'share-browser-'));
  const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child = spawn(chrome, ['--headless=new', '--no-first-run', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let socket;
  try {
    const activePort = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !fs.existsSync(activePort); i++) await delay(100);
    const port = fs.readFileSync(activePort, 'utf8').split('\n')[0];
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    let id = 0; const pending = new Map();
    socket.onmessage = event => { const message = JSON.parse(event.data); if (pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); } };
    const send = (method, params) => new Promise(resolve => { const key = ++id; pending.set(key, resolve); socket.send(JSON.stringify({ id: key, method, params })); });
    const downloads = path.join(profile, 'downloads');
    fs.mkdirSync(downloads);
    await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });
    await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` });
    for (let i = 0; i < 100; i++) {
      const result = await send('Runtime.evaluate', { expression: 'typeof window.renderPost' });
      if (result.result?.result?.value === 'function') break;
      await delay(100);
    }
    const result = await send('Runtime.evaluate', { awaitPromise: true, returnByValue: true, expression: `(async()=>{
      const blob=await renderPost(${JSON.stringify({ title: 'Merchant photo export', imageUrl, offers: ['Seasonal offer 30% off'], special: true, validTill: '28 Dec 2026' })});
      const bytes=new Uint8Array(await blob.arrayBuffer());
      const image=await createImageBitmap(blob);
      const file=new File([blob],'merchant-post.png',{type:'image/png'});
      const link=document.createElement('a');link.href=URL.createObjectURL(file);link.download=file.name;
      document.body.appendChild(link);link.click();link.remove();
      return {type:blob.type,bytes:bytes.length,signature:Array.from(bytes.slice(0,8)),width:image.width,height:image.height};
    })()` });
    assert.equal(result.result?.exceptionDetails, undefined, JSON.stringify(result.result?.exceptionDetails));
    const exported = result.result.result.value;
    assert.equal(exported.type, 'image/png'); assert.equal(exported.width, 1080);
    assert.deepEqual(exported.signature, [137,80,78,71,13,10,26,10]);
    assert.ok(exported.bytes > 1000);
    const downloaded = path.join(downloads, 'merchant-post.png');
    for (let i = 0; i < 100 && !fs.existsSync(downloaded); i++) await delay(100);
    assert.equal(fs.statSync(downloaded).size, exported.bytes, 'Browser downloads the complete merchant post');
    console.log('Chromium canvas export passed:', JSON.stringify(exported));
  } finally {
    socket?.close(); child.kill();
    await new Promise(resolve => server.close(resolve));
    // Chrome owns its isolated profile until shutdown; leave it in ignored .expo.
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
