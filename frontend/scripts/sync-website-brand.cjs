// Review by running without --apply. Only logo assets and metadata are changed.
const fs = require('node:fs');
const path = require('node:path');
const mobile = path.resolve(__dirname, '..');
const website = path.resolve('D:/INtownWebsite/IntownWebsite/frontend');
const apply = process.argv.includes('--apply');
const edits = [];
const copy = (source, target) => edits.push({ target: path.join(website, target), bytes: fs.readFileSync(path.join(mobile, source)) });
for (const name of fs.readdirSync(path.join(mobile, 'public/brand'))) copy(`public/brand/${name}`, `public/brand/${name}`);
copy('assets/branding/intown-logo.jpeg', 'public/images/intown-logo.jpg');
copy('assets/branding/intown-logo.jpeg', 'src/assets/images/intown-logo.jpeg');
copy('assets/images/icon.jpeg', 'public/images/in.jpg');
const htmlPath = path.join(website, 'public/index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/%PUBLIC_URL%\/images\/in\.jpg/g, '%PUBLIC_URL%/brand/favicon.png');
html = html.replace(/(<link rel="apple-touch-icon" href=")[^"]+/, '$1%PUBLIC_URL%/brand/apple-touch-icon.png');
if (!html.includes('property="og:image"')) html = html.replace('    <title>', `    <meta property="og:title" content="INtown - Shop Local, Save Instantly" />
    <meta property="og:description" content="Your trusted local shopping and rewards platform." />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://intownlocal.com/brand/share-preview.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="https://intownlocal.com/brand/share-preview.png" />
    <title>`);
html = html.replace('IntownApp - A premium financial platform for the creditworthy', 'INtown - Your trusted local shopping and rewards platform');
html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>INtown - Shop Local, Save Instantly</title>');
html = html.replaceAll('https://intownlocal.com/brand/share-preview.png', 'https://intownlocal.com/brand/share-preview-in-20261118.png');
edits.push({ target: htmlPath, bytes: Buffer.from(html) });
const manifestPath = path.join(website, 'public/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.short_name = 'INtown';
manifest.name = 'INtown - Shop Local, Save Instantly';
manifest.icons = [{ src: 'brand/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' }];
edits.push({ target: manifestPath, bytes: Buffer.from(JSON.stringify(manifest, null, 2) + '\n') });
const headerPath = path.join(website, 'src/components/Header.js');
const header = fs.readFileSync(headerPath, 'utf8').replaceAll('src="/images/intown-logo.jpg"', 'src="/brand/intown-logo.png"');
edits.push({ target: headerPath, bytes: Buffer.from(header) });
const modalPath = path.join(website, 'src/components/Modal.js');
const modal = fs.readFileSync(modalPath, 'utf8').replace("image: 'https://intown-prod.s3.ap-south-1.amazonaws.com/logo/intown-logo.png'", "image: new URL('/brand/icon.png', window.location.origin).href");
edits.push({ target: modalPath, bytes: Buffer.from(modal) });
for (const edit of edits) {
  if (!edit.target.startsWith(website + path.sep)) throw new Error('Invalid website target');
  console.log(`${apply ? 'Update' : 'Prepared'} ${path.relative(website, edit.target)}`);
  if (apply) { fs.mkdirSync(path.dirname(edit.target), { recursive: true }); fs.writeFileSync(edit.target, edit.bytes); }
}
