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
      const scaledWidth = frameImg.width * scale;
      const scaledHeight = frameImg.height * scale;
      
      const x = (WIDTH - scaledWidth) / 2;
      const y = (HEIGHT - scaledHeight) / 2;
      
      ctx.drawImage(frameImg, x, y, scaledWidth, scaledHeight);
    } catch (err) {
      console.error("Failed to load custom frame", err);
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

  // 2. Draw Selfie with Pan and Zoom Math
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
    let finalWidth = baseImgSize;
    let finalHeight = baseImgSize;
    
    if (imgAspect > 1) {
      finalWidth = baseImgSize * imgAspect;
    } else {
      finalHeight = baseImgSize / imgAspect;
    }

    ctx.drawImage(avatarImg, drawX - (finalWidth - baseImgSize)/2, drawY - (finalHeight - baseImgSize)/2, finalWidth, finalHeight);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();
  }

  // 3. Draw Attendee Details
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 80px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(badge.name || 'Your Name', WIDTH / 2, HEIGHT - 220);

  ctx.font = '600 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  
  const roleText = badge.role ? badge.role.charAt(0).toUpperCase() + badge.role.slice(1) : '';
  const subText = [roleText, badge.title, badge.company].filter(Boolean).join(' • ');
  ctx.fillText(subText || 'Event Attendee', WIDTH / 2, HEIGHT - 140);

  // 4. RESTORED: Admin Configured Elements (Dates, Venue, QR)
  const showVenue = event.templateConfig?.textPositioning?.showVenue ?? true;
  const showDate = event.templateConfig?.textPositioning?.showDate ?? true;
  const showQrCode = event.templateConfig?.textPositioning?.showQrCode ?? true;

  // Draw Venue & Date at the bottom
  if (showVenue || showDate) {
    ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    
    const elementsText = [];
    if (showDate && event.dates) elementsText.push(`📅 ${event.dates}`);
    if (showVenue && (event.venue || event.location)) elementsText.push(`📍 ${event.venue || event.location}`);
    
    ctx.fillText(elementsText.join('   •   '), WIDTH / 2, HEIGHT - 60);
  }

  // Draw QR Code in the top right corner
  if (showQrCode) {
    const qrSize = 110;
    const padding = 50;
    const qrX = WIDTH - qrSize - padding;
    const qrY = padding;
    
    // White background block for QR
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrSize, qrSize, 12);
    ctx.fill();
    
    ctx.fillStyle = '#0f172a';
    
    // Helper to draw QR finder squares
    const drawFinder = (x: number, y: number) => {
      ctx.fillRect(x, y, 26, 26);
      ctx.fillStyle = 'white';
      ctx.fillRect(x + 4, y + 4, 18, 18);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 8, y + 8, 10, 10);
    };
    
    const baseX = qrX + 10;
    const baseY = qrY + 10;
    
    // Draw the 3 finder squares
    drawFinder(baseX, baseY); 
    drawFinder(baseX + 64, baseY); 
    drawFinder(baseX, baseY + 64); 
    
    // Draw generic inner QR blocks
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