import { AttendeeBadgeData, EventItem } from '../types';

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (url.startsWith('http')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

export const renderBadgeToCanvas = async (
  canvas: HTMLCanvasElement,
  badge: AttendeeBadgeData,
  event: EventItem,
  avatarImg: HTMLImageElement | null
) => {
  await document.fonts.ready;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const WIDTH = 1080;
  const HEIGHT = 1350; 
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  // 1. Draw Background Frame
  if (badge.customFrameUrl) {
    try {
      const frameImg = await loadImage(badge.customFrameUrl);
      const scale = Math.max(WIDTH / frameImg.width, HEIGHT / frameImg.height);
      const x = (WIDTH - (frameImg.width * scale)) / 2;
      const y = (HEIGHT - (frameImg.height * scale)) / 2;
      ctx.drawImage(frameImg, x, y, frameImg.width * scale, frameImg.height * scale);
    } catch (err) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  } else {
    const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    grad.addColorStop(0, event.theme?.primaryColor || '#0ea5e9');
    grad.addColorStop(1, event.theme?.secondaryColor || '#10b981');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // 2. Draw Selfie
  if (avatarImg) {
    ctx.save();
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2 - 80; 
    const radius = 280; 

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const scale = badge.scale || 1;
    const panX = badge.panX || 0;
    const panY = badge.panY || 0;
    const baseImgSize = radius * 2 * scale;
    const drawX = centerX - (baseImgSize / 2) + panX;
    const drawY = centerY - (baseImgSize / 2) + panY;

    const imgAspect = avatarImg.width / avatarImg.height;
    const finalWidth = imgAspect > 1 ? baseImgSize * imgAspect : baseImgSize;
    const finalHeight = imgAspect > 1 ? baseImgSize : baseImgSize / imgAspect;

    ctx.drawImage(avatarImg, drawX - (finalWidth - baseImgSize)/2, drawY - (finalHeight - baseImgSize)/2, finalWidth, finalHeight);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();
  }

  // ==========================================
  // 3. DYNAMIC TYPOGRAPHY ENGINE
  // ==========================================
  const textConfig = event.templateConfig?.textPositioning || {};
  const fontFamily = event.theme?.fontFamily || 'Plus Jakarta Sans';
  
  // Extract configurations with safe fallbacks
  const align = textConfig.alignment || 'center';
  const nameSize = textConfig.nameFontSize || 80;
  const nameY = textConfig.nameY || 1130;
  const subSize = textConfig.subTextFontSize || 36;
  const subY = textConfig.subTextY || 1210;

  // Calculate X based on Alignment
  ctx.textAlign = align as CanvasTextAlign;
  let textX = WIDTH / 2;
  if (align === 'left') textX = 90;
  if (align === 'right') textX = WIDTH - 90;

  // Draw Attendee Name
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

  // Draw Subtext (Role • Title • Company)
  ctx.font = `600 ${subSize}px "${fontFamily}", sans-serif`;
  ctx.fillStyle = textConfig.subTextColor || '#e2e8f0';
  
  const roleText = badge.role ? badge.role.charAt(0).toUpperCase() + badge.role.slice(1) : '';
  const subText = [roleText, badge.title, badge.company].filter(Boolean).join(' • ');
  ctx.fillText(subText || 'Event Attendee', textX, subY);

  // ==========================================
  // 4. BOTTOM ELEMENTS (Dates, Venue, QR)
  // ==========================================
  const showVenue = textConfig.showVenue ?? true;
  const showDate = textConfig.showDate ?? true;
  const showQrCode = textConfig.showQrCode ?? true;

  if (showVenue || showDate) {
    ctx.textAlign = 'center';
    ctx.font = `600 28px "${fontFamily}", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    
    const elementsText = [];
    if (showDate && event.dates) elementsText.push(`📅 ${event.dates}`);
    if (showVenue && (event.venue || event.location)) elementsText.push(`📍 ${event.venue || event.location}`);
    
    ctx.fillText(elementsText.join('   •   '), WIDTH / 2, HEIGHT - 60);
  }

  if (showQrCode) {
    const qrSize = 110;
    const padding = 50;
    const qrX = WIDTH - qrSize - padding;
    const qrY = padding;
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrSize, qrSize, 12);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    
    const drawFinder = (x: number, y: number) => {
      ctx.fillRect(x, y, 26, 26);
      ctx.fillStyle = 'white';
      ctx.fillRect(x + 4, y + 4, 18, 18);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 8, y + 8, 10, 10);
    };
    
    const baseX = qrX + 10;
    const baseY = qrY + 10;
    drawFinder(baseX, baseY); 
    drawFinder(baseX + 64, baseY); 
    drawFinder(baseX, baseY + 64); 
    
    ctx.fillRect(baseX + 36, baseY, 18, 18);
    ctx.fillRect(baseX, baseY + 36, 18, 18);
    ctx.fillRect(baseX + 54, baseY + 54, 36, 36);
    ctx.fillStyle = 'white';
    ctx.fillRect(baseX + 58, baseY + 58, 28, 28);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(baseX + 64, baseY + 64, 16, 16);
  }
};

export const exportCanvasToPng = (canvas: HTMLCanvasElement, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
};