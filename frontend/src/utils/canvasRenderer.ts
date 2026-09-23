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

  // 1. LOAD CUSTOM FRAME FIRST TO GET EXACT DIMENSIONS
  let frameImg: HTMLImageElement | null = null;
  if (badge.customFrameUrl) {
    try { 
      frameImg = await getCachedImage(badge.customFrameUrl); 
    } catch (err) { 
      console.error("Failed to load custom frame", err); 
    }
  }

  const WIDTH = frameImg ? frameImg.naturalWidth || frameImg.width : 1080;
  const HEIGHT = frameImg ? frameImg.naturalHeight || frameImg.height : 1350;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = WIDTH; 
  canvas.height = HEIGHT;

  // LAYER 1: BASE BACKGROUND (Gradient fallback)
  const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  grad.addColorStop(0, event.theme?.primaryColor || '#0ea5e9');
  grad.addColorStop(1, event.theme?.secondaryColor || '#10b981');
  ctx.fillStyle = grad; 
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // LAYER 2: ATTENDEE PHOTO (Crops proportionally like object-cover to prevent stretching)
  if (avatarImg) {
    const imgAspect = avatarImg.width / avatarImg.height;
    const canvasAspect = WIDTH / HEIGHT;
    
    let drawWidth = WIDTH;
    let drawHeight = HEIGHT;
    let offsetX = 0;
    let offsetY = 0;

    if (imgAspect > canvasAspect) {
      drawWidth = HEIGHT * imgAspect;
      offsetX = (WIDTH - drawWidth) / 2;
    } else {
      drawHeight = WIDTH / imgAspect;
      offsetY = (HEIGHT - drawHeight) / 2;
    }

    ctx.drawImage(avatarImg, offsetX, offsetY, drawWidth, drawHeight);
  }

  // LAYER 3: CUSTOM FRAME CUTOUT (Overlays on top)
  if (frameImg) {
    ctx.drawImage(frameImg, 0, 0, WIDTH, HEIGHT);
  }

  // LAYER 4: TEXT & DYNAMIC QR CODE
  const textConfig = event.templateConfig?.textPositioning || {};
  const fontFamily = event.theme?.fontFamily || 'Plus Jakarta Sans';
  const align = textConfig.alignment || 'center';
  
  const scaleRatio = WIDTH / 1080;
  
  const nameSize = (textConfig.nameFontSize || 80) * scaleRatio; 
  const nameY = (textConfig.nameY || 1130) * (HEIGHT / 1350);
  const subSize = (textConfig.subTextFontSize || 36) * scaleRatio; 
  const subY = (textConfig.subTextY || 1210) * (HEIGHT / 1350);

  ctx.textAlign = align as CanvasTextAlign;
  let textX = WIDTH / 2;
  if (align === 'left') textX = 90 * scaleRatio;
  if (align === 'right') textX = WIDTH - (90 * scaleRatio);

  ctx.font = `bold ${nameSize}px "${fontFamily}", sans-serif`;
  if (textConfig.nameUseGradient) {
    const textGrad = ctx.createLinearGradient(0, nameY - nameSize, WIDTH, nameY);
    textGrad.addColorStop(0, event.theme?.primaryColor || '#0ea5e9'); 
    textGrad.addColorStop(1, event.theme?.secondaryColor || '#10b981');
    ctx.fillStyle = textGrad;
  } else {
    ctx.fillStyle = textConfig.nameColor || '#ffffff';
  }
  ctx.fillText(badge.name || 'Your Name', textX, nameY);

  ctx.font = `600 ${subSize}px "${fontFamily}", sans-serif`;
  ctx.fillStyle = textConfig.subTextColor || '#e2e8f0';
  const roleText = badge.role ? badge.role.charAt(0).toUpperCase() + badge.role.slice(1) : '';
  const subText = [roleText, badge.title, badge.company].filter(Boolean).join(' • ');
  ctx.fillText(subText || 'Event Attendee', textX, subY);

  if (textConfig.showVenue !== false || textConfig.showDate !== false) {
    ctx.textAlign = 'center'; 
    ctx.font = `600 ${28 * scaleRatio}px "${fontFamily}", sans-serif`; 
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    
    const elementsText = [];
    if (textConfig.showDate !== false && event.dates) elementsText.push(`📅 ${event.dates}`);
    if (textConfig.showVenue !== false && (event.venue || event.location)) elementsText.push(`📍 ${event.venue || event.location}`);
    ctx.fillText(elementsText.join('   •   '), WIDTH / 2, HEIGHT - (60 * scaleRatio));
  }

  if (textConfig.showQrCode !== false) {
    const qrSize = 110 * scaleRatio; 
    const padding = 50 * scaleRatio; 
    const qrX = WIDTH - qrSize - padding; 
    const qrY = padding;
    
    ctx.fillStyle = 'white'; 
    ctx.beginPath(); 
    ctx.roundRect(qrX, qrY, qrSize, qrSize, 12 * scaleRatio); 
    ctx.fill(); 
    ctx.fillStyle = '#0f172a';
    
    const drawFinder = (x: number, y: number) => { 
      ctx.fillRect(x, y, 26 * scaleRatio, 26 * scaleRatio); 
      ctx.fillStyle = 'white'; 
      ctx.fillRect(x + (4 * scaleRatio), y + (4 * scaleRatio), 18 * scaleRatio, 18 * scaleRatio); 
      ctx.fillStyle = '#0f172a'; 
      ctx.fillRect(x + (8 * scaleRatio), y + (8 * scaleRatio), 10 * scaleRatio, 10 * scaleRatio); 
    };
    
    drawFinder(qrX + (10 * scaleRatio), qrY + (10 * scaleRatio)); 
    drawFinder(qrX + (74 * scaleRatio), qrY + (10 * scaleRatio)); 
    drawFinder(qrX + (10 * scaleRatio), qrY + (74 * scaleRatio));
    
    ctx.fillRect(qrX + (46 * scaleRatio), qrY + (10 * scaleRatio), 18 * scaleRatio, 18 * scaleRatio); 
    ctx.fillRect(qrX + (10 * scaleRatio), qrY + (46 * scaleRatio), 18 * scaleRatio, 18 * scaleRatio); 
    ctx.fillRect(qrX + (64 * scaleRatio), qrY + (64 * scaleRatio), 36 * scaleRatio, 36 * scaleRatio);
    ctx.fillStyle = 'white'; 
    ctx.fillRect(qrX + (68 * scaleRatio), qrY + (68 * scaleRatio), 28 * scaleRatio, 28 * scaleRatio); 
    ctx.fillStyle = '#0f172a'; 
    ctx.fillRect(qrX + (74 * scaleRatio), qrY + (74 * scaleRatio), 16 * scaleRatio, 16 * scaleRatio);
  }
};

export const exportCanvasToPng = (c: HTMLCanvasElement, f: string) => { 
  const l = document.createElement('a'); 
  l.download = f; 
  l.href = c.toDataURL('image/png', 1.0); 
  l.click(); 
};