import { formatOfferValidTill, getActiveSpecialOffers, getSpecialOfferImageUrl, isSpecialOfferImageUrl } from './specialOffer';

export interface ShopShareContent {
  title: string;
  imageUrl: string | null;
  offers: string[];
  special: boolean;
  validTill: string;
  caption: string;
  filename: string;
}

export function buildShopShareContent(shop: any, fallbackImages: string[] = [], now = Date.now()): ShopShareContent {
  const title = String(shop?.businessName || shop?.shopName || shop?.name || 'INtown merchant').trim();
  const specialOffers = getActiveSpecialOffers(shop, now);
  const raw = shop?.offer;
  const regular = (Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split('\n') : []).map(value => String(value || '').trim()).filter(Boolean);
  const offers = specialOffers.length ? specialOffers : regular;
  const imageSources = [...(Array.isArray(shop?.images) ? shop.images : []), ...(Array.isArray(shop?.s3ImageUrl) ? shop.s3ImageUrl : typeof shop?.s3ImageUrl === 'string' ? [shop.s3ImageUrl] : []), ...fallbackImages, shop?.profileImage, shop?.profileImageUrl, shop?.imageUrl, shop?.image];
  const images = imageSources
    .map(image => typeof image === 'string' ? { url: image, primary: false } : { url: image?.s3ImageUrl || image?.url, primary: !!image?.isPrimary })
    .filter(image => typeof image.url === 'string' && image.url && !isSpecialOfferImageUrl(image.url));
  const specialImage = specialOffers.length ? getSpecialOfferImageUrl({ s3ImageUrl: imageSources }) : null;
  const profileImage = [shop?.profileImage, shop?.profileImageUrl].find(url => typeof url === 'string' && url && !isSpecialOfferImageUrl(url));
  const imageUrl = specialImage || profileImage || images.find(image => image.primary)?.url || images[0]?.url || null;
  const validTill = specialOffers.length ? formatOfferValidTill(shop) : '';
  const lines = [title, '', ...(offers.length ? [specialOffers.length ? 'Special offer' : 'Offers', ...offers.map(offer => `• ${offer}`)] : ['Discover this local merchant on INtown.'])];
  if (validTill) lines.push('', `Valid till ${validTill}`);
  if (shop?.address) lines.push('', String(shop.address));
  if (shop?.id != null) lines.push('', `View in INtown: intown://member-shop-details?shopId=${encodeURIComponent(String(shop.id))}`);
  return { title, imageUrl, offers, special: specialOffers.length > 0, validTill, caption: lines.join('\n'), filename: `intown-${String(shop?.id ?? 'merchant').replace(/[^a-zA-Z0-9_-]/g, '')}-post.png` };
}

// Browser post export. Native uses the rendered preview and view-shot instead.
export async function createShopShareImage(content: ShopShareContent): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image export is unavailable in this browser.');
  const wrap = (text: string, maxWidth: number): string[] => {
    const lines: string[] = []; let line = '';
    for (const character of Array.from(text)) {
      if (character === '\n' || ctx.measureText(line + character).width > maxWidth) { lines.push(line); line = character === '\n' ? '' : character; }
      else line += character;
    }
    if (line) lines.push(line);
    return lines;
  };
  ctx.font = 'bold 66px sans-serif';
  const titleLines = wrap(content.title, 940);
  ctx.font = '42px sans-serif';
  const offerLines = content.offers.flatMap(offer => wrap(`• ${offer}`, 920));
  const height = Math.max(1080, 900 + titleLines.length * 82 + offerLines.length * 58 + (content.validTill ? 80 : 0));
  if (height > 12000) throw new Error('This post has too much text for one image. Copy the caption to share all details.');
  canvas.width = 1080; canvas.height = height;
  ctx.fillStyle = '#FFF8EF'; ctx.fillRect(0, 0, 1080, height);
  ctx.fillStyle = '#FF8A00'; ctx.fillRect(0, 0, 1080, 110);
  ctx.fillStyle = '#FFF'; ctx.font = 'bold 44px sans-serif'; ctx.fillText('INtown · Discover local', 64, 73);
  if (content.imageUrl) {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new globalThis.Image(); img.crossOrigin = 'anonymous';
      const timeout = setTimeout(() => reject(new Error('Merchant image took too long to load. Please retry.')), 15000);
      img.onload = () => { clearTimeout(timeout); resolve(img); };
      img.onerror = () => { clearTimeout(timeout); reject(new Error('The merchant image could not be exported. Try sharing from the mobile app, or copy the caption.')); };
      img.src = content.imageUrl!;
    });
    const scale = Math.max(1080 / image.naturalWidth, 460 / image.naturalHeight);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 110, 1080, 460); ctx.clip();
    ctx.drawImage(image, (1080 - image.naturalWidth * scale) / 2, 110 + (460 - image.naturalHeight * scale) / 2, image.naturalWidth * scale, image.naturalHeight * scale);
    ctx.restore();
  } else {
    ctx.fillStyle = '#FFE5C4'; ctx.fillRect(0, 110, 1080, 460);
    ctx.fillStyle = '#E87500'; ctx.font = 'bold 84px sans-serif'; ctx.fillText('INtown', 64, 380);
  }
  let y = 665; ctx.fillStyle = '#1C2433'; ctx.font = 'bold 66px sans-serif';
  for (const line of titleLines) { ctx.fillText(line, 64, y); y += 82; }
  y += 22; ctx.fillStyle = '#E87500'; ctx.font = 'bold 32px sans-serif';
  ctx.fillText(content.offers.length ? content.special ? 'SPECIAL OFFER' : 'OFFERS' : 'SHOP LOCAL WITH INTOWN', 64, y); y += 65;
  ctx.fillStyle = '#273244'; ctx.font = '42px sans-serif';
  for (const line of offerLines) { ctx.fillText(line, 64, y); y += 58; }
  if (content.validTill) { y += 30; ctx.font = 'bold 32px sans-serif'; ctx.fillText(`Valid till ${content.validTill}`, 64, y); }
  ctx.fillStyle = '#667085'; ctx.font = '30px sans-serif'; ctx.fillText('Find this merchant on the INtown app', 64, height - 38);
  return new Promise((resolve, reject) => {
    try { canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not create the post image.')), 'image/png'); }
    catch { reject(new Error('This merchant image does not allow browser export. Please share from the mobile app.')); }
  });
}
