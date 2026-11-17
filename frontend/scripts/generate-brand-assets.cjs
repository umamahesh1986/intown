// Repackage the supplied artwork without redrawing or changing its proportions.
const fs = require('node:fs');
const path = require('node:path');
const Jimp = require('jimp-compact');
const root = path.resolve(__dirname, '..');
const brand = path.join(root, 'assets/branding');
async function main() {
  const original = await Jimp.read(path.join(brand, 'intown-logo.jpeg'));
  const orange = original.getPixelColor(20, 20);
  const edge = Math.min(original.bitmap.width, original.bitmap.height);
  // Square launcher variant crops only the surrounding orange margin.
  const square = original.clone().crop(Math.floor((original.bitmap.width - edge) / 2), 0, edge, edge);
  const write = async (image, file) => { fs.mkdirSync(path.dirname(file), { recursive: true }); await image.writeAsync(file); };
  await write(original.clone(), path.join(brand, 'intown-logo.png'));
  await write(square.clone().resize(1024, 1024), path.join(brand, 'icon.png'));
  const adaptive = new Jimp(1024, 1024, 0x00000000);
  adaptive.composite(square.clone().resize(720, 720), 152, 152);
  await write(adaptive, path.join(brand, 'adaptive-icon.png'));
  await write(square.clone().resize(512, 512), path.join(brand, 'splash.png'));
  await write(square.clone().resize(64, 64), path.join(brand, 'favicon.png'));
  const publicDir = path.join(root, 'public/brand');
  await write(original.clone(), path.join(publicDir, 'intown-logo.png'));
  await write(square.clone().resize(512, 512), path.join(publicDir, 'icon.png'));
  await write(square.clone().resize(180, 180), path.join(publicDir, 'apple-touch-icon.png'));
  await write(square.clone().resize(64, 64), path.join(publicDir, 'favicon.png'));
  const preview = new Jimp(1200, 630, orange);
  const previewLogo = original.clone().scaleToFit(1200, 630);
  preview.composite(previewLogo, Math.floor((1200 - previewLogo.bitmap.width) / 2), Math.floor((630 - previewLogo.bitmap.height) / 2));
  await write(preview, path.join(publicDir, 'share-preview.png'));
  await write(preview, path.join(publicDir, 'share-preview-in-20261118.png'));
  const checkout = await square.clone().resize(256, 256).getBase64Async(Jimp.MIME_PNG);
  fs.writeFileSync(path.join(brand, 'checkout-logo.json'), JSON.stringify({ dataUri: checkout }) + '\n');
  // Replace legacy paths too, so older config references cannot show old art.
  for (const file of ['icon.jpeg', 'favicon.jpeg', 'adaptive-icon.png', 'splash-icon.png', 'splash-image.png', 'app-image.png']) {
    await write(square.clone().resize(file === 'favicon.jpeg' ? 64 : 1024, file === 'favicon.jpeg' ? 64 : 1024), path.join(root, 'assets/images', file));
  }
  const res = path.join(root, 'android/app/src/main/res');
  if (fs.existsSync(res)) {
    for (const [density, scale] of Object.entries({ mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 })) {
      const dir = path.join(res, `mipmap-${density}`);
      for (const name of ['ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground']) {
        const size = Math.round((name === 'ic_launcher_foreground' ? 108 : 48) * scale);
        await write((name === 'ic_launcher_foreground' ? adaptive : square).clone().resize(size, size), path.join(dir, `${name}.png`));
        const old = path.join(dir, `${name}.webp`);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      await write(square.clone().resize(Math.round(200 * scale), Math.round(200 * scale)), path.join(res, `drawable-${density}`, 'splashscreen_logo.png'));
    }
    const colors = path.join(res, 'values/colors.xml');
    fs.writeFileSync(colors, fs.readFileSync(colors, 'utf8').replace(/(<color name="(?:splashscreen_background|iconBackground)">)[^<]+/g, '$1#FF6F0B'));
  }
  console.log('Generated app, adaptive, splash, web, share-preview and checkout assets from the supplied logo.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
