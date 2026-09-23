import { AttendeeBadgeData, EventItem } from '../types';

const imageCache: { [url: string]: HTMLImageElement } = {};
const getCachedImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (imageCache[url]) return resolve(imageCache[url]);
    const img = new Image();
    if (url.startsWith('http')) img.crossOrigin = 'anonymous';
    img.onload = () => { imageCache[url] = img; resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
};

export const renderBadgeToCanvas = async (
  canvas: HTMLCanvasElement, badge: AttendeeBadgeData, event: EventItem, avatarImg: HTMLImageElement | null
) => {
  await document.fonts.ready;
  const WIDTH = 1080; const HEIGHT = 1350; 

  let frameImg: HTMLImageElement | null = null;
  if (badge.customFrameUrl) {
    try { frameImg = await getCachedImage(badge.customFrameUrl); } 
    catch (err) { console.error("Failed to load custom frame", err); }
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = WIDTH; canvas.height = HEIGHT;

  // LAYER 1: BASE BACKGROUND (Gradient fallback)
  const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  grad.addColorStop(0, event.theme?.primaryColor || '#0ea5e9');
  grad.addColorStop(1, event.theme?.secondaryColor || '#10b981');
  ctx.fillStyle = grad; 
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // LAYER 2: ATTENDEE PHOTO (FULL BLEED BEHIND FRAME)
  if (avatarImg) {
    // The photo captured by the camera is exactly 1080x1350.
    // We draw it directly to fill the entire canvas without any circle/square clipping.
    ctx.drawImage(avatarImg, 0, 0, WIDTH, HEIGHT);
  }

  // LAYER 3: CUSTOM FRAME CUTOUT (On Top of Photo)
  if (frameImg) {
    const scale = Math.max(WIDTH / frameImg.width, HEIGHT / frameImg.height);
    const scaledWidth = frameImg.width * scale; const scaledHeight = frameImg.height * scale;
    ctx.drawImage(frameImg, (WIDTH - scaledWidth) / 2, (HEIGHT - scaledHeight) / 2, scaledWidth, scaledHeight);
  }

  // LAYER 4: TEXT & DYNAMIC QR CODE
  const textConfig = event.templateConfig?.textPositioning || {};
  const fontFamily = event.theme?.fontFamily || 'Plus Jakarta Sans';
  const align = textConfig.alignment || 'center';
  const nameSize = textConfig.nameFontSize || 80; const nameY = textConfig.nameY || 1130;
  const subSize = textConfig.subTextFontSize || 36; const subY = textConfig.subTextY || 1210;

  ctx.textAlign = align as CanvasTextAlign;
  let textX = WIDTH / 2;
  if (align === 'left') textX = 90;
  if (align === 'right') textX = WIDTH - 90;

  ctx.font = `bold ${nameSize}px "${fontFamily}", sans-serif`;
  if (textConfig.nameUseGradient) {
    const textGrad = ctx.createLinearGradient(0, nameY - nameSize, WIDTH, nameY);
    textGrad.addColorStop(0, event.theme?.primaryColor || '#0ea5e9'); textGrad.addColorStop(1, event.theme?.secondaryColor || '#10b981');
    ctx.fillStyle = textGrad;
  } else ctx.fillStyle = textConfig.nameColor || '#ffffff';
  ctx.fillText(badge.name || 'Your Name', textX, nameY);

  ctx.font = `600 ${subSize}px "${fontFamily}", sans-serif`;
  ctx.fillStyle = textConfig.subTextColor || '#e2e8f0';
  const roleText = badge.role ? badge.role.charAt(0).toUpperCase() + badge.role.slice(1) : '';
  const subText = [roleText, badge.title, badge.company].filter(Boolean).join(' • ');
  ctx.fillText(subText || 'Event Attendee', textX, subY);

  if (textConfig.showVenue !== false || textConfig.showDate !== false) {
    ctx.textAlign = 'center'; ctx.font = `600 28px "${fontFamily}", sans-serif`; ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const elementsText = [];
    if (textConfig.showDate !== false && event.dates) elementsText.push(`📅 ${event.dates}`);
    if (textConfig.showVenue !== false && (event.venue || event.location)) elementsText.push(`📍 ${event.venue || event.location}`);
    ctx.fillText(elementsText.join('   •   '), WIDTH / 2, HEIGHT - 60);
  }

  if (textConfig.showQrCode !== false) {
    const qrSize = 110; const padding = 50; const qrX = WIDTH - qrSize - padding; const qrY = padding;
    ctx.fillStyle = 'white'; ctx.beginPath(); ctx.roundRect(qrX, qrY, qrSize, qrSize, 12); ctx.fill(); ctx.fillStyle = '#0f172a';
    const drawFinder = (x: number, y: number) => { ctx.fillRect(x, y, 26, 26); ctx.fillStyle = 'white'; ctx.fillRect(x+4, y+4, 18, 18); ctx.fillStyle = '#0f172a'; ctx.fillRect(x+8, y+8, 10, 10); };
    drawFinder(qrX+10, qrY+10); drawFinder(qrX+74, qrY+10); drawFinder(qrX+10, qrY+74);
    ctx.fillRect(qrX+46, qrY+10, 18, 18); ctx.fillRect(qrX+10, qrY+46, 18, 18); ctx.fillRect(qrX+64, qrY+64, 36, 36);
    ctx.fillStyle = 'white'; ctx.fillRect(qrX+68, qrY+68, 28, 28); ctx.fillStyle = '#0f172a'; ctx.fillRect(qrX+74, qrY+74, 16, 16);
  }
};

export const exportCanvasToPng = (c: HTMLCanvasElement, f: string) => { const l = document.createElement('a'); l.download = f; l.href = c.toDataURL('image/png', 1.0); l.click(); };