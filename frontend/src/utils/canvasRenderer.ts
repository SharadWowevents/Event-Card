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

  if (frameImg) {
    const scale = Math.max(WIDTH / frameImg.width, HEIGHT / frameImg.height);
    const scaledWidth = frameImg.width * scale; const scaledHeight = frameImg.height * scale;
    ctx.drawImage(frameImg, (WIDTH - scaledWidth) / 2, (HEIGHT - scaledHeight) / 2, scaledWidth, scaledHeight);
  } else {
    const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    grad.addColorStop(0, event.theme?.primaryColor || '#0ea5e9');
    grad.addColorStop(1, event.theme?.secondaryColor || '#10b981');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // ==========================================
  // DYNAMIC SELFIE MASK ENGINE
  // ==========================================
  if (avatarImg) {
    ctx.save();
    
    // Get config or fallback to default centered circle
    const selfieConfig = event.templateConfig?.selfiePositioning || { 
      shape: 'circle', x: 540, y: 595, size: 560, borderRadius: 0 
    };
    
    const centerX = selfieConfig.x;
    const centerY = selfieConfig.y;
    const size = selfieConfig.size;
    const halfSize = size / 2;

    // Create the physical clip mask based on shape
    ctx.beginPath();
    if (selfieConfig.shape === 'square') {
      if (ctx.roundRect) {
        ctx.roundRect(centerX - halfSize, centerY - halfSize, size, size, selfieConfig.borderRadius);
      } else {
        ctx.rect(centerX - halfSize, centerY - halfSize, size, size); // Fallback for very old browsers
      }
    } else {
      ctx.arc(centerX, centerY, halfSize, 0, Math.PI * 2);
    }
    ctx.closePath();
    ctx.clip();

    // Scale & Pan Logic
    const scale = badge.scale || 1;
    const panX = badge.panX || 0;
    const panY = badge.panY || 0;
    const baseImgSize = size * scale;
    const drawX = centerX - (baseImgSize / 2) + panX;
    const drawY = centerY - (baseImgSize / 2) + panY;

    const imgAspect = avatarImg.width / avatarImg.height;
    let finalWidth = baseImgSize; let finalHeight = baseImgSize;
    if (imgAspect > 1) finalWidth = baseImgSize * imgAspect;
    else finalHeight = baseImgSize / imgAspect;

    ctx.drawImage(avatarImg, drawX - (finalWidth - baseImgSize)/2, drawY - (finalHeight - baseImgSize)/2, finalWidth, finalHeight);
    ctx.restore();

    // Draw the white glassmorphism border ring over the mask
    ctx.beginPath();
    if (selfieConfig.shape === 'square') {
      if (ctx.roundRect) ctx.roundRect(centerX - halfSize, centerY - halfSize, size, size, selfieConfig.borderRadius);
      else ctx.rect(centerX - halfSize, centerY - halfSize, size, size);
    } else {
      ctx.arc(centerX, centerY, halfSize, 0, Math.PI * 2);
    }
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();
  }

  // Text Engine
  const textConfig = event.templateConfig?.textPositioning || {};
  const fontFamily = event.theme?.fontFamily || 'Plus Jakarta Sans';
  const align = textConfig.alignment || 'center';
  const nameSize = textConfig.nameFontSize || 80;
  const nameY = textConfig.nameY || 1130;
  const subSize = textConfig.subTextFontSize || 36;
  const subY = textConfig.subTextY || 1210;

  ctx.textAlign = align as CanvasTextAlign;
  let textX = WIDTH / 2;
  if (align === 'left') textX = 90;
  if (align === 'right') textX = WIDTH - 90;

  ctx.font = `bold ${nameSize}px "${fontFamily}", sans-serif`;
  if (textConfig.nameUseGradient) {
    const textGrad = ctx.createLinearGradient(0, nameY - nameSize, WIDTH, nameY);
    textGrad.addColorStop(0, event.theme?.primaryColor || '#0ea5e9');
    textGrad.addColorStop(1, event.theme?.secondaryColor || '#10b981');
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